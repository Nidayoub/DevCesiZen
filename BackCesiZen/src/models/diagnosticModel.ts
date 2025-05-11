import { db } from "../data/database";

/**
 * Interface pour les événements de diagnostic
 */
export interface DiagnosticEvent {
  id: number;
  title: string;
  description: string;
  points: number;
  category: string;
  order_num: number;
}

/**
 * Interface pour les résultats de diagnostic
 */
export interface DiagnosticResult {
  id: number;
  user_id: number | null; // Peut être null pour les diagnostics anonymes
  score: number;
  created_at: string;
  selected_events?: DiagnosticEvent[]; // Événements sélectionnés
}

/**
 * Modèle pour la gestion des événements de diagnostic
 */
export class DiagnosticEventModel {
  /**
   * Récupère tous les événements de diagnostic
   * @returns Promesse avec la liste des événements
   */
  async getAll(): Promise<DiagnosticEvent[]> {
    try {
      const events = await db.query('SELECT * FROM diagnostic_questions ORDER BY order_num');
      return events as DiagnosticEvent[];
    } catch (error) {
      console.error('Erreur lors de la récupération des événements:', error);
      return [];
    }
  }

  /**
   * Récupère un événement par son ID
   * @param id ID de l'événement
   * @returns Promesse avec l'événement ou null
   */
  async getById(id: number): Promise<DiagnosticEvent | null> {
    try {
      const event = await db.queryOne('SELECT * FROM diagnostic_questions WHERE id = ?', [id]);
      return event as DiagnosticEvent || null;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'événement:', error);
      return null;
    }
  }

  /**
   * Récupère les événements par catégorie
   * @param category Catégorie des événements
   * @returns Promesse avec la liste des événements
   */
  async getByCategory(category: string): Promise<DiagnosticEvent[]> {
    try {
      const categoryId = await db.queryOne('SELECT id FROM diagnostic_categories WHERE name = ?', [category]);
      if (!categoryId) {
        return [];
      }
      
      const events = await db.query(
        'SELECT * FROM diagnostic_questions WHERE category_id = ? ORDER BY order_num', 
        [categoryId.id]
      );
      return events as DiagnosticEvent[];
    } catch (error) {
      console.error('Erreur lors de la récupération des événements par catégorie:', error);
      return [];
    }
  }

  /**
   * Crée un nouvel événement de diagnostic
   * @param event Données de l'événement
   * @returns Promesse avec l'événement créé
   */
  async create(event: Omit<DiagnosticEvent, "id">): Promise<DiagnosticEvent> {
    try {
      const result = await db.execute(
        `INSERT INTO diagnostic_questions (title, description, points, category_id, order_num)
         VALUES (?, ?, ?, ?, ?)`,
        [event.title, event.description, event.points, event.category, event.order_num]
      );
      
      const newEvent = await this.getById(result.lastInsertId);
      if (!newEvent) {
        throw new Error("Impossible de récupérer l'événement créé");
      }
      
      return newEvent;
    } catch (error) {
      console.error('Erreur lors de la création de l\'événement:', error);
      throw error;
    }
  }

  /**
   * Met à jour un événement existant
   * @param id ID de l'événement
   * @param event Données à mettre à jour
   * @returns Promesse avec l'événement mis à jour
   */
  async update(id: number, event: Partial<DiagnosticEvent>): Promise<DiagnosticEvent | null> {
    try {
      // Construire la requête dynamiquement
      const updateFields = [];
      const params = [];
      
      if (event.title !== undefined) {
        updateFields.push('title = ?');
        params.push(event.title);
      }
      
      if (event.description !== undefined) {
        updateFields.push('description = ?');
        params.push(event.description);
      }
      
      if (event.points !== undefined) {
        updateFields.push('points = ?');
        params.push(event.points);
      }
      
      if (event.category !== undefined) {
        updateFields.push('category_id = ?');
        params.push(event.category);
      }
      
      if (event.order_num !== undefined) {
        updateFields.push('order_num = ?');
        params.push(event.order_num);
      }
      
      if (updateFields.length === 0) {
        return this.getById(id);
      }
      
      // Ajouter l'ID à la fin des paramètres
      params.push(id);
      
      await db.execute(
        `UPDATE diagnostic_questions SET ${updateFields.join(', ')} WHERE id = ?`,
        params
      );
      
      return this.getById(id);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'événement:', error);
      return null;
    }
  }

  /**
   * Supprime un événement de diagnostic
   * @param id ID de l'événement
   * @returns Promesse avec le succès de la suppression
   */
  async delete(id: number): Promise<boolean> {
    try {
      const result = await db.execute('DELETE FROM diagnostic_questions WHERE id = ?', [id]);
      return result.changes > 0;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'événement:', error);
      return false;
    }
  }
}

/**
 * Modèle pour la gestion des résultats de diagnostic
 */
export class DiagnosticResultModel {
  /**
   * Récupère tous les résultats de diagnostic
   * @returns Promesse avec la liste des résultats
   */
  async getAll(): Promise<DiagnosticResult[]> {
    try {
      const results = await db.query('SELECT * FROM diagnostic_results ORDER BY created_at DESC');
      
      // Ajout des événements sélectionnés pour chaque résultat
      for (const result of results) {
        result.selected_events = await this.getEventsForResult(result.id);
      }
      
      return results as DiagnosticResult[];
    } catch (error) {
      console.error('Erreur lors de la récupération des résultats:', error);
      return [];
    }
  }

  /**
   * Récupère un résultat par son ID avec les événements associés
   * @param id ID du résultat
   * @returns Promesse avec le résultat ou null
   */
  async getById(id: number): Promise<DiagnosticResult | null> {
    try {
      const result = await db.queryOne('SELECT * FROM diagnostic_results WHERE id = ?', [id]);
      
      if (!result) {
        return null;
      }
      
      // Récupérer les événements associés
      const diagnosticResult = result as DiagnosticResult;
      diagnosticResult.selected_events = await this.getEventsForResult(id);
      
      return diagnosticResult;
    } catch (error) {
      console.error('Erreur lors de la récupération du résultat:', error);
      return null;
    }
  }

  /**
   * Récupère les résultats d'un utilisateur
   * @param userId ID de l'utilisateur
   * @returns Promesse avec la liste des résultats
   */
  async getByUserId(userId: number): Promise<DiagnosticResult[]> {
    try {
      const results = await db.query(
        'SELECT * FROM diagnostic_results WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );
      
      // Récupérer les événements pour chaque résultat
      for (const result of results) {
        result.selected_events = await this.getEventsForResult(result.id);
      }
      
      return results as DiagnosticResult[];
    } catch (error) {
      console.error('Erreur lors de la récupération des résultats de l\'utilisateur:', error);
      return [];
    }
  }

  /**
   * Récupère les événements associés à un résultat
   * @param resultId ID du résultat
   * @returns Promesse avec la liste des événements
   */
  private async getEventsForResult(resultId: number): Promise<DiagnosticEvent[]> {
    try {
      // Pour la nouvelle structure où les questions sont stockées en JSON dans la colonne selected_questions
      const result = await db.queryOne('SELECT selected_questions FROM diagnostic_results WHERE id = ?', [resultId]);
      
      if (result && result.selected_questions) {
        // Parsez la liste d'IDs JSON
        const questionIds = JSON.parse(result.selected_questions);
        
        if (Array.isArray(questionIds) && questionIds.length > 0) {
          // Récupérez les questions correspondantes
          const questions = await db.query(
            `SELECT q.* 
             FROM diagnostic_questions q
             WHERE q.id IN (${questionIds.join(',')})
             ORDER BY q.order_num`
          );
          
          return questions as DiagnosticEvent[];
        }
      }
      
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des événements du résultat:', error);
      return [];
    }
  }

  /**
   * Crée un nouveau résultat de diagnostic
   * @param userId ID de l'utilisateur (peut être null)
   * @param eventIds IDs des événements sélectionnés
   * @param score Score calculé
   * @returns Promesse avec le résultat créé
   */
  async create(userId: number | null, eventIds: number[], score: number): Promise<DiagnosticResult> {
    try {
      // Déterminer le niveau de stress
      let stressLevel = "";
      
      if (score < 150) {
        stressLevel = "Faible risque";
      } else if (score < 300) {
        stressLevel = "Risque modéré";
      } else {
        stressLevel = "Risque élevé";
      }
      
      // Stocker les IDs des questions en tant que JSON
      const selectedQuestionsJson = JSON.stringify(eventIds);
      
      const result = await db.execute(
        `INSERT INTO diagnostic_results 
         (user_id, score, stress_level, selected_questions, created_at)
         VALUES (?, ?, ?, ?, datetime('now'))`,
        [userId, score, stressLevel, selectedQuestionsJson]
      );
      
      const newResultId = result.lastInsertId;
      const newResult = await this.getById(newResultId);
      
      if (!newResult) {
        throw new Error("Impossible de récupérer le résultat créé");
      }
      
      return newResult;
    } catch (error) {
      console.error('Erreur lors de la création du résultat:', error);
      throw error;
    }
  }

  /**
   * Supprime un résultat de diagnostic
   * @param id ID du résultat
   * @returns Promesse avec le succès de la suppression
   */
  async delete(id: number): Promise<boolean> {
    try {
      const result = await db.execute('DELETE FROM diagnostic_results WHERE id = ?', [id]);
      return result.changes > 0;
    } catch (error) {
      console.error('Erreur lors de la suppression du résultat:', error);
      return false;
    }
  }
  
  /**
   * Pour la compatibilité avec l'ancien code
   */
  async createResult(userId: number | null, eventIds: number[], score: number): Promise<DiagnosticResult> {
    return this.create(userId, eventIds, score);
  }
} 