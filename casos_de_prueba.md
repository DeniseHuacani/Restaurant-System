# Documentación Técnica: Matriz de Casos de Prueba (Caja Negra) - RestSystem MVP

| Módulo / Rol | ID Caso | Rango / Clase / Descripción | Límite (Frontera) | Valor de Entrada (Datos) | Tipo de Técnica | Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Mesas** | TC-ME-01 | Autocalcular ID y Número de Mesa al crear nueva mesa. | Correlativo + 1 | Clic en "Mesas" (Reset) | Análisis Valores Límite | El campo ID muestra "M05" y Numero "5" (si hay 4 previas) como `readonly`. |
| **Mesas** | TC-ME-02 | Capacidad de mesa: Valor mínimo permitido. | Límite Inferior (1) | Capacidad = 1 | Análisis Valores Límite | Registro exitoso de la mesa con capacidad mínima. |
| **Mesas** | TC-ME-03 | Capacidad de mesa: Valor máximo permitido. | Límite Superior (99) | Capacidad = 99 | Análisis Valores Límite | Registro exitoso de la mesa con capacidad máxima. |
| **Mesas** | TC-ME-04 | Capacidad de mesa: Valor inválido (cero). | Frontera Inferior - 1 | Capacidad = 0 | Análisis Valores Límite | El sistema bloquea el registro y muestra error: "La capacidad debe estar entre 1 y 99." |
| **Mesas** | TC-ME-05 | Capacidad de mesa: Valor inválido (exceso). | Frontera Superior + 1 | Capacidad = 100 | Análisis Valores Límite | El sistema bloquea el registro y muestra error: "La capacidad debe estar entre 1 y 99." |
| **Meseros** | TC-MS-01 | Validación de DNI: Longitud exacta requerida. | Límite Exacto (8) | DNI = "12345678" | Análisis Valores Límite | Registro exitoso del mesero. |
| **Meseros** | TC-MS-02 | Validación de DNI: Longitud insuficiente. | Frontera - 1 | DNI = "1234567" | Análisis Valores Límite | Error: "El DNI debe tener 8 digitos numericos." |
| **Meseros** | TC-MS-03 | Teléfono: Longitud mínima permitida. | Límite Inferior (6) | Teléfono = "123456" | Análisis Valores Límite | Registro exitoso del mesero. |
| **Meseros** | TC-MS-04 | Teléfono: Longitud máxima permitida. | Límite Superior (15) | Teléfono = "123456789012345" | Análisis Valores Límite | Registro exitoso del mesero. |
| **Catálogo** | TC-CA-01 | Precio de producto: Valor mínimo válido. | Límite Inferior (0.01) | Precio = 0.01 | Análisis Valores Límite | Registro exitoso con precio mínimo permitido. |
| **Catálogo** | TC-CA-02 | Precio de producto: Valor inválido (nulo). | Frontera Inferior - 0.01 | Precio = 0.00 | Análisis Valores Límite | Error: "El precio debe ser mayor a 0." |
| **Órdenes** | TC-OR-01 | Creación de orden "Para Llevar": Cliente obligatorio. | Clase Válida (No vacío) | Cliente = "Juan Perez" | Partición Equivalencia | Orden creada exitosamente; se añade S/ 0.40 de recargo por packaging. |
| **Órdenes** | TC-OR-02 | Creación de orden "Para Llevar": Cliente ausente. | Clase Inválida (Vacío) | Cliente = "" | Partición Equivalencia | Error: "El nombre para llevar es obligatorio." |
| **Órdenes** | TC-OR-03 | Creación de orden "Mesa": Selección de Mesa y Mesero. | Clase Válida | Mesa="M1", Mesero="W1" | Partición Equivalencia | Orden creada; mesa M1 cambia estado a "OCUPADA" visualmente. |
| **Modal Items**| TC-IT-01 | Cantidad de platillos: Mínimo permitido. | Límite Inferior (1) | Cantidad = 1 | Análisis Valores Límite | Ítem añadido a la orden con éxito. |
| **Modal Items**| TC-IT-02 | Cantidad de platillos: Valor inválido. | Frontera Inferior - 1 | Cantidad = 0 | Análisis Valores Límite | Error: "La cantidad debe ser al menos 1." |
| **Modal Items**| TC-IT-03 | Modificación de pedido: Edición de fila existente. | Clase Válida | Cantidad cambia 1 -> 3 | Transición de Estados | El total de la orden se actualiza automáticamente en el modal y dashboard. |
| **Cobro** | TC-CO-01 | Cobro en efectivo: Monto recibido exacto. | Límite Exacto | Total=50, Recibido=50 | Análisis Valores Límite | Vuelto muestra "S/ 0.00". Estado cambia a "PAGADO" y desaparece de Activas. |
| **Cobro** | TC-CO-02 | Cobro en efectivo: Monto recibido con vuelto. | Clase Válida | Total=35, Recibido=50 | Partición Equivalencia | Vuelto autocalculado: "S/ 15.00". Registro en historial exitoso. |
| **Cobro** | TC-CO-03 | Cobro en efectivo: Monto insuficiente. | Frontera - 0.01 | Total=10, Recibido=9.90 | Análisis Valores Límite | Alerta: "⚠️ Dinero insuficiente. El monto recibido debe cubrir el total." |
| **Flujo/Estados**| TC-FL-01 | Ciclo de vida: Transición "Pendiente" a "En Cocina". | Paso Secuencial | Clic en "A Cocina" | Transición de Estados | El estado cambia de "Pendiente" a "En Cocina" en la tabla. |
| **Flujo/Estados**| TC-FL-02 | Ciclo de vida: Transición "Listo" a "Cobrar". | Paso Secuencial | Clic en "💳 Cobrar" | Transición de Estados | Abre el Modal de Cobro y hereda los datos de ítems y total correctamente. |
| **Historial** | TC-HI-01 | Filtrado de vistas: Orden pagada. | Post-condición Pago | Clic en "Confirmar Pago" | Partición Equivalencia | La orden se elimina de "Órdenes Activas" y aparece en "Historial de Ventas". |
| **Historial** | TC-HI-02 | Ver Historial: Integridad de datos del cliente. | Clase Válida | Clic en "Ver Historial" | Partición Equivalencia | Se muestra ID Orden, Nombre/DNI capturado en cobro y el total exacto cobrado. |

### Notas de Implementación QA:
1. **Técnica de Caja Negra:** Se han ignorado los procesos internos de JavaScript (`app.js`) para centrarse exclusivamente en las entradas del usuario y las salidas/errores visibles en la UI (`index.html`).
2. **Automatismo de IDs:** Se validó que los campos ID no permiten el foco de teclado ni la edición manual (`readonly`), cumpliendo con el requerimiento de seguridad de datos.
3. **Mensajería:** Todos los resultados esperados se alinean con los mensajes de error configurados en español en la clase `ValidationError` y las funciones de validación.
4. **Persistencia:** Todos los casos de prueba asumen que tras el "Resultado Esperado", se verifica la persistencia en `LocalStorage` mediante la actualización de las tablas.

---
**Firma del Responsable:**
*Ingeniero de QA Senior - RestSystem MVP Project*