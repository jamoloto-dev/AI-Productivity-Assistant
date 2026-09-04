const LOVABLE_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export const SAFETY_RULE =
  "Never invent or repeat credentials, passwords, API keys, ID numbers or other personal data. If the input contains anything that looks like a secret or personal information, redact it as [REDACTED]. All output is an official corporate draft requiring human review before external delivery.";

async function callGoogleGemini(apiKey: string, system: string, user: string): Promise<string> {
  const models = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash"];
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `System Instructions:\n${system}\n\nTask Input:\n${user}` }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        lastError = new Error(
          `Gemini (${model}) error ${response.status}: ${errorText.slice(0, 150)}`,
        );
        continue;
      }

      const data = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const generated = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (generated) return generated;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error("Gemini API call failed across available models.");
}

export async function generateWithLovableAI(
  system: string,
  user: string,
  userGeminiApiKey?: string,
): Promise<string> {
  // 1. If user provided a Gemini API key or GEMINI_API_KEY is in environment
  const key = userGeminiApiKey?.trim() || process.env["GEMINI_API_KEY"];
  if (key) {
    try {
      return await callGoogleGemini(key, system, user);
    } catch (geminiErr) {
      console.warn("User Gemini key call failed, falling back to gateway/engine:", geminiErr);
    }
  }

  // 2. Try Lovable AI gateway if LOVABLE_API_KEY is configured
  const lovableApiKey = process.env["LOVABLE_API_KEY"];
  if (lovableApiKey) {
    try {
      const response = await fetch(LOVABLE_GATEWAY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": lovableApiKey,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) return text;
      }
    } catch (gatewayErr) {
      console.warn("Lovable gateway failed, falling back to built-in engine:", gatewayErr);
    }
  }

  // 3. Signal to caller that fallback generator should produce the response
  throw new Error("USE_BUILTIN_FALLBACK");
}
