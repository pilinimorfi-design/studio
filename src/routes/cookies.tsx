import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { cookiesQuery } from "@/lib/queries";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Πολιτική Cookies — Πήλινη Μορφή" },
      {
        name: "description",
        content:
          "Πολιτική cookies του ιστότοπου «Πήλινη Μορφή»: ποια cookies αποθηκεύονται, για ποιον λόγο και πώς τα διαχειρίζεστε.",
      },
      { property: "og:title", content: "Πολιτική Cookies — Πήλινη Μορφή" },
      {
        property: "og:description",
        content: "Τι cookies χρησιμοποιεί το εργαστήριο Πήλινη Μορφή και πώς τα διαχειρίζεστε.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/cookies" },
    ],
    links: [{ rel: "canonical", href: "/cookies" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(cookiesQuery),
  component: Cookies,
});

function Cookies() {
  const { data: cookies } = useSuspenseQuery(cookiesQuery);
  const [showCloseButton, setShowCloseButton] = useState(false);

  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const isFromModal =
        searchParams.get("from") === "modal" ||
        sessionStorage.getItem("cookies_from_modal") === "true";
      setShowCloseButton(isFromModal);
      sessionStorage.removeItem("cookies_from_modal");
    } catch {
      setShowCloseButton(false);
    }
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="font-display text-4xl md:text-5xl">{cookies.title}</h1>
      <p className="mt-5 leading-relaxed text-muted-foreground">{cookies.intro}</p>

      <nav aria-label="Περιεχόμενα" className="mt-10 rounded-md border bg-card p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Περιεχόμενα</p>
        <ol className="mt-3 space-y-1.5 text-sm">
          {cookies.sections.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-foreground underline-offset-4 hover:underline">
                {i + 1}. {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-12 space-y-12">
        {cookies.sections.map((s, i) => (
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
      {showCloseButton && (
        <div className="mt-16 text-center">
          <Button
            onClick={() => {
              try {
                window.close();
              } catch {
                // window.close may not be permitted; fall back to history.back()
              }
              window.history.back();
            }}
            variant="outline"
            className="px-8 py-3"
          >
            Κλείσιμο &amp; Επιστροφή στην επιλογή
          </Button>
        </div>
      )}
    </div>
  );
}
