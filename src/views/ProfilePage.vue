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
  import apiClient from '../../services/apiService';
  
  export default {
    name: 'ProfilePage',
    data() {
      return {
        userData: {
          id: null,
          name: '',
          surname: '',
          email: '',
          rol: null, // 1 => Alumno, 2 => Profesor
          profile_image: '' // nombre de archivo en la BD
        },
        profileImageUrl: '', // URL para mostrar la imagen actual en la vista
        selectedFile: null, // Archivo seleccionado por el usuario
        isUploading: false, // Estado de subida
        errorMessage: '', // Mensaje de error para la actualización del perfil
        subjects: [] // si rol=2, aquí guardaremos la info de asignaturas
      };
    },
    computed: {
      isProfesor() {
        return this.userData.rol === 2;
      },
      roleName() {
        return this.isProfesor ? 'Profesor' : 'Alumno';
      },
      // Obtener el token de localStorage
      token() {
        return localStorage.getItem('token');
      },
      // Construir la URL completa para subir la imagen incluyendo el userId
      fullUploadUrl() {
        if (this.userData.id) {
          return `${this.uploadUrl}${this.userData.id}`;
        }
        return '';
      },
      uploadUrl() {
        return 'http://localhost:3000/auth/upload-profile/';
      }
    },
    created() {
      this.fetchUserData();
    },
    methods: {
      async fetchUserData() {
        console.log('ProfilePage creado');
  
        try {
          // Obtener los datos del usuario actual usando la ruta protegida /auth/me
          const response = await apiClient.get('http://localhost:3000/auth/me', {
            headers: {
              Authorization: `Bearer ${this.token}`
            }
          });
          console.log('API response:', response); // Depuración
          if (response.data.success) {
            this.userData = response.data.user;
            console.log('Updated userData:', this.userData); // Depuración
  
            // Construir la URL de la imagen si existe
            if (this.userData.profile_image) {
              this.profileImageUrl = `http://localhost:3000/uploads/profile_images/${this.userData.profile_image}`;
            } else {
              this.profileImageUrl = ''; // Ruta a una imagen por defecto si no existe
            }
  
            // Actualizar localStorage con la información actualizada
            localStorage.setItem('userData', JSON.stringify(this.userData));
          } else {
            console.error(response.data.message);
            // Manejar el caso donde el usuario no es encontrado
            this.$router.push('/');
          }
        } catch (error) {
          console.error('Error al obtener información del usuario:', error);
          // Manejar errores de la solicitud
          this.$router.push('/');
        }
  
        // Si es profesor, cargar asignaturas
        if (this.isProfesor) {
          this.fetchSubjectsWithStudents();
        }
  
        console.log('userData después de loaded:', this.userData); // Depuración adicional
      },
      async fetchSubjectsWithStudents() {
        try {
          const res = await apiClient.get(
            `http://localhost:3000/relations/subjects-teacher/${this.userData.id}`,
            {
              headers: {
                Authorization: `Bearer ${this.token}`
              }
            }
          );
          if (res.data.success) {
            this.subjects = res.data.subjects; // Ajusta según la estructura de la respuesta
          } else {
            console.error('Error al cargar asignaturas:', res.data.message);
          }
        } catch (err) {
          console.error('Error al cargar asignaturas:', err);
        }
      },
      // Método para manejar el cambio en el input de archivo
      onFileChange(event) {
        const file = event.target.files[0];
        if (file && this.validateFile(file)) {
          this.selectedFile = file;
          // Actualizar la vista previa de la imagen si deseas
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
      // Método para subir la imagen al servidor
      async updateProfilePic() {
        console.log('Selected File:', this.selectedFile);
        console.log('ID del usuario:', this.userData.id);
  
        // 1. Verificar que un archivo ha sido seleccionado
        if (!this.selectedFile) {
          alert('No se ha seleccionado ningún archivo válido.');
          return;
        }
  
        try {
          this.isUploading = true; // Iniciar la subida
          this.errorMessage = '';
  
          // 2. Crear FormData y adjuntar el archivo
          const formData = new FormData();
          formData.append('image', this.selectedFile, this.selectedFile.name);
  
          // 3. Log para confirmar que el archivo se está agregando
          for (let pair of formData.entries()) {
            console.log(pair[0], pair[1]);
          }
  
          // 4. Enviar al backend utilizando Axios
          const response = await apiClient.post(this.fullUploadUrl, formData, {
            headers: {
              Authorization: `Bearer ${this.token}`,
              'Content-Type': 'multipart/form-data'
            }
          });
  
          console.log('Respuesta del servidor:', response.data); // Depuración
  
          // 5. Manejar la respuesta
          if (response.data.success) {
            this.profileImageUrl = response.data.imageUrl; // Actualizar la imagen en la vista
            this.userData.profile_image = response.data.filename; // Actualizar en userData
            localStorage.setItem('userData', JSON.stringify(this.userData));
  
            alert('Imagen actualizada con éxito.');
  
            // 6. Limpiar el input de archivo
            this.$refs.fileInput.value = '';
            this.selectedFile = null;
          } else {
            this.errorMessage = response.data.message || 'Error al subir la imagen.';
            alert(this.errorMessage);
          }
        } catch (error) {
          console.error('Error al subir la imagen:', error);
          this.errorMessage =
            error.response?.data?.message || 'Error al subir la imagen.';
          alert(this.errorMessage);
        } finally {
          this.isUploading = false; // Finalizar la subida
        }
      },
      // Método para actualizar datos del usuario (si es necesario)
      async updateUser() {
        // Validar que todos los campos estén llenos
        if (
          !this.userData.name.trim() ||
          !this.userData.surname.trim() ||
          !this.userData.email.trim() ||
          !this.userData.rol
        ) {
          this.errorMessage = 'Todos los campos son obligatorios.';
          return;
        }
  
        try {
          const payload = {
            name: this.userData.name,
            surname: this.userData.surname,
            email: this.userData.email,
            rol: this.userData.rol
          };
  
          const response = await apiClient.put(
            `http://localhost:3000/users/${this.userData.id}`,
            payload,
            {
              headers: {
                Authorization: `Bearer ${this.token}`
              }
            }
          );
  
          if (response.data.success) {
            alert('Perfil actualizado exitosamente.');
            // Actualizar localStorage con la información actualizada
            localStorage.setItem('userData', JSON.stringify(this.userData));
            // Opcional: Redirigir o realizar otras acciones
          } else {
            this.errorMessage =
              response.data.message || 'Error al actualizar el perfil.';
          }
        } catch (error) {
          console.error('Error al actualizar el perfil:', error);
          if (
            error.response &&
            error.response.data &&
            error.response.data.message
          ) {
            this.errorMessage = error.response.data.message;
          } else {
            this.errorMessage = 'Ocurrió un error al actualizar el perfil.';
          }
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
  