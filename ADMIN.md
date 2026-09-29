# Admin panel — istifadə təlimatı

Ünvan: **https://danaburger-ten.vercel.app/admin/**

Paneldə etdiyiniz dəyişikliklər əvvəlcə **qaralama** kimi saxlanılır və saytda görünmür. Aşağıdakı **"Sayta yayımla"** düyməsini basanda hamısı birlikdə yayımlanır. Sayt təxminən **1–2 dəqiqəyə** yenilənir. Sayt yenilənəndə panel **"Saytda canlıdır ✓"** yazır.

---

## 3 filial: nə ümumidir, nə filiala aiddir

| Bütün filiallar üçün **ümumi** | Hər filial üçün **ayrı** |
|---|---|
| Məhsulun adı, fotosu, kateqoriyası, etiketləri, ümumi tərkibi | Qiymət, köhnə qiymət (endirim), "bitib" |
| | Məhsulun həmin filialda satılıb-satılmaması |
| | Filiala xas tərkib (məs. 4-cü mkr burgerləri) |
| | Menyudakı sıra |
| | Telefon, WhatsApp, ünvan, xəritə, iş saatları, QR kod |

**Menyu** ekranının yuxarısında filial seçicisi var: **📍 Günəşli | 📍 Nərimanov | 📍 4-cü mikrorayon**. Cədvəl seçilmiş filialın qiymətlərini göstərir və dəyişir. Seçim yadda qalır.

**"Bitib"** ilə **"Bu filialda satılmır"** fərqlidir:
- **Bitib:** məhsul menyuda qalır, saytdan müvəqqəti gizlənir. Qurtaranda istifadə edin.
- **Satılmır:** məhsul bu filialın menyusundan çıxarılır. Məsələn, Nərimanovda izqara yoxdur.

---

## Giriş

1. Ünvanı açın və parolu yazın.
2. Giriş 30 gün yadda qalır. Çıxmaq üçün: kompüterdə sol aşağıda **⎋ Çıxış**, telefonda yuxarı sağda **⎋** düyməsi.
3. Parolu 5 dəfə səhv yazsanız, giriş 15 dəqiqəlik bloklanır.

---

## Kompüterdə

### Qiyməti dəyişmək
- Əvvəlcə yuxarıdan **filialı seçin**. Qiymət yalnız həmin filialda dəyişir.
- Cədvəldə qiymət xanasına klik edin, yeni qiyməti yazın və **Enter** basın. Vergül də olar: `5,80`.
- **Enter** basanda kursor avtomatik olaraq aşağıdakı məhsulun qiymət xanasına keçir. Bütün kateqoriyanın qiymətlərini Excel-dəki kimi ardıcıl yaza bilərsiniz. **↑** bir sətir yuxarı qayıdır, **Esc** yazdığınızı ləğv edir.
- **Köhnə qiymət** sütunu endirim üçündür. Onu yazsanız, saytda köhnə qiymət üstündən xətt çəkilmiş göstərilir və "X ₼ qənaət" yazılır. Xananı boşaltsanız, endirim silinir.
- Qiyməti 50%-dən çox dəyişsəniz (məsələn, 5.80 → 58.00), panel səhv yazılmaması üçün təsdiq istəyir.

### Toplu qiymət dəyişikliyi
1. Yuxarıda **± Toplu qiymət** düyməsini basın.
2. Qiyməti dəyişəcək məhsulları seçin: bütün kateqoriya və ya əvvəlcədən checkbox ilə seçdiyiniz məhsullar.
3. **Hansı filiallarda** dəyişəcəyini işarələyin. Seçilmiş filial avtomatik işarələnir, istəsəniz üçünü də seçə bilərsiniz.
4. Məbləği yazın, məsələn `0.50` və ya `10`, sonra **₼** və ya **%** seçin. Endirim üçün mənfi rəqəm yazın: `-5`.
5. Cədvəldə köhnə və yeni qiymətlərə baxın. Bir neçə filial seçilibsə, hər sətrin əvvəlində filial adı yazılır. İstəsəniz, **0.10-a yuvarlaqlaşdır** seçimini işarələyin.
6. **"N qiyməti dəyiş"** düyməsini basın.

### Bir neçə məhsulu birdən dəyişmək
Sol tərəfdəki checkbox-larla məhsulları seçin. Yuxarıda çıxan paneldən bunları edə bilərsiniz: **Bitib et**, **Mövcud et**, **Kateqoriyanı dəyiş** (bütün filiallarda), **± Qiymət**, **Bu filialdan çıxar**.

### Filialları müqayisə
Sol menyuda **⚖️ Müqayisə** bölməsi var. Burada hər məhsulun 3 filialdakı qiyməti yan-yana göstərilir.
- **Yalnız fərqli olanlar** işarələnəndə yalnız qiyməti filiallar arasında fərqli olan məhsullar qalır.
- Qiyməti birbaşa bu cədvəldə dəyişmək olar (Enter / ↑ ↓ ilə).
- **Boş xana (—)** həmin filialda satılmır deməkdir. Ora qiymət yazsanız, məhsul həmin filialın menyusuna əlavə olunur. Qiyməti silsəniz, təsdiqdən sonra menyudan çıxarılır.

### Başqa filialda olan məhsulu bu filiala əlavə etmək
Menyu cədvəlinin üstündə **"▸ Nərimanov filialında satılmayan məhsullar (27)"** yazısı var. Onu açın, məhsulun yanında **+ Nərimanov menyusuna** basın və qiyməti yazın. Pəncərədə digər filiallardakı qiymət göstərilir.

### Yeni məhsul və məhsulu redaktə etmək
1. **+ Yeni məhsul** düyməsini (və ya klaviaturada `N`) basın.
2. Ad (AZ) məcburidir, qalan sahələr istəyə bağlıdır. RU/EN ad boş qalsa, saytda AZ ad göstərilir. Ad, foto, kateqoriya, etiketlər və tərkib **3 filialın hamısına aiddir**.
3. **Filiallar və qiymətlər** bölməsində hər filial üçün ayrıca blok var:
   - **Bu filialda satılır** açarı. Yeni məhsulda seçdiyiniz filial artıq yandırılmış olur.
   - **Qiymət** (məcburi) və **köhnə qiymət** (endirim üçün).
   - **Mövcuddur / Bitib**.
   - **Bu filialda fərqli tərkib**: işarələsəniz, həmin filial üçün ayrıca tərkib yaza bilərsiniz.
   - **⇉ Hamısına eyni qiymət** düyməsi seçilmiş filialın qiymətini digər filiallara köçürür və onları da "satılır" edir.
3. **Foto** üçün şəkli qutuya sürükləyib atın və ya **📷 Foto seç** düyməsini basın. Şəkil avtomatik kiçildilir, böyük faylı özünüz kiçiltməyə ehtiyac yoxdur.
4. Sağ tərəfdə kartın seçilmiş filialın saytında necə görünəcəyi göstərilir.
5. **Yadda saxla** (və ya `Ctrl+S`) basın.

**🗑 Hər yerdən sil** məhsulu bütün filiallardan və kataloqdan silir. Yalnız bir filialdan çıxarmaq üçün həmin filialın "Bu filialda satılır" açarını söndürün və ya cədvəldəki 🗑 düyməsini basın (**Bu filialdan çıxar**).

Oxşar məhsulu tez yaratmaq üçün mövcud məhsulu açıb **⧉ Kopyala** düyməsini basın. Kopyaya bütün filialların qiymətləri də keçir.

### Sıralama
Sətrin solundakı **⋮⋮** işarəsindən tutub məhsulu kateqoriya daxilində yuxarı və ya aşağı sürükləyin. Sıra hər filialda ayrıdır.

### Qısayollar
| Düymə | Nə edir |
|---|---|
| `/` | Axtarış |
| `N` | Yeni məhsul |
| `Ctrl+S` | Yadda saxla |
| `Esc` | Pəncərəni bağla |

---

## Telefonda

- **Filial seçmək:** yuxarıdakı **📍 Günəşli | Nərimanov | 4-cü mikrorayon** düymələri.
- **"Bitib" etmək:** məhsulun yanındakı yaşıl açarı basın, açar boz olur. Məhsul saytdan gizlənir, amma silinmir. Yenidən basanda geri qayıdır.
- **Qiyməti dəyişmək:** qiymət xanasına toxunun, rəqəm klaviaturası açılır. Yazın və **Enter** basın.
- **Yeni məhsul:** sağ aşağıdakı sarı **+** düyməsini basın. Foto üçün kamera ilə çəkə və ya qalereyadan seçə bilərsiniz.
- **Sıralama:** kartdakı **↑ ↓** düymələri ilə.
- Toplu əməliyyatlar yalnız kompüterdə var.

---

## Yayımlama

- Aşağıdakı zolaq neçə dəyişiklik olduğunu göstərir. **"bax"** düyməsi dəyişikliklərin siyahısını açır.
- **Sayta yayımla** basanda bütün dəyişikliklər yayımlanır və sayt 1–2 dəqiqəyə yenilənir.
- **Ləğv et** yayımlanmamış bütün dəyişiklikləri silir.
- Yayımlamadan səhifəni bağlasanız, dəyişikliklər itmir. Amma onlar yalnız **həmin cihazda və brauzerdə** saxlanılır. Telefonda başlanan işi kompüterdə davam etdirmək olmur, əvvəlcə yayımlamaq lazımdır.

### "Menyu başqa yerdən dəyişdirilib" mesajı
Siz redaktə edərkən menyu başqa cihazdan yayımlanıb. Panel heç nəyin üzərinə yazmır. Pəncərədə sizin dəyişikliklərinizin siyahısı göstərilir. **Menyunu yenilə** basın və həmin dəyişiklikləri təkrar edin.

---

## Tarixçə və geri qaytarma

**Tarixçə** bölməsində son 30 dəyişiklik görünür: tarix, kim etdi və nə dəyişdi. Filiala aid dəyişikliklərin əvvəlində filialın adı yazılır, məsələn "Nərimanov: Çizburger 5.80→6.20". Səhv bir şey yayımlasanız, səhvdən əvvəlki versiyanın yanındakı **↺ Bu versiyaya qayıt** düyməsini basın. Bu düymə **bütün filialların menyularını və qiymətlərini** həmin vəziyyətə qaytarır. Telefonlar, ünvanlar və digər ayarlar dəyişmir. Geri qaytarma da tarixçədə yeni qeyd kimi saxlanılır, yəni onu da geri qaytarmaq olar. Filiallar əlavə olunmazdan əvvəlki versiyalara qayıtmaq olmur.

---

## Ayarlar

Hər filial üçün ayrıca kart var:
- **Telefon** və **WhatsApp nömrəsi**. Nömrəni istənilən formatda yaza bilərsiniz (`055 541 48 48`), panel onu özü `+994555414848` formatına çevirir. **Zəngi test et** və **WhatsApp-ı test et** düymələri nömrənin işlədiyini yoxlamaq üçündür. Həmin filialın WhatsApp sifarişləri bu nömrəyə gəlir.
- **Ünvan** (AZ, RU, EN).
- **Xəritə koordinatı:** Google Maps-da filialın üstünə sağ klik edin, çıxan rəqəmlərə (məs. `40.4093, 49.8671`) klik edib kopyalayın və bura yapışdırın. Google Maps linkini də yapışdırmaq olar. Koordinat olmayan filialda xəritə və "Yol tarifi" gizlidir. Ana səhifədəki "Ən yaxın filial" düyməsi isə ən azı 2 filialın koordinatı olanda görünür.
- **İş saatları:** gecə yarısından sonra bağlanma da olar (11:00 – 05:00). "İndi açıqdır / Bağlıdır" statusu bu saatlarla hesablanır.
- **Masalar üçün QR kod:** filialın menyusunu açır. **⬇ Çap üçün yüklə (SVG)** düyməsi ilə yükləyib çap edin. Hər filialın masalarına öz kodunu qoyun.

Kartların altında bütün filiallar üçün ümumi bölmələr var: sosial şəbəkələr, Wolt/Bolt linkləri və analitika ID-ləri. Ayarlar da **Sayta yayımla** ilə yayımlanır.

---

## Tez-tez suallar

**Sayt yenilənmədi.** Adətən 1–2 dəqiqə çəkir. 5 dəqiqədən çox keçibsə, səhifəni yeniləyin (telefonda aşağı çəkin). Yenə olmursa, developerə yazın.

**Məhsulu təsadüfən sildim.** Tarixçədən silmədən əvvəlki versiyaya qayıdın.

**Parolu unutdum.** Developer yeni parol qura bilər (aşağıda "Qurulma" bölməsinə baxın).

**Yeni kateqoriya və ya yeni filial əlavə etmək istəyirəm.** Bu, hələlik paneldə yoxdur, developerə yazın. Setlərin tərkibi də (səbətdəki "setə keç" təklifi üçün) paneldə dəyişdirilmir.

**Köhnə QR kodlar (filiallardan əvvəl çap olunanlar) işləyirmi?** Bəli, onlar Günəşli menyusunu açır. Nərimanov və 4-cü mkr masaları üçün yeni kodları Ayarlardan yükləyin.

---
---

# Qurulma (developer üçün)

Admin panel verilənlər bazası istifadə etmir. "Sayta yayımla" basılanda panel GitHub API ilə dəyişən faylları **bir commit** kimi yazır: `data/menu.json` (kataloq), `data/branches/<filial>.json` (filial menyuları), `data/branches.json` (filial məlumatları), `data/settings.json` və yeni fotolar (`public/img/u/`). Vercel bu commit-i görüb saytı yenidən build edir.

Filiallar üçün **yeni env dəyişəni lazım deyil**. Əvvəlki quraşdırma olduğu kimi işləyir.

## 1. GitHub token

1. GitHub → sağ yuxarıda profil → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
2. **Token name**: `Dana Burger admin`.
3. **Expiration**: icazə verilən ən uzun müddəti seçin və bitmə tarixi üçün təqvimə xatırlatma qoyun. Token bitəndə panel "GitHub açarı işləmir" yazacaq.
4. **Repository access** → **Only select repositories** → bu repozitoriya.
5. **Permissions** → **Repository permissions** → **Contents: Read and write**. Başqa heç nə lazım deyil.
6. **Generate token** basın və tokeni kopyalayın. O, yalnız bir dəfə göstərilir.

Commit-lər tokenin sahibinin adı ilə gedir. Bu vacibdir: Vercel-in Hobby planı private repoda, müəllifi hesabla əlaqəli olmayan commit-ləri deploy etməyə bilər.

## 2. Parol

```bash
npm install
npm run hash-password
```

Skript parolu gizli şəkildə soruşur (ən az 8 simvol) və iki sətir çap edir: `ADMIN_PASSWORD_HASH=…` və `SESSION_SECRET=…`. Hash base64 formatındadır, çünki adi bcrypt hash-indəki `$` simvolları `.env` fayllarında problem yaradır. Parolun özü heç yerdə saxlanılmır.

## 3. Vercel

Vercel → layihə → **Settings** → **Environment Variables**. Aşağıdakıları **Production** mühiti üçün əlavə edin:

| Dəyişən | Dəyər |
|---|---|
| `ADMIN_PASSWORD_HASH` | `npm run hash-password` çıxışından |
| `SESSION_SECRET` | `npm run hash-password` çıxışından (ən az 32 simvol) |
| `GITHUB_TOKEN` | 1-ci addımdakı token |
| `GITHUB_REPO` | `pashamusayev/danaburger` |
| `GITHUB_BRANCH` | Vercel-in Production Branch-i. İndi: `claude/dazzling-ride-gkxnt0` |

Sonra **Deployments** → sonuncu deploy → **⋯** → **Redeploy** edin, çünki env dəyişənləri yalnız yeni deploy-da oxunur.

`GITHUB_BRANCH` mütləq Vercel-in **Production Branch**-i ilə eyni olmalıdır. Əks halda dəyişikliklər başqa branch-a yazılar və sayta düşməz. Production branch sonra dəyişsə (məsələn, `main`-ə), bu dəyişəni də yeniləyin.

**Parolu dəyişmək:** `npm run hash-password` ilə yeni `ADMIN_PASSWORD_HASH` yaradın, Vercel-də köhnəsini əvəz edin və Redeploy edin. `SESSION_SECRET`-i də dəyişsəniz, bütün cihazlardakı sessiyalar bağlanır.

## Lokal inkişaf

Real repoya toxunmamaq üçün saxta GitHub serveri var:

```bash
cp .env.example .env.local           # hash-i `npm run hash-password` ilə yaradıb yazın
npm run admin:mock                   # saxta GitHub: http://localhost:4010 (yaddaşda saxlanılır)
npm run dev                          # http://localhost:3000/admin/
```

## Testlər

```bash
npm run test:unit                    # validasiya, format, slug, diff, sessiya, rate limit (vitest)
npm run build && npm run test:e2e    # Playwright, saxta GitHub ilə, 1440 px və 375 px
```

## Təhlükəsizlik haqqında qeydlər

- Sessiya cookie-si HMAC ilə imzalanır və `httpOnly; secure; sameSite=strict` parametrləri ilə qoyulur. Bundan əlavə, bütün POST sorğularında `Origin` yoxlanılır.
- Server brauzerə etibar etmir: menyu, ayarlar və foto yolları yayımlanmadan əvvəl serverdə yenidən yoxlanılır. Fotolar faylın ilk baytlarına görə yoxlanılır və 600 KB-dan böyük ola bilməz. Commit mesajı da serverdə hesablanır.
- Login rate limit hər server instansiyasının yaddaşında saxlanılır. Vercel bir neçə instansiya işlədə bilər, ona görə bu, parol təxmin edəni tam dayandırmır, yalnız yavaşladır. Bcrypt (cost 12) isə hər cəhdi baha edir. Güclü parol seçin.
- `/admin` və `/api` `robots.txt`-də bağlıdır, admin səhifələrində də `noindex` var. Admin səhifələrinə analitika skriptləri yüklənmir.
