# CLAUDE.md — CRM Cold Outreach / Salony Urody

Plik instruktażowy dla Claude Code. Czytaj go w całości przed każdą sesją.
Nie zgaduj. Jeśli coś jest niejasne — wróć tu najpierw.

---

## 1. Kontekst projektu

**Użytkownik aplikacji:** jedna osoba — sprzedawca, który używa CRM sam, codziennie, na laptopie.

**Do czego służy:** śledzenie własnego cold outreachu. Sprzedawca dzwoni do właścicielek salonów urody, chce wiedzieć z kim rozmawiał, co ustalił, kiedy oddzwonić i gdzie jest każdy kontakt w procesie sprzedaży.

**Kim są kontakty w bazie:** właścicielki salonów urody i studiów kosmetycznych w polskich miastach — to leady, nie użytkownicy aplikacji. Dane pochodzą głównie z Outscrapera (Google Maps).

**Co sprzedaje:** automatyzacje AI + strony internetowe, ticket 3–5k PLN.

Aplikacja nie jest przeznaczona dla salonów urody. Jest narzędziem sprzedawcy do ogarnięcia swojego pipeline'u.

---

## 2. Stack i środowisko

- **Framework:** React (single-file, bez backendu)
- **Persystencja:** localStorage — jedyne źródło danych, trwa między sesjami
- **Styl:** Tailwind utility classes (tylko bazowe, bez kompilatora)
- **Język UI:** Polski
- **Środowisko:** przeglądarka, desktop, szerokość ~1280px+

Nie używaj zewnętrznych baz danych, API, ani serverless functions.
Wszystko działa offline, lokalnie w przeglądarce.

---

## 3. Model danych

### 3.1 Obiekt Kontakt

```js
{
  id: string,                  // uuid, generowany przy dodawaniu
  nazwaSlonu: string,          // wymagane
  imie: string,
  telefon: string,             // wymagane — jedyne pole do deduplikacji przy imporcie CSV
  miasto: string,
  www: string,
  zrodlo: 'google_maps' | 'polecenie' | 'inne',

  status: StatusType,          // patrz sekcja 4
  tor: 'nie_odbiera' | 'rozmawial' | null,  // przypisywany przy pierwszej akcji

  licznikTel: number,          // 0–6, tylko tor nie_odbiera
  licznikOutreach: number,     // 0–2, tylko tor nie_odbiera

  dataOstatniegoKontaktu: string | null,   // ISO date
  nastepnyKrok: string,
  dataPrzypomnienia: string | null,        // ISO date

  mailWyslany: boolean,
  dataMail: string | null,                 // ISO date

  typDemo: 'online' | 'spotkanie' | null,
  linkLubAdres: string,

  wartoscKontraktu: number | null,         // PLN

  powodOdmowy: PowodOdmowyType | null,
  poraDnia: 'rano' | 'po17' | null,

  dataArchiwizacji: string | null,         // ISO date
  dataNurturingu: string | null,           // ISO date = dataArchiwizacji + 6 miesięcy

  notatki: Notatka[],                      // osadzone w kontakcie, nie osobna kolekcja
  dataUtworzenia: string                   // ISO date
}
```

### 3.2 Obiekt Notatka

```js
{
  id: string,          // uuid
  tresc: string,
  dataWpisu: string    // ISO datetime
}
```

### 3.3 Typy statusów

```js
type StatusType =
  | 'do_zadzwonienia'
  | 'proby_kontaktu'       // tor nie_odbiera
  | 'w_kontakcie'          // tor rozmawial
  | 'prosi_o_maila'
  | 'mail_wyslany'
  | 'demo_umowione'
  | 'po_demo'
  | 'zamkniete_tak'
  | 'zamkniete_nie'
  | 'odlozone'
  | 'archiwum'
```

### 3.4 Powody odmowy

```js
type PowodOdmowyType =
  | 'za_drogo'
  | 'zly_moment'
  | 'ma_kogos'
  | 'brak_decyzji'
  | 'nie_zainteresowana'
  | 'inne'
```

---

## 4. Pipeline — logika torów

### Tor 1 — Nie odbiera

```
do_zadzwonienia
  → [+1 próba tel, nie odebrała] → proby_kontaktu
  → [po 6 tel + 2 outreach]      → archiwum (AUTO)
```

Automatyzacja archiwizacji:
```
jeśli licznikTel >= 6 AND licznikOutreach >= 2:
  status = 'archiwum'
  dataArchiwizacji = dziś
  dataNurturingu = dziś + 6 miesięcy
```

### Tor 2 — Rozmawiał

```
do_zadzwonienia / proby_kontaktu
  → [odebrała, rozmawiałem]  → w_kontakcie
  → [prosi o maila]          → prosi_o_maila
  → [mail wysłany]           → mail_wyslany
  → [umówiłem demo]          → demo_umowione
  → [po demo, czekam]        → po_demo
  → [zamknięte]              → zamkniete_tak / zamkniete_nie
  → [odłożone]               → odlozone (z dataPrzypomnienia)
```

Uwaga: kontakt może przejść z `proby_kontaktu` do `w_kontakcie` gdy w końcu odbierze.
Kontakt może trafić do `odlozone` z każdego statusu toru 2.

### Reguła stale alertów

```
jeśli status IN ['demo_umowione', 'po_demo']
AND dataOstatniegoKontaktu < dziś - 7 dni:
  → pokazuj w sekcji Stale Alerty (Widok Dziś)
```

### Reguła przypomnień

```
jeśli dataPrzypomnienia === dziś:
  → pokazuj w sekcji Przypomnienia (Widok Dziś)
```

---

## 5. localStorage — klucze i funkcje

```js
// Klucze
const STORAGE_KEY_KONTAKTY = 'crm_kontakty'

// Funkcje — implementuj jako moduł utils/storage.js
wczytajKontakty()        → Kontakt[]
zapiszKontakty(lista)    → void
dodajKontakt(dane)       → Kontakt
edytujKontakt(id, dane)  → Kontakt
archiwizujKontakt(id)    → Kontakt   // soft delete — zmienia status, nie usuwa
pobierzKontakt(id)       → Kontakt | null
pobierzKontakty(filtry)  → Kontakt[]
```

Nigdy nie usuwaj kontaktów fizycznie z localStorage.
Archiwizacja = zmiana statusu na `archiwum`.

---

## 6. Widoki — 6 ekranów

### 6.1 Widok Dziś (`/dzis`)

Dwie sekcje:
1. **Przypomnienia na dziś** — kontakty z `dataPrzypomnienia === dziś`, posortowane wg statusu
2. **Stale alerty** — kontakty w demo/po_demo bez ruchu >7 dni

Każda pozycja pokazuje: imię, nazwa salonu, status, co zrobić.
Przycisk „Otwórz kontakt" → przejście do Widok Kontakt.

### 6.2 Widok Kanban (`/kanban`)

Kolumny odpowiadają statusom (pomijaj `archiwum` — ma osobny widok).
Karta kontaktu zawiera: imię, salon, miasto, licznik prób (jeśli tor nie_odbiera), data ostatniego kontaktu.
Drag & drop karty między kolumnami = zmiana statusu (z walidacją logiki torów).

### 6.3 Widok Lista (`/lista`)

Tabela z kolumnami: imię, salon, telefon, miasto, status, licznik prób, data ostatniego kontaktu, następny krok.
FilterBar: status (multi-select), miasto (multi-select), źródło (multi-select), szukaj po nazwie/telefonie.
Klik w wiersz → Widok Kontakt.

### 6.4 Widok Kontakt (`/kontakt/:id`)

Sekcje:
- **Nagłówek** — dane podstawowe + status badge + przycisk Edytuj
- **Akcje główne** — przyciski: +1 próba tel / +1 outreach / Zmień status / Wyślij mail (zaznacz)
- **Następny krok** — pole tekstowe + datepicker
- **Sekcja Demo** — widoczna TYLKO gdy status = `demo_umowione` lub `po_demo`
  - typ: online / spotkanie
  - link lub adres
- **Sekcja Zamknięcie** — widoczna TYLKO gdy status = `zamkniete_nie`
  - powód odmowy (select z listy)
- **Log notatek** — chronologicznie od najnowszej, textarea + przycisk Dodaj notatkę
- **Meta** — źródło, pora dnia, wartość kontraktu, data utworzenia

### 6.5 Widok Statystyki (`/statystyki`)

Karty podsumowania (górny rząd):
- Łącznie kontaktów aktywnych
- W pipeline (wszystkie poza archiwum i zamkniętymi)
- Zamknięte ✓
- Zamknięte ✗

Wykresy:
- **Lejek konwersji** — per etap: ile kontaktów jest / było na każdym statusie
- **Źródło → konwersja** — który źródło daje najlepszy % zamknięć
- **Rozkład per miasto** — liczba kontaktów per miasto
- **Średni czas cyklu** — dni od dataUtworzenia do zamkniete_tak (tylko wony)

### 6.6 Widok Archiwum (`/archiwum`)

FilterBar: typ (odlozone / nurturing / wszystkie).
Tabela: imię, salon, miasto, data archiwizacji, data planowanego powrotu, powód (jeśli zamknięte ✗).
Przycisk „Reaktywuj" → przenosi kontakt z powrotem do `do_zadzwonienia`, zeruje liczniki.

---

## 7. Modal Import CSV

Dostępny z każdego widoku (przycisk w sidebarze).

Kroki:
1. **Upload** — drag & drop lub file input, tylko `.csv`
2. **Mapowanie kolumn** — użytkownik wskazuje która kolumna CSV odpowiada któremu polu CRM
   - Domyślne mapowanie dla Outscrapera: `name→nazwaSlonu`, `phone→telefon`, `address→miasto`, `site→www`
3. **Podgląd** — tabela pierwszych 5 wierszy po zmapowaniu
4. **Import** — deduplikacja po `telefon` (pomijaj duplikaty, pokaż ile pominięto)
5. **Podsumowanie** — „Zaimportowano X kontaktów, pominięto Y duplikatów"

Nowe kontakty po imporcie dostają status `do_zadzwonienia`.

---

## 8. Nawigacja — Sidebar

Stały, lewy panel (~220px).

Linki:
- Dziś (z badge liczby przypomnień jeśli > 0)
- Kanban
- Lista
- Statystyki
- Archiwum

Przyciski:
- **+ Dodaj kontakt** (otwiera modal formularza)
- **Importuj CSV** (otwiera modal importu)

---

## 9. Walidacja formularzy

Przy dodawaniu / edycji kontaktu:
- `telefon` — wymagany
- `nazwaSlonu` — wymagany

Przy zmianie statusu na `zamkniete_nie`:
- `powodOdmowy` — wymagany (blokuj zmianę statusu bez powodu)

Przy ustawianiu Demo:
- `typDemo` — wymagany
- `linkLubAdres` — opcjonalny

---

## 10. Kolejność budowania — KRYTYCZNA

Nie przechodź do kolejnego bloku bez przetestowania poprzedniego.

```
BLOK 1 — Fundament (nic nie działa bez tego)
  1. Schema danych + typy
  2. Funkcje localStorage (CRUD)
  3. Shell aplikacji — sidebar + router

BLOK 2 — Minimalny działający produkt
  4. Widok Lista + filtry
  5. Widok Kontakt (szczegóły + zmiana statusu + akcje)
  6. Modal Dodaj kontakt
  7. Log notatek
  8. Logika automatyzacji (archiwizacja, stale alerty, przypomnienia)

BLOK 3 — Główne widoki
  9. Widok Dziś
  10. Widok Kanban + drag & drop

BLOK 4 — Import
  11. Modal Import CSV

BLOK 5 — Analityka
  12. Widok Archiwum
  13. Widok Statystyki
```

---

## 11. Czego nie robić

- Nie usuwaj kontaktów fizycznie — zawsze archiwizuj (zmiana statusu)
- Nie twórz backendu ani zewnętrznych API
- Nie dodawaj szablonów maili — są poza zakresem projektu
- Nie implementuj uwierzytelniania — aplikacja jest dla jednego użytkownika
- Nie używaj zewnętrznych baz danych
- Nie zmieniaj modelu danych bez aktualizacji tego pliku
- Nie pomijaj walidacji powodu odmowy przy `zamkniete_nie`
- Nie resetuj liczników przy reaktywacji kontaktu z archiwum bez jawnego potwierdzenia

---

## 12. Decyzje projektowe — dlaczego tak, nie inaczej

| Decyzja | Powód |
|---------|-------|
| Dwa tory (nie_odbiera / rozmawial) | Cadence 6+2 dotyczy TYLKO nieodbierających. Jak ktoś mówi "nie" — idzie od razu do zamkniete_nie, bez przechodzenia przez licznik prób. |
| Notatki osadzone w kontakcie | Prostsze zapytania, brak join'ów, jeden obiekt w localStorage |
| Deduplikacja po telefonie przy CSV | Telefon jest jedynym unikalnym identyfikatorem w danych z Outscrapera |
| Status `mail_wyslany` jako osobny etap | Bez niego kontakty "proszące o maila" toną w pipeline bez śladu |
| `odlozone` jako status, nie flaga | Odłożone ma datę powrotu i pojawia się w archiwum — to odrębny stan, nie modyfikator |
| Reaktywacja zeruje liczniki | Kontakt wraca z nurturingu po 6 miesiącach jako świeży lead |

---

*Ostatnia aktualizacja planu: przed rozpoczęciem budowania.*
*Jeśli w trakcie budowania pojawia się przypadek brzegowy nieopisany tutaj — zatrzymaj się i zapytaj właściciela przed implementacją.*
