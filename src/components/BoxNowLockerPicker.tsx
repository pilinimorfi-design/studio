import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getBoxNowPartnerId, parseBoxNowLocker, type BoxNowLocker } from "@/lib/boxnow";

const BOXNOW_WIDGET_SCRIPT = "https://widget-cdn.boxnow.gr/map-widget/client/v5.js";

interface BoxNowWidgetConfig {
  type: "popup";
  partnerId: number;
  parentElement: string;
  afterSelect: (selection: unknown) => void;
}

declare global {
  interface Window {
    _bn_map_widget_config?: BoxNowWidgetConfig;
  }
}

interface BoxNowLockerPickerProps {
  onSelect: (locker: BoxNowLocker) => void;
}

export function BoxNowLockerPicker({ onSelect }: BoxNowLockerPickerProps) {
  const onSelectRef = useRef(onSelect);
  const [scriptError, setScriptError] = useState(false);
  const partnerIdValue = import.meta.env["VITE_BOXNOW_PARTNER_ID"];
  const partnerId = getBoxNowPartnerId(partnerIdValue);
  const [selectionError, setSelectionError] = useState("");

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!partnerId) return;

    window._bn_map_widget_config = {
      type: "popup",
      partnerId,
      parentElement: "#boxnowmap",
      afterSelect: (selection) => {
        const locker = parseBoxNowLocker(selection);
        if (!locker) {
          setSelectionError("Δεν ήταν δυνατή η ανάγνωση των στοιχείων της επιλεγμένης θυρίδας.");
          return;
        }
        setSelectionError("");
        onSelectRef.current(locker);
      },
    };

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${BOXNOW_WIDGET_SCRIPT}"]`,
    );
    if (existingScript) return;

    const script = document.createElement("script");
    script.src = BOXNOW_WIDGET_SCRIPT;
    script.async = true;
    script.defer = true;
    script.dataset["boxnowWidget"] = "true";
    const handleScriptError = () => setScriptError(true);
    script.addEventListener("error", handleScriptError, { once: true });
    document.head.appendChild(script);

    return () => script.removeEventListener("error", handleScriptError);
  }, [partnerId]);

  return (
    <div id="boxnowmap" className="space-y-3">
      {!partnerId && !partnerIdValue && (
        <p role="status" className="text-sm text-muted-foreground">
          Ο χάρτης BoxNow θα ενεργοποιηθεί μόλις ρυθμιστεί το Partner ID.
        </p>
      )}
      {!partnerId && partnerIdValue && (
        <p role="alert" className="text-sm text-destructive">
          Το BoxNow Partner ID δεν είναι έγκυρο. Ελέγξτε τη ρύθμιση της εφαρμογής.
        </p>
      )}
      {scriptError && (
        <p role="alert" className="text-sm text-destructive">
          Δεν ήταν δυνατή η φόρτωση του χάρτη BoxNow. Δοκιμάστε ξανά αργότερα.
        </p>
      )}
      {selectionError && (
        <p role="alert" className="text-sm text-destructive">
          {selectionError}
        </p>
      )}
      <Button
        type="button"
        variant="outline"
        className="boxnow-map-widget-button w-full"
        disabled={!partnerId || scriptError}
      >
        <MapPin className="size-4" />
        Επιλογή BoxNow Locker στον χάρτη
      </Button>
    </div>
  );
}
