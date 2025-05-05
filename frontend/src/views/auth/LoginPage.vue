<!-- frontend/src/views/LoginPage.vue -->

<template>
  <!-- Creación del formulario -->
  <div class="container mt-5">
    <div class="justify-content-center">
      <div class="col-md-6">
        <h2 class="text-center">Iniciar Sesión</h2>
        <form @submit.prevent="loginUser">
          <div class="form-group">
            <label for="username">Nombre de usuario</label>
            <input
              type="text"
              class="form-control"
              id="username"
              v-model="username"
              placeholder="Introduce tu nombre de usuario"
              required
              autocomplete="username"
            />
          </div>
          <div class="form-group">
            <label for="password">Contraseña</label>
            <input
              type="password"
              class="form-control"
              id="password"
              v-model="password"
              placeholder="Introduce tu contraseña"
              required
              autocomplete="current-password"
            />
          </div>
          <button type="submit" class="btn btn-primary btn-block">Acceder</button>
        </form>
        <div v-if="errorMessage" class="alert alert-danger mt-3">
          {{ errorMessage }}
        </div>
        <hr class="my-4" />
        <div class="d-flex justify-content-center">
          <div id="googleSignInButton"></div>
        </div>
        <div v-if="googleLoginError" class="alert alert-danger mt-3 p-2 text-center">
          <small>{{ googleLoginError }}</small>
        </div>
        <div class="mt-3 text-center">
          <router-link to="/recover-password">¿Olvidaste tu contraseña?</router-link>
          |
          <router-link to="/register">Regístrate</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'; // Importa ref y onMounted
import { useRouter } from 'vue-router'; // Para la redirección post-login
import AuthService from '@/services/auth/AuthService'; // Importa tu servicio

// --- Router ---
const router = useRouter(); // Necesario para redirigir después del login exitoso

// --- Estado para Login Estándar ---
const username = ref(''); // Cambia a 'email' si usas email para login
const password = ref('');
const errorMessage = ref(''); // Para errores del login estándar
const isLoading = ref(false); // Para indicar carga del login estándar

// --- Estado para Google Login ---
const googleLoginError = ref(''); // Para errores específicos de Google Login
const isLoadingGoogle = ref(false); // Opcional: estado de carga para Google

// --- Método para Login Estándar (Simplificado) ---
const loginUser = async () => {
  errorMessage.value = ''; // Limpiar errores previos
  googleLoginError.value = '';
  isLoading.value = true;
  try {
    // Llama al servicio AuthService.login.
    // Este servicio ahora debería manejar el guardado del token
    // y disparar el evento 'auth-change' si tiene éxito.
    const loginResult = await AuthService.login(username.value, password.value); // Usa username o email según tu backend
    console.log('Respuesta del servicio login:', loginResult);

    if (loginResult.success) {
      console.log('Login estándar exitoso, redirigiendo a Home...');
      // Si el login en el servicio fue exitoso (y disparó el evento),
      // App.vue debería detectar el cambio en isLoggedIn y redirigir.
      // Pero por si acaso o para más rapidez, podemos redirigir aquí también.
      router.push({ name: 'HomePage' }); // O simplemente '/home'
    } else {
      // Error lógico devuelto por el backend (ej: credenciales incorrectas)
      errorMessage.value = loginResult.message || 'Credenciales incorrectas o error desconocido.';
    }
  } catch (error) {
    // Error de red o excepción no controlada en el servicio
    console.error('Error en la solicitud de login (catch):', error);
    errorMessage.value = error.response?.data?.message || error.message || 'Error al intentar iniciar sesión.';
  } finally {
    isLoading.value = false;
  }
};

// --- Callback que Google llamará tras el Sign-In exitoso ---
const handleGoogleSignIn = async (response) => {
  console.log('Google Sign-In Callback Response:', response);
  // El JWT de Google está en response.credential
  const googleToken = response.credential;
  if (!googleToken) {
    googleLoginError.value = 'No se recibió la credencial de Google.';
    return;
  }

  isLoadingGoogle.value = true;
  googleLoginError.value = ''; // Limpiar errores específicos de Google
  errorMessage.value = ''; // Limpiar errores del otro form

  try {
    // Llamar a la nueva función del servicio que verifica el token en nuestro backend
    const result = await AuthService.loginWithGoogle(googleToken);

    if (result.success && result.token) {
      // ¡Éxito! AuthService.loginWithGoogle ya debería haber guardado
      // nuestro token y disparado 'auth-change'. Redirigimos.
      console.log('Login con Google verificado por backend, redirigiendo a Home...');
      router.push({ name: 'HomePage' });
    } else {
      // Error devuelto por NUESTRO backend al verificar el token de Google
      googleLoginError.value = result.message || 'Error al verificar la sesión de Google con el servidor.';
    }
  } catch (error) {
    // Error en la llamada a nuestro backend /auth/google/verify
    console.error('Error llamando a /auth/google/verify:', error);
    googleLoginError.value =
      error.response?.data?.message || error.message || 'Error de comunicación con el servidor para Google Sign-In.';
  } finally {
    isLoadingGoogle.value = false;
  }
};

// --- onMounted para inicializar el botón de Google Sign-In ---
onMounted(() => {
  // Obtener el Client ID del entorno (asegúrate de que está en frontend/.env)
  const googleClientId = process.env.VUE_APP_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    console.error('ERROR CRÍTICO: VUE_APP_GOOGLE_CLIENT_ID no está definido en las variables de entorno del frontend.');
    googleLoginError.value = 'Error de configuración para Login con Google. Contacta al administrador.';
    return; // No intentar inicializar si falta el ID
  }

  // Verificar que el script de Google (cargado en index.html) está disponible
  if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
    console.log('Inicializando Google Identity Services (GSI)...');
    try {
      google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleSignIn, // La función que se ejecutará tras el login exitoso en Google
        // auto_select: true, // Podrías habilitar inicio automático si el usuario ya autorizó
        // ux_mode: "popup" // O "redirect"
      });

      // Renderizar el botón de Google en el div con id="googleSignInButton"
      google.accounts.id.renderButton(
        document.getElementById('googleSignInButton'), // ID del div en tu template
        {
          theme: 'outline', // outline, filled_blue, filled_black
          size: 'large', // large, medium, small
          type: 'standard', // standard, icon
          shape: 'rectangular', // rectangular, pill, circle, square
          text: 'signin_with', // signin_with, signup_with, continue_with, signin
          // width: "250", // Ancho opcional en píxeles
          locale: 'es', // Idioma del botón
        }
      );

      // Opcional: Mostrar el diálogo "One Tap" (aparece arriba de la página)
      // google.accounts.id.prompt();
    } catch (initError) {
      console.error('Error inicializando Google Sign-In:', initError);
      googleLoginError.value = 'No se pudo inicializar el Login con Google.';
    }
  } else {
    console.error('El script de Google Identity Services (accounts.google.com/gsi/client) no parece estar cargado.');
    googleLoginError.value = 'No se pudo cargar la opción de Login con Google.';
  }
});
</script>
