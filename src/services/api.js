import axios from 'axios';

// When using Vite proxy, we use relative paths to avoid CORS
export const BASE_URL = window.location.origin;
const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fashionToken');
    if (token && token !== 'null' && token !== 'undefined') {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // For protected routes, we can log a warning if token is missing
      if (config.url.includes('/save') || config.url.includes('/user/')) {
        console.warn(`Request to protected route ${config.url} without token.`);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle expired or invalid tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 422) {
      // Don't clear storage or redirect for login failures
      if (error.config?.url?.includes('/auth/login')) {
        return Promise.reject(error);
      }

      // Token expired or invalid
      console.warn("Session expired or invalid token. Clearing storage.");
      localStorage.removeItem('fashionToken');
      localStorage.removeItem('fashionUser');

      // If we're on a page that needs login (not Home, About, etc.)
      if (!['/', '/login', '/signup', '/about'].includes(window.location.pathname)) {
        window.location.href = '/login?msg=session_expired';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'), // Using full profile route
};
export const userService = {
  getDashboardStats: () => api.get('/user/dashboard-stats'),
  updateProfile: (data) => api.put('/user/profile', data),
};

export const accessoryService = {
  analyze: (formData) => api.post('/accessory/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  colorMatch: (color) => api.post('/color-match', { color }),
  getColorCombinations: (color, gender = 'female', skinTone = 'Medium') => api.post('/color-combinations', { color, gender, skin_tone: skinTone }),
  analyzeSkinTone: (formData) => api.post('/skin-tone/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const galleryService = {
  getOutfits: (page = 1, limit = 20) => api.get(`/gallery?page=${page}&limit=${limit}`),
  getOutfitDetail: (id) => api.get(`/gallery/${id}`),
  likeOutfit: (outfitId) => api.post('/gallery/like', { id: outfitId }),
  getLikedOutfits: () => api.get('/profile/liked'),
};

export const recommendationService = {
  getRecommendations: (data) => api.post('/recommendations', data),
  saveRecommendation: (data) => api.post('/recommendations/save', data),
};

export const chatService = {
  sendMessage: (message, gender, history, language = 'en', stylePreference = 'Casual', skinTone = null, occasion = null, weather = null) => api.post('/ai-chat', { message, gender, history, language, style_preference: stylePreference, skin_tone: skinTone, occasion, weather }),
};

export const feedbackService = {
  submit: (data) => api.post('/feedback', data),
};

export const adminService = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  getFeedback: () => api.get('/admin/feedback'),
};

export const closetService = {
  getItems: (params = {}) => api.get('/closet/items', { params }),
  addItem: (formData) => api.post('/closet/items', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteItem: (id) => api.delete(`/closet/items/${id}`),
  generateCapsules: (data = {}) => api.post('/closet/capsule-generate', data),
};

export const searchService = {
  visualSearch: (formData) => api.post('/search/visual', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  semanticSearch: (q) => api.get('/search/semantic', { params: { q } }),
};

export default api;
