from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, HttpUrl
from typing import List
import json
import os

from utils.security import require_role
from utils.scraper import scrape_tramite, generar_keywords_con_ollama
from utils.vector_store import add_tramite, delete_tramite

router = APIRouter(prefix="/admin", tags=["Admin"])

CONFIG_PATH = "/app/config/tramites_urls.json"

class UrlCreate(BaseModel):
    url: HttpUrl

class UrlResponse(BaseModel):
    index: int
    url: str

class TramitesUrlsResponse(BaseModel):
    total: int
    urls: List[UrlResponse]

def load_urls_from_config() -> List[str]:
    """Lee las URLs del archivo de configuración"""
    try:
        with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
            config = json.load(f)
            return config.get("tramites_urls", [])
    except FileNotFoundError:
        return []
    except json.JSONDecodeError:
        return []

def save_urls_to_config(urls: List[str]) -> bool:
    """Guarda las URLs en el archivo de configuración"""
    try:
        config = {"tramites_urls": urls}
        with open(CONFIG_PATH, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"❌ Error guardando URLs: {e}")
        return False

@router.get("/tramites-urls", response_model=TramitesUrlsResponse)
def get_tramites_urls(
    admin = Depends(require_role("administrador"))
):
    """
    Listar todas las URLs de trámites configuradas (solo admin)
    """
    urls = load_urls_from_config()
    
    urls_response = [
        UrlResponse(index=i, url=url) 
        for i, url in enumerate(urls)
    ]
    
    return TramitesUrlsResponse(
        total=len(urls),
        urls=urls_response
    )

@router.post("/tramites-urls")
async def add_tramite_url(
    url_data: UrlCreate,
    admin = Depends(require_role("administrador"))
):
    """
    Agregar una nueva URL de trámite (solo admin)
    
    Proceso:
    1. Valida que la URL sea de PAMI
    2. Verifica que no exista ya
    3. Scrapea el trámite
    4. Genera keywords
    5. Inserta en ChromaDB
    6. Agrega la URL al archivo de configuración
    """
    url_str = str(url_data.url)
    
    # Validar que sea una URL de PAMI
    if "pami.org.ar/tramite/" not in url_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La URL debe ser de un trámite de PAMI (https://www.pami.org.ar/tramite/...)"
        )
    
    # Cargar URLs existentes
    urls = load_urls_from_config()
    
    # Verificar si ya existe
    if url_str in urls:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta URL ya está registrada"
        )
    
    try:
        # 1. Scrapear el trámite
        print(f"🔍 Scrapeando nuevo trámite: {url_str}")
        tramite = scrape_tramite(url_str)
        
        if not tramite:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No se pudo scrapear el trámite de esa URL"
            )
        
        # 2. Generar keywords
        print(f"🤖 Generando keywords...")
        keywords = await generar_keywords_con_ollama(tramite)
        tramite["metadata"]["keywords"] = keywords
        
        # 3. Insertar en ChromaDB
        print(f"💾 Insertando en ChromaDB...")
        success = add_tramite(tramite)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error insertando el trámite en la base de datos"
            )
        
        # 4. Agregar URL al archivo de configuración
        urls.append(url_str)
        if not save_urls_to_config(urls):
            # Si falla guardar el JSON, eliminar de ChromaDB para mantener consistencia
            delete_tramite(tramite["id"])
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error guardando la configuración"
            )
        
        print(f"✅ Trámite '{tramite['id']}' agregado exitosamente")
        
        return {
            "message": "Trámite agregado exitosamente",
            "tramite_id": tramite["id"],
            "titulo": tramite["titulo"],
            "url": url_str
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error procesando el trámite: {str(e)}"
        )

@router.delete("/tramites-urls/{url_index}")
def delete_tramite_url(
    url_index: int,
    admin = Depends(require_role("administrador"))
):
    """
    Eliminar una URL de trámite por su índice (solo admin)
    
    Proceso:
    1. Elimina la URL del archivo de configuración
    2. Elimina el trámite de ChromaDB
    """
    # Cargar URLs existentes
    urls = load_urls_from_config()
    
    # Validar índice
    if url_index < 0 or url_index >= len(urls):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Índice de URL inválido"
        )
    
    url_to_delete = urls[url_index]
    
    try:
        # Extraer el ID del trámite desde la URL
        from utils.scraper import extract_id_from_url
        tramite_id = extract_id_from_url(url_to_delete)
        
        # 1. Eliminar de ChromaDB
        print(f"🗑️ Eliminando trámite '{tramite_id}' de ChromaDB...")
        delete_tramite(tramite_id)
        
        # 2. Eliminar del archivo de configuración
        urls.pop(url_index)
        if not save_urls_to_config(urls):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error guardando la configuración"
            )
        
        print(f"✅ Trámite '{tramite_id}' eliminado exitosamente")
        
        return {
            "message": "Trámite eliminado exitosamente",
            "tramite_id": tramite_id,
            "url": url_to_delete
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error eliminando el trámite: {str(e)}"
        )