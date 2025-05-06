# CESIZen API

API backend pour l'application CESIZen, développée dans le cadre du projet CDA (Concepteur Développeur d'Applications) au CESI.

## 📋 Architecture

L'API suit une architecture MVC (Model-View-Controller) simple et lisible :

```
src/
├── controllers/     # Logique métier et traitement des requêtes
├── models/          # Accès aux données et structures
├── middlewares/     # Fonctions intermédiaires (auth, logging, etc.)
├── routes/          # Définition des routes de l'API
├── utils/           # Utilitaires et fonctions helper
├── data/            # Stockage des données (JSON)
└── index.ts         # Point d'entrée
```

## 🚀 Installation

Prérequis :
- [Bun](https://bun.sh/) (>= 1.0.0)

Installation des dépendances :

```bash
bun install
```

## 🔧 Développement

Lancer en mode développement (avec hot reload) :

```bash
bun dev
```

Le serveur sera accessible sur http://localhost:3000.

## 🔨 Production

Build et démarrage en production :

```bash
bun run build
NODE_ENV=production bun start
```

## 🔑 Fonctionnalités

L'API est organisée en trois modules principaux :

### 1. Gestion des utilisateurs

- `POST /api/register` : Inscription (email, mot de passe, pseudo)
- `POST /api/login` : Connexion (email + mot de passe)
- `POST /api/logout` : Déconnexion
- `GET /api/me` : Informations du compte connecté
- `DELETE /api/users/:id` : Suppression d'un compte (admin)
- `POST /api/forgot-password` : Récupération de mot de passe

### 2. Pages d'information

- `GET /api/info` : Liste des pages disponibles
- `GET /api/info/:slug` : Contenu d'une page
- `POST /api/info` : Création/modification d'une page (admin)
- `DELETE /api/info/:id` : Suppression d'une page (admin)

### 3. Diagnostic de stress

- `GET /api/diagnostic/questions` : Liste des événements de stress (échelle Holmes & Rahe)
- `POST /api/diagnostic/submit` : Soumettre un diagnostic et obtenir un score
- `POST /api/diagnostic/configure` : Modifier les questions (admin)

## 🔐 Sécurité

L'API utilise un système d'authentification par session :

- Les sessions sont stockées côté serveur (fichier JSON)
- Les tokens de session sont envoyés via cookies
- Les mots de passe sont hachés avec bcrypt
- Les routes sensibles sont protégées par middlewares d'authentification
- Les routes admin sont restreintes aux utilisateurs avec le flag `isAdmin`

## 📦 Base de données

Pour simplifier, l'API utilise un stockage en fichiers JSON :

- `src/data/users.json` : Utilisateurs
- `src/data/sessions.json` : Sessions
- `src/data/pages.json` : Pages d'information
- `src/data/diagnostic_events.json` : Événements de diagnostic
- `src/data/diagnostic_results.json` : Résultats de diagnostic

## 👤 Compte administrateur initial

Un compte administrateur est automatiquement créé au premier démarrage :

- **Email** : admin@cesizen.fr
- **Mot de passe** : admin123

⚠️ Pensez à modifier ces identifiants en production !

## 📝 License

Projet étudiant CESI - Tous droits réservés.
