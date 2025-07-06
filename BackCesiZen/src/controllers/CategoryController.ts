import { CategoryModel } from '../models/Category';
import { verifyToken } from '../utils/jwt';
import { parse } from 'cookie';

export class CategoryController {
  static async create(req: Request) {
    try {
      // Récupérer le token depuis les cookies
      const cookies = req.headers.get('Cookie') || '';
      const parsedCookies = parse(cookies);
      const token = parsedCookies.authToken;
      
      if (!token) {
        return new Response(JSON.stringify({ error: 'Non autorisé' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const payload = await verifyToken(token);
      if (!payload || payload.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Accès non autorisé' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const body = await req.json();
      const category = await CategoryModel.create(body);

      return new Response(JSON.stringify(category), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Erreur lors de la création de la catégorie' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  static async findAll(req: Request) {
    try {
      const categories = await CategoryModel.findAll();
      return new Response(JSON.stringify(categories), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Erreur lors de la récupération des catégories' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  static async findById(req: Request) {
    try {
      const url = new URL(req.url);
      const id = parseInt(url.pathname.split('/').pop() || '0');

      const category = await CategoryModel.findById(id);
      if (!category) {
        return new Response(JSON.stringify({ error: 'Catégorie non trouvée' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify(category), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Erreur lors de la récupération de la catégorie' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  static async update(req: Request) {
    try {
      // Récupérer le token depuis les cookies
      const cookies = req.headers.get('Cookie') || '';
      const parsedCookies = parse(cookies);
      const token = parsedCookies.authToken;
      
      if (!token) {
        return new Response(JSON.stringify({ error: 'Non autorisé' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const payload = await verifyToken(token);
      if (!payload || payload.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Accès non autorisé' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const url = new URL(req.url);
      const id = parseInt(url.pathname.split('/').pop() || '0');
      const body = await req.json();

      const category = await CategoryModel.update(id, body);
      if (!category) {
        return new Response(JSON.stringify({ error: 'Catégorie non trouvée' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify(category), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Erreur lors de la mise à jour de la catégorie' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  static async delete(req: Request) {
    try {
      // Récupérer le token depuis les cookies
      const cookies = req.headers.get('Cookie') || '';
      const parsedCookies = parse(cookies);
      const token = parsedCookies.authToken;
      
      if (!token) {
        return new Response(JSON.stringify({ error: 'Non autorisé' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const payload = await verifyToken(token);
      if (!payload || payload.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Accès non autorisé' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const url = new URL(req.url);
      const id = parseInt(url.pathname.split('/').pop() || '0');

      const success = await CategoryModel.delete(id);
      if (!success) {
        return new Response(JSON.stringify({ error: 'Catégorie non trouvée' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(null, { status: 204 });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Erreur lors de la suppression de la catégorie' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
} 