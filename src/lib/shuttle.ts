/** Paradas en orden de recorrido, con el horario primero. */
export const STOPS = [
  "06:15 – Av. Antártida Argentina y Gendarmería Nacional – Esquina COTO",
  "06:25 – Bouchard 557, CABA – Frente a Torre Bouchard",
  "06:30 – Av. del Libertador 98, CABA – Puesto bicicletas Gob de la Ciudad",
  "06:35 – Av. Córdoba y Medrano – Carnicería RES",
  "06:40 – Plaza Italia – Pasando rotonda cartel publicitario",
  "06:43 – Av. Santa Fé y Av. Int. Bullrich – Parada colectivo sobre Santa Fé",
  "06:55 – Av. Dorrego 2762 – Puesto de diarios",
  "06:58 – Av. Cabildo (Entre Jorge Newbery y Maure) – Bco. ISBC - Diagnóstico Maipú",
  "07:05 – Av. Cabildo 2877 (Esq. Congreso) – Puesto de flores",
  "07:07 – Av. Cabildo y Nuñez – YPF",
  "07:15 – Av. Cabildo 4899 – GNC",
] as const;

export const CAPACITY = 24;

const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const MONTH_NAMES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** ISO date (yyyy-mm-dd) for a local Date. */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}

export function dayName(iso: string): string {
  return DAY_NAMES[parseISODate(iso).getDay()]!;
}

export function shortLabel(iso: string): string {
  const d = parseISODate(iso);
  return `${DAY_NAMES[d.getDay()]!.slice(0, 3)} ${d.getDate()}`;
}

export function longLabel(iso: string): string {
  const d = parseISODate(iso);
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} de ${MONTH_NAMES[d.getMonth()]}`;
}

export type MonthOption = { key: string; label: string; days: string[] };

/** Months with remaining weekdays (Mon-Fri) from today onward. Past days never appear. */
export function upcomingMonths(count = 3): MonthOption[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = toISODate(today);
  const months: MonthOption[] = [];
  for (let i = 0; i < count; i++) {
    const first = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const year = first.getFullYear();
    const month = first.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: string[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dow = date.getDay();
      const iso = toISODate(date);
      if (dow >= 1 && dow <= 5 && iso >= todayISO) days.push(iso);
    }
    if (days.length > 0) {
      const name = MONTH_NAMES[month]!;
      months.push({
        key: `${year}-${month}`,
        label: name.charAt(0).toUpperCase() + name.slice(1),
        days,
      });
    }
  }
  return months;
}

/** Weekdays (Mon-Fri) from today onward, for the next two weeks. */
export function upcomingWeekdays(): string[] {
  const days: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dow = d.getDay();
    if (dow >= 1 && dow <= 5) days.push(toISODate(d));
  }
  return days;
}

/** Remaining weekdays of the same week as `iso` (from that day onward). */
export function weekDaysOf(iso: string, available: string[]): string[] {
  const base = parseISODate(iso);
  const monday = new Date(base);
  const offset = (base.getDay() + 6) % 7;
  monday.setDate(base.getDate() - offset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return available.filter((d) => {
    const x = parseISODate(d);
    return x >= monday && x <= sunday;
  });
}

/** Short name of a stop, e.g. "CABILDO 3511". */
export function stopShortName(stop: string): string {
  const head = stop.split(" - ")[0] ?? stop;
  return head.replace(/^Av\.\s*/i, "").toUpperCase();
}

export const MONTH_LABELS = MONTH_NAMES;

/** Title like "SEPTIEMBRE 2026". */
export function monthTitle(year: number, month: number): string {
  return `${MONTH_NAMES[month]!.toUpperCase()} ${year}`;
}

/** Weeks (Mon-Sun) of a month; null for padding cells. */
export function monthMatrix(year: number, month: number): (string | null)[][] {
  const first = new Date(year, month, 1);
  const pad = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array.from({ length: pad }, () => null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(toISODate(new Date(year, month, d)));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** Selectable = weekday (Mon-Fri) and today or later. */
export function isSelectableDay(iso: string): boolean {
  const d = parseISODate(iso);
  const dow = d.getDay();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dow >= 1 && dow <= 5 && iso >= toISODate(today);
}
