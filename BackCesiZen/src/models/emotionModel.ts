import { db } from '../data/database';

interface Emotion {
  id?: number;
  name: string;
  color: string;
  icon?: string;
  is_default?: boolean;
}

interface EmotionEntry {
  id?: number;
  user_id: number;
  emotion_id: number;
  intensity: number;
  notes?: string;
  date?: string;
  emotion_name?: string;
  emotion_color?: string;
  emotion_icon?: string;
}

export class EmotionModel {
  async getAll(): Promise<Emotion[]> {
    return await db.query('SELECT * FROM emotions ORDER BY name');
  }

  async getById(id: number): Promise<Emotion | null> {
    return await db.queryOne('SELECT * FROM emotions WHERE id = ?', [id]);
  }

  async create(emotion: Emotion): Promise<Emotion> {
    const result = await db.execute(
      'INSERT INTO emotions (name, color, icon, is_default) VALUES (?, ?, ?, ?)',
      [emotion.name, emotion.color, emotion.icon || null, emotion.is_default || 0]
    );
    return { ...emotion, id: result.lastInsertId };
  }

  async update(id: number, emotion: Partial<Emotion>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (emotion.name !== undefined) {
      fields.push('name = ?');
      values.push(emotion.name);
    }

    if (emotion.color !== undefined) {
      fields.push('color = ?');
      values.push(emotion.color);
    }

    if (emotion.icon !== undefined) {
      fields.push('icon = ?');
      values.push(emotion.icon);
    }

    if (emotion.is_default !== undefined) {
      fields.push('is_default = ?');
      values.push(emotion.is_default);
    }

    if (fields.length === 0) return;

    values.push(id);
    await db.execute(`UPDATE emotions SET ${fields.join(', ')} WHERE id = ?`, values);
  }

  async delete(id: number): Promise<void> {
    await db.execute('DELETE FROM emotions WHERE id = ?', [id]);
  }
}

export class EmotionEntryModel {
  async getEntriesByUserId(userId: number, startDate?: string, endDate?: string): Promise<EmotionEntry[]> {
    let query = `
      SELECT ee.*, e.name as emotion_name, e.color as emotion_color, e.icon as emotion_icon 
      FROM emotion_entries ee
      JOIN emotions e ON ee.emotion_id = e.id
      WHERE ee.user_id = ?
    `;
    
    const params: any[] = [userId];
    
    if (startDate && endDate) {
      query += ' AND ee.date BETWEEN ? AND ?';
      params.push(startDate);
      params.push(endDate);
    }
    
    query += ' ORDER BY ee.date DESC';
    
    return await db.query(query, params);
  }

  async getEntryById(id: number, userId: number): Promise<EmotionEntry | null> {
    return await db.queryOne(
      `SELECT ee.*, e.name as emotion_name, e.color as emotion_color, e.icon as emotion_icon 
       FROM emotion_entries ee
       JOIN emotions e ON ee.emotion_id = e.id
       WHERE ee.id = ? AND ee.user_id = ?`, 
      [id, userId]
    );
  }

  async create(entry: EmotionEntry): Promise<EmotionEntry> {
    const result = await db.execute(
      'INSERT INTO emotion_entries (user_id, emotion_id, intensity, notes, date) VALUES (?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))',
      [entry.user_id, entry.emotion_id, entry.intensity, entry.notes || null, entry.date || null]
    );
    return { ...entry, id: result.lastInsertId };
  }

  async update(id: number, userId: number, entry: Partial<EmotionEntry>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (entry.emotion_id !== undefined) {
      fields.push('emotion_id = ?');
      values.push(entry.emotion_id);
    }

    if (entry.intensity !== undefined) {
      fields.push('intensity = ?');
      values.push(entry.intensity);
    }

    if (entry.notes !== undefined) {
      fields.push('notes = ?');
      values.push(entry.notes);
    }

    if (entry.date !== undefined) {
      fields.push('date = ?');
      values.push(entry.date);
    }

    if (fields.length === 0) return;

    values.push(id);
    values.push(userId);
    await db.execute(`UPDATE emotion_entries SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`, values);
  }

  async delete(id: number, userId: number): Promise<void> {
    await db.execute('DELETE FROM emotion_entries WHERE id = ? AND user_id = ?', [id, userId]);
  }

  async getEmotionSummary(userId: number, period: 'week' | 'month' | 'quarter' | 'year'): Promise<any[]> {
    let dateFilter: string;
    
    switch (period) {
      case 'week':
        dateFilter = "datetime('now', '-7 days')";
        break;
      case 'month':
        dateFilter = "datetime('now', '-1 month')";
        break;
      case 'quarter':
        dateFilter = "datetime('now', '-3 months')";
        break;
      case 'year':
        dateFilter = "datetime('now', '-1 year')";
        break;
      default:
        dateFilter = "datetime('now', '-30 days')";
    }
    
    return await db.query(
      `SELECT 
        e.name as emotion_name, 
        e.color as emotion_color, 
        COUNT(*) as count, 
        AVG(ee.intensity) as average_intensity,
        strftime('%Y-%m-%d', ee.date) as date
      FROM emotion_entries ee
      JOIN emotions e ON ee.emotion_id = e.id
      WHERE ee.user_id = ? AND ee.date >= ${dateFilter}
      GROUP BY e.id, strftime('%Y-%m-%d', ee.date)
      ORDER BY date ASC`,
      [userId]
    );
  }
} 