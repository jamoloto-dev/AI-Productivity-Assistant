import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { HelpCircle, Lock, Mail, ShieldCheck, TriangleAlert } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getEmailDispatchStatus } from "@/lib/capaciti.functions";
import { EMAIL_RE, useMailSettings } from "@/lib/mail-settings";

export function MailSettings() {
  const status = useServerFn(getEmailDispatchStatus);
  const { senderEmail, setSenderEmail, appPassword, setAppPassword } = useMailSettings();
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    status({})
      .then((s) => setConfigured(s.configured))
      .catch(() => setConfigured(false));
  }, [status]);

  const senderInvalid = senderEmail.length > 0 && !EMAIL_RE.test(senderEmail);
  const passwordInvalid = appPassword.length > 0 && appPassword.replace(/\s/g, "").length !== 16;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="rounded-xl border border-border bg-card/60 p-4">
        <div className="flex items-center gap-2">
          <Mail className="size-4 text-primary" />
          <h2 className="text-xs font-semibold tracking-[0.16em] uppercase">
            Mail Server &amp; Dispatch
          </h2>
        </div>

        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="sender-email" className="text-xs">
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
              className={senderInvalid ? "border-destructive" : undefined}
            />
            {senderInvalid && (
              <p className="text-[11px] text-destructive">Enter a valid email address.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="app-password" className="text-xs">
                Gmail App Password
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="What is a Google App Password?"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <HelpCircle className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[260px] text-xs leading-relaxed">
                  A Google App Password is a 16-character code generated in your Google Account
                  (Security → 2-Step Verification → App passwords). It lets one app sign in to
                  Gmail without your real password and can be revoked at any time. It is still a
                  live credential — this app keeps it in memory only and never stores or transmits
                  it.
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="app-password"
              type="password"
              autoComplete="new-password"
              value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)}
              placeholder="16-character app password"
              aria-invalid={passwordInvalid}
              className={passwordInvalid ? "border-destructive" : undefined}
            />
            {passwordInvalid && (
              <p className="text-[11px] text-destructive">
                App passwords are exactly 16 characters.
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-2 rounded-lg border border-border bg-muted/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
          <Lock className="mt-0.5 size-3.5 shrink-0" />
          <p>
            Nothing typed here is stored or sent anywhere. Real delivery runs server-side through a
            verified sending domain, so Gmail credentials are never used from the browser.
          </p>
        </div>

        {configured === false && (
          <div className="mt-3 flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-[11px] leading-relaxed text-amber-600 dark:text-amber-400">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
            <p>
              <span className="font-semibold">Setup required:</span> no verified sending domain is
              connected yet, so “Send Email to Requester” will be blocked. Drafts, editing and
              copy-out keep working.
            </p>
          </div>
        )}
        {configured === true && (
          <div className="mt-3 flex gap-2 rounded-lg border border-primary/40 bg-primary/10 p-3 text-[11px] text-primary">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
            <p>Verified sending domain connected. Dispatch is live.</p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
