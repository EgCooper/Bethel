import { mount } from 'svelte';
import App from './App.svelte';
import axios from 'axios';

axios.defaults.baseURL = 'https://bethel-backend-hbst.onrender.com';


axios.interceptors.request.use((config) => {
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