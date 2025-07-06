// Interface pour les ressources d'information
export interface InfoResource {
  id: number;
  title: string;
  summary: string;
  content: string;
  category: string;
  author_id: number;
  publication_date: string;
  modification_date: string;
  reading_time?: string;
  level?: string;
  views: number;
  shares: number;
  likes_count?: number;
  comments_count?: number;
  tags?: string[];
  media_type?: 'image' | 'video' | null;
  media_url?: string;
  media_filename?: string;
}

// Interface pour les médias uploadés
export interface MediaUpload {
  type: 'image' | 'video';
  url: string;
  filename: string;
  originalName: string;
  size: number;
}

// Interface pour les catégories
export interface Category {
  id: number;
  name: string;
  description?: string;
  created_at: string;
} 