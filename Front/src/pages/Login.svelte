<script>
  import { createEventDispatcher } from "svelte";
  import axios from "axios";
  import Swal from "sweetalert2";

  const dispatch = createEventDispatcher();

  let username = "";
  let password = "";

  async function handleLogin() {
    try {

      const res = await axios.post("/auth/login", {
        username,
        password
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("usuario", JSON.stringify(res.data.usuario));

      // Emitir evento al padre (App.svelte)
      dispatch("loginExitoso");

    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.response?.data?.error || "Credenciales incorrectas",
        icon: "error",
        confirmButtonColor: "#003366"
      });
    }
  }

  function irCatalogo() {
    dispatch('irCatalogo'); 
  }
</script>

<div class="login-container">
  <div class="login-card">
    <h1 class="titulo">BETHEL SYSTEM</h1>
    <p class="subtitulo">Acceso Administrativo</p>
    
    <form on:submit|preventDefault={handleLogin}>
      <div class="input-group">
        <label>Usuario</label>
        <input type="text" bind:value={username} placeholder="Ingresa tu usuario" required />
      </div>
      
      <div class="input-group">
        <label>Contraseña</label>
        <input type="password" bind:value={password} placeholder="••••••" required />
      </div>

      <button type="submit" class="btn-login">Ingresar</button>
    </form>

    <div class="divider"></div>

    <button class="btn-catalogo" on:click={irCatalogo}>
      Regresar al Catálogo
    </button>

  </div>
</div>

<style>
  .login-container {
    height: 100vh; display: flex; justify-content: center; align-items: center;
    background: linear-gradient(135deg, #003366 0%, #001a33 100%);
  }
  .login-card {
    background: white; padding: 40px; border-radius: 10px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2); width: 100%; max-width: 400px; text-align: center;
  }
  .titulo { color: #003366; margin: 0; font-size: 1.8rem; }
  .subtitulo { color: #666; margin-bottom: 30px; font-size: 0.9rem; }
  
  .input-group { margin-bottom: 20px; text-align: left; }
  .input-group label { display: block; margin-bottom: 8px; font-weight: bold; color: #444; }
  .input-group input {
    width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 5px; box-sizing: border-box; font-size: 1rem;
  }
  
  .btn-login {
    width: 100%; padding: 12px; background: #003366; color: white; border: none;
    border-radius: 5px; font-size: 1rem; font-weight: bold; cursor: pointer; transition: background 0.3s;
  }
  .btn-login:hover { background: #002244; }

  .divider { height: 1px; background: #eee; margin: 25px 0; }

  .btn-catalogo {
    width: 100%; padding: 10px; background: white; color: #003366; border: 2px solid #003366;
    border-radius: 5px; font-weight: bold; cursor: pointer;
  }
  .btn-catalogo:hover { background: #f0f8ff; }
</style>