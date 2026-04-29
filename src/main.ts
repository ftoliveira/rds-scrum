import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { vuetify } from './plugins/vuetify';
import App from './App.vue';
import './styles/app.scss';
import { setupPersistence } from './stores/persistence';

const app = createApp(App);
app.use(createPinia());
app.use(vuetify);
setupPersistence();
app.mount('#app');
