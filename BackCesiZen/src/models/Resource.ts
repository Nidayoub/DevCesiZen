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
    const result = await db.sql`
      INSERT INTO resources (title, description, type, url, created_by)
      VALUES (${resource.title}, ${resource.description}, ${resource.type}, ${resource.url}, ${resource.created_by})
      RETURNING *
    `;
    
    return result[0];
  }

  static async findById(id: number): Promise<ResourceWithCategories | null> {
    const resource = await db.sql`
      SELECT * FROM resources WHERE id = ${id}
    `;
    
    if (!resource[0]) return null;
    
    const categories = await db.sql`
      SELECT c.id, c.name 
      FROM categories c
      JOIN resource_categories rc ON c.id = rc.category_id
      WHERE rc.resource_id = ${id}
    `;
    
    return {
      ...resource[0],
      categories: categories
    };
  }

  static async findAll(): Promise<ResourceWithCategories[]> {
    const resources = await db.sql`
      SELECT * FROM resources ORDER BY created_at DESC
    `;
    
    const resourcesWithCategories = await Promise.all(
      resources.map(async (resource) => {
        const categories = await db.sql`
          SELECT c.id, c.name 
          FROM categories c
          JOIN resource_categories rc ON c.id = rc.category_id
          WHERE rc.resource_id = ${resource.id}
        `;
        
        return {
          ...resource,
          categories: categories
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
    
    const result = await db.sql`
      UPDATE resources 
      SET ${db.sql.raw(updates.join(', '))}
      WHERE id = ${id}
      RETURNING *
    `;
    
    return result[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    // Supprimer d'abord les relations avec les catégories
    await db.sql`
      DELETE FROM resource_categories WHERE resource_id = ${id}
    `;
    
    // Supprimer les favoris associés
    await db.sql`
      DELETE FROM favorites WHERE resource_id = ${id}
    `;
    
    // Supprimer la ressource
    const result = await db.sql`
      DELETE FROM resources WHERE id = ${id}
    `;
    
    return result.changes > 0;
  }

  static async addCategory(resourceId: number, categoryId: number): Promise<boolean> {
    try {
      await db.sql`
        INSERT INTO resource_categories (resource_id, category_id)
        VALUES (${resourceId}, ${categoryId})
      `;
      return true;
    } catch (error) {
      return false;
    }
  }

  static async removeCategory(resourceId: number, categoryId: number): Promise<boolean> {
    const result = await db.sql`
      DELETE FROM resource_categories 
      WHERE resource_id = ${resourceId} AND category_id = ${categoryId}
    `;
    return result.changes > 0;
  }
} 