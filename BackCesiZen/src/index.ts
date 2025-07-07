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

// Configuration CORS dynamique
const allowedOrigin = process.env.FRONTEND_URL;
console.log(allowedOrigin);
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Max-Age": "86400" // 24 heures
};

console.log(`🌐 CORS configuré pour: ${allowedOrigin}`);

const PORT = 3000;

const server = serve({
  async fetch(req) {
    const url = new URL(req.url);
    const method = req.method;
    const path = url.pathname;
    
    // Log de la requête
    logger(method, path);
    
    // Gestion des requêtes OPTIONS (preflight CORS)
    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }
    
    try {
      // On transmet la requête au router
      const response = await router(req);
      
      // Ajout des headers CORS à la réponse
      const newHeaders = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        newHeaders.set(key, value);
      });
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      });
    } catch (error) {
      // Gestion des erreurs
      const errorResponse = errorHandler(error);
      
      // Ajout des headers CORS à la réponse d'erreur
      const newHeaders = new Headers(errorResponse.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        newHeaders.set(key, value);
      });
      
      return new Response(errorResponse.body, {
        status: errorResponse.status,
        statusText: errorResponse.statusText,
        headers: newHeaders
      });
    }
  },
  port: PORT,
});

console.log(`🚀 Serveur CESIZen démarré sur ${process.env.FRONTEND_URL}`); 