import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { MapPin, Video, Check, Clock } from "lucide-react";
import { seminarsQuery, seminarsStatusQuery } from "@/lib/queries";

export const Route = createFileRoute("/seminars")({
  head: () => ({
    meta: [
      { title: "Σεμινάρια αγγειοπλαστικής — Πήλινη Μορφή" },
      { name: "description", content: "Σεμινάρια αγγειοπλαστικής δια ζώσης στο εργαστήριο και διαδικτυακά μέσω video." },
      { property: "og:title", content: "Σεμινάρια αγγειοπλαστικής — Πήλινη Μορφή" },
      { property: "og:description", content: "Δια ζώσης και online σεμινάρια μέσω video." },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(seminarsQuery),
      context.queryClient.ensureQueryData(seminarsStatusQuery),
    ]),
  component: Seminars,
});

function Seminars() {
  const { data: seminars } = useSuspenseQuery(seminarsQuery);
  const { data: status } = useSuspenseQuery(seminarsStatusQuery);

  return (
    <div className="mx-auto max-w-5xl px-5 py-16">
      <h1 className="font-display text-4xl md:text-5xl">Σεμινάρια</h1>

      {status.available ? (
        <p className="mt-4 max-w-xl text-muted-foreground">Επιλέξτε τον τρόπο που σας ταιριάζει.</p>
      ) : (
        <div className="mt-6 rounded-md border border-primary/25 bg-secondary p-5">
          <p className="flex items-start gap-2 font-medium text-foreground">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            {status.notice}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Για ενημέρωση όταν ξεκινήσουν ξανά, καλέστε στο{" "}
            <a href={status.contact.phoneHref} className="font-medium text-foreground underline underline-offset-4">
              {status.contact.phone}
            </a>
            .
          </p>
        </div>
      )}

      <div className="mt-12 grid gap-8 md:grid-cols-2">
        {seminars.map((s) => {
          const Icon = s.kind === "online" ? Video : MapPin;
          return (
            <section key={s.id} id={s.id} className="scroll-mt-24 rounded-md border bg-card p-8 shadow-soft">
              <Icon className="h-7 w-7 text-primary" />
              <h2 className="mt-4 font-display text-2xl">{s.title}</h2>
              <p className="mt-3 text-muted-foreground">{s.description}</p>
              {!s.available && (
                <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  Δεν είναι διαθέσιμο προς το παρόν
                </p>
              )}
              <ul className="mt-6 space-y-2 text-sm">
                {s.details.map((d) => (
                  <li key={d} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-accent" />{d}</li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <p className="mt-12 text-sm text-muted-foreground">
        Πριν δηλώσετε συμμετοχή, δείτε τους{" "}
        <Link to="/seminar-terms" className="text-foreground underline underline-offset-4 hover:no-underline">
          Όρους Συμμετοχής Σεμιναρίων
        </Link>
        : κανόνες εγγραφής και ακύρωσης.
      </p>
    </div>
  );
}
