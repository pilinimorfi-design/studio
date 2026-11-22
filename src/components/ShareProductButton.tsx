import { useState } from "react";
import { Check, Gift } from "lucide-react";

type ShareProductButtonProps = {
  product: { title: string; handle: string };
  className?: string;
};

export function ShareProductButton({ product, className }: ShareProductButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const url = `${window.location.origin}/product/${product.handle}`;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile && navigator.share) {
      navigator.share({ title: product.title, url }).catch(() => {
        // User cancelled or sharing failed; ignore silently.
      });
      return;
    }

    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleShare}
      className={`relative z-10 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer mb-1.5 ${className ?? ""}`}
    >
      {copied ? <Check className="w-4 h-4" /> : <Gift className="w-4 h-4" />}
      {copied ? "Ο σύνδεσμος αντιγράφηκε!" : "Πρότεινέ το σε κάποιον"}
    </button>
  );
}
