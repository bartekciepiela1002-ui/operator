# DATA_MODEL.md — Operator

Referencja typów i struktur danych. Czytaj gdy piszesz storage.js, rules.js lub komponenty operujące na danych.

---

## Kontakt

```js
{
  id: string,                          // uuid
  nazwaSlonu: string,                  // wymagane
  imie: string,
  telefon: string,                     // wymagane — deduplikacja CSV
  miasto: string,
  www: string,
  zrodlo: 'google_maps' | 'polecenie' | 'inne',

  status: StatusType,
  tor: 'nie_odbiera' | 'rozmawial' | null,

  licznikTel: number,                  // 0–6, tylko tor nie_odbiera
  licznikOutreach: number,             // 0–2, tylko tor nie_odbiera

  dataOstatniegoKontaktu: string | null,   // YYYY-MM-DD
  nastepnyKrok: string,
  dataPrzypomnienia: string | null,        // YYYY-MM-DD

  mailWyslany: boolean,
  dataMail: string | null,

  typDemo: 'online' | 'spotkanie' | null,
  linkLubAdres: string,

  wartoscKontraktu: number | null,         // PLN

  powodOdmowy: PowodOdmowyType | null,
  szczegolObjekcji: string | null,
  poraDnia: 'rano' | 'po17' | null,

  dataArchiwizacji: string | null,
  dataNurturingu: string | null,           // dataArchiwizacji + 6 miesięcy

  notatki: Notatka[],
  dataUtworzenia: string                   // YYYY-MM-DD
}
```

---

## Notatka

```js
{
  id: string,
  tresc: string,
  dataWpisu: string    // ISO datetime
}
```

---

## StatusType

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

---

## PowodOdmowyType

```js
type PowodOdmowyType =
  | 'za_drogo' | 'zly_moment' | 'ma_kogos'
  | 'brak_decyzji' | 'nie_zainteresowana' | 'inne'
```

---

## DayRecord

Klucz: `operator_day_YYYY-MM-DD`. Jeden rekord per dzień.

```js
{
  date: string,                        // YYYY-MM-DD

  // SPRINT — inkrementowany przez akcje CRM
  sprintCel: number,                   // ile telefonów zaplanował (ustawiany w /sprint)
  sprintWykonano: number,              // ile wykonał — tylko telefony (nie_odbiera + rozmawial)
  sprintUkonczony: boolean,            // sprintWykonano >= sprintCel

  // CHALLENGE — warunki ręczne (użytkownik wpisuje przy zamknięciu dnia)
  sen: number | null,                  // godziny, 6–8 wymagane
  aktywnosc: boolean | null,           // min. 30 min
  aktywnoscMin: number,
  prysznic: boolean | null,
  videoUpdate: boolean | null,
  tryb: 'normalny' | 'urlopowy',       // default: 'normalny'

  // TIMER — uzupełniane automatycznie ze stopera przy zamknięciu dnia
  pracaWlasciwaMin: number,            // suma kategorii z KATEGORIE_PRACA_WLASCIWA
  naukaMin: number,                    // suma kategorii 'nauka', max 60

  // DOMKNIĘCIA — lista konkretnych rzeczy domkniętych tego dnia
  domknieteRzeczy: string[],           // min. 1 element wymagany, nie może być pusty string
  strzalNaWynik: string,               // jedna konkretna akcja na wynik

  // REFLEKSJA
  coZadzialalo: string,
  coNieZadzialalo: string,
  powodNiezaliczenia: PowodNiezaliczeniaType | null,
  analizaNiezaliczenia: string,
  planNaJutro: string,

  // STATUS — obliczany przez evaluateDay(), zapisywany po ocenie
  status: 'zaliczony' | 'mocno_zaliczony' | 'urlopowy' | 'niezaliczony' | null,
  errors: string[]
}
```

**Uwaga:** `kontaktZRynkiem`, `pipeline`, `sprzedaz` NIE są polami DayRecord.
Obliczaj je zawsze na żywo z `operator_contacts`.

---

## PowodNiezaliczeniaType

```js
type PowodNiezaliczeniaType =
  | 'za_malo_snu' | 'za_duzo_snu' | 'brak_treningu'
  | 'brak_prysznica' | 'brak_kontaktu_z_rynkiem'
  | 'brak_domknietej_rzeczy' | 'za_malo_pracy'
  | 'brak_video_update' | 'inny'
```

---

## ChallengeState

Klucz: `operator_challenge`

```js
{
  startDate: string | null,    // YYYY-MM-DD — null jeśli challenge nie wystartował
  streakCurrent: number,       // liczony od startDate, max = dni challengeu
  streakBest: number           // najlepszy streak w tym challengeu, nie zeruje się
}
```

**Streak jest liczony w ramach challengeu** — rośnie od dnia 1 do max 30.
Nowy challenge = nowy streak od zera (oba: current i best).

---

## TimerState

Klucz: `operator_timer`

```js
{
  activeCategory: string | null,   // aktualnie mierzona kategoria, null gdy nieaktywny
  activeStart: number | null,      // Date.now() przy starcie, null gdy nieaktywny
  todayTimes: {                    // czasy per kategoria dziś, w minutach (float)
    [category: string]: number
  },
  countdowns: {                    // aktywne odliczania
    [taskKey: string]: {
      limitMin: number,            // limit w minutach
      startedAt: number            // Date.now() przy starcie
    }
  }
}
```

---

## Settings

Klucz: `operator_settings`

```js
{
  anthropicKey: string,
  githubToken: string,
  gistId: string,
  pitchScript: {
    opener: string,
    objekcje: Array<{ objekcja: string, odpowiedz: string }>
  }
}
```

---

## Kategorie timera

```js
// Liczy się do pracaWlasciwaMin
const KATEGORIE_PRACA = [
  'cold_call', 'follow_up', 'rozmowy_sprzedazowe', 'pisanie_ofert',
  'wysylanie_wiadomosci', 'nagrywanie_wideo', 'montaz_wideo',
  'publikacja', 'kurs_pawla', 'realizacja_projektu', 'budowanie_strony',
  'automatyzacje', 'analiza_kampanii', 'praca_nad_oferta',
  'case_study', 'demo_dla_klienta', 'administracja', 'inne',
]

// Liczy się do naukaMin (max 60)
const KATEGORIE_NAUKA = ['nauka']

// Nie liczy się do żadnego limitu
const KATEGORIE_INNE = ['trening']
```

---

## Limity dopieszczania (countdown)

```js
const LIMITY_DOPIESZCZANIA = {
  poprawa_oferty:   45,   // min
  montaz_filmu:     60,
  opis_posta:       30,
  sekcja_strony:    90,
  analiza_kampanii: 30,
}
```

---

## Levele challengeu

Obliczane dynamicznie z `operator_contacts`. Nie przechowuj w storage.

```js
const LEVELE = [
  {
    id: 1,
    nazwa: 'Pierwsze 10 rozmów',
    warunek: (k) => k.filter(x =>
      ['w_kontakcie','prosi_o_maila','mail_wyslany',
       'demo_umowione','po_demo','zamkniete_tak','zamkniete_nie']
      .includes(x.status)).length >= 10
  },
  {
    id: 2,
    nazwa: '3 wysłane oferty',
    warunek: (k) => k.filter(x =>
      ['mail_wyslany','demo_umowione','po_demo','zamkniete_tak','zamkniete_nie']
      .includes(x.status)).length >= 3
  },
  {
    id: 3,
    nazwa: '1 wdrożenie ≥ 5 000 zł',
    warunek: (k) => k.filter(x =>
      x.status === 'zamkniete_tak' && (x.wartoscKontraktu || 0) >= 5000
    ).length >= 1
  },
  {
    id: 4,
    nazwa: '3 wdrożenia ≥ 5 000 zł',      // CEL GŁÓWNY
    warunek: (k) => k.filter(x =>
      x.status === 'zamkniete_tak' && (x.wartoscKontraktu || 0) >= 5000
    ).length >= 3
  },
  {
    id: 5,
    nazwa: 'Pipeline ≥ 50 000 zł',
    warunek: (k) => obliczPipeline(k) >= 50000
  },
  {
    id: 6,
    nazwa: 'Sprzedaż > 30 000 zł',
    warunek: (k) => obliczSprzedaz(k) >= 30000
  },
]
```
