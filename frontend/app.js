
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
    // 1. Vincular eventos de la interfaz PRIMERO
    // Esto asegura que las pestañas (tabs) funcionen aunque falle la carga de datos
    App.controllers.bindEvents();

    // 2. Inicializar datos desde el servidor
    await App.stateManager.initState();
    
    // 3. Renderizado inicial de datos
    App.ui.renderAll();

    console.info("Restaurant-System inicializado correctamente.");

    if (window.location.hostname === 'localhost') {
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
