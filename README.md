# US Open Typer 2026 🎾

Darmowy typer tenisowy na US Open: logowanie przez Discorda, mecze live/nierozpoczęte/
zakończone, ranking, profil, panel admina (wg Discord ID) i pytania bonusowe.

## Stack (100% darmowy)

- **Next.js 14** (App Router) - frontend + backend w jednym
- **Supabase** (darmowy plan) - baza Postgres + logowanie przez Discord OAuth
- **Vercel** (darmowy plan Hobby) - hosting
- **GitHub Actions** (darmowe) - odpytuje co ~10 min endpoint synchronizacji wyników
- **livetennisapi.com** (darmowy klucz) - dane o meczach

## ⚠️ Ograniczenie darmowego API, o którym musisz wiedzieć

Darmowy plan livetennisapi.com daje **live scores i fixtures za darmo**, ale **historia
zakończonych meczów jest płatna** (plan Basic, $9.99/mc). Dlatego appka rozlicza mecz na
podstawie ostatniego zaobserwowanego wyniku "live" tuż zanim mecz zniknie z listy live,
i oznacza go jako `needs_review = true` ("do weryfikacji") w panelu admina. Ty jako admin
zerkasz na oficjalny wynik i w razie potrzeby poprawiasz go jednym kliknięciem - punkty
przeliczają się automatycznie na nowo. To jest dokładnie ten scenariusz, o który prosiłeś
("panel ważniejszy od API, gdy błędnie rozliczy").

Zanim wystartujesz na produkcji, zajrzyj do **docs.livetennisapi.com** i porównaj dokładny
kształt JSON-a z tym, co jest w `lib/tennisApi.ts` (oznaczyłem tam `SPRAWDŹ W DOKUMENTACJI`
przy polach, które mogą się różnić od przykładu z ich strony głównej).

## Krok po kroku - jak to uruchomić

### 1. Supabase (baza + logowanie)

1. Załóż darmowe konto na [supabase.com](https://supabase.com) i stwórz nowy projekt.
2. W **SQL Editor** wklej całą zawartość pliku `supabase/schema.sql` i kliknij Run.
3. W **Authentication -> Providers** włącz **Discord**.
4. Skopiuj z Supabase `Redirect URL` (wygląda jak `https://xxxxx.supabase.co/auth/v1/callback`) -
   przyda się w kroku 2.
5. W **Project Settings -> API** skopiuj: `Project URL`, `anon public key`, `service_role key`
   (service_role trzymaj w tajemnicy - nigdy nie commituj go do repo).

### 2. Discord OAuth (Developer Portal)

1. Wejdź na [discord.com/developers/applications](https://discord.com/developers/applications) ->
   New Application.
2. Zakładka **OAuth2 -> General**: skopiuj **Client ID** i **Client Secret**, wklej je w
   Supabase (Authentication -> Providers -> Discord).
3. W **Redirects** w Discord Developer Portal dodaj URL z kroku 1.4 (ten z `supabase.co`).
4. Nick i avatar użytkownika lecą automatycznie z profilu Discorda dzięki triggerowi
   `handle_new_user` w `schema.sql` - nic więcej nie musisz robić.

### 3. Tennis API

1. Wejdź na [livetennisapi.com/subscribe/free](https://livetennisapi.com/subscribe/free) i
   odbierz darmowy klucz (bez karty).
2. Zapisz go jako `TENNIS_API_KEY`.

### 4. Zmienne środowiskowe

Skopiuj `.env.example` do `.env.local` i uzupełnij:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
TENNIS_API_KEY=...
TENNIS_API_BASE_URL=https://api.livetennisapi.com/api/public/v1
ADMIN_DISCORD_IDS=twoje_discord_id_tutaj
CRON_SECRET=wygeneruj-losowy-string-np-z-1password
NEXT_PUBLIC_SITE_URL=https://twojadomena.pl
```

Swoje Discord ID znajdziesz włączając w Discordzie tryb developerski (Ustawienia ->
Zaawansowane -> Tryb developerski), a potem klikając PPM na swój profil -> "Kopiuj ID
użytkownika". Możesz podać kilka ID oddzielonych przecinkiem.

### 5. Uruchomienie lokalnie

```bash
npm install
npm run dev
```

Wejdź na `http://localhost:3000`.

### 6. Deploy na Vercel + własna domena

1. Wrzuć projekt na GitHuba, zaimportuj repo w [vercel.com](https://vercel.com) (darmowy plan
   Hobby).
2. W **Project Settings -> Environment Variables** wklej wszystkie zmienne z `.env.local`.
3. W **Project Settings -> Domains** dodaj swoją domenę i ustaw rekordy DNS zgodnie z
   instrukcją Vercela.
4. W Discord Developer Portal i w Supabase zaktualizuj redirecty na finalną domenę
   (`https://twojadomena.pl` jako `NEXT_PUBLIC_SITE_URL`, redirect w Supabase zostaje ten sam
   `supabase.co/auth/v1/callback`).

### 7. Automatyczna synchronizacja wyników (GitHub Actions)

Darmowy Vercel (plan Hobby) pozwala na crony **tylko raz dziennie**, więc do odpytywania co
kilka minut używamy darmowego GitHub Actions (plik `.github/workflows/sync.yml`, już w
repo, domyślnie co 10 min - GitHub bywa "leniwy" przy dużym obciążeniu i realnie potrafi to
być 15-20 min, ale do typera to wystarczy).

W ustawieniach repo na GitHubie: **Settings -> Secrets and variables -> Actions -> New
repository secret** dodaj:

- `SITE_URL` = `https://twojadomena.pl`
- `CRON_SECRET` = ta sama wartość co w zmiennych środowiskowych na Vercelu

Workflow uruchomi się automatycznie po pierwszym pushu. Możesz go też odpalić ręcznie w
zakładce **Actions** na GitHubie (przycisk "Run workflow"), żeby przetestować.

## Jak działa punktacja

- Trafiony dokładny wynik meczowy w setach (np. 3:1) = **3 pkt**
- Trafiony sam zwycięzca, zły wynik w setach = **1 pkt**
- Nietrafiony zwycięzca = **0 pkt**
- Pytania bonusowe: liczba punktów ustawiana ręcznie przez admina przy tworzeniu pytania

## Panel admina (`/admin`)

Dostępny tylko dla Discord ID wymienionych w `ADMIN_DISCORD_IDS`. Pozwala:

- dodawać mecze ręcznie (gdyby API czegoś nie złapało, np. mecz dograny w nocy),
- edytować dane meczu (graczy, rundę, godzinę startu, deadline na typy),
- ręcznie ustawić/poprawić wynik - **zawsze nadpisuje to, co przyszło z API** i od razu
  przelicza punkty wszystkim graczom,
- dodawać pytania bonusowe z własnym deadlinem, edytować deadline, rozstrzygać (przyznaje
  punkty automatycznie wszystkim, którzy odpowiedzieli poprawnie),
- podejrzeć listę użytkowników i ich Discord ID (żeby łatwo dodać kogoś do
  `ADMIN_DISCORD_IDS`).

## Struktura projektu

```
app/                  strony i API routes (Next.js App Router)
  matches/            zakładki live/nierozpoczęte/zakończone
  ranking/            tabela rankingowa
  profile/            profil, moje typy, pytania bonusowe
  admin/              panel admina (chroniony)
  api/                route handlers (predictions, bonus, admin/*, cron/sync)
components/           komponenty UI
components/admin/     komponenty panelu admina
lib/                  klienci Supabase, integracja z tennis API, logika punktacji
supabase/schema.sql   cały schemat bazy + RLS - wklej w Supabase SQL Editor
.github/workflows/    darmowy scheduler (GitHub Actions) do synchronizacji wyników
```

## Możliwe dalsze usprawnienia (nie ma w MVP)

- Push/Discord webhook z powiadomieniem o nowym meczu do wytypowania
- Historia edycji wyników (kto i kiedy poprawił)
- Osobna tabela "US Open mężczyźni" / "kobiety" jeśli chcesz dwa niezależne rankingi
- Awatar/nick odświeżany automatycznie przy każdym logowaniu (obecnie trigger odpala się
  przy insert/update w `auth.users`, co pokrywa większość przypadków)
