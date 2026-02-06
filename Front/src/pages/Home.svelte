<script>
  import { onMount, createEventDispatcher } from "svelte";
  import axios from "axios";
  
  const dispatch = createEventDispatcher();

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
        const res = await axios.get(`/api/dashboard-stats?rol=${usuario.rol}&usuario_id=${usuario.id}`);
        stats = res.data;
      } catch (error) {
        console.error("Error cargando dashboard:", error);
        // Si hay error (ej. 404), no rompemos la UI, solo mostramos ceros
      }
    }
    cargando = false;
  });

  function getCant(estado) {
    const encontrado = stats.porEstado.find(e => e._id === estado);
    return encontrado ? encontrado.cantidad : 0;
  }

  // Función para enviar la señal de navegación al App.svelte
  function navegar(destino) {
    dispatch('navegar', destino);
  }
</script>
<svelte:head>
  <title>Bethel Motors</title>
</svelte:head>
<div class="home-container">
  
  {#if cargando}
    <div class="loading-box">
       <div class="spinner"></div>
       <p>Cargando tablero...</p>
    </div>
  {:else if usuario}
    
    <header class="welcome-header">
      <div class="text-head">
        <h1>Hola, <span class="nombre">{usuario.nombre}</span> 👋</h1>
        <p class="fecha-hoy">{new Date().toLocaleDateString('es-ES', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}</p>
      </div>
      <span class="rol-badge {esAdmin ? 'admin' : 'asesor'}">
        {esAdmin ? 'GERENCIA' : 'VENTAS'}
      </span>
    </header>

    {#if esAdmin}
      <div class="kpi-grid">
        <div class="card kpi-blue">
          <h3>Total Cotizado</h3>
          <p class="numero">$ {stats.dineroTotal.toLocaleString('en-US', {maximumFractionDigits: 0})}</p>
        </div>
        <div class="card kpi-green">
          <h3>Nº Cotizaciones</h3>
          <p class="numero">{stats.totalDocs}</p>
        </div>
        <div class="card kpi-orange">
          <h3>Trámites Activos</h3>
          <p class="numero">{getCant('En Tránsito') + getCant('En Aduana')}</p>
        </div>
      </div>

      <div class="dashboard-split">
        <div class="panel">
          <h3>📊 Estado de Trámites</h3>
          <div class="barras-container">
             {#each ['Borrador', 'En Tránsito', 'En Aduana', 'Entregada'] as estado}
                <div class="estado-bar">
                  <div class="label">{estado}</div>
                  <div class="bar-bg">
                    <div class="bar-fill" style="width: {stats.totalDocs ? (getCant(estado) / stats.totalDocs * 100) : 0}%; background: #003366;"></div>
                  </div>
                  <div class="count">{getCant(estado)}</div>
                </div>
             {/each}
          </div>
        </div>

        <div class="panel">
          <h3>🏆 Ranking del Mes</h3>
          {#if stats.ranking.length === 0}
            <p class="empty">Sin ventas registradas aún.</p>
          {:else}
            <table class="ranking-table">
              <thead><tr><th>Asesor</th><th class="center">Cant.</th><th class="right">Total ($)</th></tr></thead>
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
          {/if}
        </div>
      </div>

    {:else}
      <div class="asesor-layout">
        
        <div class="quick-actions">
           <h3>🚀 Acciones Rápidas</h3>
           <div class="buttons-grid">
             <button class="btn-big btn-new" on:click={() => navegar('cotizar')}> 
                <span class="icon">📄</span> Nueva Cotización
             </button>
             
             <button class="btn-big btn-list" on:click={() => navegar('historial')}>
                <span class="icon">📂</span> Mi Historial
             </button>

             <button class="btn-big btn-inv" on:click={() => navegar('inventario')}>
                <span class="icon">🚗</span> Ver Inventario
             </button>
           </div>
        </div>

        <div class="personal-stats">
          <h3>📈 Tu Rendimiento</h3>
          <div class="stat-row">
             <span>Cotizado este mes:</span>
             <strong>$ {stats.dineroTotal.toLocaleString('en-US')}</strong>
          </div>
          <div class="stat-row">
             <span>Cotizaciones emitidas:</span>
             <strong>{stats.totalDocs}</strong>
          </div>
          
          {#if getCant('En Tránsito') > 0}
            <div class="stat-alert">
               ⚠️ Tienes <strong>{getCant('En Tránsito')}</strong> vehículos en tránsito. ¡Haz seguimiento!
            </div>
          {/if}
        </div>
      </div>
    {/if}

  {/if}
</div>

<style>
  .home-container { max-width: 1100px; margin: 0 auto; padding-bottom: 40px; font-family: 'Segoe UI', sans-serif; }
  
  /* HEADER */
  .welcome-header { margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; display: flex; justify-content: space-between; align-items: center;}
  h1 { color: #333; margin: 0; font-size: 1.8rem; } 
  .nombre { color: #003366; }
  .fecha-hoy { color: #888; margin: 5px 0 0 0; font-size: 0.9rem; text-transform: capitalize; }
  
  .rol-badge { padding: 8px 15px; border-radius: 20px; font-weight: bold; font-size: 0.8rem; letter-spacing: 1px; }
  .rol-badge.admin { background: #003366; color: white; }
  .rol-badge.asesor { background: #28a745; color: white; }

  /* KPIS */
  .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
  .card { padding: 25px; border-radius: 12px; color: white; box-shadow: 0 4px 15px rgba(0,0,0,0.1); position: relative; overflow: hidden; }
  .card h3 { margin: 0; font-size: 1rem; opacity: 0.9; font-weight: normal; }
  .card .numero { font-size: 2.2rem; font-weight: bold; margin: 10px 0 0 0; }
  
  .kpi-blue { background: linear-gradient(135deg, #003366 0%, #0055aa 100%); } 
  .kpi-green { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); } 
  .kpi-orange { background: linear-gradient(135deg, #f2994a 0%, #f2c94c 100%); }

  /* PANELES */
  .dashboard-split { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
  .panel { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); border: 1px solid #f0f0f0; }
  .panel h3 { margin-top: 0; color: #444; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 20px; }

  /* BARRAS */
  .estado-bar { display: flex; align-items: center; margin-bottom: 15px; }
  .label { width: 100px; font-weight: 600; font-size: 0.85rem; color: #555; }
  .bar-bg { flex: 1; height: 10px; background: #f0f0f0; margin: 0 15px; border-radius: 10px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 10px; transition: width 1s ease-out; }
  .count { font-weight: bold; color: #003366; width: 20px; text-align: right; }
  
  /* TABLA RANKING */
  .ranking-table { width: 100%; border-collapse: collapse; }
  .ranking-table th { color: #888; font-size: 0.8rem; text-transform: uppercase; border-bottom: 1px solid #eee; padding-bottom: 10px; text-align: left; }
  .ranking-table td { padding: 12px 0; border-bottom: 1px solid #f9f9f9; font-weight: 500; color: #333; }
  .right { text-align: right; } .center { text-align: center; }

  /* ASESOR */
  .asesor-layout { display: grid; grid-template-columns: 1.5fr 1fr; gap: 30px; }
  
  .buttons-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 20px; margin-top: 20px;}
  .btn-big { padding: 25px; border: none; border-radius: 12px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.05); display: flex; flex-direction: column; align-items: center; gap: 10px; justify-content: center; height: 140px; }
  .btn-big:hover { transform: translateY(-5px); box-shadow: 0 8px 15px rgba(0,0,0,0.1); }
  .btn-big .icon { font-size: 2rem; }

  .btn-new { background: #003366; color: white; }
  .btn-list { background: white; color: #003366; border: 2px solid #eee; }
  .btn-inv { background: linear-gradient(135deg, #ff9966 0%, #ff5e62 100%); color: white; }

  .personal-stats { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); height: fit-content; }
  .stat-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
  .stat-alert { background: #fff3cd; color: #856404; padding: 15px; border-radius: 8px; margin-top: 20px; font-size: 0.9rem; border-left: 4px solid #ffcc00; }
  
  .loading-box { text-align: center; padding: 50px; color: #777; }
  .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #003366; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 0 auto 10px auto; }
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

  @media (max-width: 768px) {
    .dashboard-split, .asesor-layout { grid-template-columns: 1fr; }
    .kpi-grid { grid-template-columns: 1fr; }
  }
</style>