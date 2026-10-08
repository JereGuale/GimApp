const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, convertInchesToTwip, ExternalHyperlink, UnderlineType, BorderStyle
} = require("docx");
const fs = require("fs");
const path = require("path");

const FONT = "Times New Roman";
const SZ = 24; // 12pt
const SZ_T = 28; // 14pt

const COLOR_H = "1E3A8A";

const t = (text, opts = {}) => new TextRun({ text, font: FONT, size: SZ, ...opts });
const tb = (text, opts = {}) => new TextRun({ text, font: FONT, size: SZ, bold: true, ...opts });
const ti = (text, opts = {}) => new TextRun({ text, font: FONT, size: SZ, italics: true, ...opts });

function link(label, url) {
  return new ExternalHyperlink({
    link: url,
    children: [new TextRun({
      text: label, font: FONT, size: SZ,
      style: "Hyperlink",
      underline: { type: UnderlineType.SINGLE },
      color: "1155CC"
    })]
  });
}

function p(runs, opts = {}) {
  const arr = Array.isArray(runs) ? runs : [runs];
  return new Paragraph({
    children: arr,
    spacing: { after: 200, line: 360 }, // 1.5 spacing
    alignment: AlignmentType.JUSTIFIED,
    ...opts
  });
}

function h1(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: SZ_T, bold: true, color: COLOR_H })],
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    alignment: AlignmentType.LEFT
  });
}

function h2(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: SZ, bold: true, color: COLOR_H })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 160 },
    alignment: AlignmentType.LEFT
  });
}

function h3(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: SZ, bold: true, underline: { type: UnderlineType.SINGLE } })],
    spacing: { before: 240, after: 120 },
    alignment: AlignmentType.LEFT
  });
}

function bullet(runs) {
  const arr = Array.isArray(runs) ? runs : [t(runs)];
  return new Paragraph({
    children: arr,
    bullet: { level: 0 },
    spacing: { after: 140, line: 360 },
    alignment: AlignmentType.JUSTIFIED
  });
}

function ref(autor, titulo, url, urlLabel) {
  const children = [
    tb(autor + " "),
    ti(titulo + " "),
  ];
  if (url) {
    children.push(t("Recuperado de "));
    children.push(link(urlLabel || url, url));
  }
  return new Paragraph({
    children,
    spacing: { after: 160, line: 360 },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.5) }
  });
}

const doc = new Document({
  creator: "GimApp Tesis",
  title: "Definiciones Conceptuales - Capítulo II",
  styles: {
    default: { document: { run: { font: FONT, size: SZ } } }
  },
  sections: [{
    properties: {
      page: {
        margin: {
          top: convertInchesToTwip(1),
          bottom: convertInchesToTwip(1),
          left: convertInchesToTwip(1.5),
          right: convertInchesToTwip(1)
        }
      }
    },
    children: [
      new Paragraph({
        children: [new TextRun({ text: "2.2 Definiciones conceptuales (contexto teórico)", font: FONT, size: 36, bold: true, color: COLOR_H })],
        alignment: AlignmentType.CENTER, spacing: { before: 600, after: 300 }
      }),
      p([t("El presente apartado desarrolla en profundidad los fundamentos teóricos y conceptuales que dan soporte a las tecnologías, arquitecturas y metodologías implementadas en el desarrollo del sistema GimApp. El objetivo principal es proporcionar un marco referencial robusto y validado académicamente que justifique cada decisión técnica y estratégica tomada durante el diseño y programación del software para el gimnasio Gigafit. Para lograr un desarrollo de software de alta calidad, es imprescindible comprender las bases que rigen el comportamiento de las aplicaciones móviles contemporáneas, los principios de la arquitectura cliente-servidor, y las normativas internacionales de usabilidad (Vilela-Celorio & Sánchez-Pico, 2023).")]),

      h1("2.2.1 Paradigmas de Desarrollo de Aplicaciones Móviles"),
      p([t("Una aplicación móvil es un programa informático diseñado específicamente para ser ejecutado en dispositivos móviles, tales como teléfonos inteligentes y tabletas. A diferencia del software de escritorio tradicional, las aplicaciones móviles operan en entornos con restricciones significativas de batería, memoria y capacidad de procesamiento, pero con la ventaja de poseer acceso a hardware especializado como GPS, cámaras y acelerómetros (Vilela-Celorio & Sánchez-Pico, 2023). La ingeniería de software moderna clasifica el desarrollo móvil en tres grandes paradigmas, cada uno con sus propias ventajas y desventajas tecnológicas y comerciales:")]),
      
      h3("Aplicaciones Nativas"),
      p([t("Las aplicaciones nativas son aquellas desarrolladas utilizando los lenguajes de programación y los Entornos de Desarrollo Integrado (IDE) proporcionados oficialmente por los creadores de los sistemas operativos. Para el ecosistema de Apple (iOS), se utiliza Swift o Objective-C mediante Xcode; mientras que para Android, propiedad de Google, se emplea Kotlin o Java utilizando Android Studio (Meta, 2024a). La principal ventaja de este enfoque es el rendimiento: al estar escritas en el lenguaje nativo del dispositivo, el código es compilado directamente a lenguaje máquina optimizado, lo que permite un acceso irrestricto y de baja latencia a todas las APIs del sistema operativo. Sin embargo, desde una perspectiva empresarial y de costos de desarrollo, las aplicaciones nativas presentan un desafío considerable: requieren la creación y mantenimiento de dos bases de código completamente separadas, lo que duplica el tiempo de desarrollo, las horas de programación y los costos de actualización (Meta, 2024a).")]),

      h3("Aplicaciones Híbridas"),
      p([t("Como respuesta a los altos costos del desarrollo nativo, surgieron las aplicaciones híbridas. Este paradigma consiste fundamentalmente en el desarrollo de una aplicación web tradicional utilizando tecnologías estándar como HTML5, CSS y JavaScript, la cual posteriormente es encapsulada dentro de un contenedor nativo invisible conocido como WebView (Meta, 2024a). Herramientas como Apache Cordova e Ionic popularizaron este modelo. Aunque las aplicaciones híbridas resuelven el problema de la base de código único (permitiendo que el mismo código se ejecute en Android e iOS), frecuentemente sufren de problemas de rendimiento. Dado que la interfaz gráfica no es renderizada por los componentes nativos del teléfono, sino por un navegador web incrustado, las animaciones tienden a ser menos fluidas y el consumo de memoria suele ser más elevado, lo que afecta negativamente la experiencia del usuario (Vilela-Celorio & Sánchez-Pico, 2023).")]),

      h3("Aplicaciones Multiplataforma (Cross-Platform)"),
      p([t("El enfoque multiplataforma representa el estado del arte actual para el equilibrio entre rendimiento y eficiencia de desarrollo. A diferencia de las híbridas, herramientas como React Native no utilizan un WebView para renderizar la interfaz de usuario. En su lugar, permiten al desarrollador escribir lógica en JavaScript o TypeScript, y el framework se encarga de traducir ese código y comunicarse con los componentes de interfaz gráfica verdaderamente nativos del sistema operativo en tiempo de ejecución (Meta, 2024a). Esto significa que un botón programado en React Native se renderizará como un UIButton en iOS y como un android.widget.Button en Android. Este enfoque es el elegido para GimApp, ya que garantiza una experiencia de usuario de alta calidad con un tiempo de desarrollo sustancialmente menor.")]),

      h1("2.2.2 Tecnologías de Frontend e Interfaz de Usuario"),
      
      h2("React Native"),
      p([t("React Native es un framework de código abierto mantenido por Meta (anteriormente Facebook) que permite crear aplicaciones verdaderamente nativas para Android e iOS utilizando React y las capacidades de JavaScript (Meta, 2024a). Su arquitectura interna se basa en el uso de un elemento conocido como el 'Bridge' (Puente), el cual actúa como un canal de comunicación asíncrono entre el hilo de JavaScript (donde reside la lógica de la aplicación) y el hilo principal nativo (encargado de renderizar la interfaz gráfica). Esta separación de hilos permite que la interfaz permanezca fluida y responda a las interacciones del usuario a 60 cuadros por segundo, incluso cuando la aplicación está procesando lógica compleja en segundo plano. La adopción de React Native en sistemas de gestión permite ciclos de iteración rápidos gracias a la funcionalidad de recarga en vivo (Fast Refresh), que inyecta código nuevo directamente en la aplicación en ejecución (Meta, 2024a).")]),

      h2("Expo"),
      p([t("El desarrollo puro en React Native puede presentar complejidades operativas significativas relacionadas con la configuración de entornos nativos y la compilación de binarios. Expo es una plataforma y un conjunto de herramientas de código abierto construidas alrededor de React Native que simplifican estas operaciones (Expo, 2024). Al utilizar Expo Go y el flujo de trabajo administrado (Managed Workflow), los desarrolladores pueden escribir código y probarlo inmediatamente en dispositivos físicos sin necesidad de compilar la aplicación a través de Xcode o Android Studio. Además, Expo proporciona un conjunto estandarizado de APIs para interactuar con funciones del dispositivo (cámara, notificaciones push, almacenamiento local, sensores biométricos) que ya han sido probadas y optimizadas, mitigando el riesgo de errores de configuración nativa. Otra ventaja fundamental para GimApp es la capacidad de realizar actualizaciones Over-The-Air (OTA), lo que permite enviar parches de software a los dispositivos de los usuarios sin obligarlos a descargar una nueva versión desde las tiendas de aplicaciones (Expo, 2024).")]),

      h2("React JS y su arquitectura basada en componentes"),
      p([t("React es una biblioteca de JavaScript de código abierto, también desarrollada por Meta, enfocada exclusivamente en la construcción de interfaces de usuario (Meta, 2024b). El principio fundamental de React es la programación declarativa y el uso de un DOM Virtual (Virtual Document Object Model). En lugar de manipular el DOM del navegador directamente —una operación computacionalmente costosa—, React mantiene una copia virtual en memoria. Cuando el estado de la aplicación cambia, React calcula eficientemente las diferencias (proceso de reconciliación) y aplica solo los cambios estrictamente necesarios al DOM real. Esta arquitectura, basada en componentes reutilizables y encapsulados que manejan su propio estado interno, es ideal para la creación del panel de administración web de GimApp, donde se requiere la actualización en tiempo real de grandes tablas de datos (usuarios, membresías, productos) sin recargar la página (Meta, 2024b).")]),

      h2("Vite: Herramienta de Construcción Frontend"),
      p([t("El panel web de la aplicación necesita ser compilado, minimizado y optimizado para su despliegue en producción. Tradicionalmente, herramientas como Webpack realizaban esta labor; sin embargo, Vite ha emergido como el estándar moderno para proyectos basados en React. Creado por Evan You, Vite es una herramienta de construcción frontend de nueva generación que resuelve el problema de los tiempos de arranque lentos en el servidor de desarrollo (Vite, 2024). Vite aprovecha los módulos ECMAScript nativos (ESM) implementados en los navegadores modernos para servir el código fuente bajo demanda, logrando reemplazos de módulos en caliente (HMR) casi instantáneos, independientemente del tamaño de la aplicación. Para la compilación de producción, utiliza Rollup para generar código estático altamente optimizado y dividido en fragmentos (code splitting), asegurando que el panel administrativo cargue rápidamente incluso en conexiones a internet deficientes (Vite, 2024).")]),

      h1("2.2.3 Tecnologías Backend y Lógica de Servidor"),
      
      h2("Arquitectura Cliente-Servidor y Modelo API RESTful"),
      p([t("El ecosistema de GimApp está diseñado bajo una arquitectura Cliente-Servidor distribuida. En este modelo, el 'Servidor' (Backend) centraliza el procesamiento de datos, las reglas de negocio y el acceso a la base de datos, mientras que los 'Clientes' (la aplicación móvil y el panel web) se limitan a solicitar datos y presentarlos al usuario. La comunicación entre estas capas se realiza a través de una API RESTful.")]),
      p([t("REST (Representational State Transfer) es un estilo de arquitectura de software para sistemas hipermedia distribuidos, formalizado académicamente por Roy Fielding en su disertación doctoral (Fielding, 2000). Una API RESTful debe adherirse a principios estrictos, como la ausencia de estado (stateless) —lo que significa que cada solicitud del cliente debe contener toda la información necesaria para que el servidor la entienda, sin depender de sesiones almacenadas en el servidor— y el uso uniforme de métodos HTTP estándar (GET para recuperar información, POST para crear nuevos registros, PUT/PATCH para actualizar, y DELETE para eliminar). Esta separación de preocupaciones permite que el backend de GimApp sea agnóstico respecto al cliente; es decir, el mismo código que valida un pago desde la aplicación de Android es el que responde a las peticiones del panel web (Fielding, 2000).")]),

      h2("PHP 8 y su relevancia en el desarrollo moderno"),
      p([t("PHP (Hypertext Preprocessor) es un lenguaje de programación de scripting de propósito general, diseñado originalmente para el desarrollo web. A pesar de los años que lleva en la industria, las versiones modernas de PHP (especialmente a partir de PHP 8.x) han transformado profundamente el lenguaje, introduciendo características vitales para sistemas empresariales como la compilación en tiempo de ejecución (JIT - Just In Time), tipado fuerte y estricto, atributos (anotaciones) y una programación orientada a objetos sumamente robusta (Laravel, 2024). PHP sigue siendo el pilar de un enorme porcentaje de la web debido a su inigualable estabilidad, madurez de ecosistema y capacidad para procesar solicitudes concurrentes de forma eficiente cuando se configura con servidores modernos como Nginx y PHP-FPM.")]),

      h2("Laravel 12 y el Patrón MVC"),
      p([t("Laravel es, en la actualidad, el framework PHP más popular y avanzado para el desarrollo de aplicaciones web complejas y APIs (Laravel, 2024). Se caracteriza por proporcionar una sintaxis expresiva y elegante, liberando al desarrollador de tareas repetitivas mediante la inclusión de módulos preconfigurados para enrutamiento seguro, gestión de sesiones, almacenamiento en caché y autenticación de usuarios.")]),
      p([t("El corazón de Laravel es su implementación del patrón arquitectónico Modelo-Vista-Controlador (MVC). Este patrón separa el software en tres áreas lógicas: el Modelo, que representa la estructura de los datos y las reglas del negocio (gestionado en Laravel a través del ORM Eloquent, que permite mapear tablas de bases de datos a objetos PHP); la Vista, responsable de presentar la interfaz (que en el caso de la API de GimApp, es reemplazada por respuestas serializadas en formato JSON); y el Controlador, que actúa como director, interceptando las peticiones HTTP, validando los permisos del usuario, consultando al Modelo y retornando la respuesta correspondiente (Laravel, 2024). La estructuración estricta que impone Laravel previene el 'código espagueti', garantizando que el sistema sea escalable, mantenible y seguro contra vulnerabilidades críticas como inyecciones SQL y ataques de falsificación de peticiones en sitios cruzados (CSRF).")]),

      h1("2.2.4 Almacenamiento Estructurado e Integridad de Datos"),
      
      h2("Sistemas RDBMS y MySQL"),
      p([t("La gestión de la información en GimApp requiere de un Sistema de Gestión de Bases de Datos Relacionales (RDBMS). MySQL es el motor de base de datos de código abierto más utilizado en el mundo en entornos web, mantenido por Oracle Corporation (MySQL, 2024). A diferencia de las bases de datos NoSQL, MySQL estructura los datos en tablas bidimensionales compuestas por filas y columnas, permitiendo establecer relaciones referenciales estrictas a través de claves primarias (identificadores únicos) y claves foráneas. Este nivel de estructuración asegura que, por ejemplo, un pago registrado siempre pertenezca a un usuario existente y esté asociado a un producto o membresía específica en el catálogo, impidiendo la existencia de registros huérfanos.")]),

      h2("Propiedades ACID y el Motor InnoDB"),
      p([t("Para un sistema que procesa transacciones financieras (como la aprobación de pagos y renovaciones de membresías), la integridad de la base de datos es el requisito más crítico. MySQL garantiza esta integridad mediante el uso de su motor de almacenamiento transaccional InnoDB, el cual cumple estrictamente con el modelo ACID (MySQL, 2024):")]),
      bullet([tb("Atomicidad (Atomicity): "), t("Asegura que un conjunto de operaciones vinculadas se ejecute como una única unidad indivisible. Si durante la inscripción de un usuario ocurre un error al generar su membresía, el registro del usuario también se revierte (rollback), evitando estados parciales en el sistema.")]),
      bullet([tb("Consistencia (Consistency): "), t("Garantiza que cualquier transacción lleve a la base de datos de un estado válido a otro, comprobando siempre que no se violen las reglas y restricciones (como tipos de datos, longitudes máximas y valores únicos).")]),
      bullet([tb("Aislamiento (Isolation): "), t("Permite la concurrencia segura. Si dos administradores intentan actualizar el inventario de un producto al mismo tiempo, el nivel de aislamiento de InnoDB asegura que las lecturas y escrituras no colisionen generando datos corruptos.")]),
      bullet([tb("Durabilidad (Durability): "), t("Garantiza que, una vez que una transacción ha sido confirmada (commit), sus efectos son permanentes y sobrevivirán a fallas catastróficas, como un corte de energía en el servidor (MySQL, 2024).")]),

      h2("Normalización de Datos"),
      p([t("La normalización es un proceso formal de diseño de bases de datos que busca reducir la redundancia y evitar anomalías de actualización, inserción o eliminación. Consiste en la aplicación iterativa de formas normales. Para GimApp, el esquema relacional se diseña cumpliendo la Tercera Forma Normal (3NF), lo que implica que cada campo de una tabla depende única y exclusivamente de la clave primaria de esa tabla. Esto optimiza el espacio de almacenamiento y acelera las consultas generadas por el ORM Eloquent de Laravel.")]),

      h1("2.2.5 Metodologías de Diseño e Interacción"),
      
      h2("Diseño Centrado en el Usuario (DCU - ISO 9241-210)"),
      p([t("El éxito técnico de una plataforma no garantiza su adopción por parte de los usuarios. Para abordar esto, GimApp fundamenta su proceso de creación de interfaces en la metodología de Diseño Centrado en el Usuario (DCU). Esta metodología ha sido estandarizada a nivel internacional mediante la norma ISO 9241-210:2019, la cual proporciona pautas de ergonomía para la interacción humano-sistema (ISO, 2019).")]),
      p([t("El DCU establece que el diseño de un producto debe estar fundamentado en una comprensión empírica de los usuarios, sus tareas específicas y el entorno físico en el que utilizarán el software. Como postula Donald Norman en su análisis del diseño de interacciones (2013), un sistema bien diseñado es aquel en el que las funciones son evidentes para el usuario sin necesidad de entrenamiento extensivo. Para el gimnasio Gigafit, esto significa que el proceso de subir un comprobante de pago no debe requerir más de tres toques en la pantalla, considerando que el usuario podría estar realizando la operación desde su teléfono móvil inmediatamente después de su entrenamiento. La norma exige que se iteren los diseños y se realicen evaluaciones constantes para alinear el software con los modelos mentales del consumidor (ISO, 2019).")]),

      h2("Usabilidad y Métrica de Interacción (ISO 9241-11)"),
      p([t("Intrínsecamente ligada al DCU se encuentra la medición de la usabilidad. La norma ISO 9241-11:2018 define formalmente la usabilidad como \"la medida en que un producto, sistema o servicio puede ser utilizado por usuarios específicos para lograr objetivos definidos con eficacia, eficiencia y satisfacción en un contexto de uso específico\" (ISO, 2018). El desarrollo de la interfaz de GimApp prioriza estos tres vectores:")]),
      bullet([tb("Eficacia: "), t("Se refiere a la precisión y nivel de completitud con la que los usuarios alcanzan sus objetivos. En la plataforma, un diseño eficaz asegura que ningún comprobante de pago sea enviado con campos obligatorios vacíos.")]),
      bullet([tb("Eficiencia: "), t("Relaciona los recursos invertidos (tiempo, carga cognitiva, cantidad de toques en la pantalla) con los resultados logrados. Se optimiza utilizando botones de gran tamaño accesibles para el pulgar y formularios con autocompletado.")]),
      bullet([tb("Satisfacción: "), t("Evalúa las respuestas emocionales y cognitivas del usuario. Se fomenta mediante el uso de interfaces de alto contraste, retroalimentación visual inmediata (como animaciones de carga al pulsar un botón) y mensajes de error claros y no intimidantes (ISO, 2018; Vilela-Celorio & Sánchez-Pico, 2023).")]),

      h1("2.2.6 Modelos de Negocio en la Industria Fitness"),
      
      h2("Gestión de Membresías y Retención"),
      p([t("En la economía de los servicios deportivos, el modelo predominante es la membresía de pagos recurrentes. Este modelo garantiza un flujo de caja predecible para la empresa. Sin embargo, en el contexto de pequeñas y medianas empresas de América Latina, la falta de digitalización en la administración de estas suscripciones es la principal causa de ineficiencia operativa y pérdida de ingresos (Mercado Fitness, 2023). La administración manual de fechas de corte en hojas de cálculo propicia el acceso de usuarios con planes caducados. La sistematización de las membresías, mediante el cálculo automatizado de días de vigencia y la generación de alertas en la aplicación móvil, resulta fundamental para proteger la rentabilidad del gimnasio y mejorar los índices de retención (Mordor Intelligence, 2024).")]),

      h2("Adopción de Pagos Digitales y Comercio Electrónico"),
      p([t("La infraestructura financiera en la región ha evolucionado aceleradamente hacia los canales digitales. En Ecuador, los informes del Banco Central del Ecuador (BCE, 2023) y de la Asociación de Bancos Privados (Asobanca, 2022) revelan que las transferencias electrónicas a través de aplicaciones bancarias se han convertido en el método de pago cotidiano predominante, impulsado inicialmente por las restricciones de la pandemia y posteriormente por la conveniencia del consumidor (CEPAL, 2021).")]),
      p([t("A pesar de esta adopción masiva por parte de los clientes, muchos negocios como Gigafit continúan procesando estas transferencias de forma analógica, solicitando capturas de pantalla vía WhatsApp, lo cual fractura la experiencia del usuario y complica la conciliación bancaria para el administrador. El módulo de pagos de GimApp actúa como una solución de comercio electrónico cerrado, estandarizando la recepción de comprobantes digitales dentro del mismo ecosistema donde se gestiona el servicio, y dotando a la administración de un panel centralizado para aprobar o rechazar transacciones, modernizando así todo el ciclo de ingresos de la empresa (BID, 2022).")]),
      
      new Paragraph({
        children: [new TextRun({ text: "REFERENCIAS BIBLIOGRÁFICAS", font: FONT, size: 28, bold: true, color: COLOR_H })],
        alignment: AlignmentType.CENTER, spacing: { before: 800, after: 300 }
      }),

      ref(
        "Asobanca [Asociación de Bancos Privados del Ecuador]. (2022).",
        "La era de la banca digital en Ecuador: Adopción y evolución de los canales financieros. Asobanca.",
        "https://www.asobanca.org.ec",
        "asobanca.org.ec"
      ),
      ref(
        "Banco Central del Ecuador [BCE]. (2023).",
        "Evolución y Estadísticas del Sistema de Pagos Interbancarios (SPI) 2022-2023. BCE.",
        "https://www.bce.fin.ec",
        "bce.fin.ec"
      ),
      ref(
        "Banco Interamericano de Desarrollo [BID]. (2022).",
        "The 360° on digital transformation in firms in Latin America and the Caribbean (IDB Monograph 1067).",
        "https://publications.iadb.org/en/360-digital-transformation-firms-latin-america-and-caribbean",
        "publications.iadb.org"
      ),
      ref(
        "Comisión Económica para América Latina y el Caribe [CEPAL]. (2021).",
        "Transformación digital de las mipymes: elementos para el diseño de políticas. Naciones Unidas.",
        "https://repositorio.cepal.org/handle/11362/47309",
        "repositorio.cepal.org"
      ),
      ref(
        "Expo. (2024).",
        "Expo Framework Documentation: The best way to build apps with React Native.",
        "https://docs.expo.dev/",
        "docs.expo.dev"
      ),
      ref(
        "Fielding, R. T. (2000).",
        "Architectural Styles and the Design of Network-based Software Architectures. (Disertación doctoral). University of California, Irvine.",
        "https://www.ics.uci.edu/~fielding/pubs/dissertation/top.htm",
        "ics.uci.edu"
      ),
      ref(
        "International Organization for Standardization [ISO]. (2018).",
        "ISO 9241-11:2018. Ergonomics of human-system interaction — Part 11: Usability: Definitions and concepts.",
        "https://www.iso.org/standard/63500.html",
        "iso.org"
      ),
      ref(
        "International Organization for Standardization [ISO]. (2019).",
        "ISO 9241-210:2019. Ergonomics of human-system interaction — Part 210: Human-centred design for interactive systems.",
        "https://www.iso.org/standard/77520.html",
        "iso.org"
      ),
      ref(
        "Laravel. (2024).",
        "Laravel Documentation: The PHP Framework for Web Artisans.",
        "https://laravel.com/docs",
        "laravel.com"
      ),
      ref(
        "Mercado Fitness. (2023).",
        "El 70% de los gimnasios aún no usa tecnología para gestionar su negocio.",
        "https://www.mercadofitness.com/gestion/",
        "mercadofitness.com"
      ),
      ref(
        "Meta. (2024a).",
        "React Native: Learn once, write anywhere.",
        "https://reactnative.dev/",
        "reactnative.dev"
      ),
      ref(
        "Meta. (2024b).",
        "React: The library for web and native user interfaces.",
        "https://react.dev/",
        "react.dev"
      ),
      ref(
        "Mordor Intelligence. (2024).",
        "South America health and fitness club market — share analysis, industry trends & statistics, growth forecasts 2019–2029.",
        "https://www.mordorintelligence.com/industry-reports/south-america-health-and-fitness-club-market",
        "mordorintelligence.com"
      ),
      ref(
        "MySQL [Oracle]. (2024).",
        "MySQL 8.4 Reference Manual - InnoDB and ACID Model.",
        "https://dev.mysql.com/doc/",
        "dev.mysql.com"
      ),
      ref(
        "Norman, D. A. (2013).",
        "The design of everyday things (Edición revisada y ampliada). Basic Books.",
        "https://www.basicbooks.com/titles/don-norman/the-design-of-everyday-things/9780465050659/",
        "basicbooks.com"
      ),
      ref(
        "Vilela-Celorio, J. D., & Sánchez-Pico, J. L. (2023).",
        "Tecnología educativa y aplicaciones móviles. Revista Científica PROciencias.",
        "https://www.revistaprociencias.com",
        "revistaprociencias.com"
      ),
      ref(
        "Vite. (2024).",
        "Vite: Next Generation Frontend Tooling.",
        "https://vitejs.dev/",
        "vitejs.dev"
      ),
      
    ]
  }]
});

const out = path.join(__dirname, "..", "Capitulo_II_Conceptos_GimApp.docx");
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(out, buf);
  console.log("✅ Word generado exitosamente en:", out);
});
