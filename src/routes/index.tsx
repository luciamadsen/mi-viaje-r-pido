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
    <main className="mx-auto min-h-screen w-full max-w-lg pb-16">
      <header
        className="px-5 pb-10 pt-12 text-primary-foreground"
        style={{ background: "var(--gradient-header)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">Reservas</p>
        <h1 className="mt-1 text-3xl font-bold">Combi</h1>
        <p className="mt-2 text-sm opacity-90">Anotate en segundos.</p>
      </header>

      <section className="-mt-6 space-y-3 px-3">
        <Link
          to="/reservas"
          className="block rounded-2xl bg-card p-5 text-center text-base font-bold shadow-[var(--shadow-card)]"
        >
          VER RESERVAS DEL DÍA
        </Link>
        <Link
          to="/reservar"
          className="block rounded-2xl bg-primary p-5 text-center text-base font-bold text-primary-foreground shadow-[var(--shadow-card)]"
        >
          RESERVAR ASIENTO
        </Link>
      </section>

      <section className="px-3 pt-4">
        <CancelSection />
      </section>
    </main>
  );
}
