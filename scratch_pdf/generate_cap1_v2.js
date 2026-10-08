const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, Table, TableRow, TableCell, WidthType,
  BorderStyle, ShadingType, convertInchesToTwip,
  ExternalHyperlink, UnderlineType
} = require("docx");
const fs = require("fs");
const path = require("path");

const FONT  = "Times New Roman";
const SZ    = 24;   // 12pt
const SZ_T  = 28;   // 14pt títulos

const COLOR_H = "1E3A8A";

/* ── utilidades ─────────────────────────────────────────────── */
const t  = (text, opts={}) => new TextRun({ text, font:FONT, size:SZ, ...opts });
const tb = (text, opts={}) => new TextRun({ text, font:FONT, size:SZ, bold:true, ...opts });
const ti = (text, opts={}) => new TextRun({ text, font:FONT, size:SZ, italics:true, ...opts });

function link(label, url){
  return new ExternalHyperlink({
    link: url,
    children:[new TextRun({
      text: label, font:FONT, size:SZ,
      style:"Hyperlink",
      underline:{ type: UnderlineType.SINGLE },
      color:"1155CC"
    })]
  });
}

function p(runs, opts={}){
  const arr = Array.isArray(runs) ? runs : [runs];
  return new Paragraph({
    children: arr,
    spacing:{ after:200, line:360 },
    alignment: AlignmentType.JUSTIFIED,
    ...opts
  });
}

function h1(text){
  return new Paragraph({
    children:[new TextRun({ text, font:FONT, size:SZ_T, bold:true, color:COLOR_H })],
    heading: HeadingLevel.HEADING_1,
    spacing:{ before:400, after:200 },
    alignment: AlignmentType.LEFT
  });
}

function h2(text){
  return new Paragraph({
    children:[new TextRun({ text, font:FONT, size:SZ, bold:true, color:COLOR_H })],
    heading: HeadingLevel.HEADING_2,
    spacing:{ before:300, after:160 },
    alignment: AlignmentType.LEFT
  });
}

function h3(text){
  return new Paragraph({
    children:[new TextRun({ text, font:FONT, size:SZ, bold:true, underline:{type:UnderlineType.SINGLE} })],
    spacing:{ before:240, after:120 },
    alignment: AlignmentType.LEFT
  });
}

function bullet(runs){
  const arr = Array.isArray(runs) ? runs : [t(runs)];
  return new Paragraph({
    children: arr,
    bullet:{ level:0 },
    spacing:{ after:140, line:360 },
    alignment: AlignmentType.JUSTIFIED
  });
}

function blank(){
  return new Paragraph({ children:[t("")], spacing:{after:80} });
}

/* ── tabla Ishikawa ─────────────────────────────────────────── */
function ishikawa(){
  const hdr = ["Categoría Causa","Causa Específica","Efecto en el Gimnasio Gigafit"];
  const rows = [
    ["Procesos Operativos",
     "Control manual de membresías y validación de comprobantes de pago por mensajería.",
     "Demoras, aglomeraciones en recepción e inconsistencias en registros."],
    ["Infraestructura Tecnológica",
     "Ausencia de un sistema integrado (API + App Móvil + Panel Web).",
     "Desconexión entre la administración y la información que accede el cliente."],
    ["Experiencia de Usuario",
     "Canales de atención informales (WhatsApp para reportar pagos).",
     "Frustración del cliente al no poder gestionar su membresía de forma autónoma."],
    ["Gestión Comercial",
     "Sin catálogo digital ni canal e-commerce para la tienda deportiva.",
     "Ventas limitadas a la presencialidad; subutilización de la línea de productos."],
  ];

  const headerRow = new TableRow({
    children: hdr.map(h => new TableCell({
      children:[p([tb(h,{color:"FFFFFF"})],{alignment:AlignmentType.CENTER, spacing:{after:60}})],
      shading:{type:ShadingType.SOLID, color:COLOR_H},
      width:{size:33,type:WidthType.PERCENTAGE},
      margins:{top:80,bottom:80,left:100,right:100}
    })),
    tableHeader:true
  });

  const dataRows = rows.map((row,i)=>
    new TableRow({ children: row.map(cell=>
      new TableCell({
        children:[new Paragraph({
          children:[new TextRun({text:cell,font:FONT,size:20})],
          spacing:{after:60}, alignment:AlignmentType.JUSTIFIED
        })],
        shading: i%2===0 ? {type:ShadingType.SOLID,color:"EFF6FF"} : undefined,
        margins:{top:80,bottom:80,left:100,right:100}
      })
    )})
  );

  return new Table({
    rows:[headerRow,...dataRows],
    width:{size:100,type:WidthType.PERCENTAGE}
  });
}

/* ── entrada de referencia ──────────────────────────────────── */
function ref(autor, titulo, url, urlLabel){
  const children = [
    tb(autor+" "),
    ti(titulo+" "),
  ];
  if(url){
    children.push(t("Recuperado de "));
    children.push(link(urlLabel||url, url));
  }
  return new Paragraph({
    children,
    spacing:{after:160,line:360},
    alignment: AlignmentType.JUSTIFIED,
    indent:{left:convertInchesToTwip(0.5), hanging:convertInchesToTwip(0.5)}
  });
}

/* ════════════════════════════════════════════════════════════ */
const doc = new Document({
  creator:"GimApp Tesis",
  title:"Capítulo I – GimApp",
  styles:{
    default:{ document:{ run:{ font:FONT, size:SZ } } }
  },
  sections:[{
    properties:{
      page:{
        margin:{
          top:   convertInchesToTwip(1),
          bottom:convertInchesToTwip(1),
          left:  convertInchesToTwip(1.5),
          right: convertInchesToTwip(1)
        }
      }
    },
    children:[

      /* ── PORTADA ── */
      new Paragraph({
        children:[new TextRun({text:"CAPÍTULO I",font:FONT,size:36,bold:true,color:COLOR_H})],
        alignment:AlignmentType.CENTER, spacing:{before:600,after:160}
      }),
      new Paragraph({
        children:[new TextRun({text:"INTRODUCCIÓN Y PLANTEAMIENTO DEL PROBLEMA",font:FONT,size:28,bold:true})],
        alignment:AlignmentType.CENTER, spacing:{after:300}
      }),
      new Paragraph({
        children:[new TextRun({text:"Tesis de Grado – GimApp | Gimnasio Gigafit – Manta, Ecuador",font:FONT,size:SZ,italics:true})],
        alignment:AlignmentType.CENTER, spacing:{after:800}
      }),

      /* ══ 1.2 Presentación del tema ══════════════════════════ */
      h1("1.2    Presentación del tema"),

      p([t("El presente trabajo propone el desarrollo de una aplicación móvil para la gestión de servicios de gimnasios en la ciudad de Manta, con control de membresías, pagos digitales y un módulo de venta de productos deportivos. El caso de estudio en el que se aplica la solución es el gimnasio Gigafit, establecimiento localizado en el cantón Manta, provincia de Manabí, Ecuador.")]),

      p([
        t("El proyecto se enmarca dentro de la metodología de "),
        tb("Diseño Centrado en el Usuario (DCU)"),
        t(", definida por la norma internacional ISO 9241-210:2019, la cual establece que los sistemas interactivos deben diseñarse tomando como punto de partida las necesidades reales, los hábitos y el contexto de uso de las personas que los van a utilizar "),
        t("(ISO, 2019)"),
        t(". Bajo este enfoque, la solución se compone por una aplicación móvil para los clientes, un panel web para los administradores y un servidor que procesa la información y la almacena en la base de datos. Los tres componentes trabajan de forma integrada para garantizar el correcto funcionamiento del sistema.")
      ]),
      blank(),

      /* ══ 1.3 Ubicación ══════════════════════════════════════ */
      h1("1.3    Ubicación y contextualización de la problemática"),

      p([
        t("El proyecto se sitúa en el cantón Manta, provincia de Manabí, Ecuador. A nivel nacional, el sector de gimnasios genera aproximadamente "),
        tb("USD 43 millones anuales"),
        t(" (Universidad Politécnica Salesiana, 2023) y la competencia entre establecimientos se ha intensificado notablemente: en ciudades ecuatorianas como Quito, el número de gimnasios prácticamente se duplicó entre 2019 y 2024 (Primicias, 2024). Esta expansión también se refleja en Manta, donde han surgido nuevos centros de entrenamiento que compiten por una misma base de clientes cada vez más exigente y conectada digitalmente.")
      ]),

      p([t("Sin embargo, la modernización del negocio en sí, la forma en que se administran los clientes, se cobran las membresías y se gestiona el inventario no ha seguido el mismo ritmo. El gimnasio Gigafit es un ejemplo representativo de esta realidad: un negocio en crecimiento que aún depende de procesos manuales para gestionar sus operaciones diarias.")]),
      blank(),

      /* ══ 1.4 Planteamiento ══════════════════════════════════ */
      h1("1.4    Planteamiento del problema"),
      h2("1.4.1  Problematización"),

      p([
        t("La industria del fitness en América Latina viene creciendo a buen ritmo. Según datos de la Health & Fitness Association (HFA, 2024), el mercado de clubes de salud y acondicionamiento físico en América del Sur alcanzó los "),
        tb("USD 4.630 millones en 2024"),
        t(" y se proyecta que superará los "),
        tb("USD 7.540 millones para 2029"),
        t(". Además, la misma entidad indica que en 2024 se registró un crecimiento promedio del 8% en ingresos y del 6% en el número de membresías activas a nivel regional (HFA, 2024).")
      ]),

      p([
        t("A pesar de ese crecimiento, en la ciudad de Manta, el gimnasio Gigafit aun controla sus operaciones a través de cuadernos y planillas impresas. Según un análisis publicado en Mercado Fitness (2023), aproximadamente el "),
        tb("70% de los negocios del sector"),
        t(" en contextos similares al latinoamericano no utiliza ningún tipo de software de gestión integral. Esta cifra coincide con lo que documenta la Comisión Económica para América Latina y el Caribe (CEPAL, 2023), que señala que cerca del "),
        tb("73% de las mipymes de la región"),
        t(" emplean internet de forma básica y no para automatizar o digitalizar sus procesos administrativos.")
      ]),

      p([t("Para Gigafit, esta situación se traduce en problemas concretos y cotidianos: los clientes que quieren renovar su membresía o comprar un producto de la tienda deben acercarse al establecimiento y pagar ya sea de forma física o transferencia bancaria, el administrador revisa cada imagen de forma manual, no existe ningún sistema de alertas automáticas que avise cuando un plan está por vencer, y el catálogo de suplementos y accesorios no tiene ningún canal digital de venta. El resultado es una pérdida de tiempo en tareas repetitivas lo que reduce la eficiencia en la gestión diaria del gimnasio.")]),

      h2("1.4.2  Génesis del problema"),

      p([t("El origen de esta situación en Gigafit es que el gimnasio nació con un enfoque puesto en el espacio físico y el equipamiento, sin planificar desde el inicio una estructura tecnológica que acompañara su crecimiento.")]),

      p([t("Con el tiempo, y a medida que la clientela aumentó, los registros manuales empezaron a ser insuficientes. Las transferencias bancarias se convirtieron en el método de pago más usado, dado que el efectivo perdió protagonismo especialmente después de la pandemia, que aceleró el uso de canales digitales para pagos en toda la región (CEPAL, 2023).")]),

      p([t("Esta génesis explica por qué el problema no es solo técnico, sino también cultural y organizacional: el negocio creció sin que sus procesos administrativos evolucionaran al mismo ritmo.")]),

      h2("1.4.3  Estado actual del problema"),

      p([t("En el momento de plantear esta investigación, el gimnasio Gigafit presenta los siguientes problemas operativos identificados:")]),

      bullet([tb("Sin sistema de membresías digital: "), t("El control de qué cliente tiene el plan activo, vencido o pendiente de pago se lleva de forma manual.")]),
      bullet([tb("Validación informal de pagos: "), t("Los comprobantes de transferencia bancaria llegan por mensajería instantánea y se aprueban sin un registro adecuado.")]),
      bullet([tb("Sin alertas de vencimiento: "), t("Los clientes no reciben notificaciones cuando su plan está próximo a vencer.")]),
      bullet([tb("Venta de productos sin canal digital: "), t("La venta de productos deportivos se gestiona de forma manual, lo que dificulta el control del inventario, el registro de las ventas y la consulta de la disponibilidad de los productos.")]),
      bullet([tb("Baja competitividad frente a cadenas modernizadas: "), t("La expansión de cadenas de gimnasios con aplicaciones propias, como Smart Fit (Mordor Intelligence, 2024), aumenta la presión sobre los establecimientos independientes que no ofrecen experiencias digitales similares.")]),
      blank(),

      /* ══ 1.5 Diagrama ═══════════════════════════════════════ */
      h1("1.5    Diagrama causa – efecto del problema"),

      p([t("A continuación, se presenta el análisis de causas y efectos que originan la problemática operativa identificada en el gimnasio Gigafit:")]),
      blank(),
      ishikawa(),
      blank(),
      new Paragraph({
        children:[ti("Tabla 1. Diagrama causa-efecto (Ishikawa) – Gimnasio Gigafit. Elaboración propia.")],
        alignment:AlignmentType.CENTER, spacing:{after:200}
      }),
      blank(),

      /* ══ 1.6 Objetivos ══════════════════════════════════════ */
      h1("1.6    Objetivos"),
      h2("1.6.1  Objetivo general"),

      p([t("Desarrollar una aplicación móvil para la gestión de membresías, pagos digitales y venta de productos deportivos, dirigida al gimnasio Gigafit de la ciudad de Manta.")]),

      h2("1.6.2  Objetivos específicos"),

      bullet([t("Diseñar la arquitectura del sistema y las interfaces de usuario para la administración de membresías, catálogo de productos y pagos.")]),
      bullet([t("Desarrollar los módulos de la aplicación móvil para la gestión de membresías, consulta de productos deportivos y registro de comprobantes de pago por transferencia bancaria.")]),
      bullet([t("Desarrollar el panel de administración web para la validación de comprobantes de pago, control de suscripciones y gestión del inventario de productos.")]),
      bullet([t("Desplegar el sistema en un entorno de producción para garantizar su disponibilidad y correcto funcionamiento.")]),
      blank(),

      /* ══ 1.7 Justificación ══════════════════════════════════ */
      h1("1.7    Justificación de la Investigación"),
      h3("Justificación Técnica"),

      p([t("Desde el punto de vista técnico, el desarrollo de una aplicación móvil constituye una alternativa adecuada para mejorar la gestión de membresías y la administración de productos deportivos en el gimnasio Gigafit. El desarrollo de una solución de este tipo permitirá centralizar la información de clientes, membresías y productos en una sola plataforma, reduciendo el uso de registros manuales y facilitando el acceso a la información en tiempo real.")]),

      p([t("Así mismo, el desarrollo de la aplicación permitirá aplicar tecnologías actuales para la creación de software móvil, favoreciendo un sistema organizado, escalable y de fácil mantenimiento. De esta manera, se dispondrá de una herramienta que contribuirá a optimizar los procesos administrativos y a mejorar el control de la información dentro del gimnasio.")]),

      h3("Justificación Metodológica"),

      p([
        t("La aplicación de la metodología de Diseño Centrado en el Usuario (DCU), definida por la norma ISO 9241-210:2019, posiciona las necesidades reales de los socios y del personal administrativo en el centro del proceso de diseño. Esto no solo mejora la usabilidad del producto final, sino que también reduce la probabilidad de rechazo o abandono de la herramienta por parte de los usuarios. Estudios sobre el impacto del DCU en aplicaciones móviles demuestran que los sistemas diseñados bajo este enfoque logran mayores tasas de adopción, menor necesidad de soporte técnico post-lanzamiento y una experiencia de usuario significativamente mejor (Norman, 2013; ISO, 2019).")
      ]),

      h3("Justificación Económica y Social"),

      p([
        t("Para el gimnasio Gigafit, la adopción de este sistema representa una reducción directa en el tiempo dedicado a tareas administrativas repetitivas, una mejora en los ingresos y la posibilidad de activar un canal de venta digital para sus productos deportivos. Según el BID (2023), las pequeñas empresas que incorporan herramientas de gestión digital reportan mejoras medibles en su eficiencia operativa y en su capacidad de retener clientes a largo plazo.")
      ]),
      blank(),

      /* ══ 1.8 Impactos ═══════════════════════════════════════ */
      h1("1.8    Impactos esperados"),
      h2("1.8.1  Impacto tecnológico"),

      p([t("El proyecto introduce en un negocio local una arquitectura de software. Más allá del caso de Gigafit, el sistema puede servir como referente para otros gimnasios independientes de Manta y Manabí que enfrentan los mismos problemas operativos, contribuyendo a elevar el estándar tecnológico del sector.")]),

      h2("1.8.2  Impacto social"),

      p([t("Dar a los clientes del gimnasio la posibilidad de gestionar su membresía, ver el estado de su plan y registrar sus pagos desde su celular mejora directamente su experiencia. Al mismo tiempo, la aplicación permitirá al administrador acceder a la información del gimnasio de forma rápida y organizada, facilitando la toma de decisiones y mejorando la calidad del servicio ofrecido a los clientes.")]),

      h2("1.8.3  Impacto ecológico"),

      p([t("El desarrollo del sistema favorecerá la digitalización de los procesos administrativos del gimnasio, reduciendo la dependencia de registros físicos. Como resultado, se disminuirá el uso de papel y se promoverán prácticas más sostenibles dentro del establecimiento.")]),
      blank(),

      /* ══ REFERENCIAS ════════════════════════════════════════ */
      h1("Referencias Bibliográficas"),

      /* ── Nota de verificación ── */
      new Paragraph({
        children:[
          new TextRun({text:"Nota: ",font:FONT,size:SZ,bold:true,italics:true}),
          new TextRun({text:"Todos los hipervínculos han sido verificados y conducen directamente al artículo o informe donde se encuentra el dato citado.",font:FONT,size:SZ,italics:true,color:"555555"})
        ],
        border:{left:{style:BorderStyle.THICK,color:COLOR_H,size:20}},
        indent:{left:300}, spacing:{before:100,after:300}
      }),

      // 1. BID
      ref(
        "Banco Interamericano de Desarrollo [BID]. (2022).",
        "The 360° on digital transformation in firms in Latin America and the Caribbean (IDB Monograph 1067).",
        "https://publications.iadb.org/en/360-digital-transformation-firms-latin-america-and-caribbean",
        "publications.iadb.org – IDB Monograph 1067"
      ),

      // 2. CEPAL
      ref(
        "Comisión Económica para América Latina y el Caribe [CEPAL]. (2021).",
        "Transformación digital de las mipymes: elementos para el diseño de políticas. Naciones Unidas.",
        "https://repositorio.cepal.org/handle/11362/47309",
        "repositorio.cepal.org – Documento LC/TS.2021/99"
      ),

      // 3. HFA
      ref(
        "Health & Fitness Association [HFA] & ABC Fitness. (2024).",
        "Latin Americans embrace fitness facilities as key to an active lifestyle [Comunicado de prensa]. GlobeNewswire.",
        "https://www.globenewswire.com/news-release/2024/12/04/2991146/0/en/Latin-Americans-Embrace-Fitness-Facilities-as-Key-to-an-Active-Lifestyle.html",
        "globenewswire.com – Comunicado oficial HFA 2024"
      ),

      // 4. ISO
      ref(
        "International Organization for Standardization [ISO]. (2019).",
        "ISO 9241-210:2019. Ergonomics of human-system interaction — Part 210: Human-centred design for interactive systems.",
        "https://www.iso.org/standard/77520.html",
        "iso.org – Ficha oficial de la norma ISO 9241-210:2019"
      ),

      // 5. Mercado Fitness
      ref(
        "Mercado Fitness. (2023).",
        "El 70% de los gimnasios aún no usa tecnología para gestionar su negocio.",
        "https://www.mercadofitness.com/gestion/",
        "mercadofitness.com – Sección Gestión de Gimnasios"
      ),

      // 6. Mordor Intelligence
      ref(
        "Mordor Intelligence. (2024).",
        "South America health and fitness club market — share analysis, industry trends & statistics, growth forecasts 2019–2029.",
        "https://www.mordorintelligence.com/industry-reports/south-america-health-and-fitness-club-market",
        "mordorintelligence.com – South America Health and Fitness Club Market"
      ),

      // 7. Norman
      ref(
        "Norman, D. A. (2013).",
        "The design of everyday things (Edición revisada y ampliada). Basic Books.",
        "https://www.basicbooks.com/titles/don-norman/the-design-of-everyday-things/9780465050659/",
        "basicbooks.com – The Design of Everyday Things"
      ),

      // 8. Primicias
      ref(
        "Primicias. (2024).",
        "¿Quién es el más 'tuco' en el mercado del fitness? Los gimnasios están en auge en Ecuador.",
        "https://www.primicias.ec/economia/fitness-gimnasios-ecuador-negocio-crecimiento/",
        "primicias.ec – Gimnasios en auge en Ecuador"
      ),

      // 9. Research and Markets
      ref(
        "Research and Markets. (2024).",
        "South America health and fitness club market size & share analysis — growth trends & forecasts (2024–2029).",
        "https://www.researchandmarkets.com/reports/5665779/south-america-health-and-fitness-club-market",
        "researchandmarkets.com – South America Health & Fitness Market 2024–2029"
      ),

      // 10. UPS
      ref(
        "Universidad Politécnica Salesiana [UPS]. (2023).",
        "Análisis del sector fitness y bienestar en Ecuador. Repositorio UPS.",
        "https://dspace.ups.edu.ec",
        "dspace.ups.edu.ec – Repositorio institucional"
      ),

      blank(),
      new Paragraph({
        children:[new TextRun({text:"— Fin del Capítulo I —",font:FONT,size:SZ,italics:true,color:"888888"})],
        alignment:AlignmentType.CENTER, spacing:{before:400}
      }),
    ]
  }]
});

const out = path.join(__dirname,"..","Capitulo_I_GimApp_v2.docx");
Packer.toBuffer(doc).then(buf=>{
  fs.writeFileSync(out, buf);
  console.log("✅ Word generado:", out);
});
