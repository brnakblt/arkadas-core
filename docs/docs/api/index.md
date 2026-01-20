# API Dokümantasyonu

Arkadaş Özel Eğitim ERP sistemi REST API rehberi.

## 🔐 Kimlik Doğrulama

API, JWT (JSON Web Token) tabanlı kimlik doğrulama kullanır.

### Giriş Yapma

```bash
curl -X POST http://localhost:1337/api/auth/local \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "admin@arkadas.com",
    "password": "Password123"
  }'
```

### Token Kullanımı

```bash
curl http://localhost:1337/api/student-profiles \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📚 API Endpoint'leri

### Öğrenci Yönetimi

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/student-profiles` | Öğrenci listesi |
| GET | `/api/student-profiles/:id` | Öğrenci detayı |
| POST | `/api/student-profiles` | Yeni öğrenci |
| PUT | `/api/student-profiles/:id` | Güncelle |
| DELETE | `/api/student-profiles/:id` | Sil |

### Yoklama

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/attendance-logs` | Yoklama listesi |
| POST | `/api/attendance-logs` | Yoklama kaydet |
| POST | `/api/attendance-logs/face-recognition` | Yüz tanıma ile |

### Program

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/schedules` | Program listesi |
| POST | `/api/schedules` | Program oluştur |
| PUT | `/api/schedules/:id` | Güncelle |

### Servis Takibi

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/service-routes` | Güzergahlar |
| POST | `/api/service-routes/:id/location` | GPS güncelle |
| GET | `/api/service-routes/:id/live` | Canlı konum (SSE) |

### 🤖 Yapay Zeka (AI)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/ai/generate-bep` | Öğrenci bilgilerine göre BEP taslağı üretir |

#### BEP Üretme İsteği (POST)

```bash
curl -X POST http://localhost:3000/api/ai/generate-bep \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ali Yılmaz",
    "age": 9,
    "diagnosis": "Otizm Spektrum Bozukluğu",
    "observations": "Görsel eşlemede başarılı, sözel yönerge takibinde zorlanıyor.",
    "strengths": ["Görsel hafıza", "Müzik ilgisi"],
    "needs": ["Göz teması", "İnce motor becerileri"]
  }'
```

#### Örnek Yanıt

```json
{
  "studentName": "Ali Yılmaz",
  "bepDate": "20.01.2026",
  "performanceLevel": "Öğrencinin mevcut performansı...",
  "longTermGoals": ["Hedef 1"],
  "shortTermGoals": ["Alt hedef 1.1"],
  "teachingMethods": ["Doğrudan Öğretim"],
  "materials": ["Eğitim kartları"],
  "evaluationMethods": ["Gözlem formu"],
  "recommendations": ["Uzman önerisi..."]
}
```

## 🔍 Filtreleme ve Sayfalama

### Sayfalama

```
?pagination[page]=1&pagination[pageSize]=25
```

### Filtreleme

```
?filters[isActive][$eq]=true
?filters[date][$gte]=2024-01-01
?filters[student][id][$eq]=5
```

### Sıralama

```
?sort=createdAt:desc
?sort[0]=lastName:asc&sort[1]=firstName:asc
```

## 📊 Yanıt Formatı

### Başarılı Yanıt

```json
{
  "data": {
    "id": 1,
    "attributes": {
      "firstName": "Ahmet",
      "lastName": "Yılmaz"
    }
  },
  "meta": {}
}
```

### Liste Yanıtı

```json
{
  "data": [...],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 4,
      "total": 100
    }
  }
}
```

### Hata Yanıtı

```json
{
  "error": {
    "status": 400,
    "name": "ValidationError",
    "message": "Geçersiz veri",
    "details": {}
  }
}
```

## 🛡️ Rate Limiting

| Rol | Limit |
|-----|-------|
| Anonim | 10/dakika |
| Authenticated | 100/dakika |
| Admin | 1000/dakika |

## 📖 OpenAPI Spec

Tam API spesifikasyonu için: [openapi.yaml](./openapi.yaml)

Swagger UI ile görüntülemek için:

```bash
npx swagger-ui-watcher docs/docs/api/openapi.yaml
```
