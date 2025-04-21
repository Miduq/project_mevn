// frontend/src/services/subjects/SubjectService.js
import apiClient from '../apiClient';

// Función para obtener todas las asignaturas
const getAllSubjects = async () => {
    try {
        const response = await apiClient.get('/subjects');
        return response.data; // Debería contener { success: true, subjects: [...] }
    } catch (error) {
        console.error('Error en servicio getAllSubjects:', error.response?.data || error.message);
        throw error;
    }
};

// Función para crear una nueva asignatura
const createSubject = async (subjectData) => {
    // subjectData podría ser { subject: 'Nuevo Nombre' }
    try {
        const response = await apiClient.post('/subjects', subjectData);
        return response.data;
    } catch (error) {
        console.error('Error en servicio createSubject:', error.response?.data || error.message);
        throw error;
    }
};

// Función para actualizar una asignatura existente
const updateSubject = async (id, subjectData) => {
     // subjectData podría ser { subject: 'Nombre Actualizado' }
    try {
        const response = await apiClient.put(`/subjects/${id}`, subjectData);
        return response.data;
    } catch (error) {
        console.error(`Error en servicio updateSubject ${id}:`, error.response?.data || error.message);
        throw error;
    }
};

// Función para eliminar una asignatura existente
const deleteSubject = async (id) => {
    try {
        const response = await apiClient.delete(`/subjects/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error en servicio deleteSubject ${id}:`, error.response?.data || error.message);
        throw error;
    }
};


export default {
    getAllSubjects,
    createSubject,
    updateSubject,
    deleteSubject
};