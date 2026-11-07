import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { aboutQuery } from "@/lib/queries";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Σχετικά με εμάς — Πήλινη Μορφή" },
      { name: "description", content: "Η πορεία, το πάθος και η φιλοσοφία του εργαστηρίου αγγειοπλαστικής Πήλινη Μορφή." },
      { property: "og:title", content: "Σχετικά με εμάς — Πήλινη Μορφή" },
      { property: "og:description", content: "Η πορεία και η φιλοσοφία του εργαστηρίου Πήλινη Μορφή." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(aboutQuery),
  component: AboutPage,
});

function AboutPage() {
  const { data: about } = useSuspenseQuery(aboutQuery);
  return (
    <section className="bg-secondary">
      <div className="mx-auto grid max-w-6xl items-start gap-10 px-5 py-16 md:grid-cols-2 md:py-20">
        <img src={about.image} alt="Χέρια που πλάθουν πηλό στον τροχό" width={1008} height={1200} className="aspect-[4/5] w-full rounded-md object-cover shadow-soft" />
        <div>
          <h1 className="font-display text-4xl md:text-5xl">{about.title}</h1>
          {about.paragraphs.map((t, i) => (
            <p key={i} className="mt-5 leading-relaxed text-secondary-foreground/85">{t}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
