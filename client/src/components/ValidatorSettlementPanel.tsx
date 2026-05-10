/**
 * Live validator settlement panel.
 *
 * Posts to the apex-validator-solana service, which signs and submits
 * `processAction` on-chain. The 4-step timeline below the form is a
 * frontend-faked animation — the real work is the HTTP call in step 3.
 *
 * Wired by setting VITE_VALIDATOR_URL in the client env.
 */

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAllCampaigns } from "@/lib/solana/hooks/useCampaign";
import { formatUsdc } from "@/lib/solana/utils";
import { explorerTxUrl } from "@/lib/solana/config";

const VALIDATOR_URL =
  (import.meta as unknown as { env: Record<string, string | undefined> }).env
    ?.VITE_VALIDATOR_URL ?? "http://localhost:8787";

type StepState = "idle" | "active" | "done" | "error";

interface Step {
  label: string;
  state: StepState;
}

const INITIAL_STEPS: Step[] = [
  { label: "Detecting on-chain action…", state: "idle" },
  { label: "Validating action hash…", state: "idle" },
  { label: "Submitting processAction tx…", state: "idle" },
  { label: "Confirmed on-chain", state: "idle" },
];

interface ProcessResponse {
  signature: string;
  processedActionPda: string;
  actionHash: string;
  validatorAgentId: string;
}

export function ValidatorSettlementPanel() {
  const qc = useQueryClient();
  const { data: campaigns = [] } = useAllCampaigns();

  const [campaignId, setCampaignId] = useState<string>("");
  const [publisherId, setPublisherId] = useState<string>("");
  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessResponse | null>(null);
  const [validatorOnline, setValidatorOnline] = useState<boolean | null>(null);

  // Poll /health so the user can see the validator is alive before clicking.
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

  const selectedCampaign = useMemo(
    () => campaigns.find((c) => c.campaignId.toString() === campaignId) ?? null,
    [campaigns, campaignId],
  );

  const setStepState = (i: number, state: StepState) =>
    setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, state } : s)));

  const reset = () => {
    setSteps(INITIAL_STEPS);
    setError(null);
    setResult(null);
  };

  const submit = async () => {
    if (!campaignId.trim() || !publisherId.trim()) return;
    reset();
    setPending(true);

    try {
      // Step 1 — Detecting (cosmetic)
      setStepState(0, "active");
      await new Promise((r) => setTimeout(r, 450));
      setStepState(0, "done");

      // Step 2 — Validating (cosmetic)
      setStepState(1, "active");
      await new Promise((r) => setTimeout(r, 450));
      setStepState(1, "done");

      // Step 3 — real HTTP call → on-chain submission
      setStepState(2, "active");
      const res = await fetch(`${VALIDATOR_URL}/api/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: campaignId.trim(),
          publisherId: publisherId.trim(),
        }),
      });
      const json = (await res.json()) as ProcessResponse | { error: string };
      if (!res.ok || "error" in json) {
        throw new Error("error" in json ? json.error : `HTTP ${res.status}`);
      }
      setStepState(2, "done");

      // Step 4 — confirmed (real signature back from server)
      setStepState(3, "done");
      setResult(json);

      void qc.invalidateQueries({ queryKey: ["processedActions"] });
      void qc.invalidateQueries({ queryKey: ["campaigns"] });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setSteps((prev) =>
        prev.map((s) => (s.state === "active" ? { ...s, state: "error" } : s)),
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="mt-12 border border-gray-200 rounded-2xl p-6 bg-white">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-bold">Live validator settlement</h2>
        <ValidatorStatusPill online={validatorOnline} />
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Submit a verified action through the APEX validator. The validator signs
        and broadcasts <code>processAction</code> on Solana — Dashboard and
        Campaign pages refresh once it confirms.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 mb-4">
        <label className="text-sm">
          <span className="block mb-1 text-gray-600">Campaign</span>
          <select
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            disabled={pending}
            className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
          >
            <option value="">Select a campaign…</option>
            {campaigns.map((c) => (
              <option key={c.campaignId.toString()} value={c.campaignId.toString()}>
                #{c.campaignId.toString()} · CPA {formatUsdc(c.cpaAmount)} USDC
                {" · "}budget {formatUsdc(c.budgetAmount.sub(c.spentAmount))} left
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="block mb-1 text-gray-600">Publisher agent id</span>
          <Input
            value={publisherId}
            onChange={(e) => setPublisherId(e.target.value)}
            placeholder="e.g. 3"
            disabled={pending}
            inputMode="numeric"
          />
        </label>
      </div>

      {selectedCampaign && (
        <p className="text-xs text-gray-500 mb-4">
          Validator will pay <strong>{formatUsdc(selectedCampaign.cpaAmount)} USDC</strong> to
          the publisher's USDC token account on confirmation.
        </p>
      )}

      <Button
        onClick={submit}
        disabled={
          pending || !campaignId.trim() || !publisherId.trim() || validatorOnline === false
        }
        className="bg-[#FACC15] hover:bg-[#EAB308] text-black font-bold"
      >
        {pending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Processing…
          </>
        ) : (
          "Validate & Process"
        )}
      </Button>

      <ol className="mt-6 space-y-2">
        {steps.map((s, i) => (
          <li key={i} className="flex items-center gap-3 text-sm">
            <StepIcon state={s.state} />
            <span
              className={
                s.state === "done"
                  ? "text-gray-900"
                  : s.state === "active"
                  ? "text-gray-900 font-medium"
                  : s.state === "error"
                  ? "text-red-600"
                  : "text-gray-400"
              }
            >
              {s.label}
            </span>
          </li>
        ))}
      </ol>

      {result && (
        <div className="mt-5 p-4 rounded-lg bg-green-50 border border-green-200 text-sm">
          <div className="font-semibold text-green-800 mb-1">Settlement confirmed</div>
          <div className="text-green-700 break-all">
            <a
              href={explorerTxUrl(result.signature)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 underline"
            >
              {result.signature.slice(0, 16)}…{result.signature.slice(-8)}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-5 p-4 rounded-lg bg-red-50 border border-red-200 text-sm">
          <div className="flex items-center gap-2 font-semibold text-red-800 mb-1">
            <AlertTriangle className="w-4 h-4" />
            Settlement failed
          </div>
          <div className="text-red-700 break-words">{error}</div>
        </div>
      )}

      {validatorOnline === false && (
        <p className="mt-4 text-xs text-gray-500">
          Validator service unreachable at <code>{VALIDATOR_URL}</code>. Start it locally
          with <code>pnpm dev</code> in <code>apex-validator-solana/</code>, or set{" "}
          <code>VITE_VALIDATOR_URL</code>.
        </p>
      )}
    </section>
  );
}

function StepIcon({ state }: { state: StepState }) {
  if (state === "done")
    return <CheckCircle2 className="w-4 h-4 text-green-600" />;
  if (state === "active")
    return <Loader2 className="w-4 h-4 animate-spin text-[#FACC15]" />;
  if (state === "error")
    return <AlertTriangle className="w-4 h-4 text-red-600" />;
  return <span className="w-4 h-4 rounded-full border border-gray-300 inline-block" />;
}

function ValidatorStatusPill({ online }: { online: boolean | null }) {
  const color =
    online === true
      ? "bg-green-100 text-green-700"
      : online === false
      ? "bg-red-100 text-red-700"
      : "bg-gray-100 text-gray-600";
  const dot =
    online === true
      ? "bg-green-500"
      : online === false
      ? "bg-red-500"
      : "bg-gray-400";
  const label =
    online === true ? "Validator online" : online === false ? "Validator offline" : "Validator …";
  return (
    <span className={`inline-flex items-center gap-2 text-xs px-2.5 py-1 rounded-full ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
