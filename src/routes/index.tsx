import { createFileRoute, Link } from "@tanstack/react-router";
import { CancelSection } from "@/components/CancelSection";

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

function Index() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-lg pb-20">
      <header
        className="px-6 pb-14 pt-16 text-primary-foreground"
        style={{ background: "var(--gradient-header)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.25em] opacity-75">Reservas</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">Combi</h1>
        <p className="mt-3 text-sm opacity-85">Anotate en segundos.</p>
      </header>

      <section className="-mt-7 space-y-3 px-4">
        <Link
          to="/reservas"
          className="block rounded-2xl border border-border bg-card p-5 text-center text-sm font-bold tracking-wide shadow-[var(--shadow-card)] transition-colors hover:bg-secondary"
        >
          VER RESERVAS DEL DÍA
        </Link>
        <Link
          to="/reservar"
          className="block rounded-2xl bg-primary p-5 text-center text-sm font-bold tracking-wide text-primary-foreground shadow-[var(--shadow-card)] transition-opacity hover:opacity-90"
        >
          RESERVAR ASIENTO
        </Link>
      </section>

      <section className="px-4 pt-4">
        <CancelSection />
      </section>
    </main>
  );
}
