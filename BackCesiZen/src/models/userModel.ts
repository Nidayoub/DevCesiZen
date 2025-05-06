import { BaseModel } from "./baseModel";

/**
 * Interface pour les utilisateurs
 */
export interface User {
  id: number;
  email: string;
  username: string;
  password: string; // Mot de passe haché
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface pour la création d'un utilisateur
 */
export interface UserCreate {
  email: string;
  username: string;
  password: string; // Mot de passe en clair
  isAdmin?: boolean;
}

/**
 * Modèle pour la gestion des utilisateurs
 */
export class UserModel extends BaseModel<User> {
  constructor() {
    super("users");
  }

  /**
   * Récupère un utilisateur par son email
   * @param email Email de l'utilisateur
   * @returns L'utilisateur trouvé ou null
   */
  async getByEmail(email: string): Promise<User | null> {
    const user = this.data.find(user => user.email.toLowerCase() === email.toLowerCase());
    return user ? { ...user } : null;
  }

  /**
   * Récupère un utilisateur par son nom d'utilisateur
   * @param username Nom d'utilisateur
   * @returns L'utilisateur trouvé ou null
   */
  async getByUsername(username: string): Promise<User | null> {
    const user = this.data.find(user => user.username.toLowerCase() === username.toLowerCase());
    return user ? { ...user } : null;
  }

  /**
   * Crée un nouvel utilisateur avec mot de passe haché
   * @param userData Données de l'utilisateur
   * @returns L'utilisateur créé
   */
  async createUser(userData: UserCreate): Promise<User> {
    // Hasher le mot de passe avec Bun.password
    const hashedPassword = await Bun.password.hash(userData.password);
    
    // Préparer les données utilisateur
    const newUser = {
      email: userData.email,
      username: userData.username,
      password: hashedPassword,
      isAdmin: userData.isAdmin || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Créer l'utilisateur
    return this.create(newUser);
  }

  /**
   * Vérifie les identifiants d'un utilisateur
   * @param email Email de l'utilisateur
   * @param password Mot de passe en clair
   * @returns L'utilisateur si authentifié, null sinon
   */
  async verifyCredentials(email: string, password: string): Promise<User | null> {
    // Rechercher l'utilisateur par email
    const user = await this.getByEmail(email);
    
    if (!user) {
      return null;
    }
    
    // Vérifier le mot de passe avec Bun.password
    const isPasswordValid = await Bun.password.verify(password, user.password);
    
    return isPasswordValid ? user : null;
  }

  /**
   * Met à jour le mot de passe d'un utilisateur
   * @param userId ID de l'utilisateur
   * @param newPassword Nouveau mot de passe en clair
   * @returns L'utilisateur mis à jour ou null
   */
  async updatePassword(userId: number, newPassword: string): Promise<User | null> {
    // Hasher le nouveau mot de passe avec Bun.password
    const hashedPassword = await Bun.password.hash(newPassword);
    
    // Mettre à jour l'utilisateur
    return this.update(userId, {
      password: hashedPassword,
      updatedAt: new Date().toISOString()
    });
  }
} 