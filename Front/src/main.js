import { mount } from 'svelte';
import App from './App.svelte';
import axios from 'axios';

// Configura tu URL de Backend (Render)
axios.defaults.baseURL = 'https://bethel-backend-hbst.onrender.com'; 

// --- ESTA ES LA PARTE CLAVE PARA SVELTE 5 ---
// En lugar de 'new App(...)', usamos 'mount(...)':
const app = mount(App, {
  target: document.body,
});

export default app;