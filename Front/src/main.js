import App from './App.svelte';
import axios from 'axios';

axios.defaults.baseURL = 'https://bettel-backend.onrender.com'; 

const app = new App({
	target: document.body
});

export default app;