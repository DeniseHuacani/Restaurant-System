# Restaurant-System
# Despliegue
Tecnologia DJANGO Y HTML

# Diseño del Sistema
## Requerimientos
## REQUERIMIENTOS FUNCIONALES (RF)

### Gestión de Catálogo
- **RF-01 (CRUD Catálogo):** El sistema permite crear, listar, actualizar(editar) y eliminar productos del catalogo.
    - Cada producto requiere: `ID`, `Nombre`, 'precio'(Decimal), 'disponibilidad' (bool), 'descripcion'(String), 'estado' (bool) TODOS, precio incluye impuestos
    - Un producto no puede ser eliminado si tiene comandas históricas vinculadas, para eso existe estado
    

### Gestión de Mesas
- **RF-02 (Creacion de Mesas):** Creacion de mesas.
    - Cada mesa requiere: `ID`, `Numero`, 'capacidad'(Int), 'estado' (bool)
- **RF-03 (Estado de Mesas):** Gestión de mesas con estados `LIBRE` u `OCUPADA`.
- **RF-04 (Integridad):** Una mesa no puede ser marcada como `OCUPADA` si ya tiene una orden activa.

### Gestión de Meseros
- **RF-05 (Creacion de Meseros):** El sistema permite crear, listar, actualizar(editar), eliminar y desactivar meseros del sistema.
    - Cada mesero requiere: `ID`, `Nombre`, 'DNI'(Int), 'telefono'(Int), 'estado' (bool)
- **RF-07 (Integridad):**Un mesero no puede ser eliminado si tiene comandas históricas vinculadas, para eso existe estado (Activo, Inactivo)

### Gestión de Ordenes
- **RF-05 (Crear Orden):** Permite iniciar una orden seleccionando el tipo:(Mesa, Para Llevar)
    - **Mesa:** Vincula a una mesa física.
    - **Mesero:** Vincula a un mesero a la orden
    - **Para Llevar:** Aplica automáticamente el costo de empaque definido en configuración. (0.40 centimos) sin mesa ni mesero, se tiene que ingresar un nombre para llevar.
- **RF-05 (Gestión de Ítems):** Capacidad de añadir/remover ítems del catálogo a una orden abierta.
- **RF-06 (Cálculo Total):** Ejecuta la sumatoria de ítems + costos adicionales (si aplica). Uso obligatorio de `Decimal`.
- **RF-07 (Control de Estado - FSM):** Las órdenes siguen estrictamente el flujo: `PENDING` -> `PREPARING` -> `READY` -> `CLOSED`.
- **RF-08 (Cierre Administrativo):** Al cerrar, la orden se vuelve inmutable y la mesa asociada se libera automáticamente.

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