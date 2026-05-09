#!/bin/bash
# Arkadaş ERP - Depolama Yönetimi ve Otomatik Temizleme (Storage Lifecycle)
# --------------------------------------------------------------------------
# Bu script, kalıcı ve geçici depolama alanlarındaki verileri yönetir.

# Ayarlar (Değiştirilebilir)
PBX_RECORDINGS_PATH="./infra_data/pbx/recordings"
SFTPGO_TEMP_PATH="./infra_data/sftpgo/data/temporary"
PBX_RETENTION_DAYS=180      # 6 Ay (180 gün)
SFTPGO_RETENTION_DAYS=30    # 1 Ay (30 gün)

# Renkler
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Arkadaş ERP: Depolama Bakım İşlemi Başladı ===${NC}"

# 1. PBX Konuşma Kayıtları Temizliği (6 Ay Sonrası)
# ------------------------------------------------
if [ -d "$PBX_RECORDINGS_PATH" ]; then
    echo -e "${YELLOW}[PBX]${NC} 6 aydan eski konuşma kayıtları taranıyor..."
    # .wav veya .mp3 dosyalarını bul ve sil
    DELETED_COUNT=$(find "$PBX_RECORDINGS_PATH" -type f -mtime +$PBX_RETENTION_DAYS \( -name "*.wav" -o -name "*.mp3" \) -print | wc -l)
    
    if [ "$DELETED_COUNT" -gt 0 ]; then
        find "$PBX_RECORDINGS_PATH" -type f -mtime +$PBX_RETENTION_DAYS \( -name "*.wav" -o -name "*.mp3" \) -delete
        echo -e "${GREEN}[PBX]${NC} $DELETED_COUNT adet eski kayıt başarıyla silindi."
    else
        echo -e "${GREEN}[PBX]${NC} Silinecek eski kayıt bulunamadı."
    fi
else
    echo -e "${RED}[PBX]${NC} Kayıt dizini bulunamadı: $PBX_RECORDINGS_PATH"
fi

# 2. SFTPGo Geçici Veri Temizliği (1 Ay Sonrası)
# ----------------------------------------------
if [ -d "$SFTPGO_TEMP_PATH" ]; then
    echo -e "${YELLOW}[SFTPGo]${NC} 1 aydan eski geçici dosyalar taranıyor..."
    DELETED_FILES=$(find "$SFTPGO_TEMP_PATH" -type f -mtime +$SFTPGO_RETENTION_DAYS -print | wc -l)
    
    if [ "$DELETED_FILES" -gt 0 ]; then
        find "$SFTPGO_TEMP_PATH" -type f -mtime +$SFTPGO_RETENTION_DAYS -delete
        echo -e "${GREEN}[SFTPGo]${NC} $DELETED_FILES adet geçici dosya silindi."
    else
        echo -e "${GREEN}[SFTPGo]${NC} Silinecek geçici dosya bulunamadı."
    fi
else
    # Eğer dizin yoksa oluştur (Öneri)
    mkdir -p "$SFTPGO_TEMP_PATH"
    echo -e "${BLUE}[SFTPGo]${NC} Geçici veri dizini oluşturuldu: $SFTPGO_TEMP_PATH"
fi

# 3. Boş dizinleri temizle (Opsiyonel)
# -----------------------------------
echo -e "${YELLOW}[SİSTEM]${NC} Boş dizinler temizleniyor..."
find "$PBX_RECORDINGS_PATH" -type d -empty -delete 2>/dev/null
find "$SFTPGO_TEMP_PATH" -type d -empty -delete 2>/dev/null

echo -e "${GREEN}=== Bakım İşlemi Başarıyla Tamamlandı ===${NC}"
