// frontend/src/services/apiClient.js

import axios from 'axios';
import AuthService from './auth/AuthService';

// Mantenemos la URL base aquí
const API_URL = 'http://localhost:3000'; // Asegúrate que esta es la URL correcta de tu backend

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    // Puedes mantener o quitar headers por defecto si no los necesitas
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
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

// Interceptor para manejar respuestas generales
apiClient.interceptors.response.use(
  (response) => response,

  (error) => {
    // Comprueba si el error es de respuesta y si el status es 401 (No Autorizado) o 403 (Prohibido)
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.error(`Interceptor: Error ${error.response.status} detectado! Token inválido/expirado o sin permisos.`);
      // Llamar a AuthService.logout() para:
      //    - Eliminar token de localStorage
      //    - Disparar evento 'auth-change' para actualizar UI (Navbar, etc.)
      AuthService.logout();
      // Esperar 3 segundos antes de redirigir
      console.log('Interceptor: Redirigiendo a Login en 3 segundos...');
      setTimeout(() => {
        // Redirige a /login explícitamente si esa es la ruta nombrada en tu router
        window.location.href = '/login';
      }, 3000);
      // Lanza un error
      return Promise.reject(new Error('Sesión expirada o inválida. Redirigiendo a login...'));
    } else {
      // Si es otro tipo de error (ej. 404, 500, error de red)
      console.error('Interceptor: Otro error de respuesta detectado:', error.response?.status, error.message);
      return Promise.reject(error);
    }
  }
);

export default apiClient;
