'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  error: null,
  login: async () => {},
  register: async () => ({}),
  logout: async () => {},
  isAuthenticated: false,
  isInitialized: false
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Vérifier si l'utilisateur est déjà connecté lors du chargement initial
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setLoading(true);
        console.log("🔍 Vérification du statut d'authentification...");
        const userData = await authService.getCurrentUser();
        if (userData) {
          console.log("✅ Utilisateur authentifié:", userData.email);
          setUser(userData);
        } else {
          console.log("❌ Aucun utilisateur authentifié");
        }
      } catch (err) {
        console.error('Erreur lors de la vérification du statut d\'authentification:', err);
        // Pas besoin d'afficher une erreur ici, l'utilisateur n'est simplement pas connecté
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
      
      // Ne pas mettre à jour l'utilisateur si l'email n'est pas vérifié
      if (userData.is_verified === false) {
        setError("Votre compte n'a pas encore été vérifié. Veuillez vérifier votre boîte email et cliquer sur le lien de vérification.");
        return;
      }
      
      setUser(userData);
    } catch (err) {
      console.error('Erreur lors de la connexion:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Une erreur est survenue lors de la connexion');
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
      
      // Retourner le message de vérification d'email
      return { 
        message: "Votre compte a été créé avec succès ! Veuillez vérifier votre boîte email pour activer votre compte."
      };
    } catch (err) {
      console.error('Erreur lors de l\'inscription:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Une erreur est survenue lors de l\'inscription');
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
      console.error('Erreur lors de la déconnexion:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Une erreur est survenue lors de la déconnexion');
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
        isAuthenticated: !!user,
        isInitialized
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 