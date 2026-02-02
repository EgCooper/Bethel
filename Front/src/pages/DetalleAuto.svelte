<script>
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  export let auto; 

  function volver() {
    dispatch('volver');
  }

  function irAlLogin() {
    dispatch('irLogin');
  }

  function contactar() {
    // 1. Definimos un número por defecto (Gerencia/Central)
    // Úsalo si el auto es antiguo y no tiene dueño asignado
    const numeroCentral = "59162512418"; 

    // 2. Variables iniciales
    let telefonoDestino = numeroCentral;
    let nombreDestino = "Aerebetel";
    
    // 3. Verificamos si hay un asesor asignado con teléfono
    if (auto.asesor_id && auto.asesor_id.telefono) {
        telefonoDestino = auto.asesor_id.telefono;
        nombreDestino = auto.asesor_id.nombre;
    }

    // 4. Limpiamos el número (quitamos espacios, guiones, símbolos)
    telefonoDestino = telefonoDestino.replace(/\D/g, '');
    
    // 5. Si falta el código de país (Bolivia 591), lo agregamos
    if (telefonoDestino.length === 8) {
        telefonoDestino = '591' + telefonoDestino;
    }

    // 6. Mensaje Personalizado
    const mensaje = `Hola *${nombreDestino}*, vi el *${auto.marca} ${auto.modelo} ${auto.año}* (Ref: ${auto.vin.slice(-6)}) en la web y me interesa. ¿Sigue disponible?`;
    
    const url = `https://wa.me/${telefonoDestino}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  }
</script>

<div class="page-wrapper">
  
  <header class="public-header">
    <div class="brand">
      <h1>AEREBETEL MOTORS</h1>
      <p>Importacion Directa & Stock Disponible</p>
    </div>
    <button class="btn-login" on:click={irAlLogin}>
      🔒 Soy Asesor
    </button>
  </header>

  <div class="detalle-container">
    
    <div class="top-bar">
      <button class="btn-volver" on:click={volver}>
         &larr; Volver al Catalogo
      </button>
    </div>

    <div class="ficha-layout">
      
      <div class="media-section">
        <div class="img-container">
          {#if auto.imagen_url}
            <img src={auto.imagen_url} alt={auto.modelo}>
          {:else}
            <div class="no-img">Sin Imagen Disponible</div>
          {/if}
          
          <span class="etiqueta-estado {auto.ubicacion.includes('Bolivia') ? 'bo' : 'usa'}">
            {auto.ubicacion}
          </span>
        </div>

        <div class="price-box">
          <h3>Precio de Venta</h3>
          <p class="precio-grande">
              $ {auto.precio_usd.toLocaleString('en-US')}
              {#if auto.ubicacion.includes('USA')}
                  <small class="ref">(Referencial Subasta)</small>
              {/if}
          </p>
          <button class="btn-whatsapp" on:click={contactar}>
             Me interesa este vehiculo
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
        <p class="subtitulo-vin">SN: {auto.vin}</p>

        <div class="specs-grid">
          <div class="spec-item">
              <span class="label">Kilometraje</span>
              <span class="value">{auto.kilometraje ? auto.kilometraje.toLocaleString() + ' km' : 'No esp.'}</span>
          </div>
          <div class="spec-item">
              <span class="label">Transmision</span>
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
              <span class="label">Condicion</span>
              <span class="value">{auto.estado_vehiculo}</span>
          </div>
          <div class="spec-item">
              <span class="label">Ubicacion</span>
              <span class="value">{auto.ubicacion}</span>
          </div>
        </div>

        {#if auto.descripcion}
          <div class="descripcion-box">
              <h4>Descripcion Adicional</h4>
              <p>{auto.descripcion}</p>
          </div>
        {/if}

      </div>
    </div>
  </div>

  <footer class="public-footer">
    <p>© 2026 AEREBETEL MOTORS | Cochabamba, Bolivia</p>
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

  .etiqueta-estado { position: absolute; top: 20px; left: 20px; padding: 8px 15px; color: white; font-weight: bold; border-radius: 5px; text-transform: uppercase; letter-spacing: 1px; }
  .etiqueta-estado.bo { background: #28a745; }
  .etiqueta-estado.usa { background: #003366; }

  /* PRECIO */
  .price-box { background: white; padding: 25px; border-radius: 10px; margin-top: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border: 1px solid #eee; text-align: center; }
  .price-box h3 { margin: 0; color: #555; font-size: 0.9rem; text-transform: uppercase; }
  .precio-grande { color: #003366; font-size: 2.5rem; font-weight: bold; margin: 10px 0 20px 0; }
  .ref { display: block; font-size: 1rem; color: #777; font-weight: normal; margin-top: 5px; }

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