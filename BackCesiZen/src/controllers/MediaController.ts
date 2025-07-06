import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { verifyToken } from '../utils/jwt';
import { parse } from 'cookie';

export class MediaController {
  private static readonly UPLOAD_DIR = './uploads';
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  private static readonly ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];

  static {
    // Créer le dossier uploads s'il n'existe pas
    if (!existsSync(this.UPLOAD_DIR)) {
      mkdirSync(this.UPLOAD_DIR, { recursive: true });
    }
  }

  /**
   * Upload un fichier média
   */
  static async uploadMedia(req: Request): Promise<Response> {
    try {
      // Vérifier l'authentification via les cookies
      const cookies = req.headers.get('Cookie') || '';
      const parsedCookies = parse(cookies);
      const token = parsedCookies.authToken;
      
      if (!token) {
        return new Response(JSON.stringify({ error: 'Non autorisé' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const payload = await verifyToken(token);
      if (!payload) {
        return new Response(JSON.stringify({ error: 'Token invalide' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Récupérer les données du formulaire
      const formData = await req.formData();
      const file = formData.get('media') as File;

      if (!file) {
        return new Response(JSON.stringify({ error: 'Aucun fichier fourni' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Valider le fichier
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return new Response(JSON.stringify({ error: validation.error }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Générer un nom de fichier unique
      const fileExtension = this.getFileExtension(file.name);
      const filename = `${Date.now()}_${payload.userId}${fileExtension}`;
      const filepath = join(this.UPLOAD_DIR, filename);

      // Sauvegarder le fichier
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      await new Promise<void>((resolve, reject) => {
        const writeStream = createWriteStream(filepath);
        writeStream.write(buffer);
        writeStream.end();
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      // Déterminer le type de média
      const mediaType = this.getMediaType(file.type);
      
      // Construire l'URL complète pour les médias
      const requestUrl = new URL(req.url);
      const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
      const mediaUrl = `${baseUrl}/uploads/${filename}`;

      return new Response(JSON.stringify({
        success: true,
        media: {
          type: mediaType,
          url: mediaUrl,
          filename: filename,
          originalName: file.name,
          size: file.size
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Erreur lors de l\'upload du média:', error);
      return new Response(JSON.stringify({ error: 'Erreur serveur lors de l\'upload' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Valide un fichier uploadé
   */
  private static validateFile(file: File): { valid: boolean; error?: string } {
    // Vérifier la taille
    if (file.size > this.MAX_FILE_SIZE) {
      return { 
        valid: false, 
        error: `Le fichier est trop volumineux. Taille maximale : ${this.MAX_FILE_SIZE / 1024 / 1024}MB` 
      };
    }

    // Vérifier le type MIME
    const isValidImage = this.ALLOWED_IMAGE_TYPES.includes(file.type);
    const isValidVideo = this.ALLOWED_VIDEO_TYPES.includes(file.type);

    if (!isValidImage && !isValidVideo) {
      return { 
        valid: false, 
        error: 'Type de fichier non supporté. Formats acceptés : JPEG, PNG, GIF, WebP, MP4, WebM, OGG' 
      };
    }

    return { valid: true };
  }

  /**
   * Détermine le type de média basé sur le type MIME
   */
  private static getMediaType(mimeType: string): 'image' | 'video' {
    if (this.ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      return 'image';
    }
    return 'video';
  }

  /**
   * Extrait l'extension d'un nom de fichier
   */
  private static getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.substring(lastDot) : '';
  }

  /**
   * Sert les fichiers statiques
   */
  static async serveMedia(req: Request): Promise<Response> {
    try {
      const url = new URL(req.url);
      const filename = url.pathname.split('/').pop();
      
      if (!filename) {
        return new Response('Fichier non trouvé', { status: 404 });
      }

      const filepath = join(this.UPLOAD_DIR, filename);
      
      if (!existsSync(filepath)) {
        return new Response('Fichier non trouvé', { status: 404 });
      }

      // Lire le fichier
      const fs = await import('fs/promises');
      const fileBuffer = await fs.readFile(filepath);
      
      // Déterminer le type MIME basé sur l'extension
      const mimeType = this.getMimeTypeFromExtension(filename);
      
      return new Response(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=31536000', // Cache pour 1 an
        }
      });

    } catch (error) {
      console.error('Erreur lors du service du média:', error);
      return new Response('Erreur serveur', { status: 500 });
    }
  }

  /**
   * Détermine le type MIME basé sur l'extension du fichier
   */
  private static getMimeTypeFromExtension(filename: string): string {
    const ext = this.getFileExtension(filename).toLowerCase();
    
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.ogg': 'video/ogg'
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }
} 