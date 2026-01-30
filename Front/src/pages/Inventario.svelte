<script>
  import { onMount } from "svelte";
  import axios from "axios";
  import Swal from "sweetalert2";
  import {createEventDispatcher} from "svelte";

  const dispatch = createEventDispatcher();
  let vehiculos = [];
  let cargando = true;
  let idEdicion = null; // Si tiene valor, estamos editando. Si es null, estamos creando.

  // Objeto formulario
  let nuevoAuto = {
    marca: "",
    modelo: "",
    año: "",
    vin: "",
    precio_usd: "",
    kilometraje: "",
    color: "",
    tipo_combustible: "Gasolina",
    transmision: "Automatica",
    estado_vehiculo: "Usado",
    ubicacion: "USA (Subasta)",
    imagen_url: "",
    descripcion: ""
  };

  onMount(cargarInventario);

  function cotizarAuto(auto) {
    dispatch('cotizar', { auto });
  }
  async function cargarInventario() {
    try {
      const res = await axios.get("http://localhost:3000/api/vehiculos");
      vehiculos = res.data;
      cargando = false;
    } catch (error) {
      console.error(error);
      cargando = false;
    }
  }

  // --- FUNCIÓN PARA CARGAR DATOS EN EL FORMULARIO ---
  function cargarDatosEdicion(auto) {
    // Llenamos el formulario con los datos del auto seleccionado
    nuevoAuto = { ...auto }; 
    idEdicion = auto._id; // Activamos modo edición
    
    // Hacemos scroll hacia arriba suavemente para ver el formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- FUNCIÓN PARA CANCELAR EDICIÓN ---
  function cancelarEdicion() {
    limpiarFormulario();
  }

  function limpiarFormulario() {
    nuevoAuto = {
      marca: "", modelo: "", año: "", vin: "", precio_usd: "",
      kilometraje: "", color: "", tipo_combustible: "Gasolina",
      transmision: "Automatica", estado_vehiculo: "Usado",
      ubicacion: "USA (Subasta)", imagen_url: "", descripcion: ""
    };
    idEdicion = null; // Volvemos a modo crear
  }

  async function guardarAuto() {
    if (!nuevoAuto.marca || !nuevoAuto.modelo || !nuevoAuto.precio_usd || !nuevoAuto.vin) {
      return Swal.fire({
        title: "Campos Incompletos",
        text: "Por favor llena los datos obligatorios (Marca, Modelo, Precio, VIN)",
        icon: "warning",
        confirmButtonColor: "#003366"
      });
    }

    try {
      if (idEdicion) {
        // --- MODO ACTUALIZAR (PUT) ---
        await axios.put(`http://localhost:3000/api/vehiculos/${idEdicion}`, nuevoAuto);
        Swal.fire({
          title: "Actualizado", text: "Datos del vehiculo modificados correctamente.",
          icon: "success", confirmButtonColor: "#003366"
        });
      } else {
        // --- MODO CREAR (POST) ---
        await axios.post("http://localhost:3000/api/vehiculos", nuevoAuto);
        Swal.fire({
          title: "Guardado", text: "Vehiculo agregado al inventario.",
          icon: "success", confirmButtonColor: "#003366"
        });
      }

      limpiarFormulario();
      cargarInventario();

    } catch (error) {
      const msg = error.response?.data?.error || "Error al guardar";
      Swal.fire({
          title: "Error", text: msg, icon: "error", confirmButtonColor: "#003366"
      });
    }
  }

  async function eliminarAuto(id) {
    const confirm = await Swal.fire({
      title: "Eliminar Vehiculo",
      text: "Se quitara del inventario permanentemente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ff0000",
      cancelButtonColor: "#003366",
      confirmButtonText: "Si, eliminar",
      cancelButtonText: "Cancelar"
    });

    if (confirm.isConfirmed) {
      try {
        await axios.delete(`http://localhost:3000/api/vehiculos/${id}`);
        // Si justo estabamos editando el que borramos, limpiamos el form
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
  <h2>Gestion de Inventario</h2>

  <div class="layout-grid">
    
    <div class="panel form-panel {idEdicion ? 'editando' : ''}">
      <div class="form-header">
        <h3>{idEdicion ? '✏️ Editando Vehiculo' : '➕ Nuevo Vehiculo'}</h3>
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
            <label>Precio (USD)</label>
            <input type="number" bind:value={nuevoAuto.precio_usd} placeholder="15000" required>
          </div>
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
            <label>Transmision</label>
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
            <label>Condicion</label>
            <select bind:value={nuevoAuto.estado_vehiculo}>
                <option>Nuevo</option>
                <option>Usado</option>
                <option>Chocado / Reparable</option>
            </select>
          </div>
        </div>

        <div class="group">
          <label>Ubicacion Actual</label>
          <select bind:value={nuevoAuto.ubicacion}>
            <option value="USA (Subasta)">USA (Subasta)</option>
            <option value="Iquique (Transito)">Iquique (Transito)</option>
            <option value="Bolivia (Disponible)">Bolivia (Disponible)</option>
          </select>
        </div>

        <div class="group">
          <label>URL Foto (Link)</label>
          <input type="text" bind:value={nuevoAuto.imagen_url} placeholder="https://...">
        </div>

        <button type="submit" class="btn-azul">
          {idEdicion ? '💾 Actualizar Vehículo' : '➕ Agregar al Stock'}
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
        <div class="empty-state">No hay vehiculos registrados.</div>
      {:else}
        <div class="cards-wrapper">
          {#each vehiculos as auto}
            <div class="card-auto {idEdicion === auto._id ? 'seleccionado' : ''}">
              <div class="img-area">
                {#if auto.imagen_url}
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
                <div class="detalles-mini">
                    <span>{auto.transmision}</span> • <span>{auto.tipo_combustible}</span>
                </div>
                
                <p class="precio">
                  $ {auto.precio_usd.toLocaleString('en-US')}
                  {#if auto.ubicacion === 'USA (Subasta)'}<span class="aprox-text">(Aprox)</span>{/if}
                </p>

                <div class="acciones">
                <button class="btn-icon btn-cotizar" title="Generar Cotización" on:click={() => cotizarAuto(auto)}>
                    Cotizar
                  </button>  
                  <button class="btn-icon btn-edit" title="Editar" on:click={() => cargarDatosEdicion(auto)}>
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
  .panel.editando { border: 2px solid #ffcc00; background: #fffdf5; } /* Resalta cuando editas */

  .form-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
  h3 { margin: 0; color: #333; }
  
  .group { margin-bottom: 15px; }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  
  label { display: block; font-size: 0.85rem; font-weight: bold; color: #555; margin-bottom: 5px; }
  input, select { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
  
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

  .img-area { height: 140px; background: #eee; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .img-area img { width: 100%; height: 100%; object-fit: cover; }
  .no-img { color: #888; font-weight: bold; }

  .badge { position: absolute; top: 10px; right: 10px; padding: 4px 8px; border-radius: 4px; color: white; font-size: 0.7rem; font-weight: bold; text-transform: uppercase; }
  .badge.bo { background: #28a745; } 
  .badge.cl { background: #ff9900; } 
  .badge.usa { background: #003366; } 

  .info { padding: 15px; text-align: center; }
  .info h4 { margin: 0; font-size: 1rem; color: #333; }
  .anio { color: #777; font-weight: normal; }
  .detalles-mini { font-size: 0.8rem; color: #666; margin-top: 5px;}
  .precio { font-size: 1.2rem; font-weight: bold; color: #003366; margin: 10px 0; display: flex; align-items: center; justify-content: center; gap: 5px; }
  .aprox-text { font-size: 0.8rem; font-weight: normal; color: #666; background: #eee; padding: 2px 5px; border-radius: 4px; }

  /* ACCIONES */
  .acciones { display: flex; gap: 10px; justify-content: center; margin-top: 10px; }
  .btn-icon { flex: 1; padding: 8px; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; transition: background 0.2s; }
  
  .btn-edit { background: #e3f2fd; color: #003366; border: 1px solid #bbdefb; }
  .btn-edit:hover { background: #bbdefb; }
  
  .btn-delete { background: #ffebee; color: #c62828; border: 1px solid #ffcdd2; }
  .btn-delete:hover { background: #ffcdd2; }
  /* Estilo para el botón Cotizar (Azul Oscuro para diferenciar) */
  .btn-cotizar { background: #003366; color: white; border: 1px solid #002244; }
  .btn-cotizar:hover { background: #002244; }

  .empty-state { padding: 20px; text-align: center; background: #fff; border-radius: 8px; color: #777; }

  @media (max-width: 900px) {
    .layout-grid { grid-template-columns: 1fr; }
  }
</style>