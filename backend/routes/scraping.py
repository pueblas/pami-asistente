from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl
from utils.scraper import scrape_tramite

router = APIRouter(prefix="/test", tags=["Testing"])

class ScrapingRequest(BaseModel):
    url: HttpUrl

@router.post("/scrape-url")
def test_scrape_single_url(request: ScrapingRequest):
    """
    Endpoint temporal para testear el scraping de una URL individual
    
    Retorna el JSON con la estructura del trámite scrapeado.
    
    Ejemplo de uso:
    POST /test/scrape-url
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