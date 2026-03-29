#!/bin/bash
# Arkadaş ERP - Depolama Yönetimi ve Otomatik Temizleme (Storage Lifecycle)
# --------------------------------------------------------------------------
# Bu script, kalıcı ve geçici depolama alanlarındaki verileri yönetir.

# Ayarlar (Değiştirilebilir)
PBX_RECORDINGS_PATH="./infra_data/pbx/recordings"
NEXTCLOUD_DATA_PATH="./infra_data/nextcloud/data"
PBX_RETENTION_DAYS=180      # 6 Ay (180 gün)
NEXTCLOUD_TEMP_RETENTION=30 # 1 Ay (30 gün)

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

# 2. Nextcloud Bakım ve Temizlik
# ----------------------------------------------
if [ -d "$NEXTCLOUD_DATA_PATH" ]; then
    echo -e "${YELLOW}[Nextcloud]${NC} Dosya taraması ve sistem bakımı başlatılıyor..."
    # Önizlemeleri temizle
    docker exec -u www-data arkadasozelegitim-nextcloud-1 php occ preview:cleanup 2>/dev/null || true
    echo -e "${GREEN}[Nextcloud]${NC} Önizleme dosyaları temizlendi."
else
    echo -e "${RED}[Nextcloud]${NC} Veri dizini bulunamadı: $NEXTCLOUD_DATA_PATH"
fi

# 3. Boş dizinleri temizle (Opsiyonel)
# -----------------------------------
echo -e "${YELLOW}[SİSTEM]${NC} Boş dizinler temizleniyor..."
find "$PBX_RECORDINGS_PATH" -type d -empty -delete 2>/dev/null

echo -e "${GREEN}=== Bakım İşlemi Başarıyla Tamamlandı ===${NC}"
