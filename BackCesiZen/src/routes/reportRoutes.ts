import { ReportController } from '../controllers/ReportController';

export async function reportRoutes(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const method = req.method;
  const path = url.pathname;
  
  console.log(`📨 Route signalement: ${method} ${path}`);
  
  try {
    // POST /api/reports - Créer un nouveau signalement
    if (path === '/api/reports' && method === 'POST') {
      console.log("🔀 Route mappée vers ReportController.create");
      return ReportController.create(req);
    }

    // GET /api/reports - Récupérer tous les signalements (admin uniquement)
    if (path === '/api/reports' && method === 'GET') {
      console.log("🔀 Route mappée vers ReportController.findAll");
      return ReportController.findAll(req);
    }

    // GET /api/reports/check - Vérifier si l'utilisateur a déjà signalé un contenu
    if (path === '/api/reports/check' && method === 'GET') {
      console.log("🔀 Route mappée vers ReportController.checkReported");
      return ReportController.checkReported(req);
    }

    // GET /api/reports/statistics - Récupérer les statistiques des signalements (admin uniquement)
    if (path === '/api/reports/statistics' && method === 'GET') {
      console.log("🔀 Route mappée vers ReportController.getStatistics");
      return ReportController.getStatistics(req);
    }

    // GET /api/reports/user - Récupérer les signalements de l'utilisateur connecté
    if (path === '/api/reports/user' && method === 'GET') {
      console.log("🔀 Route mappée vers ReportController.getUserReports");
      return ReportController.getUserReports(req);
    }

    // GET /api/reports/{id} - Récupérer un signalement par ID (admin uniquement)
    if (path.match(/^\/api\/reports\/\d+$/) && method === 'GET') {
      console.log("🔀 Route mappée vers ReportController.findById");
      return ReportController.findById(req);
    }

    // PUT /api/reports/{id}/status - Mettre à jour le statut d'un signalement (admin uniquement)
    if (path.match(/^\/api\/reports\/\d+\/status$/) && method === 'PUT') {
      console.log("🔀 Route mappée vers ReportController.updateStatus");
      return ReportController.updateStatus(req);
    }

    // DELETE /api/reports/{id} - Supprimer un signalement (admin uniquement)
    if (path.match(/^\/api\/reports\/\d+$/) && method === 'DELETE') {
      console.log("🔀 Route mappée vers ReportController.delete");
      return ReportController.delete(req);
    }

    // Route par défaut - non trouvée
    console.log(`❌ Route signalement non trouvée: ${method} ${path}`);
    return new Response(JSON.stringify({ error: 'Route de signalement non trouvée' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error(`❌ ERREUR dans reportRoutes pour ${method} ${path}:`, error);
    return new Response(JSON.stringify({ error: 'Erreur serveur interne' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 