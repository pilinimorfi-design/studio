"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

const COOKIE_PREFS_KEY = "pilinimorfi_cookie_prefs";

type CookiePrefs = {
  necessary: boolean;
  optional: boolean;
  timestamp: number;
};

interface CookieBannerProps {
  open: boolean;
  onClose: () => void;
  message: React.ReactNode;
  primaryLabel: string;
  primaryVariant: "default" | "outline";
  primaryOnClick: () => void;
  secondaryLabel: string;
  secondaryVariant: "default" | "outline";
  secondaryOnClick: () => void;
  showCookiePolicyLink?: boolean;
  linkHref?: string;
  showSettings?: boolean;
}

export function CookieBanner({
  open,
  onClose,
  message,
  primaryLabel,
  primaryVariant,
  primaryOnClick,
  secondaryLabel,
  secondaryVariant,
  secondaryOnClick,
  showCookiePolicyLink = false,
  linkHref = "/cookies?from=modal",
  showSettings = false,
}: CookieBannerProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const openSettings = () => {
    setSettingsOpen(true);
  };

  if (!open && !settingsOpen) return null;

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
          <div className="pointer-events-none backdrop-blur-sm bg-black/40 fixed inset-0"></div>
          <div className="pointer-events-auto flex flex-col gap-4 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl bg-card border border-border shadow-2xl px-6 pb-6 pt-10 sm:px-8 sm:pt-11 text-sm sm:text-[15px] leading-relaxed text-card-foreground relative z-10 my-auto font-rounded">
            <button
              onClick={onClose}
              className="absolute right-3.5 top-3.5 flex items-center justify-center size-7 rounded-md border border-primary/30 bg-primary/10 text-primary font-bold text-sm cursor-pointer transition-all duration-200 hover:scale-105 hover:bg-primary hover:text-primary-foreground hover:border-primary shadow-sm transform-gpu"
              aria-label="Κλείσιμο"
            >
              Χ
            </button>
            <div className="text-center leading-relaxed px-2 sm:px-4 pt-1 sm:pt-1.5">
              {message}
              {showCookiePolicyLink && (
                <div className="mt-2 text-center">
                  <a
                    href={linkHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-primary underline underline-offset-4 hover:text-primary/80 hover:scale-105 transform-gpu transition-all duration-200 font-medium cursor-pointer text-center"
                    onClick={() => {
                      try {
                        sessionStorage.setItem("cookies_from_modal", "true");
                      } catch {
                        // ignore
                      }
                    }}
                  >
                    Πολιτική Cookies
                  </a>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-1">
              <Button
                variant={secondaryVariant}
                size="sm"
                onClick={secondaryOnClick}
                className="w-full sm:w-auto cursor-pointer transition-all duration-200 hover:scale-105 transform-gpu border border-border bg-background text-foreground hover:bg-muted hover:border-border hover:text-foreground shadow-sm"
              >
                {secondaryLabel}
              </Button>
              <Button
                variant={primaryVariant}
                size="sm"
                onClick={primaryOnClick}
                className="w-full sm:w-auto cursor-pointer transition-all duration-200 hover:scale-105 transform-gpu bg-primary text-primary-foreground hover:bg-[#9c4524] hover:shadow-md hover:brightness-105"
              >
                {primaryLabel}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showSettings && settingsOpen && (
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent className="sm:max-w-md p-6">
            <DialogTitle className="font-bold text-xl text-stone-900">
              Ρυθμίσεις Cookies
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Επιλέξτε ποιες κατηγορίες cookies να ενεργοποιήσετε. Τα「Απολύτως απαραίτητα」είναι
              μόνιμα ενεργοποιημένα για τη λειτουργία του ιστότοπου.
            </DialogDescription>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-input bg-background">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Απολύτως απαραίτητα</span>
                    <span className="text-xs font-medium text-primary">Μόνιμο</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Απαιτούμενα για καλάθι, φόρμες επικοινώνησης και βασική λειτουργία του
                    ιστότοπου.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-input bg-background opacity-50 pointer-events-none">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Αναλυτική και προσαρμοσμένη εμπειρία</span>
                    <span className="text-xs font-medium text-muted-foreground">Ανενεργό</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Μελλοντικές επιλογές για προσαρμοσμένο περιεχόμενο. Δεν ενεργοποιείται προς το
                    παρόν.
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSettingsOpen(false)}
                className="w-full sm:w-auto"
              >
                Ακύρωση
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  setSettingsOpen(false);
                  onClose();
                }}
                className="w-full sm:w-auto"
              >
                Αποθήκευση επιλογής
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {!open && !settingsOpen && showSettings && (
        <button
          onClick={openSettings}
          className="fixed bottom-4 left-4 z-50 rounded-full border border-input bg-background px-3 py-1.5 text-xs text-stone-900 shadow-sm hover:bg-muted hover:text-primary transition-colors cursor-pointer"
          aria-label="Ρυθμίσεις cookies"
        >
          Ρυθμίσεις cookies
        </button>
      )}
    </>
  );
}
