import chromadb
from sentence_transformers import SentenceTransformer
import json
from typing import List, Dict, Optional

embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

CHROMA_PATH = "/app/database/chroma"
COLLECTION_NAME = "tramites_pami"

_chroma_client = None

def get_chroma_client():
    """Obtiene el cliente de ChromaDB con persistencia (singleton)"""
    global _chroma_client
    if _chroma_client is None:
        _chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
    return _chroma_client

def get_or_create_collection():
    """Obtiene o crea la colección de trámites"""
    client = get_chroma_client()
    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"description": "Trámites de PAMI"}
    )
    return collection

def create_searchable_text(tramite: Dict) -> str:
    parts = [
        tramite.get("titulo", ""),
        tramite.get("descripcion", "")
    ]
    
    keywords = tramite.get("metadata", {}).get("keywords", [])
    if keywords:
        parts.append(" ".join(keywords))
    
    return " ".join(parts)

def add_tramite(tramite: Dict) -> bool:
    """
    Agrega un trámite a la base vectorial
    
    Args:
        tramite: Diccionario con la estructura JSON definida
    
    Returns:
        bool: True si se agregó exitosamente
    """
    try:
        collection = get_or_create_collection()
        
        # Crear texto para embedear
        searchable_text = create_searchable_text(tramite)
        
        # Preparar metadata con el JSON completo incluido
        metadata = {
            "id": tramite["id"],
            "titulo": tramite["titulo"],
            "url_oficial": tramite["url_oficial"],
            "json_data": json.dumps(tramite, ensure_ascii=False)
        }
        
        print(f"DEBUG: Insertando con ID: {tramite['id']}")
        print(f"DEBUG: Texto para embedear: {searchable_text[:100]}...")
        
        # UNA SOLA operación: add
        collection.add(
            ids=[tramite["id"]],
            documents=[searchable_text],
            metadatas=[metadata]
        )
        
        print(f"DEBUG: add() ejecutado sin error")
        
        # Verificar que se insertó
        count_after = collection.count()
        print(f"DEBUG: Count después de add: {count_after}")
        
        print(f"✅ Trámite '{tramite['id']}' agregado a ChromaDB")
        return True
        
    except Exception as e:
        print(f"❌ Error agregando trámite: {e}")
        import traceback
        traceback.print_exc()
        return False

def search_tramites(query: str, n_results: int = 3, distance_threshold: float = 1.0) -> List[Dict]:
    """
    Busca trámites similares a la consulta
    
    Args:
        query: Consulta del usuario
        n_results: Cantidad de resultados a retornar
        distance_threshold: Umbral de distancia (mayor = más permisivo)
                           Valores típicos: 0.8-2.0
                           Si la distancia > threshold, se descarta el resultado
    
    Returns:
        Lista de trámites relevantes (como dicts)
    """
    try:
        collection = get_or_create_collection()
        
        # Buscar en ChromaDB (ChromaDB embebe el query automáticamente)
        results = collection.query(
            query_texts=[query],
            n_results=n_results
        )
        
        # Parsear resultados y filtrar por relevancia
        tramites = []
        if results['metadatas'] and results['metadatas'][0] and results['distances']:
            for i, metadata in enumerate(results['metadatas'][0]):
                distance = results['distances'][0][i]
                
                # Filtrar resultados poco relevantes
                if distance > distance_threshold:
                    print(f"⚠️ Resultado descartado por baja relevancia: {metadata.get('titulo', 'N/A')} (distancia: {distance:.2f})")
                    continue
                
                # Recuperar el JSON completo desde metadata
                if 'json_data' in metadata:
                    tramite = json.loads(metadata['json_data'])
                    print(f"✅ Resultado relevante: {tramite['titulo']} (distancia: {distance:.2f})")
                    tramites.append(tramite)
        
        return tramites
        
    except Exception as e:
        print(f"❌ Error buscando trámites: {e}")
        import traceback
        traceback.print_exc()
        return []

def delete_tramite(tramite_id: str) -> bool:
    try:
        collection = get_or_create_collection()
        
        # Verificar si el trámite existe antes de eliminarlo
        existing = collection.get(ids=[tramite_id])
        if not existing['ids']:
            print(f"❌ Trámite '{tramite_id}' no encontrado en ChromaDB")
            return False
        
        collection.delete(ids=[tramite_id])
        print(f"✅ Trámite '{tramite_id}' eliminado de ChromaDB")
        return True
    except Exception as e:
        print(f"❌ Error eliminando trámite: {e}")
        import traceback
        traceback.print_exc()
        return False

def get_collection_count() -> int:
    try:
        collection = get_or_create_collection()
        return collection.count()
    except Exception as e:
        print(f"❌ Error obteniendo count: {e}")
        return 0

def get_all_tramites() -> List[Dict]:
    """
    Obtiene todos los trámites almacenados en ChromaDB
    
    Returns:
        Lista de diccionarios con todos los trámites
    """
    try:
        collection = get_or_create_collection()
        
        # Obtener todos los documentos sin filtros
        results = collection.get()
        
        tramites = []
        if results['metadatas']:
            for metadata in results['metadatas']:
                # Recuperar el JSON completo desde metadata
                if 'json_data' in metadata:
                    tramites.append(json.loads(metadata['json_data']))
        
        print(f"✅ Recuperados {len(tramites)} trámites de ChromaDB")
        return tramites
        
    except Exception as e:
        print(f"❌ Error obteniendo todos los trámites: {e}")
        import traceback
        traceback.print_exc()
        return []