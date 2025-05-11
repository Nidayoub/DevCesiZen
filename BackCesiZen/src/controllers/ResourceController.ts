import { ResourceModel } from '../models/Resource';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';
import { CommentModel } from '../models/Comment';
import { FavoriteModel } from '../models/Favorite';

export class ResourceController {
  static async create(req: Request) {
    try {
      // Vérifier l'authentification
      const authError = await authMiddleware(req);
      if (authError) return authError;

      const userId = (req as any).userId;
      const body = await req.json();
      
      if (!body.title || !body.type) {
        return new Response(JSON.stringify({ 
          error: 'Les champs title et type sont requis' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const resource = await ResourceModel.create({
        ...body,
        created_by: userId
      });

      return new Response(JSON.stringify(resource), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Erreur lors de la création de la ressource:', error);
      return new Response(JSON.stringify({ 
        error: 'Erreur lors de la création de la ressource' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  static async findAll(req: Request) {
    try {
      const resources = await ResourceModel.findAll();
      return new Response(JSON.stringify(resources), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des ressources:', error);
      return new Response(JSON.stringify({ 
        error: 'Erreur lors de la récupération des ressources' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  static async findById(req: Request) {
    try {
      const url = new URL(req.url);
      const id = parseInt(url.pathname.split('/').pop() || '0');

      const resource = await ResourceModel.findById(id);
      if (!resource) {
        return new Response(JSON.stringify({ 
          error: 'Ressource non trouvée' 
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify(resource), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de la ressource:', error);
      return new Response(JSON.stringify({ 
        error: 'Erreur lors de la récupération de la ressource' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  static async update(req: Request) {
    try {
      // Vérifier l'authentification
      const authError = await authMiddleware(req);
      if (authError) return authError;

      const userId = (req as any).userId;
      const url = new URL(req.url);
      const id = parseInt(url.pathname.split('/').pop() || '0');
      const body = await req.json();

      // Récupérer la ressource pour vérifier si l'utilisateur est l'auteur
      const resource = await ResourceModel.findById(id);
      if (!resource) {
        return new Response(JSON.stringify({ 
          error: 'Ressource non trouvée' 
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Vérifier que l'utilisateur est l'auteur de la ressource ou un admin
      if (resource.created_by !== userId) {
        // Vérifier si l'utilisateur est admin
        const adminError = await adminMiddleware(req);
        if (adminError) {
          return new Response(JSON.stringify({ 
            error: 'Vous n\'êtes pas autorisé à modifier cette ressource' 
          }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      const updatedResource = await ResourceModel.update(id, body);
      if (!updatedResource) {
        return new Response(JSON.stringify({ 
          error: 'Erreur lors de la mise à jour de la ressource' 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify(updatedResource), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la ressource:', error);
      return new Response(JSON.stringify({ 
        error: 'Erreur lors de la mise à jour de la ressource' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  static async delete(req: Request) {
    try {
      // Vérifier l'authentification
      const authError = await authMiddleware(req);
      if (authError) return authError;

      const userId = (req as any).userId;
      const url = new URL(req.url);
      const id = parseInt(url.pathname.split('/').pop() || '0');

      // Récupérer la ressource pour vérifier si l'utilisateur est l'auteur
      const resource = await ResourceModel.findById(id);
      if (!resource) {
        return new Response(JSON.stringify({ 
          error: 'Ressource non trouvée' 
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Vérifier que l'utilisateur est l'auteur de la ressource ou un admin
      if (resource.created_by !== userId) {
        // Vérifier si l'utilisateur est admin
        const adminError = await adminMiddleware(req);
        if (adminError) {
          return new Response(JSON.stringify({ 
            error: 'Vous n\'êtes pas autorisé à supprimer cette ressource' 
          }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      // Supprimer d'abord les commentaires et favoris associés
      await CommentModel.deleteByResourceId(id);
      await FavoriteModel.deleteByResourceId(id);
      
      // Supprimer la ressource
      const success = await ResourceModel.delete(id);
      if (!success) {
        return new Response(JSON.stringify({ 
          error: 'Erreur lors de la suppression de la ressource' 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(null, { status: 204 });
    } catch (error) {
      console.error('Erreur lors de la suppression de la ressource:', error);
      return new Response(JSON.stringify({ 
        error: 'Erreur lors de la suppression de la ressource' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
} 