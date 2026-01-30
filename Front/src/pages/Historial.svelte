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
  
  // Variable de control de permisos (por defecto falso por seguridad)
  let esAdmin = false;

  // Lista de Estados Disponibles
  const estados = ['Borrador', 'Aprobada', 'En Tránsito', 'En Aduana', 'Entregada', 'Cancelada'];

  // Cargar datos (CON FILTRO DE USUARIO)
  onMount(async () => {
    try {
      // 1. Recuperamos quién está logueado
      const usuario = JSON.parse(localStorage.getItem("usuario"));
      
      if (usuario) {
        // Determinamos si es admin para mostrar/ocultar botones
        esAdmin = (usuario.rol === 'admin');

        // 2. Pedimos la lista enviando credenciales
        // El backend decidirá: si es admin devuelve todo, si no, solo lo suyo.
        const res = await axios.get(`http://localhost:3000/api/cotizaciones?usuario_id=${usuario.id}&rol=${usuario.rol}`);
        
        cotizaciones = res.data;
      }
      
      cargando = false;
    } catch (error) {
      console.error(error);
      cargando = false;
      Swal.fire("Error", "No se pudo cargar el historial", "error");
    }
  });

  // --- FUNCIÓN ELIMINAR ---
 async function eliminarCotizacion(id) {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás recuperar esta cotización.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff0000', // Rojo para peligro
      cancelButtonColor: '#003366', // Azul para cancelar
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:3000/api/cotizacion/${id}`);
        cotizaciones = cotizaciones.filter(c => c._id !== id);
        
        Swal.fire({
          title:'¡Eliminado!',
          text: 'La cotización ha sido borrada.',
          icon:'success',
          confirmButtonColor: '#003366',
          iconColor: '#ff0000'
        });
      } catch (error) {
        Swal.fire({
          title:'Error', 
          text:'No se pudo eliminar.', 
          icon:'error',
          confirmButtonColor: '#003366'
        });
      }
    }
  }

  // --- FUNCIÓN CAMBIAR ESTADO ---
  async function cambiarEstado(id, nuevoEstado) {
    try {
      await axios.patch(`http://localhost:3000/api/cotizacion/${id}/estado`, { estado: nuevoEstado });
      // Feedback visual en consola
      console.log("Estado cambiado a", nuevoEstado);
    } catch (error) {
      Swal.fire("Error", "No se pudo actualizar el estado", "error");
    }
  }

  // Lógica de Filtros
  $: cotizacionesFiltradas = cotizaciones.filter(item => {
    const texto = busquedaTexto.toLowerCase();
    
    // Protección por si algún dato viene nulo
    const nombreCliente = item.cliente_id?.nombre_completo?.toLowerCase() || "manual";
    const vehiculo = item.vehiculo?.descripcion?.toLowerCase() || "";
    const whatsapp = item.cliente_id?.whatsapp || "";
    // Agregamos búsqueda por nombre de asesor también
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
</script>

<div class="historial-container">
  <div class="header">
    <h2> Historial de Cotizaciones</h2>
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
      <button class="btn-limpiar" on:click={limpiarFiltros}>Limpiar</button>
    {/if}
  </div>

  {#if cargando}
    <div class="loading">Cargando datos...</div>
  {:else if cotizacionesFiltradas.length === 0}
    <div class="vacio">No hay resultados disponibles.</div>
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
            <th style="min-width: 140px;">Acciones</th>
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

              <td class="monto">$ {item.totales.total_usd.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
              
              <td class="acciones">
                <button class="button-32" title="Ver/Imprimir" on:click={() => verCotizacion(item._id)}>Ver</button>
                <br>
                <button class="button-32" title="Editar" on:click={() => editarCotizacion(item._id)}>Modificar</button>
                
                {#if esAdmin}
                  <br>
                  <button class="button-32" title="Eliminar" on:click={() => eliminarCotizacion(item._id)}>Eliminar</button>
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
  .historial-container { max-width: 1100px; margin: 0 auto; }
  .header { margin-bottom: 20px; border-bottom: 2px solid #003366; padding-bottom: 10px; }
  h2 { margin: 0; color: #003366; }

  /* Filtros */
  .filtros-bar { display: flex; gap: 15px; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); margin-bottom: 20px; align-items: flex-end; }
  .input-group { display: flex; flex-direction: column; flex: 1; }
  .input-group label { font-weight: bold; color: #555; font-size: 0.9rem; margin-bottom: 5px; }
  .input-group input { padding: 8px; border: 1px solid #ccc; border-radius: 5px; }
  .btn-limpiar { background: #ff4d4d; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; font-weight: bold; height: 35px; }

  /* Mensajes */
  .loading, .vacio { text-align: center; padding: 40px; color: #666; background: #eee; border-radius: 8px; }

  /* Tabla */
  .tabla-wrapper { overflow-x: auto; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); padding-bottom: 20px;}
  .tabla-historial { width: 100%; border-collapse: collapse; min-width: 800px; }
  .tabla-historial th { background: #003366; color: white; padding: 12px; text-align: left; }
  .tabla-historial td { padding: 10px; border-bottom: 1px solid #eee; font-size: 0.95rem; vertical-align: middle; }
  .tabla-historial tr:hover { background-color: #f9f9f9; }

  .badge-anio { background: #eee; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; margin-left: 5px; }
  .monto { font-family: monospace; font-weight: bold; }

  /* COLORES DE ESTADO */
  .select-estado {
    padding: 5px 10px; border-radius: 15px; border: none; font-weight: bold; font-size: 0.85rem; cursor: pointer; outline: none;
    appearance: none; -webkit-appearance: none; text-align: center; width: 120px;
  }
  .estado-borrador { background: #e2e3e5; color: #383d41; }
  .estado-aprobada { background: #d4edda; color: #155724; }
  .estado-en-tránsito { background: #fff3cd; color: #856404; }
  .estado-en-aduana { background: #cce5ff; color: #004085; }
  .estado-entregada { background: #d1e7dd; color: #0f5132; border: 1px solid #badbcc;}
  .estado-cancelada { background: #f8d7da; color: #721c24; }

  /* BOTONES ACCIONES */
  .acciones { display: flex; flex-direction: column; gap: 5px; align-items: center;}
  
  .button-32 {
    background-color: #ff0000;
    border-radius: 12px;
    color: #ffffff;
    cursor: pointer;
    font-weight: bold;
    padding: 10px 15px;
    text-align: center;
    transition: 200ms;
    width: 100%;
    box-sizing: border-box;
    border: 0;
    font-size: 14px;
    user-select: none;
    -webkit-user-select: none;
    touch-action: manipulation;
  }

  .button-32:not(:disabled):hover,
  .button-32:not(:disabled):focus {
    outline: 0;
    background: #e60000;
    box-shadow: 0 0 0 2px rgba(0,0,0,.2), 0 3px 8px 0 rgba(0,0,0,.15);
  }

  .button-32:disabled {
    filter: saturate(0.2) opacity(0.5);
    -webkit-filter: saturate(0.2) opacity(0.5);
    cursor: not-allowed;
  }  
</style>