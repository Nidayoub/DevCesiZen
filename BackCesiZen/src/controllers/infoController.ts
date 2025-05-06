import { InfoModel } from "../models/infoModel";

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
} 