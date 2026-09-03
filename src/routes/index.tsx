import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  CAPACITY,
  STOPS,
  longLabel,
  shortLabel,
  stopShortName,
  toISODate,
  upcomingMonths,
  weekDaysOf,
} from "@/lib/shuttle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Combi — Reservá tu lugar" },
      {
        name: "description",
        content:
          "Reservá tu lugar en la combi en segundos y mirá en tiempo real quién viaja en cada parada.",
      },
      { property: "og:title", content: "Combi — Reservá tu lugar" },
      {
        property: "og:description",
        content:
          "Reservá tu lugar en la combi en segundos y mirá en tiempo real quién viaja en cada parada.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Reservation = {
  id: string;
  full_name: string;
  travel_date: string;
  stop: string;
};

type Confirmation = {
  name: string;
  stop: string;
  days: { day: string; code: string }[];
};

type FoundReservation = {
  id: string;
  full_name: string;
  travel_date: string;
  stop: string;
};

function Index() {
  const months = useMemo(() => {
    const now = new Date();
    return upcomingMonths(12 - now.getMonth()); // hasta diciembre inclusive
  }, []);
  const days = useMemo(() => months.flatMap((m) => m.days), [months]);
  const [selectedMonth, setSelectedMonth] = useState(() => months[0]?.key ?? "");
  const [selectedDay, setSelectedDay] = useState(() => days[0] ?? toISODate(new Date()));
  const visibleDays = months.find((m) => m.key === selectedMonth)?.days ?? [];
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [stop, setStop] = useState("");
  const [wholeWeek, setWholeWeek] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("reservations")
      .select("id, full_name, travel_date, stop")
      .gte("travel_date", days[0] ?? toISODate(new Date()))
      .order("created_at", { ascending: true });
    setReservations((data as Reservation[]) ?? []);
    setLoading(false);
  }, [days]);

  useEffect(() => {
    void load();
    const channel = supabase
      .channel("reservations-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservations" },
        () => {
          void load();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load]);

  const dayReservations = reservations.filter((r) => r.travel_date === selectedDay);
  const countFor = (iso: string) => reservations.filter((r) => r.travel_date === iso).length;

  const grouped = useMemo(() => {
    const map = new Map<string, Reservation[]>();
    for (const r of dayReservations) {
      const list = map.get(r.stop) ?? [];
      list.push(r);
      map.set(r.stop, list);
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [dayReservations]);

  const occupied = dayReservations.length;
  const targetDays = wholeWeek ? weekDaysOf(selectedDay, days) : [selectedDay];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setConfirmation(null);

    const cleanName = name.trim().replace(/\s+/g, " ");
    if (cleanName.length < 3) {
      setError("Ingresá tu nombre y apellido.");
      return;
    }
    if (!stop) {
      setError("Elegí la parada donde subís.");
      return;
    }

    setSubmitting(true);
    const created: { day: string; code: string }[] = [];
    const full: string[] = [];
    const duplicated: string[] = [];

    for (const day of targetDays) {
      const { data: code, error: insertError } = await supabase.rpc("create_reservation", {
        _full_name: cleanName,
        _travel_date: day,
        _stop: stop,
      });
      if (!insertError && code) created.push({ day, code });
      else if (insertError?.message.includes("CAPACITY_FULL")) full.push(day);
      else if (insertError?.code === "23505" || insertError?.message.includes("duplicate"))
        duplicated.push(day);
      else full.push(day);
    }

    setSubmitting(false);
    await load();

    if (created.length > 0) {
      setConfirmation({ name: cleanName, stop, days: created });
      setName("");
      setStop("");
      setWholeWeek(false);
    }
    const notes: string[] = [];
    if (full.length > 0)
      notes.push(`Sin lugar (30/30) en: ${full.map(shortLabel).join(", ")}.`);
    if (duplicated.length > 0)
      notes.push(`Ya estabas anotado en: ${duplicated.map(shortLabel).join(", ")}.`);
    setError(notes.length > 0 ? notes.join(" ") : null);
  }

  async function cancel(id: string) {
    await supabase.from("reservations").delete().eq("id", id);
    await load();
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-lg pb-16">
      <header
        className="px-5 pb-8 pt-9 text-primary-foreground"
        style={{ background: "var(--gradient-header)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">
          Reservas
        </p>
        <h1 className="mt-1 text-3xl font-bold">Combi</h1>
        <p className="mt-2 text-sm opacity-90">
          Anotate en segundos y mirá quién viaja en cada parada.
        </p>
      </header>

      {/* Day selector */}
      <section className="-mt-5 px-3">
        <div className="rounded-2xl bg-card p-3 shadow-[var(--shadow-card)]">
          <div className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {months.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => {
                  setSelectedMonth(m.key);
                  setSelectedDay(m.days[0] ?? selectedDay);
                }}
                className={`rounded-xl border px-2 py-2 text-sm font-semibold transition-colors ${
                  m.key === selectedMonth
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:bg-secondary"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {visibleDays.map((d) => {
              const active = d === selectedDay;
              const count = countFor(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDay(d)}
                  className={`flex min-w-[76px] shrink-0 flex-col items-center rounded-xl border px-3 py-2 transition-colors ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:bg-secondary"
                  }`}
                >
                  <span className="text-xs font-semibold uppercase">{shortLabel(d)}</span>
                  <span
                    className={`mt-0.5 text-[11px] ${active ? "opacity-90" : "text-muted-foreground"}`}
                  >
                    {count}/{CAPACITY}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Live list */}
      <section className="px-3 pt-4">
        <div className="rounded-2xl bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-bold uppercase">{longLabel(selectedDay)}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {occupied} / {CAPACITY}
            </span>{" "}
            lugares ocupados · {Math.max(CAPACITY - occupied, 0)} disponibles
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min((occupied / CAPACITY) * 100, 100)}%` }}
            />
          </div>

          <div className="mt-5 space-y-5">
            {loading && <p className="text-sm text-muted-foreground">Cargando reservas…</p>}
            {!loading && grouped.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Todavía no hay reservas para este día. ¡Sé el primero!
              </p>
            )}
            {grouped.map(([stopName, list]) => (
              <div key={stopName}>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-primary">
                    {stopShortName(stopName)}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {list.length} {list.length === 1 ? "pasajero" : "pasajeros"}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{stopName}</p>
                <ul className="mt-2 space-y-1">
                  {list.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2"
                    >
                      <span className="text-sm font-medium">{r.full_name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Confirmation */}
      {confirmation && (
        <section className="px-3 pt-4">
          <div className="rounded-2xl border border-success/30 bg-success/10 p-5">
            <h2 className="text-base font-bold text-foreground">✅ Reserva confirmada</h2>
            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex gap-2">
                <dt className="text-muted-foreground">Nombre:</dt>
                <dd className="font-semibold">{confirmation.name}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-muted-foreground">Parada:</dt>
                <dd className="font-semibold">{confirmation.stop}</dd>
              </div>
            </dl>

            <div className="mt-3">
              <p className="text-sm text-muted-foreground">
                {confirmation.days.length > 1
                  ? "Días y códigos de cancelación:"
                  : "Día y código de cancelación:"}
              </p>
              <ul className="mt-2 space-y-2">
                {confirmation.days.map((d) => (
                  <li
                    key={d.code}
                    className="flex items-center justify-between gap-3 rounded-xl bg-card px-3 py-2"
                  >
                    <span className="text-sm font-semibold">{longLabel(d.day)}</span>
                    <button
                      type="button"
                      onClick={() => void navigator.clipboard?.writeText(d.code)}
                      className="rounded-lg border border-border px-3 py-1 font-mono text-base font-bold tracking-[0.15em]"
                      title="Tocá para copiar"
                    >
                      {d.code}
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-3 rounded-xl bg-accent/25 p-3 text-sm font-medium">
                🔑 Guardá este código. Lo vas a necesitar si querés cancelar tu reserva.
              </p>
            </div>
            <p className="mt-4 rounded-xl bg-accent/25 p-3 text-sm">
              ⚠️ Si no volvés en combi, avisá por el grupo de WhatsApp.
            </p>
          </div>
        </section>
      )}

      {/* Form */}
      <section className="px-3 pt-4">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl bg-card p-5 shadow-[var(--shadow-card)]"
        >
          <h2 className="text-lg font-bold">Reservar mi lugar</h2>

          <div>
            <label htmlFor="name" className="text-sm font-medium">
              Nombre y apellido
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Lucía Fernández"
              autoComplete="name"
              className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-3 text-base outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </div>

          <div>
            <span className="text-sm font-medium">Día del viaje</span>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setWholeWeek(false)}
                className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${
                  !wholeWeek
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background"
                }`}
              >
                Un solo día
              </button>
              <button
                type="button"
                onClick={() => setWholeWeek(true)}
                className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${
                  wholeWeek
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background"
                }`}
              >
                Toda la semana
              </button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {wholeWeek
                ? `Se reservará: ${targetDays.map(shortLabel).join(", ")}`
                : `Día seleccionado: ${longLabel(selectedDay)} (cambialo arriba)`}
            </p>
          </div>

          <div>
            <label htmlFor="stop" className="text-sm font-medium">
              Parada donde subís
            </label>
            <select
              id="stop"
              value={stop}
              onChange={(e) => setStop(e.target.value)}
              className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            >
              <option value="">Elegí tu parada…</option>
              {STOPS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-primary px-4 py-4 text-base font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Reservando…" : "Confirmar reserva"}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            ⚠️ Si no volvés en combi, avisá por el grupo de WhatsApp.
          </p>
        </form>
      </section>
    </main>
  );
}
