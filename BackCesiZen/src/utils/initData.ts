import { UserModel, User } from "../models/User";
import { SessionModel } from "../models/sessionModel";
import { DiagnosticEventModel } from "../models/diagnosticModel";
import { InfoModel } from "../models/infoModel";
import { BreathingExerciseModel } from "../models/breathingModel";
import { db } from "../data/database";
import bcrypt from "bcryptjs";
import { initInfoResources } from "./initInfoResources";

/**
 * Initialise les données du système au démarrage
 */
async function initializeData() {
  console.log("Initialisation des données...");

  // Nettoyer les sessions expirées
  const sessionModel = new SessionModel();
  const cleanedSessions = await sessionModel.cleanExpiredSessions();
  console.log(`${cleanedSessions} sessions expirées nettoyées`);

  // Initialiser les événements de stress dans SQLite
  await initHolmesRaheEvents();
  
  // Initialiser les pages d'information dans SQLite
  await initInfoPages();
  
  // Initialiser les exercices de respiration dans SQLite
  await initBreathingExercises();
  
  // Initialiser les ressources d'information dans SQLite
  await initInfoResources();

  // Créer un compte super-admin si aucun n'existe
  const users = await UserModel.findAll();
  
  if (users.length === 0) {
    try {
      const superAdmin = await UserModel.create({
        email: "superadmin@cesizen.fr",
        password: "superadmin123", // À changer en production !
        firstname: "Super",
        lastname: "Admin",
        role: "super-admin"
      });
      
      console.log(`Compte super-admin créé: ${superAdmin.firstname} ${superAdmin.lastname} (${superAdmin.email})`);

      // Créer un admin par défaut
      const admin = await UserModel.create({
        email: "admin@cesizen.fr",
        password: "admin123", // À changer en production !
        firstname: "Admin",
        lastname: "CesiZen",
        role: "admin"
      });

      console.log(`Compte admin créé: ${admin.firstname} ${admin.lastname} (${admin.email})`);
      
      // Créer un utilisateur de test
      await initDefaultUser();
    } catch (error) {
      console.error("Erreur lors de la création des comptes administrateurs:", error);
    }
  }

  // S'assurer que les événements de diagnostic sont initialisés
  const diagnosticModel = new DiagnosticEventModel();
  await diagnosticModel.getAll(); // Utilise la nouvelle méthode au lieu de getSorted()

  // Créer quelques pages d'information si aucune n'existe
  const infoModel = new InfoModel();
  const pages = await infoModel.getAll();
  
  if (pages.length === 0) {
    try {
      // Page d'accueil
      await infoModel.createPage({
        title: "Bienvenue sur CESIZen",
        slug: "accueil",
        content: `
# Bienvenue sur CESIZen

CESIZen est une application dédiée au bien-être et à la gestion du stress.

## Fonctionnalités principales

- **Diagnostic de stress** : Évaluez votre niveau de stress avec l'échelle de Holmes et Rahe
- **Ressources** : Découvrez des techniques de respiration, méditation et gestion du stress
- **Suivi** : Suivez l'évolution de votre niveau de stress dans le temps

N'hésitez pas à explorer les différentes sections de l'application !
        `,
        isPublished: true,
        authorId: 1
      });
      
      // Page sur la respiration
      await infoModel.createPage({
        title: "Techniques de respiration",
        slug: "respiration",
        content: `
# Techniques de respiration pour réduire le stress

La respiration est l'un des outils les plus puissants pour gérer le stress. Voici quelques techniques simples :

## 1. Respiration abdominale

1. Asseyez-vous confortablement ou allongez-vous
2. Posez une main sur votre ventre
3. Inspirez lentement par le nez pendant 4 secondes, sentez votre ventre se gonfler
4. Retenez votre souffle pendant 1-2 secondes
5. Expirez lentement par la bouche pendant 6 secondes
6. Répétez 5-10 fois

## 2. Respiration 4-7-8

1. Inspirez par le nez pendant 4 secondes
2. Retenez votre souffle pendant 7 secondes
3. Expirez par la bouche pendant 8 secondes
4. Répétez 4 fois

Pratiquez ces techniques quelques minutes chaque jour pour en ressentir les bénéfices.
        `,
        isPublished: true,
        authorId: 1
      });
      
      // Page sur la méditation
      await infoModel.createPage({
        title: "Méditation de pleine conscience",
        slug: "meditation",
        content: `
# Méditation de pleine conscience

La méditation de pleine conscience est une pratique qui consiste à porter son attention sur le moment présent, sans jugement.

## Exercice simple de 5 minutes

1. Asseyez-vous confortablement, dos droit
2. Fermez les yeux ou gardez-les mi-clos
3. Concentrez-vous sur votre respiration naturelle
4. Remarquez les sensations à chaque inspiration et expiration
5. Quand votre esprit s'égare (ce qui est normal), ramenez doucement votre attention à la respiration
6. Après 5 minutes, prenez conscience de votre corps entier, puis ouvrez lentement les yeux

## Conseils pour débutants

- Commencez par 5 minutes par jour, puis augmentez progressivement
- La régularité est plus importante que la durée
- N'essayez pas d'arrêter vos pensées, observez-les simplement passer
        `,
        isPublished: true,
        authorId: 1
      });
      
      console.log("Pages d'information initiales créées");
    } catch (error) {
      console.error("Erreur lors de la création des pages d'information:", error);
    }
  }

  console.log("Initialisation des données terminée");
}

/**
 * Initialise les événements de stress (échelle Holmes-Rahe) dans SQLite
 */
async function initHolmesRaheEvents() {
  // Vérifier si des événements existent déjà
  const eventCount = await db.queryOne<{count: number}>('SELECT COUNT(*) as count FROM stress_events');
  
  if (!eventCount || eventCount.count === 0) {
    console.log('🌱 Initialisation des événements de stress (échelle Holmes-Rahe)...');
    
    const stressEvents = [
      { event_text: "Décès du conjoint", points: 100, category: "Familial" },
      { event_text: "Divorce", points: 73, category: "Familial" },
      { event_text: "Séparation conjugale", points: 65, category: "Familial" },
      { event_text: "Emprisonnement", points: 63, category: "Juridique" },
      { event_text: "Décès d'un proche parent", points: 63, category: "Familial" },
      { event_text: "Blessure ou maladie personnelle", points: 53, category: "Santé" },
      { event_text: "Mariage", points: 50, category: "Familial" },
      { event_text: "Licenciement", points: 47, category: "Professionnel" },
      { event_text: "Réconciliation conjugale", points: 45, category: "Familial" },
      { event_text: "Retraite", points: 45, category: "Professionnel" },
      { event_text: "Problème de santé d'un proche", points: 44, category: "Familial" },
      { event_text: "Grossesse", points: 40, category: "Santé" },
      { event_text: "Difficultés sexuelles", points: 39, category: "Santé" },
      { event_text: "Arrivée d'un nouveau membre dans la famille", points: 39, category: "Familial" },
      { event_text: "Adaptation professionnelle majeure", points: 39, category: "Professionnel" },
      { event_text: "Changement de situation financière", points: 38, category: "Financier" },
      { event_text: "Décès d'un ami proche", points: 37, category: "Social" },
      { event_text: "Changement de métier", points: 36, category: "Professionnel" },
      { event_text: "Changement dans les relations avec le conjoint", points: 35, category: "Familial" },
      { event_text: "Prêt ou hypothèque important", points: 31, category: "Financier" },
      { event_text: "Forclusion d'un prêt ou d'une hypothèque", points: 30, category: "Financier" },
      { event_text: "Changement de responsabilités au travail", points: 29, category: "Professionnel" },
      { event_text: "Départ d'un enfant du foyer", points: 29, category: "Familial" },
      { event_text: "Problèmes avec la belle-famille", points: 29, category: "Familial" },
      { event_text: "Réussite personnelle exceptionnelle", points: 28, category: "Personnel" },
      { event_text: "Conjoint qui commence ou cesse de travailler", points: 26, category: "Familial" },
      { event_text: "Début ou fin d'études", points: 26, category: "Éducation" },
      { event_text: "Changement dans les conditions de vie", points: 25, category: "Personnel" },
      { event_text: "Révision des habitudes personnelles", points: 24, category: "Personnel" },
      { event_text: "Difficultés avec un supérieur", points: 23, category: "Professionnel" },
      { event_text: "Changement dans les horaires ou conditions de travail", points: 20, category: "Professionnel" },
      { event_text: "Déménagement", points: 20, category: "Personnel" },
      { event_text: "Changement d'école", points: 20, category: "Éducation" },
      { event_text: "Changement dans les loisirs", points: 19, category: "Personnel" },
      { event_text: "Changement dans les activités religieuses", points: 19, category: "Personnel" },
      { event_text: "Changement dans les activités sociales", points: 18, category: "Social" },
      { event_text: "Prêt ou hypothèque mineur", points: 17, category: "Financier" },
      { event_text: "Changement dans les habitudes de sommeil", points: 16, category: "Santé" },
      { event_text: "Changement dans les réunions familiales", points: 15, category: "Familial" },
      { event_text: "Changement dans les habitudes alimentaires", points: 15, category: "Santé" },
      { event_text: "Vacances", points: 13, category: "Personnel" },
      { event_text: "Fêtes de fin d'année", points: 12, category: "Personnel" },
      { event_text: "Infraction mineure à la loi", points: 11, category: "Juridique" },
      
      // Questions sur les émotions
      { event_text: "Anxiété persistante", points: 45, category: "Émotions" },
      { event_text: "Tristesse ou mélancolie", points: 40, category: "Émotions" },
      { event_text: "Irritabilité fréquente", points: 35, category: "Émotions" },
      { event_text: "Sentiment d'être dépassé(e)", points: 50, category: "Émotions" },
      { event_text: "Colère incontrôlable", points: 47, category: "Émotions" },
      { event_text: "Peur inexpliquée", points: 38, category: "Émotions" },
      { event_text: "Variations d'humeur importantes", points: 42, category: "Émotions" },
      { event_text: "Sentiment d'isolement émotionnel", points: 39, category: "Émotions" },
      { event_text: "Apathie ou manque d'intérêt", points: 44, category: "Émotions" },
      { event_text: "Culpabilité excessive", points: 36, category: "Émotions" }
    ];
    
    for (const event of stressEvents) {
      await db.execute(
        'INSERT INTO stress_events (event_text, points, category) VALUES (?, ?, ?)',
        [event.event_text, event.points, event.category]
      );
    }
    
    console.log('✅ Événements de stress initialisés avec succès');
  } else {
    // Vérifier si les questions sur les émotions sont déjà présentes
    const emotionEventsCount = await db.queryOne<{count: number}>('SELECT COUNT(*) as count FROM stress_events WHERE category = "Émotions"');
    
    if (!emotionEventsCount || emotionEventsCount.count === 0) {
      console.log('🌱 Ajout des questions sur les émotions...');
      
      const emotionEvents = [
        { event_text: "Anxiété persistante", points: 45, category: "Émotions" },
        { event_text: "Tristesse ou mélancolie", points: 40, category: "Émotions" },
        { event_text: "Irritabilité fréquente", points: 35, category: "Émotions" },
        { event_text: "Sentiment d'être dépassé(e)", points: 50, category: "Émotions" },
        { event_text: "Colère incontrôlable", points: 47, category: "Émotions" },
        { event_text: "Peur inexpliquée", points: 38, category: "Émotions" },
        { event_text: "Variations d'humeur importantes", points: 42, category: "Émotions" },
        { event_text: "Sentiment d'isolement émotionnel", points: 39, category: "Émotions" },
        { event_text: "Apathie ou manque d'intérêt", points: 44, category: "Émotions" },
        { event_text: "Culpabilité excessive", points: 36, category: "Émotions" }
      ];
      
      for (const event of emotionEvents) {
        await db.execute(
          'INSERT INTO stress_events (event_text, points, category) VALUES (?, ?, ?)',
          [event.event_text, event.points, event.category]
        );
      }
      
      console.log('✅ Questions sur les émotions ajoutées avec succès');
    }
  }
}

/**
 * Initialise les pages d'information dans SQLite
 */
async function initInfoPages() {
  // Vérifier si des pages existent déjà
  const pageCount = await db.queryOne<{count: number}>('SELECT COUNT(*) as count FROM info_pages');
  
  if (!pageCount || pageCount.count === 0) {
    console.log('🌱 Création des pages d\'information par défaut...');
    
    const infoPages = [
      {
        title: "Qu'est-ce que le stress ?",
        slug: "definition-stress",
        content: "Le stress est une réaction physiologique et psychologique de notre corps face à des situations perçues comme menaçantes ou exigeantes. Il s'agit d'un mécanisme naturel de défense qui nous aide à faire face aux dangers ou aux défis. Cependant, un stress chronique ou excessif peut avoir des effets néfastes sur notre santé physique et mentale.",
        category: "Fondamentaux"
      },
      {
        title: "Techniques de respiration",
        slug: "techniques-respiration",
        content: "La respiration profonde est l'une des techniques les plus efficaces pour gérer le stress. Voici une technique simple : asseyez-vous confortablement, fermez les yeux et respirez profondément par le nez en comptant jusqu'à 4. Retenez votre respiration pendant 2 secondes, puis expirez lentement par la bouche en comptant jusqu'à 6. Répétez ce cycle pendant 5 à 10 minutes.",
        category: "Techniques"
      },
      {
        title: "Échelle de Holmes et Rahe",
        slug: "echelle-holmes-rahe",
        content: "L'échelle de Holmes et Rahe est un outil d'évaluation du stress développé en 1967 par les psychiatres Thomas Holmes et Richard Rahe. Elle attribue des points à différents événements de vie stressants. Un score élevé indique un risque accru de problèmes de santé liés au stress. Utilisez notre outil de diagnostic pour évaluer votre niveau de stress selon cette échelle reconnue.",
        category: "Outils"
      }
    ];
    
    for (const page of infoPages) {
      await db.execute(
        'INSERT INTO info_pages (title, slug, content, category, created_by) VALUES (?, ?, ?, ?, ?)',
        [page.title, page.slug, page.content, page.category, 1]
      );
    }
    
    console.log('✅ Pages d\'information créées avec succès');
  }
}

/**
 * Initialise un utilisateur de test normal
 */
async function initDefaultUser() {
  // Vérifier si l'utilisateur test existe déjà
  const testUser = await db.queryOne('SELECT * FROM users WHERE email = ?', ['user@cesizen.fr']);
  
  if (!testUser) {
    console.log('🌱 Création d\'un utilisateur de test...');
    
    const hashedPassword = await bcrypt.hash('user123', 10);
    
    await db.execute(
      'INSERT INTO users (email, password, firstname, lastname, role) VALUES (?, ?, ?, ?, ?)',
      ['user@cesizen.fr', hashedPassword, 'Utilisateur', 'Test', 'user']
    );
    
    console.log('✅ Utilisateur de test créé avec succès');
  }
}

/**
 * Initialise les exercices de respiration dans SQLite
 */
async function initBreathingExercises() {
  // Vérifier si des exercices existent déjà
  const exerciseCount = await db.queryOne<{count: number}>('SELECT COUNT(*) as count FROM breathing_exercises');
  
  if (!exerciseCount || exerciseCount.count === 0) {
    console.log('�� Initialisation des exercices de respiration...');
    
    // Récupérer les exercices prédéfinis du modèle
    const breathingModel = new BreathingExerciseModel();
    const predefinedExercises = await breathingModel.getAll();
    
    for (const exercise of predefinedExercises) {
      await db.execute(
        'INSERT INTO breathing_exercises (id, name, description, type, steps, benefits, difficulty, duration, icon_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          exercise.id,
          exercise.name,
          exercise.description,
          exercise.type,
          JSON.stringify(exercise.steps),
          JSON.stringify(exercise.benefits),
          exercise.difficulty,
          exercise.duration,
          exercise.iconName || null
        ]
      );
    }
    
    console.log('✅ Exercices de respiration initialisés avec succès');
  }
}

// Exécuter l'initialisation
initializeData().catch(error => {
  console.error("Erreur lors de l'initialisation des données:", error);
});