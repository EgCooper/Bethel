<script>
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  export let auto; // Recibimos el auto seleccionado

  // --- 1. LÓGICA DE GALERÍA DE IMÁGENES ---
  // Detectamos si tiene galería nueva o foto vieja
  let tieneGaleria = auto.imagenes && auto.imagenes.length > 0;
  // La imagen grande empieza siendo la primera de la lista o la antigua
  let imagenGrande = tieneGaleria ? auto.imagenes[0] : (auto.imagen_url || '');

  function cambiarImagen(img) {
    imagenGrande = img;
  }

  // --- 2. LÓGICA DE PRECIO SEGURO (ANTI-CRASH) ---
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

  // --- 3. NAVEGACIÓN ---
  function volver() {
    dispatch('volver');
  }

  function irAlLogin() {
    dispatch('irLogin');
  }

  // --- 4. WHATSAPP INTELIGENTE ---
  function contactar() {
    // A. Número por defecto (Central de Bethel)
    let telefonoDestino = "59162512418"; // Pon tu número central aquí
    let nombreDestino = "Bethel Motors";
    
    // B. Si el auto tiene un asesor asignado, usamos sus datos
    if (auto.asesor_id && auto.asesor_id.telefono) {
        telefonoDestino = auto.asesor_id.telefono;
        nombreDestino = auto.asesor_id.nombre;
    }

    // Limpieza del número
    telefonoDestino = telefonoDestino.replace(/\D/g, ''); // Solo números
    if (telefonoDestino.length === 8) telefonoDestino = '591' + telefonoDestino;

    // Mensaje con salto de línea (%0A)
    const mensaje = `Hola *${nombreDestino}*, me interesa el vehículo de la web:%0A%0A` +
                    `🚘 *${auto.marca} ${auto.modelo} ${auto.año}*%0A` +
                    `💰 Precio: ${formatearPrecio()} ${obtenerMoneda()}%0A` +
                    `📍 Ubicación: ${auto.ubicacion}%0A` +
                    `🆔 Ref: ${auto.vin ? auto.vin.slice(-6) : 'N/A'}%0A%0A` +
                    `¿Sigue disponible?`;
    
    const url = `https://wa.me/${telefonoDestino}?text=${mensaje}`; // No uses encodeURIComponent completo aquí si usas %0A manuales
    window.open(url, '_blank');
  }
</script>

<div class="page-wrapper">
  
  <header class="public-header">
    <div class="brand">
      <h1>BETHEL MOTORS</h1>
      <p>Importación Directa & Stock Disponible</p>
    </div>
    <button class="btn-login" on:click={irAlLogin}>
      🔒 Soy Asesor
    </button>
  </header>

  <div class="detalle-container">
    
    <div class="top-bar">
      <button class="btn-volver" on:click={volver}>
         &larr; Volver al Catálogo
      </button>
    </div>

    <div class="ficha-layout">
      
      <div class="media-section">
        
        <div class="img-container">
          {#if imagenGrande}
            <img src={imagenGrande} alt={auto.modelo}>
          {:else}
            <div class="no-img">Sin Imagen Disponible</div>
          {/if}
          
          <span class="etiqueta-estado {auto.ubicacion.includes('Bolivia') ? 'bo' : auto.ubicacion.includes('Iquique') ? 'cl' : 'usa'}">
            {auto.ubicacion}
          </span>
        </div>

        {#if tieneGaleria && auto.imagenes.length > 1}
            <div class="thumbnails">
                {#each auto.imagenes as img}
                    <img 
                        src={img} 
                        alt="thumb" 
                        class:active={imagenGrande === img}
                        on:click={() => cambiarImagen(img)} 
                    >
                {/each}
            </div>
        {/if}

        <div class="price-box">
          <h3>Precio de Venta</h3>
          <p class="precio-grande">
              {formatearPrecio()} <span class="moneda-grande">{obtenerMoneda()}</span>
              
              {#if auto.ubicacion.includes('USA')}
                  <small class="ref">(Referencial Subasta)</small>
              {/if}
          </p>
          
          <button class="btn-whatsapp" on:click={contactar}>
             📲 Me interesa este vehículo
          </button>

          {#if auto.asesor_id && auto.asesor_id.nombre}
            <p class="asesor-info">
              <small>Atendido por: <strong>{auto.asesor_id.nombre}</strong></small>
            </p>
          {/if}
        </div>
      </div>

      <div class="info-section">
        <h1>{auto.marca} {auto.modelo} <span class="anio-titulo">{auto.año}</span></h1>
        <p class="subtitulo-vin">VIN / Chasis: {auto.vin}</p>

        <div class="specs-grid">
          <div class="spec-item">
              <span class="label">Kilometraje</span>
              <span class="value">{auto.kilometraje ? auto.kilometraje.toLocaleString() + ' km' : 'No esp.'}</span>
          </div>
          <div class="spec-item">
              <span class="label">Transmisión</span>
              <span class="value">{auto.transmision}</span>
          </div>
          <div class="spec-item">
              <span class="label">Combustible</span>
              <span class="value">{auto.tipo_combustible}</span>
          </div>
          <div class="spec-item">
              <span class="label">Color Exterior</span>
              <span class="value">{auto.color}</span>
          </div>
          
          <div class="spec-item">
              <span class="label">Situación Legal</span>
              <span class="value badge-legal {auto.situacion_legal?.includes('Despachado') ? 'ok' : 'warn'}">
                {auto.situacion_legal || 'Sin Datos'}
              </span>
          </div>
          
          {#if auto.placa}
          <div class="spec-item">
              <span class="label">Placa</span>
              <span class="value highlight">{auto.placa}</span>
          </div>
          {/if}
          
          <div class="spec-item">
              <span class="label">Condición</span>
              <span class="value">{auto.estado_vehiculo}</span>
          </div>
        </div>

        {#if auto.descripcion}
          <div class="descripcion-box">
              <h4>Descripción Adicional</h4>
              <p>{auto.descripcion}</p>
          </div>
        {/if}

      </div>
    </div>
  </div>

  <footer class="public-footer">
    <p>© 2026 BETHEL MOTORS | Cochabamba, Bolivia</p>
  </footer>

</div>

<style>
  /* ESTILOS ESTRUCTURALES */
  .page-wrapper { background: #f9f9f9; min-height: 100vh; font-family: 'Segoe UI', sans-serif; display: flex; flex-direction: column; }
  
  /* HEADER */
  .public-header { 
    background: #003366; color: white; padding: 15px 30px; 
    display: flex; justify-content: space-between; align-items: center; 
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }
  .brand h1 { margin: 0; font-size: 1.5rem; letter-spacing: 1px; }
  .brand p { margin: 0; font-size: 0.8rem; opacity: 0.8; }
  
  .btn-login { 
    background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); 
    color: white; padding: 8px 15px; border-radius: 20px; cursor: pointer; transition: 0.3s; 
  }
  .btn-login:hover { background: white; color: #003366; }

  /* CONTENIDO */
  .detalle-container { max-width: 1100px; margin: 30px auto; padding: 0 20px; flex: 1; width: 100%; box-sizing: border-box; }
  
  .top-bar { margin-bottom: 20px; }
  .btn-volver { background: none; border: none; color: #003366; font-weight: bold; cursor: pointer; font-size: 1rem; padding: 0; display: flex; align-items: center; gap: 5px; }
  .btn-volver:hover { text-decoration: underline; }

  .ficha-layout { display: grid; grid-template-columns: 1.2fr 1fr; gap: 40px; }

  /* IMAGEN */
  .img-container { width: 100%; height: 400px; background: #eee; border-radius: 10px; overflow: hidden; position: relative; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
  .img-container img { width: 100%; height: 100%; object-fit: cover; }
  .no-img { display: flex; align-items: center; justify-content: center; height: 100%; color: #777; font-weight: bold; }

  .etiqueta-estado { position: absolute; top: 20px; left: 20px; padding: 8px 15px; color: white; font-weight: bold; border-radius: 5px; text-transform: uppercase; letter-spacing: 1px; font-size: 0.8rem;}
  .etiqueta-estado.bo { background: #28a745; }
  .etiqueta-estado.usa { background: #003366; }
  .etiqueta-estado.cl { background: #ff9900; }

  /* GALERÍA THUMBNAILS */
  .thumbnails { display: flex; gap: 10px; margin-top: 15px; overflow-x: auto; padding-bottom: 5px; }
  .thumbnails img { width: 80px; height: 60px; object-fit: cover; border-radius: 6px; cursor: pointer; opacity: 0.6; transition: 0.2s; border: 2px solid transparent; }
  .thumbnails img:hover, .thumbnails img.active { opacity: 1; border-color: #003366; transform: translateY(-2px); }

  /* PRECIO */
  .price-box { background: white; padding: 25px; border-radius: 10px; margin-top: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border: 1px solid #eee; text-align: center; }
  .price-box h3 { margin: 0; color: #555; font-size: 0.9rem; text-transform: uppercase; }
  .precio-grande { color: #003366; font-size: 2.5rem; font-weight: bold; margin: 10px 0 20px 0; display: flex; align-items: center; justify-content: center; gap: 5px; flex-wrap: wrap;}
  .moneda-grande { font-size: 1.2rem; color: #555; font-weight: normal; }
  .ref { display: block; width: 100%; font-size: 1rem; color: #777; font-weight: normal; margin-top: 5px; }

  .btn-whatsapp { background: #003366; color: white; border: none; padding: 15px; width: 100%; border-radius: 6px; font-size: 1.1rem; font-weight: bold; cursor: pointer; transition: background 0.2s; }
  .btn-whatsapp:hover { background: #002244; }
  
  .asesor-info { margin-top: 10px; color: #666; font-size: 0.85rem; border-top: 1px solid #eee; padding-top: 10px; }

  /* INFO TEXTO */
  .info-section h1 { margin: 0; color: #333; font-size: 2.2rem; line-height: 1.2; }
  .anio-titulo { color: #777; font-weight: normal; }
  .subtitulo-vin { color: #888; margin-top: 10px; font-family: monospace; font-size: 1.1rem; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px; }

  .specs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
  .spec-item { display: flex; flex-direction: column; }
  .spec-item .label { font-size: 0.85rem; color: #777; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; }
  .spec-item .value { font-size: 1.1rem; color: #333; font-weight: 500; border-bottom: 1px solid #f0f0f0; padding-bottom: 5px; }

  .badge-legal { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.95rem; width: fit-content; }
  .badge-legal.ok { background: #d4edda; color: #155724; }
  .badge-legal.warn { background: #fff3cd; color: #856404; }
  .highlight { font-weight: bold; color: #003366; }

  .descripcion-box { background: #eef2f6; padding: 20px; border-radius: 8px; border-left: 4px solid #003366; }
  .descripcion-box h4 { margin-top: 0; color: #003366; margin-bottom: 10px; }
  .descripcion-box p { margin: 0; color: #555; line-height: 1.6; }

  /* FOOTER */
  .public-footer { text-align: center; padding: 30px; color: #aaa; font-size: 0.9rem; margin-top: 50px; border-top: 1px solid #eee; background: white; }

  @media (max-width: 800px) {
    .ficha-layout { grid-template-columns: 1fr; }
    .img-container { height: 250px; }
    .public-header { flex-direction: column; text-align: center; gap: 10px; }
  }
</style>