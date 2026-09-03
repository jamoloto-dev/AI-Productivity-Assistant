import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarClock, FileText, Mail, ServerCog } from "lucide-react";

import { ResponsibleAIBanner } from "@/components/responsible-ai-banner";
import { TabComms } from "@/components/tab-comms";
import { TabPostMortem } from "@/components/tab-postmortem";
import { TabShift } from "@/components/tab-shift";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CAPACITI IT Support & Workplace Operations Platform" },
      {
        name: "description",
        content:
          "Generate IT incident emails, post-mortem summaries with RCA and action items, and ITIL-prioritised technician shift plans for CAPACITI.",
      },
      { property: "og:title", content: "CAPACITI IT Support & Workplace Operations Platform" },
      {
        property: "og:description",
        content:
          "AI-assisted incident comms, post-mortems and shift planning for the CAPACITI IT service desk.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const TABS = [
  { id: "comms", label: "Incident Comms", icon: Mail, hint: "Ready-to-send email alerts" },
  { id: "postmortem", label: "Post-Mortem", icon: FileText, hint: "Summary, RCA & actions" },
  { id: "shift", label: "Shift Planner", icon: CalendarClock, hint: "ITIL P1–P4 & schedule" },
] as const;

function Index() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("comms");
  const active = TABS.find((t) => t.id === tab)!;

  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside className="border-b border-border bg-sidebar p-6 lg:min-h-screen lg:w-80 lg:shrink-0 lg:border-r lg:border-b-0">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ServerCog className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">CAPACITI</p>
            <p className="text-xs text-muted-foreground">IT Support &amp; Workplace Ops</p>
          </div>
        </div>

        <nav className="mt-8 space-y-1.5">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = t.id === tab;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                }`}
              >
                <Icon className="mt-0.5 size-4 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{t.label}</span>
                  <span className="block text-xs opacity-80">{t.hint}</span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="mt-8">
          <ResponsibleAIBanner />
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-6 lg:p-10">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">{active.label}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{active.hint}</p>
        </header>

        {tab === "comms" && <TabComms />}
        {tab === "postmortem" && <TabPostMortem />}
        {tab === "shift" && <TabShift />}
      </main>
    </div>
  );
}
