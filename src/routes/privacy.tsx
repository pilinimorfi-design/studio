import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { privacyQuery } from "@/lib/queries";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Πολιτική Απορρήτου — Πήλινη Μορφή" },
      {
        name: "description",
        content:
          "Πώς συλλέγει και χρησιμοποιεί τα προσωπικά σας δεδομένα το κατάστημα «Πήλινη Μορφή»: παραγγελίες, πληρωμές, αποστολή, cookies και τα δικαιώματά σας.",
      },
      { property: "og:title", content: "Πολιτική Απορρήτου — Πήλινη Μορφή" },
      {
        property: "og:description",
        content: "Ποια δεδομένα συλλέγουμε, γιατί τα χρειάζεται η παραγγελία σας και ποια δικαιώματα έχετε.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/privacy" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(privacyQuery),
  component: Privacy,
});

function Privacy() {
  const { data: privacy } = useSuspenseQuery(privacyQuery);

  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="font-display text-4xl md:text-5xl">{privacy.title}</h1>
      <p className="mt-5 leading-relaxed text-muted-foreground">{privacy.intro}</p>

      <nav aria-label="Περιεχόμενα" className="mt-10 rounded-md border bg-card p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Περιεχόμενα</p>
        <ol className="mt-3 space-y-1.5 text-sm">
          {privacy.sections.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-foreground underline-offset-4 hover:underline">
                {i + 1}. {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-12 space-y-12">
        {privacy.sections.map((s, i) => (
          <section key={s.id} id={s.id} className="scroll-mt-24">
            <h2 className="font-display text-2xl md:text-3xl">
              <span className="text-muted-foreground">{i + 1}.</span> {s.title}
            </h2>
            {s.paragraphs.map((p, j) => (
              <p key={j} className="mt-4 leading-relaxed text-secondary-foreground/90">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>

      <p className="mt-14 border-t border-border/60 pt-6 text-sm text-muted-foreground">{privacy.note}</p>
    </div>
  );
}
