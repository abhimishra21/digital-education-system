import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginData, RegisterData, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize default admin user
  useEffect(() => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.length === 0) {
      const defaultAdmin: User = {
        id: 'admin-001',
        email: 'admin@university.edu',
        name: 'Administrator',
        role: 'admin',
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('users', JSON.stringify([defaultAdmin]));
    }

    // Check if user is logged in
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      setUser(JSON.parse(currentUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      // Check for admin login
      if (email === 'admin@university.edu' && password === 'admin123') {
        const adminUser = users.find((u: User) => u.email === email);
        if (adminUser) {
          setUser(adminUser);
          localStorage.setItem('currentUser', JSON.stringify(adminUser));
          return true;
        }
      }

      // Check for regular user login (in a real app, you'd hash passwords)
      const user = users.find((u: User) => u.email === email);
      if (user && password === 'user123') { // Default password for demo
        setUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      // Check if email already exists
      if (users.some((u: User) => u.email === data.email)) {
        return false;
      }

      // Create new user
      const newUser: User = {
        id: `user-${Date.now()}`,
        email: data.email,
        name: data.name,
        role: 'user',
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    register,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 