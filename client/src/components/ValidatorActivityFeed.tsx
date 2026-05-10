/**
 * Live validator activity feed — last N on-chain ProcessedAction records.
 *
 * Each AdCard click writes one of these to the program; this feed polls every
 * few seconds so the user can watch the validator's work land on-chain in
 * real time. New entries flash briefly when they arrive.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Activity } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAllProcessedActions } from "@/lib/solana/hooks/useAds";
import { formatUsdc, truncateBase58 } from "@/lib/solana/utils";
import { explorerAddressUrl } from "@/lib/solana/config";

const REFRESH_MS = 6_000;
const MAX_ROWS = 6;

function timeAgo(unixSec: number): string {
  const diff = Math.max(0, Math.floor(Date.now() / 1000 - unixSec));
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function ValidatorActivityFeed() {
  const qc = useQueryClient();
  const { data: actions = [], dataUpdatedAt } = useAllProcessedActions();
  const [, force] = useState(0);
  const seenRef = useRef<Set<string>>(new Set());
  const [flashing, setFlashing] = useState<Set<string>>(new Set());

  // Force re-render every second so "Xs ago" stays fresh.
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Poll the chain every REFRESH_MS so new actions show up automatically.
  useEffect(() => {
    const t = setInterval(() => {
      void qc.invalidateQueries({ queryKey: ["processedActions"] });
    }, REFRESH_MS);
    return () => clearInterval(t);
  }, [qc]);

  // Detect newly arrived rows and flash them for ~2s.
  const top = useMemo(() => actions.slice(0, MAX_ROWS), [actions]);
  useEffect(() => {
    const next = new Set<string>();
    for (const a of top) {
      const key = a.pubkey.toBase58();
      if (!seenRef.current.has(key)) {
        next.add(key);
      }
    }
    if (next.size > 0) {
      setFlashing((prev) => new Set([...prev, ...next]));
      for (const k of next) seenRef.current.add(k);
      const timer = setTimeout(() => {
        setFlashing((prev) => {
          const copy = new Set(prev);
          for (const k of next) copy.delete(k);
          return copy;
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [top.map((a) => a.pubkey.toBase58()).join(",")]);

  return (
    <section className="mt-8 border border-gray-200 rounded-2xl p-5 bg-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-gray-500" />
          <h3 className="font-semibold text-sm">Validator activity</h3>
        </div>
        <span className="text-[11px] text-gray-400">
          {actions.length} settled · updated {timeAgo(Math.floor(dataUpdatedAt / 1000))}
        </span>
      </div>

      {top.length === 0 ? (
        <p className="text-xs text-gray-400 py-6 text-center">
          No settled actions yet — click an ad above to trigger one.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {top.map((a) => {
            const key = a.pubkey.toBase58();
            const isNew = flashing.has(key);
            return (
              <li
                key={key}
                className={`flex items-center gap-3 py-2 text-xs transition-colors ${
                  isNew ? "bg-yellow-50 -mx-3 px-3 rounded-md" : ""
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-gray-700">
                    Campaign #{a.campaignId.toString()} → publisher #{a.publisherId.toString()}
                  </div>
                  <div className="text-gray-400">
                    validator #{a.validatorId.toString()} ·{" "}
                    <a
                      href={explorerAddressUrl(a.pubkey.toBase58())}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {truncateBase58(a.pubkey)}
                    </a>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-semibold text-gray-900">
                    {formatUsdc(a.paymentAmount)} USDC
                  </div>
                  <div className="text-gray-400">{timeAgo(a.processedAt.toNumber())}</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
