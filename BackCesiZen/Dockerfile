FROM oven/bun:latest

WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json ./

# Installer les dépendances sans utiliser le lockfile
RUN bun install

# Copier le code source
COPY . .

COPY .env* ./

# Exposer le port utilisé par l'application
EXPOSE 3000

# Commande de démarrage
CMD ["bun", "start"] 