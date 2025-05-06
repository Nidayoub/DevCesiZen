import { DiagnosticEventModel, DiagnosticResultModel } from "../models/diagnosticModel";

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
      // Récupérer les événements triés
      const events = await this.eventModel.getSorted();
      
      // Formater pour n'inclure que les informations nécessaires
      const formattedEvents = events.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        points: event.points,
        category: event.category
      }));
      
      return new Response(JSON.stringify({ 
        events: formattedEvents
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
      
      // Récupérer l'ID de l'utilisateur depuis le middleware d'authentification (peut être undefined)
      const userId = (req as any).userId;
      
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
      let interpretation = "";
      if (totalScore < 150) {
        interpretation = "Risque faible de problème de santé lié au stress (moins de 30%)";
      } else if (totalScore < 300) {
        interpretation = "Risque modéré de problème de santé lié au stress (30% à 50%)";
      } else {
        interpretation = "Risque élevé de problème de santé lié au stress (plus de 80%)";
      }
      
      // Enregistrer le résultat
      const result = await this.resultModel.createResult(
        userId || null,
        selectedEventIds,
        totalScore
      );
      
      return new Response(JSON.stringify({ 
        score: totalScore,
        interpretation,
        selectedEvents: selectedEvents.map(e => ({
          id: e.id,
          title: e.title,
          points: e.points
        })),
        resultId: result.id
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
      
      // Récupérer tous les événements existants
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
      const updatedEvents = await this.eventModel.getSorted();
      
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
} 