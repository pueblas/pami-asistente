FROM nginx:alpine

# Copiar archivos estáticos
COPY index.html /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/

# Configuración para permitir CORS y comunicación con backend
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80