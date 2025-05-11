import { BaseModel } from "./baseModel";
import { randomBytes } from "crypto";

/**
 * Interface pour les sessions
 */
export interface Session {
  id: number;
  userId: number;
  token: string;
  expiration: Date;
  createdAt?: string;
}

/**
 * Modèle pour la gestion des sessions
 */
export class SessionModel extends BaseModel<Session> {
  constructor() {
    super("sessions");
  }

  /**
   * Crée une nouvelle session
   * @param session Les données de la session à créer
   * @returns La session créée
   */
  async create(session: Omit<Session, 'id'>): Promise<Session> {
    // Assurez-vous que expiration est une chaîne de caractères pour le stockage JSON
    const sessionToCreate: any = {
      ...session,
      expiration: session.expiration instanceof Date 
        ? session.expiration.toISOString() 
        : session.expiration,
      createdAt: session.createdAt || new Date().toISOString()
    };
    
    const createdSession = await super.create(sessionToCreate);
    
    // Convertir la chaîne de date en objet Date pour le retour
    return {
      ...createdSession,
      expiration: new Date(createdSession.expiration)
    };
  }

  /**
   * Récupère une session par son token
   * @param token Token de session
   * @returns La session trouvée ou null
   */
  async getByToken(token: string): Promise<Session | null> {
    const session = this.data.find(session => session.token === token);
    
    if (!session) {
      return null;
    }
    
    // Convertir la chaîne de date en objet Date
    return {
      ...session,
      expiration: new Date(session.expiration)
    };
  }

  /**
   * Récupère les sessions d'un utilisateur
   * @param userId ID de l'utilisateur
   * @returns Liste des sessions de l'utilisateur
   */
  async getByUserId(userId: number): Promise<Session[]> {
    return this.data
      .filter(session => session.userId === userId)
      .map(session => ({
        ...session,
        expiration: new Date(session.expiration)
      }));
  }

  /**
   * Crée une nouvelle session pour un utilisateur
   * @param userId ID de l'utilisateur
   * @param expirationDays Nombre de jours avant expiration (défaut: 7)
   * @returns La session créée
   */
  async createSession(userId: number, expirationDays: number = 7): Promise<Session> {
    // Générer un token aléatoire
    const token = randomBytes(32).toString("hex");
    
    // Calculer la date d'expiration
    const expiration = new Date();
    expiration.setDate(expiration.getDate() + expirationDays);
    
    // Créer la session
    const session = await this.create({
      userId,
      token,
      expiration,
      createdAt: new Date().toISOString()
    });
    
    return {
      ...session,
      expiration: new Date(session.expiration)
    };
  }

  /**
   * Supprime une session par son token
   * @param token Token de session
   * @returns true si supprimée, false sinon
   */
  async deleteByToken(token: string): Promise<boolean> {
    const session = await this.getByToken(token);
    
    if (!session) {
      return false;
    }
    
    return this.delete(session.id);
  }

  /**
   * Supprime toutes les sessions d'un utilisateur
   * @param userId ID de l'utilisateur
   * @returns Nombre de sessions supprimées
   */
  async deleteByUserId(userId: number): Promise<number> {
    const sessions = await this.getByUserId(userId);
    let count = 0;
    
    for (const session of sessions) {
      const deleted = await this.delete(session.id);
      if (deleted) count++;
    }
    
    return count;
  }

  /**
   * Nettoie les sessions expirées
   * @returns Nombre de sessions supprimées
   */
  async cleanExpiredSessions(): Promise<number> {
    const now = new Date();
    let count = 0;
    
    for (const session of this.data) {
      const expirationDate = new Date(session.expiration);
      
      if (expirationDate < now) {
        const deleted = await this.delete(session.id);
        if (deleted) count++;
      }
    }
    
    return count;
  }
} 