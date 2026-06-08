# Restaurant-System

Arquitectura: separada en dos carpetas principales:

- frontend/: HTML, CSS y JavaScript del cliente (la UI existente fue movida aquí).
- backend/: API REST con Node.js + Express y conexión a PostgreSQL (scaffold incluido).

# Ejecución del Proyecto

El sistema está diseñado como una aplicación Full Stack. El frontend se comunica con una API REST en Node.js que persiste los datos en una base de datos PostgreSQL.

## Pasos para ejecutar el sistema completo

A continuación se listan los pasos y comprobaciones necesarias para poner en marcha tanto el backend (Node.js + Express + PostgreSQL) como el frontend (HTML/CSS/JS). Incluye comandos, verificación y tareas recomendadas.

Prerequisitos
- Node.js (v16+), npm
- PostgreSQL (servidor en ejecución y acceso con un usuario con permisos de creación)
- Opcional: npx serve o http-server para servir la carpeta frontend en desarrollo

1) Backend (API)
- Abrir terminal y ejecutar:
  - cd backend
  - npm install
  - cp .env.example .env   # editar .env y ajustar DATABASE_URL y PORT
- Crear la base de datos (ejemplo):
  - createdb restaurantdb
  - o con psql: psql -U postgres -c "CREATE DATABASE restaurantdb;"
- Inicializar tablas:
  - psql "$DATABASE_URL" -f sql/init.sql
  - o: psql -d restaurantdb -f backend/sql/init.sql
- Poblar con datos iniciales (opcional):
  - psql "$DATABASE_URL" -f sql/seed.sql
  - o: psql -d restaurantdb -f backend/sql/seed.sql
- Iniciar el servidor:
  - npm start
  - (en desarrollo) npm run dev si instalas nodemon
- Verificar Backend:
  - curl http://localhost:3000/  -> debe devolver {"ok":true,...}
  - curl http://localhost:3000/api/productos  -> lista vacía o productos

2) Frontend (cliente)
El frontend es modular y consume la API automáticamente a través de `state.js`. Debido al uso de múltiples scripts y peticiones de red, **debe ser servido mediante un servidor HTTP** (no abrir el archivo .html directamente).

- Servir la carpeta:
  - npx serve frontend -p 8080
  - o npx http-server frontend -p 8080
- Abrir en el navegador: `http://localhost:8080/`

3) Flujo de trabajo en desarrollo
- **Terminal A (Backend):** `cd backend && npm start` (Puerto 3000)
- **Terminal B (Frontend):** `npx serve frontend -p 8080` (Puerto 8080)
- El frontend se conectará automáticamente a `http://localhost:3000/api`.


## GitHub Pages
1. Sube el repositorio a GitHub.
2. Ve a **Settings > Pages**.
3. En **Source**, selecciona **Deploy from branch**.
4. Elige **main** y **/ (root)**, guarda los cambios.
5. Accede a la URL publicada por GitHub Pages.

## Manual de usuario
Consulta `MANUAL_USUARIO.md` para el flujo completo del sistema.

# LocalStorage
Qué es: Es un espacio de almacenamiento en el navegador (del lado del cliente).
Persistencia: Los datos se mantienen incluso después de cerrar la pestaña o reiniciar el navegador.
Cuándo se borra:
Solo si el usuario lo elimina manualmente (desde configuración del navegador).
O si tu código lo borra explícitamente con localStorage.clear() o localStorage.removeItem("clave").

# Diseño del Sistema
## Requerimientos
## REQUERIMIENTOS FUNCIONALES (RF)

### Gestión de Catálogo 
- **RF-01 (CRUD Catálogo):** El sistema permite crear, listar, actualizar(editar) y eliminar productos del catalogo.
    - Cada producto requiere: `ID`, `Nombre`, 'precio'(Decimal), 'disponibilidad' (bool), 'descripcion'(String), 'estado' (bool) TODOS, precio incluye impuestos
    - Un producto no puede ser eliminado si tiene comandas históricas vinculadas, para eso existe estado
    

### Gestión de Mesas 
- **RF-02 (Creacion de Mesas):** Creacion de mesas.
    - Cada mesa requiere: `ID`, `Numero`, 'capacidad'(Int), disponibilidad(bool), estado (Disponibilidad-estado necesario para gestionarla mas no al momento de creacion- automatica disponible), estado (activa deshabilitada - igual desde configuracion de lista, activa por defecto en la creacion)
- **RF-03 (Estado de Mesas):** Gestión de mesas con estados `LIBRE` u `OCUPADA`.
- **RF-04 (Integridad):** Una mesa no puede ser marcada como `OCUPADA` si ya tiene una orden activa.

### Gestión de Meseros 
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

### 1. Escenario: Integridad de Catálogo (Borrado Lógico)
* **Dado que** un producto "Cuy Chactado" tiene órdenes históricas vinculadas.
* **Cuando** el usuario intenta eliminar el producto desde el catálogo.
* **Entonces** el sistema realiza un borrado lógico (activo: false).
* **Y** el producto deja de estar disponible para nuevas órdenes sin romper el historial.

### 2. Escenario: Cálculo de Órdenes "Para Llevar" (Recargo de Empaque)
* **Dado que** se crea una orden de tipo "PARA LLEVAR" con un subtotal de S/ 10.00.
* **Cuando** el sistema procesa la orden.
* **Entonces** se aplica automáticamente el recargo de S/ 0.40 por packaging.
* **Y** el total final es de S/ 10.40 calculados mediante aritmética de céntimos para precisión absoluta.

### 3. Escenario: Transición de Estado Secuencial
* **Dado que** la orden `O-001` se encuentra en estado "PENDIENTE".
* **Cuando** el usuario intenta avanzar el estado.
* **Entonces** el sistema solo permite la transición a "EN COCINA", bloqueando saltos directos a "LISTO" o "PAGADO".

### 4. Escenario: Cobro y Liberación Atómica de Mesa
* **Dado que** la mesa "M01" está "OCUPADA" por la orden "O-001" en estado "LISTO".
* **Cuando** el cajero confirma el pago mediante el Modal de Cobro.
* **Entonces** la orden cambia a "PAGADO", se registra en el historial y la mesa "M01" se libera automáticamente a "LIBRE".

# Validaciones
## 5) Estrategia de validaciones (exhaustiva)
El sistema implementa una **estrategia de blindaje de triple capa** para garantizar la integridad de la operación:

1.  **Capa UI (Prevención Activa):** Deshabilitación física de controles. Los botones de edición/eliminación se bloquean en mesas con órdenes activas ("OCUPADA") y el estado inicial de las órdenes nace bloqueado en "PENDIENTE" para evitar manipulaciones de flujo.
2.  **Capa de Negocio (Inyección de Errores):** Bloqueo de envíos erróneos mediante validación en tiempo real. Los mensajes de error de la matriz de pruebas se inyectan dinámicamente en texto rojo exactamente DEBAJO de cada input afectado, eliminando alertas nativas y asegurando feedback contextual.
3.  **Capa de Calidad (Validación Unitaria):** Cobertura de pruebas automatizadas con **Jest**. Cada regla de validación, límite de frontera (AVL) y partición de equivalencia en `app.js` tiene un espejo exacto en `app.test.js` que valida los mensajes y comportamientos esperados.

**Ejemplos de restricciones clave:**
- `Mesa`: solo puede estar `libre/ocupada`; no se asigna si tiene orden activa.
- `Orden mesa`: requiere mesa asignada; no permite delivery fields.
- `Orden delivery`: requiere `cliente`, `dirección`, `teléfono`.
- `Orden llevar`: no mesa, no delivery.
- `Item`: cantidad 1..99, precio 0.01..9999.99, nombre 1..60 chars, descripción 2..500 chars.
- `Textos`: nombres y descripciones breves (2 a 50 caracteres).