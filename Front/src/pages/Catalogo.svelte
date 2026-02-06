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

  function obtenerImagen(auto) {
    if (auto.imagenes && auto.imagenes.length > 0) return auto.imagenes[0];
    if (auto.imagen_url) return auto.imagen_url;
    return null;
  }

  function obtenerMoneda(auto) { return auto.moneda || 'USD'; }

  function formatearPrecio(auto) {
    let valor = auto.precio || auto.precio_usd;
    if (!valor) return "0";
    let numero = Number(valor);
    if (isNaN(numero)) return "0";
    return numero.toLocaleString('en-US');
  }
</script>

<div class="catalogo-wrapper">
  
  <header class="hero-blue">
    
    <div class="hero-content-centered">
      
      <div class="brand-header-text">
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
    
    <button class="btn-acceso" on:click={irLogin}>Iniciar Sesion 🔒</button>
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
              <span>{auto.transmision}</span> • <span>{auto.tipo_combustible}</span> • <span>{auto.kilometraje ? (auto.kilometraje / 1000).toFixed(0) + 'k mi' : '--'}</span>
            </div>
            <div class="bottom-row">
                <div class="precio-block">
                    <span class="moneda-mini">{obtenerMoneda(auto)}</span>
                    <span class="precio-valor">{formatearPrecio(auto)}</span>
                </div>
                <button class="btn-ver">Ver Detalles &rarr;</button>
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
            <p class="footer-desc">Especialistas en importación de vehículos de USA y trámites aduaneros. Calidad y confianza garantizada en Cochabamba.</p>
        </div>
        <div class="footer-col">
            <h4>Navegación</h4>
            <ul>
                <li><a href="#" on:click|preventDefault={() => window.scrollTo({top:0, behavior:'smooth'})}>Inicio</a></li>
                <li><a href="#" on:click|preventDefault={() => cambiarFiltro('bolivia')}>Stock en Bolivia</a></li>
                <li><a href="#" on:click|preventDefault={() => cambiarFiltro('usa')}>Subasta USA</a></li>
                <li><button class="link-btn" on:click={irLogin}>Acceso Asesores</button></li>
            </ul>
        </div>
        <div class="footer-col">
            <h4>Contáctanos</h4>
            <div class="contact-item"><span class="icon">📍</span><span>Cochabamba, Bolivia</span></div>
            <div class="contact-item"><span class="icon">📞</span><span>+591 62512418</span></div>
            <div class="social-icons">
                <a href="#" class="social-btn facebook">F</a>
                <a href="#" class="social-btn whatsapp">W</a>
                <a href="#" class="social-btn instagram">I</a>
            </div>
        </div>
    </div>
    <div class="footer-bottom"><p>© 2026 BETHEL MOTORS. Todos los derechos reservados.</p></div>
  </footer>

</div>

<style>
  .catalogo-wrapper { background: #f3f5f7; min-height: 100vh; font-family: 'Segoe UI', sans-serif; display: flex; flex-direction: column; }

  /* --- HERO HEADER AZUL (NUEVO DISEÑO) --- */
  .hero-blue {
    background: linear-gradient(135deg, #003366 0%, #001a33 100%); /* Degradado azul corporativo */
    color: white;
    padding: 50px 20px; /* Buen espaciado */
    text-align: center;
    position: relative;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .hero-content-centered {
    width: 100%;
    max-width: 800px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 25px; /* Espacio entre elementos */
  }

  .hero-logo {
    height: 100px; /* Tamaño del logo prominente */
    width: auto;
    /* Truco CSS: Vuelve el logo blanco si es oscuro */
    filter: brightness(0) invert(1); 
    margin-bottom: 10px;
  }

  .brand-header-text h1 {
    margin: 0; font-size: clamp(2.5rem, 5vw, 4rem); /* Texto grande y responsive */
    font-weight: 900; letter-spacing: 2px; line-height: 1.1;
  }

  .brand-header-text p {
    margin: 15px 0 0 0; color: #e0e0e0; font-size: clamp(1rem, 2vw, 1.3rem); font-weight: 500;
  }

  .btn-acceso { 
    position: absolute; top: 20px; right: 20px;
    background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255,255,255,0.3); 
    color: white; padding: 8px 18px; border-radius: 30px; cursor: pointer; font-size: 0.85rem; transition: 0.3s;
  }
  .btn-acceso:hover { background: white; color: #003366; }

  /* BUSCADOR (Ajustado para el fondo azul) */
  .search-bar { width: 100%; display: flex; background: white; border-radius: 50px; padding: 6px; box-shadow: 0 8px 30px rgba(0,0,0,0.3); }
  .search-bar input { flex: 1; border: none; padding: 14px 25px; border-radius: 30px; outline: none; font-size: 1.1rem; color: #333; }
  .btn-search { background: #003366; color: white; border: none; width: 55px; height: 55px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; transition: 0.2s;}
  .btn-search:hover { transform: scale(1.05); background: #002244; }

  /* FILTROS */
  .filtros-container { background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.05); position: sticky; top: 0; z-index: 10; padding: 15px 0; }
  .filtros { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; padding: 0 10px; max-width: 1200px; margin: 0 auto; }
  .filtros button { background: #f8f9fa; border: 1px solid #eee; padding: 8px 18px; border-radius: 25px; cursor: pointer; font-weight: 600; color: #555; transition: 0.2s; font-size: 0.9rem; }
  .filtros button.activo { background: #003366; color: white; border-color: #003366; box-shadow: 0 4px 10px rgba(0, 51, 102, 0.3); }
  .filtros button:hover:not(.activo) { background: #e9ecef; }

  /* GRID */
  .grid-autos { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 30px; max-width: 1250px; margin: 30px auto; padding: 0 20px; flex: 1; }
  .card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.06); transition: transform 0.3s, box-shadow 0.3s; cursor: pointer; border: 1px solid rgba(0,0,0,0.05); display: flex; flex-direction: column; }
  .card:hover { transform: translateY(-8px); box-shadow: 0 15px 30px rgba(0,0,0,0.12); }
  .img-wrapper { height: 240px; background: #e9ecef; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .img-wrapper img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
  .card:hover .img-wrapper img { transform: scale(1.05); }
  .no-img { color: #888; font-weight: bold; }
  .badge { position: absolute; top: 15px; right: 15px; padding: 6px 12px; border-radius: 6px; color: white; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; box-shadow: 0 2px 5px rgba(0,0,0,0.3); backdrop-filter: blur(2px); }
  .badge.bo { background: rgba(40, 167, 69, 0.9); } .badge.usa { background: rgba(0, 51, 102, 0.9); } .badge.cl { background: rgba(255, 153, 0, 0.9); }
  .card-info { padding: 20px; flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
  .header-info { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
  .header-info h3 { margin: 0; font-size: 1.15rem; color: #222; font-weight: 700; line-height: 1.2; }
  .anio-badge { background: #333; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; height: fit-content; }
  .detalles-mini { font-size: 0.85rem; color: #777; margin-bottom: 15px; }
  .bottom-row { display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 15px; border-top: 1px solid #f0f0f0; }
  .precio-block { display: flex; flex-direction: column; }
  .moneda-mini { font-size: 0.7rem; color: #888; font-weight: bold; }
  .precio-valor { font-size: 1.4rem; font-weight: 800; color: #003366; line-height: 1; }
  .btn-ver { background: #eef2f6; color: #003366; border: none; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 0.85rem; transition: 0.2s; }
  .card:hover .btn-ver { background: #003366; color: white; }
  .legal-footer { margin-top: 12px; font-size: 0.7rem; font-weight: bold; text-align: center; padding: 4px; border-radius: 4px; }
  .legal-footer.ok { background: #d4edda; color: #155724; } .legal-footer.pending { background: #fff3cd; color: #856404; }
  .mensaje, .mensaje-vacio { text-align: center; width: 100%; padding: 50px; color: #777; grid-column: 1 / -1; }
  .btn-reset { margin-top: 10px; padding: 8px 16px; background: #003366; color: white; border: none; border-radius: 20px; cursor: pointer; }

  /* FOOTER */
  .footer-dark { background: #001a33; color: #cbd5e1; margin-top: 50px; font-size: 0.9rem; border-top: 5px solid #003366; }
  .footer-container { max-width: 1200px; margin: 0 auto; padding: 60px 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 40px; }
  .footer-brand h3 { color: white; font-weight: 800; letter-spacing: 1px; margin: 15px 0 10px 0; font-size: 1.3rem; }
  .footer-logo { height: 60px; filter: brightness(0) invert(1); }
  .footer-desc { line-height: 1.6; font-size: 0.95rem; margin-top: 10px; opacity: 0.8; }
  .footer-col h4 { color: white; font-size: 1.1rem; margin-bottom: 25px; position: relative; padding-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
  .footer-col h4::after { content: ''; position: absolute; left: 0; bottom: 0; width: 40px; height: 3px; background: #28a745; }
  .footer-col ul { list-style: none; padding: 0; margin: 0; }
  .footer-col ul li { margin-bottom: 12px; }
  .footer-col ul li a { color: #cbd5e1; text-decoration: none; transition: 0.2s; font-size: 1rem; }
  .footer-col ul li a:hover { color: white; padding-left: 5px; color: #28a745; }
  .link-btn { background: none; border: none; color: #cbd5e1; cursor: pointer; padding: 0; font-size: 1rem; font-family: inherit; }
  .link-btn:hover { color: #28a745; }
  .contact-item { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; font-size: 1rem; }
  .contact-item .icon { font-size: 1.2rem; }
  .social-icons { display: flex; gap: 12px; margin-top: 25px; }
  .social-btn { width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; color: white; text-decoration: none; font-weight: bold; transition: 0.3s; }
  .social-btn:hover { background: #28a745; color: white; transform: translateY(-3px); }
  .footer-bottom { background: #001122; text-align: center; padding: 25px; border-top: 1px solid rgba(255,255,255,0.05); font-size: 0.85rem; color: #64748b; }

  @media (max-width: 600px) {
    .hero-logo { height: 80px; }
    .grid-autos { grid-template-columns: 1fr; }
    .footer-container { text-align: center; }
    .footer-col h4::after { left: 50%; transform: translateX(-50%); }
    .social-icons { justify-content: center; }
  }
</style>