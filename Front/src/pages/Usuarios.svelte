<script>
  import { onMount } from "svelte";
  import axios from "axios";
  import Swal from "sweetalert2";

  // ESTADO
  let usuarios = [];
  let cargando = true;
  let idEdicion = null;

  // FORMULARIO
  let nuevoUsuario = {
    nombre: "",
    email: "",
    password: "",
    telefono: "",
    rol: "asesor",
    activo: true
  };

  onMount(cargarUsuarios);

  // --- CARGAR DATOS ---
  async function cargarUsuarios() {
    try {
      const res = await axios.get("/auth/users");
      usuarios = res.data;
      cargando = false;
    } catch (error) {
      console.error(error);
      cargando = false;
    }
  }

  // --- GESTIÓN DEL FORMULARIO ---
  function cargarDatosEdicion(usuario) {
    nuevoUsuario = { 
        nombre: usuario.nombre,
        email: usuario.email, 
        password: "", 
        telefono: usuario.telefono || "",
        rol: usuario.rol,
        activo: usuario.activo !== undefined ? usuario.activo : true
    };
    idEdicion = usuario._id;
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  }

  function cancelarEdicion() {
    limpiarFormulario();
  }

  function limpiarFormulario() {
    nuevoUsuario = { nombre: "", email: "", password: "", telefono: "", rol: "asesor", activo: true };
    idEdicion = null;
  }

  // --- GUARDAR ---
  async function guardarUsuario() {
    if (!nuevoUsuario.nombre || !nuevoUsuario.email) {
      return Swal.fire({ title: 'Datos Incompletos', text: 'Nombre y Email son obligatorios', icon: 'warning', confirmButtonColor: '#003366' });
    }

    if (!idEdicion && (!nuevoUsuario.password || nuevoUsuario.password.length < 8)) {
        return Swal.fire({ title: 'Seguridad', text: 'La contraseña debe tener al menos 8 caracteres', icon: 'warning', confirmButtonColor: '#003366' });
    }

    try {
      Swal.fire({ title: 'Procesando...', didOpen: () => Swal.showLoading() });

      if (idEdicion) {
        await axios.put(`/auth/users/${idEdicion}`, nuevoUsuario);
        Swal.fire({ title: 'Actualizado', icon: 'success', timer: 1500, showConfirmButton: false });
      } else {
        await axios.post("/auth/register", nuevoUsuario);
        Swal.fire({ title: 'Creado', icon: 'success', timer: 1500, showConfirmButton: false });
      }
      
      limpiarFormulario();
      cargarUsuarios();

    } catch (error) {
      Swal.fire({ title: 'Error', text: error.response?.data?.error || "Ocurrió un error", icon: 'error', confirmButtonColor: '#cc0000' });
    }
  }

  // --- TOGGLE ESTADO ---
  async function toggleEstado(usuario) {
    try {
        const nuevoEstado = !usuario.activo;
        await axios.patch(`/auth/users/${usuario._id}/status`, { activo: nuevoEstado });
        usuario.activo = nuevoEstado; 
        usuarios = usuarios; 
    } catch (error) {
        console.error(error);
    }
  }

  // --- ELIMINAR ---
  async function eliminarUsuario(id) {
    const miUsuario = JSON.parse(localStorage.getItem("usuario"));
    if (miUsuario.id === id) {
      return Swal.fire({ title: 'Acción Bloqueada', text: 'No puedes eliminar tu propia cuenta', icon: 'error', confirmButtonColor: '#cc0000' });
    }

    const confirm = await Swal.fire({
      title: '¿Eliminar Usuario?',
      text: "Esta acción es permanente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#cc0000",
      cancelButtonColor: "#003366",
      confirmButtonText: "Eliminar"
    });

    if (confirm.isConfirmed) {
      try {
        await axios.delete(`/auth/users/${id}`);
        if (idEdicion === id) limpiarFormulario();
        cargarUsuarios();
        Swal.fire({ title: 'Eliminado', icon: 'success', timer: 1500, showConfirmButton: false });
      } catch (error) {
        Swal.fire({ title: 'Error', icon: 'error', confirmButtonColor: '#cc0000' });
      }
    }
  }
</script>

<div class="page-container">
  
  <div class="header-flex">
    <h2 class="page-title">Gestión de Equipo</h2>
    <p class="subtitle">Administra los accesos y roles del personal.</p>
  </div>

  <div class="layout-grid">
    
    <div class="panel form-panel {idEdicion ? 'editando' : ''}">
      <div class="form-header">
          <h3>{idEdicion ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
      </div>
      
      <form on:submit|preventDefault={guardarUsuario} class="modern-form">
        
        <div class="form-group">
          <label>Nombre Completo</label>
          <input type="text" bind:value={nuevoUsuario.nombre} placeholder="Ej: Juan Pérez" required>
        </div>

        <div class="form-group">
          <label>Email (Acceso)</label>
          <input type="email" bind:value={nuevoUsuario.email} placeholder="juan@bethel.com" required>
        </div>

        <div class="form-group">
          <label>
            Contraseña 
            {#if idEdicion} <span class="hint">(Opcional)</span> {/if}
          </label>
          <input type="password" bind:value={nuevoUsuario.password} placeholder="••••••••">
        </div>

        <div class="form-group">
          <label>Teléfono</label>
          <input type="text" bind:value={nuevoUsuario.telefono} placeholder="Ej: 77778888">
        </div>

        <div class="row-group">
            <div class="form-group half">
                <label>Rol</label>
                <select bind:value={nuevoUsuario.rol}>
                    <option value="asesor">Asesor</option>
                    <option value="admin">Admin</option>
                </select>
            </div>

            <div class="form-group half">
                <label>Estado</label>
                <select bind:value={nuevoUsuario.activo}>
                    <option value={true}>Activo</option>
                    <option value={false}>Inactivo</option>
                </select>
            </div>
        </div>

        <div class="actions">
            <button type="submit" class="btn-pill btn-solid-blue full-width">
                {idEdicion ? 'Guardar Cambios' : 'Crear Usuario'}
            </button>
            
            {#if idEdicion}
                <button type="button" class="btn-pill btn-outline-red full-width" on:click={cancelarEdicion}>
                    Cancelar
                </button>
            {/if}
        </div>
      </form>
    </div>

    <div class="panel list-panel">
      <div class="list-header">
          <h3>Usuarios ({usuarios.length})</h3>
          <button class="btn-text" on:click={cargarUsuarios}>Recargar</button>
      </div>
      
      {#if cargando}
        <div class="loading">Cargando datos...</div>
      {:else}
        <div class="table-container">
            <table class="custom-table">
            <thead>
                <tr>
                    <th>Usuario</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th class="text-right">Acciones</th>
                </tr>
            </thead>
            <tbody>
                {#each usuarios as u}
                <tr class="{idEdicion === u._id ? 'active-row' : ''}">
                    <td data-label="Usuario">
                        <div class="user-block">
                            <span class="name">{u.nombre}</span>
                            <span class="email">{u.email}</span>
                            {#if u.telefono} <span class="phone">{u.telefono}</span> {/if}
                        </div>
                    </td>
                    
                    <td data-label="Rol">
                        <span class="role-badge {u.rol}">
                            {u.rol === 'admin' ? 'ADMIN' : 'ASESOR'}
                        </span>
                    </td>
                    
                    <td data-label="Estado">
                        <button class="status-btn {u.activo ? 'active' : 'inactive'}" on:click={() => toggleEstado(u)}>
                            {u.activo ? 'ACTIVO' : 'INACTIVO'}
                        </button>
                    </td>
                    
                    <td class="actions-cell">
                         <div class="btn-group">
                             <button class="btn-action edit" on:click={() => cargarDatosEdicion(u)}>
                                Editar
                             </button>
                             <button class="btn-action delete" on:click={() => eliminarUsuario(u._id)}>
                                Eliminar
                             </button>
                         </div>
                    </td>
                </tr>
                {/each}
            </tbody>
            </table>
        </div>
      {/if}
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
    --white: #ffffff;
    --bg-light: #f4f4f9;
    --border: #e5e7eb;
    --radius: 12px;
    --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .page-container {
    max-width: 1200px; margin: 0 auto; padding: 20px;
    font-family: 'Segoe UI', sans-serif; color: #333;
  }

  /* --- HEADER --- */
  .header-flex { margin-bottom: 30px; border-bottom: 2px solid var(--primary); padding-bottom: 15px; }
  .page-title { margin: 0; color: var(--primary); font-size: 1.5rem; font-weight: 800; }
  .subtitle { margin: 5px 0 0 0; color: #666; font-size: 0.9rem; }

  /* --- LAYOUT --- */
  .layout-grid { display: grid; grid-template-columns: 350px 1fr; gap: 30px; align-items: start; }
  
  /* PANELES (Cards) */
  .panel { 
    background: var(--white); padding: 25px; border-radius: var(--radius); 
    box-shadow: var(--shadow); border: 1px solid var(--border);
  }
  .form-panel { position: sticky; top: 20px; }
  .form-panel.editando { border: 2px solid #f59e0b; background: #fffdf5; }

  .form-header h3, .list-header h3 { margin: 0; color: var(--primary); font-size: 1.1rem; border-bottom: 1px solid var(--border); padding-bottom: 10px; margin-bottom: 20px; }
  .list-header { display: flex; justify-content: space-between; align-items: center; }
  
  /* FORMULARIO */
  .form-group { margin-bottom: 15px; }
  .row-group { display: flex; gap: 15px; }
  .half { flex: 1; }
  
  label { display: block; font-weight: 700; font-size: 0.85rem; color: #555; margin-bottom: 5px; }
  .hint { font-weight: normal; font-size: 0.75rem; color: #888; }

  input, select { 
    width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 8px; 
    box-sizing: border-box; font-size: 0.95rem; background: #f9fafb; transition: 0.2s;
  }
  input:focus, select:focus { border-color: var(--primary); outline: none; background: white; box-shadow: 0 0 0 3px rgba(0, 51, 102, 0.1); }

  /* BOTONES PILL (Formulario) */
  .btn-pill {
    padding: 10px 20px; border-radius: 50px; font-weight: 700; cursor: pointer;
    transition: all 0.2s; border: none; font-size: 0.95rem; text-align: center;
  }
  .btn-solid-blue { background: var(--primary); color: white; }
  .btn-solid-blue:hover { background: var(--primary-hover); transform: translateY(-2px); }

  .btn-outline-red { background: transparent; border: 1px solid var(--red-bethel); color: var(--red-bethel); }
  .btn-outline-red:hover { background: #fff5f5; }

  .btn-text { background: none; border: none; color: var(--primary); cursor: pointer; font-size: 0.9rem; text-decoration: underline; }
  .full-width { width: 100%; margin-top: 10px; }

  /* --- TABLA (Desktop) --- */
  .table-container { width: 100%; }
  .custom-table { width: 100%; border-collapse: collapse; }
  
  .custom-table th { 
    text-align: left; color: var(--primary); font-size: 0.8rem; 
    padding: 12px; border-bottom: 2px solid #eee; text-transform: uppercase; 
  }
  .custom-table td { padding: 15px 12px; border-bottom: 1px solid #f0f0f0; vertical-align: middle; }
  .text-right { text-align: right; }

  /* Estilos de Fila */
  .active-row { background-color: #fffbeb; } 

  .user-block { display: flex; flex-direction: column; }
  .name { font-weight: 700; color: #333; font-size: 1rem; }
  .email { font-size: 0.85rem; color: #666; }
  .phone { font-size: 0.8rem; color: #888; margin-top: 2px; }

  /* BADGES */
  .role-badge { 
    padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.5px;
  }
  .role-badge.admin { background: #e0e7ff; color: #3730a3; }
  .role-badge.asesor { background: #f3f4f6; color: #374151; }

  /* STATUS TOGGLE */
  .status-btn {
    padding: 4px 12px; border-radius: 20px; border: 1px solid transparent; 
    font-size: 0.7rem; font-weight: 800; cursor: pointer; transition: 0.2s;
  }
  .status-btn.active { background: #dcfce7; color: #166534; border-color: #bbf7d0; }
  .status-btn.active:hover { background: #bbf7d0; }
  
  .status-btn.inactive { background: #fee2e2; color: #991b1b; border-color: #fecaca; }
  .status-btn.inactive:hover { background: #fecaca; }

  /* BOTONES DE ACCIÓN (En Tabla) */
  .btn-group { display: flex; gap: 8px; justify-content: flex-end; }
  .btn-action {
    padding: 6px 14px; border-radius: 6px; border: none; font-size: 0.8rem; 
    font-weight: 700; cursor: pointer; transition: 0.2s;
  }
  .btn-action.edit { background: #f3f4f6; color: #374151; }
  .btn-action.edit:hover { background: #e5e7eb; color: var(--primary); }
  
  .btn-action.delete { background: white; border: 1px solid #fee2e2; color: var(--red-bethel); }
  .btn-action.delete:hover { background: #fee2e2; }

  .loading { text-align: center; padding: 40px; color: #999; }

  /* --- RESPONSIVE TOTAL (Mobile Card View) --- */
  @media (max-width: 900px) {
    .layout-grid { grid-template-columns: 1fr; } 
    
    /* Mover el formulario ARRIBA en celular */
    .form-panel { position: relative; top: 0; order: -1; margin-bottom: 25px; } 

    /* TRANSFORMAR TABLA EN TARJETAS */
    .custom-table, .custom-table tbody, .custom-table tr, .custom-table td {
        display: block; width: 100%; box-sizing: border-box;
    }
    
    .custom-table thead { display: none; } /* Ocultar cabeceras */

    .custom-table tr {
        background: white; border: 1px solid #eee; border-radius: 12px;
        margin-bottom: 15px; padding: 15px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.03);
    }

    .custom-table td {
        padding: 8px 0; border: none; display: flex; justify-content: space-between; align-items: center;
        text-align: right;
    }

    /* Etiquetas para móvil (Simular columnas) */
    .custom-table td::before {
        content: attr(data-label);
        font-weight: 700; font-size: 0.85rem; color: #888;
    }

    /* Ajustes específicos de celda móvil */
    .user-block { text-align: right; }
    .actions-cell { 
        margin-top: 15px; padding-top: 15px; border-top: 1px solid #f0f0f0; 
        justify-content: center; /* Centrar botones */
    }
    .custom-table td.actions-cell::before { content: ""; display: none; } /* Sin etiqueta en botones */

    /* Botones grandes en móvil */
    .btn-group { width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .btn-action { padding: 12px; font-size: 0.9rem; border-radius: 8px; width: 100%; }
    .btn-action.edit { background: #e0e7ff; color: #3730a3; } /* Azul claro para editar */
    .btn-action.delete { background: #fee2e2; color: #991b1b; border: none; } /* Rojo claro para borrar */
  }
</style>