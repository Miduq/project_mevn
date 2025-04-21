// frontend/src/services/users/UsersService.js
import apiClient from '../apiClient';

const getUserById = async (id) => {
    try {
        const response = await apiClient.get(`/users/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error en servicio getUserById ${id}:`, error.response?.data || error.message);
        throw error;
    }
};

const updateUser = async (id, userData) => {
    try {
        const response = await apiClient.put(`/users/${id}`, userData);
        return response.data; // Contiene { success, message, user? }
    } catch (error) {
        console.error(`Error en servicio updateUser ${id}:`, error.response?.data || error.message);
        throw error;
    }
};

const searchUsers = async (query) => {
    try {
        const response = await apiClient.get('/users/search', { params: { query } });
        return response.data; // Contiene { success, users }
    } catch (error) {
        console.error('Error en servicio searchUsers:', error.response?.data || error.message);
        throw error;
    }
};

const getTeachers = async () => {
    try {
        const response = await apiClient.get('/users/teachers');
        return response.data; // Contiene { success, teachers }
    } catch (error) {
        console.error('Error en servicio getTeachers:', error.response?.data || error.message);
        throw error;
    }
};


export default {
    getUserById,
    updateUser,
    searchUsers,
    getTeachers
};