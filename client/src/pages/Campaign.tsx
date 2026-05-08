/**
 * Campaign Dashboard — Solana edition.
 *
 * Maintains the visual layout of the EVM apex-web Campaign page while
 * sourcing all on-chain state from the apex-solana Anchor program.
 */

import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  ArrowDownToLine,
  BarChart3,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  ExternalLink,
  LayoutDashboard,
  Loader2,
  Megaphone,
  Plus,
  Settings,
  Wallet,
} from "lucide-react";
import BN from "bn.js";
import { toast } from "sonner";

import { CreateCampaignDialog } from "@/components/CreateCampaignDialog";
import { WalletButton } from "@/components/WalletButton";
import {
  useCampaignsByAdvertiser,
  useWithdrawRemaining,
  type CampaignRecord,
} from "@/lib/solana/hooks/useCampaign";
import { useAgentByAuthority, useGlobalState, useRegisterAgent } from "@/lib/solana/hooks/useAgent";
import { explorerTxUrl } from "@/lib/solana/config";
import { formatUsdc, truncateBase58 } from "@/lib/solana/utils";

type NavItem = "overview" | "campaigns" | "analytics" | "settings";

interface CampaignSpecJson {
  title?: string;
  description?: string;
  rules?: string;
  createdAt?: number;
}

function safeParseSpec(spec: Buffer): CampaignSpecJson {
  try {
    return JSON.parse(Buffer.from(spec).toString("utf8")) as CampaignSpecJson;
  } catch {
    return {};
  }
}

function statusOf(c: CampaignRecord, nowSec: number): "scheduled" | "active" | "expired" | "exhausted" {
  if (c.spentAmount.gte(c.budgetAmount)) return "exhausted";
  if (nowSec < c.startTime.toNumber()) return "scheduled";
  if (nowSec >= c.expiryTime.toNumber()) return "expired";
  return "active";
}

export default function Campaign() {
  const [activeNav, setActiveNav] = useState<NavItem>("overview");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [domainInput, setDomainInput] = useState("");

  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();

  const { data: agent, isLoading: isLoadingAgent } = useAgentByAuthority(publicKey ?? null);
  const { data: globalState } = useGlobalState();
  const registerAgent = useRegisterAgent();

  const { data: campaigns = [], isLoading: isLoadingCampaigns, refetch } =
    useCampaignsByAdvertiser(publicKey ?? null);

  const withdrawMutation = useWithdrawRemaining();
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  const nowSec = Math.floor(Date.now() / 1000);

  const stats = useMemo(() => {
    const totalBudget = campaigns.reduce((acc, c) => acc.add(c.budgetAmount), new BN(0));
    const totalSpent = campaigns.reduce((acc, c) => acc.add(c.spentAmount), new BN(0));
    const active = campaigns.filter((c) => statusOf(c, nowSec) === "active").length;
    return {
      totalBudget,
      totalSpent,
      remaining: totalBudget.sub(totalSpent),
      active,
      total: campaigns.length,
    };
  }, [campaigns, nowSec]);

  const handleRegister = async () => {
    if (!domainInput.trim()) {
      toast.error("Domain is required");
      return;
    }
    try {
      const result = await registerAgent.mutateAsync({ domain: domainInput.trim() });
      toast.success("Agent registered", {
        description: `Agent #${result.agentId.toString()}`,
        action: {
          label: "View",
          onClick: () => window.open(explorerTxUrl(result.signature), "_blank"),
        },
      });
      setDomainInput("");
    } catch (err) {
      toast.error("Registration failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleWithdraw = async (c: CampaignRecord) => {
    setWithdrawingId(c.campaignId.toString());
    try {
      const sig = await withdrawMutation.mutateAsync({ campaignId: c.campaignId });
      toast.success("Remaining budget withdrawn", {
        action: { label: "View", onClick: () => window.open(explorerTxUrl(sig), "_blank") },
      });
      refetch();
    } catch (err) {
      toast.error("Withdraw failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setWithdrawingId(null);
    }
  };

  // ---------------- Render ----------------

  if (!connected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md text-center">
          <Wallet className="w-12 h-12 mx-auto text-[#FACC15] mb-4" />
          <h2 className="text-2xl font-extrabold mb-2">Connect your wallet</h2>
          <p className="text-gray-600 mb-6">
            Connect a Solana wallet to manage your APEX agent and campaigns.
          </p>
          <Button
            onClick={() => setVisible(true)}
            className="bg-black text-white hover:bg-gray-800 px-6 py-5 rounded-full"
          >
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  if (isLoadingAgent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!agent) {
    const feeSol = globalState
      ? Number(globalState.registrationFeeLamports.toString()) / 1_000_000_000
      : null;

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full">
          <h2 className="text-2xl font-extrabold mb-2">Register your agent</h2>
          <p className="text-gray-600 mb-6">
            Pick a domain that identifies your agent on APEX. Domains are
            unique and cannot be claimed twice.
            {feeSol !== null && ` Registration fee: ${feeSol} SOL.`}
          </p>
          <div className="space-y-3">
            <Label htmlFor="domain">Domain</Label>
            <Input
              id="domain"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              placeholder="e.g. acme-agent.example"
            />
            <Button
              onClick={handleRegister}
              disabled={registerAgent.isPending}
              className="w-full bg-[#FACC15] hover:bg-[#EAB308] text-black font-bold py-5 rounded-full"
            >
              {registerAgent.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registering…
                </>
              ) : (
                "Register"
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const navItems: Array<{ id: NavItem; label: string; icon: typeof LayoutDashboard }> = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "campaigns", label: "Campaigns", icon: Megaphone },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <nav className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-100">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <img src="/images/apex-logo.png" alt="APEX" className="h-8" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-black">
              Dashboard
            </Link>
            <Link href="/demo" className="text-sm text-gray-600 hover:text-black">
              Demo
            </Link>
            <Link href="/publisher" className="text-sm text-gray-600 hover:text-black">
              Publisher
            </Link>
            <WalletButton />
          </div>
        </div>
      </nav>

      <div className="pt-20 container grid lg:grid-cols-[220px_1fr] gap-8 py-8">
        {/* Sidebar */}
        <aside className="space-y-1">
          {navItems.map((n) => {
            const Icon = n.icon;
            return (
              <button
                key={n.id}
                onClick={() => setActiveNav(n.id)}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold transition ${
                  activeNav === n.id
                    ? "bg-black text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{n.label}</span>
                <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
              </button>
            );
          })}
        </aside>

        <main className="space-y-6">
          {/* Agent header */}
          <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Agent #{agent.agentId.toString()}</p>
              <h1 className="text-2xl font-extrabold">{agent.agentDomain}</h1>
              <p className="text-xs text-gray-400 mt-1 font-mono">
                {truncateBase58(agent.authority, 6)}
              </p>
            </div>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-[#FACC15] hover:bg-[#EAB308] text-black font-bold rounded-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              New campaign
            </Button>
          </div>

          {activeNav === "overview" && (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total budget" value={`${formatUsdc(stats.totalBudget)} USDC`} icon={DollarSign} />
                <StatCard label="Spent" value={`${formatUsdc(stats.totalSpent)} USDC`} icon={BarChart3} />
                <StatCard label="Remaining" value={`${formatUsdc(stats.remaining)} USDC`} icon={Check} />
                <StatCard label="Active" value={`${stats.active} / ${stats.total}`} icon={Megaphone} />
              </div>

              <CampaignList
                campaigns={campaigns}
                isLoading={isLoadingCampaigns}
                nowSec={nowSec}
                onWithdraw={handleWithdraw}
                withdrawingId={withdrawingId}
              />
            </>
          )}

          {activeNav === "campaigns" && (
            <CampaignList
              campaigns={campaigns}
              isLoading={isLoadingCampaigns}
              nowSec={nowSec}
              onWithdraw={handleWithdraw}
              withdrawingId={withdrawingId}
            />
          )}

          {activeNav === "analytics" && (
            <div className="bg-white rounded-2xl p-10 text-center text-gray-500">
              Aggregated metrics live on the <Link href="/dashboard" className="text-black underline">global dashboard</Link>.
            </div>
          )}

          {activeNav === "settings" && (
            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-2">
              <h3 className="font-extrabold text-lg">Identity</h3>
              <p className="text-sm text-gray-500">
                Domain: <span className="font-mono">{agent.agentDomain}</span>
              </p>
              <p className="text-sm text-gray-500">
                Authority: <span className="font-mono">{agent.authority.toBase58()}</span>
              </p>
              <p className="text-xs text-gray-400">
                Domain and authority transfers are signed transactions — UI for these can be added next.
              </p>
            </div>
          )}
        </main>
      </div>

      <CreateCampaignDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        advertiserId={agent.agentId}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof LayoutDashboard;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <div className="text-2xl font-extrabold">{value}</div>
    </div>
  );
}

function CampaignList({
  campaigns,
  isLoading,
  nowSec,
  onWithdraw,
  withdrawingId,
}: {
  campaigns: CampaignRecord[];
  isLoading: boolean;
  nowSec: number;
  onWithdraw: (c: CampaignRecord) => void;
  withdrawingId: string | null;
}) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-10 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-10 text-center text-gray-500">
        No campaigns yet. Use <span className="font-semibold">New campaign</span> to create one.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {campaigns.map((c) => {
        const spec = safeParseSpec(c.spec);
        const status = statusOf(c, nowSec);
        const remaining = c.budgetAmount.sub(c.spentAmount);
        const canWithdraw = status === "expired" && remaining.gtn(0);
        return (
          <div key={c.pubkey.toBase58()} className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-extrabold text-lg truncate">
                    {spec.title || `Campaign #${c.campaignId.toString()}`}
                  </h3>
                  <StatusPill status={status} />
                </div>
                {spec.description && (
                  <p className="text-sm text-gray-500 mb-2">{spec.description}</p>
                )}
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    {formatUsdc(remaining)} / {formatUsdc(c.budgetAmount)} USDC
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    CPA {formatUsdc(c.cpaAmount)} USDC
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(c.startTime.toNumber() * 1000).toLocaleDateString()} →{" "}
                    {new Date(c.expiryTime.toNumber() * 1000).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {canWithdraw && (
                  <Button
                    onClick={() => onWithdraw(c)}
                    disabled={withdrawingId === c.campaignId.toString()}
                    className="bg-black text-white hover:bg-gray-800 rounded-full"
                  >
                    {withdrawingId === c.campaignId.toString() ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ArrowDownToLine className="w-4 h-4 mr-2" />
                    )}
                    Withdraw
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatusPill({ status }: { status: ReturnType<typeof statusOf> }) {
  const styles: Record<typeof status, { cls: string; label: string; icon?: typeof CheckCircle2 }> = {
    active: { cls: "bg-emerald-100 text-emerald-700", label: "Active", icon: CheckCircle2 },
    scheduled: { cls: "bg-blue-100 text-blue-700", label: "Scheduled", icon: Clock },
    expired: { cls: "bg-gray-200 text-gray-600", label: "Expired", icon: AlertTriangle },
    exhausted: { cls: "bg-amber-100 text-amber-700", label: "Exhausted", icon: AlertTriangle },
  };
  const { cls, label, icon: Icon } = styles[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${cls}`}>
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </span>
  );
}

// Silence unused imports kept for future expansion.
void ExternalLink;
