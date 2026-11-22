import { Link } from "@tanstack/react-router";
import { Phone } from "lucide-react";
import logo from "@/assets/logo-pilinimorfi.png";

export function SiteFooter() {
  return (
    <footer className="bg-clay-deep text-clay-deep-foreground">
      <div className="mx-auto max-w-6xl px-5 py-3.5 md:py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center md:items-end">
          {/* Column 1: Logo & copyright */}
          <div className="flex flex-col gap-3 md:items-start md:text-left">
            <p className="flex items-center gap-2 font-display text-xl md:text-2xl font-medium opacity-75 hover:opacity-100">
              <img src={logo} alt="" aria-hidden="true" className="size-12 object-contain" />
              <span>Πήλινη Μορφή</span>
            </p>
            <div className="space-y-0.5 mt-0.5 text-[10px] opacity-85 leading-tight">
              <p>© 2026 Εργαστήριο αγγειοπλαστικής Πήλινη Μορφή.</p>
              <p>Όλα τα δικαιώματα διατηρούνται.</p>
            </div>
          </div>
          {/* Column 2: Description & phone */}
          <div className="flex flex-col gap-2 text-sm opacity-75 hover:opacity-100 group/phone md:items-center md:text-center md:pb-1">
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
          {/* Column 3: Legal links */}
          <nav className="group flex flex-col space-y-1 text-sm opacity-75 md:items-end md:text-right md:pb-1">
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
