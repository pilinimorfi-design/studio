import { useState, useEffect } from "react";

export const COOKIE_CONSENT_KEY = "pilinimorfi_cookie_consent";

export function hasCookieConsent(): boolean {
  try {
    return sessionStorage.getItem(COOKIE_CONSENT_KEY) === "true";
  } catch {
    return false;
  }
}

export function setCookieConsent(accepted: boolean): void {
  try {
    if (accepted) {
      sessionStorage.setItem(COOKIE_CONSENT_KEY, "true");
    } else {
      sessionStorage.removeItem(COOKIE_CONSENT_KEY);
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("cookie-consent-changed"));
    }
  } catch {
    // ignore
  }
}

export function useCookieConsent(): [boolean, (accepted: boolean) => void] {
  const [accepted, setAcceptedState] = useState<boolean>(() => hasCookieConsent());

  useEffect(() => {
    const handleConsentChange = () => {
      setAcceptedState(hasCookieConsent());
    };
    window.addEventListener("cookie-consent-changed", handleConsentChange);
    window.addEventListener("storage", handleConsentChange);
    return () => {
      window.removeEventListener("cookie-consent-changed", handleConsentChange);
      window.removeEventListener("storage", handleConsentChange);
    };
  }, []);

  const updateConsent = (val: boolean) => {
    setCookieConsent(val);
    setAcceptedState(val);
  };

  return [accepted, updateConsent];
}

type ConsentCallback = () => void;

interface ConsentModalRequest {
  isOpen: boolean;
  onAccepted?: ConsentCallback;
}

let currentModalState: ConsentModalRequest = { isOpen: false };
const modalListeners = new Set<() => void>();

function notifyModalListeners() {
  modalListeners.forEach((listener) => listener());
}

export function requestCookieConsent(onAccepted?: ConsentCallback): boolean {
  if (hasCookieConsent()) {
    onAccepted?.();
    return true;
  }
  currentModalState = {
    isOpen: true,
    onAccepted,
  };
  notifyModalListeners();
  return false;
}

export function closeCookieConsentModal() {
  currentModalState = { isOpen: false, onAccepted: undefined };
  notifyModalListeners();
}

export function acceptCookieConsentModal() {
  const cb = currentModalState.onAccepted;
  setCookieConsent(true);
  currentModalState = { isOpen: false, onAccepted: undefined };
  notifyModalListeners();
  cb?.();
}

export function useConsentModal() {
  const [modalState, setModalState] = useState<ConsentModalRequest>(currentModalState);

  useEffect(() => {
    const update = () => setModalState({ ...currentModalState });
    modalListeners.add(update);
    return () => {
      modalListeners.delete(update);
    };
  }, []);

  return {
    isOpen: modalState.isOpen,
    openModal: (onAccepted?: ConsentCallback) => requestCookieConsent(onAccepted),
    closeModal: closeCookieConsentModal,
    acceptModal: acceptCookieConsentModal,
  };
}
