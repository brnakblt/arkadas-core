# API Dokümantasyonu

Bu doküman, Arkadaş ERP sisteminin API endpoint'lerini açıklar.

## İçindekiler

1. [Kimlik Doğrulama](#kimlik-doğrulama)
2. [Dashboard API](#dashboard-api)
3. [Tenant Yönetimi](#tenant-yönetimi)
4. [Bildirim Sistemi](#bildirim-sistemi)
5. [Raporlama](#raporlama)

---

## Kimlik Doğrulama

### POST `/api/auth/login`

Kullanıcı girişi yapar.

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

**Query Parameters:**
- `search` - Arama terimi
- `page` - Sayfa numarası
- `pageSize` - Sayfa boyutu

### POST `/api/admin/tenants`

Yeni tenant oluşturur.

**Request Body:**
```json
{
  "name": "Yeni Kurum",
  "domain": "yeni.example.com",
  "contactEmail": "admin@yeni.example.com",
  "mebbisUsername": "mebbis_user",
  "mebbisPassword": "encrypted_password"
}
```

### GET `/api/admin/tenants/[id]`

Tenant detaylarını (kullanıcılar ve öğrenciler dahil) döndürür.

### PUT `/api/admin/tenants/[id]`

Tenant bilgilerini günceller.

### DELETE `/api/admin/tenants/[id]`

Tenant'ı siler.

### GET `/api/admin/tenants/[id]/users`

Tenant'a atanmış kullanıcıları listeler.

### POST `/api/admin/tenants/[id]/users`

Kullanıcıyı tenant'a atar.

**Request Body:**
```json
{ "userId": 5 }
```

### DELETE `/api/admin/tenants/[id]/users?userId=5`

Kullanıcıyı tenant'tan çıkarır.

---

## Bildirim Sistemi

### POST `/api/notifications/send`

Tenant kullanıcılarına push bildirim gönderir.

**Request Body:**
```json
{
  "type": "attendance",
  "message": "Öğrenci yoklama bildirimi",
  "userIds": [1, 2, 3],
  "data": { "studentName": "Ali" }
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

### GET `/api/notifications/send`

Mevcut bildirim tiplerini listeler.

### POST `/api/notifications/sms`

Tenant velilerine SMS gönderir.

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

**SMS Şablonları:**
- `attendance_alert` - Yoklama bildirimi
- `schedule_reminder` - Program hatırlatması
- `emergency` - Acil durum
- `payment_reminder` - Ödeme hatırlatması
- `parent_notification` - Veli bilgilendirmesi

### GET `/api/notifications/sms`

SMS şablon bilgilerini döndürür.

---

## Raporlama

### GET `/api/reports`

Tenant bazlı rapor listesi döndürür.

**Query Parameters:**
- `type` - Rapor tipi (`bep`, `yoklama`, `fatura`, `ilerleme`)
- `studentId` - Öğrenci ID
- `startDate` - Başlangıç tarihi
- `endDate` - Bitiş tarihi
- `page` - Sayfa numarası
- `pageSize` - Sayfa boyutu

**Response:**
```json
{
  "reports": [
    {
      "id": 1,
      "documentId": "abc123",
      "title": "Ocak 2024 BEP",
      "type": "bep",
      "studentName": "Ali Yılmaz",
      "createdAt": "2024-01-15T10:00:00Z",
      "status": "published"
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "total": 45 }
}
```

### GET `/api/reports/[id]/pdf?type=bep`

Raporu yazdırılabilir HTML formatında döndürür.

**Query Parameters:**
- `type` - Rapor tipi (`bep`, `yoklama`, `fatura`)

**Response:** HTML doküman (tarayıcıda yazdır/PDF kaydet)

---

## Hata Kodları

| Kod | Açıklama |
|-----|----------|
| 400 | Geçersiz istek |
| 401 | Yetkisiz erişim |
| 403 | Erişim reddedildi |
| 404 | Kaynak bulunamadı |
| 500 | Sunucu hatası |

---

## Tenant İzolasyonu

Tüm API endpoint'leri otomatik olarak tenant bazlı filtreleme uygular:

1. Kullanıcının tenant'ı JWT token'dan alınır
2. Strapi lifecycle hook'ları tüm sorgulara tenant filtresi ekler
3. Cross-tenant veri erişimi engellenir

**Korunan Content Type'lar:**
- student-profile
- bireysel-egitim-plani
- rapor
- yoklama
- fatura
- schedule
- appointment
- attendance-log
- teacher-profile
- service-route
- route-stop
- location-log
