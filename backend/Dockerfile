FROM python:3.13-slim

WORKDIR /app

# Install system dependencies for cartopy
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgeos-dev libproj-dev proj-data proj-bin \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install production server
RUN pip install --no-cache-dir gunicorn

# Copy application code
COPY . .

# Create storage directory
RUN mkdir -p /app/app/storage/overlays

# Expose port
EXPOSE 8000

# Default: single worker for simple deployments
# For production with multiple workers, override CMD in docker-compose
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
