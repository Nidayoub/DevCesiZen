import { UserController } from "../controllers/userController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { adminMiddleware } from "../middlewares/adminMiddleware";

// Contrôleur des utilisateurs
const userController = new UserController();

// Routeur pour les utilisateurs
export async function userRoutes(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  // POST /api/register - Inscription d'un utilisateur
  if (path === "/api/register" && method === "POST") {
    return userController.register(req);
  }

  // POST /api/login - Connexion d'un utilisateur
  if (path === "/api/login" && method === "POST") {
    return userController.login(req);
  }

  // POST /api/logout - Déconnexion
  if (path === "/api/logout" && method === "POST") {
    // Vérifier que l'utilisateur est connecté
    const authResponse = await authMiddleware(req);
    if (authResponse) return authResponse;
    
    return userController.logout(req);
  }

  // GET /api/me - Informations sur l'utilisateur connecté
  if (path === "/api/me" && method === "GET") {
    // Vérifier que l'utilisateur est connecté
    const authResponse = await authMiddleware(req);
    if (authResponse) return authResponse;
    
    return userController.getProfile(req);
  }

  // DELETE /api/users/:id - Suppression d'un utilisateur (admin)
  if (path.match(/^\/api\/users\/\d+$/) && method === "DELETE") {
    // Vérifier que l'utilisateur est connecté et est admin
    const authResponse = await authMiddleware(req);
    if (authResponse) return authResponse;
    
    const adminResponse = await adminMiddleware(req);
    if (adminResponse) return adminResponse;
    
    const id = parseInt(path.split("/").pop() || "0");
    return userController.deleteUser(req, id);
  }

  // POST /api/forgot-password - Récupération de mot de passe
  if (path === "/api/forgot-password" && method === "POST") {
    return userController.forgotPassword(req);
  }

  // Route utilisateur non trouvée
  return new Response(JSON.stringify({ error: "User route not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
} 