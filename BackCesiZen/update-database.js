// Script pour ajouter les colonnes de réinitialisation de mot de passe à la base de données

import { Database } from 'bun:sqlite';

// Chemin vers la base de données
const DB_PATH = './cesi-zen.db';

async function updateDatabase() {
  console.log('🔄 Mise à jour de la base de données...');
  
  try {
    // Ouvrir la connexion à la base de données
    const db = new Database(DB_PATH);
    
    // Vérifier si les colonnes existent déjà
    const tableInfo = db.query('PRAGMA table_info(users)').all();
    const columns = tableInfo.map(col => col.name);
    
    // Ajouter les colonnes si elles n'existent pas
    if (!columns.includes('reset_token')) {
      console.log('➕ Ajout de la colonne reset_token à la table users');
      db.run('ALTER TABLE users ADD COLUMN reset_token TEXT');
    } else {
      console.log('✅ La colonne reset_token existe déjà');
    }
    
    if (!columns.includes('reset_token_expires')) {
      console.log('➕ Ajout de la colonne reset_token_expires à la table users');
      db.run('ALTER TABLE users ADD COLUMN reset_token_expires TEXT');
    } else {
      console.log('✅ La colonne reset_token_expires existe déjà');
    }
    
    console.log('✅ Base de données mise à jour avec succès !');
    db.close();
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de la base de données:', error);
    process.exit(1);
  }
}

updateDatabase(); 