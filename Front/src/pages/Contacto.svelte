<script>
// @ts-nocheck

  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  function volver() { dispatch('volver'); }

  function irWhatsApp() {
    window.open("https://wa.me/59162512418", "_blank");
  }
</script>

<div class="contacto-wrapper">
  
  <header class="hero-blue">
    <div class="nav-top">
        <button class="btn-pill btn-ghost-light" on:click={volver}>
            ← Volver al Catálogo
        </button>
    </div>

    <div class="hero-content-centered">
      <div class="brand-header-text">
        <h1>BETHEL MOTORS</h1>
        <p>Visítanos y conoce tu próximo vehículo</p>
      </div>
    </div>
  </header>

  <div class="container main-content">
    
    <div class="info-card fade-up">
      <div class="card-header">
          <h3>🏢 Nuestra Oficina</h3>
          <p>Nos dedicamos a facilitar la importación directa desde USA hasta tus manos en Bolivia con total transparencia.</p>
      </div>

      <div class="datos-contacto">
        
        <div class="dato-item">
          <div class="icon-box">📍</div>
          <div class="dato-text">
            <h4>Ubicación</h4>
            <p>Av. Aroma esq. Mururata</p>
            <p>Cochabamba, Bolivia</p>
          </div>
        </div>

        <div class="dato-item">
          <div class="icon-box">⏰</div>
          <div class="dato-text">
            <h4>Horarios de Atención</h4>
            <p>Lunes a Viernes: 08:30 - 18:30</p>
            <p>Sábados: 09:00 - 13:00</p>
          </div>
        </div>

        <div class="dato-item">
          <div class="icon-box">📞</div>
          <div class="dato-text">
            <h4>Atención al Cliente</h4>
            <p>Asesoramiento personalizado vía WhatsApp.</p>
          </div>
        </div>

        <button class="btn-pill btn-solid-green full-width" on:click={irWhatsApp}>
            <span class="wa-icon">💬</span> Chatear al +591 62512418
        </button>

      </div>
    </div>

    <div class="map-card fade-up delay">
      <div class="map-header">
        <h3>🗺️ Encuéntranos en el Mapa</h3>
      </div>
      <div class="map-wrapper">
        <iframe 
          title="Ubicación Bethel Motors"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3807.412633860536!2d-66.1568!3d-17.3935!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x93e373f7cd90786b%3A0x63426543666572!2sAv.%20Aroma%2C%20Cochabamba!5e0!3m2!1ses!2sbo!4v1700000000000!5m2!1ses!2sbo" 
          width="100%" 
          height="100%" 
          style="border:0;" 
          allowfullscreen="" 
          loading="lazy" 
          referrerpolicy="no-referrer-when-downgrade">
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
            <p class="footer-desc">Especialistas en importación de vehículos de USA y trámites aduaneros.</p>
        </div>
        
        <div class="footer-col center-col">
            <h4>Navegación</h4>
            <button class="btn-pill btn-ghost-light" on:click={volver}>
                Ir al Catálogo
            </button>
        </div>

        <div class="footer-col">
            <h4>Redes Sociales</h4>
            <div class="social-links">
                <span>Facebook</span> • <span>Instagram</span> • <span>TikTok</span>
            </div>
        </div>
    </div>
    <div class="footer-bottom"><p>© 2026 BETHEL MOTORS.</p></div>
  </footer>

</div>

<style>
  /* --- ESTILOS COMPARTIDOS (Botones Pill) --- */
  .btn-pill {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 10px 24px; border-radius: 50px; font-family: 'Segoe UI', sans-serif;
    font-size: 0.95rem; font-weight: 600; cursor: pointer; text-decoration: none;
    transition: all 0.2s ease-in-out; border: 1px solid transparent; gap: 8px;
  }
  .btn-pill:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
  .btn-pill:active { transform: translateY(0); }

  .btn-ghost-light { background: rgba(255, 255, 255, 0.1); color: white; border-color: rgba(255,255,255,0.3); }
  .btn-ghost-light:hover { background: white; color: #003366; }

  .btn-solid-green { background: #28a745; color: white; border-color: #28a745; font-size: 1.1rem; padding: 15px; }
  .btn-solid-green:hover { background: #218838; box-shadow: 0 5px 15px rgba(40, 167, 69, 0.4); }

  .full-width { width: 100%; margin-top: 10px; }

  /* --- LAYOUT --- */
  .contacto-wrapper { background: #f3f5f7; min-height: 100vh; font-family: 'Segoe UI', sans-serif; display: flex; flex-direction: column; }
  
  /* HEADER */
  .hero-blue { background: linear-gradient(135deg, #003366 0%, #001a33 100%); color: white; padding: 40px 20px; text-align: center; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .nav-top { position: absolute; top: 20px; left: 20px; z-index: 10; }

  .hero-content-centered { width: 100%; max-width: 800px; display: flex; flex-direction: column; align-items: center; gap: 10px; margin-top: 40px; }
  .brand-header-text h1 { margin: 0; font-size: clamp(2.5rem, 5vw, 4rem); font-weight: 900; letter-spacing: 2px; line-height: 1.1; }
  .brand-header-text p { margin: 10px 0 0 0; color: #cbd5e1; font-size: 1.2rem; font-weight: 300; }
  
  /* CONTENIDO PRINCIPAL */
  /* ✅ CORREGIDO: Margen superior positivo (40px) para que no se solape con el header */
  .container { max-width: 1100px; margin: 40px auto 50px auto; padding: 0 20px; flex: 1; display: grid; grid-template-columns: 1fr 1.5fr; gap: 30px; position: relative; z-index: 2; }
  
  /* TARJETAS */
  .info-card, .map-card { 
      background: white; border-radius: 16px; padding: 35px; 
      box-shadow: 0 10px 30px rgba(0,0,0,0.08); 
      display: flex; flex-direction: column;
      border: 1px solid rgba(0,0,0,0.02);
  }
  
  /* Animación de entrada */
  .fade-up { animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; transform: translateY(20px); }
  .delay { animation-delay: 0.1s; }
  @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }

  .card-header h3, .map-header h3 { color: #003366; font-size: 1.4rem; margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; }
  .card-header p { color: #666; line-height: 1.5; margin-bottom: 30px; }

  /* LISTA DE DATOS */
  .datos-contacto { display: flex; flex-direction: column; gap: 25px; }
  .dato-item { display: flex; gap: 15px; align-items: flex-start; }
  
  .icon-box { 
      font-size: 1.5rem; background: #eef2f6; width: 50px; height: 50px; 
      display: flex; align-items: center; justify-content: center; 
      border-radius: 50%; color: #003366; flex-shrink: 0; 
  }
  
  .dato-text h4 { margin: 0 0 4px 0; color: #003366; font-size: 1rem; font-weight: 700; }
  .dato-text p { margin: 0; color: #555; font-size: 0.95rem; line-height: 1.4; }

  /* MAPA */
  .map-wrapper { 
      width: 100%; flex: 1; min-height: 450px; 
      border-radius: 12px; overflow: hidden; 
      border: 1px solid #ddd;
  }

  /* FOOTER */
  .footer-dark { background: #001a33; color: #cbd5e1; margin-top: 50px; font-size: 0.9rem; border-top: 5px solid #003366; }
  .footer-container { max-width: 1200px; margin: 0 auto; padding: 60px 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 40px; }
  .footer-brand h3 { color: white; font-weight: 800; margin: 15px 0 10px 0; font-size: 1.3rem; }
  .footer-col h4 { color: white; margin-bottom: 25px; border-bottom: 3px solid #28a745; display: inline-block; padding-bottom: 5px; }
  .center-col { display: flex; flex-direction: column; align-items: flex-start; }
  .social-links { color: #aaa; }
  .footer-bottom { background: #001122; text-align: center; padding: 25px; }
  
  /* RESPONSIVE */
  @media (max-width: 900px) { 
      .container { grid-template-columns: 1fr; margin-top: 20px; } 
      .nav-top { position: static; margin-bottom: 15px; } /* Botón volver se acomoda arriba */
      .hero-blue { align-items: center; padding: 20px; }
      .footer-container { text-align: center; }
      .center-col { align-items: center; }
      .map-wrapper { min-height: 300px; }
  }
</style>