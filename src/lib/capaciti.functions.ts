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

/* ---------------------------------------------------------------------------
 * Production email dispatch
 *
 * Gmail app passwords cannot be used safely from the browser: SMTP credentials
 * would have to travel to (and be stored by) the app. Dispatch therefore runs
 * server-side through Lovable's managed email infrastructure, which requires a
 * verified sender domain. Until that domain is set up, dispatch is refused with
 * an explicit prerequisite message instead of silently "sending".
 * ------------------------------------------------------------------------- */

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
      : "A verified sending domain must be connected before emails can be dispatched from this app.",
  };
});

const DispatchInput = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
});

export const dispatchIncidentEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => DispatchInput.parse(input))
  .handler(async ({ data }) => {
    const domain = senderDomain();
    if (!domain) {
      throw new Error(
        "Email dispatch is not configured yet. Connect a verified sending domain for this workspace, then send again. Your draft has been kept.",
      );
    }

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Email service credentials are missing on the server.");

    const response = await fetch("https://api.lovable.dev/v1/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        from: `CAPACITI IT Support <noreply@${domain}>`,
        to: data.to,
        subject: data.subject,
        text: data.body,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Dispatch failed (${response.status}): ${detail.slice(0, 200)}`);
    }
    return { sent: true as const, to: data.to };
  });
