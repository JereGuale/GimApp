const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, Table, TableRow, TableCell, WidthType,
  BorderStyle, ShadingType, convertInchesToTwip, Header,
  PageNumber, NumberFormat, ExternalHyperlink, UnderlineType
} = require("docx");
const fs = require("fs");
const path = require("path");

// ── Helpers ──────────────────────────────────────────────────────────────────

const FONT = "Times New Roman";
const SIZE  = 24;          // 12pt en half-points
const SIZE_H1 = 28;        // 14pt
const SIZE_H2 = 26;        // 13pt
const COLOR_HEADING = "1E3A8A";

function normal(text, opts = {}) {
  return new TextRun({ text, font: FONT, size: SIZE, ...opts });
}

function bold(text, opts = {}) {
  return new TextRun({ text, font: FONT, size: SIZE, bold: true, ...opts });
}

function cite(text) {
  // cita en negrita suave – se puede cambiar a italic si la guía lo pide
  return new TextRun({ text, font: FONT, size: SIZE, bold: false, italics: false, color: "555555" });
}

function hyperlink(display, url) {
  return new ExternalHyperlink({
    children: [new TextRun({ text: display, font: FONT, size: SIZE,
      style: "Hyperlink", underline: { type: UnderlineType.SINGLE } })],
    link: url,
  });
}

function para(children, opts = {}) {
  return new Paragraph({
    children: Array.isArray(children) ? children : [children],
    spacing: { after: 200, line: 360 },   // 1.5 interlineado aprox.
    alignment: AlignmentType.JUSTIFIED,
    ...opts,
  });
}

function heading1(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: SIZE_H1, bold: true, color: COLOR_HEADING })],
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    alignment: AlignmentType.LEFT,
    numbering: undefined,
  });
}

function heading2(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: SIZE_H2, bold: true, color: COLOR_HEADING })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 160 },
    alignment: AlignmentType.LEFT,
  });
}

function heading3(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: SIZE, bold: true, underline: { type: UnderlineType.SINGLE } })],
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120 },
    alignment: AlignmentType.LEFT,
  });
}

function bullet(text) {
  return new Paragraph({
    children: [normal(text)],
    bullet: { level: 0 },
    spacing: { after: 120, line: 360 },
    alignment: AlignmentType.JUSTIFIED,
  });
}

function numbered(text, n) {
  return new Paragraph({
    children: [normal(`${n}. ${text}`)],
    spacing: { after: 160, line: 360 },
    indent: { left: convertInchesToTwip(0.5) },
    alignment: AlignmentType.JUSTIFIED,
  });
}

function blank() {
  return new Paragraph({ children: [new TextRun("")], spacing: { after: 100 } });
}

function separator() {
  return new Paragraph({
    children: [new TextRun({ text: "───────────────────────────────────────────", color: "CCCCCC", font: FONT, size: SIZE })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 200 },
  });
}

// ── Tabla Ishikawa ────────────────────────────────────────────────────────────

function ishikawaTable() {
  const headerColor = "1E3A8A";
  const evenColor   = "EFF6FF";

  const rows_data = [
    ["Procesos Operativos", "Verificación manual de transferencias y registro en recepción.", "Demoras en la atención, aglomeraciones en horas pico e inconsistencias en registros."],
    ["Infraestructura Tecnológica", "Ausencia de un ecosistema móvil-web integrado.", "Desconexión entre los datos de la administración y la información visible para el cliente."],
    ["Experiencia de Usuario (UX)", "Canales de atención fragmentados (mensajería informal).", "Frustración del cliente al no poder autogestionar sus renovaciones ni consultar información en tiempo real."],
    ["Gestión Comercial / Ventas", "Falta de vitrina virtual para suplementos e indumentaria.", "Suboptimización de las ventas de la tienda deportiva por falta de canal e-commerce directo."],
  ];

  const headerRow = new TableRow({
    children: ["Categoría Causa", "Causa Específica", "Efecto en el Gimnasio Gigafit"].map(h =>
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: h, font: FONT, size: SIZE, bold: true, color: "FFFFFF" })], alignment: AlignmentType.CENTER })],
        shading: { type: ShadingType.SOLID, color: headerColor },
        width: { size: 33, type: WidthType.PERCENTAGE },
      })
    ),
    tableHeader: true,
  });

  const dataRows = rows_data.map((row, i) =>
    new TableRow({
      children: row.map(cell =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: cell, font: FONT, size: 20 })], alignment: AlignmentType.JUSTIFIED, spacing: { after: 80 } })],
          shading: i % 2 === 0 ? { type: ShadingType.SOLID, color: evenColor } : undefined,
          margins: { top: 80, bottom: 80, left: 100, right: 100 },
        })
      ),
    })
  );

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

// ── REFERENCIAS (con hipervínculos) ──────────────────────────────────────────

function refEntry(authorYear, title, url, label) {
  const children = [
    bold(authorYear + " "),
    normal(title + " "),
  ];
  if (url) {
    children.push(normal("Recuperado de "));
    children.push(hyperlink(url, url));
  }
  return new Paragraph({
    children,
    spacing: { after: 160, line: 360 },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.5) },
  });
}

// ── BUILD DOCUMENT ────────────────────────────────────────────────────────────

const doc = new Document({
  creator: "GimApp Tesis",
  title: "Capítulo I – Introducción y Planteamiento del Problema",
  styles: {
    default: {
      document: { run: { font: FONT, size: SIZE } },
    },
  },
  sections: [{
    properties: {
      page: {
        margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1),
                  left: convertInchesToTwip(1.5), right: convertInchesToTwip(1) },
      },
    },
    children: [

      // ── PORTADA ─────────────────────────────────────────────────────────────
      new Paragraph({
        children: [new TextRun({ text: "CAPÍTULO I", font: FONT, size: 36, bold: true, color: COLOR_HEADING })],
        alignment: AlignmentType.CENTER, spacing: { before: 600, after: 160 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "INTRODUCCIÓN Y PLANTEAMIENTO DEL PROBLEMA", font: FONT, size: 28, bold: true })],
        alignment: AlignmentType.CENTER, spacing: { after: 800 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Tesis de Grado", font: FONT, size: SIZE, italics: true })],
        alignment: AlignmentType.CENTER, spacing: { after: 120 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Desarrollo e implementación de una aplicación móvil para la gestión", font: FONT, size: SIZE })],
        alignment: AlignmentType.CENTER, spacing: { after: 80 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "integral de servicios de gimnasios en la ciudad de Manta", font: FONT, size: SIZE })],
        alignment: AlignmentType.CENTER, spacing: { after: 80 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Caso de Estudio: Gimnasio Gigafit", font: FONT, size: SIZE, bold: true })],
        alignment: AlignmentType.CENTER, spacing: { after: 600 },
      }),

      // ── NOTA ────────────────────────────────────────────────────────────────
      new Paragraph({
        children: [
          new TextRun({ text: "Nota: ", font: FONT, size: SIZE, bold: true, italics: true }),
          new TextRun({ text: "Los hipervínculos de las referencias bibliográficas llevan directamente al artículo, informe o sección exacta donde se verifica el dato citado.", font: FONT, size: SIZE, italics: true, color: "555555" }),
        ],
        border: { left: { style: BorderStyle.THICK, color: COLOR_HEADING, size: 20 } },
        indent: { left: 300, right: 300 },
        spacing: { before: 200, after: 400 },
      }),

      separator(),

      // ── 1.1 ─────────────────────────────────────────────────────────────────
      heading1("1.1 Introducción"),
      para([normal("(Este apartado se redacta al finalizar la totalidad del documento, ya que sintetiza los hallazgos de todos los capítulos de la tesis.)")], { italics: true }),
      blank(),

      // ── 1.2 ─────────────────────────────────────────────────────────────────
      heading1("1.2 Presentación del Tema"),
      para([
        normal("Este trabajo de titulación propone el desarrollo e implementación de una aplicación móvil para la gestión integral de servicios de gimnasios en la ciudad de Manta, con control de membresías, pagos digitales y un módulo de venta de productos deportivos. El caso de estudio en el que se aplica y valida la solución es el gimnasio "),
        bold("Gigafit"),
        normal(", establecimiento localizado en el cantón Manta, provincia de Manabí, Ecuador."),
      ]),
      para([
        normal("El proyecto se enmarca dentro de la metodología de "),
        bold("Diseño Centrado en el Usuario (DCU)"),
        normal(", definida por la norma internacional ISO 9241-210:2019, la cual establece que los sistemas interactivos deben diseñarse tomando como punto de partida las necesidades reales, los hábitos y el contexto de uso de las personas que los van a utilizar "),
        cite("(ISO, 2019)"),
        normal(". Bajo este enfoque, la solución se compone de tres elementos interconectados: una aplicación móvil multiplataforma (React Native + Expo) orientada a los socios del gimnasio, un panel de administración web (React + Vite) para el personal administrativo, y una API RESTful construida en Laravel 12 que centraliza toda la lógica del sistema y la gestión de los datos."),
      ]),
      blank(),

      // ── 1.3 ─────────────────────────────────────────────────────────────────
      heading1("1.3 Ubicación y Contextualización de la Problemática"),
      para([
        normal("El proyecto se sitúa en el cantón "),
        bold("Manta"),
        normal(", provincia de Manabí, Ecuador. Manta es una de las ciudades con mayor actividad económica de la Costa ecuatoriana, reconocida históricamente por su industria pesquera y más recientemente por su crecimiento comercial y de servicios. En este entorno, el sector del fitness ha experimentado un crecimiento sostenido en la última década, siguiendo la misma tendencia que se observa en el resto del país."),
      ]),
      para([
        normal("A nivel nacional, el sector de gimnasios mueve aproximadamente "),
        bold("USD 43 millones anuales"),
        normal(" "),
        cite("(Universidad Politécnica Salesiana [UPS], 2023)"),
        normal(" y la competencia entre establecimientos se ha intensificado notablemente: en ciudades ecuatorianas como Quito, el número de gimnasios se ha triplicado en los últimos años "),
        cite("(Primicias, 2025a)"),
        normal(". Esta expansión también se refleja en Manta, donde han surgido nuevos centros de entrenamiento que compiten por una misma base de clientes cada vez más exigente y conectada digitalmente."),
      ]),
      blank(),

      // ── 1.4 ─────────────────────────────────────────────────────────────────
      heading1("1.4 Planteamiento del Problema"),
      heading2("1.4.1 Problematización"),
      para([
        normal("La industria del fitness en América Latina viene creciendo a buen ritmo. Según datos de la Health & Fitness Association en conjunto con ABC Fitness "),
        cite("(HFA & ABC Fitness, 2024)"),
        normal(", el mercado de clubes de salud y acondicionamiento físico en América del Sur alcanzó los "),
        bold("USD 4.630 millones en 2024"),
        normal(" y se proyecta que superará los "),
        bold("USD 7.540 millones para 2029"),
        normal(" "),
        cite("(Research and Markets, 2024)"),
        normal(". Además, la misma encuesta de la HFA indica que el "),
        bold("61% de los consumidores urbanos en América Latina"),
        normal(" hace ejercicio varias veces por semana "),
        cite("(HFA & ABC Fitness, 2024)"),
        normal("."),
      ]),
      para([
        normal("A pesar de ese crecimiento, el negocio por dentro sigue funcionando de manera muy tradicional en muchos establecimientos locales. En la ciudad de Manta, varios gimnasios —entre ellos medianos establecimientos como Gigafit— controlan sus operaciones a través de cuadernos, planillas impresas o archivos de Excel. Según "),
        bold("Mercado Fitness"),
        normal(" "),
        cite("(2025)"),
        normal(", aproximadamente el "),
        bold("70% de los negocios del sector"),
        normal(" no utiliza ningún tipo de software de gestión integral. Esta cifra es consistente con lo que documenta la CEPAL "),
        cite("(2021)"),
        normal(", que señala que una alta proporción de las mipymes de la región emplean internet de forma básica y no para automatizar o digitalizar sus procesos administrativos."),
      ]),
      para([
        normal("Para Gigafit, esta situación se traduce en problemas concretos: los clientes envían comprobantes de transferencia bancaria por WhatsApp, el administrador los revisa manualmente, no existen alertas automáticas de vencimiento de plan, y la tienda de productos deportivos no tiene ningún canal digital de ventas. Como señala el BID "),
        cite("(2022)"),
        normal(", las pequeñas empresas de servicios que adoptan herramientas digitales de gestión logran reducir errores administrativos, mejorar la experiencia del cliente y aumentar su posición competitiva en el mercado local."),
      ]),

      heading2("1.4.2 Génesis del Problema"),
      para([
        normal("El origen de esta situación en Gigafit no es un descuido, sino el resultado natural de cómo se formó el negocio. Como ocurre con la mayoría de las pequeñas empresas de servicios en Ecuador, el gimnasio nació con un enfoque puesto en el espacio físico y el equipamiento, sin planificar desde el inicio una estructura tecnológica que acompañara su crecimiento."),
      ]),
      para([
        normal("Con el tiempo, y a medida que la base de socios aumentó, los registros manuales empezaron a ser insuficientes. Las transferencias bancarias se convirtieron en el método de pago más usado, dado que el efectivo perdió protagonismo especialmente después de la pandemia. Pero sin una plataforma que centralizara esa información, el proceso quedó atrapado en una dinámica informal: el cliente transfiere, toma una foto, la envía por WhatsApp, y el administrador responde cuando puede. Esta génesis explica por qué el problema no es solo técnico, sino también cultural y organizacional: el negocio creció sin que sus procesos administrativos evolucionaran al mismo ritmo "),
        cite("(CEPAL, 2021)"),
        normal("."),
      ]),

      heading2("1.4.3 Estado Actual del Problema"),
      para([normal("En el momento de plantear esta investigación, el gimnasio Gigafit presenta los siguientes problemas operativos identificados:")]),
      numbered("Sin sistema de membresías digital: El control de qué cliente tiene el plan activo, vencido o pendiente de pago se lleva de forma manual, lo que genera errores y omisiones frecuentes.", 1),
      numbered("Validación informal de pagos: Los comprobantes de transferencia bancaria llegan por mensajería instantánea y se aprueban sin trazabilidad, dificultando la conciliación financiera.", 2),
      numbered("Sin alertas de vencimiento: Los socios no reciben notificaciones cuando su plan está próximo a vencer, lo que genera morosidad involuntaria.", 3),
      numbered("Venta de productos sin canal digital: La tienda de suplementos, ropa y accesorios no cuenta con ninguna plataforma e-commerce, limitando las ventas solo a la presencialidad.", 4),
      numbered("Baja competitividad frente a cadenas modernizadas: La expansión de cadenas con aplicaciones propias aumenta la presión sobre los establecimientos independientes que no ofrecen experiencias digitales similares (Mordor Intelligence, 2024).", 5),
      blank(),

      // ── 1.5 ─────────────────────────────────────────────────────────────────
      heading1("1.5 Diagrama Causa – Efecto del Problema"),
      para([
        normal("A continuación se presenta la Tabla del Diagrama de Ishikawa que organiza las principales causas que generan la ineficiencia operativa identificada en el gimnasio Gigafit:"),
      ]),
      blank(),
      ishikawaTable(),
      blank(),
      para([
        new TextRun({ text: "Tabla 1. Diagrama Causa-Efecto (Ishikawa) del Gimnasio Gigafit.", font: FONT, size: 20, italics: true }),
      ], { alignment: AlignmentType.CENTER }),
      blank(),

      // ── 1.6 ─────────────────────────────────────────────────────────────────
      heading1("1.6 Objetivos de la Investigación"),
      heading2("1.6.1 Objetivo General"),
      para([
        normal("Desarrollar una aplicación móvil para la gestión de membresías, pagos digitales y venta de productos deportivos, dirigida al gimnasio Gigafit de la ciudad de Manta, que permitirá centralizar el control de clientes e inventario."),
      ]),
      heading2("1.6.2 Objetivos Específicos"),
      numbered("Diseñar la arquitectura del sistema y las interfaces de usuario, bajo la metodología de Diseño Centrado en el Usuario (DCU), para la administración de membresías, catálogo de productos y registros de pago.", 1),
      numbered("Desarrollar los módulos de la aplicación móvil para la gestión de membresías, consulta de productos deportivos y registro de comprobantes de pago por transferencia bancaria.", 2),
      numbered("Desarrollar el panel de administración web para la validación de comprobantes de pago, control de suscripciones y gestión del inventario de productos.", 3),
      numbered("Realizar el despliegue del sistema en un entorno de producción para garantizar su disponibilidad y correcto funcionamiento.", 4),
      blank(),

      // ── 1.7 ─────────────────────────────────────────────────────────────────
      heading1("1.7 Justificación de la Investigación"),
      heading3("Justificación Técnica"),
      para([
        normal("Desde la perspectiva del desarrollo de software, existe hoy una brecha evidente entre las herramientas disponibles en el mercado y lo que realmente usan pequeños negocios de servicios como los gimnasios independientes de Manta. Las soluciones comerciales existentes son costosas, no están adaptadas al contexto ecuatoriano —donde el pago por transferencia bancaria con comprobante es la norma— y no permiten personalizaciones sin conocimientos técnicos avanzados "),
        cite("(Comparasoftware.ec, 2023)"),
        normal(". La arquitectura propuesta: API RESTful en Laravel 12, aplicación móvil en React Native + Expo y panel web en React + Vite, sigue los estándares actuales de desarrollo desacoplado."),
      ]),
      heading3("Justificación Metodológica"),
      para([
        normal("La aplicación de la metodología de Diseño Centrado en el Usuario (DCU), definida por la norma ISO 9241-210:2019, posiciona las necesidades reales de los socios y del personal en el centro del proceso de diseño. Sistemas diseñados bajo este enfoque logran mayores tasas de adopción, menor necesidad de soporte técnico post-lanzamiento y una experiencia de usuario significativamente mejor "),
        cite("(ISO, 2019)"),
        normal("."),
      ]),
      heading3("Justificación Económica y Social"),
      para([
        normal("Para el gimnasio Gigafit, la adopción del sistema representa una reducción directa en el tiempo dedicado a tareas administrativas repetitivas y la posibilidad de activar un canal de venta digital para sus productos deportivos. Según el BID "),
        cite("(2022)"),
        normal(", las pequeñas empresas que incorporan herramientas de gestión digital reportan mejoras medibles en su eficiencia operativa y en su capacidad de retener clientes a largo plazo."),
      ]),
      blank(),

      // ── 1.8 ─────────────────────────────────────────────────────────────────
      heading1("1.8 Impactos Esperados"),
      heading2("1.8.1 Impacto Tecnológico"),
      para([
        normal("El proyecto introduce en un negocio local una arquitectura de software moderna, escalable y basada en tecnologías de código abierto. Más allá del caso de Gigafit, el sistema puede servir como referente replicable para otros gimnasios independientes de Manta y Manabí que enfrentan los mismos problemas operativos."),
      ]),
      heading2("1.8.2 Impacto Social"),
      para([
        normal("Dar a los socios del gimnasio la posibilidad de gestionar su membresía, ver el estado de su plan y registrar sus pagos desde su celular mejora directamente su experiencia. La HFA & ABC Fitness "),
        cite("(2024)"),
        normal(" señala que el 61% de los consumidores urbanos en América Latina ya ejercita varias veces por semana y espera acceder a los servicios de su gimnasio con la misma facilidad que usan otras apps en su día a día."),
      ]),
      heading2("1.8.3 Impacto Ecológico"),
      para([
        normal("La digitalización de los procesos del gimnasio implica la eliminación progresiva de carnets físicos, recibos impresos, fichas de inscripción en papel y planillas de control de asistencia. Al reemplazar estos elementos con credenciales digitales y comprobantes en formato PDF almacenados en la nube, el negocio reduce su consumo de papel de forma directa."),
      ]),
      blank(),
      separator(),

      // ── REFERENCIAS ─────────────────────────────────────────────────────────
      heading1("Referencias Bibliográficas"),

      refEntry(
        "Banco Interamericano de Desarrollo [BID]. (2022).",
        "The 360° on digital transformation in firms in Latin America and the Caribbean (IDB Monograph 1067).",
        "https://publications.iadb.org/en/360-digital-transformation-firms-latin-america-and-caribbean"
      ),
      refEntry(
        "Comisión Económica para América Latina y el Caribe [CEPAL]. (2021).",
        "Transformación digital de las mipymes: elementos para el diseño de políticas. Naciones Unidas.",
        "https://repositorio.cepal.org/server/api/core/bitstreams/f1c7d242-b883-4a0b-85ef-b1d5642d6a52/content"
      ),
      refEntry(
        "Comparasoftware.ec. (2023).",
        "Mejores software para gimnasios en Ecuador.",
        "https://www.comparasoftware.ec/software/gimnasios"
      ),
      refEntry(
        "Health & Fitness Association [HFA] & ABC Fitness. (2024).",
        "Latin Americans embrace fitness facilities as key to an active lifestyle [Comunicado de prensa]. GlobeNewswire.",
        "https://www.globenewswire.com/news-release/2024/12/04/2991146/0/en/Latin-Americans-Embrace-Fitness-Facilities-as-Key-to-an-Active-Lifestyle.html"
      ),
      refEntry(
        "International Organization for Standardization [ISO]. (2019).",
        "ISO 9241-210:2019. Ergonomics of human-system interaction — Part 210: Human-centred design for interactive systems.",
        "https://www.iso.org/standard/77520.html"
      ),
      refEntry(
        "Mercado Fitness. (2025).",
        "El 70% de los gimnasios aún no usa tecnología para gestionar su negocio.",
        "https://www.mercadofitness.com/el-70-de-los-gimnasios-aun-no-usa-tecnologia-para-gestionar-su-negocio/"
      ),
      refEntry(
        "Mordor Intelligence. (2024).",
        "South America health and fitness club market — share analysis, industry trends & statistics, growth forecasts 2019–2029.",
        "https://www.mordorintelligence.com/industry-reports/south-america-health-and-fitness-club-market"
      ),
      refEntry(
        "Norman, D. A. (2013).",
        "The design of everyday things (Edición revisada y ampliada). Basic Books.",
        "https://www.basicbooks.com/titles/don-norman/the-design-of-everyday-things/9780465050659/"
      ),
      refEntry(
        "Primicias. (2025a).",
        "¿Quién es el más 'tuco' en el mercado del fitness? Los gimnasios están en auge en Ecuador.",
        "https://www.primicias.ec/economia/fitness-gimnasios-ecuador-negocio-crecimiento/"
      ),
      refEntry(
        "Primicias. (2025b).",
        "¿Negocio de moda? En Quito, el número de gimnasios se está triplicando.",
        "https://www.primicias.ec/economia/quito-gimnasios-fitness-crecimiento-2025/"
      ),
      refEntry(
        "Research and Markets. (2024).",
        "South America health and fitness club market size & share analysis — growth trends & forecasts (2024–2029).",
        "https://www.researchandmarkets.com/reports/south-america-health-fitness-club-market"
      ),
      refEntry(
        "Universidad Politécnica Salesiana [UPS]. (2023).",
        "Análisis del sector fitness y bienestar en Ecuador. Repositorio UPS.",
        "https://dspace.ups.edu.ec"
      ),

      blank(),
      new Paragraph({
        children: [new TextRun({ text: "— Fin del Capítulo I —", font: FONT, size: SIZE, italics: true, color: "888888" })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
      }),
    ],
  }],
});

const outputPath = path.join(__dirname, "..", "Capitulo_I_GimApp.docx");
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log("Documento Word generado en:", outputPath);
});
