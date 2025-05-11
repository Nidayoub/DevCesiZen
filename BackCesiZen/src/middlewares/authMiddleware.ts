import { parse } from "cookie";
import { SessionModel } from "../models/sessionModel";

/**
 * Middleware d'authentification
 * Vérifie si l'utilisateur est connecté via un sessionToken
 * @param req Requête entrante
 * @returns Response d'erreur si non authentifié, null sinon
 */
export async function authMiddleware(req: Request): Promise<Response | null> {
  try {
    // Vérifier si un cookie de session est présent
    const cookies = req.headers.get("Cookie") || "";
    const parsedCookies = parse(cookies);
    const sessionToken = parsedCookies.sessionToken;
    
    if (!sessionToken) {
      return new Response(JSON.stringify({ 
        error: "Authentification requise"
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // Vérifier si la session est valide
    const sessionModel = new SessionModel();
    const session = await sessionModel.getByToken(sessionToken);
    
    if (!session || session.expiration < new Date()) {
      return new Response(JSON.stringify({ 
        error: "Session expirée ou invalide"
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // Si on arrive ici, l'utilisateur est authentifié
    // On attache l'ID de l'utilisateur à la requête
    (req as any).userId = session.userId;
    return null;
    
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