import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Configurez votre URL d'API en fonction de la plateforme
// Pour Android: utiliser 10.0.2.2 (redirection vers localhost de la machine hôte depuis l'émulateur)
// Pour iOS: utiliser localhost ou une URL ngrok
const API_URL = Platform.select({
  android: 'http://10.0.2.2:3000',
  ios: 'https://api-cesizen.ayoub-nidai.fr',
  default: 'http://localhost:3000'
});

console.log('API URL configurée:', API_URL);

// Headers par défaut pour toutes les requêtes
const baseHeaders = {
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'ngrok-skip-browser-warning': 'true',
};

const api = axios.create({
  baseURL: API_URL,
  headers: baseHeaders,
  // Ajouter un timeout pour éviter les requêtes bloquées
  timeout: 10000
});

// Ajouter un intercepteur pour déboguer les réponses
api.interceptors.response.use(
  (response) => {
    console.log(`Réponse API [${response.config.url}]:`, response.status);
    // Afficher la structure des données pour le débogage
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Structure des données [${response.config.url}]:`, 
        typeof response.data === 'object' ? 
          `Type: ${Array.isArray(response.data) ? 'Array' : 'Object'}, Clés: ${Object.keys(response.data)}` : 
          `Type: ${typeof response.data}`
      );
    }
    return response;
  },
  (error) => {
    console.error(`Erreur API [${error.config?.url}]:`, error.response?.status || error.message);
    if (error.response?.data) {
      console.error('Détails de l\'erreur:', error.response.data);
    }
    return Promise.reject(error);
  }
);

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const usersApi = {
  getAll: () => api.get('/api/users'),
  getById: (id: number) => api.get(`/api/users/${id}`),
  create: (data: any) => api.post('/api/users', data),
  update: (id: number, data: any) => api.put(`/api/users/${id}`, data),
  delete: (id: number) => api.delete(`/api/users/${id}`),
  changeRole: (id: number, role: string) => api.put(`/api/users/${id}/role`, { role }),
};

export const resourcesApi = {
  getAll: () => api.get('/api/resources'),
  getById: (id: number) => api.get(`/api/resources/${id}`),
  create: (data: any) => api.post('/api/resources', data),
  update: (id: number, data: any) => api.put(`/api/resources/${id}`, data),
  delete: (id: number) => api.delete(`/api/resources/${id}`),
};

export const categoriesApi = {
  getAll: () => api.get('/api/categories'),
  getById: (id: number) => api.get(`/api/categories/${id}`),
};

export const infoApi = {
  getAll: () => api.get('/api/info'),
  getBySlug: (slug: string) => api.get(`/api/info/${slug}`),
};

export const infoResourcesApi = {
  // Resources
  getAll: (limit = 20, offset = 0) => api.get(`/api/info/resources?limit=${limit}&offset=${offset}`),
  getById: (id: number) => api.get(`/api/info/resources/${id}`),
  getByCategory: (category: string, limit = 20, offset = 0) => 
    api.get(`/api/info/resources/category/${category}?limit=${limit}&offset=${offset}`),
  getByTag: (tag: string, limit = 20, offset = 0) => 
    api.get(`/api/info/resources/tag/${tag}?limit=${limit}&offset=${offset}`),
  
  // Create, update, delete resource
  create: (data: any) => api.post('/api/info/resources', data),
  update: (id: number, data: any) => api.put(`/api/info/resources/${id}/user`, data),
  delete: (id: number) => api.delete(`/api/info/resources/${id}/user`),
  
  // User specific
  getUserLiked: () => api.get('/api/info/liked'),
  
  getComments: (resourceId: number) => api.get(`/api/info/resources/${resourceId}/comments`),
  addComment: (resourceId: number, message: string) => 
    api.post(`/api/info/resources/${resourceId}/comments`, { message }),
  addReply: (resourceId: number, commentId: number, message: string) => 
    api.post(`/api/info/resources/${resourceId}/comments/${commentId}/replies`, { message }),
  deleteComment: (resourceId: number, commentId: number) => 
    api.delete(`/api/info/resources/${resourceId}/comments/${commentId}`),
  updateComment: (resourceId: number, commentId: number, message: string) => 
    api.put(`/api/info/resources/${resourceId}/comments/${commentId}`, { message }),
  
  // Likes
  toggleLike: (resourceId: number) => api.post(`/api/info/resources/${resourceId}/likes`),
  checkLiked: (resourceId: number) => api.get(`/api/info/resources/${resourceId}/likes`),
  
  // Shares
  incrementShares: (resourceId: number) => api.post(`/api/info/resources/${resourceId}/shares`),
  
  getAllTags: () => api.get('/api/info/tags'),
};

export const diagnosticApi = {
  getQuestions: () => api.get('/api/diagnostic/questions'),
  submitDiagnostic: (data: any) => api.post('/api/diagnostic/submit', data),
  getUserHistory: () => api.get('/api/diagnostic/history'),
  deleteDiagnostic: (id: number) => api.delete(`/api/diagnostic/history/${id}`),
};

// Emotions API
export const emotionsApi = {
  // Emotions
  getAllEmotions: () => api.get('/api/emotions'),
  
  // Journal entries
  getEntries: (startDate?: string, endDate?: string) => {
    let url = '/api/emotions/entries';
    if (startDate && endDate) {
      url += `?start_date=${startDate}&end_date=${endDate}`;
    }
    return api.get(url);
  },
  createEntry: (data: any) => api.post('/api/emotions/entries', data),
  updateEntry: (id: number, data: any) => api.put(`/api/emotions/entries/${id}`, data),
  deleteEntry: (id: number) => api.delete(`/api/emotions/entries/${id}`),
  
  // Reports
  getReport: (period: 'week' | 'month' | 'quarter' | 'year' = 'month') => 
    api.get(`/api/emotions/report?period=${period}`),
};

// Media API
export const mediaApi = {
  upload: (file: any) => {
    const formData = new FormData();
    formData.append('media', file);
    
    return api.post('/api/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 secondes pour l'upload
    });
  },
};

// Reports API
export const reportsApi = {
  create: (contentType: 'comment' | 'resource', contentId: number, reason: string, description?: string) => 
    api.post('/api/reports', { content_type: contentType, content_id: contentId, reason, description }),
  
  checkReported: (contentType: 'comment' | 'resource', contentId: number) => 
    api.get(`/api/reports/check?content_type=${contentType}&content_id=${contentId}`),
};

export default api; 