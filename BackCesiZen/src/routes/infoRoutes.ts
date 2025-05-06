import { InfoController } from "../controllers/infoController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { adminMiddleware } from "../middlewares/adminMiddleware";

// Contrôleur des informations
const infoController = new InfoController();

// Routeur pour les informations
export async function infoRoutes(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  // GET /api/info - Liste des pages disponibles
  if (path === "/api/info" && method === "GET") {
    return infoController.getInfoList(req);
  }

  // GET /api/info/:slug - Récupérer une page par son slug
  if (path.match(/^\/api\/info\/[a-z0-9-]+$/) && method === "GET") {
    const slug = path.split("/").pop() || "";
    return infoController.getInfoBySlug(req, slug);
  }

  // POST /api/info - Créer ou modifier une page (admin uniquement)
  if (path === "/api/info" && method === "POST") {
    // Vérifier que l'utilisateur est connecté et est admin
    const authResponse = await authMiddleware(req);
    if (authResponse) return authResponse;
    
    const adminResponse = await adminMiddleware(req);
    if (adminResponse) return adminResponse;
    
    return infoController.createOrUpdateInfo(req);
  }

  // DELETE /api/info/:id - Supprimer une page (admin uniquement)
  if (path.match(/^\/api\/info\/\d+$/) && method === "DELETE") {
    // Vérifier que l'utilisateur est connecté et est admin
    const authResponse = await authMiddleware(req);
    if (authResponse) return authResponse;
    
    const adminResponse = await adminMiddleware(req);
    if (adminResponse) return adminResponse;
    
    const id = parseInt(path.split("/").pop() || "0");
    return infoController.deleteInfo(req, id);
  }

  // Route d'informations non trouvée
  return new Response(JSON.stringify({ error: "Info route not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
} 