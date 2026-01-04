# API Dokümantasyonu

Bu doküman, Arkadaş ERP sisteminin API endpoint'lerini açıklar.

## Servis Mimarisi

| Servis | Port | Açıklama |
|--------|------|----------|
| **Web API** | 3000 | Next.js API Routes |
| **Strapi API** | 1337 | Strapi REST/GraphQL |
| **AI Service** | 8000 | Yüz Tanıma API |
| **Mebbis Service** | 4000 | MEBBİS Otomasyon |

---

## Kimlik Doğrulama

### POST `/api/auth/login`

Kullanıcı girişi yapar. **Rate limited:** 5 deneme/15 dakika.

**Request Body:**
```json
{
  "identifier": "user@example.com",
  "password": "password123",
  "tenantId": 1
}
```

**Response:**
```json
{
  "jwt": "eyJhbGciOi...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "userType": "teacher"
  }
}
```

**Hata Kodları:**
- `401` - Geçersiz kimlik bilgileri
- `429` - Çok fazla deneme (rate limited)

### GET `/api/tenants`

Aktif tenant listesini döndürür (login dropdown için).

**Response:**
```json
{
  "tenants": [
    { "id": 1, "name": "Kurum A", "domain": "a.example.com" }
  ]
}
```

---

## AI Service API (Port 8000)

### GET `/docs`
Swagger UI dokümantasyonu.

### POST `/face/enroll`
Yüz kaydı yapar.

**Headers:**
- `x-api-key: <AI_SERVICE_API_KEY>`
- `x-tenant-id: <tenant_id>`

**Request (multipart/form-data):**
- `image`: Yüz fotoğrafı
- `user_id`: Kullanıcı ID
- `name`: İsim

### POST `/face/identify`
Yüz tanıma yapar.

**Headers:**
- `x-api-key: <AI_SERVICE_API_KEY>`
- `x-tenant-id: <tenant_id>` (zorunlu)

**Request (multipart/form-data):**
- `image`: Yüz fotoğrafı

**Response:**
```json
{
  "matches": [
    {
      "user_id": "123",
      "name": "Ahmet Yılmaz",
      "confidence": 0.95
    }
  ]
}
```

---

## Mebbis Service API (Port 4000)

### GET `/health`
Servis sağlık kontrolü.

### POST `/api/sync/students`
Öğrenci senkronizasyonu başlatır.

**Headers:**
- `x-api-key: <MEBBIS_SERVICE_API_KEY>`
- `x-tenant-id: <tenant_id>`

### POST `/api/education/entry`
Eğitim bilgi girişi yapar.

---

## Dashboard API

### GET `/api/dashboard/stats`

Mevcut kullanıcının tenant'ına ait istatistikleri döndürür.

**Headers:**
- `Cookie: strapi_jwt=<token>`

**Response:**
```json
{
  "stats": {
    "studentsCount": 45,
    "usersCount": 12,
    "appointmentsThisWeek": 8,
    "invoicesThisMonth": 23,
    "reportsCount": 156,
    "pendingBep": 3
  },
  "tenantName": "Kurum A"
}
```

---

## Tenant Yönetimi

> **Not:** Admin yetkisi gerektirir.

### GET `/api/admin/tenants`
Tüm tenant'ları listeler.

### POST `/api/admin/tenants`
Yeni tenant oluşturur.

### GET `/api/admin/tenants/[id]`
Tenant detaylarını döndürür.

### PUT `/api/admin/tenants/[id]`
Tenant bilgilerini günceller.

### DELETE `/api/admin/tenants/[id]`
Tenant'ı siler.

---

## Bildirim Sistemi

### POST `/api/notifications/send`

Push bildirim gönderir.

**Request Body:**
```json
{
  "type": "attendance",
  "message": "Öğrenci yoklama bildirimi",
  "userIds": [1, 2, 3]
}
```

**Bildirim Tipleri:**
- `attendance` - Yoklama
- `schedule` - Program hatırlatması
- `message` - Mesaj
- `invoice` - Fatura
- `alert` - Uyarı
- `reminder` - Hatırlatma
- `report` - Rapor hazır

### POST `/api/notifications/sms`

SMS gönderir.

**Request Body:**
```json
{
  "templateType": "attendance_alert",
  "data": {
    "studentName": "Ali",
    "status": "present",
    "time": "08:30"
  }
}
```

---

## API Proxy

### `/api/proxy/*`

Strapi API'ye proxy yapar. **Kısıtlı:** Sadece `api/*` path'lerine izin verir.

**Engellenen Path'ler:**
- `admin/*`
- `_health`
- `users/me`
- `upload/*`

---

## Hata Kodları

| Kod | Açıklama |
|-----|----------|
| 400 | Geçersiz istek |
| 401 | Yetkisiz erişim |
| 403 | Erişim reddedildi |
| 404 | Kaynak bulunamadı |
| 429 | Rate limit aşıldı |
| 500 | Sunucu hatası |
| 503 | Servis yapılandırma hatası |

---

## Tenant İzolasyonu

Tüm API endpoint'leri otomatik olarak tenant bazlı filtreleme uygular:

1. Kullanıcının tenant'ı JWT token'dan alınır
2. Strapi lifecycle hook'ları tüm sorgulara tenant filtresi ekler
3. Cross-tenant veri erişimi engellenir

**Güvenlik:**
- `x-tenant-id` header zorunlu (AI/Mebbis servisleri)
- 'default' tenant değeri reddedilir
- Geçersiz format kontrolü
