<script>
  import { onMount, createEventDispatcher } from "svelte"; // 1. Importamos esto
  import axios from "axios";
  
  const dispatch = createEventDispatcher(); // 2. Creamos el despachador

  let usuario = null;
  let esAdmin = false;
  let cargando = true;

  let stats = {
    totalDocs: 0,
    dineroTotal: 0,
    porEstado: [],
    ranking: []
  };

  onMount(async () => {
    const userGuardado = localStorage.getItem("usuario");
    if (userGuardado) {
      usuario = JSON.parse(userGuardado);
      esAdmin = usuario.rol === 'admin';

      try {
        const res = await axios.get(`http://localhost:3000/api/dashboard-stats?rol=${usuario.rol}&usuario_id=${usuario.id}`);
        stats = res.data;
      } catch (error) {
        console.error("Error cargando dashboard:", error);
      }
    }
    cargando = false;
  });

  function getCant(estado) {
    const encontrado = stats.porEstado.find(e => e._id === estado);
    return encontrado ? encontrado.cantidad : 0;
  }

  // 3. Función para enviar la señal de navegación
  function navegar(destino) {
    dispatch('navegar', destino);
  }
</script>

<div class="home-container">
  
  {#if cargando}
    <p class="loading">Cargando tablero...</p>
  {:else if usuario}
    
    <header class="welcome-header">
      <h1>Hola, <span class="nombre">{usuario.nombre}</span> </h1>
      <p class="rol-badge">{esAdmin ? 'PANEL GERENCIAL' : 'PANEL DE ASESOR'}</p>
    </header>

    {#if esAdmin}
      <div class="kpi-grid">
        <div class="card kpi-blue">
          <h3>Total Cotizado</h3>
          <p class="numero">$ {stats.dineroTotal.toLocaleString('en-US', {maximumFractionDigits: 0})}</p>
        </div>
        <div class="card kpi-green">
          <h3>Cotizaciones</h3>
          <p class="numero">{stats.totalDocs}</p>
        </div>
        <div class="card kpi-orange">
          <h3>En Trámite</h3>
          <p class="numero">{getCant('En Tránsito') + getCant('En Aduana')}</p>
        </div>
      </div>

      <div class="dashboard-split">
        <div class="panel">
          <h3>📊 Estados</h3>
          {#each ['Borrador', 'En Tránsito', 'En Aduana', 'Entregada'] as estado}
             <div class="estado-bar">
               <div class="label">{estado}</div>
               <div class="bar-bg"><div class="bar-fill" style="width: {getCant(estado) * 10}%; background: #003366;"></div></div>
               <div class="count">{getCant(estado)}</div>
             </div>
          {/each}
        </div>

        <div class="panel">
          <h3>🏆 Ranking</h3>
          <table class="ranking-table">
            <thead><tr><th>Asesor</th><th>Ventas</th><th>Monto</th></tr></thead>
            <tbody>
              {#each stats.ranking as row}
                <tr>
                  <td>{row.nombre}</td>
                  <td class="center">{row.cantidad}</td>
                  <td class="right">$ {row.monto.toLocaleString('en-US', {maximumFractionDigits:0})}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>

    {:else}
      <div class="asesor-layout">
        
        <div class="quick-actions">
           <h3> Acciones Rápidas</h3>
           <div class="buttons-grid">
             <button class="btn-big btn-new" on:click={() => navegar('cotizar')}> 
                Nueva Cotización
             </button>
             
             <button class="btn-big btn-list" on:click={() => navegar('historial')}>
                Ver Mis Cotizaciones
             </button>
           </div>
        </div>

        <div class="personal-stats">
          <h3> Tu Rendimiento</h3>
          <p>Has cotizado: <strong>$ {stats.dineroTotal.toLocaleString('en-US')}</strong></p>
          <div class="stat-alert">
            Tienes <strong>{getCant('En Tránsito')}</strong> autos en camino.
          </div>
        </div>
      </div>
    {/if}

  {/if}
</div>

<style>
  /* Mismos estilos de antes... */
  .home-container { max-width: 1100px; margin: 0 auto; padding-bottom: 40px; }
  .welcome-header { margin-bottom: 30px; border-bottom: 2px solid #ddd; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: center;}
  h1 { color: #333; margin: 0; } .nombre { color: #003366; }
  .rol-badge { background: #003366; color: white; padding: 5px 15px; border-radius: 20px; font-weight: bold; font-size: 0.8rem;}

  .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
  .card { padding: 20px; border-radius: 10px; color: white; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
  .card .numero { font-size: 2rem; font-weight: bold; margin: 5px 0 0 0; }
  .kpi-blue { background: #003366; } .kpi-green { background: #28a745; } .kpi-orange { background: #ff9900; }

  .dashboard-split { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
  .panel { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
  
  .estado-bar { display: flex; align-items: center; margin-bottom: 10px; }
  .label { width: 100px; font-weight: bold; font-size: 0.9rem; }
  .bar-bg { flex: 1; height: 8px; background: #eee; margin: 0 10px; border-radius: 4px; }
  .bar-fill { height: 100%; border-radius: 4px; }
  
  .ranking-table { width: 100%; }
  .ranking-table td { padding: 8px 0; border-bottom: 1px solid #eee; }
  .right { text-align: right; } .center { text-align: center; }

  /* ASESOR */
  .asesor-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 30px; }
  .buttons-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;}
  .btn-big { padding: 30px; border: none; border-radius: 10px; font-size: 1.1rem; font-weight: bold; cursor: pointer; transition: transform 0.2s; box-shadow: 0 5px 15px rgba(0,0,0,0.1); display: flex; flex-direction: column; align-items: center; gap: 10px; justify-content: center;}
  .btn-big:hover { transform: translateY(-3px); }
  .btn-new { background: #003366; color: white; }
  .btn-list { background: white; color: #003366; border: 2px solid #003366; }

  .personal-stats { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); height: fit-content; }
  .stat-alert { background: #e3f2fd; color: #0d47a1; padding: 15px; border-radius: 5px; margin-top: 15px; }
</style>