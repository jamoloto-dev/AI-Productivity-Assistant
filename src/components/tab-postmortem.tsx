import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/markdown";
import { HistoryPanel } from "@/components/history-panel";
import { generatePostMortem } from "@/lib/capaciti.functions";
import {
  deleteGeneration,
  listGenerations,
  saveGeneration,
  type Generation,
} from "@/lib/history";

export function TabPostMortem() {
  const run = useServerFn(generatePostMortem);
  const [logs, setLogs] = useState("");
  const [context, setContext] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Generation[]>([]);
  const [activeId, setActiveId] = useState<string | undefined>(undefined);

  const refresh = () => {
    listGenerations("postmortem")
      .then(setItems)
      .catch(() => undefined);
  };
  useEffect(refresh, []);

  async function handleGenerate() {
    if (logs.trim().length < 10) {
      toast.error("Paste the incident logs first.");
      return;
    }
    setLoading(true);
    try {
      const { text } = await run({ data: { logs, context } });
      setOutput(text);
      const saved = await saveGeneration({
        kind: "postmortem",
        title: context.trim() || `Post-mortem ${new Date().toLocaleDateString()}`,
        input: { context },
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
          <h2 className="text-sm font-semibold">Raw incident notes</h2>
          <div className="mt-4 space-y-2">
            <Label htmlFor="pm-context">Incident title / context</Label>
            <Input
              id="pm-context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g. Wi-Fi outage, Cape Town lab, 21 Aug"
            />
          </div>
          <div className="mt-4 space-y-2">
            <Label htmlFor="pm-logs">Terminal / chat logs</Label>
            <Textarea
              id="pm-logs"
              rows={12}
              className="font-mono text-xs"
              value={logs}
              onChange={(e) => setLogs(e.target.value)}
              placeholder="Paste sanitised logs, Teams/Slack threads or handover notes here..."
            />
            <p className="text-xs text-muted-foreground">
              Strip passwords, tokens and personal details before pasting.
            </p>
          </div>
          <Button className="mt-4" onClick={handleGenerate} disabled={loading}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Summarise incident
          </Button>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Post-mortem report</h2>
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
              Executive summary, root cause analysis and an action-items table will appear here.
            </p>
          )}
        </section>
      </div>

      <aside className="space-y-3 rounded-xl border border-border bg-card p-5">
        <h2 className="text-xs font-semibold tracking-[0.16em] uppercase">Saved post-mortems</h2>
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
