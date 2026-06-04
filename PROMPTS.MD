# Nro. 1 hoy 30/05
Comencemos con la interfaz de CRUD MESEROS Y MESAS. Back y front CRUD de los mismos, estos se encontraran en la organizacion del sistema (separado)
Todos los requerimientos se encuentran en el README del proyecto. 

Al terminar dame una guía para poder runnear el código y probar que funcione correctamente o aplicar diferencias en el código. 

Incluye las validaciones posibles que evitan errores, por ejemplo:
- Que solo se permita aceptar si no hay excepción.
- Las validaciones que se encuentran en el README y que suponen los datos en los que se debe tener cuidado para un sistema sin fallos.

Tecnología: HTML y JavaScript con LocalStorage.


# Nro 2
Integre un cambio el ID es de identificacion unica y automatico para todo, esta identificacion es interna
Hice algunas modificaciones en mis requerimientos sobre el ultimo cambio integralo y comenzamos con el siguiente
Lista de estados en gestion de mesas: LIBRE, OCUPADA, DESHABILITADA.  
Añadir atributo oculto habilitada/deshabilitada que se maneja en la creacion automatica pero no aparece en el front.  

Ahora comienza con la parte del CRUD de Gestion de Catalogo visto en el README, requerimiento funcional RF-01 CRUD.  
El CRUD de Catalogo debe mostrarse en otra pestaña llamada Catalogo de Productos.  

# Nro 3
Ahora vamos con el requerimiento de gestion de ordenes, estos requerimientos estan en el README.md del proyecto son del RF-07 al RF-11 aplica validaciones posibles para evitar errores no permitir ingreso-envio de datos que no vayan con las reglas del sistema en el formato correcto, igual en js manejarlo con excepciones correctas no caida del sistema, revisa que las implementaciones anteriores igual cumplan este RQNF atomicidad, recuerda las reglas del negocio en donde figura la suma automatica de PACKAGING_FEE cuando es para llevar, igualmente los escenarios planteados en donde se ven posibles casos que no deben contiuar, reglas llevadas a escenarios fijos y ordenes restrictivas validaciones tanto en js como html 

Tecnología: HTML y JavaScript con LocalStorage. 

# Nro 4 (STITCH)
Adjunto de README.MD
Requiero que de acuerdo a la requerimientos (no realizando mas de lo debido, solo lo requerido) que abarque todas las funcionalidades y te limites a solo los mockups te doy unos detalles extras que ayuden:
- que tenga una visualizacion unica del dashboard al inicio del programa en donde figure las mesas figurado como un rectangulo gris bajo y dentro el mesero asocidado, el numero, lista de la orden y la posbilidad de poder editarla modifciando y agregando. Respecto a las mesas que estas se peudan desplazar el orden para una mejor comodidad luego en una pequeña lista de orgnizacion el egstionar mesas y meseros y una parte atractiva en donde se ponga el crear una orden (lo que mas se utiliza) siempre en pequeño a costado derecho el catalogo de producto filtrado por categorias para que siemrpe este a visualizacion la carta

# Nro 5
Comienza realizando por ultimo los ultimos requerimientos sobre visualizacion de datos RF - 12 esto es en el dashboard, ahi mismo se podra realizar tambien la gestion de ordenes, en cuando al diseño del front se encuentra en las carpetas en @MOCKUPS las diferentes vistas en codigo html para todo el sistema, adecua este html en el codigo, en cada carpeta se encuentra el diseño para cada gestion y en @paleta.md la colorimetria y fonts del diseño
Con esto se daria concluido el proyecto ademas de generar un MARKDOWN de manual de usuario en donde se ve el flujo como funciona el sistema como tal y en el READ.ME incluir la forma de despliegue del sistema

# Nro 6
Tu único objetivo es diseñar y generar el contenido completo para un nuevo archivo de documentación técnica que se llamará exactamente `casos_de_prueba.md`. 

Este archivo debe contener una Tabla de Casos de Prueba exhaustiva, rigurosa y detallada que cubra todos los módulos, formularios y flujos de negocio del sistema (Mesas, Meseros, Catálogo/Carta, Órdenes Activas, Modales Dinámicos, Cobro en Efectivo e Historial de Ventas).

La tabla debe seguir de forma estricta la siguiente estructura de columnas y formato requerido por el docente:
- Columnas: | Módulo / Rol | ID Caso | Rango / Clase / Descripción | Límite (Frontera) | Valor de Entrada (Datos) | Tipo de Técnica | Resultado Esperado |

Asegúrate de aplicar minuciosamente las técnicas de:
1. Partición de Equivalencia (Clases Válidas e Inválidas).
2. Análisis de Valores Límite (Frontera Exacta, Frontera - 1, Frontera + 1).

# Nro 7 :
Analiza mi casos_de_prueba.md, mi app.js y mi package.json. Quiero implementar formalmente el framework Jest para automatizar todos los casos de prueba de la matriz (desde TC-ME-01 hasta TC-CO-05) utilizando la arquitectura que pide el profesor (Partición de Equivalencia y Análisis de Valores Límite).

Por favor, realiza las siguientes acciones en mi espacio de trabajo:

1. CONFIGURACIÓN DEL ENTORNO:
   - Modifica o crea el archivo @package.json para asegurarte de que incluya la dependencia de Jest en 'devDependencies' y configure el script de prueba obligatorio:
     "scripts": { "test": "jest" }
   - Si es necesario para entornos de navegador (ESM/CommonJS), configura los archivos de soporte requeridos (como babel.config.js o configuraciones de módulos en package.json).

2. CREACIÓN DEL ARCHIVO DE PRUEBAS (app.test.js):
   - Crea un archivo llamado 'app.test.js' en la raíz o en una carpeta '__tests__'.
   - Agrupa los test usando 'describe()' por cada módulo del sistema (Mesas, Meseros, Catálogo, Órdenes, Modal Items, Cobro).
   - Escribe un bloque 'test()' o 'it()' individual para cada ID de caso de tu matriz, usando funciones de aserción de Jest ('expect()'). Por ejemplo:
     * Para AVL: 'expect(validarCapacidad(0)).toBe(false)' o 'expect(validarCapacidad(1)).toBe(true)'.
     * Para PE de Cruce de Tipos: 'expect(validarNombre("Juan123")).toBe(false)'.
     * Para el Borrado Lógico: 'expect(eliminarMesa(id)).toHaveProperty("activo", false)'.
