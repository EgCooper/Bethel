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

  function cotizarAuto(auto) { dispatch('cotizar', { auto }); }

  async function cargarInventario() {
    try {
      const res = await axios.get("/api/vehiculos");
      vehiculos = res.data;
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
        ...auto, precio: auto.precio || auto.precio_usd, moneda: auto.moneda || 'USD',
        situacion_legal: auto.situacion_legal || "No Despachado (Sin Papeles)", placa: auto.placa || ""
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
      return Swal.fire({ title: "Campos Incompletos", text: "Llena los datos obligatorios.", icon: "warning", confirmButtonColor: "#003366" });
    }
    try {
      if (idEdicion) {
        await axios.put(`/api/vehiculos/${idEdicion}`, nuevoAuto);
        Swal.fire({ title: "Actualizado", icon: "success", confirmButtonColor: "#003366" });
      } else {
        const formData = new FormData();
        Object.keys(nuevoAuto).forEach(key => formData.append(key === 'año' ? 'anio' : key, nuevoAuto[key]));
        archivosSeleccionados.forEach(archivo => formData.append('fotos', archivo));

        Swal.fire({ title: 'Subiendo...', text: 'Guardando información e imágenes...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        await axios.post("/api/vehiculos", formData);
        Swal.fire({ title: "Guardado", icon: "success", confirmButtonColor: "#003366" });
      }
      limpiarFormulario(); cargarInventario();
    } catch (error) {
      Swal.fire({ title: "Error", text: error.response?.data?.error || "Error al guardar", icon: "error", confirmButtonColor: "#003366" });
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

  <h2 class="page-title">Gestión de Inventario</h2>

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
                  <button class="btn-action btn-cotizar" on:click={() => cotizarAuto(auto)}>Cotizar</button>  
                  <button class="btn-action btn-edit" on:click={() => cargarDatosEdicion(auto)}>Editar</button>
                  <button class="btn-action btn-delete" on:click={() => eliminarAuto(auto._id)}>Borrar</button>
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
  /* --- VARIABLES & BASE --- */
  :root {
    --primary: #003366;
    --primary-dark: #002244;
    --bg-light: #f3f4f6;
    --white: #ffffff;
    --text-dark: #1f2937;
    --text-light: #6b7280;
    --border: #e5e7eb;
    --radius: 8px;
    --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  .page-container {
    max-width: 1350px; /* Ancho máximo mayor para que quepa todo bien */
    margin: 0 auto;
    padding: 20px;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    color: var(--text-dark);
  }

  /* --- HEADER --- */
  .brand-header {
    display: flex;
    align-items: center;
    gap: 15px;
    padding-bottom: 20px;
    border-bottom: 3px solid var(--primary);
    margin-bottom: 30px;
  }
  .brand-logo { height: 50px; width: auto; object-fit: contain; }
  .brand-header h1 {
    margin: 0;
    font-size: 1.8rem;
    font-weight: 800;
    color: var(--primary);
    letter-spacing: -0.5px;
  }

  .page-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 20px;
    color: var(--text-dark);
  }

  /* --- LAYOUT GRID: AQUÍ ESTÁ EL CAMBIO DE ANCHO --- */
  .layout-grid {
    display: grid;
    /* Columna Formulario (500px) | Columna Lista (El resto) */
    grid-template-columns: 500px 1fr; 
    gap: 30px;
    align-items: start;
  }

  /* --- PANEL FORMULARIO --- */
  .form-panel {
    background: var(--white);
    padding: 25px;
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    border: 1px solid var(--border);
    position: sticky;
    top: 20px; 
  }
  .form-panel.editando {
    border: 2px solid #f59e0b;
    background: #fffbeb;
  }

  .form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border);
  }
  .form-header h3 { margin: 0; font-size: 1.1rem; color: var(--primary); }
  .btn-text-cancel { background: none; border: none; color: var(--text-light); text-decoration: underline; cursor: pointer; font-size: 0.85rem; }

  /* --- INPUTS --- */
  .modern-form .input-group { margin-bottom: 15px; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
  .full { grid-column: 1 / -1; }

  label {
    display: block;
    font-size: 0.85rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 5px;
  }

  input, select, textarea {
    width: 100%;
    padding: 12px 14px; /* Un poco más de padding */
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.95rem;
    background: #f9fafb;
    transition: all 0.2s;
    box-sizing: border-box;
  }
  
  input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: var(--primary);
    background: var(--white);
    box-shadow: 0 0 0 3px rgba(0, 51, 102, 0.1);
  }

  /* --- SELECTOR DE PRECIO ARREGLADO --- */
  .precio-wrapper { display: flex; gap: 0; width: 100%; }
  
  .precio-wrapper input { 
    border-top-right-radius: 0; 
    border-bottom-right-radius: 0; 
    flex: 1; 
    min-width: 0; /* Evita desbordamiento */
  }
  
  .currency-select { 
    border-top-left-radius: 0; 
    border-bottom-left-radius: 0; 
    border-left: none; 
    background: #e5e7eb; 
    font-weight: bold; 
    /* ANCHO FIJO PARA QUE NO SE CORTE */
    width: 120px; 
    flex-shrink: 0;
    text-align: center;
  }

  /* FILE UPLOAD */
  .file-drop-area {
    position: relative;
    padding: 20px;
    border: 2px dashed #cbd5e1;
    border-radius: 6px;
    text-align: center;
    background: #f8fafc;
    transition: 0.2s;
  }
  .file-drop-area:hover { border-color: var(--primary); background: #f0f9ff; }
  .file-drop-area input {
    position: absolute; left: 0; top: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;
  }
  .file-msg { color: var(--text-light); font-size: 0.9rem; pointer-events: none; }

  .preview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(50px, 1fr)); gap: 5px; margin-top: 10px; }
  .thumb-wrapper img { width: 100%; height: 50px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd; }

  /* BOTONES FORMULARIO */
  .form-actions { margin-top: 20px; display: flex; flex-direction: column; gap: 10px; }
  .btn-primary { background: var(--primary); color: white; padding: 12px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; transition: 0.2s; font-size: 1rem; }
  .btn-primary:hover { background: var(--primary-dark); transform: translateY(-1px); }
  .btn-secondary { background: #e5e7eb; color: #374151; padding: 10px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
  .btn-secondary:hover { background: #d1d5db; }

  .alert-box { background: #fffbeb; color: #b45309; padding: 10px; border-radius: 6px; font-size: 0.85rem; border: 1px solid #fcd34d; text-align: center; }

  /* --- COLUMNA LISTA --- */
  .list-header { margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 10px; }
  .list-header h3 { margin: 0; color: var(--text-dark); font-size: 1.2rem; }

  .cards-grid {
    display: grid;
    /* Ajuste responsivo de la cuadrícula */
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 20px;
  }

  /* --- TARJETA AUTO --- */
  .card {
    background: var(--white);
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: var(--shadow);
    transition: transform 0.2s, box-shadow 0.2s;
    border: 1px solid var(--border);
    display: flex; flex-direction: column;
  }
  .card:hover { transform: translateY(-3px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
  .card.active-edit { border: 2px solid var(--primary); ring: 2px solid rgba(0,51,102,0.2); }

  .card-img { height: 160px; background: #f3f4f6; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .card-img img { width: 100%; height: 100%; object-fit: cover; }
  .no-img { color: #9ca3af; font-weight: 600; font-size: 0.9rem; }

  .badge-loc { position: absolute; top: 10px; right: 10px; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; color: white; text-transform: uppercase; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
  .badge-loc.bo { background: #10b981; } 
  .badge-loc.cl { background: #f59e0b; } 
  .badge-loc.usa { background: var(--primary); }

  .card-body { padding: 15px; flex: 1; display: flex; flex-direction: column; }
  .card-body h4 { margin: 0; font-size: 1.05rem; font-weight: 700; color: #111827; margin-bottom: 2px; }
  .card-year { font-size: 0.9rem; color: #6b7280; font-weight: 500; margin-bottom: 8px; display: block; }

  .legal-pill { display: inline-block; font-size: 0.7rem; padding: 2px 8px; border-radius: 12px; font-weight: 600; width: fit-content; margin-bottom: 10px; }
  .legal-pill.ok { background: #d1fae5; color: #065f46; }
  .legal-pill.warn { background: #fef3c7; color: #92400e; }

  .card-price { font-size: 1.3rem; font-weight: 800; color: var(--primary); margin-top: auto; margin-bottom: 15px; }
  .card-price small { font-size: 0.8rem; font-weight: 500; color: #6b7280; }

  .card-actions { display: grid; grid-template-columns: 1.5fr 1fr 1fr; gap: 5px; }
  .btn-action { padding: 8px; border: none; border-radius: 4px; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: 0.2s; }
  .btn-cotizar { background: var(--primary); color: white; }
  .btn-cotizar:hover { background: var(--primary-dark); }
  .btn-edit { background: #e0f2fe; color: #0369a1; }
  .btn-edit:hover { background: #bae6fd; }
  .btn-delete { background: #fee2e2; color: #b91c1c; }
  .btn-delete:hover { background: #fecaca; }

  .loading, .empty-state { padding: 40px; text-align: center; color: var(--text-light); background: white; border-radius: var(--radius); }

  /* --- MEDIA QUERIES (RESPONSIVE) --- */
  @media (max-width: 1100px) {
    /* En Tablet: Formulario arriba (ancho completo), lista abajo */
    .layout-grid {
      grid-template-columns: 1fr; 
    }
    .form-panel { position: static; max-width: 800px; margin: 0 auto; } 
  }

  @media (max-width: 600px) {
    .page-container { padding: 15px; }
    /* Móvil: Inputs apilados (1 columna) para que sean grandes */
    .form-row { grid-template-columns: 1fr; gap: 0; }
    .brand-header h1 { font-size: 1.5rem; }
    .brand-logo { height: 40px; }
    .cards-grid { grid-template-columns: 1fr; } /* 1 tarjeta por fila en móvil */
  }
</style>