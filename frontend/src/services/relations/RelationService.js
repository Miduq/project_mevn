// frontend/src/services/relations/RelationService.js
import apiClient from '../apiClient';

// Función para obtener las relaciones de un estudiante
const getRelationsForStudent = async (studentId) => {
  try {
    const response = await apiClient.get(`/relations/student/${studentId}`);
    return response.data;
  } catch (error) {
    console.error(`Error en servicio getRelationsForStudent ${studentId}:`, error.response?.data || error.message);
    throw error;
  }
};

// Función para añadir una nueva relación
const addRelation = async (relationData) => {
  // relationData = { studentId: ..., teacherId: ..., subjectId: ... }
  try {
    const response = await apiClient.post('/relations', relationData);
    return response.data;
  } catch (error) {
    console.error('Error en servicio addRelation:', error.response?.data || error.message);
    throw error;
  }
};

// Función para eliminar una relación por su ID (usada en EditUserPage)
const deleteRelation = async (relationId) => {
  try {
    const response = await apiClient.delete(`/relations/${relationId}`);
    return response.data;
  } catch (error) {
    console.error(`Error en servicio deleteRelation ${relationId}:`, error.response?.data || error.message);
    throw error;
  }
};

// Función para obtener los profesores de un alumno
const getMyProfessors = async (studentId) => {
  try {
    const response = await apiClient.get(`/relations/my-professors/${studentId}`);
    return response.data;
  } catch (error) {
    console.error(`Error en servicio getMyProfessors ${studentId}:`, error.response?.data || error.message);
    throw error;
  }
};

// Función para obtener los alumnos de un profesor
const getMyStudents = async (teacherId, options = {}) => {
  const { page = 1, limit = 5, name = '', email = '' } = options;
  try {
    const url = `/relations/my-students/${teacherId}`;
    const params = { page, limit };
    if (name && name.trim() !== '') params.name = name.trim();
    if (email && email.trim() !== '') params.email = email.trim();

    console.log(`RelationService: GET ${url} con params:`, params);
    const response = await apiClient.get(url, { params }); // Pasar el objeto params
    return response.data; // Debería ser { success, students, pagination }
  } catch (error) {
    console.error(
      `Error en servicio getMyStudents ${teacherId} (page ${page}, filters):`,
      error.response?.data || error.message
    );
    throw error;
  }
};

// Función para obtener resumen de asignaturas de profesor
const getSubjectsTeacher = async (teacherId) => {
  try {
    const response = await apiClient.get(`/relations/subjects-teacher/${teacherId}`);
    return response.data;
  } catch (error) {
    console.error(`Error en servicio getSubjectsTeacher ${teacherId}:`, error.response?.data || error.message);
    throw error;
  }
};

export default {
  getRelationsForStudent,
  addRelation,
  deleteRelation,
  getMyProfessors,
  getMyStudents,
  getSubjectsTeacher,
};
