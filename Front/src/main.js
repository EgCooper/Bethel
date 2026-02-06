import { mount } from 'svelte';
import App from './App.svelte';
import axios from 'axios';

axios.defaults.baseURL = 'https://bethel-backend-hbst.onrender.com';


axios.interceptors.request.use((config) => {
  // import.meta.env.DEV es true cuando corres "npm run dev" en tu PC
  if (import.meta.env.DEV) {
    axios.defaults.baseURL = 'http://localhost:3000'; // Tu PC
    console.log("Modo: DESARROLLO (Localhost)");
  } else {
    axios.defaults.baseURL = 'https://bethel-backend-hbst.onrender.com'; // La Nube
    console.log("Modo: PRODUCCIÓN (Render)");
  }
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});
// -----------------------------------

const app = mount(App, {
  target: document.body,
});

export default app;