import { BaseModel } from "./baseModel";

/**
 * Interface pour les événements de diagnostic
 */
export interface DiagnosticEvent {
  id: number;
  title: string;
  description: string;
  points: number;
  category: string;
  order: number;
}

/**
 * Interface pour les résultats de diagnostic
 */
export interface DiagnosticResult {
  id: number;
  userId: number | null; // Peut être null pour les diagnostics anonymes
  selectedEvents: number[]; // IDs des événements sélectionnés
  score: number;
  createdAt: string;
}

/**
 * Modèle pour la gestion des événements de diagnostic
 */
export class DiagnosticEventModel extends BaseModel<DiagnosticEvent> {
  constructor() {
    super("diagnostic_events");
    
    // Initialiser avec les événements de l'échelle Holmes & Rahe si vide
    this.initializeIfEmpty();
  }

  /**
   * Récupère les événements triés par ordre
   * @returns Liste des événements triés
   */
  async getSorted(): Promise<DiagnosticEvent[]> {
    return [...this.data].sort((a, b) => a.order - b.order);
  }

  /**
   * Initialise les événements si la liste est vide
   * Utilise l'échelle de stress de Holmes & Rahe
   */
  private async initializeIfEmpty(): Promise<void> {
    if (this.data.length === 0) {
      // Événements de l'échelle de Holmes & Rahe
      const events: Omit<DiagnosticEvent, "id">[] = [
        { title: "Décès du conjoint", description: "Perte du conjoint par décès", points: 100, category: "Familial", order: 1 },
        { title: "Divorce", description: "Dissolution légale du mariage", points: 73, category: "Familial", order: 2 },
        { title: "Séparation conjugale", description: "Séparation du conjoint", points: 65, category: "Familial", order: 3 },
        { title: "Emprisonnement", description: "Période d'incarcération", points: 63, category: "Personnel", order: 4 },
        { title: "Décès d'un proche parent", description: "Perte d'un membre de la famille proche", points: 63, category: "Familial", order: 5 },
        { title: "Blessure ou maladie personnelle", description: "Problème de santé majeur", points: 53, category: "Santé", order: 6 },
        { title: "Mariage", description: "Union maritale", points: 50, category: "Familial", order: 7 },
        { title: "Licenciement", description: "Perte d'emploi", points: 47, category: "Professionnel", order: 8 },
        { title: "Réconciliation conjugale", description: "Réconciliation avec le conjoint", points: 45, category: "Familial", order: 9 },
        { title: "Retraite", description: "Fin de la carrière professionnelle", points: 45, category: "Professionnel", order: 10 },
        { title: "Changement de santé d'un membre de la famille", description: "Problème de santé d'un proche", points: 44, category: "Familial", order: 11 },
        { title: "Grossesse", description: "Attente d'un enfant", points: 40, category: "Familial", order: 12 },
        { title: "Difficultés sexuelles", description: "Problèmes dans la vie sexuelle", points: 39, category: "Personnel", order: 13 },
        { title: "Arrivée d'un nouvel enfant", description: "Naissance ou adoption", points: 39, category: "Familial", order: 14 },
        { title: "Réajustement professionnel", description: "Changement majeur au travail", points: 39, category: "Professionnel", order: 15 },
        { title: "Changement de situation financière", description: "Amélioration ou détérioration significative", points: 38, category: "Financier", order: 16 },
        { title: "Décès d'un ami proche", description: "Perte d'un ami important", points: 37, category: "Personnel", order: 17 },
        { title: "Changement de métier", description: "Changement de type de travail", points: 36, category: "Professionnel", order: 18 },
        { title: "Changement dans les relations avec le conjoint", description: "Plus ou moins de discussions", points: 35, category: "Familial", order: 19 },
        { title: "Contraction d'un prêt important", description: "Prêt immobilier ou professionnel", points: 31, category: "Financier", order: 20 },
        { title: "Saisie d'hypothèque ou de prêt", description: "Impossibilité de rembourser", points: 30, category: "Financier", order: 21 },
        { title: "Changement de responsabilités au travail", description: "Promotion, rétrogradation, mutation", points: 29, category: "Professionnel", order: 22 },
        { title: "Départ d'un enfant du foyer", description: "Enfant quittant la maison", points: 29, category: "Familial", order: 23 },
        { title: "Problèmes avec la belle-famille", description: "Conflits familiaux", points: 29, category: "Familial", order: 24 },
        { title: "Réussite personnelle marquante", description: "Accomplissement personnel important", points: 28, category: "Personnel", order: 25 },
        { title: "Conjoint commençant ou arrêtant de travailler", description: "Changement professionnel du conjoint", points: 26, category: "Familial", order: 26 },
        { title: "Début ou fin d'études", description: "Entrée ou sortie du système éducatif", points: 26, category: "Personnel", order: 27 },
        { title: "Changement de conditions de vie", description: "Modification du confort ou de l'environnement", points: 25, category: "Personnel", order: 28 },
        { title: "Révision des habitudes personnelles", description: "Changement de mode de vie", points: 24, category: "Personnel", order: 29 },
        { title: "Difficultés avec un supérieur", description: "Problèmes avec un responsable au travail", points: 23, category: "Professionnel", order: 30 },
        { title: "Changement d'horaires ou de conditions de travail", description: "Modification du cadre professionnel", points: 20, category: "Professionnel", order: 31 },
        { title: "Déménagement", description: "Changement de lieu de résidence", points: 20, category: "Personnel", order: 32 },
        { title: "Changement d'école", description: "Nouvel établissement scolaire", points: 20, category: "Personnel", order: 33 },
        { title: "Changement dans les loisirs", description: "Modification des activités récréatives", points: 19, category: "Personnel", order: 34 },
        { title: "Changement dans les activités religieuses", description: "Augmentation ou diminution", points: 19, category: "Personnel", order: 35 },
        { title: "Changement dans les activités sociales", description: "Modification des habitudes sociales", points: 18, category: "Personnel", order: 36 },
        { title: "Petit emprunt", description: "Crédit à la consommation", points: 17, category: "Financier", order: 37 },
        { title: "Changement dans les habitudes de sommeil", description: "Modification du rythme ou de la qualité", points: 16, category: "Personnel", order: 38 },
        { title: "Changement dans les habitudes alimentaires", description: "Modification du régime alimentaire", points: 15, category: "Personnel", order: 39 },
        { title: "Vacances", description: "Période de congés", points: 13, category: "Personnel", order: 40 },
        { title: "Fêtes de fin d'année", description: "Période des festivités", points: 12, category: "Personnel", order: 41 },
        { title: "Petite infraction légale", description: "Contravention, amende", points: 11, category: "Personnel", order: 42 }
      ];
      
      // Ajouter chaque événement
      for (const event of events) {
        await this.create(event);
      }
      
      console.log("Événements de diagnostic initialisés avec l'échelle de Holmes & Rahe");
    }
  }
}

/**
 * Modèle pour la gestion des résultats de diagnostic
 */
export class DiagnosticResultModel extends BaseModel<DiagnosticResult> {
  constructor() {
    super("diagnostic_results");
  }

  /**
   * Récupère les résultats d'un utilisateur
   * @param userId ID de l'utilisateur
   * @returns Liste des résultats de l'utilisateur
   */
  async getByUserId(userId: number): Promise<DiagnosticResult[]> {
    return this.data
      .filter(result => result.userId === userId)
      .map(result => ({ ...result }));
  }

  /**
   * Crée un nouveau résultat de diagnostic
   * @param userId ID de l'utilisateur (peut être null)
   * @param selectedEvents IDs des événements sélectionnés
   * @param score Score calculé
   * @returns Le résultat créé
   */
  async createResult(userId: number | null, selectedEvents: number[], score: number): Promise<DiagnosticResult> {
    return this.create({
      userId,
      selectedEvents,
      score,
      createdAt: new Date().toISOString()
    });
  }
} 