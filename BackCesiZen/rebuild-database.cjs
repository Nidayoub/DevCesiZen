const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Chemin vers la base de données
const dbPath = path.join(__dirname, 'cesi-zen.db');

console.log('🔄 Reconstruction complète de la base de données...');

// Supprimer la base de données existante si elle existe
if (fs.existsSync(dbPath)) {
  try {
    console.log('🗑️ Tentative de suppression de la base de données existante...');
    fs.unlinkSync(dbPath);
    console.log('✅ Base de données existante supprimée');
  } catch (error) {
    console.error('❌ Impossible de supprimer la base de données car elle est verrouillée ou utilisée par une autre application.');
    console.error('💡 Astuce: Arrêtez le serveur ou toute autre application qui pourrait utiliser la base de données.');
    process.exit(1);
  }
}

// Créer une nouvelle base de données
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erreur lors de la création de la base de données:', err.message);
    process.exit(1);
  }
  console.log('✅ Nouvelle base de données créée');
});

// Activer les clés étrangères
db.run('PRAGMA foreign_keys = ON');

// Définir les tables en mode transaction
db.serialize(() => {
  db.run('BEGIN TRANSACTION');

  try {
    // Table users avec tous les champs nécessaires
    db.run(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        firstname TEXT NOT NULL,
        lastname TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        is_verified BOOLEAN DEFAULT 0,
        verification_token TEXT DEFAULT '',
        verification_expires TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('❌ Erreur lors de la création de la table users:', err.message);
        throw err;
      }
      console.log('✅ Table users créée');
    });

    // Table categories
    db.run(`
      CREATE TABLE categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        color TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('❌ Erreur lors de la création de la table categories:', err.message);
        throw err;
      }
      console.log('✅ Table categories créée');
    });

    // Table resources
    db.run(`
      CREATE TABLE resources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        content TEXT,
        image_url TEXT,
        type TEXT NOT NULL,
        url TEXT,
        category_id INTEGER,
        author_id INTEGER,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id),
        FOREIGN KEY (author_id) REFERENCES users(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `, (err) => {
      if (err) {
        console.error('❌ Erreur lors de la création de la table resources:', err.message);
        throw err;
      }
      console.log('✅ Table resources créée');
    });

    // Table comments
    db.run(`
      CREATE TABLE comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        resource_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) {
        console.error('❌ Erreur lors de la création de la table comments:', err.message);
        throw err;
      }
      console.log('✅ Table comments créée');
    });

    // Table favorites
    db.run(`
      CREATE TABLE favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        resource_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(resource_id, user_id)
      )
    `, (err) => {
      if (err) {
        console.error('❌ Erreur lors de la création de la table favorites:', err.message);
        throw err;
      }
      console.log('✅ Table favorites créée');
    });

    // -------- NOUVELLES TABLES POUR LES RESSOURCES D'INFORMATION --------
    
    // Table info_resources (ressources d'information)
    db.run(`
      CREATE TABLE info_resources (
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
    `, (err) => {
      if (err) {
        console.error('❌ Erreur lors de la création de la table info_resources:', err.message);
        throw err;
      }
      console.log('✅ Table info_resources créée');
    });

    // Table tags
    db.run(`
      CREATE TABLE tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )
    `, (err) => {
      if (err) {
        console.error('❌ Erreur lors de la création de la table tags:', err.message);
        throw err;
      }
      console.log('✅ Table tags créée');
    });

    // Table info_resources_tags (relation many-to-many entre ressources et tags)
    db.run(`
      CREATE TABLE info_resources_tags (
        info_resource_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (info_resource_id, tag_id),
        FOREIGN KEY (info_resource_id) REFERENCES info_resources(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) {
        console.error('❌ Erreur lors de la création de la table info_resources_tags:', err.message);
        throw err;
      }
      console.log('✅ Table info_resources_tags créée');
    });

    // Table info_resources_likes (relation many-to-many entre utilisateurs et ressources)
    db.run(`
      CREATE TABLE info_resources_likes (
        info_resource_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        like_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (info_resource_id, user_id),
        FOREIGN KEY (info_resource_id) REFERENCES info_resources(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) {
        console.error('❌ Erreur lors de la création de la table info_resources_likes:', err.message);
        throw err;
      }
      console.log('✅ Table info_resources_likes créée');
    });

    // Table info_resources_comments (commentaires sur les ressources d'information)
    db.run(`
      CREATE TABLE info_resources_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        info_resource_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        comment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (info_resource_id) REFERENCES info_resources(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) {
        console.error('❌ Erreur lors de la création de la table info_resources_comments:', err.message);
        throw err;
      }
      console.log('✅ Table info_resources_comments créée');
    });

    // Créer un utilisateur admin par défaut avec le mot de passe hashé (admin123)
    const adminPassword = bcrypt.hashSync('admin123', 10);
    
    db.run(`
      INSERT INTO users (email, password, firstname, lastname, role, is_verified)
      VALUES ('admin@cesizen.com', ?, 'Admin', 'CesiZen', 'admin', 1)
    `, [adminPassword], function(err) {
      if (err) {
        console.error('❌ Erreur lors de la création de l\'utilisateur admin:', err.message);
        throw err;
      }
      console.log('✅ Utilisateur admin créé avec l\'ID:', this.lastID);
      
      // Insertion d'un exemple de ressource d'information
      const adminId = this.lastID;
      db.run(`
        INSERT INTO info_resources (title, summary, content, category, author_id, reading_time, level)
        VALUES (
          '5 techniques de respiration pour réduire le stress',
          'Découvrez des méthodes de respiration efficaces pour calmer l\'anxiété et améliorer votre bien-être quotidien.',
          '<h2>Introduction</h2><p>Le stress fait partie de notre quotidien, mais il existe des moyens simples de le gérer efficacement. La respiration est l\'un des outils les plus puissants à notre disposition.</p><h2>1. La respiration 4-7-8</h2><p>Inspirez pendant 4 secondes, retenez votre souffle pendant 7 secondes, puis expirez lentement pendant 8 secondes. Cette technique active votre système parasympathique.</p><h2>2. La respiration abdominale</h2><p>Placez une main sur votre ventre et respirez profondément en gonflant l\'abdomen. Cette méthode oxygène mieux le corps et calme le système nerveux.</p>',
          'Stress',
          ?,
          '5 min',
          'débutant'
        )
      `, [adminId], function(err) {
        if (err) {
          console.error('❌ Erreur lors de la création de la ressource d\'exemple:', err.message);
        } else {
          console.log('✅ Ressource d\'information d\'exemple créée avec l\'ID:', this.lastID);
          
          // Création de quelques tags d'exemple
          db.run(`INSERT INTO tags (name) VALUES ('respiration')`, function(err) {
            if (err) {
              console.error('❌ Erreur lors de la création du tag respiration:', err.message);
            } else {
              const tagId = this.lastID;
              db.run(`
                INSERT INTO info_resources_tags (info_resource_id, tag_id)
                VALUES (?, ?)
              `, [1, tagId], function(err) {
                if (err) {
                  console.error('❌ Erreur lors de l\'association du tag à la ressource:', err.message);
                } else {
                  console.log('✅ Tags associés à la ressource d\'exemple');
                }
              });
            }
          });
          
          db.run(`INSERT INTO tags (name) VALUES ('anxiété')`, function(err) {
            if (!err) {
              db.run(`INSERT INTO info_resources_tags (info_resource_id, tag_id) VALUES (1, ?)`, [this.lastID]);
            }
          });
          
          db.run(`INSERT INTO tags (name) VALUES ('bien-être')`, function(err) {
            if (!err) {
              db.run(`INSERT INTO info_resources_tags (info_resource_id, tag_id) VALUES (1, ?)`, [this.lastID]);
            }
          });
        }
      });
    });

    // Valider les changements
    db.run('COMMIT', (err) => {
      if (err) {
        console.error('❌ Erreur lors de la validation des changements:', err.message);
        throw err;
      }
      console.log('✅ Schéma de la base de données créé avec succès');
      
      // Vérifier les tables créées
      db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) {
          console.error('❌ Erreur lors de la vérification des tables:', err.message);
          db.close();
          return;
        }
        
        console.log('📋 Tables dans la base de données:');
        tables.forEach(table => {
          if (table.name !== 'sqlite_sequence') {
            console.log(`   - ${table.name}`);
          }
        });
        
        // Fermer la connexion
        db.close();
        console.log('✅ Reconstruction terminée!');
        console.log('💡 Vous pouvez maintenant démarrer le serveur avec "npm run dev"');
      });
    });
  } catch (error) {
    // En cas d'erreur, annuler les changements
    db.run('ROLLBACK', () => {
      console.error('❌ Transaction annulée en raison d\'erreurs');
      db.close();
    });
  }
}); 