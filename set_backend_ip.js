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

const ip = getLocalIp();
if (!ip) {
  console.error('No se pudo detectar la IP local.');
  process.exit(1);
}

const envPath = path.join(__dirname, 'mobile-app', '.env.js');
const content = `// .env.js\n// Archivo generado automáticamente\n\nexport const DEV_BACKEND_IP = '${ip}'; // Detectado automáticamente\n`;

fs.writeFileSync(envPath, content);
console.log(`IP local detectada: ${ip}`);
console.log(`Archivo .env.js actualizado correctamente.`);
