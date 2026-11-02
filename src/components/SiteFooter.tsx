import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="bg-clay-deep text-clay-deep-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-display text-lg">Πήλινη Μορφή</p>
        <nav className="flex items-center gap-5 text-sm">
          <Link to="/terms" className="opacity-75 hover:opacity-100">
            Όροι Χρήσης
          </Link>
          <p className="opacity-75">Χειροποίητα κεραμικά · © {new Date().getFullYear()}</p>
        </nav>
      </div>
    </footer>
  );
}

