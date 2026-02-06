<script>
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  export let auto; 

  // --- LÓGICA DE GALERÍA Y PRECIOS ---
  let tieneGaleria = auto.imagenes && auto.imagenes.length > 0;
  
  // Controlamos el índice (posición) de la foto actual
  let indiceActual = 0;
  let imagenGrande = tieneGaleria ? auto.imagenes[0] : (auto.imagen_url || '');

  function seleccionarImagen(index) {
    indiceActual = index;
    imagenGrande = auto.imagenes[index];
  }

  function siguienteImagen(e) {
    e.stopPropagation();
    if (!tieneGaleria) return;
    if (indiceActual < auto.imagenes.length - 1) {
        indiceActual++;
    } else {
        indiceActual = 0; 
    }
    imagenGrande = auto.imagenes[indiceActual];
  }

  function anteriorImagen(e) {
    e.stopPropagation();
    if (!tieneGaleria) return;
    if (indiceActual > 0) {
        indiceActual--;
    } else {
        indiceActual = auto.imagenes.length - 1; 
    }
    imagenGrande = auto.imagenes[indiceActual];
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

  // Volver al Home (Catálogo)
  function volver() { dispatch('volver'); }
  function irAlLogin() { dispatch('irLogin'); }

  function contactar() {
    let telefonoDestino = "59162512418"; 
    let nombreDestino = "Bethel Motors";
    
    if (auto.asesor_id && auto.asesor_id.telefono) {
        telefonoDestino = auto.asesor_id.telefono;
        nombreDestino = auto.asesor_id.nombre;
    }

    telefonoDestino = telefonoDestino.replace(/\D/g, '');
    if (telefonoDestino.length === 8) telefonoDestino = '591' + telefonoDestino;

    const mensaje = `Hola *${nombreDestino}*, me interesa:%0A%0A` +
                    `🚘 *${auto.marca} ${auto.modelo} ${auto.año}*%0A` +
                    `💰 Precio: ${formatearPrecio()} ${obtenerMoneda()}%0A` +
                    `🆔 Ref: ${auto.vin ? auto.vin.slice(-6) : 'N/A'}%0A` +
                    `¿Sigue disponible?`;
    
    window.open(`https://wa.me/${telefonoDestino}?text=${mensaje}`, '_blank');
  }
</script>

<div class="page-wrapper">
  
  <header class="hero-header">
    <div class="header-content">
      
      <div class="brand" on:click={volver} title="Volver al Inicio">
        <h1>BETHEL MOTORS</h1>
        <small>Importación & Calidad Garantizada</small>
      </div>

      <button class="btn-login" on:click={irAlLogin}>Soy Asesor 🔒</button>
    </div>
  </header>

  <main class="container">
    
    <div class="top-nav">
      <button class="btn-back" on:click={volver}>&larr; Volver al Stock</button>
      <span class="ref">REF: {auto.vin ? auto.vin.slice(-8) : 'N/A'}</span>
    </div>

    <div class="split-layout">
      
      <div class="left-col">
        
        <div class="gallery-block">
            <div class="main-image">
                {#if tieneGaleria && auto.imagenes.length > 1}
                    <button class="nav-btn prev" on:click={anteriorImagen}>&#10094;</button>
                {/if}

                {#if imagenGrande}
                    <img src={imagenGrande} alt={auto.modelo}>
                {:else}
                    <div class="no-img">Sin Foto</div>
                {/if}

                {#if tieneGaleria && auto.imagenes.length > 1}
                    <button class="nav-btn next" on:click={siguienteImagen}>&#10095;</button>
                {/if}

                <div class="badges">
                    <span class="badge-loc {auto.ubicacion.includes('Bolivia') ? 'bo' : auto.ubicacion.includes('Iquique') ? 'cl' : 'usa'}">
                        {auto.ubicacion}
                    </span>
                </div>
            </div>
            
            {#if tieneGaleria && auto.imagenes.length > 1}
                <div class="thumbs-grid">
                    {#each auto.imagenes as img, index}
                        <img 
                            src={img} 
                            alt="thumb" 
                            class:active={indiceActual === index}
                            on:click={() => seleccionarImagen(index)}
                        >
                    {/each}
                </div>
            {/if}
        </div>

        <div class="desc-block">
            <h3>📝 Información Detallada</h3>
            <p>{auto.descripcion || "Consulta con nuestros asesores para más detalles sobre este vehículo."}</p>
        </div>
      </div>

      <div class="right-col">
        
        <div class="info-card">
            <div class="card-header">
                <small class="brand-tag">{auto.marca}</small>
                <h1>{auto.modelo} <span class="year">{auto.año}</span></h1>
            </div>

            <div class="price-section">
                <div class="price-row">
                    <span class="symbol">{obtenerMoneda()}</span>
                    <span class="amount">{formatearPrecio()}</span>
                </div>
                {#if auto.ubicacion.includes('USA')}
                    <div class="subasta-notice">⚠️ Precio Referencial Subasta</div>
                {/if}
            </div>

            <button class="btn-action" on:click={contactar}>
                <span class="icon"></span> Consultar Disponibilidad
            </button>

            {#if auto.asesor_id}
                <div class="asesor-row">
                    <div class="avatar">{auto.asesor_id.nombre[0]}</div>
                    <div class="asesor-details">
                        <span>Publicado por:</span>
                        <strong>{auto.asesor_id.nombre}</strong>
                    </div>
                </div>
            {/if}

            <hr class="divider">

            <div class="specs-list">
                <div class="spec-row">
                    <span>Transmisión</span>
                    <strong>{auto.transmision}</strong>
                </div>
                <div class="spec-row">
                    <span>Combustible</span>
                    <strong>{auto.tipo_combustible}</strong>
                </div>
                <div class="spec-row">
                    <span>Kilometraje</span>
                    <strong>{auto.kilometraje ? auto.kilometraje.toLocaleString() : '--'} km</strong>
                </div>
                <div class="spec-row">
                    <span>Color</span>
                    <strong>{auto.color}</strong>
                </div>
                <div class="spec-row">
                    <span>Estado</span>
                    <strong>{auto.estado_vehiculo}</strong>
                </div>
            </div>

            <div class="legal-box {auto.situacion_legal?.includes('Despachado') ? 'ok' : 'pending'}">
                <div class="legal-title">Situación Legal</div>
                <div class="legal-val">{auto.situacion_legal || 'No especificado'}</div>
                {#if auto.placa}
                    <div class="placa-tag">Placa: {auto.placa}</div>
                {/if}
            </div>

        </div>
      </div>

    </div>
  </main>

  <footer class="footer">
    <p>© 2026 BETHEL MOTORS | Cochabamba - Bolivia</p>
  </footer>

</div>

<style>
  /* --- BASE --- */
  .page-wrapper { background: #f3f5f7; min-height: 100vh; font-family: 'Segoe UI', sans-serif; display: flex; flex-direction: column; }

  /* --- HEADER --- */
  .hero-header { 
    background: linear-gradient(135deg, #003366 0%, #001a33 100%); 
    color: white; padding: 15px 0; box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  }
  .header-content { max-width: 1200px; margin: 0 auto; padding: 0 20px; display: flex; justify-content: space-between; align-items: center; }
  
  /* MARCA CLIQUEABLE */
  .brand { cursor: pointer; transition: opacity 0.2s; }
  .brand:hover { opacity: 0.8; }
  
  .brand h1 { margin: 0; font-size: 1.4rem; letter-spacing: 1px; }
  .brand small { color: #ccc; font-size: 0.75rem; }

  .btn-login { 
    background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); 
    color: white; padding: 5px 12px; border-radius: 20px; cursor: pointer; font-size: 0.8rem; transition: 0.3s;
  }
  .btn-login:hover { background: white; color: #003366; }

  /* --- CONTAINER --- */
  .container { max-width: 1150px; margin: 0 auto; padding: 20px; width: 100%; box-sizing: border-box; flex: 1; }

  .top-nav { display: flex; justify-content: space-between; margin-bottom: 15px; align-items: center; }
  .btn-back { background: none; border: none; color: #666; font-weight: 600; cursor: pointer; font-size: 0.95rem; }
  .btn-back:hover { color: #003366; text-decoration: underline; }
  .ref { font-family: monospace; color: #999; font-size: 0.85rem; }

  /* --- SPLIT LAYOUT --- */
  .split-layout { display: grid; grid-template-columns: 1.5fr 1fr; gap: 30px; align-items: start; }

  /* --- GALERÍA --- */
  .gallery-block { background: white; border-radius: 12px; padding: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
  
  .main-image { 
    position: relative; width: 100%; height: 450px; 
    background: #e9ecef; border-radius: 8px; overflow: hidden; 
    display: flex; align-items: center; justify-content: center;
  }
  .main-image img { width: 100%; height: 100%; object-fit: contain; }
  
  .no-img { height: 100%; display: flex; align-items: center; justify-content: center; color: #888; }

  .nav-btn {
    position: absolute; top: 50%; transform: translateY(-50%);
    background: rgba(0, 0, 0, 0.4); color: white; border: none;
    width: 40px; height: 40px; border-radius: 50%;
    font-size: 1.2rem; cursor: pointer; transition: 0.3s;
    display: flex; align-items: center; justify-content: center;
    user-select: none; z-index: 10;
  }
  .nav-btn:hover { background: rgba(0, 33, 66, 0.9); }
  .prev { left: 10px; }
  .next { right: 10px; }

  .badges { position: absolute; top: 15px; left: 15px; }
  .badge-loc { padding: 6px 12px; border-radius: 4px; color: white; font-weight: bold; font-size: 0.8rem; text-transform: uppercase; box-shadow: 0 2px 5px rgba(0,0,0,0.3); }
  .badge-loc.bo { background: #28a745; } .badge-loc.cl { background: #ff9900; } .badge-loc.usa { background: #003366; }

  .thumbs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 10px; margin-top: 10px; }
  .thumbs-grid img { width: 100%; height: 60px; object-fit: cover; border-radius: 6px; cursor: pointer; opacity: 0.6; transition: 0.2s; border: 2px solid transparent; }
  .thumbs-grid img:hover, .thumbs-grid img.active { opacity: 1; border-color: #003366; }

  .desc-block { margin-top: 30px; background: white; padding: 25px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
  .desc-block h3 { margin: 0 0 15px 0; font-size: 1.1rem; color: #003366; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; }
  .desc-block p { color: #555; line-height: 1.6; }

  /* --- INFO CARD --- */
  .info-card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 5px 25px rgba(0,0,0,0.08); position: sticky; top: 20px; }
  
  .card-header { margin-bottom: 20px; }
  .brand-tag { text-transform: uppercase; color: #888; font-weight: 700; font-size: 0.8rem; letter-spacing: 1px; }
  .card-header h1 { margin: 5px 0 0 0; font-size: 1.8rem; line-height: 1.2; color: #222; }
  .year { color: #666; font-weight: normal; }

  .price-section { margin-bottom: 25px; }
  .price-row { display: flex; align-items: flex-start; gap: 5px; }
  .symbol { font-size: 1.5rem; font-weight: 500; color: #555; margin-top: 5px; }
  .amount { font-size: 3rem; font-weight: 800; color: #003366; line-height: 1; }
  .subasta-notice { font-size: 0.8rem; background: #eef2f6; color: #555; padding: 5px 10px; border-radius: 4px; display: inline-block; margin-top: 8px; font-weight: 600; }

  .btn-action { width: 100%; background: #003366; color: white; border: none; padding: 18px; border-radius: 8px; font-size: 1.1rem; font-weight: bold; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 4px 15px rgba(0, 51, 102, 0.3); }
  .btn-action:hover { background: #002244; transform: translateY(-3px); }

  .asesor-row { margin-top: 20px; display: flex; align-items: center; gap: 12px; padding: 10px; background: #f9f9f9; border-radius: 8px; }
  .avatar { width: 36px; height: 36px; background: #28a745; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; }
  .asesor-details { display: flex; flex-direction: column; font-size: 0.9rem; }
  .asesor-details span { font-size: 0.75rem; color: #888; }

  .divider { margin: 25px 0; border: none; border-top: 1px solid #eee; }

  .specs-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 25px; }
  .spec-row { display: flex; justify-content: space-between; font-size: 0.95rem; }
  .spec-row span { color: #777; }
  .spec-row strong { color: #333; }

  .legal-box { padding: 15px; border-radius: 8px; font-size: 0.9rem; }
  .legal-box.ok { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
  .legal-box.pending { background: #fff3cd; color: #856404; border: 1px solid #ffeeba; }
  .legal-title { font-weight: bold; margin-bottom: 3px; font-size: 0.8rem; text-transform: uppercase; }
  .placa-tag { margin-top: 5px; font-weight: bold; background: rgba(0,0,0,0.05); padding: 2px 6px; border-radius: 4px; display: inline-block; }

  .footer { text-align: center; padding: 30px; color: #aaa; font-size: 0.9rem; margin-top: 30px; }

  @media (max-width: 900px) {
    .split-layout { grid-template-columns: 1fr; }
    .main-image { height: 300px; }
    .info-card { position: static; }
  }
</style>