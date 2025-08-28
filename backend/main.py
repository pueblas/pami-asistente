from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.connection import engine, Base
from models import user, role
from db.init_data import create_initial_data
from routes import auth

# Crear las tablas
Base.metadata.create_all(bind=engine)

# Crear datos iniciales
create_initial_data()

app = FastAPI(title="PAMI Asistente API")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rutas
app.include_router(auth.router)

@app.get("/")
def read_root():
    return {"message": "Backend funcionando!", "version": "0.1.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "SQLite connected"}