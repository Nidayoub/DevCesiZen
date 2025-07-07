import { db } from '../data/database';

export interface Report {
  id?: number;
  content_type: 'comment' | 'resource';
  content_id: number;
  reported_by: number;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewed_by?: number;
  reviewed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ReportWithDetails extends Report {
  reporter: {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
  };
  reviewer?: {
    id: number;
    firstname: string;
    lastname: string;
  };
  content_details?: {
    title?: string;
    content?: string;
    author?: {
      id: number;
      firstname: string;
      lastname: string;
    };
  };
}

export class ReportModel {
  static async create(report: Omit<Report, 'id' | 'created_at' | 'updated_at' | 'status'>): Promise<Report> {
    const result = await db.execute(
      `INSERT INTO reports (content_type, content_id, reported_by, reason, description, status)
       VALUES (?, ?, ?, ?, ?, 'pending')
       RETURNING *`,
      [report.content_type, report.content_id, report.reported_by, report.reason, report.description]
    );
    
    const createdReport = await db.queryOne<Report>(
      'SELECT * FROM reports WHERE id = ?',
      [result.lastInsertId]
    );
    
    if (!createdReport) {
      throw new Error('Erreur lors de la création du signalement');
    }
    
    return createdReport;
  }

  static async findById(id: number): Promise<ReportWithDetails | null> {
    const report = await db.queryOne<any>(
      `SELECT r.*, 
              u.id as reporter_id, u.firstname as reporter_firstname, u.lastname as reporter_lastname, u.email as reporter_email,
              ur.id as reviewer_id, ur.firstname as reviewer_firstname, ur.lastname as reviewer_lastname
       FROM reports r
       JOIN users u ON r.reported_by = u.id
       LEFT JOIN users ur ON r.reviewed_by = ur.id
       WHERE r.id = ?`,
      [id]
    );
    
    if (!report) return null;
    
    // Récupérer les détails du contenu signalé
    let contentDetails = null;
    if (report.content_type === 'comment') {
      const comment = await db.queryOne<any>(
        `SELECT c.content, u.id as author_id, u.firstname as author_firstname, u.lastname as author_lastname
         FROM comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.id = ?`,
        [report.content_id]
      );
      if (comment) {
        contentDetails = {
          content: comment.content,
          author: {
            id: comment.author_id,
            firstname: comment.author_firstname,
            lastname: comment.author_lastname
          }
        };
      }
    } else if (report.content_type === 'resource') {
      const resource = await db.queryOne<any>(
        `SELECT r.title, r.description, u.id as author_id, u.firstname as author_firstname, u.lastname as author_lastname
         FROM resources r
         JOIN users u ON r.created_by = u.id
         WHERE r.id = ?`,
        [report.content_id]
      );
      if (resource) {
        contentDetails = {
          title: resource.title,
          content: resource.description,
          author: {
            id: resource.author_id,
            firstname: resource.author_firstname,
            lastname: resource.author_lastname
          }
        };
      }
    }
    
    return {
      id: report.id,
      content_type: report.content_type,
      content_id: report.content_id,
      reported_by: report.reported_by,
      reason: report.reason,
      description: report.description,
      status: report.status,
      reviewed_by: report.reviewed_by,
      reviewed_at: report.reviewed_at,
      created_at: report.created_at,
      updated_at: report.updated_at,
      reporter: {
        id: report.reporter_id,
        firstname: report.reporter_firstname,
        lastname: report.reporter_lastname,
        email: report.reporter_email
      },
      reviewer: report.reviewer_id ? {
        id: report.reviewer_id,
        firstname: report.reviewer_firstname,
        lastname: report.reviewer_lastname
      } : undefined,
      content_details: contentDetails
    };
  }

  static async findAll(status?: string): Promise<ReportWithDetails[]> {
    let query = `
      SELECT r.*, 
             u.id as reporter_id, u.firstname as reporter_firstname, u.lastname as reporter_lastname, u.email as reporter_email,
             ur.id as reviewer_id, ur.firstname as reviewer_firstname, ur.lastname as reviewer_lastname
      FROM reports r
      JOIN users u ON r.reported_by = u.id
      LEFT JOIN users ur ON r.reviewed_by = ur.id
    `;
    
    const params: any[] = [];
    if (status) {
      query += ' WHERE r.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY r.created_at DESC';
    
    const reports = await db.query<any>(query, params);
    
    // Enrichir avec les détails du contenu
    const enrichedReports = await Promise.all(reports.map(async (report) => {
      let contentDetails = null;
      
      if (report.content_type === 'comment') {
        const comment = await db.queryOne<any>(
          `SELECT c.content, u.id as author_id, u.firstname as author_firstname, u.lastname as author_lastname
           FROM comments c
           JOIN users u ON c.user_id = u.id
           WHERE c.id = ?`,
          [report.content_id]
        );
        if (comment) {
          contentDetails = {
            content: comment.content,
            author: {
              id: comment.author_id,
              firstname: comment.author_firstname,
              lastname: comment.author_lastname
            }
          };
        }
      } else if (report.content_type === 'resource') {
        const resource = await db.queryOne<any>(
          `SELECT r.title, r.description, u.id as author_id, u.firstname as author_firstname, u.lastname as author_lastname
           FROM resources r
           JOIN users u ON r.created_by = u.id
           WHERE r.id = ?`,
          [report.content_id]
        );
        if (resource) {
          contentDetails = {
            title: resource.title,
            content: resource.description,
            author: {
              id: resource.author_id,
              firstname: resource.author_firstname,
              lastname: resource.author_lastname
            }
          };
        }
      }
      
      return {
        id: report.id,
        content_type: report.content_type,
        content_id: report.content_id,
        reported_by: report.reported_by,
        reason: report.reason,
        description: report.description,
        status: report.status,
        reviewed_by: report.reviewed_by,
        reviewed_at: report.reviewed_at,
        created_at: report.created_at,
        updated_at: report.updated_at,
        reporter: {
          id: report.reporter_id,
          firstname: report.reporter_firstname,
          lastname: report.reporter_lastname,
          email: report.reporter_email
        },
        reviewer: report.reviewer_id ? {
          id: report.reviewer_id,
          firstname: report.reviewer_firstname,
          lastname: report.reviewer_lastname
        } : undefined,
        content_details: contentDetails
      };
    }));
    
    return enrichedReports;
  }

  static async updateStatus(id: number, status: 'reviewed' | 'resolved' | 'dismissed', reviewedBy: number): Promise<Report | null> {
    await db.execute(
      `UPDATE reports 
       SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, reviewedBy, id]
    );
    
    return await db.queryOne<Report>(
      'SELECT * FROM reports WHERE id = ?',
      [id]
    );
  }

  static async delete(id: number): Promise<boolean> {
    const result = await db.execute(
      'DELETE FROM reports WHERE id = ?',
      [id]
    );
    
    return result.changes > 0;
  }

  static async findByContentTypeAndId(contentType: 'comment' | 'resource', contentId: number): Promise<Report[]> {
    return await db.query<Report>(
      `SELECT * FROM reports 
       WHERE content_type = ? AND content_id = ?
       ORDER BY created_at DESC`,
      [contentType, contentId]
    );
  }

  static async findByUserId(userId: number): Promise<Report[]> {
    return await db.query<Report>(
      `SELECT * FROM reports 
       WHERE reported_by = ?
       ORDER BY created_at DESC`,
      [userId]
    );
  }

  static async getStatistics(): Promise<{
    total: number;
    pending: number;
    reviewed: number;
    resolved: number;
    dismissed: number;
  }> {
    const stats = await db.queryOne<any>(
      `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
         SUM(CASE WHEN status = 'reviewed' THEN 1 ELSE 0 END) as reviewed,
         SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
         SUM(CASE WHEN status = 'dismissed' THEN 1 ELSE 0 END) as dismissed
       FROM reports`
    );
    
    return {
      total: stats?.total || 0,
      pending: stats?.pending || 0,
      reviewed: stats?.reviewed || 0,
      resolved: stats?.resolved || 0,
      dismissed: stats?.dismissed || 0
    };
  }
} 