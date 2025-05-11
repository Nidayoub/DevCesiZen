import { db } from '../data/database';

export interface Category {
  id?: number;
  name: string;
  description?: string;
  created_at?: string;
}

export class CategoryModel {
  static async create(category: Omit<Category, 'id' | 'created_at'>): Promise<Category> {
    const result = await db.execute(
      `INSERT INTO categories (name, description)
       VALUES (?, ?)
       RETURNING *`,
      [category.name, category.description]
    );
    
    const createdCategory = await db.queryOne<Category>(
      'SELECT * FROM categories WHERE id = ?',
      [result.lastInsertId]
    );
    
    if (!createdCategory) {
      throw new Error('Erreur lors de la création de la catégorie');
    }
    
    return createdCategory;
  }

  static async findById(id: number): Promise<Category | null> {
    return await db.queryOne<Category>(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );
  }

  static async findAll(): Promise<Category[]> {
    return await db.query<Category>(
      'SELECT * FROM categories ORDER BY name'
    );
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
    
    values.push(id);
    
    await db.execute(
      `UPDATE categories 
       SET ${updates.join(', ')}
       WHERE id = ?`,
      values
    );
    
    return await this.findById(id);
  }

  static async delete(id: number): Promise<boolean> {
    // Supprimer d'abord les relations avec les ressources
    await db.execute(
      'DELETE FROM resource_categories WHERE category_id = ?',
      [id]
    );
    
    // Supprimer la catégorie
    const result = await db.execute(
      'DELETE FROM categories WHERE id = ?',
      [id]
    );
    
    return result.changes > 0;
  }
} 