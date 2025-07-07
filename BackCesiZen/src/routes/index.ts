import { AuthController } from '../controllers/AuthController';
import { ResourceController } from '../controllers/ResourceController';
import { CategoryController } from '../controllers/CategoryController';
import { DiagnosticCategoryController } from '../controllers/DiagnosticCategoryController';
import { MediaController } from '../controllers/MediaController';
import { userRoutes } from './userRoutes';
import { diagnosticRoutes } from './diagnosticRoutes';
import { infoRoutes } from './infoRoutes';
import { breathingRoutes } from './breathingRoutes';
import { commentRoutes } from './commentRoutes';
import { favoriteRoutes } from './favoriteRoutes';
import { emotionRoutes } from './emotionRoutes';
import { recommendationRoutes } from './recommendationRoutes';
import { reportRoutes } from './reportRoutes';

// Fonction qui gère le routage global
export async function router(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const method = req.method;
  const path = url.pathname;
  
  console.log(`📨 Requête reçue: ${method} ${path}`);
  
  try {
    // Routes d'authentification
    if (path === '/api/auth/register' && method === 'POST') {
      console.log("🔀 Route mappée vers AuthController.register");
      return AuthController.register(req);
    }

    if (path === '/api/auth/login' && method === 'POST') {
      console.log("🔀 Route mappée vers AuthController.login");
      return AuthController.login(req);
    }

    if (path === '/api/auth/me' && method === 'GET') {
      console.log("🔀 Route mappée vers AuthController.getCurrentUser");
      return AuthController.getCurrentUser(req);
    }

    if (path === '/api/auth/logout' && method === 'POST') {
      console.log("🔀 Route mappée vers AuthController.logout");
      return AuthController.logout(req);
    }

    if (path === '/api/auth/verify-email' && method === 'GET') {
      console.log("🔀 Route mappée vers AuthController.verifyEmail");
      return AuthController.verifyEmail(req);
    }

    if (path === '/api/auth/resend-verification' && method === 'POST') {
      console.log("🔀 Route mappée vers AuthController.resendVerificationEmail");
      return AuthController.resendVerificationEmail(req);
    }

    // Routes de récupération de mot de passe
    if (path === '/api/auth/forgot-password' && method === 'POST') {
      console.log("🔀 Route mappée vers AuthController.forgotPassword");
      const userController = await import('../controllers/userController').then(m => new m.UserController());
      return userController.forgotPassword(req);
    }

    if (path === '/api/auth/reset-password' && method === 'POST') {
      console.log("🔀 Route mappée vers AuthController.resetPassword");
      const userController = await import('../controllers/userController').then(m => new m.UserController());
      return userController.resetPassword(req);
    }

    // Routes utilisateurs (anciennes routes, redirection pour compatibilité)
    if (path === '/api/register' && method === 'POST') {
      console.log("⚠️ Utilisation d'une ancienne route: /api/register, redirection vers /api/auth/register");
      // Rediriger vers la nouvelle route
      const newReq = new Request(`${new URL(req.url).origin}/api/auth/register`, {
        method: req.method,
        headers: req.headers,
        body: req.body
      });
      return AuthController.register(newReq);
    }

    if (path === '/api/login' && method === 'POST') {
      // Rediriger vers la nouvelle route
      const newReq = new Request(`${new URL(req.url).origin}/api/auth/login`, {
        method: req.method,
        headers: req.headers,
        body: req.body
      });
      return AuthController.login(newReq);
    }

    if (path === '/api/me' && method === 'GET') {
      // Rediriger vers la nouvelle route
      const newReq = new Request(`${new URL(req.url).origin}/api/auth/me`, {
        method: req.method,
        headers: req.headers,
        body: req.body
      });
      return AuthController.getCurrentUser(newReq);
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

    // Routes des catégories de diagnostic
    if (path === '/api/diagnostic-categories' && method === 'GET') {
      return DiagnosticCategoryController.findAll(req);
    }

    if (path === '/api/diagnostic-categories/with-count' && method === 'GET') {
      return DiagnosticCategoryController.findAllWithCount(req);
    }

    if (path === '/api/diagnostic-categories' && method === 'POST') {
      return DiagnosticCategoryController.create(req);
    }

    if (path.match(/^\/api\/diagnostic-categories\/\d+$/) && method === 'GET') {
      return DiagnosticCategoryController.findById(req);
    }

    if (path.match(/^\/api\/diagnostic-categories\/\d+$/) && method === 'PUT') {
      return DiagnosticCategoryController.update(req);
    }

    if (path.match(/^\/api\/diagnostic-categories\/\d+$/) && method === 'DELETE') {
      return DiagnosticCategoryController.delete(req);
    }

    // Routes de diagnostic
    if (path.startsWith('/api/diagnostic')) {
      return diagnosticRoutes(req);
    }

    // Routes d'informations
    if (path.startsWith('/api/info')) {
      return infoRoutes(req);
    }
    
    // Routes d'exercices de respiration
    if (path.startsWith('/api/breathing')) {
      return breathingRoutes(req);
    }

    // Route utilisateurs
    if (path.startsWith('/api/users')) {
      return userRoutes(req);
    }
    
    // Routes commentaires
    if (path.startsWith('/api/comments') || path.match(/^\/api\/resources\/\d+\/comments/)) {
      return commentRoutes(req);
    }
    
    // Routes favoris
    if (path.startsWith('/api/favorites') || path.match(/^\/api\/resources\/\d+\/favorite/)) {
      return favoriteRoutes(req);
    }

    // Routes d'émotions et de journal émotionnel
    if (path.startsWith('/api/emotions')) {
      return emotionRoutes(req);
    }

    // Routes de recommandations (AJOUT)
    if (path.startsWith('/api/recommendations')) {
      return recommendationRoutes(req);
    }

    // Routes de signalements
    if (path.startsWith('/api/reports')) {
      return reportRoutes(req);
    }

    // Routes pour les médias
    if (path === '/api/media/upload' && method === 'POST') {
      return MediaController.uploadMedia(req);
    }

    // Service des fichiers statiques
    if (path.startsWith('/uploads/')) {
      return MediaController.serveMedia(req);
    }

    // Route par défaut
    console.log(`❌ Route non trouvée: ${method} ${path}`);
    return new Response(JSON.stringify({ error: 'Route non trouvée' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error(`❌ ERREUR CRITIQUE dans le routeur pour ${method} ${path}:`, error);
    if (error instanceof Error) {
      console.error("Message d'erreur:", error.message);
      console.error("Stack trace:", error.stack);
    }
    return new Response(JSON.stringify({ error: 'Erreur serveur interne' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 