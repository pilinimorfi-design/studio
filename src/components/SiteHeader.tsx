import { Link } from "@tanstack/react-router";
import { CartDrawer } from "@/components/CartDrawer";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="font-display text-xl font-semibold tracking-tight text-foreground">
          Πήλινη Μορφή
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link to="/seminars" className="hidden text-muted-foreground hover:text-foreground sm:inline">
            Σεμινάρια
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
