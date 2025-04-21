<!-- src/views/EditUserPage.vue -->

<template>
    <div class="edit-user-container">
        <h2>Modificar Usuario</h2>
        <div v-if="loadingUser">Cargando...</div>
        <div v-else>
            <div v-if="errorMessage" class="error-message">
                {{ errorMessage }}
            </div>
            <form @submit.prevent="updateUser">
                <div class="form-group">
                    <label for="name">Nombre:</label>
                    <input type="text" id="name" v-model="user.name" required />
                </div>

                <div class="form-group">
                    <label for="surname">Apellidos:</label>
                    <input type="text" id="surname" v-model="user.surname" required />
                </div>

                <div class="form-group">
                    <label for="email">Email:</label>
                    <input type="email" id="email" v-model="user.email" required />
                </div>

                <div class="form-group">
                    <label for="role">Rol:</label>
                    <select id="role" v-model="user.rol" required>
                        <option value="" disabled>Seleccione un rol</option>
                        <option v-for="role in roles" :key="role.id" :value="role.id">
                            {{ role.role_name }}
                        </option>
                    </select>
                </div>

                <button type="submit">Actualizar Usuario</button>
                <router-link :to="{ name: 'UserListPage' }">Cancelar</router-link>
            </form>
        </div>
    </div>
    <div v-if="user.rol === 1" class="asignaturas-section">
        <hr>
        <h3>Asignaturas Asignadas</h3>

        <div v-if="loadingRelations">Cargando asignaturas...</div>
        <div v-else-if="relationsErrorMessage" class="error-message">{{ relationsErrorMessage }}</div>

        <table v-if="studentRelations.length > 0" class="relations-table">
            <thead>
                <tr>
                    <th>Asignatura</th>
                    <th>Profesor</th>
                    <th>Acción</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="relation in studentRelations" :key="relation.id">
                    <td>{{ relation.subject?.subject || 'N/A' }}</td>
                    <td>{{ relation.teacher?.name || 'N/A' }} {{ relation.teacher?.surname || '' }}</td>
                    <td>
                        <button @click="removeRelation(relation.id)" class="remove-button">Quitar</button>
                    </td>
                </tr>
            </tbody>
        </table>
        <div v-else-if="!loadingRelations && !relationsErrorMessage">
            Este alumno no tiene asignaturas asignadas.
        </div>

        <h4>Añadir Nueva Asignatura</h4>
        <div class="add-relation-form">
            <div class="form-group">
                <label for="subject">Asignatura:</label>
                <select id="subject" v-model="selectedSubject">
                    <option value="" disabled>Selecciona una asignatura</option>
                    <option v-for="subj in subjects" :key="subj.id" :value="subj.id">
                        {{ subj.subject }}
                    </option>
                </select>
            </div>
            <div class="form-group">
                <label for="teacher">Profesor:</label>
                <select id="teacher" v-model="selectedTeacher">
                    <option value="" disabled>Selecciona un profesor</option>
                    <option v-for="teach in teachers" :key="teach.id" :value="teach.id">
                        {{ teach.name }} {{ teach.surname }}
                    </option>
                </select>
            </div>
            <button @click="addRelation" :disabled="!selectedSubject || !selectedTeacher || addingRelation">
                {{ addingRelation ? 'Añadiendo...' : 'Añadir Asignatura' }}
            </button>
            <div v-if="addRelationMessage" :class="addRelationError ? 'error-message' : 'success-message'">
                {{ addRelationMessage }}
            </div>
        </div>
    </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import UsersService from '@/services/users/UsersService';
import RoleService from '@/services/roles/RoleService';
import SubjectService from '@/services/subjects/SubjectService';
import RelationService from '@/services/relations/RelationService';

export default {
    name: 'EditUserPage',
    props: ['id'], // Recibir el ID del usuario como prop
    setup(props) {
        const router = useRouter(); // Obtener la instancia del router
        const user = ref({
            name: '',
            surname: '',
            email: '',
            rol: '',
        });

        const roles = ref([]);
        const loadingUser = ref(true);
        const errorMessage = ref('');
        const studentRelations = ref([]);
        const subjects = ref([]);
        const teachers = ref([]);
        const selectedSubject = ref('');
        const selectedTeacher = ref('');
        const loadingRelations = ref(false);
        const relationsErrorMessage = ref('');
        const addingRelation = ref(false); // Para deshabilitar botón mientras se añade
        const addRelationMessage = ref(''); // Mensaje de éxito/error al añadir
        const addRelationError = ref(false); // Flag para estilo de mensaje

        const fetchRoles = async () => {
            try {
                const data = await RoleService.getAllRoles();
                if (data.success) {
                    roles.value = data.roles;
                } else {
                    errorMessage.value = 'Error al obtener los roles.';
                }
            } catch (error) {
                console.error('Error al obtener los roles:', error);
                errorMessage.value = error.message || 'Ocurrió un error al obtener los roles.';
            }
        };

        const fetchUser = async () => {
            loadingUser.value = true;
            errorMessage.value = '';
            try {
                const data = await UsersService.getUserById(props.id);
                if (data.success) {
                    user.value = data.user;
                    console.log('Datos del usuario cargado:', JSON.stringify(user.value, null, 2));
                    if (user.value.rol === 1) {
                        console.log('Es Alumno (Rol ID:', user.value.rol, '), cargando relaciones...');
                        fetchAllRelationData();
                    } else {
                        console.log('NO es Alumno (Rol ID:', user.value.rol, '), no se carga sección asignaturas.');
                    }
                } else {
                    errorMessage.value = data.message || 'Error al obtener la información del usuario.';
                }
            } catch (error) {
                console.error('Error al obtener el usuario:', error);
                errorMessage.value = error.message || 'Ocurrió un error al obtener la información del usuario.';
            } finally {
                loadingUser.value = false;
            }
        };

        const fetchStudentRelations = async () => {
            loadingRelations.value = true;
            relationsErrorMessage.value = '';
            try {
                const data = await RelationService.getRelationsForStudent(props.id);
                if (data.success) {
                    studentRelations.value = data.relations;
                } else {
                    relationsErrorMessage.value = data.message || 'Error al cargar las asignaturas asignadas.';
                }
            } catch (error) {
                console.error('Error fetching student relations:', error);
                relationsErrorMessage.value = error.message ||'Error al cargar las asignaturas asignadas.';
            } finally {
                 loadingRelations.value = false;
            }
        };

        const fetchSubjects = async () => {
            try {
                const data = await SubjectService.getAllSubjects();
                 // --- FIN CAMBIO ---
                if (data.success) {
                    subjects.value = data.subjects;
                }
            } catch (error) {
                console.error('Error fetching subjects:', error);
                relationsErrorMessage.value = error.message || 'Error al cargar lista de asignaturas.';
            }
        };

        const fetchTeachers = async () => {
            try {
                const data = await UsersService.getTeachers();
                if (data.success) {
                    teachers.value = data.teachers;
                }
            } catch (error) {
                console.error('Error fetching teachers:', error);
                relationsErrorMessage.value = error.message || 'Error al cargar lista de profesores.';
            }
        };

        // Función para cargar todos los datos necesarios para las relaciones
        const fetchAllRelationData = async () => {
             loadingRelations.value = true;
             await Promise.all([fetchStudentRelations(), fetchSubjects(), fetchTeachers()]);
             loadingRelations.value = false;
        }

        const addRelation = async () => {
            if (!selectedSubject.value || !selectedTeacher.value) return;
            addingRelation.value = true;
            addRelationMessage.value = '';
            addRelationError.value = false;
            try {
                const payload = {
                    studentId: parseInt(props.id),
                    subjectId: selectedSubject.value,
                    teacherId: selectedTeacher.value,
                };
                const data = await RelationService.addRelation(payload);
                if (data.success) {
                    addRelationMessage.value = 'Asignatura añadida correctamente.';
                    selectedSubject.value = '';
                    selectedTeacher.value = '';
                    await fetchStudentRelations();
                } else {
                     addRelationError.value = true;
                    addRelationMessage.value = data.message || 'Error al añadir la asignatura.';
                }
            } catch (error) {
                console.error('Error adding relation:', error);
                addRelationError.value = true;
                addRelationMessage.value = error.response?.data?.message || error.message || 'Error al añadir la asignatura.';
            } finally {
                addingRelation.value = false;
                setTimeout(() => { addRelationMessage.value = ''; }, 5000);
            }
        };

         const removeRelation = async (relationId) => {
            if (!confirm('¿Estás seguro de que quieres quitar esta asignatura?')) return;
             relationsErrorMessage.value = '';
            try {

                const data = await RelationService.deleteRelation(relationId);
                 if (data.success) {
                     await fetchStudentRelations();
                 } else {
                    relationsErrorMessage.value = data.message || 'Error al quitar la asignatura.';
                 }
            } catch (error) {
                console.error('Error removing relation:', error);
                relationsErrorMessage.value = error.response?.data?.message || error.message || 'Error al quitar la asignatura.';
            }
        };

        const updateUser = async () => {
             errorMessage.value = '';
             try {
                const payload = {
                    name: user.value.name,
                    surname: user.value.surname,
                    email: user.value.email,
                    rol: user.value.rol,
                };

                const data = await UsersService.updateUser(props.id, payload);
                 if (data.success) {
                    alert('Usuario actualizado exitosamente.');
                    router.push({ name: 'UserListPage' });
                 } else {
                    errorMessage.value = data.message || 'Error al actualizar el usuario.';
                 }
            } catch (error) {
                console.error('Error al actualizar el usuario:', error);
                errorMessage.value = error.response?.data?.message || error.message || 'Ocurrió un error al actualizar el usuario.';
            }
        };

        onMounted(() => {
            fetchRoles();
            fetchUser();
        });

        watch(() => props.id, (newId) => {
            if (newId) {
                fetchUser();
            }
        });

        return {
            user, roles, updateUser, loadingUser, errorMessage, studentRelations,
            subjects, teachers, selectedSubject, selectedTeacher, loadingRelations,
            relationsErrorMessage, addingRelation, addRelationMessage, addRelationError,
            addRelation, removeRelation,
        };
    },
};
</script>

<style scoped>
.edit-user-container {
    max-width: 500px;
    margin: 0 auto;
    padding: 20px;
}

h2 {
    text-align: center;
    margin-bottom: 20px;
}

.error-message {
    color: red;
    margin-bottom: 20px;
}

.form-group {
    margin-bottom: 15px;
}

label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
}

input,
select {
    width: 100%;
    padding: 8px;
    box-sizing: border-box;
}

button {
    padding: 10px 15px;
    margin-right: 10px;
    background-color: #28a745;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

button:hover {
    background-color: #218838;
}

router-link {
    padding: 10px 15px;
    background-color: #dc3545;
    color: #fff;
    text-decoration: none;
    border-radius: 4px;
    cursor: pointer;
}

router-link:hover {
    background-color: #c82333;
}

.asignaturas-section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.relations-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
}

.relations-table th,
.relations-table td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
}

.relations-table th {
    background-color: #f2f2f2;
}

.remove-button {
    padding: 3px 8px;
    background-color: #dc3545;
    color: white;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-size: 0.8em;
}
.remove-button:hover {
     background-color: #c82333;
}

.add-relation-form {
    margin-top: 15px;
    padding: 15px;
    border: 1px solid #eee;
    border-radius: 5px;
    background-color: #f9f9f9;
}

.add-relation-form .form-group {
    margin-bottom: 10px;
}

.add-relation-form button {
    margin-top: 10px;
    background-color: #007bff; /* Azul */
}
.add-relation-form button:hover {
     background-color: #0056b3;
}
.add-relation-form button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
}


</style>
