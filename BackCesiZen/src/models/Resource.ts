import { db } from '../data/database';

export interface Resource {
  id?: number;
  title: string;
  description?: string;
  type: string;
  url?: string;
  created_by: number;
  created_at?: string;
  updated_at?: string;
}

export interface ResourceWithCategories extends Resource {
  categories: { id: number; name: string }[];
}

export class ResourceModel {
  static async create(resource: Omit<Resource, 'id' | 'created_at' | 'updated_at'>): Promise<Resource> {
    const result = await db.execute(
      `INSERT INTO resources (title, description, type, url, created_by)
       VALUES (?, ?, ?, ?, ?)
       RETURNING *`,
      [resource.title, resource.description, resource.type, resource.url, resource.created_by]
    );
    
    const createdResource = await db.queryOne<Resource>(
      'SELECT * FROM resources WHERE id = ?',
      [result.lastInsertId]
    );
    
    if (!createdResource) {
      throw new Error('Erreur lors de la création de la ressource');
    }
    
    return createdResource;
  }

  static async findById(id: number): Promise<ResourceWithCategories | null> {
    const resource = await db.queryOne<Resource>(
      'SELECT * FROM resources WHERE id = ?',
      [id]
    );
    
    if (!resource) return null;
    
    const categories = await db.query<{ id: number; name: string }>(
      `SELECT c.id, c.name 
       FROM categories c
       JOIN resource_categories rc ON c.id = rc.category_id
       WHERE rc.resource_id = ?`,
      [id]
    );
    
    return {
      ...resource,
      categories
    };
  }

  static async findAll(): Promise<ResourceWithCategories[]> {
    const resources = await db.query<Resource>(
      'SELECT * FROM resources ORDER BY created_at DESC'
    );
    
    const resourcesWithCategories = await Promise.all(
      resources.map(async (resource) => {
        const categories = await db.query<{ id: number; name: string }>(
          `SELECT c.id, c.name 
           FROM categories c
           JOIN resource_categories rc ON c.id = rc.category_id
           WHERE rc.resource_id = ?`,
          [resource.id]
        );
        
        return {
          ...resource,
          categories
        };
      })
    );
    
    return resourcesWithCategories;
  }

  static async update(id: number, resource: Partial<Resource>): Promise<Resource | null> {
    const updates = [];
    const values = [];
    
    if (resource.title) {
      updates.push('title = ?');
      values.push(resource.title);
    }
    if (resource.description !== undefined) {
      updates.push('description = ?');
      values.push(resource.description);
    }
    if (resource.type) {
      updates.push('type = ?');
      values.push(resource.type);
    }
    if (resource.url !== undefined) {
      updates.push('url = ?');
      values.push(resource.url);
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    
    if (updates.length === 0) return null;
    
    values.push(id);
    
    await db.execute(
      `UPDATE resources 
       SET ${updates.join(', ')}
       WHERE id = ?`,
      values
    );
    
    return await this.findById(id);
  }

  static async delete(id: number): Promise<boolean> {
    // Supprimer d'abord les relations avec les catégories
    await db.execute(
      'DELETE FROM resource_categories WHERE resource_id = ?',
      [id]
    );
    
    // Supprimer les favoris associés
    await db.execute(
      'DELETE FROM favorites WHERE resource_id = ?',
      [id]
    );
    
    // Supprimer la ressource
    const result = await db.execute(
      'DELETE FROM resources WHERE id = ?',
      [id]
    );
    
    return result.changes > 0;
  }

  static async addCategory(resourceId: number, categoryId: number): Promise<boolean> {
    try {
      await db.execute(
        'INSERT INTO resource_categories (resource_id, category_id) VALUES (?, ?)',
        [resourceId, categoryId]
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  static async removeCategory(resourceId: number, categoryId: number): Promise<boolean> {
    const result = await db.execute(
      'DELETE FROM resource_categories WHERE resource_id = ? AND category_id = ?',
      [resourceId, categoryId]
    );
    return result.changes > 0;
  }
} 