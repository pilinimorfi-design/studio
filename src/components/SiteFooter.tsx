export function SiteFooter() {
  return (
    <footer className="bg-clay-deep text-clay-deep-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-10 sm:flex-row sm:justify-between">
        <p className="font-display text-lg">Πήλινη Μορφή</p>
        <p className="text-sm opacity-75">Χειροποίητα κεραμικά · © {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
