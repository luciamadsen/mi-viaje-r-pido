import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { longLabel } from "@/lib/shuttle";

type FoundReservation = {
  id: string;
  full_name: string;
  travel_date: string;
  stop: string;
};

export function CancelSection({ onCancelled }: { onCancelled?: () => void }) {
  const [open, setOpen] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [found, setFound] = useState<FoundReservation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function searchCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(false);
    setFound(null);
    const clean = codeInput.trim().toUpperCase();
    if (!clean) {
      setError("Ingresá tu código de cancelación.");
      return;
    }
    setBusy(true);
    const { data } = await supabase.rpc("find_reservation_by_code", { _code: clean });
    setBusy(false);
    const row = (data as FoundReservation[] | null)?.[0];
    if (!row) {
      setError("❌ No encontramos una reserva con ese código. Revisalo e intentá nuevamente.");
      return;
    }
    setFound(row);
  }

  async function confirmCancel() {
    setBusy(true);
    const { data, error: rpcError } = await supabase.rpc("cancel_reservation_by_code", {
      _code: codeInput.trim().toUpperCase(),
    });
    setBusy(false);
    if (rpcError || !data) {
      setError("❌ No encontramos una reserva con ese código. Revisalo e intentá nuevamente.");
      return;
    }
    setFound(null);
    setCodeInput("");
    setDone(true);
    onCancelled?.();
  }

  return (
    <div className="rounded-2xl bg-card p-5 shadow-[var(--shadow-card)]">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setError(null);
          setDone(false);
          setFound(null);
        }}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="text-base font-bold">Cancelar una reserva</span>
        <span className="text-sm text-muted-foreground">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-4">
          {!found && (
            <form onSubmit={searchCode} className="space-y-3">
              <label htmlFor="code" className="text-sm font-medium">
                Código de cancelación
              </label>
              <input
                id="code"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                placeholder="Ej: K7M2QP"
                autoCapitalize="characters"
                className="w-full rounded-xl border border-input bg-background px-3 py-3 font-mono text-base tracking-[0.15em] outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-base font-bold disabled:opacity-60"
              >
                {busy ? "Buscando…" : "Buscar reserva"}
              </button>
            </form>
          )}

          {found && (
            <div className="rounded-xl border border-border p-4">
              <p className="text-base font-bold">¿Querés cancelar esta reserva?</p>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex gap-2">
                  <dt className="text-muted-foreground">Nombre:</dt>
                  <dd className="font-semibold">{found.full_name}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted-foreground">Día:</dt>
                  <dd className="font-semibold">{longLabel(found.travel_date)}</dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-muted-foreground">Parada:</dt>
                  <dd className="font-semibold">{found.stop}</dd>
                </div>
              </dl>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void confirmCancel()}
                  className="rounded-xl bg-destructive px-4 py-3 text-base font-bold text-destructive-foreground disabled:opacity-60"
                >
                  Sí, cancelar reserva
                </button>
                <button
                  type="button"
                  onClick={() => setFound(null)}
                  className="rounded-xl border border-border bg-background px-4 py-3 text-base font-bold"
                >
                  Volver
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="mt-3 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          )}
          {done && (
            <p className="mt-3 rounded-xl border border-success/30 bg-success/10 p-3 text-sm font-semibold">
              ✅ Reserva cancelada correctamente.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
