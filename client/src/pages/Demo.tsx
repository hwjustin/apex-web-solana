/**
 * Demo Agent — minimal AI chat surface with campaign-aware context.
 *
 * Posts to `/api/chat` (a Vercel Function in `api/chat.ts`) which calls
 * Gemini. Active Solana campaigns owned by anyone are passed as context so
 * the agent can recommend live placements.
 */

import { Link } from "wouter";
import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WalletButton } from "@/components/WalletButton";
import { ValidatorSettlementPanel } from "@/components/ValidatorSettlementPanel";
import { useAllCampaigns } from "@/lib/solana/hooks/useCampaign";
import { formatUsdc } from "@/lib/solana/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function Demo() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);

  const { data: campaigns = [] } = useAllCampaigns();

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
      const json = (await res.json()) as { reply?: string; error?: string };
      const reply = json.reply ?? json.error ?? "(no response)";
      setMessages([...next, { role: "assistant", content: reply }]);
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
        <h1 className="text-3xl font-extrabold mb-2">Demo Agent</h1>
        <p className="text-gray-500 mb-6">
          Talk to a Gemini-backed agent with knowledge of every live APEX campaign on Solana.
        </p>

        <div className="bg-gray-50 rounded-2xl p-4 min-h-[320px] space-y-3 mb-4">
          {messages.length === 0 && (
            <p className="text-sm text-gray-400">
              Ask about active campaigns, recommended placements, or budgets.
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

        <ValidatorSettlementPanel />
      </main>
    </div>
  );
}
