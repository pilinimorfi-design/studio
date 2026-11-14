import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { termsQuery } from "@/lib/queries";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Όροι Χρήσης — Πήλινη Μορφή" },
      {
        name: "description",
        content:
          "Όροι χρήσης του καταστήματος «Πήλινη Μορφή»: το εργαστήριο, τα χειροποίητα προϊόντα, οι παραγγελίες, τα πνευματικά δικαιώματα και ο περιορισμός ευθύνης.",
      },
      { property: "og:title", content: "Όροι Χρήσης — Πήλινη Μορφή" },
      {
        property: "og:description",
        content:
          "Το εργαστήριο, τα προϊόντα, οι παραγγελίες, τα πνευματικά δικαιώματα και ο περιορισμός ευθύνης.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/terms" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(termsQuery),
  component: Terms,
});

function Terms() {
  const { data: terms } = useSuspenseQuery(termsQuery);

  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="font-display text-4xl md:text-5xl">{terms.title}</h1>
      <p className="mt-5 leading-relaxed text-muted-foreground">{terms.intro}</p>

      <nav aria-label="Περιεχόμενα" className="mt-10 rounded-md border bg-card p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Περιεχόμενα</p>
        <ol className="mt-3 space-y-1.5 text-sm">
          {terms.sections.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-foreground underline-offset-4 hover:underline">
                {i + 1}. {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-12 space-y-12">
        {terms.sections.map((s, i) => (
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
    </div>
  );
}
