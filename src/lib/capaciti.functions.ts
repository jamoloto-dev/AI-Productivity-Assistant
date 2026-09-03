import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { generateWithLovableAI, SAFETY_RULE } from "./ai.server";

const CommsInput = z.object({
  audience: z.enum(["Staff", "Candidates", "Management"]),
  incidentType: z.enum(["Outage", "Maintenance", "Resolution"]),
  system: z.string().min(1),
  details: z.string().default(""),
});

export const generateComms = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CommsInput.parse(input))
  .handler(async ({ data }) => {
    const text = await generateWithLovableAI(
      `You are the IT communications lead at CAPACITI, a South African digital skills accelerator. Write clear, calm, professional internal email alerts. ${SAFETY_RULE}`,
      `Write a ready-to-send email alert.
Audience: ${data.audience}
Incident type: ${data.incidentType}
Affected system: ${data.system}
Known details: ${data.details || "none provided"}

Format exactly:
Subject: <one line>

<email body with greeting, what happened, impact for this specific audience, what we are doing, what they should do, expected next update, sign-off from "CAPACITI IT Support">

Tone: ${data.audience === "Management" ? "concise and business-impact focused" : data.audience === "Candidates" ? "reassuring and jargon-free" : "practical and operational"}. Plain text, no markdown.`,
    );
    return { text };
  });

const PostMortemInput = z.object({
  logs: z.string().min(10),
  context: z.string().default(""),
});

export const generatePostMortem = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PostMortemInput.parse(input))
  .handler(async ({ data }) => {
    const text = await generateWithLovableAI(
      `You are a senior incident manager producing ITIL-aligned post-incident reviews for CAPACITI. ${SAFETY_RULE}`,
      `Raw incident notes / terminal / chat logs:
"""
${data.logs.slice(0, 20000)}
"""
Extra context: ${data.context || "none"}

Produce Markdown with exactly these sections:
## Executive Summary
(3-5 sentences, non-technical)

## Root Cause Analysis
(bulleted timeline, then the technical root cause and contributing factors)

## Action Items
A Markdown table with columns: | # | Action Item | Assignee (Role) | Priority (P1-P4) | Due |
5-8 rows, concrete and testable.

## Preventative Measures
(short bullets)`,
    );
    return { text };
  });

const ShiftInput = z.object({
  tickets: z.string().min(5),
  shiftHours: z.number().min(2).max(8),
  technicians: z.number().min(1).max(20),
});

export const generateShiftPlan = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ShiftInput.parse(input))
  .handler(async ({ data }) => {
    const text = await generateWithLovableAI(
      `You are an IT service desk shift planner applying ITIL priority classification (P1 Critical, P2 High, P3 Medium, P4 Low) based on impact x urgency. ${SAFETY_RULE}`,
      `Support tickets (one per line):
"""
${data.tickets.slice(0, 10000)}
"""
Shift duration: ${data.shiftHours} hours. Technicians available: ${data.technicians}.

Produce Markdown with exactly these sections:
## Triage
A table: | Ticket | ITIL Priority | Impact | Urgency | Target Response | Rationale |

## Hourly Shift Schedule
A table with one row per hour (Hour 1 .. Hour ${data.shiftHours}) and one column per technician (Tech 1 .. Tech ${data.technicians}), showing which ticket each works on. Reserve realistic buffer time for escalations and handover in the final hour.

## Escalation & Handover Notes
Short bullets.`,
    );
    return { text };
  });
