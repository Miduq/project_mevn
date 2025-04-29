// frontend/src/composables/useFetchData.js
import { ref } from 'vue';

// Composable reutilizable para manejar la carga de datos asíncrona.

export function useFetchData(fetcher, options = {}) {
  // Opciones con valores por defecto
  const { initialData = null, dataKey = null } = options;

  // Estado reactivo usando ref()
  const data = ref(initialData);
  const isLoading = ref(false);
  const error = ref(null); // Guarda el mensaje de error

  // Función para ejecutar la llamada API
  const execute = async (...args) => {
    isLoading.value = true; // Poner estado de carga
    error.value = null; // Limpiar errores previos
    try {
      // Llama a la función fetcher pasada como argumento
      const response = await fetcher(...args);

      // Asumimos una estructura de respuesta como
      if (response && response.success) {
        if (dataKey && response[dataKey] !== undefined) {
          // Si se especificó dataKey y existe en la respuesta, lo asignamos
          data.value = response[dataKey];
        } else if (dataKey === null) {
          // Si no se especificó dataKey la respuesta es el dato,
          console.warn(`useFetchData: Respuesta exitosa.`);
          data.value = initialData;
        } else {
          // Si se especificó dataKey pero no vino en la respuesta exitosa
          console.error(`useFetchData: Clave '${dataKey}' no encontrada en respuesta exitosa.`);
          error.value = `Dato esperado (${dataKey}) no encontrado en la respuesta.`;
          data.value = initialData; // Resetear datos
        }
      } else {
        // Si la respuesta no fue exitosa
        error.value = response?.message || 'La operación falló (respuesta no exitosa desde API).';
        data.value = initialData; // Resetear datos
      }
    } catch (err) {
      // Si ocurre un error en la llamada
      console.error('useFetchData: Error capturado:', err);
      error.value = err.response?.data?.message || err.message || 'Ocurrió un error desconocido al obtener los datos.';
      data.value = initialData;
    } finally {
      isLoading.value = false;
    }
  };

  // El composable devuelve el estado reactivo y la función para ejecutar la carga
  return { data, isLoading, error, execute };
}
