// Externalized strings for the active MVP locale (see PRD §Localizzazione).
// Add a sibling file (e.g. en.ts) and register it in `../index.ts` when a
// new language ships — no structural change needed elsewhere in the app.
export default {
  common: {
    appName: 'FridgeAI',
    loading: 'Caricamento…',
    genericError: 'Qualcosa è andato storto. Riprova.',
    comingSoon: 'Questa sezione sarà disponibile in una prossima fase.',
    cancel: 'Annulla',
  },
  onboarding: {
    description: "Apri il frigorifero. Scatta una foto. L'AI pensa al resto.",
    start: 'Inizia',
  },
  auth: {
    login: {
      title: 'Accedi',
      email: 'Email',
      password: 'Password',
      submit: 'Accedi',
      noAccount: 'Non hai un account? Registrati',
      forgotPassword: 'Password dimenticata?',
    },
    register: {
      title: 'Crea account',
      fullName: 'Nome',
      email: 'Email',
      password: 'Password',
      submit: 'Registrati',
      haveAccount: 'Hai già un account? Accedi',
    },
    forgotPassword: {
      title: 'Password dimenticata',
      email: 'Email',
      submit: 'Invia link di recupero',
      sentMessage: "Se l'indirizzo esiste, riceverai un'email con le istruzioni.",
      backToLogin: 'Torna al login',
    },
  },
  tabs: {
    home: 'Home',
    inventory: 'Inventario',
    scanner: 'Scanner',
    recipes: 'Ricette',
    profile: 'Profilo',
  },
  profile: {
    title: 'Profilo',
    fullName: 'Nome',
    email: 'Email',
    save: 'Salva',
    saved: 'Modifiche salvate',
    emailChangeSent: 'Controlla la tua email per confermare il nuovo indirizzo.',
    logout: 'Esci',
  },
  inventory: {
    searchPlaceholder: 'Cerca alimento…',
    empty: 'Nessun alimento in inventario.',
    addTitle: 'Aggiungi alimento',
    editTitle: 'Modifica alimento',
    name: 'Nome',
    category: 'Categoria',
    quantity: 'Quantità',
    expiryDate: 'Scadenza (AAAA-MM-GG)',
    save: 'Salva',
    delete: 'Elimina',
    deleteConfirmTitle: 'Eliminare alimento?',
    deleteConfirmMessage: 'Questa azione non può essere annullata.',
    validationError: 'Compila nome, categoria e una quantità valida.',
    status: {
      fresh: 'Fresco',
      expiring_soon: 'In scadenza',
      expired: 'Scaduto',
      consumed: 'Consumato',
    },
  },
  shoppingList: {
    title: 'Lista della spesa',
    addPlaceholder: 'Aggiungi un articolo…',
    empty: 'La lista della spesa è vuota.',
    delete: 'Elimina',
  },
};
