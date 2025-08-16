from fastapi import FastAPI

app = FastAPI(title="PAMI Asistente API")

@app.get("/")
def read_root():
    return {"message": "Backend funcionando!", "version": "0.1.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}