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

  console.log(`[infoRoutes] Entrée: method=${method}, path=${path}`);

  // --- Specific static routes first ---
  // GET /api/info/resources - Liste de toutes les ressources d'information
  if (path === "/api/info/resources" && method === "GET") {
    console.log("DÉBUG: Route /api/info/resources appelée");
    try {
      const response = await infoController.getInfoResources(req);
      // console.log("DÉBUG: Réponse de getInfoResources:", await response.clone().text()); // Be careful with consuming the response body
      return response;
    } catch (error) {
      console.error("DÉBUG: Erreur dans la route /api/info/resources:", error);
      return new Response(JSON.stringify({ error: "Erreur serveur interne" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // GET /api/info/tags - Récupérer tous les tags disponibles
  if (path === "/api/info/tags" && method === "GET") {
    return infoController.getAllTags(req);
  }
  
  // GET /api/info - Liste des pages disponibles
  if (path === "/api/info" && method === "GET") {
    return infoController.getInfoList(req);
  }

  // --- Dynamic routes with parameters next ---
  // GET /api/info/resources/:id - Récupérer une ressource d'information par son ID
  if (path.match(/^\/api\/info\/resources\/\d+$/) && method === "GET") {
    const id = parseInt(path.split("/").pop() || "0");
    return infoController.getInfoResourceById(req, id);
  }

  // GET /api/info/resources/category/:category - Récupérer les ressources par catégorie
  if (path.match(/^\/api\/info\/resources\/category\/[^\/]+$/) && method === "GET") {
    const category = path.split("/").pop() || "";
    return infoController.getInfoResourcesByCategory(req, category);
  }

  // GET /api/info/resources/tag/:tag - Récupérer les ressources par tag
  if (path.match(/^\/api\/info\/resources\/tag\/[^\/]+$/) && method === "GET") {
    const tag = path.split("/").pop() || "";
    return infoController.getInfoResourcesByTag(req, tag);
  }

  // GET /api/info/:slug - Récupérer une page par son slug (must be last of the general GETs for /api/info)
  // This regex uses a negative lookahead to ensure "slug" is not "resources" or "tags" or other reserved paths if they were part of this structure
  if (path.match(/^\/api\/info\/(?!resources|tags|admin)[a-z0-9-]+$/) && method === "GET") {
    const slug = path.split("/").pop() || "";
    return infoController.getInfoBySlug(req, slug);
  }
  
  // --- ADMIN & OTHER POST/PUT/DELETE Routes ---
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

  // POST /api/info/resources - Créer une nouvelle ressource d'information (admin uniquement)
  if (path === "/api/info/resources" && method === "POST") {
    const authResponse = await authMiddleware(req);
    if (authResponse) return authResponse;
    
    const adminResponse = await adminMiddleware(req);
    if (adminResponse) return adminResponse;
    
    return infoController.createInfoResource(req);
  }

  // PUT /api/info/resources/:id - Mettre à jour une ressource d'information (admin uniquement)
  if (path.match(/^\/api\/info\/resources\/\d+$/) && method === "PUT") {
    const authResponse = await authMiddleware(req);
    if (authResponse) return authResponse;
    
    const adminResponse = await adminMiddleware(req);
    if (adminResponse) return adminResponse;
    
    const id = parseInt(path.split("/").pop() || "0");
    return infoController.updateInfoResource(req, id);
  }

  // DELETE /api/info/resources/:id - Supprimer une ressource d'information (admin uniquement)
  if (path.match(/^\/api\/info\/resources\/\d+$/) && method === "DELETE") {
    const authResponse = await authMiddleware(req);
    if (authResponse) return authResponse;
    
    const adminResponse = await adminMiddleware(req);
    if (adminResponse) return adminResponse;
    
    const id = parseInt(path.split("/").pop() || "0");
    return infoController.deleteInfoResource(req, id);
  }

  // --- ROUTES POUR LES INTERACTIONS (LIKES, COMMENTAIRES, PARTAGES) ---

  // GET /api/info/resources/:id/comments - Récupérer les commentaires d'une ressource
  if (path.match(/^\/api\/info\/resources\/\d+\/comments$/) && method === "GET") {
    const resourceId = parseInt(path.split("/")[4] || "0");
    return infoController.getInfoResourceComments(req, resourceId);
  }

  // POST /api/info/resources/:id/comments - Ajouter un commentaire à une ressource (utilisateur connecté)
  if (path.match(/^\/api\/info\/resources\/\d+\/comments$/) && method === "POST") {
    const authResponse = await authMiddleware(req);
    if (authResponse) return authResponse;
    
    const resourceId = parseInt(path.split("/")[4] || "0");
    return infoController.addCommentToInfoResource(req, resourceId);
  }

  // DELETE /api/info/resources/:resourceId/comments/:commentId - Supprimer un commentaire (propriétaire ou admin)
  if (path.match(/^\/api\/info\/resources\/\d+\/comments\/\d+$/) && method === "DELETE") {
    const authResponse = await authMiddleware(req);
    if (authResponse) return authResponse;
    
    const resourceId = parseInt(path.split("/")[4] || "0");
    const commentId = parseInt(path.split("/")[6] || "0");
    return infoController.deleteInfoResourceComment(req, resourceId, commentId);
  }

  // POST /api/info/resources/:id/likes - Ajouter/Retirer un like à une ressource (utilisateur connecté)
  if (path.match(/^\/api\/info\/resources\/\d+\/likes$/) && method === "POST") {
    const authResponse = await authMiddleware(req);
    if (authResponse) return authResponse;
    
    const resourceId = parseInt(path.split("/")[4] || "0");
    return infoController.toggleLikeInfoResource(req, resourceId);
  }

  // GET /api/info/resources/:id/likes - Vérifier si l'utilisateur a liké une ressource
  if (path.match(/^\/api\/info\/resources\/\d+\/likes$/) && method === "GET") {
    const resourceId = parseInt(path.split("/")[4] || "0");
    return infoController.checkUserLikedInfoResource(req, resourceId);
  }

  // POST /api/info/resources/:id/shares - Incrémenter le compteur de partages
  if (path.match(/^\/api\/info\/resources\/\d+\/shares$/) && method === "POST") {
    const resourceId = parseInt(path.split("/")[4] || "0");
    return infoController.incrementInfoResourceShares(req, resourceId);
  }

  // Route d'informations non trouvée
  return new Response(JSON.stringify({ error: "Info route not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
} 