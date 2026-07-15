# 🏋️ GimApp — Guía de Ejecución Local

Este repositorio contiene los tres componentes de la aplicación del Gimnasio: el Backend (Laravel), el Panel de Administración (React + Vite) y la Aplicación Móvil (React Native + Expo).

A continuación se detalla cómo encender y ejecutar cada uno de ellos en tu entorno local.

---

## 1. 🖥️ Backend (Laravel)
El servidor que gestiona la base de datos y la API de la aplicación.

1. Abre una terminal y ve a la carpeta del backend:
   ```bash
   cd GymAppBackend
   ```
2. Asegúrate de tener tu servidor de base de datos (PostgreSQL/MySQL) encendido.
3. Ejecuta el servidor de desarrollo de Laravel:
   ```bash
   php artisan serve
   ```
   *El backend estará disponible en: `http://127.0.0.1:8000`*

---

## 2. 📊 Panel de Administración (GymAppAdmin)
La interfaz web premium diseñada para que los administradores gestionen clientes, planes, productos y reportes.

1. Abre otra terminal independiente y ve a la carpeta del admin:
   ```bash
   cd GymAppAdmin
   ```
2. Si es la primera vez o has clonado el proyecto recientemente, instala las dependencias (como `lucide-react`):
   ```bash
   npm install
   ```
3. Ejecuta el servidor local de Vite:
   ```bash
   npm run dev
   ```
   *El panel de administración estará disponible en: `http://localhost:5173`*

---

## 3. 📱 Aplicación Móvil (GymAppFrontend)
La aplicación para los usuarios y clientes del gimnasio construida con React Native y Expo.

1. Abre una tercera terminal y ve a la carpeta del frontend móvil:
   ```bash
   cd GymAppFrontend
   ```
2. Genera y actualiza la detección automática de tu IP local para que la app se conecte al backend de tu computadora (ejecuta el script de detección):
   ```bash
   node set_backend_ip.js
   ```
3. Instala las dependencias si no lo has hecho:
   ```bash
   npm install
   ```
4. Inicia el servidor de Expo:
   ```bash
   npm start
   ```
   *Escanea el código QR generado en la terminal con la aplicación de Expo Go en tu celular (iOS/Android) o presiona `a` para abrir el emulador de Android o `i` para iOS.*
