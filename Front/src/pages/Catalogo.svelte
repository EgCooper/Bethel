<script>
  import { onMount, createEventDispatcher } from "svelte";
  import axios from "axios";

  const dispatch = createEventDispatcher();

  let vehiculos = [];
  let vehiculosFiltrados = [];
  let cargando = true;
  let filtroActual = 'todos'; 
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

    if (filtroActual === 'bolivia') {
      resultado = resultado.filter(v => v.ubicacion.includes('Bolivia'));
    } else if (filtroActual === 'usa') {
      resultado = resultado.filter(v => v.ubicacion.includes('USA'));
    } else if (filtroActual === 'chile') {
      resultado = resultado.filter(v => v.ubicacion.includes('Iquique') || v.ubicacion.includes('Chile'));
    }

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

  // --- FUNCIONES SEGURAS ---
  function obtenerImagen(auto) {
    if (auto.imagenes && auto.imagenes.length > 0) return auto.imagenes[0];
    if (auto.imagen_url) return auto.imagen_url;
    return null;
  }

  function obtenerMoneda(auto) {
    return auto.moneda || 'USD';
  }

  function formatearPrecio(auto) {
    let valor = auto.precio || auto.precio_usd;
    if (!valor) return "0";
    let numero = Number(valor);
    if (isNaN(numero)) return "0";
    return numero.toLocaleString('en-US');
  }
</script>
<svelte:head>
  <title>Bethel Motors</title>
</svelte:head>
<div class="catalogo-wrapper">
  
  <header class="hero">
    <div class="hero-content">
      <div class="brand-header">
        <h1>BETHEL MOTORS</h1>
        <p>Importación Directa & Calidad Garantizada</p>
      </div>
      
      <div class="search-bar">
        <input 
          type="text" 
          placeholder="Busca por marca (ej: Toyota)..." 
          bind:value={busqueda}
          on:input={filtrarVehiculos}
        />
        <button class="btn-search">🔍</button>
      </div>
    </div>
    
    <button class="btn-acceso" on:click={irLogin}>Soy Asesor 🔒</button>
  </header>

  <nav class="filtros-container">
    <div class="filtros">
      <button class="{filtroActual === 'todos' ? 'activo' : ''}" on:click={() => cambiarFiltro('todos')}>
        Todo el Stock
      </button>
      <button class="{filtroActual === 'bolivia' ? 'activo' : ''}" on:click={() => cambiarFiltro('bolivia')}>
        🇧🇴 Bolivia
      </button>
      <button class="{filtroActual === 'chile' ? 'activo' : ''}" on:click={() => cambiarFiltro('chile')}>
        🇨🇱 Chile
      </button>
      <button class="{filtroActual === 'usa' ? 'activo' : ''}" on:click={() => cambiarFiltro('usa')}>
        🇺🇸 USA
      </button>
    </div>
  </nav>

  <div class="grid-autos">
    {#if cargando}
      <p class="mensaje">Cargando inventario...</p>
    {:else if vehiculosFiltrados.length === 0}
      <div class="mensaje-vacio">
        <p>No se encontraron vehículos con estos criterios.</p>
        <button class="btn-reset" on:click={() => { busqueda=''; filtroActual='todos'; filtrarVehiculos(); }}>
          Ver todos
        </button>
      </div>
    {:else}
      {#each vehiculosFiltrados as auto}
        <div class="card" on:click={() => verDetalle(auto)}>
          
          <div class="img-wrapper">
            {#if obtenerImagen(auto)}
              <img src={obtenerImagen(auto)} alt={auto.modelo} loading="lazy">
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
            <div class="header-info">
                <h3>{auto.marca} {auto.modelo}</h3>
                <span class="anio-badge">{auto.año}</span>
            </div>
            
            <div class="detalles-mini">
              <span>{auto.transmision}</span> • 
              <span>{auto.tipo_combustible}</span> • 
              <span>{auto.kilometraje ? (auto.kilometraje / 1000).toFixed(0) + 'k mi' : '--'}</span>
            </div>
            
            <div class="bottom-row">
                <div class="precio-block">
                    <span class="moneda-mini">{obtenerMoneda(auto)}</span>
                    <span class="precio-valor">{formatearPrecio(auto)}</span>
                </div>
                <button class="btn-ver">Ver Detalles &rarr;</button>
            </div>
            
            {#if auto.situacion_legal}
              <div class="legal-footer {auto.situacion_legal.includes('Despachado') ? 'ok' : 'pending'}">
                 {auto.situacion_legal.split('(')[0]}
              </div>
            {/if}

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
  /* --- ESTRUCTURA --- */
  .catalogo-wrapper { background: #f3f5f7; min-height: 100vh; font-family: 'Segoe UI', sans-serif; }

  /* --- HERO HEADER --- */
  .hero { 
    background: linear-gradient(135deg, #003366 0%, #001a33 100%); 
    color: white; padding: 50px 20px; text-align: center; position: relative; 
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  }
  .hero h1 { margin: 0; font-size: 2.2rem; letter-spacing: 2px; font-weight: 800; }
  .hero p { margin: 10px 0 25px 0; color: #ccc; font-size: 1rem; }
  
  .btn-acceso { 
    position: absolute; top: 20px; right: 20px; 
    background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); 
    color: white; padding: 6px 15px; border-radius: 20px; cursor: pointer; font-size: 0.8rem; transition: 0.3s;
  }
  .btn-acceso:hover { background: white; color: #003366; }

  /* --- BUSCADOR --- */
  .search-bar { display: flex; max-width: 550px; margin: 0 auto; background: white; border-radius: 50px; padding: 5px; box-shadow: 0 5px 20px rgba(0,0,0,0.2); }
  .search-bar input { flex: 1; border: none; padding: 12px 25px; border-radius: 30px; outline: none; font-size: 1rem; }
  .btn-search { background: #003366; color: white; border: none; width: 45px; height: 45px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }

  /* --- FILTROS --- */
  .filtros-container { background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.05); position: sticky; top: 0; z-index: 10; padding: 15px 0; }
  .filtros { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; padding: 0 10px; max-width: 1200px; margin: 0 auto; }
  .filtros button { 
    background: #f8f9fa; border: 1px solid #eee; padding: 8px 18px; 
    border-radius: 25px; cursor: pointer; font-weight: 600; color: #555; transition: 0.2s; font-size: 0.9rem;
  }
  .filtros button.activo { background: #003366; color: white; border-color: #003366; box-shadow: 0 4px 10px rgba(0, 51, 102, 0.3); }
  .filtros button:hover:not(.activo) { background: #e9ecef; }

  /* --- GRID DE AUTOS (TARJETAS GRANDES) --- */
  .grid-autos { 
    display: grid; 
    /* CAMBIO CLAVE: Tarjetas más anchas (320px) */
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); 
    gap: 30px; 
    max-width: 1250px; margin: 30px auto; padding: 0 20px; 
  }
  
  .card { 
    background: white; border-radius: 12px; overflow: hidden; 
    box-shadow: 0 4px 15px rgba(0,0,0,0.06); transition: transform 0.3s, box-shadow 0.3s; cursor: pointer; 
    border: 1px solid rgba(0,0,0,0.05);
    display: flex; flex-direction: column;
  }
  .card:hover { transform: translateY(-8px); box-shadow: 0 15px 30px rgba(0,0,0,0.12); }

  /* --- IMAGEN MEJORADA --- */
  .img-wrapper { 
    /* CAMBIO CLAVE: Más altura (240px) = Menos zoom/recorte */
    height: 240px; 
    background: #e9ecef; /* Fondo gris estudio */
    position: relative; 
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
  }
  
  .img-wrapper img { 
    width: 100%; 
    height: 100%; 
    object-fit: cover; /* Al ser la caja más alta, el 'cover' ya no recorta tanto */
    transition: transform 0.5s;
  }
  .card:hover .img-wrapper img { transform: scale(1.05); }

  .no-img { color: #888; font-weight: bold; }

  /* BADGES */
  .badge { position: absolute; top: 15px; right: 15px; padding: 6px 12px; border-radius: 6px; color: white; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; box-shadow: 0 2px 5px rgba(0,0,0,0.3); backdrop-filter: blur(2px); }
  .badge.bo { background: rgba(40, 167, 69, 0.9); }
  .badge.usa { background: rgba(0, 51, 102, 0.9); }
  .badge.cl { background: rgba(255, 153, 0, 0.9); }

  /* INFO */
  .card-info { padding: 20px; flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
  
  .header-info { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
  .header-info h3 { margin: 0; font-size: 1.15rem; color: #222; font-weight: 700; line-height: 1.2; }
  .anio-badge { background: #333; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; height: fit-content; }

  .detalles-mini { font-size: 0.85rem; color: #777; margin-bottom: 15px; }
  
  /* PRECIO Y BOTÓN */
  .bottom-row { display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 15px; border-top: 1px solid #f0f0f0; }
  
  .precio-block { display: flex; flex-direction: column; }
  .moneda-mini { font-size: 0.7rem; color: #888; font-weight: bold; }
  .precio-valor { font-size: 1.4rem; font-weight: 800; color: #003366; line-height: 1; }

  .btn-ver { background: #eef2f6; color: #003366; border: none; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 0.85rem; transition: 0.2s; }
  .card:hover .btn-ver { background: #003366; color: white; }

  .legal-footer { margin-top: 12px; font-size: 0.7rem; font-weight: bold; text-align: center; padding: 4px; border-radius: 4px; }
  .legal-footer.ok { background: #d4edda; color: #155724; }
  .legal-footer.pending { background: #fff3cd; color: #856404; }

  .mensaje, .mensaje-vacio { text-align: center; width: 100%; padding: 50px; color: #777; grid-column: 1 / -1; }
  .btn-reset { margin-top: 10px; padding: 8px 16px; background: #003366; color: white; border: none; border-radius: 20px; cursor: pointer; }
  
  .footer { text-align: center; padding: 40px; color: #aaa; font-size: 0.85rem; margin-top: 20px; border-top: 1px solid #eee; }

  @media (max-width: 600px) {
    .hero h1 { font-size: 1.8rem; }
    .grid-autos { grid-template-columns: 1fr; }
    .img-wrapper { height: 220px; }
  }
</style>