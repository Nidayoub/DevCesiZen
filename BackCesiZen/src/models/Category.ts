import { db } from '../data/database';

export interface Category {
  id?: number;
  name: string;
  description?: string;
  created_at?: string;
}

export class CategoryModel {
  static async create(category: Omit<Category, 'id' | 'created_at'>): Promise<Category> {
    const result = await db.sql`
      INSERT INTO categories (name, description)
      VALUES (${category.name}, ${category.description})
      RETURNING *
    `;
    
    return result[0];
  }

  static async findById(id: number): Promise<Category | null> {
    const result = await db.sql`
      SELECT * FROM categories WHERE id = ${id}
    `;
    return result[0] || null;
  }

  static async findAll(): Promise<Category[]> {
    const result = await db.sql`
      SELECT * FROM categories ORDER BY name
    `;
    return result;
  }

  static async update(id: number, category: Partial<Category>): Promise<Category | null> {
    const updates = [];
    const values = [];
    
    if (category.name) {
      updates.push('name = ?');
      values.push(category.name);
    }
    if (category.description !== undefined) {
      updates.push('description = ?');
      values.push(category.description);
    }
    
    if (updates.length === 0) return null;
    
    const result = await db.sql`
      UPDATE categories 
      SET ${db.sql.raw(updates.join(', '))}
      WHERE id = ${id}
      RETURNING *
    `;
    
    return result[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    // Supprimer d'abord les relations avec les ressources
    await db.sql`
      DELETE FROM resource_categories WHERE category_id = ${id}
    `;
    
    // Supprimer la catégorie
    const result = await db.sql`
      DELETE FROM categories WHERE id = ${id}
    `;
    
    return result.changes > 0;
  }
} 