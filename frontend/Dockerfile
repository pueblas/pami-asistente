# Dockerfile para desarrollo con hot reloading
FROM node:18-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias (incluye dev dependencies para desarrollo)
RUN npm install

# Copiar código fuente
COPY . .

# Exponer puerto del dev server
EXPOSE 3000

# Comando para desarrollo con hot reloading
CMD ["npm", "start"]