import { ResourceModel } from '../models/Resource';
import { verifyToken } from '../utils/jwt';

export class ResourceController {
  static async create(req: Request) {
    try {
      const token = req.headers.get('Authorization')?.split(' ')[1];
      if (!token) {
        return new Response(JSON.stringify({ error: 'Non autorisé' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const payload = await verifyToken(token);
      if (!payload) {
        return new Response(JSON.stringify({ error: 'Token invalide' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const body = await req.json();
      const resource = await ResourceModel.create({
        ...body,
        created_by: payload.userId
      });

      return new Response(JSON.stringify(resource), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Erreur lors de la création de la ressource' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  static async findAll(req: Request) {
    try {
      const resources = await ResourceModel.findAll();
      return new Response(JSON.stringify(resources), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Erreur lors de la récupération des ressources' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  static async findById(req: Request) {
    try {
      const url = new URL(req.url);
      const id = parseInt(url.pathname.split('/').pop() || '0');

      const resource = await ResourceModel.findById(id);
      if (!resource) {
        return new Response(JSON.stringify({ error: 'Ressource non trouvée' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify(resource), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Erreur lors de la récupération de la ressource' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  static async update(req: Request) {
    try {
      const token = req.headers.get('Authorization')?.split(' ')[1];
      if (!token) {
        return new Response(JSON.stringify({ error: 'Non autorisé' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const payload = await verifyToken(token);
      if (!payload) {
        return new Response(JSON.stringify({ error: 'Token invalide' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const url = new URL(req.url);
      const id = parseInt(url.pathname.split('/').pop() || '0');
      const body = await req.json();

      const resource = await ResourceModel.update(id, body);
      if (!resource) {
        return new Response(JSON.stringify({ error: 'Ressource non trouvée' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify(resource), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Erreur lors de la mise à jour de la ressource' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  static async delete(req: Request) {
    try {
      const token = req.headers.get('Authorization')?.split(' ')[1];
      if (!token) {
        return new Response(JSON.stringify({ error: 'Non autorisé' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const payload = await verifyToken(token);
      if (!payload) {
        return new Response(JSON.stringify({ error: 'Token invalide' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const url = new URL(req.url);
      const id = parseInt(url.pathname.split('/').pop() || '0');

      const success = await ResourceModel.delete(id);
      if (!success) {
        return new Response(JSON.stringify({ error: 'Ressource non trouvée' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(null, { status: 204 });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Erreur lors de la suppression de la ressource' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
} 