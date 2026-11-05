// set_backend_ip.js
// Script para detectar la IP local y actualizar .env.js automáticamente

const os = require('os');
const fs = require('fs');
const path = require('path');


function getLocalIp() {
  const interfaces = os.networkInterfaces();
  // Priorizar interfaces Wi-Fi
  const wifiNames = ['Wi-Fi', 'WiFi', 'WLAN', 'LAN inalámbrica Wi-Fi', 'LAN inalámbrica Wi-Fi 2', 'Wi-Fi 2'];
  for (const name of wifiNames) {
    if (interfaces[name]) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal && iface.address.startsWith('192.168.')) {
          return iface.address;
        }
      }
    }
  }
  // Si no se encuentra en Wi-Fi, buscar la primera IPv4 válida
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal && iface.address.startsWith('192.168.')) {
        return iface.address;
      }
    }
  }
  return null;
}

let ip = getLocalIp();
if (!ip) {
  console.warn('No se pudo detectar la IP local de red. Usando 127.0.0.1 como fallback.');
  ip = '127.0.0.1';
}

const DEFAULT_GOOGLE_CLIENT_ID = '1084206665583-d1rukiunhp4aomvnnpe1re99t2r0ob7k.apps.googleusercontent.com';

const envPath = path.join(__dirname, '.env.js');
let existingGoogleClientId = '';
if (fs.existsSync(envPath)) {
  const currentContent = fs.readFileSync(envPath, 'utf8');
  const match = currentContent.match(/export const GOOGLE_WEB_CLIENT_ID = ['"]([^'"]*)['"]/);
  if (match && match[1]) {
    existingGoogleClientId = match[1];
  }
}

if (!existingGoogleClientId) {
  existingGoogleClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;
}

const content = `// .env.js
// Archivo generado automáticamente

export const DEV_BACKEND_IP = '${ip}'; // Detectado automáticamente
export const GOOGLE_WEB_CLIENT_ID = '${existingGoogleClientId}';
`;

fs.writeFileSync(envPath, content);
console.log(`IP local detectada: ${ip}`);
console.log(`Archivo .env.js actualizado correctamente.`);
