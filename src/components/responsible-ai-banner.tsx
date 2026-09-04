import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

export function ResponsibleAIBanner() {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-xs">
      <div className="flex items-center gap-2 font-semibold text-destructive">
        <ShieldAlert className="size-4 shrink-0" />
        <span className="tracking-wider uppercase">Responsible AI &amp; Data Security</span>
      </div>
      <div className="mt-3 space-y-2.5 leading-relaxed text-foreground/90">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
          <p>
            <strong className="font-semibold text-foreground">Security Notice:</strong> Never input
            student/staff passwords, API keys, or personal identifiers (PII).
          </p>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <p>
            <strong className="font-semibold text-foreground">Human-in-the-Loop Policy:</strong>{" "}
            Review and edit all AI drafts before external delivery.
          </p>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <p>
            <strong className="font-semibold text-foreground">Verification:</strong> Always test
            generated terminal commands in a sandbox first.
          </p>
        </div>
      </div>
    </div>
  );
}
