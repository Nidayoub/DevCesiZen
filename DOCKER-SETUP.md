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
```

## 🔧 Instructions de déploiement sur VM

1. **Cloner le repository sur votre VM**
2. **Créer le fichier .env** dans `BackCesiZen/` avec vos valeurs
3. **Lancer Docker Compose** :
   ```bash
   sudo docker-compose up --build
   ```

## 🌐 Accès aux services

- **Backend API** : http://localhost:3000
- **Frontend Web** : http://localhost:3001

## 📝 Notes importantes

- Le fichier `.env` ne doit **JAMAIS** être commité dans le repository
- Utilisez des valeurs sécurisées pour `JWT_SECRET` (minimum 32 caractères)
- Pour la production, configurez un service email réel (pas Mailtrap)
- La base de données SQLite et les uploads sont persistés via des volumes Docker 