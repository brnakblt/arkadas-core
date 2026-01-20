# OnlyOffice Entegrasyonu

Arkadaş ERP için OnlyOffice entegrasyonu, belgelerin tarayıcı üzerinden online düzenlenmesini sağlar.

## Servis Tanımı

```yaml
  onlyoffice:
    image: onlyoffice/documentserver
    ports:
      - "8081:80"
    volumes:
      - onlyoffice_data:/var/www/onlyoffice/Data
      - onlyoffice_log:/var/log/onlyoffice
    environment:
      - JWT_ENABLED=true
      - JWT_SECRET=arkadas_secret
```

## Client Kullanımı
Web arayüzünde editörü başlatmak için:

```javascript
const docEditor = new DocsAPI.DocEditor("placeholder", {
    "document": {
        "fileType": "docx",
        "key": "Khirz6zTPdfd7",
        "title": "Example Document Title.docx",
        "url": "https://example.com/url-to-example-document.docx"
    },
    "documentType": "word",
    "editorConfig": {
        "callbackUrl": "https://example.com/url-to-callback.ashx"
    }
});
```
