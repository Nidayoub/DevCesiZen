import { UserModel } from "../models/userModel";
import { SessionModel } from "../models/sessionModel";
import { DiagnosticEventModel } from "../models/diagnosticModel";
import { InfoModel } from "../models/infoModel";

/**
 * Initialise les données du système au démarrage
 */
async function initializeData() {
  console.log("Initialisation des données...");

  // Nettoyer les sessions expirées
  const sessionModel = new SessionModel();
  const cleanedSessions = await sessionModel.cleanExpiredSessions();
  console.log(`${cleanedSessions} sessions expirées nettoyées`);

  // Créer un compte administrateur si aucun n'existe
  const userModel = new UserModel();
  const users = await userModel.getAll();
  
  if (users.length === 0) {
    try {
      const admin = await userModel.createUser({
        email: "admin@cesizen.fr",
        username: "admin",
        password: "admin123", // À changer en production !
        isAdmin: true
      });
      
      console.log(`Compte administrateur créé: ${admin.username} (${admin.email})`);
    } catch (error) {
      console.error("Erreur lors de la création du compte admin:", error);
    }
  }

  // S'assurer que les événements de diagnostic sont initialisés
  const diagnosticModel = new DiagnosticEventModel();
  await diagnosticModel.getSorted(); // Appelle initializeIfEmpty() si nécessaire

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

// Exécuter l'initialisation
initializeData().catch(error => {
  console.error("Erreur lors de l'initialisation des données:", error);
});