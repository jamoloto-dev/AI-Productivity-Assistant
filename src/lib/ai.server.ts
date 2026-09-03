const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export async function generateWithLovableAI(system: string, user: string): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured for this workspace.");

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
    },
    body: JSON.stringify({
      model: "google/gemini-3.7-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    if (response.status === 429)
      throw new Error("AI is rate limited right now. Please try again in a moment.");
    if (response.status === 402)
      throw new Error("AI credits are exhausted. Add credits to continue generating.");
    throw new Error(`AI request failed (${response.status}): ${detail.slice(0, 300)}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("AI returned an empty response. Please try again.");
  return text;
}

export const SAFETY_RULE =
  "Never invent or repeat credentials, passwords, API keys, ID numbers or other personal data. If the input contains anything that looks like a secret or personal information, redact it as [REDACTED]. All output is a draft that requires human review before sending.";
