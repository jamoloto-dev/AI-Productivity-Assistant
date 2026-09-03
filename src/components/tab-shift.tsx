import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/markdown";
import { HistoryPanel } from "@/components/history-panel";
import { generateShiftPlan } from "@/lib/capaciti.functions";
import {
  deleteGeneration,
  listGenerations,
  saveGeneration,
  type Generation,
} from "@/lib/history";

export function TabShift() {
  const run = useServerFn(generateShiftPlan);
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
      toast.error("Add at least one ticket.");
      return;
    }
    setLoading(true);
    try {
      const { text } = await run({ data: { tickets, shiftHours, technicians } });
      setOutput(text);
      const saved = await saveGeneration({
        kind: "shift",
        title: `${shiftHours}h shift · ${technicians} tech · ${new Date().toLocaleDateString()}`,
        input: { shiftHours, technicians },
        output: text,
      });
      setActiveId(saved.id);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Queue &amp; shift setup</h2>
          <div className="mt-4 space-y-2">
            <Label htmlFor="tickets">Support tickets (one per line)</Label>
            <Textarea
              id="tickets"
              rows={9}
              className="font-mono text-xs"
              value={tickets}
              onChange={(e) => setTickets(e.target.value)}
              placeholder={"Laptop won't boot - candidate cohort 12\nVPN down for finance team\nPrinter offline in reception"}
            />
          </div>
          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Shift duration</Label>
                <span className="text-sm font-semibold text-primary">{shiftHours} hours</span>
              </div>
              <Slider
                min={2}
                max={8}
                step={1}
                value={[shiftHours]}
                onValueChange={(v) => setShiftHours(v[0] ?? 6)}
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>2h</span>
                <span>8h</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="techs">Technicians on shift</Label>
              <Input
                id="techs"
                type="number"
                min={1}
                max={20}
                value={technicians}
                onChange={(e) => setTechnicians(Math.min(20, Math.max(1, Number(e.target.value))))}
              />
            </div>
          </div>
          <Button className="mt-5" onClick={handleGenerate} disabled={loading}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Prioritise &amp; plan shift
          </Button>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">ITIL triage &amp; hourly schedule</h2>
            <Button
              variant="outline"
              size="sm"
              disabled={!output}
              onClick={() => {
                navigator.clipboard.writeText(output);
                toast.success("Markdown copied.");
              }}
            >
              <Copy className="size-3.5" /> Copy Markdown
            </Button>
          </div>
          {output ? (
            <div className="mt-3">
              <Markdown content={output} />
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              P1–P4 classification and an hour-by-hour technician plan will appear here.
            </p>
          )}
        </section>
      </div>

      <aside className="space-y-3 rounded-xl border border-border bg-card p-5">
        <h2 className="text-xs font-semibold tracking-[0.16em] uppercase">Saved shift plans</h2>
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
      </aside>
    </div>
  );
}
