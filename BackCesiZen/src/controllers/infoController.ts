import { InfoModel, InfoResource } from "../models/infoModel";
import { getCurrentUser } from "../utils/auth";

/**
 * Contrôleur pour la gestion des pages d'information
 */
export class InfoController {
  private infoModel: InfoModel;

  constructor() {
    this.infoModel = new InfoModel();
  }

  /**
   * Récupère la liste des pages disponibles
   * @param req Requête
   * @returns Réponse
   */
  async getInfoList(req: Request): Promise<Response> {
    try {
      // Récupérer toutes les pages publiées
      const pages = await this.infoModel.getPublished();
      
      // Formater les données pour n'inclure que les informations nécessaires
      const formattedPages = pages.map(page => ({
        id: page.id,
        title: page.title,
        slug: page.slug
      }));
      
      return new Response(JSON.stringify({ 
        pages: formattedPages
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      console.error("Erreur lors de la récupération des pages:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la récupération des pages"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Récupère une page par son slug
   * @param req Requête
   * @param slug Slug de la page
   * @returns Réponse
   */
  async getInfoBySlug(req: Request, slug: string): Promise<Response> {
    try {
      // Récupérer la page par son slug
      const page = await this.infoModel.getBySlug(slug);
      
      if (!page) {
        return new Response(JSON.stringify({ 
          error: "Page non trouvée"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Vérifier que la page est publiée
      if (!page.isPublished) {
        return new Response(JSON.stringify({ 
          error: "Cette page n'est pas accessible"
        }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ 
        page: {
          id: page.id,
          title: page.title,
          content: page.content,
          updatedAt: page.updatedAt
        }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      console.error("Erreur lors de la récupération de la page:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la récupération de la page"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Crée ou met à jour une page
   * @param req Requête
   * @returns Réponse
   */
  async createOrUpdateInfo(req: Request): Promise<Response> {
    try {
      // Récupérer les données du corps de la requête
      const body = await req.json();
      const { id, title, slug, content, isPublished } = body;
      
      // Récupérer l'ID de l'utilisateur (admin) depuis le middleware d'authentification
      const authorId = (req as any).userId;
      
      // Vérifier que les champs nécessaires sont présents
      if (!title || !content) {
        return new Response(JSON.stringify({ 
          error: "Titre et contenu requis"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      let page;
      
      // Si un ID est fourni, mettre à jour la page existante
      if (id) {
        // Vérifier que la page existe
        const existingPage = await this.infoModel.getById(id);
        
        if (!existingPage) {
          return new Response(JSON.stringify({ 
            error: "Page non trouvée"
          }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }
        
        // Mettre à jour la page
        page = await this.infoModel.updatePage(id, {
          title,
          slug,
          content,
          isPublished
        });
        
        return new Response(JSON.stringify({ 
          message: "Page mise à jour avec succès",
          page
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Sinon, créer une nouvelle page
      page = await this.infoModel.createPage({
        title,
        slug: slug || "",
        content,
        isPublished,
        authorId
      });
      
      return new Response(JSON.stringify({ 
        message: "Page créée avec succès",
        page
      }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      console.error("Erreur lors de la création/mise à jour de la page:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la création/mise à jour de la page"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Supprime une page
   * @param req Requête
   * @param id ID de la page
   * @returns Réponse
   */
  async deleteInfo(req: Request, id: number): Promise<Response> {
    try {
      // Vérifier que la page existe
      const page = await this.infoModel.getById(id);
      
      if (!page) {
        return new Response(JSON.stringify({ 
          error: "Page non trouvée"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Supprimer la page
      const success = await this.infoModel.delete(id);
      
      if (!success) {
        return new Response(JSON.stringify({ 
          error: "Impossible de supprimer la page"
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ 
        message: "Page supprimée avec succès"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      console.error("Erreur lors de la suppression de la page:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la suppression de la page"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // --- MÉTHODES POUR LES RESSOURCES D'INFORMATION ---

  /**
   * Récupère toutes les ressources d'information
   * @param req Requête
   * @returns Réponse
   */
  async getInfoResources(req: Request): Promise<Response> {
    try {
      const url = new URL(req.url);
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = parseInt(url.searchParams.get('offset') || '0');
      
      const resources = await this.infoModel.getAllInfoResources(limit, offset);
      
      return new Response(JSON.stringify({ 
        resources,
        meta: {
          limit,
          offset
        }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      console.error("Erreur lors de la récupération des ressources:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la récupération des ressources"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Récupère une ressource d'information par son ID
   * @param req Requête
   * @param id ID de la ressource
   * @returns Réponse
   */
  async getInfoResourceById(req: Request, id: number): Promise<Response> {
    try {
      // Récupérer la ressource ET incrémenter les vues (consultation publique)
      const resource = await this.infoModel.getInfoResourceById(id);
      
      if (!resource) {
        return new Response(JSON.stringify({ 
          error: "Ressource non trouvée"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ resource }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      console.error("Erreur lors de la récupération de la ressource:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la récupération de la ressource"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Récupère les ressources d'information par catégorie
   * @param req Requête
   * @param category Catégorie
   * @returns Réponse
   */
  async getInfoResourcesByCategory(req: Request, category: string): Promise<Response> {
    try {
      const url = new URL(req.url);
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = parseInt(url.searchParams.get('offset') || '0');
      
      const resources = await this.infoModel.getInfoResourcesByCategory(category, limit, offset);
      
      return new Response(JSON.stringify({ 
        resources,
        meta: {
          category,
          limit,
          offset
        }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      console.error("Erreur lors de la récupération des ressources par catégorie:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la récupération des ressources par catégorie"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Récupère les ressources d'information par tag
   * @param req Requête
   * @param tag Tag
   * @returns Réponse
   */
  async getInfoResourcesByTag(req: Request, tag: string): Promise<Response> {
    try {
      const url = new URL(req.url);
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = parseInt(url.searchParams.get('offset') || '0');
      
      const resources = await this.infoModel.getInfoResourcesByTag(tag, limit, offset);
      
      return new Response(JSON.stringify({ 
        resources,
        meta: {
          tag,
          limit,
          offset
        }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      console.error("Erreur lors de la récupération des ressources par tag:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la récupération des ressources par tag"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Crée une nouvelle ressource d'information
   * @param req Requête
   * @returns Réponse
   */
  async createInfoResource(req: Request): Promise<Response> {
    try {
      const body = await req.json();
      const { title, summary, content, category, tags, reading_time, level } = body;
      
      // Vérifier que les champs nécessaires sont présents
      if (!title || !summary || !content || !category) {
        return new Response(JSON.stringify({ 
          error: "Titre, résumé, contenu et catégorie sont requis"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Récupérer l'ID de l'utilisateur (admin) depuis le middleware d'authentification
      const authorId = (req as any).userId;
      
      // Créer la ressource
      const resource = await this.infoModel.createInfoResource({
        title,
        summary,
        content,
        category,
        author_id: authorId,
        reading_time,
        level
      }, tags || []);
      
      return new Response(JSON.stringify({ 
        message: "Ressource créée avec succès",
        resource
      }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      console.error("Erreur lors de la création de la ressource:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la création de la ressource"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Met à jour une ressource d'information
   * @param req Requête
   * @param id ID de la ressource
   * @returns Réponse
   */
  async updateInfoResource(req: Request, id: number): Promise<Response> {
    try {
      // Vérifier que la ressource existe (sans incrémenter les vues)
      const existingResource = await this.infoModel.getInfoResourceByIdInternal(id);
      
      if (!existingResource) {
        return new Response(JSON.stringify({ 
          error: "Ressource non trouvée"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      const body = await req.json();
      const { title, summary, content, category, tags, reading_time, level } = body;
      
      // Vérifier que les champs nécessaires sont présents
      if (!title || !summary || !content || !category) {
        return new Response(JSON.stringify({ 
          error: "Titre, résumé, contenu et catégorie sont requis"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Mettre à jour la ressource
      const resource = await this.infoModel.updateInfoResource(id, {
        title,
        summary,
        content,
        category,
        reading_time,
        level
      }, tags || []);
      
      return new Response(JSON.stringify({ 
        message: "Ressource mise à jour avec succès",
        resource
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la ressource:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la mise à jour de la ressource"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Supprime une ressource d'information
   * @param req Requête
   * @param id ID de la ressource
   * @returns Réponse
   */
  async deleteInfoResource(req: Request, id: number): Promise<Response> {
    try {
      // Vérifier que la ressource existe (sans incrémenter les vues - opération admin)
      const resource = await this.infoModel.getInfoResourceByIdInternal(id);
      
      if (!resource) {
        return new Response(JSON.stringify({ 
          error: "Ressource non trouvée"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Supprimer la ressource
      const success = await this.infoModel.deleteInfoResource(id);
      
      if (!success) {
        return new Response(JSON.stringify({ 
          error: "Impossible de supprimer la ressource"
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ 
        message: "Ressource supprimée avec succès"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      console.error("Erreur lors de la suppression de la ressource:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la suppression de la ressource"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Modifie une ressource d'information (par son auteur uniquement)
   * @param req Requête
   * @param id ID de la ressource
   * @returns Réponse
   */
  async updateUserOwnInfoResource(req: Request, id: number): Promise<Response> {
    try {
      // Vérifier que la ressource existe (sans incrémenter les vues - opération de modification)
      const existingResource = await this.infoModel.getInfoResourceByIdInternal(id);
      
      if (!existingResource) {
        return new Response(JSON.stringify({ 
          error: "Ressource non trouvée"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Récupérer l'ID de l'utilisateur connecté
      const userId = (req as any).userId;

      // Vérifier que l'utilisateur est l'auteur de la ressource
      if (existingResource.author_id !== userId) {
        return new Response(JSON.stringify({ 
          error: "Vous ne pouvez modifier que vos propres ressources"
        }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      const body = await req.json();
      const { title, summary, content, category, tags, reading_time, level, media_type, media_url, media_filename } = body;
      
      // Vérifier que les champs nécessaires sont présents
      if (!title || !summary || !content || !category) {
        return new Response(JSON.stringify({ 
          error: "Titre, résumé, contenu et catégorie sont requis"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Mettre à jour la ressource
      const resource = await this.infoModel.updateInfoResource(id, {
        title,
        summary,
        content,
        category,
        reading_time,
        level,
        media_type,
        media_url,
        media_filename
      }, tags || []);
      
      return new Response(JSON.stringify({ 
        message: "Ressource mise à jour avec succès",
        resource
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la ressource:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la mise à jour de la ressource"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Supprime une ressource d'information (par son auteur uniquement)
   * @param req Requête
   * @param id ID de la ressource
   * @returns Réponse
   */
  async deleteUserOwnInfoResource(req: Request, id: number): Promise<Response> {
    try {
      // Vérifier que la ressource existe (sans incrémenter les vues - opération de suppression)
      const resource = await this.infoModel.getInfoResourceByIdInternal(id);
      
      if (!resource) {
        return new Response(JSON.stringify({ 
          error: "Ressource non trouvée"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Récupérer l'ID de l'utilisateur connecté
      const userId = (req as any).userId;

      // Vérifier que l'utilisateur est l'auteur de la ressource
      if (resource.author_id !== userId) {
        return new Response(JSON.stringify({ 
          error: "Vous ne pouvez supprimer que vos propres ressources"
        }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Supprimer la ressource
      const success = await this.infoModel.deleteInfoResource(id);
      
      if (!success) {
        return new Response(JSON.stringify({ 
          error: "Impossible de supprimer la ressource"
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ 
        message: "Ressource supprimée avec succès"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      console.error("Erreur lors de la suppression de la ressource:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la suppression de la ressource"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Récupère les commentaires d'une ressource d'information
   * @param req Requête
   * @param resourceId ID de la ressource
   * @returns Réponse
   */
  async getInfoResourceComments(req: Request, resourceId: number): Promise<Response> {
    try {
      // Vérifier que la ressource existe (sans incrémenter les vues - récupération de commentaires)
      const resource = await this.infoModel.getInfoResourceByIdInternal(resourceId);
      
      if (!resource) {
        return new Response(JSON.stringify({ 
          error: "Ressource non trouvée"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Récupérer les commentaires
      const comments = await this.infoModel.getCommentsForInfoResource(resourceId);
      
      return new Response(JSON.stringify({ comments }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      console.error("Erreur lors de la récupération des commentaires:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la récupération des commentaires"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Ajoute un commentaire à une ressource d'information
   * @param req Requête
   * @param resourceId ID de la ressource
   * @returns Réponse
   */
  async addCommentToInfoResource(req: Request, resourceId: number): Promise<Response> {
    try {
      // Vérifier que la ressource existe (sans incrémenter les vues - ajout de commentaire)
      const resource = await this.infoModel.getInfoResourceByIdInternal(resourceId);
      
      if (!resource) {
        return new Response(JSON.stringify({ 
          error: "Ressource non trouvée"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      const body = await req.json();
      const { message } = body;
      
      if (!message || message.trim() === '') {
        return new Response(JSON.stringify({ 
          error: "Le message ne peut pas être vide"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Récupérer l'ID de l'utilisateur depuis le middleware d'authentification
      const userId = (req as any).userId;
      
      // Ajouter le commentaire
      const comment = await this.infoModel.addCommentToInfoResource(resourceId, userId, message);
      
      return new Response(JSON.stringify({ 
        message: "Commentaire ajouté avec succès",
        comment
      }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      console.error("Erreur lors de l'ajout du commentaire:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de l'ajout du commentaire"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Ajoute une réponse à un commentaire existant
   * @param req Requête
   * @param resourceId ID de la ressource
   * @param commentId ID du commentaire parent
   * @returns Réponse
   */
  async addReplyToComment(req: Request, resourceId: number, commentId: number): Promise<Response> {
    try {
      // Vérifier que la ressource existe (sans incrémenter les vues - ajout de réponse)
      const resource = await this.infoModel.getInfoResourceByIdInternal(resourceId);
      
      if (!resource) {
        return new Response(JSON.stringify({ 
          error: "Ressource non trouvée"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      const body = await req.json();
      const { message } = body;
      
      if (!message || message.trim() === '') {
        return new Response(JSON.stringify({ 
          error: "Le message ne peut pas être vide"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Récupérer l'ID de l'utilisateur depuis le middleware d'authentification
      const userId = (req as any).userId;
      
      // Ajouter la réponse
      const reply = await this.infoModel.addReplyToComment(resourceId, userId, message, commentId);
      
      return new Response(JSON.stringify({ 
        message: "Réponse ajoutée avec succès",
        reply
      }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      console.error("Erreur lors de l'ajout de la réponse:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de l'ajout de la réponse"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Supprime un commentaire d'une ressource d'information
   * @param req Requête
   * @param resourceId ID de la ressource
   * @param commentId ID du commentaire
   * @returns Réponse
   */
  async deleteInfoResourceComment(req: Request, resourceId: number, commentId: number): Promise<Response> {
    try {
      // Vérifier que la ressource existe (sans incrémenter les vues - suppression de commentaire)
      const resource = await this.infoModel.getInfoResourceByIdInternal(resourceId);
      
      if (!resource) {
        return new Response(JSON.stringify({ 
          error: "Ressource non trouvée"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Récupérer l'utilisateur connecté
      const userId = (req as any).userId;
      const isAdmin = (req as any).userRole === 'admin';
      
      // Supprimer le commentaire
      const success = await this.infoModel.deleteInfoResourceComment(commentId, userId, isAdmin);
      
      if (!success) {
        return new Response(JSON.stringify({ 
          error: "Impossible de supprimer le commentaire. Vous n'avez peut-être pas les droits nécessaires."
        }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ 
        message: "Commentaire supprimé avec succès"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      console.error("Erreur lors de la suppression du commentaire:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la suppression du commentaire"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Modifie un commentaire d'une ressource d'information
   * @param req Requête
   * @param resourceId ID de la ressource
   * @param commentId ID du commentaire
   * @returns Réponse
   */
  async updateInfoResourceComment(req: Request, resourceId: number, commentId: number): Promise<Response> {
    try {
      // Vérifier que la ressource existe (sans incrémenter les vues - modification de commentaire)
      const resource = await this.infoModel.getInfoResourceByIdInternal(resourceId);
      
      if (!resource) {
        return new Response(JSON.stringify({ 
          error: "Ressource non trouvée"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      const body = await req.json();
      const { message } = body;
      
      if (!message || message.trim() === '') {
        return new Response(JSON.stringify({ 
          error: "Le message ne peut pas être vide"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Récupérer l'utilisateur connecté
      const userId = (req as any).userId;
      const isAdmin = (req as any).userRole === 'admin';
      
      // Modifier le commentaire
      const updatedComment = await this.infoModel.updateInfoResourceComment(commentId, userId, message.trim(), isAdmin);
      
      if (!updatedComment) {
        return new Response(JSON.stringify({ 
          error: "Impossible de modifier le commentaire. Vous n'avez peut-être pas les droits nécessaires."
        }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ 
        message: "Commentaire modifié avec succès",
        comment: updatedComment
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      console.error("Erreur lors de la modification du commentaire:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la modification du commentaire"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Ajoute ou retire un like à une ressource d'information
   * @param req Requête
   * @param resourceId ID de la ressource
   * @returns Réponse
   */
  async toggleLikeInfoResource(req: Request, resourceId: number): Promise<Response> {
    try {
      // Vérifier que la ressource existe (sans incrémenter les vues - action de like)
      const resource = await this.infoModel.getInfoResourceByIdInternal(resourceId);
      
      if (!resource) {
        return new Response(JSON.stringify({ 
          error: "Ressource non trouvée"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Récupérer l'ID de l'utilisateur depuis le middleware d'authentification
      const userId = (req as any).userId;
      
      // Ajouter ou retirer le like
      const isLiked = await this.infoModel.toggleLikeInfoResource(resourceId, userId);
      
      const message = isLiked ? "Like ajouté avec succès" : "Like retiré avec succès";
      
      return new Response(JSON.stringify({ 
        message,
        isLiked
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      console.error("Erreur lors de la gestion du like:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la gestion du like"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Vérifie si l'utilisateur a liké une ressource d'information
   * @param req Requête
   * @param resourceId ID de la ressource
   * @returns Réponse
   */
  async checkUserLikedInfoResource(req: Request, resourceId: number): Promise<Response> {
    try {
      // Vérifier que la ressource existe (sans incrémenter les vues - vérification de like)
      const resource = await this.infoModel.getInfoResourceByIdInternal(resourceId);
      
      if (!resource) {
        return new Response(JSON.stringify({ 
          error: "Ressource non trouvée"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Récupérer l'ID de l'utilisateur depuis le middleware d'authentification
      const userId = (req as any).userId;
      
      // Vérifier si l'utilisateur a liké la ressource
      const isLiked = await this.infoModel.hasUserLikedInfoResource(resourceId, userId);
      
      return new Response(JSON.stringify({ isLiked }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      console.error("Erreur lors de la vérification du like:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la vérification du like"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Incrémente le compteur de partages d'une ressource d'information
   * @param req Requête
   * @param resourceId ID de la ressource
   * @returns Réponse
   */
  async incrementInfoResourceShares(req: Request, resourceId: number): Promise<Response> {
    try {
      // Vérifier que la ressource existe (sans incrémenter les vues - action de partage)
      const resource = await this.infoModel.getInfoResourceByIdInternal(resourceId);
      
      if (!resource) {
        return new Response(JSON.stringify({ 
          error: "Ressource non trouvée"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Incrémenter le compteur de partages
      const shares = await this.infoModel.incrementInfoResourceShares(resourceId);
      
      return new Response(JSON.stringify({ 
        message: "Partage comptabilisé avec succès",
        shares
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      console.error("Erreur lors de l'incrémentation des partages:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de l'incrémentation des partages"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Récupère les ressources d'information likées par l'utilisateur connecté
   * @param req Requête
   * @returns Réponse
   */
  async getUserLikedInfoResources(req: Request): Promise<Response> {
    try {
      // Récupérer l'ID de l'utilisateur depuis le middleware d'authentification
      const userId = (req as any).userId;
      
      // Récupérer les ressources likées par l'utilisateur
      const likedResources = await this.infoModel.getUserLikedInfoResources(userId);
      
      return new Response(JSON.stringify({ 
        resources: likedResources,
        total: likedResources.length
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      console.error("Erreur lors de la récupération des ressources likées:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la récupération des ressources likées"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Récupère tous les tags disponibles
   * @param req Requête
   * @returns Réponse
   */
  async getAllTags(req: Request): Promise<Response> {
    try {
      const tags = await this.infoModel.getAllTags();
      
      return new Response(JSON.stringify({ tags }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      console.error("Erreur lors de la récupération des tags:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la récupération des tags"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
} 