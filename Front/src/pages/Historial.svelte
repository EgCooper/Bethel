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

  // Estados Disponibles para el Select
  const estados = ['Borrador', 'Aprobada', 'En Tránsito', 'En Aduana', 'Entregada', 'Cancelada'];

  // Cargar datos
  onMount(async () => {
    try {
      const usuario = JSON.parse(localStorage.getItem("usuario"));
      
      if (usuario) {
        esAdmin = (usuario.rol === 'admin');

        // Petición al backend
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
      text: "Se borrará permanentemente del sistema.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33', 
      cancelButtonColor: '#3085d6', 
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`/api/cotizacion/${id}`);
        cotizaciones = cotizaciones.filter(c => c._id !== id);
        
        Swal.fire('Eliminado', 'La cotización ha sido borrada.', 'success');
      } catch (error) {
        Swal.fire('Error', 'No se pudo eliminar.', 'error');
      }
    }
  }

  // --- CAMBIAR ESTADO ---
  async function cambiarEstado(id, nuevoEstado) {
    try {
      await axios.patch(`/api/cotizacion/${id}/estado`, { estado: nuevoEstado });
      // Opcional: Mostrar un toast pequeño de éxito
      const Toast = Swal.mixin({
        toast: true, position: 'top-end', showConfirmButton: false, timer: 3000
      });
      Toast.fire({ icon: 'success', title: 'Estado actualizado' });
    } catch (error) {
      Swal.fire("Error", "No se pudo actualizar el estado", "error");
    }
  }

  // Lógica de Filtros (Reactiva)
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

  // Funciones de navegación
  function verCotizacion(id) { dispatch('ver', { id }); }
  function editarCotizacion(id) { dispatch('editar', { id }); }
  function limpiarFiltros() { busquedaTexto = ""; busquedaFecha = ""; }
  
  // ✅ FUNCIÓN VOLVER
  function volver() { dispatch('volver'); }
</script>

<svelte:head>
  <title>Bethel Motors - Historial</title>
</svelte:head>

<div class="historial-container">
  
  <div class="header-flex">
    <button class="btn-volver" on:click={volver}>← Volver</button>
    <h2> Historial de Cotizaciones</h2>
    <div style="width: 80px;"></div> </div>

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
    <div class="tabla-wrapper">
      <table class="tabla-historial">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Vehículo</th>
            {#if esAdmin} <th>Asesor</th> {/if}
            <th>Estado</th> 
            <th>Total (USD)</th>
            <th class="col-acciones">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {#each cotizacionesFiltradas as item}
            <tr>
              <td>{new Date(item.fecha).toLocaleDateString()}</td>
              <td>
                <strong>{item.cliente_id ? item.cliente_id.nombre_completo : 'Manual'}</strong>
                <br><small>{item.cliente_id ? item.cliente_id.whatsapp : ''}</small>
              </td>
              <td>
                {item.vehiculo.descripcion} 
                <span class="badge-anio">{item.vehiculo.anio}</span>
              </td>

              {#if esAdmin}
                <td style="font-size: 0.9rem; color: #555;">
                  {item.asesor_id ? item.asesor_id.nombre : 'Desconocido'}
                </td>
              {/if}
              
              <td>
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

              <td class="monto">$ {item.totales.total_usd.toLocaleString('en-US', {minimumFractionDigits: 0})}</td>
              
              <td class="acciones">
                <button class="btn-action btn-ver" title="Ver PDF" on:click={() => verCotizacion(item._id)}> Ver</button>
                <button class="btn-action btn-edit" title="Editar" on:click={() => editarCotizacion(item._id)}> Editar</button>
                
                {#if esAdmin}
                  <button class="btn-action btn-del" title="Eliminar" on:click={() => eliminarCotizacion(item._id)}>Eliminar</button>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .historial-container { max-width: 1100px; margin: 0 auto; padding-bottom: 50px; }
  
  /* HEADER FLEXIBLE */
  .header-flex { 
      display: flex; justify-content: space-between; align-items: center; 
      margin-bottom: 20px; border-bottom: 2px solid #003366; padding-bottom: 10px; 
  }
  h2 { margin: 0; color: #003366; font-size: 1.5rem; }

  /* BOTÓN VOLVER */
  .btn-volver { 
      background: white; border: 1px solid #003366; color: #003366; 
      padding: 8px 15px; border-radius: 20px; cursor: pointer; font-weight: bold; transition: 0.2s;
  }
  .btn-volver:hover { background: #003366; color: white; }

  /* Filtros */
  .filtros-bar { display: flex; gap: 15px; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); margin-bottom: 20px; align-items: flex-end; flex-wrap: wrap; }
  .input-group { display: flex; flex-direction: column; flex: 1; min-width: 200px; }
  .input-group label { font-weight: bold; color: #555; font-size: 0.9rem; margin-bottom: 5px; }
  .input-group input { padding: 8px; border: 1px solid #ccc; border-radius: 5px; }
  .btn-limpiar { background: #666; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; font-weight: bold; height: 35px; }

  /* Mensajes */
  .loading, .vacio { text-align: center; padding: 40px; color: #666; background: #eee; border-radius: 8px; }

  /* Tabla */
  .tabla-wrapper { overflow-x: auto; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); padding-bottom: 20px;}
  .tabla-historial { width: 100%; border-collapse: collapse; min-width: 800px; }
  .tabla-historial th { background: #003366; color: white; padding: 12px; text-align: left; font-size: 0.9rem; }
  .tabla-historial td { padding: 10px; border-bottom: 1px solid #eee; font-size: 0.9rem; vertical-align: middle; }
  .tabla-historial tr:hover { background-color: #f9f9f9; }

  .badge-anio { background: #eee; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; margin-left: 5px; }
  .monto { font-family: monospace; font-weight: bold; color: #333; }

  /* COLORES DE ESTADO */
  .select-estado {
    padding: 5px 10px; border-radius: 15px; border: none; font-weight: bold; font-size: 0.8rem; cursor: pointer; outline: none;
    appearance: none; -webkit-appearance: none; text-align: center; width: 100%; max-width: 130px;
  }
  .estado-borrador { background: #e2e3e5; color: #383d41; }
  .estado-aprobada { background: #d4edda; color: #155724; }
  .estado-en-tránsito { background: #fff3cd; color: #856404; }
  .estado-en-aduana { background: #cce5ff; color: #004085; }
  .estado-entregada { background: #d1e7dd; color: #0f5132; border: 1px solid #badbcc;}
  .estado-cancelada { background: #f8d7da; color: #721c24; }

  /* BOTONES ACCIONES */
  .col-acciones { text-align: center; width: 140px; }
  .acciones { display: flex; gap: 5px; justify-content: center; }
  
  .btn-action {
    border: none; border-radius: 4px; color: white; cursor: pointer; font-weight: bold;
    padding: 6px 10px; font-size: 0.8rem; transition: transform 0.1s;
    display: flex; align-items: center; justify-content: center; gap: 5px;
  }
  .btn-action:hover { transform: scale(1.05); opacity: 0.9; }

  .btn-ver { background: #003366; } /* Azul */
  .btn-edit { background: #ffcc00; color: #333; } /* Amarillo */
  .btn-del { background: #cc0000; } /* Rojo */

  /* RESPONSIVE */
  @media (max-width: 600px) {
      .header-flex { flex-direction: column; gap: 10px; text-align: center; }
      .header-flex div { display: none; } /* Ocultar espaciador en móvil */
  }
</style>