import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, LoginCredentials, RegisterData } from '../types/user';
import { authService } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<{ message?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  error: null,
  login: async () => {},
  register: async () => ({}),
  logout: async () => {},
  isAuthenticated: false
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check if user is already logged in when loading initially
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setLoading(true);
        console.log("🔍 Checking authentication status...");
        const userData = await authService.getCurrentUser();
        if (userData) {
          console.log("✅ User authenticated:", userData.email);
          setUser(userData);
        } else {
          console.log("❌ No user authenticated");
        }
      } catch (err) {
        console.error('Error checking authentication status:', err);
        // No need to display an error here, user is simply not logged in
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    setError(null);
    try {
      const userData = await authService.login(credentials);
      
      // Don't update user if email is not verified
      if (userData.is_verified === false) {
        setError("Your account hasn't been verified yet. Please check your email and click on the verification link.");
        return;
      }
      
      setUser(userData);
    } catch (err) {
      console.error('Error during login:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred during login');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.register(data);
      setUser(response);
      
      // Return email verification message
      return { 
        message: "Your account has been created successfully! Please check your email to activate your account."
      };
    } catch (err) {
      console.error('Error during registration:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred during registration');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } catch (err) {
      console.error('Error during logout:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred during logout');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 