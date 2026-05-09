/**
 * Vercel Serverless Function: POST /api/chat
 *
 * Body: { prompt: string, campaigns?: Array<{ id, budget, cpa, spec }> }
 * Returns: { reply: string }
 *
 * Calls Google's Gemini API. Set `GEMINI_API_KEY` in Vercel project env.
 */

interface ChatBody {
  prompt: string;
  campaigns?: Array<{ id: string; budget: string; cpa: string; spec: string }>;
}

interface VercelRequest {
  method?: string;
  body: unknown;
}
interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "GEMINI_API_KEY not configured" });
    return;
  }

  const body = (req.body ?? {}) as Partial<ChatBody>;
  const prompt = (body.prompt ?? "").toString();
  const campaigns = Array.isArray(body.campaigns) ? body.campaigns.slice(0, 10) : [];
  if (!prompt) {
    res.status(400).json({ error: "Missing prompt" });
    return;
  }

  const systemPreamble = [
    "You are an APEX (AI-Native Ad Infrastructure on Solana) assistant.",
    "Help advertisers and publishers reason about live campaigns. Be concise.",
    campaigns.length
      ? `Live campaigns:\n${campaigns
          .map((c) => `- #${c.id}: budget ${c.budget} USDC, cpa ${c.cpa} USDC, spec ${c.spec}`)
          .join("\n")}`
      : "No live campaigns provided.",
  ].join("\n\n");

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPreamble}\n\nUser: ${prompt}` }],
            },
          ],
        }),
      },
    );
    const json = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      error?: { message?: string };
    };
    if (json.error) {
      res.status(502).json({ error: json.error.message ?? "Gemini error" });
      return;
    }
    const reply = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "(empty response)";
    res.status(200).json({ reply });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
}
