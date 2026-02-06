<script>
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  export let auto; 

  // --- LÓGICA (Mantenemos la que ya funciona) ---
  let tieneGaleria = auto.imagenes && auto.imagenes.length > 0;
  let imagenGrande = tieneGaleria ? auto.imagenes[0] : (auto.imagen_url || '');

  function cambiarImagen(img) {
    imagenGrande = img;
  }

  function formatearPrecio() {
    let valor = auto.precio || auto.precio_usd;
    if (!valor) return "0";
    let numero = Number(valor);
    if (isNaN(numero)) return "0";
    return numero.toLocaleString('en-US');
  }

  function obtenerMoneda() {
    return auto.moneda || 'USD';
  }

  function volver() { dispatch('volver'); }
  function irAlLogin() { dispatch('irLogin'); }

  function contactar() {
    let telefonoDestino = "59162512418"; // Tu central
    let nombreDestino = "Bethel Motors";
    
    if (auto.asesor_id && auto.asesor_id.telefono) {
        telefonoDestino = auto.asesor_id.telefono;
        nombreDestino = auto.asesor_id.nombre;
    }

    telefonoDestino = telefonoDestino.replace(/\D/g, '');
    if (telefonoDestino.length === 8) telefonoDestino = '591' + telefonoDestino;

    const mensaje = `Hola *${nombreDestino}*, estoy interesado en:%0A%0A` +
                    `🚘 *${auto.marca} ${auto.modelo} ${auto.año}*%0A` +
                    `💰 Precio: ${formatearPrecio()} ${obtenerMoneda()}%0A` +
                    `🆔 Ref: ${auto.vin ? auto.vin.slice(-6) : 'N/A'}%0A` +
                    `¿Me podría dar más información?`;
    
    window.open(`https://wa.me/${telefonoDestino}?text=${mensaje}`, '_blank');
  }
</script>

<div class="page-wrapper">
  
  <header class="navbar">
    <div class="brand">
      <span class="logo-icon">🏎️</span>
      <div>
        <h1>BETHEL MOTORS</h1>
        <small>Premium Motors</small>
      </div>
    </div>
    <button class="btn-ghost" on:click={irAlLogin}>Soy Asesor 🔒</button>
  </header>

  <main class="container">
    
    <nav class="breadcrumb">
      <button on:click={volver}>&larr; Volver al Inventario</button>
      <span class="separator">/</span>
      <span class="current">{auto.marca} {auto.modelo}</span>
    </nav>

    <div class="grid-layout">
      
      <section class="gallery-section">
        <div class="main-image-frame">
          {#if imagenGrande}
            <img src={imagenGrande} alt={auto.modelo} class="main-img">
          {:else}
            <div class="placeholder-img">
                <span>📷 Sin Fotografía</span>
            </div>
          {/if}
          
          <div class="badges-overlay">
            <span class="badge-status {auto.ubicacion.includes('Bolivia') ? 'bo' : auto.ubicacion.includes('Iquique') ? 'cl' : 'usa'}">
                📍 {auto.ubicacion}
            </span>
          </div>
        </div>

        {#if tieneGaleria && auto.imagenes.length > 1}
            <div class="thumbnails-scroll">
                {#each auto.imagenes as img}
                    <img 
                        src={img} 
                        alt="thumb" 
                        class="thumb {imagenGrande === img ? 'active' : ''}"
                        on:click={() => cambiarImagen(img)} 
                    >
                {/each}
            </div>
        {/if}

        <div class="description-card">
            <h3>📝 Detalles del Vehículo</h3>
            <p>{auto.descripcion || "El vendedor no ha añadido una descripción detallada para este vehículo, pero puedes consultarnos directamente."}</p>
        </div>
      </section>

      <aside class="info-section">
        
        <div class="buy-card">
            <div class="header-info">
                <small class="vin">VIN: {auto.vin}</small>
                <h1>{auto.marca} {auto.modelo} <span class="year">{auto.año}</span></h1>
            </div>

            <div class="price-tag">
                <span class="currency">{obtenerMoneda()}</span>
                <span class="amount">{formatearPrecio()}</span>
                {#if auto.ubicacion.includes('USA')}
                    <div class="subasta-tag">Precio Referencial Subasta</div>
                {/if}
            </div>

            <div class="legal-alert {auto.situacion_legal?.includes('Despachado') ? 'green' : 'yellow'}">
                Documents: <strong>{auto.situacion_legal || 'No especificado'}</strong>
                {#if auto.placa} <br> Placa: <strong>{auto.placa}</strong> {/if}
            </div>

            <button class="btn-cta" on:click={contactar}>
                <span class="icon">📲</span> Contactar Asesor
            </button>
            
            {#if auto.asesor_id}
                <div class="asesor-mini">
                    <div class="avatar">{auto.asesor_id.nombre[0]}</div>
                    <div class="datos">
                        <span>Atendido por:</span>
                        <strong>{auto.asesor_id.nombre}</strong>
                    </div>
                </div>
            {/if}
        </div>

        <div class="specs-card">
            <h3>⚙️ Ficha Técnica</h3>
            <div class="specs-grid">
                <div class="spec-item">
                    <span class="icon">🛣️</span>
                    <div>
                        <small>Kilometraje</small>
                        <strong>{auto.kilometraje ? auto.kilometraje.toLocaleString() : '--'} km</strong>
                    </div>
                </div>
                <div class="spec-item">
                    <span class="icon">🕹️</span>
                    <div>
                        <small>Transmisión</small>
                        <strong>{auto.transmision}</strong>
                    </div>
                </div>
                <div class="spec-item">
                    <span class="icon">⛽</span>
                    <div>
                        <small>Combustible</small>
                        <strong>{auto.tipo_combustible}</strong>
                    </div>
                </div>
                <div class="spec-item">
                    <span class="icon">🎨</span>
                    <div>
                        <small>Color</small>
                        <strong>{auto.color}</strong>
                    </div>
                </div>
                <div class="spec-item">
                    <span class="icon">⭐</span>
                    <div>
                        <small>Condición</small>
                        <strong>{auto.estado_vehiculo}</strong>
                    </div>
                </div>
            </div>
        </div>

      </aside>

    </div>
  </main>

  <footer class="footer">
    <p>© 2026 BETHEL MOTORS | Cochabamba - Bolivia</p>
  </footer>

</div>

<style>
  /* --- VARIABLES Y RESET --- */
  :root {
    --primary: #003366;
    --primary-dark: #002244;
    --accent: #e63946;
    --bg: #f8f9fa;
    --white: #ffffff;
    --text: #333;
    --gray: #6c757d;
    --shadow: 0 4px 20px rgba(0,0,0,0.08);
  }

  .page-wrapper { background-color: var(--bg); min-height: 100vh; font-family: 'Segoe UI', system-ui, sans-serif; color: var(--text); }

  /* --- NAVBAR --- */
  .navbar { background: var(--white); padding: 15px 5%; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.05); position: sticky; top: 0; z-index: 100; }
  .brand { display: flex; align-items: center; gap: 10px; }
  .logo-icon { font-size: 24px; }
  .brand h1 { margin: 0; font-size: 1.2rem; font-weight: 800; color: var(--primary); letter-spacing: -0.5px; }
  .brand small { display: block; font-size: 0.75rem; color: var(--gray); text-transform: uppercase; letter-spacing: 1px; }
  .btn-ghost { background: transparent; border: 1px solid var(--primary); color: var(--primary); padding: 8px 16px; border-radius: 50px; font-weight: 600; cursor: pointer; transition: 0.2s; font-size: 0.9rem;}
  .btn-ghost:hover { background: var(--primary); color: var(--white); }

  /* --- CONTAINER & LAYOUT --- */
  .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
  
  .breadcrumb { margin-bottom: 20px; font-size: 0.9rem; color: var(--gray); }
  .breadcrumb button { background: none; border: none; color: var(--primary); cursor: pointer; padding: 0; font-weight: 600; }
  .breadcrumb .separator { margin: 0 10px; }

  .grid-layout { display: grid; grid-template-columns: 1.4fr 1fr; gap: 30px; align-items: start; }

  /* --- GALERÍA --- */
  .main-image-frame { width: 100%; aspect-ratio: 16/10; background: #eee; border-radius: 12px; overflow: hidden; position: relative; box-shadow: var(--shadow); }
  .main-img { width: 100%; height: 100%; object-fit: cover; }
  .placeholder-img { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--gray); font-size: 1.2rem; }
  
  .badges-overlay { position: absolute; top: 15px; left: 15px; display: flex; gap: 10px; }
  .badge-status { padding: 6px 12px; border-radius: 6px; font-weight: 700; font-size: 0.8rem; color: white; box-shadow: 0 2px 5px rgba(0,0,0,0.2); backdrop-filter: blur(4px); }
  .badge-status.bo { background: rgba(40, 167, 69, 0.9); }
  .badge-status.cl { background: rgba(255, 153, 0, 0.9); }
  .badge-status.usa { background: rgba(0, 51, 102, 0.9); }

  .thumbnails-scroll { display: flex; gap: 10px; margin-top: 15px; overflow-x: auto; padding-bottom: 5px; scrollbar-width: thin; }
  .thumb { width: 90px; height: 65px; object-fit: cover; border-radius: 8px; cursor: pointer; opacity: 0.6; transition: 0.3s; border: 2px solid transparent; }
  .thumb:hover, .thumb.active { opacity: 1; border-color: var(--primary); transform: translateY(-2px); }

  /* --- TARJETAS --- */
  .buy-card, .specs-card, .description-card { background: var(--white); padding: 25px; border-radius: 12px; box-shadow: var(--shadow); border: 1px solid #eee; }
  .description-card { margin-top: 30px; }

  /* --- BUY CARD (PRECIO Y CTA) --- */
  .vin { font-family: monospace; color: var(--gray); font-size: 0.85rem; letter-spacing: 1px; }
  .header-info h1 { margin: 5px 0 20px 0; font-size: 2rem; line-height: 1.1; color: var(--text); }
  .year { font-weight: 300; color: var(--gray); }

  .price-tag { margin-bottom: 25px; }
  .currency { font-size: 1.2rem; font-weight: 500; color: var(--gray); vertical-align: top; }
  .amount { font-size: 2.8rem; font-weight: 800; color: var(--primary); line-height: 1; }
  .subasta-tag { display: inline-block; font-size: 0.8rem; background: #eef2f7; color: var(--primary); padding: 4px 8px; border-radius: 4px; font-weight: 600; margin-left: 10px; vertical-align: middle; }

  .legal-alert { padding: 12px; border-radius: 8px; font-size: 0.9rem; margin-bottom: 25px; }
  .legal-alert.green { background: #d4edda; color: #155724; border-left: 4px solid #28a745; }
  .legal-alert.yellow { background: #fff3cd; color: #856404; border-left: 4px solid #ffc107; }

  .btn-cta { width: 100%; background: #25D366; color: white; border: none; padding: 16px; border-radius: 8px; font-size: 1.1rem; font-weight: 700; cursor: pointer; transition: transform 0.2s, background 0.2s; display: flex; align-items: center; justify-content: center; gap: 10px; }
  .btn-cta:hover { background: #128C7E; transform: translateY(-3px); box-shadow: 0 5px 15px rgba(37, 211, 102, 0.3); }

  .asesor-mini { display: flex; align-items: center; gap: 10px; margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; }
  .avatar { width: 40px; height: 40px; background: var(--primary); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.2rem; }
  .asesor-mini .datos { display: flex; flex-direction: column; font-size: 0.9rem; }
  .asesor-mini span { color: var(--gray); font-size: 0.8rem; }

  /* --- SPECS GRID --- */
  .specs-card { margin-top: 20px; }
  .specs-card h3, .description-card h3 { margin-top: 0; font-size: 1.1rem; color: var(--primary); border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; margin-bottom: 15px; }
  
  .specs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .spec-item { display: flex; align-items: center; gap: 12px; }
  .spec-item .icon { font-size: 1.5rem; background: #f0f4f8; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 8px; }
  .spec-item div { display: flex; flex-direction: column; }
  .spec-item small { color: var(--gray); font-size: 0.75rem; text-transform: uppercase; }
  .spec-item strong { color: var(--text); font-size: 0.95rem; }

  .description-card p { line-height: 1.6; color: #555; }

  .footer { text-align: center; padding: 40px 20px; color: var(--gray); font-size: 0.9rem; margin-top: 40px; border-top: 1px solid #eee; }

  @media (max-width: 850px) {
    .grid-layout { grid-template-columns: 1fr; }
    .main-image-frame { aspect-ratio: 4/3; }
    .header-info h1 { font-size: 1.6rem; }
  }
</style>