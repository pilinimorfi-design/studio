import { Link } from "@tanstack/react-router";
import { CartDrawer } from "@/components/CartDrawer";
import logo from "@/assets/logo-pilinimorfi.png";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="mx-auto grid min-h-16 max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-2 md:flex md:h-16 md:justify-between md:px-5 md:py-0">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2 whitespace-nowrap font-display text-base font-semibold tracking-tight text-foreground sm:gap-3 sm:text-xl"
        >
          <img src={logo} alt="" aria-hidden="true" className="size-10 object-contain sm:size-12" />
          <span>Πήλινη Μορφή</span>
        </Link>
        <nav className="col-span-2 row-start-2 flex items-center justify-between gap-3 text-xs whitespace-nowrap md:col-span-1 md:row-auto md:justify-normal md:gap-5 md:text-sm">
          <Link
            to="/seminars"
            className="hidden rounded-md border border-input bg-background px-3 py-2 text-muted-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground md:inline"
          >
            Σεμινάρια
          </Link>
          <Link
            to="/about"
            className="rounded-md border border-input bg-background px-3 py-2 text-muted-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
          >
            Σχετικά με εμάς
          </Link>
          <Link
            to="/contact"
            className="rounded-md border border-input bg-background px-3 py-2 text-muted-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
          >
            Επικοινωνία
          </Link>
          <CartDrawer />
        </nav>
      </div>
    </header>
  );
}
