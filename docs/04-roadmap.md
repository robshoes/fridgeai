# FridgeAI – Roadmap Tecnica (MVP v1)

Questo documento traduce `01-product-vision.md`, `02-prd.md` e `03-architecture.md` in fasi di sviluppo sequenziali. Ogni fase produce un incremento verificabile; le fasi successive dipendono dal completamento di quelle precedenti.

Principio guida: **costruire prima ciò che è testabile senza AI**, per validare schema dati e UI a basso costo, e introdurre le chiamate OpenAI solo quando la base è stabile.

---

# Fase 0 — Fondamenta di progetto

**Obiettivo**: avere un progetto pronto per lo sviluppo, senza ancora funzionalità di prodotto.

- Setup Expo Router, TypeScript strict, ESLint/Prettier.
- Creazione progetto Supabase (ambiente dev + prod separati).
- Setup EAS (build, secrets, update).
- Integrazione Sentry.
- Configurazione `app.config.ts` per iniezione variabili/segreti in build-time (nessun secret committato).
- Setup i18n (libreria + struttura file stringhe), anche con solo locale `it` attivo.

**Output**: repository pronto, ambienti configurati, nessuna feature utente ancora presente.

---

# Fase 1 — Autenticazione e shell di navigazione

**Obiettivo**: un utente può registrarsi, accedere e navigare tra schermate vuote.

- Supabase Auth: login, registrazione, recupero password.
- Tabella `profiles` + RLS.
- Onboarding (schermata statica).
- Root layout con auth guard + bottom tab bar (Home, Inventario, Scanner, Ricette, Profilo).
- Schermata Profilo: modifica nome/email, logout.

**Output**: flusso auth end-to-end funzionante, navigazione completa tra schermate segnaposto.

---

# Fase 2 — Inventario manuale (senza AI)

**Obiettivo**: validare schema dati e UI dell'inventario indipendentemente dall'AI.

- Migrazioni: `categories` (con seed dati), `inventory_items`, `shopping_list_items`.
- Normalizzazione unità di misura (peso/volume/pezzi) implementata e testata.
- Logica di scadenza stimata per categoria (`default_shelf_life_days`), sempre modificabile.
- CRUD manuale completo su Inventario: aggiunta, modifica, eliminazione, ricerca.
- CRUD manuale su Lista della spesa (aggiunta, checklist, eliminazione).

**Output**: app funzionante con gestione 100% manuale di inventario e lista spesa — utilizzabile anche se la parte AI non esistesse ancora.

---

# Fase 3 — Scanner e pipeline AI

**Obiettivo**: introdurre il riconoscimento automatico degli alimenti.

- Gestione permessi fotocamera (stati: da richiedere / concesso / negato → fallback galleria), come da PRD.
- Upload foto (una sola per sessione) su bucket privato Supabase Storage.
- Tabelle `scans` e `scan_items`.
- Edge Function `analyze-fridge-photo` (chiamata OpenAI con structured output, soglia di confidenza, scrittura `scan_items`).
- Schermata "Risultati AI": elenco riconosciuto, confidenza, modifica/eliminazione, gestione caso "nessun alimento riconosciuto".
- Conferma → scrittura in `inventory_items` con unità normalizzata e scadenza stimata.
- Rate limiting scansioni giornaliere lato Edge Function.

**Output**: flusso completo "scatta foto → AI → conferma → inventario" funzionante e testato.

---

# Fase 4 — Ricette

**Obiettivo**: suggerire ricette in base all'inventario reale dell'utente.

- Edge Function `generate-recipes` con logica di cache (`recipe_cache`, hash ingredienti, TTL 24–48h).
- Schermata Ricette: elenco, filtri per tempo/difficoltà, icona per categoria (nessuna immagine generata).
- Dettaglio ricetta + ingredienti mancanti collegati alla Lista della spesa.
- Preferiti (`user_recipe_favorites`, snapshot jsonb).

**Output**: ricette generate dinamicamente, con costo controllato dalla cache.

---

# Fase 5 — Lista della spesa intelligente

**Obiettivo**: chiudere il ciclo tra ricette e lista della spesa.

- Generazione automatica di voci nella lista della spesa a partire dagli ingredienti mancanti di una ricetta selezionata.
- Merge con eventuali voci manuali già presenti (evitare duplicati su stesso alimento/unità).

**Output**: flusso completo Vision→PRD implementato: foto → inventario → ricette → lista della spesa.

---

# Fase 6 — Home, offline e stati di errore

**Obiettivo**: rendere l'app solida nei casi non ideali, non solo nel percorso felice.

- Schermata Home: stato frigorifero, alimenti in scadenza, ultima scansione, accesso rapido a fotocamera.
- Gestione assenza di connessione: dati in sola lettura da cache locale, messaggi di errore chiari, nessuna azione AI/scrittura consentita offline (come da PRD).
- Empty state coerenti su tutte le schermate (inventario vuoto, nessuna ricetta disponibile, lista spesa vuota).
- Job schedulato di retention immagini (cancellazione automatica dopo 30 giorni) e pulizia `recipe_cache` scaduta.

**Output**: app resiliente a connessione assente, errori AI e dati vuoti.

---

# Fase 7 — Design system e rifinitura UI

**Obiettivo**: allineare l'app ai principi di design della Vision.

- Applicazione coerente di tema (verde, colori neutri, tipografia pulita) su tutte le schermate.
- Skeleton loading e micro-animazioni sui punti di attesa (analisi foto, generazione ricette).
- Verifica "massimo 3 tap" per ogni funzione principale.
- Revisione i18n: nessuna stringa hardcoded rimasta fuori dal livello di localizzazione.

**Output**: esperienza coerente con "Minimal, Moderno, Ispirazione Apple" definito nella Vision.

---

# Fase 8 — Analytics, QA e beta

**Obiettivo**: preparare il rilascio con visibilità su utilizzo e costi.

- Integrazione PostHog con gli eventi definiti in `03-architecture.md` (`user_registered`, `scan_completed`, `inventory_item_confirmed`, `recipe_viewed`, `shopping_list_generated`, `user_returned`).
- Dashboard/alert di monitoraggio spesa OpenAI (per validare il controllo costi definito nel PRD).
- Test su dispositivi reali (iOS/Android).
- Distribuzione beta chiusa via TestFlight / Play Internal Testing.
- Raccolta feedback e fix pre-rilascio.

**Output**: build beta pronta, KPI misurabili dal giorno 1, costi AI sotto controllo.

---

# Fase 9 — Rilascio v1

Pubblicazione su App Store / Play Store. Qualsiasi funzionalità non inclusa in questa roadmap (elencata in "Non incluso nella Versione 1" nella Vision) viene rivalutata solo dopo il rilascio, sulla base dei KPI raccolti.

---

# Note di sequenziamento

- La Fase 2 (inventario manuale) precede deliberatamente la Fase 3 (AI): disaccoppia lo sviluppo di schema dati e UI dal costo e dall'incertezza delle chiamate OpenAI, e produce un'app già utilizzabile a metà roadmap.
- Le Fasi 3 e 4 sono le uniche a introdurre costi variabili (OpenAI): vanno sempre accompagnate dai relativi controlli (rate limit, cache) definiti nello stesso rilascio, non aggiunti in un secondo momento.
- La Fase 6 (offline/errori) non va posticipata dopo la beta: senza di essa la Fase 3 non è considerabile completa secondo i requisiti non funzionali del PRD.
