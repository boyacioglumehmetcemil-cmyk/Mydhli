# DHL Global Forwarding PNG — Pitch Demo — HANDOVER

> **Yeni Emergent job'unda devam etmeden önce bu dosyayı eksiksiz okuyun.**
> Bu handover, mobil parite çalışmasının başlaması için gereken her şeyi içerir.

## Proje Özeti
DHL'in Papua New Guinea operasyonu için gerçekçi, pixel-perfect myDHLi Forwarding klonu. Yüksek riskli pitch demosu. Referans: https://mydhl.express.dhl/pg/en/auth/logout.html
**Kullanıcı Türkçe konuşur — agent her zaman Türkçe yanıt vermelidir.**

## Mevcut Durum (Web — TAMAM)
- **Stack:** `/app/frontend` React CRA + Tailwind + shadcn/ui; `/app/backend` FastAPI + Motor / MongoDB
- **Web preview:** https://cargo-connect-416.preview.emergentagent.com
- **Auth:** JWT (HS256, 7 gün)
- **Demo:** `demo@dhlpng.com` / `Demo@2026`
- **Shipper:** `shipper@dhlpng.com` / `Shipper@2026`

### Tamamlanmış Web Özellikleri
- **57 Ocean Freight shipment** (Singapore → PNG / Fiji), 31 Delivered + 26 At Depot
- **482 anonim DHL operasyonel PDF** (PyMuPDF ile anonimleştirildi)
- 10-item myDHLi Forwarding sidebar (Express terminolojisi temizlendi)
- **AT_DEPOT business logic**: `final depot + 5 business gün deadline`, `pickupDaysRemaining`, `pickupOverdue` rozetleri (`shipment.oceanSpecifics`)
- **Virtual invoice ledger**: USD 269,180 toplam (PAID/OVERDUE)
- **Customs sayfası**: 57 customs dokümanı
- **Global Documents sayfası**: 482 PDF, filtreler
- **Parties**: Shipper / Consignee / Notify rolleri
- **Settings**: 4 sekme (Profile, Notifications, Account Security, Billing)
- **Dashboard Track** auth wrapper içinde (`/dashboard/track`)
- **Brand**: DHL sarı `#FFCC00`, kırmızı `#D40511`, Made-with-Emergent badge
- **Notifications**: AT_DEPOT overdue alarmları, ` /dashboard/notifications` tam sayfa inbox

## YASAK / DİKKAT (Faz 8.4c GERİ ALINDI)
| Şey | Durum |
|-----|-------|
| `POST /api/shipments/{ref}/generate-documents` | **404 — KULLANMA** |
| `GET /api/document-templates` | **404 — KULLANMA** |
| "Generate Documents" butonu / modali | **EKLEME** (kullanıcı reddetti — "BU OLMAMIS COK BOKTAN DURUYOR") |
| Jenerik PDF üretme, sahte logo overlay | **KESİNLİKLE YASAK** |
| PII (`Mehmet` / `Cemil` / `BOYACIOGLU`) | Repoda **SIFIR** olmalı — düzenli grep ile doğrula |
| `docxtpl`, `python-docx` paketleri | `requirements.txt`'ten KALDIRILDI, **geri ekleme** |
| `forwarding_doc_generator.py` | **silindi**, geri oluşturma |
| `backend/templates/forwarding/*` | **silindi**, geri oluşturma |

## Sonraki Görev: Mobil Parite (Expo)
- **Dizin:** `/app/mobile/`
- **Backend ortak.** OpenAPI spec: `/api/openapi.json`
- **Önerilen agent:** `e1_expo_frontend_dev` (yeni job'da taze workflowID ile)
- Mobil uygulama şu an web ile **uyum dışı** — Phase 8.3+8.4 değişiklikleri mobile'a yansıtılmadı.

### Mobil 10 Sayfa Gereksinimi
1. **Login** — JWT, `expo-secure-store` ile token persistence
2. **Dashboard KPI'lar** — totals, AT_DEPOT count, overdue pickups, USD 269,180 billed
3. **Shipments listesi** — 57 kayıt, Delivered / At Depot filtre, AT_DEPOT satırında `pickupDaysRemaining` + `pickupOverdue` rozetleri
4. **Shipment detay** — route, parties, milestones timeline, documents tab → PDF preview (`react-native-pdf` veya WebView)
5. **Tracking** — auth wrapper içinde, web'deki `/dashboard/track` ile aynı API
6. **Parties** — Shipper / Consignee / Notify directory (web'deki tablo karşılığı)
7. **Invoices ledger** — PAID / OVERDUE, USD 269,180 total
8. **Customs** — 57 doküman
9. **Documents global** — 482 PDF, filtre, preview / download → **Generate butonu YOK**
10. **Settings** — 4 sekme

### Mobil Tech Notları
- `EXPO_PUBLIC_BACKEND_URL` env değişkeni kullan; **hardcode YOK**
- `yarn install` / `yarn add` **`/app/mobile`** içinde
- **Real backend data only**, mock YOK
- Forwarding terminolojisi: **Pre-carriage, Booking Sheet, Consignee / Shipper / Notify**; `courier` / `parcel` / `Express Worldwide` YOK
- Renk: `#FFCC00` (yellow), `#D40511` (red), text `#333333`, muted `#666666`

## Bekleyen Kullanıcı Girdileri
- **P2:** Yüksek çözünürlüklü temiz DHL Global Forwarding logosu (SVG veya transparent PNG) — kullanıcı sağlayınca PDF'lere uygulanacak. **Kullanıcı sağlamadan UYGULAMA.**
- **P2:** Resmi DHL boş şablonlar (Proforma, CoO, PNG SAD, Permit, D/O, Pre-Alert) — kullanıcı sağlayınca implementasyon.

## Önemli Dosyalar (Web)
- `/app/frontend/src/pages/Dashboard.jsx` — KPI'lar, AT_DEPOT alarmları, recent shipments
- `/app/frontend/src/pages/Invoices.jsx` — virtual ledger
- `/app/frontend/src/pages/DocumentsGlobal.jsx` — 482 PDF global liste
- `/app/frontend/src/pages/Customs.jsx` — customs dokümanları
- `/app/frontend/src/pages/Addresses.jsx` — Parties tablosu (yeni isim "Parties")
- `/app/frontend/src/pages/Settings.jsx` — 4-tab
- `/app/frontend/src/pages/DashboardTrack.jsx` — auth track sayfası
- `/app/frontend/src/components/documents/DocumentsSection.jsx` — **Generate butonu KALDIRILDI**, sadece Upload butonu var
- `/app/frontend/src/components/TrackingDetail.jsx` — Forwarder action butonları
- `/app/backend/server.py` — main FastAPI app, router mount'lar
- `/app/backend/shipments_module.py` — 57 shipment seed + AT_DEPOT logic
- `/app/backend/document_filler.py` — **PyMuPDF anonimleştirme (KORU)**
- `/app/backend/seed/anonymization_map.json` — anonimleştirme audit izi (PII redacted)
- `/app/backend/seed/seed_57_shipments.py` — master 57 shipment + 482 PDF seeder
- `/app/backend/address_seed.py` — v2 schema (SHIPPER / CONSIGNEE / NOTIFY rolleri)
- `/app/backend/notifications_module.py` — `_normalize` bridge (kind→type alias)
- `/app/backend/scripts/revert_logo_overlay.py` — Phase 8.4c geri alma scripti (referans amaçlı tutuldu)

## DB Schema Notları
- **`shipments` collection:** `oceanSpecifics` objesi (`atDepotSince`, `buyerPickupDeadline`, `pickupDaysRemaining`, `pickupOverdue`)
- **`documents` collection:** 482 PDF metadata, `shipment_ref` ile bağlı, `file_path` mutlak yol (`/app/uploads/shipment_documents/{ref}/{uuid}.pdf`)
- **`addresses` collection:** v2 schema — `role` field (SHIPPER/CONSIGNEE/NOTIFY) + backward compat `isDefaultSender`/`isDefaultReceiver`
- **`notifications` collection:** mixed schema — bazılarında `type`+`subtitle`, bazılarında `kind`+`body`; `_normalize()` ikisini de normalize eder
- **`invoices`/`customs_entries`:** shipper user için seed (5 invoice + 4 customs)

## API Endpoints (Mobil için)
- `POST /api/auth/login` → `access_token`
- `GET /api/auth/me`
- `GET /api/shipments?page=&pageSize=&status=`
- `GET /api/shipments/{ref}` — detail
- `GET /api/shipments/{ref}/documents`
- `GET /api/track/{ref}` — public tracking
- `GET /api/documents?type=&page_size=` — global
- `GET /api/documents/{id}/preview` — PDF bytes inline
- `GET /api/documents/{id}/download` — PDF attachment
- `GET /api/notifications` — list (use response.items)
- `GET /api/notifications/unread-count`
- `GET /api/addresses`
- `GET /api/invoices` (virtual ledger)
- `GET /api/customs`
- `GET /api/locations/countries`
- **YOK / 404:** `POST /api/shipments/{ref}/generate-documents`, `GET /api/document-templates`

## Test Hesapları
- **Demo:** `demo@dhlpng.com` / `Demo@2026`
- **Shipper:** `shipper@dhlpng.com` / `Shipper@2026`
- Token alma:
  ```bash
  curl -s -X POST "$API/api/auth/login" \
    -H 'Content-Type: application/json' \
    -d '{"email":"demo@dhlpng.com","password":"Demo@2026"}'
  ```

## Standing Assertions (her PR'da geçmeli)
1. Landing page'de gerçek müşteri metni yok (sadece original copy)
2. Sidebar logo: "Global Forwarding" lockup, "Express" değil
3. Footer tek bir DHL footer (duplicate yok)
4. Sağ alt köşede "Made with Emergent" badge görünür (DEMO MODE rozeti)

## Faz Geçmişi (özet)
- **Faz 1–7:** Auth, dashboard, shipments listesi, tracking, address book, settings (Phase 1 spec'i)
- **Faz 8.0–8.2:** Ocean specifics, multimodal mode field, currency context, virtual ledger
- **Faz 8.3:** Documents module — upload, approve/reject, soft delete
- **Faz 8.3b:** PyMuPDF anonimleştirme — 482 PDF
- **Faz 8.4:** Parties rebrand, Settings 4-tab, DashboardTrack, Notifications normalize, terminology audit
- **Faz 8.4c:** Logo overlay + jenerik docxtpl pipeline → **REVERT** (kullanıcı reddetti)

## Yeni Job Başlangıç Komutu
> Read `/app/memory/HANDOVER.md` and continue with mobile Expo parity at `/app/mobile`. Backend is live; do **not** add a generate-documents UI or pipeline. User speaks Turkish — respond in Turkish.

## Faz 8.5 — PWA + Backend backward-compat hotfix — 2026-05-20

### Problem
- Kullanıcı telefondan `https://merhaba-app-446.emergent.host/` adresinden
  "Add to Home Screen" yapınca **web sitesinin PWA'sı** yükleniyordu;
  ikona basınca web `/login` (CRA split-screen) açılıyordu, mobil app'in
  `/m/login`'i değil. Faz 7.9'da rol bölünmesi yapılmıştı ama web shell'i
  hala kendi manifest+service-worker'ıyla "installable" sinyali veriyordu.

### Çözüm — Web artık PWA değil
- **`frontend/public/manifest.json`** — **silindi**. Web shell'i artık PWA
  manifest sunmuyor; Chrome/Edge "Install app" davetiyesi göstermez.
- **`frontend/public/index.html`** — `<link rel="manifest">`,
  `apple-mobile-web-app-*` meta'ları ve `mobile-web-app-capable` kaldırıldı.
  Apple touch icon tek başına bookmark thumbnail olarak korundu.
- **`frontend/public/service-worker.js`** — TOMBSTONE'a çevrildi:
  install → skipWaiting, activate → cache temizle + self-unregister +
  açık client'ları reload. Eski v1/v2 worker'ları taşıyan tarayıcılar
  bir sonraki ziyarette otomatik temizleniyor.
- **`frontend/src/index.js`** — service worker REGISTER yerine
  UNREGISTER mantığı (her sayfa yüklenmesinde `getRegistrations()` →
  `unregister()` + `mydhli-pwa-*` cache temizliği). Noop once clean.
- **PWA install hedefi artık tek bir yer:** `/m/` (mobil Expo bundle). Ana
  ekrana eklemek isteyen kullanıcı oraya navigate etmeli.

### Mobil manifest /m/ tutarlılığı
- **`mobile/public/manifest.json`** — `scope: "/m/"`, `start_url: "/m/?source=pwa"`,
  `id: "/m/?source=pwa"`, icon path'leri `/m/icon-192.png` & `/m/icon-512.png`'ye
  düzeltildi. Önceden hala `"/"` scope'taydı — `app.json`'ın `/m/`
  scope'uyla çelişiyordu.

### Backend backward-compat
- **`backend/business_module.py`** `PUT /addresses/{id}/default` artık hem
  legacy `kind: sender|receiver` hem v2 `role: SHIPPER|CONSIGNEE|NOTIFY`
  body'sini kabul ediyor. NOTIFY rollerinde noop+200 dönüyor (çünkü legacy
  collection'da notify default'u yok). Test_default_toggle fail'i bu
  köprüyle birlikte geçiyor olmalı.
- `dailyVolume` zaten doğru dönüyordu (kod çoktan `volumeOverTime→dailyVolume`
  dönüşümünü yapmış). Eski 11 Mayıs test raporu eskimiş.

### Files changed (Faz 8.5)
- `frontend/public/manifest.json` (SILİNDİ)
- `frontend/public/index.html` (PWA meta + manifest link kaldırıldı)
- `frontend/public/service-worker.js` (TOMBSTONE)
- `frontend/src/index.js` (register → unregister)
- `mobile/public/manifest.json` (scope /m/, id, icon path'leri düzeltildi)
- `backend/business_module.py` (kind|role düal-schema)
- `memory/HANDOVER.md` (bu blok)

### Kullanıcı adımı — Redeploy + telefon temizliği
1. Emergent dashboard → **Redeploy**.
2. Telefondaki **eski myDHLi PWA kısayolunu silin** (eski cache'i taşıyor).
3. Chrome/Safari'de **çerezleri ve site verilerini temizleyin**
   (Settings → Site Settings → merhaba-app-446 → Clear).
4. `https://merhaba-app-446.emergent.host/m/` adresine gidin.
5. "Add to Home Screen" — artık mobil app PWA'ı (myDHLi sarı ikon, mobil login)
   yüklenecek.

---
*Son güncelleme: 2026-05-20 — Faz 8.5 PWA hotfix + backend backward-compat.*
