import { DiagnosticEventModel, DiagnosticResultModel } from "../models/diagnosticModel";
import { db } from "../data/database";
import { verifyToken } from "../middlewares/auth";

/**
 * Contrôleur pour la gestion du diagnostic de stress
 */
export class DiagnosticController {
  private eventModel: DiagnosticEventModel;
  private resultModel: DiagnosticResultModel;

  constructor() {
    this.eventModel = new DiagnosticEventModel();
    this.resultModel = new DiagnosticResultModel();
  }

  /**
   * Récupère la liste des questions/événements de l'échelle de Holmes & Rahe
   * @param req Requête
   * @returns Réponse
   */
  async getQuestions(req: Request): Promise<Response> {
    try {
      // Essayer d'abord de récupérer depuis SQLite
      let events = [];
      try {
        events = await db.query('SELECT id, event_text as title, "" as description, points, category FROM stress_events ORDER BY category, points DESC');
      } catch (sqlError) {
        console.log("Fallback vers le stockage JSON pour les événements");
        // Fallback sur le modèle JSON si la table SQLite n'est pas disponible
        const jsonEvents = await this.eventModel.getAll();
        events = jsonEvents.map(event => ({
          id: event.id,
          title: event.title,
          description: event.description,
          points: event.points,
          category: event.category
        }));
      }
      
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
      
      // Utilisation de SQLite si possible
      try {
        if (selectedEventIds.length === 0) {
          return new Response(JSON.stringify({ 
            error: "Sélectionnez au moins un événement"
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        
        // Récupérer les événements sélectionnés avec leurs points
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
        if (userId) {
          try {
            const insertResult = await db.execute(
              'INSERT INTO user_diagnostics (user_id, total_score, stress_level) VALUES (?, ?, ?)',
              [userId, totalScore, stressLevel]
            );
            
            resultId = insertResult.lastInsertId;
            
            // Enregistrer les événements sélectionnés
            for (const eventId of selectedEventIds) {
              await db.execute(
                'INSERT INTO user_diagnostic_events (diagnostic_id, event_id) VALUES (?, ?)',
                [resultId, eventId]
              );
            }
          } catch (err) {
            // Si l'insertion échoue, on continue quand même sans stocker le diagnostic
            console.error("Erreur lors de l'enregistrement du diagnostic:", err);
          }
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
        
      } catch (sqlError) {
        console.error("Erreur SQLite, fallback vers JSON:", sqlError);
        
        // Fallback sur le modèle JSON
        // Récupérer tous les événements pour calculer le score
        const allEvents = await this.eventModel.getAll();
        
        // Calculer le score total
        let totalScore = 0;
        const selectedEvents = [];
        
        for (const eventId of selectedEventIds) {
          const event = allEvents.find(e => e.id === eventId);
          if (event) {
            totalScore += event.points;
            selectedEvents.push(event);
          }
        }
        
        // Déterminer l'interprétation du score
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
        
        // Essayer d'enregistrer le résultat si l'utilisateur est connecté
        let resultId = 0;
        try {
          if (userId) {
            const result = await this.resultModel.createResult(
              userId,
              selectedEventIds,
              totalScore
            );
            resultId = result.id;
          }
        } catch (err) {
          console.error("Erreur lors de l'enregistrement du diagnostic:", err);
        }
        
        return new Response(JSON.stringify({ 
          score: totalScore,
          stressLevel,
          interpretation,
          selectedEvents: selectedEvents.map(e => ({
            id: e.id,
            title: e.title,
            points: e.points
          })),
          resultId
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      
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
      
      try {
        // Essayer d'utiliser SQLite
        for (const event of events) {
          // Vérifier que l'événement a tous les champs nécessaires
          if (!event.title || typeof event.points !== 'number') {
            continue;
          }
          
          if (event.id) {
            // Mettre à jour un événement existant
            await db.execute(
              'UPDATE stress_events SET event_text = ?, points = ?, category = ? WHERE id = ?',
              [event.title, event.points, event.category || "Autre", event.id]
            );
          } else {
            // Créer un nouvel événement
            await db.execute(
              'INSERT INTO stress_events (event_text, points, category) VALUES (?, ?, ?)',
              [event.title, event.points, event.category || "Autre"]
            );
          }
        }
        
        // Récupérer la liste mise à jour
        const updatedEvents = await this.eventModel.getAll();
        
        return new Response(JSON.stringify({ 
          message: "Questions configurées avec succès",
          events: updatedEvents
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
        
      } catch (sqlError) {
        console.error("Erreur SQLite, fallback vers JSON:", sqlError);
        
        // Fallback sur le modèle JSON
        const existingEvents = await this.eventModel.getAll();
        
        for (const event of events) {
          // Vérifier que l'événement a tous les champs nécessaires
          if (!event.title || typeof event.points !== 'number') {
            continue;
          }
          
          if (event.id) {
            // Mettre à jour un événement existant
            const existingEvent = existingEvents.find(e => e.id === event.id);
            
            if (existingEvent) {
              await this.eventModel.update(event.id, {
                title: event.title,
                description: event.description || existingEvent.description,
                points: event.points,
                category: event.category || existingEvent.category,
                order: event.order || existingEvent.order
              });
            }
          } else {
            // Créer un nouvel événement
            await this.eventModel.create({
              title: event.title,
              description: event.description || "",
              points: event.points,
              category: event.category || "Autre",
              order: event.order || existingEvents.length + 1
            });
          }
        }
        
        // Récupérer la liste mise à jour
        const updatedEvents = await this.eventModel.getAll();
        
        return new Response(JSON.stringify({ 
          message: "Questions configurées avec succès",
          events: updatedEvents
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      
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
      
      try {
        // Récupérer l'historique depuis SQLite
        const diagnostics = await db.query(
          `SELECT ud.id, ud.total_score, ud.stress_level, ud.date,
           (SELECT GROUP_CONCAT(event_id) FROM user_diagnostic_events WHERE diagnostic_id = ud.id) as event_ids
           FROM user_diagnostics ud
           WHERE ud.user_id = ?
           ORDER BY ud.date DESC`,
          [userId]
        );
        
        return new Response(JSON.stringify({ 
          diagnostics
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
        
      } catch (sqlError) {
        console.error("Erreur SQLite, fallback vers JSON:", sqlError);
        
        // Fallback sur le modèle JSON
        const results = await this.resultModel.getByUserId(userId);
        
        return new Response(JSON.stringify({ 
          diagnostics: results
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      
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
} 