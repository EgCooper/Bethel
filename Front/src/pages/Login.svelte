<script>
  import { createEventDispatcher } from "svelte";
  import axios from "axios";
  import Swal from "sweetalert2";

  const dispatch = createEventDispatcher();

  let email = "";
  let password = "";
  let cargando = false;
  let mostrarPassword = false;

  async function handleLogin() {
    // 1. Validaciones previas
    if (!email || !password) {
      return Swal.fire({ 
        title: 'Campos vacíos', 
        text: 'Por favor completa todos los campos.', 
        icon: 'warning', 
        confirmButtonColor: '#cc0000' // Rojo (Alerta)
      });
    }

    if (password.length < 6) {
      return Swal.fire({ 
        title: 'Contraseña muy corta', 
        text: 'La contraseña debe tener al menos 6 caracteres.', 
        icon: 'warning', 
        confirmButtonColor: '#cc0000' // Rojo (Alerta)
      });
    }

    cargando = true; 

    try {
      const res = await axios.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("usuario", JSON.stringify(res.data.usuario));

      // Éxito -> Azul Corporativo
      Swal.fire({
        icon: "success",
        title: "¡Bienvenido!",
        text: `Hola, ${res.data.usuario.nombre}`,
        timer: 1500,
        showConfirmButton: false,
        confirmButtonColor: '#003366' 
      });

      dispatch("loginExitoso");

    } catch (error) {
      console.error(error);
      // Error -> Rojo Corporativo
      Swal.fire({
        icon: "error",
        title: "Acceso Denegado",
        text: error.response?.data?.mensaje || "Usuario o contraseña incorrectos.",
        confirmButtonColor: '#cc0000'
      });
    } finally {
      cargando = false; 
    }
  }

  function togglePasswordVisibility() {
    mostrarPassword = !mostrarPassword;
  }

  function volver() {
    if (cargando) return;
    dispatch('irCatalogo');
  }
</script>

<div class="login-scroll-wrapper">
  <div class="login-container">
    
    <div class="nav-top">
      <button class="btn-pill btn-ghost-light" on:click={volver}>
        ← Volver al Catálogo
      </button>
    </div>

    <div class="login-card fade-up">
      <div class="logo-area">
        <div class="icon-lock">🔒</div>
        <h1>BETHEL MOTORS</h1>
        <p>Portal de Asesores</p>
      </div>
      
      <form on:submit|preventDefault={handleLogin}>
        
        <div class="input-group">
          <label for="email">Correo Electrónico</label>
          <div class="input-wrapper">
            <span class="input-icon">✉️</span>
            <input 
              id="email"
              type="email" 
              bind:value={email} 
              placeholder="ejemplo@bethel.com" 
              required 
              autocomplete="email"
              disabled={cargando}
            />
          </div>
        </div>
        
        <div class="input-group">
          <label for="password">Contraseña</label>
          <div class="input-wrapper">
            <span class="input-icon">🔑</span>
            <input 
              id="password"
              type={mostrarPassword ? "text" : "password"} 
              bind:value={password} 
              placeholder="Ingresa tu clave" 
              required 
              autocomplete="current-password"
              disabled={cargando}
            />
            <button type="button" class="btn-eye" on:click={togglePasswordVisibility} tabindex="-1">
              {mostrarPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <div class="actions">
          <button type="submit" class="btn-pill btn-solid-blue full-width" disabled={cargando}>
            {#if cargando}
              <span class="spinner"></span> Verificando...
            {:else}
              Ingresar al Sistema
            {/if}
          </button>
        </div>

        <div class="help-text">
          <p>¿Problemas? <a href="#" on:click|preventDefault={() => Swal.fire({ title: 'Soporte', text: 'Contacta al administrador: 68593324', icon: 'info', confirmButtonColor: '#003366'})}>Ayuda</a></p>
        </div>

      </form>
    </div>

    <div class="brand-footer">
      © 2026 Bethel Motors System
    </div>
  </div>
</div>

<style>
  /* --- WRAPPER PARA SCROLL EN MÓVIL --- */
  .login-scroll-wrapper {
    height: 100vh;
    height: 100dvh; /* Soporte mejorado para móviles */
    overflow-y: auto; /* Permite scroll si la pantalla es muy pequeña */
    background: linear-gradient(135deg, #003366 0%, #001a33 100%);
  }

  .login-container {
    min-height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 20px;
    font-family: 'Segoe UI', sans-serif;
    position: relative;
    box-sizing: border-box;
  }

  .nav-top {
    position: absolute;
    top: 20px;
    left: 20px;
    z-index: 10;
  }

  /* --- TARJETA LOGIN --- */
  .login-card {
    background: white;
    padding: 40px;
    border-radius: 16px; 
    box-shadow: 0 15px 35px rgba(0,0,0,0.3);
    width: 100%;
    max-width: 380px;
    text-align: center;
    position: relative;
    z-index: 5;
    margin: 20px 0; /* Espacio vertical en móviles */
  }

  /* Animación */
  .fade-up { animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* --- HEADER DEL CARD --- */
  .logo-area { margin-bottom: 30px; }
  .icon-lock {
    font-size: 2.5rem; margin-bottom: 10px; display: inline-block;
    background: #f0f4f8; width: 70px; height: 70px; line-height: 70px;
    border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.05);
  }
  .logo-area h1 { margin: 0; color: #003366; font-size: 1.6rem; letter-spacing: 1px; font-weight: 800; }
  .logo-area p { color: #888; margin-top: 5px; font-size: 0.9rem; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; }

  /* --- INPUTS --- */
  .input-group { margin-bottom: 20px; text-align: left; }
  label { display: block; font-size: 0.85rem; color: #555; margin-bottom: 6px; font-weight: 600; }
  
  .input-wrapper { position: relative; display: flex; align-items: center; }
  
  .input-icon {
    position: absolute; left: 12px; font-size: 1.1rem; pointer-events: none; 
  }

  input { 
    width: 100%;
    padding: 12px 12px 12px 40px; 
    border: 1px solid #ddd;
    border-radius: 8px; 
    font-size: 16px; /* Importante: 16px evita zoom automático en iPhone */
    background: #f9fafb;
    transition: all 0.2s;
    box-sizing: border-box;
  }
  
  input:focus {
    border-color: #003366;
    background: white;
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 51, 102, 0.1);
  }

  /* Botón Ojo */
  .btn-eye {
    position: absolute; right: 10px; background: none; border: none;
    cursor: pointer; font-size: 1.1rem; opacity: 0.6; padding: 5px;
  }
  .btn-eye:hover { opacity: 1; }

  /* --- BOTONES PILL --- */
  .btn-pill {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 12px 24px; border-radius: 50px; 
    font-family: 'Segoe UI', sans-serif; font-size: 0.95rem; font-weight: 700;
    cursor: pointer; text-decoration: none; transition: all 0.2s ease-in-out;
    border: 1px solid transparent; gap: 8px;
  }

  .btn-solid-blue {
    background: #003366; color: white; border-color: #003366;
    box-shadow: 0 4px 15px rgba(0, 51, 102, 0.3);
  }
  .btn-solid-blue:hover:not(:disabled) {
    background: #002244; transform: translateY(-2px);
  }
  .btn-solid-blue:active:not(:disabled) { transform: translateY(0); }
  .btn-solid-blue:disabled { background: #6c757d; border-color: #6c757d; cursor: not-allowed; opacity: 0.7; }

  .btn-ghost-light {
    background: rgba(255, 255, 255, 0.1); color: white; border-color: rgba(255,255,255,0.3);
  }
  .btn-ghost-light:hover { background: white; color: #003366; }

  .full-width { width: 100%; margin-top: 10px; }

  /* --- SPINNER --- */
  .spinner {
    width: 16px; height: 16px; border: 2px solid #ffffff; border-top-color: transparent; border-radius: 50%;
    animation: spin 0.8s linear infinite; display: inline-block;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .help-text { margin-top: 20px; font-size: 0.85rem; color: #666; }
  .help-text a { color: #003366; text-decoration: none; font-weight: bold; }

  .brand-footer {
    color: rgba(255,255,255,0.4); font-size: 0.75rem; margin-top: 20px;
  }

  /* --- RESPONSIVE MOBILE --- */
  @media (max-width: 600px) {
    .login-container {
      justify-content: flex-start; /* Alinea arriba para permitir scroll */
      padding-top: 20px;
    }

    /* El botón volver deja de ser absoluto para no tapar contenido */
    .nav-top {
      position: static; 
      width: 100%;
      margin-bottom: 20px;
      text-align: center;
    }
    
    .btn-pill { width: 100%; } /* Botones ancho completo en móvil */

    .login-card {
      padding: 30px 20px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    }
  }
</style>