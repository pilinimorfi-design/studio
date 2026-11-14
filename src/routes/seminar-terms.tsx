import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { seminarTermsQuery, seminarsStatusQuery } from "@/lib/queries";

export const Route = createFileRoute("/seminar-terms")({
  head: () => ({
    meta: [
      { title: "Όροι Συμμετοχής Σεμιναρίων — Πήλινη Μορφή" },
      {
        name: "description",
        content:
          "Όροι συμμετοχής στα σεμινάρια αγγειοπλαστικής «Πήλινη Μορφή»: εγγραφή, προκαταβολή, ακύρωση από εσάς και από το εργαστήριο.",
      },
      { property: "og:title", content: "Όροι Συμμετοχής Σεμιναρίων — Πήλινη Μορφή" },
      {
        property: "og:description",
        content: "Πώς κρατάτε τη θέση σας στο σεμινάριο και τι γίνεται σε περίπτωση ακύρωσης.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/seminar-terms" },
    ],
    links: [{ rel: "canonical", href: "/seminar-terms" }],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(seminarTermsQuery),
      context.queryClient.ensureQueryData(seminarsStatusQuery),
    ]),
  component: SeminarTerms,
});

function SeminarTerms() {
  const { data: seminarTerms } = useSuspenseQuery(seminarTermsQuery);
  const { data: status } = useSuspenseQuery(seminarsStatusQuery);

  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="font-display text-4xl md:text-5xl">{seminarTerms.title}</h1>
      <p className="mt-5 leading-relaxed text-muted-foreground">{seminarTerms.intro}</p>

      {!status.available && (
        <div className="mt-8 rounded-md border border-dashed bg-secondary p-5">
          <p className="text-sm font-medium text-foreground">{status.notice}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Οι όροι αυτοί διατηρούνται στη σελίδα για την επόμενη περίοδο εγγραφών. Τηλεφωνικά:{" "}
            <a
              href={status.contact.phoneHref}
              className="font-medium text-foreground underline underline-offset-4"
            >
              {status.contact.phone}
            </a>
            .
          </p>
        </div>
      )}

      <nav aria-label="Περιεχόμενα" className="mt-10 rounded-md border bg-card p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Περιεχόμενα</p>
        <ol className="mt-3 space-y-1.5 text-sm">
          {seminarTerms.sections.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-foreground underline-offset-4 hover:underline">
                {i + 1}. {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-12 space-y-12">
        {seminarTerms.sections.map((s, i) => (
          <section key={s.id} id={s.id} className="scroll-mt-24">
            <h2 className="font-display text-2xl md:text-3xl">
              <span className="text-muted-foreground">{i + 1}.</span>{" "}
              {s.title.split(/(\s+)/).map((part, partIndex) =>
                /^\s+$/.test(part) ? (
                  part
                ) : s.id === "ulika" && part.startsWith("Υλ") ? (
                  <span key={partIndex} className="whitespace-nowrap">
                    Υ<span className="-ml-[0.02em]">λικά,</span>
                  </span>
                ) : (
                  <span key={partIndex} className="whitespace-nowrap">
                    {part}
                  </span>
                ),
              )}
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
