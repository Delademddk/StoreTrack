/**
 * Lightweight in-memory customers + credit-ledger store used by the Sales
 * and Customers modules. Structured so a future backend / audit log can
 * persist every record verbatim (created / updated timestamps, per-txn
 * kind + running balance) without changing the shapes below.
 */

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreditSaleLineDraft {
  productId: string;
  name: string;
  boxQty: number;
  pieceQty: number;
  pricePerBox: number;
  individualPrice: number;
}

export interface CreditSaleDraft {
  customerId: string;
  total: number;
  amountPaid: number;
  method: "Cash" | "Card" | "Mobile Money";
  expectedPaymentDate?: string;
  notes?: string;
  lines: CreditSaleLineDraft[];
}

export interface PaymentDraft {
  amount: number;
  method: "Cash" | "Card" | "Mobile Money";
  reference?: string;
  notes?: string;
}

export type LedgerKind = "purchase" | "payment";

export interface LedgerEntry {
  id: string;
  customerId: string;
  kind: LedgerKind;
  at: string;
  amount: number;
  /** Outstanding balance immediately AFTER this entry was applied. */
  balanceAfter: number;
  method?: "Cash" | "Card" | "Mobile Money";
  reference?: string;
  notes?: string;
  /** Purchase-only. */
  saleId?: string;
  expectedPaymentDate?: string;
  lineSummary?: string;
}

type Listener = () => void;

const uid = (p: string) =>
  `${p}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;

// -------- Seed data (a few illustrative credit customers) --------------

const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

let customers: Customer[] = [
  {
    id: "c_01",
    name: "Bloom Interiors Ltd",
    phone: "+254 711 220 010",
    address: "12 Riverside Dr, Nairobi",
    notes: "Corporate account — Net 15 terms.",
    createdAt: daysAgo(120),
    updatedAt: daysAgo(3),
  },
  {
    id: "c_02",
    name: "Priya Menon",
    phone: "+254 722 118 907",
    address: "Apt 4B, Westlands",
    createdAt: daysAgo(80),
    updatedAt: daysAgo(5),
  },
  {
    id: "c_03",
    name: "Ken Miles",
    phone: "+254 733 400 118",
    createdAt: daysAgo(40),
    updatedAt: daysAgo(10),
  },
];

let ledger: LedgerEntry[] = [];
let customersListSnapshot: Customer[] | undefined;
const ledgerSnapshots = new Map<string, LedgerEntry[]>();
const summarySnapshots = new Map<string, CustomerSummary>();

// Seed a small history so the module has content on first load.
function seedLedger() {
  const push = (e: Omit<LedgerEntry, "id" | "balanceAfter">): LedgerEntry => {
    const prior = ledger
      .filter((l) => l.customerId === e.customerId)
      .sort((a, b) => a.at.localeCompare(b.at));
    const lastBal = prior.length ? prior[prior.length - 1].balanceAfter : 0;
    const delta = e.kind === "purchase" ? e.amount : -e.amount;
    const entry: LedgerEntry = {
      ...e,
      id: uid("l"),
      balanceAfter: Math.max(0, lastBal + delta),
    };
    ledger.push(entry);
    return entry;
  };

  push({
    customerId: "c_01",
    kind: "purchase",
    at: daysAgo(21),
    amount: 664.4,
    method: "Card",
    saleId: "seed_s_01",
    lineSummary: "6× Kettle, 4× Desk Lamp",
    expectedPaymentDate: daysAgo(-9),
  });
  push({
    customerId: "c_01",
    kind: "payment",
    at: daysAgo(10),
    amount: 300,
    method: "Mobile Money",
    reference: "MPESA-QFT2210",
  });

  push({
    customerId: "c_02",
    kind: "purchase",
    at: daysAgo(14),
    amount: 156.6,
    method: "Mobile Money",
    saleId: "seed_s_02",
    lineSummary: "2× Minimalist Desk Lamp",
    expectedPaymentDate: daysAgo(-16),
  });
  push({
    customerId: "c_02",
    kind: "payment",
    at: daysAgo(9),
    amount: 156.6,
    method: "Cash",
  });

  push({
    customerId: "c_03",
    kind: "purchase",
    at: daysAgo(6),
    amount: 78.3,
    method: "Cash",
    saleId: "seed_s_03",
    lineSummary: "4× Artisan Ceramic Mug Set",
    expectedPaymentDate: daysAgo(-1),
  });
}
seedLedger();

// -------- Subscriptions ------------------------------------------------

const listeners = new Set<Listener>();
const snapshotCache = new Map<string, unknown>();

/**
 * Memoizes derived reads so `useSyncExternalStore` receives a referentially
 * stable snapshot between mutations. Without this, every render produces a
 * fresh array/object and React re-renders forever.
 */
function cached<T>(key: string, read: () => T): T {
  if (snapshotCache.has(key)) return snapshotCache.get(key) as T;
  const value = read();
  snapshotCache.set(key, value);
  return value;
}

const notify = () => {
  snapshotCache.clear();
  listeners.forEach((l) => l());
};

function invalidateSnapshots(customerId?: string) {
  customersListSnapshot = undefined;
  if (customerId) {
    ledgerSnapshots.delete(customerId);
    summarySnapshots.delete(customerId);
    return;
  }
  ledgerSnapshots.clear();
  summarySnapshots.clear();
}

export function subscribeCustomers(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}

// -------- Stable snapshots (for useSyncExternalStore) ------------------

export function customersSnapshot(): Customer[] {
  return cached("customers", listCustomers);
}

export function ledgerSnapshot(customerId: string): LedgerEntry[] {
  return cached(`ledger:${customerId}`, () => listLedger(customerId));
}

export function customerSummarySnapshot(customerId: string): CustomerSummary {
  return cached(`summary:${customerId}`, () => customerSummary(customerId));
}

// -------- Reads --------------------------------------------------------

export function listCustomers(): Customer[] {
  if (!customersListSnapshot) {
    customersListSnapshot = [...customers].sort((a, b) => a.name.localeCompare(b.name));
  }
  return customersListSnapshot;
}

export function getCustomer(id: string): Customer | undefined {
  return customers.find((c) => c.id === id);
}

export function listLedger(customerId: string): LedgerEntry[] {
  let snapshot = ledgerSnapshots.get(customerId);
  if (!snapshot) {
    snapshot = ledger
      .filter((e) => e.customerId === customerId)
      .sort((a, b) => a.at.localeCompare(b.at));
    ledgerSnapshots.set(customerId, snapshot);
  }
  return snapshot;
}

export interface CustomerSummary {
  totalPurchases: number;
  totalPaid: number;
  outstanding: number;
  lastPurchaseAt?: string;
  lastActivityAt?: string;
  nextDueAt?: string;
  status: "clear" | "outstanding" | "overdue";
}

export function customerSummary(customerId: string): CustomerSummary {
  const cached = summarySnapshots.get(customerId);
  if (cached) return cached;

  const entries = listLedger(customerId);
  let totalPurchases = 0;
  let totalPaid = 0;
  let lastPurchaseAt: string | undefined;
  let lastActivityAt: string | undefined;
  let nextDueAt: string | undefined;

  for (const e of entries) {
    lastActivityAt = e.at;
    if (e.kind === "purchase") {
      totalPurchases += e.amount;
      lastPurchaseAt = e.at;
      if (e.expectedPaymentDate) {
        if (!nextDueAt || e.expectedPaymentDate < nextDueAt) {
          nextDueAt = e.expectedPaymentDate;
        }
      }
    } else {
      totalPaid += e.amount;
    }
  }

  const outstanding = Math.max(0, totalPurchases - totalPaid);
  let status: CustomerSummary["status"] = "clear";
  if (outstanding > 0) {
    status = nextDueAt && nextDueAt < new Date().toISOString() ? "overdue" : "outstanding";
  }

  const summary: CustomerSummary = {
    totalPurchases,
    totalPaid,
    outstanding,
    lastPurchaseAt,
    lastActivityAt,
    nextDueAt,
    status,
  };
  summarySnapshots.set(customerId, summary);
  return summary;
}

// -------- Mutations ----------------------------------------------------

export function createCustomer(input: {
  name: string;
  phone: string;
  address?: string;
  notes?: string;
}): Customer {
  const nowIso = new Date().toISOString();
  const c: Customer = {
    id: uid("c"),
    name: input.name.trim(),
    phone: input.phone.trim(),
    address: input.address?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  customers = [...customers, c];
  invalidateSnapshots();
  notify();
  return c;
}

function currentBalance(customerId: string) {
  const entries = listLedger(customerId);
  return entries.length ? entries[entries.length - 1].balanceAfter : 0;
}

export function recordCreditSale(draft: CreditSaleDraft): {
  purchase: LedgerEntry;
  payment?: LedgerEntry;
} {
  const at = new Date().toISOString();
  const saleId = uid("s");
  const lineSummary = draft.lines
    .map((l) => {
      const parts: string[] = [];
      if (l.boxQty) parts.push(`${l.boxQty} box${l.boxQty === 1 ? "" : "es"}`);
      if (l.pieceQty) parts.push(`${l.pieceQty}× ${l.name}`);
      return parts.length ? parts.join(" + ") : `1× ${l.name}`;
    })
    .join(", ");

  const purchase: LedgerEntry = {
    id: uid("l"),
    customerId: draft.customerId,
    kind: "purchase",
    at,
    amount: draft.total,
    balanceAfter: currentBalance(draft.customerId) + draft.total,
    method: draft.method,
    saleId,
    expectedPaymentDate: draft.expectedPaymentDate,
    notes: draft.notes,
    lineSummary,
  };
  ledger = [...ledger, purchase];

  let payment: LedgerEntry | undefined;
  if (draft.amountPaid > 0) {
    payment = {
      id: uid("l"),
      customerId: draft.customerId,
      kind: "payment",
      at,
      amount: draft.amountPaid,
      balanceAfter: Math.max(0, purchase.balanceAfter - draft.amountPaid),
      method: draft.method,
      notes: "Paid at time of sale",
    };
    ledger = [...ledger, payment];
  }

  const customer = customers.find((c) => c.id === draft.customerId);
  if (customer) {
    customer.updatedAt = at;
  }
  invalidateSnapshots(draft.customerId);
  notify();
  return { purchase, payment };
}

export function recordPayment(customerId: string, draft: PaymentDraft): LedgerEntry {
  const at = new Date().toISOString();
  const entry: LedgerEntry = {
    id: uid("l"),
    customerId,
    kind: "payment",
    at,
    amount: draft.amount,
    balanceAfter: Math.max(0, currentBalance(customerId) - draft.amount),
    method: draft.method,
    reference: draft.reference,
    notes: draft.notes,
  };
  ledger = [...ledger, entry];
  const customer = customers.find((c) => c.id === customerId);
  if (customer) customer.updatedAt = at;
  invalidateSnapshots(customerId);
  notify();
  return entry;
}

export function exportCustomerData() {
  return {
    customers: [...customers],
    ledger: [...ledger],
  };
}

export function restoreCustomerData(data: { customers: Customer[]; ledger: LedgerEntry[] }) {
  customers = [...data.customers];
  ledger = [...data.ledger];
  invalidateSnapshots();
  notify();
}

// -------- Aggregate helpers (dashboard / reports ready) ----------------

export function aggregateOutstanding(): number {
  return customers.reduce((s, c) => s + customerSummary(c.id).outstanding, 0);
}

export function paymentsOnDate(iso: string): number {
  const day = iso.slice(0, 10);
  return ledger
    .filter((e) => e.kind === "payment" && e.at.slice(0, 10) === day)
    .reduce((s, e) => s + e.amount, 0);
}
