import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  CalendarClock,
  Clock,
  Copy,
  Download,
  Loader2,
  RefreshCw,
  Sparkles,
  Users,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/markdown";
import { HistoryPanel } from "@/components/history-panel";
import { generateShiftPlan } from "@/lib/capaciti.functions";
import { DEMO_SHIFT } from "@/lib/demo-scenarios";
import { useMailSettings } from "@/lib/mail-settings";
import { deleteGeneration, listGenerations, saveGeneration, type Generation } from "@/lib/history";

export function TabShift() {
  const run = useServerFn(generateShiftPlan);
  const { geminiApiKey } = useMailSettings();
  const [tickets, setTickets] = useState("");
  const [shiftHours, setShiftHours] = useState(6);
  const [technicians, setTechnicians] = useState(3);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Generation[]>([]);
  const [activeId, setActiveId] = useState<string | undefined>(undefined);

  const refresh = () => {
    listGenerations("shift")
      .then(setItems)
      .catch(() => undefined);
  };
  useEffect(refresh, []);

  async function handleGenerate() {
    if (tickets.trim().length < 5) {
      toast.error("Please enter at least one support ticket or task.");
      return;
    }
    setLoading(true);
    try {
      const { text } = await run({ data: { tickets, shiftHours, technicians, geminiApiKey } });
      setOutput(text);
      const saved = await saveGeneration({
        kind: "shift",
        title: `${shiftHours}h Shift · ${technicians} Techs · ${new Date().toLocaleDateString()}`,
        input: { shiftHours, technicians },
        output: text,
      });
      setActiveId(saved.id);
      refresh();
      toast.success("Shift schedule & ITIL triage generated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  function loadDemo() {
    setTickets(DEMO_SHIFT.tickets);
    setShiftHours(DEMO_SHIFT.shiftHours);
    setTechnicians(DEMO_SHIFT.technicians);
    toast.success("Demo scenario loaded: 5-ticket support queue.");
  }

  function handleDownload() {
    if (!output) return;
    const blob = new Blob([output], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shift-plan-${shiftHours}h-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded shift plan markdown file.");
  }

  const ticketLines = tickets.split("\n").filter((l) => l.trim().length > 0);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-6">
        {/* Input Section */}
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground">
                Support Queue Triage &amp; Shift Planner
              </h2>
              <p className="text-xs text-muted-foreground">
                AI Task Planner applying ITIL P1–P4 severity triage, 15-minute emergency buffers,
                and automation tips
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

          <div className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="tickets" className="text-xs font-semibold text-foreground">
                  Support Tickets / Backlog Queue (One per line)
                </Label>
                {ticketLines.length > 0 && (
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {ticketLines.length} ticket{ticketLines.length > 1 ? "s" : ""} queued
                  </span>
                )}
              </div>
              <Textarea
                id="tickets"
                rows={7}
                className="font-mono text-xs leading-relaxed bg-background/50"
                value={tickets}
                onChange={(e) => setTickets(e.target.value)}
                placeholder={
                  "1. Core network switch overheating\n2. Candidate forgot GitHub password & 2FA\n3. Boardroom projector fix\n4. Staff room printer toner replacement\n5. Python lab installation for new cohort"
                }
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2 rounded-lg border border-border bg-muted/20 p-4">
              {/* Shift Duration Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-3.5 text-primary" />
                    <Label className="text-xs font-semibold text-foreground">Shift Duration</Label>
                  </div>
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                    {shiftHours} Hours
                  </span>
                </div>
                <Slider
                  min={2}
                  max={8}
                  step={1}
                  value={[shiftHours]}
                  onValueChange={(v) => setShiftHours(v[0] ?? 6)}
                  className="py-1 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                  <span>2h (Half shift)</span>
                  <span>4h</span>
                  <span>6h</span>
                  <span>8h (Full shift)</span>
                </div>
              </div>

              {/* Technicians Input */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Users className="size-3.5 text-primary" />
                  <Label htmlFor="techs" className="text-xs font-semibold text-foreground">
                    Technicians on Shift
                  </Label>
                </div>
                <Input
                  id="techs"
                  type="number"
                  min={1}
                  max={10}
                  value={technicians}
                  onChange={(e) =>
                    setTechnicians(Math.min(10, Math.max(1, Number(e.target.value))))
                  }
                  className="text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  Schedules concurrent technicians with automatic 15-minute emergency buffer
                  windows.
                </p>
              </div>
            </div>
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
              Prioritise &amp; Plan Shift
            </Button>
            <span className="text-[11px] text-muted-foreground">
              Calculates ITIL P1–P4 triage table, hourly schedule with buffer &amp; automation tip
            </span>
          </div>
        </section>

        {/* Output Section */}
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground">
                Shift Plan &amp; ITIL Triage Schedule
              </h2>
              <p className="text-xs text-muted-foreground">
                Actionable timeline mapping technicians against categorized SLA targets
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!output}
                onClick={() => {
                  navigator.clipboard.writeText(output);
                  toast.success("Markdown copied to clipboard.");
                }}
                className="text-xs"
              >
                <Copy className="size-3.5" /> Copy Markdown
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!output}
                onClick={handleDownload}
                className="text-xs"
              >
                <Download className="size-3.5" /> Download .md
              </Button>
            </div>
          </div>

          {output ? (
            <div className="mt-5 rounded-lg border border-border bg-background/50 p-4 sm:p-6">
              <Markdown content={output} />
            </div>
          ) : (
            <div className="mt-8 mb-4 flex flex-col items-center justify-center text-center text-muted-foreground">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
                <CalendarClock className="size-6" />
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">
                No shift plan generated yet
              </p>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                Enter backlog tickets or click &ldquo;Load Demo Scenario&rdquo; above to generate an
                ITIL triage matrix and hourly schedule.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* History Sidebar */}
      <aside className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold tracking-[0.14em] uppercase text-foreground">
              Saved Shift Plans
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
                setOutput(item.output);
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
