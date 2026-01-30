<script>
  import { onMount, createEventDispatcher } from "svelte";
  import axios from "axios";
  import html2pdf from "html2pdf.js";
  import Swal from 'sweetalert2'; 
  const dispatch = createEventDispatcher();

  export let id; 
  

  let cotizacion = null;
  let cargando = true;

  onMount(async () => {
    try {
      // CORREGIDO: Ruta relativa para que funcione en Vercel/Render
      const res = await axios.get(`/api/cotizacion/${id}`);
      cotizacion = res.data;
      cargando = false;
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo cargar la cotización. Intente nuevamente.", "error");
      dispatch('volver'); // Si falla, volvemos atrás automáticamente
    }
  });

  // --- 1. FUNCIÓN GENERAR PDF ---
  function descargarPDF() {
    const element = document.getElementById('contenido-pdf');
    
    const nombreCliente = cotizacion.cliente_id 
        ? cotizacion.cliente_id.nombre_completo 
        : cotizacion.cliente.nombre;
    
    const opt = {
      margin:       [0.3, 0.3, 0.3, 0.3], 
      filename:     `Cotizacion_${nombreCliente}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, scrollY: 0 }, 
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // @ts-ignore
    html2pdf().set(opt).from(element).save();
  }

  // --- 2. FUNCIÓN WHATSAPP ---
  function enviarWhatsapp() {
    const nombre = cotizacion.cliente_id ? cotizacion.cliente_id.nombre_completo : cotizacion.cliente.nombre;
    let telefono = cotizacion.cliente_id ? cotizacion.cliente_id.whatsapp : cotizacion.cliente.whatsapp;
    const auto = cotizacion.vehiculo.descripcion;

    if (!telefono) {
      Swal.fire('Error', 'Este cliente no tiene número de celular registrado.', 'error');
      return;
    }

    telefono = telefono.replace(/\D/g, ''); // Quitamos símbolos no numéricos

    // Asumimos código de país si falta
    if (telefono.length === 8) {
      telefono = '591' + telefono;
    }

    const mensaje = `Hola *${nombre}*, le saluda Bethel Importaciones. 🇧🇴\n\nAdjunto le envío la cotización detallada para la importación de su *${auto} ${cotizacion.vehiculo.anio}*.\n\nPor favor revise el PDF. Quedo atento a sus consultas.\n\nSaludos!`;

    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  }

  function regresar() {
    dispatch('volver'); 
  }
</script>

{#if cargando}
  <div class="loading">
    <div class="spinner"></div>
    <p>Generando vista previa...</p>
  </div>
{:else}
  
  <div class="contenedor-vista">

    <div class="acciones no-print">
      <button class="btn-pdf" on:click={descargarPDF}>📄 Descargar PDF</button>
      <button class="btn-whatsapp" on:click={enviarWhatsapp}>📱 Enviar WhatsApp</button>
      <button class="btn-volver" on:click={regresar}>🔙 Volver</button>
    </div>

    <div id="contenido-pdf" class="hoja-impresion">
      
      <header>
        <div class="empresa">
          <h1>BETHEL IMPORTACIONES</h1>
        </div>
        <div class="titulo-doc">
          <h2>COTIZACIÓN DE IMPORTACIÓN 2026</h2>
          <p class="fecha">Fecha: {new Date(cotizacion.fecha).toLocaleDateString()}</p>
        </div>
      </header>

      <section class="datos-grid">
        <div class="box">
          <h3>CLIENTE</h3>
          <p><strong>Nombre:</strong> {cotizacion.cliente_id ? cotizacion.cliente_id.nombre_completo : cotizacion.cliente.nombre}</p>
          <p><strong>Contacto:</strong> {cotizacion.cliente_id ? cotizacion.cliente_id.whatsapp : cotizacion.cliente.whatsapp}</p>
        </div>
        <div class="box">
          <h3>VEHÍCULO</h3>
          <p><strong>Unidad:</strong> {cotizacion.vehiculo.descripcion}</p>
          <p><strong>Año:</strong> {cotizacion.vehiculo.anio}</p>
        </div>
      </section>
<div class="table-scroll">
      <table class="tabla-azul">

        
        <thead>
          <tr>
            <th>Concepto</th>
            <th>Detalle / Justificación</th>
            <th class="derecha">Monto USD</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Compra en Subasta</td>
            <td>Precio de adjudicación (Bid)</td>
            <td class="derecha">{cotizacion.costos.precio_subasta.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Factura</td>
            <td>Facturación declarada e impuestos</td>
            <td class="derecha">{cotizacion.costos.impuestos_subasta.toFixed(2)}</td>
          </tr>
          
          <tr class="subtotal">
            <td colspan="2">SUBTOTAL COMPRA + FACTURA</td>
            <td class="derecha">{(cotizacion.costos.precio_subasta + cotizacion.costos.impuestos_subasta).toFixed(2)}</td>
          </tr>

          <tr>
            <td>Giro al exterior (6%)</td>
            <td>Calculado sobre subtotal de compra</td>
            <td class="derecha">{cotizacion.costos.costo_giro.toFixed(2)}</td>
          </tr>

          <tr>
            <td>Transporte Internacional</td>
            <td>Logística EE.UU. – Chile – Bolivia</td>
            <td class="derecha">{cotizacion.costos.transporte_terrestre.toFixed(2)}</td>
          </tr>

          <tr>
            <td>Comisión Bettel</td>
            <td>Gestión, acompañamiento y asesoría</td>
            <td class="derecha">{cotizacion.costos.comision_gestion.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Trámites y Papeles</td>
            <td>Gestión en frontera y despachante</td>
            <td class="derecha">{cotizacion.costos.tramites_aduana.toFixed(2)}</td>
          </tr>

          {#if cotizacion.costos.reparaciones > 0}
          <tr>
            <td>Reparaciones / Otros</td>
            <td>Detalles adicionales acordados</td>
            <td class="derecha">{cotizacion.costos.reparaciones.toFixed(2)}</td>
          </tr>
          {/if}

        </tbody>
        <tfoot>
          <tr class="fila-total-usd">
            <td colspan="2">TOTAL ESTIMADO (DÓLARES)</td>
            <td class="derecha">$ {cotizacion.totales.total_usd.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
          </tr>
          <tr class="fila-total-bob">
            <td colspan="2">TOTAL EN BOLIVIANOS (T.C. {cotizacion.totales.tipo_cambio})</td>
            <td class="derecha">Bs {cotizacion.totales.total_bob.toLocaleString('es-BO', {minimumFractionDigits: 2})}</td>
          </tr>
        </tfoot>
      </table>
</div>

      <div class="contacto-final">
        {#if cotizacion.asesor_id}
          <p>👨‍💼 Asesor: <strong>{cotizacion.asesor_id.nombre}</strong></p>
          <p>📞 {cotizacion.asesor_id.telefono || 'Sin teléfono directo'}</p>
        {/if}
        <div class="links-footer">
            <span>📍 Cochabamba, Bolivia</span>
            <span>🌐 Bethel Importaciones</span>
        </div>
      </div>

    </div>
  </div>
{/if}
<style>
  /* --- CONTENEDOR PRINCIPAL (FONDO GRIS) --- */
  .contenedor-vista {
    background-color: #555;
    padding: 20px;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  /* --- LA HOJA DE PAPEL --- */
  .hoja-impresion {
    background: white;
    width: 100%;
    max-width: 800px; /* Ancho máximo en PC */
    padding: 40px; 
    box-shadow: 0 0 15px rgba(0,0,0,0.5);
    font-family: 'Arial', sans-serif;
    color: #333;
    margin-bottom: 30px;
    box-sizing: border-box;
  }

  /* --- HEADER --- */
  header { text-align: center; border-bottom: 3px solid #003366; padding-bottom: 20px; margin-bottom: 30px; }
  h1 { margin: 0; color: #003366; letter-spacing: 1px; font-size: 1.8rem; }
  h2 { margin: 10px 0; font-size: 1.1rem; background: #cc0000; display: inline-block; padding: 5px 15px; border-radius: 4px; color: #ffffff; }
  .fecha { font-size: 0.9rem; color: #555; margin-top: 5px; }

  /* --- GRID DE DATOS (CLIENTE / VEHICULO) --- */
  .datos-grid { display: flex; gap: 20px; margin-bottom: 30px; }
  .box { flex: 1; border: 1px solid #ddd; padding: 15px; border-radius: 5px; background: #f9f9f9; }
  .box h3 { margin-top: 0; font-size: 1rem; color: #003366; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
  .box p { margin: 5px 0; font-size: 0.9rem; word-wrap: break-word; }

  /* --- TABLA --- */
  .table-scroll { width: 100%; overflow-x: auto; } /* Permite scroll horizontal en móvil */
  
  .tabla-azul { width: 100%; border-collapse: collapse; margin-bottom: 30px; min-width: 500px; /* Fuerza ancho mínimo para que no se aplaste */ }
  .tabla-azul th { background: #003366; color: white; padding: 10px; text-align: left; font-size: 0.9rem; }
  .tabla-azul td { padding: 8px 10px; border-bottom: 1px solid #eee; font-size: 0.9rem; }
  .tabla-azul .derecha { text-align: right; }
  
  .subtotal td { font-weight: bold; background: #eef2f5; color: #555; }
  
  tfoot td { padding: 12px; font-weight: bold; font-size: 1rem; }
  .fila-total-usd { background: #cc0000; color: #ffffff; }
  .fila-total-bob { background: #003366; color: white; }

  /* --- FOOTER --- */
  .contacto-final { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 0.9rem; color: #666; }
  .links-footer { display: flex; gap: 20px; justify-content: center; margin-top: 10px; font-weight: bold; color: #003366; flex-wrap: wrap; }

  /* --- BOTONES DE ACCIÓN --- */
  .acciones { text-align: center; margin-bottom: 20px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; width: 100%; }
  
  button { 
    padding: 12px 15px; border: none; cursor: pointer; font-weight: bold; 
    border-radius: 5px; font-size: 0.9rem; transition: transform 0.1s; 
    box-shadow: 0 4px 6px rgba(0,0,0,0.2); 
    display: flex; align-items: center; justify-content: center; gap: 8px; flex: 1; min-width: 140px;
  }
  button:hover { transform: scale(1.05); }
  
  .btn-pdf { background: #ffcc00; color: #003366; }
  .btn-whatsapp { background: #25D366; color: white; }
  .btn-volver { background: white; color: #333; }

  .loading { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 50vh; color: white; }
  .spinner { border: 4px solid rgba(255,255,255,0.3); border-top: 4px solid white; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 15px; }
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

  /* --- MODO CELULAR (RESPONSIVE) --- */
  @media (max-width: 600px) {
    .contenedor-vista { padding: 10px; } /* Menos borde gris */
    .hoja-impresion { padding: 20px; width: 100%; } /* Hoja ocupa todo el ancho */
    
    h1 { font-size: 1.4rem; }
    h2 { font-size: 0.9rem; }
    
    .datos-grid { flex-direction: column; gap: 10px; } /* Cajas una debajo de otra */
    
    /* En móvil, los botones se apilan */
    .acciones { flex-direction: column; }
    button { width: 100%; }
    
    /* Ajustes de fuente para que quepa */
    .tabla-azul th, .tabla-azul td { font-size: 0.8rem; padding: 6px; }
  }

  /* --- MODO IMPRESIÓN / PDF REAL --- */
  @media print {
    .no-print { display: none !important; }
    .contenedor-vista { background: white; padding: 0; margin: 0; }
    .hoja-impresion { box-shadow: none; padding: 0; margin: 0; max-width: 100%; width: 100%; border: none; }
    .table-scroll { overflow: visible; } /* En papel no hay scroll */
    .tabla-azul { min-width: 100%; }
  }
</style>