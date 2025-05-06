import { UserModel } from '../models/User';
import { generateToken } from '../utils/jwt';
import bcrypt from 'bcryptjs';

export class AuthController {
  static async register(req: Request) {
    try {
      const body = await req.json();
      const { email, password, firstname, lastname } = body;

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return new Response(JSON.stringify({ error: 'Email déjà utilisé' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Créer le nouvel utilisateur
      const user = await UserModel.create({
        email,
        password,
        firstname,
        lastname,
        role: 'user'
      });

      // Générer le token
      const token = await generateToken({
        userId: user.id!,
        email: user.email,
        role: user.role
      });

      return new Response(JSON.stringify({ user, token }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Erreur lors de l\'inscription' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  static async login(req: Request) {
    try {
      const body = await req.json();
      const { email, password } = body;

      // Vérifier si l'utilisateur existe
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return new Response(JSON.stringify({ error: 'Email ou mot de passe incorrect' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Vérifier le mot de passe
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return new Response(JSON.stringify({ error: 'Email ou mot de passe incorrect' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Générer le token
      const token = await generateToken({
        userId: user.id!,
        email: user.email,
        role: user.role
      });

      return new Response(JSON.stringify({ user, token }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Erreur lors de la connexion' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
} 