# Restaurant-System
# Despliegue
HTML + JavaScript +LocalStorage 
Preparado para subir a github pages 

# LocalStorage
Qué es: Es un espacio de almacenamiento en el navegador (del lado del cliente).
Persistencia: Los datos se mantienen incluso después de cerrar la pestaña o reiniciar el navegador.
Cuándo se borra:
Solo si el usuario lo elimina manualmente (desde configuración del navegador).
O si tu código lo borra explícitamente con localStorage.clear() o localStorage.removeItem("clave").

# Diseño del Sistema
## Requerimientos
## REQUERIMIENTOS FUNCIONALES (RF)

### Gestión de Catálogo hecho
- **RF-01 (CRUD Catálogo):** El sistema permite crear, listar, actualizar(editar) y eliminar productos del catalogo.
    - Cada producto requiere: `ID`, `Nombre`, 'precio'(Decimal), 'disponibilidad' (bool), 'descripcion'(String), 'estado' (bool) TODOS, precio incluye impuestos
    - Un producto no puede ser eliminado si tiene comandas históricas vinculadas, para eso existe estado
    

### Gestión de Mesas hecho
- **RF-02 (Creacion de Mesas):** Creacion de mesas.
    - Cada mesa requiere: `ID`, `Numero`, 'capacidad'(Int), disponibilidad(bool), estado (Disponibilidad-estado necesario para gestionarla mas no al momento de creacion- automatica disponible), estado (activa deshabilitada - igual desde configuracion de lista, activa por defecto en la creacion)
- **RF-03 (Estado de Mesas):** Gestión de mesas con estados `LIBRE` u `OCUPADA`.
- **RF-04 (Integridad):** Una mesa no puede ser marcada como `OCUPADA` si ya tiene una orden activa.

### Gestión de Meseros hecho
- **RF-05 (Creacion de Meseros):** El sistema permite crear, listar, actualizar(editar), eliminar y desactivar meseros del sistema.
    - Cada mesero requiere: `ID`, `Nombre`, 'DNI'(Int), 'telefono'(Int), 'estado' (bool)
- **RF-06 (Integridad):**Un mesero no puede ser eliminado si tiene comandas históricas vinculadas, para eso existe estado (Activo, Inactivo)

### Gestión de Ordenes
- **RF-07 (Crear Orden):** Permite iniciar una orden seleccionando el tipo:(Mesa, Para Llevar)
    - **Mesa:** Vincula a una mesa física.
    - **Mesero:** Vincula a un mesero a la orden
    - **Para Llevar:** Aplica automáticamente el costo de empaque definido en configuración. (0.40 centimos) sin mesa ni mesero, se tiene que ingresar un nombre para llevar.
- **RF-08 (Gestión de Ítems):** Capacidad de añadir/remover ítems del catálogo a una orden abierta.
- **RF-09 (Cálculo Total):** Ejecuta la sumatoria de ítems + costos adicionales (si aplica). Uso obligatorio de `Decimal`.
- **RF-10 (Control de Estado - FSM):** Las órdenes siguen estrictamente el flujo: `PENDING` -> `PREPARING` -> `READY` -> `CLOSED`.
- **RF-11 (Cierre Administrativo):** Al cerrar, la orden se vuelve inmutable y la mesa asociada se libera automáticamente.

### Visualización de datos
- **RF-12 (Visualización de datos):** El sistema permite visualizar los datos de las mesas visualmente y meseros en tablas, se desgloza la orden y estado 

## 3. REQUERIMIENTOS NO FUNCIONALES (RNF)

- **RNF-01 (Precisión Financiera):** Uso mandatorio de `decimal.Decimal`. Prohibido el uso de `float` para cálculos monetarios.
- **RNF-02 (Configuración Estática/Jenkins):** Las constantes de negocio (tasas de impuestos, costos de empaque) se definen en `src/config/settings.py` para permitir integración continua sin modificar el núcleo.

## 4. FORMULARIOS Y VALIDACIONES (ATOMICIDAD)

| Módulo | Formulario | Reglas de Validación |
| :--- | :--- | :--- |
| **Catálogo** | `ProductoForm` | `Precio > 0`, `Nombre` alfanumérico. |
| **Orden** | `ComandaForm` | `Mesa` debe estar `LIBRE` (si aplica). |
| **Ajustes** | `ConfigForm` | Valores para `PACKAGING_FEE`. |

## 5. REGLAS DE NEGOCIO Y RESTRICCIONES

1.  **Inmutabilidad:** Una vez que el estado sea `CLOSED`, cualquier intento de modificación disparará un `DomainError`.
2.  **Cálculo de "Para Llevar":** El sistema debe sumar `SUM(Items) * (1) + PACKAGING_FEE`.
3.  **Transiciones FSM:** Solo se permiten movimientos secuenciales hacia adelante. Cualquier retroceso o salto (ej: `PENDING` a `CLOSED`) es inválido.
4.  **Aislamiento de Front-end:** La lógica de la CLI es tratada como una "interfaz reemplazable". El núcleo del sistema no debe contener impresiones (`print`) ni lecturas (`input`) directas; debe comunicarse mediante excepciones y objetos de retorno.

## 6. CRITERIOS DE ACEPTACIÓN (QA)

Para considerar el MVP aprobado, se deben cumplir las siguientes pruebas:

1.  **Pruebas de Cálculo:** El total de una orden "Para Llevar" con 3 ítems debe coincidir exactamente con el resultado de `Decimal` (incluyendo cargos extra).
2.  **Validación de FSM:** Intentar saltar el estado `PREPARING` debe lanzar un `StateTransitionError`.
3.  **Integridad de Mesa:** Tras cerrar una orden de mesa, la consulta al `TableService` debe devolver `status=LIBRE` en menos de 10ms.
4.  **Cobertura:** El repositorio `src/` debe alcanzar un mínimo de **90% de cobertura** mediante `pytest`.
5.  **Persistencia:** Los objetos creados deben mantenerse íntegros en memoria durante todo el ciclo de ejecución de la sesión.

## BDD: Escenarios de Validación posibles

### 1. Escenario: Integridad de Catálogo (ProductGate)
* **Given:** Un producto "Hamburguesa" con ID 10 tiene una orden asociada.
* **When:** El usuario intenta ejecutar `deleteProduct(10)`.
* **Then:** El `ProductGate` debe lanzar un `DataIntegrityError`.
* **And:** El producto debe mantenerse en estado `INACTIVO` en lugar de ser eliminado.

### 2. Escenario: Cálculo de Órdenes "Para Llevar" (FinanceGate)
* **Given:** Una orden `TAKEOUT` con subtotal de 10.00.
* **When:** `FinanceGate` calcula el total con `PACKAGING_FEE` (0.40).
* **Then:** El resultado debe ser `10.40` exactos.
* **And:** La validación debe garantizar que no existen residuos de punto flotante.

### 3. Escenario: Transición de Estado (StateGate)
* **Given:** La orden `O-001` está en `PENDING`.
* **When:** Se intenta pasar directamente a `READY`.
* **Then:** El `StateGate` bloquea la transición por violación de secuencia FSM.

### 4. Escenario: Cierre y Liberación (ClosingGate)
* **Given:** La mesa `M-01` está `OCUPADA` por la orden `O-001`.
* **When:** El usuario ejecuta `closeOrder(O-001)`.
* **Then:** `ClosingGate` actualiza la orden a `CLOSED` y cambia `M-01` a `LIBRE` en una sola transacción atómica.

# Validaciones
## 5) Estrategia de validaciones (exhaustiva)
**Tipos de validación:**
- **Estructural:** tipo correcto (int, str), longitud mínima/máxima, formato (teléfono), rangos (cantidad > 0).
- **Referencial:** mesa/mesero/orden existen antes de asignar.
- **Estado:** transiciones válidas según tipo de orden.
- **Restrictiva:** una mesa no tiene más de una orden activa; delivery requiere dirección y teléfono.
- **Negocio:** límites de cantidad, ítems por orden, montos máximos.

**Ejemplos de restricciones clave:**
- `Mesa`: solo puede estar `libre/ocupada`; no se asigna si tiene orden activa.
- `Orden mesa`: requiere mesa asignada; no permite delivery fields.
- `Orden delivery`: requiere `cliente`, `dirección`, `teléfono`.
- `Orden llevar`: no mesa, no delivery.
- `Item`: cantidad 1..99, precio 0.01..9999.99, nombre 1..60 chars.