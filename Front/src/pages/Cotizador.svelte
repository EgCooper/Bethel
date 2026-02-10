<script>
  import { onMount, createEventDispatcher } from "svelte";
  import axios from "axios";
  import Swal from 'sweetalert2'; 

  const dispatch = createEventDispatcher();
  
  // PROPS RECIBIDAS
  export let idEdicion = null; 
  export let autoPreseleccionado = null; 

  // --- ESTADO ---
  let cargando = false;
  
  // CLIENTE
  let cliente = { nombre: "", whatsapp: "" };
  let cliente_id_mongo = null; 
  let sugerenciasClientes = [];
  let mostrarSugClientes = false;

  // VEHÍCULO (AHORA CON MÁS DETALLES)
  let vehiculo = { 
    marca: "", modelo: "", anio: 2025, color: "",
    motor: "", traccion: "", transmision: "", combustible: "",
    vin: "", lote: "", descripcion_extra: ""
  };
  
  // BUSCADOR DE INVENTARIO
  let busquedaVehiculo = "";
  let sugerenciasVehiculos = [];
  let mostrarSugVehiculos = false;
  let inventarioCompleto = []; // Cargamos todo para buscar rápido localmente

  // COSTOS
  let costos = {
    precio_subasta: 0, impuestos_subasta: 0, grua_usa: 0,
    flete_maritimo: 0, transporte_terrestre: 0,
    comision_gestion: 900, tramites_aduana: 700,
    reparaciones: 0, otros: 0
  };

  let tipo_cambio = 9.50; 

  // --- CICLO DE VIDA ---
  onMount(async () => {
    await cargarInventarioParaBusqueda();

    if (idEdicion) {
      await cargarCotizacionExistente();
    } else if (autoPreseleccionado) {
      // Si venimos del botón "Cotizar" del inventario
      seleccionarVehiculoDeInventario(autoPreseleccionado);
    }
  });

  function volver() {
    dispatch('guardado', { cancelado: true }); // O simplemente volver
    // Si usas el sistema de navegación de App.svelte, esto debería manejarse arriba.
    // Emitimos un evento genérico para que el padre decida.
    dispatch('volver'); // Asegúrate de manejar este evento en App.svelte si es necesario, o usa la prop on:volver
  }

  // --- LOGICA DE CARGA ---
  async function cargarInventarioParaBusqueda() {
    try {
        const res = await axios.get("/api/vehiculos");
        inventarioCompleto = res.data;
    } catch (e) { console.error("Error cargando inventario", e); }
  }

  async function cargarCotizacionExistente() {
      try {
        const res = await axios.get(`/api/cotizacion/${idEdicion}`);
        const data = res.data;
        
        // Mapear datos viejos a estructura nueva si es necesario
        vehiculo = { ...vehiculo, ...data.vehiculo }; 
        costos = { ...data.costos };
        tipo_cambio = data.totales.tipo_cambio;
        
        if (data.cliente_id) {
          cliente = { nombre: data.cliente_id.nombre_completo, whatsapp: data.cliente_id.whatsapp };
          cliente_id_mongo = data.cliente_id._id;
        }
      } catch (error) { Swal.fire('Error', 'No se pudo cargar la cotización.', 'error'); }
  }

  // --- BUSCADOR DE VEHÍCULOS (INVENTARIO) ---
  function filtrarVehiculos() {
      if (busquedaVehiculo.length < 2) { sugerenciasVehiculos = []; return; }
      const termino = busquedaVehiculo.toLowerCase();
      sugerenciasVehiculos = inventarioCompleto.filter(v => 
          v.marca.toLowerCase().includes(termino) || 
          v.modelo.toLowerCase().includes(termino) ||
          (v.vin && v.vin.toLowerCase().includes(termino))
      );
      mostrarSugVehiculos = true;
  }

  function seleccionarVehiculoDeInventario(auto) {
      // 1. Llenar datos del vehículo
      vehiculo = {
          marca: auto.marca,
          modelo: auto.modelo,
          anio: auto.año || auto.anio,
          color: auto.color || "",
          motor: "", // Si lo tienes en BD agrégalo
          traccion: "", 
          transmision: auto.transmision || "",
          combustible: auto.tipo_combustible || "",
          vin: auto.vin || "",
          lote: "",
          descripcion_extra: auto.descripcion || ""
      };

      // 2. Llenar precio base (Subasta)
      costos.precio_subasta = auto.precio || auto.precio_usd || 0;
      
      // 3. Resetear buscador UI
      busquedaVehiculo = `${auto.marca} ${auto.modelo}`;
      mostrarSugVehiculos = false;
  }

  function cerrarSugVehiculos() { setTimeout(() => { mostrarSugVehiculos = false; }, 200); }


  // --- BUSCADOR DE CLIENTES ---
  async function buscarClientes() {
    if (cliente.nombre.length < 2) { sugerenciasClientes = []; return; }
    try {
      const res = await axios.get(`/api/clientes?busqueda=${cliente.nombre}`);
      sugerenciasClientes = res.data;
      mostrarSugClientes = true;
    } catch (e) { console.error(e); }
  }
  
  function seleccionarCliente(s) {
    cliente.nombre = s.nombre_completo; cliente.whatsapp = s.whatsapp; cliente_id_mongo = s._id;
    sugerenciasClientes = []; mostrarSugClientes = false;
  }
  
  function cerrarSugClientes() { setTimeout(() => { mostrarSugClientes = false; }, 200); }


  // --- CÁLCULOS REACTIVOS ---
  $: costo_giro = (costos.precio_subasta + costos.impuestos_subasta) * 0.06;
  $: subtotal_usa = costos.precio_subasta + costos.impuestos_subasta + costo_giro + costos.grua_usa;
  $: total_usd = subtotal_usa + costos.flete_maritimo + costos.transporte_terrestre + costos.comision_gestion + costos.tramites_aduana + costos.reparaciones + costos.otros;
  $: total_bob = total_usd * tipo_cambio;


  // --- GUARDAR ---
  // --- GUARDAR ---
  async function guardarCotizacion() {
    console.log("1. 🟢 Botón presionado"); // ¿Aparece esto?

    // Validación
    if (!cliente.nombre) {
        console.log("❌ Falta nombre del cliente");
        return Swal.fire('Faltan datos', 'Ingrese el nombre del Cliente', 'warning');
    }
    if (!vehiculo.marca) {
        console.log("❌ Falta marca del vehículo");
        return Swal.fire('Faltan datos', 'Ingrese la Marca del vehículo', 'warning');
    }
    
    console.log("2. ✅ Datos validados. Preparando envío...");

    const usuarioLogueado = JSON.parse(localStorage.getItem("usuario"));
    const desc_completa = `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio}`;

    const payload = {
      cliente, 
      cliente_id: cliente_id_mongo, 
      vehiculo: { ...vehiculo, descripcion: desc_completa }, 
      costos: { ...costos, costo_giro }, 
      totales: { tipo_cambio, total_usd, total_bob },
      asesor_id: usuarioLogueado ? usuarioLogueado.id : null
    };

    console.log("3. 📦 Enviando payload:", payload);

    try {
      if (idEdicion) {
        await axios.put(`/api/cotizacion/${idEdicion}`, payload);
        console.log("4. 🔵 Editado con éxito");
        dispatch('guardado', { id: idEdicion });
      } else {
        // AQUÍ ES DONDE SUELE FALLAR SI LA RUTA NO EXISTE
        console.log("4. 🚀 Enviando POST a /api/cotizar...");
        const res = await axios.post("/api/cotizar", payload);
        console.log("5. 🟢 Respuesta recibida:", res.data);
        dispatch('guardado', { id: res.data.id });
      }
      
      Swal.fire({ icon: 'success', title: 'Cotización Guardada', timer: 1500, showConfirmButton: false });

    } catch (error) { 
        console.error("6. 🔴 ERROR AL GUARDAR:", error);
        // Mostrar el error real en la alerta
        const msg = error.response?.data?.error || "Error de conexión o Ruta no encontrada (404)";
        Swal.fire('Error', msg, 'error'); 
    }
  }
</script>

<div class="cotizador-wrapper">
  
  <div class="header-bar">
      <button class="btn-volver" on:click={volver}>← Volver</button>
      <h2>{idEdicion ? '✏️ Editando Cotización' : '📄 Nueva Cotización'}</h2>
      <div style="width: 80px;"></div> </div>

  <div class="grid-layout">
    
    <div class="column">
      
      <div class="card">
        <h3>👤 Datos del Cliente</h3>
        <div class="form-grid-2">
          <div class="input-group relative">
            <label>Nombre Completo</label>
            <input 
                type="text" 
                bind:value={cliente.nombre} 
                on:input={buscarClientes} 
                on:blur={cerrarSugClientes} 
                placeholder="Buscar o escribir nuevo..." 
                autocomplete="off"
            />
            {#if mostrarSugClientes && sugerenciasClientes.length}
                <ul class="lista-sugerencias">
                    {#each sugerenciasClientes as s}
                        <li on:click={() => seleccionarCliente(s)}>
                            <strong>{s.nombre_completo}</strong> <small>({s.whatsapp})</small>
                        </li>
                    {/each}
                </ul>
            {/if}
          </div>
          
          <div class="input-group">
            <label>WhatsApp / Teléfono</label>
            <input type="text" bind:value={cliente.whatsapp} placeholder="Ej: 77712345" />
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header-flex">
            <h3>🚗 Detalles del Vehículo</h3>
            <div class="inventario-search relative">
                <input 
                    type="text" 
                    placeholder="🔍 Buscar en Inventario..." 
                    bind:value={busquedaVehiculo}
                    on:input={filtrarVehiculos}
                    on:blur={cerrarSugVehiculos}
                />
                {#if mostrarSugVehiculos && sugerenciasVehiculos.length}
                    <ul class="lista-sugerencias">
                        {#each sugerenciasVehiculos as v}
                            <li on:click={() => seleccionarVehiculoDeInventario(v)}>
                                <strong>{v.marca} {v.modelo}</strong> <small>{v.anio}</small>
                            </li>
                        {/each}
                    </ul>
                {/if}
            </div>
        </div>

        <div class="form-grid-2">
          <div class="input-group"><label>Marca</label><input type="text" bind:value={vehiculo.marca} /></div>
          <div class="input-group"><label>Modelo</label><input type="text" bind:value={vehiculo.modelo} /></div>
          <div class="input-group"><label>Año</label><input type="number" bind:value={vehiculo.anio} /></div>
          <div class="input-group"><label>Color</label><input type="text" bind:value={vehiculo.color} /></div>
          <div class="input-group"><label>Motor / CC</label><input type="text" bind:value={vehiculo.motor} placeholder="Ej: 2.7L" /></div>
          <div class="input-group"><label>Tracción</label><input type="text" bind:value={vehiculo.traccion} placeholder="Ej: 4x4" /></div>
          <div class="input-group"><label>Transmisión</label><input type="text" bind:value={vehiculo.transmision} /></div>
          <div class="input-group"><label>Combustible</label><input type="text" bind:value={vehiculo.combustible} /></div>
          <div class="input-group"><label>VIN (Chasis)</label><input type="text" bind:value={vehiculo.vin} class="mono" /></div>
          <div class="input-group"><label>Lote / Stock ID</label><input type="text" bind:value={vehiculo.lote} /></div>
        </div>
      </div>

      <div class="card">
        <h3>🇺🇸 Costos en Origen</h3>
        <div class="form-grid-3">
          <div class="input-group">
            <label>Precio Compra ($)</label>
            <input type="number" class="highlight-input" bind:value={costos.precio_subasta} />
          </div>
          <div class="input-group">
            <label>Factura ($)</label>
            <input type="number" bind:value={costos.impuestos_subasta} />
          </div>
          <div class="input-group">
            <label>Transporte US-CH-BO ($)</label>
            <input type="number" bind:value={costos.grua_usa} />
          </div>
        </div>
        <div class="info-row">
            <span>Costo Giro Bancario (6%):</span> 
            <strong>${costo_giro.toFixed(2)}</strong>
        </div>
      </div>
    </div>

    <div class="column">
      <div class="card">
        <h3>🚛 Logística y Aduana</h3>
        <div class="form-grid-1">
             <div class="input-group"><label>Poliza</label><input type="number" bind:value={costos.poliza} /></div>

             <div class="input-group"><label>Transporte Secundario</label><input type="number" bind:value={costos.transporte_terrestre} /></div>
             <div class="input-group"><label>Comisión Gestión</label><input type="number" bind:value={costos.comision_gestion} /></div>
             <div class="input-group"><label>Trámites Aduana</label><input type="number" bind:value={costos.tramites_aduana} /></div>
             <div class="input-group"><label>Reparaciones / Extras</label><input type="number" bind:value={costos.reparaciones} /></div>
        </div>
      </div>

      <div class="card total-card">
        <div class="exchange-row">
            <label>Tipo de Cambio (Bs):</label> 
            <input type="number" step="0.01" bind:value={tipo_cambio} />
        </div>
        
        <div class="totals-display">
          <div class="total-row">
            <span>Total USD:</span> 
            <span class="amount usd">${total_usd.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
          </div>
          <div class="total-row big">
            <span>Total BOB:</span> 
            <span class="amount bob">Bs {total_bob.toLocaleString('es-BO', {minimumFractionDigits: 2})}</span>
          </div>
        </div>
        
        <button class="btn-save" on:click={guardarCotizacion}>
            {idEdicion ? '💾 Actualizar Cotización' : '📄 Generar Cotización'}
        </button>
      </div>
    </div>

  </div>
</div>

<style>
  /* --- LAYOUT GENERAL --- */
  .cotizador-wrapper { max-width: 1200px; margin: 0 auto; padding-bottom: 50px; font-family: 'Segoe UI', sans-serif; }
  
  .header-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 3px solid #003366; padding-bottom: 10px; }
  .header-bar h2 { margin: 0; color: #003366; font-size: 1.5rem; }
  
  .btn-volver { background: none; border: 1px solid #003366; color: #003366; padding: 6px 15px; border-radius: 20px; cursor: pointer; font-weight: bold; transition: 0.2s; }
  .btn-volver:hover { background: #003366; color: white; }

  .grid-layout { display: grid; grid-template-columns: 1.5fr 1fr; gap: 25px; }
  .column { display: flex; flex-direction: column; gap: 20px; }
  
  /* --- TARJETAS --- */
  .card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 1px solid #e0e0e0; position: relative; }
  
  .card h3 { margin-top: 0; color: #003366; font-size: 1.1rem; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 15px; }
  .card-header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
  .card-header-flex h3 { border: none; margin: 0; padding: 0; }

  /* --- FORMULARIOS --- */
  .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
  .form-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
  .form-grid-1 { display: flex; flex-direction: column; gap: 10px; }

  .input-group { display: flex; flex-direction: column; }
  .input-group label { font-size: 0.85rem; font-weight: 600; color: #555; margin-bottom: 4px; }
  .input-group input { padding: 8px 10px; border: 1px solid #ccc; border-radius: 6px; font-size: 0.95rem; }
  .input-group input:focus { border-color: #003366; outline: none; background: #f0f8ff; }

  .highlight-input { background-color: #fffff0; border-color: #ffd700; }
  .mono { font-family: monospace; letter-spacing: 1px; }
  .relative { position: relative; }

  /* --- BUSCADORES (CLIENTE Y INVENTARIO) --- */
  .inventario-search input { border: 1px solid #28a745; width: 200px; padding: 6px; border-radius: 20px; font-size: 0.85rem; padding-left: 15px; }
  .inventario-search input:focus { outline: none; box-shadow: 0 0 5px rgba(40, 167, 69, 0.3); }

  .lista-sugerencias { position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #ccc; z-index: 100; max-height: 200px; overflow-y: auto; padding: 0; list-style: none; box-shadow: 0 5px 15px rgba(0,0,0,0.1); border-radius: 6px; margin-top: 2px; }
  .lista-sugerencias li { padding: 10px; border-bottom: 1px solid #f0f0f0; cursor: pointer; font-size: 0.9rem; }
  .lista-sugerencias li:hover { background: #f0f8ff; color: #003366; }

  /* --- INFO BOXES --- */
  .info-row { background: #f8f9fa; padding: 10px; border-radius: 6px; display: flex; justify-content: space-between; margin-top: 10px; font-size: 0.9rem; color: #555; }

  /* --- TOTALES CARD (STICKY) --- */
  .total-card { background: #003366; color: white; border: none; position: sticky; top: 20px; }
  .exchange-row { display: flex; align-items: center; justify-content: flex-end; gap: 10px; margin-bottom: 20px; }
  .exchange-row label { color: #ccc; margin: 0; }
  .exchange-row input { width: 80px; text-align: center; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); color: white; font-weight: bold; }

  .totals-display { border-top: 1px solid rgba(255,255,255,0.2); padding-top: 20px; margin-bottom: 20px; }
  .total-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 1.1rem; }
  .total-row.big { font-size: 1.4rem; margin-top: 10px; }
  
  .amount.usd { color: #ff9999; font-weight: bold; }
  .amount.bob { color: #ffffff; font-weight: 800; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }

  .btn-save { width: 100%; padding: 15px; background: #cc0000; color: white; border: none; border-radius: 8px; font-size: 1.1rem; font-weight: bold; cursor: pointer; transition: 0.3s; box-shadow: 0 4px 0 #990000; }
  .btn-save:hover { background: #ff0000; transform: translateY(-2px); box-shadow: 0 6px 0 #990000; }
  .btn-save:active { transform: translateY(2px); box-shadow: none; }

  /* RESPONSIVE */
  @media (max-width: 900px) {
    .grid-layout { grid-template-columns: 1fr; }
    .total-card { position: static; }
  }
  @media (max-width: 600px) {
    .form-grid-2, .form-grid-3 { grid-template-columns: 1fr; }
    .card-header-flex { flex-direction: column; align-items: flex-start; gap: 10px; }
    .inventario-search input { width: 100%; }
  }
</style>