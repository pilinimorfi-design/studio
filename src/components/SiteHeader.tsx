import { Link } from "@tanstack/react-router";
import { CartDrawer } from "@/components/CartDrawer";
import logo from "@/assets/logo-pilinimorfi.png";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2 whitespace-nowrap font-display text-base font-semibold tracking-tight text-foreground sm:gap-3 sm:text-xl"
        >
          <img src={logo} alt="" aria-hidden="true" className="size-10 object-contain sm:size-12" />
          <span>Πήλινη Μορφή</span>
        </Link>
        <nav className="flex items-center gap-3 sm:gap-5 text-sm whitespace-nowrap">
          <Link
            to="/seminars"
            className="hidden text-muted-foreground hover:text-foreground sm:inline"
          >
            Σεμινάρια
          </Link>
          <Link to="/about" className="text-muted-foreground hover:text-foreground">
            Σχετικά με εμάς
          </Link>
          <Link to="/contact" className="text-muted-foreground hover:text-foreground">
            Επικοινωνία
          </Link>
          <CartDrawer />
        </nav>
      </div>
    </header>
  );
}
