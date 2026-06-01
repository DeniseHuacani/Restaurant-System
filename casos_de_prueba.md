# Documentación Técnica: Matriz de Casos de Prueba (Caja Negra) - RestSystem MVP

| Módulo / Rol | ID Caso | Rango / Clase / Descripción | Límite (Frontera) | Valor de Entrada (Datos) | Tipo de Técnica | Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Mesas** | TC-ME-01 | Autocalcular ID y Número de Mesa al crear nueva mesa. | Correlativo + 1 | Clic en "Mesas" (Reset) | Análisis Valores Límite | El campo ID muestra "M05" y Numero "5" (si hay 4 previas) como `readonly`. |
| **Mesas** | TC-ME-02 | Capacidad de mesa: Valor mínimo permitido. | Límite Inferior (1) | Capacidad = 1 | Análisis Valores Límite | Registro exitoso de la mesa con capacidad mínima. |
| **Mesas** | TC-ME-03 | Capacidad de mesa: Valor máximo permitido. | Límite Superior (16) | Capacidad = 16 | Análisis Valores Límite | Registro exitoso de la mesa con capacidad máxima. |
| **Mesas** | TC-ME-04 | Capacidad de mesa: Valor inválido (cero). | Frontera Inferior - 1 | Capacidad = 0 | Análisis Valores Límite | El sistema bloquea el registro y muestra error: "La capacidad debe estar entre 1 y 16." |
| **Mesas** | TC-ME-05 | Capacidad de mesa: Valor inválido (exceso). | Frontera Superior + 1 | Capacidad = 17 | Análisis Valores Límite | El sistema bloquea el registro y muestra error: "La capacidad debe estar entre 1 y 16." |
| **Mesas** | TC-ME-06 | Cruce de Tipos: Letras en capacidad. | Clase Inválida | Capacidad = "Diez" | Partición Equivalencia | El HTML bloquea la entrada; JS valida "La capacidad debe ser un numero entero." |
| **Meseros** | TC-MS-01 | Validación de DNI: Longitud exacta válida. | Límite Exacto (8) | DNI = "12345678" | Análisis Valores Límite | Registro exitoso del mesero. |
| **Meseros** | TC-MS-02 | Validación de DNI: Longitud insuficiente. | Frontera - 1 (7) | DNI = "1234567" | Análisis Valores Límite | Error: "El DNI debe tener exactamente 8 dígitos numéricos." |
| **Meseros** | TC-MS-03 | Validación de DNI: Longitud excesiva. | Frontera + 1 (9) | DNI = "123456789" | Análisis Valores Límite | Error: "El DNI debe tener exactamente 8 dígitos numéricos." |
| **Meseros** | TC-MS-04 | Validación de Celular: Longitud exacta válida. | Límite Exacto (9) | Celular = "987654321" | Análisis Valores Límite | Registro exitoso del mesero. |
| **Meseros** | TC-MS-05 | Validación de Celular: Longitud insuficiente. | Frontera - 1 (8) | Celular = "98765432" | Análisis Valores Límite | Error: "El número de celular debe tener exactamente 9 dígitos numéricos." |
| **Meseros** | TC-MS-06 | Validación de Celular: Longitud excesiva. | Frontera + 1 (10) | Celular = "9876543210" | Análisis Valores Límite | Error: "El número de celular debe tener exactamente 9 dígitos numéricos." |
| **Meseros** | TC-MS-07 | Cruce de Tipos: Números en Nombre. | Clase Inválida | Nombre = "Juan 123" | Partición Equivalencia | Error de Seguridad: "El nombre del mesero NO puede contener números ni símbolos." |
| **Meseros** | TC-MS-08 | Cruce de Tipos: Letras en DNI/Celular. | Clase Inválida | DNI = "ABCD5678" | Partición Equivalencia | El sistema deniega el envío indicando que solo se permiten dígitos numéricos. |
| **Catálogo** | TC-CA-01 | Precio de producto: Valor mínimo válido. | Límite Inferior (0.01) | Precio = 0.01 | Análisis Valores Límite | Registro exitoso con precio mínimo permitido. |
| **Catálogo** | TC-CA-02 | Precio de producto: Valor inválido (nulo). | Frontera Inferior - 0.01 | Precio = 0.00 | Análisis Valores Límite | Error: "El precio debe ser mayor a 0 y menor que 999999." |
| **Catálogo** | TC-CA-03 | Precio de producto: Valor máximo válido. | Límite Superior (999999) | Precio = 999999.00 | Análisis Valores Límite | Registro exitoso con precio máximo permitido. |
| **Catálogo** | TC-CA-04 | Precio de producto: Valor inválido (exceso). | Frontera Superior + 0.01 | Precio = 999999.01 | Análisis Valores Límite | Error: "El precio debe ser mayor a 0 y menor que 999999." |
| **Catálogo** | TC-CA-05 | Cruce de Tipos: Símbolos en Descripción. | Clase Inválida | Desc = '<>'Sopa  | Partición Equivalencia | Error de Seguridad: "La descripción NO permite números ni símbolos..." |
| **Textos** | TC-TX-01 | Longitud de nombre: Valor mínimo válido. | Límite Inferior (2) | Nombre = "Ab" | Análisis Valores Límite | Registro exitoso del nombre. |
| **Textos** | TC-TX-02 | Longitud de nombre: Valor insuficiente. | Frontera Inferior - 1 | Nombre = "A" | Análisis Valores Límite | Error: "El campo de texto debe contener entre 2 y 50 caracteres." |
| **Textos** | TC-TX-03 | Longitud de nombre: Valor máximo válido. | Límite Superior (50) | Nombre (50 caracteres) | Análisis Valores Límite | Registro exitoso del nombre. |
| **Textos** | TC-TX-04 | Longitud de nombre: Valor excesivo. | Frontera Superior + 1 | Nombre (51 caracteres) | Análisis Valores Límite | Error: "El campo de texto debe contener entre 2 y 50 caracteres." |
| **Órdenes** | TC-OR-01 | Creación de orden "Para Llevar": Cliente obligatorio. | Clase Válida (No vacío) | Cliente = "Juan Perez" | Partición Equivalencia | Orden creada exitosamente; se añade S/ 0.40 de recargo por packaging. |
| **Órdenes** | TC-OR-02 | Creación de orden "Para Llevar": Cliente ausente. | Clase Inválida (Vacío) | Cliente = "" | Partición Equivalencia | Error: "El nombre para llevar es obligatorio." |
| **Órdenes** | TC-OR-03 | Creación de orden "Mesa": Selección de Mesa y Mesero. | Clase Válida | Mesa="M1", Mesero="W1" | Partición Equivalencia | Orden creada; mesa M1 cambia estado a "OCUPADA" visualmente. |
| **Órdenes** | TC-OR-04 | Cruce de Tipos: Números en Nombre Cliente. | Clase Inválida | Cliente = "Pedro 01" | Partición Equivalencia | Error de Seguridad: "El nombre del cliente NO puede contener números." |
| **Modal Items**| TC-IT-01 | Cantidad de platillos: Mínimo permitido. | Límite Inferior (1) | Cantidad = 1 | Análisis Valores Límite | Ítem añadido a la orden con éxito. |
| **Modal Items**| TC-IT-02 | Cantidad de platillos: Valor inválido. | Frontera Inferior - 1 | Cantidad = 0 | Análisis Valores Límite | Error: "La cantidad debe ser al menos 1." |
| **Modal Items**| TC-IT-03 | Modificación de pedido: Edición de fila existente. | Clase Válida | Cantidad cambia 1 -> 3 | Transición de Estados | El total de la orden se actualiza automáticamente en el modal y dashboard. |
| **Modal Items**| TC-IT-04 | Cruce de Tipos: Letras en Cantidad. | Clase Inválida | Cantidad = "Tres" | Partición Equivalencia | El campo numérico bloquea la entrada de texto; validación lógica rechaza el valor. |
| **Cobro** | TC-CO-01 | Cobro en efectivo: Monto recibido exacto. | Límite Exacto | Total=50, Recibido=50 | Análisis Valores Límite | Vuelto muestra "S/ 0.00". Estado cambia a "PAGADO" y desaparece de Activas. |
| **Cobro** | TC-CO-02 | Cobro en efectivo: Monto recibido con vuelto. | Clase Válida | Total=35, Recibido=50 | Partición Equivalencia | Vuelto autocalculado: "S/ 15.00". Registro en historial exitoso. |
| **Cobro** | TC-CO-03 | Cobro en efectivo: Monto insuficiente. | Frontera - 0.01 | Total=10, Recibido=9.90 | Análisis Valores Límite | Alerta: "Dinero insuficiente. El monto recibido debe cubrir el total." |
| **Cobro** | TC-CO-04 | Cruce de Tipos: Letras en Monto Recibido. | Clase Inválida | Recibido = "Dinero" | Partición Equivalencia | Alerta de validación: El monto debe ser un número decimal válido. |
| **Cobro** | TC-CO-05 | Validación de DNI en cobro: Longitud exacta. | Límite Exacto (8) | DNI = "12345678" | AVL | Pago procesado con éxito. |
| **Cobro** | TC-CO-06 | Cruce de Tipos: Letras en DNI de pago. | Clase Inválida | DNI = "A1234567" | Partición | Alerta: "⚠️ El DNI debe tener exactamente 8 dígitos numéricos." |
| **Cobro** | TC-CO-07 | Validación de Nombre en cobro: Longitud inválida. | Frontera -1 (1) | Nombre = "A" | AVL | Alerta: "El campo de texto debe contener entre 2 y 50 caracteres." |
| **Cobro** | TC-CO-08 | Cruce de Tipos: Números en Nombre de pago. | Clase Inválida | Nombre = "Ana 123" | Partición | Alerta: "⚠️ Bloqueo de Seguridad: El nombre del cliente solo debe contener letras." |
| **Flujo/Estados**| TC-FL-01 | Ciclo de vida: Transición "Pendiente" a "En Cocina". | Paso Secuencial | Clic en "A Cocina" | Transición de Estados | El estado cambia de "Pendiente" a "En Cocina" en la tabla. |
| **Flujo/Estados**| TC-FL-02 | Ciclo de vida: Transición "Listo" a "Cobrar". | Paso Secuencial | Clic en "Cobrar" | Transición de Estados | Abre el Modal de Cobro y hereda los datos de ítems y total correctamente. |
| **Historial** | TC-HI-01 | Filtrado de vistas: Orden pagada. | Post-condición Pago | Clic en "Confirmar Pago" | Partición Equivalencia | La orden se elimina de "Órdenes Activas" y aparece en "Historial de Ventas". |
| **Historial** | TC-HI-02 | Ver Historial: Integridad de datos del cliente. | Clase Válida | Clic en "Ver Historial" | Partición Equivalencia | Se muestra ID Orden, Nombre/DNI capturado en cobro y el total exacto cobrado. |
