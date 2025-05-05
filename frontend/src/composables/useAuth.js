// frontend/src/composables/useAuth.js

import { useRouter } from 'vue-router';
import AuthService from '@/services/auth/AuthService'; // Importa el servicio de autenticación

// Este composable ofrecerá funciones relacionadas con la autenticación
export function useAuth() {
  const router = useRouter();

  // 'redirectTo' SOLO se define AQUÍ como parámetro de esta función interna
  const logoutAndRedirect = (redirectTo = { name: 'LoginPage' }) => {
    // Aquí DENTRO sí podemos usar 'redirectTo'
    console.log(`useAuth composable: logoutAndRedirect ejecutado! Redirigiendo a ${redirectTo.name || redirectTo}`);

    console.log(`... Redirigiendo a ${redirectTo.name || redirectTo}`); // OK
    AuthService.logout();
    router.push(redirectTo); // OK
  };

  return {
    logoutAndRedirect,
  };
}
