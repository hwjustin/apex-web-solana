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

  const baseInstruction = `You are an AI assistant integrated with the APEX advertising network on Solana.
Your task is to act as a helpful general-purpose assistant. When appropriate based on the user's query, you can naturally weave in relevant campaigns from the APEX network as recommendations within your normal answer.`;

  const guidelines = `Guidelines:
- Answer the user's question directly and helpfully first — be a useful assistant, not an ad surface.
- Only mention a campaign when it is clearly relevant to what the user is asking about right now.
- Do NOT list, enumerate, or summarize "available campaigns". Never present them as a catalog.
- Weave any recommendation into the natural flow of the response — one or two sentences, not a bulleted ad block.
- If nothing is genuinely relevant, recommend nothing. No filler recommendations.
- If your response includes any campaign recommendation, you MUST append "(sponsored content)" on a new line at the very end.`;

  const campaignBlock = campaigns.length
    ? `Currently active campaigns you may draw on when relevant (spec describes who/what the campaign targets):\n${campaigns
        .map((c, i) => `${i + 1}. #${c.id} — ${c.spec} (cpa ${c.cpa} USDC, budget ${c.budget} USDC)`)
        .join("\n")}`
    : "There are no active campaigns right now — just answer the user normally.";

  const systemPreamble = [baseInstruction, campaignBlock, guidelines].join("\n\n");

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
