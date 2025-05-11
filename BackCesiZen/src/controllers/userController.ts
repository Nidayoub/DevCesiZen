import { User, UserModel } from "../models/User";
import { SessionModel } from "../models/sessionModel";
import bcrypt from "bcryptjs";
import { serialize } from "cookie";
import crypto from "crypto";
import { sendEmail } from "../utils/email";

/**
 * Contrôleur pour la gestion des utilisateurs
 */
export class UserController {
  private sessionModel: SessionModel;

  constructor() {
    this.sessionModel = new SessionModel();
  }

  /**
   * Inscription d'un utilisateur
   */
  async register(req: Request): Promise<Response> {
    try {
      console.log("📝 Tentative d'inscription d'un nouvel utilisateur");
      
      const body = await req.json();
      console.log("📝 Données reçues:", JSON.stringify(body));
      
      const { email, password, firstname, lastname } = body;

      // Validation des données
      if (!email || !password || !firstname || !lastname) {
        console.log("❌ Inscription échouée: Données incomplètes", { email, firstname, lastname });
        return new Response(
          JSON.stringify({
            error: "Tous les champs sont obligatoires",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Vérifier si l'utilisateur existe déjà
      console.log("🔍 Vérification si l'email existe déjà:", email);
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        console.log("❌ Inscription échouée: Email déjà utilisé:", email);
        return new Response(
          JSON.stringify({
            error: "Cet email est déjà utilisé",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Créer l'utilisateur
      console.log("👤 Création de l'utilisateur:", email);
      const user = await UserModel.create({
        email,
        password,
        firstname,
        lastname,
        role: "user"
      });
      console.log("✅ Utilisateur créé avec succès, ID:", user.id);

      // Créer une session
      console.log("🔑 Création d'une session pour l'utilisateur:", user.id);
      const sessionToken = crypto.randomBytes(32).toString("hex");
      const expiration = new Date();
      expiration.setDate(expiration.getDate() + 7); // Session de 7 jours

      await this.sessionModel.create({
        userId: user.id!,
        token: sessionToken,
        expiration,
      });
      console.log("✅ Session créée avec succès");

      // Créer un cookie de session
      const cookie = serialize("sessionToken", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60, // 7 jours en secondes
        path: "/",
      });
      console.log("🍪 Cookie de session créé");

      // Retourner les données sans le mot de passe
      const { password: _, ...userWithoutPassword } = user;
      console.log("🚀 Inscription réussie pour:", email);

      return new Response(JSON.stringify(userWithoutPassword), {
        status: 201,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": cookie,
        },
      });
    } catch (error) {
      console.error("❌ ERREUR CRITIQUE lors de l'inscription:", error);
      if (error instanceof Error) {
        console.error("Message d'erreur:", error.message);
        console.error("Stack trace:", error.stack);
      }
      return new Response(
        JSON.stringify({
          error: "Erreur lors de l'inscription",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  /**
   * Connexion d'un utilisateur
   */
  async login(req: Request): Promise<Response> {
    try {
      console.log("🔑 Tentative de connexion");
      
      const body = await req.json();
      console.log("🔑 Données de connexion reçues pour:", body.email);
      
      const { email, password } = body;

      // Validation des données
      if (!email || !password) {
        console.log("❌ Connexion échouée: Données incomplètes");
        return new Response(
          JSON.stringify({
            error: "Email et mot de passe requis",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Vérifier les identifiants
      console.log("🔍 Recherche de l'utilisateur:", email);
      const user = await UserModel.findByEmail(email);
      if (!user) {
        console.log("❌ Connexion échouée: Utilisateur non trouvé:", email);
        return new Response(
          JSON.stringify({
            error: "Identifiants invalides",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Vérifier le mot de passe
      console.log("🔐 Vérification du mot de passe pour:", email);
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        console.log("❌ Connexion échouée: Mot de passe incorrect pour:", email);
        return new Response(
          JSON.stringify({
            error: "Identifiants invalides",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Créer une session
      const sessionToken = crypto.randomBytes(32).toString("hex");
      const expiration = new Date();
      expiration.setDate(expiration.getDate() + 7); // Session de 7 jours

      await this.sessionModel.create({
        userId: user.id!,
        token: sessionToken,
        expiration,
      });

      // Créer un cookie de session
      const cookie = serialize("sessionToken", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60, // 7 jours en secondes
        path: "/",
      });

      // Retourner les données sans le mot de passe
      const { password: _, ...userWithoutPassword } = user;

      return new Response(JSON.stringify(userWithoutPassword), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": cookie,
        },
      });
    } catch (error) {
      console.error("❌ ERREUR CRITIQUE lors de la connexion:", error);
      if (error instanceof Error) {
        console.error("Message d'erreur:", error.message);
        console.error("Stack trace:", error.stack);
      }
      return new Response(
        JSON.stringify({
          error: "Erreur lors de la connexion",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  /**
   * Déconnexion de l'utilisateur
   */
  async logout(req: Request): Promise<Response> {
    try {
      console.log("🚪 Tentative de déconnexion");
      
      // Récupérer le token depuis les cookies
      const cookies = req.headers.get("Cookie") || "";
      console.log("🍪 Cookies reçus:", cookies);
      
      // Parse les cookies correctement
      const parsedCookies = Object.fromEntries(
        cookies.split(';')
          .map(cookie => cookie.trim().split('='))
          .filter(parts => parts.length === 2)
          .map(([key, value]) => [key, decodeURIComponent(value)])
      );
      
      const sessionToken = parsedCookies.sessionToken;
      console.log("🔑 Session token trouvé:", sessionToken ? "Oui" : "Non");

      if (sessionToken) {
        // Supprimer la session de la base de données
        console.log("🗑️ Suppression de la session");
        await this.sessionModel.deleteByToken(sessionToken);
        console.log("✅ Session supprimée avec succès");
      }

      // Supprimer le cookie
      const cookie = serialize("sessionToken", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 0, // Expiration immédiate
        path: "/",
      });
      console.log("🍪 Cookie de session invalidé");

      return new Response(
        JSON.stringify({
          message: "Déconnexion réussie",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": cookie,
          },
        }
      );
    } catch (error) {
      console.error("❌ ERREUR CRITIQUE lors de la déconnexion:", error);
      if (error instanceof Error) {
        console.error("Message d'erreur:", error.message);
        console.error("Stack trace:", error.stack);
      }
      return new Response(
        JSON.stringify({
          error: "Erreur lors de la déconnexion",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  /**
   * Récupérer le profil de l'utilisateur connecté
   */
  async getProfile(req: Request): Promise<Response> {
    try {
      const userId = (req as any).userId;
      const user = await UserModel.findById(userId);

      if (!user) {
        return new Response(
          JSON.stringify({
            error: "Utilisateur non trouvé",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Retourner les données sans le mot de passe
      const { password, ...userWithoutPassword } = user;

      return new Response(JSON.stringify(userWithoutPassword), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Erreur de récupération profil:", error);
      return new Response(
        JSON.stringify({
          error: "Erreur lors de la récupération du profil",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  /**
   * Suppression d'un utilisateur (admin uniquement)
   */
  async deleteUser(req: Request, id: number): Promise<Response> {
    try {
      // Vérifier si l'utilisateur existe
      const user = await UserModel.findById(id);
      if (!user) {
        return new Response(
          JSON.stringify({
            error: "Utilisateur non trouvé",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Supprimer l'utilisateur
      await UserModel.delete(id);

      return new Response(
        JSON.stringify({
          message: "Utilisateur supprimé avec succès",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Erreur de suppression utilisateur:", error);
      return new Response(
        JSON.stringify({
          error: "Erreur lors de la suppression de l'utilisateur",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  /**
   * Récupération de mot de passe
   */
  async forgotPassword(req: Request): Promise<Response> {
    try {
      console.log("🔑 Tentative de récupération de mot de passe");
      
      const body = await req.json();
      const { email } = body;

      if (!email) {
        console.log("❌ Email manquant pour la récupération de mot de passe");
        return new Response(
          JSON.stringify({
            error: "Email requis",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const user = await UserModel.findByEmail(email);
      if (!user) {
        // Pour des raisons de sécurité, ne pas indiquer si l'email existe ou non
        console.log("ℹ️ Email non trouvé dans la base de données:", email);
        return new Response(
          JSON.stringify({
            message:
              "Si votre adresse email est correcte, vous recevrez un lien de réinitialisation",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Générer un token simple basé sur l'email et un secret
      // Ce token ne sera pas stocké en base de données, mais sera validé lors de la réinitialisation
      const secret = process.env.JWT_SECRET || 'default_secret';
      const timestamp = Date.now();
      const dataToEncrypt = `${user.id}-${user.email}-${timestamp}`;
      const resetToken = crypto
        .createHmac('sha256', secret)
        .update(dataToEncrypt)
        .digest('hex');
      
      console.log("🔑 Token de réinitialisation généré pour:", email);
      
      // Créer le lien avec des données validables (userid, timestamp, token)
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      // Le token expire dans 1 heure
      const expiry = timestamp + 3600000; // 1 heure en millisecondes
      const resetLink = `${frontendUrl}/reset-password?id=${user.id}&timestamp=${timestamp}&expiry=${expiry}&token=${resetToken}`;
      
      // Envoyer l'email de réinitialisation
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Réinitialisation de votre mot de passe</h2>
          <p>Bonjour ${user.firstname},</p>
          <p>Vous avez demandé la réinitialisation de votre mot de passe. Veuillez cliquer sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Réinitialiser mon mot de passe
            </a>
          </div>
          <p>Ce lien expirera dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
          <p>Cordialement,<br>L'équipe CesiZen</p>
        </div>
      `;
      
      await sendEmail({
        to: email,
        subject: 'Réinitialisation de votre mot de passe - CesiZen',
        html
      });
      
      console.log("📧 Email de réinitialisation envoyé à:", email);
      
      return new Response(
        JSON.stringify({
          message: "Si votre adresse email est correcte, vous recevrez un lien de réinitialisation",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("❌ ERREUR CRITIQUE lors de la récupération de mot de passe:", error);
      if (error instanceof Error) {
        console.error("Message d'erreur:", error.message);
        console.error("Stack trace:", error.stack);
      }
      return new Response(
        JSON.stringify({
          error: "Erreur lors de la demande de récupération",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  /**
   * Réinitialisation de mot de passe avec un token
   */
  async resetPassword(req: Request): Promise<Response> {
    try {
      console.log("🔄 Tentative de réinitialisation de mot de passe");
      
      const body = await req.json();
      const { id, timestamp, expiry, token, password } = body;

      if (!id || !timestamp || !expiry || !token || !password) {
        console.log("❌ Paramètres manquants pour la réinitialisation");
        return new Response(
          JSON.stringify({
            error: "Tous les paramètres sont requis",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Vérifier que le token n'est pas expiré
      const now = Date.now();
      if (now > parseInt(expiry)) {
        console.log("❌ Token expiré");
        return new Response(
          JSON.stringify({
            error: "Le lien de réinitialisation a expiré",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Récupérer l'utilisateur
      const user = await UserModel.findById(parseInt(id));
      if (!user) {
        console.log("❌ Utilisateur non trouvé");
        return new Response(
          JSON.stringify({
            error: "Utilisateur non trouvé",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Recréer le token pour vérification
      const secret = process.env.JWT_SECRET || 'default_secret';
      const dataToEncrypt = `${id}-${user.email}-${timestamp}`;
      const expectedToken = crypto
        .createHmac('sha256', secret)
        .update(dataToEncrypt)
        .digest('hex');
      
      // Vérifier que le token est valide
      if (token !== expectedToken) {
        console.log("❌ Token invalide");
        return new Response(
          JSON.stringify({
            error: "Lien de réinitialisation invalide",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Mettre à jour le mot de passe
      console.log("🔄 Mise à jour du mot de passe pour l'utilisateur:", user.id);
      await UserModel.update(user.id!, {
        password,
      });
      console.log("✅ Mot de passe réinitialisé avec succès pour:", user.email);

      return new Response(
        JSON.stringify({
          message: "Mot de passe réinitialisé avec succès",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("❌ ERREUR CRITIQUE lors de la réinitialisation de mot de passe:", error);
      if (error instanceof Error) {
        console.error("Message d'erreur:", error.message);
        console.error("Stack trace:", error.stack);
      }
      return new Response(
        JSON.stringify({
          error: "Erreur lors de la réinitialisation du mot de passe",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }
} 