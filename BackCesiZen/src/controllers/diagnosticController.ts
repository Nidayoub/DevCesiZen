import { db } from "../data/database";

/**
 * Contrôleur pour la gestion du diagnostic de stress
 */
export class DiagnosticController {
  constructor() {
    // Utilisation uniquement de la base de données SQLite
  }

  /**
   * Récupère la liste des questions/événements de diagnostic depuis la base de données
   * @param req Requête
   * @returns Réponse
   */
  async getQuestions(req: Request): Promise<Response> {
    try {
      // Récupérer les questions directement depuis stress_events comme en dev
      const events = await db.query(`
        SELECT 
          id,
          event_text as title,
          points,
          category
        FROM stress_events
        ORDER BY category, points DESC
      `);
      
      return new Response(JSON.stringify({ 
        events
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      console.error("Erreur lors de la récupération des questions:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la récupération des questions"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Soumet un diagnostic et calcule un score de stress
   * @param req Requête
   * @returns Réponse avec le score et l'interprétation
   */
  async submitDiagnostic(req: Request): Promise<Response> {
    try {
      // Récupérer les données du corps de la requête
      const body = await req.json();
      const { selectedEventIds } = body;
      
      // Vérifier que les données sont valides
      if (!selectedEventIds || !Array.isArray(selectedEventIds)) {
        return new Response(JSON.stringify({ 
          error: "Liste d'événements requise"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Récupérer l'ID de l'utilisateur depuis le middleware d'authentification si disponible
      const userId = (req as any).userId;
      
      // Utiliser la base de données pour le diagnostic
      if (selectedEventIds.length === 0) {
        return new Response(JSON.stringify({ 
          error: "Sélectionnez au moins un événement"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Récupérer les événements sélectionnés avec leurs points depuis stress_events
      const placeholders = selectedEventIds.map(() => '?').join(',');
      const selectedEvents = await db.query(
        `SELECT id, event_text as title, points FROM stress_events WHERE id IN (${placeholders})`,
        selectedEventIds
      );
      
      // Calculer le score total
      let totalScore = 0;
      for (const event of selectedEvents) {
        totalScore += event.points;
      }
      
      // Déterminer le niveau de stress
      let stressLevel = "";
      let interpretation = "";
      
      if (totalScore < 150) {
        stressLevel = "Faible risque";
        interpretation = "Risque faible de problème de santé lié au stress (moins de 30%)";
      } else if (totalScore < 300) {
        stressLevel = "Risque modéré";
        interpretation = "Risque modéré de problème de santé lié au stress (30% à 50%)";
      } else {
        stressLevel = "Risque élevé";
        interpretation = "Risque élevé de problème de santé lié au stress (plus de 80%)";
      }
      
      let resultId = 0;
      
      // Si l'utilisateur est connecté, enregistrer le diagnostic
      console.log("🔍 UserId pour diagnostic:", userId);
      if (userId) {
        try {
          console.log("💾 Tentative d'enregistrement du diagnostic...");
          const insertResult = await db.execute(
            'INSERT INTO user_diagnostics (user_id, total_score, stress_level) VALUES (?, ?, ?)',
            [userId, totalScore, stressLevel]
          );
          
          resultId = insertResult.lastInsertId;
          console.log("✅ Diagnostic enregistré avec l'ID:", resultId);
          
          // Enregistrer les événements sélectionnés
          for (const eventId of selectedEventIds) {
            await db.execute(
              'INSERT INTO user_diagnostic_events (diagnostic_id, event_id) VALUES (?, ?)',
              [resultId, eventId]
            );
          }
          console.log("✅ Événements sélectionnés enregistrés");
        } catch (err) {
          // Si l'insertion échoue, on continue quand même sans stocker le diagnostic
          console.error("❌ ERREUR lors de l'enregistrement du diagnostic:", err);
          console.error("❌ Stack trace:", err instanceof Error ? err.stack : 'Unknown error');
        }
      } else {
        console.log("⚠️ Utilisateur non authentifié - diagnostic non sauvegardé");
      }
      
      // Renvoyer le résultat, même si l'enregistrement a échoué
      return new Response(JSON.stringify({ 
        score: totalScore,
        stressLevel,
        interpretation,
        selectedEvents,
        resultId
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      console.error("Erreur lors de la soumission du diagnostic:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la soumission du diagnostic"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Configure les questions/événements (admin uniquement)
   * @param req Requête
   * @returns Réponse
   */
  async configureQuestions(req: Request): Promise<Response> {
    try {
      // Récupérer les données du corps de la requête
      const body = await req.json();
      const { events } = body;
      
      // Vérifier que les données sont valides
      if (!events || !Array.isArray(events)) {
        return new Response(JSON.stringify({ 
          error: "Liste d'événements requise"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Utiliser la table stress_events avec des catégories texte
      for (const event of events) {
        // Vérifier que l'événement a tous les champs nécessaires
        if (!event.title || typeof event.points !== 'number') {
          continue;
        }
        
        // Convertir category_id en nom de catégorie si nécessaire
        let categoryName = 'Personnel'; // défaut
        if (event.category) {
          categoryName = event.category;
        }
        
        if (event.id && event.id > 0) {
          // Mettre à jour une question existante
          await db.execute(
            'UPDATE stress_events SET event_text = ?, points = ?, category = ? WHERE id = ?',
            [event.title, event.points, categoryName, event.id]
          );
        } else {
          // Créer une nouvelle question
          await db.execute(
            'INSERT INTO stress_events (event_text, points, category) VALUES (?, ?, ?)',
            [event.title, event.points, categoryName]
          );
        }
      }
      
      // Récupérer la liste mise à jour depuis stress_events
      const updatedEvents = await db.query(`
        SELECT 
          id,
          event_text as title,
          points,
          category
        FROM stress_events
        ORDER BY category, points DESC
      `);
      
      return new Response(JSON.stringify({ 
        message: "Questions configurées avec succès",
        events: updatedEvents
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      console.error("Erreur lors de la configuration des questions:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la configuration des questions"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Récupère l'historique des diagnostics d'un utilisateur
   * @param req Requête
   * @returns Réponse avec l'historique
   */
  async getUserHistory(req: Request): Promise<Response> {
    try {
      // Récupérer l'ID de l'utilisateur depuis le middleware d'authentification
      const userId = (req as any).userId;
      
      if (!userId) {
        return new Response(JSON.stringify({ 
          error: "Utilisateur non authentifié"
        }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Récupérer l'historique depuis la base de données
      console.log("🔍 Récupération de l'historique pour userId:", userId);
      const diagnostics = await db.query(
        `SELECT ud.id, ud.total_score, ud.stress_level, ud.date,
         (SELECT GROUP_CONCAT(event_id) FROM user_diagnostic_events WHERE diagnostic_id = ud.id) as event_ids
         FROM user_diagnostics ud
         WHERE ud.user_id = ?
         ORDER BY ud.date DESC`,
        [userId]
      );
      
      console.log("📊 Diagnostics trouvés:", diagnostics.length);
      console.log("📊 Diagnostics data:", diagnostics);
      
      // Transformer les données pour correspondre au format attendu par le frontend
      const formattedDiagnostics = diagnostics.map(diagnostic => {
        // Compter les événements sélectionnés
        const eventIds = diagnostic.event_ids ? diagnostic.event_ids.split(',').filter((id: string) => id) : [];
        
        // Générer l'interprétation basée sur le score
        let interpretation = "";
        const score = diagnostic.total_score;
        
        if (score < 150) {
          interpretation = "Risque faible de problème de santé lié au stress (moins de 30%)";
        } else if (score < 300) {
          interpretation = "Risque modéré de problème de santé lié au stress (30% à 50%)";
        } else {
          interpretation = "Risque élevé de problème de santé lié au stress (plus de 80%)";
        }
        
        return {
          id: diagnostic.id,
          total_score: diagnostic.total_score, // Frontend s'attend à total_score
          score: diagnostic.total_score, // Mobile s'attend à score
          stress_level: diagnostic.stress_level,
          interpretation: interpretation,
          date: diagnostic.date, // Frontend s'attend à date
          created_at: diagnostic.date, // Mobile s'attend à created_at
          selected_events_count: eventIds.length
        };
      });
      
      // Retourner le format attendu par le frontend avec wrapper
      return new Response(JSON.stringify({ 
        diagnostics: formattedDiagnostics 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      console.error("Erreur lors de la récupération de l'historique:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la récupération de l'historique"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Supprime un diagnostic spécifique de l'utilisateur
   * @param req Requête
   * @returns Réponse
   */
  async deleteDiagnostic(req: Request): Promise<Response> {
    try {
      // Récupérer l'ID de l'utilisateur depuis le middleware d'authentification
      const userId = (req as any).userId;
      
      if (!userId) {
        return new Response(JSON.stringify({ 
          error: "Utilisateur non authentifié"
        }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Extraire l'ID du diagnostic depuis l'URL
      const url = new URL(req.url);
      const pathParts = url.pathname.split('/');
      const diagnosticId = pathParts[pathParts.length - 1];
      
      if (!diagnosticId || isNaN(parseInt(diagnosticId))) {
        return new Response(JSON.stringify({ 
          error: "ID de diagnostic invalide"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      
            // Vérifier que le diagnostic appartient à l'utilisateur connecté
      const diagnostic = await db.queryOne(
        'SELECT id, user_id FROM user_diagnostics WHERE id = ?',
        [parseInt(diagnosticId)]
      );
      
      if (!diagnostic) {
        return new Response(JSON.stringify({ 
          error: "Diagnostic non trouvé"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      if (diagnostic.user_id !== userId) {
        return new Response(JSON.stringify({ 
          error: "Vous n'êtes pas autorisé à supprimer ce diagnostic"
        }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Supprimer d'abord les événements associés
      await db.execute(
        'DELETE FROM user_diagnostic_events WHERE diagnostic_id = ?',
        [parseInt(diagnosticId)]
      );
      
      // Supprimer le diagnostic
      await db.execute(
        'DELETE FROM user_diagnostics WHERE id = ?',
        [parseInt(diagnosticId)]
      );
      
      console.log(`🗑️ Diagnostic ${diagnosticId} supprimé pour l'utilisateur ${userId}`);
      
      return new Response(JSON.stringify({ 
        message: "Diagnostic supprimé avec succès"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      console.error("Erreur lors de la suppression du diagnostic:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la suppression du diagnostic"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
} 