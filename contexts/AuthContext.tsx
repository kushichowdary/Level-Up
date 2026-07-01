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
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const fallbackName = pendingNameRef.current || firebaseUser.email?.split('@')[0] || 'Player';
      let userProfile: User | null = null;

      try {
        userProfile = await api.getUserProfile(firebaseUser.uid);
      } catch (profileError) {
        console.warn('Unable to load user profile after auth:', profileError);
      }

      if (!userProfile) {
        const isNewUser = firebaseUser.metadata.creationTime === firebaseUser.metadata.lastSignInTime;

        if (!isNewUser) {
          console.warn(`User ${firebaseUser.uid} is authenticated but has no profile. Recreating profile.`);
        }

        try {
          userProfile = await api.createUserProfile(firebaseUser, fallbackName);
        } catch (createError) {
          console.error('Unable to create user profile after auth:', createError);
        }
      }

      if (userProfile) {
        setUser(userProfile);
      } else {
        setUser({
          id: firebaseUser.uid,
          name: fallbackName,
          email: firebaseUser.email || '',
          createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
      }

      pendingNameRef.current = null;
      setLoading(false);
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