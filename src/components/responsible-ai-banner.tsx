import { ShieldAlert } from "lucide-react";

export function ResponsibleAIBanner() {
  return (
    <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4">
      <div className="flex items-center gap-2 text-destructive">
        <ShieldAlert className="size-4" />
        <h2 className="text-xs font-semibold tracking-[0.16em] uppercase">Responsible AI</h2>
      </div>
      <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
        <li>
          <span className="font-semibold text-foreground">Human-in-the-Loop:</span> Review all
          drafts before external delivery.
        </li>
        <li>
          <span className="font-semibold text-foreground">Zero PII Policy:</span> Avoid entering
          user credentials or private keys.
        </li>
        <li>Sanitise logs and ticket text before pasting them into this tool.</li>
        <li>AI can be wrong. You remain accountable for what CAPACITI communicates.</li>
      </ul>
    </div>
  );
}
