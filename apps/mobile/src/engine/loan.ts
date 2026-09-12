/**
 * Leihstatus für Mehrwegbehälter.
 *
 * Konditionen im Prototyp: 14 Tage Rückgabefrist. Wer den Behälter behält, zahlt
 * 10 € Behältergebühr. Wer nach Fristende doch noch zurückgibt, zahlt 5 € statt der
 * vollen Gebühr - die Rückgabe bleibt also immer die bessere Wahl.
 *
 * Gebühren sind Partnerkonditionen, keine Verhaltenswährung: sie ändern nie Punkte
 * oder Impact. Verbindlich bleibt das Vytal-Konto, hier stehen Demo-Konditionen.
 */
export const LOAN_DAYS = 14;
/** Behälter nicht zurückgebracht. */
export const FEE_KEPT = 10;
/** Nach Fristende doch zurückgebracht. */
export const FEE_LATE = 5;
export const LOAN_TERMS = `${LOAN_DAYS} Tage Rückgabefrist. Danach ${FEE_KEPT} € Behältergebühr, bei späterer Rückgabe ${FEE_LATE} €.`;
export const LOAN_SOURCE = 'Demo-Konditionen · verbindlich ist dein Vytal-Konto';

const DAY = 86400000;

export type LoanState = 'offen' | 'bald' | 'ueberfaellig' | 'zurueck' | 'zurueck-spaet';

export interface LoanStatus {
  state: LoanState;
  /** Ende der Frist als Zeitstempel. */
  dueAt: number;
  /** Volle Tage bis zur Frist, nie negativ. */
  daysLeft: number;
  /** Volle Tage über die Frist hinaus, nie negativ. */
  daysLate: number;
  /** Fällige Gebühr in Euro, 0 wenn keine. */
  fee: number;
  label: string;
  /** Ein Satz, der den Status und die Folge erklärt. */
  hint: string;
}

export function loanStatus(borrowedAt: number, returnedAt?: number | null, now = Date.now()): LoanStatus {
  const dueAt = borrowedAt + LOAN_DAYS * DAY;
  const at = returnedAt || now;
  const daysLeft = Math.max(0, Math.ceil((dueAt - at) / DAY));
  const daysLate = Math.max(0, Math.ceil((at - dueAt) / DAY));
  const base = { dueAt, daysLeft, daysLate };
  if (returnedAt) {
    return at > dueAt
      ? { ...base, state: 'zurueck-spaet', fee: FEE_LATE, label: `Zurück, ${daysLate} Tage zu spät`, hint: `Nach Fristende zurückgegeben: ${FEE_LATE} € Verspätungsgebühr statt ${FEE_KEPT} € Behältergebühr.` }
      : { ...base, state: 'zurueck', fee: 0, label: 'Zurück, in der Frist', hint: 'Innerhalb der Frist zurückgegeben, keine Gebühr.' };
  }
  if (daysLate > 0) return { ...base, state: 'ueberfaellig', fee: FEE_KEPT, label: `Überfällig seit ${daysLate} ${daysLate === 1 ? 'Tag' : 'Tagen'}`, hint: `${FEE_KEPT} € Behältergebühr fällig. Bringst du ihn jetzt noch zurück, sind es ${FEE_LATE} €.` };
  if (daysLeft <= 3) return { ...base, state: 'bald', fee: 0, label: daysLeft === 0 ? 'Heute fällig' : `Noch ${daysLeft} ${daysLeft === 1 ? 'Tag' : 'Tage'}`, hint: `Rückgabe jetzt einplanen. Nach der Frist werden ${FEE_KEPT} € fällig.` };
  return { ...base, state: 'offen', fee: 0, label: `Noch ${daysLeft} Tage`, hint: `Rückgabe bis zum Fristende ist kostenlos. Danach ${FEE_KEPT} €, bei späterer Rückgabe ${FEE_LATE} €.` };
}

/** Gründe, aus denen ein Behälter nicht mehr zurückkommt. */
export const SETTLE_REASONS: Record<SettleReason, string> = {
  lost: 'Behälter verloren',
  broken: 'Behälter kaputt, nicht mehr nutzbar',
};
export type SettleReason = 'lost' | 'broken';

/**
 * Gebühr, wenn der Behälter nicht zurückkommt. Bewusst dieselbe Summe wie beim
 * Behalten: wer den Verlust selbst meldet, soll nicht schlechter dastehen als wer
 * die Frist einfach verstreichen lässt.
 */
export function settleFee(_reason: SettleReason) {
  return FEE_KEPT;
}

/** Was in Mainsam über eine bezahlte Gebühr steht. Die Abrechnung selbst läuft bei Vytal. */
export interface Settlement {
  reason: SettleReason;
  /** Betrag in Euro. */
  amount: number;
  at: number;
  /** Zahlungsart aus dem Profil, nie Kartendaten. */
  method: string;
  reference: string;
  demo: boolean;
}

export function fmtDue(dueAt: number) {
  return new Date(dueAt).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });
}
export function fmtFee(fee: number) {
  return `${fee} €`;
}
