import { UserModel } from '../models/User';
import { generateToken, verifyToken } from '../utils/jwt';
import bcrypt from 'bcryptjs';
import { serialize } from 'cookie';
import { generateVerificationToken, sendVerificationEmail } from '../utils/email';

export class AuthController {
  static async register(req: Request) {
    try {
      console.log("🔐 AuthController.register - Début de l'inscription");
      const body = await req.json();
      console.log("📝 Données reçues:", JSON.stringify({...body, password: '***MASKED***'}));
      const { email, password, firstname, lastname } = body;

      // Vérifier si l'utilisateur existe déjà
      console.log("🔍 Vérification si l'utilisateur existe déjà:", email);
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        console.log("❌ Inscription impossible: Email déjà utilisé:", email);
        return new Response(JSON.stringify({ error: 'Email déjà utilisé' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Générer un token de vérification
      console.log("🔑 Génération du token de vérification d'email");
      const verification = generateVerificationToken();

      // Tenter d'envoyer l'email de vérification AVANT de créer l'utilisateur
      try {
        console.log("📧 Envoi de l'email de vérification à:", email);
        await sendVerificationEmail(email, verification.token, firstname);
        console.log("📧 Email de vérification envoyé avec succès");
      } catch (emailError) {
        console.error("❌ Erreur lors de l'envoi de l'email de vérification:", emailError);
        // Retourner une erreur au lieu de continuer
        return new Response(
          JSON.stringify({ 
            error: 'Impossible d\'envoyer l\'email de vérification. Veuillez réessayer plus tard.' 
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Créer le nouvel utilisateur seulement si l'email a été envoyé avec succès
      console.log("👤 Création du nouvel utilisateur:", email);
      const user = await UserModel.create({
        email,
        password,
        firstname,
        lastname,
        role: 'user',
        is_verified: false,
        verification_token: verification.token,
        verification_expires: verification.expires.toISOString()
      });
      console.log("✅ Utilisateur créé avec succès, ID:", user.id);

      // Ne pas générer de token JWT pour la connexion automatique
      // L'utilisateur devra vérifier son email avant de pouvoir se connecter

      return new Response(
        JSON.stringify({
          success: true,
          message: "Inscription réussie! Veuillez vérifier votre adresse e-mail pour activer votre compte. Vous ne pourrez pas vous connecter tant que vous n'aurez pas cliqué sur le lien envoyé par email."
        }),
        {
          status: 201,
          headers: {
            "Content-Type": "application/json"
          },
        }
      );
    } catch (error) {
      console.error("❌ Erreur lors de l'inscription:", error);
      return new Response(
        JSON.stringify({ error: "Erreur lors de l'inscription" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  // Ajouter cette méthode pour la vérification de l'email
  static async verifyEmail(req: Request) {
    try {
      console.log("🔐 AuthController.verifyEmail - Vérification du token");
      const url = new URL(req.url);
      const token = url.searchParams.get('token');

      if (!token) {
        console.log("❌ Pas de token fourni");
        return new Response(JSON.stringify({ error: 'Token non valide' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Trouver l'utilisateur avec ce token
      console.log("🔍 Recherche de l'utilisateur avec le token:", token);
      const user = await UserModel.findByVerificationToken(token);
      
      if (!user) {
        console.log("❌ Aucun utilisateur trouvé avec ce token");
        return new Response(JSON.stringify({ error: 'Token non valide ou expiré' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Vérifier si le token a expiré
      const tokenExpiry = new Date(user.verification_expires!);
      if (tokenExpiry < new Date()) {
        console.log("❌ Token expiré");
        return new Response(JSON.stringify({ error: 'Token expiré. Veuillez demander un nouveau lien de vérification.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Marquer l'utilisateur comme vérifié
      console.log("✅ Validation du compte utilisateur:", user.email);
      await UserModel.update(user.id!, {
        is_verified: true,
        verification_token: '',
        verification_expires: ''
      });

      return new Response(JSON.stringify({ 
        success: true,
        message: 'Email vérifié avec succès. Vous pouvez maintenant vous connecter.' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error("❌ Erreur lors de la vérification de l'email:", error);
      return new Response(JSON.stringify({ error: 'Erreur lors de la vérification de l\'email' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  static async login(req: Request) {
    try {
      console.log("🔐 AuthController.login - Tentative de connexion");
      const body = await req.json();
      console.log("📝 Données reçues:", body.email);
      const { email, password } = body;

      // Trouver l'utilisateur
      console.log("🔍 Recherche de l'utilisateur:", email);
      const user = await UserModel.findByEmail(email);
      if (!user) {
        console.log("❌ Connexion échouée: Utilisateur non trouvé:", email);
        return new Response(
          JSON.stringify({ error: 'Email ou mot de passe incorrect' }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Vérifier le mot de passe
      console.log("🔒 Vérification du mot de passe pour:", email);
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        console.log("❌ Connexion échouée: Mot de passe incorrect pour:", email);
        return new Response(
          JSON.stringify({ error: 'Email ou mot de passe incorrect' }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Vérifier si l'adresse email est vérifiée
      if (!user.is_verified) {
        console.log("❌ Connexion échouée: Email non vérifié pour:", email);
        return new Response(
          JSON.stringify({ 
            error: 'Veuillez vérifier votre adresse email avant de vous connecter. Vérifiez votre boîte de réception pour le lien de vérification.'
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Générer le token
      console.log("🔑 Génération du token JWT pour:", email);
      const token = await generateToken({
        userId: user.id!,
        email: user.email,
        role: user.role
      });
      console.log("✅ Token généré avec succès");

      // Créer un cookie HTTP-only avec le token
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict" as const,
        maxAge: 7 * 24 * 60 * 60, // 7 jours en secondes
        path: "/"
      };
      
      const authCookie = serialize("authToken", token, cookieOptions);
      console.log("🍪 Cookie HTTP-only créé avec le token JWT");

      console.log("✅ Connexion réussie pour:", email);
      
      // Retourner les données utilisateur sans mot de passe, mais avec le token en cookie
      const { password: _, ...userWithoutPassword } = user;
      return new Response(
        JSON.stringify({ user: userWithoutPassword }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': authCookie
          }
        }
      );
    } catch (error) {
      console.error("❌ ERREUR CRITIQUE lors de la connexion:", error);
      if (error instanceof Error) {
        console.error("Message d'erreur:", error.message);
        console.error("Stack trace:", error.stack);
      }
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la connexion' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  static async getCurrentUser(req: Request) {
    try {
      console.log("👤 AuthController.getCurrentUser - Récupération du profil");
      
      // Récupérer le token depuis les cookies
      const cookies = req.headers.get('Cookie') || '';
      const cookieMap = Object.fromEntries(
        cookies.split(';')
          .map(cookie => cookie.trim().split('='))
          .filter(parts => parts.length === 2)
          .map(([key, value]) => [key, decodeURIComponent(value)])
      );
      
      const token = cookieMap.authToken;
      console.log("🔑 Token dans les cookies:", token ? "Trouvé" : "Non trouvé");
      
      if (!token) {
        console.log("❌ Token non fourni dans les cookies");
        return new Response(JSON.stringify({ error: 'Token non fourni' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Vérifier le token
      try {
        console.log("🔍 Vérification du token JWT");
        const payload = await verifyToken(token);
        const userId = payload.userId;
        console.log("✅ Token vérifié avec succès, userId:", userId);

        // Récupérer l'utilisateur
        console.log("🔍 Récupération des informations utilisateur, ID:", userId);
        const user = await UserModel.findById(userId);
        if (!user) {
          console.log("❌ Utilisateur non trouvé pour l'ID:", userId);
          return new Response(JSON.stringify({ error: 'Utilisateur non trouvé' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        console.log("✅ Utilisateur trouvé:", user.email);

        // Vérifier si l'utilisateur a confirmé son compte
        if (!user.is_verified) {
          console.log("❌ Accès refusé: Email non vérifié pour:", user.email);
          return new Response(JSON.stringify({ 
            error: 'Veuillez vérifier votre adresse email pour accéder à votre compte.'
          }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Retourner les infos utilisateur (sans le mot de passe)
        const { password, ...userWithoutPassword } = user;
        console.log("🚀 Retour du profil utilisateur pour:", user.email);
        
        return new Response(JSON.stringify(userWithoutPassword), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error("❌ Erreur de vérification du token:", error);
        if (error instanceof Error) {
          console.error("Message d'erreur:", error.message);
        }
        return new Response(JSON.stringify({ error: 'Token invalide' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (error) {
      console.error("❌ ERREUR CRITIQUE lors de la récupération du profil:", error);
      if (error instanceof Error) {
        console.error("Message d'erreur:", error.message);
        console.error("Stack trace:", error.stack);
      }
      return new Response(JSON.stringify({ error: 'Erreur lors de la récupération de l\'utilisateur' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  static async logout(req: Request) {
    try {
      console.log("🚪 AuthController.logout - Déconnexion");
      
      // Créer un cookie expiré pour supprimer le token
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict" as const,
        maxAge: 0, // Expire immédiatement
        path: "/"
      };
      
      const authCookie = serialize("authToken", "", cookieOptions);
      console.log("🍪 Cookie de déconnexion créé");
      
      return new Response(JSON.stringify({ 
        message: "Déconnexion réussie" 
      }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Set-Cookie': authCookie
        }
      });
    } catch (error) {
      console.error("❌ ERREUR CRITIQUE lors de la déconnexion:", error);
      if (error instanceof Error) {
        console.error("Message d'erreur:", error.message);
        console.error("Stack trace:", error.stack);
      }
      return new Response(JSON.stringify({ error: 'Erreur lors de la déconnexion' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  static async resendVerificationEmail(req: Request) {
    try {
      console.log("📧 AuthController.resendVerificationEmail - Demande de renvoi d'email");
      const body = await req.json();
      console.log("📝 Données reçues:", body.email);
      const { email } = body;

      if (!email) {
        console.log("❌ Renvoi impossible: Email manquant");
        return new Response(
          JSON.stringify({ error: 'Email requis' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Trouver l'utilisateur
      console.log("🔍 Recherche de l'utilisateur:", email);
      const user = await UserModel.findByEmail(email);
      if (!user) {
        // Ne pas indiquer si l'utilisateur existe ou non pour des raisons de sécurité
        console.log("❌ Renvoi impossible: Utilisateur non trouvé:", email);
        return new Response(
          JSON.stringify({ message: 'Si votre compte existe, un email de vérification vous a été envoyé.' }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Vérifier si l'utilisateur est déjà vérifié
      if (user.is_verified === true) {
        console.log("❌ Renvoi impossible: Utilisateur déjà vérifié:", email);
        return new Response(
          JSON.stringify({ message: 'Votre compte est déjà vérifié. Vous pouvez vous connecter.' }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Générer un nouveau token de vérification
      console.log("🔑 Génération d'un nouveau token de vérification pour:", email);
      const verification = generateVerificationToken();

      // Mettre à jour l'utilisateur avec le nouveau token
      await UserModel.update(user.id!, {
        verification_token: verification.token,
        verification_expires: verification.expires.toISOString()
      });

      // Envoyer l'email de vérification
      try {
        console.log("📧 Envoi de l'email de vérification à:", email);
        await sendVerificationEmail(email, verification.token, user.firstname);
        console.log("📧 Email de vérification envoyé avec succès");
      } catch (emailError) {
        console.error("❌ Erreur lors de l'envoi de l'email de vérification:", emailError);
        return new Response(
          JSON.stringify({ error: 'Erreur lors de l\'envoi de l\'email de vérification' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({ message: 'Un nouvel email de vérification a été envoyé. Veuillez vérifier votre boîte de réception.' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      console.error("❌ Erreur lors du renvoi de l'email de vérification:", error);
      return new Response(
        JSON.stringify({ error: 'Erreur lors du renvoi de l\'email de vérification' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
} 