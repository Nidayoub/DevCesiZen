'use client';

import { LoginCredentials, RegisterData, User } from '../types/user';

// Make sure API_URL uses the correct backend URL (port 3000) with no /api at the end
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

class AuthService {
  private static instance: AuthService;
  private authenticated: boolean = false;
  private currentUser: User | null = null;

  private constructor() {
    // Au démarrage, nous ne savons pas si l'utilisateur est authentifié
    // Nous devrons vérifier avec /api/auth/me
    this.authenticated = false;
    this.currentUser = null;
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
    };
  }

  async login(credentials: LoginCredentials): Promise<User> {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(credentials),
      credentials: 'include', // Important pour inclure les cookies
    });

    if (!response.ok) {
      const errorData = await response.json();
      // Gestion spécifique pour l'erreur d'email non vérifié (code 403)
      if (response.status === 403) {
        throw new Error(errorData.error || 'Veuillez vérifier votre email avant de vous connecter');
      }
      throw new Error(errorData.error || 'Échec de la connexion');
    }

    const data = await response.json();
    this.authenticated = true;
    this.currentUser = data.user;
    return data.user;
  }

  async register(userData: RegisterData): Promise<User> {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(userData),
      credentials: 'include', // Important pour inclure les cookies
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Échec de l\'inscription');
    }

    const data = await response.json();
    this.authenticated = true;
    this.currentUser = data.user;
    return data.user;
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      console.log("🔍 Vérification de l'utilisateur actuel...");
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: this.getHeaders(),
        credentials: 'include', // Important pour inclure les cookies
      });

      if (!response.ok) {
        console.log(`❌ Requête échouée: ${response.status} ${response.statusText}`);
        this.authenticated = false;
        this.currentUser = null;
        return null;
      }

      const user = await response.json();
      console.log("✅ Utilisateur récupéré:", user.email);
      this.authenticated = true;
      this.currentUser = user;
      return user;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de l\'utilisateur actuel:', error);
      this.authenticated = false;
      this.currentUser = null;
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: this.getHeaders(),
        credentials: 'include', // Important pour inclure les cookies
      });
    } finally {
      // Même si la requête échoue, on considère l'utilisateur déconnecté localement
      this.authenticated = false;
      this.currentUser = null;
    }
  }

  isAuthenticated(): boolean {
    return this.authenticated;
  }

  getCachedUser(): User | null {
    return this.currentUser;
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Échec de la demande de récupération');
    }

    return await response.json();
  }

  async resetPassword(
    id: string,
    timestamp: string,
    expiry: string,
    token: string,
    password: string
  ): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ id, timestamp, expiry, token, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Échec de la réinitialisation du mot de passe');
    }

    return await response.json();
  }
}

export const authService = AuthService.getInstance(); 