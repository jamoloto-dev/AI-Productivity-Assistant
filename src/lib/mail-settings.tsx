import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type MailSettings = {
  senderEmail: string;
  setSenderEmail: (v: string) => void;
  /** Kept in memory only for the current tab session — never persisted to disk or unencrypted storage. */
  appPassword: string;
  setAppPassword: (v: string) => void;
  clearAppPassword: () => void;
  geminiApiKey: string;
  setGeminiApiKey: (v: string) => void;
  clearGeminiApiKey: () => void;
};

const MailSettingsContext = createContext<MailSettings | null>(null);

const SENDER_KEY = "capaciti.senderEmail";
const GEMINI_KEY = "capaciti.geminiApiKey";

export function MailSettingsProvider({ children }: { children: ReactNode }) {
  const [senderEmail, setSenderEmail] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");

  useEffect(() => {
    try {
      const storedSender = window.localStorage.getItem(SENDER_KEY);
      if (storedSender) setSenderEmail(storedSender);
      const storedGemini = window.localStorage.getItem(GEMINI_KEY);
      if (storedGemini) setGeminiApiKey(storedGemini);
    } catch {
      // ignore storage access errors
    }
  }, []);

  useEffect(() => {
    try {
      if (senderEmail) window.localStorage.setItem(SENDER_KEY, senderEmail);
      else window.localStorage.removeItem(SENDER_KEY);
    } catch {
      // ignore storage access errors
    }
  }, [senderEmail]);

  useEffect(() => {
    try {
      if (geminiApiKey) window.localStorage.setItem(GEMINI_KEY, geminiApiKey);
      else window.localStorage.removeItem(GEMINI_KEY);
    } catch {
      // ignore storage access errors
    }
  }, [geminiApiKey]);

  const value = useMemo<MailSettings>(
    () => ({
      senderEmail,
      setSenderEmail,
      appPassword,
      setAppPassword,
      clearAppPassword: () => setAppPassword(""),
      geminiApiKey,
      setGeminiApiKey,
      clearGeminiApiKey: () => setGeminiApiKey(""),
    }),
    [senderEmail, appPassword, geminiApiKey],
  );

  return <MailSettingsContext.Provider value={value}>{children}</MailSettingsContext.Provider>;
}

export function useMailSettings() {
  const ctx = useContext(MailSettingsContext);
  if (!ctx) throw new Error("useMailSettings must be used inside MailSettingsProvider");
  return ctx;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
