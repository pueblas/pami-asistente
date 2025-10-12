import React, { useState, useEffect } from 'react';
import './health.css';

function Health() {
  const [backendStatus, setBackendStatus] = useState('⏳ Verificando...');
  const [backendClass, setBackendClass] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  // Verificar conexión al cargar
  useEffect(() => {
    checkBackendConnection();
  }, []);

  const checkBackendConnection = async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      
      if (data.status === 'healthy') {
        setBackendStatus('✅ Conectado');
        setBackendClass('health__status--success');
      }
    } catch (error) {
      setBackendStatus('❌ Sin conexión');
      setBackendClass('health__status--error');
    }
  };

  const testConnection = async () => {
    setLoading(true);
    setResponse(null);
    
    try {
      const res = await fetch('/api/');
      const data = await res.json();
      
      setResponse({
        success: true,
        data: data,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (error) {
      setResponse({
        success: false,
        error: error.message
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="health__container">
      <div className="health__card">
        <h1 className="health__title">🤖 PAMI Asistente</h1>
        <p className="health__subtitle">Frontend React - Checkpoint 1</p>
        
        <div className="health__status-card">
          <h2 className="health__status-title">Estado de Servicios</h2>
          <div className="health__service">
            <span>Frontend:</span>
            <span className="health__status health__status--success">✅ Activo</span>
          </div>
          <div className="health__service">
            <span>Backend:</span>
            <span className={`health__status ${backendClass}`}>{backendStatus}</span>
          </div>
        </div>
        
        <button 
          className="health__test-button" 
          onClick={testConnection} 
          disabled={loading}
          aria-label="Probar conexión con el servidor backend"
        >
          {loading ? 'Conectando...' : 'Probar Conexión con Backend'}
        </button>
        
        {response && (
          <div className="health__response-box">
            {response.success ? (
              <>
                <h3 className="health__response-title">✅ Respuesta del Backend:</h3>
                <pre className="health__response-code">{JSON.stringify(response.data, null, 2)}</pre>
                <p className="health__timestamp">Hora: {response.timestamp}</p>
              </>
            ) : (
              <>
                <h3 className="health__response-title">❌ Error:</h3>
                <p>{response.error}</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Health;