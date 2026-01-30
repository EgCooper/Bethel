<script>
  import { onMount, createEventDispatcher } from "svelte";
  import axios from "axios";

  const dispatch = createEventDispatcher();
  
  let vehiculos = [];
  let vehiculosFiltrados = [];
  let cargando = true;
  let filtroActual = 'Todos';

  onMount(async () => {
    try {
      // CORREGIDO: Ruta relativa (sin http://localhost:3000)
      const res = await axios.get("/api/vehiculos");
      
      // Filtramos solo los disponibles para el público
      vehiculos = res.data.filter(v => v.estado === 'Disponible');
      
      filtrar('Todos');
      cargando = false;
    } catch (error) {
      console.error(error);
      cargando = false;
    }
  });

  function filtrar(criterio) {
    filtroActual = criterio;
    if (criterio === 'Todos') {
      vehiculosFiltrados = vehiculos;
    } else if (criterio === 'Bolivia') {
      vehiculosFiltrados = vehiculos.filter(v => v.ubicacion.includes('Bolivia'));
    } else if (criterio === 'USA') {
      vehiculosFiltrados = vehiculos.filter(v => v.ubicacion.includes('USA'));
    }
  }

  // Emitimos el evento para abrir el detalle
  function verDetalle(auto) {
    dispatch('verDetalle', auto);
  }

  function irAlLogin() {
    dispatch('irLogin');
  }
</script>

<div class="public-container">
  
  <header class="public-header">
    <div class="brand">
      <h1>BETHEL MOTORS</h1>
      <p>Importacion Directa y Segura</p>
    </div>
    <button class="btn-login" on:click={irAlLogin}>
      🔒 Soy Asesor
    </button>
  </header>

  <div class="hero-filters">
    <h2>Encuentra tu próximo vehículo</h2>
    <div class="filter-buttons">
      <button class:active={filtroActual === 'Todos'} on:click={() => filtrar('Todos')}>Todos</button>
      <button class:active={filtroActual === 'Bolivia'} on:click={() => filtrar('Bolivia')}>🇧🇴 En Bolivia</button>
      <button class:active={filtroActual === 'USA'} on:click={() => filtrar('USA')}>🇺🇸 Importación (USA)</button>
    </div>
  </div>

  <div class="catalog-grid">
    {#if cargando}
      <p class="loading">Cargando inventario...</p>
    {:else if vehiculosFiltrados.length === 0}
      <div class="empty">No hay vehículos disponibles en esta categoría.</div>
    {:else}
      {#each vehiculosFiltrados as auto}
        <div class="card-public" on:click={() => verDetalle(auto)}>
          <div class="img-wrapper">
            {#if auto.imagen_url}
              <img src={auto.imagen_url} alt={auto.modelo}>
            {:else}
              <div class="no-img">Sin Foto</div>
            {/if}
            
            <span class="badge {auto.ubicacion.includes('Bolivia') ? 'bo' : 'usa'}">
              {auto.ubicacion}
            </span>
          </div>

          <div class="details">
            <h3>{auto.marca} {auto.modelo}</h3>
            <div class="specs">
              <span>{auto.año}</span> • <span>{auto.transmision}</span> • <span>{auto.tipo_combustible}</span>
            </div>
            
            <div class="price-block">
              <span class="currency">USD</span>
              <span class="amount">{auto.precio_usd.toLocaleString('en-US')}</span>
              {#if auto.ubicacion.includes('USA')}
                <span class="aprox">(Ref)</span>
              {/if}
            </div>

            <button class="btn-contact">
               Ver Detalles Completos
            </button>
          </div>
        </div>
      {/each}
    {/if}
  </div>

  <footer class="public-footer">
    <p>© 2026 BETHEL SYSTEM | Cochabamba, Bolivia</p>
  </footer>

</div>

<style>
  .public-container { background: #f9f9f9; min-height: 100vh; font-family: 'Segoe UI', sans-serif; }
  
  .public-header { 
    background: #003366; color: white; padding: 15px 30px; 
    display: flex; justify-content: space-between; align-items: center; 
  }
  .brand h1 { margin: 0; font-size: 1.5rem; letter-spacing: 1px; }
  .brand p { margin: 0; font-size: 0.8rem; opacity: 0.8; }
  
  .btn-login { 
    background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); 
    color: white; padding: 8px 15px; border-radius: 20px; cursor: pointer; transition: 0.3s; 
  }
  .btn-login:hover { background: white; color: #003366; }

  .hero-filters { text-align: center; padding: 40px 20px; background: white; border-bottom: 1px solid #eee; }
  .hero-filters h2 { color: #333; margin-top: 0; margin-bottom: 20px; }
  
  .filter-buttons button {
    background: white; border: 1px solid #ccc; color: #555;
    padding: 10px 20px; margin: 0 5px; border-radius: 25px; cursor: pointer; font-weight: bold;
    transition: all 0.2s;
  }
  .filter-buttons button.active { background: #003366; color: white; border-color: #003366; transform: scale(1.05); }

  .catalog-grid { max-width: 1200px; margin: 30px auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 25px; padding: 0 20px; }
  
  .card-public { background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.08); transition: transform 0.3s; cursor: pointer; }
  .card-public:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.12); }

  .img-wrapper { height: 200px; position: relative; background: #eee; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .img-wrapper img { width: 100%; height: 100%; object-fit: cover; }
  
  .badge { position: absolute; top: 10px; right: 10px; padding: 5px 10px; border-radius: 4px; color: white; font-weight: bold; font-size: 0.75rem; text-transform: uppercase; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
  .badge.bo { background: #28a745; }
  .badge.usa { background: #003366; }

  .details { padding: 20px; text-align: center; }
  .details h3 { margin: 0; color: #333; font-size: 1.1rem; }
  .specs { color: #777; font-size: 0.85rem; margin: 5px 0 15px 0; }
  
  .price-block { margin-bottom: 15px; color: #003366; }
  .amount { font-size: 1.5rem; font-weight: bold; }
  .aprox { font-size: 0.8rem; color: #666; background: #eee; padding: 2px 5px; border-radius: 4px; }

  .btn-contact { width: 100%; background: #003366; color: white; border: none; padding: 12px; border-radius: 6px; font-weight: bold; font-size: 1rem; cursor: pointer; transition: background 0.2s; }
  .btn-contact:hover { background: #002244; }

  .loading, .empty { text-align: center; padding: 50px; color: #777; width: 100%; grid-column: 1 / -1; }
  .public-footer { text-align: center; padding: 30px; color: #aaa; font-size: 0.9rem; margin-top: 50px; border-top: 1px solid #eee; }
</style>