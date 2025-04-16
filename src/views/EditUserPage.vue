<!-- src/views/EditUserPage.vue -->

<template>
    <div class="edit-user-container">
        <h2>Modificar Usuario</h2>
        <div v-if="loading">Cargando...</div>
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
                <router-link to="/">Cancelar</router-link>
            </form>
        </div>
    </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import apiClient from '../../services/apiService'; // Importar apiClient

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
        const loading = ref(true);
        const errorMessage = ref('');

        const fetchRoles = async () => {
            try {
                const response = await apiClient.get('/roles'); // Usar apiClient
                if (response.data.success) {
                    roles.value = response.data.roles;
                } else {
                    errorMessage.value = 'Error al obtener los roles.';
                }
            } catch (error) {
                console.error('Error al obtener los roles:', error);
                errorMessage.value = 'Ocurrió un error al obtener los roles.';
            }
        };

        const fetchUser = async () => {
            try {
                const response = await apiClient.get(`/users/${props.id}`); // Usar apiClient
                if (response.data.success) {
                    user.value = {
                        name: response.data.user.name,
                        surname: response.data.user.surname,
                        email: response.data.user.email,
                        rol: response.data.user.rol,
                    };
                } else {
                    errorMessage.value = 'Error al obtener la información del usuario.';
                }
            } catch (error) {
                console.error('Error al obtener el usuario:', error);
                if (error.response && error.response.data && error.response.data.message) {
                    errorMessage.value = error.response.data.message;
                } else {
                    errorMessage.value = 'Ocurrió un error al obtener la información del usuario.';
                }
            } finally {
                loading.value = false;
            }
        };

        const updateUser = async () => {
            try {
                const payload = {
                    name: user.value.name,
                    surname: user.value.surname,
                    email: user.value.email,
                    rol: user.value.rol,
                };

                const response = await apiClient.put(`/users/${props.id}`, payload); // Usar apiClient

                if (response.data.success) {
                    alert('Usuario actualizado exitosamente.');
                    // Redirigir a la lista de usuarios o a otra página según tu flujo
                    router.push('/user-list'); // Asegúrate de que esta ruta existe
                } else {
                    errorMessage.value = 'Error al actualizar el usuario.';
                }
            } catch (error) {
                console.error('Error al actualizar el usuario:', error);
                if (error.response && error.response.data && error.response.data.message) {
                    errorMessage.value = error.response.data.message;
                } else {
                    errorMessage.value = 'Ocurrió un error al actualizar el usuario.';
                }
            }
        };

        onMounted(() => {
            fetchRoles();
            fetchUser();
        });

        return {
            user,
            roles,
            updateUser,
            loading,
            errorMessage,
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
</style>
