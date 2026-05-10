/**
 * Vercel Serverless Function: POST /api/chat
 *
 * Body:    { prompt: string, campaigns?: Array<{ id, budget, cpa, spec }> }
 * Returns: { reply: string, recommendedCampaignId?: string }
 *
 * Calls Google's Gemini API. Set `GEMINI_API_KEY` in Vercel project env.
 *
 * The model is instructed to emit a JSON object so the frontend can render an
 * AdCard inline when a campaign is genuinely relevant. The card's CTA silently
 * triggers a validator settlement — that's the "automatic" Apex flow: user
 * acts, validator settles, no buttons in their face.
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
- If nothing is genuinely relevant, recommend nothing.
- Output a JSON object with this exact shape:
  { "reply": "<your natural-language answer>", "recommendedCampaignId": "<id or null>" }
- "recommendedCampaignId" must be one of the campaign ids listed below, or null.
- "reply" is plain text shown to the user. Do NOT include the words "(sponsored content)" — the UI labels the ad card itself.
- Output ONLY the JSON object, no markdown fences, no commentary.`;

  const campaignBlock = campaigns.length
    ? `Currently active campaigns you may draw on when relevant (spec describes who/what the campaign targets):\n${campaigns
        .map((c, i) => `${i + 1}. id=${c.id} — ${c.spec} (cpa ${c.cpa} USDC, budget ${c.budget} USDC)`)
        .join("\n")}`
    : "There are no active campaigns right now — set recommendedCampaignId to null.";

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
          generationConfig: {
            responseMimeType: "application/json",
          },
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
    const raw = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    let reply = "(empty response)";
    let recommendedCampaignId: string | null = null;
    try {
      const parsed = JSON.parse(raw) as { reply?: string; recommendedCampaignId?: string | null };
      if (typeof parsed.reply === "string" && parsed.reply.trim()) {
        reply = parsed.reply.trim();
      }
      if (typeof parsed.recommendedCampaignId === "string" && parsed.recommendedCampaignId.trim()) {
        // Make sure it actually matches a known campaign.
        const known = new Set(campaigns.map((c) => c.id));
        if (known.has(parsed.recommendedCampaignId)) {
          recommendedCampaignId = parsed.recommendedCampaignId;
        }
      }
    } catch {
      // Gemini returned non-JSON despite responseMimeType. Fall back to raw text.
      if (raw.trim()) reply = raw.trim();
    }

    res.status(200).json({ reply, recommendedCampaignId });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
}
