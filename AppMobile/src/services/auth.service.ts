import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginCredentials, RegisterData, User } from '../types/user';
import { Platform } from 'react-native';

const API_URL = Platform.select({
  android: 'http://10.0.2.2:3000',
  ios: 'https://api-cesizen.ayoub-nidai.fr',
  default: 'http://localhost:3000'
});

class AuthService {
  private static instance: AuthService;
  private authenticated: boolean = false;
  private currentUser: User | null = null;

  private constructor() {
    this.authenticated = false;
    this.currentUser = null;
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'ngrok-skip-browser-warning': 'true',
    };
  }

  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/login`,
        credentials,
        { headers: this.getHeaders() }
      );
      
      const data = response.data;
      this.authenticated = true;
      this.currentUser = data.user;
      
      if (data.token) {
        await AsyncStorage.setItem('authToken', data.token);
      }
      
      return data.user;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error(error.response.data.error || 'Please verify your email before logging in');
      }
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  }

  async register(userData: RegisterData): Promise<User> {
    try {
      console.log('Attempting registration with URL:', `${API_URL}/api/auth/register`);
      console.log('Registration data:', JSON.stringify(userData, null, 2));
      console.log('Headers:', JSON.stringify(this.getHeaders(), null, 2));
      
      const response = await axios.post(
        `${API_URL}/api/auth/register`,
        userData,
        { headers: this.getHeaders() }
      );
      
      console.log('Registration response status:', response.status);
      console.log('Registration response data:', JSON.stringify(response.data, null, 2));
      
      const data = response.data;
      this.authenticated = true;
      this.currentUser = data.user;
      
      if (data.token) {
        await AsyncStorage.setItem('authToken', data.token);
      }
      
      return data.user;
    } catch (error: any) {
      console.error('Registration error details:');
      console.error('Error status:', error.response?.status);
      console.error('Error data:', JSON.stringify(error.response?.data, null, 2));
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Registration failed';
      throw new Error(errorMessage);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        this.authenticated = false;
        this.currentUser = null;
        return null;
      }
      
      const response = await axios.get(
        `${API_URL}/api/auth/me`,
        { 
          headers: {
            ...this.getHeaders(),
            'Authorization': `Bearer ${token}`
          } 
        }
      );
      
      const user = response.data;
      this.authenticated = true;
      this.currentUser = user;
      return user;
    } catch (error) {
      console.error('Error retrieving current user:', error);
      this.authenticated = false;
      this.currentUser = null;
      await AsyncStorage.removeItem('authToken');
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (token) {
        await axios.post(
          `${API_URL}/api/auth/logout`,
          {},
          { 
            headers: {
              ...this.getHeaders(),
              'Authorization': `Bearer ${token}`
            } 
          }
        );
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      this.authenticated = false;
      this.currentUser = null;
      await AsyncStorage.removeItem('authToken');
    }
  }

  isAuthenticated(): boolean {
    return this.authenticated;
  }

  getCachedUser(): User | null {
    return this.currentUser;
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/forgot-password`,
        { email },
        { headers: this.getHeaders() }
      );
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Password recovery request failed');
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
      const response = await axios.post(
        `${API_URL}/api/auth/reset-password`,
        { id, timestamp, expiry, token, password },
        { headers: this.getHeaders() }
      );
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Password reset failed');
    }
  }
}

export const authService = AuthService.getInstance(); 