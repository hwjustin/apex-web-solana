/**
 * Demo Agent — AI chat surface with campaign-aware context.
 *
 * Posts to `/api/chat` (Vercel Function in `api/chat.ts`) which calls Gemini
 * and returns `{ reply, recommendedCampaignId? }`. When a campaign is
 * recommended, an inline AdCard renders below the assistant bubble; clicking
 * its CTA silently triggers a validator settlement in the background — that's
 * the natural Apex flow (user acts, validator settles, no buttons in their
 * face).
 */

import { Link } from "wouter";
import { useEffect, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WalletButton } from "@/components/WalletButton";
import { AdCard } from "@/components/AdCard";
import { useAllCampaigns, type CampaignRecord } from "@/lib/solana/hooks/useCampaign";
import { formatUsdc } from "@/lib/solana/utils";

const VALIDATOR_URL =
  (import.meta as unknown as { env: Record<string, string | undefined> }).env
    ?.VITE_VALIDATOR_URL ?? "http://localhost:8787";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  recommendedCampaign?: CampaignRecord;
}

export default function Demo() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [validatorOnline, setValidatorOnline] = useState<boolean | null>(null);

  const { data: campaigns = [] } = useAllCampaigns();

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(`${VALIDATOR_URL}/health`);
        if (!cancelled) setValidatorOnline(res.ok);
      } catch {
        if (!cancelled) setValidatorOnline(false);
      }
    };
    void check();
    const t = setInterval(check, 30_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || pending) return;
    setInput("");
    setPending(true);

    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);

    try {
      const ctx = campaigns.slice(0, 10).map((c) => ({
        id: c.campaignId.toString(),
        budget: formatUsdc(c.budgetAmount),
        cpa: formatUsdc(c.cpaAmount),
        spec: c.spec.toString("utf8"),
      }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, campaigns: ctx }),
      });
      const json = (await res.json()) as {
        reply?: string;
        recommendedCampaignId?: string | null;
        error?: string;
      };
      const reply = json.reply ?? json.error ?? "(no response)";
      const recommended = json.recommendedCampaignId
        ? campaigns.find((c) => c.campaignId.toString() === json.recommendedCampaignId)
        : undefined;
      setMessages([
        ...next,
        { role: "assistant", content: reply, recommendedCampaign: recommended },
      ]);
    } catch (err) {
      setMessages([
        ...next,
        { role: "assistant", content: `Error: ${err instanceof Error ? err.message : String(err)}` },
      ]);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-100">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <img src="/images/apex-logo.png" alt="APEX" className="h-8" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/campaign" className="text-sm text-gray-600">Campaigns</Link>
            <Link href="/publisher" className="text-sm text-gray-600">Publisher</Link>
            <Link href="/dashboard" className="text-sm text-gray-600">Dashboard</Link>
            <WalletButton />
          </div>
        </div>
      </nav>

      <main className="pt-24 container max-w-3xl pb-12">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-extrabold">Demo Agent</h1>
          <ValidatorStatusPill online={validatorOnline} />
        </div>
        <p className="text-gray-500 mb-6">
          Talk to a Gemini-backed agent with knowledge of every live APEX campaign on Solana.
          When the agent recommends a campaign, clicking the ad silently settles the action on-chain.
        </p>

        <div className="bg-gray-50 rounded-2xl p-4 min-h-[320px] space-y-3 mb-4">
          {messages.length === 0 && (
            <p className="text-sm text-gray-400">
              Ask about active campaigns, recommended placements, or anything else.
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
              <div
                className={`inline-block max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                  m.role === "user" ? "bg-black text-white" : "bg-white border border-gray-200"
                }`}
              >
                {m.content}
              </div>
              {m.recommendedCampaign && <AdCard campaign={m.recommendedCampaign} />}
            </div>
          ))}
          {pending && (
            <div className="text-left">
              <div className="inline-flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-2xl text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Thinking…
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="What campaigns should I run today?"
          />
          <Button
            onClick={send}
            disabled={pending || !input.trim()}
            className="bg-[#FACC15] hover:bg-[#EAB308] text-black font-bold"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}

function ValidatorStatusPill({ online }: { online: boolean | null }) {
  const color =
    online === true
      ? "bg-green-100 text-green-700"
      : online === false
      ? "bg-red-100 text-red-700"
      : "bg-gray-100 text-gray-600";
  const dot =
    online === true ? "bg-green-500" : online === false ? "bg-red-500" : "bg-gray-400";
  const label =
    online === true
      ? "Validator online"
      : online === false
      ? "Validator offline"
      : "Validator …";
  return (
    <span className={`inline-flex items-center gap-2 text-xs px-2.5 py-1 rounded-full ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
