import { Database } from 'bun:sqlite';

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private db: Database | null = null;
  private isConnected: boolean = false;

  private constructor() {}

  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  async connect(): Promise<void> {
    if (this.isConnected && this.db) {
      console.log("📊 Déjà connecté à la base de données");
      return;
    }

    try {
      console.log("📊 Tentative de connexion à la base de données");
      this.db = new Database('cesi-zen.db');
      this.isConnected = true;
      console.log('📊 Connecté avec succès à la base de données SQLite');
    } catch (error) {
      console.error('❌ ERREUR CRITIQUE - Connexion à SQLite échouée:', error);
      if (error instanceof Error) {
        console.error("Message d'erreur:", error.message);
        console.error("Stack trace:", error.stack);
      }
      this.isConnected = false;
      this.db = null;
      throw error;
    }
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.isConnected) {
      console.log("📊 Connexion automatique avant requête query");
      await this.connect();
    }

    try {
      console.log("📊 Exécution de la requête SQL:", sql);
      console.log("📊 Paramètres:", params);
      const statement = this.db!.prepare(sql);
      const results = statement.all(...params);
      console.log(`📊 Résultat query: ${Array.isArray(results) ? results.length : 0} lignes trouvées`);
      return Array.isArray(results) ? results : [];
    } catch (error) {
      console.error('❌ ERREUR SQL - query:', error);
      console.error("Requête échouée:", sql);
      console.error("Paramètres:", params);
      if (error instanceof Error) {
        console.error("Message d'erreur:", error.message);
        console.error("Stack trace:", error.stack);
      }
      throw error;
    }
  }

  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    if (!this.isConnected) {
      console.log("📊 Connexion automatique avant requête queryOne");
      await this.connect();
    }

    try {
      console.log("📊 Exécution de la requête SQL (queryOne):", sql);
      console.log("📊 Paramètres:", params);
      const statement = this.db!.prepare(sql);
      const result = statement.get(...params);
      console.log(`📊 Résultat queryOne: ${result ? "Enregistrement trouvé" : "Aucun enregistrement"}`);
      return result || null;
    } catch (error) {
      console.error('❌ ERREUR SQL - queryOne:', error);
      console.error("Requête échouée:", sql);
      console.error("Paramètres:", params);
      if (error instanceof Error) {
        console.error("Message d'erreur:", error.message);
        console.error("Stack trace:", error.stack);
      }
      throw error;
    }
  }

  async execute(sql: string, params: any[] = []): Promise<{ lastInsertId: number; changes: number }> {
    if (!this.isConnected) {
      console.log("📊 Connexion automatique avant requête execute");
      await this.connect();
    }

    try {
      // Masquer les mots de passe dans les logs
      const sanitizedParams = params.map(p => 
        typeof p === 'string' && p.length > 20 ? '***HASHED_PASSWORD***' : p
      );
      
      console.log("📊 Exécution de la requête SQL (execute):", sql);
      console.log("📊 Paramètres:", sanitizedParams);
      
      const statement = this.db!.prepare(sql);
      const result = statement.run(...params);
      console.log(`📊 Résultat execute: lastInsertId=${result.lastInsertRowid}, changes=${result.changes}`);
      
      return {
        lastInsertId: result.lastInsertRowid as number,
        changes: result.changes
      };
    } catch (error) {
      console.error('❌ ERREUR SQL - execute:', error);
      console.error("Requête échouée:", sql);
      console.error("Paramètres:", params.map(p => 
        typeof p === 'string' && p.length > 20 ? '***HASHED_PASSWORD***' : p
      ));
      if (error instanceof Error) {
        console.error("Message d'erreur:", error.message);
        console.error("Stack trace:", error.stack);
      }
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.db && this.isConnected) {
      this.db.close();
      this.isConnected = false;
      this.db = null;
      console.log('📦 Connexion à la base de données fermée');
    }
  }
}

export const db = DatabaseConnection.getInstance();

// Initialisation des tables
export async function initDatabase() {
  await db.connect();

  // Table des utilisateurs
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      firstname TEXT NOT NULL,
      lastname TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      is_verified BOOLEAN DEFAULT 0,
      verification_token TEXT,
      verification_expires DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Table des ressources
  await db.execute(`
    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      url TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Table des catégories
  await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Table de liaison ressources-catégories
  await db.execute(`
    CREATE TABLE IF NOT EXISTS resource_categories (
      resource_id INTEGER,
      category_id INTEGER,
      PRIMARY KEY (resource_id, category_id),
      FOREIGN KEY (resource_id) REFERENCES resources(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  // Table des favoris
  await db.execute(`
    CREATE TABLE IF NOT EXISTS favorites (
      user_id INTEGER,
      resource_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, resource_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (resource_id) REFERENCES resources(id)
    )
  `);

  // Table des événements de stress (Holmes-Rahe)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS stress_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_text TEXT NOT NULL,
      points INTEGER NOT NULL,
      category TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Table des diagnostics utilisateurs
  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_diagnostics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total_score INTEGER NOT NULL,
      stress_level TEXT NOT NULL,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Table des événements sélectionnés par l'utilisateur lors d'un diagnostic
  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_diagnostic_events (
      diagnostic_id INTEGER,
      event_id INTEGER,
      PRIMARY KEY (diagnostic_id, event_id),
      FOREIGN KEY (diagnostic_id) REFERENCES user_diagnostics(id),
      FOREIGN KEY (event_id) REFERENCES stress_events(id)
    )
  `);

  // Table des pages d'information
  await db.execute(`
    CREATE TABLE IF NOT EXISTS info_pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      content TEXT NOT NULL,
      category TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Table des exercices de respiration
  await db.execute(`
    CREATE TABLE IF NOT EXISTS breathing_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL,
      steps TEXT NOT NULL,
      benefits TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      duration INTEGER NOT NULL,
      icon_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Table info_resources (ressources d'information)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS info_resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      author_id INTEGER NOT NULL,
      publication_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      modification_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      reading_time TEXT,
      level TEXT,
      views INTEGER DEFAULT 0,
      shares INTEGER DEFAULT 0,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Table tags
  await db.execute(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )
  `);

  // Table info_resources_tags (relation many-to-many entre ressources et tags)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS info_resources_tags (
      info_resource_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (info_resource_id, tag_id),
      FOREIGN KEY (info_resource_id) REFERENCES info_resources(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    )
  `);

  // Table info_resources_likes (relation many-to-many entre utilisateurs et ressources)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS info_resources_likes (
      info_resource_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      like_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (info_resource_id, user_id),
      FOREIGN KEY (info_resource_id) REFERENCES info_resources(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Table info_resources_comments (commentaires sur les ressources d'information)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS info_resources_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      info_resource_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      comment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (info_resource_id) REFERENCES info_resources(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Tables pour le tracker d'émotions
  await db.execute(`
    CREATE TABLE IF NOT EXISTS emotions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      icon TEXT,
      is_default BOOLEAN DEFAULT 0
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS emotion_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      emotion_id INTEGER NOT NULL,
      intensity INTEGER NOT NULL CHECK(intensity BETWEEN 1 AND 5),
      notes TEXT,
      date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (emotion_id) REFERENCES emotions(id) ON DELETE CASCADE
    )
  `);

  // Insertion des émotions par défaut s'il n'y en a pas
  const emotionsCount = await db.queryOne('SELECT COUNT(*) as count FROM emotions');
  if (emotionsCount && emotionsCount.count === 0) {
    const defaultEmotions = [
      { name: 'Joie', color: '#FFD700', icon: 'smile', is_default: 1 },
      { name: 'Tristesse', color: '#4169E1', icon: 'frown', is_default: 1 },
      { name: 'Colère', color: '#DC143C', icon: 'angry', is_default: 1 },
      { name: 'Peur', color: '#800080', icon: 'dizzy', is_default: 1 },
      { name: 'Surprise', color: '#FF8C00', icon: 'surprise', is_default: 1 },
      { name: 'Dégoût', color: '#006400', icon: 'sick', is_default: 1 },
      { name: 'Fatigue', color: '#808080', icon: 'tired', is_default: 1 },
      { name: 'Anxiété', color: '#9932CC', icon: 'anxious', is_default: 1 },
      { name: 'Calme', color: '#20B2AA', icon: 'peace', is_default: 1 },
      { name: 'Gratitude', color: '#FFA07A', icon: 'heart', is_default: 1 }
    ];

    for (const emotion of defaultEmotions) {
      await db.execute(
        'INSERT INTO emotions (name, color, icon, is_default) VALUES (?, ?, ?, ?)',
        [emotion.name, emotion.color, emotion.icon, emotion.is_default]
      );
    }
    console.log('📦 Émotions par défaut créées');
  }

  console.log('📦 Tables initialisées avec succès');
} 