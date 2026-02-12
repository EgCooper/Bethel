<script>
  import { onMount, createEventDispatcher } from "svelte";
  import axios from "axios";
  import Swal from "sweetalert2";
  
  const dispatch = createEventDispatcher();
  
  let cotizaciones = []; 
  let cargando = true;

  // Filtros
  let busquedaTexto = ""; 
  let busquedaFecha = ""; 
  
  // Permisos
  let esAdmin = false;

  const estados = ['Borrador', 'Aprobada', 'En Tránsito', 'En Aduana', 'Entregada', 'Cancelada'];

  // Cargar datos
  onMount(async () => {
    try {
      const usuario = JSON.parse(localStorage.getItem("usuario"));
      if (usuario) {
        esAdmin = (usuario.rol === 'admin');
        const res = await axios.get(`/api/cotizaciones?usuario_id=${usuario.id}&rol=${usuario.rol}`);
        cotizaciones = res.data;
      }
      cargando = false;
    } catch (error) {
      console.error(error);
      cargando = false;
    }
  });

  // --- ELIMINAR ---
 async function eliminarCotizacion(id) {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "Se borrará permanentemente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#cc0000', 
      cancelButtonColor: '#003366', 
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`/api/cotizacion/${id}`);
        cotizaciones = cotizaciones.filter(c => c._id !== id);
        Swal.fire({ title: 'Eliminado', icon: 'success', timer: 1500, showConfirmButton: false });
      } catch (error) {
        Swal.fire('Error', 'No se pudo eliminar.', 'error');
      }
    }
  }

  // --- CAMBIAR ESTADO ---
  async function cambiarEstado(id, nuevoEstado) {
    try {
      await axios.patch(`/api/cotizacion/${id}/estado`, { estado: nuevoEstado });
      const Toast = Swal.mixin({
        toast: true, position: 'top-end', showConfirmButton: false, timer: 3000
      });
      Toast.fire({ icon: 'success', title: 'Estado actualizado' });
    } catch (error) {
      Swal.fire("Error", "No se pudo actualizar el estado", "error");
    }
  }

  // Lógica de Filtros
  $: cotizacionesFiltradas = cotizaciones.filter(item => {
    const texto = busquedaTexto.toLowerCase();
    const nombreCliente = item.cliente_id?.nombre_completo?.toLowerCase() || "manual";
    const vehiculo = item.vehiculo?.descripcion?.toLowerCase() || "";
    const whatsapp = item.cliente_id?.whatsapp || "";
    const nombreAsesor = item.asesor_id?.nombre?.toLowerCase() || "";

    const coincideTexto = nombreCliente.includes(texto) || vehiculo.includes(texto) || whatsapp.includes(texto) || nombreAsesor.includes(texto);

    let coincideFecha = true;
    if (busquedaFecha) {
      const fechaItem = new Date(item.fecha).toISOString().split('T')[0];
      coincideFecha = fechaItem === busquedaFecha;
    }
    return coincideTexto && coincideFecha;
  });

  function verCotizacion(id) { dispatch('ver', { id }); }
  function editarCotizacion(id) { dispatch('editar', { id }); }
  function limpiarFiltros() { busquedaTexto = ""; busquedaFecha = ""; }
  function volver() { dispatch('volver'); }
</script>

<svelte:head>
  <title>Bethel Motors - Historial</title>
</svelte:head>

<div class="page-container">
  
  <div class="header-flex">
    <button class="btn-pill btn-outline-blue" on:click={volver}>← Volver</button>
    <h2 class="page-title">Historial de Cotizaciones</h2>
    <div class="spacer-desktop"></div>
  </div>

  <div class="filtros-bar">
    <div class="input-group">
      <label>🔍 Buscar</label>
      <input type="text" placeholder="Cliente, Auto, Asesor..." bind:value={busquedaTexto} />
    </div>
    <div class="input-group">
      <label>📅 Fecha</label>
      <input type="date" bind:value={busquedaFecha} />
    </div>
    {#if busquedaTexto || busquedaFecha}
      <button class="btn-limpiar" on:click={limpiarFiltros}>Limpiar Filtros</button>
    {/if}
  </div>

  {#if cargando}
    <div class="loading">Cargando datos...</div>
  {:else if cotizacionesFiltradas.length === 0}
    <div class="vacio">No hay cotizaciones que coincidan.</div>
  {:else}
    <div class="table-container">
      <table class="custom-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Vehículo</th>
            {#if esAdmin} <th>Asesor</th> {/if}
            <th>Estado</th> 
            <th>Total (USD)</th>
            <th class="text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {#each cotizacionesFiltradas as item}
            <tr>
              <td data-label="Fecha">
                  <span class="fecha-tag">{new Date(item.fecha).toLocaleDateString()}</span>
              </td>
              
              <td data-label="Cliente">
                <div class="info-block">
                    <strong>{item.cliente_id ? item.cliente_id.nombre_completo : 'Manual'}</strong>
                    {#if item.cliente_id?.whatsapp}
                        <small>{item.cliente_id.whatsapp}</small>
                    {/if}
                </div>
              </td>
              
              <td data-label="Vehículo">
                <div class="vehiculo-info">
                    {item.vehiculo.descripcion} 
                    <span class="badge-anio">{item.vehiculo.anio}</span>
                </div>
              </td>

              {#if esAdmin}
                <td data-label="Asesor">
                  <span class="asesor-tag">
                    {item.asesor_id ? item.asesor_id.nombre : 'Desconocido'}
                  </span>
                </td>
              {/if}
              
              <td data-label="Estado">
                <select 
                  class="select-estado estado-{item.estado ? item.estado.replace(/\s+/g, '-').toLowerCase() : 'borrador'}"
                  bind:value={item.estado} 
                  on:change={() => cambiarEstado(item._id, item.estado)}
                >
                  {#each estados as est}
                    <option value={est}>{est}</option>
                  {/each}
                </select>
              </td>

              <td data-label="Total (USD)">
                  <span class="monto">$ {item.totales.total_usd.toLocaleString('en-US', {minimumFractionDigits: 0})}</span>
              </td>
              
              <td class="actions-cell">
                <div class="btn-group">
                    <button class="btn-action view" title="Ver PDF" on:click={() => verCotizacion(item._id)}>Ver</button>
                    <button class="btn-action edit" title="Editar" on:click={() => editarCotizacion(item._id)}>Editar</button>
                    {#if esAdmin}
                    <button class="btn-action delete" title="Eliminar" on:click={() => eliminarCotizacion(item._id)}>Borrar</button>
                    {/if}
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  /* --- VARIABLES --- */
  :root {
    --primary: #003366; 
    --primary-hover: #002244;
    --red-bethel: #cc0000;
    --white: #ffffff;
    --bg-light: #f4f4f9;
    --border: #e5e7eb;
    --radius: 12px;
  }

  .page-container { max-width: 1200px; margin: 0 auto; padding: 20px; font-family: 'Segoe UI', sans-serif; }
  
  /* --- HEADER --- */
  .header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 2px solid var(--primary); padding-bottom: 15px; }
  .page-title { margin: 0; color: var(--primary); font-size: 1.5rem; font-weight: 800; }
  .spacer-desktop { width: 100px; }

  /* --- BOTONES PILL (Volver) --- */
  .btn-pill {
    padding: 8px 20px; border-radius: 50px; font-weight: 700; cursor: pointer;
    transition: all 0.2s; border: 1px solid transparent; font-size: 0.9rem;
  }
  .btn-outline-blue { background: white; color: var(--primary); border-color: var(--primary); }
  .btn-outline-blue:hover { background: var(--primary); color: white; }

  /* --- FILTROS --- */
  .filtros-bar { display: flex; gap: 15px; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); margin-bottom: 25px; align-items: flex-end; flex-wrap: wrap; }
  .input-group { display: flex; flex-direction: column; flex: 1; min-width: 200px; }
  .input-group label { font-weight: 700; color: #555; font-size: 0.85rem; margin-bottom: 5px; }
  .input-group input { padding: 10px; border: 1px solid #ccc; border-radius: 8px; transition: 0.2s; background: #f9fafb; }
  .input-group input:focus { border-color: var(--primary); outline: none; background: white; }
  
  .btn-limpiar { background: #666; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; height: 38px; }
  .btn-limpiar:hover { background: #555; }

  /* --- TABLA CUSTOM (Desktop) --- */
  .table-container { overflow-x: auto; background: white; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); padding-bottom: 10px; }
  .custom-table { width: 100%; border-collapse: collapse; min-width: 850px; }
  .custom-table th { background: var(--primary); color: white; padding: 15px; text-align: left; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; }
  .custom-table td { padding: 15px; border-bottom: 1px solid #eee; vertical-align: middle; font-size: 0.9rem; color: #333; }
  .text-right { text-align: right; }

  /* ELEMENTOS DE CELDA */
  .fecha-tag { color: #666; font-size: 0.85rem; }
  .info-block { display: flex; flex-direction: column; }
  .info-block small { color: #888; }
  .badge-anio { background: #eee; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; margin-left: 5px; color: #555; }
  .monto { font-weight: 800; color: var(--primary); font-family: monospace; font-size: 1rem; }
  .asesor-tag { background: #f0f9ff; color: #003366; padding: 4px 8px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; }

  /* SELECT ESTADO */
  .select-estado {
    padding: 6px 10px; border-radius: 20px; border: none; font-weight: 700; font-size: 0.75rem; cursor: pointer; outline: none;
    text-align: center; width: 100%; max-width: 140px; appearance: none; -webkit-appearance: none;
  }
  .estado-borrador { background: #e2e3e5; color: #383d41; }
  .estado-aprobada { background: #d4edda; color: #155724; }
  .estado-en-tránsito { background: #fff3cd; color: #856404; }
  .estado-en-aduana { background: #cce5ff; color: #004085; }
  .estado-entregada { background: #d1e7dd; color: #0f5132; }
  .estado-cancelada { background: #f8d7da; color: #721c24; }

  /* BOTONES ACCIONES */
  .actions-cell { text-align: right; }
  .btn-group { display: flex; gap: 8px; justify-content: flex-end; }
  
  .btn-action {
    border: none; border-radius: 6px; cursor: pointer; font-weight: 700;
    padding: 6px 12px; font-size: 0.8rem; transition: 0.2s;
  }
  .btn-action.view { background: #e0e7ff; color: #3730a3; } /* Azul */
  .btn-action.view:hover { background: #c7d2fe; }
  
  .btn-action.edit { background: #f3f4f6; color: #374151; } /* Gris */
  .btn-action.edit:hover { background: #e5e7eb; }
  
  .btn-action.delete { background: #fee2e2; color: #991b1b; } /* Rojo */
  .btn-action.delete:hover { background: #fecaca; }

  .loading, .vacio { text-align: center; padding: 40px; color: #666; background: #eee; border-radius: 8px; margin-top: 20px; }

  /* --- RESPONSIVE MOBILE (CARD VIEW) --- */
  @media (max-width: 900px) {
      .header-flex { flex-direction: column; gap: 10px; text-align: center; }
      .spacer-desktop { display: none; }
      .filtros-bar { padding: 15px; }

      /* Transforma la tabla en tarjetas */
      .custom-table, .custom-table tbody, .custom-table tr, .custom-table td {
          display: block; width: 100%; box-sizing: border-box;
      }
      .custom-table thead { display: none; } /* Oculta encabezados */

      .custom-table tr {
          background: white; border: 1px solid #eee; border-radius: 12px;
          margin-bottom: 15px; padding: 15px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.03);
      }

      .custom-table td {
          padding: 10px 0; border-bottom: 1px solid #f0f0f0; 
          display: flex; justify-content: space-between; align-items: center;
          text-align: right;
      }
      .custom-table td:last-child { border-bottom: none; }

      /* Etiquetas simuladas */
      .custom-table td::before {
          content: attr(data-label);
          font-weight: 700; font-size: 0.8rem; color: #888; text-transform: uppercase;
          margin-right: 10px;
      }

      /* Ajustes específicos para contenido móvil */
      .select-estado { width: auto; min-width: 120px; }
      
      .actions-cell {
          margin-top: 10px; padding-top: 15px; border-top: 2px solid #f0f0f0;
          justify-content: center;
      }
      .custom-table td.actions-cell::before { display: none; } /* Sin etiqueta en botones */
      
      .btn-group { width: 100%; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
      .btn-action { padding: 12px; font-size: 0.9rem; text-align: center; width: 100%; }
  }
</style>