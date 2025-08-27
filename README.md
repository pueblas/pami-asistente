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
- Health check: http://localhost:8000/health

4. Usuario admin por defecto:
- Email: admin@caece.edu.ar
- Contraseña: admin123

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

### Detener los servicios
- Ctrl+C
- O correr en otra terminal:
```bash
docker-compose down
```

## 🏗️ Arquitectura

```
pami-asistente/
├── backend/              # API REST (FastAPI)
│   ├── db/              # Configuración de base de datos
│   │   ├── connection.py
│   │   └── init_data.py
│   ├── models/          # Modelos SQLAlchemy
│   │   ├── user.py
│   │   └── role.py
│   ├── Dockerfile
│   ├── main.py
│   └── requirements.txt
├── frontend/            # React App
│   ├── public/
│   ├── src/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── database/            # Almacenamiento SQLite (pami.db)
├── docker-compose.yml
└── README.md
```
## 👥 Equipo

- Lautaro Bonasora
- Juan Bautista Rueda
- Eugenio Provenzano
- Joaquín Lino Alonso

## 📝 Estado del Proyecto

**Release 1** - En desarrollo 🔨
- [x] Estructura Docker básica
- [x] Backend FastAPI con CORS configurado
- [x] Frontend React con comunicación al backend
- [x] Base de datos SQLite con persistencia
- [x] Modelos de Usuario y Rol implementados
- [x] Datos iniciales (admin) creados automáticamente
- [x] SQLite incluido en contenedor para debugging
- [ ] Sistema de autenticación JWT
- [ ] Endpoints de registro/login
- [ ] Pantallas de login/registro

---

*Proyecto Final - Ingeniería en Sistemas - CAECE*