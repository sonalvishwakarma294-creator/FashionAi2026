import axios from 'axios';

// In production: set VITE_API_BASE_URL=https://your-backend.onrender.com in your hosting platform
// In development: leave unset — Vite proxy handles /api -> http://localhost:5001
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor to add JWT token and default Content-Type to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fashionToken');
    if (token && token !== 'null' && token !== 'undefined') {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      if (config.url.includes('/save') || config.url.includes('/user/')) {
        console.warn(`Request to protected route ${config.url} without token.`);
      }
    }
    // Only set JSON content-type when NOT sending FormData
    // (browser must set multipart/form-data with boundary automatically)
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';
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
      if (error.config?.url?.includes('/auth/login')) {
        return Promise.reject(error);
      }
      console.warn("Session expired or invalid token. Clearing storage.");
      localStorage.removeItem('fashionToken');
      localStorage.removeItem('fashionUser');
      if (!['/', '/login', '/signup', '/about'].includes(window.location.pathname)) {
        window.location.href = '/login?msg=session_expired';
      }
    }
    return Promise.reject(error);
  }
);

const INFERRED_BACKEND_BASE = (() => {
  // If VITE_API_BASE_URL is set (production), use that directly
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  // Development: infer from current window port
  const host = window.location.hostname || '127.0.0.1';
  const devPort = 5001;
  if (window.location.port === '5173') {
    return `http://${host}:${devPort}`;
  }
  if (window.location.port === String(devPort)) {
    return window.location.origin;
  }
  return window.location.origin;
})();

export const BASE_URL = window.location.origin;
export const BACKEND_BASE_URL = INFERRED_BACKEND_BASE;

export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  if (imagePath.startsWith('data:')) {
    return imagePath;
  }
  if (imagePath.startsWith('//')) {
    return imagePath;
  }
  const clean = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  if (BACKEND_BASE_URL && typeof window !== 'undefined' && BACKEND_BASE_URL !== window.location.origin) {
    if (
      clean.startsWith('/images/casual/') ||
      clean.startsWith('/images/office/') ||
      clean.startsWith('/images/party/') ||
      clean.startsWith('/images/fashionrec/') ||
      clean.startsWith('/images/g') ||
      clean.startsWith('/images/m')
    ) {
      return `${BACKEND_BASE_URL.replace(/\/+$/, '')}${clean}`;
    }
  }
  return clean;
};

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'), // Using full profile route
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  validateResetToken: (token) => api.post('/auth/validate-reset-token', { token }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
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
  getItem: (id) => api.get(`/closet/items/${id}`),
  getItemImage: (id) => api.get(`/closet/items/${id}/image`, { responseType: 'blob' }),
  addItem: (formData) => {
    // FormData: let browser set Content-Type with multipart boundary automatically
    if (formData instanceof FormData) {
      return api.post('/closet/items', formData, {
        headers: { 'Content-Type': undefined },
      });
    }
    return api.post('/closet/items', formData);
  },
  updateItem: (id, data) => api.put(`/closet/items/${id}`, data),
  setAvailability: (id, isAvailable) => api.patch(`/closet/items/${id}/availability`, { is_available: isAvailable }),
  deleteItem: (id) => api.delete(`/closet/items/${id}`),
  generateCapsules: (data = {}) => api.post('/closet/capsule-generate', data),
};

export const searchService = {
  visualSearch: (formData) => api.post('/search/visual', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  semanticSearch: (q) => api.get('/search/semantic', { params: { q } }),
  indexPalettes: () => api.post('/search/index/outfits'),
};

export default api;
