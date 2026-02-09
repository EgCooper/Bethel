<script>
  // @ts-nocheck
  import { onMount } from "svelte";
  import Swal from "sweetalert2";
  import axios from "axios";

  // Vistas Públicas
  import Login from "./pages/Login.svelte"; 
  import Catalogo from "./pages/Catalogo.svelte"; 
  import DetalleAuto from "./pages/DetalleAuto.svelte"; 
  
  // Vistas Privadas
  import Home from "./pages/Home.svelte";
  import Cotizador from "./pages/Cotizador.svelte";
  import Impresion from "./pages/Impresion.svelte";
  import Historial from "./pages/Historial.svelte";
  import Inventario from "./pages/Inventario.svelte";
  import Usuarios from "./pages/Usuarios.svelte"; 

  // --- ESTADO ---
  let usuario = null; 
  let mostrandoLogin = false; 
  let autoSeleccionado = null;
  let autoParaCotizar = null; 

  // --- CARGA INICIAL Y RUTAS ---
  onMount(async () => {
    // 1. Cargar Usuario
    const userGuardado = localStorage.getItem("usuario");
    if (userGuardado) {
      usuario = JSON.parse(userGuardado);
    }

    // 2. Manejar Navegación (Botón Atrás/Adelante)
    window.onpopstate = (event) => {
        if (event.state && event.state.id) {
             // Si el estado tiene ID, intentamos cargar ese auto
             cargarAutoPorId(event.state.id);
        } else {
             // Si no hay estado, volvemos al inicio (cerrar modal)
             autoSeleccionado = null;
             mostrandoLogin = false;
        }
    };

    // 3. Revisar URL Inicial (Ej: /detalles/123)
    const ruta = window.location.pathname;
    if (ruta.startsWith('/detalles/')) {
        const idAuto = ruta.split('/')[2];
        if (idAuto) {
            await cargarAutoPorId(idAuto);
        }
    }
  });

  async function cargarAutoPorId(id) {
    try {
        const res = await axios.get(`/api/vehiculos/${id}`);
        if (res.data) {
            autoSeleccionado = res.data;
        }
    } catch (error) {
        console.error("No se pudo cargar el auto compartido:", error);
        // Si falla, limpiamos la URL
        window.history.replaceState(null, '', '/');
    }
  }

  // --- LÓGICA DE SESIÓN ---
  function alLoguearse() {
    usuario = JSON.parse(localStorage.getItem("usuario"));
    paginaActual = 'inicio';
  }

  function cerrarSesion() {
    Swal.fire({
      title: 'Cerrar Sesión',
      text: '¿Desea salir del sistema?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ff0000', 
      cancelButtonColor: '#003366', 
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        usuario = null;
        mostrandoLogin = false; 
        autoSeleccionado = null;
        autoParaCotizar = null;
        paginaActual = 'inicio';
        window.history.pushState(null, '', '/'); // Limpiar URL al salir
      }
    });
  }

  // --- NAVEGACIÓN INTERNA (Panel Admin) ---
  let paginaActual = 'inicio'; 
  let cotizacionIdParaImprimir = null;
  let cotizacionIdParaEditar = null;
  let rutaDeRetorno = 'inicio'; 

  async function irA(destino) {
    if (paginaActual === 'cotizar' && destino !== 'cotizar' && destino !== 'impresion') {
      const result = await Swal.fire({
        title: 'Salir sin guardar',
        text: "Perderá los datos del formulario actual.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ff0000',
        cancelButtonColor: '#003366',
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Permanecer'
      });
      if (!result.isConfirmed) return; 
    }
    
    if (destino === 'cotizar') {
        cotizacionIdParaEditar = null;
        autoParaCotizar = null; 
    } 
    paginaActual = destino;
  }

  // --- MANEJADORES DE EVENTOS ---
  function alCotizarDesdeInventario(event) {
    autoParaCotizar = event.detail; 
    cotizacionIdParaEditar = null; 
    paginaActual = 'cotizar';     
  }

  function alGuardarCotizacion(event) {
    cotizacionIdParaImprimir = event.detail.id;
    rutaDeRetorno = cotizacionIdParaEditar ? 'historial' : 'inicio';
    paginaActual = 'impresion'; 
  }

  function alVerDesdeHistorial(event) {
    cotizacionIdParaImprimir = event.detail.id;
    rutaDeRetorno = 'historial';
    paginaActual = 'impresion';
  }

  function alEditarDesdeHistorial(event) {
    cotizacionIdParaEditar = event.detail.id; 
    paginaActual = 'cotizar'; 
  }

  // ✅ ABRIR DETALLE Y CAMBIAR URL
  function abrirDetalleAuto(event) {
    autoSeleccionado = event.detail;
    // Cambiamos la URL a /detalles/ID sin recargar
    window.history.pushState({id: autoSeleccionado._id}, '', `/detalles/${autoSeleccionado._id}`);
  }
  
  // ✅ CERRAR DETALLE Y LIMPIAR URL
  function volverAlCatalogo() {
    autoSeleccionado = null;
    // Volvemos a la raíz /
    window.history.pushState(null, '', '/');
  }

</script>
<svelte:head>
  <title>Bethel Motors</title>
</svelte:head>
<main>
  
  {#if !usuario}
    {#if mostrandoLogin}
      <Login 
        on:loginExitoso={alLoguearse} 
        on:irCatalogo={() => mostrandoLogin = false} 
      />
    
    {:else if autoSeleccionado}
       <DetalleAuto 
         auto={autoSeleccionado} 
         on:volver={volverAlCatalogo} 
         on:irLogin={() => mostrandoLogin = true}
       />
       
    {:else}
      <Catalogo 
        on:irLogin={() => mostrandoLogin = true} 
        on:verDetalle={abrirDetalleAuto} 
      />
    {/if}

  {:else}
    <nav class="navbar">
      <button class="brand-btn" on:click={() => irA('inicio')}>
        BETHEL MOTORS
      </button>
      
      <div class="links">
        <span class="usuario-badge">
          👤 {usuario.nombre}
        </span>

        <button class="nav-btn" on:click={() => irA('inicio')}>Inicio</button>
        <button class="nav-btn" on:click={() => irA('inventario')}>Inventario</button>
        
        {#if usuario.rol === 'admin'}
          <button class="nav-btn" on:click={() => irA('usuarios')}>Equipo</button>
        {/if}

        <button class="nav-btn btn-salir" on:click={cerrarSesion}>Salir</button>
      </div>
    </nav>

    <div class="content">
      {#if paginaActual === 'inicio'}
        <Home on:navegar={(e) => irA(e.detail)} />
      
      {:else if paginaActual === 'cotizar'}
        <Cotizador 
          idEdicion={cotizacionIdParaEditar}
          autoPreseleccionado={autoParaCotizar} 
          on:guardado={alGuardarCotizacion} 
        />
      
      {:else if paginaActual === 'historial'}
        <Historial 
          on:ver={alVerDesdeHistorial} 
          on:editar={alEditarDesdeHistorial} 
        />
      
      {:else if paginaActual === 'usuarios'}
        <Usuarios />
      
      {:else if paginaActual === 'inventario'}
        <Inventario on:cotizar={alCotizarDesdeInventario} />
      
      {:else if paginaActual === 'impresion'}
        <Impresion id={cotizacionIdParaImprimir} on:volver={() => irA(rutaDeRetorno)} />
      {/if}
    </div>

  {/if}
</main>

<style>
  :global(body) { margin: 0; font-family: 'Segoe UI', sans-serif; background: #f4f4f9; }
  
  .navbar { 
    background: #003366; padding: 0.8rem 2rem; color: white; 
    display: flex; justify-content: space-between; align-items: center; 
    box-shadow: 0 2px 10px rgba(0,0,0,0.2); 
    position: sticky; top: 0; z-index: 100;
  }
  
  .brand-btn { 
    background: none; border: none; color: white; font-weight: 800; letter-spacing: 1px;
    font-size: 1.3rem; cursor: pointer; padding: 0; display: flex; align-items: center; gap: 10px;
  }
  
  .links { display: flex; align-items: center; gap: 15px; }

  .usuario-badge { 
    font-size: 0.9rem; background: rgba(255,255,255,0.15); 
    padding: 6px 15px; border-radius: 20px; 
    border: 1px solid rgba(255,255,255,0.2); 
    white-space: nowrap;
  }

  .nav-btn { 
    background: transparent; border: none; color: white; font-size: 1rem; 
    cursor: pointer; padding: 8px 15px; border-radius: 6px; 
    transition: all 0.2s; font-weight: 500;
  }
  .nav-btn:hover { background: rgba(255,255,255,0.1); }
  
  .btn-salir { 
    background: #cc0000; color: white; font-weight: bold; 
  }
  .btn-salir:hover { background: #ff3333; }

  .content { padding: 30px; max-width: 1200px; margin: 0 auto; }
  
  @media print { 
    .navbar { display: none !important; } 
    .content { padding: 0; margin: 0; } 
    :global(body) { background: white; } 
  }
  
  @media (max-width: 768px) {
    .navbar { padding: 10px; flex-direction: column; gap: 10px; }
    .links { width: 100%; justify-content: center; flex-wrap: wrap; }
    .usuario-badge { display: none; }
  }
</style>