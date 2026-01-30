<script>
  import { onMount, createEventDispatcher } from "svelte";
  import axios from "axios";
  import Swal from 'sweetalert2'; 

  const dispatch = createEventDispatcher();
  
  // PROPS
  export let idEdicion = null; 
  export let autoPreseleccionado = null; 

  // ESTADO FORMULARIO
  let cliente = { nombre: "", whatsapp: "" };
  let cliente_id_mongo = null; 
  let vehiculo = { descripcion: "", anio: 2025, vin_lote: "" };

  // COSTOS
  let costos = {
    precio_subasta: 0, impuestos_subasta: 0, grua_usa: 0,
    flete_maritimo: 0, transporte_terrestre: 0,
    comision_gestion: 900, tramites_aduana: 700,
    reparaciones: 0, otros: 0
  };

  let tipo_cambio = 9.50; 
  let guardadoExitoso = false;
  let sugerencias = [];
  let mostrandoSugerencias = false;

  // --- REACTIVIDAD INTELIGENTE ---
  $: if (autoPreseleccionado && !idEdicion) {
      llenarFormulario(autoPreseleccionado);
  }

  function llenarFormulario(datosRecibidos) {
      // 1. DESEMPAQUETAR: Si viene dentro de "auto", lo sacamos. Si no, usamos lo que llegó.
      const auto = datosRecibidos.auto ? datosRecibidos.auto : datosRecibidos;

      console.log("Datos procesados:", auto);

      // 2. EXTRACCIÓN SEGURA DE DATOS
      const marca = auto.marca || "Marca?";
      const modelo = auto.modelo || "Modelo?";
      const color = auto.color || "";
      const trans = auto.transmision || "";
      const comb = auto.tipo_combustible || "";
      const km = auto.kilometraje ? `${auto.kilometraje}km` : "";
      const vin = auto.vin || auto.vin_lote || "S/N";
      const precio = auto.precio_usd || 0;
      const anio = auto.año || auto.anio || 2025;

      // 3. CONSTRUCCIÓN DETALLADA (Aquí agregamos los extras que pediste)
      // Ejemplo: "Yamaha R6 Negro Manual - 20000km (VIN: ...)"
      let detallesExtra = [color, trans, comb, km].filter(Boolean).join(" ");
      
      vehiculo = {
          descripcion: `${marca} ${modelo} ${detallesExtra} (VIN: ${vin})`,
          anio: anio,
          vin_lote: vin
      };

      // 4. COSTOS
      costos = {
          ...costos,
          precio_subasta: precio,
          comision_gestion: 900, // Tus valores por defecto
          tramites_aduana: 700
      };
  }

  // --- CARGAR EDICIÓN ---
  onMount(async () => {
    if (idEdicion) {
      try {
        const res = await axios.get(`http://localhost:3000/api/cotizacion/${idEdicion}`);
        const data = res.data;
        vehiculo = { ...data.vehiculo };
        costos = { ...data.costos };
        tipo_cambio = data.totales.tipo_cambio;
        if (data.cliente_id) {
          cliente = { nombre: data.cliente_id.nombre_completo, whatsapp: data.cliente_id.whatsapp };
          cliente_id_mongo = data.cliente_id._id;
        }
      } catch (error) { Swal.fire('Error', 'No se pudieron cargar los datos.', 'error'); }
    } else if (autoPreseleccionado) {
        llenarFormulario(autoPreseleccionado);
    }
  });

  // CÁLCULOS
  $: costo_giro = (costos.precio_subasta + costos.impuestos_subasta) * 0.06;
  $: subtotal_usa = costos.precio_subasta + costos.impuestos_subasta + costo_giro + costos.grua_usa;
  $: total_usd = subtotal_usa + costos.flete_maritimo + costos.transporte_terrestre + costos.comision_gestion + costos.tramites_aduana + costos.reparaciones + costos.otros;
  $: total_bob = total_usd * tipo_cambio;

  // FUNCIONES AUXILIARES
  async function buscarClientes() {
    if (cliente.nombre.length < 2) { sugerencias = []; return; }
    try {
      const res = await axios.get(`http://localhost:3000/api/clientes?busqueda=${cliente.nombre}`);
      sugerencias = res.data;
      mostrandoSugerencias = true;
    } catch (e) { console.error(e); }
  }
  function seleccionarCliente(s) {
    cliente.nombre = s.nombre_completo; cliente.whatsapp = s.whatsapp; cliente_id_mongo = s._id;
    sugerencias = []; mostrandoSugerencias = false;
  }
  function cerrarSugerencias() { setTimeout(() => { mostrandoSugerencias = false; }, 200); }

  async function guardarCotizacion() {
    if (!cliente.nombre || !vehiculo.descripcion) return Swal.fire('Faltan datos', 'Complete Cliente y Vehículo', 'warning');
    const usuarioLogueado = JSON.parse(localStorage.getItem("usuario"));
    if (!usuarioLogueado) return Swal.fire('Error', 'Usuario no identificado.', 'error');

    const payload = {
      cliente, cliente_id: cliente_id_mongo, vehiculo,
      costos: { ...costos, costo_giro }, totales: { tipo_cambio, total_usd, total_bob },
      asesor_id: usuarioLogueado.id
    };

    try {
      if (idEdicion) {
        await axios.put(`http://localhost:3000/api/cotizacion/${idEdicion}`, payload);
        dispatch('guardado', { id: idEdicion });
      } else {
        const res = await axios.post("http://localhost:3000/api/cotizar", payload);
        dispatch('guardado', { id: res.data.id });
      }
      Swal.fire({ icon: 'success', title: 'Guardado', confirmButtonColor: '#003366' });
      guardadoExitoso = true;
    } catch (error) { Swal.fire('Error', 'No se pudo guardar', 'error'); }
  }
</script>

<div class="cotizador-wrapper">
  <div class="header-section">
    <h2>{idEdicion ? 'Editar Cotización' : 'Nueva Cotización'}</h2>
  </div>

  <div class="grid-layout">
    <div class="column">
      <div class="card">
        <h3>👤 Cliente</h3>
        <div class="row">
          <label style="position:relative">Nombre <input type="text" bind:value={cliente.nombre} on:input={buscarClientes} on:blur={cerrarSugerencias} placeholder="Buscar..." autocomplete="off"/>
            {#if mostrandoSugerencias && sugerencias.length}<ul class="lista-sugerencias">{#each sugerencias as s}<li on:click={() => seleccionarCliente(s)}>{s.nombre_completo}</li>{/each}</ul>{/if}
          </label>
          <label>Whatsapp <input type="text" bind:value={cliente.whatsapp} /></label>
        </div>
        
        <h3>🚗 Vehículo</h3>
        <div class="row">
          <label>Descripción Completa <input type="text" bind:value={vehiculo.descripcion} /></label>
          <label style="width:80px">Año <input type="number" bind:value={vehiculo.anio} /></label>
        </div>
      </div>

      <div class="card">
        <h3>🇺🇸 Origen</h3>
        <div class="row">
          <label>Subasta ($) <input type="number" class="highlight-input" bind:value={costos.precio_subasta} /></label>
          <label>Factura ($) <input type="number" bind:value={costos.impuestos_subasta} /></label>
        </div>
        <div class="info-box"><span>Giro (6%):</span> <strong>${costo_giro.toFixed(2)}</strong></div>
      </div>
    </div>

    <div class="column">
      <div class="card">
        <h3>🚛 Logística</h3>
        <div class="row"> <label>Transporte <input type="number" bind:value={costos.transporte_terrestre} /></label></div>
        <div class="row"><label>Gestión <input type="number" bind:value={costos.comision_gestion} /></label> <label>Trámites <input type="number" bind:value={costos.tramites_aduana} /></label></div>
        <label>Reparacion <input type="number" bind:value={costos.reparaciones} /></label>
      </div>

      <div class="card total-card">
        <label class="tc-label">T.C. (Bs): <input type="number" step="0.01" bind:value={tipo_cambio} /></label>
        <div class="totals-display">
          <div class="total-row"><span>Total USD:</span> <span class="amount usd">${total_usd.toLocaleString('en-US')}</span></div>
          <div class="total-row"><span>Total BOB:</span> <span class="amount bob">Bs {total_bob.toLocaleString('es-BO')}</span></div>
        </div>
        <button class="btn-save" on:click={guardarCotizacion}>Guardar Cotización</button>
      </div>
    </div>
  </div>
</div>

<style>
  .cotizador-wrapper { max-width: 1100px; margin: 0 auto; }
  .header-section { margin-bottom: 20px; text-align: center; color: #003366; }
  .grid-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .column { display: flex; flex-direction: column; gap: 20px; }
  .card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e0e0e0; }
  h3 { margin-top: 0; color: #003366; font-size: 1.1rem; border-bottom: 2px solid #ff0000; padding-bottom: 8px; display: inline-block; }
  .row { display: flex; gap: 15px; margin-bottom: 10px; }
  label { flex: 1; display: flex; flex-direction: column; font-size: 0.9rem; font-weight: 600; color: #555; }
  input { padding: 10px; border: 1px solid #ccc; border-radius: 6px; margin-top: 5px; font-size: 1rem; }
  .highlight-input { border-color: #ccc; background-color: #fffff0; }
  .info-box { background: #f0f4f8; padding: 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; color: #003366; }
  .total-card { background: #003366; color: white; border: none; }
  .total-card h3 { color: white; border-bottom-color: white; }
  .total-card label { color: #ccc; }
  .total-card input { color: #000; font-weight: bold; text-align: center; background: #fff3cd; border: none; }
  .totals-display { margin: 20px 0; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 15px; }
  .total-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 1.1rem; }
  .amount.usd { color: #ff6666; font-weight: bold; }
  .amount.bob { color: white; font-weight: bold; }
  .btn-save { width: 100%; padding: 15px; background: #ff0000; color: #ffffff; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; }
  .lista-sugerencias { position: absolute; top: 70px; left: 0; right: 0; background: white; border: 1px solid #ccc; z-index: 1000; max-height: 200px; overflow-y: auto; padding: 0; list-style: none; }
  .lista-sugerencias li { padding: 10px; border-bottom: 1px solid #eee; cursor: pointer; }
  .lista-sugerencias li:hover { background: #f0f4f8; }
  @media(max-width: 768px) { .grid-layout { grid-template-columns: 1fr; } }
</style>