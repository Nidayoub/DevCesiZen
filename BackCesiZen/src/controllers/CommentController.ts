import { CommentModel } from '../models/Comment';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';

export class CommentController {
  static async create(req: Request) {
    try {
      // Vérifier l'authentification
      const authError = await authMiddleware(req);
      if (authError) return authError;
      
      const userId = (req as any).userId;
      const body = await req.json();
      
      if (!body.resource_id || !body.content) {
        return new Response(JSON.stringify({ 
          error: 'Les champs resource_id et content sont requis' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      const comment = await CommentModel.create({
        resource_id: body.resource_id,
        user_id: userId,
        content: body.content
      });
      
      return new Response(JSON.stringify(comment), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Erreur lors de la création du commentaire:', error);
      return new Response(JSON.stringify({ 
        error: 'Erreur lors de la création du commentaire' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  static async getByResourceId(req: Request) {
    try {
      const url = new URL(req.url);
      const resourceId = parseInt(url.pathname.split('/').pop() || '0');
      
      const comments = await CommentModel.findByResourceId(resourceId);
      
      return new Response(JSON.stringify(comments), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des commentaires:', error);
      return new Response(JSON.stringify({ 
        error: 'Erreur lors de la récupération des commentaires' 
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
      const commentId = parseInt(url.pathname.split('/').pop() || '0');
      const body = await req.json();
      
      if (!body.content) {
        return new Response(JSON.stringify({ 
          error: 'Le champ content est requis' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      const comment = await CommentModel.findById(commentId);
      
      if (!comment) {
        return new Response(JSON.stringify({ 
          error: 'Commentaire non trouvé' 
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Vérifier que l'utilisateur est l'auteur du commentaire ou un admin
      if (comment.user_id !== userId) {
        // Vérifier si l'utilisateur est admin
        const adminError = await adminMiddleware(req);
        if (adminError) {
          return new Response(JSON.stringify({ 
            error: 'Vous n\'êtes pas autorisé à modifier ce commentaire' 
          }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      
      const updatedComment = await CommentModel.update(commentId, body.content);
      
      return new Response(JSON.stringify(updatedComment), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du commentaire:', error);
      return new Response(JSON.stringify({ 
        error: 'Erreur lors de la mise à jour du commentaire' 
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
      const commentId = parseInt(url.pathname.split('/').pop() || '0');
      
      const comment = await CommentModel.findById(commentId);
      
      if (!comment) {
        return new Response(JSON.stringify({ 
          error: 'Commentaire non trouvé' 
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Vérifier que l'utilisateur est l'auteur du commentaire ou un admin
      if (comment.user_id !== userId) {
        // Vérifier si l'utilisateur est admin
        const adminError = await adminMiddleware(req);
        if (adminError) {
          // L'utilisateur n'est ni l'auteur ni admin
          return new Response(JSON.stringify({ 
            error: 'Vous n\'êtes pas autorisé à supprimer ce commentaire' 
          }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        // Si adminError est null, l'utilisateur est admin et peut supprimer
      }
      // Si comment.user_id === userId, l'utilisateur est l'auteur et peut supprimer
      
      await CommentModel.delete(commentId);
      
      return new Response(null, { status: 204 });
    } catch (error) {
      console.error('Erreur lors de la suppression du commentaire:', error);
      return new Response(JSON.stringify({ 
        error: 'Erreur lors de la suppression du commentaire' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
} 