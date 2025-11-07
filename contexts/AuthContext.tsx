import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import * as api from '../services/apiService';
import { User as FirebaseUser } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = api.onAuthStateChanged(async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
            const userProfile = await api.getUserProfile(firebaseUser.uid);
            setUser(userProfile);
        } else {
            setUser(null);
        }
        setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    await api.login(email, password);
  };

  const signup = async (name: string, email: string, password: string) => {
    const userCredential = await api.signup(email, password);
    await api.createUserProfile(userCredential.user, name);
    // The onAuthStateChanged listener will handle setting the user state.
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };
  
  const updateUser = async (updatedUser: User) => {
    const cleanUser = await api.updateUserProfile(updatedUser);
    setUser(cleanUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
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