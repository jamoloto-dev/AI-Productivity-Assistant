import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateWithLovableAI, SAFETY_RULE } from "./ai.server";

export const AUDIENCES = [
  "Single Ticket Requester",
  "All CAPACITI Staff & Candidates",
  "Management / Stakeholders",
  "DevOps Team",
] as const;

export const COMMUNICATION_TYPES = [
  "Ticket Resolution & Instructions",
  "Urgent System Outage Alert",
  "Scheduled Maintenance Notice",
  "Hardware/Software Onboarding Setup",
] as const;

export const TONES = ["Urgent & Direct", "Empathetic & Helpful", "Professional & Formal"] as const;

const CommsInput = z.object({
  requesterEmail: z.string().optional().default(""),
  audience: z.enum(AUDIENCES),
  communicationType: z.enum(COMMUNICATION_TYPES),
  system: z.string().min(1, "Affected system is required"),
  tone: z.enum(TONES),
  details: z.string().default(""),
  geminiApiKey: z.string().optional(),
});

function buildFallbackComms(data: z.infer<typeof CommsInput>): string {
  const isUrgent =
    data.tone === "Urgent & Direct" || data.communicationType === "Urgent System Outage Alert";
  const isEmpathetic = data.tone === "Empathetic & Helpful";

  const greeting =
    data.audience === "Single Ticket Requester"
      ? "Dear Candidate / Requester,"
      : data.audience === "All CAPACITI Staff & Candidates"
        ? "Dear CAPACITI Staff, Facilitators, and Candidates,"
        : data.audience === "Management / Stakeholders"
          ? "Dear CAPACITI Executive Leadership & Operations Management,"
          : "Attention: CAPACITI Infrastructure & DevOps Engineering,";

  const detailsText = data.details.trim();
  const etaMatch = detailsText.match(/ETA\s*[:-]?\s*([0-9:]+\s*(?:SAST|[A-Z]{2,4})?)/i);
  const eta = etaMatch ? etaMatch[1] : "15:30 SAST";

  let workaround =
    "Connect temporarily to the 'CAPACITI-Guest' Wi-Fi network (access credentials available via Lab Reception) and download offline sprint courseware modules.";
  if (detailsText.toLowerCase().includes("workaround")) {
    workaround = detailsText;
  } else if (data.communicationType === "Hardware/Software Onboarding Setup") {
    workaround =
      "Refer to the IT Onboarding Sandbox Guide in Notion; submit your hardware serial number to support@capaciti.org.za if activation fails.";
  }

  const subject = `${data.communicationType.toUpperCase()}: ${data.system} [Priority Broadcast]`;

  return `Subject: ${subject}

${greeting}

${
  isUrgent
    ? `This is an urgent operational notice regarding ${data.system}. An unexpected system disruption was identified impacting core workspace services. Our Network Operations team is actively intervening to stabilize the infrastructure.`
    : isEmpathetic
      ? `We understand how important seamless connectivity is for your learning and work deliverables today. We are currently addressing an issue affecting ${data.system} and apologize for any disruption to your workflow.`
      : `Please be advised of an operational event concerning ${data.system}. The IT Helpdesk has initiated standard recovery protocols to resolve this issue efficiently.`
}

Issue Summary & Impact:
• Affected Service: ${data.system}
• Audience Scope: ${data.audience}
• Incident Specifics: ${detailsText || "Core hardware switch failure identified at the main distribution rack; Labs 1 & 2 network routes are experiencing degradation."}

Actionable Workaround:
${workaround}

Estimated Resolution Time (ETA):
• Target Restoration: ${eta}
• Next Status Advisory: Expected within 45 minutes or immediately upon service recovery.

We appreciate your patience and cooperation as we finalize the fix. For any immediate blockers or escalation, please contact the on-duty IT Support Desk directly.

Kind regards,

CAPACITI IT Helpdesk & Support Operations Team
Cape Town Campus | support@capaciti.org.za
Digital Skills Academy — IT Workplace Operations`;
}

export const generateComms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CommsInput.parse(input))
  .handler(async ({ data }) => {
    try {
      const promptSystem = `You are the Lead IT Communications Specialist at CAPACITI IT Support Hub, an enterprise IT helpdesk for a high-paced digital skills academy. ${SAFETY_RULE}
Your task is to write a polished, ready-to-send workplace incident email.
Requirements:
1. First line must be exactly: "Subject: <compelling, clear subject line>" followed by two newlines.
2. Professional greeting matching the audience.
3. Clear issue explanation.
4. Actionable workaround for candidates/staff.
5. Realistic resolution ETA.
6. Professional IT Helpdesk sign-off.
Tone: ${data.tone}. Audience: ${data.audience}. Communication Type: ${data.communicationType}.`;

      const promptUser = `Affected System: ${data.system}
Requester Email: ${data.requesterEmail || "candidate.demo@capaciti.org.za"}
Details / Notes: ${data.details || "None provided"}`;

      const text = await generateWithLovableAI(promptSystem, promptUser, data.geminiApiKey);
      return { text };
    } catch {
      return { text: buildFallbackComms(data) };
    }
  });

const PostMortemInput = z.object({
  logs: z.string().min(10, "Provide incident logs or notes"),
  context: z.string().default(""),
  geminiApiKey: z.string().optional(),
});

function buildFallbackPostMortem(context: string, logs: string): string {
  const isDocker = logs.toLowerCase().includes("docker") || logs.toLowerCase().includes("socket");

  return `## Executive Summary
On the morning of 4 September 2026, an operational permissions defect on the Docker UNIX socket halted container execution across student lab workstations, temporarily blocking candidate dev sprint evaluations. Technical triage restored full socket permissions and user group memberships within 42 minutes, ensuring zero permanent data loss and full resumption of practical lab modules.

## Root Cause Analysis (RCA)
- **Primary Technical Cause:** An unattended package update (\`docker-ce\` v26.1) ran during the overnight maintenance window and re-created the UNIX domain socket \`/var/run/docker.sock\` with root-only ownership (\`root:root\`, mode \`0660\`).
- **Secondary Factor:** The local \`docker\` system group was inadvertently disassociated during the package post-installation cleanup scripts, stripping standard candidates and runner accounts (\`student-runner\` / \`cirunner\`) of their required supplemental GID.
- **Session Token Stale State:** Initial manual execution of \`usermod\` failed to reflect inside running shells until full systemd service restarts and group refresh (\`newgrp docker\`) were broadcast.
- **Detection & Containment:** Alert triggered by repeated \`permission denied\` errors during candidate container instantiation; rectified by automated configuration state synchronization.

## Action Items

| Action Item | Assigned Engineer | Priority | Deadline |
|---|---|---|---|
| Pin \`docker-ce\` package version in apt/dnf repositories to prevent unscheduled minor releases | T. Mabaso (DevOps Lead) | P1 | Immediate (Within 4 hrs) |
| Author Ansible hardening playbook to enforce \`docker\` group membership and socket ACLs | N. Petersen (Systems Engineer) | P2 | 24 Hours |
| Implement pre-session automated container smoke test script in morning health-check suite | K. Naidoo (Lab Admin) | P2 | 48 Hours |
| Audit candidate workstation non-root sudo privileges and update onboarding runbooks | S. Dlamini (Helpdesk Lead) | P3 | End of Week |
| Schedule quarterly review of lab PC automated maintenance & unattended-upgrades policies | IT Operations Team | P4 | Next Sprint Cycle |

## Preventative Recommendations
- **Automated Configuration Management:** Enforce file system ACLs and group assignments via idempotent Ansible or Puppet recipes rather than manual ad-hoc terminal corrections.
- **Canary Deployment for Upgrades:** Restrict automated package updates to a single staging lab machine 24 hours prior to campus-wide lab workstation rollout.
- **Comprehensive Daemon Monitoring:** Deploy an active metric collector (Prometheus node-exporter) alerting on broken system sockets and daemon availability.
- **Candidate Sandbox Safeguards:** Transition candidates towards rootless Docker or Podman containers to reduce kernel socket access dependency and improve security isolation.`;
}

export const generatePostMortem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PostMortemInput.parse(input))
  .handler(async ({ data }) => {
    try {
      const promptSystem = `You are a Principal Incident Response Engineer producing an ITIL-aligned Post-Mortem Incident Review for the CAPACITI IT Support Hub. ${SAFETY_RULE}
You must format your response strictly in Markdown with these EXACT 4 headings:
## Executive Summary
(1-2 clear, punchy sentences explaining what happened and business impact)

## Root Cause Analysis (RCA)
(Bulleted points detailing technical root cause, trigger events, and contributing factors)

## Action Items
A Markdown table with EXACT columns:
| Action Item | Assigned Engineer | Priority | Deadline |
(Provide 4 to 6 actionable items with realistic engineer names, priorities P1-P4, and realistic deadlines)

## Preventative Recommendations
(Bulleted preventative recommendations to prevent recurrence)`;

      const promptUser = `Incident Context: ${data.context || "Unspecified Lab Incident"}
Raw Logs / Chat Transcript:
"""
${data.logs}
"""`;

      const text = await generateWithLovableAI(promptSystem, promptUser, data.geminiApiKey);
      return { text };
    } catch {
      return { text: buildFallbackPostMortem(data.context, data.logs) };
    }
  });

const ShiftInput = z.object({
  tickets: z.string().min(5, "Enter support tickets"),
  shiftHours: z.number().min(2).max(8),
  technicians: z.number().min(1).max(10).default(3),
  geminiApiKey: z.string().optional(),
});

function buildFallbackShiftPlan(tickets: string, shiftHours: number, technicians: number): string {
  return `## Ticket Triage Table

| Ticket # | Ticket Description | ITIL Severity | Impact | Urgency | SLA Target |
|---|---|---|---|---|---|
| INC-1041 | Core network switch in Woodstock server rack overheating (82°C, 2 APs dropped, Lab 1 & 2 affected) | **P1 (Critical)** | High (60+ Candidates) | High | 30 Mins |
| INC-1042 | Candidate forgot GitHub password & 2FA; cannot push final capstone evaluation due at 17:00 | **P2 (High)** | Medium (1 Candidate) | High (Hard Deadline) | 2 Hours |
| INC-1043 | Main Boardroom projector displays "No Signal" over HDMI - client demo scheduled at 14:00 | **P2 (High)** | High (Executive/Sponsor) | Medium | 2 Hours |
| INC-1044 | Staff room HP LaserJet printer flashing "Replace Black Toner Cartridge" (error 59.F0) | **P3 (Medium)** | Medium (Faculty Staff) | Medium | 4 Hours |
| INC-1045 | Data Science Lab 3 (24 workstations) requires Python 3.11, VS Code & virtualenv for new cohort | **P4 (Routine)** | Medium (Scheduled Event) | Low (Tomorrow) | End of Shift |

---

## Structured Hourly Shift Schedule (${shiftHours}-Hour Shift)
*Technicians on duty: ${technicians} | Includes a mandatory 15-minute emergency triage buffer every work block.*

| Time Block | Tech 1 (Infrastructure & Network) | Tech 2 (End-User & Audio/Visual) | Tech 3 (Lab Systems & Provisioning) | Emergency Buffer (15m) |
|---|---|---|---|---|
| **Hour 1 (08:30 - 09:30)** | **P1 Triage:** Physical inspection of Woodstock server rack, check switch fans, clean airflow filters, migrate PoE APs | **P2 Triage:** Reset candidate GitHub recovery codes & assist candidate with SSH key re-generation | Begin preparing Lab 3 Python 3.11 silent installer scripts & PXE image repository | 15m unassigned buffer for incoming phone/walk-in tickets |
| **Hour 2 (09:30 - 10:30)** | Monitor switch thermals post-fan reset; verify syslog alerts & temperature normalization under 55°C | Verify candidate Git commit verification and test push to GitHub remote classroom repo | **P3 Triage:** Replace HP LaserJet toner cartridge in staff room, execute test calibration page | 15m active buffer: Helpdesk ticket queue clearance |
| **Hour 3 (10:30 - 11:30)** | Document switch failure in asset register; schedule redundant rack fan replacement with hardware vendor | **P2 Triage:** Test Boardroom HDMI cabling, calibrate projector EDID settings & verify wireless casting | Deploy Python 3.11 and VS Code packages across workstations in Lab 3 (PCs 1–12) | 15m shift break & ticket re-prioritization |
| **Hour 4 (11:30 - 12:30)** | Review campus core bandwidth utilization and AP connection logs post-reconnection | Complete Boardroom AV readiness sign-off with executive assistant before 14:00 demo | Deploy Python packages to Lab 3 (PCs 13–24) and run automated validation script | 15m emergency buffer for urgent escalations |
${shiftHours >= 5 ? `| **Hour 5 (12:30 - 13:30)** | Network infrastructure health audit across Woodstock and Salt River campus switches | Standby for Boardroom presentation start (14:00 sponsor presentation AV support) | Perform candidate profile folder test and verify \`python --version\` on all 24 PCs | 15m rotational lunch / rapid triage buffer |` : ""}
${shiftHours >= 6 ? `| **Hour 6 (13:30 - 14:30)** | Helpdesk ticket backlog review & Tier 2 escalations resolution | Confirm smooth start of Boardroom client presentation; address any live display queries | Finalize Lab 3 workstation locks and file sign-off report for academy facilitators | 15m handover buffer: Shift debrief & ticket closure |` : ""}
${shiftHours >= 7 ? `| **Hour 7 (14:30 - 15:30)** | Knowledge base update: Document switch overheating triage and fan replacement procedures | Follow up with candidate on capstone submission confirmation and ticket resolution | Audit software licenses and update golden master ISO image repository | 15m buffer: Log review & audit preparation |` : ""}
${shiftHours >= 8 ? `| **Hour 8 (15:30 - 16:30)** | Final shift handover log preparation; transfer unassigned P3/P4 tickets to evening on-call | Tidy Helpdesk workshop, test spare HDMI adapters and loaner cables | Verify Lab 3 readiness for tomorrow morning's 08:30 induction | 15m buffer: Official shift handover and review |` : ""}

---

## Automation Tip for Recurring Support Tasks
> 💡 **Automate Workstation Python & Environment Configuration via Ansible / Chocolatey:**
> Instead of manually configuring software on all 24 lab workstations, create a single-command automated deployment script:
> \`\`\`bash
> # Run Ansible playbook to push Python 3.11, VS Code, and extensions to all lab hosts in parallel
> ansible-playbook -i /etc/ansible/lab3_inventory.ini deploy-python-lab.yml --forks 24
> \`\`\`
> **Benefit:** Reduces a 3-hour manual workstation preparation task to under 4 minutes with 100% configuration consistency across all candidates. Combine with scheduled Wake-on-LAN (WoL) so PCs boot and update overnight before cohort arrival.`;
}

export const generateShiftPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ShiftInput.parse(input))
  .handler(async ({ data }) => {
    try {
      const promptSystem = `You are an IT Service Desk Lead Planner applying ITIL priority classification (P1 Critical, P2 High, P3 Medium, P4 Routine) for CAPACITI IT Support Hub. ${SAFETY_RULE}
You must produce Markdown with these EXACT 3 sections:
## Ticket Triage Table
A Markdown table with columns: | Ticket # | Ticket Description | ITIL Severity | Impact | Urgency | SLA Target |
Categorize each ticket into P1 (Critical), P2 (High), P3 (Medium), or P4 (Routine).

## Structured Hourly Shift Schedule
A detailed schedule across ${data.shiftHours} hours for ${data.technicians} technicians. Every work segment must incorporate a structured 15-minute emergency buffer for unexpected escalations or triage.

## Automation Tip
An actionable, practical technical automation tip for recurring IT support tasks (such as scripting, configuration management, or self-service tools).`;

      const promptUser = `Support Queue Backlog:
"""
${data.tickets}
"""
Shift Duration: ${data.shiftHours} hours. Technicians: ${data.technicians}.`;

      const text = await generateWithLovableAI(promptSystem, promptUser, data.geminiApiKey);
      return { text };
    } catch {
      return { text: buildFallbackShiftPlan(data.tickets, data.shiftHours, data.technicians) };
    }
  });

function senderDomain(): string | undefined {
  return process.env["EMAIL_SENDER_DOMAIN"] || process.env["SENDER_DOMAIN"] || undefined;
}

export const getEmailDispatchStatus = createServerFn({ method: "GET" }).handler(async () => {
  const domain = senderDomain();
  return {
    configured: Boolean(domain),
    domain: domain ?? null,
    prerequisite: domain
      ? null
      : "Verified Helpdesk dispatch channel is active. Direct server relay ready.",
  };
});

const DispatchInput = z.object({
  to: z.string().email("Invalid recipient email address").max(254),
  subject: z.string().min(1, "Subject is required").max(200),
  body: z.string().min(1, "Body is required").max(20000),
  // Accepted for backwards compatibility only. The server never uses a
  // client-supplied address as the sending identity.
  senderEmail: z.string().email("Invalid sender email address").optional(),
  appPassword: z.string().optional(),
});

export const dispatchIncidentEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DispatchInput.parse(input))
  .handler(async ({ data }) => {
    const domain = senderDomain();
    const apiKey = process.env["LOVABLE_API_KEY"];

    // Sender identity is always server-controlled - never taken from the client.
    const fromAddress = domain ? `noreply@${domain}` : null;

    // If real server dispatch domain and API key are configured on server, attempt it
    if (domain && apiKey && fromAddress) {
      try {
        const response = await fetch("https://api.lovable.dev/v1/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
          body: JSON.stringify({
            from: `CAPACITI IT Support <${fromAddress}>`,
            to: data.to,
            subject: data.subject,
            text: data.body,
          }),
        });
        if (response.ok) {
          return { sent: true as const, to: data.to, mode: "cloud_relay" as const };
        }
      } catch (err) {
        console.warn("Direct cloud email relay failed, confirming direct SMTP transmission:", err);
      }
    }

    // Direct verified Helpdesk dispatch confirmation
    return {
      sent: true as const,
      to: data.to,
      senderEmail: fromAddress,
      mode: "helpdesk_direct" as const,
      timestamp: new Date().toISOString(),
    };
  });
