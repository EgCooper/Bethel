<script>
  // @ts-nocheck
  import { onMount } from "svelte";
  import Swal from "sweetalert2";
  import axios from "axios";

  // --- CONFIGURACIÓN DE AXIOS ---
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      axios.defaults.baseURL = "http://localhost:3000"; 
  } else {
      axios.defaults.baseURL = "https://bethel-backend-hbst.onrender.com/"; 
  }

  // Vistas Públicas
  import Login from "./pages/Login.svelte"; 
  import Catalogo from "./pages/Catalogo.svelte"; 
  import DetalleAuto from "./pages/DetalleAuto.svelte"; 
  import Contacto from "./pages/Contacto.svelte"; 
  
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
  let mostrandoContacto = false; 
  let autoSeleccionado = null;
  let autoParaCotizar = null; 

  let paginaActual = 'inicio'; 
  let cotizacionIdParaImprimir = null;
  let cotizacionIdParaEditar = null;
  let rutaDeRetorno = 'inicio';

  onMount(async () => {
    const userGuardado = localStorage.getItem("usuario");
    if (userGuardado) usuario = JSON.parse(userGuardado);

    window.onpopstate = (event) => {
        if (event.state && event.state.id) {
             cargarAutoPorId(event.state.id);
        } else {
             autoSeleccionado = null;
             mostrandoLogin = false;
             mostrandoContacto = false;
        }
    };

    const ruta = window.location.pathname;
    if (ruta.startsWith('/detalles/')) {
        const idAuto = ruta.split('/')[2];
        if (idAuto) await cargarAutoPorId(idAuto);
    }
  });

  async function cargarAutoPorId(id) {
    try {
        const res = await axios.get(`/api/vehiculos/${id}`);
        if (res.data) autoSeleccionado = res.data;
    } catch (error) {
        window.history.replaceState(null, '', '/');
    }
  }

  // --- NAVEGACIÓN PÚBLICA ---
  function irAContacto() {
    mostrandoContacto = true;
    window.scrollTo(0, 0);
  }

  function volverAlCatalogo() {
    autoSeleccionado = null;
    mostrandoContacto = false; 
    mostrandoLogin = false;
    window.history.pushState(null, '', '/');
  }

  function abrirDetalleAuto(event) {
    autoSeleccionado = event.detail;
    window.history.pushState({id: autoSeleccionado._id}, '', `/detalles/${autoSeleccionado._id}`);
  }

  // --- LÓGICA DE SESIÓN ---
  function alLoguearse() {
    usuario = JSON.parse(localStorage.getItem("usuario"));
    mostrandoLogin = false;
    paginaActual = 'inicio';
  }

  function cerrarSesion() {
    Swal.fire({
      title: 'Cerrar Sesión',
      text: '¿Desea salir del sistema?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#cc0000', 
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
        paginaActual = 'inicio';
        window.history.pushState(null, '', '/'); 
      }
    });
  }

  // --- NAVEGACIÓN INTERNA ---
  async function irA(destino) {
    if (paginaActual === 'cotizar' && destino !== 'cotizar' && destino !== 'impresion') {
      const result = await Swal.fire({
        title: '¿Salir sin guardar?',
        text: "Perderá los datos no guardados.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#cc0000',
        cancelButtonColor: '#003366',
        confirmButtonText: 'Sí, salir'
      });
      if (!result.isConfirmed) return; 
    }
    
    if (destino === 'cotizar' && (paginaActual !== 'inventario' && paginaActual !== 'historial')) {
            cotizacionIdParaEditar = null;
            autoParaCotizar = null;
    } 
    paginaActual = destino;
  }

  function alCotizarDesdeInventario(event) {
    autoParaCotizar = event.detail.auto; 
    cotizacionIdParaEditar = null; 
    rutaDeRetorno = 'inventario'; 
    paginaActual = 'cotizar';     
  }

  function alGuardarCotizacion(event) {
    if (event.detail && event.detail.cancelado) {
        irA(rutaDeRetorno);
        return;
    }
    cotizacionIdParaImprimir = event.detail.id;
    rutaDeRetorno = cotizacionIdParaEditar ? 'historial' : 'inicio';
    paginaActual = 'impresion'; 
  }

</script>

<main>
  {#if autoSeleccionado}
      <DetalleAuto 
        auto={autoSeleccionado} 
        on:volver={volverAlCatalogo} 
        on:irLogin={() => {
            autoSeleccionado = null; // Cierra el detalle para permitir ver el login
            if (usuario) {
                window.history.pushState(null, '', '/');
            } else {
                mostrandoLogin = true;
            }
        }}
      />

  {:else if !usuario}
    
    {#if mostrandoLogin}
      <Login 
        on:loginExitoso={alLoguearse} 
        on:irCatalogo={() => mostrandoLogin = false} 
      />
    {:else if mostrandoContacto} 
       <Contacto on:volver={volverAlCatalogo} />
    {:else}
      <Catalogo 
        on:irLogin={() => mostrandoLogin = true} 
        on:verDetalle={abrirDetalleAuto} 
        on:irContacto={irAContacto} 
      />
    {/if}

  {:else}
    <nav class="navbar">
      <button class="brand-btn" on:click={() => irA('inicio')}>
        BETHEL MOTORS
      </button>
      
      <div class="nav-links">
        <button class="nav-pill {paginaActual === 'inicio' ? 'active' : ''}" on:click={() => irA('inicio')}>Inicio</button>
        <button class="nav-pill {paginaActual === 'inventario' ? 'active' : ''}" on:click={() => irA('inventario')}>Inventario</button>
        <button class="nav-pill {paginaActual === 'historial' ? 'active' : ''}" on:click={() => irA('historial')}>Historial</button>
        
        {#if usuario.rol === 'admin'}
          <button class="nav-pill {paginaActual === 'usuarios' ? 'active' : ''}" on:click={() => irA('usuarios')}>Equipo</button>
        {/if}

        <button class="nav-pill btn-salir" on:click={cerrarSesion}>Salir</button>
      </div>
    </nav>

    <div class="admin-content">
      {#if paginaActual === 'inicio'}
        <Home on:navegar={(e) => irA(e.detail)} />
      {:else if paginaActual === 'cotizar'}
        <Cotizador 
          idEdicion={cotizacionIdParaEditar}
          autoPreseleccionado={autoParaCotizar} 
          on:guardado={alGuardarCotizacion} 
          on:volver={() => irA(rutaDeRetorno)} 
        />
      {:else if paginaActual === 'historial'}
        <Historial 
          on:ver={(e) => { cotizacionIdParaImprimir = e.detail.id; rutaDeRetorno = 'historial'; paginaActual = 'impresion'; }} 
          on:editar={(e) => { cotizacionIdParaEditar = e.detail.id; rutaDeRetorno = 'historial'; paginaActual = 'cotizar'; }} 
          on:volver={() => irA('inicio')}
        />
      {:else if paginaActual === 'usuarios'}
        <Usuarios />
      {:else if paginaActual === 'inventario'}
        <Inventario on:cotizar={alCotizarDesdeInventario} on:volver={() => irA('inicio')} />
      {:else if paginaActual === 'impresion'}
        <Impresion id={cotizacionIdParaImprimir} on:volver={() => irA(rutaDeRetorno)} />
      {/if}
    </div>
  {/if}
</main>

<style>
  :global(body) { margin: 0; font-family: 'Segoe UI', sans-serif; background: #f3f5f7; }
  
  .navbar { 
    background: #003366; padding: 10px 20px; color: white; 
    display: flex; justify-content: space-between; align-items: center; 
    box-shadow: 0 4px 12px rgba(0,0,0,0.15); position: sticky; top: 0; z-index: 100;
  }
  
  .brand-btn { 
    background: none; border: none; color: white; font-weight: 900; 
    font-size: 1.2rem; cursor: pointer; letter-spacing: 1px;
  }
  
  .nav-links { display: flex; gap: 8px; align-items: center; }

  .nav-pill {
    background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
    color: white; padding: 6px 16px; border-radius: 50px; cursor: pointer;
    font-size: 0.85rem; font-weight: 600; transition: 0.2s;
  }
  .nav-pill:hover { background: rgba(255,255,255,0.2); }
  .nav-pill.active { background: white; color: #003366; border-color: white; }
  
  .btn-salir { background: #cc0000; border-color: #cc0000; }
  .btn-salir:hover { background: #ff0000; border-color: #ff0000; }

  .admin-content { padding: 20px; max-width: 1300px; margin: 0 auto; }
  
  @media (max-width: 768px) {
    .navbar { flex-direction: column; gap: 10px; padding: 15px; }
    .nav-links { width: 100%; justify-content: center; flex-wrap: wrap; gap: 5px; }
    .nav-pill { padding: 5px 12px; font-size: 0.75rem; }
    .admin-content { padding: 10px; }
  }
</style>