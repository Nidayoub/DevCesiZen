import axios from 'axios';

// Make sure API_URL uses the correct backend URL (port 3000)
const API_URL = (process.env.NEXT_PUBLIC_API_URL)

// Configuration de base d'Axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Toujours inclure les cookies pour toutes les requêtes
});

// API des utilisateurs (admin)
export const usersApi = {
  getAll: () => api.get('/api/users'),
  getById: (id: number) => api.get(`/api/users/${id}`),
  create: (data: any) => api.post('/api/users', data),
  update: (id: number, data: any) => api.put(`/api/users/${id}`, data),
  delete: (id: number) => api.delete(`/api/users/${id}`),
  changeRole: (id: number, role: string) => api.put(`/api/users/${id}/role`, { role }),
};

// API des ressources
export const resourcesApi = {
  getAll: () => api.get('/api/resources'),
  getById: (id: number) => api.get(`/api/resources/${id}`),
  create: (data: any) => api.post('/api/resources', data),
  update: (id: number, data: any) => api.put(`/api/resources/${id}`, data),
  delete: (id: number) => api.delete(`/api/resources/${id}`),
};

// API des catégories
export const categoriesApi = {
  getAll: () => api.get('/api/categories'),
  getById: (id: number) => api.get(`/api/categories/${id}`),
  create: (data: any) => api.post('/api/categories', data),
  update: (id: number, data: any) => api.put(`/api/categories/${id}`, data),
  delete: (id: number) => api.delete(`/api/categories/${id}`),
};

export const diagnosticCategoriesApi = {
  getAll: () => api.get('/api/diagnostic-categories'),
  getAllWithCount: () => api.get('/api/diagnostic-categories/with-count'),
  getById: (id: number) => api.get(`/api/diagnostic-categories/${id}`),
  create: (data: any) => api.post('/api/diagnostic-categories', data),
  update: (id: number, data: any) => api.put(`/api/diagnostic-categories/${id}`, data),
  delete: (id: number) => api.delete(`/api/diagnostic-categories/${id}`),
};

// API des informations
export const infoApi = {
  getAll: () => api.get('/api/info'),
  getBySlug: (slug: string) => api.get(`/api/info/${slug}`),
  create: (data: any) => api.post('/api/info', data),
  update: (id: number, data: any) => api.put(`/api/info/${id}`, data),
  delete: (id: number) => api.delete(`/api/info/${id}`),
};

// API des ressources d'information
export const infoResourcesApi = {
  // Ressources
  getAll: (limit = 20, offset = 0) => api.get(`/api/info/resources?limit=${limit}&offset=${offset}`),
  getById: (id: number) => api.get(`/api/info/resources/${id}`),
  getByCategory: (category: string, limit = 20, offset = 0) => 
    api.get(`/api/info/resources/category/${category}?limit=${limit}&offset=${offset}`),
  getByTag: (tag: string, limit = 20, offset = 0) => 
    api.get(`/api/info/resources/tag/${tag}?limit=${limit}&offset=${offset}`),
  create: (data: any) => api.post('/api/info/resources', data),
  update: (id: number, data: any) => api.put(`/api/info/resources/${id}`, data),
  delete: (id: number) => api.delete(`/api/info/resources/${id}`),
  
  // Interactions
  getComments: (resourceId: number) => api.get(`/api/info/resources/${resourceId}/comments`),
  addComment: (resourceId: number, message: string) => 
    api.post(`/api/info/resources/${resourceId}/comments`, { message }),
    deleteComment: (resourceId: number, commentId: number) =>
    api.delete(`/api/info/resources/${resourceId}/comments/${commentId}`),
  updateComment: (resourceId: number, commentId: number, message: string) =>
    api.put(`/api/info/resources/${resourceId}/comments/${commentId}`, { message }),
  toggleLike: (resourceId: number) => api.post(`/api/info/resources/${resourceId}/likes`),
  checkLiked: (resourceId: number) => api.get(`/api/info/resources/${resourceId}/likes`),
  incrementShares: (resourceId: number) => api.post(`/api/info/resources/${resourceId}/shares`),
  
  // Tags
  getAllTags: () => api.get('/api/info/tags'),
};

// API des diagnostics
export const diagnosticApi = {
  getQuestions: () => api.get('/api/diagnostic/questions'),
  submitDiagnostic: (data: any) => api.post('/api/diagnostic/submit', data),
  getUserHistory: () => api.get('/api/diagnostic/history'),
  // Administration du diagnostic (admin uniquement)
  configureQuestions: (data: any) => api.post('/api/diagnostic/configure', data),
};

// API des émotions
export const emotionsApi = {
  // Émotions
  getAllEmotions: () => api.get('/api/emotions'),
  createEmotion: (data: any) => api.post('/api/emotions', data),
  updateEmotion: (id: number, data: any) => api.put(`/api/emotions/${id}`, data),
  deleteEmotion: (id: number) => api.delete(`/api/emotions/${id}`),
  
  // Entrées du journal
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
  
  // Rapports
  getReport: (period: 'week' | 'month' | 'quarter' | 'year' = 'month') => 
    api.get(`/api/emotions/report?period=${period}`),
};

// Ajouter l'API pour les exercices de respiration
export const breathingApi = {
  getAllExercises: async () => {
    const response = await fetch(`${API_URL}/api/breathing`, {
      credentials: 'include' // Inclure les cookies pour cette requête
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch breathing exercises and could not parse error response' }));
      console.error('Error fetching breathing exercises:', errorData);
      throw new Error(errorData.message || 'Failed to fetch breathing exercises');
    }
    return response.json();
  },
  getExerciseById: async (id: string | number) => {
    const response = await fetch(`${API_URL}/api/breathing/${id}`, {
      credentials: 'include' // Inclure les cookies pour cette requête
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to fetch breathing exercise ${id} and could not parse error response` }));
      console.error(`Error fetching breathing exercise ${id}:`, errorData);
      throw new Error(errorData.message || `Failed to fetch breathing exercise ${id}`);
    }
    return response.json();
  },
  getExerciseTypes: async () => {
    const response = await fetch(`${API_URL}/api/breathing/types`, {
      credentials: 'include' // Inclure les cookies pour cette requête
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch breathing exercise types and could not parse error response' }));
      console.error('Error fetching breathing exercise types:', errorData);
      throw new Error(errorData.message || 'Failed to fetch breathing exercise types');
    }
    return response.json();
  }
};

// API des médias
export const mediaApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('media', file);
    return api.post('/api/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default api; 