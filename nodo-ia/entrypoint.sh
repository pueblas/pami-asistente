#!/bin/bash

# Iniciar Ollama en background
ollama serve &

# Esperar que Ollama esté disponible
sleep 5

# Intentar descargar el modelo (no falla si ya existe)
ollama pull llama3.2:3b || true

# Mantener Ollama corriendo en foreground
wait