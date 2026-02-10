<script>
// @ts-nocheck

  import { createEventDispatcher } from "svelte";
  // ✅ Importación segura del logo (asegúrate de que existe en assets)
  import logoImg from '../public/logo.png'; 

  const dispatch = createEventDispatcher();
  function volver() { dispatch('volver'); }
</script>

<div class="contacto-wrapper">
  
  <header class="hero-blue">
    <button class="btn-volver-float" on:click={volver}>← Volver al Catálogo</button>

    <div class="hero-content-centered">
      
      <div class="brand-header-text">
        <h1>BETHEL MOTORS</h1>
        <p>Contáctanos & Visítanos</p>
      </div>
    </div>
  </header>

  <div class="container main-content">
    
    <div class="info-card">
      <h3>Nuestra Misión</h3>
      <p>En <strong>Bethel Motors</strong>, nos dedicamos a facilitar la importación de vehículos directamente desde subastas en USA hasta tus manos en Bolivia.</p>

      <div class="datos-contacto">
        <div class="dato">
          <span class="icon">📍</span>
          <div>
            <h4>Ubicación</h4>
            <p>Aroma,Mururata</p>
            <p>Cochabamba, Bolivia</p>
          </div>
        </div>

        <div class="dato">
          <span class="icon">⏰</span>
          <div>
            <h4>Horarios de Atención</h4>
            <p>Lunes a Viernes: 08:30 - 18:30</p>
            <p>Sábados: 09:00 - 13:00</p>
          </div>
        </div>

        <div class="dato">
          <span class="icon">📞</span>
          <div>
            <h4>Teléfonos</h4>
            <p><a href="https://wa.me/59162512418" target="_blank">+591 62512418</a></p>
          </div>
        </div>
      </div>
    </div>

    <div class="map-card">
      <div class="map-wrapper">
        <iframe 
          title="Ubicación Bethel Motors"
          width="100%" 
          height="100%" 
          style="border:0;" 
          loading="lazy" 
          allowfullscreen
          src="https://maps.google.com/maps?q=-17.40598168774192,-66.16422277790197&z=17&output=embed">
        </iframe>
      </div>
    </div>
  </div>

  <footer class="footer-dark">
    <div class="footer-container">
        <div class="footer-col">
            <div class="footer-brand">
              
                <h3>BETHEL MOTORS</h3>
            </div>
            <p class="footer-desc">Especialistas en importación de vehículos.</p>
        </div>
        
        <div class="footer-col">
            <h4>Navegación</h4>
            <ul>
                <li><button class="link-btn" on:click={volver}>Volver al Catálogo</button></li>
            </ul>
        </div>
    </div>
    <div class="footer-bottom"><p>© 2026 BETHEL MOTORS.</p></div>
  </footer>

</div>

<style>
  .contacto-wrapper { background: #f3f5f7; min-height: 100vh; font-family: 'Segoe UI', sans-serif; display: flex; flex-direction: column; }
  .hero-blue { background: linear-gradient(135deg, #003366 0%, #001a33 100%); color: white; padding: 40px 20px; text-align: center; position: relative; display: flex; flex-direction: column; align-items: center; }
  .btn-volver-float { position: absolute; top: 20px; left: 20px; background: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 8px 15px; border-radius: 20px; cursor: pointer; font-size: 0.9rem; }
  .hero-content-centered { width: 100%; max-width: 800px; display: flex; flex-direction: column; align-items: center; gap: 15px; }
  .brand-header-text h1 { margin: 0; font-size: clamp(2rem, 5vw, 3rem); font-weight: 900; letter-spacing: 2px; }
  .brand-header-text p { margin: 5px 0 0 0; color: #e0e0e0; font-size: 1.1rem; }
  
  .container { max-width: 1200px; margin: 40px auto; padding: 0 20px; flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
  .info-card, .map-card { background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
  h3 { color: #003366; border-bottom: 3px solid #28a745; display: inline-block; padding-bottom: 5px; margin-top: 0; }
  .datos-contacto { margin-top: 30px; display: flex; flex-direction: column; gap: 25px; }
  .dato { display: flex; gap: 15px; }
  .icon { font-size: 1.5rem; background: #eef2f6; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 50%; color: #003366; }
  .dato h4 { margin: 0 0 5px 0; color: #003366; font-size: 1.1rem; }
  .map-wrapper { width: 100%; height: 100%; min-height: 400px; border-radius: 8px; overflow: hidden; }

  .footer-dark { background: #001a33; color: #cbd5e1; margin-top: 50px; font-size: 0.9rem; border-top: 5px solid #003366; }
  .footer-container { max-width: 1200px; margin: 0 auto; padding: 60px 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 40px; }
  .footer-brand h3 { color: white; font-weight: 800; margin: 15px 0 10px 0; font-size: 1.3rem; }
  .footer-col h4 { color: white; margin-bottom: 25px; border-bottom: 3px solid #28a745; display: inline-block; padding-bottom: 5px; }
  .footer-col ul { list-style: none; padding: 0; margin: 0; }
  .link-btn { background: none; border: none; color: #cbd5e1; cursor: pointer; padding: 0; font-size: 1rem; }
  .footer-bottom { background: #001122; text-align: center; padding: 25px; }
  
  @media (max-width: 768px) { .container { grid-template-columns: 1fr; } .footer-container { text-align: center; } }
</style>