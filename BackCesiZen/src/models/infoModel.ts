import { BaseModel } from "./baseModel";
import { db } from "../data/database";

/**
 * Interface pour les pages d'information
 */
export interface PageInfo {
  id: number;
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  authorId: number;
}

/**
 * Interface pour la création d'une page
 */
export interface PageInfoCreate {
  title: string;
  slug: string;
  content: string;
  isPublished?: boolean;
  authorId: number;
}

/**
 * Interface pour les ressources d'information
 */
export interface InfoResource {
  id: number;
  title: string;
  summary: string;
  content: string;
  category: string;
  author_id: number;
  publication_date: string;
  modification_date: string;
  reading_time?: string;
  level?: string;
  views: number;
  shares: number;
  likes_count?: number;
  comments_count?: number;
  tags?: string[];
  media_type?: 'image' | 'video' | null;
  media_content?: string;
  media_filename?: string;
}

/**
 * Interface pour les commentaires des ressources d'information
 */
export interface InfoResourceComment {
  id: number;
  info_resource_id: number;
  user_id: number;
  message: string;
  comment_date: string;
  parent_id?: number | null;
  user_firstname?: string;
  user_lastname?: string;
  replies?: InfoResourceComment[];
}

/**
 * Interface pour créer un commentaire/réponse
 */
export interface CreateCommentRequest {
  info_resource_id: number;
  user_id: number;
  message: string;
  parent_id?: number | null;
}

/**
 * Modèle pour la gestion des pages et ressources d'information
 */
export class InfoModel extends BaseModel<PageInfo> {
  constructor() {
    super("pages");
  }

  /**
   * Récupère une page par son slug
   * @param slug Slug de la page
   * @returns La page trouvée ou null
   */
  async getBySlug(slug: string): Promise<PageInfo | null> {
    const page = this.data.find(page => page.slug === slug);
    return page ? { ...page } : null;
  }

  /**
   * Récupère toutes les pages publiées
   * @returns Liste des pages publiées
   */
  async getPublished(): Promise<PageInfo[]> {
    return this.data
      .filter(page => page.isPublished)
      .map(page => ({ ...page }));
  }

  /**
   * Crée une nouvelle page
   * @param pageData Données de la page
   * @returns La page créée
   */
  async createPage(pageData: PageInfoCreate): Promise<PageInfo> {
    // Formater le slug si nécessaire
    const slug = pageData.slug || this.formatSlug(pageData.title);
    
    // Préparer les données de la page
    const newPage = {
      title: pageData.title,
      slug,
      content: pageData.content,
      isPublished: pageData.isPublished ?? true,
      authorId: pageData.authorId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Créer la page
    return this.create(newPage);
  }

  /**
   * Met à jour une page
   * @param id ID de la page
   * @param updates Mises à jour à appliquer
   * @returns La page mise à jour ou null
   */
  async updatePage(id: number, updates: Partial<PageInfo>): Promise<PageInfo | null> {
    // Mettre à jour la date de mise à jour
    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    // Si le titre est mis à jour mais pas le slug, formater un nouveau slug
    if (updates.title && !updates.slug) {
      updatedData.slug = this.formatSlug(updates.title);
    }
    
    // Mettre à jour la page
    return this.update(id, updatedData);
  }

  /**
   * Formate un titre en slug
   * @param title Titre à formater
   * @returns Slug formaté
   */
  private formatSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Supprimer les caractères spéciaux
      .replace(/\s+/g, '-')     // Remplacer les espaces par des tirets
      .replace(/-+/g, '-');     // Éviter les tirets multiples
  }

  // --- MÉTHODES POUR LES RESSOURCES D'INFORMATION ---

  /**
   * Récupère toutes les ressources d'information
   * @param limit Limite de résultats
   * @param offset Offset pour la pagination
   * @returns Liste des ressources d'information
   */
  async getAllInfoResources(limit: number = 20, offset: number = 0): Promise<InfoResource[]> {
    try {
      const resources = await db.query<InfoResource>(
        `SELECT ir.*, 
          (SELECT COUNT(*) FROM info_resources_likes WHERE info_resource_id = ir.id) as likes_count,
          (SELECT COUNT(*) FROM info_resources_comments WHERE info_resource_id = ir.id) as comments_count
        FROM info_resources ir
        ORDER BY ir.publication_date DESC
        LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      // Récupérer les tags pour chaque ressource
      for (const resource of resources) {
        resource.tags = await this.getTagsForResource(resource.id);
      }
      
      return resources;
    } catch (error) {
      console.error('Erreur lors de la récupération des ressources:', error);
      throw error;
    }
  }

  /**
   * Récupère une ressource d'information par son ID (VERSION INTERNE - sans incrémenter les vues)
   * @param id ID de la ressource
   * @returns Ressource ou null si non trouvée
   */
  async getInfoResourceByIdInternal(id: number): Promise<InfoResource | null> {
    try {
      const resource = await db.queryOne<InfoResource>(
        `SELECT ir.*, 
          (SELECT COUNT(*) FROM info_resources_likes WHERE info_resource_id = ir.id) as likes_count,
          (SELECT COUNT(*) FROM info_resources_comments WHERE info_resource_id = ir.id) as comments_count
        FROM info_resources ir
        WHERE ir.id = ?`,
        [id]
      );

      if (!resource) {
        return null;
      }

      // Récupérer les tags pour cette ressource
      resource.tags = await this.getTagsForResource(resource.id);
      
      return resource;
    } catch (error) {
      console.error('Erreur lors de la récupération de la ressource:', error);
      throw error;
    }
  }

  /**
   * Récupère une ressource d'information par son ID (VERSION PUBLIQUE - incrémente les vues)
   * @param id ID de la ressource
   * @returns Ressource ou null si non trouvée
   */
  async getInfoResourceById(id: number): Promise<InfoResource | null> {
    try {
      const resource = await this.getInfoResourceByIdInternal(id);
      
      if (!resource) {
        return null;
      }
      
      // Incrémenter le compteur de vues seulement pour les vraies consultations
      await this.incrementResourceViews(id);
      
      return resource;
    } catch (error) {
      console.error('Erreur lors de la récupération de la ressource:', error);
      throw error;
    }
  }

  /**
   * Récupère les ressources d'information par catégorie
   * @param category Catégorie
   * @param limit Limite de résultats
   * @param offset Offset pour la pagination
   * @returns Liste des ressources d'information
   */
  async getInfoResourcesByCategory(category: string, limit: number = 20, offset: number = 0): Promise<InfoResource[]> {
    try {
      const resources = await db.query<InfoResource>(
        `SELECT ir.*, 
          (SELECT COUNT(*) FROM info_resources_likes WHERE info_resource_id = ir.id) as likes_count,
          (SELECT COUNT(*) FROM info_resources_comments WHERE info_resource_id = ir.id) as comments_count
        FROM info_resources ir
        WHERE ir.category = ?
        ORDER BY ir.publication_date DESC
        LIMIT ? OFFSET ?`,
        [category, limit, offset]
      );

      // Récupérer les tags pour chaque ressource
      for (const resource of resources) {
        resource.tags = await this.getTagsForResource(resource.id);
      }
      
      return resources;
    } catch (error) {
      console.error('Erreur lors de la récupération des ressources par catégorie:', error);
      throw error;
    }
  }

  /**
   * Récupère les ressources d'information par tag
   * @param tag Tag
   * @param limit Limite de résultats
   * @param offset Offset pour la pagination
   * @returns Liste des ressources d'information
   */
  async getInfoResourcesByTag(tag: string, limit: number = 20, offset: number = 0): Promise<InfoResource[]> {
    try {
      const resources = await db.query<InfoResource>(
        `SELECT ir.*, 
          (SELECT COUNT(*) FROM info_resources_likes WHERE info_resource_id = ir.id) as likes_count,
          (SELECT COUNT(*) FROM info_resources_comments WHERE info_resource_id = ir.id) as comments_count
        FROM info_resources ir
        JOIN info_resources_tags irt ON ir.id = irt.info_resource_id
        JOIN tags t ON irt.tag_id = t.id
        WHERE t.name = ?
        ORDER BY ir.publication_date DESC
        LIMIT ? OFFSET ?`,
        [tag, limit, offset]
      );

      // Récupérer les tags pour chaque ressource
      for (const resource of resources) {
        resource.tags = await this.getTagsForResource(resource.id);
      }
      
      return resources;
    } catch (error) {
      console.error('Erreur lors de la récupération des ressources par tag:', error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle ressource d'information
   * @param resource Données de la ressource
   * @returns Ressource créée
   */
  async createInfoResource(resource: Partial<InfoResource>, tags: string[] = []): Promise<InfoResource> {
    try {
      // Insérer la ressource
      const result = await db.execute(
        `INSERT INTO info_resources (
          title, summary, content, category, author_id, 
          publication_date, modification_date, reading_time, level, views, shares,
          media_type, media_content, media_filename
        ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'), ?, ?, 0, 0, ?, ?, ?)`,
        [
          resource.title, 
          resource.summary, 
          resource.content, 
          resource.category, 
          resource.author_id,
          resource.reading_time,
          resource.level,
          resource.media_type || null,
          resource.media_content || null,
          resource.media_filename || null
        ]
      );

      const resourceId = result.lastInsertId;

      // Associer les tags
      if (tags.length > 0) {
        await this.associateTagsToResource(resourceId, tags);
      }

      // Récupérer la ressource complète (sans incrémenter les vues)
      const newResource = await this.getInfoResourceByIdInternal(resourceId);
      if (!newResource) {
        throw new Error("La ressource a été créée mais n'a pas pu être récupérée");
      }

      return newResource;
    } catch (error) {
      console.error('Erreur lors de la création de la ressource:', error);
      throw error;
    }
  }

  /**
   * Met à jour une ressource d'information existante
   * @param id ID de la ressource
   * @param resource Données de la ressource
   * @param tags Tags à associer
   * @returns Ressource mise à jour
   */
  async updateInfoResource(id: number, resource: Partial<InfoResource>, tags: string[] = []): Promise<InfoResource> {
    try {
      // Mettre à jour la ressource
      await db.execute(
        `UPDATE info_resources
         SET title = ?, summary = ?, content = ?, category = ?,
             modification_date = datetime('now'), reading_time = ?, level = ?,
             media_type = ?, media_content = ?, media_filename = ?
         WHERE id = ?`,
        [
          resource.title, 
          resource.summary, 
          resource.content, 
          resource.category,
          resource.reading_time,
          resource.level,
          resource.media_type || null,
          resource.media_content || null,
          resource.media_filename || null,
          id
        ]
      );

      // Mettre à jour les tags si spécifiés
      if (tags.length > 0) {
        // Supprimer les associations existantes
        await db.execute(
          `DELETE FROM info_resources_tags WHERE info_resource_id = ?`,
          [id]
        );

        // Ajouter les nouvelles associations
        await this.associateTagsToResource(id, tags);
      }

      // Récupérer la ressource mise à jour (sans incrémenter les vues)
      const updatedResource = await this.getInfoResourceByIdInternal(id);
      
      if (!updatedResource) {
        throw new Error("Ressource non trouvée après mise à jour");
      }

      return updatedResource;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la ressource:', error);
      throw error;
    }
  }

  /**
   * Supprime une ressource d'information
   * @param id ID de la ressource
   * @returns Succès de l'opération
   */
  async deleteInfoResource(id: number): Promise<boolean> {
    try {
      const result = await db.execute(
        `DELETE FROM info_resources WHERE id = ?`,
        [id]
      );
      
      return result.changes > 0;
    } catch (error) {
      console.error('Erreur lors de la suppression de la ressource:', error);
      throw error;
    }
  }

  /**
   * Récupère les commentaires d'une ressource d'information avec leurs réponses
   * @param resourceId ID de la ressource
   * @returns Liste des commentaires avec leurs réponses
   */
  async getCommentsForInfoResource(resourceId: number): Promise<InfoResourceComment[]> {
    try {
      // Récupérer tous les commentaires pour cette ressource
      const allComments = await db.query<InfoResourceComment>(
        `SELECT c.*, u.firstname as user_firstname, u.lastname as user_lastname
         FROM info_resources_comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.info_resource_id = ?
         ORDER BY c.comment_date ASC`,
        [resourceId]
      );
      
      // Organiser les commentaires en hiérarchie (commentaires parents avec leurs réponses)
      const commentsMap = new Map<number, InfoResourceComment>();
      const rootComments: InfoResourceComment[] = [];
      
      // Initialiser tous les commentaires dans la map
      allComments.forEach(comment => {
        comment.replies = [];
        commentsMap.set(comment.id, comment);
      });
      
      // Organiser la hiérarchie
      allComments.forEach(comment => {
        if (comment.parent_id) {
          // C'est une réponse, l'ajouter au parent
          const parent = commentsMap.get(comment.parent_id);
          if (parent) {
            parent.replies!.push(comment);
          }
        } else {
          // C'est un commentaire racine
          rootComments.push(comment);
        }
      });
      
      // Trier les commentaires racine par date décroissante (plus récents d'abord)
      rootComments.sort((a, b) => new Date(b.comment_date).getTime() - new Date(a.comment_date).getTime());
      
      // Trier les réponses par date croissante (plus anciennes d'abord)
      rootComments.forEach(comment => {
        if (comment.replies) {
          comment.replies.sort((a, b) => new Date(a.comment_date).getTime() - new Date(b.comment_date).getTime());
        }
      });
      
      return rootComments;
    } catch (error) {
      console.error('Erreur lors de la récupération des commentaires:', error);
      throw error;
    }
  }

  /**
   * Ajoute un commentaire à une ressource d'information
   * @param resourceId ID de la ressource
   * @param userId ID de l'utilisateur
   * @param message Message du commentaire
   * @returns Commentaire créé
   */
  async addCommentToInfoResource(resourceId: number, userId: number, message: string): Promise<InfoResourceComment> {
    try {
      // Insérer le commentaire
      const result = await db.execute(
        `INSERT INTO info_resources_comments (info_resource_id, user_id, message, comment_date)
         VALUES (?, ?, ?, datetime('now'))`,
        [resourceId, userId, message]
      );

      // Récupérer le commentaire créé avec les informations de l'utilisateur
      const comment = await db.queryOne<InfoResourceComment>(
        `SELECT c.*, u.firstname as user_firstname, u.lastname as user_lastname
         FROM info_resources_comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.id = ?`,
        [result.lastInsertId]
      );

      if (!comment) {
        throw new Error("Le commentaire a été créé mais n'a pas pu être récupéré");
      }

      return comment;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
      throw error;
    }
  }

  /**
   * Ajoute une réponse à un commentaire existant
   * @param resourceId ID de la ressource
   * @param userId ID de l'utilisateur
   * @param message Message de la réponse
   * @param parentId ID du commentaire parent
   * @returns Réponse créée
   */
  async addReplyToComment(resourceId: number, userId: number, message: string, parentId: number): Promise<InfoResourceComment> {
    try {
      // Vérifier que le commentaire parent existe et appartient à la même ressource
      const parentComment = await db.queryOne<InfoResourceComment>(
        `SELECT * FROM info_resources_comments 
         WHERE id = ? AND info_resource_id = ?`,
        [parentId, resourceId]
      );

      if (!parentComment) {
        throw new Error("Le commentaire parent n'existe pas ou n'appartient pas à cette ressource");
      }

      // Insérer la réponse
      const result = await db.execute(
        `INSERT INTO info_resources_comments (info_resource_id, user_id, message, parent_id, comment_date)
         VALUES (?, ?, ?, ?, datetime('now'))`,
        [resourceId, userId, message, parentId]
      );

      // Récupérer la réponse créée avec les informations de l'utilisateur
      const reply = await db.queryOne<InfoResourceComment>(
        `SELECT c.*, u.firstname as user_firstname, u.lastname as user_lastname
         FROM info_resources_comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.id = ?`,
        [result.lastInsertId]
      );

      if (!reply) {
        throw new Error("La réponse a été créée mais n'a pas pu être récupérée");
      }

      return reply;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la réponse:', error);
      throw error;
    }
  }

  /**
   * Supprime un commentaire d'une ressource d'information ainsi que toutes ses réponses
   * @param commentId ID du commentaire
   * @param userId ID de l'utilisateur (pour vérification)
   * @param isAdmin Si l'utilisateur est administrateur
   * @returns Succès de l'opération
   */
  async deleteInfoResourceComment(commentId: number, userId: number, isAdmin: boolean): Promise<boolean> {
    try {
      // Vérifier d'abord si l'utilisateur a le droit de supprimer ce commentaire
      if (!isAdmin) {
        const comment = await db.queryOne<{user_id: number}>(
          `SELECT user_id FROM info_resources_comments WHERE id = ?`,
          [commentId]
        );
        
        if (!comment || comment.user_id !== userId) {
          return false; // L'utilisateur n'a pas le droit de supprimer ce commentaire
        }
      }

      // Commencer une transaction pour assurer la cohérence des données
      await db.execute('BEGIN TRANSACTION');

      try {
        // 1. Supprimer d'abord toutes les réponses à ce commentaire
        // (toutes les réponses sont supprimées car elles n'ont plus de sens sans le commentaire parent)
        await db.execute(
          `DELETE FROM info_resources_comments WHERE parent_id = ?`,
          [commentId]
        );

        // 2. Supprimer le commentaire parent
        const deleteCommentQuery = isAdmin
          ? `DELETE FROM info_resources_comments WHERE id = ?`
          : `DELETE FROM info_resources_comments WHERE id = ? AND user_id = ?`;
        
        const deleteCommentParams = isAdmin ? [commentId] : [commentId, userId];
        const result = await db.execute(deleteCommentQuery, deleteCommentParams);

        // Si le commentaire a été supprimé avec succès, valider la transaction
        if (result.changes > 0) {
          await db.execute('COMMIT');
          return true;
        } else {
          await db.execute('ROLLBACK');
          return false;
        }
      } catch (transactionError) {
        // En cas d'erreur dans la transaction, annuler tous les changements
        await db.execute('ROLLBACK');
        throw transactionError;
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du commentaire:', error);
      throw error;
    }
  }

  /**
   * Modifie un commentaire d'une ressource d'information
   * @param commentId ID du commentaire
   * @param userId ID de l'utilisateur (pour vérification)
   * @param newMessage Nouveau message du commentaire
   * @param isAdmin Si l'utilisateur est administrateur
   * @returns Commentaire modifié ou null si échec
   */
  async updateInfoResourceComment(commentId: number, userId: number, newMessage: string, isAdmin: boolean): Promise<InfoResourceComment | null> {
    try {
      // Vérifier d'abord si l'utilisateur a le droit de modifier ce commentaire
      if (!isAdmin) {
        const comment = await db.queryOne<{user_id: number, info_resource_id: number}>(
          `SELECT user_id, info_resource_id FROM info_resources_comments WHERE id = ?`,
          [commentId]
        );
        
        if (!comment || comment.user_id !== userId) {
          return null; // L'utilisateur n'a pas le droit de modifier ce commentaire
        }
      }

      // Mettre à jour le commentaire
      const updateQuery = isAdmin
        ? `UPDATE info_resources_comments SET message = ?, comment_date = datetime('now') WHERE id = ?`
        : `UPDATE info_resources_comments SET message = ?, comment_date = datetime('now') WHERE id = ? AND user_id = ?`;
      
      const updateParams = isAdmin ? [newMessage, commentId] : [newMessage, commentId, userId];
      const result = await db.execute(updateQuery, updateParams);

      if (result.changes === 0) {
        return null; // Aucune modification effectuée
      }

      // Récupérer le commentaire modifié avec les informations de l'utilisateur
      const updatedComment = await db.queryOne<InfoResourceComment>(
        `SELECT c.*, u.firstname as user_firstname, u.lastname as user_lastname
         FROM info_resources_comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.id = ?`,
        [commentId]
      );

      return updatedComment || null;
    } catch (error) {
      console.error('Erreur lors de la modification du commentaire:', error);
      throw error;
    }
  }

  /**
   * Vérifie si un utilisateur a liké une ressource d'information
   * @param resourceId ID de la ressource
   * @param userId ID de l'utilisateur
   * @returns True si l'utilisateur a liké la ressource
   */
  async hasUserLikedInfoResource(resourceId: number, userId: number): Promise<boolean> {
    try {
      const row = await db.queryOne(
        `SELECT 1 FROM info_resources_likes
         WHERE info_resource_id = ? AND user_id = ?`,
        [resourceId, userId]
      );
      
      return !!row;
    } catch (error) {
      console.error('Erreur lors de la vérification du like:', error);
      throw error;
    }
  }

  /**
   * Ajoute ou retire un like à une ressource d'information
   * @param resourceId ID de la ressource
   * @param userId ID de l'utilisateur
   * @returns Nouvel état du like (true = liké, false = non liké)
   */
  async toggleLikeInfoResource(resourceId: number, userId: number): Promise<boolean> {
    try {
      // Vérifier si l'utilisateur a déjà liké la ressource
      const hasLiked = await this.hasUserLikedInfoResource(resourceId, userId);

      if (hasLiked) {
        // Retirer le like
        await db.execute(
          `DELETE FROM info_resources_likes
           WHERE info_resource_id = ? AND user_id = ?`,
          [resourceId, userId]
        );
        return false;
      } else {
        // Ajouter le like
        await db.execute(
          `INSERT INTO info_resources_likes (info_resource_id, user_id, like_date)
           VALUES (?, ?, datetime('now'))`,
          [resourceId, userId]
        );
        return true;
      }
    } catch (error) {
      console.error('Erreur lors du toggle du like:', error);
      throw error;
    }
  }

  /**
   * Incrémente le compteur de partages d'une ressource d'information
   * @param resourceId ID de la ressource
   * @returns Nouveau nombre de partages
   */
  async incrementInfoResourceShares(resourceId: number): Promise<number> {
    try {
      // Incrémenter le compteur
      await db.execute(
        `UPDATE info_resources
         SET shares = shares + 1
         WHERE id = ?`,
        [resourceId]
      );

      // Récupérer le nouveau nombre de partages
      const result = await db.queryOne<{shares: number}>(
        `SELECT shares FROM info_resources WHERE id = ?`,
        [resourceId]
      );
      
      return result ? result.shares : 0;
    } catch (error) {
      console.error('Erreur lors de l\'incrémentation des partages:', error);
      throw error;
    }
  }

  /**
   * Incrémente le compteur de vues d'une ressource d'information
   * @param resourceId ID de la ressource
   * @returns Nouveau nombre de vues
   */
  private async incrementResourceViews(resourceId: number): Promise<number> {
    try {
      // Incrémenter le compteur
      await db.execute(
        `UPDATE info_resources
         SET views = views + 1
         WHERE id = ?`,
        [resourceId]
      );

      // Récupérer le nouveau nombre de vues
      const result = await db.queryOne<{views: number}>(
        `SELECT views FROM info_resources WHERE id = ?`,
        [resourceId]
      );
      
      return result ? result.views : 0;
    } catch (error) {
      console.error('Erreur lors de l\'incrémentation des vues:', error);
      throw error;
    }
  }

  /**
   * Récupère les tags d'une ressource d'information
   * @param resourceId ID de la ressource
   * @returns Liste des tags
   */
  private async getTagsForResource(resourceId: number): Promise<string[]> {
    try {
      const rows = await db.query<{name: string}>(
        `SELECT t.name
         FROM tags t
         JOIN info_resources_tags irt ON t.id = irt.tag_id
         WHERE irt.info_resource_id = ?`,
        [resourceId]
      );
      
      return rows.map(row => row.name);
    } catch (error) {
      console.error('Erreur lors de la récupération des tags:', error);
      throw error;
    }
  }

  /**
   * Récupère tous les tags disponibles
   * @returns Liste des tags
   */
  async getAllTags(): Promise<{id: number, name: string}[]> {
    try {
      const tags = await db.query<{id: number, name: string}>(
        `SELECT id, name FROM tags ORDER BY name`,
        []
      );
      
      return tags;
    } catch (error) {
      console.error('Erreur lors de la récupération des tags:', error);
      throw error;
    }
  }

  /**
   * Associe des tags à une ressource d'information
   * @param resourceId ID de la ressource
   * @param tags Liste des tags
   */
  private async associateTagsToResource(resourceId: number, tags: string[]): Promise<void> {
    try {
      for (const tag of tags) {
        // Vérifier si le tag existe
        const existingTag = await db.queryOne<{id: number}>(
          `SELECT id FROM tags WHERE name = ?`,
          [tag]
        );

        let tagId: number;

        if (existingTag) {
          tagId = existingTag.id;
        } else {
          // Créer le tag s'il n'existe pas
          const result = await db.execute(
            `INSERT INTO tags (name) VALUES (?)`,
            [tag]
          );
          tagId = result.lastInsertId;
        }

        // Associer le tag à la ressource
        await db.execute(
          `INSERT OR IGNORE INTO info_resources_tags (info_resource_id, tag_id)
           VALUES (?, ?)`,
          [resourceId, tagId]
        );
      }
    } catch (error) {
      console.error('Erreur lors de l\'association des tags:', error);
      throw error;
    }
  }

  /**
   * Récupère les ressources d'information likées par un utilisateur
   * @param userId ID de l'utilisateur
   * @returns Liste des ressources likées par l'utilisateur
   */
  async getUserLikedInfoResources(userId: number): Promise<InfoResource[]> {
    try {
      const resources = await db.query<InfoResource>(
        `SELECT ir.*, 
          (SELECT COUNT(*) FROM info_resources_likes WHERE info_resource_id = ir.id) as likes_count,
          (SELECT COUNT(*) FROM info_resources_comments WHERE info_resource_id = ir.id) as comments_count,
          irl.like_date
        FROM info_resources ir
        INNER JOIN info_resources_likes irl ON ir.id = irl.info_resource_id
        WHERE irl.user_id = ?
        ORDER BY irl.like_date DESC`,
        [userId]
      );

      // Récupérer les tags pour chaque ressource
      for (const resource of resources) {
        resource.tags = await this.getTagsForResource(resource.id);
      }
      
      return resources;
    } catch (error) {
      console.error('Erreur lors de la récupération des ressources likées:', error);
      throw error;
    }
  }

  /**
   * Récupère des recommandations d'articles basées sur le niveau de stress.
   * @param stressLevel Niveau de stress (ex: 'faible', 'modéré', 'élevé')
   * @param limit Nombre maximum de recommandations à retourner
   * @returns Liste des ressources d'information recommandées
   */
  async getRecommendationsByStressLevel(stressLevel: string, limit: number): Promise<InfoResource[]> {
    try {
      // Définir des mots-clés ou catégories cibles par niveau de stress
      let targetCategories: string[] = [];
      let targetTags: string[] = [];
      let difficultyLevels: string[] = []; // Pour le champ 'level' des articles

      switch (stressLevel) {
        case 'faible':
          targetCategories = ['Bien-être', 'Prévention', 'Méditation'];
          targetTags = ['bien-être', 'relaxation', 'prévention', 'mindfulness', 'routine'];
          difficultyLevels = ['débutant', 'tous niveaux'];
          break;
        case 'modéré':
          targetCategories = ['Stress', 'Techniques', 'Gestion du stress', 'Anxiété'];
          targetTags = ['stress', 'anxiété', 'gestion du stress', 'relaxation', 'cohérence cardiaque', 'techniques de respiration'];
          difficultyLevels = ['débutant', 'intermédiaire', 'tous niveaux'];
          break;
        case 'élevé':
          targetCategories = ['Stress', 'Anxiété', 'Soutien', 'Santé mentale'];
          targetTags = ['stress intense', 'crise', 'soutien psychologique', 'urgence', 'anxiété sévère', 'burnout'];
          difficultyLevels = ['débutant', 'tous niveaux', 'intermédiaire']; // Potentiellement éviter 'avancé' pour stress élevé initialement
          break;
        default:
          targetCategories = ['Bien-être', 'Stress', 'Techniques']; // Cas par défaut, large
          targetTags = ['bien-être', 'stress', 'relaxation', 'conseils'];
          difficultyLevels = ['débutant', 'tous niveaux'];
      }

      // Créer des clauses WHERE pour chaque catégorie
      const categoryClauses = targetCategories.map(cat => `ir.category LIKE '%${cat.replace(/\'/g, "''")}%'`).join(' OR ');
      
      // Construire la requête SQL
      const query = `
        SELECT ir.*,
          (SELECT COUNT(*) FROM info_resources_likes WHERE info_resource_id = ir.id) as likes_count,
          (SELECT COUNT(*) FROM info_resources_comments WHERE info_resource_id = ir.id) as comments_count
        FROM info_resources ir
        WHERE 
          (${categoryClauses})
          OR ir.id IN (
            SELECT DISTINCT irt.info_resource_id 
            FROM info_resources_tags irt 
            JOIN tags t ON irt.tag_id = t.id 
            WHERE t.name IN (${targetTags.map(() => '?').join(',')})
          )
          ${difficultyLevels.length > 0 ? `OR ir.level IN (${difficultyLevels.map(l => `'${l}'`).join(',')})` : ''}
        ORDER BY RANDOM()
        LIMIT ?
      `;

      const params = [...targetTags, limit];

      // Exécuter la requête
      const resources = await db.query<InfoResource>(query, params);

      // Attacher les tags à chaque ressource
      for (const resource of resources) {
        resource.tags = await this.getTagsForResource(resource.id);
      }
      
      return resources;
    } catch (error) {
      console.error('Erreur lors de la récupération des recommandations:', error);
      
      // Fallback: retourner quelques articles génériques si la requête échoue
      try {
        return await this.getAllInfoResources(limit, 0);
      } catch (fallbackError) {
        console.error('Erreur lors de la récupération des ressources de secours:', fallbackError);
        throw error; // Remonter l'erreur originale
      }
    }
  }
} 