import { UserModel } from "../models/userModel";

/**
 * Middleware pour vérifier les droits administrateur
 * Nécessite que le middleware d'authentification ait été exécuté avant
 * @param req Requête entrante
 * @returns Response d'erreur si l'utilisateur n'est pas admin, null sinon
 */
export async function adminMiddleware(req: Request): Promise<Response | null> {
  try {
    // Récupérer l'ID de l'utilisateur depuis le middleware d'authentification
    const userId = (req as any).userId;
    
    if (!userId) {
      return new Response(JSON.stringify({ 
        error: "Utilisateur non identifié"
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // Vérifier si l'utilisateur est admin
    const userModel = new UserModel();
    const user = await userModel.getById(userId);
    
    if (!user || !user.isAdmin) {
      return new Response(JSON.stringify({ 
        error: "Droits administrateur requis"
      }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // Si on arrive ici, l'utilisateur est admin
    return null;
    
  } catch (error) {
    console.error("Erreur de vérification admin:", error);
    return new Response(JSON.stringify({ 
      error: "Erreur lors de la vérification des droits administrateur"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
} 