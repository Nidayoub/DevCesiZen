import { FavoriteModel } from '../models/Favorite';
import { authMiddleware } from '../middlewares/authMiddleware';

export class FavoriteController {
  static async addFavorite(req: Request) {
    try {
      // Vérifier l'authentification
      const authError = await authMiddleware(req);
      if (authError) return authError;
      
      const userId = (req as any).userId;
      const body = await req.json();
      
      if (!body.resource_id) {
        return new Response(JSON.stringify({ 
          error: 'Le champ resource_id est requis' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Vérifier si le favori existe déjà
      const existingFavorite = await FavoriteModel.findByUserAndResource(userId, body.resource_id);
      if (existingFavorite) {
        return new Response(JSON.stringify({ 
          error: 'Cette ressource est déjà dans vos favoris',
          favorite: existingFavorite
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      const favorite = await FavoriteModel.create({
        user_id: userId,
        resource_id: body.resource_id
      });
      
      return new Response(JSON.stringify(favorite), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout aux favoris:', error);
      return new Response(JSON.stringify({ 
        error: 'Erreur lors de l\'ajout aux favoris' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  static async getUserFavorites(req: Request) {
    try {
      // Vérifier l'authentification
      const authError = await authMiddleware(req);
      if (authError) return authError;
      
      const userId = (req as any).userId;
      
      const favorites = await FavoriteModel.findByUserId(userId);
      
      return new Response(JSON.stringify(favorites), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des favoris:', error);
      return new Response(JSON.stringify({ 
        error: 'Erreur lors de la récupération des favoris' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  static async removeFavorite(req: Request) {
    try {
      // Vérifier l'authentification
      const authError = await authMiddleware(req);
      if (authError) return authError;
      
      const userId = (req as any).userId;
      const url = new URL(req.url);
      const resourceId = parseInt(url.pathname.split('/').pop() || '0');
      
      const success = await FavoriteModel.deleteByUserAndResource(userId, resourceId);
      
      if (!success) {
        return new Response(JSON.stringify({ 
          error: 'Favori non trouvé ou déjà supprimé' 
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(null, { status: 204 });
    } catch (error) {
      console.error('Erreur lors de la suppression du favori:', error);
      return new Response(JSON.stringify({ 
        error: 'Erreur lors de la suppression du favori' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  static async checkFavorite(req: Request) {
    try {
      // Vérifier l'authentification
      const authError = await authMiddleware(req);
      if (authError) return authError;
      
      const userId = (req as any).userId;
      const url = new URL(req.url);
      const resourceId = parseInt(url.pathname.split('/').slice(-2)[0] || '0');
      
      const favorite = await FavoriteModel.findByUserAndResource(userId, resourceId);
      
      return new Response(JSON.stringify({ 
        isFavorite: !!favorite,
        favorite
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Erreur lors de la vérification du favori:', error);
      return new Response(JSON.stringify({ 
        error: 'Erreur lors de la vérification du favori' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
} 