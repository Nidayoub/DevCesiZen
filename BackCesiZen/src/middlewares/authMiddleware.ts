import { parse } from "cookie";
import { verifyToken } from "../utils/jwt";
import { UserModel } from "../models/User";

/**
 * Middleware d'authentification
 * Vérifie si l'utilisateur est connecté via un token JWT
 * @param req Requête entrante
 * @returns Response d'erreur si non authentifié, null sinon
 */
export async function authMiddleware(req: Request): Promise<Response | null> {
  try {
    // Vérifier si un cookie de session est présent
    const cookies = req.headers.get("Cookie") || "";
    const parsedCookies = parse(cookies);
    const token = parsedCookies.authToken;
    
    if (!token) {
      return new Response(JSON.stringify({ 
        error: "Authentification requise"
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // Vérifier si le token JWT est valide
    try {
      const payload = await verifyToken(token);
      const userId = payload.userId;
      
      // Optionnel: vérifier que l'utilisateur existe toujours
      const user = await UserModel.findById(userId);
      if (!user) {
        return new Response(JSON.stringify({ 
          error: "Utilisateur non trouvé"
        }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Si on arrive ici, l'utilisateur est authentifié
      // On attache l'ID de l'utilisateur à la requête
      (req as any).userId = userId;
      return null;
    } catch (err) {
      return new Response(JSON.stringify({ 
        error: "Token invalide ou expiré"
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    
  } catch (error) {
    console.error("Erreur d'authentification:", error);
    return new Response(JSON.stringify({ 
      error: "Erreur lors de la vérification d'authentification"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
} 