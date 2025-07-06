import { db } from '../data/database';

export interface DiagnosticCategory {
  id?: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  created_at?: string;
  updated_at?: string;
}

export class DiagnosticCategoryModel {
  static async create(category: Omit<DiagnosticCategory, 'id' | 'created_at' | 'updated_at'>): Promise<DiagnosticCategory> {
    const result = await db.execute(
      `INSERT INTO diagnostic_categories (name, description, icon, color)
       VALUES (?, ?, ?, ?)
       RETURNING *`,
      [category.name, category.description || null, category.icon || null, category.color || '#6B7280']
    );
    
    const createdCategory = await db.queryOne<DiagnosticCategory>(
      'SELECT * FROM diagnostic_categories WHERE id = ?',
      [result.lastInsertId]
    );
    
    if (!createdCategory) {
      throw new Error('Erreur lors de la création de la catégorie de diagnostic');
    }
    
    return createdCategory;
  }

  static async findById(id: number): Promise<DiagnosticCategory | null> {
    return await db.queryOne<DiagnosticCategory>(
      'SELECT * FROM diagnostic_categories WHERE id = ?',
      [id]
    );
  }

  static async findAll(): Promise<DiagnosticCategory[]> {
    return await db.query<DiagnosticCategory>(
      'SELECT * FROM diagnostic_categories ORDER BY name'
    );
  }

  static async update(id: number, category: Partial<DiagnosticCategory>): Promise<DiagnosticCategory | null> {
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
    if (category.icon !== undefined) {
      updates.push('icon = ?');
      values.push(category.icon);
    }
    if (category.color !== undefined) {
      updates.push('color = ?');
      values.push(category.color);
    }
    
    if (updates.length === 0) return null;
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    await db.execute(
      `UPDATE diagnostic_categories 
       SET ${updates.join(', ')}
       WHERE id = ?`,
      values
    );
    
    return await this.findById(id);
  }

  static async delete(id: number): Promise<boolean> {
    // Mettre à jour les questions qui utilisent cette catégorie
    await db.execute(
      'UPDATE diagnostic_questions SET category_id = NULL WHERE category_id = ?',
      [id]
    );
    
    // Supprimer la catégorie
    const result = await db.execute(
      'DELETE FROM diagnostic_categories WHERE id = ?',
      [id]
    );
    
    return result.changes > 0;
  }

  static async getWithQuestionCount(): Promise<Array<DiagnosticCategory & { question_count: number }>> {
    return await db.query<DiagnosticCategory & { question_count: number }>(
      `SELECT 
        dc.*,
        COUNT(dq.id) as question_count
       FROM diagnostic_categories dc
       LEFT JOIN diagnostic_questions dq ON dc.id = dq.category_id
       GROUP BY dc.id
       ORDER BY dc.name`
    );
  }
} 