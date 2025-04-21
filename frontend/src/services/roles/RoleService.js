// frontend/src/services/roles/RoleService.js
import apiClient from '../apiClient';

// Función para obtener todos los roles
const getAllRoles = async () => {
    try {
        const response = await apiClient.get('/roles');
        return response.data;
    } catch (error) {
        console.error('Error en servicio getAllRoles:', error.response?.data || error.message);
        throw error;
    }
};

export default {
    getAllRoles
};