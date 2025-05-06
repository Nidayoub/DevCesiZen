import { BaseModel } from "./baseModel";

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
 * Modèle pour la gestion des pages d'information
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
} 