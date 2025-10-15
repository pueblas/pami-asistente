from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.connection import engine, Base
from models import user, role
from db.init_data import create_initial_data
from routes import auth, admin, chat

# Crear las tablas
Base.metadata.create_all(bind=engine)

# Crear datos iniciales
create_initial_data()

def init_tramites():
    """Inserta trámites iniciales en ChromaDB si no existen"""
    try:
        import chromadb
        import json
        
        client = chromadb.PersistentClient(path='/app/database/chroma')
        collection = client.get_or_create_collection(name='tramites_pami')
        
        # Verificar si ya existe el trámite
        try:
            existing = collection.get(ids=['cambio-medico'])
            if existing and existing['ids']:
                print("ℹ️ Trámite 'cambio-medico' ya existe en ChromaDB")
                return
        except:
            pass
        
        # Insertar trámite
        tramite = {
            'id': 'cambio-medico',
            'titulo': 'Asignación o cambio de médico/a de cabecera',
            'descripcion': 'Tu médico de cabecera brinda atención ambulatoria en caso de ser necesaria; evalúa tu estado de salud para prevenir y tratar enfermedades; indica estudios diagnósticos y prescribe tus medicamentos; hace el seguimiento de tus problemas de salud, te deriva a especialistas si es necesario y te asesora sobre el cuidado de tu salud.',
            'quien_puede_realizar': {
                'texto': 'El trámite podrá realizarlo la persona afiliada, su apoderado/a o familiar.',
                'enlaces': []
            },
            'documentacion_necesaria': {
                'items': ['Documento Nacional de Identidad con domicilio actualizado.', 'En caso de que el trámite lo realice la persona apoderada, deberá presentar además su DNI y el recibo de cobro de la persona afiliada.', 'En caso de que el trámite lo realice una persona que designe la persona afiliada, deberá presentar además su DNI y una nota de autorización firmada, donde se aclare el cambio a realizar.'],
                'enlaces': []
            },
            'donde_realizar': {
                'texto': 'Este es un trámite web. Podés realizarlo desde tu celular, tablet o computadora. Si querés aprender a realizar tus trámites web mirá este video. También podés realizar este trámite en tu agencia. Recordá sacar turno online para una mejor atención.',
                'enlaces': ['https://www.pami.org.ar/como-realizar-tramites','https://www.pami.org.ar/tramite/cambio-medico/seleccionar-motivo?motivo=7&id_subtipo=113']
            },
            'url_oficial': 'https://www.pami.org.ar/tramite/cambio-medico',
            'metadata': {
                'keywords': ['medico', 'cabecera', 'cambio', 'asignacion']
            }
        }
        
        texto = f"{tramite['titulo']} {tramite['descripcion']} {' '.join(tramite['metadata']['keywords'])}"
        
        collection.add(
            ids=[tramite['id']],
            documents=[texto],
            metadatas=[{
                'id': tramite['id'],
                'titulo': tramite['titulo'],
                'url_oficial': tramite['url_oficial'],
                'json_data': json.dumps(tramite, ensure_ascii=False)
            }]
        )
        
        print("✅ Trámite insertado en ChromaDB")
        
    except Exception as e:
        print(f"⚠️ Error insertando trámites iniciales: {e}")

init_tramites()

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
app.include_router(admin.router)
app.include_router(chat.router)

@app.get("/")
def read_root():
    return {"message": "Backend funcionando!", "version": "0.1.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "SQLite connected"}