# ============================================================
# MEBBIS Sync Service Dockerfile - Using Official Playwright Image
# ============================================================
FROM mcr.microsoft.com/playwright/python:v1.42.0-jammy

WORKDIR /app

# Copy dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

EXPOSE 4000

# Playwright browsers are already installed in this image
CMD ["python", "main.py"]
