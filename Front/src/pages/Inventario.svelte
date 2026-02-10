<script>
  import { onMount, createEventDispatcher } from "svelte";
  import axios from "axios";
  import Swal from "sweetalert2";

  const dispatch = createEventDispatcher();
  
  let vehiculos = [];
  let cargando = true;
  let idEdicion = null; 

  // Variables para manejo de archivos
  let archivosSeleccionados = [];
  let previsualizaciones = [];
  
  // REFERENCIA AL INPUT
  let inputFotos;

  // Objeto formulario
  let nuevoAuto = {
    marca: "", modelo: "", año: "", vin: "", precio: "", moneda: "USD",
    kilometraje: "", color: "", tipo_combustible: "Gasolina",
    transmision: "Automatica", estado_vehiculo: "Usado",
    ubicacion: "USA (Subasta)", situacion_legal: "No Despachado (Sin Papeles)",
    placa: "", descripcion: ""
  };

  onMount(cargarInventario);

  // ✅ FUNCIÓN VOLVER
  function volver() {
    dispatch('volver');
  }

  function cotizarAuto(auto) { dispatch('cotizar', { auto }); }

  function verEnWeb(id) {
    window.open(`/detalles/${id}`, '_blank');
  }

  async function cargarInventario() {
    try {
      const res = await axios.get("/api/vehiculos");
      vehiculos = res.data.reverse();
      cargando = false;
    } catch (error) { console.error(error); cargando = false; }
  }

  function alSeleccionarArchivos(event) {
    const files = event.target.files;
    if (files.length > 12) {
        Swal.fire({ title: "¡Demasiadas fotos!", text: "El límite máximo es de 12 fotos.", icon: "warning", confirmButtonColor: "#003366" });
        if (inputFotos) inputFotos.value = ""; 
        archivosSeleccionados = []; previsualizaciones = []; return;
    }
    if (files) {
      archivosSeleccionados = Array.from(files);
      previsualizaciones = archivosSeleccionados.map(file => URL.createObjectURL(file));
    }
  }

  function cargarDatosEdicion(auto) {
    nuevoAuto = { 
        ...auto, 
        precio: auto.precio || auto.precio_usd, 
        moneda: auto.moneda || 'USD',
        situacion_legal: auto.situacion_legal || "No Despachado (Sin Papeles)", 
        placa: auto.placa || ""
    }; 
    idEdicion = auto._id; 
    archivosSeleccionados = []; previsualizaciones = [];
    if (inputFotos) inputFotos.value = "";
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelarEdicion() { limpiarFormulario(); }

  function limpiarFormulario() {
    nuevoAuto = { marca: "", modelo: "", año: "", vin: "", precio: "", moneda: "USD", kilometraje: "", color: "", tipo_combustible: "Gasolina", transmision: "Automatica", estado_vehiculo: "Usado", ubicacion: "USA (Subasta)", situacion_legal: "No Despachado (Sin Papeles)", placa: "", descripcion: "" };
    idEdicion = null; archivosSeleccionados = []; previsualizaciones = [];
    if (inputFotos) inputFotos.value = "";
  }

  async function guardarAuto() {
    if (!nuevoAuto.marca || !nuevoAuto.modelo || !nuevoAuto.precio || !nuevoAuto.vin) {
      return Swal.fire({ title: "Campos Incompletos", text: "Llena los datos obligatorios (Marca, Modelo, Precio, VIN).", icon: "warning", confirmButtonColor: "#003366" });
    }

    try {
      Swal.fire({ title: 'Procesando...', text: 'Guardando información...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

      if (idEdicion) {
        await axios.put(`/api/vehiculos/${idEdicion}`, nuevoAuto);
        Swal.fire({ title: "Actualizado", icon: "success", confirmButtonColor: "#003366" });
      } else {
        const formData = new FormData();
        Object.keys(nuevoAuto).forEach(key => {
            if (key === 'año') formData.append('anio', nuevoAuto[key]);
            formData.append(key, nuevoAuto[key]);
        });
        archivosSeleccionados.forEach(archivo => formData.append('fotos', archivo));

        await axios.post("/api/vehiculos", formData);
        Swal.fire({ title: "Guardado", icon: "success", confirmButtonColor: "#003366" });
      }
      
      limpiarFormulario(); 
      cargarInventario();
    } catch (error) {
      console.error(error);
      Swal.fire({ title: "Error", text: error.response?.data?.error || "Error al guardar en el servidor", icon: "error", confirmButtonColor: "#003366" });
    }
  }

  async function eliminarAuto(id) {
    const confirm = await Swal.fire({ title: "¿Eliminar?", text: "Esta acción no se puede deshacer.", icon: "warning", showCancelButton: true, confirmButtonColor: "#d33", cancelButtonColor: "#3085d6", confirmButtonText: "Sí, eliminar" });
    if (confirm.isConfirmed) {
      try { await axios.delete(`/api/vehiculos/${id}`); if (idEdicion === id) limpiarFormulario(); cargarInventario(); Swal.fire({ title: "Eliminado", icon: "success", confirmButtonColor: "#003366" }); } catch (error) { Swal.fire({ title: "Error", icon: "error" }); }
    }
  }
</script>

<svelte:head>
  <title>Bethel Motors - Inventario</title>
</svelte:head>

<div class="page-container">

  <div class="header-flex">
    <button class="btn-volver" on:click={volver}>← Volver</button>
    <h2 class="page-title">Gestión de Inventario</h2>
    <div style="width: 80px;"></div> </div>

  <div class="layout-grid">
    
    <div class="panel form-panel {idEdicion ? 'editando' : ''}">
      <div class="form-header">
        <h3>{idEdicion ? '✏️ Editar Vehículo' : '➕ Nuevo Registro'}</h3>
        {#if idEdicion}
          <button class="btn-text-cancel" on:click={cancelarEdicion}>Cancelar</button>
        {/if}
      </div>
      
      <form on:submit|preventDefault={guardarAuto} class="modern-form">
        <div class="form-row">
          <div class="input-group">
            <label>Marca</label>
            <input type="text" bind:value={nuevoAuto.marca} placeholder="Ej: Toyota" required>
          </div>
          <div class="input-group">
            <label>Modelo</label>
            <input type="text" bind:value={nuevoAuto.modelo} placeholder="Ej: Hilux" required>
          </div>
        </div>

        <div class="form-row">
          <div class="input-group">
            <label>Año</label>
            <input type="number" bind:value={nuevoAuto.año} placeholder="2024" required>
          </div>
          
          <div class="input-group">
            <label>Precio de Venta</label>
            <div class="precio-wrapper">
                <input type="number" bind:value={nuevoAuto.precio} placeholder="0.00" required>
                <select bind:value={nuevoAuto.moneda} class="currency-select">
                    <option value="USD">USD ($)</option>
                    <option value="BOB">BOB (Bs)</option>
                </select>
            </div>
          </div>
        </div>

        <div class="input-group">
            <label>Situación Legal</label>
            <select bind:value={nuevoAuto.situacion_legal}>
                <option value="No Despachado (Sin Papeles)">Sin Papeles / No Despachado</option>
                <option value="En Trámite (Aduana)">En Trámite (Aduana)</option>
                <option value="Despachado (Con Papeles)">Despachado (Con Papeles)</option>
            </select>
        </div>

        <div class="input-group">
            <label>Placa (Opcional)</label>
            <input type="text" bind:value={nuevoAuto.placa} placeholder="Ej: 4055-AAA">
        </div>

        <div class="form-row">
          <div class="input-group">
            <label>VIN (Chasis)</label>
            <input type="text" bind:value={nuevoAuto.vin} placeholder="Serie del Chasis" required class="mono-font">
          </div>
          <div class="input-group">
            <label>Kilometraje</label>
            <input type="number" bind:value={nuevoAuto.kilometraje} placeholder="Ej: 15000" required>
          </div>
        </div>

        <div class="form-row">
          <div class="input-group">
            <label>Color</label>
            <input type="text" bind:value={nuevoAuto.color} placeholder="Ej: Blanco" required>
          </div>
          <div class="input-group">
            <label>Transmisión</label>
            <select bind:value={nuevoAuto.transmision}>
                <option>Automatica</option>
                <option>Manual</option>
                <option>CVT</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="input-group">
            <label>Combustible</label>
            <select bind:value={nuevoAuto.tipo_combustible}>
                <option>Gasolina</option>
                <option>Diesel</option>
                <option>Hibrido</option>
                <option>Electrico</option>
            </select>
          </div>
          <div class="input-group">
            <label>Condición</label>
            <select bind:value={nuevoAuto.estado_vehiculo}>
                <option>Nuevo</option>
                <option>Usado</option>
                <option>Chocado / Reparable</option>
            </select>
          </div>
        </div>

        <div class="input-group">
          <label>Ubicación Actual</label>
          <select bind:value={nuevoAuto.ubicacion}>
            <option value="USA (Subasta)">USA (Subasta)</option>
            <option value="Iquique (Transito)">Chile (Detallando)</option>
            <option value="Bolivia (Disponible)">Bolivia (Disponible)</option>
          </select>
        </div>

        <div class="input-group full">
            <label>Descripción / Observaciones</label>
            <textarea bind:value={nuevoAuto.descripcion} rows="3" placeholder="Detalles extra del vehículo..."></textarea>
        </div>

        {#if !idEdicion}
            <div class="input-group full">
                <label>Fotografías (Máx 12)</label>
                <div class="file-drop-area">
                    <input 
                        type="file" 
                        bind:this={inputFotos}
                        multiple 
                        accept="image/*" 
                        on:change={alSeleccionarArchivos} 
                    >
                    <span class="file-msg">📸 Toca para seleccionar fotos</span>
                </div>
                
                {#if previsualizaciones.length > 0}
                    <div class="preview-grid">
                        {#each previsualizaciones as src}
                            <div class="thumb-wrapper">
                                <img {src} alt="preview">
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        {:else}
            <div class="alert-box">
                <small>⚠️ Para cambiar las fotos, elimina el vehículo y créalo nuevamente.</small>
            </div>
        {/if}

        <div class="form-actions">
            <button type="submit" class="btn-primary">
            {idEdicion ? '💾 Guardar Cambios' : '🚀 Subir Vehículo'}
            </button>
            
            {#if idEdicion}
            <button type="button" class="btn-secondary" on:click={cancelarEdicion}>Cancelar</button>
            {/if}
        </div>

      </form>
    </div>

    <div class="list-section">
      <div class="list-header">
          <h3>Inventario ({vehiculos.length})</h3>
      </div>
      
      {#if cargando}
        <div class="loading">Cargando inventario...</div>
      {:else if vehiculos.length === 0}
        <div class="empty-state">
            <p>No hay vehículos registrados aún.</p>
        </div>
      {:else}
        <div class="cards-grid">
          {#each vehiculos as auto}
            <div class="card {idEdicion === auto._id ? 'active-edit' : ''}">
              
              <div class="card-img">
                {#if auto.imagenes && auto.imagenes.length > 0}
                    <img src={auto.imagenes[0]} alt="Auto" loading="lazy">
                {:else if auto.imagen_url}
                    <img src={auto.imagen_url} alt="Auto" loading="lazy">
                {:else}
                    <div class="no-img">Sin Foto</div>
                {/if}
                
                <span class="badge-loc {auto.ubicacion.includes('Bolivia') ? 'bo' : auto.ubicacion.includes('Iquique') ? 'cl' : 'usa'}">
                  {auto.ubicacion.split(' ')[0]}
                </span>
              </div>
              
              <div class="card-body">
                <h4>{auto.marca} {auto.modelo}</h4>
                <span class="card-year">{auto.año}</span>
                
                <div class="legal-pill {auto.situacion_legal?.includes('Despachado') ? 'ok' : 'warn'}">
                    {auto.situacion_legal ? auto.situacion_legal.split('(')[0] : 'S/D'}
                </div>

                <div class="card-price">
                    {auto.precio ? auto.precio.toLocaleString() : '0'} 
                    <small>{auto.moneda || 'USD'}</small>
                </div>

                <div class="card-actions">
                  
                  <button class="btn-action btn-view" title="Ver en Web" on:click={() => verEnWeb(auto._id)}>
                     Ver Web
                  </button>
                  
                  <button class="btn-action btn-cotizar" title="Cotizar" on:click={() => cotizarAuto(auto)}>
                     Cotizar
                  </button>  
                  
                  <button class="btn-action btn-edit" title="Editar" on:click={() => cargarDatosEdicion(auto)}>
                     Editar
                  </button>
                  
                  <button class="btn-action btn-delete" title="Eliminar" on:click={() => eliminarAuto(auto._id)}>
                     Borrar
                  </button>

                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

  </div>
</div>

<style>
  /* --- VARIABLES --- */
  :root {
    --primary: #003366; /* Azul Bethel */
    --primary-dark: #002244;
    --red-bethel: #cc0000; /* Rojo Bethel */
    --bg-light: #f3f4f6;
    --white: #ffffff;
    --text-dark: #1f2937;
    --border: #e5e7eb;
    --radius: 8px;
    --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .page-container {
    max-width: 1350px;
    margin: 0 auto;
    padding: 20px;
    font-family: 'Segoe UI', system-ui, sans-serif;
    color: var(--text-dark);
  }

  /* ✅ ESTILOS HEADER Y BOTÓN VOLVER */
  .header-flex { 
      display: flex; justify-content: space-between; align-items: center; 
      margin-bottom: 20px; border-bottom: 2px solid var(--primary); padding-bottom: 10px; 
  }
  .page-title { margin: 0; color: var(--primary); }

  .btn-volver { 
      background: white; border: 1px solid var(--primary); color: var(--primary); 
      padding: 8px 15px; border-radius: 20px; cursor: pointer; font-weight: bold; transition: 0.2s;
  }
  .btn-volver:hover { background: var(--primary); color: white; }

  /* --- LAYOUT Y FORMULARIO --- */
  .layout-grid { display: grid; grid-template-columns: 500px 1fr; gap: 30px; align-items: start; }
  .form-panel { background: var(--white); padding: 25px; border-radius: var(--radius); box-shadow: var(--shadow); border: 1px solid var(--border); position: sticky; top: 20px; }
  .form-panel.editando { border: 2px solid #f59e0b; background: #fffbeb; }
  .form-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 10px; }
  .form-header h3 { margin: 0; color: var(--primary); }
  
  /* Inputs y Labels */
  .input-group { margin-bottom: 15px; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
  .full { grid-column: 1 / -1; }
  label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 5px; color: #333; }
  input, select, textarea { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 6px; box-sizing: border-box; }
  input:focus, select:focus { border-color: var(--primary); outline: none; }
  
  /* Precio Wrapper */
  .precio-wrapper { display: flex; width: 100%; }
  .precio-wrapper input { border-top-right-radius: 0; border-bottom-right-radius: 0; flex: 1; }
  .currency-select { border-top-left-radius: 0; border-bottom-left-radius: 0; border-left: none; background: #eee; width: 100px; text-align: center; font-weight: bold; }

  /* File Upload */
  .file-drop-area { position: relative; padding: 20px; border: 2px dashed #ccc; border-radius: 6px; text-align: center; background: #f9f9f9; }
  .file-drop-area input { position: absolute; left: 0; top: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
  .preview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(50px, 1fr)); gap: 5px; margin-top: 10px; }
  .thumb-wrapper img { width: 100%; height: 50px; object-fit: cover; border-radius: 4px; }

  /* Botones Formulario */
  .form-actions { margin-top: 20px; display: flex; flex-direction: column; gap: 10px; }
  .btn-primary { background: var(--primary); color: white; padding: 12px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; }
  .btn-secondary { background: #eee; color: #333; padding: 10px; border: none; border-radius: 6px; cursor: pointer; }
  .btn-text-cancel { background: none; border: none; text-decoration: underline; cursor: pointer; color: #666; }
  .alert-box { background: #fff3cd; padding: 10px; text-align: center; border-radius: 6px; font-size: 0.85rem; }

  /* --- LISTA Y TARJETAS --- */
  .list-header h3 { margin: 0 0 20px 0; color: var(--primary); border-bottom: 1px solid var(--border); padding-bottom: 10px; }
  .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }

  .card { background: var(--white); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow); border: 1px solid var(--border); display: flex; flex-direction: column; transition: transform 0.2s; }
  .card:hover { transform: translateY(-3px); }
  .card.active-edit { border: 2px solid var(--primary); }

  .card-img { height: 160px; background: #eee; position: relative; }
  .card-img img { width: 100%; height: 100%; object-fit: cover; }
  .no-img { display: flex; align-items: center; justify-content: center; height: 100%; color: #999; font-weight: bold; }
  .badge-loc { position: absolute; top: 10px; right: 10px; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; color: white; text-transform: uppercase; }
  .badge-loc.bo { background: #28a745; } .badge-loc.cl { background: #ffc107; color: #333; } .badge-loc.usa { background: var(--primary); }

  .card-body { padding: 15px; flex: 1; display: flex; flex-direction: column; }
  .card-body h4 { margin: 0; font-size: 1.1rem; color: #333; }
  .card-year { font-size: 0.9rem; color: #666; margin-bottom: 8px; }
  
  .legal-pill { display: inline-block; font-size: 0.75rem; padding: 2px 8px; border-radius: 12px; font-weight: 600; width: fit-content; margin-bottom: 10px; }
  .legal-pill.ok { background: #d4edda; color: #155724; } .legal-pill.warn { background: #fff3cd; color: #856404; }

  .card-price { font-size: 1.4rem; font-weight: 800; color: var(--primary); margin-top: auto; margin-bottom: 15px; }
  .card-price small { font-size: 0.9rem; font-weight: 500; color: #666; }

  .card-actions {
    display: grid;
    grid-template-columns: 1fr 1fr; /* 2 Columnas */
    gap: 10px;
  }
  
  .btn-action {
    padding: 8px;
    border: none;
    border-radius: 4px;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    transition: 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
  }

  /* AZUL BETHEL (Primario) */
  .btn-view {
    background: var(--primary);
    color: white;
  }
  .btn-view:hover { background: var(--primary-dark); }

  /* BLANCO CON BORDE AZUL (Secundario) */
  .btn-cotizar {
    background: white;
    color: var(--primary);
    border: 1px solid var(--primary);
  }
  .btn-cotizar:hover { background: #f0f7ff; }

  /* GRIS OSCURO (Neutro/Admin) */
  .btn-edit {
    background: #4b5563;
    color: white;
  }
  .btn-edit:hover { background: #374151; }

  /* ROJO BETHEL (Alerta) */
  .btn-delete {
    background: var(--red-bethel);
    color: white;
  }
  .btn-delete:hover { background: #a50000; }


  .loading, .empty-state { padding: 40px; text-align: center; color: #666; background: white; border-radius: var(--radius); }

  @media (max-width: 1100px) {
    .layout-grid { grid-template-columns: 1fr; }
    .form-panel { position: static; max-width: 800px; margin: 0 auto; }
  }
  @media (max-width: 600px) {
    .page-container { padding: 15px; }
    .form-row { grid-template-columns: 1fr; gap: 0; }
    .cards-grid { grid-template-columns: 1fr; }
    /* Ajuste para header en celular */
    .header-flex { flex-direction: column; gap: 10px; text-align: center; }
    .header-flex div { display: none; }
  }
</style>