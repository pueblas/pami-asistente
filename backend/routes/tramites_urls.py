from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, HttpUrl
from typing import List
import json
import os

from utils.security import require_role
from utils.scraper import scrape_tramite, generar_keywords_con_ollama
from utils.vector_store import add_tramite, delete_tramite, get_all_tramites

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

class TramiteListItem(BaseModel):
    id: str
    title: str
    url: str
    description: str
    activo: bool = True

class TramitesListResponse(BaseModel):
    total: int
    tramites: List[TramiteListItem]

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

@router.get("/tramites-list", response_model=TramitesListResponse)
def get_tramites_list(
    admin = Depends(require_role("administrador"))
):
    """
    Listar todos los trámites almacenados en ChromaDB con título, URL y descripción (solo admin)
    """
    try:
        tramites_data = get_all_tramites()
        
        tramites_list = []
        for tramite in tramites_data:
            tramites_list.append(TramiteListItem(
                id=tramite.get("id", ""),
                title=tramite.get("titulo", "Sin título"),
                url=tramite.get("url_oficial", ""),
                description=tramite.get("descripcion", "Sin descripción")[:200] + "..." if len(tramite.get("descripcion", "")) > 200 else tramite.get("descripcion", "Sin descripción")
            ))
        
        return TramitesListResponse(
            total=len(tramites_list),
            tramites=tramites_list
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo lista de trámites: {str(e)}"
        )

@router.delete("/tramites/{tramite_id}")
def delete_tramite_by_id(
    tramite_id: str,
    admin = Depends(require_role("administrador"))
):
    """
    Eliminar un trámite por su ID (solo admin)
    
    Proceso:
    1. Elimina el trámite de ChromaDB
    2. Busca y elimina la URL correspondiente del archivo de configuración
    """
    try:
        # 1. Eliminar de ChromaDB
        print(f"🗑️ Eliminando trámite '{tramite_id}' de ChromaDB...")
        delete_success = delete_tramite(tramite_id)
        
        if not delete_success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Trámite con ID '{tramite_id}' no encontrado en ChromaDB"
            )
        
        # 2. Buscar y eliminar URL del archivo de configuración
        urls = load_urls_from_config()
        
        # Buscar la URL que corresponde a este tramite_id
        url_to_remove = None
        for url in urls:
            # Extraer ID de la URL para comparar
            from utils.scraper import extract_id_from_url
            if extract_id_from_url(url) == tramite_id:
                url_to_remove = url
                break
        
        if url_to_remove:
            urls.remove(url_to_remove)
            if not save_urls_to_config(urls):
                print(f"⚠️ Advertencia: No se pudo actualizar el archivo de configuración")
        
        print(f"✅ Trámite '{tramite_id}' eliminado exitosamente")
        
        return {
            "message": "Trámite eliminado exitosamente",
            "tramite_id": tramite_id,
            "url_removed": url_to_remove
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error eliminando el trámite: {str(e)}"
        )
    
@router.patch("/tramites/{tramite_id}/toggle")
def toggle_tramite_estado(
    tramite_id: str,
    admin = Depends(require_role("administrador"))
):
    """
    Cambiar el estado activo/inactivo de un trámite (solo admin)
    
    Args:
        tramite_id: ID del trámite (ej: "insulinas", "cambio-medico")
    
    Returns:
        Estado actualizado del trámite
    """
    from utils.vector_store import get_or_create_collection
    import json
    
    try:
        collection = get_or_create_collection()
        
        # 1. Buscar el trámite en ChromaDB por ID
        results = collection.get(ids=[tramite_id])
        
        if not results['ids'] or len(results['ids']) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Trámite '{tramite_id}' no encontrado"
            )
        
        # 2. Obtener el trámite actual
        metadata = results['metadatas'][0]
        tramite = json.loads(metadata['json_data'])
        
        # 3. Cambiar el estado
        estado_actual = tramite.get('activo', True)
        nuevo_estado = not estado_actual
        tramite['activo'] = nuevo_estado
        
        # 4. Actualizar metadata
        metadata['json_data'] = json.dumps(tramite, ensure_ascii=False)
        
        # 5. Actualizar en ChromaDB
        collection.update(
            ids=[tramite_id],
            metadatas=[metadata]
        )
        
        print(f"{'✅ Activado' if nuevo_estado else '🔴 Desactivado'} trámite: {tramite_id}")
        
        return {
            "message": f"Trámite {'activado' if nuevo_estado else 'desactivado'} exitosamente",
            "tramite_id": tramite_id,
            "titulo": tramite['titulo'],
            "activo": nuevo_estado
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error cambiando estado del trámite: {str(e)}"
        )


@router.get("/tramites", response_model=TramitesListResponse)
def listar_tramites_con_estado(
    admin = Depends(require_role("administrador"))
):
    """
    Listar todos los trámites con su estado activo/inactivo (solo admin)
    Reemplaza el endpoint /tramites-list existente
    """
    try:
        tramites_data = get_all_tramites()
        
        tramites_list = []
        for tramite in tramites_data:
            tramites_list.append(TramiteListItem(
                id=tramite.get("id", ""),
                title=tramite.get("titulo", "Sin título"),
                url=tramite.get("url_oficial", ""),
                description=tramite.get("descripcion", "Sin descripción")[:200] + "..." if len(tramite.get("descripcion", "")) > 200 else tramite.get("descripcion", "Sin descripción"),
                activo=tramite.get('activo', True)  # ← AGREGAR campo activo
            ))
        
        return TramitesListResponse(
            total=len(tramites_list),
            tramites=tramites_list
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo lista de trámites: {str(e)}"
        )