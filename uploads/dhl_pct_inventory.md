# DHL Asset Paketi — Envanter

**Kaynak dosya:** `PCT DHL.docx` (32 MB)
**Yerel kopya:** `/app/uploads/dhl_pct_pack.docx`
**Çıkarılmış görseller:** `/app/uploads/dhl_pct_assets/` (20 PNG)
**Yazar metadata:** `CMB` (Türkçe — görsel adları "Resim 1..21" şeklinde)

## Kritik gözlem — okumadan önce
Doküman **TAMAMEN görsellerden oluşuyor**: 20 PNG, sıfır paragraf, sıfır tablo, sıfır text run.
Bu bir slide-deck/PDF'in PNG export'u gibi — yani DHL'in marketing/UI ekran görüntüleri.
**Sonuç:** Verbatim marketing copy yok; sadece görsel referans var. Bizim kendi metnimizi yazmaya devam etmemiz gerekecek (zaten yapıyoruz).

---

## Görsel Asset'ler (toplam: 20)

### Logolar / Wordmark'lar (3 adet)

| Dosya | Boyut | Açıklama | Kullanım |
|---|---|---|---|
| `image1.png` | 515×40, 5.9KB, RGB | **"DHL Global Forwarding"** wordmark — kırmızı sans-serif, beyaz BG. ⚠ Transparan değil (RGB), arkaplan beyaz. | `<BrandWordmark />` swap için ana aday — login/header/footer |
| `image2.png` | 338×63, 3.5KB, RGB | **"DHL" classic logo** — kırmızı harfler + yan stripeler, **sarı arkaplan**. İkonik logo. | Yalın "DHL" wordmark gereken yerler (sarı bant üzerinde) |
| `image3.png` | 353×110, 5.6KB, RGB | **"DHL Group"** wordmark — siyah harfler, açık gri BG, kurumsal/grup lockup'ı. | Footer veya kurumsal sayfalarda ana şirket referansı |

> ⚠ Hepsi **solid background**, transparent PNG yok. Web'de kullanmadan önce arkaplanı temizlemek (Photoshop / `magick -transparent white`) ya da SVG'ye çevirmek gerekecek. Veya kullanıcıdan transparent PNG/SVG isteyebiliriz.

### Web sayfası UI ekran görüntüsü (1 adet)

| Dosya | Boyut | Açıklama |
|---|---|---|
| `image4.png` | 2699×132, 28.7KB | **DHL Global Forwarding gerçek nav banner ekran görüntüsü** — sarı band içinde 3 CTA: "Contact a Local Expert", "Get an International Freight Quote", "Open an Account" — bizim Landing.jsx UtilityBar yapımıza **birebir benziyor** |

> Bu, bizim `UtilityBar` + `FloatingCards` (Ship/Get a quote/Business account) layout kararımızın **doğru yönde olduğunu** kanıtlıyor — DHL'in kendi sitesindeki yapı bu.

### Slider/Carousel slide ekran görüntüleri (5 adet) — Sustainability serisi

DHL kurumsal websitesinin hero carousel'inin slide ekran görüntüleri. Hepsinde sol-alt köşede slider play/pause + arrows var. **TEMASı sustainability**.

| Dosya | Boyut | Slide tema özeti (verbatim değil) | Görseldeki başlık (referans) |
|---|---|---|---|
| `image14.png` | 2707×1157, 2.7MB | Sürdürülebilirlik genel slide — kadın işçi + sarı araç | "Sustainability" + "GoGreen" referansı |
| `image15.png` | 2701×1157, 2.7MB | Elektrikli filo ölçeği — 45,000+ EV pickup/delivery | "45,000+ electric vehicles" |
| `image16.png` | 2703×1157, 3.5MB | 2024'te emisyon azaltım metric'i — sürdürülebilir yakıt + alternatif tek. | "2.1 mio metric kilotons of GHG emissions reduced in 2024" |
| `image17.png` | 2710×1161, 2.3MB | Depo elektriğinin %95'i yenilenebilir — bina otomasyonu, sürdürülebilir ısıtma | "95% electricity consumption from renewable sources" |
| `image18.png` | 2704×1157, 2.7MB | Çalışan ölçeği + EV vurgusu — 585,000+ çalışan | "585,000+ passionate employees" |

### Marka fotoğrafları — Insan/Operasyon (8 adet)

| Dosya | Boyut | Sahne özeti | Mode/Sektör | DHL marka? |
|---|---|---|---|---|
| `image5.png` | 765×767, 451KB | Hi-vis yelekli kişi belge inceliyor (yakın çekim eller) | Operasyon/compliance | Yok (jenerik) |
| `image6.png` | 1604×1203, 1.9MB | Kurye bir kadına sarı DHL paketi teslim ediyor (ev kapısında, telefon elinde) | Road — last-mile delivery | **Var** (paket + üniforma) |
| `image7.png` | 1600×1200, 1.5MB | Modest fashion online satıcı kadın, beyaz kutular istifliyor, laptopta DHL shipping label | E-commerce fulfillment | **Var** (etiketler) |
| `image8.png` | 1755×1201, 2.1MB | Liman/konteyner terminali — 2 kişi hard-hat+vest, gemi + crane'ler arkada | **Ocean — port operations** | **Var** (ID badge/lanyard) |
| `image9.png` | 1600×1199, 2.0MB | Depo içi — 2 işçi beyaz konteyner taşıyor, raflar, "Volkswagen AG" etiketi | Warehouse / contract logistics | **Var** |
| `image10.png` | 611×610, 297KB | Gülümseyen küçük işletme sahibi kadın kıyafet paketliyor | E-commerce / SME shipper | Yok (jenerik) |
| `image11.png` | 1800×1197, 2.4MB | Gülümseyen sürücü, sarı DHL **elektrikli** van içinde — yan tarafında "Powered by Electric Drive" | Road — sürdürülebilir delivery | **Var** (van + üniforma) |
| `image19.png` | 1151×1201, 1.6MB | Kurye sarı DHL paketi (üzerinde "100% Recyclable") evin önünde teslim ediyor, arkada DHL van, dağ manzarası | Road — last-mile + sustainability | **Var** (paket + van) |
| `image20.png` | 1801×1204, 1.7MB | Sabun/kozmetik atölyesi — 2 kadın ürün ele alıyor, birinde DHL lanyard | SME / artisanal fulfillment | **Var** (lanyard) |

### Kompozit / abstract görseller (2 adet)

| Dosya | Boyut | Açıklama |
|---|---|---|
| `image12.png` | 1918×1075, 1.4MB | **"WELCOME TO THE FUTURE"** neon yazısı — modern girişten geçen silüetler. Tematik/abstract, **hiçbir DHL marka yok**. Hero alternatifi olabilir ama lojistik bağı zayıf. |
| `image13.png` | 1914×1074, 2.3MB | **4 panel kompozit**: 1) yükselen bar chart + altın paralar, 2) dijital data flow (binary code, ışık izleri), 3) blurred insan hareketi, 4) **uçak gökyüzünde + yük gemisi**. DHL marka yok. |

---

## Bu pakette **olmayan** şeyler — eksiklikler

| Eksik | Neden önemli? |
|---|---|
| **Transparan PNG / SVG logo** | image1-3 hep solid arkaplanlı; web/PDF entegrasyonu için temiz logo lazım |
| **Sertifika / Badge'ler** (ISO 9001, AEO, IATA CASS, FIATA, vb.) | Pitch demo'da "trust strip" için kritik |
| **İletişim bilgisi** (adres, telefon, e-posta, PNG ofis) | Footer, Help, Contact sayfası için lazım |
| **12 PDF template** (HBL, HAWB, MBL, MAWB, Commercial Invoice, Packing List, vb.) | Phase 8.3 doc generator için bekleniyordu — hâlâ gelmedi |
| **Brand specs** (Pantone/HEX values, official font file, lockup ratios, spacing) | DHL "Delivery" font'u hâlâ yok, Inter fallback'inde duruyoruz |
| **Air freight fotoğrafı** — uçak operasyonu | Mevcut: sadece image13'ün 4'üncü panelinde küçük uçak silüeti. Pure air freight hero/section için yetersiz |
| **Marketing copy text** | Doküman tamamen görsel; başlık/CTA/açıklama yazımı için ham metin yok |
| **Papua New Guinea iştirakine özel asset** | Pakettekiler hep global DHL — yerel office foto/iletişim yok |

---

## Önerilen swap planı (öncelik sırasıyla)

> **NOT:** Bu sadece öneri — kullanıcı onayı olmadan **hiçbir swap yapılmadı**. Karar verince başlarım.

### P0 (hemen) — Logo'lar
- `image1.png` → **`<BrandWordmark variant="default" theme="light">`** içine — şu anki Inter Black "DHL **Global Forwarding**" placeholder'ı bunla değiştirilir.
  - ⚠ Önce arkaplanı transparent yap: `magick image1.png -transparent white image1-transparent.png`
- `image2.png` → **`UtilityBar` sol logo** — sarı bant zaten var, "DHL" classic logo direkt oturuyor.
- `image3.png` → **Footer "© DHL Group"** kısmına grup wordmark olarak.

### P1 (sırada) — Hero & section fotoğrafları
- `image11.png` (elektrikli van + sürücü) → **`<Hero>`** veya **`<InfoBand>`** background swap (`yellow` variant). Sarı tonu DHL palette ile uyumlu, sürücü + EV + yeşil yaprak motifi = sürdürülebilirlik mesajı.
- `image8.png` (liman/konteyner) → **OCEAN `<FreightModeSection>`** image swap. Şu an `ContainerShipSilhouette` SVG, gerçek port fotoğrafı çok daha güçlü.
- `image11.png` veya `image19.png` → **ROAD `<FreightModeSection>`** image swap.
- `image19.png` (paket teslim + dağ manzarası + GoGreen Plus) → **`<Sustainability>`** section image swap (yeşil variant'ı destekler).
- **AIR section için uygun foto YOK** — image13'ün 4'üncü panelinden uçak crop edilebilir veya kullanıcıdan air freight foto isteyebiliriz.

### P2 (sonra) — Carousel / slide referansı
- `image14-18` (sustainability slide serisi) → **bizim Landing'imize bir 5-slide carousel olarak eklenebilir**, ama:
  - Bu görseller DHL'in **kendi sitesinin ekran görüntüleri** — verbatim layout/copy kopyalama riski var.
  - Daha iyisi: bu slide'ları **tema referansı** olarak alıp kendi `<Slider>` component'imizi kuralım, kendi (kısa, özgün) headline + CTA'larımızı yazalım. Görselleri sadece arkaplan fotoğrafı olarak kullanırız.
- `image4` (UI ekran görüntüsü) — **swap için kullanılmamalı**, sadece doğrulama: bizim UtilityBar + FloatingCards yapımızın DHL gerçeği ile aynı yönde olduğunu gösteriyor.

### P3 (yapma listesi)
- `image12` ("Welcome to the Future") — DHL bağı zayıf, swap önerilmiyor.
- `image13` (4 panel composite) — sadece bir panel'i (uçak) crop edip AIR section'da kullanılabilir.
- `image5, 7, 10, 20` (jenerik SME/operasyon foto) — `BrandImagePlaceholder` yerine seçeneksel ikinci tier section'lar için stok.

---

## Sonraki adım için sana sorular (lütfen cevapla, hemen iş yapma)

1. **Logo arkaplanlarını ben temizleyim mi** (ImageMagick ile `-transparent white`), yoksa DHL'den **transparent PNG/SVG** mi isteyelim? Mevcut beyaz BG'lı PNG'ler header/footer üstünde yamuk durur.
2. **Sustainability slider** kuralım mı (`image14-18` görsellerini arkaplan olarak, kendi orijinal copy ile)? Yoksa şu anki tek `<Sustainability>` section yeterli mi?
3. **Air freight hero fotoğrafı yok** — bu durumda 3 seçenek var:
   - a) Şu anki SVG plane silüetini koru
   - b) `image13`'ten uçak panelini crop edip kullan (düşük çözünürlük, side effect riski)
   - c) DHL'den AIR foto iste
4. **12 PDF template** ve **iletişim/sertifika** asset'leri **bu pakette yok**. DHL'e takip bilgi isteği yazılsın mı?
5. **PNG (Papua New Guinea) iştiraki için lokal asset** yok — bu sadece global asset. Demo'yu **"DHL Global Forwarding — Papua New Guinea regional preview"** olarak konumlandırmaya devam mı, yoksa lokal foto/adres bekleyelim mi?

Karar verince swap'ları paralel olarak yaparım.
