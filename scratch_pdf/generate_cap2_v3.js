const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, convertInchesToTwip, ExternalHyperlink, UnderlineType, BorderStyle
} = require("docx");
const fs = require("fs");
const path = require("path");

const FONT = "Times New Roman";
const SZ = 24;    // 12pt en half-points
const SZ_H1 = 30; // 15pt
const SZ_H2 = 26; // 13pt
const COLOR_H = "1E3A8A";

const t  = (text, o = {}) => new TextRun({ text, font: FONT, size: SZ, ...o });
const tb = (text, o = {}) => new TextRun({ text, font: FONT, size: SZ, bold: true, ...o });
const ti = (text, o = {}) => new TextRun({ text, font: FONT, size: SZ, italics: true, ...o });

function lnk(label, url) {
  return new ExternalHyperlink({
    link: url,
    children: [new TextRun({ text: label, font: FONT, size: SZ,
      style: "Hyperlink", underline: { type: UnderlineType.SINGLE }, color: "1155CC" })]
  });
}

function p(runs, opts = {}) {
  return new Paragraph({
    children: Array.isArray(runs) ? runs : [runs],
    spacing: { after: 220, line: 360 },
    alignment: AlignmentType.JUSTIFIED,
    ...opts
  });
}

function h1(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: SZ_H1, bold: true, color: COLOR_H })],
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 500, after: 220 },
    alignment: AlignmentType.LEFT
  });
}

function h2(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: SZ_H2, bold: true, color: COLOR_H })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 340, after: 180 },
    alignment: AlignmentType.LEFT
  });
}

function h3(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: SZ, bold: true })],
    spacing: { before: 260, after: 140 },
    alignment: AlignmentType.LEFT
  });
}

function blt(runs) {
  return new Paragraph({
    children: Array.isArray(runs) ? runs : [t(runs)],
    bullet: { level: 0 },
    spacing: { after: 140, line: 360 },
    alignment: AlignmentType.JUSTIFIED
  });
}

function blank() {
  return new Paragraph({ children: [t("")], spacing: { after: 60 } });
}

// APA 7 hanging-indent reference entry
function ref(corpo, titulo, url, urlLabel) {
  const ch = [tb(corpo + " "), ti(titulo + " "), t("Recuperado de "), lnk(urlLabel || url, url)];
  return new Paragraph({
    children: ch,
    spacing: { after: 180, line: 360 },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.5) }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
const doc = new Document({
  creator: "GimApp – Tesis de Grado",
  title: "Capítulo II – 2.2 Definiciones Conceptuales",
  styles: { default: { document: { run: { font: FONT, size: SZ } } } },
  sections: [{
    properties: {
      page: {
        margin: {
          top:    convertInchesToTwip(1),
          bottom: convertInchesToTwip(1),
          left:   convertInchesToTwip(1.5),
          right:  convertInchesToTwip(1)
        }
      }
    },
    children: [

      // ── PORTADA ────────────────────────────────────────────────────────────
      new Paragraph({
        children: [new TextRun({ text: "CAPÍTULO II", font: FONT, size: 36, bold: true, color: COLOR_H })],
        alignment: AlignmentType.CENTER, spacing: { before: 700, after: 200 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "MARCO TEÓRICO DE LA INVESTIGACIÓN", font: FONT, size: 28, bold: true })],
        alignment: AlignmentType.CENTER, spacing: { after: 180 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "2.2 Definiciones Conceptuales (Contexto Teórico)", font: FONT, size: 26, bold: true, color: COLOR_H })],
        alignment: AlignmentType.CENTER, spacing: { after: 180 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "GimApp – Sistema de Gestión para el Gimnasio Gigafit, Manta – Ecuador", font: FONT, size: SZ, italics: true })],
        alignment: AlignmentType.CENTER, spacing: { after: 900 }
      }),

      // ── INTRODUCCIÓN DEL APARTADO ──────────────────────────────────────────
      p([t("El presente apartado desarrolla el contexto teórico que sustenta cada componente tecnológico, metodológico y de negocio del sistema GimApp. La selección de fuentes bibliográficas responde a tres criterios fundamentales: accesibilidad pública, pertinencia temática y vigencia (2018–2024). Para garantizar rigor académico, cada definición o afirmación que no sea de autoría propia se respalda con la cita correspondiente. El conjunto de tecnologías, metodologías y conceptos de negocio descritos en este capítulo refleja el estado del arte en el desarrollo de software móvil aplicado a la gestión de servicios deportivos en América Latina (Álvarez-Rodríguez et al., 2022; CEPAL, 2021).")]),
      blank(),

      // ═══════════════════════════════════════════════════════════════════════
      h1("2.2.1 Aplicación Móvil: Definición, Tipología y Ciclo de Vida"),

      p([t("Desde el ámbito de la ingeniería del software, una "), tb("aplicación móvil"), t(" se define como un programa informático diseñado y optimizado para ejecutarse en dispositivos de computación portátil, principalmente teléfonos inteligentes (smartphones) y tabletas (tablets), que operan bajo sistemas operativos móviles como Android (Google) o iOS (Apple). A diferencia del software de escritorio, las aplicaciones móviles están condicionadas por restricciones de batería, memoria RAM limitada, conectividad intermitente y superficies de interacción táctiles (Vargas et al., 2021). Estas restricciones obligan a los ingenieros a diseñar arquitecturas livianas, eficientes en el consumo de recursos y adaptadas al contexto situacional del usuario.")]),

      p([t("Vargas et al. (2021), en su análisis publicado en la "), ti("Revista Ibérica de Sistemas e Tecnologias de Informação"), t(", clasifican las aplicaciones móviles en tres grandes categorías según su arquitectura técnica:")]),

      h3("a) Aplicaciones Nativas"),
      p([t("Son aquellas desarrolladas específicamente para un solo sistema operativo, utilizando el lenguaje de programación y el conjunto de herramientas (SDK) oficiales de la plataforma objetivo. Para Android se emplean Kotlin o Java mediante Android Studio, mientras que para iOS se usan Swift u Objective-C a través de Xcode. La principal ventaja de este paradigma es el rendimiento óptimo: al compilarse directamente al código máquina de la plataforma, el acceso a recursos nativos como cámara, sensores biométricos, GPS y notificaciones push es directo y sin intermediarios. El mayor inconveniente es el coste de desarrollo y mantenimiento duplicado, dado que se requieren dos bases de código independientes para cubrir ambos ecosistemas (Vargas et al., 2021; Álvarez-Rodríguez et al., 2022).")]),

      h3("b) Aplicaciones Web Progresivas (PWA)"),
      p([t("Las Progressive Web Applications (PWA) son aplicaciones web mejoradas que pueden instalarse en el dispositivo y operar con funcionalidades offline, aprovechando tecnologías del navegador como Service Workers, Web App Manifest y la caché del navegador. Aunque no acceden a todas las APIs nativas del dispositivo, ofrecen una experiencia de usuario cada vez más cercana a las aplicaciones nativas. Son ideales para escenarios con bajo presupuesto o cuando el soporte de funcionalidades nativas avanzadas no es crítico (Cáceres Morejón et al., 2023).")]),

      h3("c) Aplicaciones Multiplataforma (Cross-Platform)"),
      p([t("El paradigma multiplataforma representa el punto de mayor adopción en la industria actual. Herramientas como React Native (Meta) y Flutter (Google) permiten escribir una única base de código en un lenguaje de alto nivel (JavaScript/TypeScript o Dart, respectivamente) que se transpila o interpreta para generar componentes de interfaz de usuario (UI) verdaderamente nativos en cada plataforma. Esto implica que el código no se ejecuta en un WebView —como ocurre en las aplicaciones híbridas— sino que mapea directamente los componentes escritos por el desarrollador a los componentes nativos de la capa de UI de Android e iOS (Álvarez-Rodríguez et al., 2022). Este es el enfoque adoptado en GimApp, garantizando una experiencia de usuario fluida para los socios del gimnasio Gigafit en cualquier dispositivo.")]),

      p([t("El ciclo de vida de una aplicación móvil, según el estándar IEEE 12207 para procesos del ciclo de vida del software (IEEE, 2017), comprende las fases de concepción, análisis de requerimientos, diseño arquitectónico, codificación, pruebas, despliegue y mantenimiento. Para GimApp, este ciclo se ejecuta bajo el marco metodológico de Diseño Centrado en el Usuario (DCU), que se detalla en la sección 2.2.7 del presente documento.")]),
      blank(),

      // ═══════════════════════════════════════════════════════════════════════
      h1("2.2.2 React Native: Arquitectura y Funcionamiento Interno"),

      p([t("React Native es un framework de código abierto creado por Meta Platforms (anteriormente Facebook) en 2015, que desde entonces se ha convertido en uno de los entornos de desarrollo móvil multiplataforma más populares del mundo (Meta, 2024a). Su filosofía principal, resumida en el eslogan "), ti("\"Learn once, write anywhere\""), t(", permite que un desarrollador familiarizado con React —la biblioteca JavaScript para interfaces de usuario— aplique ese conocimiento para construir aplicaciones móviles nativas sin reescribir el código para cada plataforma.")]),

      p([t("La arquitectura interna original de React Native se basa en un mecanismo conocido como "), tb("JavaScript Bridge"), t(" (puente de JavaScript). En este modelo, el hilo de JavaScript —donde reside la lógica de la aplicación— se comunica de forma asíncrona con el hilo nativo —encargado de renderizar la interfaz gráfica— a través de un canal de mensajes serializado en JSON. Si bien este puente fue funcional durante años, sus limitaciones en términos de latencia y sincronización condujeron al equipo de Meta a desarrollar la denominada "), tb("Nueva Arquitectura"), t(" de React Native, compuesta por JSI (JavaScript Interface), Fabric (nuevo renderizador) y TurboModules (módulos nativos perezosos), que elimina la serialización JSON en favor de llamadas síncronas directas entre JavaScript y el código nativo (Meta, 2024a).")]),

      p([t("Para el proyecto GimApp, React Native aporta los siguientes beneficios técnicos directamente relacionados con la problemática de Gigafit (Álvarez-Rodríguez et al., 2022):")]),
      blt([tb("Componentes nativos reales: "), t("Un componente <View> en React Native se renderiza como un android.view.View en Android y como un UIView en iOS, garantizando animaciones y respuesta táctil de nivel nativo.")]),
      blt([tb("Hot Reload y Fast Refresh: "), t("Permiten inyectar cambios de código en la aplicación en ejecución sin reiniciarla, acelerando drásticamente el ciclo de iteración durante el desarrollo.")]),
      blt([tb("Ecosistema npm: "), t("Al estar basado en JavaScript, accede a la totalidad del ecosistema de paquetes de npm, la mayor colección de bibliotecas de software del mundo.")]),
      blt([tb("Código base unificado: "), t("Un único repositorio de código genera las versiones Android e iOS de la aplicación GimApp, reduciendo el tiempo de desarrollo y mantenimiento.")]),
      blank(),

      // ═══════════════════════════════════════════════════════════════════════
      h1("2.2.3 Expo: Plataforma de Desarrollo y Distribución"),

      p([t("Expo es una plataforma de código abierto y un conjunto integrado de herramientas construidas sobre React Native que simplifica todo el ciclo de vida del desarrollo de aplicaciones móviles: desde la configuración inicial del entorno hasta el despliegue en las tiendas de aplicaciones (Expo, 2024). Fue creada por la empresa Expo Go, Inc. y cuenta con una comunidad activa y una documentación extensa disponible públicamente.")]),

      p([t("La principal propuesta de valor de Expo radica en su "), tb("Managed Workflow"), t(" (flujo de trabajo administrado). En el desarrollo tradicional de React Native (\"Bare Workflow\"), el programador debe configurar manualmente entornos de compilación nativos como Xcode (macOS, para iOS) y Android Studio (para Android). Expo abstrae esta complejidad al proporcionar un runtime preconfigurado que contiene el conjunto de APIs nativas más utilizadas, gestionado en la nube mediante su servicio "), tb("EAS Build (Expo Application Services)"), t(". Esto significa que un desarrollador puede compilar una versión distribuible de la aplicación para ambas plataformas sin necesidad de poseer una computadora macOS para la compilación de iOS, lo que resulta en una barrera de entrada tecnológica y económica significativamente reducida (Expo, 2024).")]),

      p([t("Para el proyecto GimApp, Expo ofrece capacidades técnicas críticas:")]),
      blt([tb("Expo Camera y Image Picker: "), t("Módulos para acceder a la cámara del dispositivo y seleccionar imágenes de la galería, necesarios para la funcionalidad de carga de comprobantes de pago en el módulo de membresías.")]),
      blt([tb("Expo Notifications: "), t("API para el envío de notificaciones push a los dispositivos de los socios de Gigafit cuando su plan de membresía está próximo a vencer.")]),
      blt([tb("Over-The-Air (OTA) Updates: "), t("Sistema de actualización inalámbrica de código JavaScript que permite enviar parches y correcciones a los dispositivos de los usuarios sin requerir una nueva descarga desde Google Play o App Store (Expo, 2024).")]),
      blank(),

      // ═══════════════════════════════════════════════════════════════════════
      h1("2.2.4 React JS y Vite: Panel de Administración Web"),

      h2("React JS"),
      p([t("React es una biblioteca de JavaScript de código abierto para la construcción de interfaces de usuario basada en componentes reutilizables, desarrollada y mantenida por Meta (2024b). Fue creada por Jordan Walke y presentada públicamente en la JSConf US en 2013. Su adopción global es masiva: según el informe "), ti("State of JS 2023"), t(", React es la biblioteca de frontend más utilizada a nivel mundial.")]),

      p([t("El concepto central de React es la programación declarativa. En lugar de manipular directamente el DOM del navegador (una operación costosa en términos de rendimiento), React mantiene en memoria una representación virtual ligera del DOM, conocida como el "), tb("Virtual DOM"), t(". Cuando el estado de un componente cambia, React calcula la diferencia (diff) entre el Virtual DOM anterior y el nuevo, y aplica únicamente los cambios mínimos necesarios al DOM real, en un proceso denominado "), tb("reconciliación"), t(" (Meta, 2024b). Este mecanismo es responsable del alto rendimiento de las interfaces React, incluso cuando manejan grandes volúmenes de datos, como las tablas de usuarios y transacciones del panel administrativo de GimApp.")]),

      p([t("En el panel web de GimApp, React se combina con React Router para la navegación entre páginas (sin recarga completa del navegador) y con la biblioteca Axios para las peticiones HTTP a la API de Laravel, creando así una Aplicación de Página Única (SPA - Single Page Application) que ofrece una experiencia rápida y fluida al personal administrativo del gimnasio (Bustamante & Guerrero, 2023).")]),

      h2("Vite"),
      p([t("El panel web de React requiere de un servidor de desarrollo local durante la construcción y de un empaquetador para la fase de producción. Vite es una herramienta de construcción frontend de nueva generación creada por Evan You —también creador del framework Vue.js— que resuelve las limitaciones de herramientas anteriores como Webpack o Create React App (Vite, 2024).")]),

      p([t("La diferencia fundamental de Vite frente a las herramientas convencionales radica en cómo sirve el código durante el desarrollo. Las herramientas tradicionales empaquetan (bundle) toda la aplicación antes de servir el servidor de desarrollo, lo que genera tiempos de arranque lentos a medida que el proyecto crece. Vite, en cambio, aprovecha los "), tb("Módulos ES Nativos (ESM)"), t(" que los navegadores modernos soportan de forma nativa: el código fuente se transforma y sirve bajo demanda por el servidor de desarrollo, logrando tiempos de arranque casi instantáneos independientemente del tamaño de la aplicación. Para la compilación de producción, Vite utiliza Rollup para generar bundles altamente optimizados con soporte para "), tb("Code Splitting"), t(" (división de código en fragmentos) y "), tb("Tree Shaking"), t(" (eliminación de código no utilizado) (Vite, 2024).")]),
      blank(),

      // ═══════════════════════════════════════════════════════════════════════
      h1("2.2.5 PHP y el Framework Laravel 12"),

      h2("El Lenguaje PHP"),
      p([t("PHP (Hypertext Preprocessor) es un lenguaje de programación interpretado de propósito general, especialmente diseñado para el desarrollo web del lado del servidor (Hernández Contla et al., 2021). Creado por Rasmus Lerdorf en 1994, PHP evolucionó de ser un simple conjunto de scripts CGI a convertirse en un lenguaje orientado a objetos completo y ampliamente adoptado. Según el informe "), ti("W3Techs Web Technology Surveys"), t(" de 2024, PHP impulsa aproximadamente el 77% de todos los sitios web del mundo cuyo lenguaje de servidor es conocido, incluyendo plataformas de gran escala como WordPress, Wikipedia y Facebook (en sus etapas iniciales).")]),

      p([t("La versión PHP 8.x, vigente durante el desarrollo de GimApp, introduce mejoras significativas de rendimiento respecto a versiones anteriores, incluyendo la compilación JIT (Just-In-Time), que permite la compilación de código PHP a bytecode nativo en tiempo de ejecución, así como el tipado estricto de atributos de clase, enumeraciones (Enums), fibers para programación asíncrona y patrones de coincidencia (match expressions). Estas características posicionan a PHP 8 como un lenguaje de backend competitivo con Node.js, Python y Ruby en términos de productividad y rendimiento (Hernández Contla et al., 2021).")]),

      h2("Laravel 12 y el Ecosistema de Desarrollo"),
      p([t("Laravel es un framework de aplicaciones web de código abierto construido sobre PHP, creado por Taylor Otwell y publicado en 2011 bajo licencia MIT (Laravel, 2024). En la actualidad, Laravel es consistentemente catalogado como el framework PHP más popular del mundo según métricas de estrellas en GitHub, descargas en Packagist y menciones en publicaciones académicas (Bustamante & Guerrero, 2023). Su versión 12, utilizada en GimApp, consolida funcionalidades avanzadas del ecosistema que se detallan a continuación.")]),

      h3("Patrón Arquitectónico MVC"),
      p([t("Laravel implementa el patrón de diseño "), tb("Modelo-Vista-Controlador (MVC)"), t(", que divide la aplicación en tres capas lógicas separadas. El "), tb("Modelo"), t(" (Model) encapsula la lógica de acceso a datos y las reglas del negocio; en Laravel, los modelos extienden la clase Eloquent, que implementa el patrón Active Record y permite interactuar con las tablas de la base de datos mediante una sintaxis orientada a objetos sin escribir SQL directamente. El "), tb("Controlador"), t(" (Controller) actúa como intermediario, recibiendo peticiones HTTP, solicitando datos al Modelo, aplicando la lógica de negocio y retornando la respuesta apropiada. La "), tb("Vista"), t(" (View), en el contexto de GimApp, es reemplazada por respuestas en formato JSON para construir la API RESTful, dado que las vistas son renderizadas por las aplicaciones de React y React Native en el lado del cliente (Laravel, 2024).")]),

      h3("Eloquent ORM"),
      p([t("Eloquent es el mapeador objeto-relacional (ORM) incluido en Laravel. Permite definir las relaciones entre las tablas de la base de datos (uno a uno, uno a muchos, muchos a muchos, polimórficas) directamente en el código PHP mediante métodos expresivos. Por ejemplo, en GimApp, la relación entre un usuario y sus membresías activas se define como "), ti("$user->membresias()->where('estado', 'activo')->get()"), t(", generando automáticamente la consulta SQL optimizada correspondiente (Laravel, 2024; Hernández Contla et al., 2021).")]),

      h3("Laravel Sanctum"),
      p([t("Para la autenticación de los usuarios de la aplicación móvil, GimApp utiliza "), tb("Laravel Sanctum"), t(", un paquete oficial de Laravel para la gestión de tokens de API de tipo SPA y aplicaciones móviles. Sanctum implementa tokens de acceso personal (Personal Access Tokens) en la base de datos, permitiendo que cada dispositivo del usuario obtenga un token único tras autenticarse con sus credenciales. Este token se envía en el encabezado HTTP "), ti("Authorization: Bearer {token}"), t(" de cada petición posterior, y Laravel lo valida automáticamente antes de ejecutar el controlador correspondiente (Bustamante & Guerrero, 2023).")]),
      blank(),

      // ═══════════════════════════════════════════════════════════════════════
      h1("2.2.6 Arquitectura Cliente-Servidor y API RESTful"),

      p([t("El modelo de "), tb("arquitectura cliente-servidor"), t(" es un paradigma computacional distribuido en el que los procesos se dividen entre proveedores de recursos o servicios (servidores) y los solicitantes de esos servicios (clientes). Surgió como alternativa a la computación centralizada (mainframes) durante la década de 1980 y se convirtió en el estándar de la arquitectura web moderna. En este modelo, el servidor es el elemento que posee los datos, procesa la lógica de negocio y responde a solicitudes; el cliente es quien inicia la comunicación, presenta la información al usuario y no almacena datos de forma persistente (Hernández Contla et al., 2021; Fielding, 2000).")]),

      p([t("La comunicación en este modelo se realiza a través de "), tb("APIs (Application Programming Interfaces)"), t(". Específicamente, GimApp implementa una API de tipo "), tb("REST (Representational State Transfer)"), t(", un estilo arquitectónico para sistemas hipermedia distribuidos formalizado por Roy T. Fielding en su disertación doctoral en la University of California, Irvine (Fielding, 2000). Los seis principios que Fielding establece para una arquitectura verdaderamente RESTful son:")]),
      blt([tb("Cliente-Servidor separados: "), t("La interfaz de usuario (cliente) está completamente desacoplada del almacenamiento de datos (servidor).")]),
      blt([tb("Sin estado (Stateless): "), t("Cada solicitud del cliente al servidor debe contener toda la información necesaria para entenderla y procesarla; el servidor no mantiene ningún contexto de sesión entre solicitudes.")]),
      blt([tb("Caché: "), t("Las respuestas deben indicar si pueden ser almacenadas en caché por el cliente para mejorar el rendimiento.")]),
      blt([tb("Interfaz uniforme: "), t("Uso consistente y estandarizado de los métodos HTTP (GET, POST, PUT, PATCH, DELETE) para operar sobre los recursos.")]),
      blt([tb("Sistema en capas: "), t("El cliente no necesita saber si está comunicándose directamente con el servidor final o con un intermediario.")]),
      blt([tb("Código bajo demanda (opcional): "), t("El servidor puede enviar código ejecutable al cliente (Fielding, 2000).")]),

      p([t("En GimApp, la API RESTful desarrollada en Laravel 12 expone endpoints organizados por recursos. Por ejemplo, el recurso "), ti("/api/membresias"), t(" acepta peticiones GET para listar membresías, POST para crear una nueva, PUT/PATCH para actualizar una existente y DELETE para eliminarla. Esta estructura es consumida tanto por la aplicación móvil en React Native como por el panel web en React, garantizando consistencia de datos en toda la plataforma (Bustamante & Guerrero, 2023).")]),
      blank(),

      // ═══════════════════════════════════════════════════════════════════════
      h1("2.2.7 Bases de Datos Relacionales: MySQL y Propiedades ACID"),

      h2("MySQL como Sistema de Gestión de Bases de Datos"),
      p([t("MySQL es un "), tb("Sistema de Gestión de Bases de Datos Relacionales (RDBMS)"), t(" de código abierto, desarrollado originalmente por MySQL AB en 1995 y actualmente propiedad y mantenido por Oracle Corporation (MySQL, 2024). Un RDBMS organiza los datos en tablas bidimensionales compuestas por filas (registros) y columnas (atributos o campos), permitiendo establecer relaciones lógicas y referenciales entre tablas a través del uso de "), tb("claves primarias"), t(" (identificadores únicos de cada fila) y "), tb("claves foráneas"), t(" (referencias a claves primarias de otras tablas). MySQL implementa el lenguaje estándar "), tb("SQL (Structured Query Language)"), t(" para la definición, manipulación y consulta de datos (Codd, 1970; MySQL, 2024).")]),

      p([t("El modelo relacional fue propuesto formalmente por el matemático y científico de la computación Edgar F. Codd en su artículo seminal "), ti("\"A Relational Model of Data for Large Shared Data Banks\""), t(", publicado en 1970 en la revista "), ti("Communications of the ACM"), t(" (Codd, 1970). Este modelo establece que los datos deben almacenarse en relaciones (tablas), que las operaciones sobre ellos deben realizarse mediante álgebra relacional, y que la integridad de los datos debe garantizarse mediante restricciones definidas en el esquema de la base de datos. MySQL ha sido la implementación de este modelo más exitosa en el entorno de aplicaciones web debido a su rendimiento, confiabilidad y el vasto ecosistema de herramientas y bibliotecas que lo soportan (Hernández Contla et al., 2021).")]),

      h2("Propiedades ACID"),
      p([t("En sistemas de información que gestionan transacciones financieras y administrativas —como los pagos de membresías en GimApp— la integridad de los datos es un requisito crítico. MySQL garantiza esta integridad mediante su motor de almacenamiento transaccional "), tb("InnoDB"), t(", que implementa las propiedades "), tb("ACID"), t(", acrónimo de Atomicidad, Consistencia, Aislamiento y Durabilidad, conceptos formalizados por Jim Gray y Andreas Reuter (1992) en el ámbito de los sistemas de procesamiento de transacciones:")]),
      blt([tb("Atomicidad (Atomicity): "), t("Garantiza que un conjunto de operaciones agrupadas en una transacción se ejecute como una unidad indivisible. En GimApp, si durante el proceso de activación de una membresía ocurre un error en la generación de la notificación al usuario, la operación completa se revierte (ROLLBACK), evitando que el pago quede registrado sin que la membresía se active (MySQL, 2024).")]),
      blt([tb("Consistencia (Consistency): "), t("Asegura que cualquier transacción lleve a la base de datos de un estado válido a otro estado válido, respetando todas las reglas de integridad definidas en el esquema (tipos de datos, restricciones UNIQUE, restricciones NOT NULL, integridad referencial entre claves foráneas).")]),
      blt([tb("Aislamiento (Isolation): "), t("Permite la ejecución concurrente de múltiples transacciones sin que se interfieran entre sí. InnoDB implementa el Control de Concurrencia Multiversión (MVCC) para gestionar lecturas y escrituras simultáneas de forma segura, lo cual es relevante cuando múltiples administradores del gimnasio acceden al panel de gestión al mismo tiempo.")]),
      blt([tb("Durabilidad (Durability): "), t("Garantiza que una vez que una transacción ha sido confirmada (COMMIT), los cambios realizados persisten de forma permanente incluso ante fallos catastróficos como cortes de energía o caídas del servidor (Gray & Reuter, 1992; MySQL, 2024).")]),

      h2("Normalización del Esquema de Datos"),
      p([t("La "), tb("normalización"), t(" es el proceso de diseño de bases de datos relacionales que busca eliminar la redundancia de datos y prevenir anomalías de modificación, inserción y eliminación, garantizando la integridad lógica del esquema (Codd, 1970). El proceso se ejecuta aplicando sucesivamente un conjunto de reglas formales llamadas "), tb("Formas Normales"), t(". Para GimApp, el esquema relacional se diseña alcanzando la "), tb("Tercera Forma Normal (3NF)"), t(", que establece que todos los atributos no-clave de una tabla deben depender únicamente de la clave primaria y no de otros atributos no-clave. Esto evita, por ejemplo, almacenar el nombre del plan de membresía directamente en la tabla de pagos, utilizando en su lugar una clave foránea que referencia la tabla de planes.")]),
      blank(),

      // ═══════════════════════════════════════════════════════════════════════
      h1("2.2.8 Metodología DCU: Diseño Centrado en el Usuario (ISO 9241-210)"),

      p([t("El "), tb("Diseño Centrado en el Usuario (DCU)"), t(" —conocido en inglés como Human-Centred Design (HCD)— es un enfoque filosófico y metodológico en el diseño de sistemas interactivos que coloca a los usuarios reales en el centro del proceso de desarrollo, en lugar de privilegiar la perspectiva del técnico o del cliente (Norman, 2013). El DCU está estandarizado internacionalmente por la norma "), tb("ISO 9241-210:2019"), t(", publicada por la Organización Internacional de Normalización (ISO, 2019), que establece los principios y las actividades del proceso de diseño centrado en el ser humano para sistemas interactivos.")]),

      p([t("La norma ISO 9241-210:2019 define seis principios fundamentales del DCU (ISO, 2019):")]),
      blt([t("El diseño se basa en una comprensión explícita de los usuarios, las tareas y los entornos.")]),
      blt([t("Los usuarios están involucrados en el diseño y el desarrollo durante todo el proceso.")]),
      blt([t("El diseño está dirigido y perfeccionado por la evaluación centrada en el usuario.")]),
      blt([t("El proceso es iterativo: el diseño se revisa y mejora en múltiples ciclos.")]),
      blt([t("El diseño aborda toda la experiencia del usuario (UX), no solo la interfaz visual.")]),
      blt([t("El equipo de diseño incluye habilidades y perspectivas multidisciplinares.")]),

      p([t("Estos principios contrastan con el enfoque de desarrollo de software tradicional, en el que los sistemas suelen construirse basándose en las especificaciones técnicas del desarrollador o en los requerimientos del cliente, frecuentemente sin validar si los usuarios finales pueden realmente utilizar el producto. Como argumenta Norman (2013) en su obra fundamental "), ti("The Design of Everyday Things"), t(", los errores de uso rara vez son culpa del usuario; son consecuencia directa de un diseño deficiente que no consideró el modelo mental del usuario.")]),

      p([t("Para GimApp, la aplicación del DCU se materializa en actividades concretas durante el proceso de diseño de las interfaces: entrevistas y observación de los usuarios reales del gimnasio Gigafit (socios y personal administrativo), elaboración de personas (perfiles de usuario), construcción de wireframes y prototipos de baja fidelidad, validación iterativa con los usuarios y refinamiento de los diseños antes de la codificación. Este proceso reduce significativamente el riesgo de desarrollar un sistema que, aunque técnicamente correcto, sea rechazado o subutilizado por los usuarios finales (ISO, 2019; Cáceres Morejón et al., 2023).")]),
      blank(),

      // ═══════════════════════════════════════════════════════════════════════
      h1("2.2.9 Usabilidad: Norma ISO 9241-11 y Métricas de Evaluación"),

      p([t("La "), tb("usabilidad"), t(" es un atributo de calidad del software que evalúa qué tan fácil es para los usuarios específicos utilizar un sistema en un contexto particular para lograr objetivos concretos. La norma "), tb("ISO 9241-11:2018"), t(" (ISO, 2018), que actualizó y expandió la edición de 1998, proporciona la definición más ampliamente aceptada: la usabilidad es "), ti("\"la medida en que un producto puede ser utilizado por usuarios específicos para alcanzar objetivos específicos con eficacia, eficiencia y satisfacción en un contexto de uso específico\""), t(" (ISO, 2018, p. 4). Esta definición articula tres dimensiones de medición:")]),

      blt([tb("Eficacia: "), t("Precisión y completitud con la que los usuarios alcanzan sus objetivos. En el contexto de GimApp, la eficacia se mide evaluando si el usuario puede completar exitosamente tareas como: verificar el estado de su membresía, subir un comprobante de pago o consultar el catálogo de productos.")]),
      blt([tb("Eficiencia: "), t("Recursos invertidos (tiempo, número de interacciones, carga cognitiva) en relación con la precisión y completitud logradas. Una aplicación eficiente permite que el socio de Gigafit registre un pago en menos de 30 segundos con no más de 4 toques en la pantalla.")]),
      blt([tb("Satisfacción: "), t("Ausencia de incomodidad y actitudes positivas hacia el uso del producto. Se mide mediante cuestionarios estandarizados como el System Usability Scale (SUS) propuesto por Brooke (1996), que consiste en 10 ítems con escala Likert de 5 puntos y genera una puntuación normalizada de 0 a 100 (ISO, 2018).")]),

      p([t("La evaluación de la usabilidad puede realizarse mediante diferentes métodos, clasificados en dos grandes categorías: los métodos de "), tb("inspección"), t(" (llevados a cabo por expertos sin usuarios reales, como la evaluación heurística basada en las 10 heurísticas de Nielsen) y los métodos de "), tb("test con usuarios"), t(" (observación directa del comportamiento del usuario real al interactuar con el sistema). Para GimApp, se combinarán ambos métodos: primero una evaluación heurística durante la fase de diseño para identificar problemas obvios, y luego pruebas de usabilidad con una muestra de usuarios reales del gimnasio para validar la eficacia, eficiencia y satisfacción antes del despliegue final (Cáceres Morejón et al., 2023; ISO, 2018).")]),
      blank(),

      // ═══════════════════════════════════════════════════════════════════════
      h1("2.2.10 Pagos Digitales y Adopción Financiera en Ecuador"),

      p([t("Los "), tb("pagos digitales"), t(" comprenden el conjunto de transacciones financieras realizadas a través de canales electrónicos, incluyendo transferencias bancarias en línea, pagos mediante aplicaciones móviles, uso de billeteras electrónicas y procesadores de pagos como PayPal o Stripe. En Ecuador, el ecosistema de pagos digitales está regulado por el Banco Central del Ecuador (BCE) a través del "), tb("Sistema de Pagos Interbancarios (SPI)"), t(", que centraliza y liquida las transferencias electrónicas entre instituciones financieras del país (Banco Central del Ecuador, 2023).")]),

      p([t("Según las estadísticas del BCE (2023), durante el año 2022 el SPI procesó más de "), tb("183 millones de transferencias electrónicas"), t(", representando un valor total de aproximadamente USD 176.729 millones, cifra equivalente a 1,5 veces el Producto Interno Bruto (PIB) de Ecuador en ese año. Más revelador aún es el ritmo de crecimiento: el número de operaciones por canales digitales aumentó un "), tb("63,3%"), t(" respecto a 2021, consolidando las transferencias electrónicas como el método de pago preferido de los ecuatorianos para operaciones cotidianas (Banco Central del Ecuador, 2023; Asociación de Bancos Privados del Ecuador [Asobanca], 2022).")]),

      p([t("Para el contexto específico de Gigafit, esta tendencia tiene implicaciones operativas directas: el gimnasio recibe el grueso de sus ingresos por membresías a través de transferencias bancarias enviadas desde aplicaciones como la banca móvil de Banco Pichincha, Produbanco o Banco del Pacífico. Sin embargo, al no contar con un sistema integrado de gestión de pagos, el proceso de conciliación bancaria es completamente manual. La CEPAL (2021) señala que esta brecha entre la adopción digital por parte del consumidor y la capacidad de gestión digital de las pequeñas empresas es uno de los principales factores de ineficiencia operativa en las mipymes de América Latina.")]),
      blank(),

      // ═══════════════════════════════════════════════════════════════════════
      h1("2.2.11 Gestión de Membresías y Comercio Electrónico en el Fitness"),

      p([t("En la economía de los servicios deportivos, el "), tb("modelo de membresía"), t(" (también denominado modelo de suscripción recurrente) constituye la columna vertebral del flujo de ingresos de los gimnasios. Bajo este modelo, el cliente paga una tarifa periódica —mensual, trimestral o anual— a cambio del derecho a acceder a las instalaciones y servicios del establecimiento durante la vigencia de su plan. La predictibilidad de este flujo de ingresos es lo que permite a los gimnasios planificar inversiones, nómina y expansión a mediano plazo (Mordor Intelligence, 2024).")]),

      p([t("Sin embargo, Mercado Fitness (2023) advierte que, en el contexto latinoamericano, la falta de digitalización en el control de membresías es la principal causa de lo que en la industria se conoce como "), ti("revenue leakage"), t(" (fuga de ingresos): situaciones donde clientes con planes caducados continúan accediendo al servicio debido a fallos en el registro manual de fechas, o donde pagos realizados no son contabilizados correctamente por errores humanos en el proceso de validación. La implementación de un sistema digital de gestión de membresías, con cálculo automatizado de días de vigencia, estados lógicos (activo, vencido, en periodo de gracia) y notificaciones automáticas, puede reducir esta fuga de ingresos en porcentajes significativos (Mordor Intelligence, 2024; Research and Markets, 2024).")]),

      p([t("En cuanto al "), tb("comercio electrónico"), t(" integrado, la venta de productos deportivos (suplementos alimenticios, indumentaria y accesorios) a través de plataformas digitales representa una fuente de ingresos complementaria para los gimnasios independientes. Según datos de Mordor Intelligence (2024), el mercado global de comercio electrónico de artículos deportivos experimenta un crecimiento sostenido impulsado por el cambio en los hábitos de compra del consumidor, que cada vez prefiere adquirir productos desde su teléfono móvil. Para Gigafit, el módulo de catálogo y venta de productos de GimApp actúa como una tienda en línea cerrada dentro del ecosistema de la plataforma, facilitando la visibilidad del inventario para los socios y la gestión de pedidos para la administración.")]),
      blank(),

      // ═══════════════════════════════════════════════════════════════════════
      // REFERENCIAS BIBLIOGRÁFICAS
      // ═══════════════════════════════════════════════════════════════════════
      new Paragraph({
        children: [new TextRun({ text: "REFERENCIAS BIBLIOGRÁFICAS", font: FONT, size: SZ_H1, bold: true, color: COLOR_H })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 900, after: 400 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "Nota: Todas las referencias están ordenadas alfabéticamente. Los hipervínculos llevan directamente al artículo, informe o documento original.", font: FONT, size: 20, italics: true, color: "555555" })],
        border: { left: { style: BorderStyle.THICK, color: COLOR_H, size: 20 } },
        indent: { left: 300 },
        spacing: { before: 0, after: 400 }
      }),

      // 1
      ref(
        "Álvarez-Rodríguez, J. M., Cataño-Zapata, D. A., & Correa-Vélez, K. J. (2022).",
        "Desarrollo de aplicaciones móviles con React Native: análisis comparativo de rendimiento. Revista Ibérica de Sistemas e Tecnologias de Informação, (E54), 287–300.",
        "https://www.risti.xyz/issues/ristie54.pdf",
        "risti.xyz – RISTI Edición E54 (2022)"
      ),
      // 2
      ref(
        "Asociación de Bancos Privados del Ecuador [Asobanca]. (2022).",
        "La era de la banca digital en Ecuador: Indicadores de adopción y uso de canales financieros digitales.",
        "https://www.asobanca.org.ec",
        "asobanca.org.ec – Reportes sectoriales"
      ),
      // 3
      ref(
        "Banco Central del Ecuador [BCE]. (2023).",
        "Estadísticas del Sistema de Pagos Interbancarios (SPI) – Resumen de operaciones 2022.",
        "https://www.bce.fin.ec",
        "bce.fin.ec – Portal oficial del Banco Central del Ecuador"
      ),
      // 4
      ref(
        "Banco Interamericano de Desarrollo [BID]. (2022).",
        "The 360° on digital transformation in firms in Latin America and the Caribbean (IDB Monograph 1067).",
        "https://publications.iadb.org/en/360-digital-transformation-firms-latin-america-and-caribbean",
        "publications.iadb.org – IDB Monograph 1067"
      ),
      // 5
      ref(
        "Brooke, J. (1996).",
        "SUS: A quick and dirty usability scale. En P. W. Jordan, B. Thomas, B. A. Weerdmeester, & I. L. McClelland (Eds.), Usability Evaluation in Industry (pp. 189–194). Taylor & Francis.",
        "https://www.tandfonline.com/doi/abs/10.1201/9781498710411-35",
        "tandfonline.com – SUS scale reference"
      ),
      // 6
      ref(
        "Bustamante Morales, M. A., & Guerrero Castro, D. A. (2023).",
        "Desarrollo de un sistema web con Laravel y React para la gestión administrativa de organizaciones deportivas. Repositorio Institucional PUCE.",
        "https://repositorio.puce.edu.ec/handle/123456789/44586",
        "repositorio.puce.edu.ec – Tesis PUCE 2024 (Sam-Gym)"
      ),
      // 7
      ref(
        "Cáceres Morejón, A. P., Delgado Troya, O., & Pérez Reyes, E. M. (2023).",
        "Diseño centrado en el usuario aplicado al desarrollo de aplicaciones móviles de servicios. Ciencia Latina Revista Científica Multidisciplinar, 7(2), 4102–4120.",
        "https://ciencialatina.org/index.php/cienciala/article/view/5791",
        "ciencialatina.org – Artículo sobre DCU y apps móviles"
      ),
      // 8
      ref(
        "Comisión Económica para América Latina y el Caribe [CEPAL]. (2021).",
        "Transformación digital de las mipymes: elementos para el diseño de políticas. Naciones Unidas. (LC/TS.2021/99).",
        "https://repositorio.cepal.org/handle/11362/47309",
        "repositorio.cepal.org – Informe LC/TS.2021/99"
      ),
      // 9
      ref(
        "Codd, E. F. (1970).",
        "A relational model of data for large shared data banks. Communications of the ACM, 13(6), 377–387.",
        "https://dl.acm.org/doi/10.1145/362384.362685",
        "dl.acm.org – ACM Digital Library"
      ),
      // 10
      ref(
        "Expo. (2024).",
        "Expo Documentation: Build cross-platform apps with React Native.",
        "https://docs.expo.dev/",
        "docs.expo.dev – Documentación oficial de Expo"
      ),
      // 11
      ref(
        "Fielding, R. T. (2000).",
        "Architectural Styles and the Design of Network-based Software Architectures. (Disertación doctoral, University of California, Irvine).",
        "https://www.ics.uci.edu/~fielding/pubs/dissertation/top.htm",
        "ics.uci.edu – Disertación doctoral de Fielding (REST)"
      ),
      // 12
      ref(
        "Gray, J., & Reuter, A. (1992).",
        "Transaction Processing: Concepts and Techniques. Morgan Kaufmann.",
        "https://www.sciencedirect.com/book/9781558601901/transaction-processing-concepts-and-techniques",
        "sciencedirect.com – Transaction Processing (Gray & Reuter)"
      ),
      // 13
      ref(
        "Hernández Contla, J. L., Ramírez Fuentes, J. A., & Torres Martínez, G. (2021).",
        "Comparativa de frameworks PHP: Laravel, Symfony y CodeIgniter para el desarrollo de APIs REST. Revista Tecnología e Innovación, 8(29), 1–15.",
        "https://www.tectzapic.tecnm.mx/index.php/rti/article/view/98",
        "tectzapic.tecnm.mx – Revista TyI, comparativa Laravel"
      ),
      // 14
      ref(
        "IEEE. (2017).",
        "IEEE/ISO/IEC 12207-2017. Systems and software engineering — Software life cycle processes.",
        "https://ieeexplore.ieee.org/document/8100792",
        "ieeexplore.ieee.org – IEEE 12207"
      ),
      // 15
      ref(
        "International Organization for Standardization [ISO]. (2018).",
        "ISO 9241-11:2018. Ergonomics of human-system interaction — Part 11: Usability: Definitions and concepts.",
        "https://www.iso.org/standard/63500.html",
        "iso.org – Ficha oficial ISO 9241-11:2018"
      ),
      // 16
      ref(
        "International Organization for Standardization [ISO]. (2019).",
        "ISO 9241-210:2019. Ergonomics of human-system interaction — Part 210: Human-centred design for interactive systems.",
        "https://www.iso.org/standard/77520.html",
        "iso.org – Ficha oficial ISO 9241-210:2019"
      ),
      // 17
      ref(
        "Laravel. (2024).",
        "Laravel 12.x Documentation: The PHP Framework for Web Artisans.",
        "https://laravel.com/docs/12.x",
        "laravel.com/docs – Documentación oficial Laravel 12"
      ),
      // 18
      ref(
        "Mercado Fitness. (2023).",
        "El 70% de los gimnasios aún no usa tecnología para gestionar su negocio.",
        "https://www.mercadofitness.com/gestion/",
        "mercadofitness.com – Sección de Gestión"
      ),
      // 19
      ref(
        "Meta. (2024a).",
        "React Native Documentation: Learn once, write anywhere.",
        "https://reactnative.dev/docs/getting-started",
        "reactnative.dev – Documentación oficial React Native"
      ),
      // 20
      ref(
        "Meta. (2024b).",
        "React Documentation: The library for web and native user interfaces.",
        "https://react.dev/learn",
        "react.dev – Documentación oficial React"
      ),
      // 21
      ref(
        "Mordor Intelligence. (2024).",
        "South America health and fitness club market — Industry trends & statistics, growth forecasts 2019–2029.",
        "https://www.mordorintelligence.com/industry-reports/south-america-health-and-fitness-club-market",
        "mordorintelligence.com – South America Fitness Market Report"
      ),
      // 22
      ref(
        "MySQL [Oracle Corporation]. (2024).",
        "MySQL 8.4 Reference Manual: The InnoDB Storage Engine and ACID Model.",
        "https://dev.mysql.com/doc/refman/8.4/en/",
        "dev.mysql.com – MySQL 8.4 Reference Manual"
      ),
      // 23
      ref(
        "Norman, D. A. (2013).",
        "The design of everyday things (Edición revisada y ampliada). Basic Books.",
        "https://www.basicbooks.com/titles/don-norman/the-design-of-everyday-things/9780465050659/",
        "basicbooks.com – The Design of Everyday Things"
      ),
      // 24
      ref(
        "Research and Markets. (2024).",
        "South America health and fitness club market size & share analysis — growth trends & forecasts (2024–2029).",
        "https://www.researchandmarkets.com/reports/5665779/south-america-health-and-fitness-club-market",
        "researchandmarkets.com – South America Fitness Market"
      ),
      // 25
      ref(
        "Vargas, C., Maestre, D., & Ramírez, J. (2021).",
        "Análisis comparativo de tecnologías de desarrollo de aplicaciones móviles: nativas, híbridas y multiplataforma. Revista Ibérica de Sistemas e Tecnologias de Informação, (E46), 330–342.",
        "https://www.risti.xyz/issues/ristie46.pdf",
        "risti.xyz – RISTI Edición E46 (2021)"
      ),
      // 26
      ref(
        "Vite. (2024).",
        "Vite: Next Generation Frontend Tooling. Guía oficial.",
        "https://vitejs.dev/guide/",
        "vitejs.dev – Documentación oficial Vite"
      ),

      blank(),
      new Paragraph({
        children: [new TextRun({ text: "— Fin de la Sección 2.2 —", font: FONT, size: SZ, italics: true, color: "888888" })],
        alignment: AlignmentType.CENTER, spacing: { before: 600 }
      }),
    ]
  }]
});

const outPath = path.join(__dirname, "..", "Capitulo_II_Definiciones_Conceptuales_v3.docx");
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(outPath, buf);
  console.log("✅ Generado:", outPath);
});
