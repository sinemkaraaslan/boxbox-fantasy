# 🏁 BoxBox Fantasy

F1 yarışları için fantasy tahmin ligi platformu. Kullanıcılar yarış öncesi top-10 sıralama, pole sitter, fastest lap ve DNF sayısı tahminleri yapar. Yarış sonrası sistem Jolpica F1 API'sinden gerçek sonuçları çeker, otomatik puanlama yapar ve lig sıralamalarını günceller.

Pole sitter tahmini gerçek F1 takvimine uygun şekilde **qualifying'den önce** ayrı bir kilit zamanına bağlıdır.

> Sistem Analizi ve Tasarımı dersi proje çalışması · Arel Üniversitesi · 2026 Bahar Dönemi

---

## Proje Özeti

| | |
|---|---|
| **Model sayısı** | 5 |
| **Endpoint sayısı** | 23 |
| **Unit test sayısı** | 49 (5 service) |
| **Mimari** | 3 katmanlı (Route → Controller → Service) |
| **Authentication** | JWT + httpOnly cookie + Bearer header |
| **Dokümantasyon** | Swagger UI (OpenAPI 3.0) |
| **Frontend** | Vanilla JavaScript SPA |
| **External API** | Jolpica F1 (Ergast halefi) |
| **Otomasyon** | node-cron ile otomatik sonuç çekme |

---

## Teknoloji Yığını

### Backend
- **Node.js 18+** + **Express.js**
- **PostgreSQL 14+** + **Sequelize ORM**
- **JWT** (jsonwebtoken) + **bcrypt** (cost 12)
- **express-validator** + Sequelize model validation
- **Helmet**, **express-rate-limit**, **CORS**, **cookie-parser**
- **node-cron** — zamanlanmış otomatik görevler

### Test & Documentation
- **Jest** (mock'lama desteğiyle, 49 unit test)
- **swagger-jsdoc** + **swagger-ui-express**

### Frontend
- **Vanilla JavaScript** — framework yok
- **Hash routing** — no build step, no bundler
- **Fetch API** + cookie-based authentication
- ES Modules ile dosya bölünmesi

### External
- **Jolpica F1 API** — Ergast API'sinin halefi, F1 yarış verileri için

---

## 3 Katmanlı Mimari

```
HTTP Request
     ↓
┌─────────────┐
│   Route     │ ← URL eşleştirme + middleware (auth, validation)
└─────────────┘
     ↓
┌─────────────┐
│ Controller  │ ← HTTP yönetimi, request/response, status code'lar
└─────────────┘
     ↓
┌─────────────┐
│  Service    │ ← İş mantığı, business rules
└─────────────┘
     ↓
┌─────────────┐
│   Model     │ ← Sequelize, DB
└─────────────┘
     ↓
PostgreSQL
```

**Neden bu yapı?**
- Service katmanı Express'ten bağımsız → **izole unit test**
- Controller sadece HTTP işlerini yapar → temiz kod
- İş mantığı tek yerde → bakım kolay
- Aynı service hem HTTP'den hem cron job'dan çağrılabilir (örnek: yarış sonucu çekme)

---

## Proje Yapısı

```
boxbox/
├── server.js                  # Sunucu giriş noktası + cron başlatma
├── package.json
├── .gitignore
│
├── public/                    # Frontend SPA
│   ├── index.html             # Tek HTML dosyası
│   ├── styles.css             # F1 temalı stil + animasyonlar
│   └── js/
│       ├── api.js             # Fetch wrapper + auth state + helpers
│       ├── app.js             # Hash router + global event handlers
│       └── views/             # Sayfa render fonksiyonları
│           ├── auth.js        # Login + Register
│           ├── leagues.js     # Lig listesi, detay, oluşturma, katılma
│           ├── races.js       # Yarış listesi (sezon bazlı)
│           ├── predictions.js # Tahmin formu + sonuç ekranı + lig tahminleri
│           └── profile.js     # Profil + istatistikler + geçmiş
│
└── src/
    ├── app.js                 # Express app + middleware'ler
    │
    ├── config/
    │   ├── database.js        # PostgreSQL bağlantısı
    │   └── swagger.js         # OpenAPI config
    │
    ├── models/                # Sequelize modelleri
    │   ├── index.js           # İlişkiler
    │   ├── User.js
    │   ├── League.js
    │   ├── LeagueMember.js
    │   ├── Race.js
    │   └── Prediction.js
    │
    ├── middlewares/
    │   ├── auth.js            # JWT cookie + Bearer doğrulama
    │   └── validate.js        # express-validator wrapper
    │
    ├── validators/            # Endpoint bazlı validation kuralları
    │   ├── authValidator.js
    │   ├── leagueValidator.js
    │   ├── raceValidator.js
    │   └── predictionValidator.js
    │
    ├── services/              # İş mantığı (test edilebilir)
    │   ├── authService.js
    │   ├── userService.js
    │   ├── leagueService.js
    │   ├── raceService.js
    │   ├── predictionService.js
    │   ├── scoringService.js  # Pure puanlama fonksiyonları
    │   ├── jolpicaService.js  # External API entegrasyonu
    │   └── __tests__/         # Jest unit testleri
    │
    ├── controllers/           # HTTP yönetimi
    │   ├── authController.js
    │   ├── leagueController.js
    │   ├── raceController.js
    │   ├── predictionController.js
    │   └── userController.js
    │
    ├── routes/                # URL eşleştirme
    │   ├── authRoutes.js
    │   ├── leagueRoutes.js
    │   ├── raceRoutes.js
    │   ├── predictionRoutes.js
    │   ├── predictionStandaloneRoutes.js
    │   └── userRoutes.js
    │
    ├── jobs/                   # Zamanlanmış görevler
    │   └── raceResultsCron.js  # Otomatik yarış sonucu çekme
    │
    └── utils/
        └── inviteCode.js      # Lig davet kodu üretici
```

---

## Kurulum

### Önkoşullar
- Node.js 18+
- PostgreSQL 14+
- Git

### Adımlar

**1. Repo'yu klonla:**
```bash
git clone https://github.com/sinemkaraaslan/boxbox-fantasy.git
cd boxbox-fantasy
```

**2. Bağımlılıkları yükle:**
```bash
npm install
```

**3. Veritabanını oluştur:**
```bash
createdb boxbox_dev
```

**4. `.env` dosyasını oluştur:**
```env
# Database
DB_NAME=boxbox_dev
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

# JWT (en az 32 karakter güçlü secret)
JWT_SECRET=your_strong_secret_here_min_32_characters

# Server
PORT=3000
```

**5. Sunucuyu başlat:**
```bash
node server.js
```

Sunucu çıktısı:
```
✅ Database bağlantısı kuruldu
✅ Modeller senkronize edildi
⏰ Cron job aktif: Her 6 saatte bir yarış sonuçları kontrol edilecek
🚀 Sunucu http://localhost:3000 adresinde çalışıyor
📖 Swagger UI: http://localhost:3000/api/docs
```

**6. Tarayıcıda aç:**
- Frontend: `http://localhost:3000`
- API Docs: `http://localhost:3000/api/docs`

---

## API Dokümantasyonu

İnteraktif Swagger UI: **`http://localhost:3000/api/docs`**

23 endpoint dokümante edilmiştir. Sağ üstte "Authorize" butonundan JWT token girip endpoint'leri tarayıcıdan canlı test edebilirsiniz.

### Endpoint Grupları

| Prefix | Endpoint sayısı | Açıklama |
|---|---|---|
| `/api/auth` | 5 | Register, login, logout, profil yönetimi |
| `/api/leagues` | 6 | Lig CRUD, davet kodu, standings |
| `/api/races` | 5 | Yarış listesi, Jolpica seed, sonuç çekme, puanlama |
| `/api/.../predictions` | 5 | Tahmin CRUD (nested + standalone) |
| `/api/users/me` | 2 | Kullanıcı istatistikleri ve tahmin geçmişi |

### Tüm Endpoint'ler

**Auth (5)**
- `POST   /api/auth/register` — Yeni kullanıcı kaydı (cookie set eder)
- `POST   /api/auth/login` — Giriş yap (cookie set eder)
- `POST   /api/auth/logout` — Çıkış yap (cookie siler)
- `GET    /api/auth/me` — Mevcut kullanıcı profili
- `PATCH  /api/auth/me` — Profil güncelle

**Leagues (6)**
- `POST   /api/leagues` — Yeni lig oluştur
- `GET    /api/leagues` — Kullanıcının ligleri
- `GET    /api/leagues/:id` — Lig detayı (üyelerle)
- `DELETE /api/leagues/:id` — Lig sil (sadece sahibi)
- `POST   /api/leagues/join` — Davet kodu ile katıl
- `GET    /api/leagues/:id/standings` — Lig sıralaması

**Races (5)**
- `GET    /api/races` — Yarış listesi (opsiyonel `?season`)
- `GET    /api/races/:id` — Yarış detayı
- `POST   /api/races/seed/:season` — Sezon takvimini Jolpica'dan seed et
- `POST   /api/races/:id/fetch-results` — Yarış sonuçlarını çek
- `POST   /api/races/:id/calculate-points` — Tahminleri puanla

**Predictions (5)**
- `POST   /api/leagues/:leagueId/races/:raceId/predictions` — Tahmin oluştur
- `GET    /api/leagues/:leagueId/races/:raceId/predictions/me` — Kendi tahminim
- `GET    /api/leagues/:leagueId/races/:raceId/predictions` — Tüm ligin tahminleri (yarış sonrası)
- `PUT    /api/predictions/:id` — Tahmin güncelle
- `DELETE /api/predictions/:id` — Tahmin sil

**Users (2)**
- `GET    /api/users/me/stats` — Kullanıcı istatistikleri
- `GET    /api/users/me/predictions` — Kullanıcının tüm tahminleri

---

## Puanlama Mantığı

Bir yarıştan kazanılabilecek **maksimum puan: 140**

| Kategori | Maks Puan |
|---|---|
| Podium (Top 10) | 100 |
| Pole sitter | 15 |
| Fastest lap | 10 |
| DNF sayısı | 15 |
| **Toplam** | **140** |

### Podium puanlaması (her sürücü için)

Pozisyon farkına göre puan verilir:

| Pozisyon farkı | Puan |
|---|---|
| Tam doğru (0) | **10** |
| 1 pozisyon sapma | **5** |
| 2 pozisyon sapma | **2** |
| 3+ sapma ama top 10'da | **1** |
| Top 10 dışında | **0** |

10 sürücü × max 10 puan = **100 puan** podium toplamı.

### Bonus puanlama

- **Pole sitter** tam doğru: +15, aksi halde 0
- **Fastest lap** tam doğru: +10, aksi halde 0
- **DNF sayısı:**
  - Tam doğru: +15
  - 1 sapma: +5
  - 2+ sapma: 0

### Maksimum hesap

`100 (podium) + 15 (pole) + 10 (FL) + 15 (DNF) = 140 puan`

---

## Tahmin Kilitleme Sistemi

F1 takvimine uygun **iki ayrı kilit zamanı** vardır:

### 1. predictionLockAt (Yarış kilidi)

Yarış başlangıcından **1 saat önce**. Bu kilit kapandıktan sonra:
- ❌ Podium tahmini değiştirilemez
- ❌ Fastest lap tahmini değiştirilemez
- ❌ DNF sayısı tahmini değiştirilemez
- ❌ Tahmin silinemez

### 2. qualifyingLockAt (Pole kilidi) ⭐

**Qualifying başlangıcı**. Gerçek F1 takviminde qualifying yarıştan **bir gün önce** yapılır, pole sitter o zaman belli olur. Bu yüzden pole tahmini ayrı kilitlenir.

- ❌ Pole sitter tahmini qualifying'den sonra değiştirilemez
- ✅ Podium/FL/DNF hâlâ açık olabilir (yarış kilidi daha sonra)

qualifyingLockAt değeri **Jolpica F1 API**'sinden gerçek qualifying başlangıç zamanı olarak çekilir.

### Örnek: Bahrain 2024

```
qualifyingLockAt: 1 Mart 2024, 16:00 UTC (Cumartesi qualifying başlangıcı)
predictionLockAt: 2 Mart 2024, 14:00 UTC (Yarış başlangıcı - 1 saat)
raceDate:        2 Mart 2024, 15:00 UTC (Yarış başlangıcı)
```

Kullanıcı pole tahminini 1 Mart 16:00'a kadar, podium/FL/DNF tahminini 2 Mart 14:00'a kadar yapabilir.

### Frontend gösterimi

Pole tahmini kilitlendiyse form'da:
- Pole pill'leri opacity %50, tıklanamaz
- Çapraz çizgili (pattern) bir gösterim
- Uyarı mesajı: "Qualifying başladı, pole tahmini değiştirilemez"

Backend'de `predictionService` ayrı kontrol yapıyor:
```javascript
if(!isQualifyingOpen(race)){
  if(data.poleSitter !== undefined){
    throw new Error('QUALIFYING_CLOSED');
  }
}
```

---

## Veritabanı Şeması

**5 tablo:**

### users
| Alan | Tip | Açıklama |
|---|---|---|
| id | UUID | Primary key |
| username | string | Benzersiz |
| email | string | Benzersiz |
| passwordHash | string | bcrypt hash (cost 12) |
| favoriteDriver | string | Opsiyonel |
| favoriteTeam | string | Opsiyonel |
| bio | text | Opsiyonel |
| avatarUrl | string | Opsiyonel |

### leagues
| Alan | Tip | Açıklama |
|---|---|---|
| id | UUID | Primary key |
| name | string | Lig adı |
| description | text | Opsiyonel |
| season | integer | F1 sezonu (2020-2026) |
| inviteCode | string | 8 karakter, benzersiz |
| isPublic | boolean | Public/private |
| ownerId | UUID | FK → users |

### league_members
Junction tablosu. **Composite unique:** `(userId, leagueId)`

| Alan | Tip | Açıklama |
|---|---|---|
| userId | UUID | FK → users |
| leagueId | UUID | FK → leagues |
| role | enum | 'owner', 'member' |
| totalPoints | integer | Lig içi toplam puan |

### races
| Alan | Tip | Açıklama |
|---|---|---|
| id | UUID | Primary key |
| season | integer | F1 sezonu |
| round | integer | Yarış sırası |
| name | string | Yarış adı |
| circuit | string | Pist/ülke |
| raceDate | timestamp | Yarış başlangıcı |
| **predictionLockAt** | timestamp | Tahmin kilidi (raceDate - 1 saat) |
| **qualifyingLockAt** | timestamp | Pole kilidi (qualifying başlangıcı) |
| finalResults | jsonb | Top 10 sürücü array'i |
| poleSitter | string | Sürücü kodu |
| fastestLap | string | Sürücü kodu |
| dnfCount | integer | DNF yapan sürücü sayısı |
| isCompleted | boolean | Sonuçlar girildi mi |

### predictions
**Composite unique:** `(userId, raceId, leagueId)`

| Alan | Tip | Açıklama |
|---|---|---|
| id | UUID | Primary key |
| userId | UUID | FK → users |
| raceId | UUID | FK → races |
| leagueId | UUID | FK → leagues |
| podiumOrder | jsonb | 10 sürücü kodu array'i |
| poleSitter | string | Sürücü kodu |
| fastestLap | string | Sürücü kodu |
| dnfCount | integer | Tahmin edilen DNF sayısı |
| pointsAwarded | integer | Puanlandı (varsayılan 0) |
| pointsBreakdown | jsonb | Kategorik puan kırılımı |

### İlişkiler

```
User ─┬─< LeagueMember >─┬─ League
      │                  │
      └─< Prediction >───┴─< Race
```

---

## Test

```bash
npm test
```

İş mantığı için **49 unit test**, **~0.25 saniyede** çalışır.

### Test Kapsamı

| Service | Test sayısı | Açıklama |
|---|---|---|
| `scoringService` | 21 | Pure function'lar — puanlama algoritması, izole test |
| `authService` | 7 | Login, profil, mass assignment koruma |
| `leagueService` | 6 | Lig CRUD, davet kodu, üyelik |
| `predictionService` | 7 | Tahmin business rules, ownership |
| `raceService` | 7 | Sezon validation, fetch result |

### Test Stratejisi

- **Pure function'lar** (scoringService): DB'siz, izole test
- **DB'ye bağlı service'ler**: Jest `mock` özelliği ile test edildi

### Mock Örneği

```javascript
jest.mock('../../models', () => ({
  League: { findByPk: jest.fn(), findOne: jest.fn() },
  LeagueMember: { findOne: jest.fn() },
}));

test('lig yoksa hata', async () => {
  League.findByPk.mockResolvedValue(null);
  await expect(createPrediction(...)).rejects.toThrow('LEAGUE_NOT_FOUND');
});
```

---

## Güvenlik

| Önlem | Açıklama |
|---|---|
| **JWT + bcrypt (cost 12)** | Authentication + güçlü password hash |
| **httpOnly cookie** | XSS koruması — JavaScript token'a erişemez |
| **sameSite=strict** | CSRF koruması (ek middleware'e gerek yok) |
| **Bearer header desteği** | Swagger UI için (cookie dışında da çalışır) |
| **Helmet** | Güvenlik HTTP header'ları (CSP, HSTS, X-Frame-Options, vs.) |
| **Rate limiting** | Auth: 10 istek/15 dk (brute-force), genel: 300/15 dk |
| **express-validator** | Body/param/query validation |
| **Sequelize model validation** | DB seviyesinde ikinci kontrol |
| **UUID primary key'ler** | Enumeration attack koruması |
| **Ownership check'leri** | Service'lerde "sadece sahibi düzenleyebilir" |
| **Mass assignment whitelist** | Controller'lar req.body'yi filtreliyor |
| **Generic auth error** | "Geçersiz email veya şifre" — info disclosure koruması |
| **Composite unique constraint'ler** | Duplicate kayıt DB seviyesinde engelli |
| **CORS** | Specific origin + credentials |

### JWT Akışı

- **Login:** Şifre bir kez bcrypt ile doğrulanır → `jwt.sign({ sub: user.id })` ile imzalı token üretilir → httpOnly cookie olarak set edilir. Token response body'de döndürülmez.
- **Sonraki istekler:** Tarayıcı cookie'yi otomatik gönderir → middleware `jwt.verify` ile imzayı doğrular → `req.user.id` set edilir. Sunucu hiçbir oturum bilgisi tutmaz (stateless).
- **Veri izolasyonu:** Her sorgu JWT'den gelen `userId` ile filtrelenir. Silme/güncellemede ownership kontrolü (`NOT_OWNER`). Bir kullanıcı başkasının verisine erişemez.

---

### Akış Örneği (Login → Tahmin)

```
1. Tarayıcı /index.html yükler
2. app.js router çalışır, /login render edilir
3. Form submit → POST /api/auth/login → backend httpOnly cookie set eder
4. setCurrentUser(user) → memory'de user, location.hash = #/leagues
5. router tekrar tetiklenir, renderLeagues() çağrılır
6. Lig kartına tıkla → hashchange event → renderLeagueDetail()
7. Yarış seç → renderPrediction() → tahmin formu
8. Submit → POST /predictions → cookie ile otomatik authentication
```

### Sayfa Yapısı

| URL (hash) | View |
|---|---|
| `#/login` | Giriş formu |
| `#/register` | Kayıt formu |
| `#/leagues` | Lig listesi |
| `#/leagues/create` | Yeni lig oluştur |
| `#/leagues/join` | Davet kodu ile katıl |
| `#/leagues/:id` | Lig detayı + standings |
| `#/races` | Yarış listesi (sezon bazlı) |
| `#/leagues/:lid/races/:rid/predict` | Tahmin formu / sonuç ekranı |
| `#/profile` | Profil + istatistikler + tahmin geçmişi |

### Tahmin Sayfası Akıllı Durumlar

Frontend `renderPrediction` fonksiyonu yarışın durumuna göre 5 farklı view gösterir:

1. **Form** — Tahmin kilidi açıksa, tahmin yap/güncelle
2. **Sonuç ekranı** — Yarış bitti + tahmin var + puanlandı → 140 puan breakdown + ligdeki tüm tahminler
3. **Missed race** — Yarış bitti + tahmin yok → "Bu yarışa tahmin yapmamışsın" + yarış sonucu
4. **Sonuç bekleniyor** — Kilit kapalı ama yarış sonuçlanmamış
5. **Puanlama bekleniyor** — Yarış tamamlandı ama puanlar henüz hesaplanmamış

### Defensive Programming

Profil tahmin geçmişinde, silinmiş lig veya yarışa ait "öksüz" (orphan) tahminler null kontrolüyle filtreleniyor — kullanıcı bir ligi silse bile sayfa hata vermiyor.

---

## External API ve Otomasyon

[Jolpica F1 API](https://github.com/jolpica/jolpica-f1) — Ergast API'sinin halefi:

| Endpoint | Kullanım |
|---|---|
| `GET /{season}.json` | Sezon takvimi + qualifying tarihleri |
| `GET /{season}/{round}/results.json` | Yarış sonuçları (top 10, FL, DNF status) |
| `GET /{season}/{round}/qualifying.json` | Pole sitter |

`raceService.seedSeason()` ve `fetchAndSaveResults()` fonksiyonları bu API'yi çağırıp DB'ye kaydediyor.

### Yarış Sonucu Çekme — İki Yöntem, Tek İş Mantığı

Yarış sonuçları iki şekilde çekilebilir:

1. **Manuel** — `POST /api/races/:id/fetch-results` admin endpoint'i. Kontrol kullanıcıda.
2. **Otomatik** — `node-cron` ile her 6 saatte bir, bitmiş ama sonuçları girilmemiş yarışlar kontrol edilip Jolpica'dan otomatik çekilir.

Her iki yöntem de aynı `raceService.fetchAndSaveResults()` fonksiyonunu çağırır. Service katmanı tetikleyiciden bağımsız olduğu için aynı kod hem HTTP hem cron'dan çalışır — 3 katmanlı mimarinin avantajı.

```javascript
cron.schedule('0 */6 * * *', async () => {
  const pendingRaces = await Race.findAll({
    where: { isCompleted: false, raceDate: { [Op.lte]: threeHoursAgo } }
  });
  for (const race of pendingRaces) {
    await raceService.fetchAndSaveResults(race.id);
  }
});
```

### Qualifying Lock Hesaplama

`fetchSeasonRaces`'te Jolpica'dan qualifying tarihi varsa onu, yoksa fallback (raceDate - 24 saat) kullanılıyor:

```javascript
let qualifyingLockAt;
if (race.Qualifying && race.Qualifying.date) {
  const qualTime = race.Qualifying.time || '14:00:00Z';
  qualifyingLockAt = new Date(`${race.Qualifying.date}T${qualTime}`);
} else {
  qualifyingLockAt = new Date(raceDateTime.getTime() - 24 * 60 * 60 * 1000);
}
```

---

## Gelecek Sürümler

- **Achievement/Badge sistemi** — "İlk 100 puan", "Mükemmel tahmin", "Sezon şampiyonu" rozetleri
- **WebSocket** — yarış sonuçları için real-time bildirim
- **Sprint race** desteği — F1'in sprint formatı için ekstra kategori
- **Soft delete** — kullanıcı/lig silmede cascade ve data integrity
- **PWA** — offline destek

---

## Geliştirici

**Sinem Karaaslan**
Bilgisayar Mühendisliği · Arel Üniversitesi

GitHub: [@sinemkaraaslan](https://github.com/sinemkaraaslan)

---

## Ders Bilgisi

**Sistem Analizi ve Tasarımı**
Bahar 2026 Dönemi · Arel Üniversitesi

Yarış verileri Jolpica F1 API'sinden çekilmektedir.