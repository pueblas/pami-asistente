// Verificar conexión al cargar la página
window.addEventListener('DOMContentLoaded', async () => {
    await checkBackendConnection();
});

// Función para verificar conexión con backend
async function checkBackendConnection() {
    const statusElement = document.getElementById('backend-status');
    
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        
        if (data.status === 'healthy') {
            statusElement.textContent = '✅ Conectado';
            statusElement.className = 'status success';
        }
    } catch (error) {
        statusElement.textContent = '❌ Sin conexión';
        statusElement.className = 'status error';
    }
}

// Botón de prueba
document.getElementById('test-btn').addEventListener('click', async () => {
    const responseDiv = document.getElementById('response');
    responseDiv.innerHTML = '<p>Enviando solicitud...</p>';
    
    try {
        const response = await fetch('/api/');
        const data = await response.json();
        
        responseDiv.innerHTML = `
            <h3>✅ Respuesta del Backend:</h3>
            <pre>${JSON.stringify(data, null, 2)}</pre>
            <p class="timestamp">Hora: ${new Date().toLocaleTimeString()}</p>
        `;
    } catch (error) {
        responseDiv.innerHTML = `
            <h3>❌ Error:</h3>
            <p>${error.message}</p>
        `;
    }
});