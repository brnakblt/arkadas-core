# Sistem Mimarisi

Bu belge, Arkadaş Özel Eğitim ERP sisteminin teknik mimarisini açıklar.

## 🏗️ Genel Bakış

```mermaid
graph TB
    subgraph Client["İstemciler"]
        Web["Web App<br/>(Next.js)"]
        Mobile["Mobil App<br/>(React Native)"]
        PWA["PWA"]
    end

    subgraph Backend["Backend Servisleri"]
        Strapi["Strapi CMS<br/>:1337"]
        AI["AI Servisi<br/>(Python Flask)"]
        NC["Nextcloud<br/>+ OnlyOffice"]
    end

    subgraph Database["Veritabanı"]
        PG["PostgreSQL<br/>+ PostGIS"]
        Redis["Redis Cache"]
    end

    Web --> Strapi
    Mobile --> Strapi
    PWA --> Strapi
    
    Strapi --> PG
    Strapi --> Redis
    Strapi --> AI
    Strapi --> NC
    
    AI --> PG
```

## 📦 Bileşenler

### Frontend

| Bileşen | Teknoloji | Port | Açıklama |
|---------|-----------|------|----------|
| Web | Next.js 15 | 3000 | Admin panel ve veli portalı |
| Mobile | Expo/RN | 8082 | iOS/Android uygulaması |
| PWA | Next.js | 3000 | Progressive Web App |

### Backend

| Bileşen | Teknoloji | Port | Açıklama |
|---------|-----------|------|----------|
| API | Strapi 4 | 1337 | REST/GraphQL API |
| AI | Flask | 5000 | Yüz tanıma servisi |
| Docs | OnlyOffice | 80 | Döküman editörü |
| Files | Nextcloud | 443 | Dosya yönetimi |

## 🔄 Veri Akışı

### Yoklama Süreci

```mermaid
sequenceDiagram
    participant M as Mobil App
    participant S as Strapi API
    participant AI as AI Servisi
    participant DB as PostgreSQL

    M->>S: Fotoğraf gönder
    S->>AI: Yüz kodlaması iste
    AI->>AI: face_recognition
    AI-->>S: Öğrenci ID + güven skoru
    S->>DB: Yoklama kaydı oluştur
    S-->>M: Başarılı yanıt
    M->>M: Push notification
```

### Servis Takibi

```mermaid
sequenceDiagram
    participant D as Sürücü App
    participant S as Strapi API
    participant DB as PostGIS
    participant P as Veli App

    loop Her 10 saniye
        D->>S: GPS koordinatları
        S->>DB: Konum güncelle
    end
    
    S->>S: Geofence kontrolü
    alt Hedefe yaklaştı
        S->>P: Push notification
    end
    
    P->>S: Canlı konum iste (SSE)
    S-->>P: Konum stream
```

## 🗄️ Veritabanı Şeması

```mermaid
erDiagram
    User ||--o{ StudentProfile : has
    User ||--o{ TeacherProfile : has
    User ||--o{ NextcloudSync : has
    
    StudentProfile ||--o{ AttendanceLog : has
    StudentProfile }o--o{ Schedule : participates
    StudentProfile }o--|| ServiceRoute : uses
    
    TeacherProfile }o--o{ Schedule : teaches
    
    ServiceRoute ||--o{ Waypoint : contains
    ServiceRoute ||--o{ LocationLog : tracks

    User {
        int id PK
        string email
        string username
        int role FK
    }
    
    StudentProfile {
        int id PK
        string firstName
        string lastName
        date birthDate
        string gender
        boolean isActive
        text faceEncoding
    }
    
    AttendanceLog {
        int id PK
        int student FK
        date date
        time checkIn
        time checkOut
        string method
        string status
    }
    
    Schedule {
        int id PK
        string title
        string type
        datetime startTime
        datetime endTime
        boolean recurring
    }
    
    ServiceRoute {
        int id PK
        string name
        string driver
        string vehicle
        boolean isActive
    }
```

## 🔐 Güvenlik Mimarisi

```mermaid
flowchart LR
    subgraph External
        User[Kullanıcı]
    end
    
    subgraph Edge
        CF[Cloudflare]
        WAF[Web App Firewall]
    end
    
    subgraph App
        NGINX[NGINX Reverse Proxy]
        CSP[CSP Headers]
        JWT[JWT Auth]
        RBAC[Role-Based Access]
    end
    
    subgraph Data
        Encrypt[Data Encryption]
        Audit[Audit Logging]
    end
    
    User --> CF --> WAF --> NGINX
    NGINX --> CSP --> JWT --> RBAC
    RBAC --> Encrypt --> Audit
```

### Güvenlik Katmanları

1. **Edge**: Cloudflare DDoS koruması, WAF
2. **Transport**: SSL/TLS, HSTS
3. **Application**: CSP, XSS koruması, CSRF token
4. **Authentication**: JWT, 2FA, session timeout
5. **Authorization**: RBAC, policy-based access
6. **Data**: Encryption at rest, audit logging

## 🚀 Deployment Mimarisi

```mermaid
graph TB
    subgraph Production
        LB[Load Balancer]
        
        subgraph Web Servers
            W1[Web Node 1]
            W2[Web Node 2]
        end
        
        subgraph API Servers
            A1[Strapi Node 1]
            A2[Strapi Node 2]
        end
        
        subgraph Database
            PG_Primary[(PostgreSQL Primary)]
            PG_Replica[(PostgreSQL Replica)]
        end
        
        Cache[(Redis Cluster)]
        Storage[/S3 Storage/]
    end
    
    LB --> W1 & W2
    LB --> A1 & A2
    A1 & A2 --> PG_Primary
    PG_Primary --> PG_Replica
    A1 & A2 --> Cache
    A1 & A2 --> Storage
```

## 📱 Mobil Mimari

```mermaid
graph TB
    subgraph App
        UI[React Native UI]
        Nav[Expo Router]
        State[React Query]
    end
    
    subgraph Hooks
        Auth[useBiometricAuth]
        Loc[useLocation]
        Push[usePushNotifications]
        Offline[useOfflineMode]
    end
    
    subgraph Storage
        Secure[SecureStore]
        Async[AsyncStorage]
        Cache[Query Cache]
    end
    
    UI --> Nav --> State
    State --> Hooks
    Auth --> Secure
    Offline --> Async
    State --> Cache
```

## 🔌 Entegrasyonlar

| Sistem | Protokol | Amaç |
|--------|----------|------|
| Nextcloud | WebDAV/OCS | Dosya depolama |
| OnlyOffice | iframe | Döküman düzenleme |
| Google Maps | REST | Harita ve konum |
| Firebase | FCM | Push notifications |
| AI Service | REST | Yüz tanıma |

## 📊 İzleme ve Logging

```mermaid
graph LR
    App[Uygulamalar] --> Logs[Log Aggregator]
    App --> Metrics[Prometheus]
    
    Logs --> Grafana
    Metrics --> Grafana
    
    Grafana --> Alerts[Alert Manager]
    Alerts --> Slack
    Alerts --> Email
```
