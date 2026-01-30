<script>
  import { onMount } from "svelte";
  import axios from "axios";
  import Swal from "sweetalert2";

  let usuarios = [];
  let cargando = true;
  let idEdicion = null; // Si tiene valor, estamos editando

  let nuevoUsuario = {
    nombre: "",
    username: "",
    password: "",
    telefono: "",
    rol: "asesor"
  };

  onMount(cargarUsuarios);

  async function cargarUsuarios() {
    try {
      // CORREGIDO: Ruta relativa
      const res = await axios.get("/auth/users");
      usuarios = res.data;
      cargando = false;
    } catch (error) {
      console.error(error);
      Swal.fire({
        title: "Error", text: "No se pudieron cargar los usuarios",
        icon: "error", confirmButtonColor: "#003366"
      });
    }
  }

  // --- MODO EDICIÓN ---
  function cargarDatosEdicion(usuario) {
    // Copiamos los datos al formulario
    nuevoUsuario = { 
        nombre: usuario.nombre,
        username: usuario.username,
        password: "", // La contraseña no se carga por seguridad
        telefono: usuario.telefono,
        rol: usuario.rol
    };
    idEdicion = usuario._id;
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Subir al formulario
  }

  function cancelarEdicion() {
    limpiarFormulario();
  }

  function limpiarFormulario() {
    nuevoUsuario = { nombre: "", username: "", password: "", telefono: "", rol: "asesor" };
    idEdicion = null;
  }

  async function guardarUsuario() {
    // Validaciones
    if (!nuevoUsuario.nombre || !nuevoUsuario.username) {
      return Swal.fire({
        title: "Atención", text: "Nombre y Usuario son obligatorios",
        icon: "warning", confirmButtonColor: "#003366"
      });
    }

    // Si es nuevo, la contraseña es obligatoria. Si edita, es opcional.
    if (!idEdicion && !nuevoUsuario.password) {
        return Swal.fire({
        title: "Atención", text: "La contraseña es obligatoria para nuevos usuarios",
        icon: "warning", confirmButtonColor: "#003366"
      });
    }

    try {
      if (idEdicion) {
        // --- ACTUALIZAR (PUT) ---
        // CORREGIDO: Ruta relativa
        await axios.put(`/auth/users/${idEdicion}`, nuevoUsuario);
        Swal.fire({
            title: "Actualizado", text: "Datos del usuario modificados",
            icon: "success", confirmButtonColor: "#003366"
        });
      } else {
        // --- CREAR (POST) ---
        // CORREGIDO: Ruta relativa
        await axios.post("/auth/register", nuevoUsuario);
        Swal.fire({
            title: "Creado", text: "Usuario registrado correctamente",
            icon: "success", confirmButtonColor: "#003366"
        });
      }
      
      limpiarFormulario();
      cargarUsuarios();

    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.response?.data?.error || "Ocurrió un error",
        icon: "error", confirmButtonColor: "#003366"
      });
    }
  }

  async function eliminarUsuario(id, nombre) {
    const miUsuario = JSON.parse(localStorage.getItem("usuario"));
    if (miUsuario.id === id) {
      return Swal.fire({
        title: "Error", text: "No puedes eliminar tu propia cuenta",
        icon: "error", confirmButtonColor: "#003366"
      });
    }

    const confirm = await Swal.fire({
      title: `¿Eliminar a ${nombre}?`,
      text: "Se perderá el acceso de este usuario.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ff0000",
      cancelButtonColor: "#003366",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });

    if (confirm.isConfirmed) {
      try {
        // CORREGIDO: Ruta relativa
        await axios.delete(`/auth/users/${id}`);
        // Si borramos al que estabamos editando, limpiamos
        if (idEdicion === id) limpiarFormulario();
        
        Swal.fire({
          title: "Eliminado", text: "Usuario dado de baja.",
          icon: "success", confirmButtonColor: "#003366"
        });
        cargarUsuarios();
      } catch (error) {
        Swal.fire({ title: "Error", icon: "error", confirmButtonColor: "#003366" });
      }
    }
  }
</script>

<div class="users-container">
  <h2>👥 Gestión de Equipo</h2>

  <div class="layout">
    
    <div class="card form-card {idEdicion ? 'editando' : ''}">
      <div class="header-form">
          <h3>{idEdicion ? '✏️ Editar Usuario' : '➕ Nuevo Integrante'}</h3>
      </div>
      
      <form on:submit|preventDefault={guardarUsuario}>
        
        <div class="form-group">
          <label>Nombre Completo</label>
          <input type="text" bind:value={nuevoUsuario.nombre} placeholder="Ej: Juan Pérez" required>
        </div>

        <div class="form-group">
          <label>Usuario (Login)</label>
          <input type="text" bind:value={nuevoUsuario.username} placeholder="Ej: juan" required>
        </div>

        <div class="form-group">
          <label>Contraseña</label>
          <input type="password" bind:value={nuevoUsuario.password} placeholder={idEdicion ? "(Dejar vacía para mantener la actual)" : "••••••"}>
        </div>

        <div class="form-group">
          <label>Celular (WhatsApp)</label>
          <input type="text" bind:value={nuevoUsuario.telefono} placeholder="Ej: 77778888">
        </div>

        <div class="form-group">
          <label>Rol</label>
          <select bind:value={nuevoUsuario.rol}>
            <option value="asesor">Asesor de Ventas</option>
            <option value="admin">Administrador (Gerente)</option>
          </select>
        </div>

        <button type="submit" class="btn-save">
            {idEdicion ? '💾 Guardar Cambios' : '💾 Crear Usuario'}
        </button>
        
        {#if idEdicion}
            <button type="button" class="btn-cancel" on:click={cancelarEdicion}>Cancelar</button>
        {/if}
      </form>
    </div>

    <div class="card list-card">
      <h3>Usuarios Activos ({usuarios.length})</h3>
      
      {#if cargando}
        <p>Cargando...</p>
      {:else}
        <table class="user-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {#each usuarios as u}
              <tr class="{idEdicion === u._id ? 'seleccionado' : ''}">
                <td>
                  <strong>{u.nombre}</strong>
                  <br>
                  <small class="text-muted">@{u.username} | 📞 {u.telefono || 'Sin cel'}</small>
                </td>
                <td>
                  <span class="badge {u.rol}">{u.rol === 'admin' ? 'Gerente' : 'Vendedor'}</span>
                </td>
                <td class="acciones">
                  <button class="btn-icon btn-edit" title="Editar" on:click={() => cargarDatosEdicion(u)}>Editar</button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>

  </div>
</div>

<style>
  .users-container { max-width: 1000px; margin: 0 auto; }
  h2 { color: #003366; border-bottom: 2px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }

  .layout { display: grid; grid-template-columns: 1fr 1.5fr; gap: 30px; }
  
  .card { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); transition: 0.3s; }
  .card.editando { border: 2px solid #ffcc00; background: #fffdf5; }
  
  .card h3 { margin-top: 0; color: #333; margin-bottom: 20px; }

  /* FORMULARIO */
  .form-group { margin-bottom: 15px; }
  .form-group label { display: block; font-weight: bold; font-size: 0.9rem; color: #555; margin-bottom: 5px; }
  .form-group input, .form-group select { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px; box-sizing: border-box; }
  
  .btn-save { width: 100%; background: #003366; color: white; padding: 12px; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; transition: background 0.2s; }
  .btn-save:hover { background: #002244; }

  .btn-cancel { width: 100%; background: #ddd; color: #333; padding: 8px; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; margin-top: 10px; }
  .btn-cancel:hover { background: #ccc; }

  /* TABLA */
  .user-table { width: 100%; border-collapse: collapse; }
  .user-table th { text-align: left; color: #777; font-size: 0.85rem; padding-bottom: 10px; border-bottom: 2px solid #eee; }
  .user-table td { padding: 12px 5px; border-bottom: 1px solid #eee; vertical-align: middle; }
  .user-table tr.seleccionado { background: #fff8e1; } /* Resaltar fila seleccionada */
  
  .text-muted { color: #888; font-size: 0.85rem; }
  
  .badge { padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; }
  .badge.admin { background: #e3f2fd; color: #0d47a1; border: 1px solid #90caf9; }
  .badge.asesor { background: #e8f5e9; color: #2e7d32; border: 1px solid #a5d6a7; }

  .acciones { display: flex; gap: 5px; }
  .btn-icon { border: none; padding: 5px 8px; border-radius: 4px; cursor: pointer; font-size: 1rem; }
  
  .btn-edit { background: #e3f2fd; color: #003366; }
  .btn-edit:hover { background: #bbdefb; }
  
  .btn-delete { background: #ffebee; color: #c62828; }
  .btn-delete:hover { background: #ffcdd2; }

  @media (max-width: 768px) {
    .layout { grid-template-columns: 1fr; }
  }
</style>