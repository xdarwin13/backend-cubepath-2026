# EduCubeIA - Backend

El backend de EduCubeIA es una API RESTful desarrollada con **Node.js**, **Express**, y **TypeScript**. Actúa como el motor principal de la plataforma, coordinando desde la gestión de usuarios, almacenamiento y base de datos relacional, hasta la interacción central con servicios de Inteligencia Artificial como **Groq API** y otros proveedores de contenido dinámico.

## 🚀 Características Principales

1. **Gestión de Base de Datos**: Integración robusta sobre **PostgreSQL** mediante el ORM **Sequelize**, manejando validación de la capa de datos de Usuarios, Cursos, Módulos, Lecciones e Inscripciones de forma jerárquica.
2. **Generación con IA**: 
   - **Textos:** Estructuración de sílabos (Course Outline), y redacción de contenido extenso en base a simples ideas u objetivos usando los LLMs en Groq.
   - **Voces (Text-to-Speech):** Conversión del contenido del curso a audio usando modelos avanzados de Groq TTS.
3. **Imágenes Automatizadas**: Integración con **Pexels API** para proporcionar ilustraciones relevantes dinámicamente según el contenido que genera la IA.
4. **Autenticación Segura**: Login y registro seguro mediante contraseñas cifradas y JSON Web Tokens (`JWT` middleware).
5. **Control Basado en Roles (RBAC)**: Distingue los permisos entre Administradores, Profesores (creadores) y Estudiantes (quienes registran progresos).

## 🛠 Instalación y Configuración Local

1. Entra al directorio del backend e instala todas las dependencias:
   ```bash
   cd backend
   npm install
   ```

2. Prepara tu archivo de variables de entorno (puedes omitir este paso si ya usas Docker o ya definiste el tuyo):
   ```bash
   cp .env.example .env
   ```

3. Inicia el servidor de desarrollo en tu máquina (este comando usa `nodemon` y `ts-node` para auto-recarga con TypeScript):
   ```bash
   npm run dev
   ```

   Alternativamente, puedes usar los scripts de compilación: `npm run build` seguido de `npm start`.

4. Para crear unos datos de prueba o generar modelos en la DB, puedes usar la base de datos pre-configurada (si lo tienes configurado, también puedes correr `npm run seed`).

## ⚙️ Variables de Entorno y Configuración

El archivo `.env` o las variables pasadas al proceso deben contar con las integraciones necesarias. Si falta alguna clave de IA, los controladores generarán un error `500`.

### Servidor y BBDD
| Variable | Descripción | Valor recomendado / defecto |
| --- | --- | --- |
| `PORT` | Puerto de escucha del servidor express local | `4000` |
| `NODE_ENV` | Entorno de despliegue (`development`, `production`) | `development` |
| `FRONTEND_URL` | Dominio del frontend, necesario para políticas **CORS** | `http://localhost:3000` |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Credenciales exclusivas de la sesión del clúster de base de datos **PostgreSQL**. Administra la conexión nativa | *Postgres URL details* |

### Seguridad
| Variable | Descripción | 
| --- | --- |
| `JWT_SECRET` | Llave privativa (`string` largo y seguro) para codificar tokens en auth y autorización |
| `JWT_EXPIRES_IN` | Margen de validez global del token firmado, usualmente numérico u abreviado (`7d`) |

### Proveedores e Integraciones (IA & Media)
| Variable | Descripción | 
| --- | --- |
| `GROQ_API_KEY` | **CRÍTICA:** Tu API Key de la plataforma de Groq. Se utiliza tanto para inferencia (texto y esquemas) como para Text-to-Speech (Canopylabs) |
| `PEXELS_API_KEY` | La API key otorgada por Pexels Developers para indexar y adjuntar imágenes descriptivas dentro de los cursos |
