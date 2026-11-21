"use client";

import { useState } from "react";
import { submitDeviceReview } from "@/lib/reviews";
import { useDeviceId } from "@/hooks/useDeviceId";
import { StarRatingPicker } from "@/components/ReviewStars";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export function ReviewModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const deviceId = useDeviceId();
  const [submitting, setSubmitting] = useState(false);
  const [rated, setRated] = useState(false);

  const handleRate = async (rating: number) => {
    if (!deviceId) return;
    setSubmitting(true);
    try {
      await submitDeviceReview({ data: { deviceId, rating } });
      setRated(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="font-display text-xl">Αξιολογήστε μας</DialogTitle>
        <DialogDescription className="mt-2 text-sm text-muted-foreground">
          Πως σας άρεσε η εμπειρία σας στο Πήλινη Μορφή;
        </DialogDescription>
        <div className="mt-6 flex flex-col items-center gap-3">
          <StarRatingPicker value={null} onChange={handleRate} disabled={submitting || rated} />
          {submitting && <p className="text-xs text-muted-foreground">Αποθήκευση…</p>}
          {rated && (
            <p className="text-xs font-medium text-primary">Ευχαριστούμε για την ψήφό σας!</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
