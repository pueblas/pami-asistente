from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="PAMI Asistente API")

# Configurar CORS - DEBE ir justo después de crear app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Backend funcionando!", "version": "0.1.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}