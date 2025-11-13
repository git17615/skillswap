// src/services/api.js
// API Service for SkillSwap Frontend

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token
const getToken = () => localStorage.getItem('skillswap_token');

// Helper function to handle API responses
const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  
  return data;
};

// ==================== AUTH APIs ====================

export const authAPI = {
  // Register new user
  register: async (userData) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  // Login user
  login: async (credentials) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    return handleResponse(response);
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    return handleResponse(response);
  },
};

// ==================== USER APIs ====================

export const userAPI = {
  // Get all users
  getAllUsers: async () => {
    const response = await fetch(`${API_URL}/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    return handleResponse(response);
  },

  // Get skill matches
  getMatches: async () => {
    const response = await fetch(`${API_URL}/users/matches`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    return handleResponse(response);
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await fetch(`${API_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify(profileData),
    });
    return handleResponse(response);
  },
};

// ==================== REQUEST APIs ====================

export const requestAPI = {
  // Send connection request
  sendRequest: async (toUserId) => {
    const response = await fetch(`${API_URL}/requests/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ toUserId }),
    });
    return handleResponse(response);
  },

  // Get incoming requests
  getIncomingRequests: async () => {
    const response = await fetch(`${API_URL}/requests/incoming`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    return handleResponse(response);
  },

  // Get sent requests
  getSentRequests: async () => {
    const response = await fetch(`${API_URL}/requests/sent`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    return handleResponse(response);
  },

  // Accept request
  acceptRequest: async (requestId) => {
    const response = await fetch(`${API_URL}/requests/${requestId}/accept`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    return handleResponse(response);
  },

  // Reject request
  rejectRequest: async (requestId) => {
    const response = await fetch(`${API_URL}/requests/${requestId}/reject`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    return handleResponse(response);
  },
};

// ==================== CHAT APIs ====================

export const chatAPI = {
  // Get all chats
  getChats: async () => {
    const response = await fetch(`${API_URL}/chats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    return handleResponse(response);
  },

  // Get specific chat
  getChat: async (chatId) => {
    const response = await fetch(`${API_URL}/chats/${chatId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    return handleResponse(response);
  },

  // Send message
  sendMessage: async (chatId, text) => {
    const response = await fetch(`${API_URL}/chats/${chatId}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ text }),
    });
    return handleResponse(response);
  },
};

// ==================== ADMIN APIs ====================

export const adminAPI = {
  // Get all users (admin)
  getAllUsers: async () => {
    const response = await fetch(`${API_URL}/admin/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    return handleResponse(response);
  },

  // Verify user
  verifyUser: async (userId) => {
    const response = await fetch(`${API_URL}/admin/users/${userId}/verify`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    return handleResponse(response);
  },

  // Delete user
  deleteUser: async (userId) => {
    const response = await fetch(`${API_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    return handleResponse(response);
  },
};

// ==================== SOCKET.IO Connection ====================

export const initializeSocket = () => {
  const io = require('socket.io-client');
  const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  const socket = io(SOCKET_URL, {
    auth: {
      token: getToken()
    }
  });

  return socket;
};

export default {
  authAPI,
  userAPI,
  requestAPI,
  chatAPI,
  adminAPI,
  initializeSocket,
};