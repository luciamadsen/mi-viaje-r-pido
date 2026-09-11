import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CAPACITY, STOPS, longLabel, stopShortName, toISODate } from "@/lib/shuttle";

export const Route = createFileRoute("/reservas")({
  head: () => ({
    meta: [
      { title: "Reservas del día — Combi" },
      {
        name: "description",
        content: "Mirá quiénes viajan hoy y los próximos días, agrupados por parada.",
      },
      { property: "og:title", content: "Reservas del día — Combi" },
      {
        property: "og:description",
        content: "Mirá quiénes viajan hoy y los próximos días, agrupados por parada.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReservasPage,
});

type Reservation = {
  id: string;
  full_name: string;
  travel_date: string;
  stop: string;
};

function ReservasPage() {
  const todayISO = useMemo(() => toISODate(new Date()), []);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("reservations")
      .select("id, full_name, travel_date, stop")
      .gte("travel_date", todayISO)
      .order("travel_date", { ascending: true });
    setReservations((data as Reservation[]) ?? []);
    setLoading(false);
  }, [todayISO]);

  useEffect(() => {
    void load();
    const channel = supabase
      .channel("reservations-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservations" },
        () => void load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load]);

  const byDay = useMemo(() => {
    const map = new Map<string, Reservation[]>();
    for (const r of reservations) {
      const list = map.get(r.travel_date) ?? [];
      list.push(r);
      map.set(r.travel_date, list);
    }
    const order = new Map<string, number>(STOPS.map((s, i) => [s, i]));
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([day, list]) => {
        const stops = new Map<string, Reservation[]>();
        for (const r of list) {
          const arr = stops.get(r.stop) ?? [];
          arr.push(r);
          stops.set(r.stop, arr);
        }
        return {
          day,
          total: list.length,
          groups: [...stops.entries()].sort(
            (a, b) => (order.get(a[0]) ?? STOPS.length) - (order.get(b[0]) ?? STOPS.length),
          ),
        };
      });
  }, [reservations]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-lg pb-20">
      <header
        className="px-6 pb-12 pt-14 text-primary-foreground"
        style={{ background: "var(--gradient-header)" }}
      >
        <Link to="/" className="text-xs font-semibold uppercase tracking-[0.25em] opacity-75">
          ← Inicio
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Reservas del día</h1>
      </header>

      <section className="-mt-6 space-y-4 px-4">
        {loading && (
          <div className="rounded-2xl bg-card p-5 text-sm text-muted-foreground shadow-[var(--shadow-card)]">
            Cargando reservas…
          </div>
        )}
        {!loading && byDay.length === 0 && (
          <div className="rounded-2xl bg-card p-5 text-sm text-muted-foreground shadow-[var(--shadow-card)]">
            Todavía no hay reservas próximas.
          </div>
        )}

        {byDay.map(({ day, total, groups }) => (
          <div key={day} className="rounded-2xl bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-base font-bold uppercase">
                {longLabel(day)}
                {day === todayISO && (
                  <span className="ml-2 rounded-full bg-accent/40 px-2 py-0.5 text-[11px] font-bold uppercase">
                    Hoy
                  </span>
                )}
              </h2>
              <span className="text-xs font-semibold text-muted-foreground">
                {total}/{CAPACITY}
              </span>
            </div>

            <div className="mt-5 space-y-5">
              {groups.map(([stopName, list]) => (
                <div key={stopName}>
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-primary">
                      {stopShortName(stopName)}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {list.length} {list.length === 1 ? "pasajero" : "pasajeros"}
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {list.map((r) => (
                      <li
                        key={r.id}
                        className="rounded-lg bg-secondary px-3 py-2 text-sm font-medium"
                      >
                        {r.full_name}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}

        <Link
          to="/reservar"
          className="block rounded-2xl bg-primary p-4 text-center text-base font-bold text-primary-foreground shadow-[var(--shadow-card)]"
        >
          RESERVAR ASIENTO
        </Link>
      </section>
    </main>
  );
}
