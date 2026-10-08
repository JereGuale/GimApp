const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  VerticalAlign,
  ShadingType,
} = require("docx");
const fs = require("fs");
const path = require("path");

// ─── Helpers ─────────────────────────────────────────────────────────────────

const subtitulo = (text) =>
  new Paragraph({
    children: [
      new TextRun({ text, bold: true, size: 24, font: "Times New Roman", color: "2E74B5" }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { before: 300, after: 200 },
  });

const etiqueta = (text) =>
  new Paragraph({
    children: [new TextRun({ text, bold: true, size: 22, font: "Times New Roman" })],
    spacing: { before: 160, after: 80 },
  });

const parrafoNormal = (text) =>
  new Paragraph({
    children: [new TextRun({ text, size: 22, font: "Times New Roman" })],
    spacing: { after: 100 },
  });

const lineaEspacio = () =>
  new Paragraph({
    children: [new TextRun({ text: "_".repeat(100), size: 20, font: "Times New Roman", color: "888888" })],
    spacing: { before: 60, after: 60 },
  });

const separador = () =>
  new Paragraph({
    children: [new TextRun({ text: "", size: 22 })],
    spacing: { before: 200, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "2E74B5" } },
  });

const pregunta = (num, texto) => [
  new Paragraph({
    children: [new TextRun({ text: `${num}. ${texto}`, bold: true, size: 22, font: "Times New Roman" })],
    spacing: { before: 200, after: 80 },
  }),
  lineaEspacio(),
  lineaEspacio(),
  lineaEspacio(),
];

const espacioFirma = () =>
  new Paragraph({
    children: [new TextRun({ text: "Firma del entrevistado: _________________________     Fecha: ___________", size: 22, font: "Times New Roman" })],
    spacing: { before: 400, after: 200 },
  });

const paginaBlanca = () =>
  new Paragraph({ children: [new TextRun({ text: "", size: 22 })], pageBreakBefore: true });

const tablaEncabezado = (tipo) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.SOLID, color: "1F3864" },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                children: [new TextRun({ text: "PROYECTO DE TITULACIÓN — GimApp | Gymnasio Gigafit, Manta", bold: true, size: 20, font: "Times New Roman", color: "FFFFFF" })],
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({
                children: [new TextRun({ text: tipo, bold: true, size: 22, font: "Times New Roman", color: "FFD700" })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 100 },
              }),
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
    ],
  });

const tablaObservacion = () => {
  const headerCell = (text) =>
    new TableCell({
      shading: { type: ShadingType.SOLID, color: "2E74B5" },
      children: [
        new Paragraph({
          children: [new TextRun({ text, bold: true, size: 20, font: "Times New Roman", color: "FFFFFF" })],
          alignment: AlignmentType.CENTER,
        }),
      ],
    });

  const dataRow = (aspecto) =>
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: aspecto, size: 20, font: "Times New Roman" })] })],
          width: { size: 45, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: "   ", size: 20 })] })],
          width: { size: 55, type: WidthType.PERCENTAGE },
        }),
      ],
    });

  const aspectos = [
    "¿Usan cuaderno, Excel u otro sistema para registrar socios?",
    "¿Cómo validan un pago cuando llega un cliente?",
    "¿Cuánto tiempo aproximado toma la validación de un pago?",
    "¿Hay productos a la venta y cómo se controla el inventario?",
    "¿El administrador usa celular durante la atención al cliente?",
    "¿Los clientes pagan en efectivo, transferencia o ambos?",
    "¿Se observa alguna fricción o demora en la recepción?",
    "Observaciones adicionales:",
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [headerCell("Aspecto a observar"), headerCell("Observación registrada")] }),
      ...aspectos.map(dataRow),
    ],
  });
};

// ─── Bloque reutilizable de preguntas para socios ────────────────────────────

const preguntasSocios = (copia) => [
  tablaEncabezado(`GUÍA DE ENTREVISTA — SOCIO ACTIVO (Copia ${copia} de 3)`),
  new Paragraph({ children: [new TextRun({ text: "", size: 22 })], spacing: { after: 200 } }),
  parrafoNormal("Objetivo: Conocer la experiencia actual de los socios con el proceso de pago y sus expectativas sobre una aplicación móvil del gimnasio."),
  parrafoNormal("Instrucciones: Responda con sus propias palabras. Su identidad es completamente opcional."),
  new Paragraph({ children: [new TextRun({ text: "", size: 22 })], spacing: { after: 100 } }),
  etiqueta("Datos del participante:"),
  parrafoNormal("Nombre (opcional): _________________________   Tiempo como socio: _________________________"),
  parrafoNormal("Fecha: _________________________"),
  separador(),
  subtitulo("EJE 1: Proceso de pago actual"),
  ...pregunta(1, "¿Cómo realiza actualmente el pago de su membresía (efectivo, transferencia, otro)? ¿Le resulta cómodo ese proceso?"),
  ...pregunta(2, "¿Sabe siempre con exactitud cuántos días le quedan en su plan o cuándo debe renovar?"),
  ...pregunta(3, "¿Ha tenido algún inconveniente con el registro de su pago (pago no reconocido, cobro incorrecto, demoras en confirmación)?"),
  subtitulo("EJE 2: Expectativas tecnológicas"),
  ...pregunta(4, "¿Estaría dispuesto a usar una aplicación móvil para ver el estado de su membresía y registrar sus pagos desde el celular?"),
  ...pregunta(5, "¿Qué funciones le gustaría tener en esa aplicación? (Ej: ver fecha de vencimiento, subir comprobante, ver productos, recibir recordatorios)"),
  ...pregunta(6, "¿Hay algo del servicio actual del gimnasio que le gustaría que mejorara?"),
  espacioFirma(),
  paginaBlanca(),
];

// ─── DOCUMENTO PRINCIPAL ─────────────────────────────────────────────────────

const doc = new Document({
  sections: [
    {
      properties: {
        page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } },
      },
      children: [
        // ══════ 1. GUÍA ADMINISTRADOR ══════
        tablaEncabezado("GUÍA DE ENTREVISTA — ADMINISTRADOR / PROPIETARIO"),
        new Paragraph({ children: [new TextRun({ text: "", size: 22 })], spacing: { after: 200 } }),
        parrafoNormal("Objetivo: Identificar los procesos actuales de gestión administrativa del gimnasio Gigafit, sus principales dificultades operativas y las funcionalidades requeridas en el sistema GimApp."),
        parrafoNormal("Instrucciones: Responda con sus propias palabras. No hay respuestas incorrectas."),
        new Paragraph({ children: [new TextRun({ text: "", size: 22 })], spacing: { after: 100 } }),
        etiqueta("Datos del participante:"),
        parrafoNormal("Nombre (opcional): _________________________   Cargo: _________________________"),
        parrafoNormal("Fecha: _________________________   Duración aproximada: _________________________"),
        separador(),

        subtitulo("EJE 1: Gestión actual de membresías"),
        ...pregunta(1, "¿Cómo registra actualmente las membresías de sus clientes (fecha de inicio, plan contratado, datos del socio)?"),
        ...pregunta(2, "¿Cómo controla qué clientes tienen el plan vigente y cuáles lo tienen vencido?"),
        ...pregunta(3, "¿Con qué frecuencia ocurre que un cliente con membresía vencida ingresa al gimnasio sin que usted lo detecte?"),

        subtitulo("EJE 2: Control de pagos"),
        ...pregunta(4, "¿Cómo recibe y verifica los comprobantes de pago de sus clientes actualmente?"),
        ...pregunta(5, "¿Cuánto tiempo diario dedica a revisar transferencias y confirmar pagos? ¿Qué herramienta usa (WhatsApp, correo, otro)?"),
        ...pregunta(6, "¿Ha tenido pérdidas económicas por pagos no registrados o por clientes que no renovaron sin que usted lo notara?"),

        subtitulo("EJE 3: Gestión de productos e inventario"),
        ...pregunta(7, "¿Vende productos deportivos (suplementos, accesorios, ropa)? ¿Cómo lleva el control del inventario y las ventas actualmente?"),

        subtitulo("EJE 4: Expectativas del sistema"),
        ...pregunta(8, "¿Qué funciones considera absolutamente indispensables en una aplicación de gestión para su gimnasio?"),

        espacioFirma(),
        paginaBlanca(),

        // ══════ 2. GUÍAS SOCIOS (3 copias) ══════
        ...preguntasSocios("1"),
        ...preguntasSocios("2"),
        ...preguntasSocios("3"),

        // ══════ 3. FICHA DE OBSERVACIÓN ══════
        tablaEncabezado("FICHA DE OBSERVACIÓN DIRECTA — RECEPCIÓN GIGAFIT"),
        new Paragraph({ children: [new TextRun({ text: "", size: 22 })], spacing: { after: 200 } }),
        parrafoNormal("Objetivo: Registrar empíricamente el funcionamiento actual de los procesos administrativos del gimnasio Gigafit mediante observación directa en su contexto natural."),
        new Paragraph({ children: [new TextRun({ text: "", size: 22 })], spacing: { after: 100 } }),
        etiqueta("Datos de la observación:"),
        parrafoNormal("Investigador: _________________________   Fecha: _________________________"),
        parrafoNormal("Hora de inicio: _____________   Hora de fin: _____________   Lugar: Gimnasio Gigafit, Manta"),
        separador(),
        new Paragraph({
          children: [new TextRun({ text: "Registro de observaciones:", bold: true, size: 22, font: "Times New Roman" })],
          spacing: { before: 200, after: 200 },
        }),
        tablaObservacion(),
        new Paragraph({ children: [new TextRun({ text: "", size: 22 })], spacing: { after: 300 } }),
        parrafoNormal("Firma del investigador: _________________________     Fecha: ___________"),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  const outputPath = path.join(__dirname, "Instrumentos_Investigacion_GimApp.docx");
  fs.writeFileSync(outputPath, buffer);
  console.log("✅ Documento generado correctamente:");
  console.log("   " + outputPath);
});
