import { CommentController } from '../controllers/CommentController';

export async function commentRoutes(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const method = req.method;
  const path = url.pathname;
  
  console.log(`📨 Requête commentaire reçue: ${method} ${path}`);
  
  // Route pour créer un commentaire
  if (path === '/api/comments' && method === 'POST') {
    return CommentController.create(req);
  }
  
  // Route pour récupérer les commentaires d'une ressource
  if (path.match(/^\/api\/resources\/\d+\/comments$/) && method === 'GET') {
    return CommentController.getByResourceId(req);
  }
  
  // Route pour mettre à jour un commentaire
  if (path.match(/^\/api\/comments\/\d+$/) && method === 'PUT') {
    return CommentController.update(req);
  }
  
  // Route pour supprimer un commentaire
  if (path.match(/^\/api\/comments\/\d+$/) && method === 'DELETE') {
    return CommentController.delete(req);
  }
  
  // Route non trouvée
  return new Response(JSON.stringify({ error: 'Route commentaire non trouvée' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
} 