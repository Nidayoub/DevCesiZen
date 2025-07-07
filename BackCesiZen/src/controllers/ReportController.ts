import { ReportModel } from '../models/Report';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';

export class ReportController {
  // Créer un nouveau signalement
  static async create(req: Request) {
    try {
      // Vérifier l'authentification
      const authError = await authMiddleware(req);
      if (authError) return authError;
      
      const userId = (req as any).userId;
      const body = await req.json();
      
      // Validation des champs requis
      if (!body.content_type || !body.content_id || !body.reason) {
        return new Response(JSON.stringify({ 
          error: 'Les champs content_type, content_id et reason sont requis' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Vérifier que content_type est valide
      if (!['comment', 'resource'].includes(body.content_type)) {
        return new Response(JSON.stringify({ 
          error: 'content_type doit être "comment" ou "resource"' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Vérifier si l'utilisateur n'a pas déjà signalé ce contenu
      const existingReports = await ReportModel.findByContentTypeAndId(body.content_type, body.content_id);
      const userAlreadyReported = existingReports.some(report => report.reported_by === userId);
      
      if (userAlreadyReported) {
        return new Response(JSON.stringify({ 
          error: 'Vous avez déjà signalé ce contenu' 
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      const report = await ReportModel.create({
        content_type: body.content_type,
        content_id: parseInt(body.content_id),
        reported_by: userId,
        reason: body.reason,
        description: body.description
      });
      
      return new Response(JSON.stringify({
        message: 'Signalement créé avec succès',
        report
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Erreur lors de la création du signalement:', error);
      return new Response(JSON.stringify({ 
        error: 'Erreur lors de la création du signalement' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Récupérer tous les signalements (admin uniquement)
  static async findAll(req: Request) {
    try {
      // Vérifier l'authentification et les droits admin
      const adminError = await adminMiddleware(req);
      if (adminError) return adminError;
      
      const url = new URL(req.url);
      const status = url.searchParams.get('status');
      
      const reports = await ReportModel.findAll(status || undefined);
      
      return new Response(JSON.stringify(reports), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des signalements:', error);
      return new Response(JSON.stringify({ 
        error: 'Erreur lors de la récupération des signalements' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Récupérer un signalement par ID (admin uniquement)
  static async findById(req: Request) {
    try {
      // Vérifier l'authentification et les droits admin
      const adminError = await adminMiddleware(req);
      if (adminError) return adminError;
      
      const url = new URL(req.url);
      const reportId = parseInt(url.pathname.split('/').pop() || '0');
      
      const report = await ReportModel.findById(reportId);
      
      if (!report) {
        return new Response(JSON.stringify({ 
          error: 'Signalement non trouvé' 
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify(report), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du signalement:', error);
      return new Response(JSON.stringify({ 
        error: 'Erreur lors de la récupération du signalement' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Mettre à jour le statut d'un signalement (admin uniquement)
  static async updateStatus(req: Request) {
    try {
      // Vérifier l'authentification et les droits admin
      const adminError = await adminMiddleware(req);
      if (adminError) return adminError;
      
      const userId = (req as any).userId;
      const url = new URL(req.url);
      const reportId = parseInt(url.pathname.split('/')[3]); // /api/reports/{id}/status
      const body = await req.json();
      
      if (!body.status) {
        return new Response(JSON.stringify({ 
          error: 'Le champ status est requis' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const validStatuses = ['reviewed', 'resolved', 'dismissed'];
      if (!validStatuses.includes(body.status)) {
        return new Response(JSON.stringify({ 
          error: 'Status invalide. Valeurs autorisées: ' + validStatuses.join(', ') 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      const report = await ReportModel.findById(reportId);
      
      if (!report) {
        return new Response(JSON.stringify({ 
          error: 'Signalement non trouvé' 
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      const updatedReport = await ReportModel.updateStatus(reportId, body.status, userId);
      
      return new Response(JSON.stringify({
        message: 'Statut du signalement mis à jour avec succès',
        report: updatedReport
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du signalement:', error);
      return new Response(JSON.stringify({ 
        error: 'Erreur lors de la mise à jour du signalement' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Supprimer un signalement (admin uniquement)
  static async delete(req: Request) {
    try {
      // Vérifier l'authentification et les droits admin
      const adminError = await adminMiddleware(req);
      if (adminError) return adminError;
      
      const url = new URL(req.url);
      const reportId = parseInt(url.pathname.split('/').pop() || '0');
      
      const report = await ReportModel.findById(reportId);
      
      if (!report) {
        return new Response(JSON.stringify({ 
          error: 'Signalement non trouvé' 
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      await ReportModel.delete(reportId);
      
      return new Response(JSON.stringify({
        message: 'Signalement supprimé avec succès'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du signalement:', error);
      return new Response(JSON.stringify({ 
        error: 'Erreur lors de la suppression du signalement' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Récupérer les statistiques des signalements (admin uniquement)
  static async getStatistics(req: Request) {
    try {
      // Vérifier l'authentification et les droits admin
      const adminError = await adminMiddleware(req);
      if (adminError) return adminError;
      
      const stats = await ReportModel.getStatistics();
      
      return new Response(JSON.stringify(stats), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return new Response(JSON.stringify({ 
        error: 'Erreur lors de la récupération des statistiques' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Récupérer les signalements d'un utilisateur (pour ses propres signalements)
  static async getUserReports(req: Request) {
    try {
      // Vérifier l'authentification
      const authError = await authMiddleware(req);
      if (authError) return authError;
      
      const userId = (req as any).userId;
      
      const reports = await ReportModel.findByUserId(userId);
      
      return new Response(JSON.stringify(reports), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des signalements de l\'utilisateur:', error);
      return new Response(JSON.stringify({ 
        error: 'Erreur lors de la récupération des signalements' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Vérifier si l'utilisateur a déjà signalé un contenu
  static async checkReported(req: Request) {
    try {
      // Vérifier l'authentification
      const authError = await authMiddleware(req);
      if (authError) return authError;
      
      const userId = (req as any).userId;
      const url = new URL(req.url);
      const contentType = url.searchParams.get('content_type');
      const contentId = url.searchParams.get('content_id');
      
      // Validation des paramètres
      if (!contentType || !contentId) {
        return new Response(JSON.stringify({ 
          error: 'Les paramètres content_type et content_id sont requis' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Vérifier que content_type est valide
      if (!['comment', 'resource'].includes(contentType)) {
        return new Response(JSON.stringify({ 
          error: 'content_type doit être "comment" ou "resource"' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Vérifier si l'utilisateur a déjà signalé ce contenu
      const existingReports = await ReportModel.findByContentTypeAndId(contentType, parseInt(contentId));
      const isReported = existingReports.some(report => report.reported_by === userId);
      
      return new Response(JSON.stringify({
        isReported
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Erreur lors de la vérification du signalement:', error);
      return new Response(JSON.stringify({ 
        error: 'Erreur lors de la vérification du signalement' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
} 