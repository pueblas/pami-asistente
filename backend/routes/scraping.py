from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, HttpUrl
from typing import List

from db.connection import get_db
from utils.scraper import scrape_tramite, scrape_and_generate_keywords
from utils.vector_store import add_tramite, delete_tramite, get_collection_count
from utils.security import require_role

router = APIRouter(prefix="/admin", tags=["Admin"])

class ScrapingRequest(BaseModel):
    url: HttpUrl

class ScrapingAllResponse(BaseModel):
    success: bool
    total_urls: int
    scraped: int
    failed: int
    keywords_generated: int
    inserted_to_db: int
    errors: List[str]

@router.post("/scrape-url")
def scrape_single_url(
    request: ScrapingRequest,
    admin = Depends(require_role("administrador"))
):
    """
    Scrapea una URL individual (solo admin)
    
    Útil para testear nuevas URLs antes de agregarlas al sistema.
    
    Ejemplo:
    {
        "url": "https://www.pami.org.ar/tramite/cambio-medico"
    }
    """
    try:
        url_str = str(request.url)
        tramite = scrape_tramite(url_str)
        
        if not tramite:
            raise HTTPException(
                status_code=500,
                detail="No se pudo scrapear el trámite"
            )
        
        return tramite
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error scrapeando: {str(e)}"
        )

@router.post("/scrape-all", response_model=ScrapingAllResponse)
async def scrape_all_tramites(
    admin = Depends(require_role("administrador"))
):
    """
    Scrapea todos los trámites del archivo de configuración (solo admin)
    
    Proceso:
    1. Lee las URLs de /app/config/tramites_urls.json
    2. Scrapea cada URL
    3. Genera keywords con Ollama
    4. Borra todos los trámites existentes en ChromaDB
    5. Inserta los nuevos trámites en ChromaDB
    
    """
    errors = []
    
    try:
        # 1. Scrapear y generar keywords
        print("📋 Iniciando scraping completo...")
        tramites = await scrape_and_generate_keywords()
        
        if not tramites:
            return ScrapingAllResponse(
                success=False,
                total_urls=0,
                scraped=0,
                failed=0,
                keywords_generated=0,
                inserted_to_db=0,
                errors=["No se pudo scrapear ningún trámite"]
            )
        
        # 2. Limpiar ChromaDB (borrar trámites existentes)
        print("🗑️ Limpiando base vectorial...")
        try:
            from utils.vector_store import get_or_create_collection
            collection = get_or_create_collection()
            
            # Obtener todos los IDs existentes
            existing = collection.get()
            if existing and existing['ids']:
                for tramite_id in existing['ids']:
                    delete_tramite(tramite_id)
                print(f"✅ Eliminados {len(existing['ids'])} trámites antiguos")
        except Exception as e:
            errors.append(f"Error limpiando ChromaDB: {str(e)}")
        
        # 3. Insertar trámites en ChromaDB
        print("💾 Insertando trámites en ChromaDB...")
        inserted = 0
        for tramite in tramites:
            try:
                success = add_tramite(tramite)
                if success:
                    inserted += 1
            except Exception as e:
                errors.append(f"Error insertando {tramite['id']}: {str(e)}")
        
        # 4. Contar keywords generadas
        keywords_count = sum(
            1 for t in tramites 
            if t.get('metadata', {}).get('keywords')
        )
        
        # 5. Calcular estadísticas
        from utils.scraper import load_tramites_urls
        total_urls = len(load_tramites_urls())
        failed = total_urls - len(tramites)
        
        print(f"✅ Proceso completado: {inserted} trámites insertados")
        
        return ScrapingAllResponse(
            success=True,
            total_urls=total_urls,
            scraped=len(tramites),
            failed=failed,
            keywords_generated=keywords_count,
            inserted_to_db=inserted,
            errors=errors
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error en el proceso de scraping: {str(e)}"
        )