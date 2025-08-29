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
        setBackendClass('success');
      }
    } catch (error) {
      setBackendStatus('❌ Sin conexión');
      setBackendClass('error');
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
    <div className="App">
      <div className="container">
        <h1>🤖 PAMI Asistente</h1>
        <p className="subtitle">Frontend React - Checkpoint 1</p>
        
        <div className="status-card">
          <h2>Estado de Servicios</h2>
          <div className="service">
            <span>Frontend:</span>
            <span className="status">✅ Activo</span>
          </div>
          <div className="service">
            <span>Backend:</span>
            <span className={`status ${backendClass}`}>{backendStatus}</span>
          </div>
        </div>
        
        <button onClick={testConnection} disabled={loading}>
          {loading ? 'Conectando...' : 'Probar Conexión con Backend'}
        </button>
        
        {response && (
          <div className="response-box">
            {response.success ? (
              <>
                <h3>✅ Respuesta del Backend:</h3>
                <pre>{JSON.stringify(response.data, null, 2)}</pre>
                <p className="timestamp">Hora: {response.timestamp}</p>
              </>
            ) : (
              <>
                <h3>❌ Error:</h3>
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