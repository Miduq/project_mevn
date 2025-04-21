// frontend/src/services/apiClient.js

import axios from "axios";

// Mantenemos la URL base aquí
const API_URL = "http://localhost:3000"; // Asegúrate que esta es la URL correcta de tu backend

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    // Puedes mantener o quitar headers por defecto si no los necesitas
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Interceptor para añadir el token en cada solicitud
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar respuestas generales
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error("Interceptor: Unauthorized! Redirecting...");
      localStorage.removeItem("token");
      // Redirigir al login (esta forma funciona pero recarga la página)
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
