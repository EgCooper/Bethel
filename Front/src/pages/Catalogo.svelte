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
      console.error("Error:", error);
      cargando = false;
    }
  }

  function cambiarFiltro(nuevoFiltro) { filtroActual = nuevoFiltro; filtrarVehiculos(); }

  function filtrarVehiculos() {
    let resultado = vehiculos;
    if (filtroActual === 'bolivia') resultado = resultado.filter(v => v.ubicacion.includes('Bolivia'));
    else if (filtroActual === 'usa') resultado = resultado.filter(v => v.ubicacion.includes('USA'));
    else if (filtroActual === 'chile') resultado = resultado.filter(v => v.ubicacion.includes('Iquique') || v.ubicacion.includes('Chile'));

    if (busqueda.trim() !== "") {
      const texto = busqueda.toLowerCase();
      resultado = resultado.filter(v => v.marca.toLowerCase().includes(texto) || v.modelo.toLowerCase().includes(texto) || v.año.toString().includes(texto));
    }
    vehiculosFiltrados = resultado;
  }

  function verDetalle(auto) { dispatch('verDetalle', { ...auto }); }
  function irLogin() { dispatch('irLogin'); }
  function irContacto() { dispatch('irContacto'); }

  function obtenerImagen(auto) {
    if (auto.imagenes && auto.imagenes.length > 0) return auto.imagenes[0];
    if (auto.imagen_url) return auto.imagen_url;
    return null;
  }
  function obtenerMoneda(auto) { return auto.moneda || 'USD'; }
  function formatearPrecio(auto) {
    let valor = auto.precio || auto.precio_usd;
    if (!valor) return "0";
    return Number(valor).toLocaleString('en-US');
  }
</script>

<div class="catalogo-wrapper">
  
  <header class="hero-blue">
    <div class="hero-content-centered">
      
      <div class="brand-header-text">
        <h1>BETHEL MOTORS</h1>
        <p>Importación Directa & Calidad Garantizada</p>
      </div>
      
      <div class="actions-row">
        <div class="search-bar">
            <input type="text" placeholder="Busca por marca (ej: Toyota)..." bind:value={busqueda} on:input={filtrarVehiculos} />
            <button class="btn-search">🔍</button>
        </div>
        
       
      </div>
 <button class="btn-hero-contact" on:click={irContacto}>
            📞 Contáctanos
        </button>
    </div>
    
    <button class="btn-acceso" on:click={irLogin}>Soy Asesor 🔒</button>
  </header>

  <nav class="filtros-container">
    <div class="filtros">
      <button class="{filtroActual === 'todos' ? 'activo' : ''}" on:click={() => cambiarFiltro('todos')}>Todo el Stock</button>
      <button class="{filtroActual === 'bolivia' ? 'activo' : ''}" on:click={() => cambiarFiltro('bolivia')}>🇧🇴 En Bolivia</button>
      <button class="{filtroActual === 'chile' ? 'activo' : ''}" on:click={() => cambiarFiltro('chile')}>🇨🇱 En Tránsito</button>
      <button class="{filtroActual === 'usa' ? 'activo' : ''}" on:click={() => cambiarFiltro('usa')}>🇺🇸 Subasta USA</button>
    </div>
  </nav>

  <div class="grid-autos">
    {#if cargando}
      <p class="mensaje">Cargando inventario...</p>
    {:else if vehiculosFiltrados.length === 0}
      <div class="mensaje-vacio">
        <p>No se encontraron vehículos.</p>
        <button class="btn-reset" on:click={() => { busqueda=''; filtroActual='todos'; filtrarVehiculos(); }}>Ver todos</button>
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
            <span class="badge {auto.ubicacion.includes('Bolivia') ? 'bo' : auto.ubicacion.includes('Iquique') ? 'cl' : 'usa'}">{auto.ubicacion}</span>
          </div>
          
          <div class="card-info">
            <div class="header-info">
                <h3>{auto.marca} {auto.modelo}</h3>
                <span class="anio-badge">{auto.año}</span>
            </div>
            <div class="detalles-mini">
              <span>{auto.transmision}</span> • <span>{auto.tipo_combustible}</span>
            </div>
            <div class="bottom-row">
                <div class="precio-block">
                    <span class="moneda-mini">{obtenerMoneda(auto)}</span>
                    <span class="precio-valor">{formatearPrecio(auto)}</span>
                </div>
                <button class="btn-ver">Ver Detalles →</button>
            </div>
            {#if auto.situacion_legal}
              <div class="legal-footer {auto.situacion_legal.includes('Despachado') ? 'ok' : 'pending'}">{auto.situacion_legal.split('(')[0]}</div>
            {/if}
          </div>
        </div>
      {/each}
    {/if}
  </div>

  <footer class="footer-dark">
    <div class="footer-container">
        <div class="footer-col">
            <div class="footer-brand">
                <h3>BETHEL MOTORS</h3>
            </div>
            <p class="footer-desc">Especialistas en importación de vehículos de USA y trámites aduaneros.</p>
        </div>
        <div class="footer-col">
            <h4>Navegación</h4>
            <ul>
                <li><a href="#" on:click|preventDefault={() => window.scrollTo({top:0, behavior:'smooth'})}>Inicio</a></li>
                <li><a href="#" on:click|preventDefault={() => cambiarFiltro('bolivia')}>Stock en Bolivia</a></li>
                <li><button class="link-btn" on:click={irLogin}>Acceso Asesores</button></li>
            </ul>
        </div>
        <div class="footer-col">
            <h4>Contáctanos</h4>
            <div class="contact-item" style="cursor: pointer;" on:click={irContacto}>
                <span class="icon">📍</span>
                <span>Cochabamba (Ver Mapa)</span>
            </div>
            <div class="contact-item"><span class="icon">📞</span><span>+591 62512418</span></div>
        </div>
    </div>
    <div class="footer-bottom"><p>© 2026 BETHEL MOTORS.</p></div>
  </footer>

  <button class="btn-flotante" on:click={irContacto}>
    💬 Escríbenos
  </button>

</div>

<style>
  .catalogo-wrapper { background: #f3f5f7; min-height: 100vh; font-family: 'Segoe UI', sans-serif; display: flex; flex-direction: column; }
  .hero-blue { background: linear-gradient(135deg, #003366 0%, #001a33 100%); color: white; padding: 50px 20px; text-align: center; position: relative; box-shadow: 0 4px 20px rgba(0,0,0,0.2); display: flex; flex-direction: column; align-items: center; }
  .hero-content-centered { width: 100%; max-width: 800px; display: flex; flex-direction: column; align-items: center; gap: 20px; }
  .brand-header-text h1 { margin: 10px 0 0 0; font-size: clamp(2.5rem, 5vw, 4rem); font-weight: 900; letter-spacing: 2px; line-height: 1.1; }
  .brand-header-text p { margin: 10px 0 0 0; color: #e0e0e0; font-size: clamp(1rem, 2vw, 1.3rem); font-weight: 500; }
  
  /* ESTILOS NUEVOS PARA EL HERO */
  .actions-row { display: flex; flex-wrap: wrap; gap: 15px; width: 100%; justify-content: center; align-items: center; margin-top: 20px; }
  .search-bar { flex: 1; min-width: 280px; max-width: 500px; display: flex; background: white; border-radius: 50px; padding: 6px; box-shadow: 0 8px 30px rgba(0,0,0,0.3); }
  .search-bar input { flex: 1; border: none; padding: 14px 25px; border-radius: 30px; outline: none; font-size: 1.1rem; color: #333; }
  .btn-search { background: #003366; color: white; border: none; width: 55px; height: 55px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; }
  
  /* BOTÓN EN EL HEADER */
  .btn-hero-contact {
    background: transparent; border: 2px solid rgba(255,255,255,0.6); color: white;
    padding: 12px 25px; border-radius: 30px; font-weight: bold; cursor: pointer;
    font-size: 1rem; transition: 0.3s;
  }
  .btn-hero-contact:hover { background: white; color: #003366; }

  .btn-acceso { position: absolute; top: 20px; right: 20px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 8px 18px; border-radius: 30px; cursor: pointer; font-size: 0.85rem; }

  .filtros-container { background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.05); position: sticky; top: 0; z-index: 10; padding: 15px 0; }
  .filtros { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; padding: 0 10px; max-width: 1200px; margin: 0 auto; }
  .filtros button { background: #f8f9fa; border: 1px solid #eee; padding: 8px 18px; border-radius: 25px; cursor: pointer; font-weight: 600; color: #555; }
  .filtros button.activo { background: #003366; color: white; border-color: #003366; }
  
  .grid-autos { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 30px; max-width: 1250px; margin: 30px auto; padding: 0 20px; flex: 1; }
  .card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.06); cursor: pointer; display: flex; flex-direction: column; }
  .img-wrapper { height: 240px; background: #e9ecef; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .img-wrapper img { width: 100%; height: 100%; object-fit: cover; }
  .badge { position: absolute; top: 15px; right: 15px; padding: 6px 12px; border-radius: 6px; color: white; font-size: 0.75rem; font-weight: bold; }
  .badge.bo { background: rgba(40, 167, 69, 0.9); } .badge.usa { background: rgba(0, 51, 102, 0.9); } .badge.cl { background: rgba(255, 153, 0, 0.9); }
  .card-info { padding: 20px; flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
  .header-info { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
  .header-info h3 { margin: 0; font-size: 1.15rem; color: #222; font-weight: 700; }
  .anio-badge { background: #333; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; }
  .detalles-mini { font-size: 0.85rem; color: #777; margin-bottom: 15px; }
  .bottom-row { display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 15px; border-top: 1px solid #f0f0f0; }
  .precio-valor { font-size: 1.4rem; font-weight: 800; color: #003366; }
  .btn-ver { background: #eef2f6; color: #003366; border: none; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 0.85rem; }
  .legal-footer { margin-top: 12px; font-size: 0.7rem; font-weight: bold; text-align: center; padding: 4px; border-radius: 4px; }
  .legal-footer.ok { background: #d4edda; color: #155724; } .legal-footer.pending { background: #fff3cd; color: #856404; }
  
  .footer-dark { background: #001a33; color: #cbd5e1; margin-top: 50px; font-size: 0.9rem; border-top: 5px solid #003366; }
  .footer-container { max-width: 1200px; margin: 0 auto; padding: 60px 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 40px; }
  .footer-brand h3 { color: white; font-weight: 800; margin: 15px 0 10px 0; font-size: 1.3rem; }
  .footer-col h4 { color: white; margin-bottom: 25px; border-bottom: 3px solid #28a745; display: inline-block; padding-bottom: 5px; }
  .footer-col ul { list-style: none; padding: 0; margin: 0; }
  .footer-col ul li { margin-bottom: 12px; }
  .link-btn { background: none; border: none; color: #cbd5e1; cursor: pointer; padding: 0; font-size: 1rem; }
  .link-btn:hover { color: #28a745; }
  .contact-item { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
  .footer-bottom { background: #001122; text-align: center; padding: 25px; }
  
  /* ESTILOS BOTÓN FLOTANTE */
  .btn-flotante {
    position: fixed;
    bottom: 30px;
    right: 30px;
    background-color: #28a745; /* Verde tipo WhatsApp */
    color: white;
    border: none;
    border-radius: 50px;
    padding: 15px 25px;
    font-size: 1rem;
    font-weight: bold;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    cursor: pointer;
    z-index: 1000; /* Siempre encima */
    display: flex;
    align-items: center;
    gap: 10px;
    transition: transform 0.3s, box-shadow 0.3s;
  }
  .btn-flotante:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.4);
    background-color: #218838;
  }

  @media (max-width: 600px) { 
    .grid-autos { grid-template-columns: 1fr; } 
    .footer-container { text-align: center; } 
    /* En celular, el botón flotante es solo el icono para no tapar */
    .btn-flotante { padding: 15px; border-radius: 50%; width: 60px; height: 60px; justify-content: center; }
  }
</style>