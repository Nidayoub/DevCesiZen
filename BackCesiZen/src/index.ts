import { serve } from "bun";
import { router } from "./routes";
import { logger } from "./middlewares/logger";
import { errorHandler } from "./middlewares/errorHandler";
import { initDatabase } from "./data/database";

// Initialisation de la base de données
await initDatabase();
console.log("📦 Base de données initialisée avec succès");

// Initialisation des données si nécessaire
import "./utils/initData";

const server = serve({
  async fetch(req) {
    const url = new URL(req.url);
    const method = req.method;
    const path = url.pathname;
    
    // Log de la requête
    logger(method, path);
    
    try {
      // On transmet la requête au router
      const response = await router(req);
      return response;
    } catch (error) {
      // Gestion des erreurs
      return errorHandler(error);
    }
  },
  port: process.env.PORT || 3000,
});

console.log(`🚀 Serveur CESIZen démarré sur ${server.url}`); 