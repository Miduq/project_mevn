// src/services/apiService.js

import axios from 'axios';

const API_URL = 'http://localhost:3000';

// Crear una instancia de Axios
const apiClient = axios.create({
    baseURL: API_URL,
});

// Interceptor para añadir el token en cada solicitud
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor para manejar respuestas globales
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Redirigir al login
            window.location.href = '/';
            // Eliminar el token
            localStorage.removeItem('token');
        }
        return Promise.reject(error);
    }
);

// Exportar funciones específicas
export const login = (username, password) => {
    return apiClient.post('/auth/login', { username, password });
};

export const registerUser = (userData) => {
    return apiClient.post('/auth/register', userData);
};

export const getUserById = (id) => {
    return apiClient.get(`/users/${id}`);
};

export const updateUser = (id, userData) => {
    return apiClient.put(`/users/${id}`, userData);
};
    
export default apiClient;
