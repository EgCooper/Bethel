<script>
  import { onMount } from "svelte";
  import axios from "axios";
  import Swal from "sweetalert2";

  // ESTADO
  let usuarios = [];
  let cargando = true;
  let idEdicion = null; // Si tiene valor, estamos editando

  // FORMULARIO (Modelo con email)
  let nuevoUsuario = {
    nombre: "",
    email: "", // ✅ CAMBIADO DE USERNAME A EMAIL
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
      Swal.fire({
        title: "Error", 
        text: "No se pudieron cargar los usuarios",
        icon: "error", 
        confirmButtonColor: "#003366"
      });
      cargando = false;
    }
  }

  // --- GESTIÓN DEL FORMULARIO ---
  function cargarDatosEdicion(usuario) {
    nuevoUsuario = { 
        nombre: usuario.nombre,
        email: usuario.email, // ✅
        password: "", // Seguridad: No cargamos la pass
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
    nuevoUsuario = { 
        nombre: "", 
        email: "", 
        password: "", 
        telefono: "", 
        rol: "asesor", 
        activo: true 
    };
    idEdicion = null;
  }

  // --- GUARDAR (CREAR / EDITAR) ---
  async function guardarUsuario() {
    // 1. Validaciones
    if (!nuevoUsuario.nombre || !nuevoUsuario.email) {
      return Swal.fire('Atención', 'Nombre y Email son obligatorios', 'warning');
    }

    // Validación de contraseña para nuevos usuarios
    if (!idEdicion) {
        if (!nuevoUsuario.password || nuevoUsuario.password.length < 8) {
            return Swal.fire('Seguridad', 'La contraseña debe tener al menos 8 caracteres', 'warning');
        }
    } else {
        // Si está editando y puso contraseña, verificar longitud
        if (nuevoUsuario.password && nuevoUsuario.password.length > 0 && nuevoUsuario.password.length < 8) {
             return Swal.fire('Seguridad', 'La nueva contraseña es muy corta (mínimo 8)', 'warning');
        }
    }

    try {
      Swal.fire({ title: 'Guardando...', didOpen: () => Swal.showLoading() });

      if (idEdicion) {
        // ACTUALIZAR (PUT)
        await axios.put(`/auth/users/${idEdicion}`, nuevoUsuario);
        Swal.fire('Actualizado', 'Usuario modificado correctamente', 'success');
      } else {
        // CREAR (POST)
        await axios.post("/auth/register", nuevoUsuario);
        Swal.fire('Creado', 'Usuario registrado correctamente', 'success');
      }
      
      limpiarFormulario();
      cargarUsuarios();

    } catch (error) {
      Swal.fire('Error', error.response?.data?.error || "Ocurrió un error", 'error');
    }
  }

  // --- CAMBIAR ESTADO RÁPIDO (Toggle) ---
  async function toggleEstado(usuario) {
    try {
        const nuevoEstado = !usuario.activo;
        await axios.patch(`/auth/users/${usuario._id}/status`, { activo: nuevoEstado });
        // Actualizamos localmente para que se vea rápido
        usuario.activo = nuevoEstado; 
        usuarios = usuarios; // Reactividad Svelte
        
        const Toast = Swal.mixin({
            toast: true, position: 'top-end', showConfirmButton: false, timer: 2000
        });
        Toast.fire({
            icon: nuevoEstado ? 'success' : 'warning',
            title: `Usuario ${nuevoEstado ? 'Activado' : 'Deshabilitado'}`
        });

    } catch (error) {
        Swal.fire('Error', 'No se pudo cambiar el estado', 'error');
    }
  }

  // --- ELIMINAR ---
  async function eliminarUsuario(id, nombre) {
    const miUsuario = JSON.parse(localStorage.getItem("usuario"));
    if (miUsuario.id === id) {
      return Swal.fire('Error', 'No puedes eliminar tu propia cuenta', 'error');
    }

    const confirm = await Swal.fire({
      title: `¿Eliminar a ${nombre}?`,
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar"
    });

    if (confirm.isConfirmed) {
      try {
        await axios.delete(`/auth/users/${id}`);
        if (idEdicion === id) limpiarFormulario();
        Swal.fire('Eliminado', 'El usuario ha sido borrado.', 'success');
        cargarUsuarios();
      } catch (error) {
        Swal.fire('Error', 'No se pudo eliminar', 'error');
      }
    }
  }
</script>

<div class="users-container">
  
  <div class="header-section">
    <h2> Gestión de Equipo</h2>
    <p>Administra accesos y roles del personal.</p>
  </div>

  <div class="layout">
    
    <div class="card form-card {idEdicion ? 'editando' : ''}">
      <div class="header-form">
          <h3>{idEdicion ? '✏️ Editando a ' + nuevoUsuario.nombre : '➕ Nuevo Usuario'}</h3>
      </div>
      
      <form on:submit|preventDefault={guardarUsuario}>
        
        <div class="form-group">
          <label>Nombre Completo *</label>
          <input type="text" bind:value={nuevoUsuario.nombre} placeholder="Ej: Juan Pérez" required>
        </div>

        <div class="form-group">
          <label>Email (Usuario) *</label>
          <input type="email" bind:value={nuevoUsuario.email} placeholder="juan@bethel.com" required>
        </div>

        <div class="form-group">
          <label>
            Contraseña 
            {#if idEdicion} <small>(Dejar vacío para no cambiar)</small> {/if}
            {#if !idEdicion} * <small>(Mín. 8 caracteres)</small> {/if}
          </label>
          <input type="password" bind:value={nuevoUsuario.password} placeholder="••••••••">
        </div>

        <div class="form-group">
          <label>Celular / WhatsApp</label>
          <input type="text" bind:value={nuevoUsuario.telefono} placeholder="Ej: 77778888">
        </div>

        <div class="row-group">
            <div class="form-group half">
            <label>Rol</label>
            <select bind:value={nuevoUsuario.rol}>
                <option value="asesor">Asesor de Ventas</option>
                <option value="admin">Administrador</option>
            </select>
            </div>

            <div class="form-group half">
            <label>Estado</label>
            <select bind:value={nuevoUsuario.activo}>
                <option value={true}>✅ Activo</option>
                <option value={false}>⛔ Deshabilitado</option>
            </select>
            </div>
        </div>

        <div class="actions">
            <button type="submit" class="btn-save">
                {idEdicion ? 'Actualizar' : 'Crear Usuario'}
            </button>
            
            {#if idEdicion}
                <button type="button" class="btn-cancel" on:click={cancelarEdicion}>Cancelar</button>
            {/if}
        </div>
      </form>
    </div>

    <div class="card list-card">
      <div class="header-list">
          <h3>Usuarios ({usuarios.length})</h3>
          <button class="btn-refresh" on:click={cargarUsuarios} title="Recargar">↻</button>
      </div>
      
      {#if cargando}
        <div class="loading">Cargando equipo...</div>
      {:else}
        <div class="table-responsive">
            <table class="user-table">
            <thead>
                <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                {#each usuarios as u}
                <tr class="{idEdicion === u._id ? 'seleccionado' : ''} {u.activo ? '' : 'inactivo'}">
                    <td>
                        <div class="user-info">
                            <span class="user-name">{u.nombre}</span>
                            <span class="user-email">{u.email}</span>
                            {#if u.telefono} <span class="user-phone">📞 {u.telefono}</span> {/if}
                        </div>
                    </td>
                    <td>
                        <span class="badge role {u.rol}">
                            {u.rol === 'admin' ? ' Admin' : ' Asesor'}
                        </span>
                    </td>
                    <td>
                        <button class="btn-toggle {u.activo ? 'on' : 'off'}" on:click={() => toggleEstado(u)}>
                            {u.activo ? 'Activo' : 'Inactivo'}
                        </button> 
                    </td>
                    <td class="acciones">
                         <button class="btn-toggle" on:click={() => cargarDatosEdicion(u)}>Editar

                         </button>
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
  .users-container { max-width: 1100px; margin: 0 auto; padding: 20px; font-family: 'Segoe UI', sans-serif; }
  .header-section { margin-bottom: 30px; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; }
  .header-section h2 { color: #003366; margin: 0; }
  .header-section p { color: #666; margin: 5px 0 0 0; }

  .layout { display: grid; grid-template-columns: 1fr 1.8fr; gap: 30px; align-items: start; }
  
  .card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
  .card.editando { border: 2px solid #ffcc00; background: #fffdf9; position: sticky; top: 20px; }
  
  h3 { margin: 0 0 20px 0; color: #333; font-size: 1.1rem; border-bottom: 1px solid #eee; padding-bottom: 10px; }

  /* FORMULARIO */
  .form-group { margin-bottom: 15px; }
  .row-group { display: flex; gap: 15px; }
  .form-group.half { flex: 1; }
  
  label { display: block; font-weight: 600; font-size: 0.85rem; color: #555; margin-bottom: 5px; }
  input, select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; font-size: 0.95rem; }
  input:focus, select:focus { border-color: #003366; outline: none; }
  
  .actions { display: flex; flex-direction: column; gap: 10px; margin-top: 20px; }
  .btn-save { background: #003366; color: white; padding: 12px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.2s; }
  .btn-save:hover { background: #002244; }
  .btn-cancel { background: #eee; color: #333; padding: 8px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
  .btn-cancel:hover { background: #ddd; }

  /* LISTA */
  .header-list { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
  .btn-refresh { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #003366; }

  .table-responsive { overflow-x: auto; }
  .user-table { width: 100%; border-collapse: collapse; }
  .user-table th { text-align: left; color: #777; font-size: 0.8rem; padding: 10px; border-bottom: 2px solid #eee; text-transform: uppercase; }
  .user-table td { padding: 12px 10px; border-bottom: 1px solid #f0f0f0; vertical-align: middle; }
  
  /* FILAS */
  .user-info { display: flex; flex-direction: column; }
  .user-name { font-weight: bold; color: #333; }
  .user-email { font-size: 0.85rem; color: #666; }
  .user-phone { font-size: 0.8rem; color: #28a745; margin-top: 2px; }

  tr.seleccionado { background: #fff8e1; }
  tr.inactivo td { opacity: 0.5; } /* Usuario deshabilitado se ve tenue */

  /* BADGES */
  .badge { padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold; }
  .badge.admin { background: #e3f2fd; color: #0d47a1; }
  .badge.asesor { background: #e8f5e9; color: #2e7d32; }

  /* TOGGLE ESTADO */
  .btn-toggle { padding: 4px 10px; border-radius: 20px; border: none; font-size: 0.75rem; font-weight: bold; cursor: pointer; width: 80px; }
  .btn-toggle.on { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
  .btn-toggle.off { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }

  /* ACCIONES */
  .btn-icon { border: none; padding: 6px; border-radius: 4px; cursor: pointer; font-size: 1rem; transition: 0.2s; }
  .btn-icon.edit { background: #fff3cd; color: #856404; }
  .btn-icon.del { background: #f8d7da; color: #721c24; }
  .btn-icon:hover { transform: scale(1.1); }

  @media (max-width: 800px) {
    .layout { grid-template-columns: 1fr; }
    .card.editando { position: relative; top: 0; }
  }
</style>