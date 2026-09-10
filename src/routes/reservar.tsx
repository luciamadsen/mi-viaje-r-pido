import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  CAPACITY,
  STOPS,
  isSelectableDay,
  longLabel,
  monthMatrix,
  monthTitle,
  shortLabel,
} from "@/lib/shuttle";

export const Route = createFileRoute("/reservar")({
  head: () => ({
    meta: [
      { title: "Reservar asiento — Combi" },
      {
        name: "description",
        content: "Elegí los días, tu parada y confirmá tu lugar en la combi en segundos.",
      },
      { property: "og:title", content: "Reservar asiento — Combi" },
      {
        property: "og:description",
        content: "Elegí los días, tu parada y confirmá tu lugar en la combi en segundos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReservarPage,
});

const WEEK_HEADERS = ["L", "M", "M", "J", "V", "S", "D"];

type Confirmation = { name: string; stop: string; days: { day: string; code: string }[] };

function ReservarPage() {
  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [stop, setStop] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const weeks = useMemo(() => monthMatrix(year, month), [year, month]);
  const sortedSelected = useMemo(() => [...selected].sort(), [selected]);

  function shiftMonth(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  function toggleDay(iso: string) {
    setSelected((prev) => (prev.includes(iso) ? prev.filter((d) => d !== iso) : [...prev, iso]));
  }

  const cleanName = name.trim().replace(/\s+/g, " ");
  const ready = sortedSelected.length > 0 && cleanName.length >= 3 && stop !== "";

  async function confirmReservation() {
    setError(null);
    setSubmitting(true);
    const created: { day: string; code: string }[] = [];
    const failed: string[] = [];
    const duplicated: string[] = [];

    for (const day of sortedSelected) {
      const { data: code, error: insertError } = await supabase.rpc("create_reservation", {
        _full_name: cleanName,
        _travel_date: day,
        _stop: stop,
      });
      if (!insertError && code) created.push({ day, code });
      else if (insertError?.code === "23505" || insertError?.message.includes("duplicate"))
        duplicated.push(day);
      else failed.push(day);
    }

    setSubmitting(false);
    setModalOpen(false);
    setAgreed(false);

    if (created.length > 0) {
      setConfirmation({ name: cleanName, stop, days: created });
      setSelected([]);
      setName("");
      setStop("");
    }
    const notes: string[] = [];
    if (failed.length > 0)
      notes.push(
        `Sin lugar (${CAPACITY}/${CAPACITY}) en: ${failed.map(shortLabel).join(", ")}.`,
      );
    if (duplicated.length > 0)
      notes.push(`Ya estabas anotado en: ${duplicated.map(shortLabel).join(", ")}.`);
    setError(notes.length > 0 ? notes.join(" ") : null);
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-lg pb-16">
      <header
        className="px-5 pb-8 pt-9 text-primary-foreground"
        style={{ background: "var(--gradient-header)" }}
      >
        <Link to="/" className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">
          ← Inicio
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Reservar asiento</h1>
      </header>

      {confirmation && (
        <section className="-mt-5 px-3">
          <div className="rounded-2xl border border-success/30 bg-success/10 p-5">
            <h2 className="text-base font-bold">✅ Reserva confirmada</h2>
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
            <ul className="mt-3 space-y-2">
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
            <p className="mt-3 rounded-xl bg-accent/25 p-3 text-sm">
              ⚠️ Si no volvés en combi, avisá por el grupo de WhatsApp.
            </p>
          </div>
        </section>
      )}

      {/* Calendario */}
      <section className={confirmation ? "px-3 pt-4" : "-mt-5 px-3"}>
        <div className="rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide">
              {monthTitle(year, month)}
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                aria-label="Mes anterior"
                onClick={() => shiftMonth(-1)}
                className="h-9 w-9 rounded-lg border border-border text-lg font-bold"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Mes siguiente"
                onClick={() => shiftMonth(1)}
                className="h-9 w-9 rounded-lg border border-border text-lg font-bold"
              >
                ›
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted-foreground">
            {WEEK_HEADERS.map((h, i) => (
              <span key={i}>{h}</span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {weeks.flat().map((iso, i) => {
              if (!iso) return <span key={`e${i}`} />;
              const day = Number(iso.slice(8));
              const enabled = isSelectableDay(iso);
              const active = selected.includes(iso);
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={!enabled}
                  onClick={() => toggleDay(iso)}
                  className={`aspect-square rounded-lg border text-sm font-semibold transition-colors ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : enabled
                        ? "border-border bg-background hover:bg-secondary"
                        : "border-transparent text-muted-foreground/40"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {sortedSelected.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Tocá un día marcado para deseleccionarlo.
            </p>
          )}
        </div>
      </section>

      {/* Datos */}
      <section className="px-3 pt-4">
        <div className="space-y-4 rounded-2xl bg-card p-5 shadow-[var(--shadow-card)]">
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
        </div>
      </section>

      {/* Resumen */}
      <section className="px-3 pt-4">
        <div className="rounded-2xl bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-bold uppercase tracking-wide">Estás reservando</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {sortedSelected.length === 0 && (
              <li className="text-muted-foreground">Elegí al menos un día en el calendario.</li>
            )}
            {sortedSelected.map((d) => (
              <li key={d} className="font-semibold">
                📅 {longLabel(d)}
              </li>
            ))}
            <li className={cleanName ? "font-semibold" : "text-muted-foreground"}>
              👤 {cleanName || "Nombre y apellido"}
            </li>
            <li className={stop ? "font-semibold" : "text-muted-foreground"}>
              📍 {stop || "Parada"}
            </li>
          </ul>

          {error && (
            <p className="mt-3 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          )}

          <button
            type="button"
            disabled={!ready}
            onClick={() => {
              setAgreed(false);
              setModalOpen(true);
            }}
            className="mt-4 w-full rounded-xl bg-primary px-4 py-4 text-base font-bold text-primary-foreground disabled:opacity-50"
          >
            CONFIRMAR RESERVA
          </button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            ⚠️ Si no volvés en combi, avisá por el grupo de WhatsApp.
          </p>
        </div>
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 p-3 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-card p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-base font-bold uppercase">¿Confirmás tu reserva?</h2>
            <p className="mt-2 text-sm text-muted-foreground">Estás confirmando:</p>
            <ul className="mt-2 space-y-1 text-sm font-semibold">
              {sortedSelected.map((d) => (
                <li key={d}>📅 {longLabel(d)}</li>
              ))}
              <li>📍 {stop}</li>
              <li>👤 {cleanName}</li>
            </ul>

            <label className="mt-4 flex items-start gap-3 rounded-xl bg-secondary p-3 text-sm">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0"
              />
              <span>Me comprometo a utilizar el cinturón de seguridad durante el viaje.</span>
            </label>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                disabled={!agreed || submitting}
                onClick={() => void confirmReservation()}
                className="rounded-xl bg-primary px-4 py-3 text-base font-bold text-primary-foreground disabled:opacity-50"
              >
                {submitting ? "Reservando…" : "Confirmar"}
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl border border-border bg-background px-4 py-3 text-base font-bold"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
