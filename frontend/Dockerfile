# Etapa de build
FROM node:18-alpine as build

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código fuente
COPY public/ ./public
COPY src/ ./src

# Construir la app
RUN npm run build

# Etapa de producción con Nginx
FROM nginx:alpine

# Copiar build de React
COPY --from=build /app/build /usr/share/nginx/html

# Configuración de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80