import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Loader2, Rocket, Sparkles, TriangleAlert, Wand2 } from "lucide-react";
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
import { dispatchIncidentEmail, generateComms } from "@/lib/capaciti.functions";
import { DEMO_COMMS } from "@/lib/demo-scenarios";
import { EMAIL_RE, useMailSettings } from "@/lib/mail-settings";
import {
  deleteGeneration,
  listGenerations,
  saveGeneration,
  updateGenerationOutput,
  type Generation,
} from "@/lib/history";

const AUDIENCES = ["Staff", "Candidates", "Management"] as const;
const TYPES = ["Outage", "Maintenance", "Resolution"] as const;

function splitSubject(text: string): { subject: string; body: string } {
  const match = text.match(/^\s*Subject:\s*(.+)\n+([\s\S]*)$/);
  if (match) return { subject: match[1]!.trim(), body: match[2]!.trim() };
  return { subject: "", body: text };
}

export function TabComms() {
  const run = useServerFn(generateComms);
  const dispatch = useServerFn(dispatchIncidentEmail);
  const { senderEmail } = useMailSettings();

  const [audience, setAudience] = useState<(typeof AUDIENCES)[number]>("Staff");
  const [incidentType, setIncidentType] = useState<(typeof TYPES)[number]>("Outage");
  const [system, setSystem] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [details, setDetails] = useState("");
  const [subject, setSubject] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [dispatchError, setDispatchError] = useState("");
  const [items, setItems] = useState<Generation[]>([]);
  const [activeId, setActiveId] = useState<string | undefined>(undefined);
  const streamTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = () => {
    listGenerations("comms")
      .then(setItems)
      .catch(() => undefined);
  };
  useEffect(refresh, []);
  useEffect(() => () => { if (streamTimer.current) clearInterval(streamTimer.current); }, []);

  const requesterInvalid = requesterEmail.length > 0 && !EMAIL_RE.test(requesterEmail);

  function loadDemo() {
    setAudience(DEMO_COMMS.audience);
    setIncidentType(DEMO_COMMS.incidentType);
    setSystem(DEMO_COMMS.system);
    setRequesterEmail(DEMO_COMMS.requesterEmail);
    setDetails(DEMO_COMMS.details);
    setSubject(DEMO_COMMS.subject);
    toast.success("Demo scenario loaded: Campus Wi-Fi & LMS Authentication Outage.");
  }

  function streamInto(text: string) {
    if (streamTimer.current) clearInterval(streamTimer.current);
    const step = Math.max(3, Math.round(text.length / 120));
    let i = 0;
    setDraft("");
    streamTimer.current = setInterval(() => {
      i = Math.min(text.length, i + step);
      setDraft(text.slice(0, i));
      if (i >= text.length && streamTimer.current) {
        clearInterval(streamTimer.current);
        streamTimer.current = null;
      }
    }, 16);
  }

  async function handleGenerate() {
    if (!system.trim()) {
      toast.warning("Add the affected system before generating.");
      return;
    }
    setLoading(true);
    setDispatchError("");
    try {
      const { text } = await run({ data: { audience, incidentType, system, details } });
      const parsed = splitSubject(text);
      if (parsed.subject) setSubject(parsed.subject);
      else if (!subject) setSubject(`${incidentType}: ${system}`);
      streamInto(parsed.body);
      const saved = await saveGeneration({
        kind: "comms",
        title: `${incidentType} · ${system} · ${audience}`,
        input: { audience, incidentType, system, details, requesterEmail, subject: parsed.subject },
        output: parsed.body,
      });
      setActiveId(saved.id);
      refresh();
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
      toast.success("Edits saved.");
      refresh();
    } catch {
      toast.error("Could not save edits.");
    }
  }

  async function handleSend() {
    setDispatchError("");
    if (!requesterEmail.trim() || requesterInvalid) {
      toast.warning("Add a valid requester email address before sending.");
      return;
    }
    if (!senderEmail.trim()) {
      toast.warning("Set the Helpdesk Sender Email in Mail Server & Dispatch settings first.");
      return;
    }
    if (!subject.trim() || !draft.trim()) {
      toast.warning("A subject line and message body are required.");
      return;
    }
    setSending(true);
    try {
      const result = await dispatch({ data: { to: requesterEmail, subject, body: draft } });
      toast.success(`Email sent to ${result.to}.`);
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
        <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Incident details</h2>
            <Button variant="outline" size="sm" onClick={loadDemo}>
              <Wand2 className="size-3.5" /> Load Demo Scenario
            </Button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Audience</Label>
              <Select value={audience} onValueChange={(v) => setAudience(v as typeof audience)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCES.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Incident type</Label>
              <Select
                value={incidentType}
                onValueChange={(v) => setIncidentType(v as typeof incidentType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="system">Affected system</Label>
              <Input
                id="system"
                value={system}
                onChange={(e) => setSystem(e.target.value)}
                placeholder="e.g. Microsoft 365 email"
              />
            </div>
            <div className="space-y-2 sm:col-span-2 lg:col-span-3">
              <Label htmlFor="requester">Requester Email</Label>
              <Input
                id="requester"
                type="email"
                value={requesterEmail}
                onChange={(e) => setRequesterEmail(e.target.value)}
                placeholder="candidate@capaciti.org.za"
                aria-invalid={requesterInvalid}
                className={requesterInvalid ? "border-destructive" : undefined}
              />
              {requesterInvalid && (
                <p className="text-xs text-destructive">Enter a valid email address.</p>
              )}
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Label htmlFor="details">Known details (optional)</Label>
            <Textarea
              id="details"
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Start time, scope, workaround, expected restoration..."
            />
          </div>
          <Button className="mt-4 w-full sm:w-auto" onClick={handleGenerate} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Generate Communication
          </Button>
        </section>

        <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Review &amp; Finalize Communication</h2>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!draft}
                onClick={() => {
                  navigator.clipboard.writeText(`Subject: ${subject}\n\n${draft}`);
                  toast.success("Copied to clipboard.");
                }}
              >
                <Copy className="size-3.5" /> Copy
              </Button>
              <Button variant="secondary" size="sm" disabled={!activeId} onClick={handleSaveEdits}>
                Save edits
              </Button>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="subject">Subject Line</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject line is pre-filled from the incident"
            />
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="draft-body">Message body</Label>
            <Textarea
              id="draft-body"
              className="min-h-[300px] font-mono text-sm"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Your generated email will stream in here, ready to edit before sending."
            />
          </div>

          {dispatchError && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
              <span>{dispatchError}</span>
            </div>
          )}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button className="w-full sm:w-auto" onClick={handleSend} disabled={sending || !draft}>
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />}
              🚀 Send Email to Requester
            </Button>
            <p className="text-xs text-muted-foreground">
              Nothing is sent until you press send, and a human review is required first.
            </p>
          </div>
        </section>
      </div>

      <aside className="space-y-3 rounded-xl border border-border bg-card p-4 sm:p-5">
        <h2 className="text-xs font-semibold tracking-[0.16em] uppercase">Saved alerts</h2>
        <HistoryPanel
          items={items}
          activeId={activeId}
          onSelect={(item) => {
            setActiveId(item.id);
            setDraft(item.output);
            const s = item.input?.["subject"];
            if (typeof s === "string" && s) setSubject(s);
          }}
          onDelete={async (id) => {
            await deleteGeneration(id);
            if (activeId === id) setActiveId(undefined);
            refresh();
          }}
        />
      </aside>
    </div>
  );
}
