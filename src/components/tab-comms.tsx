import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  CheckCircle2,
  Copy,
  Inbox,
  Loader2,
  MailCheck,
  RefreshCw,
  Rocket,
  Sparkles,
  TriangleAlert,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HistoryPanel } from "@/components/history-panel";
import {
  AUDIENCES,
  COMMUNICATION_TYPES,
  dispatchIncidentEmail,
  generateComms,
  TONES,
} from "@/lib/capaciti.functions";
import { DEMO_COMMS } from "@/lib/demo-scenarios";
import { EMAIL_RE, useMailSettings } from "@/lib/mail-settings";
import {
  deleteGeneration,
  listGenerations,
  saveGeneration,
  updateGenerationOutput,
  type Generation,
} from "@/lib/history";

function splitSubject(text: string): { subject: string; body: string } {
  const match = text.match(/^\s*Subject:\s*(.+)\n+([\s\S]*)$/i);
  if (match) return { subject: match[1]!.trim(), body: match[2]!.trim() };
  return { subject: "", body: text };
}

type DispatchAuditRecord = {
  id: string;
  recipient: string;
  sender: string;
  subject: string;
  timestamp: string;
};

export function TabComms() {
  const run = useServerFn(generateComms);
  const dispatch = useServerFn(dispatchIncidentEmail);
  const { senderEmail, appPassword, geminiApiKey } = useMailSettings();

  const [audience, setAudience] = useState<(typeof AUDIENCES)[number]>(
    "All CAPACITI Staff & Candidates",
  );
  const [communicationType, setCommunicationType] = useState<(typeof COMMUNICATION_TYPES)[number]>(
    "Urgent System Outage Alert",
  );
  const [system, setSystem] = useState("");
  const [tone, setTone] = useState<(typeof TONES)[number]>("Urgent & Direct");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [details, setDetails] = useState("");
  const [subject, setSubject] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [dispatchError, setDispatchError] = useState("");
  const [items, setItems] = useState<Generation[]>([]);
  const [activeId, setActiveId] = useState<string | undefined>(undefined);
  const [dispatches, setDispatches] = useState<DispatchAuditRecord[]>([]);
  const streamTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = () => {
    listGenerations("comms")
      .then(setItems)
      .catch(() => undefined);
  };
  useEffect(refresh, []);
  useEffect(
    () => () => {
      if (streamTimer.current) clearInterval(streamTimer.current);
    },
    [],
  );

  const requesterInvalid = requesterEmail.length > 0 && !EMAIL_RE.test(requesterEmail);

  function loadDemo() {
    setRequesterEmail(DEMO_COMMS.requesterEmail);
    setAudience(DEMO_COMMS.audience);
    setCommunicationType(DEMO_COMMS.communicationType);
    setSystem(DEMO_COMMS.systemAffected);
    setTone(DEMO_COMMS.tone);
    setDetails(DEMO_COMMS.keyDetails);
    setSubject(DEMO_COMMS.subject);
    toast.success("Demo scenario loaded: Campus Wi-Fi & LMS Authentication Outage.");
  }

  function streamInto(text: string) {
    if (streamTimer.current) clearInterval(streamTimer.current);
    const step = Math.max(4, Math.round(text.length / 100));
    let i = 0;
    setDraft("");
    streamTimer.current = setInterval(() => {
      i = Math.min(text.length, i + step);
      setDraft(text.slice(0, i));
      if (i >= text.length && streamTimer.current) {
        clearInterval(streamTimer.current);
        streamTimer.current = null;
      }
    }, 12);
  }

  async function handleGenerate() {
    if (!system.trim()) {
      toast.error("System Affected field is required.");
      return;
    }
    setLoading(true);
    setDispatchError("");
    try {
      const { text } = await run({
        data: {
          requesterEmail,
          audience,
          communicationType,
          system,
          tone,
          details,
          geminiApiKey,
        },
      });
      const parsed = splitSubject(text);
      if (parsed.subject) {
        setSubject(parsed.subject);
      } else if (!subject) {
        setSubject(`${communicationType.toUpperCase()}: ${system}`);
      }
      streamInto(parsed.body);
      const saved = await saveGeneration({
        kind: "comms",
        title: `${communicationType} · ${system}`,
        input: {
          audience,
          communicationType,
          system,
          tone,
          details,
          requesterEmail,
          subject: parsed.subject || subject,
        },
        output: parsed.body,
      });
      setActiveId(saved.id);
      refresh();
      toast.success("AI draft generated successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveEdits() {
    if (!activeId) return;
    try {
      await updateGenerationOutput(activeId, draft);
      toast.success("Edits saved to history.");
      refresh();
    } catch {
      toast.error("Could not save edits.");
    }
  }

  async function handleSend() {
    setDispatchError("");

    // 1. Verifies requester email
    if (!requesterEmail.trim()) {
      const msg = "Requester Email is required to dispatch.";
      setDispatchError(msg);
      toast.error(msg);
      return;
    }
    if (!EMAIL_RE.test(requesterEmail)) {
      const msg = "Please provide a valid Requester Email address.";
      setDispatchError(msg);
      toast.error(msg);
      return;
    }

    // 2. Verifies sender credentials
    if (!senderEmail.trim()) {
      const msg = "Helpdesk Sender Email is required. Configure it in Mail Server Credentials.";
      setDispatchError(msg);
      toast.error(msg);
      return;
    }
    if (!EMAIL_RE.test(senderEmail)) {
      const msg = "The configured Helpdesk Sender Email in settings is invalid.";
      setDispatchError(msg);
      toast.error(msg);
      return;
    }

    // 3. Verifies subject and body
    if (!subject.trim()) {
      const msg = "Subject Line cannot be empty.";
      setDispatchError(msg);
      toast.error(msg);
      return;
    }
    if (!draft.trim()) {
      const msg = "Email body message is empty. Generate or type a message before sending.";
      setDispatchError(msg);
      toast.error(msg);
      return;
    }

    setSending(true);
    try {
      const result = await dispatch({
        data: {
          to: requesterEmail,
          subject,
          body: draft,
          senderEmail,
          appPassword,
        },
      });

      // Shows an immediate green success toast with the recipient address when dispatched
      toast.success(`Email successfully dispatched to ${result.to}!`, {
        description: `Dispatched from ${senderEmail} • Official IT Helpdesk Notice`,
        duration: 5000,
      });

      setDispatches((prev) => [
        {
          id: `disp-${Date.now()}`,
          recipient: result.to,
          sender: senderEmail,
          subject,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
        ...prev.slice(0, 4),
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Dispatch failed.";
      setDispatchError(message);
      toast.error(message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-6">
        {/* Manual Input Form */}
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground">
                IT Incident Communications &amp; Direct Dispatch
              </h2>
              <p className="text-xs text-muted-foreground">
                Smart Email Generator for candidate advisories, outage alerts, and onboarding
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadDemo}
              className="border-primary/30 text-primary hover:bg-primary/10"
            >
              <Wand2 className="size-3.5 text-primary" /> Load Demo Scenario
            </Button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Requester Email */}
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <Label htmlFor="requester-email" className="text-xs font-semibold text-foreground">
                Requester Email
              </Label>
              <Input
                id="requester-email"
                type="email"
                value={requesterEmail}
                onChange={(e) => setRequesterEmail(e.target.value)}
                placeholder="candidate.demo@capaciti.org.za"
                aria-invalid={requesterInvalid}
                className={requesterInvalid ? "border-destructive text-xs" : "text-xs"}
              />
              {requesterInvalid && (
                <p className="text-[11px] text-destructive">Enter a valid email address.</p>
              )}
            </div>

            {/* Target Audience */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Target Audience</Label>
              <Select
                value={audience}
                onValueChange={(v) => setAudience(v as (typeof AUDIENCES)[number])}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCES.map((a) => (
                    <SelectItem key={a} value={a} className="text-xs">
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Communication Type */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Communication Type</Label>
              <Select
                value={communicationType}
                onValueChange={(v) =>
                  setCommunicationType(v as (typeof COMMUNICATION_TYPES)[number])
                }
              >
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMUNICATION_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* System Affected */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="system" className="text-xs font-semibold text-foreground">
                System Affected
              </Label>
              <Input
                id="system"
                value={system}
                onChange={(e) => setSystem(e.target.value)}
                placeholder="e.g. Campus Wi-Fi & LMS Authentication Down"
                className="text-xs"
              />
            </div>

            {/* Tone Dropdown */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Tone</Label>
              <Select value={tone} onValueChange={(v) => setTone(v as (typeof TONES)[number])}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Incident Details / Workarounds */}
          <div className="mt-4 space-y-1.5">
            <Label htmlFor="details" className="text-xs font-semibold text-foreground">
              Incident Details / Workarounds
            </Label>
            <Textarea
              id="details"
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Root cause notes, impacted labs, alternate SSID or offline packets, and ETA..."
              className="text-xs leading-relaxed"
            />
          </div>

          {/* Bold Red Generate Button */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <Button
              className="bg-primary text-primary-foreground font-bold shadow-md hover:bg-primary/90"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              Generate Communication
            </Button>
            <span className="text-[11px] text-muted-foreground">
              Drafts Subject, greeting, issue details, workaround, ETA &amp; sign-off
            </span>
          </div>
        </section>

        {/* Review & Dispatch Section */}
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground">
                Review &amp; Dispatch Section
              </h2>
              <p className="text-xs text-muted-foreground">
                Inspect, modify, and verify before delivering to candidates or faculty
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!draft}
                onClick={() => {
                  navigator.clipboard.writeText(`Subject: ${subject}\n\n${draft}`);
                  toast.success("Draft copied to clipboard.");
                }}
                className="text-xs"
              >
                <Copy className="size-3.5" /> Copy Text
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={!activeId}
                onClick={handleSaveEdits}
                className="text-xs"
              >
                Save Edits
              </Button>
            </div>
          </div>

          {/* Pre-filled Editable Subject Line */}
          <div className="mt-5 space-y-1.5">
            <Label htmlFor="subject-line" className="text-xs font-semibold text-foreground">
              Subject Line (Pre-filled with Incident Summary)
            </Label>
            <Input
              id="subject-line"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject line pre-fills from incident summary..."
              className="font-medium text-xs sm:text-sm"
            />
          </div>

          {/* Editable Text Area for generated email body */}
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-body" className="text-xs font-semibold text-foreground">
                Message Body (Technician Review &amp; Edits)
              </Label>
              {draft && (
                <span className="text-[10px] text-muted-foreground font-mono">
                  {draft.split(/\s+/).filter(Boolean).length} words
                </span>
              )}
            </div>
            <Textarea
              id="email-body"
              rows={12}
              className="font-mono text-xs leading-relaxed bg-background/50"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Your generated email draft with professional greeting, issue explanation, actionable workaround, resolution ETA, and IT Helpdesk sign-off will appear here..."
            />
          </div>

          {dispatchError && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              <span>{dispatchError}</span>
            </div>
          )}

          {/* Red Primary Button: Send Email to Requester */}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border pt-4">
            <Button
              className="w-full sm:w-auto bg-primary text-primary-foreground font-bold shadow-md hover:bg-primary/90 px-6"
              onClick={handleSend}
              disabled={sending || !draft}
            >
              {sending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Rocket className="size-4" />
              )}
              🚀 Send Email to Requester
            </Button>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-primary" />
              <span>Human-in-the-Loop review enforced before dispatch</span>
            </div>
          </div>

          {/* Recent Dispatches Audit Log */}
          {dispatches.length > 0 && (
            <div className="mt-5 rounded-lg border border-border bg-muted/20 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <MailCheck className="size-3.5 text-emerald-600" />
                <span>Recent Dispatch Activity</span>
              </div>
              <div className="mt-2 space-y-1.5">
                {dispatches.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between text-[11px] text-muted-foreground"
                  >
                    <span className="font-mono text-foreground">{d.recipient}</span>
                    <span className="truncate max-w-[200px]">{d.subject}</span>
                    <span className="text-[10px] text-emerald-600 font-medium">
                      Delivered at {d.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Sidebar history */}
      <aside className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold tracking-[0.14em] uppercase text-foreground">
              Saved Alerts
            </h2>
            <Button variant="ghost" size="sm" onClick={refresh} className="h-7 px-2 text-xs">
              <RefreshCw className="size-3" />
            </Button>
          </div>
          <div className="mt-3">
            <HistoryPanel
              items={items}
              activeId={activeId}
              onSelect={(item) => {
                setActiveId(item.id);
                setDraft(item.output);
                const s = item.input?.["subject"];
                if (typeof s === "string" && s) setSubject(s);
                const a = item.input?.["audience"];
                if (typeof a === "string") setAudience(a as (typeof AUDIENCES)[number]);
                const c = item.input?.["communicationType"];
                if (typeof c === "string")
                  setCommunicationType(c as (typeof COMMUNICATION_TYPES)[number]);
                const r = item.input?.["requesterEmail"];
                if (typeof r === "string") setRequesterEmail(r);
              }}
              onDelete={async (id) => {
                await deleteGeneration(id);
                if (activeId === id) setActiveId(undefined);
                refresh();
              }}
            />
          </div>
        </div>
      </aside>
    </div>
  );
}
