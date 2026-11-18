import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo-pilinimorfi.png";

export function SiteFooter() {
  return (
    <footer className="bg-clay-deep text-clay-deep-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3">
          <p className="flex items-center gap-2 font-display text-lg">
            <img src={logo} alt="" aria-hidden="true" className="size-10 object-contain" />
            <span>Πήλινη Μορφή</span>
          </p>
          <p className="text-[13px] opacity-75">Εργαστήριο αγγειοπλαστικής • © 2026</p>
        </div>
        <nav className="flex flex-col items-start gap-2 text-sm sm:items-end">
          <Link to="/terms" className="opacity-75 hover:opacity-100">
            Όροι Χρήσης
          </Link>
          <Link to="/privacy" className="opacity-75 hover:opacity-100">
            Πολιτική Απορρήτου
          </Link>
          <Link to="/seminar-terms" className="opacity-75 hover:opacity-100">
            Όροι Σεμιναρίων
          </Link>
        </nav>
      </div>
    </footer>
  );
}
