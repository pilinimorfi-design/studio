import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { CartDrawer } from "@/components/CartDrawer";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import logo from "@/assets/logo-pilinimorfi.png";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 py-2 md:h-16 md:px-5 md:py-0">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2 whitespace-nowrap font-display text-xl font-semibold tracking-tight text-foreground sm:gap-3 sm:text-3xl"
        >
          <img src={logo} alt="" aria-hidden="true" className="size-10 object-contain sm:size-12" />
          <span>Πήλινη Μορφή</span>
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <nav
            aria-label="Κύρια πλοήγηση"
            className="hidden items-center gap-3 whitespace-nowrap text-sm lg:flex"
          >
            <Link
              to="/special-orders"
              activeOptions={{ exact: true }}
              activeProps={{
                className:
                  "border-primary bg-primary text-primary-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground",
              }}
              className="rounded-md border border-input bg-background px-3 py-2 text-muted-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
            >
              Ειδικές Παραγγελίες
            </Link>
            <Link
              to="/seminars"
              activeOptions={{ exact: true }}
              activeProps={{
                className:
                  "border-primary bg-primary text-primary-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground",
              }}
              className="rounded-md border border-input bg-background px-3 py-2 text-muted-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
            >
              Σεμινάρια
            </Link>
            <Link
              to="/about"
              activeOptions={{ exact: true }}
              activeProps={{
                className:
                  "border-primary bg-primary text-primary-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground",
              }}
              className="rounded-md border border-input bg-background px-3 py-2 text-muted-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
            >
              Σχετικά με εμάς
            </Link>
            <Link
              to="/contact"
              activeOptions={{ exact: true }}
              activeProps={{
                className:
                  "border-primary bg-primary text-primary-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground",
              }}
              className="rounded-md border border-input bg-background px-3 py-2 text-muted-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
            >
              Επικοινωνία
            </Link>
          </nav>
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="bg-background hover:bg-primary hover:text-primary-foreground lg:hidden"
                aria-label="Άνοιγμα μενού"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent className="flex h-full flex-col sm:max-w-sm">
              <SheetHeader>
                <SheetTitle className="font-display text-2xl">Μενού</SheetTitle>
                <SheetDescription>Περιηγηθείτε στις σελίδες της Πήλινης Μορφής.</SheetDescription>
              </SheetHeader>
              <nav aria-label="Πλοήγηση κινητού" className="flex flex-col gap-3">
                <Link
                  to="/special-orders"
                  activeOptions={{ exact: true }}
                  activeProps={{
                    className:
                      "border-primary bg-primary text-primary-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground",
                  }}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md border border-input bg-background px-4 py-3 text-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
                >
                  Ειδικές Παραγγελίες
                </Link>
                <Link
                  to="/seminars"
                  activeOptions={{ exact: true }}
                  activeProps={{
                    className:
                      "border-primary bg-primary text-primary-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground",
                  }}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md border border-input bg-background px-4 py-3 text-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
                >
                  Σεμινάρια
                </Link>
                <Link
                  to="/about"
                  activeOptions={{ exact: true }}
                  activeProps={{
                    className:
                      "border-primary bg-primary text-primary-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground",
                  }}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md border border-input bg-background px-4 py-3 text-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
                >
                  Σχετικά με εμάς
                </Link>
                <Link
                  to="/contact"
                  activeOptions={{ exact: true }}
                  activeProps={{
                    className:
                      "border-primary bg-primary text-primary-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground",
                  }}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md border border-input bg-background px-4 py-3 text-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
                >
                  Επικοινωνία
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
          <CartDrawer />
        </div>
      </div>
    </header>
  );
}
