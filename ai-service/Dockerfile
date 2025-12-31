# AI Service Dockerfile
# Stage 1: Builder
FROM python:3.11-slim-bullseye as builder

WORKDIR /app

# Install Build Dependencies
RUN apt-get update && apt-get install -y \
    cmake \
    build-essential \
    libx11-dev \
    libgtk-3-dev \
    libboost-python-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Python Dependencies into a virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir dlib face_recognition

# Stage 2: Runtime
FROM python:3.11-slim-bullseye as runtime

WORKDIR /app

# Install Runtime Dependencies (libraries needed by dlib/opencv at runtime)
RUN apt-get update && apt-get install -y \
    libx11-6 \
    libgtk-3-0 \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy Application Code
COPY . .

# Create data directories and set permissions
RUN mkdir -p data/encodings data/temp && \
    chmod 777 data/encodings data/temp

# Security: Create a non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Change ownership of application directory
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

EXPOSE 8000

# Start Service
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
