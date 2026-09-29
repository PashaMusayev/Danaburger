# Dana Burger — 3 filial üçün saytın yenidən qurulması (prompt)

> Bu promptu olduğu kimi kopyalayıb göndər. `[?]` işarəli yerlər restoranla dəqiqləşdirilməlidir. Cavab gəlməsə, göstərilən ehtimal olunan variantla davam et və README-də qeyd et.

---

## ROL

Sən senior Full-Stack Developer və UX dizaynersən. Mövcud **Dana Burger** saytını (bu repozitoriya) **3 filiallı** sayta çevir. Hər filialın öz menyusu, qiymətləri, telefonu, WhatsApp sifarişi və QR kodu olmalıdır. Saytın indiki dizaynı, sürəti və funksiyaları qorunmalıdır: səbət, upsell, endirim karuseli, səhər yeməyi bölməsi, admin panel və SEO.

## MÖVCUD VƏZİYYƏT (əvvəlcə oxu)

- Next.js 16 (App Router) + TypeScript + Tailwind 4, Vercel-də: `https://danaburger-ten.vercel.app`
- `data/menu.json`: 176 məhsul və 16 kateqoriya, hər məhsul bir sətirdə. Bu menyu **Günəşli filialınındır**.
- `data/settings.json`: telefon, WhatsApp, sosial linklər, analitika. `lib/config.ts` bu faylı oxuyur.
- Admin panel `/admin`-dədir: dəyişiklikləri GitHub-a commit edir, Vercel saytı yenidən build edir. Qurulma təlimatı `ADMIN.md`-dədir.
- `README.md`, `ADMIN.md`, `lib/menu.ts`, `lib/upsell.ts`, `lib/admin/*`, `components/admin/*` fayllarını oxu.
- Testlər: `npm run test:unit` (vitest) və `npm run test:e2e` (Playwright, saxta GitHub ilə). Hamısı yaşıl qalmalıdır.

## FİLİALLAR

| id | Ad | Telefon | WhatsApp | Menyu |
|---|---|---|---|---|
| `gunesli` | Günəşli | 055 566 01 10 → `+994555660110` | eyni nömrə [?] | indiki `data/menu.json` |
| `narimanov` | Nərimanov | 055 541 48 48 → `+994555414848` | eyni nömrə [?] | Günəşli menyusundan fərqlər aşağıdadır |
| `4-mkr` | 4-cü mikrorayon | 010 343 14 13 → `+994103431413` | eyni nömrə [?] | tam siyahı aşağıdadır |

- **Koordinatlar:** indiki `40.374861, 49.977472` koordinatı Günəşli filialınındır [?]. Nərimanov və 4-cü mkr üçün ünvan və koordinatlar hələ yoxdur [?]. Onlar üçün `null` saxla. Koordinat yoxdursa, xəritə və "Yol tarifi" düymələri gizlənsin, admin panelin Ayarlar bölməsində isə doldurulması üçün sahə olsun.
- **İş saatları:** hər üç filial üçün 11:00–05:00 götür [?]. Saatlar filial başına ayrıca saxlansın.
- WhatsApp nömrəsi Azərbaycan mobil nömrəsidir, amma `010` prefiksli nömrənin WhatsApp-da olub-olmadığı yoxlanılmalıdır [?].

## UX QƏRARI

Mənim təklifim: saytı açan kimi 3 filialın adı göstərilsin, filiala toxunanda onun menyusu açılsın. Bunu aşağıdakı kimi et:

### 1. Ana səhifə `/`: brend + filial seçimi
- Brendin hero bölməsi qısa saxlanılsın. Onun altında, **birinci ekranda görünən** 3 böyük filial kartı olsun. Hər kartda: filialın adı, ünvanı, canlı "Açıqdır / Bağlıdır" statusu, "Menyuya bax" düyməsi və zəng düyməsi.
- **Ən yaxın filial:** "📍 Mənə ən yaxın filialı tap" düyməsi olsun. Brauzerdən yer icazəsi yalnız bu düymə basılanda istənilsin, səhifə açılan kimi yox. Sonra ən yaxın filial kartı "Sizə ən yaxın · 2.3 km" kimi işarələnsin. Koordinatı olmayan filiallar bu hesablamaya daxil edilmir.
- **Seçim yadda qalsın** (`localStorage`). Növbəti dəfə sayt açılanda ana səhifə göstərilir, amma yuxarıda "Son dəfə: Nərimanov → menyuya keç" zolağı çıxır. Avtomatik yönləndirmə **olmasın**, çünki müştəri başqa filialdan sifariş vermək istəyə bilər.
- Endirim karuseli, "Niyə Dana Burger" və qalereya kimi brend bölmələri ana səhifədə qalır. Kartlardakı qiymətlər isə filialdan asılıdır: filial seçilməyibsə, karuseldə "qiymətlər filialdan asılıdır" qeydi ilə Günəşli qiymətləri göstərilsin, ya da karusel filial səhifəsinə köçürülsün. Hansının daha yaxşı olduğunu qərar ver və səbəbini yaz.

### 2. Filial səhifəsi `/<filial>`: indiki sayt, amma filiala görə
- `/gunesli`, `/narimanov`, `/4-mkr`. Hər biri indiki ana səhifənin tam funksionallığını filialın öz məlumatları ilə göstərir: hero, endirimli setlər, səhər yeməyi, menyu, ünvan və xəritə, zəng, WhatsApp.
- Header-də həmişə görünən **filial dəyişdirici** olsun: "📍 Nərimanov ▾".
- `/<filial>/menu` səhifəsi masalar üçündür (QR). Footer-dəki QR kod **filialın öz menyusuna** aparsın. Admin paneldə hər filialın QR kodunu çap üçün SVG kimi yükləmək mümkün olsun.
- Köhnə `/menu` ünvanı artıq çap olunmuş QR kodlarda istifadə olunur. O, `/gunesli/menu`-ya yönləndirilsin (308).
- Bütün səhifələr statik qalmalıdır (`force-static` + `generateStaticParams`).

### 3. Səbət və sifariş
- Səbət **hər filial üçün ayrıdır**, çünki qiymətlər fərqlidir (`db.cart.<filial>`).
- Səbət doluyken başqa filiala keçəndə xəbərdarlıq göstər: "Səbətdə 3 məhsul var. Nərimanovda qiymətlər fərqlidir. Səbəti köçür / Səbəti saxla". Köçürəndə həmin filialda olmayan məhsulları ayrıca sadala.
- WhatsApp sifarişi **seçilmiş filialın nömrəsinə** getsin. Mesajın birinci sətri filialı göstərsin: `Salam! Nərimanov filialına sifariş:`.
- Upsell və "setə keç" təklifi yalnız həmin filialın menyusu və qiymətləri ilə hesablansın.

### 4. SEO
- JSON-LD: `Organization` + hər filial üçün ayrıca `Restaurant` obyekti (ünvan, telefon, `geo`, `openingHours`, `hasMenu`). Hər filial səhifəsində yalnız öz `Restaurant` obyekti olsun.
- Hər filial səhifəsinin öz başlığı və təsviri olsun ("Dana Burger Nərimanov — burger, şaurma…"), `canonical` linki, `sitemap` girişi və OG şəkli.

## DATA MODELİ

Menyuların çoxu eynidir, amma qiymətlər, tərkiblər və məhsul siyahısı filialdan filiala dəyişir. Tövsiyəm budur:

- **`data/menu.json`**: ümumi **kataloq** olaraq qalsın: bütün məhsullar (üç filialın məhsullarının birləşməsi), ad (AZ/RU/EN), foto, etiketlər, kateqoriya və default tərkib. Hər məhsulun id-si **sabitdir**.
- **`data/branches.json`**: filial siyahısı: id, ad (AZ/RU/EN), ünvan, `geo | null`, saatlar, telefon, WhatsApp, sıra.
- **`data/branches/<id>.json`**: həmin filialın menyusu, hər sətirdə bir məhsul:
  `{"id": "ciz-burger", "price": 5.2, "oldPrice"?: …, "available": true, "description"?: "filiala xas tərkib"}`
  - Faylda olmayan məhsul həmin filialda **yoxdur**.
  - `description` verilibsə, kataloqdakı tərkibin yerinə bu göstərilir. Məsələn, 4-cü mkr burgerlərinin tərkibi fərqlidir.
  - Sıra fayldakı sətir sırası ilə müəyyən olunur.
- Setlərin `includes` sahəsi kataloqda qalır. "Setə keç" təklifi yalnız filialın **mövcud** məhsulları ilə tamamlanan setlər üçün göstərilsin.
- Validasiya: hər filial faylındakı id kataloqda olmalıdır, `oldPrice > price` olmalıdır, bir filialda eyni id iki dəfə ola bilməz.
- Miqrasiya skripti yaz: indiki `menu.json`-dan kataloq və `gunesli.json` yaransın. Günəşli saytının nəticəsi **bayt-bayt eyni qiymətləri** göstərməlidir. Bunu testlə yoxla.
- `data/settings.json`-da yalnız ümumi dəyərlər (sosial linklər, analitika) qalsın. Telefon və WhatsApp `branches.json`-a köçsün.

## ADMIN PANEL

- Yuxarıda **filial seçicisi** olsun: "Günəşli | Nərimanov | 4-cü mkr". Cədvəl seçilmiş filialın qiymətlərini və mövcudluğunu göstərir və redaktə edir.
- Kataloq sahələri (ad, foto, etiketlər, kateqoriya) bütün filiallar üçün ümumidir. Redaktor bunu aydın göstərsin: "Bu dəyişiklik 3 filialın hamısına aiddir".
- Filiala aid sahələr: qiymət, köhnə qiymət, mövcudluq və tərkibin filiala xas versiyası.
- **"Bu filialda satılır"** açarı: məhsulu filialın menyusuna əlavə edir və ya oradan çıxarır. "Bitib" ondan fərqlidir: bitmiş məhsul menyuda qalır, sadəcə müvəqqəti gizlənir.
- Yeni məhsul yaradanda hansı filiallarda satılacağı checkbox-larla seçilsin və hər filial üçün qiymət yazılsın ("hamısına eyni qiymət" düyməsi ilə).
- Toplu qiymət dəyişikliyinə "Hansı filiallarda" seçimi əlavə olunsun.
- **Filialları müqayisə** görünüşü: bir cədvəldə məhsul və 3 filialın qiymətləri yan-yana. Kompüterdə bu cədvəl də redaktə oluna bilsin.
- Tarixçə, konflikt yoxlaması, qaralamanın saxlanması və bir commit-lə yayımlama indiki kimi işləsin. Commit mesajında filial adı olsun: `Admin: Nərimanov: Çizburger 5.80→6.20`.
- Ayarlarda hər filialın telefonu, WhatsApp nömrəsi, ünvanı, koordinatları və saatları redaktə olunsun.
- Tək sahib parolu qalsın. Filial menecerləri üçün ayrıca giriş **2-ci fazadır**, indi etmə, amma data modeli buna mane olmasın.

## FİLİAL MENYULARI

Qiymətləri **dəyişmə və uydurma**. Aşağıdakı məlumat filialların öz menyu fayllarından köçürülüb.

### Günəşli
İndiki `data/menu.json`, dəyişiklik yoxdur.

### Nərimanov
Günəşli menyusu ilə **eynidir**, yalnız aşağıdakı fərqlər var.

**Fərqli qiymətlər**

| Məhsul | Nərimanov | Günəşli |
|---|---|---|
| Şaurma ət · Çörəkdə | 4.20 | 3.90 |
| Şaurma ət · Double çörək | 8.20 | 7.50 |
| Şaurma ət · Dürüm | 4.40 | 4.20 |
| Şaurma ət · Dürüm Double | 8.60 | 7.90 |

**Eyni qiymət, fərqli köhnə qiymət** (üstündən xətt çəkilmiş)

| Məhsul | Qiymət | Nərimanov köhnə | Günəşli köhnə |
|---|---|---|---|
| Klassik Menyu (toyuq) | 7.90 | 9.00 | 8.20 |
| Klassik Menyu (ət) | 8.30 | 9.40 | 8.60 |
| Gündəlik Menyu | 7.90 | 9.10 | 8.60 |

**Yalnız Nərimanovda olanlar**
- **Toyuq langet**: İzqara, 8.50
- **Səhər yeməyi**: 5.90. Tərkib: yumurta, yağ, pendir, qaymaq, sosiska, xiyar, pomidor, zeytun, çay. Bu, Günəşlidəki "Səhər dəsti 1/2 nəfərlik"in yerinə gəlir.

**Nərimanovda OLMAYANLAR** (menyu faylına daxil etmə)
- İzqarada yalnız **Kasap köftə 9.80** var. Qalan 11 izqara məhsulu yoxdur: Mini şatobrian, Dana lokum, Dana/Quzu/Spesial spagetdi, Pendirli toyuq, Toyuq şiş, Manqalüstü lokum, Tərəvəzli lokum, Şiş köftə, İnegöl köftə.
- Səhər dəsti (1 və 2 nəfərlik)
- Məzələr: Şakşuka, Haydari, Manqal salatı
- Xırt-xırt badımcan
- Sirab
- Setlər: Super Set, Atıştırmalıq Set, XL Set, Çiken Set (4 nəfərlik), Böyük Set, İzmir Set

Qalan hər şey eyni qiymətlə var: burgerlər, şaurma toyuq, pizza, pide, lahmacun, fast food, qarnirlər, şorbalar, 7 salat, souslar, qalan içkilər, kofe, milkshake, fresh, limonad, ice tea, kokteyl, 14 set və kombo. Menyuda Kartof fri və Düyü "Qarnirlər" başlığı altındadır. Saytda hər üç filial üçün eyni kateqoriya quruluşu saxla.

### 4-cü mikrorayon
Qiymətlərin çoxu fərqlidir, burgerlərin tərkibi də fərqlidir. **Tam siyahı:**

**Özəl çeşid burgerlər**
| Məhsul | Tərkib | Qiymət |
|---|---|---|
| Çiken burger | Çəkilmiş toyuq 100 qr, pomidor, turşu xiyar, sous, aysberq, pendir | 4.80 |
| Çizburger | Çəkilmiş ət 100 qr, pomidor, turşu xiyar, sous, aysberq, pendir | 5.20 |
| Black burger ət | Mal əti 100 qr, tar-tar sous, kahı, pomidor, turşu xiyar, cheddar pendir | 5.90 |
| Black burger toyuq | Toyuq əti 100 qr, tar-tar sous, kahı, pomidor, duzlu xiyar, cheddar pendir | 5.50 |
| Çıtır burger | Nagets 150 qr, pomidor, fri, sous, ketçup | 7.10 |
| Gangster burger | Çəkilmiş ət 100 qr, sosiska 80 qr, sous, ketçup, pomidor, turşu xiyar | 8.20 |
| Burger spagetti | Tikə ət 100 qr, pomidor, turşu xiyar, sous, aysberq, pendir | 9.30 |
| King burger | Çəkilmiş ət 100 qr, nagets 100 qr, pomidor, sous, fri, ketçup | 9.40 |
| Toyuq sezar burger | Tikə toyuq 150 qr, pomidor, turşu xiyar, sezar sous, aysberq, pendir | 8.50 |

**Burgerlər**
| Məhsul | Tərkib | Qiymət |
|---|---|---|
| Midburger | Çəkilmiş ət 200 qr, pomidor, turşu xiyar, sous, aysberq, pendir | 9.40 |
| Quzu burger | Tikə quzu əti 100 qr, çəkilmiş ət 100 qr, pomidor, turşu xiyar, sous, aysberq, pendir | 11.40 |
| Dana burger | Tikə ət 100 qr, çəkilmiş ət 100 qr, pomidor, turşu xiyar, sous, aysberq, pendir | 11.90 |
| BBQ burger | Çəkilmiş ət 200 qr, pomidor, pendir, barbekü sous, karamel soğan | 10.30 |
| Steyk burger | Can əti 150 qr, pomidor, turşu xiyar, sous, aysberq, pendir, karamel soğan | 10.50 |
| Fantastik burger | Çəkilmiş ət 200 qr, sous, pendir, qarışıq tərəvəz | 11.30 |
| **Bingo burger** (yeni, yalnız burada) | Can əti 150 qr, pendir | 11.00 |
| Trio burger | Çəkilmiş ət 100 qr, çəkilmiş toyuq 100 qr, tikə quzu 100 qr, tikə ət 100 qr, pomidor, turşu xiyar, sous, aysberq, pendir, karamel soğan | 15.90 |
| Special dana burger | Çəkilmiş ət 200 qr, tikə ət 100 qr, salami 100 qr, pomidor, turşu xiyar, sous, aysberq, pendir, karamel soğan | 15.90 |

**Şaurma ət:** Burger şaurma 5.50 · Çörəkdə 3.90 · Double çörək 7.50 · Dürüm 4.00 · Dürüm Double 7.70 · Porsion Dönər 9.50 · Plovüstü Dönər 10.50 · İsgəndər Dönər 13.00

**Şaurma toyuq:** Çörəkdə 3.50 · Çörək Double 7.50 · Dürüm 3.70 · Dürüm Double 7.00 · Porsion Dönər 8.50 · Plovüstü Dönər 9.50 · Burger şaurma 4.50

**Səhər yeməyi:** 5.90 (Nərimanovdakı ilə eyni)

**Salatlar:**
- Sezar 9.00: aysberq, sezar sousu, suxari, parmezan pendiri, toyuq
- Dana burger salatı 10.00: aysberq, qırmızı kələm, alma, ceri pomidor, nar, vişnə qurusu, kişmiş, limon suyu, zeytun yağı, tulum pendiri, qoz, narşərab

**Şorba:** Günün şorbası 3.50

**Pide:** Günəşli ilə eyni, **yalnız Sucuqlu pide 9.00** (tərkib: sucuq, pendir)

**Pizzalar:** Günəşli ilə eyni, **yalnız Dana burger pizza 15.00** (tərkib: ət, pomidor, bibər, pendir)

**Lahmacun:** Sadə 3.60 · Pendirli 3.80 · Qarışıq 4.60

**Fast food:** Hot-dog 3.90 · Köftə çörəkdə 5.50 · Toyuq çubuqları 7.80 · Nagets 6.40 · **Mix çıtır 9.90** [?: bu, Günəşlidəki "Mix nagets"dirmi?] · Soğan halqaları 5.30

**Qarnirlər:** Kartof fri 4.00 · Düyü 3.00 · Qarışıq turşu 0.60

**İzqara:**
- Kasap köftə 9.30: 200 qr köftə, 150 qr düyü, pomidor, bibər, xırda kartof, BBQ sousu
- Toyuq langet 8.50: 200 qr toyuq file, 150 qr düyü, pomidor, bibər, xırda kartof, sous

**İçkilər:** Kola 0.5 2.50 · Banka 3.00 · Kola 0.3 1.80 · Ayran **1.20** · Cappy 3.00 · Çöplü su 1.70 [?: bu, "Cappy çöplü"dürmü?] · Bonaqua 1.40 · Kola şüşə 2.70 · Okroşka 1.60

**Setlər** (yeni / köhnə qiymət). Tərkib Günəşli ilə eynidir, fərqli olanlar ayrıca qeyd olunub.
| Set | Qiymət | Köhnə |
|---|---|---|
| Çiken Set (4 nəfərlik) — 4 çiken burger, 4 fri [?], 4 nagets, 4 kola 0.3, 4 ketçup-mayonez | 36.90 | 50.20 |
| Böyük Set | 38.50 | — (menyuda köhnə qiymət yoxdur) |
| İzmir Set — 2 çiken burger, 2 çörək köftə, 2 fri [?], 2 nagets, 4 kola, ketçup-mayonez | 29.50 | 38.90 |
| New York — 2 çizburger, 2 çiken burger, 1 kola 0.5, 1 fanta 0.5, 2 porsiya fri, 4 nagets, 4 soğan halqası, 4 toyuq çubuğu | 30.50 | 35.60 |
| İstanbul Set — Günəşlidəki kimi + 4 ketçup-mayonez, 4 turşu | 30.60 | 49.90 |
| Black Lunch | 35.60 | 39.60 |
| Mix Burger Seti | 39.90 | 46.00 |
| Dana Burger Seti | 44.90 | 69.60 |
| Hot-dog Seti | 26.90 | 50.40 |
| Fırın Seti | 27.50 | 36.60 |
| Big Bang Seti | 39.90 | 48.60 |
| Dadlı Set | 29.90 | 33.90 |
| Şaurma Set | 26.90 | 33.80 |
| Pizza Set | 31.00 | 36.00 |
| Super Set | 36.50 | 57.00 |
| Atıştırmalıq Set | 36.90 | 40.80 |
| XL Set | 30.60 | 36.00 |
| Çiken Set (2 nəfərlik) | 19.50 | 25.10 |
| Çiken Set (3 nəfərlik) | 27.90 | 38.30 |
| Ailə Set — Günəşlidəki kimi + ketçup-mayonez | 32.90 | 35.60 |

**Kombo menyular**
| Kombo | Qiymət | Köhnə |
|---|---|---|
| Mix Menyu | 15.30 | 17.90 |
| Burgerçi Menyu (ət) | 8.90 | 9.30 |
| Burgerçi Menyu (toyuq) | 8.00 | 8.80 |
| Dana burgerçi Menyu | 13.90 | — (menyuda köhnə qiymət yoxdur) |
| Hot-dog Menyu | 7.50 | 8.80 |
| Kolay Menyu | 6.40 | 7.90 |
| Big Menyu | 17.50 | 21.80 |
| Klassik Menyu (toyuq) | 7.90 | 8.20 |
| Klassik Menyu (ət) | 8.30 | 8.60 |
| Gündəlik Menyu | 7.90 | 8.60 |

**4-cü mkr-da OLMAYANLAR:**
- Souslar (Qarışıq turşu istisnadır)
- Kofe, milkshake, fresh, limonad, ice tea, kokteyl
- Fuse Tea, Sirab
- Mərci şorbası
- Salatlar: Çoban, Gavalı, Mimoza, Paytaxt, Toyuq; Xırt-xırt badımcan
- Məzələr
- 10 izqara məhsulu
- Səhər dəsti 1/2 nəfərlik

Sous olmadığı üçün bu filialda məhsul pəncərəsindəki sous təklifi və səbətdəki sous upsell-i **göstərilməsin**. Bu məntiq ümumi olsun: filialın menyusunda sous yoxdursa, sous təklifi də yoxdur.

### Menyu fayllarındakı yazı səhvləri
Saytda düzəldilmiş forma göstər: "Free" → fri, "nagest" → nagets, "Tonbik" → tombik, "Hottoq" → hot-dog, "Akroşka" → okroşka, "Banaqua" → Bonaqua, "almadilim" → alma dilim, "ketçub mayenez" → ketçup-mayonez, "Vegeterian" → Vegetarian. "Çiken Set" və "İzmir Set"dəki "Free Nagets" ifadəsini "fri + nagets" kimi oxudum [?].

## İCTİMAİ SAYTA TƏSİR VƏ KEYFİYYƏT

- Mobile-first qalsın. Lighthouse Accessibility, Best Practices və SEO 100-də qalsın, Performance mövcud səviyyədən aşağı düşməsin.
- Günəşli səhifəsi indiki saytla eyni qiymətləri və funksiyaları göstərməlidir (regressiya testi).
- Bütün səhifələr statik build olunmalıdır. Admin panel və API indiki kimi dinamik qalır.

## TESTLƏR

- Unit: miqrasiya (Günəşli qiymətləri dəyişmir), filial menyusunun kataloqla birləşdirilməsi, validasiya, filiala görə upsell (sous yoxdursa təklif yoxdur, set tamamlanmırsa təklif yoxdur).
- E2E (1440 px və 375 px):
  - ana səhifə → filial seç → səbət → WhatsApp mesajında düzgün filial və nömrə;
  - dolu səbətlə filial dəyişmə xəbərdarlığı;
  - `/menu` → `/gunesli/menu` yönləndirməsi;
  - admin: filial seç → qiymət dəyiş → yayımla → yalnız həmin filialın faylı dəyişir;
  - admin: yeni məhsul 2 filiala fərqli qiymətlə;
  - müqayisə cədvəli.

## ÇATDIRILACAQLAR

1. İşlək kod, miqrasiya skripti və testlər.
2. `README.md` və `ADMIN.md` yenilənsin: filial seçimi, müqayisə görünüşü, QR kodlar.
3. **Mənim etməli olduğum addımlar** ayrıca siyahı kimi (məsələn, Vercel-də yeni env dəyişəni lazımdırsa).
4. `[?]` işarəli bütün suallar restoran sahibinə göndərmək üçün ayrıca siyahı kimi.

## İŞ QAYDASI

- Əvvəlcə qısa plan göstər: data modeli, marşrutlar, komponent dəyişiklikləri, admin dəyişiklikləri. Sonra kodu yaz.
- Mövcud Günəşli qiymətlərini dəyişmə.
