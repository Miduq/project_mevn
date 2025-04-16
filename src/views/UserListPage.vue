<template>
    <div class="user-list">
        <h2>Lista de Usuarios</h2>

        <!-- Campo de búsqueda -->
        <div class="search-container">
            <input type="text" v-model="searchQuery" @keyup.enter="searchUsers"
                placeholder="Buscar usuario por nombre o correo" class="search-input" />
            <button @click="searchUsers" class="search-button">Buscar</button>
        </div>

        <!-- Mensaje de error -->
        <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
        </div>

        <!-- Tabla de usuarios -->
        <table v-if="users.length > 0">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nombre de Usuario</th>
                    <th>Nombre</th>
                    <th>Apellidos</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Acciones</th> <!-- Nueva columna para acciones -->
                </tr>
            </thead>
            <tbody>
                <tr v-for="user in users" :key="user.id">
                    <td>{{ user.id }}</td>
                    <td>{{ user.username }}</td>
                    <td>{{ user.name }}</td>
                    <td>{{ user.surname }}</td>
                    <td>{{ user.email }}</td>
                    <td>{{ user.role_name }}</td>
                    <td>
                        <router-link :to="{ name: 'EditUserPage', params: { id: user.id } }">
                            <button class="edit-button">Modificar</button>
                        </router-link>
                        <!-- Puedes agregar más botones de acción aquí, como eliminar -->
                    </td>
                </tr>
            </tbody>
        </table>
        <div v-else-if="!loading && !errorMessage">
            No se encontraron usuarios.
        </div>
        <div v-else-if="loading">
            Cargando usuarios...
        </div>
    </div>
</template>

<script>
import apiClient from '../../services/apiService';

export default {
    name: 'UserListPage',
    data() {
        return {
            users: [], // Lista de usuarios filtrados
            searchQuery: '', // Texto ingresado en el campo de búsqueda
            errorMessage: '', // Mensaje de error
            loading: false, // Estado de carga
        };
    },
    methods: {
        async searchUsers() {
            if (!this.searchQuery.trim()) {
                this.errorMessage = 'Por favor, ingresa un término de búsqueda.';
                this.users = [];
                return;
            }

            this.loading = true;
            this.errorMessage = '';
            this.users = [];

            try {
                const response = await apiClient.get('/users/search', {
                    params: { query: this.searchQuery }
                });

                if (response.data.success) {
                    this.users = response.data.users;
                    if (this.users.length === 0) {
                        this.errorMessage = 'No se encontraron usuarios con los criterios de búsqueda proporcionados.';
                    }
                } else {
                    this.errorMessage = 'Error al buscar los usuarios.';
                }
            } catch (error) {
                console.error('Error al buscar usuarios:', error);
                if (error.response && error.response.data && error.response.data.message) {
                    this.errorMessage = error.response.data.message;
                } else {
                    this.errorMessage = 'Ocurrió un error al buscar los usuarios.';
                }
            } finally {
                this.loading = false;
            }
        },
    },
};
</script>

<style scoped>
.user-list {
    max-width: 1000px;
    margin: 0 auto;
    text-align: center;
    padding: 20px;
}

.search-container {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
}

.search-input {
    flex: 1;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
}

.search-button {
    padding: 10px 15px;
    border: none;
    background-color: #007bff;
    color: #fff;
    border-radius: 5px;
    cursor: pointer;
}

.search-button:hover {
    background-color: #0056b3;
}

.error-message {
    color: red;
    margin-bottom: 20px;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
}

thead {
    background-color: #f2f2f2;
}

th,
td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #ddd;
}

.edit-button {
    padding: 5px 10px;
    cursor: pointer;
    background-color: #28a745;
    color: #fff;
    border: none;
    border-radius: 4px;
}

.edit-button:hover {
    background-color: #218838;
}

tr:nth-child(even) {
    background-color: #f9f9f9;
}

tr:hover {
    background-color: #f1f1f1;
}
</style>