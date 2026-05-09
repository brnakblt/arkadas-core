# SFTPGo Entegrasyonu

Bu klasör SFTPGo servisinin yapılandırma dosyalarını içerir.
SFTPGo, yerel veya bulut depolama alanları için tam özellikli ve yüksek performanslı bir SFTP sunucusudur.

## Kullanım
Docker Compose dosyasında servis aşağıdaki gibi tanımlanır:

```yaml
  sftpgo:
    image: drakkan/sftpgo:v2
    ports:
      - "8080:8080"
      - "2022:2022"
    volumes:
      - ./apis/sftpgo/sftpgo.json:/etc/sftpgo/sftpgo.json
      - sftpgo_data:/srv/sftpgo
      - sftpgo_home:/var/lib/sftpgo
```
