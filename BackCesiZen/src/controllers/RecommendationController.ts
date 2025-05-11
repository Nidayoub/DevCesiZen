import { InfoModel, InfoResource } from "../models/infoModel";
import { BreathingExerciseModel, BreathingExercise } from "../models/breathingModel";

// Define the structure for the recommendations the frontend expects
interface DynamicRecommendation {
  id: string | number;
  type: 'article' | 'exercise';
  title: string;
  description?: string;
  path: string;
}

export class RecommendationController {
  private infoModel: InfoModel;
  private breathingModel: BreathingExerciseModel;

  constructor() {
    this.infoModel = new InfoModel();
    this.breathingModel = new BreathingExerciseModel();
  }

  async getRecommendations(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const stressLevel = url.searchParams.get('stressLevel')?.toLowerCase() || 'modéré'; // Default to moderate
    const limitPerType = Math.max(1, Math.floor(parseInt(url.searchParams.get('limit') || '4') / 2)); // Default to 2 of each type if limit is 4

    try {
      let articles: InfoResource[] = [];
      let exercises: BreathingExercise[] = [];
      const recommendations: DynamicRecommendation[] = [];

      // Fetch relevant articles - This method needs to be implemented in InfoModel
      try {
        articles = await this.infoModel.getRecommendationsByStressLevel(stressLevel, limitPerType);
        articles.forEach(article => {
          recommendations.push({
            id: article.id, // Assuming 'id' is preferred for path construction based on frontend
            type: 'article',
            title: article.title,
            description: article.summary, // Or a snippet of content
            path: `/info/resources/${article.id}` // Use ID for path as per existing info resource links
          });
        });
      } catch (infoError) {
        console.error("Error fetching article recommendations:", infoError);
        // Continue even if articles fail, to provide exercises if possible
      }

      // Fetch relevant breathing exercises - This method needs to be implemented in BreathingExerciseModel
      try {
        exercises = await this.breathingModel.getRecommendationsByStressLevel(stressLevel, limitPerType);
        exercises.forEach(exercise => {
          recommendations.push({
            id: exercise.id,
            type: 'exercise',
            title: exercise.name,
            description: exercise.description,
            path: `/resources/${exercise.id}`
          });
        });
      } catch (breathingError) {
        console.error("Error fetching breathing exercise recommendations:", breathingError);
        // Continue even if exercises fail
      }
      
      // Shuffle recommendations to provide variety if both types return results
      recommendations.sort(() => 0.5 - Math.random());
      
      // Ensure the total number of recommendations respects the overall limit if needed
      const overallLimit = parseInt(url.searchParams.get('limit') || '4');
      const finalRecommendations = recommendations.slice(0, overallLimit);


      if (finalRecommendations.length === 0) {
        // Fallback: Provide generic links if no specific recommendations found
        finalRecommendations.push(
          { id: 'fallback-articles', type: 'article', title: "Explorer nos articles", description: "Conseils et informations sur le bien-être.", path: "/info/resources" },
          { id: 'fallback-exercises', type: 'exercise', title: "Découvrir les exercices de respiration", description: "Techniques pour la relaxation et la gestion du stress.", path: "/resources" }
        );
      }
      
      return new Response(JSON.stringify({ recommendations: finalRecommendations }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    } catch (error) {
      console.error("Erreur majeure lors de la récupération des recommandations:", error);
      return new Response(JSON.stringify({ error: "Erreur serveur lors de la récupération des recommandations" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
} 