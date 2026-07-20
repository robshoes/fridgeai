# KangKong – Product Vision (MVP v1)

## Mission

KangKong è un assistente intelligente per la cucina che aiuta le persone a ridurre gli sprechi alimentari e a prendere decisioni migliori utilizzando ciò che hanno già nel frigorifero.

L'obiettivo non è semplicemente creare un inventario degli alimenti, ma trasformare il frigorifero in una fonte di decisioni intelligenti.

L'utente deve poter rispondere rapidamente a domande come:

- Cosa posso cucinare oggi?
- Quali alimenti stanno per scadere?
- Cosa mi manca per una ricetta?
- Cosa dovrei comprare?

L'inventario rappresenta il punto di partenza, mentre il vero valore del prodotto è aiutare l'utente a decidere cosa fare.

# Problema

Le persone:

* dimenticano cosa hanno in frigorifero;
* buttano alimenti scaduti;
* comprano prodotti già presenti;
* non sanno cosa cucinare;
* perdono tempo a organizzare la spesa.

---

# Soluzione

L'utente apre l'app, scatta una foto del frigorifero e l'intelligenza artificiale:

* riconosce automaticamente gli alimenti;
* aggiorna l'inventario;
* suggerisce ricette;
* segnala gli alimenti in scadenza;
* genera automaticamente la lista della spesa.

Le foto del frigorifero sono trattate con la massima riservatezza: restano in uno storage privato e vengono eliminate automaticamente dopo un breve periodo.

---

# Target

Persone tra 25 e 45 anni che cucinano regolarmente e vogliono semplificare la gestione della cucina.

---

# Value Proposition

> Apri il frigorifero. Scatta una foto. L'AI pensa al resto.

---

# MVP

## Autenticazione

* Login
* Registrazione
* Recupero password

## Home

* Stato del frigorifero
* Alimenti in scadenza
* Accesso rapido alla fotocamera

## Scanner

* Scatta foto (una foto per sessione di scansione)
* Analisi AI
* Conferma risultati

## Inventario

* Elenco alimenti
* Quantità (unità normalizzate: peso, volume o pezzi)
* Stato
* Data di aggiornamento
* Scadenza stimata automaticamente per categoria, sempre modificabile

## Ricette

* Ricette generate dinamicamente dall'AI in base agli ingredienti disponibili, con cache per contenere i costi
* Filtri per tempo e difficoltà

## Lista della spesa

* Ingredienti mancanti
* Aggiunta manuale
* Checklist

---

# Flusso principale

1. Login
2. Scatta foto
3. AI riconosce gli alimenti
4. Aggiornamento inventario
5. Suggerimento ricette
6. Creazione lista della spesa

---

# Design

* Minimal
* Moderno
* Ispirazione Apple
* Colori neutri
* Verde come colore principale
* Tipografia pulita
* Massimo tre tocchi per raggiungere qualsiasi funzione principale
* Lingua: italiano nella v1, con struttura tecnica predisposta al multilingua

---

# Stack Tecnologico

* React Native
* Expo
* TypeScript
* Supabase (Auth, Database, Storage, Edge Functions)
* OpenAI API
* PostHog (analytics)
* Sentry (error tracking)

---

# Obiettivi dell'MVP

* Inventario automatico del frigorifero
* Riduzione dello spreco alimentare
* Suggerimenti di ricette personalizzati
* Lista della spesa intelligente
* Esperienza semplice e veloce

---

# Monetizzazione

L'MVP non prevede alcuna monetizzazione: nessuna pubblicità, nessun abbonamento. Il costo variabile OpenAI è contenuto dai controlli descritti in PRD §Controllo dei costi AI (limite fisso di scansioni/giorno, caching delle ricette) e sostenuto direttamente, non finanziato da terzi.

Un modello di monetizzazione (abbonamento o pubblicità) potrà essere rivalutato dopo il lancio sulla base dei KPI raccolti (vedi Roadmap).

---

# Non incluso nella Versione 1

* Conteggio calorie
* Diete personalizzate
* Integrazione smartwatch
* Integrazione Alexa o Google Home
* Acquisto diretto dai supermercati
* Scanner barcode
* Scanner scontrini
* Meal planning avanzato
* Gestione multiutente/famiglia
* Notifiche avanzate
* Programma fedeltà
* Social
* Chat tra utenti
* Modalità offline
* Più foto per singola scansione
* Traduzioni multilingua (previste in versioni future)

Nota: l'esclusione di "Modalità offline" riguarda la possibilità di modificare, scansionare o generare ricette senza connessione. La sola visualizzazione in lettura dei dati già sincronizzati (inventario, lista della spesa) resta disponibile da cache locale anche senza connessione: non è considerata una "modalità offline" ma un requisito minimo di resilienza (vedi PRD).

L'MVP non prevede abbonamenti né livelli di utenza a pagamento (vedi §Monetizzazione): il limite giornaliero di scansioni è fisso e si applica a tutti gli utenti allo stesso modo, senza alcun meccanismo per ampliarlo.

---

# KPI

* Utenti registrati
* Utenti attivi giornalieri
* Foto analizzate
* Inventari creati
* Ricette visualizzate
* Liste della spesa generate
* Tasso di ritorno degli utenti
* Riduzione stimata degli sprechi alimentari

Tutti i KPI sono misurati tramite un unico strumento di analytics (PostHog), con eventi mappati direttamente su ciascuna metrica.

---

# Visione a lungo termine

Diventare l'assistente AI di riferimento per la gestione della cucina domestica, centralizzando inventario, ricette, spesa e organizzazione alimentare in un'unica applicazione.
