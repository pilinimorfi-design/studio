import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Phone } from "lucide-react";
import { contactQuery } from "@/lib/queries";

export function SiteFooter() {
  const { data: contact } = useSuspenseQuery(contactQuery);

  return (
    <footer className="bg-clay-deep text-clay-deep-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-display text-lg">Πήλινη Μορφή</p>
        <nav className="flex flex-wrap items-center gap-5 text-sm">
          <a href={contact.phoneHref} className="flex items-center gap-1.5 opacity-75 hover:opacity-100">
            <Phone className="h-3.5 w-3.5" />
            {contact.phone}
          </a>
          <Link to="/contact" className="opacity-75 hover:opacity-100">
            Επικοινωνία
          </Link>
          <Link to="/terms" className="opacity-75 hover:opacity-100">
            Όροι Χρήσης
          </Link>
          <Link to="/privacy" className="opacity-75 hover:opacity-100">
            Πολιτική Απορρήτου
          </Link>
          <Link to="/seminar-terms" className="opacity-75 hover:opacity-100">
            Όροι Σεμιναρίων
          </Link>
          <p className="opacity-75">Χειροποίητα κεραμικά · © {new Date().getFullYear()}</p>
        </nav>
      </div>
    </footer>
  );
}
