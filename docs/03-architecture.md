# FridgeAI – Architettura Tecnica (MVP v1)

Questo documento descrive l'architettura tecnica scelta per implementare quanto definito in `01-product-vision.md` e `02-prd.md`. Non introduce nuove decisioni di prodotto: traduce quelle già prese in struttura di codice, schema dati e infrastruttura.

---

# Panoramica architetturale

Principio cardine: **il client (app React Native) non comunica mai direttamente con OpenAI.** Ogni chiamata AI passa da una Supabase Edge Function, che agisce da proxy/orchestratore e mantiene le API key esclusivamente lato server.

```
┌─────────────┐        ┌───────────────────────────┐        ┌──────────┐
│  Expo App    │──────▶│  Supabase Edge Function     │──────▶│  OpenAI   │
│ (RN client)  │        │  (analyze-fridge-photo,     │        │  API      │
└─────────────┘        │   generate-recipes)          │        └──────────┘
       │                └───────────────────────────┘
       │                            │
       ▼                            ▼
┌─────────────┐        ┌───────────────────────────┐
│ Supabase     │◀──────▶│ Postgres (RLS attiva)       │
│ Storage      │        │ inventario, scans, ricette  │
│ (bucket      │        └───────────────────────────┘
│  privato)    │
└─────────────┘
```

**Flusso di scansione** (coerente con la Pipeline AI descritta nel PRD):

1. Il client scatta una foto (una sola per sessione) e la carica nel bucket privato `fridge-scans`.
2. Il client crea direttamente (via client Supabase, protetto da RLS) una riga in `scans` con `status: pending` e il path dell'immagine, ottenendo uno `scan_id`.
3. Il client invoca la Edge Function `analyze-fridge-photo` passando lo `scan_id`.
4. La funzione aggiorna lo stato a `processing`, scarica l'immagine, chiama OpenAI richiedendo una risposta JSON strutturata (nome, categoria, quantità stimata, unità, confidenza).
5. Il risultato grezzo viene salvato in `scan_items` (stato di `scans` aggiornato a `completed` o `failed`) e restituito al client per la schermata "Risultati AI".
6. L'utente conferma/modifica/elimina ogni voce; solo gli elementi confermati vengono scritti in `inventory_items`, con unità normalizzata e scadenza stimata per categoria (modificabile).

**Flusso ricette**: la Edge Function `generate-recipes` riceve l'inventario corrente, verifica se esiste una cache valida per quella combinazione di ingredienti (vedi §Cache), altrimenti chiama OpenAI e salva il risultato in cache temporanea. Le ricette non vengono mai persistite in modo permanente, come da PRD.

---

# Componenti principali

- **Routing**: Expo Router (file-based), con gruppi `(auth)` e `(tabs)`.
- **Stato server**: TanStack Query (React Query) per fetch, cache e invalidation verso Supabase.
- **Stato UI locale**: Zustand, limitato a stato non derivabile dal server (es. stato form, stato fotocamera).
- **Autenticazione**: Supabase Auth (email/password + recupero password). Ogni tabella utente-specifica ha **RLS** basata su `auth.uid()`.
- **Permessi fotocamera**: gestiti con `expo-camera` / `expo-image-picker`, secondo gli stati descritti nel PRD (non richiesto, concesso, negato → fallback galleria).
- **Storage immagini**: bucket privato, URL firmati a breve scadenza, mai pubblici. Cancellazione automatica dell'immagine originale dopo 30 giorni (job schedulato, vedi §Automazioni).
- **Osservabilità**: Sentry per crash ed errori client; log strutturati nelle Edge Functions.
- **Analytics**: PostHog, con eventi mappati 1:1 sui KPI della Vision (vedi §Eventi Analytics).
- **Localizzazione**: libreria i18n con stringhe esternalizzate fin dal v1 (solo italiano attivo), nessuna stringa hardcoded nei componenti.
- **Config/segreti**: EAS Secrets + `app.config.ts`; nessuna API key OpenAI presente nel bundle client.
- **Build/distribuzione**: EAS Build + EAS Update per aggiornamenti OTA su fix non nativi.
- **Monetizzazione**: `react-native-google-mobile-ads` (banner in Home/Inventario, video con ricompensa per scansioni bonus — vedi PRD §Monetizzazione pubblicitaria). Richiede codice nativo: **non funziona in Expo Go**, serve una development build EAS anche in fase di sviluppo.

---

# Struttura delle cartelle

```
fridgeai/
├── app/                          # Expo Router — solo routing, schermate sottili
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── (onboarding)/
│   │   └── index.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx           # bottom tab bar
│   │   ├── home.tsx
│   │   ├── inventory.tsx
│   │   ├── scanner.tsx
│   │   ├── recipes.tsx
│   │   └── profile.tsx
│   └── _layout.tsx                # root layout, auth guard
│
├── src/
│   ├── features/                  # logica raggruppata per dominio
│   │   ├── auth/
│   │   ├── inventory/
│   │   ├── scanner/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── api.ts
│   │   ├── recipes/
│   │   ├── shopping-list/
│   │   └── ads/                   # banner + rewarded ad (scansioni bonus)
│   ├── components/                # componenti UI condivisi (design system)
│   ├── hooks/                     # hook condivisi non legati a un dominio
│   ├── services/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   └── types.ts           # tipi generati (supabase gen types)
│   │   └── ai/                    # wrapper tipizzati verso le Edge Functions
│   ├── stores/                    # Zustand stores
│   ├── i18n/                      # stringhe esternalizzate (locale it, predisposto ad altre lingue)
│   ├── theme/                     # colori, tipografia, spacing
│   ├── types/
│   └── utils/                     # incluse le funzioni di normalizzazione unità
│
├── supabase/
│   ├── functions/
│   │   ├── analyze-fridge-photo/
│   │   └── generate-recipes/
│   ├── migrations/
│   └── seed.sql                   # dati iniziali di categories
│
├── assets/
└── docs/
```

`app/` resta esclusivamente routing: compone schermate a partire da `src/features/*`, così la logica applicativa resta testabile e indipendente dal router.

---

# Schema database (Postgres / Supabase)

Tutte le tabelle utente-specifiche hanno **Row Level Security attiva**, con policy `user_id = auth.uid()`.

### `profiles`
| Campo | Tipo | Note |
|---|---|---|
| id | uuid, PK | = `auth.users.id` |
| full_name | text | |
| email | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `categories` *(tabella di lookup, condivisa, no RLS)*
| Campo | Tipo | Note |
|---|---|---|
| id | uuid, PK | |
| name | text | es. "Latticini", "Verdura" |
| icon | text | riferimento icona per ricette/inventario |
| default_shelf_life_days | int | usato per la scadenza stimata |
| unit_family | enum | `weight` \| `volume` \| `count` — usato per la normalizzazione unità |

### `scans`
| Campo | Tipo | Note |
|---|---|---|
| id | uuid, PK | |
| user_id | uuid, FK → profiles | |
| image_path | text | path nel bucket privato |
| status | enum | `pending` \| `processing` \| `completed` \| `failed` |
| raw_ai_response | jsonb | risposta grezza per debug/audit |
| created_at | timestamptz | |

### `scan_items` *(risultati grezzi AI, pre-conferma)*
| Campo | Tipo | Note |
|---|---|---|
| id | uuid, PK | |
| scan_id | uuid, FK → scans | |
| detected_name | text | |
| category_id | uuid, FK → categories, nullable | |
| quantity_estimate | numeric | valore in unità base (g/ml/pezzi) |
| unit_family | enum | `weight` \| `volume` \| `count` |
| confidence | numeric | 0–1 |
| status | enum | `pending` \| `confirmed` \| `edited` \| `rejected` |

### `inventory_items`
| Campo | Tipo | Note |
|---|---|---|
| id | uuid, PK | |
| user_id | uuid, FK → profiles | |
| category_id | uuid, FK → categories, nullable | |
| name | text | |
| quantity | numeric | sempre in unità base della famiglia |
| unit_family | enum | `weight` \| `volume` \| `count` |
| status | enum | `fresh` \| `expiring_soon` \| `expired` \| `consumed` |
| expiry_date | date, nullable | |
| expiry_source | enum | `manual` \| `category_estimate` \| `none` |
| source_scan_id | uuid, FK → scans, nullable | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `shopping_list_items`
| Campo | Tipo | Note |
|---|---|---|
| id | uuid, PK | |
| user_id | uuid, FK → profiles | |
| name | text | |
| quantity | numeric | nullable |
| unit_family | enum | nullable |
| is_checked | boolean | |
| source | enum | `auto_from_recipe` \| `manual` |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `user_recipe_favorites` *(uniche righe ricetta persistite lato utente)*
| Campo | Tipo | Note |
|---|---|---|
| user_id | uuid, FK → profiles | PK composita |
| recipe_snapshot | jsonb | ricetta generata, salvata solo se l'utente la mette tra i preferiti |
| created_at | timestamptz | |

> Le ricette generate dall'AI **non** hanno una tabella `recipes` permanente: per definizione da PRD non sono persistite, salvo il caso "preferiti", dove viene salvato uno snapshot jsonb della singola ricetta scelta dall'utente (evita di dover mantenere `recipe_ingredients` come tabella relazionale per contenuti non canonici).

### `recipe_cache` *(cache tecnica, non user-facing)*
| Campo | Tipo | Note |
|---|---|---|
| id | uuid, PK | |
| ingredients_hash | text, unique | hash della combinazione di ingredienti normalizzati |
| response | jsonb | risposta OpenAI cachata |
| created_at | timestamptz | |
| expires_at | timestamptz | TTL 24–48h, coerente con §Controllo costi AI del PRD |

**Relazioni**

```
auth.users 1─1 profiles
profiles 1─N scans 1─N scan_items ──(confirmed→) inventory_items
profiles 1─N inventory_items
profiles 1─N shopping_list_items
profiles 1─N user_recipe_favorites
categories 1─N inventory_items / scan_items
```

Separare `scan_items` (dati grezzi, non affidabili) da `inventory_items` (dati confermati) resta il punto chiave: evita che errori di riconoscimento sporchino l'inventario e permette di misurare l'accuratezza del modello nel tempo.

---

# Edge Functions

### `analyze-fridge-photo`
- **Input**: `scan_id` (riga già creata dal client con `status: pending`, vedi §Panoramica architetturale).
- **Comportamento**: aggiorna lo stato a `processing`, scarica l'immagine dal bucket privato, invoca OpenAI con function calling/structured output per ottenere un array di alimenti (nome, categoria, quantità, unità, confidenza). Applica la soglia di confidenza di 0.7 definita nel PRD (§Controllo dei costi AI) per marcare gli item con confidenza inferiore come "da verificare". Scrive i risultati in `scan_items` e aggiorna `scans.status` a `completed` o `failed`.
- **Output**: elenco `scan_items` con relativo stato, pronto per la schermata di conferma.

### `generate-recipes`
- **Input**: elenco ingredienti correnti dell'utente (letti da `inventory_items`).
- **Comportamento**: calcola l'hash della combinazione ingredienti (nome + categoria; quantità esclusa dall'hash per evitare invalidazioni su variazioni minime — vedi PRD §Generazione delle ricette), verifica `recipe_cache`. Se presente e non scaduta, restituisce il risultato cachato. Altrimenti chiama OpenAI, salva la risposta in `recipe_cache` con TTL, e la restituisce.
- **Output**: elenco ricette (titolo, tempo, difficoltà, ingredienti mancanti, categoria per icona) — nessuna immagine generata, come da PRD.

Entrambe le funzioni sono l'unico punto in cui la app tocca OpenAI; le API key OpenAI vivono esclusivamente nei secrets delle Edge Functions.

---

# Automazioni

- **Retention immagini**: job schedulato (Supabase Cron / `pg_cron`) che elimina i file in `fridge-scans` più vecchi di 30 giorni, coerente con la sezione Privacy del PRD.
- **Pulizia cache ricette**: eliminazione delle righe `recipe_cache` con `expires_at` scaduto.
- **Rate limiting**: controllo lato Edge Function del limite di 10 scansioni giornaliere per utente (vedi PRD §Controllo dei costi AI), prima di invocare OpenAI. Le generazioni di ricette non hanno un limite dedicato: sono già contenute dal caching per combinazione esatta di ingredienti.

---

# Eventi Analytics (PostHog)

Mappatura diretta sui KPI della Vision, un evento per metrica:

| Evento | KPI corrispondente |
|---|---|
| `user_registered` | Utenti registrati |
| `app_opened` | Utenti attivi giornalieri |
| `scan_completed` | Foto analizzate |
| `inventory_item_confirmed` | Inventari creati |
| `recipe_viewed` | Ricette visualizzate |
| `shopping_list_generated` | Liste della spesa generate |
| `user_returned` (sessione a 7 giorni di distanza dalla precedente) | Tasso di ritorno degli utenti |

---

# Sicurezza

- RLS attiva su tutte le tabelle utente-specifiche; nessun accesso diretto del client a `scan_items`/`inventory_items` di altri utenti, garantito a livello di database e non solo applicativo.
- Bucket Storage privato, accesso solo via URL firmati a breve scadenza.
- API key OpenAI esclusivamente come secret delle Edge Functions, mai nel bundle client né nei log.
- Validazione input lato Edge Function (dimensione immagine, formato) prima di invocare OpenAI, per evitare abusi e costi non previsti.

---

# Requisiti non funzionali (riferimento tecnico)

Coerenti con quanto già fissato nel PRD:

- Analisi di una foto in meno di 10 secondi (include upload + Edge Function + OpenAI).
- Apertura delle schermate principali in meno di 1 secondo (favorita da cache React Query).
- Crash-free rate superiore al 99% (monitorato via Sentry).
- Nessuna chiamata OpenAI diretta dal client, in nessuna circostanza.
