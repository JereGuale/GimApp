const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, '..', 'Guia_Dependencias_GimApp.pdf');
const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });

doc.pipe(fs.createWriteStream(outputPath));

// Colors
const PRIMARY_COLOR = '#1E3A8A';   // Dark Blue
const SECONDARY_COLOR = '#0D9488'; // Teal
const TEXT_DARK = '#1F2937';       // Gray 800
const LIGHT_BG = '#F3F4F6';        // Gray 100
const BORDER_COLOR = '#E5E7EB';    // Gray 200

// Helper for Section Headers
function drawHeader(title) {
    doc.rect(40, doc.y, 515, 26).fill(PRIMARY_COLOR);
    doc.fillColor('#FFFFFF').fontSize(12).font('Helvetica-Bold').text(title, 48, doc.y - 20);
    doc.fillColor(TEXT_DARK).font('Helvetica').fontSize(10);
    doc.moveDown(0.8);
}

// Helper for Table Header
function drawTableHeader(cols) {
    const startY = doc.y;
    doc.rect(40, startY, 515, 20).fill('#374151');
    doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
    
    let x = 45;
    cols.forEach(col => {
        doc.text(col.name, x, startY + 5, { width: col.width, align: 'left' });
        x += col.width;
    });
    doc.fillColor(TEXT_DARK).font('Helvetica').fontSize(9);
    doc.y = startY + 24;
}

// Helper for Table Rows
function drawTableRow(row, cols, isEven) {
    const rowY = doc.y;
    
    // Calculate row height based on longest text
    doc.fontSize(8.5).font('Helvetica');
    let maxHeight = 0;
    cols.forEach((col, idx) => {
        const height = doc.heightOfString(row[idx], { width: col.width - 6 });
        if (height > maxHeight) maxHeight = height;
    });
    const padding = 6;
    const finalHeight = maxHeight + padding * 2;

    // Check page overflow
    if (rowY + finalHeight > 780) {
        doc.addPage();
        drawTableHeader(cols);
        return drawTableRow(row, cols, isEven);
    }

    if (isEven) {
        doc.rect(40, rowY, 515, finalHeight).fill('#F9FAFB');
    }
    doc.rect(40, rowY, 515, finalHeight).strokeColor(BORDER_COLOR).stroke();

    let x = 45;
    cols.forEach((col, idx) => {
        doc.fillColor(idx === 0 ? PRIMARY_COLOR : TEXT_DARK)
           .font(idx === 0 ? 'Helvetica-Bold' : 'Helvetica')
           .fontSize(8.5)
           .text(row[idx], x, rowY + padding, { width: col.width - 6 });
        x += col.width;
    });

    doc.y = rowY + finalHeight;
}

// --- DOCUMENT CONTENT ---

// Title Header Banner
doc.rect(0, 0, 595, 80).fill(PRIMARY_COLOR);
doc.fillColor('#FFFFFF').fontSize(18).font('Helvetica-Bold').text('GUÍA TÉCNICA DE DEPENDENCIAS', 40, 22);
doc.fontSize(11).font('Helvetica').text('Proyecto de Tesis: GimApp — Gimnasio Gigafit (Manta, Ecuador)', 40, 46);

doc.y = 95;

// Document Info Box
doc.rect(40, doc.y, 515, 45).fill('#EFF6FF');
doc.rect(40, doc.y - 45, 515, 45).strokeColor('#BFDBFE').stroke();
doc.fillColor('#1E40AF').fontSize(9.5).font('Helvetica-Bold').text('INFORMACIÓN DE ARQUITECTURA', 50, doc.y - 38);
doc.fillColor(TEXT_DARK).font('Helvetica').fontSize(8.5)
   .text('Esta guía documenta las librerías y marcos de trabajo utilizados en las 3 capas del ecosistema (Backend API, App Móvil y Panel Web Admin), su versión y justificación técnica para el informe de tesis.', 50, doc.y - 24, { width: 495 });

doc.y = 150;

// Section 1: Backend
drawHeader('1. BACKEND API (GymAppBackend — Laravel 12 / PHP)');

const colsBackend = [
    { name: 'Dependencia', width: 140 },
    { name: 'Versión', width: 65 },
    { name: 'Función en el Software', width: 310 }
];

drawTableHeader(colsBackend);

const dataBackend = [
    ['laravel/framework', '^12.0', 'Framework principal backend. Provee la estructura MVC, motor de enrutamiento API RESTful, migraciones de datos y el ORM Eloquent.'],
    ['laravel/sanctum', '^4.3', 'Autenticación mediante Tokens de Acceso (Bearer Tokens) seguros para usuarios, entrenadores y administradores.'],
    ['spatie/laravel-permission', '^6.24', 'Sistema de Control de Acceso Basado en Roles y Permisos (RBAC: Admin, Cliente, Entrenador).'],
    ['league/flysystem-aws-s3-v3', '^3.32', 'Gestión e integración de almacenamiento de imágenes y documentos en la nube (AWS S3 / Supabase Storage).'],
    ['laravel/tinker', '^2.10', 'Consola interactiva REPL para depuración y manipulación de datos en tiempo de ejecución.'],
    ['phpunit/phpunit', '^11.5', '(Dev) Framework de pruebas unitarias e integradas para la validación de endpoints API.'],
    ['fakerphp/faker', '^1.23', '(Dev) Generador de datos falsos de prueba para poblar tablas mediante Seeders.']
];

dataBackend.forEach((row, i) => drawTableRow(row, colsBackend, i % 2 === 0));

doc.moveDown(1.5);

// Section 2: Mobile
drawHeader('2. APLICACIÓN MÓVIL (GymAppFrontend — React Native / Expo)');

const colsMobile = [
    { name: 'Dependencia', width: 155 },
    { name: 'Versión', width: 60 },
    { name: 'Función en la App Móvil', width: 300 }
];

drawTableHeader(colsMobile);

const dataMobile = [
    ['expo', '^54.0.33', 'Framework multiplataforma para compilación, ejecución y acceso a APIs nativas de Android e iOS.'],
    ['react / react-native', '19.1 / 0.81', 'Motor base para la creación de componentes de interfaz de usuario nativos.'],
    ['@react-navigation/*', '^6.1.9', 'Navegación entre pantallas (Stack) y barra de navegación inferior (Bottom Tabs).'],
    ['axios', '^1.6.7', 'Cliente HTTP para consumo de servicios de la API REST de Laravel.'],
    ['async-storage', '^2.2.0', 'Almacenamiento local seguro del Token Sanctum y datos de sesión en el dispositivo.'],
    ['expo-image', '^55.0.5', 'Carga optimizada y almacenamiento en caché de imágenes de productos y banners.'],
    ['expo-image-picker', '^17.0.10', 'Acceso a la cámara y galería para captura de fotos de perfil y recibos.'],
    ['expo-linear-gradient', '~15.0.8', 'Renderizado de gradientes de color visuales para la interfaz premium.'],
    ['expo-print & expo-sharing', '^55.0', 'Generación de recibos/comprobantes de pago en PDF e impresión/compartición.'],
    ['react-native-reanimated', '~4.1.1', 'Motor de animaciones de alto rendimiento a 60fps para la interfaz.'],
    ['react-native-modal', '^14.0.0', 'Renderizado de modales emergentes interactivas para detalles y compras.'],
    ['@react-native-picker/picker', '^2.11.4', 'Componente selector desplegable para categorías, productos y opciones.']
];

dataMobile.forEach((row, i) => drawTableRow(row, colsMobile, i % 2 === 0));

doc.moveDown(1.5);

// Section 3: Admin Web
drawHeader('3. PANEL DE ADMINISTRACIÓN WEB (GymAppAdmin — React / Vite)');

const colsAdmin = [
    { name: 'Dependencia', width: 140 },
    { name: 'Versión', width: 65 },
    { name: 'Función en el Panel Admin', width: 310 }
];

drawTableHeader(colsAdmin);

const dataAdmin = [
    ['react / react-dom', '^19.2.7', 'Librería principal para el desarrollo de la interfaz de usuario basada en componentes.'],
    ['vite', '^8.1.1', 'Empaquetador y entorno de desarrollo ultra rápido para aplicaciones SPA.'],
    ['react-router-dom', '^7.18.1', 'Enrutamiento SPA para la navegación entre módulos (Dashboard, Clientes, Reportes, Stock).'],
    ['lucide-react', '^0.468.0', 'Iconografía vectorial moderna para tarjetas analíticas, tablas y botones del panel.'],
    ['oxlint', '^1.71.0', '(Dev) Herramienta de análisis estático de código para garantizar calidad en JavaScript/React.']
];

dataAdmin.forEach((row, i) => drawTableRow(row, colsAdmin, i % 2 === 0));

// Footer on all pages
const pages = doc.bufferedPageRange();
for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc.fillColor('#9CA3AF').fontSize(8).font('Helvetica')
       .text(`GimApp — Guía de Dependencias Técnicas | Página ${i + 1} de ${pages.count}`, 40, 800, { align: 'center', width: 515 });
}

doc.end();
console.log('PDF generado exitosamente en:', outputPath);
