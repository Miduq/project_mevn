<template>
    <div class="profile-page">
      <h2>Perfil de Usuario</h2>
  
      <!-- Sección de la imagen de perfil actual -->
      <div v-if="profileImageUrl" class="profile-pic-container">
        <img :src="profileImageUrl" alt="Foto de perfil" class="profile-pic" />
      </div>
      <div v-else class="placeholder-image">
        <p>Sin imagen de perfil</p>
      </div>
  
      <!-- Input estándar para seleccionar archivos -->
      <div v-if="userData.id">
        <input type="file" @change="onFileChange" accept="image/*" ref="fileInput" />
        <button @click="updateProfilePic" :disabled="isUploading">
          {{ isUploading ? 'Subiendo...' : 'Subir Imagen' }}
        </button>
      </div>
      <div v-else>
        <p>Cargando datos del usuario...</p>
      </div>
  
      <!-- Mostrar el contenido de 'selectedFile' para depuración -->
      <pre>{{ selectedFile }}</pre>
  
      <hr />
  
      <!-- Datos del usuario -->
      <p><strong>Nombre:</strong> {{ userData.name }}</p>
      <p><strong>Apellidos:</strong> {{ userData.surname }}</p>
      <p><strong>Email:</strong> {{ userData.email }}</p>
      <p><strong>Rol:</strong> {{ roleName }}</p>
  
      <!-- Mostrar mensaje de error si existe -->
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
  
      <!-- Si es profesor, lista de asignaturas que imparte con Nº de alumnos -->
      <div v-if="isProfesor">
        <h3>Asignaturas que imparte</h3>
        <table border="1">
          <thead>
            <tr>
              <th>Asignatura</th>
              <th>Nº de Alumnos</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(subject, index) in subjects" :key="index">
              <td>{{ subject.subject }}</td>
              <td class="centered">{{ subject.totalStudents }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </template>
  
  <script>
    import apiClient from '@/services/apiClient';
    import AuthService from '@/services/auth/AuthService';
    import UsersService from '@/services/users/UsersService';
    import RelationService from '@/services/relations/RelationService';
    import User from '@/models/User';

export default {
  name: 'ProfilePage',
  data() {
    return {
      userData: null, // Inicializa como null hasta cargar
      userData: new User(), // O inicializa con el modelo vacío
      profileImageUrl: '', // URL para mostrar la imagen actual
      selectedFile: null, // Archivo seleccionado
      isUploading: false, // Estado de subida
      errorMessage: '', // Mensaje de error general
      subjects: [] // Lista de asignaturas para profesores
    };
  },
  computed: {
    isProfesor() {
      return this.userData?.rol === 2;
    },
    roleName() {
      if (!this.userData) return 'Cargando...';
      return this.userData.role_name || (this.isProfesor ? 'Profesor' : 'Alumno');
    }
  },
  created() {
    this.fetchUserData();
  },
  methods: {
    async fetchUserData() {
      console.log('Fetching user data...');
      try {
        const data = await AuthService.getMe();
        if (data.success && data.user) {
          this.userData = new User(data.user);
          console.log('User data loaded:', this.userData);

          // Construir la URL de la imagen si existe
          if (this.userData.profile_image) {
             // Asume que la baseURL para imágenes es la misma que la API
             const baseURL = apiClient.defaults.baseURL || 'http://localhost:3000';
             this.profileImageUrl = `${baseURL}/uploads/profile_images/${this.userData.profile_image}`;
          } else {
             this.profileImageUrl = '';
          }

          // Si es profesor, cargar sus asignaturas después de tener el ID
          if (this.isProfesor) {
            this.fetchSubjectsWithStudents();
          }

        } else {
          this.errorMessage = data.message || 'Error al obtener datos del usuario.';
          console.error(this.errorMessage);
           this.$router.push('/');
        }
      } catch (error) {
         this.errorMessage = error.response?.data?.message || error.message || 'Error de red al obtener información del usuario.';
         console.error('Error en fetchUserData:', error);
         this.$router.push('/');
      }
    },

    async fetchSubjectsWithStudents() {
      if (!this.userData?.id) return;
      console.log(`Workspaceing subjects for teacher ID: ${this.userData.id}`);
      try {
        // Usa el servicio de relaciones
        const data = await RelationService.getSubjectsTeacher(this.userData.id);
        if (data.success) {
          this.subjects = data.subjects;
          console.log('Subjects loaded:', this.subjects);
        } else {
          console.error('Error al cargar asignaturas (backend):', data.message);
          this.errorMessage = data.message || 'Error al cargar las asignaturas.';
        }
      } catch (error) {
        this.errorMessage = error.response?.data?.message || error.message || 'Error de red al cargar las asignaturas.';
        console.error('Error en fetchSubjectsWithStudents:', error);
      }
    },

    onFileChange(event) {
      const file = event.target.files[0];
      if (file && this.validateFile(file)) {
        this.selectedFile = file;
        this.profileImageUrl = URL.createObjectURL(file);
      } else {
        this.selectedFile = null;
      }
    },

    validateFile(file) {
         const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
         const maxSize = 10 * 1024 * 1024; // 10MB

         if (!validTypes.includes(file.type)) {
           alert('Solo se permiten imágenes (jpeg, jpg, png, gif).');
           return false;
         }

         if (file.size > maxSize) {
           alert('El archivo excede el tamaño máximo permitido de 10MB.');
           return false;
         }

         return true;
    },

    async updateProfilePic() {
      if (!this.selectedFile || !this.userData?.id) {
        alert('Selecciona un archivo válido primero.');
        return;
      }

      this.isUploading = true;
      this.errorMessage = '';
      const formData = new FormData();
      formData.append('image', this.selectedFile);

      try {
        console.log(`Uploading picture for user ID: ${this.userData.id}`);
        // Usa el servicio de autenticación para subir la imagen
        const data = await AuthService.uploadProfilePicture(this.userData.id, formData);
        if (data.success) {
          alert('Imagen actualizada con éxito.');
          if (data.imageUrl) {
            this.profileImageUrl = data.imageUrl;
          } else if (data.filename){
            const baseURL = apiClient.defaults.baseURL || 'http://localhost:3000';
            this.profileImageUrl = `${baseURL}/uploads/profile_images/${data.filename}`;
            this.userData.profile_image = data.filename; // Asume que devuelve el nombre
          }
          // Limpiar selección
          this.$refs.fileInput.value = '';
          this.selectedFile = null;
        } else {
          this.errorMessage = data.message || 'Error al subir la imagen.';
          alert(this.errorMessage);
        }
      } catch (error) {
        this.errorMessage = error.response?.data?.message || error.message || 'Error de red al subir la imagen.';
        alert(this.errorMessage);
        console.error('Error en updateProfilePic:', error);
      } finally {
        this.isUploading = false;
      }
    },

    // --- ACTUALIZAR USUARIO ---
    async updateUser() {
      if (!this.userData?.id) return;

      // Validar que todos los campos estén llenos
      if (!this.userData.name?.trim() || !this.userData.surname?.trim() || !this.userData.email?.trim()) {
         this.errorMessage = 'Nombre, Apellidos y Email son obligatorios.';
         return;
       }

       this.errorMessage = '';

      try {
        const payload = {
          name: this.userData.name,
          surname: this.userData.surname,
          email: this.userData.email,
        };

        console.log(`Updating user ID: ${this.userData.id}`);
        // Usa el servicio de usuarios
        const data = await UsersService.updateUser(this.userData.id, payload);

        if (data.success) {
          alert('Perfil actualizado exitosamente.');
          // Actualizar userData si el backend devuelve el usuario actualizado
          this.userData = new User(data.user);
        } else {
          this.errorMessage = data.message || 'Error al actualizar el perfil (backend).';
        }
      } catch (error) {
         this.errorMessage = error.response?.data?.message || error.message || 'Error de red al actualizar el perfil.';
         console.error('Error en updateUser:', error);
      }
    }
  }
};
</script>
  
  <style scoped>
  .profile-page {
    max-width: 600px;
    margin: 30px auto;
    text-align: left;
  }
  
  .profile-pic-container {
    margin-bottom: 20px;
  }
  
  .profile-pic {
    width: 200px;
    height: 200px;
    object-fit: cover;
    border-radius: 50%;
  }
  
  .placeholder-image {
    width: 200px;
    height: 200px;
    background: #ccc;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
    margin-bottom: 20px;
  }
  
  .centered {
    text-align: center;
  }
  
  button {
    padding: 10px 20px;
    font-size: 16px;
    cursor: pointer;
    margin-top: 10px;
  }
  
  button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
  
  .error-message {
    color: red;
    margin-bottom: 20px;
  }
  </style>
  