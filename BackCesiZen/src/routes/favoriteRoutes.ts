import { FavoriteController } from '../controllers/FavoriteController';

export async function favoriteRoutes(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const method = req.method;
  const path = url.pathname;
  
  console.log(`📨 Requête favoris reçue: ${method} ${path}`);
  
  // Route pour ajouter une ressource aux favoris
  if (path === '/api/favorites' && method === 'POST') {
    return FavoriteController.addFavorite(req);
  }
  
  // Route pour récupérer les favoris de l'utilisateur connecté
  if (path === '/api/favorites' && method === 'GET') {
    return FavoriteController.getUserFavorites(req);
  }
  
  // Route pour vérifier si une ressource est dans les favoris
  if (path.match(/^\/api\/resources\/\d+\/favorite\/check$/) && method === 'GET') {
    return FavoriteController.checkFavorite(req);
  }
  
  // Route pour supprimer une ressource des favoris
  if (path.match(/^\/api\/favorites\/\d+$/) && method === 'DELETE') {
    return FavoriteController.removeFavorite(req);
  }
  
  // Route non trouvée
  return new Response(JSON.stringify({ error: 'Route favoris non trouvée' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
} 