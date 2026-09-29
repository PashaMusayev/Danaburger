# Dana Burger — veb sayt

Bakıdakı **Dana Burger** restoranının **3 filialı** (Günəşli, Nərimanov, 4-cü mikrorayon) üçün mobil-first sayt: hər filialın öz menyusu və qiymətləri, WhatsApp ilə filiala sifariş, setlərə keçid təklifi (upsell), canlı "Açıqdır/Bağlıdır" statusu və hər filialın masaları üçün QR menyu.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4, Vercel-də pulsuz işləyir. İctimai səhifələr (`/`, `/<filial>`, `/<filial>/menu`) build zamanı statik yaradılır. Yalnız admin panel (`/admin`) serverdə işləyir. Verilənlər bazası yoxdur.

**Admin panel:** `/admin/`. Sahib menyunu, qiymətləri, fotoları və əlaqə məlumatlarını koda toxunmadan dəyişir. İstifadə və qurulma üçün **[ADMIN.md](ADMIN.md)**-yə baxın.

## Tez başlanğıc

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # istehsal build-i
npm start          # build-i lokal işə salır
npm run test:unit  # unit testlər
npm run test:e2e   # Playwright e2e (əvvəlcə `npm run build`)
```

## Filiallar

| Ünvan | Nə var |
|---|---|
| `/` | Brend səhifəsi: qısa hero, **3 filialın kartları** (ünvan, telefon, canlı açıq/bağlı statusu, "Menyuya bax", zəng), "ən yaxın filial" düyməsi, "Niyə Dana Burger", qalereya |
| `/gunesli/`, `/narimanov/`, `/4-mkr/` | Filialın tam səhifəsi: endirimli setlər, səhər yeməyi, menyu, ünvan/xəritə, zəng, WhatsApp. Header-də filial dəyişdirici |
| `/<filial>/menu/` | Masalardakı QR kodun açdığı səhifə: birbaşa menyu |
| `/menu/` | Köhnə çap olunmuş QR kodlar üçün → `/gunesli/menu/`-yə yönləndirilir (308) |

- **Endirim karuseli filial səhifəsindədir, ana səhifədə yox.** Qiymətlər və "X ₼ qənaət" filialdan-filiala fərqlidir: məsələn, Super Set hər yerdə 36.50 ₼-dır, amma köhnə qiymət Günəşlidə 64.40, 4-cü mkr-da 57.00 ₼-dır. Ana səhifədə bir filialın rəqəmlərini göstərmək başqa filialın müştərisini yanıltardı (kassada mübahisə). Həm də ana səhifə yüngül qalır və filial kartları birinci ekranda görünür.
- **Ən yaxın filial:** yer icazəsi yalnız düymə basılanda istənilir. Düymə ən azı **2 filialın** koordinatı olanda görünür, çünki tək koordinatla "ən yaxın" həmişə eyni filial olardı. Hazırda yalnız Günəşlinin koordinatı var.
- **Son filial yadda qalır** (`localStorage`): ana səhifədə "Son dəfə: Nərimanov → Menyuya keç" zolağı çıxır, amma avtomatik yönləndirmə yoxdur.
- **Səbət hər filialda ayrıdır** (`db.cart.<filial>`). Dolu səbətlə filial dəyişəndə sayt xəbərdar edir və "Səbəti köçür / Səbəti saxla" seçimi verir. Köçürəndə həmin filialda olmayan məhsullar ayrıca göstərilir, köçürülənlər yeni filialın qiyməti ilə hesablanır. Filiallardan əvvəlki köhnə səbət (`db.cart.v1`) Günəşliyə köçürülür.
- **WhatsApp** sifarişi seçilmiş filialın nömrəsinə gedir, birinci sətir filialı göstərir: `Salam! Nərimanov filialına sifariş:`.
- **Upsell** yalnız həmin filialın menyusu ilə hesablanır. Sous satmayan filialda (4-cü mkr) sous təklifi yoxdur. Tərkibi həmin filialda tamamlana bilməyən set təklif olunmur.
- **SEO:** ana səhifədə `Organization` + 3 `Restaurant` JSON-LD, hər filial səhifəsində yalnız öz `Restaurant`-ı (tam menyu və qiymətlərlə). Hər filialın öz başlığı, təsviri, canonical linki, sitemap girişi və OG şəkli (`public/og-<filial>.jpg`, `node scripts/og-images.mjs` ilə yaradılır).

## Ən çox dəyişəcəyiniz fayllar

Qiymət, məhsul və əlaqə məlumatlarını **admin paneldən** dəyişmək ən rahat yoldur. Fayllar isə bunlardır:

| Nə dəyişir | Fayl | Admin paneldə |
|---|---|---|
| Məhsulun adı, fotosu, kateqoriyası, etiketləri, ümumi tərkibi (bütün filiallar) | `data/menu.json` (kataloq) | Menyu → redaktə |
| Filialın qiymətləri, köhnə qiymətlər, "bitib", filiala xas tərkib, hansı məhsulların satıldığı, sıra | `data/branches/<filial>.json` | Menyu (filial seçib), Müqayisə |
| Filialın telefonu, WhatsApp-ı, ünvanı, xəritə koordinatı, iş saatları | `data/branches.json` | Ayarlar |
| Instagram, TikTok, Facebook, Wolt/Bolt, GA4/Pixel ID | `data/settings.json` | Ayarlar |
| Domen | `lib/config.ts` | — |
| Saytdakı mətnlər (AZ / RU / EN) | `lib/i18n/az.ts`, `ru.ts`, `en.ts` |

### Menyu faylları

`data/menu.json` **kataloqdur**: hər hansı filialda satılan bütün məhsullar, hər biri bir sətirdə. Qiymət burada saxlanmır:

```json
{"id": "ciz-burger", "category": "signature", "name": {"az": "Çizburger", "ru": "Чизбургер", "en": "Cheeseburger"}, "description": "Çəkilmiş mal əti 100 qr, ...", "image": "...", "tags": ["meat", "popular"]}
```

`data/branches/<filial>.json` həmin filialın menyusudur, faylda olmayan məhsul həmin filialda **satılmır**:

```json
{"id": "ciz-burger", "price": 5.2, "available": true, "description": "Çəkilmiş ət 100 qr, pomidor, turşu xiyar, sous, aysberq, pendir"}
```

- `price` qiymətdir, `oldPrice` isə endirimdə üstündən xətt çəkilən köhnə qiymətdir. Köhnə qiyməti olan məhsul avtomatik olaraq həmin filialın "Günün təklifləri" karuselinə düşür.
- `"available": false` məhsulu "bitib" edir: məhsul menyuda qalır, saytdan isə müvəqqəti gizlənir.
- `description` yazılıbsa, kataloqdakı tərkibin yerinə bu göstərilir (4-cü mkr burgerlərinin tərkibi fərqlidir).
- Saytda məhsullar faylın sətir sırası ilə göstərilir.
- Kataloqdakı `includes` (yalnız setlərdə) səbətdəki "Setə keç" təklifi üçün istifadə olunur.
- **Yeni filial** əlavə etmək üçün `data/branches.json`-a filial yazılır, `data/branches/<id>.json` yaradılır və `lib/branches.ts`-də import olunur. Bu işi admin paneldə etmək olmur.

Faylları əllə redaktə etmək də olar: `git push` edin, Vercel saytı yeniləyəcək. `npm run test:unit` faylların düzgün formatda olduğunu yoxlayır.

### Filiallara keçid (miqrasiya)

`node scripts/migrate-to-branches.mts` köhnə tək menyunu (`data/menu.json`, qiymətlər içində) kataloqa və `data/branches/gunesli.json`-a ayırır. Telefon və WhatsApp da `settings.json`-dan `branches.json`-a köçür. Skript bir dəfə işlədilib. Yenidən işlədiləndə heç nə etmir. Köhnə fayl `tests/fixtures/menu-before-branches.json`-da saxlanılıb, unit test isə Günəşli saytının köhnə qiymətləri, adları və tərkibləri **bayt-bayt eyni** göstərdiyini yoxlayır.

## Funksiyalar

- **Hero və canlı status:** hər filialın öz iş saatları ilə, Bakı vaxtı (`Asia/Baku`) ilə hesablanır və gecə yarısını keçən saatları düzgün nəzərə alır. Bağlanmağa 45 dəqiqə qalanda "X dəq sonra bağlanır" göstərilir.
- **Günün təklifləri** (filial səhifəsində): filialın endirimli setləri və komboları, ən böyük qənaətdən başlayaraq sıralanır. Hər kartda köhnə qiymət üstündən xətt çəkilmiş göstərilir, yanında "−X ₼ qənaət" və endirim faizi yazılır.
- **Menyu:** 16 kateqoriya üçün yapışqan (sticky) tablar var. Axtarış ə/ş/ç kimi hərfləri də tanıyır, məsələn "cizburger" yazanda "Çizburger" tapılır. Beş filtr var: toyuq, ət, acılı, vegetarian və 10 ₼-dan aşağı. Fotosu olan kateqoriyalar kart kimi, fotosuz olanlar çap menyusu üslubunda sətir kimi göstərilir.
- **Məhsul pəncərəsi:** böyük foto, tərkib, sous təklifi (hər porsiyaya bir sous) və say seçimi.
- **Səbət və WhatsApp:** səbət `localStorage`-da saxlanılır. Sifariş mesajı həmişə Azərbaycan dilində göndərilir ki, mətbəx rahat oxusun.
- **Ağıllı upsell:**
  - Səbətdə kombo menyunun bütün tərkibi varsa, sayt həmin menyuya keçməyi təklif edir və qənaəti göstərir. Məsələn: Çizburger + Fri → "Burgerçi Menyu (ət) götür, 0.90 ₼ qənaət, Kola 0.5 də daxildir".
  - Səbətdə yemək olub içki yoxdursa, içki təklif olunur. Sous yoxdursa, sous təklif olunur.
- **QR kodlar:** hər filialın öz kodu var, `/<filial>/menu/`-ya aparır. Kod filial səhifəsinin footer-ində və admin panelin Ayarlar bölməsində SVG kimi yüklənir.
- **SEO:** yuxarıda, "Filiallar" bölməsində; üstəlik `sitemap.xml` (7 ünvan) və `robots.txt`.
- **Analitika:** ID-lər admin panelin Ayarlar bölməsində (`data/settings.json`) yazılanda GA4 və Meta Pixel avtomatik qoşulur. Admin səhifələrinə bu skriptlər yüklənmir. İzlənən eventlər:
  `call_click`, `whatsapp_click`, `whatsapp_order` (məbləğ ilə), `directions_click`, `add_to_cart`, `combo_upsell`, `delivery_click`, `branch_select`, `branch_switch`, `nearest_branch`. Hər event-də `branch` parametri var ki, filialları ayrıca müqayisə etmək olsun.

## Deploy (Vercel)

1. [vercel.com](https://vercel.com)-da GitHub ilə daxil olun, **Add New → Project** seçin və bu repozitoriyanı seçin.
2. Heç bir ayarı dəyişmədən **Deploy** basın. Framework avtomatik tanınır.
   Admin panel üçün env dəyişənləri lazımdır, onlar [ADMIN.md → Qurulma](ADMIN.md#qurulma-developer-üçün) bölməsindədir.
3. Domen alındıqdan sonra onu **Settings → Domains** bölməsində əlavə edin və `lib/config.ts`-də `siteUrl`-i yeniləyin. QR kod, sitemap və SEO bu dəyəri istifadə edir.

## Şriftlər

Şriftlərin hamısı Azərbaycan hərfləri üçün yoxlanılıb (ə Ə ş ç ğ ı İ ö ü):
- **Anton:** başlıqlar
- **Kaushan Script:** set adları
- **Inter:** əsas mətn
- **Oswald / Lobster:** yalnız rus dilində, çünki Anton və Kaushan-da kiril hərfləri yoxdur

**Bebas Neue** və **Yellowtail** istifadə olunmayıb, çünki onlarda **ə/Ə** hərfi yoxdur.

## Performans (Lighthouse, sıxılma ilə lokal test)

| | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| Desktop | 100 | 100 | 100 | 100 |
| Mobil, ana səhifə `/` | 88–89 | 100 | 100 | 100 |
| Mobil, filial səhifəsi `/gunesli/` | 85–88 | 100 | 100 | 100 |
| Mobil, QR menyu `/narimanov/menu/` | 89–91 | 100 | 100 | 100 |

Real brauzerdə LCP təxminən 0.23 saniyədir. Mobil Performance balını aşağı salan şey Next.js+React-in təxminən 115 KB-lıq (gzip) əsas JavaScript paketidir: Lighthouse-un yavaş 4G simulyasiyasında hero şəkli bu paket yüklənənə qədər gözləyir. Menyu fotoları kiçik orijinallardan kəsildiyi üçün, peşəkar yüksək keyfiyyətli fotolar gəldikdə onları eyni adla `public/img/`-ə qoymaq kifayətdir.

## Menyu faylındakı düzəldilmiş yazılar

Saytda düzəldilmiş forma göstərilir. Çap menyusunda da düzəltmək tövsiyə olunur.

| Menyuda | Saytda |
|---|---|
| Free (kombo/setlərdə) | Fri |
| Amercano | Americano |
| Hotchokoloto | İsti şokolad |
| Maxito / Klassik maxito ... | Mojito / Klassik mojito ... |
| Sarýmsaqlý sous | Sarımsaqlı sous |
| Akroşka | Okroşka |
| Mini sotobrian | Mini şatobrian |
| Gunun Sorbasi | Günün şorbası |
| Vanelli (milkshake) | Vanilli |
| Qreyfrut | Qreypfrut |
| Çiyələkli milksh | Çiyələkli (Milkshake qrupunda) |
| ariqano | oreqano |
| Souz | sous |
| Vegeterian | Vegetarian |
| Xırt xırt Badumca | Xırt-xırt badımcan |
| nagest / Hottoq / Hoddok / Tonbik | nagets / Hot-dog / Hot-dog / tombik |
| almadilim kartof | alma dilim kartof |
| Kartof firi | Kartof fri |
| Pamidor, panket, şokalad yağı | Pomidor, pancake, şokolad yağı |
| Mərci | Mərci şorbası |
| Tonbik, nagest, Hottoq, Akroşka, Banaqua, ketçub mayenez (Nərimanov, 4-cü mkr) | tombik, nagets, hot-dog, okroşka, Bonaqua, ketçup-mayonez |
| Porsion Dönər / Plovüstü Dönər / İsgəndər Dönər (4-cü mkr) | Porsion / Plovüstü / İsgəndər (bütün filiallarda eyni ad) |

## Restoranla dəqiqləşdirilməli olanlar

Aşağıdakıları restoran sahibinə göndərmək olar. Cavab gələnə qədər mötərizədəki variant istifadə olunur.

1. **Nərimanov və 4-cü mikrorayon filiallarının dəqiq ünvanı və xəritə koordinatı.** Koordinat Google Maps-da filialın üstünə sağ klik edib kopyalanır. (Hələlik: "Nərimanov, Bakı", "4-cü mikrorayon, Bakı". Xəritə və "Yol tarifi" gizlidir, "ən yaxın filial" düyməsi görünmür.)
2. **İndiki koordinat `40.374861, 49.977472` Günəşli filialınındırmı?** (Hələlik: bəli.)
3. **Hər filialın iş saatları.** (Hələlik: üçü də hər gün 11:00–05:00.)
4. **WhatsApp nömrələri zəng nömrələri ilə eynidirmi?** Xüsusilə `010 343 14 13` WhatsApp-da varmı? (Hələlik: eyni nömrələr.)
5. **4-cü mkr menyusundakı "Mix çıtır" Günəşlidəki "Mix nagets" ilə eyni məhsuldurmu?** (Hələlik: ayrı məhsul kimi, "Mix çıtır" adı ilə.)
6. **4-cü mkr menyusundakı "Çöplü su" "Cappy çöplü" ilə eynidirmi?** (Hələlik: ayrı məhsul, "Çöplü su".)
7. **4-cü mkr menyusunda "Nagets" 6.40 ₼ neçə ədəddir?** (Hələlik: Günəşlidəki "Nagets 8 ədəd" ilə eyni məhsul sayılır.)
8. **4-cü mkr-da Çiken Set (4 nəfərlik) və İzmir Setdəki "Free Nagets" "fri + nagets" deməkdirmi?** (Hələlik: bəli.)
9. **4-cü mkr-da Böyük Set və Dana burgerçi Menyunun köhnə qiyməti menyuda yoxdur.** Bu setlər endirimli kimi göstərilsinmi? (Hələlik: yox, karuseldə deyillər.)
10. **Nərimanovdakı Toyuq langetin tərkibi** (4-cü mkr-dakı ilə eynidirmi?). (Hələlik: Nərimanovda tərkib yazılmayıb.)

Əvvəldən qalanlar:
- **Fotosu olmayan setlər** (məs. İstanbul Set): fotolar restoran sahibindən alınacaq, admin paneldən yüklənəcək.
- **`popular` etiketləri** və pizza/pide fotolarının hansı məhsula aid olduğu təxminidir, restoran təsdiqləməlidir.
- Instagram, TikTok, Wolt və Bolt linkləri.

Təsdiqlənib: "Banka" (Coca-Cola 0.33 dəmir banka) adı menyudakı kimi "Banka" qalır. "Dana/Quzu/Spesial spagetdi" adları menyudakı kimi düzgündür. Dana burger pizza və Pide sucuklu üçün Günəşlidə tərkib boş qalır.

## Foto mənbəyi

`public/img/` qovluğundakı bütün yemək fotoları restoranın öz menyu faylından kəsilib WebP-yə çevrilib.
