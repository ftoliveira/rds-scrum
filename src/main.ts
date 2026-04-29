import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { vuetify } from './plugins/vuetify';
import App from './App.vue';
import './styles/app.scss';
import { setupPersistence } from './stores/persistence';
import { usePwaStore } from './stores/pwa';

const app = createApp(App);
app.use(createPinia());
app.use(vuetify);
setupPersistence();
usePwaStore().register();
app.mount('#app');
