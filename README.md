# FisiChecker - Frontend

Frontend del proyecto FisiChecker, una aplicación web para análisis de accesibilidad WCAG de sitios web.

## 📋 Descripción del Proyecto

FisiChecker es una herramienta automatizada que evalúa la accesibilidad de sitios web según los estándares WCAG 2.1. El frontend proporciona una interfaz intuitiva para realizar auditorías, visualizar resultados y gestionar análisis de accesibilidad.

## 🔗 Repositorios

- **Frontend**: [FisiChecker-Project-Front](https://github.com/JhosepSF/FisiChecker-Project-Front)
- **Backend**: [FisiChecker-Project-Back](https://github.com/JhosepSF/FisiChecker-Project-Back)

## 🚀 Características

- Análisis automático de accesibilidad WCAG
- Auditoría de múltiples URLs
- Visualización de resultados detallados
- Generación de reportes
- Evaluaciones por niveles de conformidad (A, AA, AAA)
- Integración con IA para análisis avanzados

## 📦 Instalación

### Requisitos previos

- Node.js (v16 o superior)
- npm o yarn

### Pasos de instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/JhosepSF/FisiChecker-Project-Front.git
cd FisiChecker-Project-Front
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno (si es necesario):
```bash
cp .env.example .env
```

## 🏃 Ejecución

### Modo desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### Modo producción

```bash
npm run build
npm run preview
```

## 🛠️ Herramientas y Tecnologías

- **React** - Librería de UI
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Framework CSS
- **PostCSS** - Herramientas CSS avanzadas

### Scripts disponibles

- `npm run dev` - Inicia servidor de desarrollo
- `npm run build` - Compila para producción
- `npm run preview` - Vista previa de build de producción
- `npm run lint` - Ejecuta ESLint

## 📁 Estructura del Proyecto

```
src/
├── assets/       - Archivos estáticos
├── modules/      - Módulos principales de la aplicación
├── styles/       - Estilos CSS/Tailwind
├── App.jsx       - Componente principal
└── main.jsx      - Punto de entrada
```

## 🔌 Integración Backend

El frontend se conecta con el backend de FisiChecker para:
- Realizar auditorías de accesibilidad
- Obtener resultados de análisis
- Gestionar usuarios y proyectos

Asegúrate de que el servidor backend esté ejecutándose antes de usar la aplicación.

## 📝 Requisitos del Sistema

- Navegador moderno (Chrome, Firefox, Safari, Edge)
- Conexión a internet
- Backend de FisiChecker ejecutándose

## 👥 Contribuciones

Las contribuciones son bienvenidas. Por favor, fork el repositorio y create un pull request con tus cambios.

## 📄 Licencia

Este proyecto está bajo licencia [especificar licencia]

## ✉️ Contacto

Para más información sobre el proyecto, visita el repositorio principal o contacta al equipo de desarrollo.
