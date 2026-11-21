import { Link } from "@tanstack/react-router";
import { Phone } from "lucide-react";
import logo from "@/assets/logo-pilinimorfi.png";

export function SiteFooter() {
  return (
    <footer className="bg-clay-deep text-clay-deep-foreground">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center">
          <div className="flex flex-col items-center text-center gap-3">
            <p className="flex items-center gap-2 font-display text-lg font-medium opacity-75 hover:opacity-100">
              <img src={logo} alt="" aria-hidden="true" className="size-10 object-contain" />
              <span>Πήλινη Μορφή</span>
            </p>
            <p className="text-xs opacity-85 leading-relaxed">
              © 2026 Εργαστήριο αγγειοπλαστικής Πήλινη Μορφή.
            </p>
            <p className="text-xs opacity-85 leading-relaxed">Όλα τα δικαιώματα διατηρούνται.</p>
          </div>
          <div className="flex flex-col items-center text-center gap-2 text-sm opacity-75 hover:opacity-100 group/phone">
            <p className="text-sm">
              Χειροποίητα κεραμικά, πλασμένα στον τροχό με αγάπη για τον πηλό.
            </p>
            <a
              href="tel:6980413589"
              className="inline-flex items-center gap-2 cursor-pointer transition-colors duration-300 opacity-75 hover:text-[#E5A98C]"
            >
              <Phone
                className="size-4 transition-transform duration-300 group-hover/phone:rotate-12 group-hover/phone:scale-110"
                aria-hidden="true"
              />
              698 041 3589
            </a>
          </div>
          <nav className="group flex flex-col items-center text-center gap-1.5 text-sm opacity-75">
            <Link
              to="/terms"
              className="relative transition-all duration-300 group-hover:opacity-60 hover:!opacity-100 hover:text-[#E5A98C] after:content-[''] after:block after:h-[1.5px] after:w-0 after:bg-[#E5A98C] after:mx-auto after:transition-all after:duration-300 hover:after:w-full"
            >
              Όροι Χρήσης
            </Link>
            <Link
              to="/privacy"
              className="relative transition-all duration-300 group-hover:opacity-60 hover:!opacity-100 hover:text-[#E5A98C] after:content-[''] after:block after:h-[1.5px] after:w-0 after:bg-[#E5A98C] after:mx-auto after:transition-all after:duration-300 hover:after:w-full"
            >
              Πολιτική Απορρήτου
            </Link>
            <Link
              to="/seminar-terms"
              className="relative transition-all duration-300 group-hover:opacity-60 hover:!opacity-100 hover:text-[#E5A98C] after:content-[''] after:block after:h-[1.5px] after:w-0 after:bg-[#E5A98C] after:mx-auto after:transition-all after:duration-300 hover:after:w-full"
            >
              Όροι Σεμιναρίων
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
