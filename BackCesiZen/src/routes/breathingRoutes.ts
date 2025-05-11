import { BreathingController } from "../controllers/breathingController";

// Contrôleur des exercices de respiration
const breathingController = new BreathingController();

// Routeur pour les exercices de respiration
export async function breathingRoutes(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  // GET /api/breathing - Liste tous les exercices de respiration disponibles
  if (path === "/api/breathing" && method === "GET") {
    return breathingController.getAllExercises(req);
  }

  // GET /api/breathing/:id - Récupère un exercice de respiration spécifique
  if (path.match(/^\/api\/breathing\/\d+$/) && method === "GET") {
    const id = parseInt(path.split("/").pop() || "0");
    return breathingController.getExerciseById(req, id);
  }

  // GET /api/breathing/types - Récupère les différents types d'exercices disponibles
  if (path === "/api/breathing/types" && method === "GET") {
    return breathingController.getExerciseTypes(req);
  }

  // Route d'exercices de respiration non trouvée
  return new Response(JSON.stringify({ error: "Breathing exercise route not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
} 