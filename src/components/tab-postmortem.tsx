import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Download, FileText, Loader2, RefreshCw, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/markdown";
import { HistoryPanel } from "@/components/history-panel";
import { generatePostMortem } from "@/lib/capaciti.functions";
import { DEMO_POSTMORTEM } from "@/lib/demo-scenarios";
import { useMailSettings } from "@/lib/mail-settings";
import { deleteGeneration, listGenerations, saveGeneration, type Generation } from "@/lib/history";

export function TabPostMortem() {
  const run = useServerFn(generatePostMortem);
  const { geminiApiKey } = useMailSettings();
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
      toast.error("Please paste the raw logs, chats, or incident notes first.");
      return;
    }
    setLoading(true);
    try {
      const { text } = await run({ data: { logs, context, geminiApiKey } });
      setOutput(text);
      const saved = await saveGeneration({
        kind: "postmortem",
        title: context.trim() || `Post-Mortem: ${new Date().toLocaleDateString()}`,
        input: { context, logsLength: logs.length },
        output: text,
      });
      setActiveId(saved.id);
      refresh();
      toast.success("Post-mortem report compiled successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  function loadDemo() {
    setContext(DEMO_POSTMORTEM.context);
    setLogs(DEMO_POSTMORTEM.logs);
    toast.success("Demo scenario loaded: Docker permission socket failure on lab PCs.");
  }

  function handleDownload() {
    if (!output) return;
    const blob = new Blob([output], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `postmortem-${(context || "incident").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded post-mortem markdown file.");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-6">
        {/* Input Section */}
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground">
                Incident Post-Mortem &amp; Log Summarizer
              </h2>
              <p className="text-xs text-muted-foreground">
                Compile troubleshooting transcripts, Discord/Slack chats, and terminal logs into
                ITIL-aligned RCA &amp; Action Items
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
              <Label htmlFor="pm-context" className="text-xs font-semibold text-foreground">
                Incident Context / Service Affected
              </Label>
              <Input
                id="pm-context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g. Docker Socket Permission Failure on Lab PCs — Cape Town Tech Labs"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="pm-logs" className="text-xs font-semibold text-foreground">
                  Paste Raw Logs, Discord/Slack Chats, or Incident Notes
                </Label>
                {logs && (
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {logs.split("\n").length} lines ({logs.length} chars)
                  </span>
                )}
              </div>
              <Textarea
                id="pm-logs"
                rows={10}
                className="font-mono text-xs leading-relaxed bg-background/50"
                value={logs}
                onChange={(e) => setLogs(e.target.value)}
                placeholder="Paste raw bash history, Docker/Kubernetes logs, Slack on-call channels, or troubleshooting transcripts here..."
              />
              <p className="text-[11px] text-muted-foreground">
                Responsible AI notice: Avoid pasting unencrypted user passwords, production secret
                tokens, or personal identifiers.
              </p>
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
              Compile Post-Mortem &amp; RCA
            </Button>
            <span className="text-[11px] text-muted-foreground">
              Generates Executive Summary, RCA, Action Items table, &amp; Recommendations
            </span>
          </div>
        </section>

        {/* Output Section */}
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground">
                Post-Mortem Incident Review (ITIL Aligned)
              </h2>
              <p className="text-xs text-muted-foreground">
                Formal analysis report ready for engineering debrief and stakeholder review
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
                <FileText className="size-6" />
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">
                No post-mortem generated yet
              </p>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                Paste logs or click &ldquo;Load Demo Scenario&rdquo; above, then press
                &ldquo;Compile Post-Mortem &amp; RCA&rdquo; to analyze the failure.
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
              Saved Post-Mortems
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
