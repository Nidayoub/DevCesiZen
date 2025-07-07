# Dockerfile pour FrontCesiZen (Next.js)
FROM node:18-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances avec legacy peer deps pour résoudre les conflits React 19
RUN npm install --legacy-peer-deps

# Copier le code source
COPY . .

# Construire l'application pour la production
RUN npm run build

# Exposer le port utilisé par l'application
EXPOSE 3001

# Commande de démarrage
CMD ["npm", "start"] 