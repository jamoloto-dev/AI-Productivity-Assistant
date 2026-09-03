import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type MailSettings = {
  senderEmail: string;
  setSenderEmail: (v: string) => void;
  /** Kept in memory only for the current tab session — never persisted or sent to storage. */
  appPassword: string;
  setAppPassword: (v: string) => void;
  clearAppPassword: () => void;
};

const MailSettingsContext = createContext<MailSettings | null>(null);

const SENDER_KEY = "capaciti.senderEmail";

export function MailSettingsProvider({ children }: { children: ReactNode }) {
  const [senderEmail, setSenderEmail] = useState("");
  const [appPassword, setAppPassword] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem(SENDER_KEY);
    if (stored) setSenderEmail(stored);
  }, []);

  useEffect(() => {
    // Only the non-sensitive sender address is remembered. The app password never leaves memory.
    if (senderEmail) window.localStorage.setItem(SENDER_KEY, senderEmail);
    else window.localStorage.removeItem(SENDER_KEY);
  }, [senderEmail]);

  const value = useMemo<MailSettings>(
    () => ({
      senderEmail,
      setSenderEmail,
      appPassword,
      setAppPassword,
      clearAppPassword: () => setAppPassword(""),
    }),
    [senderEmail, appPassword],
  );

  return <MailSettingsContext.Provider value={value}>{children}</MailSettingsContext.Provider>;
}

export function useMailSettings() {
  const ctx = useContext(MailSettingsContext);
  if (!ctx) throw new Error("useMailSettings must be used inside MailSettingsProvider");
  return ctx;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
