import { UserModel } from "../models/User";
import { authMiddleware } from "./authMiddleware";

/**
 * Middleware d'administration
 * Vérifie si l'utilisateur connecté est administrateur
 * @param req Requête entrante
 * @returns Response d'erreur si non admin, null sinon
 */
export async function adminMiddleware(req: Request): Promise<Response | null> {
  try {
    // D'abord vérifier l'authentification
    const authError = await authMiddleware(req);
    if (authError) {
      return authError;
    }
    
    // Récupérer l'ID utilisateur (défini par authMiddleware)
    const userId = (req as any).userId;
    if (!userId) {
      return new Response(JSON.stringify({ 
        error: "Authentification requise"
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // Vérifier si l'utilisateur est admin
    const user = await UserModel.findById(userId);
    
    if (!user || (user.role !== 'admin' && user.role !== 'super-admin')) {
      return new Response(JSON.stringify({ 
        error: "Accès non autorisé - privilèges administrateur requis"
      }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // Si on arrive ici, l'utilisateur est admin
    return null;
    
  } catch (error) {
    console.error("Erreur middleware admin:", error);
    return new Response(JSON.stringify({ 
      error: "Erreur lors de la vérification des droits d'administration"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
} 