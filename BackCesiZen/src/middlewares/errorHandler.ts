/**
 * Middleware de gestion des erreurs
 * @param error Erreur interceptée
 * @returns Response formatée avec le message d'erreur
 */
export function errorHandler(error: any): Response {
  console.error("Erreur interceptée:", error);
  
  // Formatage de la réponse d'erreur
  const status = error.status || 500;
  const message = error.message || "Une erreur interne est survenue";
  
  return new Response(JSON.stringify({ 
    error: message,
    status
  }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
} 