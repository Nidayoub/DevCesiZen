FROM oven/bun:latest

WORKDIR /app

# Copy package.json and bun.lock for efficient caching
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Copy the rest of the application
COPY . .

# Copy .env file if exists
COPY .env* ./

# Exposer le port utilisé par l'application
EXPOSE 3000

# Commande de démarrage
CMD ["bun", "run", "start"] 