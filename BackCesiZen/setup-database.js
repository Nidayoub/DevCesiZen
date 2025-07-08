#!/usr/bin/env node

/**
 * ======================================================================
 * SCRIPT DE CONFIGURATION DE LA BASE DE DONNÉES
 * ======================================================================
 * 
 * Ce script remplace rebuild-database.cjs et utilise initData.ts comme
 * source unique de vérité pour l'initialisation des données.
 * 
 * UTILISATION :
 * - npm run setup-db : Configuration complète (dev/prod)
 * - npm run reset-db : Supprime et recrée la base
 * 
 * AVANTAGES :
 * - Une seule source de vérité pour les données
 * - Même comportement en dev et en prod
 * - Pas de duplication de code
 * ======================================================================
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'cesi-zen.db');

console.log('🔧 Configuration de la base de données CESIZen');
console.log('==================================================');

// Fonction pour exécuter le serveur temporairement et déclencher l'initialisation
async function setupDatabase(resetFirst = false) {
  if (resetFirst && fs.existsSync(dbPath)) {
    console.log('🗑️  Suppression de l\'ancienne base de données...');
    
    try {
      fs.unlinkSync(dbPath);
      console.log('✅ Base de données supprimée avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de la base de données:', error.message);
      console.error('💡 Astuce: Arrêtez le serveur avant de relancer ce script');
      process.exit(1);
    }
  }

  console.log('🚀 Initialisation de la base de données...');
  console.log('   (Les données seront créées via initData.ts - source unique)');
  
  // Lancer le serveur temporairement pour déclencher l'initialisation
  const serverProcess = spawn('bun', ['run', 'src/index.ts'], {
    cwd: __dirname,
    stdio: 'pipe'
  });

  let initComplete = false;
  
  // Écouter les logs du serveur
  serverProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(output);
    
    // Détecter quand l'initialisation est terminée
    if (output.includes('📊 Données initialisées avec succès')) {
      initComplete = true;
      console.log('✅ Initialisation terminée avec succès !');
      console.log('');
      console.log('🎯 COMPTES DISPONIBLES :');
      console.log('   Super-Admin : superadmin@cesizen.fr / superadmin123');
      console.log('   Admin       : admin@cesizen.fr / admin123');
      console.log('   Utilisateur : user@cesizen.fr / user123');
      console.log('');
      console.log('🔒 Tous les comptes sont vérifiés et prêts à l\'utilisation');
      
      // Arrêter le serveur
      serverProcess.kill('SIGTERM');
      process.exit(0);
    }
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(data.toString());
  });

  serverProcess.on('close', (code) => {
    if (!initComplete) {
      console.error('❌ Erreur lors de l\'initialisation de la base de données');
      process.exit(1);
    }
  });

  // Timeout de sécurité
  setTimeout(() => {
    if (!initComplete) {
      console.error('⏰ Timeout : L\'initialisation prend trop de temps');
      serverProcess.kill('SIGTERM');
      process.exit(1);
    }
  }, 30000); // 30 secondes
}

// Gestion des arguments en ligne de commande
const args = process.argv.slice(2);
const resetMode = args.includes('--reset') || args.includes('-r');

if (resetMode) {
  if (fs.existsSync(dbPath)) {
    console.log('⚠️  MODE RESET : Toutes les données seront supprimées !');
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('❓ Confirmez-vous la suppression ? (tapez "OUI" pour confirmer) : ', (answer) => {
      rl.close();
      
      if (answer.trim() === 'OUI') {
        console.log('🔄 Suppression et recréation de la base de données...');
        setupDatabase(true);
      } else {
        console.log('✅ Opération annulée');
        process.exit(0);
      }
    });
  } else {
    console.log('📦 Aucune base de données existante, création directe...');
    setupDatabase(false);
  }
} else {
  // Mode normal : initialisation uniquement si nécessaire
  setupDatabase(false);
} 