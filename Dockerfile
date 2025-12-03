# Use Python 3.11 slim image
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
COPY app_v2.py .
COPY order_frontend_v2.html .
COPY schema.sql .
COPY .env .

# Copy modular structure
COPY models/ models/
COPY routers/ routers/
COPY utils/ utils/
COPY database.py .

# Expose port 3000
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:3000/')" || exit 1

# Run the application (using new modular app.py)
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "3000"]
