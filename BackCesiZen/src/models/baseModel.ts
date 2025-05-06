import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

/**
 * Modèle de base pour interagir avec un fichier JSON comme base de données
 */
export class BaseModel<T extends { id: number }> {
  protected dataPath: string;
  protected data: T[] = [];
  protected autoIncrement: number = 1;

  /**
   * Constructeur du modèle de base
   * @param fileName Nom du fichier JSON à utiliser comme stockage
   */
  constructor(fileName: string) {
    // Chemin vers le dossier de données
    const dataDir = join(process.cwd(), "src", "data");
    
    // Créer le dossier de données s'il n'existe pas
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
    
    // Chemin vers le fichier de données
    this.dataPath = join(dataDir, `${fileName}.json`);
    
    // Charger les données existantes ou créer un fichier vide
    this.loadData();
  }

  /**
   * Charge les données depuis le fichier JSON
   */
  protected loadData(): void {
    try {
      if (existsSync(this.dataPath)) {
        const fileContent = readFileSync(this.dataPath, "utf-8");
        const jsonData = JSON.parse(fileContent);
        this.data = jsonData.data || [];
        this.autoIncrement = jsonData.autoIncrement || 1;
      } else {
        // Initialiser avec un tableau vide et sauvegarder
        this.saveData();
      }
    } catch (error) {
      console.error(`Erreur lors du chargement des données: ${error}`);
      this.data = [];
      this.autoIncrement = 1;
    }
  }

  /**
   * Sauvegarde les données dans le fichier JSON
   */
  protected saveData(): void {
    try {
      const jsonData = {
        data: this.data,
        autoIncrement: this.autoIncrement
      };
      writeFileSync(this.dataPath, JSON.stringify(jsonData, null, 2), "utf-8");
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde des données: ${error}`);
    }
  }

  /**
   * Récupère tous les éléments
   * @returns Liste de tous les éléments
   */
  async getAll(): Promise<T[]> {
    return [...this.data];
  }

  /**
   * Récupère un élément par son ID
   * @param id ID de l'élément à récupérer
   * @returns L'élément trouvé ou null
   */
  async getById(id: number): Promise<T | null> {
    const item = this.data.find(item => item.id === id);
    return item ? { ...item } : null;
  }

  /**
   * Crée un nouvel élément
   * @param item Élément à créer
   * @returns L'élément créé avec son ID
   */
  async create(item: Omit<T, "id">): Promise<T> {
    const newItem = {
      ...item,
      id: this.autoIncrement
    } as T;
    
    this.data.push(newItem);
    this.autoIncrement++;
    this.saveData();
    
    return { ...newItem };
  }

  /**
   * Met à jour un élément
   * @param id ID de l'élément à mettre à jour
   * @param updates Mises à jour à appliquer
   * @returns L'élément mis à jour ou null si non trouvé
   */
  async update(id: number, updates: Partial<T>): Promise<T | null> {
    const index = this.data.findIndex(item => item.id === id);
    
    if (index === -1) {
      return null;
    }
    
    const updatedItem = {
      ...this.data[index],
      ...updates,
      id // S'assurer que l'ID reste le même
    };
    
    this.data[index] = updatedItem;
    this.saveData();
    
    return { ...updatedItem };
  }

  /**
   * Supprime un élément
   * @param id ID de l'élément à supprimer
   * @returns true si supprimé, false sinon
   */
  async delete(id: number): Promise<boolean> {
    const initialLength = this.data.length;
    this.data = this.data.filter(item => item.id !== id);
    
    if (initialLength !== this.data.length) {
      this.saveData();
      return true;
    }
    
    return false;
  }
} 