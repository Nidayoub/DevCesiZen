// Type d'utilisateur
export interface User {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  role: 'user' | 'admin' | 'super-admin';
}

// Type de catégorie
export interface Category {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

// Type de ressource
export interface Resource {
  id: number;
  title: string;
  description: string;
  type: string;
  url?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
  categories?: Category[];
}

// Type de page d'information
export interface InfoPage {
  id: number;
  title: string;
  slug: string;
  content: string;
  category?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

// Type de ressource d'information
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
  media_content?: string;
  media_filename?: string;
}

// Type de média uploadé
export interface MediaUpload {
  type: 'image' | 'video';
  content: string;
  filename: string;
  originalName?: string;
  size?: number;
}

// Type d'événement de stress
export interface StressEvent {
  id: number;
  title?: string;
  event_text?: string;
  points: number;
  category: string;
}

// Type de résultat de diagnostic
export interface DiagnosticResult {
  score?: number;
  total_score?: number;
  stressLevel?: string;
  stress_level?: string;
  interpretation?: string;
  selectedEvents?: StressEvent[];
  selected_events?: StressEvent[];
  resultId?: number;
}

export interface Emotion {
  id: number;
  name: string;
  color: string;
  icon?: string;
  is_default?: boolean;
}

export interface EmotionEntry {
  id: number;
  user_id: number;
  emotion_id: number;
  intensity: number;
  notes?: string;
  date: string;
  emotion_name?: string;
  emotion_color?: string;
  emotion_icon?: string;
}

export interface EmotionReport {
  period: 'week' | 'month' | 'quarter' | 'year';
  data: EmotionReportData[];
  summary: EmotionSummary[];
}

export interface EmotionReportData {
  name: string;
  color: string;
  data: {
    date: string;
    count: number;
    intensity: number;
  }[];
}

export interface EmotionSummary {
  emotion_name: string;
  emotion_color: string;
  count: number;
  average_intensity: number;
  date: string;
} 