import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import * as api from '../services/apiService';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const pendingNameRef = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = api.onAuthStateChanged(async (firebaseUser: FirebaseUser | null) => {
      try {
        if (firebaseUser) {
          let userProfile = await api.getUserProfile(firebaseUser.uid);
          
          if (!userProfile) {
            const isNewUser = firebaseUser.metadata.creationTime === firebaseUser.metadata.lastSignInTime;

            // Only warn if this is an existing user with a missing profile.
            // For a new user, this is the expected flow, not a warning condition.
            if (!isNewUser) {
              console.warn(`User ${firebaseUser.uid} is authenticated but has no profile. Recreating profile.`);
            }
            
            const name = pendingNameRef.current || firebaseUser.email?.split('@')[0] || 'Player';
            userProfile = await api.createUserProfile(firebaseUser, name);
            if (pendingNameRef.current) {
                pendingNameRef.current = null; // Clear the pending name after use
            }
          }
          setUser(userProfile);
        } else {
          setUser(null);
        }
      } catch (error) {
          console.error("Failed to handle auth state change:", error);
          // If any error occurs, ensure the user is logged out to prevent an inconsistent state
          setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []); // Empty dependency array ensures the listener is attached only once.

  const login = async (email: string, password: string) => {
    await api.login(email, password);
    // onAuthStateChanged will handle setting the user state
  };

  const signup = async (name: string, email: string, password: string) => {
    pendingNameRef.current = name; 
    try {
      await api.signup(email, password);
      // onAuthStateChanged will handle the rest
    } catch (error) {
      pendingNameRef.current = null; // Clear pending name on signup failure
      throw error; // re-throw error to be caught by the UI
    }
  };

  const logout = async () => {
    await api.logout();
    // onAuthStateChanged will clear the user state
  };
  
  const updateUser = async (updatedUser: User) => {
    if(!user) throw new Error("User not authenticated");
    const newProfile = await api.updateUserProfile(updatedUser);
    setUser(newProfile);
  };

  const deleteAccount = async () => {
    if (!user) throw new Error("User not authenticated");
    await api.deleteUserAccount(user.id);
    // onAuthStateChanged will clear the user state
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser, deleteAccount }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};