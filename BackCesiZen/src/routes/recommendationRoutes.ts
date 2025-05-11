import { RecommendationController } from "../controllers/RecommendationController";

const recommendationController = new RecommendationController();

export async function recommendationRoutes(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  // GET /api/recommendations - Récupérer des recommandations personnalisées
  if (path === "/api/recommendations" && method === "GET") {
    return recommendationController.getRecommendations(req);
  }

  // Route de recommandations non trouvée
  return new Response(JSON.stringify({ error: "Recommendation route not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
} 