import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { getCurrentUser, saveCurrentUser, clearCurrentUser, initializeDemoData } from '@/lib/storage';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Initialize demo data on first load
    initializeDemoData().catch((error) => {
      console.error('Error initializing demo data:', error);
      // Don't block the app if demo data fails to initialize
    });
    
    // Check for existing session
    try {
      const currentUser = getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    saveCurrentUser(userData);
  };

  const logout = () => {
    setUser(null);
    clearCurrentUser();
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    saveCurrentUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        updateUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}