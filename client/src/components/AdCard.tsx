/**
 * Sponsored ad card rendered inline in the AI chat.
 *
 * When the user clicks the CTA, the validator silently settles a
 * processAction on-chain — the user just thinks they clicked an ad.
 * That's the actual Apex flow: validator activity is a side effect of
 * normal user interaction, not a button the user presses.
 */

import { useState } from "react";
import { ExternalLink, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { CampaignRecord } from "@/lib/solana/hooks/useCampaign";
import { formatUsdc } from "@/lib/solana/utils";
import { explorerTxUrl } from "@/lib/solana/config";

const VALIDATOR_URL =
  (import.meta as unknown as { env: Record<string, string | undefined> }).env
    ?.VITE_VALIDATOR_URL ?? "http://localhost:8787";

const DEMO_PUBLISHER_AGENT_ID =
  (import.meta as unknown as { env: Record<string, string | undefined> }).env
    ?.VITE_DEMO_PUBLISHER_AGENT_ID ?? "1";

interface ProcessResponse {
  signature: string;
  processedActionPda: string;
  actionHash: string;
  validatorAgentId: string;
}

function parseSpec(buf: Buffer): { title: string; description: string; targetUrl?: string } {
  const text = buf.toString("utf8");
  // Try JSON first; fall back to raw text as title.
  try {
    const obj = JSON.parse(text) as Record<string, unknown>;
    return {
      title: (obj.title as string) ?? (obj.name as string) ?? text.slice(0, 60),
      description: (obj.description as string) ?? (obj.shortDescription as string) ?? "",
      targetUrl:
        (obj.targetUrl as string) ?? (obj.url as string) ?? (obj.landingPage as string),
    };
  } catch {
    return { title: text.slice(0, 60), description: "" };
  }
}

export function AdCard({ campaign }: { campaign: CampaignRecord }) {
  const qc = useQueryClient();
  const [state, setState] = useState<"idle" | "processing" | "settled">("idle");
  const spec = parseSpec(campaign.spec);

  const handleClick = async () => {
    if (state !== "idle") return;
    setState("processing");

    // Open the advertiser's URL right away if there is one (real "user action").
    if (spec.targetUrl) {
      try {
        window.open(spec.targetUrl, "_blank", "noopener,noreferrer");
      } catch {
        // ignore
      }
    }

    // Silent validator settlement in the background.
    try {
      const res = await fetch(`${VALIDATOR_URL}/api/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: campaign.campaignId.toString(),
          publisherId: DEMO_PUBLISHER_AGENT_ID,
        }),
      });
      const json = (await res.json()) as ProcessResponse | { error: string };
      if (!res.ok || "error" in json) {
        throw new Error("error" in json ? json.error : `HTTP ${res.status}`);
      }

      setState("settled");
      toast.success("Validator settled the action", {
        description: `${formatUsdc(campaign.cpaAmount)} USDC paid to publisher`,
        action: {
          label: "View tx",
          onClick: () => window.open(explorerTxUrl(json.signature), "_blank"),
        },
      });
      void qc.invalidateQueries({ queryKey: ["processedActions"] });
      void qc.invalidateQueries({ queryKey: ["campaigns"] });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error("Validator settlement failed", { description: message });
      setState("idle");
    }
  };

  return (
    <div className="mt-2 max-w-[80%] border border-gray-200 rounded-2xl p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">
          Sponsored · APEX
        </span>
        <span className="text-[10px] text-gray-400">
          Campaign #{campaign.campaignId.toString()}
        </span>
      </div>
      <div className="font-semibold text-sm mb-1">{spec.title}</div>
      {spec.description && (
        <div className="text-xs text-gray-600 mb-3 line-clamp-3">{spec.description}</div>
      )}
      <button
        onClick={handleClick}
        disabled={state !== "idle"}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-black bg-[#FACC15] hover:bg-[#EAB308] disabled:bg-gray-200 disabled:text-gray-500 px-3 py-1.5 rounded-md transition"
      >
        {state === "processing" ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Visiting…
          </>
        ) : state === "settled" ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5" />
            Visited
          </>
        ) : (
          <>
            Visit campaign
            <ExternalLink className="w-3.5 h-3.5" />
          </>
        )}
      </button>
    </div>
  );
}
