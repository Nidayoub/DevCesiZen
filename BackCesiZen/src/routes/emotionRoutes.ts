import { EmotionController } from "../controllers/EmotionController";
import { authMiddleware } from "../middlewares/authMiddleware";

const emotionController = new EmotionController();

export async function emotionRoutes(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  // GET /api/emotions - Récupérer toutes les émotions disponibles
  if (path === "/api/emotions" && method === "GET") {
    return emotionController.getAllEmotions(req);
  }

  // POST /api/emotions - Créer une nouvelle émotion personnalisée (utilisateur connecté)
  if (path === "/api/emotions" && method === "POST") {
    const authResponse = await authMiddleware(req);
    if (authResponse) return authResponse;
    return emotionController.createEmotion(req);
  }

  // PUT /api/emotions/:id - Modifier une émotion personnalisée (utilisateur connecté)
  if (path.match(/^\/api\/emotions\/\d+$/) && method === "PUT") {
    const authResponse = await authMiddleware(req);
    if (authResponse) return authResponse;
    const id = parseInt(path.split("/").pop() || "0");
    return emotionController.updateEmotion(req, id);
  }

  // DELETE /api/emotions/:id - Supprimer une émotion personnalisée (utilisateur connecté)
  if (path.match(/^\/api\/emotions\/\d+$/) && method === "DELETE") {
    const authResponse = await authMiddleware(req);
    if (authResponse) return authResponse;
    const id = parseInt(path.split("/").pop() || "0");
    return emotionController.deleteEmotion(req, id);
  }

  // GET /api/emotions/entries - Récupérer les entrées du journal d'émotions d'un utilisateur
  if (path === "/api/emotions/entries" && method === "GET") {
    const authResponse = await authMiddleware(req);
    if (authResponse) return authResponse;
    return emotionController.getUserEmotionEntries(req);
  }

  // POST /api/emotions/entries - Ajouter une entrée au journal d'émotions
  if (path === "/api/emotions/entries" && method === "POST") {
    const authResponse = await authMiddleware(req);
    if (authResponse) return authResponse;
    return emotionController.createEmotionEntry(req);
  }

  // PUT /api/emotions/entries/:id - Modifier une entrée du journal d'émotions
  if (path.match(/^\/api\/emotions\/entries\/\d+$/) && method === "PUT") {
    const authResponse = await authMiddleware(req);
    if (authResponse) return authResponse;
    const id = parseInt(path.split("/").pop() || "0");
    return emotionController.updateEmotionEntry(req, id);
  }

  // DELETE /api/emotions/entries/:id - Supprimer une entrée du journal d'émotions
  if (path.match(/^\/api\/emotions\/entries\/\d+$/) && method === "DELETE") {
    const authResponse = await authMiddleware(req);
    if (authResponse) return authResponse;
    const id = parseInt(path.split("/").pop() || "0");
    return emotionController.deleteEmotionEntry(req, id);
  }

  // GET /api/emotions/report - Générer un rapport sur les émotions
  if (path === "/api/emotions/report" && method === "GET") {
    const authResponse = await authMiddleware(req);
    if (authResponse) return authResponse;
    return emotionController.getEmotionReport(req);
  }

  // Route d'émotions non trouvée
  return new Response(JSON.stringify({ error: "Emotion route not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
} 