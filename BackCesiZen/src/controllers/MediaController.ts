import { verifyToken } from '../utils/jwt';
import { parse } from 'cookie';
import { db } from '../data/database';

export class MediaController {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  private static readonly ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];

  /**
   * Upload un fichier média et le convertit en base64
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

      // Convertir le fichier en base64
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Content = buffer.toString('base64');
      
      // Créer une data URL complète avec le type MIME
      const dataUrl = `data:${file.type};base64,${base64Content}`;

      // Déterminer le type de média
      const mediaType = this.getMediaType(file.type);

      return new Response(JSON.stringify({
        success: true,
        media: {
          type: mediaType,
          content: dataUrl,
          filename: file.name,
          originalName: file.name,
          size: file.size,
          mimeType: file.type
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
   * Récupère un média par son ID depuis la base de données
   */
  static async getMedia(req: Request): Promise<Response> {
    try {
      const url = new URL(req.url);
      const mediaId = url.pathname.split('/').pop();
      
      if (!mediaId) {
        return new Response(JSON.stringify({ error: 'ID média requis' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Récupérer le média depuis la base de données
      const media = await db.queryOne(
        'SELECT media_content, media_type, media_filename FROM info_resources WHERE id = ?',
        [mediaId]
      );

      if (!media || !media.media_content) {
        return new Response(JSON.stringify({ error: 'Média non trouvé' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        media: {
          content: media.media_content,
          type: media.media_type,
          filename: media.media_filename
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération du média:', error);
      return new Response(JSON.stringify({ error: 'Erreur serveur' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
} 