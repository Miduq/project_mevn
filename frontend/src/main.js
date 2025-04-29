// main.js
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import BootstrapVue3 from 'bootstrap-vue-3';
import VueFileAgentNext from '@boindil/vue-file-agent-next';

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue-3/dist/bootstrap-vue-3.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@boindil/vue-file-agent-next/dist/vue-file-agent-next.css';

const app = createApp(App);

app.use(router);
app.use(BootstrapVue3);
app.use(VueFileAgentNext);

app.config.errorHandler = (err, instance, info) => {
  console.error('--- ERROR GLOBAL VUE CAPTURADO ---');
  console.error('Error:', err);
  console.error('Instancia del Componente:', instance);
  console.error('Información Adicional:', info);
  console.error('--- FIN ERROR GLOBAL ---');

  if (router.currentRoute.value.name !== 'ErrorPage') {
    console.log('Redirigiendo a ErrorPage...');
    router.push({ name: 'ErrorPage' });
  } else {
    console.warn('Error ocurrido DENTRO de la ErrorPage. No se redirige para evitar bucle.');
  }
};

app.mount('#app');
