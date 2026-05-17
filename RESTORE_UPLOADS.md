# RESTORE_UPLOADS — `/app/uploads/` Yeniden Oluşturma

> Bu repoda `/app/uploads/` altındaki büyük PDF arşivleri **.gitignore'da**.
> GitHub'a push edildiğinde bu dosyalar gelmez — yeni bir job veya local
> dev makinesi bunları aşağıdaki yollarla geri yüklemelidir.

## Uploads dizininin durumu

| Dizin | Boyut | Repo'da mı? | Ne için? |
|-------|-------|-------------|----------|
| `/app/uploads/shipment_documents/` | ~28 MB | **EVET, push edildi** | 482 anonim PDF — pitch demo için kritik, DB `file_path`'leri buraya işaret ediyor |
| `/app/uploads/dhl_57_shipments/` | ~47 MB | HAYIR (`.gitignore`'da) | Orijinal kaynak PDF'ler — anonimleştirme pipeline için gerekli |
| `/app/uploads/dhl_pct_assets/` | ~32 MB | HAYIR | Eski analiz çıktısı — artık kullanılmıyor |
| `/app/uploads/dhl_pct_extracted/` | ~32 MB | HAYIR | Eski analiz çıktısı — artık kullanılmıyor |
| `/app/uploads/dhl_pct_pack.docx` | ~32 MB | HAYIR | Orijinal asset paketi — kullanıcıdan tekrar istenebilir |
| `/app/uploads/dhl_operasyon_evraklari/` | ~7 MB | HAYIR | Erken araştırma örnekleri — artık kullanılmıyor |

## Repo clone'dan sonra ne yapmalı?

### 1) Çekirdek senaryo — sadece web demo yeterli
Hiçbir şey yapmanıza gerek yok. `shipment_documents/` repo ile geliyor;
backend `/api/documents/{id}/preview` ve `/api/documents/{id}/download`
endpoint'leri tam çalışır, 482 PDF UI'da listelenir.

### 2) Anonimleştirme pipeline'ını yeniden çalıştırmak isterseniz
Eğer `document_filler.py` üzerinde değişiklik yapıp 57 shipment'ın
PDF'lerini sıfırdan re-anonimleştirmek istiyorsanız:

```bash
# Kaynak PDF'leri Emergent assets veya local yedek'ten /app/uploads/dhl_57_shipments/
# içine kopyala. Yapı:
#   dhl_57_shipments/
#     DHL-SWB-001_Delivered/
#       DHL-SWB-001_01_Commercial_Invoice.pdf
#       DHL-SWB-001_02_Packing_List.pdf
#       ...
#     DHL-SWB-029_Depot/
#       ...
#     ... (57 klasör toplam)

# Sonra mevcut anonim çıktıyı silip seed'i yeniden çalıştır:
cd /app/backend
python3 -c "
import asyncio, os
from motor.motor_asyncio import AsyncIOMotorClient
async def main():
    c = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = c[os.environ['DB_NAME']]
    await db.documents.delete_many({'is_demo_seed': True})
asyncio.run(main())
"
rm -rf /app/uploads/shipment_documents/*

python3 seed/seed_57_shipments.py
```

> ⚠️ **Kaynak PDF'lerin nereden geleceği:** Bu PDF'ler kullanıcının özel
> Emergent asset URL'lerinden indirildi (artık atıl). Yeniden ihtiyaç
> duyulduğunda kullanıcıdan tekrar talep edin — DHL operasyonel paperwork'ü
> halka açık değildir, başka bir kaynaktan otomatik indirme yoktur.

### 3) `dhl_pct_*` ve `dhl_operasyon_evraklari/` dizinleri
Artık kullanılmıyor. Yeni job'da bu klasörler eksik olabilir — bu beklenen
ve normal. Pitch demosunda hiçbir yerden referans alınmıyor.

## Yedek alma (push öncesi)
Eğer `dhl_57_shipments/` kaynak PDF'leri korumak istiyorsanız:
```bash
# Local yedek (repo dışına)
tar -czf ~/dhl_57_shipments_$(date +%Y%m%d).tar.gz /app/uploads/dhl_57_shipments/
```
veya bir cloud storage'a (S3, Google Drive vb.) manuel upload.

## Test
Demo hesabıyla giriş yapıp `/dashboard/shipments/DHL-SWB-001`'i açın:
- 8 belge listede görünmeli
- Bir tanesine tıklayınca PDF preview açılmalı

Açılmıyorsa: `shipment_documents/` dizini eksiktir; git pull ile geri yükleyin.
