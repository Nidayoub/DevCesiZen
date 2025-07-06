import { DiagnosticCategoryModel } from '../models/DiagnosticCategory';
import { verifyToken } from '../utils/jwt';
import { parse } from 'cookie';

export class DiagnosticCategoryController {
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
      
      // Validation des données
      if (!body.name || body.name.trim() === '') {
        return new Response(JSON.stringify({ error: 'Le nom de la catégorie est requis' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const category = await DiagnosticCategoryModel.create({
        name: body.name.trim(),
        description: body.description?.trim() || null,
        icon: body.icon?.trim() || null,
        color: body.color?.trim() || '#6B7280'
      });

      return new Response(JSON.stringify(category), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Erreur lors de la création de la catégorie de diagnostic:', error);
      return new Response(JSON.stringify({ error: 'Erreur lors de la création de la catégorie de diagnostic' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  static async findAll(req: Request) {
    try {
      const categories = await DiagnosticCategoryModel.findAll();
      return new Response(JSON.stringify(categories), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories de diagnostic:', error);
      return new Response(JSON.stringify({ error: 'Erreur lors de la récupération des catégories de diagnostic' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  static async findAllWithCount(req: Request) {
    try {
      const categories = await DiagnosticCategoryModel.getWithQuestionCount();
      return new Response(JSON.stringify(categories), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories avec comptage:', error);
      return new Response(JSON.stringify({ error: 'Erreur lors de la récupération des catégories avec comptage' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  static async findById(req: Request) {
    try {
      const url = new URL(req.url);
      const id = parseInt(url.pathname.split('/').pop() || '0');

      if (isNaN(id) || id <= 0) {
        return new Response(JSON.stringify({ error: 'ID de catégorie invalide' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const category = await DiagnosticCategoryModel.findById(id);
      if (!category) {
        return new Response(JSON.stringify({ error: 'Catégorie de diagnostic non trouvée' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify(category), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de la catégorie de diagnostic:', error);
      return new Response(JSON.stringify({ error: 'Erreur lors de la récupération de la catégorie de diagnostic' }), {
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

      if (isNaN(id) || id <= 0) {
        return new Response(JSON.stringify({ error: 'ID de catégorie invalide' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const body = await req.json();

      // Validation des données
      if (body.name && body.name.trim() === '') {
        return new Response(JSON.stringify({ error: 'Le nom de la catégorie ne peut pas être vide' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const updateData: any = {};
      if (body.name) updateData.name = body.name.trim();
      if (body.description !== undefined) updateData.description = body.description?.trim() || null;
      if (body.icon !== undefined) updateData.icon = body.icon?.trim() || null;
      if (body.color !== undefined) updateData.color = body.color?.trim() || '#6B7280';

      const category = await DiagnosticCategoryModel.update(id, updateData);
      if (!category) {
        return new Response(JSON.stringify({ error: 'Catégorie de diagnostic non trouvée' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify(category), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la catégorie de diagnostic:', error);
      return new Response(JSON.stringify({ error: 'Erreur lors de la mise à jour de la catégorie de diagnostic' }), {
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

      if (isNaN(id) || id <= 0) {
        return new Response(JSON.stringify({ error: 'ID de catégorie invalide' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const success = await DiagnosticCategoryModel.delete(id);
      if (!success) {
        return new Response(JSON.stringify({ error: 'Catégorie de diagnostic non trouvée' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(null, { status: 204 });
    } catch (error) {
      console.error('Erreur lors de la suppression de la catégorie de diagnostic:', error);
      return new Response(JSON.stringify({ error: 'Erreur lors de la suppression de la catégorie de diagnostic' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
} 