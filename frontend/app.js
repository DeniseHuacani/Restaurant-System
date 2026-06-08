
/**
 * app.js - Punto de entrada Orquestador
 */
document.addEventListener("DOMContentLoaded", async () => {
  const App = window.App;

  if (!App || !App.stateManager || !App.ui || !App.controllers) {
    console.error("Error crítico: No se cargaron todos los módulos.");
    return;
  }

  try {
    // 1. Inicializar datos desde persistencia
    await App.stateManager.initState();
    
    // 2. Vincular eventos de la interfaz
    App.controllers.bindEvents();

    // 3. Renderizado inicial
    App.ui.renderAll();

    console.info("Restaurant-System inicializado correctamente.");

    // Ejecutar prueba de API (opcional)
    if (typeof window.fetch === 'function') {
      probarAPI();
    }

  } catch (error) {
    const errorEl = document.getElementById("global-error");
    if (errorEl) errorEl.textContent = `Error de inicio: ${error.message}`;
    App.ui.setFormDisabled(true);
  }
});

async function probarAPI() {
  try {
    const response = await fetch("http://localhost:3000/api/productos");
    if (response.ok) {
      const data = await response.json();
      console.log("Conexión con Backend exitosa:", data.length, "productos.");
    }
  } catch(error) {
    console.warn("Backend no disponible. Usando modo local.");
  }
}