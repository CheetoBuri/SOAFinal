# Use Python 3.11 slim image
FROM node:18-alpine AS react-build

WORKDIR /build

# Copy React app and build with Vite
COPY frontend/react/package.json frontend/react/vite.config.js frontend/react/ ./frontend/react/
# Include React source
COPY frontend/react/src ./frontend/react/src
COPY frontend/react/index.html ./frontend/react/index.html

RUN cd frontend/react \
    && npm install \
    && npm run build

# ---------------- Final Python image ----------------
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for better caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY app.py .
COPY index.html .
# Optional legacy file; omit if not present
# COPY home.html .
COPY schema.sql .
COPY .env .

# Copy modular structure
COPY models/ models/
COPY routers/ routers/
COPY utils/ utils/
COPY frontend/ frontend/
COPY database.py .

# Copy built React app from builder
COPY --from=react-build /build/frontend/react/dist ./frontend/react/dist

# Expose port 3000
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:3000/')" || exit 1

# Run the application with reload for development
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "3000", "--reload"]
