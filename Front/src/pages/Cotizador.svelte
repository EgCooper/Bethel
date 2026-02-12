<script>
  import { onMount, createEventDispatcher } from "svelte";
  import axios from "axios";
  import Swal from 'sweetalert2'; 

  const dispatch = createEventDispatcher();
  
  // PROPS
  export let idEdicion = null; 
  export let autoPreseleccionado = null; 

  // ESTADO
  let cargando = false;
  
  // CLIENTE
  let cliente = { nombre: "", whatsapp: "" };
  let cliente_id_mongo = null; 
  let sugerenciasClientes = [];
  let mostrarSugClientes = false;

  // VEHÍCULO
  let vehiculo = { 
    marca: "", modelo: "", anio: 2025, color: "",
    motor: "", traccion: "", transmision: "", combustible: "",
    vin: "", lote: "", descripcion_extra: ""
  };
  
  // BUSCADOR INVENTARIO
  let busquedaVehiculo = "";
  let sugerenciasVehiculos = [];
  let mostrarSugVehiculos = false;
  let inventarioCompleto = []; 

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
      seleccionarVehiculoDeInventario(autoPreseleccionado);
    }
  });

  function volver() {
    dispatch('volver'); 
  }

  // --- CARGAS ---
  async function cargarInventarioParaBusqueda() {
    try {
        const res = await axios.get("/api/vehiculos");
        inventarioCompleto = res.data;
    } catch (e) { console.error("Error inventario", e); }
  }

  async function cargarCotizacionExistente() {
      try {
        const res = await axios.get(`/api/cotizacion/${idEdicion}`);
        const data = res.data;
        
        vehiculo = { ...vehiculo, ...data.vehiculo }; 
        costos = { ...data.costos };
        tipo_cambio = data.totales.tipo_cambio;
        
        if (data.cliente_id) {
          cliente = { nombre: data.cliente_id.nombre_completo, whatsapp: data.cliente_id.whatsapp };
          cliente_id_mongo = data.cliente_id._id;
        }
      } catch (error) { Swal.fire('Error', 'No se pudo cargar la cotización.', 'error'); }
  }

  // --- BUSCADOR VEHÍCULOS ---
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
      vehiculo = {
          marca: auto.marca,
          modelo: auto.modelo,
          anio: auto.año || auto.anio,
          color: auto.color || "",
          motor: "", 
          traccion: "", 
          transmision: auto.transmision || "",
          combustible: auto.tipo_combustible || "",
          vin: auto.vin || "",
          lote: "",
          descripcion_extra: auto.descripcion || ""
      };
      costos.precio_subasta = auto.precio || auto.precio_usd || 0;
      busquedaVehiculo = `${auto.marca} ${auto.modelo}`;
      mostrarSugVehiculos = false;
  }

  function cerrarSugVehiculos() { setTimeout(() => { mostrarSugVehiculos = false; }, 200); }

  // --- BUSCADOR CLIENTES ---
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

  // --- CÁLCULOS ---
  $: costo_giro = (costos.precio_subasta + costos.impuestos_subasta) * 0.06;
  $: subtotal_usa = costos.precio_subasta + costos.impuestos_subasta + costo_giro + costos.grua_usa;
  $: total_usd = subtotal_usa + costos.flete_maritimo + costos.transporte_terrestre + costos.comision_gestion + costos.tramites_aduana + costos.reparaciones + costos.otros;
  $: total_bob = total_usd * tipo_cambio;

  // --- GUARDAR ---
  async function guardarCotizacion() {
    if (!cliente.nombre) return Swal.fire('Falta Cliente', 'Ingrese el nombre del Cliente', 'warning');
    if (!vehiculo.marca) return Swal.fire('Falta Vehículo', 'Ingrese la Marca del vehículo', 'warning');
    
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

    try {
      Swal.fire({ title: 'Procesando...', didOpen: () => Swal.showLoading() });

      if (idEdicion) {
        await axios.put(`/api/cotizacion/${idEdicion}`, payload);
        dispatch('guardado', { id: idEdicion });
      } else {
        const res = await axios.post("/api/cotizar", payload);
        dispatch('guardado', { id: res.data.id });
      }
      
      Swal.fire({ icon: 'success', title: 'Cotización Guardada', timer: 1500, showConfirmButton: false });

    } catch (error) { 
        console.error(error);
        const msg = error.response?.data?.error || "Error de conexión";
        Swal.fire('Error', msg, 'error'); 
    }
  }
</script>

<div class="cotizador-wrapper">
  
  <div class="header-flex">
      <button class="btn-pill btn-outline-blue" on:click={volver}>← Volver</button>
      <h2 class="page-title">{idEdicion ? 'Editar Cotización' : 'Nueva Cotización'}</h2>
      <div class="spacer-desktop"></div>
  </div>

  <div class="grid-layout">
    
    <div class="column-left">
      
      <div class="card">
        <h3>Datos del Cliente</h3>
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
            <h3>Detalles del Vehículo</h3>
            
            <div class="search-box relative">
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
          <div class="input-group"><label>Motor</label><input type="text" bind:value={vehiculo.motor} placeholder="Ej: 2.7L" /></div>
          <div class="input-group"><label>Tracción</label><input type="text" bind:value={vehiculo.traccion} placeholder="Ej: 4x4" /></div>
          <div class="input-group"><label>Transmisión</label><input type="text" bind:value={vehiculo.transmision} /></div>
          <div class="input-group"><label>Combustible</label><input type="text" bind:value={vehiculo.combustible} /></div>
          <div class="input-group"><label>VIN</label><input type="text" bind:value={vehiculo.vin} class="mono" /></div>
          <div class="input-group"><label>Lote</label><input type="text" bind:value={vehiculo.lote} /></div>
        </div>
      </div>

      <div class="card">
        <h3>Costos en Origen (USA)</h3>
        <div class="form-grid-3">
          <div class="input-group">
            <label>Precio Compra ($)</label>
            <input type="number" class="input-highlight" bind:value={costos.precio_subasta} />
          </div>
          <div class="input-group">
            <label>Impuestos/Fees ($)</label>
            <input type="number" bind:value={costos.impuestos_subasta} />
          </div>
          <div class="input-group">
            <label>Grúa/Transporte ($)</label>
            <input type="number" bind:value={costos.grua_usa} />
          </div>
        </div>
        <div class="info-row">
            <span>Costo Giro Bancario (6%):</span> 
            <strong>${costo_giro.toFixed(2)}</strong>
        </div>
      </div>

      <div class="card">
        <h3>Logística y Aduana</h3>
        <div class="form-grid-2">
             <div class="input-group"><label>Flete Marítimo</label><input type="number" bind:value={costos.flete_maritimo} /></div>
             <div class="input-group"><label>Transporte Terrestre</label><input type="number" bind:value={costos.transporte_terrestre} /></div>
             <div class="input-group"><label>Comisión Gestión</label><input type="number" bind:value={costos.comision_gestion} /></div>
             <div class="input-group"><label>Trámites Aduana</label><input type="number" bind:value={costos.tramites_aduana} /></div>
             <div class="input-group"><label>Reparaciones</label><input type="number" bind:value={costos.reparaciones} /></div>
             <div class="input-group"><label>Otros Gastos</label><input type="number" bind:value={costos.otros} /></div>
        </div>
      </div>
    </div>

    <div class="column-right">
      <div class="card total-card">
        <h3>Resumen Final</h3>
        
        <div class="exchange-row">
            <label>T. Cambio (Bs):</label> 
            <input type="number" step="0.01" bind:value={tipo_cambio} />
        </div>
        
        <div class="totals-display">
          <div class="total-line">
            <span>Total Inversión (USD):</span> 
            <span class="amount usd">${total_usd.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
          </div>
          <div class="divider"></div>
          <div class="total-line big">
            <span>Total Estimado (BOB):</span> 
            <span class="amount bob">Bs {total_bob.toLocaleString('es-BO', {minimumFractionDigits: 2})}</span>
          </div>
        </div>
        
        <button class="btn-pill btn-solid-red full-width" on:click={guardarCotizacion}>
            {idEdicion ? 'Guardar Cambios' : 'Generar Cotización'}
        </button>
      </div>
    </div>

  </div>
</div>

<style>
  /* --- VARIABLES --- */
  :root {
    --primary: #003366; 
    --primary-hover: #002244;
    --red-bethel: #cc0000;
    --red-hover: #a30000;
    --bg-light: #f4f4f9;
    --white: #ffffff;
    --border: #e5e7eb;
    --radius: 12px;
    --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .cotizador-wrapper { max-width: 1200px; margin: 0 auto; padding: 20px; font-family: 'Segoe UI', sans-serif; }
  
  /* --- HEADER --- */
  .header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 2px solid var(--primary); padding-bottom: 15px; }
  .page-title { margin: 0; color: var(--primary); font-size: 1.5rem; font-weight: 800; }
  .spacer-desktop { width: 100px; }

  /* --- BOTONES PILL --- */
  .btn-pill {
    padding: 10px 24px; border-radius: 50px; font-weight: 700; cursor: pointer;
    transition: all 0.2s; border: 1px solid transparent; font-size: 0.95rem; text-align: center;
  }
  
  .btn-outline-blue { background: white; color: var(--primary); border-color: var(--primary); }
  .btn-outline-blue:hover { background: var(--primary); color: white; }

  .btn-solid-red { background: var(--red-bethel); color: white; border-color: var(--red-bethel); font-size: 1.1rem; padding: 14px; }
  .btn-solid-red:hover { background: var(--red-hover); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(204, 0, 0, 0.3); }

  .full-width { width: 100%; margin-top: 15px; display: block; }

  /* --- GRID LAYOUT --- */
  .grid-layout { display: grid; grid-template-columns: 1.5fr 1fr; gap: 30px; align-items: start; }
  .column-left { display: flex; flex-direction: column; gap: 20px; }
  
  /* --- CARDS --- */
  .card { 
    background: var(--white); padding: 25px; border-radius: var(--radius); 
    box-shadow: var(--shadow); border: 1px solid var(--border); position: relative; 
  }
  
  .card h3 { margin: 0 0 20px 0; color: var(--primary); font-size: 1.1rem; border-bottom: 1px solid var(--border); padding-bottom: 10px; }
  .card-header-flex { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 10px; margin-bottom: 20px; }
  .card-header-flex h3 { border: none; margin: 0; padding: 0; }

  /* --- FORMULARIOS --- */
  .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
  .form-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }

  .input-group { display: flex; flex-direction: column; }
  .input-group label { font-size: 0.8rem; font-weight: 700; color: #555; margin-bottom: 5px; }
  input { 
    padding: 10px; border: 1px solid #ccc; border-radius: 8px; font-size: 0.95rem; 
    background: #f9fafb; transition: 0.2s; box-sizing: border-box; width: 100%;
  }
  input:focus { border-color: var(--primary); outline: none; background: white; box-shadow: 0 0 0 3px rgba(0, 51, 102, 0.1); }

  .input-highlight { background-color: #fffbeb; border-color: #f59e0b; }
  .mono { font-family: monospace; letter-spacing: 1px; }
  .relative { position: relative; }

  /* --- BUSCADORES --- */
  .search-box input { border-color: #28a745; width: 220px; padding-left: 30px; border-radius: 20px; }
  .lista-sugerencias { 
    position: absolute; top: 100%; left: 0; right: 0; background: white; 
    border: 1px solid #ccc; z-index: 100; max-height: 200px; overflow-y: auto; 
    padding: 0; list-style: none; box-shadow: 0 10px 20px rgba(0,0,0,0.1); 
    border-radius: 8px; margin-top: 5px; 
  }
  .lista-sugerencias li { padding: 12px; border-bottom: 1px solid #f0f0f0; cursor: pointer; font-size: 0.9rem; }
  .lista-sugerencias li:hover { background: #f0f8ff; color: var(--primary); }

  /* --- INFO ROW --- */
  .info-row { background: #eef2f6; padding: 12px; border-radius: 8px; display: flex; justify-content: space-between; margin-top: 15px; font-size: 0.9rem; color: #333; }

  /* --- TOTALS CARD (Sticky) --- */
  .total-card { background: #001a33; color: white; border: none; position: sticky; top: 20px; }
  .total-card h3 { color: white; border-color: rgba(255,255,255,0.2); }
  
  .exchange-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 25px; background: rgba(255,255,255,0.1); padding: 10px; border-radius: 8px; }
  .exchange-row label { color: #ccc; margin: 0; font-weight: normal; }
  .exchange-row input { width: 80px; text-align: center; background: transparent; border: 1px solid rgba(255,255,255,0.3); color: white; font-weight: bold; padding: 5px; }

  .totals-display { padding: 10px 0; }
  .total-line { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 1.1rem; }
  .total-line.big { margin-top: 15px; font-size: 1.3rem; }
  
  .divider { height: 1px; background: rgba(255,255,255,0.2); margin: 15px 0; }
  
  .amount.usd { color: #ffcccc; font-weight: bold; }
  .amount.bob { color: #ffffff; font-weight: 800; font-size: 1.6rem; }

  /* --- RESPONSIVE --- */
  @media (max-width: 900px) {
    .grid-layout { grid-template-columns: 1fr; }
    /* ✅ ORDEN CORREGIDO: En móvil, la tarjeta de totales va al final (flujo normal) */
    .total-card { position: static; margin-top: 30px; }
  }
  @media (max-width: 600px) {
    .header-flex { flex-direction: column; gap: 15px; text-align: center; }
    .spacer-desktop { display: none; }
    .form-grid-2, .form-grid-3 { grid-template-columns: 1fr; }
    .card-header-flex { flex-direction: column; align-items: flex-start; gap: 10px; }
    .search-box input { width: 100%; }
  }
</style>