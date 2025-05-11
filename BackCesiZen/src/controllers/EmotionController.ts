import { EmotionModel, EmotionEntryModel } from '../models/emotionModel';
import { verifyToken } from '../middlewares/auth';

/**
 * Contrôleur pour la gestion des émotions et du journal émotionnel
 */
export class EmotionController {
  private emotionModel: EmotionModel;
  private entryModel: EmotionEntryModel;

  constructor() {
    this.emotionModel = new EmotionModel();
    this.entryModel = new EmotionEntryModel();
  }

  /**
   * Récupérer toutes les émotions disponibles
   */
  async getAllEmotions(req: Request): Promise<Response> {
    try {
      const emotions = await this.emotionModel.getAll();
      
      return new Response(JSON.stringify({ emotions }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des émotions:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la récupération des émotions" 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Créer une nouvelle émotion personnalisée (utilisateur connecté)
   */
  async createEmotion(req: Request): Promise<Response> {
    try {
      const { name, color, icon } = await req.json();
      const userId = (req as any).userId;
      
      if (!name || !color) {
        return new Response(JSON.stringify({ 
          error: "Le nom et la couleur sont requis"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      const emotion = await this.emotionModel.create({
        name,
        color,
        icon,
        is_default: false
      });
      
      return new Response(JSON.stringify({ 
        message: "Émotion créée avec succès",
        emotion
      }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Erreur lors de la création de l'émotion:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la création de l'émotion" 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Modifier une émotion personnalisée (utilisateur connecté)
   */
  async updateEmotion(req: Request, id: number): Promise<Response> {
    try {
      const { name, color, icon } = await req.json();
      
      const existingEmotion = await this.emotionModel.getById(id);
      
      if (!existingEmotion) {
        return new Response(JSON.stringify({ 
          error: "Émotion non trouvée"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Empêcher la modification des émotions par défaut
      if (existingEmotion.is_default) {
        return new Response(JSON.stringify({ 
          error: "Les émotions par défaut ne peuvent pas être modifiées"
        }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      await this.emotionModel.update(id, {
        name: name || existingEmotion.name,
        color: color || existingEmotion.color,
        icon: icon || existingEmotion.icon
      });
      
      return new Response(JSON.stringify({ 
        message: "Émotion mise à jour avec succès"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'émotion:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la mise à jour de l'émotion" 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Supprimer une émotion personnalisée (utilisateur connecté)
   */
  async deleteEmotion(req: Request, id: number): Promise<Response> {
    try {
      const existingEmotion = await this.emotionModel.getById(id);
      
      if (!existingEmotion) {
        return new Response(JSON.stringify({ 
          error: "Émotion non trouvée"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Empêcher la suppression des émotions par défaut
      if (existingEmotion.is_default) {
        return new Response(JSON.stringify({ 
          error: "Les émotions par défaut ne peuvent pas être supprimées"
        }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      await this.emotionModel.delete(id);
      
      return new Response(JSON.stringify({ 
        message: "Émotion supprimée avec succès"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Erreur lors de la suppression de l'émotion:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la suppression de l'émotion" 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Récupérer les entrées du journal d'émotions d'un utilisateur
   */
  async getUserEmotionEntries(req: Request): Promise<Response> {
    try {
      const userId = (req as any).userId;
      const url = new URL(req.url);
      const startDate = url.searchParams.get('start_date') || undefined;
      const endDate = url.searchParams.get('end_date') || undefined;
      
      const entries = await this.entryModel.getEntriesByUserId(
        userId, 
        startDate, 
        endDate
      );
      
      return new Response(JSON.stringify({ 
        entries 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des entrées:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la récupération des entrées" 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Ajouter une entrée au journal d'émotions
   */
  async createEmotionEntry(req: Request): Promise<Response> {
    try {
      const { emotion_id, intensity, notes, date } = await req.json();
      const userId = (req as any).userId;
      
      if (!emotion_id || !intensity) {
        return new Response(JSON.stringify({ 
          error: "L'émotion et l'intensité sont requises"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      const emotion = await this.emotionModel.getById(emotion_id);
      if (!emotion) {
        return new Response(JSON.stringify({ 
          error: "Émotion non trouvée"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      const entry = await this.entryModel.create({
        user_id: userId,
        emotion_id,
        intensity,
        notes: notes || null,
        date: date || null
      });
      
      return new Response(JSON.stringify({ 
        message: "Entrée créée avec succès",
        entry: {
          ...entry,
          emotion_name: emotion.name,
          emotion_color: emotion.color,
          emotion_icon: emotion.icon
        }
      }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Erreur lors de la création de l'entrée:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la création de l'entrée" 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Modifier une entrée du journal d'émotions
   */
  async updateEmotionEntry(req: Request, id: number): Promise<Response> {
    try {
      const { emotion_id, intensity, notes, date } = await req.json();
      const userId = (req as any).userId;
      
      const existingEntry = await this.entryModel.getEntryById(id, userId);
      
      if (!existingEntry) {
        return new Response(JSON.stringify({ 
          error: "Entrée non trouvée ou non autorisée"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Vérifier que l'émotion existe si elle est modifiée
      if (emotion_id && emotion_id !== existingEntry.emotion_id) {
        const emotion = await this.emotionModel.getById(emotion_id);
        if (!emotion) {
          return new Response(JSON.stringify({ 
            error: "Émotion non trouvée"
          }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }
      }
      
      await this.entryModel.update(id, userId, {
        emotion_id,
        intensity,
        notes,
        date
      });
      
      return new Response(JSON.stringify({ 
        message: "Entrée mise à jour avec succès"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'entrée:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la mise à jour de l'entrée" 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Supprimer une entrée du journal d'émotions
   */
  async deleteEmotionEntry(req: Request, id: number): Promise<Response> {
    try {
      const userId = (req as any).userId;
      
      const existingEntry = await this.entryModel.getEntryById(id, userId);
      
      if (!existingEntry) {
        return new Response(JSON.stringify({ 
          error: "Entrée non trouvée ou non autorisée"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      await this.entryModel.delete(id, userId);
      
      return new Response(JSON.stringify({ 
        message: "Entrée supprimée avec succès"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Erreur lors de la suppression de l'entrée:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la suppression de l'entrée" 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Générer un rapport sur les émotions sur une période donnée
   */
  async getEmotionReport(req: Request): Promise<Response> {
    try {
      const userId = (req as any).userId;
      const url = new URL(req.url);
      const period = url.searchParams.get('period') as 'week' | 'month' | 'quarter' | 'year' || 'month';
      
      const summary = await this.entryModel.getEmotionSummary(userId, period);
      
      // Grouper les données pour le graphique
      const emotionData = summary.reduce((acc: any, item: any) => {
        if (!acc[item.emotion_name]) {
          acc[item.emotion_name] = {
            name: item.emotion_name,
            color: item.color,
            data: []
          };
        }
        
        acc[item.emotion_name].data.push({
          date: item.date,
          count: item.count,
          intensity: item.average_intensity
        });
        
        return acc;
      }, {});
      
      // Transformer en tableau pour le frontend
      const reportData = Object.values(emotionData);
      
      return new Response(JSON.stringify({ 
        report: {
          period,
          data: reportData,
          summary
        }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Erreur lors de la génération du rapport:", error);
      return new Response(JSON.stringify({ 
        error: "Erreur lors de la génération du rapport" 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
} 