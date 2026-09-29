# Dana Burger — Veb sayt üçün Master Prompt

> Bu promptu olduğu kimi kopyalayıb göndər. `[ƏLAQƏ NÖMRƏSİ]` yazılan yerləri sonra dolduracağıq.

---

## ROL

Sən 15 illik təcrübəsi olan senior Full-Stack Developer, UX/UI dizayner və restoran marketinqi üzrə mütəxəssissən. Vəzifən **Dana Burger** restoranı üçün elə bir sayt qurmaqdır ki, restoran sahibi onu ilk dəfə telefonda açanda deyə bilsin: "Bu, bizim indiki menyudan və Instagram səhifəmizdən daha çox satış gətirəcək". Sayt sifarişləri artırmalı, orta çeki böyütməli və müştərini restorana gətirməlidir. Sadəcə vizitka sayt kifayət deyil.

## BİZNES KONTEKSTİ

- **Ad:** Dana Burger (Bakı)
- **Konsept:** burger, şaurma, izqara (manqal), pizza, pide, lahmacun, kombo menyular və ailə setləri, səhər yeməyi dəstləri
- **Ünvan / koordinat:** 40°22'29.5"N 49°58'38.9"E → `40.374861, 49.977472`
  Google Maps linki: `https://www.google.com/maps?q=40.374861,49.977472`
- **İş saatları:** hər gün **11:00 – 05:00** (gecə yarısından sonra da açıqdır)
- **Telefon / WhatsApp:** `[ƏLAQƏ NÖMRƏSİ]`. Bunu bir config faylında saxla ki, bir yerdən dəyişilsin.
- **Valyuta:** AZN (₼)
- **Hədəf auditoriya:** gənclər, tələbələr, ailələr, gecə saatlarında ac qalan insanlar (05:00-a qədər açıq olmaq əsas üstünlükdür!), ofis işçiləri (Gündəlik/Kolay menyu)

## BREND VƏ VİZUAL STİL

Loqo və menyu dizaynına uyğun olsun:
- **Fon:** dərin qara (`#0B0B0B`), kartlar üçün `#151515`
- **Əsas rənglər:** qırmızı `#D7261E` ("Dana" sözü), narıncı/qızılı `#F29A1F` ("Burger" sözü)
- **Aksent:** menyudakı nazik qırmızı xətlər, kərpic divar və taxta taxta fonlu yemək fotoları
- **Şriftlər:** başlıqlar üçün qalın, sıx sans-serif (məs. *Anton* / *Bebas Neue*), set adları üçün əlyazma (məs. *Pacifico* / *Yellowtail*, menyudakı "Özəl çeşid" kimi), mətn üçün *Inter*. Hamısı Azərbaycan hərflərini (ə, ş, ç, ğ, ı, ö, ü) dəstəkləməlidir, yoxla.
- **Hiss:** iştah açan, enerjili, premium street-food. Ucuz şablon kimi görünməsin.

## TEXNİKİ TƏLƏBLƏR

- **Stack:** Next.js (App Router) + TypeScript + Tailwind CSS. Statik export edilə bilsin və Vercel-də pulsuz host olunsun.
- **Mobile-first:** trafikin 85%+ hissəsi telefondan gələcək. Hər ekranı əvvəlcə 375px enində dizayn et.
- **Performans:** Lighthouse-da hər kateqoriyada 95+ bal. Şəkillər `next/image`, WebP/AVIF və lazy-load ilə olsun. LCP 2 saniyədən az olsun.
- **Dillər:** AZ (əsas), RU, EN. Keçid düyməsi header-də olsun, bütün mətnlər tərcümə fayllarında saxlanılsın.
- **Menyu məlumatı:** bütün məhsullar bir `menu.json` (və ya `menu.ts`) faylında olsun. Qiyməti dəyişmək üçün koda toxunmaq lazım gəlməsin. Hər məhsulun sahələri: `id, category, name{az,ru,en}, description, price, oldPrice?, image?, tags[] (yeni / populyar / acılı / toyuq / ət / vegetarian), available`.
- **SEO:** `schema.org/Restaurant` + `Menu` JSON-LD (openingHours: `Mo-Su 11:00-05:00`, geo koordinat, priceRange `₼`), OpenGraph şəkilləri, sitemap, "Bakıda burger", "gecə açıq restoran Bakı", "şaurma çatdırılma" kimi açar sözlər.
- **Analitika:** Google Analytics 4 və Meta Pixel üçün yer ayır. "Zəng et", "WhatsApp sifariş" və "Yol tarifi" kliklərini event kimi izlə. Sahibə göstərəcəyimiz əsas sübut bu rəqəmlər olacaq.

## SƏHİFƏ STRUKTURU VƏ BÖLMƏLƏR

### 1. Hero
- Tam ekran, iştah açan burger fotosu/video loop (qaranlıq overlay, loqo)
- Başlıq ideyası: **"Gecə 5-ə qədər. Əsl dana əti. Əsl burger."**
- **Canlı status badge:** "🟢 İndi açıqdır · 05:00-a qədər" / "🔴 Bağlıdır · 11:00-da açılır". Məntiq gecə yarısını keçən saatları düzgün hesablamalıdır (Bakı vaxtı, `Asia/Baku`).
- 2 əsas CTA: **"Menyuya bax"** və **"WhatsApp-la sifariş"**

### 2. "Günün təklifi" / Endirimli setlər karuseli
Köhnə qiyməti üstündən xətt çəkilmiş, yeni qiymət böyük göstərilsin. Hər kartda **"X ₼ qənaət"** badge-i olsun (məs. Super Set: 64.40 → 36.50, **27.90 ₼ qənaət**). Bu bölmə orta çeki artırmaq üçün ən vacib bölmədir.

### 3. İnteraktiv menyu (saytın ürəyi)
- Yuxarıda sticky kateqoriya tabları, horizontal scroll ilə: Burgerlər · Özəl burgerlər · Şaurma · İzqara · Pizza · Pide · Lahmacun · Fast food · Setlər · Kombo menyular · Səhər dəsti · Şorba və salatlar · Souslar · İçkilər · Kofe · Fresh və kokteyl
- Axtarış sahəsi və filtrlər (toyuq / ət / acılı / 10 ₼-dan aşağı)
- Məhsul kartı: foto, ad, tərkib, qiymət, **"+" düyməsi**
- Məhsula toxunanda bottom-sheet açılsın: böyük foto, tam tərkib və **əlavə sous təklifi** (upsell: "Pendirli sous +0.60 ₼")

### 4. Səbət → WhatsApp sifariş (backend lazım deyil)
- Müştəri məhsulları səbətə yığır, say dəyişir, ümumi məbləği görür
- "Sifarişi göndər" düyməsi hazır mətnlə WhatsApp açır:
  `Salam! Sifariş: 2× Çizburger (11.60 ₼), 1× Kola 0.5 (2.50 ₼). Cəmi: 14.10 ₼. Ad: ... Ünvan: ...`
- Səbət `localStorage`-da saxlanılsın
- **Ağıllı upsell:** səbətdə burger var, içki yoxdursa göstər: "Kola əlavə et +2.50 ₼". Səbət bir setin tərkibinə yaxındırsa göstər: "Burgerçi Menyu götürsən 1.90 ₼ qənaət edərsən".

### 5. Niyə Dana Burger?
3–4 ikon: "Gecə 05:00-a qədər açıq", "Təzə dana əti", "Ailə setləri 50%-ə qədər endirimli", "Sürətli xidmət"

### 6. Galereya
Instagram üslubunda grid (yemək fotoları, interyer). Instagram linki üçün yer ayır.

### 7. Ünvan və əlaqə
- Embed Google Map (koordinat yuxarıdadır) və **"Yol tarifi al"** düyməsi (Google Maps / Waze / Yandex)
- İş saatları, telefon (`tel:` linki), WhatsApp
- Wolt / Bolt Food linkləri üçün yer ayır (sonra dolduracağıq)

### 8. Footer
Loqo, sosial şəbəkələr, iş saatları, "Menyunu QR kodla paylaş" (restoran masaları üçün QR kod generasiya olunsun: `/menu` səhifəsinə aparsın)

### 9. Mobil sticky bottom bar
Həmişə görünən 3 düymə: **📞 Zəng · 💬 WhatsApp · 🛒 Səbət (say və məbləğ)**

## BİZNESİ "YALVARDACAQ" XÜSUSİYYƏTLƏR (satış arqumentləri)
1. **QR menyu:** çap menyusunu əvəz edir. Qiyməti dəyişmək üçün yenidən çap etmək lazım deyil, pul qənaət olunur.
2. **WhatsApp sifariş:** Wolt/Bolt komissiyası (20–30%) olmadan birbaşa sifariş.
3. **Canlı "Açıqdır" statusu:** gecə saatlarında Google-dan gələn müştəri qazanılır.
4. **Endirim vizuallaşdırması və upsell:** orta çeki artırır.
5. **Analitika:** "Bu ay saytdan N zəng və M WhatsApp sifarişi gəldi". Sahib ROI-ni rəqəmlə görür.
6. **Asan redaktə:** qiymətlər bir fayldan dəyişilir. 2-ci fazada sadə admin panel ola bilər (Supabase / Sanity).

## ÇATDIRILACAQLAR
1. Tam işlək layihə kodu, README və qurulma təlimatı
2. `menu.json`: aşağıdakı menyunun **hamısı**, qiymətlər dəyişdirilmədən
3. `config.ts`: telefon, WhatsApp, koordinat, iş saatları, sosial linklər
4. Foto olmayan məhsullar üçün zövqlü placeholder (brend rənglərində ikon). Real fotolar sonra əlavə olunacaq.
5. Deploy təlimatı (Vercel)

## İŞ QAYDASI
- Əvvəlcə qısa plan göstər (fayl strukturu və komponentlər), sonra kodu yaz
- Menyudakı qiymətləri **dəyişmə və uydurma**. Aşağıda açıq-aydın səhv yazılmış sözlər var: ekranda düzəldilmiş formasını göstər, amma siyahısını mənə ayrıca ver.
- Menyuda "Free" sözü "fri" (kartof fri) mənasındadır

---

## MENYU (tam, AZN)

### Özəl çeşid burgerlər
| Ad | Tərkib | Qiymət |
|---|---|---|
| Çiken burger | Çəkilmiş toyuq əti 100 qr, pomidor, turşu xiyar, burger sousu, kahı, pendir | 5.20 |
| Çizburger | Çəkilmiş mal əti 100 qr, pomidor, turşu xiyar, burger sous, karamel soğan, kahı, pendir | 5.80 |
| Black burger ət | Çəkilmiş mal əti 100 qr, pomidor, turşu xiyar, burger sous, karamel soğan, kahı, pendir | 6.90 |
| Black burger toyuq | Çəkilmiş toyuq əti 100 qr, pomidor, turşu xiyar, burger sous, kahı, pendir | 6.50 |
| Çıtır burger | Nagets 150 qr, pomidor, burger sous, turşu xiyar, kahı, karamel soğan, pendir, fri | 7.30 |
| Gangster burger | Çəkilmiş ət 100 qr, sosis, burger sous, pomidor, turşu xiyar, karamel soğan, kahı, pendir, fri | 9.20 |
| Burger spagetti | Tikə ət 100 qr, pomidor, turşu xiyar, kahı, burger sous, karamel soğan, pendir, fri | 10.90 |
| King burger | Çəkilmiş ət 100 qr, nagets, pomidor, burger sous, turşu xiyar, kahı, karamel soğan, pendir, fri | 9.50 |
| Toyuq sezar burger | Toyuq tikə əti 100 qr, pomidor, turşu xiyar, sezar sousu, aysberq salatı, pendir, karamel soğan, fri | 8.90 |

### Burgerlər
| Ad | Tərkib | Qiymət |
|---|---|---|
| Midburger | Çəkilmiş ət 200 qr, pomidor, turşu xiyar, kahı, burger sousu, karamel soğan, pendir, fri | 10.40 |
| Quzu burger | Tikə quzu əti 100 qr, çəkilmiş ət, pomidor, turşu xiyar, burger sous, karamel soğan, kahı, pendir, fri | 12.40 |
| Dana burger | Tikə ət 100 qr, çəkilmiş ət 100 qr, pomidor, turşu xiyar, burger sous, karamel soğan, kahı, pendir, fri | 12.90 |
| BBQ burger | Çəkilmiş ət 200 qr, pomidor, turşu xiyar, burger sous, barbekyu sousu, kahı, karamel soğan, pendir, fri | 10.90 |
| Steyk burger | Can əti 150 qr, pomidor, turşu xiyar, burger sous, kahı, karamel soğan, pendir, fri | 11.50 |
| Fantastik burger | Çəkilmiş ət 200 qr, burger sous, kahı, karamel soğan, qarışıq tərəvəz, pendir, fri | 12.40 |
| Trio burger | Çəkilmiş ət 100 qr, çəkilmiş toyuq 100 qr, quzu tikə 100 qr, tikə ət 100 qr, pomidor, turşu xiyar, kahı, burger sous, karamel soğan, pendir, fri | 18.30 |
| Special dana burger | Çəkilmiş ət 200 qr, dana tikə 100 qr, salami, pomidor, turşu xiyar, kahı, burger sousu, karamel soğan, pendir, fri | 18.30 |

### Şaurma ət
Burger shaurma 5.90 · Çörəkdə 3.90 · Double çörək 7.50 · Dürüm 4.20 · Dürüm Double 7.90 · Porsion 9.50 · Plovüstü 10.50 · İsgəndər 13.00

### Şaurma toyuq
Çörəkdə 3.80 · Çörək Double 7.50 · Dürüm 3.90 · Dürüm Double 7.50 · Porsion 8.50 · Plovüstü 9.50 · Burger shaurma 4.90

### İzqara
| Ad | Tərkib | Qiymət |
|---|---|---|
| Mini şatobrian | Can əti 240 qr, kərə yağı, sarımsaq, pomidor, bibər, qızardılmış çörək | 18.50 |
| Dana lokum | Can əti 200 qr, pomidor, bibər, kartof fri, kənd kartofu, BBQ sousu | 16.90 |
| Dana spagetdi | Dana əti 200 qr, pomidor, bibər, düyü, kənd kartofu, BBQ sousu | 14.50 |
| Quzu spagetdi | Quzu əti 200 qr, pomidor, bibər, kənd kartofu, düyü, BBQ sous | 15.50 |
| Pendirli toyuq | Toyuq əti 200 qr, pomidor, bibər, kənd kartofu, düyü, cheddar pendiri | 9.80 |
| Toyuq şiş | Sümüksüz toyuq əti 200 qr, pomidor, bibər, düyü, kənd kartofu, BBQ sous | 9.40 |
| Manqalüstü lokum | Can əti 250 qr, manqalda tərəvəzlər, tomat sousu | 17.90 |
| Tərəvəzli lokum | Can əti 200 qr, pomidor, bibər, gül kələm, brokoli, kök, BBQ sous | 17.40 |
| Spesial spagetdi | Dana əti 200 qr, pomidor, bibər, çipsi, haydari, kənd kartofu, cheddar pendir, BBQ sous | 16.90 |
| Kasap köftə | Çəkilmiş dana və quzu əti 200 qr, bibər, pomidor, düyü, kənd kartofu, acılı sous | 9.80 |
| Şiş köftə | Çəkilmiş dana əti 200 qr, pomidor, bibər, kənd kartofu, düyü, acılı sous | 10.40 |
| İnegöl köftə | Çəkilmiş dana və quzu əti 200 qr, pomidor, bibər, kənd kartofu, düyü, acılı sous | 9.80 |

### Pizzalar
| Ad | Tərkib | Qiymət |
|---|---|---|
| Marqarita | pomidor, sous, pendir, oreqano | 8.50 |
| Vegeterian | sous, göbələk, bibər, pomidor, zeytun, pendir | 8.50 |
| Toyuqlu | sous, göbələk, toyuq, bibər, pendir | 9.90 |
| Sosisli | sous, pendir, sosiska | 11.00 |
| Ətli | sous, göbələk, can əti, bibər, pendir, oreqano | 12.00 |
| Kolbasalı | sous, pendir, kolbasa | 10.50 |
| Qarışıq | sous, göbələk, kolbasa, sosiska, toyuq, bibər, pendir, zeytun | 13.00 |
| Dana burger | — | 15.50 |
| Göbələkli | sous, göbələk, pendir | 8.50 |
| Sucuqlu | sous, sucuq, pendir | 11.00 |

### Pide (Özəl çeşid)
| Ad | Tərkib | Qiymət |
|---|---|---|
| Qarışıq | Pendir 100q, can əti 40q, bibər 30q, pomidor 40q, döyülmüş ət 50q | 12.00 |
| Quşbaşı | 30 qr bibər, 40 qr pomidor, can əti 50 qr, 20 qr petruşka | 10.00 |
| Pendirli sadə | Pendir 120q | 7.70 |
| Qıymalı | 100 qr döyülmüş ət | 8.40 |
| Qıymalı pendirli | 100 qr döyülmüş ət, 60 qr pendir | 9.40 |
| Quşbaşı pendirli | 30 qr bibər, 40 qr pomidor, can əti 50 qr, 20 qr petruşka, 60 qr pendir | 11.00 |
| Pide sucuklu | — | 9.50 |

### Lahmacun
Sadə 3.60 · Pendirli 3.80 · Qarışıq 4.60

### Fast food
Mix Nagets 10.90 · Nagets 8 ədəd 6.90 · Soğan halqaları 5.30 · Toyuq çubuqları 8.20 · Düyü 3.00 · Kartof fri 4.00 · Çörək köftə 5.90 · Hot-dog 4.30

### Şorbalar
Mərci 3.50 · Günün şorbası 3.80

### Məzələr
Şakşuka 3.70 · Haydari 3.70 · Manqal salatı 3.70

### Salatlar
Çoban salatı 3.50 · Dana burger salatı 10.00 · Gavalı salatı 4.00 · Mimoza salatı 4.00 · Paytaxt salatı 4.00 · Sezar salatı 9.00 · Toyuq salatı 4.00 · Xırt-xırt badımcan 6.50

### Souslar və əlavələr
Acika (adjika) sous 0.60 · Barbekyu sous 0.60 · Pendirli sous 0.60 · Sarımsaqlı sous 0.70 · Şaurma sous 0.70 · Turşa-şirin sous 0.60 · Ketçup 0.70 · Mayonez 0.70 · Qarışıq turşu 0.60 · Cin bibər 0.30 · Qatıq 1.20

### İçkilər
Okroşka 1.60 · Kola 0.5 2.50 · Banka 3.00 · Kola 0.3 1.80 · Ayran 1.40 · Cappy 0.5 3.00 · Cappy çöplü 1.70 · Fuse Tea 3.00 · Bonaqua 1.40 · Kola şüşə 2.70 · Sirab 2.50

### Kofelər
Tropikana 6.00 · Cappuccino 4.50 · Espresso single 4.00 · Espresso double 5.50 · Americano 4.00 · Latte 5.00 · Raf 5.00 · Flat white 5.00 · Hot chocolate 5.00 · Ice kofe 6.00 · Ice latte 6.00 · Ice americano 4.50 · Mojito 5.00 · Klassik mojito 4.50 · Çiyələkli mojito 5.50 · Manqo mojito 5.50 · Qarışıq mojito 6.00

### Milkshake
Çiyələkli 5.50 · Vanilli 5.50 · Bananlı 5.50 · Kivili 5.00

### Fresh
Alma 5.00 · Qreypfrut 7.00 · Portağal 6.00 · Ananas 12.00 · Kök 4.00

### Limonad
Çiyələkli 5.00 · Şaftalı 5.00 · Manqo 5.00 · Qarışıq 5.00

### Ice tea
Limonlu 4.50 · Şaftalı 4.50 · Manqo 4.50 · Marakuya 4.50 · Alma 4.50

### Kokteyl
Bananlı 6.50 · Moruq (Malina) 6.50

### Kombo menyular (yeni qiymət / köhnə qiymət)
| Ad | Tərkib | Qiymət | Köhnə |
|---|---|---|---|
| Klassik Menyu (toyuq) | 1 toyuq şaurma, 1 ayran, 1 fri | 7.90 | 8.20 |
| Klassik Menyu (ət) | 1 ət şaurma, 1 ayran, 1 fri | 8.30 | 8.60 |
| Gündəlik Menyu | 1 şorba, 1 şaurma, 1 ayran | 7.90 | 8.60 |
| Kolay Menyu | 1 lahmacun, 1 ayran, 1 şorba | 6.40 | 8.40 |
| Big Menyu | 1 qarışıq pizza, 2 kola, 2 kartof fri | 17.50 | 25.40 |
| Dana burgerçi Menyu | Dana burger, 1 kola, 1 fri | 13.90 | 14.30 |
| Hot-dog Menyu | 1 hot-dog, 1 kola, 1 kartof fri | 7.50 | 9.60 |
| Burgerçi Menyu (ət) | 1 çizburger, 1 kola, 1 fri | 8.90 | 10.80 |
| Burgerçi Menyu (toyuq) | 1 çiken burger, 1 kola, 1 fri | 8.00 | 10.20 |
| Mix Menyu | 1 şaurma, 1 çizburger, 2 kartof fri, 1 kola, 1 ayran | 15.30 | 20.50 |

### Setlər (yeni qiymət / köhnə qiymət)
| Ad | Tərkib | Qiymət | Köhnə |
|---|---|---|---|
| Ailə Set | 1 pizza, 1 çizburger, 1 çiken burger, 2 fri, 2 nagets, 2 kola, 2 ayran | 32.90 | 39.80 |
| Çiken Set (2 nəfərlik) | 2 çiken burger, 2 kartof fri, 2 nagets, 2 kola | 19.50 | 26.40 |
| Çiken Set (3 nəfərlik) | 3 çiken burger, 3 kartof fri, 3 nagets, 3 kola | 27.90 | 39.60 |
| Çiken Set (4) | 4 çiken, 4 nagets, 4 fri, 4 kola 0.3 | 36.90 | 52.80 |
| Super Set | 2 çiken burger, 2 çörək köftə, 2 lahmacun, 2 dürüm, 4 fri, 4 kola 0.3, 4 ayran | 36.50 | 64.40 |
| Atıştırmalıq Set | 4 çörək şaurma ət, 4 çörək şaurma toyuq, 4 ayran, 4 okroşka | 36.90 | 44.00 |
| XL Set | 2 dürüm, 2 tombik, 2 hot-dog, 2 lahmacun, 3 ayran, 3 kola 0.3 | 30.60 | 40.60 |
| Dadlı Set | 4 lahmacun, 4 çiken, 2 kola 0.3, 2 ayran | 29.90 | 40.00 |
| Şaurma Set | 2 dürüm, 2 tombik, 4 lahmacun, 4 okroşka | 26.90 | 35.80 |
| Pizza Set | 3 pizza, 3 kola 0.5 | 31.00 | 37.50 |
| Fırın Seti | 1 pizza, 1 qıymalı pide, 4 lahmacun, 4 ayran | 27.50 | 40.40 |
| Big Bang Seti | 2 lahmacun, 2 hot-dog, 1 çizburger, 1 çiken burger, 1 çörək şaurma ət, 1 çörək şaurma toyuq, 2 fri, 2 nagets, 3 kola 0.3, 3 ayran | 39.90 | 56.60 |
| Mix Burger Seti | 1 Gangster, 1 BBQ, 1 Toyuq sezar, 1 King burger, 4 fri, 4 kola 0.3, 4 nagets | 39.90 | 57.50 |
| Dana Burger Seti | 2 Dana burger, 2 Dana burger salatı, 1 Dana burger pizzası, 2 fri, 2 nagets, 4 kola 0.3 | 44.90 | 57.70 |
| Hot-dog Seti | 4 hot-dog, 4 nagets, 4 fri, 4 kola 0.3 | 26.90 | 50.40 |
| New York | 2 çizburger, 2 çiken burger, 1 kola 0.5, 1 fanta 0.5, 2 fri, 1 mix nagets | 30.50 | 40.10 |
| İstanbul Set | 2 dürüm, 2 tombik, 4 nagets, 4 alma dilim kartof, 2 kola, 2 ayran | 30.60 | 49.90 |
| Black Lunch | 4 Black burger, 4 fri, 4 kola, 4 nagets | 35.60 | 52.70 |
| Böyük Set | 2 çizburger, 2 çiken, 2 hot-dog, 2 lahmacun, 2 kola 0.3, 4 ayran | 38.50 | 45.60 |
| İzmir Set | 2 çiken burger, 2 çörək köftə, 2 fri, 2 nagets, 4 kola | 29.50 | 41.80 |

### Səhər dəsti
| Ad | Tərkib | Qiymət |
|---|---|---|
| Səhər dəsti (1 nəfərlik) | Pomidor, xiyar, 2 pancake, zeytun, kolbasa, bal, qaymaq, şokolad yağı, 2 sosiska, ağ pendir 2 dilim, holland pendiri 2 dilim, yağ 3 dilim, pomidorlu yumurta, 1 çaynik çay | 10.00 |
| Səhər dəsti (2 nəfərlik) | Pomidor, xiyar, zeytun, kolbasa 4 dilim, bal, qaymaq, şokolad yağı, 2 sosiska, ağ pendir 2 dilim, holland pendiri 2 dilim, yağ 2 dilim, pomidorlu yumurta 1, pendirli omlet 1, pancake 2, meyvə şirəsi 2, mürəbbə | 18.00 |

---

İndi başla: əvvəlcə plan, sonra kod.
