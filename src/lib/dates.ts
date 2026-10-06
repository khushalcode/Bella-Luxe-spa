// Pure date helpers shared between server actions and client components.
// Not a 'use server' file — these are synchronous utilities.

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function monthLabel(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map((n) => parseInt(n, 10));
  if (!y || !m) return yearMonth;
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

export function currentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function previousYearMonth(): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Returns YYYY-MM for a given date string (YYYY-MM-DD). */
export function yearMonthOf(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export { MONTH_NAMES };
