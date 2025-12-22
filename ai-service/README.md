# AI Face Recognition Service

# Özel Eğitim Kurumu ERP - Yüz Tanıma Servisi

Python-based face recognition service for attendance tracking.

## Features

- Face encoding and storage
- Real-time face matching
- Confidence score calculation
- Batch face training

## Setup

```bash
cd ai-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/encode` | Encode face from image |
| POST | `/api/match` | Match face against database |
| POST | `/api/train` | Train model with new faces |
| GET | `/api/health` | Health check |

## Docker

```bash
docker build -t ai-face-service .
docker run -p 8000:8000 ai-face-service
```
