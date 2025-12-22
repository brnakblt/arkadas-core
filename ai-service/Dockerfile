# AI Service Dockerfile
FROM python:3.11-slim-bullseye

WORKDIR /app

# Install System Dependencies for Dlib/OpenCV
RUN apt-get update && apt-get install -y \
    cmake \
    build-essential \
    libx11-dev \
    libgtk-3-dev \
    libboost-python-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python Dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    # Ensure dlib and face_recognition are installed if not in requirements
    pip install --no-cache-dir dlib face_recognition 

# Copy Application Code
COPY . .

# Create data directories
RUN mkdir -p data/encodings data/temp && chmod 777 data/encodings data/temp

EXPOSE 8000

# Start Service
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
