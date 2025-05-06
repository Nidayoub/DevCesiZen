/**
 * Middleware de logging pour les requêtes entrantes
 * @param method Méthode HTTP de la requête
 * @param path Chemin de la requête
 */
export function logger(method: string, path: string): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${method} ${path}`);
} 