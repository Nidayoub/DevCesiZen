import { db } from '../data/database';

export interface Comment {
  id?: number;
  resource_id: number;
  user_id: number;
  content: string;
  created_at?: string;
  updated_at?: string;
}

export interface CommentWithUser extends Comment {
  user: {
    id: number;
    firstname: string;
    lastname: string;
  };
}

export class CommentModel {
  static async create(comment: Omit<Comment, 'id' | 'created_at' | 'updated_at'>): Promise<Comment> {
    const result = await db.execute(
      `INSERT INTO comments (resource_id, user_id, content)
       VALUES (?, ?, ?)
       RETURNING *`,
      [comment.resource_id, comment.user_id, comment.content]
    );
    
    const createdComment = await db.queryOne<Comment>(
      'SELECT * FROM comments WHERE id = ?',
      [result.lastInsertId]
    );
    
    if (!createdComment) {
      throw new Error('Erreur lors de la création du commentaire');
    }
    
    return createdComment;
  }

  static async findById(id: number): Promise<CommentWithUser | null> {
    const comment = await db.queryOne<CommentWithUser>(
      `SELECT c.*, u.id as user_id, u.firstname, u.lastname 
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [id]
    );
    
    if (!comment) return null;
    
    return {
      ...comment,
      user: {
        id: comment.user_id,
        firstname: comment.firstname,
        lastname: comment.lastname
      }
    };
  }

  static async findByResourceId(resourceId: number): Promise<CommentWithUser[]> {
    const comments = await db.query<any>(
      `SELECT c.*, u.id as user_id, u.firstname, u.lastname 
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.resource_id = ?
       ORDER BY c.created_at DESC`,
      [resourceId]
    );
    
    return comments.map(comment => ({
      id: comment.id,
      resource_id: comment.resource_id,
      user_id: comment.user_id,
      content: comment.content,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      user: {
        id: comment.user_id,
        firstname: comment.firstname,
        lastname: comment.lastname
      }
    }));
  }

  static async update(id: number, content: string): Promise<Comment | null> {
    await db.execute(
      `UPDATE comments 
       SET content = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [content, id]
    );
    
    return await db.queryOne<Comment>(
      'SELECT * FROM comments WHERE id = ?',
      [id]
    );
  }

  static async delete(id: number): Promise<boolean> {
    const result = await db.execute(
      'DELETE FROM comments WHERE id = ?',
      [id]
    );
    
    return result.changes > 0;
  }

  static async deleteByResourceId(resourceId: number): Promise<boolean> {
    const result = await db.execute(
      'DELETE FROM comments WHERE resource_id = ?',
      [resourceId]
    );
    
    return result.changes > 0;
  }

  static async findByUserId(userId: number): Promise<Comment[]> {
    return await db.query<Comment>(
      `SELECT * FROM comments 
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );
  }
} 