FROM python:3.13-slim

WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY app.py .
COPY cafe_pos_system.py .
COPY frontend.html .

# Expose port
EXPOSE 3000

# Run application
CMD ["python", "app.py"]
