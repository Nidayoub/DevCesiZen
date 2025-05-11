import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginCredentials, RegisterData, User } from '../types/user'; // Assuming path is correct
import api from './api.service'; // Import the global axios instance

// API_URL is handled by the imported api instance

class AuthService {
  private static instance: AuthService;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const response = await api.post('/api/auth/login', credentials);
      const { user, token } = response.data; // Assuming backend sends user and token

      if (token) {
        await AsyncStorage.setItem('token', token);
      } else {
        console.warn('No token received during login');
      }
      
      // Backend should handle email verification check before sending token or user data
      // If user.is_verified === false and a token is still sent, AuthContext might need to handle it.
      if (!user) {
        throw new Error('User data not received after login');
      }
      return user as User;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Échec de la connexion';
      if (error.response?.status === 403) { // Email not verified
        throw new Error(errorMessage || 'Veuillez vérifier votre email avant de vous connecter');
      }
      throw new Error(errorMessage);
    }
  }

  async register(userData: RegisterData): Promise<{ user: User; message?: string }> {
    try {
      const response = await api.post('/api/auth/register', userData);
      // Assuming backend sends back user info and a token upon successful registration
      // and a message regarding email verification.
      const { user, token, message } = response.data;

      if (token) {
        await AsyncStorage.setItem('token', token);
      } else {
        // It's possible registration only sends a verification message and no token until verified.
        // Adjust based on backend behavior.
        console.warn('No token received during registration, user may need to verify email first.');
      }
      if (!user) {
        // Depending on backend: registration might not return full user object or token immediately
        // It might just return a success message for email verification.
        // Adjust AuthContext logic if user object isn't available right after registration.
        console.warn('User data not received after registration')
      }
      return { user: user as User, message };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Échec de l\'inscription';
      throw new Error(errorMessage);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      // The token is automatically added by the api.service.ts interceptor
      const response = await api.get('/api/auth/me');
      return response.data as User;
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      await AsyncStorage.removeItem('token'); // Clear token if /me fails
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      // Inform the backend about logout, if an endpoint exists
      // await api.post('/api/auth/logout'); // Uncomment if backend has this
    } catch (error) {
      console.error('Error during backend logout:', error);
      // Still proceed with local logout
    } finally {
      await AsyncStorage.removeItem('token');
    }
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const response = await api.post('/api/auth/forgot-password', { email });
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Échec de la demande de récupération';
      throw new Error(errorMessage);
    }
  }

  async resetPassword(
    id: string,
    timestamp: string,
    expiry: string,
    token: string,
    password: string
  ): Promise<{ message: string }> {
    try {
      const response = await api.post('/api/auth/reset-password', {
        id,
        timestamp,
        expiry,
        token,
        password,
      });
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Échec de la réinitialisation du mot de passe';
      throw new Error(errorMessage);
    }
  }
}

export const authService = AuthService.getInstance(); 