# Configuration Docker - Variables d'environnement

## 📋 Variables d'environnement requises

Avant de lancer `docker-compose up --build`, vous devez créer un fichier `.env` dans le dossier `BackCesiZen/` avec les variables suivantes :

### Fichier `BackCesiZen/.env` à créer :

```bash
# JWT Secret pour l'authentification (générez une clé sécurisée)
JWT_SECRET=votre_jwt_secret_tres_securise_ici

# Configuration Email
EMAIL_TEST_MODE=true
EMAIL_SERVICE=mailtrap
EMAIL_USER=votre_email_user
EMAIL_PASSWORD=votre_email_password

# URL du frontend pour les liens dans les emails
FRONTEND_URL=http://localhost:3001

# Environnement
NODE_ENV=production

# Chemin de la base de données (optionnel - défini automatiquement par Docker)
# DB_PATH=/app/data/cesi-zen.db
```

## 🔧 Instructions de déploiement sur VM

1. **Cloner le repository sur votre VM**
2. **Créer le fichier .env** dans `BackCesiZen/` avec vos valeurs
3. **S'assurer que les répertoires existent** :
   ```bash
   mkdir -p BackCesiZen/uploads
   ```
4. **Lancer Docker Compose** :
   ```bash
   sudo docker-compose up --build
   ```

   > **Note** : La base de données SQLite sera automatiquement créée au premier démarrage.

## 🌐 Accès aux services

- **Backend API** : http://localhost:3000
- **Frontend Web** : http://localhost:3001

## 📝 Notes importantes

- Le fichier `.env` ne doit **JAMAIS** être commité dans le repository
- Utilisez des valeurs sécurisées pour `JWT_SECRET` (minimum 32 caractères)
- Pour la production, configurez un service email réel (pas Mailtrap)
- La base de données SQLite et les uploads sont persistés via des volumes Docker
- Les données sont partagées entre l'hôte et le container via des volumes Docker

## 🔧 Fonctionnement local vs Docker

### En développement local :
- La base de données est créée dans `BackCesiZen/cesi-zen.db`
- Aucune configuration supplémentaire nécessaire
- Lancez avec : `cd BackCesiZen && bun start`

### En Docker :
- La base de données est montée depuis l'hôte vers `/app/data/cesi-zen.db`
- La variable `DB_PATH` est automatiquement définie par docker-compose
- Toutes les données restent persistées sur l'hôte dans `BackCesiZen/` 