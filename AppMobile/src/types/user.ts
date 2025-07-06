export type UserRole = 'user' | 'admin' | 'super-admin';

export interface User {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  role: UserRole;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstname: string;
  lastname: string;
}

export interface AuthResponse {
  user: User;
  token: string;
} 