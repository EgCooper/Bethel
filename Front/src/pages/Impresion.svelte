<script>
  import { onMount, createEventDispatcher } from "svelte";
  import axios from "axios";
  import Swal from "sweetalert2";

  export let id = null; 
  const dispatch = createEventDispatcher();

  let cotizacion = null;
  let cargando = true;

  onMount(async () => {
    if (id) {
      await cargarCotizacion();
    }
  });

  async function cargarCotizacion() {
    try {
      const res = await axios.get(`/api/cotizacion/${id}`);
      cotizacion = res.data;
      cargando = false;
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo cargar el documento.", "error");
      dispatch('volver');
    }
  }

  function imprimir() {
    window.print();
  }

  function volver() {
    dispatch('volver');
  }

  // ✅ FUNCIÓN PARA ENVIAR WHATSAPP AUTOMÁTICO
  function enviarWhatsapp() {
      if (!cotizacion.cliente || !cotizacion.cliente.whatsapp) {
          return Swal.fire("Sin número", "Este cliente no tiene número registrado.", "warning");
      }

      // Limpiamos el número (quitamos espacios o guiones)
      let numero = cotizacion.cliente.whatsapp.replace(/\D/g, '');
      
      // Si no tiene código de país (asumimos Bolivia 591 si empieza con 6 o 7 y tiene 8 dígitos)
      if (numero.length === 8) {
          numero = '591' + numero;
      }

      const nombre = getNombreCliente(cotizacion.cliente);
      const auto = `${cotizacion.vehiculo.marca} ${cotizacion.vehiculo.modelo} ${cotizacion.vehiculo.anio}`;
      const total = cotizacion.totales.total_usd.toLocaleString('en-US', {minimumFractionDigits: 2});

      // Mensaje estructurado y formal
      const mensaje = `Estimado(a) *${nombre}*,\n\nLe envío la cotización formal detallada del vehículo:\n🚘 *${auto.toUpperCase()}*\n\n💰 Precio Final: *$${total} USD*\n\nAdjunto encontrará el detalle de los costos de importación y logística.\n\nAtentamente,\n*Bethel Motors*`;

      const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
      window.open(url, '_blank');
  }

  function getNombreCliente(c) {
      if (!c) return "CLIENTE GENERAL";
      return (c.nombre_completo || c.nombre || "SIN NOMBRE").toUpperCase();
  }
</script>

{#if cargando}
  <div class="loading-screen">Generando vista previa...</div>
{:else if cotizacion}
  <div class="print-container">
    
    <div class="toolbar no-print">
        <div class="group-left">
            <button class="btn-secondary" on:click={volver}>&larr; Regresar</button>
        </div>
        <div class="group-right">
            <button class="btn-whatsapp" on:click={enviarWhatsapp}>Enviar WhatsApp</button>
            <button class="btn-primary" on:click={imprimir}>Imprimir PDF</button>
        </div>
    </div>

    <div class="sheet">
      
      <header class="header">
        <div class="brand-area">
            <h1 class="brand-title">BETHEL MOTORS</h1>
            <p class="brand-subtitle">IMPORTACIÓN DIRECTA & LOGÍSTICA INTERNACIONAL</p>
        </div>
        <div class="meta-data">
            <div class="meta-row">
                <span class="meta-label">COTIZACIÓN N°:</span>
                <span class="meta-value">#{cotizacion._id.slice(-6).toUpperCase()}</span>
            </div>
            <div class="meta-row">
                <span class="meta-label">FECHA DE EMISIÓN:</span>
                <span class="meta-value">{new Date(cotizacion.fecha).toLocaleDateString()}</span>
            </div>
            <div class="meta-row">
                <span class="meta-label">ASESOR COMERCIAL:</span>
                <span class="meta-value">{cotizacion.asesor ? cotizacion.asesor.nombre.toUpperCase() : 'VENTAS'}</span>
            </div>
        </div>
      </header>

      <div class="separator-thick"></div>

      <section class="info-section">
          <h3 class="section-title">INFORMACIÓN DEL CLIENTE</h3>
          <div class="info-grid">
              <div class="info-item">
                  <span class="label">NOMBRE / RAZÓN SOCIAL:</span>
                  <span class="value">{getNombreCliente(cotizacion.cliente)}</span>
              </div>
              <div class="info-item">
                  <span class="label">TELÉFONO / WHATSAPP:</span>
                  <span class="value">{cotizacion.cliente ? cotizacion.cliente.whatsapp : '---'}</span>
              </div>
          </div>
      </section>

      <section class="info-section">
          <h3 class="section-title">DETALLES DEL VEHÍCULO</h3>
          <div class="vehicle-grid">
              <div class="v-item">
                  <span class="v-label">MARCA</span>
                  <span class="v-value">{cotizacion.vehiculo.marca.toUpperCase()}</span>
              </div>
              <div class="v-item">
                  <span class="v-label">MODELO</span>
                  <span class="v-value">{cotizacion.vehiculo.modelo.toUpperCase()}</span>
              </div>
              <div class="v-item">
                  <span class="v-label">AÑO</span>
                  <span class="v-value">{cotizacion.vehiculo.anio || cotizacion.vehiculo.año}</span>
              </div>
            
              {#if cotizacion.vehiculo.motor}
                <div class="v-item">
                    <span class="v-label">MOTOR</span>
                    <span class="v-value">{cotizacion.vehiculo.motor}</span>
                </div>
              {/if}
              {#if cotizacion.vehiculo.transmision}
                <div class="v-item">
                    <span class="v-label">TRANSMISIÓN</span>
                    <span class="v-value">{cotizacion.vehiculo.transmision}</span>
                </div>
              {/if}
          </div>
          {#if cotizacion.vehiculo.descripcion}
            <div class="vehicle-notes">
                <strong>OBSERVACIONES:</strong> {cotizacion.vehiculo.descripcion}
            </div>
          {/if}
      </section>

      <section class="cost-section">
          <h3 class="section-title">DESGLOSE DE IMPORTACIÓN</h3>
          <table class="cost-table">
              <thead>
                  <tr>
                      <th>CONCEPTO</th>
                      <th class="text-right">VALOR (USD)</th>
                  </tr>
              </thead>
              <tbody>
                  <tr>
                      <td>Valor de Compra (Subasta)</td>
                      <td class="text-right">${cotizacion.costos.precio_subasta.toLocaleString()}</td>
                  </tr>
                  <tr>
                      <td>Impuestos & Fees en Origen</td>
                      <td class="text-right">${cotizacion.costos.impuestos_subasta.toLocaleString()}</td>
                  </tr>
                  <tr>
                      <td>Transferencia Bancaria Internacional</td>
                      <td class="text-right">${cotizacion.costos.costo_giro.toFixed(2)}</td>
                  </tr>
                  <tr>
                      <td>Transporte Interno (Grúa USA)</td>
                      <td class="text-right">${cotizacion.costos.grua_usa.toLocaleString()}</td>
                  </tr>
                  <tr>
                      <td>Transporte Terrestre (Puerto - Destino)</td>
                      <td class="text-right">${cotizacion.costos.transporte_terrestre.toLocaleString()}</td>
                  </tr>
                  <tr>
                      <td>Comisión Gestión & Logística</td>
                      <td class="text-right">${cotizacion.costos.comision_gestion.toLocaleString()}</td>
                  </tr>
                  <tr>
                      <td>Trámites Aduaneros & Documentación</td>
                      <td class="text-right">${cotizacion.costos.tramites_aduana.toLocaleString()}</td>
                  </tr>
                  {#if cotizacion.costos.reparaciones > 0}
                  <tr>
                      <td>Reparaciones / Gastos Adicionales</td>
                      <td class="text-right">${cotizacion.costos.reparaciones.toLocaleString()}</td>
                  </tr>
                  {/if}
              </tbody>
          </table>
      </section>

      <section class="totals-section">
          <div class="totals-box">
              <div class="total-row usd">
                  <span class="t-label">TOTAL INVERSIÓN (USD)</span>
                  <span class="t-value">${cotizacion.totales.total_usd.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>
              <div class="total-row bob">
                  <span class="t-label">ESTIMADO EN BOLIVIANOS (Bs)</span>
                  <span class="t-value">Bs {cotizacion.totales.total_bob.toLocaleString('es-BO', {minimumFractionDigits: 2})}</span>
              </div>
          </div>
          <p class="tc-note">Tipo de Cambio Referencial utilizado: <strong>{cotizacion.totales.tipo_cambio}</strong></p>
      </section>

      <footer class="footer">
          <div class="terms">
              <p><strong>TÉRMINOS Y CONDICIONES:</strong> Esta cotización es válida por 7 días calendario. Los costos de transporte marítimo y terrestre están sujetos a variaciones internacionales. La empresa no se hace responsable por demoras ajenas a la gestión logística (Aduanas, Clima, Paros).</p>
          </div>
          
          <div class="signatures">
              <div class="sign-box">
                  <div class="line"></div>
                  <span>CONFORMIDAD CLIENTE</span>
              </div>
              <div class="sign-box">
                  <div class="line"></div>
                  <span>AUTORIZADO BETHEL MOTORS</span>
              </div>
          </div>
      </footer>

    </div>
  </div>
{/if}

<style>
  /* CONFIGURACIÓN GENERAL */
  :global(body) { background: #525659; margin: 0; }
  .print-container { display: flex; flex-direction: column; align-items: center; padding: 20px; font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; color: #333; }
  
  /* BOTONERA MEJORADA */
  .toolbar { 
      background: white; padding: 15px 25px; border-radius: 8px; margin-bottom: 30px; 
      display: flex; justify-content: space-between; align-items: center;
      width: 100%; max-width: 800px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  }
  .group-right { display: flex; gap: 15px; }
  
  .btn-primary { background: #003366; color: white; border: none; padding: 10px 20px; border-radius: 4px; font-weight: bold; cursor: pointer; text-transform: uppercase; letter-spacing: 1px; }
  .btn-primary:hover { background: #002244; }

  .btn-secondary { background: transparent; border: 1px solid #666; color: #333; padding: 10px 20px; border-radius: 4px; cursor: pointer; text-transform: uppercase; }
  .btn-secondary:hover { background: #eee; }

  /* BOTÓN WHATSAPP */
  .btn-whatsapp { 
      background: #25D366; color: white; border: none; padding: 10px 20px; 
      border-radius: 4px; font-weight: bold; cursor: pointer; text-transform: uppercase; 
  }
  .btn-whatsapp:hover { background: #128C7E; }

  /* HOJA A4 */
  .sheet {
      background: white;
      width: 210mm;
      min-height: 297mm;
      padding: 15mm;
      box-sizing: border-box;
      position: relative;
      box-shadow: 0 0 20px rgba(0,0,0,0.5);
  }

  /* HEADER */
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
  .brand-title { margin: 0; color: #003366; font-size: 26pt; font-weight: 900; letter-spacing: -1px; line-height: 1; }
  .brand-subtitle { margin: 5px 0 0 0; color: #666; font-size: 8pt; letter-spacing: 3px; font-weight: 600; }
  
  .meta-data { text-align: right; }
  .meta-row { margin-bottom: 4px; font-size: 9pt; }
  .meta-label { font-weight: bold; color: #555; margin-right: 5px; }
  .meta-value { color: #000; font-family: monospace; font-size: 10pt; }

  .separator-thick { height: 4px; background: #003366; margin: 15px 0 30px 0; }

  /* TÍTULOS DE SECCIÓN */
  .section-title { 
      font-size: 10pt; font-weight: bold; color: #003366; 
      border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 15px; 
      text-transform: uppercase; letter-spacing: 1px;
  }

  /* CLIENTE & VEHÍCULO */
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
  .info-item { display: flex; flex-direction: column; }
  .label { font-size: 7pt; color: #888; margin-bottom: 3px; font-weight: bold; }
  .value { font-size: 11pt; font-weight: 600; }

  .vehicle-grid { 
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; 
      background: #f8f9fa; padding: 15px; border: 1px solid #eee; margin-bottom: 30px; 
  }
  .v-item { display: flex; flex-direction: column; }
  .v-item.full-width { grid-column: span 3; }
  .v-label { font-size: 7pt; color: #666; margin-bottom: 2px; text-transform: uppercase; }
  .v-value { font-size: 10pt; font-weight: bold; color: #333; }
  .mono { font-family: 'Courier New', monospace; letter-spacing: 1px; }
  .vehicle-notes { margin-top: 10px; font-size: 9pt; font-style: italic; color: #555; padding: 0 15px; }

  /* TABLA COSTOS */
  .cost-section { margin-bottom: 30px; }
  .cost-table { width: 100%; border-collapse: collapse; font-size: 9pt; }
  .cost-table th { text-align: left; padding: 8px 10px; background: #003366; color: white; font-weight: normal; font-size: 8pt; letter-spacing: 1px; }
  .cost-table td { padding: 8px 10px; border-bottom: 1px solid #eee; }
  .cost-table tr:nth-child(even) { background-color: #fcfcfc; }
  .text-right { text-align: right; }
  .separator-row td { height: 10px; border: none; background: white !important; }

  /* TOTALES */
  .totals-section { display: flex; flex-direction: column; align-items: flex-end; margin-bottom: 50px; }
  .totals-box { background: #003366; color: white; padding: 20px; width: 300px; }
  .total-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; }
  .total-row.bob { margin-bottom: 0; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.3); }
  .t-label { font-size: 8pt; opacity: 0.8; }
  .t-value { font-size: 14pt; font-weight: bold; }
  .total-row.usd .t-value { font-size: 18pt; color: #fff; }
  .tc-note { margin-top: 5px; font-size: 8pt; color: #666; text-align: right; width: 300px; }

  /* FOOTER */
  .footer { margin-top: auto; }
  .terms { font-size: 7pt; color: #777; text-align: justify; margin-bottom: 50px; line-height: 1.4; }
  .signatures { display: flex; justify-content: space-between; padding: 0 50px; }
  .sign-box { text-align: center; width: 200px; }
  .sign-box .line { border-top: 1px solid #333; margin-bottom: 5px; }
  .sign-box span { font-size: 7pt; font-weight: bold; text-transform: uppercase; }

  /* IMPRESIÓN */
  @media print {
      @page { margin: 0; size: A4; }
      body { background: white; }
      .no-print { display: none !important; }
      .sheet { box-shadow: none; margin: 0; width: 100%; height: 100%; }
      .print-container { padding: 0; display: block; }
      .totals-box, .cost-table th, .vehicle-grid, .btn-whatsapp { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>