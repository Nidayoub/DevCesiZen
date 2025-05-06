import { AuthController } from '../controllers/AuthController';
import { ResourceController } from '../controllers/ResourceController';
import { CategoryController } from '../controllers/CategoryController';

// Fonction qui gère le routage global
export async function router(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const method = req.method;
  const path = url.pathname;

  // Routes d'authentification
  if (path === '/api/auth/register' && method === 'POST') {
    return AuthController.register(req);
  }

  if (path === '/api/auth/login' && method === 'POST') {
    return AuthController.login(req);
  }

  // Routes des ressources
  if (path === '/api/resources' && method === 'GET') {
    return ResourceController.findAll(req);
  }

  if (path === '/api/resources' && method === 'POST') {
    return ResourceController.create(req);
  }

  if (path.match(/^\/api\/resources\/\d+$/) && method === 'GET') {
    return ResourceController.findById(req);
  }

  if (path.match(/^\/api\/resources\/\d+$/) && method === 'PUT') {
    return ResourceController.update(req);
  }

  if (path.match(/^\/api\/resources\/\d+$/) && method === 'DELETE') {
    return ResourceController.delete(req);
  }

  // Routes des catégories
  if (path === '/api/categories' && method === 'GET') {
    return CategoryController.findAll(req);
  }

  if (path === '/api/categories' && method === 'POST') {
    return CategoryController.create(req);
  }

  if (path.match(/^\/api\/categories\/\d+$/) && method === 'GET') {
    return CategoryController.findById(req);
  }

  if (path.match(/^\/api\/categories\/\d+$/) && method === 'PUT') {
    return CategoryController.update(req);
  }

  if (path.match(/^\/api\/categories\/\d+$/) && method === 'DELETE') {
    return CategoryController.delete(req);
  }

  // Route par défaut
  return new Response(JSON.stringify({ error: 'Route non trouvée' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
} 