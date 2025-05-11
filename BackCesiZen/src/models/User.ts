import { db } from '../data/database';
import bcrypt from 'bcryptjs';

export type UserRole = 'user' | 'admin' | 'super-admin';

export interface User {
  id?: number;
  email: string;
  password: string;
  firstname: string;
  lastname: string;
  role: UserRole;
  is_verified?: boolean;
  verification_token?: string;
  verification_expires?: string;
  reset_token?: string;
  reset_token_expires?: string;
  created_at?: string;
  updated_at?: string;
}

export class UserModel {
  static async create(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    console.log("🏗️ UserModel.create - Début de création d'utilisateur:", user.email);
    try {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      console.log("🔒 Mot de passe hashé pour:", user.email);
      
      console.log("📝 Exécution de la requête SQL INSERT");
      
      // Inclure les champs de vérification d'email dans la requête
      const result = await db.execute(
        `INSERT INTO users (
          email, password, firstname, lastname, role, 
          is_verified, verification_token, verification_expires
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING *`,
        [
          user.email, 
          hashedPassword, 
          user.firstname, 
          user.lastname, 
          user.role,
          user.is_verified || false,
          user.verification_token || '',
          user.verification_expires || ''
        ]
      );
      
      console.log("✅ Insertion réussie, lastInsertId:", result.lastInsertId);
      
      console.log("🔍 Récupération de l'utilisateur créé");
      const createdUser = await db.queryOne<User>(
        'SELECT * FROM users WHERE id = ?',
        [result.lastInsertId]
      );
      
      if (!createdUser) {
        console.error("❌ Utilisateur non trouvé après création");
        throw new Error('Erreur lors de la création de l\'utilisateur');
      }
      
      console.log("✅ Utilisateur créé avec succès:", createdUser.id);
      return createdUser;
    } catch (error) {
      console.error("❌ Erreur lors de la création de l'utilisateur:", error);
      if (error instanceof Error) {
        console.error("Message d'erreur:", error.message);
        console.error("Stack trace:", error.stack);
      }
      throw error;
    }
  }

  static async findByEmail(email: string): Promise<User | null> {
    console.log("🔍 UserModel.findByEmail - Recherche par email:", email);
    try {
      const user = await db.queryOne<User>(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      console.log("🔍 Résultat de recherche par email:", email, "trouvé:", !!user);
      return user;
    } catch (error) {
      console.error("❌ Erreur lors de la recherche par email:", error);
      if (error instanceof Error) {
        console.error("Message d'erreur:", error.message);
      }
      throw error;
    }
  }

  static async findById(id: number): Promise<User | null> {
    console.log("🔍 UserModel.findById - Recherche par ID:", id);
    try {
      const user = await db.queryOne<User>(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );
      console.log("🔍 Résultat de recherche par ID:", id, "trouvé:", !!user);
      return user;
    } catch (error) {
      console.error("❌ Erreur lors de la recherche par ID:", error);
      if (error instanceof Error) {
        console.error("Message d'erreur:", error.message);
      }
      throw error;
    }
  }

  static async findByVerificationToken(token: string): Promise<User | null> {
    console.log("🔍 UserModel.findByVerificationToken - Recherche par token de vérification");
    try {
      const user = await db.queryOne<User>(
        'SELECT * FROM users WHERE verification_token = ?',
        [token]
      );
      console.log("🔍 Résultat de recherche par token de vérification, trouvé:", !!user);
      return user;
    } catch (error) {
      console.error("❌ Erreur lors de la recherche par token de vérification:", error);
      if (error instanceof Error) {
        console.error("Message d'erreur:", error.message);
      }
      throw error;
    }
  }

  static async findByResetToken(token: string): Promise<User | null> {
    console.log("🔍 UserModel.findByResetToken - Recherche par token de réinitialisation");
    try {
      const user = await db.queryOne<User>(
        'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > datetime("now")',
        [token]
      );
      console.log("🔍 Résultat de recherche par token de réinitialisation, trouvé:", !!user);
      return user;
    } catch (error) {
      console.error("❌ Erreur lors de la recherche par token de réinitialisation:", error);
      if (error instanceof Error) {
        console.error("Message d'erreur:", error.message);
      }
      throw error;
    }
  }

  static async findAll(): Promise<User[]> {
    return await db.query<User>('SELECT * FROM users ORDER BY created_at DESC');
  }

  static async findByRole(role: UserRole): Promise<User[]> {
    return await db.query<User>(
      'SELECT * FROM users WHERE role = ? ORDER BY created_at DESC',
      [role]
    );
  }

  static async update(id: number, user: Partial<User>): Promise<User | null> {
    const updates = [];
    const values = [];
    
    if (user.email) {
      updates.push('email = ?');
      values.push(user.email);
    }
    if (user.password) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      updates.push('password = ?');
      values.push(hashedPassword);
    }
    if (user.firstname) {
      updates.push('firstname = ?');
      values.push(user.firstname);
    }
    if (user.lastname) {
      updates.push('lastname = ?');
      values.push(user.lastname);
    }
    if (user.role) {
      updates.push('role = ?');
      values.push(user.role);
    }
    
    // Gérer correctement les champs de vérification
    if (user.is_verified !== undefined) {
      updates.push('is_verified = ?');
      values.push(user.is_verified);
    }
    if (user.verification_token !== undefined) {
      updates.push('verification_token = ?');
      values.push(user.verification_token);
    }
    if (user.verification_expires !== undefined) {
      updates.push('verification_expires = ?');
      values.push(user.verification_expires);
    }
    
    // Ajouter les champs de réinitialisation de mot de passe
    if (user.reset_token !== undefined) {
      updates.push('reset_token = ?');
      values.push(user.reset_token);
    }
    if (user.reset_token_expires !== undefined) {
      updates.push('reset_token_expires = ?');
      values.push(user.reset_token_expires);
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    
    if (updates.length === 0) return null;
    
    values.push(id);
    
    await db.execute(
      `UPDATE users 
       SET ${updates.join(', ')}
       WHERE id = ?`,
      values
    );
    
    return await this.findById(id);
  }

  static async delete(id: number): Promise<boolean> {
    const result = await db.execute(
      'DELETE FROM users WHERE id = ?',
      [id]
    );
    return result.changes > 0;
  }

  static async promoteToAdmin(id: number): Promise<User | null> {
    return await this.update(id, { role: 'admin' });
  }

  static async promoteToSuperAdmin(id: number): Promise<User | null> {
    return await this.update(id, { role: 'super-admin' });
  }

  static async demoteToUser(id: number): Promise<User | null> {
    return await this.update(id, { role: 'user' });
  }
} 