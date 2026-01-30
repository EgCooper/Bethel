import App from './App.svelte';
import axios from 'axios';

axios.defaults.baseURL = 'https://bethel-backend-hbst.onrender.com/'; 

const app = new App({
	target: document.body
});

export default app;