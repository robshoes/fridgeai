# KangKong – Product Requirements Document (PRD)

Version: 1.0

---

# Obiettivo

Realizzare un'app mobile che permetta agli utenti di gestire automaticamente il contenuto del proprio frigorifero tramite intelligenza artificiale.

L'obiettivo dell'MVP è offrire un'esperienza estremamente semplice: una foto, pochi secondi di attesa e un inventario aggiornato con ricette e suggerimenti.

---

# User Flow

1. Registrazione
2. Login
3. Onboarding
4. Home
5. Scatta foto
6. Analisi AI
7. Aggiornamento inventario
8. Visualizzazione ricette
9. Gestione lista della spesa

---

# Schermata: Onboarding

Scopo:
Presentare rapidamente l'app.

Contenuti:
- Logo
- Titolo
- Breve descrizione
- Pulsante "Inizia"

---

# Schermata: Login

Componenti:
- Email
- Password
- Pulsante Login
- Registrazione
- Password dimenticata

---

# Schermata: Home

Componenti:
- Saluto utente
- Pulsante "Scatta foto"
- Ultima scansione
- Alimenti in scadenza
- Ricette consigliate
- Barra di navigazione

Azioni:
- Aprire la fotocamera
- Aprire inventario
- Aprire ricette
- Aprire lista della spesa

---

# Schermata: Scanner

Componenti:
- Anteprima fotocamera
- Pulsante di scatto
- Indicatore di caricamento

Flusso:
1. Scatta foto
2. Upload
3. Analisi AI
4. Conferma

---

# Schermata: Risultati AI

Mostrare:
- Elenco alimenti riconosciuti
- Quantità stimate
- Livello di confidenza
- Possibilità di modificare manualmente

Azioni:
- Conferma
- Elimina elemento
- Modifica elemento

---

# Schermata: Inventario

Ogni alimento contiene:
- Nome
- Categoria
- Quantità
- Stato (fresco / in scadenza / scaduto / consumato)
- Data aggiunta
- Scadenza (se disponibile)

Azioni:
- Modifica
- Elimina
- Cerca

---

# Schermata: Ricette

Visualizzare:
- Immagine
- Titolo
- Tempo di preparazione
- Difficoltà
- Ingredienti mancanti

Azioni:
- Apri ricetta
- Salva tra i preferiti
- Filtra per tempo di preparazione e difficoltà

---

# Schermata: Lista della Spesa

Visualizzare:
- Ingredienti mancanti
- Checkbox
- Aggiunta manuale

Azioni:
- Aggiungi
- Elimina
- Spunta acquistato

---

# Profilo

Permettere di:
- Modificare nome
- Modificare email
- Logout

---

# Navigazione

Barra inferiore con:

- Home
- Inventario
- Scanner
- Ricette
- Profilo

---

# Requisiti Funzionali

L'app deve permettere di:

- autenticare utenti
- richiedere e gestire il permesso di accesso alla fotocamera
- caricare immagini
- riconoscere alimenti tramite AI
- salvare inventario con unità di misura normalizzate
- suggerire ricette
- generare lista della spesa
- segnalare all'utente l'assenza di connessione

---

# Requisiti Non Funzionali

L'app deve essere:

- veloce
- intuitiva
- responsive
- sicura
- moderna

---

# Stack

Frontend:
- React Native
- Expo
- TypeScript

Backend:
- Supabase (Auth, Database, Edge Functions)

AI:
- OpenAI (invocato esclusivamente da Supabase Edge Functions, mai dal client)

Storage:
- Supabase Storage (bucket privato)

Database:
- PostgreSQL

Analytics:
- PostHog

Monetizzazione:
- Google AdMob (banner + video con ricompensa)

---

# MVP

La prima versione deve permettere all'utente di:

- creare un account
- fotografare il frigorifero
- ottenere un inventario
- vedere ricette
- creare una lista della spesa

Qualsiasi altra funzionalità verrà sviluppata dopo il rilascio della versione MVP.

# Decisioni Tecniche MVP

Questa sezione definisce il comportamento dell'app nei casi che non erano stati specificati nella Product Vision.

---

## Gestione della scadenza

L'MVP non tenterà di leggere automaticamente le date di scadenza stampate sulle confezioni.

La data di scadenza verrà determinata nel seguente ordine:

1. Data inserita manualmente dall'utente.
2. Data stimata automaticamente in base alla categoria dell'alimento.
3. Nessuna data disponibile.

Ogni data stimata verrà chiaramente indicata come "Stimata" e potrà essere modificata in qualsiasi momento.

Esempi:

- Latte → 7 giorni
- Yogurt → 10 giorni
- Verdure fresche → 5 giorni
- Mele → 20 giorni

---

## Normalizzazione delle unità di misura

Per garantire coerenza tra inventario, ricette e lista della spesa, ogni quantità viene ricondotta a una di tre famiglie di unità:

- Peso → grammi (g), con visualizzazione in kg oltre una certa soglia.
- Volume → millilitri (ml), con visualizzazione in litri (L) oltre una certa soglia.
- Pezzi → conteggio intero, per alimenti non misurabili a peso o volume.

Internamente il valore viene sempre salvato nell'unità base della sua famiglia (g, ml o pezzi); la conversione nell'unità più leggibile avviene solo in visualizzazione. Questo evita ambiguità nel confronto tra inventario e ingredienti richiesti dalle ricette.

---

## Generazione delle ricette

Le ricette saranno generate dinamicamente da OpenAI utilizzando esclusivamente gli ingredienti presenti nell'inventario dell'utente.

Le ricette non saranno salvate permanentemente nel database.

Per ridurre i costi verrà utilizzata una cache temporanea quando possibile, associata alla combinazione esatta di ingredienti disponibili (nome + categoria; la quantità è esclusa dal confronto): finché quella combinazione resta invariata, la stessa risposta viene riutilizzata invece di generarne una nuova. Qualsiasi variazione della combinazione (anche l'aggiunta o rimozione di un solo ingrediente) genera una nuova chiamata: non è prevista alcuna soglia di tolleranza, per mantenere il meccanismo semplice ed economico da implementare.

Le ricette non useranno immagini generate dall'AI: verrà mostrata un'icona rappresentativa per categoria, per mantenere bassi i costi ed evitare contenuti non necessari all'MVP.

---

## Deduplica lista della spesa

Quando un ingrediente mancante da una ricetta viene aggiunto alla lista della spesa, viene confrontato con le voci già presenti tramite corrispondenza case-insensitive sul nome, ignorando spazi iniziali/finali (es. "Pomodori" = "pomodori" = " Pomodori "). Non è prevista alcuna normalizzazione semantica (sinonimi, plurali, lingua): è la soluzione più economica per l'MVP, con il limite noto che varianti testuali diverse (es. "pomodoro" vs "pomodori") non vengono unificate.

Se viene trovata una corrispondenza, la quantità viene sommata invece di creare una voce duplicata; altrimenti viene creata una nuova voce con `source: auto_from_recipe`.

---

## Pipeline AI

L'applicazione non comunicherà mai direttamente con OpenAI.

Il flusso sarà:

Utente
↓

Upload foto

↓

Supabase Storage

↓

Supabase Edge Function

↓

OpenAI

↓

Risposta JSON strutturata

↓

Conferma utente

↓

Inventario

Tutte le API Key rimarranno sul server.

---

## Gestione errori AI

Se il modello riconosce un alimento con confidenza inferiore a 0.7 (vedi §Controllo dei costi AI):

- il prodotto verrà evidenziato;
- l'utente potrà modificarlo;
- l'utente potrà eliminarlo;
- l'utente potrà confermarlo.

Se nessun alimento viene riconosciuto verrà mostrato un messaggio che inviterà l'utente a riprovare oppure ad aggiungere gli alimenti manualmente.

---

## Foto per scansione

Ogni sessione di scansione prevede **una sola foto**. Questo mantiene semplice il flusso principale ("scatta una foto") ed evita la complessità di unire risultati provenienti da più immagini.

Per coprire più ripiani o zone del frigorifero, l'utente può eseguire scansioni aggiuntive in sequenza: ogni scansione è indipendente e i risultati confermati si sommano all'inventario esistente.

---

## Permessi della fotocamera

Il permesso di accesso alla fotocamera viene richiesto al primo utilizzo effettivo dello Scanner (non durante l'onboarding), per massimizzare il tasso di concessione.

Stati gestiti:

- Non ancora richiesto → viene mostrato il prompt di sistema.
- Concesso → si procede normalmente con lo Scanner.
- Negato → viene mostrata una schermata con spiegazione del motivo e un pulsante per aprire le impostazioni di sistema; in alternativa l'utente può selezionare una foto dalla galleria.

---

## Privacy

Le immagini verranno salvate esclusivamente in uno Storage privato.

Le immagini originali saranno eliminate automaticamente dopo 30 giorni.

Saranno conservati solamente:

- inventario
- risultati AI
- metadati tecnici

Le immagini non saranno mai pubbliche.

---

## Controllo dei costi AI

L'MVP non prevede un abbonamento né piani a pagamento differenziati: i limiti sotto si applicano a tutti gli utenti allo stesso modo. Il costo variabile OpenAI generato dagli utenti gratuiti è finanziato dalla pubblicità (vedi §Monetizzazione pubblicitaria), non da un piano a pagamento.

Per limitare i costi operativi:

- limite di base di 10 scansioni al giorno per utente; superato il limite, lo Scanner mostra un messaggio con il numero di scansioni residue, l'orario di reset (mezzanotte, fuso orario del dispositivo) e l'opzione per sbloccarne altre guardando un video pubblicitario (vedi §Monetizzazione pubblicitaria);
- soglia di confidenza AI fissata a 0.7 per marcare un elemento come "da verificare" (vedi §Gestione errori AI);
- caching delle ricette, basato su corrispondenza esatta della combinazione di ingredienti (vedi §Generazione delle ricette);
- nessuna nuova richiesta AI se la combinazione di ingredienti non è cambiata;
- tutte le chiamate AI passeranno attraverso Supabase Edge Functions.

---

## Monetizzazione pubblicitaria

L'MVP è gratuito e finanziato da Google AdMob, non da abbonamenti:

- **Banner**: mostrato in modo permanente nelle schermate Home e Inventario.
- **Video con ricompensa**: guardando un video pubblicitario per intero, l'utente ottiene **+5 scansioni bonus** oltre al limite giornaliero di base. Massimo **2 video al giorno per utente** (quindi al massimo +10 scansioni bonus, per un totale di 20 scansioni/giorno). Il contatore si azzera a mezzanotte insieme al limite di base.
- Se il video non viene completato (chiuso in anticipo), nessuna scansione bonus viene concessa.
- Nessuna pubblicità viene mostrata durante il flusso di scansione stesso (scatto foto → analisi → conferma), per non interrompere il percorso principale del prodotto.

---

## Modalità offline e gestione della connessione

Le funzionalità core dell'app (scansione, generazione ricette, sincronizzazione dati) richiedono una connessione attiva: non è prevista una modalità offline nell'MVP.

In assenza di connessione:

- i dati già caricati (inventario, lista della spesa) restano visibili in sola lettura dalla cache locale;
- non è possibile effettuare modifiche, scansioni o generare ricette;
- viene mostrato un messaggio di errore chiaro, senza stati di caricamento infiniti o crash.

Non è prevista alcuna logica di sincronizzazione o risoluzione dei conflitti per modifiche effettuate offline.

---

## Analytics e misurazione dei KPI

Viene utilizzato un unico strumento di analytics (PostHog) per tracciare gli eventi necessari a misurare i KPI definiti nella Product Vision (registrazioni, scansioni completate, inventari creati, ricette visualizzate, liste della spesa generate, tasso di ritorno).

Ogni KPI corrisponde a un evento tracciato in modo diretto, per evitare logiche di calcolo complesse lato client.

---

## Localizzazione

L'MVP viene rilasciato solo in lingua italiana.

Tutti i testi dell'interfaccia sono comunque gestiti tramite un livello di i18n (stringhe esternalizzate, mai hardcoded nel codice), in modo che l'aggiunta di nuove lingue in futuro non richieda modifiche strutturali all'app.

---

## Requisiti non funzionali

Obiettivi della versione MVP:

- Analisi di una foto in meno di 10 secondi.
- Apertura delle schermate principali in meno di 1 secondo.
- Crash-free rate superiore al 99%.
- Massimo 3 tap per raggiungere qualsiasi funzione principale.

---

## Filosofia del prodotto

L'intelligenza artificiale rappresenta il cuore del prodotto.

L'utente non deve gestire manualmente il frigorifero.

L'obiettivo è ridurre al minimo le operazioni richieste all'utente.

Ogni funzionalità dovrà rispettare questo principio:

**Scatta una foto → l'AI comprende il contenuto → l'utente prende una decisione.**