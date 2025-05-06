import { db } from '../data/database';
import bcrypt from 'bcryptjs';

export interface User {
  id?: number;
  email: string;
  password: string;
  firstname: string;
  lastname: string;
  role: 'user' | 'admin';
  created_at?: string;
  updated_at?: string;
}

export class UserModel {
  static async create(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    
    const result = await db.sql`
      INSERT INTO users (email, password, firstname, lastname, role)
      VALUES (${user.email}, ${hashedPassword}, ${user.firstname}, ${user.lastname}, ${user.role})
      RETURNING *
    `;
    
    return result[0];
  }

  static async findByEmail(email: string): Promise<User | null> {
    const result = await db.sql`
      SELECT * FROM users WHERE email = ${email}
    `;
    return result[0] || null;
  }

  static async findById(id: number): Promise<User | null> {
    const result = await db.sql`
      SELECT * FROM users WHERE id = ${id}
    `;
    return result[0] || null;
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
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    
    if (updates.length === 0) return null;
    
    const result = await db.sql`
      UPDATE users 
      SET ${db.sql.raw(updates.join(', '))}
      WHERE id = ${id}
      RETURNING *
    `;
    
    return result[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await db.sql`
      DELETE FROM users WHERE id = ${id}
    `;
    return result.changes > 0;
  }
} 