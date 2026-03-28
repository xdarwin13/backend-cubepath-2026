# EduCubeIA - Backend

API RESTful desarrollada con **Node.js**, **Express** y **TypeScript**. Motor principal de la plataforma que coordina la gestión de usuarios, base de datos relacional con **PostgreSQL** (Sequelize ORM), e integración con servicios de inteligencia artificial (**Groq API**), búsqueda de imágenes (**Pexels**), videos (**YouTube Data API**) y generación de audio (**TTS**).

---

## ✨ Características Principales

### Generación con IA (Groq)
- **Estructura de cursos**: Genera sílabos completos (módulos, lecciones, descripciones) desde un prompt en lenguaje natural usando `llama-3.3-70b-versatile`
- **Contenido de lecciones**: Redacción educativa extensa en Markdown (mín. 500 palabras) con ejemplos, listas y estructura progresiva
- **Quizzes automáticos**: Genera 5 preguntas de evaluación por lección con opciones múltiples
- **Audio TTS**: Conversión de texto a voz usando `canopylabs/orpheus-v1-english` (voz Diana, formato WAV)

### Integración de Medios
- **Pexels API**: Búsqueda de imágenes relevantes para portadas de cursos y lecciones (keywords en inglés generadas por IA)
- **YouTube Data API v3**: Búsqueda de videos educativos embebibles en español, integrados en el contenido de lecciones

### Certificados Digitales
- Generación automática al completar un curso (100% progreso)
- Código de verificación único (`EC-XXXXXXXX-XXXXX`)
- Endpoint público de verificación sin autenticación

### Autenticación y RBAC
- JWT con Bearer token
- 3 roles: **Admin**, **Teacher**, **Student**
- Middleware `authenticate` + `authorize` por ruta
- Contraseñas cifradas con bcrypt (salt rounds: 10)

### Dashboard de Administrador
- Estadísticas globales (usuarios, cursos, inscripciones, certificados)
- Datos para gráficas (registros diarios, inscripciones, categorías, distribución de roles)
- CRUD de usuarios, cursos, inscripciones y certificados

---

## 🗄 Modelos de Datos

```
User          Course          Module          Lesson
─────         ──────          ──────          ──────
id (UUID)     id (UUID)       id (UUID)       id (UUID)
name          title           title           title
email (unique)description     description     content (TEXT)
password      coverImage      order           audioUrl
role (enum)   category        courseId →      imageUrl
avatar        status (enum)                   order
              teacherId →                     moduleId →

Enrollment                    Certificate
──────────                    ───────────
id (UUID)                     id (UUID)
studentId →                   enrollmentId → (unique)
courseId →                     studentId →
progress (0-100)              courseId →
lastLessonId                  verificationCode (unique)
completedAt                   issuedAt
```

### Relaciones
- `User (teacher)` → hasMany → `Course`
- `Course` → hasMany → `Module` → hasMany → `Lesson`
- `User (student)` → hasMany → `Enrollment` ← belongsTo → `Course`
- `Enrollment` → hasOne → `Certificate`

---

## 🛣 Endpoints de la API

### Auth (`/api/auth`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/register` | Registro de usuario |
| POST | `/login` | Inicio de sesión (retorna JWT) |
| GET | `/me` | Datos del usuario autenticado |

### Teacher (`/api/teacher`) — Requiere rol `teacher`
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/courses` | Listar cursos propios |
| GET | `/courses/:id` | Detalle de un curso |
| POST | `/courses` | Crear curso |
| PUT | `/courses/:id` | Actualizar curso |
| DELETE | `/courses/:id` | Eliminar curso |
| POST | `/courses/:courseId/modules` | Agregar módulo |
| DELETE | `/modules/:moduleId` | Eliminar módulo |
| POST | `/modules/:moduleId/lessons` | Agregar lección |
| PUT | `/lessons/:lessonId` | Actualizar lección |
| DELETE | `/lessons/:lessonId` | Eliminar lección |

### Student (`/api/student`) — Requiere rol `student`
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/courses` | Cursos publicados |
| GET | `/courses/:id` | Detalle de curso |
| POST | `/courses/:id/enroll` | Inscribirse |
| GET | `/my-courses` | Mis inscripciones |
| PUT | `/progress/:enrollmentId` | Actualizar progreso |
| GET | `/certificate/:enrollmentId` | Datos del certificado |
| POST | `/quiz/lesson/:lessonId` | Generar quiz con IA |

### Admin (`/api/admin`) — Requiere rol `admin`
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/stats` | Estadísticas globales |
| GET | `/stats/charts` | Datos para gráficas |
| GET | `/users` | Listar usuarios |
| PUT | `/users/:id/role` | Cambiar rol |
| DELETE | `/users/:id` | Eliminar usuario |
| GET | `/courses` | Todos los cursos |
| PUT | `/courses/:id/status` | Cambiar estado del curso |
| DELETE | `/courses/:id` | Eliminar curso |
| GET | `/enrollments` | Todas las inscripciones |
| GET | `/certificates` | Todos los certificados |

### IA (`/api/ai`) — Requiere rol `teacher`
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/generate-course` | Generar estructura completa con IA |
| POST | `/generate-lesson/:lessonId` | Generar contenido de lección |
| POST | `/generate-audio/:lessonId` | Generar audio TTS |
| GET | `/search-image` | Buscar imágenes (Pexels) |

### Verificación (`/api/verify`) — Público
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/:code` | Verificar certificado por código |

### Health Check
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Estado del servidor |

---

## 📁 Estructura del Proyecto

```
src/
├── index.ts                    # Servidor Express + sync DB
├── config/
│   ├── database.ts             # Conexión Sequelize (PostgreSQL)
│   └── env.ts                  # Variables de entorno centralizadas
├── middlewares/
│   └── auth.ts                 # authenticate + authorize (JWT + RBAC)
├── models/
│   ├── index.ts                # Asociaciones entre modelos
│   ├── User.ts                 # Usuarios (admin, teacher, student)
│   ├── Course.ts               # Cursos (draft, published)
│   ├── Module.ts               # Módulos de curso
│   ├── Lesson.ts               # Lecciones (content, audio, image)
│   ├── Enrollment.ts           # Inscripciones con progreso
│   └── Certificate.ts          # Certificados con código verificable
├── controllers/
│   ├── authController.ts       # Registro, login, perfil
│   ├── teacherController.ts    # CRUD cursos, módulos, lecciones
│   ├── studentController.ts    # Inscripciones, progreso, certificados, quizzes
│   ├── adminController.ts      # Stats, gráficas, gestión global
│   ├── aiController.ts         # Generación IA, audio, imágenes
│   └── verifyController.ts     # Verificación pública de certificados
├── routes/
│   ├── authRoutes.ts
│   ├── teacherRoutes.ts
│   ├── studentRoutes.ts
│   ├── adminRoutes.ts
│   ├── aiRoutes.ts
│   └── verifyRoutes.ts
├── services/
│   ├── groqService.ts          # Groq SDK: texto, quizzes, TTS
│   ├── pexelsService.ts        # Búsqueda de imágenes
│   └── youtubeService.ts       # Búsqueda de videos educativos
└── utils/
    └── seed.ts                 # Datos iniciales (admin, teacher, student)
```

---

## 🛠 Tech Stack

| Categoría | Tecnología |
|-----------|-----------|
| **Runtime** | Node.js ≥ 20.9.0 |
| **Framework** | Express 4 |
| **Lenguaje** | TypeScript 5 |
| **Base de datos** | PostgreSQL (Sequelize 6 ORM) |
| **Auth** | JWT (jsonwebtoken) + bcryptjs |
| **IA (Texto/Quiz)** | Groq SDK → llama-3.3-70b-versatile |
| **IA (Audio TTS)** | Groq SDK → canopylabs/orpheus-v1-english |
| **Imágenes** | Pexels API |
| **Videos** | YouTube Data API v3 |
| **Upload** | Multer |
| **IDs** | UUID v4 |

---

## 🚀 Instalación

```bash
cd backend
npm install
cp .env.example .env
```

Edita `.env` con tus credenciales reales (DB, API keys).

```bash
# Seed de usuarios de prueba
npm run seed

# Desarrollo (auto-reload con nodemon)
npm run dev

# Producción
npm run build && npm start
```

---

## ⚙️ Variables de Entorno

### Servidor
| Variable | Descripción | Default |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | `4000` |
| `NODE_ENV` | Entorno (`development` / `production`) | `development` |
| `FRONTEND_URL` | URL del frontend (CORS) | `http://localhost:3000` |

### Base de Datos
| Variable | Descripción | Default |
|----------|-------------|---------|
| `DB_HOST` | Host de PostgreSQL | `localhost` |
| `DB_PORT` | Puerto | `5432` |
| `DB_NAME` | Nombre de la base de datos | `educubeia` |
| `DB_USER` | Usuario | `postgres` |
| `DB_PASSWORD` | Contraseña | `postgres` |

### Seguridad
| Variable | Descripción |
|----------|-------------|
| `JWT_SECRET` | Clave para firmar tokens JWT |
| `JWT_EXPIRES_IN` | Expiración del token (ej: `7d`) |

### Integraciones IA y Medios
| Variable | Descripción |
|----------|-------------|
| `GROQ_API_KEY` | API Key de Groq (texto + TTS) |
| `PEXELS_API_KEY` | API Key de Pexels (imágenes) |
| `YOUTUBE_API_KEY` | API Key de YouTube Data v3 (opcional) |

---

## 📜 Scripts

```bash
npm run dev      # Desarrollo con nodemon + ts-node
npm run build    # Compilar TypeScript a dist/
npm start        # Ejecutar build compilado
npm run seed     # Crear usuarios de prueba
```

---

## 🌱 Datos de Prueba (Seed)

Al ejecutar `npm run seed` se crean 3 usuarios:

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | `admin@educubeia.com` | `admin123` |
| Teacher | `profesor@educubeia.com` | `teacher123` |
| Student | `estudiante@educubeia.com` | `student123` |

> **Nota:** El seed ejecuta `sync({ force: true })` — borra y recrea todas las tablas.
