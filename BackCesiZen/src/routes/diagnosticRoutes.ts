import { DiagnosticController } from "../controllers/diagnosticController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { adminMiddleware } from "../middlewares/adminMiddleware";

// Contrôleur du diagnostic
const diagnosticController = new DiagnosticController();

// Routeur pour le diagnostic
export async function diagnosticRoutes(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  // GET /api/diagnostic/questions - Liste des événements de l'échelle de Holmes & Rahe
  if (path === "/api/diagnostic/questions" && method === "GET") {
    return diagnosticController.getQuestions(req);
  }

  // POST /api/diagnostic/submit - Soumettre un diagnostic et obtenir un score
  if (path === "/api/diagnostic/submit" && method === "POST") {
    // Exiger l'authentification pour soumettre et donc sauvegarder
    const authResponse = await authMiddleware(req);
    if (authResponse) return authResponse; // Bloquer si non authentifié
    
    // Si on arrive ici, l'utilisateur est authentifié et req.userId est défini par authMiddleware
    return diagnosticController.submitDiagnostic(req);
  }

  // GET /api/diagnostic/history - Récupérer l'historique des diagnostics de l'utilisateur
  if (path === "/api/diagnostic/history" && method === "GET") {
    // Vérifier que l'utilisateur est connecté
    const authResponse = await authMiddleware(req);
    if (authResponse) return authResponse;
    
    return diagnosticController.getUserHistory(req);
  }

  // DELETE /api/diagnostic/history/{id} - Supprimer un diagnostic spécifique de l'utilisateur
  if (path.startsWith("/api/diagnostic/history/") && method === "DELETE") {
    // Vérifier que l'utilisateur est connecté
    const authResponse = await authMiddleware(req);
    if (authResponse) return authResponse;
    
    return diagnosticController.deleteDiagnostic(req);
  }

  // POST /api/diagnostic/configure - Modifier les questions (admin uniquement)
  if (path === "/api/diagnostic/configure" && method === "POST") {
    // Vérifier que l'utilisateur est connecté et est admin
    const authResponse = await authMiddleware(req);
    if (authResponse) return authResponse;
    
    const adminResponse = await adminMiddleware(req);
    if (adminResponse) return adminResponse;
    
    return diagnosticController.configureQuestions(req);
  }

  // Route de diagnostic non trouvée
  return new Response(JSON.stringify({ error: "Diagnostic route not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
} 