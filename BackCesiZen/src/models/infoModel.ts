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
  user_firstname?: string;
  user_lastname?: string;
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
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT ir.*, 
          (SELECT COUNT(*) FROM info_resources_likes WHERE info_resource_id = ir.id) as likes_count,
          (SELECT COUNT(*) FROM info_resources_comments WHERE info_resource_id = ir.id) as comments_count
        FROM info_resources ir
        ORDER BY ir.publication_date DESC
        LIMIT ? OFFSET ?`,
        [limit, offset],
        async (err, rows) => {
          if (err) {
            reject(err);
            return;
          }

          try {
            // Récupérer les tags pour chaque ressource
            const resources = rows as InfoResource[];
            for (const resource of resources) {
              resource.tags = await this.getTagsForResource(resource.id);
            }
            resolve(resources);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }

  /**
   * Récupère une ressource d'information par son ID
   * @param id ID de la ressource
   * @returns Ressource ou null si non trouvée
   */
  async getInfoResourceById(id: number): Promise<InfoResource | null> {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT ir.*, 
          (SELECT COUNT(*) FROM info_resources_likes WHERE info_resource_id = ir.id) as likes_count,
          (SELECT COUNT(*) FROM info_resources_comments WHERE info_resource_id = ir.id) as comments_count
        FROM info_resources ir
        WHERE ir.id = ?`,
        [id],
        async (err, row) => {
          if (err) {
            reject(err);
            return;
          }

          if (!row) {
            resolve(null);
            return;
          }

          try {
            // Récupérer les tags pour cette ressource
            const resource = row as InfoResource;
            resource.tags = await this.getTagsForResource(resource.id);
            
            // Incrémenter le compteur de vues
            await this.incrementResourceViews(id);
            
            resolve(resource);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }

  /**
   * Récupère les ressources d'information par catégorie
   * @param category Catégorie
   * @param limit Limite de résultats
   * @param offset Offset pour la pagination
   * @returns Liste des ressources d'information
   */
  async getInfoResourcesByCategory(category: string, limit: number = 20, offset: number = 0): Promise<InfoResource[]> {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT ir.*, 
          (SELECT COUNT(*) FROM info_resources_likes WHERE info_resource_id = ir.id) as likes_count,
          (SELECT COUNT(*) FROM info_resources_comments WHERE info_resource_id = ir.id) as comments_count
        FROM info_resources ir
        WHERE ir.category = ?
        ORDER BY ir.publication_date DESC
        LIMIT ? OFFSET ?`,
        [category, limit, offset],
        async (err, rows) => {
          if (err) {
            reject(err);
            return;
          }

          try {
            // Récupérer les tags pour chaque ressource
            const resources = rows as InfoResource[];
            for (const resource of resources) {
              resource.tags = await this.getTagsForResource(resource.id);
            }
            resolve(resources);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }

  /**
   * Récupère les ressources d'information par tag
   * @param tag Tag
   * @param limit Limite de résultats
   * @param offset Offset pour la pagination
   * @returns Liste des ressources d'information
   */
  async getInfoResourcesByTag(tag: string, limit: number = 20, offset: number = 0): Promise<InfoResource[]> {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT ir.*, 
          (SELECT COUNT(*) FROM info_resources_likes WHERE info_resource_id = ir.id) as likes_count,
          (SELECT COUNT(*) FROM info_resources_comments WHERE info_resource_id = ir.id) as comments_count
        FROM info_resources ir
        JOIN info_resources_tags irt ON ir.id = irt.info_resource_id
        JOIN tags t ON irt.tag_id = t.id
        WHERE t.name = ?
        ORDER BY ir.publication_date DESC
        LIMIT ? OFFSET ?`,
        [tag, limit, offset],
        async (err, rows) => {
          if (err) {
            reject(err);
            return;
          }

          try {
            // Récupérer les tags pour chaque ressource
            const resources = rows as InfoResource[];
            for (const resource of resources) {
              resource.tags = await this.getTagsForResource(resource.id);
            }
            resolve(resources);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }

  /**
   * Crée une nouvelle ressource d'information
   * @param resource Données de la ressource
   * @returns Ressource créée
   */
  async createInfoResource(resource: Partial<InfoResource>, tags: string[] = []): Promise<InfoResource> {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run(
          `INSERT INTO info_resources (
            title, summary, content, category, author_id, 
            publication_date, modification_date, reading_time, level, views, shares
          ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'), ?, ?, 0, 0)`,
          [
            resource.title, 
            resource.summary, 
            resource.content, 
            resource.category, 
            resource.author_id,
            resource.reading_time,
            resource.level
          ],
          async function (err) {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
              return;
            }

            const resourceId = this.lastID;

            try {
              // Associer les tags
              if (tags.length > 0) {
                await this.associateTagsToResource(resourceId, tags);
              }

              // Récupérer la ressource créée
              db.get(
                `SELECT * FROM info_resources WHERE id = ?`,
                [resourceId],
                async (err, row) => {
                  if (err) {
                    db.run('ROLLBACK');
                    reject(err);
                    return;
                  }

                  db.run('COMMIT');
                  
                  const newResource = row as InfoResource;
                  newResource.tags = tags;
                  newResource.likes_count = 0;
                  newResource.comments_count = 0;
                  
                  resolve(newResource);
                }
              );
            } catch (error) {
              db.run('ROLLBACK');
              reject(error);
            }
          }.bind(this)
        );
      });
    });
  }

  /**
   * Met à jour une ressource d'information existante
   * @param id ID de la ressource
   * @param resource Données de la ressource
   * @param tags Tags à associer
   * @returns Ressource mise à jour
   */
  async updateInfoResource(id: number, resource: Partial<InfoResource>, tags: string[] = []): Promise<InfoResource> {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run(
          `UPDATE info_resources
           SET title = ?, summary = ?, content = ?, category = ?,
               modification_date = datetime('now'), reading_time = ?, level = ?
           WHERE id = ?`,
          [
            resource.title, 
            resource.summary, 
            resource.content, 
            resource.category,
            resource.reading_time,
            resource.level,
            id
          ],
          async (err) => {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
              return;
            }

            try {
              // Mettre à jour les tags si spécifiés
              if (tags.length > 0) {
                // Supprimer les associations existantes
                await new Promise<void>((resolve, reject) => {
                  db.run(
                    `DELETE FROM info_resources_tags WHERE info_resource_id = ?`,
                    [id],
                    (err) => {
                      if (err) reject(err);
                      else resolve();
                    }
                  );
                });

                // Ajouter les nouvelles associations
                await this.associateTagsToResource(id, tags);
              }

              // Récupérer la ressource mise à jour
              const updatedResource = await this.getInfoResourceById(id);
              
              if (!updatedResource) {
                db.run('ROLLBACK');
                reject(new Error("Ressource non trouvée après mise à jour"));
                return;
              }

              db.run('COMMIT');
              resolve(updatedResource);
            } catch (error) {
              db.run('ROLLBACK');
              reject(error);
            }
          }
        );
      });
    });
  }

  /**
   * Supprime une ressource d'information
   * @param id ID de la ressource
   * @returns Succès de l'opération
   */
  async deleteInfoResource(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.run(
        `DELETE FROM info_resources WHERE id = ?`,
        [id],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve(this.changes > 0);
        }
      );
    });
  }

  /**
   * Récupère les commentaires d'une ressource d'information
   * @param resourceId ID de la ressource
   * @returns Liste des commentaires
   */
  async getCommentsForInfoResource(resourceId: number): Promise<InfoResourceComment[]> {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT c.*, u.firstname as user_firstname, u.lastname as user_lastname
         FROM info_resources_comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.info_resource_id = ?
         ORDER BY c.comment_date DESC`,
        [resourceId],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows as InfoResourceComment[]);
        }
      );
    });
  }

  /**
   * Ajoute un commentaire à une ressource d'information
   * @param resourceId ID de la ressource
   * @param userId ID de l'utilisateur
   * @param message Message du commentaire
   * @returns Commentaire créé
   */
  async addCommentToInfoResource(resourceId: number, userId: number, message: string): Promise<InfoResourceComment> {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO info_resources_comments (info_resource_id, user_id, message, comment_date)
         VALUES (?, ?, ?, datetime('now'))`,
        [resourceId, userId, message],
        function (err) {
          if (err) {
            reject(err);
            return;
          }

          // Récupérer le commentaire créé avec les informations de l'utilisateur
          db.get(
            `SELECT c.*, u.firstname as user_firstname, u.lastname as user_lastname
             FROM info_resources_comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.id = ?`,
            [this.lastID],
            (err, row) => {
              if (err) {
                reject(err);
                return;
              }
              resolve(row as InfoResourceComment);
            }
          );
        }
      );
    });
  }

  /**
   * Supprime un commentaire d'une ressource d'information
   * @param commentId ID du commentaire
   * @param userId ID de l'utilisateur (pour vérification)
   * @param isAdmin Si l'utilisateur est administrateur
   * @returns Succès de l'opération
   */
  async deleteInfoResourceComment(commentId: number, userId: number, isAdmin: boolean): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Si l'utilisateur est admin, il peut supprimer n'importe quel commentaire
      // Sinon, il ne peut supprimer que ses propres commentaires
      const query = isAdmin
        ? `DELETE FROM info_resources_comments WHERE id = ?`
        : `DELETE FROM info_resources_comments WHERE id = ? AND user_id = ?`;
      
      const params = isAdmin ? [commentId] : [commentId, userId];
      
      db.run(query, params, function (err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.changes > 0);
      });
    });
  }

  /**
   * Vérifie si un utilisateur a liké une ressource d'information
   * @param resourceId ID de la ressource
   * @param userId ID de l'utilisateur
   * @returns True si l'utilisateur a liké la ressource
   */
  async hasUserLikedInfoResource(resourceId: number, userId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT 1 FROM info_resources_likes
         WHERE info_resource_id = ? AND user_id = ?`,
        [resourceId, userId],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(!!row);
        }
      );
    });
  }

  /**
   * Ajoute ou retire un like à une ressource d'information
   * @param resourceId ID de la ressource
   * @param userId ID de l'utilisateur
   * @returns Nouvel état du like (true = liké, false = non liké)
   */
  async toggleLikeInfoResource(resourceId: number, userId: number): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        // Vérifier si l'utilisateur a déjà liké la ressource
        const hasLiked = await this.hasUserLikedInfoResource(resourceId, userId);

        if (hasLiked) {
          // Retirer le like
          db.run(
            `DELETE FROM info_resources_likes
             WHERE info_resource_id = ? AND user_id = ?`,
            [resourceId, userId],
            (err) => {
              if (err) {
                reject(err);
                return;
              }
              resolve(false);
            }
          );
        } else {
          // Ajouter le like
          db.run(
            `INSERT INTO info_resources_likes (info_resource_id, user_id, like_date)
             VALUES (?, ?, datetime('now'))`,
            [resourceId, userId],
            (err) => {
              if (err) {
                reject(err);
                return;
              }
              resolve(true);
            }
          );
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Incrémente le compteur de partages d'une ressource d'information
   * @param resourceId ID de la ressource
   * @returns Nouveau nombre de partages
   */
  async incrementInfoResourceShares(resourceId: number): Promise<number> {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE info_resources
         SET shares = shares + 1
         WHERE id = ?`,
        [resourceId],
        (err) => {
          if (err) {
            reject(err);
            return;
          }

          // Récupérer le nouveau nombre de partages
          db.get(
            `SELECT shares FROM info_resources WHERE id = ?`,
            [resourceId],
            (err, row: any) => {
              if (err) {
                reject(err);
                return;
              }
              resolve(row ? row.shares : 0);
            }
          );
        }
      );
    });
  }

  /**
   * Incrémente le compteur de vues d'une ressource d'information
   * @param resourceId ID de la ressource
   * @returns Nouveau nombre de vues
   */
  private async incrementResourceViews(resourceId: number): Promise<number> {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE info_resources
         SET views = views + 1
         WHERE id = ?`,
        [resourceId],
        (err) => {
          if (err) {
            reject(err);
            return;
          }

          // Récupérer le nouveau nombre de vues
          db.get(
            `SELECT views FROM info_resources WHERE id = ?`,
            [resourceId],
            (err, row: any) => {
              if (err) {
                reject(err);
                return;
              }
              resolve(row ? row.views : 0);
            }
          );
        }
      );
    });
  }

  /**
   * Récupère les tags d'une ressource d'information
   * @param resourceId ID de la ressource
   * @returns Liste des tags
   */
  private async getTagsForResource(resourceId: number): Promise<string[]> {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT t.name
         FROM tags t
         JOIN info_resources_tags irt ON t.id = irt.tag_id
         WHERE irt.info_resource_id = ?`,
        [resourceId],
        (err, rows: any[]) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows.map(row => row.name));
        }
      );
    });
  }

  /**
   * Récupère tous les tags disponibles
   * @returns Liste des tags
   */
  async getAllTags(): Promise<{id: number, name: string}[]> {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT id, name FROM tags ORDER BY name`,
        [],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows as {id: number, name: string}[]);
        }
      );
    });
  }

  /**
   * Associe des tags à une ressource d'information
   * @param resourceId ID de la ressource
   * @param tags Liste des tags
   */
  private async associateTagsToResource(resourceId: number, tags: string[]): Promise<void> {
    for (const tag of tags) {
      // Vérifier si le tag existe
      const existingTag = await new Promise<{id: number} | null>((resolve, reject) => {
        db.get(
          `SELECT id FROM tags WHERE name = ?`,
          [tag],
          (err, row) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(row as {id: number} | null);
          }
        );
      });

      let tagId: number;

      if (existingTag) {
        tagId = existingTag.id;
      } else {
        // Créer le tag s'il n'existe pas
        tagId = await new Promise<number>((resolve, reject) => {
          db.run(
            `INSERT INTO tags (name) VALUES (?)`,
            [tag],
            function (err) {
              if (err) {
                reject(err);
                return;
              }
              resolve(this.lastID);
            }
          );
        });
      }

      // Associer le tag à la ressource
      await new Promise<void>((resolve, reject) => {
        db.run(
          `INSERT OR IGNORE INTO info_resources_tags (info_resource_id, tag_id)
           VALUES (?, ?)`,
          [resourceId, tagId],
          (err) => {
            if (err) {
              reject(err);
              return;
            }
            resolve();
          }
        );
      });
    }
  }

  /**
   * Récupère des recommandations d'articles basées sur le niveau de stress.
   * @param stressLevel Niveau de stress (ex: 'faible', 'modéré', 'élevé')
   * @param limit Nombre maximum de recommandations à retourner
   * @returns Liste des ressources d'information recommandées
   */
  async getRecommendationsByStressLevel(stressLevel: string, limit: number): Promise<InfoResource[]> {
    return new Promise(async (resolve, reject) => {
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

      // Construire la requête SQL pour chercher par catégorie OU par tag.
      // On utilise LIKE pour les tags car ils sont stockés en JSON array string `["tag1","tag2"]`
      // ou via une table de jointure `info_resources_tags` si elle existe et est peuplée.
      // Pour la simplicité ici, je vais supposer que `tags` est une colonne texte et on cherche dedans.
      // Si `tags` est bien géré par la table de jointure `info_resources_tags`, la requête serait plus complexe.
      // Le code existant `getTagsForResource` et `associateTagsToResource` suggère une table de jointure.

      // Priorité: Catégorie, puis tags si pas assez de résultats par catégorie.
      // On va essayer de construire une requête qui pondère ou combine ces critères.
      // Pour l'instant, une approche simple: chercher par catégorie OU tag, puis trier/limiter.
      
      // Créer des clauses WHERE pour chaque tag et catégorie
      const categoryClauses = targetCategories.map(cat => `ir.category LIKE '%${cat.replace(/\'/g, "''")}%'`).join(' OR ');
      // Pour les tags, en supposant qu'ils sont dans une table de jointure `tags` et `info_resources_tags`
      const tagPlaceholders = targetTags.map(() => '?').join(',');
      
      // Cette requête tente de trouver des articles dont la catégorie est pertinente OU qui ont des tags pertinents.
      // Elle utilise une sous-requête pour les tags.
      const query = `
        SELECT ir.*,\n          (SELECT COUNT(*) FROM info_resources_likes WHERE info_resource_id = ir.id) as likes_count,\n          (SELECT COUNT(*) FROM info_resources_comments WHERE info_resource_id = ir.id) as comments_count\n        FROM info_resources ir\n        WHERE \n          (${categoryClauses})\n          OR ir.id IN (\n            SELECT DISTINCT irt.info_resource_id \n            FROM info_resources_tags irt \n            JOIN tags t ON irt.tag_id = t.id \n            WHERE t.name IN (${tagPlaceholders})\n          )\n          ${difficultyLevels.length > 0 ? `OR ir.level IN (${difficultyLevels.map(l => `'${l}'`).join(',')})` : ''}
        ORDER BY RANDOM() -- Pour varier les suggestions\n        LIMIT ?;\n      `;

      const params = [...targetTags, limit];

      db.all(query, params, async (err, rows: InfoResource[]) => {
        if (err) {
          console.error("SQL Error in getRecommendationsByStressLevel (InfoModel):", err);
          // Fallback: retourner quelques articles génériques si la requête échoue
          try {
            const fallbackArticles = await this.getAllInfoResources(limit, 0); // Prendre les plus récents
            resolve(fallbackArticles);
          } catch (fallbackError) {
            reject(fallbackError);
          }
          return;
        }

        if (rows && rows.length > 0) {
          // Attacher les tags à chaque ressource comme le font les autres méthodes
          for (const resource of rows) {
            resource.tags = await this.getTagsForResource(resource.id);
          }
          resolve(rows);
        } else {
          // Si rien ne correspond, prendre les plus récents/populaires comme fallback
          try {
            const fallbackArticles = await this.getAllInfoResources(limit, 0);
            resolve(fallbackArticles);
          } catch (fallbackError) {
            reject(fallbackError);
          }
        }
      });
    });
  }
} 