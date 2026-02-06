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
  
  // REFERENCIA AL INPUT (SOLUCIÓN AL ERROR DE .value)
  let inputFotos;

  // Objeto formulario actualizado
  let nuevoAuto = {
    marca: "",
    modelo: "",
    año: "",
    vin: "",
    precio: "",      // Antes precio_usd
    moneda: "USD",   // Nuevo campo
    kilometraje: "",
    color: "",
    tipo_combustible: "Gasolina",
    transmision: "Automatica",
    estado_vehiculo: "Usado",
    ubicacion: "USA (Subasta)",
    situacion_legal: "No Despachado (Sin Papeles)", // Nuevo
    placa: "", // Nuevo
    descripcion: ""
  };

  onMount(cargarInventario);

  function cotizarAuto(auto) {
    dispatch('cotizar', { auto });
  }

  async function cargarInventario() {
    try {
      const res = await axios.get("/api/vehiculos");
      vehiculos = res.data;
      cargando = false;
    } catch (error) {
      console.error(error);
      cargando = false;
    }
  }

  // --- MANEJO DE ARCHIVOS (FOTOS) CON VALIDACIÓN ---
  function alSeleccionarArchivos(event) {
    const files = event.target.files;
    
    // 🛡️ VALIDACIÓN: MÁXIMO 10 FOTOS
    if (files.length > 10) {
        Swal.fire({
            title: "¡Demasiadas fotos!",
            text: "El límite máximo es de 10 fotos por vehículo. Por favor selecciona menos.",
            icon: "warning",
            confirmButtonColor: "#003366"
        });
        
        // Limpiamos el input usando la referencia segura
        if (inputFotos) inputFotos.value = ""; 
        
        archivosSeleccionados = [];
        previsualizaciones = [];
        return;
    }

    if (files) {
      archivosSeleccionados = Array.from(files);
      // Crear URLs temporales para mostrar qué estás subiendo
      previsualizaciones = archivosSeleccionados.map(file => URL.createObjectURL(file));
    }
  }

  // --- CARGAR DATOS PARA EDITAR ---
  function cargarDatosEdicion(auto) {
    // Mapeamos los datos viejos a los nuevos si es necesario
    nuevoAuto = { 
        ...auto,
        precio: auto.precio || auto.precio_usd, // Compatibilidad
        moneda: auto.moneda || 'USD',
        situacion_legal: auto.situacion_legal || "No Despachado (Sin Papeles)",
        placa: auto.placa || ""
    }; 
    idEdicion = auto._id; 
    
    // Limpiamos previsualizaciones de archivos nuevos
    archivosSeleccionados = [];
    previsualizaciones = [];
    
    // Limpiamos el input visualmente si quedó algo cargado
    if (inputFotos) inputFotos.value = "";

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelarEdicion() {
    limpiarFormulario();
  }

  function limpiarFormulario() {
    nuevoAuto = {
      marca: "", modelo: "", año: "", vin: "", precio: "", moneda: "USD",
      kilometraje: "", color: "", tipo_combustible: "Gasolina",
      transmision: "Automatica", estado_vehiculo: "Usado",
      ubicacion: "USA (Subasta)", situacion_legal: "No Despachado (Sin Papeles)",
      placa: "", descripcion: ""
    };
    idEdicion = null;
    archivosSeleccionados = [];
    previsualizaciones = [];
    
    // ✅ SOLUCIÓN SEGURA: Usamos la variable enlazada
    if (inputFotos) inputFotos.value = "";
  }

  async function guardarAuto() {
    if (!nuevoAuto.marca || !nuevoAuto.modelo || !nuevoAuto.precio || !nuevoAuto.vin) {
      return Swal.fire({
        title: "Campos Incompletos",
        text: "Por favor llena los datos obligatorios.",
        icon: "warning",
        confirmButtonColor: "#003366"
      });
    }

    try {
      if (idEdicion) {
        // --- MODO ACTUALIZAR (PUT) - Solo texto ---
        await axios.put(`/api/vehiculos/${idEdicion}`, nuevoAuto);
        Swal.fire({
          title: "Actualizado", text: "Datos modificados correctamente.",
          icon: "success", confirmButtonColor: "#003366"
        });
      } else {
        // --- MODO CREAR (POST) - Con Fotos (FormData) ---
        
        const formData = new FormData();
        
        Object.keys(nuevoAuto).forEach(key => {
            if (key === 'año') {
                formData.append('anio', nuevoAuto[key]);
            } else {
                formData.append(key, nuevoAuto[key]);
            }
        });

        // Agregamos las fotos
        archivosSeleccionados.forEach(archivo => {
            formData.append('fotos', archivo);
        });

        Swal.fire({
            title: 'Subiendo...',
            text: 'Guardando información e imágenes (esto puede tardar unos segundos)',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        await axios.post("/api/vehiculos", formData);
        
        Swal.fire({
          title: "Guardado", text: "Vehículo e imágenes agregados al inventario.",
          icon: "success", confirmButtonColor: "#003366"
        });
      }

      limpiarFormulario();
      cargarInventario();

    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || "Error al guardar";
      const detalle = error.response?.data?.detalle || "";
      Swal.fire({
          title: "Error", text: `${msg} ${detalle}`, icon: "error", confirmButtonColor: "#003366"
      });
    }
  }

  async function eliminarAuto(id) {
    const confirm = await Swal.fire({
      title: "¿Eliminar Vehículo?",
      text: "Se borrará permanentemente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ff0000",
      cancelButtonColor: "#003366",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });

    if (confirm.isConfirmed) {
      try {
        await axios.delete(`/api/vehiculos/${id}`);
        if (idEdicion === id) limpiarFormulario();
        cargarInventario();
        Swal.fire({ title: "Eliminado", icon: "success", confirmButtonColor: "#003366" });
      } catch (error) {
        Swal.fire({ title: "Error", icon: "error", confirmButtonColor: "#003366" });
      }
    }
  }
</script>

<div class="inventario-container">
  <h2>Gestión de Inventario</h2>

  <div class="layout-grid">
    
    <div class="panel form-panel {idEdicion ? 'editando' : ''}">
      <div class="form-header">
        <h3>{idEdicion ? '✏️ Editando Datos' : '➕ Nuevo Vehículo'}</h3>
        {#if idEdicion}
          <button class="btn-cancelar-top" on:click={cancelarEdicion}>Cancelar</button>
        {/if}
      </div>
      
      <form on:submit|preventDefault={guardarAuto}>
        <div class="row">
          <div class="group">
            <label>Marca</label>
            <input type="text" bind:value={nuevoAuto.marca} placeholder="Ej: Toyota" required>
          </div>
          <div class="group">
            <label>Modelo</label>
            <input type="text" bind:value={nuevoAuto.modelo} placeholder="Ej: Tacoma" required>
          </div>
        </div>

        <div class="row">
          <div class="group">
            <label>Año</label>
            <input type="number" bind:value={nuevoAuto.año} placeholder="2020" required>
          </div>
          
          <div class="group">
            <label>Precio de Venta</label>
            <div class="precio-input-group">
                <input type="number" bind:value={nuevoAuto.precio} placeholder="15000" required>
                <select bind:value={nuevoAuto.moneda} class="moneda-select">
                    <option value="USD">USD</option>
                    <option value="BOB">BOB</option>
                </select>
            </div>
          </div>
        </div>

        <div class="group">
            <label>Situación Legal (Papeles)</label>
            <select bind:value={nuevoAuto.situacion_legal}>
                <option value="No Despachado (Sin Papeles)">Sin Papeles / No Despachado</option>
                <option value="En Trámite (Aduana)">En Trámite (Aduana)</option>
                <option value="Despachado (Con Papeles)">Despachado (Con Papeles)</option>
            </select>
        </div>

        <div class="group">
            <label>Placa (Opcional)</label>
            <input type="text" bind:value={nuevoAuto.placa} placeholder="Ej: 4055-XYZ o 'En trámite'">
        </div>

        <div class="row">
          <div class="group">
            <label>VIN (Chasis)</label>
            <input type="text" bind:value={nuevoAuto.vin} placeholder="Ej: 1G1..." required>
          </div>
          <div class="group">
            <label>Kilometraje</label>
            <input type="number" bind:value={nuevoAuto.kilometraje} placeholder="Ej: 50000" required>
          </div>
        </div>

        <div class="row">
          <div class="group">
            <label>Color</label>
            <input type="text" bind:value={nuevoAuto.color} placeholder="Ej: Rojo" required>
          </div>
          <div class="group">
            <label>Transmisión</label>
            <select bind:value={nuevoAuto.transmision}>
                <option>Automatica</option>
                <option>Manual</option>
                <option>CVT</option>
            </select>
          </div>
        </div>

        <div class="row">
          <div class="group">
            <label>Combustible</label>
            <select bind:value={nuevoAuto.tipo_combustible}>
                <option>Gasolina</option>
                <option>Diesel</option>
                <option>Hibrido</option>
                <option>Electrico</option>
            </select>
          </div>
          <div class="group">
            <label>Condición</label>
            <select bind:value={nuevoAuto.estado_vehiculo}>
                <option>Nuevo</option>
                <option>Usado</option>
                <option>Chocado / Reparable</option>
            </select>
          </div>
        </div>

        <div class="group">
          <label>Ubicación Actual</label>
          <select bind:value={nuevoAuto.ubicacion}>
            <option value="USA (Subasta)">USA (Subasta)</option>
            <option value="Iquique (Transito)">Iquique (Transito)</option>
            <option value="Bolivia (Disponible)">Bolivia (Disponible)</option>
          </select>
        </div>

        <div class="group full-width">
            <label>Descripción</label>
            <textarea bind:value={nuevoAuto.descripcion} rows="3"></textarea>
        </div>

        {#if !idEdicion}
            <div class="group full-width">
                <label>Fotografías (Máx 12)</label>
                <input 
                    type="file" 
                    bind:this={inputFotos}
                    multiple 
                    accept="image/*" 
                    on:change={alSeleccionarArchivos} 
                    class="input-file"
                >
                
                {#if previsualizaciones.length > 0}
                    <div class="preview-container">
                        {#each previsualizaciones as src}
                            <img {src} alt="preview" class="thumb">
                        {/each}
                    </div>
                {/if}
            </div>
        {:else}
            <div class="group info-box">
                <small>⚠️ Para cambiar las fotos, elimina y vuelve a crear el vehículo.</small>
            </div>
        {/if}

        <button type="submit" class="btn-azul">
          {idEdicion ? '💾 Guardar Cambios' : '☁️ Subir Vehículo'}
        </button>
        
        {#if idEdicion}
           <button type="button" class="btn-cancelar-bottom" on:click={cancelarEdicion}>Cancelar Edición</button>
        {/if}

      </form>
    </div>

    <div class="list-panel">
      <h3>Stock Actual ({vehiculos.length})</h3>
      
      {#if cargando}
        <p>Cargando datos...</p>
      {:else if vehiculos.length === 0}
        <div class="empty-state">No hay vehículos registrados.</div>
      {:else}
        <div class="cards-wrapper">
          {#each vehiculos as auto}
            <div class="card-auto {idEdicion === auto._id ? 'seleccionado' : ''}">
              <div class="img-area">
                {#if auto.imagenes && auto.imagenes.length > 0}
                    <img src={auto.imagenes[0]} alt="Auto">
                {:else if auto.imagen_url}
                    <img src={auto.imagen_url} alt="Auto">
                {:else}
                    <div class="no-img">Sin Foto</div>
                {/if}
                
                <span class="badge 
                  {auto.ubicacion.includes('Bolivia') ? 'bo' : 
                   auto.ubicacion.includes('Iquique') ? 'cl' : 'usa'}">
                  {auto.ubicacion}
                </span>
              </div>
              
              <div class="info">
                <h4>{auto.marca} {auto.modelo} <span class="anio">{auto.año}</span></h4>
                
                <div class="legal-status">
                    <span class="badge-legal {auto.situacion_legal?.includes('Despachado') ? 'ok' : 'warn'}">
                        {auto.situacion_legal ? auto.situacion_legal.split('(')[0] : 'Sin Datos'}
                    </span>
                </div>

                <div class="detalles-mini">
                    <span>{auto.transmision}</span> • 
                    <span>{auto.placa ? 'Placa: ' + auto.placa : 'S/P'}</span>
                </div>
                
                <p class="precio">
                    {auto.precio ? auto.precio.toLocaleString() : (auto.precio_usd ? auto.precio_usd.toLocaleString() : 0)} 
                    <span class="moneda-text">{auto.moneda || 'USD'}</span>
                    
                    {#if auto.ubicacion.includes('USA')}
                        <small class="aprox-text">(Subasta)</small>
                    {/if}
                </p>

                <div class="acciones">
                  <button class="btn-icon btn-cotizar" title="Generar Cotización" on:click={() => cotizarAuto(auto)}>
                    Cotizar
                  </button>  
                  <button class="btn-icon btn-edit" title="Editar Info" on:click={() => cargarDatosEdicion(auto)}>
                    Editar
                  </button>
                  <button class="btn-icon btn-delete" title="Eliminar" on:click={() => eliminarAuto(auto._id)}>
                    Eliminar
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
  .inventario-container { max-width: 1200px; margin: 0 auto; }
  h2 { color: #003366; border-bottom: 2px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }
  
  .layout-grid { display: grid; grid-template-columns: 400px 1fr; gap: 30px; }
  
  /* FORMULARIO */
  .panel { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); height: fit-content; transition: 0.3s; }
  .panel.editando { border: 2px solid #ffcc00; background: #fffdf5; }

  .form-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
  h3 { margin: 0; color: #333; }
  
  .group { margin-bottom: 15px; }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  
  label { display: block; font-size: 0.85rem; font-weight: bold; color: #555; margin-bottom: 5px; }
  input, select, textarea { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
  .full-width { grid-column: 1 / -1; }
  
  /* INPUT DOBLE PARA PRECIO */
  .precio-input-group { display: flex; gap: 5px; }
  .precio-input-group input { flex: 2; }
  .moneda-select { flex: 1; background: #f0f0f0; font-weight: bold; }

  /* INPUT FILE */
  .input-file { padding: 10px; background: #f9f9f9; border: 2px dashed #ccc; cursor: pointer; }
  .preview-container { display: flex; gap: 5px; margin-top: 10px; flex-wrap: wrap; }
  .thumb { width: 60px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd; }
  .info-box { background: #fff3cd; padding: 10px; border-radius: 4px; color: #856404; text-align: center; border: 1px solid #ffeeba; }

  .btn-azul { width: 100%; background: #003366; color: white; padding: 12px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; margin-top: 10px; font-size: 1rem;}
  .btn-azul:hover { background: #002244; }

  .btn-cancelar-top { background: none; border: none; color: #666; text-decoration: underline; cursor: pointer; font-size: 0.85rem; }
  .btn-cancelar-bottom { width: 100%; background: #ddd; color: #333; padding: 10px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; margin-top: 10px; }
  .btn-cancelar-bottom:hover { background: #ccc; }

  /* LISTA CARDS */
  .cards-wrapper { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; }
  
  .card-auto { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.1); transition: transform 0.2s; position: relative; }
  .card-auto:hover { transform: translateY(-3px); }
  .card-auto.seleccionado { border: 2px solid #003366; transform: scale(0.98); opacity: 0.8; }

  .img-area { height: 150px; background: #eee; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .img-area img { width: 100%; height: 100%; object-fit: cover; }
  .no-img { color: #888; font-weight: bold; }

  .badge { position: absolute; top: 10px; right: 10px; padding: 4px 8px; border-radius: 4px; color: white; font-size: 0.7rem; font-weight: bold; text-transform: uppercase; }
  .badge.bo { background: #28a745; } 
  .badge.cl { background: #ff9900; } 
  .badge.usa { background: #003366; } 

  .info { padding: 15px; text-align: center; }
  .info h4 { margin: 0; font-size: 1rem; color: #333; line-height: 1.2; margin-bottom: 5px;}
  
  .legal-status { margin-bottom: 8px; }
  .badge-legal { font-size: 0.7rem; background: #e2e3e5; padding: 2px 6px; border-radius: 3px; color: #444; font-weight: 600; }
  .badge-legal.ok { background: #d4edda; color: #155724; }
  .badge-legal.warn { background: #fff3cd; color: #856404; }

  .anio { color: #777; font-weight: normal; font-size: 0.9rem; }
  .detalles-mini { font-size: 0.8rem; color: #666; margin-top: 5px;}
  
  .precio { font-size: 1.3rem; font-weight: bold; color: #003366; margin: 10px 0; display: flex; align-items: center; justify-content: center; gap: 5px; }
  .moneda-text { font-size: 0.8rem; font-weight: normal; color: #666; margin-top: 4px; }
  .aprox-text { font-size: 0.7rem; font-weight: normal; color: #666; background: #eee; padding: 2px 5px; border-radius: 4px; }

  /* ACCIONES */
  .acciones { display: flex; gap: 5px; justify-content: center; margin-top: 10px; }
  .btn-icon { flex: 1; padding: 6px; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem; transition: background 0.2s; font-weight: 500;}
  
  .btn-edit { background: #e3f2fd; color: #003366; border: 1px solid #bbdefb; }
  .btn-edit:hover { background: #bbdefb; }
  
  .btn-delete { background: #ffebee; color: #c62828; border: 1px solid #ffcdd2; }
  .btn-delete:hover { background: #ffcdd2; }
  
  .btn-cotizar { background: #003366; color: white; border: 1px solid #002244; flex: 1.5; }
  .btn-cotizar:hover { background: #002244; }

  .empty-state { padding: 20px; text-align: center; background: #fff; border-radius: 8px; color: #777; }

  @media (max-width: 900px) {
    .layout-grid { grid-template-columns: 1fr; }
  }
</style>