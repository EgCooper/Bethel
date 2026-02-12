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

  function enviarWhatsapp() {
      if (!cotizacion.cliente || !cotizacion.cliente.whatsapp) {
          return Swal.fire("Sin número", "Este cliente no tiene número registrado.", "warning");
      }

      let numero = cotizacion.cliente.whatsapp.replace(/\D/g, '');
      if (numero.length === 8) numero = '591' + numero;

      const nombre = getNombreCliente(cotizacion.cliente);
      const auto = `${cotizacion.vehiculo.marca} ${cotizacion.vehiculo.modelo} ${cotizacion.vehiculo.anio}`;
      const total = cotizacion.totales.total_usd.toLocaleString('en-US', {minimumFractionDigits: 2});

      const mensaje = `Hola *${nombre}*,\n\nAdjunto la cotización formal del vehículo:\n🚘 *${auto.toUpperCase()}*\n💰 Precio: *$${total} USD*\n\nAtentamente,\n*Bethel Motors*`;

      const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
      window.open(url, '_blank');
  }

  function getNombreCliente(c) {
      if (!c) return "CLIENTE GENERAL";
      return (c.nombre_completo || c.nombre || "SIN NOMBRE").toUpperCase();
  }
</script>

{#if cargando}
  <div class="loading-screen">
      <div class="spinner"></div>
      <p>Generando documento...</p>
  </div>
{:else if cotizacion}
  <div class="print-wrapper">
    
    <div class="toolbar no-print">
        <div class="group-left">
            <button class="btn-pill btn-outline-blue" on:click={volver}>
                ← Volver
            </button>
        </div>
        <div class="group-right">
            <button class="btn-pill btn-whatsapp" on:click={enviarWhatsapp}>
                Enviar WhatsApp
            </button>
            <button class="btn-pill btn-solid-blue" on:click={imprimir}>
                🖨️ Imprimir PDF
            </button>
        </div>
    </div>

    <div class="sheet">
      
      <header class="doc-header">
        <div class="brand-area">
            <h1 class="brand-title">BETHEL MOTORS</h1>
            <p class="brand-subtitle">IMPORTACIÓN DIRECTA & LOGÍSTICA</p>
        </div>
        <div class="meta-data">
            <div class="meta-row">
                <span class="meta-label">COTIZACIÓN N°:</span>
                <span class="meta-value">#{cotizacion._id.slice(-6).toUpperCase()}</span>
            </div>
            <div class="meta-row">
                <span class="meta-label">FECHA:</span>
                <span class="meta-value">{new Date(cotizacion.fecha).toLocaleDateString()}</span>
            </div>
            <div class="meta-row">
                <span class="meta-label">ASESOR:</span>
                <span class="meta-value">{cotizacion.asesor ? cotizacion.asesor.nombre.toUpperCase() : 'VENTAS'}</span>
            </div>
        </div>
      </header>

      <div class="separator-thick"></div>

      <section class="info-section">
          <h3 class="section-title">INFORMACIÓN DEL CLIENTE</h3>
          <div class="info-grid two-cols">
              <div class="info-item">
                  <span class="label">RAZÓN SOCIAL / NOMBRE:</span>
                  <span class="value">{getNombreCliente(cotizacion.cliente)}</span>
              </div>
              <div class="info-item">
                  <span class="label">CONTACTO:</span>
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
              <div class="v-item">
                  <span class="v-label">MOTOR</span>
                  <span class="v-value">{cotizacion.vehiculo.motor || 'N/A'}</span>
              </div>
              <div class="v-item">
                  <span class="v-label">TRANSMISIÓN</span>
                  <span class="v-value">{cotizacion.vehiculo.transmision || 'N/A'}</span>
              </div>
              <div class="v-item">
                  <span class="v-label">VIN (REF)</span>
                  <span class="v-value mono">{cotizacion.vehiculo.vin ? cotizacion.vehiculo.vin.slice(-8) : '---'}</span>
              </div>
          </div>
          {#if cotizacion.vehiculo.descripcion}
            <div class="vehicle-notes">
                <strong>NOTA:</strong> {cotizacion.vehiculo.descripcion}
            </div>
          {/if}
      </section>

      <section class="cost-section">
          <h3 class="section-title">DESGLOSE DE IMPORTACIÓN</h3>
          <div class="table-responsive">
            <table class="cost-table">
                <thead>
                    <tr>
                        <th>CONCEPTO</th>
                        <th class="text-right">VALOR (USD)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Valor Compra (Subasta)</td>
                        <td class="text-right">${cotizacion.costos.precio_subasta.toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td>Impuestos & Fees Origen</td>
                        <td class="text-right">${cotizacion.costos.impuestos_subasta.toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td>Giro Bancario (6%)</td>
                        <td class="text-right">${cotizacion.costos.costo_giro.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>Transporte USA</td>
                        <td class="text-right">${cotizacion.costos.grua_usa.toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td>Logística Marítima/Terrestre</td>
                        <td class="text-right">${(cotizacion.costos.flete_maritimo + cotizacion.costos.transporte_terrestre).toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td>Gestión & Aduana</td>
                        <td class="text-right">${(cotizacion.costos.comision_gestion + cotizacion.costos.tramites_aduana).toLocaleString()}</td>
                    </tr>
                    {#if cotizacion.costos.reparaciones > 0}
                    <tr>
                        <td>Reparaciones / Extras</td>
                        <td class="text-right">${cotizacion.costos.reparaciones.toLocaleString()}</td>
                    </tr>
                    {/if}
                </tbody>
            </table>
          </div>
      </section>

      <section class="totals-section">
          <div class="totals-box">
              <div class="total-row usd">
                  <span class="t-label">TOTAL USD</span>
                  <span class="t-value">${cotizacion.totales.total_usd.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>
              <div class="divider-white"></div>
              <div class="total-row bob">
                  <span class="t-label">ESTIMADO BOB</span>
                  <span class="t-value">Bs {cotizacion.totales.total_bob.toLocaleString('es-BO', {minimumFractionDigits: 2})}</span>
              </div>
          </div>
          <p class="tc-note">T.C. Referencial: <strong>{cotizacion.totales.tipo_cambio}</strong></p>
      </section>

      <footer class="doc-footer">
          <div class="terms">
              <p><strong>TÉRMINOS:</strong> Validez de 7 días. Costos logísticos sujetos a variación internacional. Bethel Motors garantiza la gestión de compra e importación.</p>
          </div>
          
          <div class="signatures">
              <div class="sign-box">
                  <div class="line"></div>
                  <span>CLIENTE</span>
              </div>
              <div class="sign-box">
                  <div class="line"></div>
                  <span>BETHEL MOTORS</span>
              </div>
          </div>
      </footer>

    </div>
  </div>
{/if}

<style>
  /* --- VARIABLES --- */
  :root {
    --primary: #003366; 
    --red-bethel: #cc0000;
    --bg-dark: #525659;
  }

  /* --- LAYOUT GENERAL (PANTALLA) --- */
  :global(body) { background: var(--bg-dark); margin: 0; }
  
  .print-wrapper { 
      display: flex; flex-direction: column; align-items: center; 
      padding: 20px; font-family: 'Segoe UI', Arial, sans-serif; 
      color: #333; min-height: 100vh;
  }
  
  .loading-screen { 
      color: white; text-align: center; margin-top: 100px; font-size: 1.2rem; 
  }

  /* --- TOOLBAR (BOTONES PILL) --- */
  .toolbar { 
      background: white; padding: 15px 20px; border-radius: 50px; 
      margin-bottom: 30px; display: flex; justify-content: space-between; 
      align-items: center; width: 100%; max-width: 800px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3); flex-wrap: wrap; gap: 10px;
  }
  .group-right { display: flex; gap: 10px; }

  .btn-pill {
      padding: 10px 20px; border-radius: 50px; font-weight: 700; 
      cursor: pointer; transition: all 0.2s; border: 1px solid transparent; 
      font-size: 0.9rem; text-decoration: none; display: inline-flex; 
      align-items: center; justify-content: center;
  }

  .btn-outline-blue { background: transparent; color: var(--primary); border-color: var(--primary); }
  .btn-outline-blue:hover { background: #f0f7ff; }

  .btn-solid-blue { background: var(--primary); color: white; border-color: var(--primary); }
  .btn-solid-blue:hover { background: #002244; transform: translateY(-2px); }

  .btn-whatsapp { background: #25D366; color: white; border-color: #25D366; }
  .btn-whatsapp:hover { background: #128C7E; transform: translateY(-2px); }

  /* --- HOJA A4 (ESTILO DOCUMENTO) --- */
  .sheet {
      background: white;
      width: 210mm; /* A4 en Desktop */
      min-height: 297mm;
      padding: 15mm;
      box-sizing: border-box;
      position: relative;
      box-shadow: 0 0 25px rgba(0,0,0,0.5);
  }

  /* HEADER DOCUMENTO */
  .doc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
  .brand-title { margin: 0; color: var(--primary); font-size: 24pt; font-weight: 900; letter-spacing: -1px; line-height: 1; }
  .brand-subtitle { margin: 5px 0 0 0; color: #666; font-size: 8pt; letter-spacing: 3px; font-weight: 600; }
  
  .meta-data { text-align: right; }
  .meta-row { margin-bottom: 4px; font-size: 9pt; }
  .meta-label { font-weight: bold; color: #555; margin-right: 5px; }
  .meta-value { color: #000; font-family: monospace; font-size: 10pt; }

  .separator-thick { height: 4px; background: var(--primary); margin: 15px 0 30px 0; }

  /* SECCIONES */
  .section-title { 
      font-size: 10pt; font-weight: bold; color: var(--primary); 
      border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 15px; 
      text-transform: uppercase; letter-spacing: 1px;
  }

  .info-grid { display: grid; gap: 20px; margin-bottom: 30px; }
  .two-cols { grid-template-columns: 1fr 1fr; }
  
  .info-item { display: flex; flex-direction: column; }
  .label { font-size: 7pt; color: #888; margin-bottom: 3px; font-weight: bold; }
  .value { font-size: 11pt; font-weight: 600; }

  /* VEHÍCULO GRID */
  .vehicle-grid { 
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; 
      background: #f8f9fa; padding: 15px; border: 1px solid #eee; margin-bottom: 10px; border-radius: 8px;
  }
  .v-item { display: flex; flex-direction: column; }
  .v-label { font-size: 7pt; color: #666; margin-bottom: 2px; text-transform: uppercase; }
  .v-value { font-size: 10pt; font-weight: bold; color: #333; }
  .mono { font-family: monospace; }
  
  .vehicle-notes { font-size: 9pt; font-style: italic; color: #555; margin-bottom: 30px; }

  /* TABLA COSTOS */
  .table-responsive { width: 100%; overflow-x: auto; }
  .cost-section { margin-bottom: 30px; }
  .cost-table { width: 100%; border-collapse: collapse; font-size: 9pt; }
  .cost-table th { text-align: left; padding: 8px 10px; background: var(--primary); color: white; font-weight: normal; font-size: 8pt; letter-spacing: 1px; }
  .cost-table td { padding: 8px 10px; border-bottom: 1px solid #eee; }
  .cost-table tr:nth-child(even) { background-color: #fcfcfc; }
  .text-right { text-align: right; }

  /* TOTALES */
  .totals-section { display: flex; flex-direction: column; align-items: flex-end; margin-bottom: 50px; }
  .totals-box { background: var(--primary); color: white; padding: 20px; width: 280px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
  .total-row { display: flex; justify-content: space-between; align-items: baseline; }
  .divider-white { height: 1px; background: rgba(255,255,255,0.2); margin: 10px 0; }
  
  .t-label { font-size: 8pt; opacity: 0.9; }
  .t-value { font-size: 14pt; font-weight: bold; }
  .tc-note { margin-top: 5px; font-size: 8pt; color: #666; text-align: right; }

  /* FOOTER */
  .doc-footer { margin-top: auto; }
  .terms { font-size: 7pt; color: #777; text-align: justify; margin-bottom: 40px; line-height: 1.4; border: 1px solid #eee; padding: 10px; border-radius: 6px; }
  .signatures { display: flex; justify-content: space-around; }
  .sign-box { text-align: center; width: 180px; }
  .sign-box .line { border-top: 1px solid #333; margin-bottom: 5px; }
  .sign-box span { font-size: 7pt; font-weight: bold; text-transform: uppercase; }

  /* --- RESPONSIVE MOBILE (PREVIEW) --- */
  @media (max-width: 850px) {
      .toolbar { flex-direction: column; width: 100%; border-radius: 20px; padding: 20px; }
      .group-right { width: 100%; flex-direction: column; }
      .btn-pill { width: 100%; }

      /* La hoja se adapta al ancho del celular */
      .sheet { 
          width: 100%; 
          min-height: auto; 
          padding: 20px; 
          border-radius: 8px;
      }
      
      .doc-header { flex-direction: column; gap: 20px; }
      .meta-data { text-align: left; }
      .vehicle-grid { grid-template-columns: 1fr 1fr; } /* 2 columnas en móvil */
      .signatures { flex-direction: column; gap: 40px; align-items: center; }
      .totals-section { align-items: center; } /* Totales al centro en móvil */
      .totals-box { width: 100%; box-sizing: border-box; }
  }

  /* --- MODO IMPRESIÓN (SIEMPRE A4) --- */
  @media print {
      @page { margin: 0; size: A4; }
      body { background: white; }
      .print-wrapper { padding: 0; display: block; background: white; }
      .no-print { display: none !important; }
      
      /* Forzar estilos de hoja */
      .sheet { 
          width: 210mm !important; 
          height: 297mm !important; 
          box-shadow: none; 
          margin: 0; 
          padding: 15mm; 
          border-radius: 0;
      }

      /* Restaurar layout si estaba en móvil */
      .doc-header { flex-direction: row; }
      .meta-data { text-align: right; }
      .vehicle-grid { grid-template-columns: repeat(3, 1fr); }
      .totals-section { align-items: flex-end; }
      .signatures { flex-direction: row; }
      .totals-box { width: 280px; }

      /* Colores exactos */
      .totals-box, .cost-table th, .brand-title { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>