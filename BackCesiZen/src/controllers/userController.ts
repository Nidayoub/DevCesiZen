import { UserModel } from "../models/userModel";
import { SessionModel } from "../models/sessionModel";
import { serialize } from "cookie";

/**
 * Contrôleur pour la gestion des utilisateurs
 */
export class UserController {
  private userModel: UserModel;
  private sessionModel: SessionModel;

  constructor() {
    this.userModel = new UserModel();
    this.sessionModel = new SessionModel();
  }

  /**
   * Inscription d'un nouvel utilisateur
   * @param req Requête
   * @returns Réponse
   */
  async register(req: Request): Promise<Response> {
    try {
      // Récupérer les données du corps de la requête
      const body = await req.json();
      const { email, username, password } = body;
      
      // Vérifier que tous les champs nécessaires sont présents
      if (!email || !username || !password) {
        return new Response(JSON.stringify({ 
          error: "Tous les champs sont obligatoires"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Vérifier que l'email n'est pas déjà utilisé
      const existingUserByEmail = await this.userModel.getByEmail(email);
      if (existingUserByEmail) {
        return new Response(JSON.stringify({ 
          error: "Cet email est déjà utilisé"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Vérifier que le nom d'utilisateur n'est pas déjà utilisé
      const existingUserByUsername = await this.userModel.getByUsername(username);
      if (existingUserByUsername) {
        return new Response(JSON.stringify({ 
          error: "Ce nom d'utilisateur est déjà utilisé"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Créer l'utilisateur
      const user = await this.userModel.createUser({
        email,
        username,
        password,
        isAdmin: false
      });
      
      // Créer une session pour l'utilisateur
      const session = await this.sessionModel.createSession(user.id);
      
      // Créer un cookie de session
      const cookie = serialize("sessionToken", session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7, // 7 jours
        path: "/"
      });
      
      // Renvoyer une réponse avec le cookie
      return new Response(JSON.stringify({ 
        message: "Inscription réussie",
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          isAdmin: user.isAdmin
        }
      }), {
        status: 201,
        headers: { 
          "Content-Type": "application/json",
          "Set-Cookie": cookie
        },
      });
      
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de l'inscription"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Connexion d'un utilisateur
   * @param req Requête
   * @returns Réponse
   */
  async login(req: Request): Promise<Response> {
    try {
      // Récupérer les données du corps de la requête
      const body = await req.json();
      const { email, password } = body;
      
      // Vérifier que tous les champs nécessaires sont présents
      if (!email || !password) {
        return new Response(JSON.stringify({ 
          error: "Email et mot de passe requis"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Vérifier les identifiants
      const user = await this.userModel.verifyCredentials(email, password);
      
      if (!user) {
        return new Response(JSON.stringify({ 
          error: "Identifiants incorrects"
        }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Créer une session pour l'utilisateur
      const session = await this.sessionModel.createSession(user.id);
      
      // Créer un cookie de session
      const cookie = serialize("sessionToken", session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7, // 7 jours
        path: "/"
      });
      
      // Renvoyer une réponse avec le cookie
      return new Response(JSON.stringify({ 
        message: "Connexion réussie",
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          isAdmin: user.isAdmin
        }
      }), {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Set-Cookie": cookie
        },
      });
      
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la connexion"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Déconnexion d'un utilisateur
   * @param req Requête
   * @returns Réponse
   */
  async logout(req: Request): Promise<Response> {
    try {
      // Récupérer le cookie de session
      const cookies = req.headers.get("Cookie") || "";
      const parsedCookies = require("cookie").parse(cookies);
      const sessionToken = parsedCookies.sessionToken;
      
      if (sessionToken) {
        // Supprimer la session
        await this.sessionModel.deleteByToken(sessionToken);
      }
      
      // Créer un cookie vide et expiré pour supprimer le cookie client
      const cookie = serialize("sessionToken", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 0, // Expire immédiatement
        path: "/"
      });
      
      return new Response(JSON.stringify({ 
        message: "Déconnexion réussie"
      }), {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Set-Cookie": cookie
        },
      });
      
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la déconnexion"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Récupère le profil de l'utilisateur connecté
   * @param req Requête
   * @returns Réponse
   */
  async getProfile(req: Request): Promise<Response> {
    try {
      // Récupérer l'ID de l'utilisateur depuis le middleware d'authentification
      const userId = (req as any).userId;
      
      // Récupérer l'utilisateur
      const user = await this.userModel.getById(userId);
      
      if (!user) {
        return new Response(JSON.stringify({ 
          error: "Utilisateur non trouvé"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Renvoyer les informations de l'utilisateur (sans le mot de passe)
      return new Response(JSON.stringify({ 
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          isAdmin: user.isAdmin,
          createdAt: user.createdAt
        }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      console.error("Erreur lors de la récupération du profil:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la récupération du profil"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Supprime un utilisateur (admin uniquement)
   * @param req Requête
   * @param userId ID de l'utilisateur à supprimer
   * @returns Réponse
   */
  async deleteUser(req: Request, userId: number): Promise<Response> {
    try {
      // Vérifier que l'utilisateur existe
      const user = await this.userModel.getById(userId);
      
      if (!user) {
        return new Response(JSON.stringify({ 
          error: "Utilisateur non trouvé"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Supprimer toutes les sessions de l'utilisateur
      await this.sessionModel.deleteByUserId(userId);
      
      // Supprimer l'utilisateur
      await this.userModel.delete(userId);
      
      return new Response(JSON.stringify({ 
        message: "Utilisateur supprimé avec succès"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la suppression de l'utilisateur"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Gère la récupération de mot de passe
   * @param req Requête
   * @returns Réponse
   */
  async forgotPassword(req: Request): Promise<Response> {
    try {
      // Récupérer les données du corps de la requête
      const body = await req.json();
      const { email } = body;
      
      if (!email) {
        return new Response(JSON.stringify({ 
          error: "Email requis"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Vérifier si l'utilisateur existe
      const user = await this.userModel.getByEmail(email);
      
      // Pour des raisons de sécurité, ne pas indiquer si l'email existe ou non
      return new Response(JSON.stringify({ 
        message: "Si cet email est associé à un compte, vous recevrez un lien de réinitialisation"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      console.error("Erreur lors de la récupération de mot de passe:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la récupération de mot de passe"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
} 