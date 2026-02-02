<script>
  import { onMount, createEventDispatcher } from "svelte";
  import axios from "axios";

  const dispatch = createEventDispatcher();

  let vehiculos = [];
  let vehiculosFiltrados = [];
  let cargando = true;
  let filtroActual = 'todos'; // 'todos', 'bolivia', 'usa', 'chile'
  let busqueda = "";

  onMount(cargarCatalogo);

  async function cargarCatalogo() {
    try {
      const res = await axios.get("/api/vehiculos");
      vehiculos = res.data;
      filtrarVehiculos();
      cargando = false;
    } catch (error) {
      console.error("Error cargando catálogo:", error);
      cargando = false;
    }
  }

  function cambiarFiltro(nuevoFiltro) {
    filtroActual = nuevoFiltro;
    filtrarVehiculos();
  }

  function filtrarVehiculos() {
    let resultado = vehiculos;

    // 1. Filtro por Ubicación
    if (filtroActual === 'bolivia') {
      resultado = resultado.filter(v => v.ubicacion.includes('Bolivia'));
    } else if (filtroActual === 'usa') {
      resultado = resultado.filter(v => v.ubicacion.includes('USA'));
    } else if (filtroActual === 'chile') {
      resultado = resultado.filter(v => v.ubicacion.includes('Iquique') || v.ubicacion.includes('Chile'));
    }

    // 2. Filtro por Buscador (Marca, Modelo o Año)
    if (busqueda.trim() !== "") {
      const texto = busqueda.toLowerCase();
      resultado = resultado.filter(v => 
        v.marca.toLowerCase().includes(texto) || 
        v.modelo.toLowerCase().includes(texto) ||
        v.año.toString().includes(texto) ||
        v.vin.toLowerCase().includes(texto)
      );
    }

    vehiculosFiltrados = resultado;
  }

  function verDetalle(auto) {
    dispatch('verDetalle', { ...auto });
  }

  function irLogin() {
    dispatch('irLogin');
  }
</script>

<div class="catalogo-wrapper">
  
  <header class="hero">
    <div class="hero-content">
      <h1>BETHEL MOTORS</h1>
      <p>Tu mejor opción en importación de vehículos</p>
      <div class="search-bar">
        <input 
          type="text" 
          placeholder="Buscar por marca, modelo o año..." 
          bind:value={busqueda}
          on:input={filtrarVehiculos}
        />
        <button class="btn-search">🔍</button>
      </div>
    </div>
    <button class="btn-acceso" on:click={irLogin}>Soy Asesor</button>
  </header>

  <nav class="filtros">
    <button class="{filtroActual === 'todos' ? 'activo' : ''}" on:click={() => cambiarFiltro('todos')}>
      Todo el Stock
    </button>
    <button class="{filtroActual === 'bolivia' ? 'activo' : ''}" on:click={() => cambiarFiltro('bolivia')}>
      🇧🇴 En Bolivia
    </button>
    <button class="{filtroActual === 'chile' ? 'activo' : ''}" on:click={() => cambiarFiltro('chile')}>
      🇨🇱 En Chile
    </button>
    <button class="{filtroActual === 'usa' ? 'activo' : ''}" on:click={() => cambiarFiltro('usa')}>
      🇺🇸 Subasta USA
    </button>
  </nav>

  <div class="grid-autos">
    {#if cargando}
      <p class="mensaje">Cargando inventario...</p>
    {:else if vehiculosFiltrados.length === 0}
      <div class="mensaje-vacio">
        <p>No se encontraron vehículos con estos criterios.</p>
      </div>
    {:else}
      {#each vehiculosFiltrados as auto}
        <div class="card" on:click={() => verDetalle(auto)}>
          <div class="img-wrapper">
            {#if auto.imagen_url}
              <img src={auto.imagen_url} alt={auto.modelo} loading="lazy">
            {:else}
              <div class="no-img">Sin Foto</div>
            {/if}
            
            <span class="badge 
              {auto.ubicacion.includes('Bolivia') ? 'bo' : 
               auto.ubicacion.includes('Iquique') ? 'cl' : 'usa'}">
              {auto.ubicacion}
            </span>
          </div>
          
          <div class="card-info">
            <h3>{auto.marca} {auto.modelo}</h3>
            <p class="anio">{auto.año}</p>
            <div class="detalles">
              <span>{auto.transmision}</span> • <span>{auto.tipo_combustible}</span>
            </div>
            <p class="precio">$ {auto.precio_usd.toLocaleString('en-US')}</p>
            <button class="btn-ver">Ver Detalles</button>
          </div>
        </div>
      {/each}
    {/if}
  </div>

  <footer class="footer">
    <p>© 2026 BETHEL MOTORS | Cochabamba - Bolivia</p>
  </footer>

</div>

<style>
  .catalogo-wrapper { background: #f4f4f9; min-height: 100vh; font-family: 'Segoe UI', sans-serif; }

  /* HERO HEADER */
  .hero { 
    background: linear-gradient(135deg, #003366 0%, #001a33 100%); 
    color: white; padding: 40px 20px; text-align: center; position: relative;
  }
  .hero h1 { margin: 0; font-size: 2.5rem; letter-spacing: 2px; }
  .hero p { margin: 10px 0 20px 0; color: #ccc; }
  
  .btn-acceso { position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 5px 15px; border-radius: 20px; cursor: pointer; font-size: 0.8rem; }
  .btn-acceso:hover { background: white; color: #003366; }

  /* BUSCADOR */
  .search-bar { display: flex; max-width: 500px; margin: 0 auto; background: white; border-radius: 30px; padding: 5px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
  .search-bar input { flex: 1; border: none; padding: 10px 20px; border-radius: 30px; outline: none; font-size: 1rem; }
  .btn-search { background: #cc0000; color: white; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; }

  /* FILTROS NAV */
  .filtros { display: flex; justify-content: center; gap: 10px; margin: 20px 0; flex-wrap: wrap; padding: 0 10px; }
  .filtros button { 
    background: white; border: 1px solid #ddd; padding: 8px 16px; 
    border-radius: 20px; cursor: pointer; font-weight: 500; color: #555; transition: 0.2s; 
  }
  .filtros button.activo { background: #003366; color: white; border-color: #003366; }
  .filtros button:hover:not(.activo) { background: #eee; }

  /* GRID DE AUTOS */
  .grid-autos { 
    display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); 
    gap: 25px; max-width: 1200px; margin: 0 auto; padding: 20px; 
  }
  
  .card { background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 3px 10px rgba(0,0,0,0.08); transition: transform 0.2s; cursor: pointer; }
  .card:hover { transform: translateY(-5px); box-shadow: 0 8px 20px rgba(0,0,0,0.15); }

  .img-wrapper { height: 180px; background: #eee; position: relative; }
  .img-wrapper img { width: 100%; height: 100%; object-fit: cover; }
  .no-img { height: 100%; display: flex; align-items: center; justify-content: center; color: #888; font-weight: bold; }

  /* BADGES */
  .badge { position: absolute; top: 10px; right: 10px; padding: 5px 10px; border-radius: 4px; color: white; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; }
  .badge.bo { background: #28a745; }
  .badge.usa { background: #003366; }
  .badge.cl { background: #ff9900; } /* Naranja para Iquique */

  .card-info { padding: 15px; text-align: center; }
  .card-info h3 { margin: 0; font-size: 1.1rem; color: #333; }
  .anio { color: #888; margin: 5px 0; font-size: 0.9rem; }
  .detalles { color: #666; font-size: 0.85rem; margin-bottom: 10px; }
  .precio { font-size: 1.3rem; font-weight: bold; color: #003366; margin-bottom: 10px; }
  
  .btn-ver { background: #003366; color: white; border: none; width: 100%; padding: 8px; border-radius: 4px; cursor: pointer; font-weight: bold; }
  .btn-ver:hover { background: #002244; }

  .mensaje, .mensaje-vacio { text-align: center; width: 100%; padding: 50px; color: #777; grid-column: 1 / -1; }
  .footer { text-align: center; padding: 20px; color: #aaa; font-size: 0.85rem; margin-top: 20px; }

  @media (max-width: 600px) {
    .hero h1 { font-size: 1.8rem; }
    .grid-autos { grid-template-columns: 1fr; }
  }
</style>