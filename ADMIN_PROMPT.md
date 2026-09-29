# Dana Burger — Admin panel üçün prompt

> Bu promptu olduğu kimi kopyalayıb göndər.

---

## ROL

Sən senior Full-Stack Developer və UX dizaynersən. Mövcud **Dana Burger** saytına (bu repozitoriya) restoran sahibi üçün admin panel əlavə et. Sahib texniki adam deyil və paneldən əsasən **telefonda** istifadə edəcək. Hədəf: sahib 30 saniyəyə qiyməti dəyişə, məhsulu əlavə edə və ya silə bilsin, heç vaxt koda toxunmasın.

## MÖVCUD VƏZİYYƏT (əvvəlcə oxu)

- Next.js 16 (App Router) + TypeScript + Tailwind 4, Vercel-də deploy olunub: `https://danaburger-ten.vercel.app`
- Vercel-in Production Branch-i: `claude/dazzling-ride-gkxnt0`
- Menyu: `data/menu.json`, 176 məhsul və 16 kateqoriya. Fayl belə saxlanılır: hər məhsul **bir sətirdir**. Tiplər `lib/menu.ts`-dədir.
- Əlaqə məlumatları: `lib/config.ts`. Telefon və WhatsApp hələ boşdur.
- Hazırda `next.config.ts`-də `output: 'export'` var, yəni sayt tam statikdir.
- `README.md`-ni və `lib/upsell.ts`-i oxu. Kombo menyulardakı `includes` sahəsini səbətdəki "setə keç" təklifi istifadə edir.

## ARXİTEKTURA QƏRARI (dəyişmə)

Verilənlər bazası **yoxdur**. Admin panel dəyişiklikləri **GitHub API vasitəsilə `data/menu.json`-a commit edir** və Vercel saytı avtomatik yenidən build edir (~1–2 dəqiqə).

- Səbəb: pulsuzdur, ictimai sayt indiki kimi statik və sürətli qalır, hər dəyişikliyin tarixçəsi var və geri qaytarmaq mümkündür.
- `output: 'export'`-u çıxar. İctimai səhifələr (`/`, `/menu`) statik qalmalıdır (`force-static`). Yalnız `/admin/*` və `/api/admin/*` dinamik (serverless) olsun.
- GitHub token **yalnız serverdə** saxlanılsın və heç vaxt brauzerə getməsin.
- Optimistic concurrency: faylın `sha`-sı ilə yaz. Arada başqa dəyişiklik olubsa, sahibə "Menyu başqa yerdən dəyişdirilib, yenilə" mesajı göstər. Heç vaxt üzərinə yazma.
- Commit yazanda `menu.json`-un "hər məhsul bir sətir" formatını saxla ki, git diff oxunaqlı qalsın.

## TƏHLÜKƏSİZLİK

- Giriş `/admin/login` səhifəsindən, tək sahib parolu ilə olsun. Parol env-də **bcrypt hash** kimi saxlanılsın (`ADMIN_PASSWORD_HASH`), açıq mətn kimi yox.
- Sessiya: imzalanmış, `httpOnly`, `secure`, `sameSite=strict` cookie, 30 gün (`SESSION_SECRET`).
- Login-ə rate limit: 5 səhv cəhddən sonra 15 dəqiqə blok.
- Bütün `/api/admin/*` endpoint-ləri sessiyanı yoxlasın. Giriş məlumatlarını serverdə də yoxla, yalnız brauzerə güvənmə.
- `/admin` səhifələrinə `noindex` qoy və onları sitemap-ə salma.
- Env dəyişənləri: `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`, `GITHUB_TOKEN` (fine-grained, yalnız bu repo üçün, yalnız `Contents: Read & write`), `GITHUB_REPO`, `GITHUB_BRANCH`.
- Parol hash-ini yaratmaq üçün skript yaz: `npm run hash-password`.

## FUNKSİYALAR

### 1. Menyu siyahısı (əsas ekran)
- Məhsullar kateqoriyalara görə qruplaşsın. Üstdə axtarış olsun (saytdakı kimi ə/ş/ç-ni tanıyan).
- Hər sətirdə: kiçik foto, ad, qiymət, **"Mövcuddur / Bitib"** açarı və redaktə düyməsi.
  - "Bitib" = `available: false`. Məhsul saytdan gizlənir, amma silinmir. Bu, gündəlik ən çox istifadə olunacaq funksiyadır.
- **Qiyməti birbaşa siyahıda dəyişmək** mümkün olsun: qiymətə toxun, rəqəm klaviaturası açılsın (`inputmode="decimal"`), yaz və təsdiqlə.

### 2. Məhsul əlavə et / redaktə et
- Sahələr:
  - Kateqoriya (siyahıdan seçilir), qrup (məs. Ət/Toyuq şaurma, lazım olan kateqoriyalarda)
  - Ad: **AZ məcburidir**, RU və EN istəyə bağlıdır. Boş qalsa, saytda AZ ad göstərilsin.
  - Tərkib, qiymət, köhnə qiymət (endirim üçün), etiketlər (populyar / yeni / acılı / toyuq / ət / vegetarian)
- `id` AZ addan avtomatik yaransın (slug: "Çizburger" → `cizburger`) və unikal olsun. Mövcud məhsulun `id`-si heç vaxt dəyişməsin, çünki kombo `includes` və müştəri səbətləri ona istinad edir.
- **Foto yükləmə**: telefonun kamerası və ya qalereyası ilə.
  - Brauzerdə 1200 px-ə qədər kiçildilib WebP-yə çevrilsin (hədəf ≤ 150 KB).
  - `public/img/`-ə commit olunsun.
- **Canlı önizləmə**: kartın saytda necə görünəcəyi yanında göstərilsin.
- **Kopyala** düyməsi: oxşar məhsulu tez yaratmaq üçün.

### 3. Silmək
- Təsdiq pəncərəsi olsun: "Çizburger silinsin? Bu geri qaytarıla bilər (Tarixçə)."
- Məhsul kombo `includes`-də istifadə olunursa, xəbərdarlıq et və hansı kombolarda olduğunu göstər. Silməyi bloklama, amma həmin kombolardan onun istinadını da təmizlə.

### 4. Sıralama
- Kateqoriya daxilində məhsulları yuxarı/aşağı hərəkət etdirmək mümkün olsun. Telefonda sürükləmə çətin olduğu üçün **↑ ↓ düymələri** qoy.

### 5. Validasiya (həm brauzerdə, həm serverdə)
- Qiymət > 0 olsun, ən çox 2 onluq rəqəm. Vergül də qəbul olunsun: "5,80" → 5.80.
- Köhnə qiymət varsa, yeni qiymətdən böyük olmalıdır.
- AZ ad boş ola bilməz. Eyni kateqoriyada eyni adda ikinci məhsul olarsa, xəbərdarlıq et.
- Qiymət 50%-dən çox dəyişirsə, səhv yazılma ehtimalına görə təsdiq istə: "5.80 → 58.00. Əminsən?"

### 6. Yayımlama
- Dəyişikliklər əvvəlcə **qaralama** kimi yığılsın. Ekranın altında sabit panel olsun: "3 dəyişiklik · **Sayta yayımla**".
- Yayımla basılanda **bir commit** getsin. Commit mesajı dəyişiklikləri sadalasın, məsələn:
  `Admin: Çizburger 5.80→6.20; Kola 0.5 bitib; yeni: Kartof dilimləri`
- Sonra status göstər: "Yayımlandı, sayt ~1 dəqiqəyə yenilənəcək". Mümkünsə Vercel deployment statusunu yoxla və "Saytda canlıdır ✓" yaz.
- Yayımlanmamış dəyişikliklər `localStorage`-da saxlansın ki, səhifə bağlansa itməsin.

### 7. Tarixçə və geri qaytarma
- `data/menu.json`-a toxunan son 30 commit göstərilsin: tarix, mesaj, "bu versiyaya qayıt" düyməsi.
- Geri qaytarma yeni commit kimi olsun, tarixçə silinməsin.

### 8. Ayarlar
- Telefon, WhatsApp, Instagram, TikTok, Facebook, Wolt, Bolt linkləri və GA4 / Meta Pixel ID-ləri.
- Bu dəyərləri `lib/config.ts`-dən **`data/settings.json`**-a köçür. `config.ts` onları oradan oxusun, saytın qalan hissəsində heç nə dəyişməsin.
- Telefon formatı yoxlanılsın (`+994XXXXXXXXX`). "Test et" düyməsi `tel:` və `wa.me` linklərini açsın.

## UX

- Admin panelin dili **Azərbaycan dili** olsun. Sahib üçün RU/EN interfeys lazım deyil.
- **Mobile-first**, 375 px-dən başla. Düymələr ən az 44 px olsun, əsas düymələr barmağın çatdığı aşağı hissədə yerləşsin.
- Saytın brend stilində olsun: qara fon, qırmızı/qızılı rənglər. Amma formalar sadə və aydın olsun.
- Hər əməliyyatdan sonra aydın bildiriş göstər: "Yadda saxlanıldı", "Yayımlandı", xəta olsa nə etmək lazım olduğu.
- Boş vəziyyətlər, yüklənmə göstəriciləri və şəbəkə xətası mesajları insan dilində yazılsın, texniki terminlərsiz.

## İCTİMAİ SAYTA TƏSİR

- Saytın dizaynı, sürəti və mövcud funksiyaları **dəyişməməlidir**: statik səhifələr, səbət, upsell, QR kod, SEO.
- `available: false` olan məhsullar saytda, səbət təkliflərində və JSON-LD-də görünməsin.
- Saxlanmış səbətdə sonradan "bitib" olan və ya silinən məhsul varsa, səbət onu sakitcə çıxarsın.

## TESTLƏR

- Validasiya, slug yaradılması və `menu.json` formatlaşdırması üçün unit testlər.
- GitHub API mock edilməklə e2e testi: login → qiymət dəyiş → bitib et → yeni məhsul (foto ilə) → yayımla → commit məzmununu yoxla → tarixçədən geri qaytar.
- Səhv parol, rate limit və sessiyasız API çağırışı üçün testlər.
- Build-dən sonra ictimai səhifələrin hələ də statik olduğunu yoxla.

## ÇATDIRILACAQLAR

1. İşlək kod və testlər
2. **Sahib üçün Azərbaycan dilində qısa təlimat** (`ADMIN.md`): necə daxil olmaq, qiymət dəyişmək, "bitib" etmək, məhsul əlavə etmək, geri qaytarmaq
3. **Qurulma təlimatı**: GitHub fine-grained token-in addım-addım yaradılması, Vercel-də env dəyişənlərinin əlavə edilməsi, parol hash-inin yaradılması

## İŞ QAYDASI

- Əvvəlcə qısa plan göstər: fayl strukturu, API endpoint-ləri, ekranlar. Sonra kodu yaz.
- Mövcud menyu məlumatlarını və qiymətləri dəyişmə.
- Mənim (developerin) etməli olduğum addımları (token, env) ayrıca siyahı kimi ver.
