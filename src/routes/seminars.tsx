import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { MapPin, Video, Check } from "lucide-react";
import { seminarsQuery } from "@/lib/queries";

export const Route = createFileRoute("/seminars")({
  head: () => ({
    meta: [
      { title: "Σεμινάρια αγγειοπλαστικής — Πήλινη Μορφή" },
      { name: "description", content: "Σεμινάρια αγγειοπλαστικής δια ζώσης στο εργαστήριο και διαδικτυακά μέσω video." },
      { property: "og:title", content: "Σεμινάρια αγγειοπλαστικής — Πήλινη Μορφή" },
      { property: "og:description", content: "Δια ζώσης και online σεμινάρια μέσω video." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(seminarsQuery),
  component: Seminars,
});

function Seminars() {
  const { data: seminars } = useSuspenseQuery(seminarsQuery);
  return (
    <div className="mx-auto max-w-5xl px-5 py-16">
      <h1 className="font-display text-4xl md:text-5xl">Σεμινάρια</h1>
      <p className="mt-4 max-w-xl text-muted-foreground">Επιλέξτε τον τρόπο που σας ταιριάζει.</p>
      <div className="mt-12 grid gap-8 md:grid-cols-2">
        {seminars.map((s) => {
          const Icon = s.kind === "online" ? Video : MapPin;
          return (
            <section key={s.id} id={s.id} className="scroll-mt-24 rounded-md border bg-card p-8 shadow-soft">
              <Icon className="h-7 w-7 text-primary" />
              <h2 className="mt-4 font-display text-2xl">{s.title}</h2>
              <p className="mt-3 text-muted-foreground">{s.description}</p>
              <ul className="mt-6 space-y-2 text-sm">
                {s.details.map((d) => (
                  <li key={d} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-accent" />{d}</li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
