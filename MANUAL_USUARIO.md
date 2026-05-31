# Manual de Usuario - RestoFlow POS

## 1. Ingreso al sistema
1. Abre `index.html` en el navegador (o la URL publicada en GitHub Pages).
2. El sistema carga datos previos desde LocalStorage, si existen.

## 2. Dashboard (visualizacion y gestion de ordenes)
En el Dashboard se observan:
- **Mesas en vista visual** con estado (LIBRE, OCUPADA, DESHABILITADA).
- **Desglose de ordenes** por mesa (items, total y estado).
- **Tabla de meseros** con cantidad de ordenes activas.

### Crear una orden
1. En **Gestion de Ordenes**, elige **Tipo**: `MESA` o `PARA LLEVAR`.
2. Para `MESA`, selecciona mesa y mesero (deben estar habilitados/activos).
3. Para `PARA LLEVAR`, ingresa el nombre del cliente. Se aplica automaticamente el **PACKAGING_FEE**.
4. Presiona **Crear orden**.

### Agregar items a una orden
1. En **Items de Orden**, selecciona una orden abierta.
2. Selecciona un producto disponible y activo.
3. Ingresa cantidad (1 a 99) y presiona **Agregar item**.

### Avanzar estado o cerrar orden
1. En la tabla de ordenes, usa el boton de **Acciones**.
2. El estado avanza secuencialmente: `PENDING` -> `PREPARING` -> `READY` -> `CLOSED`.
3. Al cerrar, la mesa se libera automaticamente.

## 3. Gestion de Catalogo
1. Ve a la pestaña **Catalogo**.
2. Registra productos con ID, nombre, precio, disponibilidad, estado y descripcion.
3. Edita o elimina desde la tabla.
4. Si un producto tiene ordenes historicas, debe inactivarse en lugar de eliminarse.

## 4. Gestion de Mesas
1. Ve a la pestaña **Mesas**.
2. Crea mesas con ID, numero, capacidad y estado.
3. Una mesa OCUPADA no puede recibir otra orden activa.

## 5. Gestion de Meseros
1. Ve a la pestaña **Meseros**.
2. Registra meseros con ID, nombre, DNI, telefono y estado.
3. Un mesero inactivo no puede asignarse a nuevas ordenes.

## 6. Reglas clave del sistema
- **Para llevar**: suma automaticamente `PACKAGING_FEE`.
- **FSM de ordenes**: no se permiten saltos de estado.
- **Validaciones**: IDs alfanumericos, cantidades 1..99, precio 0.01..9999.99.
- **Atomicidad**: al cerrar una orden de mesa, la mesa se libera en la misma operacion.

## 7. Limpieza de datos
Cada gestion tiene un boton **Limpiar datos** que elimina registros del modulo.

## 8. Persistencia (LocalStorage)
Los datos se guardan en el navegador. Para reiniciar por completo:
- Usa los botones de limpieza, o
- Borra el almacenamiento del sitio en el navegador.
