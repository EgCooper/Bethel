<script>
  import { createEventDispatcher } from "svelte";
  import axios from "axios";
  import Swal from "sweetalert2";

  const dispatch = createEventDispatcher();

  let email = "";
  let password = "";

  async function handleLogin() {
    // 1. VALIDACIÓN DE SEGURIDAD (Min 8 caracteres)
    if (password.length < 8) {
      return Swal.fire({
        icon: 'warning',
        title: 'Contraseña Insegura',
        text: 'La contraseña debe tener al menos 8 caracteres.',
        confirmButtonColor: '#003366'
      });
    }

    try {
      const res = await axios.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("usuario", JSON.stringify(res.data.usuario));

      Swal.fire({
        icon: "success",
        title: "¡Bienvenido!",
        text: `Hola, ${res.data.usuario.nombre}`,
        timer: 1500,
        showConfirmButton: false,
      });

      dispatch("loginExitoso");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error de acceso",
        text: error.response?.data?.mensaje || "Credenciales incorrectas",
      });
    }
  }

  function volver() {
    dispatch('irCatalogo');
  }
</script>

<div class="login-container">
  
  <button class="btn-volver" on:click={volver}>
    ← Volver al Catálogo
  </button>

  <div class="login-card">
    <div class="logo-area">
      <h1>BETHEL MOTORS</h1>
      <p>Acceso al Sistema</p>
    </div>
    
    <form on:submit|preventDefault={handleLogin}>
      <div class="input-group">
        <label>Correo Electrónico</label>
        <input 
          type="email" 
          bind:value={email} 
          placeholder="admin@bethel.com" 
          required 
        />
      </div>
      
      <div class="input-group">
        <label>Contraseña</label>
        <input 
          type="password" 
          bind:value={password} 
          placeholder="••••••••" 
          required 
        />
        <small class="hint">Mínimo 8 caracteres</small>
      </div>

      <button type="submit" class="btn-login">Ingresar</button>
    </form>
  </div>
</div>

<style>
  .login-container {
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #003366 0%, #001a33 100%); /* Fondo corporativo */
    position: relative; /* Para posicionar el botón volver */
  }

  /* ESTILO BOTÓN VOLVER */
  .btn-volver {
    position: absolute;
    top: 20px;
    left: 20px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    padding: 10px 20px;
    border-radius: 30px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.3s;
  }
  .btn-volver:hover {
    background: white;
    color: #003366;
  }

  .login-card {
    background: white;
    padding: 40px;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    width: 100%;
    max-width: 400px;
    text-align: center;
  }

  .logo-area h1 { margin: 0; color: #003366; font-size: 1.8rem; letter-spacing: 1px; }
  .logo-area p { color: #666; margin-top: 5px; margin-bottom: 30px; }

  .input-group { margin-bottom: 20px; text-align: left; }
  label { display: block; font-size: 0.9rem; color: #333; margin-bottom: 5px; font-weight: 600; }
  input { 
    width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; box-sizing: border-box; 
  }
  input:focus { border-color: #003366; outline: none; }
  
  .hint { color: #888; font-size: 0.8rem; margin-top: 4px; display: block; }

  .btn-login {
    width: 100%;
    padding: 12px;
    background: #003366;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.3s;
  }
  .btn-login:hover { background: #002244; }
</style>