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
git clone https://github.com/pueblas/pami-asistente.git
cd pami-asistente

2. Levantar los servicios:
docker-compose up --build

3. Acceder a la aplicación:
- Backend API: http://localhost:8000
- Health check: http://localhost:8000/health

### Detener los servicios
# Detener con Ctrl+C o en otra terminal:
docker-compose down

## 🏗️ Arquitectura

pami-asistente/
├── backend/          # API REST (FastAPI)
│   ├── Dockerfile
│   ├── main.py
│   └── requirements.txt
├── frontend/         # [En desarrollo]
├── database/         # Almacenamiento SQLite
├── docker-compose.yml
└── README.md

## 👥 Equipo

- Lautaro Bonasora
- Juan Bautista Rueda
- Eugenio Provenzano
- Joaquín Lino Alonso

## 📝 Estado del Proyecto

**Checkpoint 1** - En desarrollo 🔨
- [x] Estructura Docker básica
- [x] Backend FastAPI inicial
- [ ] Base de datos SQLite
- [ ] Sistema de autenticación
- [ ] Frontend básico

---

*Proyecto Final - Ingeniería en Sistemas - CAECE*