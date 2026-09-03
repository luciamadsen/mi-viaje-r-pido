export const STOPS = [
  "Av. Antártida Argentina 1160 - Esquina Coto (entre Gendarmería y Coto)",
  "Av. del Libertador 98 - Puesto de bicicletas GBA de la ciudad",
  "Bouchard 557 - Parada de colectivo, frente a Torre Bouchard",
  "Av. Córdoba 3789 - Carnicería RES (esquina Córdoba y Medrano)",
  "Av. Santa Fe 4387 - Pasando la rotonda, cartel publicitario",
  "Av. Santa Fe 4799 - Parada de colectivo sobre Santa Fe",
  "Av. Dorrego 2762 - Puesto de diarios",
  "Av. Cabildo 459 - Banco ISBC / Diagnóstico Maipú",
  "Av. Cabildo 2877 - Puesto de diarios",
  "Av. Cabildo 3511 - YPF",
  "Av. Cabildo 4963 - GNC",
] as const;

export const CAPACITY = 30;

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
