# Dana Burger — veb sayt

Bakıdakı **Dana Burger** restoranı üçün mobil-first sayt: interaktiv menyu, WhatsApp ilə sifariş, setlərə keçid təklifi (upsell), canlı "Açıqdır/Bağlıdır" statusu və masalar üçün QR menyu.

**Stack:** Next.js 16 (App Router, statik export) · TypeScript · Tailwind CSS 4. Server və verilənlər bazası lazım deyil, Vercel-də pulsuz işləyir.

## Tez başlanğıc

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # statik sayt `out/` qovluğuna yığılır
npm start        # `out/`-u lokal göstərir (sıxılma ilə)
```

## Ən çox dəyişəcəyiniz fayllar

| Nə dəyişir | Fayl |
|---|---|
| Qiymət, məhsul, tərkib, foto, endirim | `data/menu.json` |
| Telefon, WhatsApp, Instagram, Wolt/Bolt, domen, GA4/Pixel ID | `lib/config.ts` |
| Saytdakı mətnlər (AZ / RU / EN) | `lib/i18n/az.ts`, `ru.ts`, `en.ts` |

### Menyunu redaktə etmək

`data/menu.json` faylında hər məhsul bir sətirdir:

```json
{"id": "ciz-burger", "category": "signature", "name": {"az": "Çizburger", "ru": "Чизбургер", "en": "Cheeseburger"},
 "description": "Çəkilmiş mal əti 100 qr, ...", "price": 5.8, "tags": ["meat", "popular"], "available": true}
```

- **Qiyməti dəyişmək:** `price` sahəsini dəyişin.
- **Endirim göstərmək:** `oldPrice` əlavə edin. Məhsul avtomatik olaraq "Günün təklifləri" karuselinə düşür və üzərində "X ₼ qənaət" yazılır.
- **Müvəqqəti gizlətmək:** `"available": false` yazın.
- **Foto əlavə etmək:** şəkli `public/img/` qovluğuna qoyun və `"image": "/img/ad.webp"` yazın. Fotosu olmayan məhsullarda brend rənglərində ikon göstərilir.
- **Etiketlər (`tags`):** `popular`, `new`, `spicy`, `chicken`, `meat`, `veg`. Menyudakı filtrlər bu etiketlərlə işləyir.
- **`includes`** (yalnız kombo menyularda): səbətdəki "Setə keç, X ₼ qənaət" təklifi bu siyahıya əsasən hesablanır.

Dəyişiklikdən sonra `git push` edin, Vercel saytı avtomatik yeniləyəcək.

## Funksiyalar

- **Hero və canlı status:** Bakı vaxtı (`Asia/Baku`) ilə hesablanır və gecə yarısını keçən saatları düzgün nəzərə alır. Bağlanmağa 45 dəqiqə qalanda "X dəq sonra bağlanır" göstərilir.
- **Günün təklifləri:** 30 set və kombo, ən böyük qənaətdən başlayaraq sıralanır. Hər kartda köhnə qiymət üstündən xətt çəkilmiş göstərilir, yanında "−X ₼ qənaət" və endirim faizi yazılır.
- **Menyu:** 16 kateqoriya üçün yapışqan (sticky) tablar var. Axtarış ə/ş/ç kimi hərfləri də tanıyır, məsələn "cizburger" yazanda "Çizburger" tapılır. Beş filtr var: toyuq, ət, acılı, vegetarian və 10 ₼-dan aşağı. Fotosu olan kateqoriyalar kart kimi, fotosuz olanlar çap menyusu üslubunda sətir kimi göstərilir.
- **Məhsul pəncərəsi:** böyük foto, tərkib, sous təklifi (hər porsiyaya bir sous) və say seçimi.
- **Səbət və WhatsApp:** səbət `localStorage`-da saxlanılır. Sifariş mesajı həmişə Azərbaycan dilində göndərilir ki, mətbəx rahat oxusun.
- **Ağıllı upsell:**
  - Səbətdə kombo menyunun bütün tərkibi varsa, sayt həmin menyuya keçməyi təklif edir və qənaəti göstərir. Məsələn: Çizburger + Fri → "Burgerçi Menyu (ət) götür, 0.90 ₼ qənaət, Kola 0.5 də daxildir".
  - Səbətdə yemək olub içki yoxdursa, içki təklif olunur. Sous yoxdursa, sous təklif olunur.
- **QR kod:** footer-dədir, build zamanı `/menu/` səhifəsi üçün yaradılır və SVG kimi yüklənə bilir. `/menu/` səhifəsi masalar üçündür və birbaşa menyunu açır.
- **SEO:** `schema.org/Restaurant` + tam `Menu` JSON-LD, OpenGraph şəkli (`public/og.jpg`), `sitemap.xml`, `robots.txt`.
- **Analitika:** `lib/config.ts`-də ID yazılanda GA4 və Meta Pixel avtomatik qoşulur. İzlənən eventlər:
  `call_click`, `whatsapp_click`, `whatsapp_order` (məbləğ ilə), `directions_click`, `add_to_cart`, `combo_upsell`, `delivery_click`.

## Deploy (Vercel)

1. [vercel.com](https://vercel.com)-da GitHub ilə daxil olun, **Add New → Project** seçin və bu repozitoriyanı seçin.
2. Heç bir ayarı dəyişmədən **Deploy** basın. Framework avtomatik tanınır.
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
| Mobil (simulyasiya olunmuş yavaş 4G) | 85–86 | 100 | 100 | 100 |

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

## Restoranla dəqiqləşdirilməli olanlar

- **Telefon və WhatsApp nömrəsi** (`lib/config.ts`). Nömrə yazılana qədər "Zəng" düyməsi gizlidir, WhatsApp isə müştəridən kontakt seçməsini istəyir.
- **"Dana spagetdi", "Quzu spagetdi", "Spesial spagetdi"** adları menyuda belə yazılıb. Düzgün yazılışı soruşulmalıdır.
- **"Banka"** (İçkilər, 3.00 ₼): hansı içkidir?
- **Dana burger pizza** və **Pide sucuklu** üçün menyuda tərkib yazılmayıb.
- **Çiken Set:** menyuda eyni adda üçüncü set var (4 çiken, 36.90 ₼). Saytda digərlərindən ayırmaq üçün onu "Çiken Set (4 nəfərlik)" adlandırmışam.
- **`popular` etiketləri** və pizza/pide fotolarının hansı məhsula aid olduğu mənim təxminimdir. Restoran təsdiqləməlidir.
- Instagram, TikTok, Wolt və Bolt linkləri, dəqiq küçə ünvanı.

## Foto mənbəyi

`public/img/` qovluğundakı bütün yemək fotoları restoranın öz menyu faylından kəsilib WebP-yə çevrilib.
