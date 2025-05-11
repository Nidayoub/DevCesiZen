import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, LoginCredentials, RegisterData } from '../types/user'; // Assuming path is correct
import { authService } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isInitialized: boolean; // To track if initial auth check is done
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<{ user?: User; message?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  isInitialized: false,
  error: null,
  login: async () => {},
  register: async () => ({}),
  logout: async () => {},
  isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false); // For specific actions like login/register
  const [isInitialized, setIsInitialized] = useState(false); // Tracks initial auth check
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthStatus = async () => {
      setLoading(true); // Use main loading for initial check
      try {
        const userData = await authService.getCurrentUser();
        if (userData) {
          setUser(userData);
        }
      } catch (err) {
        // Token might be invalid or expired, or network error
        console.error('Erreur lors de la vérification du statut d\'authentification:', err);
        setUser(null); // Ensure user is null if check fails
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
      
      // The web version had a specific check for `is_verified` here.
      // Assuming the mobile authService.login or backend now correctly handles this flow
      // (e.g., by not returning a user/token if not verified, or if it does, the UI handles it).
      // If userData.is_verified === false, you might want to set an error or specific state.
      if (userData.is_verified === false) {
        // This error should ideally come from authService if it's a login-blocking issue.
        setError("Votre compte n'a pas encore été vérifié. Veuillez vérifier votre boîte email.");
        // Potentially setUser(null) or don't set the user to prevent authenticated state.
        // For now, following the web logic pattern closely for this error.
        setUser(null); // Explicitly ensure user is not set if not verified
        return; 
      }
      setUser(userData);

    } catch (err) {
      console.error('Erreur lors de la connexion:', err);
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue lors de la connexion';
      setError(errorMessage);
      setUser(null); // Ensure user is null on login failure
      throw err; // Re-throw to allow UI to handle if needed
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<{ user?: User; message?: string }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.register(data);
      // If registration immediately logs in the user (i.e., returns a user object and token is stored by service):
      if (response.user) {
         // Check if the user is verified. The backend might send user data even if not verified yet.
        if (response.user.is_verified === false) {
            // Don't set user, show message from response.message
             setError(response.message || "Votre compte a été créé. Veuillez vérifier votre email pour l'activer.");
             setUser(null);
        } else {
            setUser(response.user);
        }
      } else {
        // If registration only sends a message (e.g. "check your email") and no user data yet:
        setError(response.message || "Inscription réussie. Veuillez vérifier votre email.");
        setUser(null);
      }
      return response; // Return the full response { user?, message? }
    } catch (err) {
      console.error('Erreur lors de l\'inscription:', err);
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue lors de l\'inscription';
      setError(errorMessage);
      setUser(null); // Ensure user is null on registration failure
      throw err; // Re-throw to allow UI to handle if needed
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await authService.logout();
      setUser(null);
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err);
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue lors de la déconnexion';
      setError(errorMessage);
      // Should still set user to null locally even if backend logout fails
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isInitialized,
        error,
        login,
        register,
        logout,
        isAuthenticated: !!user && isInitialized && user.is_verified !== false, // User is authenticated if user object exists, init is done, and user is verified
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 