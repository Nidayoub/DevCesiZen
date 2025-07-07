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

# Chemin de la base de données pour Docker (IMPORTANT!)
DB_PATH=/app/data/cesi-zen.db
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

## 🌐 Accès aux services

- **Backend API** : http://localhost:3000
- **Frontend Web** : http://localhost:3001

## 📝 Notes importantes

- Le fichier `.env` ne doit **JAMAIS** être commité dans le repository
- Utilisez des valeurs sécurisées pour `JWT_SECRET` (minimum 32 caractères)
- Pour la production, configurez un service email réel (pas Mailtrap)
- La base de données SQLite est persistée dans un volume Docker nommé avec permissions root
- Les uploads sont montés depuis l'hôte via `./BackCesiZen/uploads:/app/uploads`

## 🔧 Fonctionnement local vs Docker

### En développement local :
- La base de données est créée dans `BackCesiZen/cesi-zen.db`
- Aucune configuration supplémentaire nécessaire (ne pas définir `DB_PATH` dans votre .env local)
- Lancez avec : `cd BackCesiZen && bun start`

### En Docker :
- La base de données est stockée dans un volume Docker `/app/data/cesi-zen.db`
- La variable `DB_PATH=/app/data/cesi-zen.db` est définie dans le fichier `.env`
- Le conteneur s'exécute en tant que root pour éviter les problèmes de permissions
- Pour sauvegarder : `docker cp devcesizen-backend-1:/app/data/cesi-zen.db ./backup.db`

## 🛠️ Debug et solutions de problèmes

Si la base de données ne se connecte toujours pas :

1. **Vérifiez le fichier .env** :
   ```bash
   cat BackCesiZen/.env | grep DB_PATH
   ```
   Doit afficher : `DB_PATH=/app/data/cesi-zen.db`

2. **Vérifiez les logs pour les messages de debug** :
   ```bash
   sudo docker-compose logs backend
   ```

3. **Nettoyage complet si nécessaire** :
   ```bash
   sudo docker-compose down
   sudo docker system prune -f
   sudo docker volume rm devcesizen_cesizen_data
   sudo docker-compose up --build
   ``` 