export type InventoryStatus = 'fresh' | 'expiring_soon' | 'expired' | 'consumed';

// Items expiring within this many days are flagged even before the exact
// expiry day — no value is specified anywhere upstream, so 2 days was
// picked as a simple, cheap default (see docs/02-prd.md §Gestione della
// scadenza for the estimation rules this builds on).
const EXPIRING_SOON_THRESHOLD_DAYS = 2;

export function estimateExpiryDate(
  defaultShelfLifeDays: number | null,
  from: Date = new Date(),
): Date | null {
  if (defaultShelfLifeDays == null) {
    return null;
  }
  const result = new Date(from);
  result.setDate(result.getDate() + defaultShelfLifeDays);
  return result;
}

// Display-only status derived from expiry_date. 'consumed' is a manual
// state set elsewhere (e.g. future recipe-consumption flow) and always
// takes precedence over anything date-derived.
export function computeDisplayStatus(
  expiryDate: string | null,
  storedStatus: InventoryStatus,
): InventoryStatus {
  if (storedStatus === 'consumed') {
    return 'consumed';
  }
  if (!expiryDate) {
    return 'fresh';
  }

  const today = startOfDay(new Date());
  const expiry = startOfDay(new Date(expiryDate));
  const diffDays = Math.round((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return 'expired';
  }
  if (diffDays <= EXPIRING_SOON_THRESHOLD_DAYS) {
    return 'expiring_soon';
  }
  return 'fresh';
}

export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}
