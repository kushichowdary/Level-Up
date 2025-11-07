import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { mockLogin, mockSignup, mockUpdateUser } from '../services/mockApiService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password_hash: string) => Promise<void>;
  signup: (name: string, email: string, password_hash: string) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password_hash: string) => {
    const loggedInUser = await mockLogin(email, password_hash);
    if (loggedInUser) {
      setUser(loggedInUser);
      sessionStorage.setItem('user', JSON.stringify(loggedInUser));
    } else {
        throw new Error("Invalid credentials");
    }
  };

  const signup = async (name: string, email: string, password_hash: string) => {
    const newUser = await mockSignup(name, email, password_hash);
    setUser(newUser);
    sessionStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('user');
  };
  
  const updateUser = async (updatedUser: User) => {
    const savedUser = await mockUpdateUser(updatedUser);
    setUser(savedUser);
    sessionStorage.setItem('user', JSON.stringify(savedUser));
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