# Collabora Online Entegrasyonu

Arkadaş ERP için Collabora Online entegrasyonu, Microsoft Office ve ODF formatındaki belgelerin (DOCX, XLSX, vb.) tarayıcı üzerinden online olarak düzenlenmesini sağlar. Sistem, endüstri standardı olan **WOPI (Web Application Open Platform Interface)** protokolünü kullanmaktadır.

## Servis Tanımı

`docker-compose.yml` içerisinde Collabora Online sunucusu aşağıdaki gibi tanımlıdır:

```yaml
  collabora:
    image: collabora/code:latest
    container_name: arkadasozelegitim-collabora-1
    environment:
      - domain=localhost
      - password=${COLLABORA_ADMIN_PASSWORD}
      - username=admin
      - dictionaries=tr_TR en_US
      - DONT_GEN_SSL_CERT=1
      - extra_params=--o:ssl.enable=false --o:ssl.termination=true
    ports:
      - "9980:9980"
    cap_add:
      - MKNOD
    restart: unless-stopped
```

## WOPI Protokolü (Backend)

Arkadaş ERP uygulaması `web` servisinde bir **WOPI Host** olarak davranır ve Collabora'ya aşağıdaki temel uç noktaları (endpoints) sunar:

- `CheckFileInfo`: Belge meta verilerini (boyut, isim, sahibi vb.) döndürür.
- `GetFile`: Dosyanın ikili (binary) içeriğini Collabora editörüne stream eder.
- `PutFile`: Kullanıcı belgeyi her kaydettiğinde veya otomatik kayıt yapıldığında belgeyi sunucuya (SFTPGo vb.) yazar.

Bu uç noktalar `web/src/app/api/wopi/[...path]/route.ts` dosyasında bulunur.

## Client Kullanımı

Web arayüzünde editörü başlatmak için istemci tarafında (`CollaboraEditor.tsx`) görünmez bir `<form>` ile Collabora'nın iframe URL'sine HTTP POST isteği (access_token ile birlikte) atılır:

```tsx
<form
    target="collabora-editor"
    action={`${process.env.NEXT_PUBLIC_COLLABORA_URL}/webedit/files/${docId}`}
    method="POST"
>
    {/* WOPI Access Token (JWT formatında güvenli bir şekilde imzalanmıştır) */}
    <input name="access_token" value={token} type="hidden" />
    <input name="access_token_ttl" value={ttl} type="hidden" />
</form>

<iframe
    name="collabora-editor"
    allow="fullscreen"
    className="w-full h-full border-0"
/>
```

Daha fazla detay için projenin `web/src/lib/collabora.ts` dosyasına göz atabilirsiniz.
