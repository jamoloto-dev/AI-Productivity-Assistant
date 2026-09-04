import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarClock, FileText, Mail, ServerCog } from "lucide-react";

import { MailSettings } from "@/components/mail-settings";
import { ResponsibleAIBanner } from "@/components/responsible-ai-banner";
import { TabComms } from "@/components/tab-comms";
import { TabPostMortem } from "@/components/tab-postmortem";
import { TabShift } from "@/components/tab-shift";
import { MailSettingsProvider } from "@/lib/mail-settings";

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
  {
    id: "comms",
    label: "Incident Communications",
    fullTitle: "IT Incident Communications & Direct Dispatch",
    badge: "Smart Email Generator",
    icon: Mail,
    hint: "Urgent outage alerts, candidate advisories & direct email dispatch",
  },
  {
    id: "postmortem",
    label: "Incident Post-Mortem",
    fullTitle: "Incident Post-Mortem & Log Summarizer",
    badge: "Meeting Notes Summarizer",
    icon: FileText,
    hint: "Executive summary, root cause analysis & action items table",
  },
  {
    id: "shift",
    label: "Queue & Shift Planner",
    fullTitle: "Support Queue Triage & Shift Planner",
    badge: "AI Task Planner",
    icon: CalendarClock,
    hint: "ITIL P1–P4 severity triage, 15m emergency buffer & automation tips",
  },
] as const;

function Index() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("comms");
  const active = TABS.find((t) => t.id === tab)!;

  return (
    <MailSettingsProvider>
      <div className="min-h-screen bg-background lg:flex">
        {/* Sidebar */}
        <aside className="border-b border-border bg-sidebar p-4 sm:p-6 lg:min-h-screen lg:w-84 lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-b-0">
          {/* 1. Header: Display "CAPACITI IT Support Hub" with an Operations badge in red and white */}
          <div className="flex items-start justify-between gap-3 border-b border-border/80 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <ServerCog className="size-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold tracking-tight text-foreground">
                    CAPACITI IT Support Hub
                  </h1>
                </div>
                <p className="text-[11px] text-muted-foreground">Digital Skills Academy Helpdesk</p>
              </div>
            </div>
            {/* Operations badge in red and white */}
            <span className="shrink-0 rounded bg-primary px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-primary-foreground uppercase shadow-sm">
              Operations
            </span>
          </div>

          {/* Tab Navigation */}
          <nav className="mt-5 space-y-1.5">
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
                      ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                      : "text-foreground hover:bg-muted/70 hover:text-foreground"
                  }`}
                >
                  <Icon className="mt-0.5 size-4 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between text-xs font-semibold">
                      <span>{t.label}</span>
                      <span
                        className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-mono ${
                          isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {t.badge.split(" ")[0]}
                      </span>
                    </span>
                    <span
                      className={`block text-[11px] truncate ${
                        isActive ? "text-primary-foreground/90" : "text-muted-foreground"
                      }`}
                    >
                      {t.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>

          {/* 2 & 3. API Key & Mail Server Credentials */}
          <div className="mt-5">
            <MailSettings />
          </div>

          {/* 4. Responsible AI & Data Security Card */}
          <div className="mt-5">
            <ResponsibleAIBanner />
          </div>
        </aside>

        {/* Main Workplace Interface */}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          {/* Main Top Header */}
          <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
                  CAPACITI IT Operations &amp; Support Hub
                </span>
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  {active.badge}
                </span>
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {active.fullTitle}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">{active.hint}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-foreground">Cape Town Campus</span>
              <span>•</span>
              <span>Academy On-Duty Queue Active</span>
            </div>
          </header>

          {tab === "comms" && <TabComms />}
          {tab === "postmortem" && <TabPostMortem />}
          {tab === "shift" && <TabShift />}
        </main>
      </div>
    </MailSettingsProvider>
  );
}
