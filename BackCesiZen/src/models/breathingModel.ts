import { BaseModel } from "./baseModel";
import { db } from "../data/database";

/**
 * Interface pour un exercice de respiration
 */
export interface BreathingExercise {
  id: number;
  name: string;
  description: string;
  type: string;
  steps: BreathingStep[];
  benefits: string[];
  difficulty: 'débutant' | 'intermédiaire' | 'avancé';
  duration: number; // en minutes
  iconName?: string;
}

/**
 * Interface pour une étape d'exercice de respiration
 */
export interface BreathingStep {
  name: string;
  duration: number; // en secondes
  instruction: string;
}

/**
 * Modèle pour la gestion des exercices de respiration
 */
export class BreathingExerciseModel extends BaseModel<BreathingExercise> {
  // Exercices de respiration prédéfinis
  private readonly predefinedExercises: BreathingExercise[] = [
    {
      id: 1,
      name: "Respiration 4-7-8",
      description: "Technique de respiration du Dr Andrew Weil pour réduire l'anxiété et faciliter l'endormissement",
      type: "relaxation",
      steps: [
        { name: "Inspiration", duration: 4, instruction: "Inspirez lentement et profondément par le nez" },
        { name: "Rétention", duration: 7, instruction: "Retenez votre souffle" },
        { name: "Expiration", duration: 8, instruction: "Expirez complètement par la bouche en faisant un son doux" }
      ],
      benefits: [
        "Diminution de l'anxiété",
        "Aide à l'endormissement",
        "Réduction de la tension artérielle"
      ],
      difficulty: "débutant",
      duration: 5,
      iconName: "sleep"
    },
    {
      id: 2,
      name: "Respiration carrée",
      description: "Technique équilibrée pour calmer le système nerveux rapidement",
      type: "équilibrage",
      steps: [
        { name: "Inspiration", duration: 4, instruction: "Inspirez lentement par le nez" },
        { name: "Rétention", duration: 4, instruction: "Retenez votre souffle" },
        { name: "Expiration", duration: 4, instruction: "Expirez lentement par le nez" },
        { name: "Pause", duration: 4, instruction: "Restez poumons vides" }
      ],
      benefits: [
        "Équilibre du système nerveux",
        "Amélioration de la concentration",
        "Gestion rapide du stress"
      ],
      difficulty: "débutant",
      duration: 3,
      iconName: "balance"
    },
    {
      id: 3,
      name: "Respiration cohérence cardiaque 5-5",
      description: "Technique scientifiquement prouvée pour réguler le système nerveux autonome",
      type: "équilibrage",
      steps: [
        { name: "Inspiration", duration: 5, instruction: "Inspirez lentement par le nez en gonflant le ventre" },
        { name: "Expiration", duration: 5, instruction: "Expirez lentement par la bouche ou le nez" }
      ],
      benefits: [
        "Réduction du cortisol",
        "Équilibre du système nerveux autonome",
        "Amélioration de la variabilité cardiaque"
      ],
      difficulty: "débutant",
      duration: 5,
      iconName: "heart"
    },
    {
      id: 4,
      name: "Respiration diaphragmatique",
      description: "Respiration profonde par le ventre pour activer le système nerveux parasympathique",
      type: "relaxation",
      steps: [
        { name: "Inspiration", duration: 4, instruction: "Inspirez profondément par le nez en gonflant le ventre" },
        { name: "Expiration", duration: 6, instruction: "Expirez lentement par la bouche en rentrant le ventre" }
      ],
      benefits: [
        "Activation du système nerveux parasympathique",
        "Oxygénation optimale du corps",
        "Réduction de la tension musculaire"
      ],
      difficulty: "débutant",
      duration: 5,
      iconName: "lungs"
    },
    {
      id: 5,
      name: "Ujjayi (Respiration océanique)",
      description: "Technique du yoga consistant à respirer par le nez en contractant légèrement la gorge",
      type: "yogique",
      steps: [
        { name: "Inspiration", duration: 5, instruction: "Inspirez lentement par le nez en contractant légèrement la gorge" },
        { name: "Expiration", duration: 5, instruction: "Expirez par le nez en maintenant la légère contraction de la gorge" }
      ],
      benefits: [
        "Concentration améliorée",
        "Apaisement mental",
        "Préparation à la méditation"
      ],
      difficulty: "intermédiaire",
      duration: 10,
      iconName: "yoga"
    },
    {
      id: 6,
      name: "Respiration alternée (Nadi Shodhana)",
      description: "Technique yogique d'alternance des narines pour équilibrer les deux hémisphères cérébraux",
      type: "yogique",
      steps: [
        { name: "Préparation", duration: 2, instruction: "Fermez la narine droite avec le pouce droit" },
        { name: "Inspiration gauche", duration: 4, instruction: "Inspirez lentement par la narine gauche" },
        { name: "Transition", duration: 1, instruction: "Fermez la narine gauche avec l'annulaire, ouvrez la narine droite" },
        { name: "Expiration droite", duration: 4, instruction: "Expirez lentement par la narine droite" },
        { name: "Inspiration droite", duration: 4, instruction: "Inspirez lentement par la narine droite" },
        { name: "Transition", duration: 1, instruction: "Fermez la narine droite avec le pouce, ouvrez la narine gauche" },
        { name: "Expiration gauche", duration: 4, instruction: "Expirez lentement par la narine gauche" }
      ],
      benefits: [
        "Équilibre des hémisphères cérébraux",
        "Purification des nadis (canaux énergétiques)",
        "Préparation à la méditation profonde"
      ],
      difficulty: "intermédiaire",
      duration: 10,
      iconName: "balance"
    },
    {
      id: 7,
      name: "Respiration énergisante (Kapalabhati)",
      description: "Technique de purification yogique avec expirations rapides et forcées",
      type: "énergisant",
      steps: [
        { name: "Préparation", duration: 5, instruction: "Asseyez-vous confortablement, dos droit" },
        { name: "Inspiration passive", duration: 1, instruction: "Inspirez passivement par le nez" },
        { name: "Expiration active", duration: 1, instruction: "Expirez rapidement et activement en contractant l'abdomen" },
        { name: "Répétition", duration: 30, instruction: "Répétez les expirations actives à un rythme d'environ 1 par seconde" },
        { name: "Respiration normale", duration: 30, instruction: "Revenez à une respiration normale" }
      ],
      benefits: [
        "Activation de l'énergie",
        "Oxygénation du cerveau",
        "Nettoyage des sinus"
      ],
      difficulty: "avancé",
      duration: 3,
      iconName: "energy"
    }
  ];

  constructor() {
    super("breathing_exercises");
    
    // Initialisation avec les exercices prédéfinis si pas de données
    if (this.data.length === 0) {
      this.data = [...this.predefinedExercises];
    }
  }

  /**
   * Récupère tous les types d'exercices de respiration disponibles
   * @returns Liste des types d'exercices
   */
  async getTypes(): Promise<string[]> {
    try {
      // Essayer de récupérer depuis la base de données
      const types = await db.query('SELECT DISTINCT type FROM breathing_exercises');
      return types.map(t => t.type);
    } catch (error) {
      // Fallback sur les données en mémoire
      const uniqueTypes = new Set(this.data.map(exercise => exercise.type));
      return Array.from(uniqueTypes);
    }
  }

  /**
   * Récupère tous les exercices de respiration
   * @returns Liste des exercices
   */
  async getAll(): Promise<BreathingExercise[]> {
    try {
      // Essayer de récupérer depuis la base de données
      const exercises = await db.query('SELECT * FROM breathing_exercises');
      return exercises.map(e => ({
        ...e,
        steps: JSON.parse(e.steps || '[]'),
        benefits: JSON.parse(e.benefits || '[]')
      }));
    } catch (error) {
      // Fallback sur les données en mémoire
      return [...this.data];
    }
  }

  /**
   * Récupère des recommandations d'exercices de respiration basées sur le niveau de stress.
   * @param stressLevel Niveau de stress (ex: 'faible', 'modéré', 'élevé')
   * @param limit Nombre maximum de recommandations à retourner
   * @returns Liste des exercices de respiration recommandés
   */
  async getRecommendationsByStressLevel(stressLevel: string, limit: number): Promise<BreathingExercise[]> {
    return new Promise(async (resolve, reject) => {
      let targetDifficulties: string[] = [];
      let targetTypes: string[] = [];

      switch (stressLevel) {
        case 'faible':
          targetDifficulties = ['débutant', 'intermédiaire'];
          targetTypes = ['équilibrage', 'relaxation', 'yogique'];
          break;
        case 'modéré':
          targetDifficulties = ['débutant', 'intermédiaire'];
          targetTypes = ['relaxation', 'équilibrage', 'yogique'];
          break;
        case 'élevé':
          targetDifficulties = ['débutant']; // Préférer les exercices simples pour un stress élevé
          targetTypes = ['relaxation', 'équilibrage']; // Éviter les énergisants initialement
          break;
        default: // Cas par défaut, inclure des exercices accessibles
          targetDifficulties = ['débutant'];
          targetTypes = ['relaxation', 'équilibrage'];
      }

      const difficultyPlaceholders = targetDifficulties.map(() => '?').join(',');
      const typePlaceholders = targetTypes.map(() => '?').join(',');

      const query = `
        SELECT * FROM breathing_exercises 
        WHERE difficulty IN (${difficultyPlaceholders})
        AND type IN (${typePlaceholders})
        ORDER BY RANDOM() 
        LIMIT ?
      `;
      const params = [...targetDifficulties, ...targetTypes, limit];

      try {
        const exercises = await db.query(query, params);
        if (exercises && exercises.length > 0) {
          resolve(exercises.map(e => ({...e, steps: JSON.parse(e.steps || '[]'), benefits: JSON.parse(e.benefits || '[]') })));
        } else {
          // Fallback si aucun exercice spécifique n'est trouvé, prendre quelques exercices débutants au hasard
          const fallbackQuery = `SELECT * FROM breathing_exercises WHERE difficulty = ? ORDER BY RANDOM() LIMIT ?`;
          const fallbackExercises = await db.query(fallbackQuery, ['débutant', limit]);
          resolve(fallbackExercises.map(e => ({...e, steps: JSON.parse(e.steps || '[]'), benefits: JSON.parse(e.benefits || '[]') })));
        }
      } catch (error) {
        console.error("SQL Error in getRecommendationsByStressLevel (BreathingModel):", error);
        // Fallback en mémoire si la DB échoue complètement
        const allExercises = await this.getAll(); // Utilise déjà le fallback interne sur predefinedExercises
        const filteredFallback = allExercises.filter(ex => 
          targetDifficulties.includes(ex.difficulty) && targetTypes.includes(ex.type)
        ).slice(0, limit);
        if (filteredFallback.length > 0) resolve(filteredFallback);
        else resolve(allExercises.slice(0, limit)); // Si toujours rien, prendre les premiers de la liste globale
      }
    });
  }
} 