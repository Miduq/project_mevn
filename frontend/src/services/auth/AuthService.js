// frontend/src/services/auth/AuthService.js
import apiClient from '../apiClient';

// Función interna para manejar el logout
const performLogout = () => {
  localStorage.removeItem('token');
  window.dispatchEvent(
    new CustomEvent('auth-change', {
      detail: { isLoggedIn: false },
    })
  );
};

// Función para iniciar sesión
const login = async (username, password) => {
  try {
    const response = await apiClient.post('/auth/login', {
      username,
      password,
    });
    if (response.data.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
      // --- Log añadido ---
      console.log(
        'AuthService Login: Token GUARDADO en localStorage:',
        localStorage.getItem('token') ? `...${localStorage.getItem('token').slice(-6)}` : 'FALLO AL GUARDAR'
      );
      // -------------------
      window.dispatchEvent(
        new CustomEvent('auth-change', {
          detail: { isLoggedIn: true },
        })
      );
      return { success: true }; // Asume que el backend devuelve el user
    } else {
      // Si no fue exitoso o no vino el token según el backend
      return {
        success: false,
        message: response.data.message || 'Login fallido desde el backend.',
      };
    }
  } catch (error) {
    console.error('Error en servicio login:', error.response?.data || error.message);
    throw error;
  }
};

// Función para registrar un nuevo usuario
const register = async (userData) => {
  try {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    console.error('Error en servicio register:', error.response?.data || error.message);
    throw error;
  }
};

// Función para obtener datos del usuario logueado
const getMe = async () => {
  try {
    const response = await apiClient.get('/auth/me');
    return response.data;
  } catch (error) {
    console.error('Error en servicio getMe:', error.response?.data || error.message);
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn('Error 401/403 detectado en getMe. Realizando logout automático.');
      performLogout();
    }
    throw error;
  }
};

// Función de logout que se exporta para ser usada en otros componentes
const logout = () => {
  performLogout();
};

// Función para subir foto de perfil
const uploadProfilePicture = async (userId, formData) => {
  try {
    const response = await apiClient.put(`/users/${userId}/profile-picture`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error en servicio uploadProfilePicture para user ${userId}:`, error.response?.data || error.message);
    throw error;
  }
};

// Recuperar contraseña
const recoverPassword = async (email) => {
  try {
    const response = await apiClient.post('/auth/recover-password', { email });
    return response.data;
  } catch (error) {
    console.error('Error en AuthService.recoverPassword:', error.response?.data || error.message);
    throw error;
  }
};

// Resetear contraseña ---
const resetPassword = async (resetData) => {
  try {
    const response = await apiClient.post('/auth/reset-password', resetData);
    return response.data;
  } catch (error) {
    console.error('Error en AuthService.resetPassword:', error.response?.data || error.message);
    throw error;
  }
};

// Exporta todas las funciones públicas
export default {
  login,
  register,
  getMe,
  logout,
  uploadProfilePicture,
  recoverPassword,
  resetPassword,
};
