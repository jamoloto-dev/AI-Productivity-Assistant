import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Eye,
  EyeOff,
  HelpCircle,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getEmailDispatchStatus } from "@/lib/capaciti.functions";
import { EMAIL_RE, useMailSettings } from "@/lib/mail-settings";

export function MailSettings() {
  const status = useServerFn(getEmailDispatchStatus);
  const {
    senderEmail,
    setSenderEmail,
    appPassword,
    setAppPassword,
    geminiApiKey,
    setGeminiApiKey,
  } = useMailSettings();
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    status({})
      .then((s) => setConfigured(s.configured))
      .catch(() => setConfigured(false));
  }, [status]);

  const senderInvalid = senderEmail.length > 0 && !EMAIL_RE.test(senderEmail);
  const passwordInvalid = appPassword.length > 0 && appPassword.replace(/\s/g, "").length !== 16;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-4">
        {/* API Key / Settings Card */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="size-4 text-primary" />
              <h2 className="text-xs font-bold tracking-[0.14em] text-foreground uppercase">
                API Key &amp; Settings
              </h2>
            </div>
            {geminiApiKey ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <Sparkles className="size-2.5" /> Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Built-in Model
              </span>
            )}
          </div>

          <div className="mt-3 space-y-1.5">
            <Label htmlFor="gemini-api-key" className="text-xs font-semibold text-foreground">
              Gemini API Key
            </Label>
            <div className="relative">
              <Input
                id="gemini-api-key"
                type={showKey ? "text" : "password"}
                autoComplete="off"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="Enter your Gemini API key"
                className="pr-10 text-xs font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                aria-label={showKey ? "Hide API key" : "Show API key"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Optionally provide your own Google Gemini API key to power live AI generations
              directly.
            </p>
          </div>
        </div>

        {/* Mail Server Credentials Card */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-primary" />
            <h2 className="text-xs font-bold tracking-[0.14em] text-foreground uppercase">
              Mail Server Credentials
            </h2>
          </div>

          <div className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="sender-email" className="text-xs font-semibold text-foreground">
                Helpdesk Sender Email
              </Label>
              <Input
                id="sender-email"
                type="email"
                autoComplete="off"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="support@capaciti.org.za"
                aria-invalid={senderInvalid}
                className={senderInvalid ? "border-destructive text-xs" : "text-xs"}
              />
              {senderInvalid && (
                <p className="text-[11px] text-destructive">Enter a valid email address.</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="app-password" className="text-xs font-semibold text-foreground">
                  Gmail App Password
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Gmail App Password info"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <HelpCircle className="size-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[270px] text-xs leading-relaxed">
                    Use a Google Account App Password, not your standard login password.
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="relative">
                <Input
                  id="app-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={appPassword}
                  onChange={(e) => setAppPassword(e.target.value)}
                  placeholder="16-character app password"
                  aria-invalid={passwordInvalid}
                  className={`pr-10 text-xs font-mono ${passwordInvalid ? "border-destructive" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {passwordInvalid && (
                <p className="text-[11px] text-destructive">
                  App passwords are 16 characters (e.g. abcd efgh ijkl mnop).
                </p>
              )}
            </div>
          </div>

          {configured === false && (
            <div className="mt-3 flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
              <p>
                <span className="font-semibold">Helpdesk Ready:</span> Sender credentials will be
                verified on each dispatch request.
              </p>
            </div>
          )}
          {configured === true && (
            <div className="mt-3 flex gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-[11px] text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
              <p>Verified sending domain active. Direct delivery enabled.</p>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
