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

  function volver() { dispatch('volver'); }
  function cotizarAuto(auto) { dispatch('cotizar', { auto }); }
  function verEnWeb(id) { window.open(`/detalles/${id}`, '_blank'); }

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
        Swal.fire({ title: "Límite excedido", text: "Máximo 12 fotos permitidas.", icon: "warning", confirmButtonColor: "#003366" });
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
      return Swal.fire({ title: "Faltan Datos", text: "Marca, Modelo, Precio y VIN son obligatorios.", icon: "warning", confirmButtonColor: "#003366" });
    }

    try {
      Swal.fire({ title: 'Guardando...', text: 'Subiendo información e imágenes...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

      if (idEdicion) {
        await axios.put(`/api/vehiculos/${idEdicion}`, nuevoAuto);
        Swal.fire({ title: "Actualizado", icon: "success", timer: 1500, showConfirmButton: false });
      } else {
        const formData = new FormData();
        Object.keys(nuevoAuto).forEach(key => {
            if (key === 'año') formData.append('anio', nuevoAuto[key]);
            formData.append(key, nuevoAuto[key]);
        });
        archivosSeleccionados.forEach(archivo => formData.append('fotos', archivo));

        await axios.post("/api/vehiculos", formData);
        Swal.fire({ title: "Creado", icon: "success", timer: 1500, showConfirmButton: false });
      }
      
      limpiarFormulario(); 
      cargarInventario();
    } catch (error) {
      console.error(error);
      Swal.fire({ title: "Error", text: "No se pudo guardar el vehículo.", icon: "error", confirmButtonColor: "#003366" });
    }
  }

  async function eliminarAuto(id) {
    const confirm = await Swal.fire({ title: "¿Eliminar?", text: "No podrás recuperar este registro.", icon: "warning", showCancelButton: true, confirmButtonColor: "#cc0000", cancelButtonColor: "#003366", confirmButtonText: "Sí, eliminar" });
    if (confirm.isConfirmed) {
      try { await axios.delete(`/api/vehiculos/${id}`); if (idEdicion === id) limpiarFormulario(); cargarInventario(); Swal.fire({ title: "Eliminado", icon: "success", timer: 1500, showConfirmButton: false }); } catch (error) { Swal.fire({ title: "Error", icon: "error" }); }
    }
  }
</script>

<svelte:head>
  <title>Bethel Motors - Inventario</title>
</svelte:head>

<div class="page-container">

  <div class="header-flex">
    <button class="btn-pill btn-outline-blue" on:click={volver}>← Volver</button>
    <h2 class="page-title">Gestión de Inventario</h2>
    <div class="spacer-desktop"></div> 
  </div>

  <div class="layout-grid">
    
    <div class="panel form-panel {idEdicion ? 'editando' : ''}">
      <div class="form-header">
        <h3>{idEdicion ? '✏️ Editar Vehículo' : '➕ Nuevo Registro'}</h3>
        {#if idEdicion}
          <button class="btn-link-cancel" on:click={cancelarEdicion}>Cancelar</button>
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
                    <option value="USD">USD</option>
                    <option value="BOB">BOB</option>
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
            <textarea bind:value={nuevoAuto.descripcion} rows="3" placeholder="Detalles extra..."></textarea>
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
                    <div class="drop-content">
                        <span class="icon">📸</span>
                        <span>Toca para subir fotos</span>
                    </div>
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
                ⚠️ Para cambiar fotos, elimina el vehículo y créalo de nuevo.
            </div>
        {/if}

        <div class="form-actions">
            <button type="submit" class="btn-pill btn-solid-blue full-width">
                {idEdicion ? '💾 Guardar Cambios' : ' Registrar Vehículo'}
            </button>
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
                <div class="card-titles">
                    <h4>{auto.marca} {auto.modelo}</h4>
                    <span class="card-year">{auto.año}</span>
                </div>
                
                <div class="legal-pill {auto.situacion_legal?.includes('Despachado') ? 'ok' : 'warn'}">
                    {auto.situacion_legal ? auto.situacion_legal.split('(')[0] : 'S/D'}
                </div>

                <div class="card-price">
                    {auto.precio ? auto.precio.toLocaleString() : '0'} 
                    <small>{auto.moneda || 'USD'}</small>
                </div>

                <div class="card-actions">
                  <button class="btn-action btn-web" title="Ver en Web" on:click={() => verEnWeb(auto._id)}>
                       Ver
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
  /* --- VARIABLES: ROJO Y AZUL BETHEL --- */
  :root {
    --primary: #003366; /* Azul Institucional */
    --primary-hover: #002244;
    --red-bethel: #cc0000; /* Rojo Acento */
    --red-hover: #a30000;
    --bg-light: #f4f4f9;
    --white: #ffffff;
    --border: #e5e7eb;
    --radius: 12px;
    --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .page-container {
    max-width: 1400px; margin: 0 auto; padding: 20px;
    font-family: 'Segoe UI', system-ui, sans-serif; color: #333;
  }

  /* --- HEADER Y BOTONES PILL --- */
  .header-flex { 
      display: flex; justify-content: space-between; align-items: center; 
      margin-bottom: 25px; border-bottom: 2px solid var(--primary); padding-bottom: 15px; 
  }
  .page-title { margin: 0; color: var(--primary); font-size: 1.5rem; font-weight: 800; }
  .spacer-desktop { width: 100px; }

  /* Estilos Pill Base */
  .btn-pill {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 10px 22px; border-radius: 50px; font-weight: 700; cursor: pointer;
    transition: all 0.2s; border: 1px solid transparent; font-size: 0.95rem; letter-spacing: 0.5px;
  }
  .btn-pill:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
  
  .btn-outline-blue { background: white; color: var(--primary); border-color: var(--primary); }
  .btn-outline-blue:hover { background: var(--primary); color: white; }

  .btn-solid-blue { background: var(--primary); color: white; border-color: var(--primary); }
  .btn-solid-blue:hover { background: var(--primary-hover); }

  .btn-link-cancel { background: none; border: none; text-decoration: underline; color: #666; cursor: pointer; font-size: 0.85rem; }
  .full-width { width: 100%; margin-top: 15px; }

  /* --- LAYOUT GRID --- */
  .layout-grid { display: grid; grid-template-columns: 450px 1fr; gap: 30px; align-items: start; }
  
  /* PANEL FORMULARIO */
  .form-panel { 
    background: var(--white); padding: 25px; border-radius: var(--radius); 
    box-shadow: var(--shadow); border: 1px solid var(--border); 
    position: sticky; top: 20px; z-index: 10;
  }
  .form-panel.editando { border: 2px solid #f59e0b; background: #fffdf5; }
  
  .form-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 10px; }
  .form-header h3 { margin: 0; color: var(--primary); font-size: 1.1rem; }

  /* INPUTS ESTILIZADOS */
  .input-group { margin-bottom: 15px; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .full { grid-column: 1 / -1; }
  
  label { display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 5px; color: #555; }
  input, select, textarea { 
    width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 8px; 
    box-sizing: border-box; background: #f9fafb; transition: 0.2s; font-size: 0.95rem;
  }
  input:focus, select:focus, textarea:focus { border-color: var(--primary); background: white; outline: none; box-shadow: 0 0 0 3px rgba(0, 51, 102, 0.1); }
  
  .precio-wrapper { display: flex; }
  .precio-wrapper input { border-top-right-radius: 0; border-bottom-right-radius: 0; }
  .currency-select { width: 90px; border-top-left-radius: 0; border-bottom-left-radius: 0; border-left: none; background: #eee; font-weight: bold; }

  /* DROP ZONE */
  .file-drop-area { 
    border: 2px dashed #ccc; border-radius: 8px; padding: 20px; text-align: center; 
    background: #f8fafc; position: relative; cursor: pointer; transition: 0.2s;
  }
  .file-drop-area:hover { border-color: var(--primary); background: #f0f7ff; }
  .file-drop-area input { position: absolute; left: 0; top: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
  .drop-content { display: flex; flex-direction: column; color: #666; font-size: 0.9rem; }
  .drop-content .icon { font-size: 1.5rem; margin-bottom: 5px; }

  .preview-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; margin-top: 10px; }
  .thumb-wrapper img { width: 100%; height: 50px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd; }

  .alert-box { background: #fff3cd; color: #856404; padding: 10px; border-radius: 6px; font-size: 0.85rem; text-align: center; }

  /* --- LISTA Y CARDS --- */
  .list-header h3 { margin: 0 0 20px 0; color: var(--primary); border-bottom: 1px solid var(--border); padding-bottom: 10px; }
  .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }

  .card { 
    background: var(--white); border-radius: var(--radius); overflow: hidden; 
    box-shadow: var(--shadow); border: 1px solid var(--border); 
    display: flex; flex-direction: column; transition: transform 0.2s;
  }
  .card:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
  .card.active-edit { border: 2px solid var(--primary); }

  .card-img { height: 160px; background: #eee; position: relative; }
  .card-img img { width: 100%; height: 100%; object-fit: cover; }
  .no-img { display: flex; align-items: center; justify-content: center; height: 100%; color: #999; }
  
  .badge-loc { position: absolute; top: 10px; right: 10px; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; color: white; text-transform: uppercase; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
  .badge-loc.bo { background: #28a745; } .badge-loc.cl { background: #ffc107; color: #333; } .badge-loc.usa { background: var(--primary); }

  .card-body { padding: 15px; flex: 1; display: flex; flex-direction: column; }
  .card-titles { margin-bottom: 5px; }
  .card-titles h4 { margin: 0; font-size: 1.1rem; color: #222; font-weight: 700; }
  .card-year { font-size: 0.85rem; color: #666; }
  
  .legal-pill { display: inline-block; font-size: 0.7rem; padding: 2px 8px; border-radius: 12px; font-weight: 600; width: fit-content; margin-bottom: 10px; }
  .legal-pill.ok { background: #d4edda; color: #155724; } .legal-pill.warn { background: #fff3cd; color: #856404; }

  .card-price { font-size: 1.3rem; font-weight: 800; color: var(--primary); margin-top: auto; margin-bottom: 15px; }
  .card-price small { font-size: 0.8rem; font-weight: 500; color: #666; }

  /* ACCIONES (Pill Shape también aquí) */
  .card-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .btn-action {
    padding: 8px; border: none; border-radius: 50px; font-size: 0.8rem; font-weight: 700;
    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;
    transition: 0.2s; border: 1px solid transparent;
  }
  
  /* Web: Outline Azul */
  .btn-web { background: white; color: var(--primary); border-color: var(--primary); } 
  .btn-web:hover { background: #f0f7ff; }

  /* Cotizar: ROJO BETHEL (Acción Principal de Venta) */
  .btn-cotizar { background: var(--red-bethel); color: white; border-color: var(--red-bethel); } 
  .btn-cotizar:hover { background: var(--red-hover); box-shadow: 0 4px 10px rgba(204, 0, 0, 0.3); }

  /* Editar: Gris Neutro */
  .btn-edit { background: #f3f4f6; color: #4b5563; } 
  .btn-edit:hover { background: #e5e7eb; color: #1f2937; }

  /* Eliminar: Rojo Texto (Menos agresivo visualmente que el sólido) */
  .btn-delete { background: white; color: var(--red-bethel); border-color: #fee2e2; } 
  .btn-delete:hover { background: #fef2f2; border-color: var(--red-bethel); }

  .loading, .empty-state { padding: 40px; text-align: center; color: #666; background: white; border-radius: var(--radius); grid-column: 1 / -1; }

  /* --- RESPONSIVE --- */
  @media (max-width: 1000px) {
    .layout-grid { grid-template-columns: 1fr; } /* Columna única */
    .form-panel { position: relative; top: 0; max-width: 100%; order: -1; margin-bottom: 30px; } /* Form arriba y no sticky */
  }

  @media (max-width: 600px) {
    .page-container { padding: 15px; }
    .header-flex { flex-direction: column; gap: 10px; text-align: center; }
    .spacer-desktop { display: none; }
    .form-row { grid-template-columns: 1fr; } /* Inputs a una columna */
    .cards-grid { grid-template-columns: 1fr; } /* Tarjetas a una columna */
  }
</style>