// frontend/src/services/users/UsersService.js
import apiClient from "../apiClient";

const getUserById = async (id) => {
  try {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    console.error(
      `Error en servicio getUserById ${id}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

const updateUser = async (id, userData) => {
  try {
    const response = await apiClient.put(`/users/${id}`, userData);
    return response.data; // Contiene { success, message, user? }
  } catch (error) {
    console.error(
      `Error en servicio updateUser ${id}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

const searchUsers = async (query) => {
  try {
    const response = await apiClient.get("/users/search", {
      params: { query },
    });
    return response.data; // Contiene { success, users }
  } catch (error) {
    console.error(
      "Error en servicio searchUsers:",
      error.response?.data || error.message
    );
    throw error;
  }
};

const getTeachers = async () => {
  try {
    const response = await apiClient.get("/users/teachers");
    return response.data; // Contiene { success, teachers }
  } catch (error) {
    console.error(
      "Error en servicio getTeachers:",
      error.response?.data || error.message
    );
    throw error;
  }
};

const getStudents = async () => {
  try {
    // Llama al endpoint GET /users/students que creamos en el backend
    const response = await apiClient.get("/users/students");
    return response.data; // Devuelve la respuesta completa { success: true, students: [...] }
  } catch (error) {
    console.error(
      "Error en servicio getStudents:",
      error.response?.data || error.message
    );
    throw error; // Propaga el error para que el componente lo maneje
  }
};

const getProfessorSubjectList = async (teacherId) => {
  try {
    // Llama al nuevo endpoint GET /users/:teacherId/subjects
    const response = await apiClient.get(`/users/${teacherId}/subjects`);
    return response.data; // Devuelve { success: true, subjects: [...] }
  } catch (error) {
    console.error(
      `Error en servicio getProfessorSubjectList ${teacherId}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

// Función para asignar una asignatura a un profesor
const assignSubjectToTeacher = async (teacherId, subjectData) => {
  try {
    // Llama a POST /users/:teacherId/subjects
    const response = await apiClient.post(
      `/users/${teacherId}/subjects`,
      subjectData
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error en servicio assignSubjectToTeacher ${teacherId}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

// Función para eliminar una asignatura de un profesor
const removeSubjectFromTeacher = async (teacherId, subjectId) => {
  try {
    // Llama a DELETE /users/:teacherId/subjects/:subjectId
    const response = await apiClient.delete(
      `/users/${teacherId}/subjects/${subjectId}`
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error en servicio removeSubjectFromTeacher ${teacherId}, ${subjectId}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

// Función para eliminar un estudiante (solo para profesores)
const deleteStudent = async (studentId) => {
  try {
    // Llama al endpoint DELETE /users/students/:studentId que creamos
    const url = `/users/students/${studentId}`;
    console.log(`UserService: Enviando DELETE a ${url}`);
    const response = await apiClient.delete(url);
    return response.data; // Devuelve { success, message }
  } catch (error) {
    console.error(
      `Error en servicio deleteStudent ${studentId}:`,
      error.response?.data || error.message
    );
    throw error; // Propaga el error para que el componente lo maneje
  }
};

// Función para actualizar datos de un estudiante (solo para profesores)
const updateStudentByProfessor = async (studentId, studentData) => {
  try {
    const url = `/users/students/${studentId}`;
    console.log(`UserService: Enviando PUT a ${url} con datos:`, studentData);
    const response = await apiClient.put(url, studentData);
    return response.data;
  } catch (error) {
    console.error(
      `Error en servicio updateStudentByProfessor ${studentId}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

export default {
  getUserById,
  updateUser,
  searchUsers,
  getTeachers,
  getStudents,
  getProfessorSubjectList,
  assignSubjectToTeacher,
  removeSubjectFromTeacher,
  deleteStudent,
  updateStudentByProfessor,
};
