import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Loader2, Sparkles } from "lucide-react";
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
import { generateComms } from "@/lib/capaciti.functions";
import {
  deleteGeneration,
  listGenerations,
  saveGeneration,
  updateGenerationOutput,
  type Generation,
} from "@/lib/history";

const AUDIENCES = ["Staff", "Candidates", "Management"] as const;
const TYPES = ["Outage", "Maintenance", "Resolution"] as const;

export function TabComms() {
  const run = useServerFn(generateComms);
  const [audience, setAudience] = useState<(typeof AUDIENCES)[number]>("Staff");
  const [incidentType, setIncidentType] = useState<(typeof TYPES)[number]>("Outage");
  const [system, setSystem] = useState("");
  const [details, setDetails] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Generation[]>([]);
  const [activeId, setActiveId] = useState<string | undefined>(undefined);

  const refresh = () => {
    listGenerations("comms")
      .then(setItems)
      .catch(() => undefined);
  };
  useEffect(refresh, []);

  async function handleGenerate() {
    if (!system.trim()) {
      toast.error("Add the affected system first.");
      return;
    }
    setLoading(true);
    try {
      const { text } = await run({ data: { audience, incidentType, system, details } });
      setDraft(text);
      const saved = await saveGeneration({
        kind: "comms",
        title: `${incidentType} · ${system} · ${audience}`,
        input: { audience, incidentType, system, details },
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

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Incident details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
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
          <Button className="mt-4" onClick={handleGenerate} disabled={loading}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Generate email alert
          </Button>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Editable draft</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!draft}
                onClick={() => {
                  navigator.clipboard.writeText(draft);
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
          <Textarea
            className="mt-3 min-h-[320px] font-mono text-sm"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Your generated email will appear here, ready to edit before sending."
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Review and edit before sending. Nothing is sent automatically.
          </p>
        </section>
      </div>

      <aside className="space-y-3 rounded-xl border border-border bg-card p-5">
        <h2 className="text-xs font-semibold tracking-[0.16em] uppercase">Saved alerts</h2>
        <HistoryPanel
          items={items}
          activeId={activeId}
          onSelect={(item) => {
            setActiveId(item.id);
            setDraft(item.output);
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
