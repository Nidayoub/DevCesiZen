import { BreathingExerciseModel } from "../models/breathingModel";

/**
 * Contrôleur pour la gestion des exercices de respiration
 */
export class BreathingController {
  private breathingModel: BreathingExerciseModel;

  constructor() {
    this.breathingModel = new BreathingExerciseModel();
  }

  /**
   * Récupère tous les exercices de respiration
   * @param req Requête
   * @returns Réponse avec la liste des exercices
   */
  async getAllExercises(req: Request): Promise<Response> {
    try {
      const exercises = await this.breathingModel.getAll();
      
      return new Response(JSON.stringify({ 
        exercises 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des exercices:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la récupération des exercices de respiration"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Récupère un exercice de respiration par son ID
   * @param req Requête
   * @param id ID de l'exercice
   * @returns Réponse avec l'exercice demandé
   */
  async getExerciseById(req: Request, id: number): Promise<Response> {
    try {
      const exercise = await this.breathingModel.getById(id);
      
      if (!exercise) {
        return new Response(JSON.stringify({ 
          error: "Exercice de respiration non trouvé"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ 
        exercise 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Erreur lors de la récupération de l'exercice:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la récupération de l'exercice de respiration"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Récupère les différents types d'exercices disponibles
   * @param req Requête
   * @returns Réponse avec la liste des types d'exercices
   */
  async getExerciseTypes(req: Request): Promise<Response> {
    try {
      const types = await this.breathingModel.getTypes();
      
      return new Response(JSON.stringify({ 
        types 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des types d'exercices:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la récupération des types d'exercices de respiration"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
} 