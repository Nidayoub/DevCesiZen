import { db } from '../data/database';
import { ResourceWithCategories } from './Resource';

export interface Favorite {
  id?: number;
  user_id: number;
  resource_id: number;
  created_at?: string;
}

export interface FavoriteWithResource extends Favorite {
  resource: ResourceWithCategories;
}

export class FavoriteModel {
  static async create(favorite: Omit<Favorite, 'id' | 'created_at'>): Promise<Favorite> {
    try {
      const result = await db.execute(
        `INSERT INTO favorites (user_id, resource_id)
         VALUES (?, ?)
         RETURNING *`,
        [favorite.user_id, favorite.resource_id]
      );
      
      const createdFavorite = await db.queryOne<Favorite>(
        'SELECT * FROM favorites WHERE id = ?',
        [result.lastInsertId]
      );
      
      if (!createdFavorite) {
        throw new Error('Erreur lors de la création du favori');
      }
      
      return createdFavorite;
    } catch (error) {
      // Vérifier si l'erreur est due à une violation de contrainte unique
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        throw new Error('Cette ressource est déjà dans vos favoris');
      }
      throw error;
    }
  }

  static async findById(id: number): Promise<Favorite | null> {
    return await db.queryOne<Favorite>(
      'SELECT * FROM favorites WHERE id = ?',
      [id]
    );
  }

  static async findByUserAndResource(userId: number, resourceId: number): Promise<Favorite | null> {
    return await db.queryOne<Favorite>(
      'SELECT * FROM favorites WHERE user_id = ? AND resource_id = ?',
      [userId, resourceId]
    );
  }

  static async findByUserId(userId: number): Promise<FavoriteWithResource[]> {
    const favorites = await db.query<any>(
      `SELECT f.*, r.* 
       FROM favorites f
       JOIN resources r ON f.resource_id = r.id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`,
      [userId]
    );
    
    const favoritesWithResources = await Promise.all(
      favorites.map(async (favorite) => {
        const categories = await db.query<{ id: number; name: string }>(
          `SELECT c.id, c.name 
           FROM categories c
           JOIN resource_categories rc ON c.id = rc.category_id
           WHERE rc.resource_id = ?`,
          [favorite.resource_id]
        );
        
        return {
          id: favorite.id,
          user_id: favorite.user_id,
          resource_id: favorite.resource_id,
          created_at: favorite.created_at,
          resource: {
            id: favorite.resource_id,
            title: favorite.title,
            description: favorite.description,
            type: favorite.type,
            url: favorite.url,
            created_by: favorite.created_by,
            created_at: favorite.created_at,
            updated_at: favorite.updated_at,
            categories
          }
        };
      })
    );
    
    return favoritesWithResources;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await db.execute(
      'DELETE FROM favorites WHERE id = ?',
      [id]
    );
    
    return result.changes > 0;
  }

  static async deleteByUserAndResource(userId: number, resourceId: number): Promise<boolean> {
    const result = await db.execute(
      'DELETE FROM favorites WHERE user_id = ? AND resource_id = ?',
      [userId, resourceId]
    );
    
    return result.changes > 0;
  }

  static async deleteByResourceId(resourceId: number): Promise<boolean> {
    const result = await db.execute(
      'DELETE FROM favorites WHERE resource_id = ?',
      [resourceId]
    );
    
    return result.changes > 0;
  }
} 