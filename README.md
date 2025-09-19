# Asistente de Trámites de PAMI 🤖
Asistente conversacional basado en IA para facilitar trámites de PAMI a personas mayores y sus familiares.

## 📋 Descripción
Aplicación web que utiliza procesamiento de lenguaje natural para responder consultas sobre trámites de PAMI de manera simple y accesible, manteniendo el contexto de la conversación y proporcionando enlaces directos cuando corresponda.

## 🚀 Quick Start
### Prerrequisitos
- Docker Desktop instalado ([Descargar aquí](https://www.docker.com/products/docker-desktop/))
- Git

### Instalación y ejecución
1. Clonar el repositorio:
```bash
git clone https://github.com/pueblas/pami-asistente.git
cd pami-asistente
```

2. Levantar los servicios:
```bash
docker-compose up --build
```

3. Acceder a la aplicación:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Ollama/Nodo IA: http://localhost:11434
- Health check: http://localhost:8000/health

4. Usuario admin por defecto:
- Email: admin@caece.edu.ar
- Contraseña: admin123

5. Detener los servicios
- Ctrl+C
- O correr en otra terminal:
```bash
docker-compose down
```

## 🤖 Nodo de IA (Ollama)
### Modelo LLM
El sistema utiliza **llama3.2:3b** como modelo de lenguaje base:
- Se descarga automáticamente la primera vez (puede tardar varios minutos)
- Queda cacheado en un volumen persistente para futuros usos
- Tamaño aproximado: 2GB

### Verificar el modelo:
```bash
# Ver modelos instalados
docker exec pami-nodo-ia ollama list

# Probar el modelo directamente
docker exec pami-nodo-ia ollama run llama3.2:3b "Hola"
```

## 🗄️ Base de Datos
### Verificar datos en SQLite
```bash
# Entrar al contenedor
docker exec -it pami-backend bash

# Conectarse a la BD
sqlite3 /app/database/pami.db

# Comandos útiles de SQLite
.tables              # Ver todas las tablas
SELECT * FROM usuario;   # Ver usuarios
SELECT * FROM rol;       # Ver roles
.exit                    # Salir de SQLite

# Salir del contenedor
exit
```

### Datos iniciales
El sistema crea automáticamente:
- Roles: `usuario` y `administrador`
- Usuario admin por defecto (credenciales arriba)

## 🔌 API Endpoints

### Autenticación
- `POST /auth/register` - Registro de nuevo usuario
- `POST /auth/login` - Login (retorna JWT token)
- `POST /auth/recover` - Recupero de contraseña
- `POST /auth/reset` - Reset de contraseña

### Admin
Requieren token con rol "administrador":
- `GET /admin/users` - Listar todos los usuarios
- `POST /admin/users` - Crear nuevo administrador
- `DELETE /admin/users/{id}` - Eliminar usuario

### Chat
- `POST /chat/consulta` - Consulta a IA

### Documentación interactiva
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Ejemplo de uso:
```bash
# Registro
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"primer_nombre":"Juan","apellido":"Perez","correo_electronico":"juan@caece.edu.ar","password":"caece2025"}'

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo_electronico":"juan@caece.edu.ar","password":"caece2025"}'
```
## 📧 Sistema de Emails (MailHog)
El proyecto incluye MailHog para capturar emails en desarrollo:
- Web UI: http://localhost:8025
- Todos los emails enviados se visualizan ahí (recuperación de contraseña, etc.)

## Frontend
- /login -> Para iniciar sesion, dependiendo del rol del usuario te lleva al admin center o al chatbot
- /register -> Se registra el usuario y te redirige a /login
- /health -> Muestra el estado del frontend y el backend

## 🏗️ Estructura del proyecto
```
pami-asistente/
├── backend/              # API REST (FastAPI)
│   ├── db/              # Configuración de base de datos
│   │   ├── connection.py
│   │   └── init_data.py
│   ├── models/          # Modelos SQLAlchemy
│   │   ├── user.py
│   │   └── role.py
│   ├── routes/          # Endpoints de la API
│   │   ├── auth.py     # Autenticación y registro
│   │   ├── admin.py    # Administración
|   |   └── chat.py     # Chat
│   ├── schemas/         # Validación con Pydantic
│   │   ├── user.py
|   |   └── chat.py     
│   ├── utils/           # Utilidades
│   │   ├── auth.py     # JWT y hashing
│   │   ├── email.py    # Envío de emails
│   │   └── security.py # Protección de rutas
│   ├── Dockerfile
│   ├── main.py
│   └── requirements.txt
├── frontend/            # React App
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   └── auth.js 
│   │   ├── pages/ 
│   │   │   ├── health.css
│   │   │   ├── health.js
│   │   │   ├── login.css
│   │   │   ├── login.js
│   │   │   ├── register.css
│   │   │   └── register.js 
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── nodo-ia/             # Nodo de IA con Ollama
│   ├── Dockerfile       # Imagen personalizada de Ollama
│   └── entrypoint.sh    # Script de inicialización
├── database/            # Almacenamiento SQLite (pami.db)
├── docker-compose.yml
└── README.md
```
## 👥 Equipo
- Lautaro Bonasora
- Juan Bautista Rueda
- Eugenio Provenzano
- Joaquín Lino Alonso

---

*Proyecto Final - Ingeniería en Sistemas - CAECE*