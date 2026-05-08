/**
 * GetStartedButton — Solana edition.
 *
 * Disconnected → opens the Solana wallet adapter modal.
 * Connected → looks up the agent registered to the connected wallet via the
 * `AuthorityIndex` PDA and shows their on-chain identity. If no agent exists
 * yet, prompts the user to register.
 *
 * No subgraph dependency: we read account state directly from RPC.
 */

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

import { useAgentByAuthority } from "@/lib/solana/hooks/useAgent";
import { truncateBase58 } from "@/lib/solana/utils";

export function GetStartedButton() {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const [, navigate] = useLocation();
  const [showDialog, setShowDialog] = useState(false);

  const { data: agent, isLoading } = useAgentByAuthority(publicKey ?? null, {
    enabled: connected,
  });

  const handleClick = () => {
    if (!connected) {
      setVisible(true);
      return;
    }
    setShowDialog(true);
  };

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={isLoading}
        className="bg-[#FACC15] hover:bg-[#EAB308] text-black font-bold px-8 py-6 rounded-full text-lg disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading…</span>
          </>
        ) : connected ? (
          <>
            <span>Your Account</span>
            <ArrowUpRight className="w-5 h-5" />
          </>
        ) : (
          <>
            <span>Get Started</span>
            <ArrowUpRight className="w-5 h-5" />
          </>
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{agent ? "Your On-Chain Identity" : "Account Not Registered"}</DialogTitle>
          </DialogHeader>

          {agent ? (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Agent ID</p>
                <p className="font-mono font-bold">{agent.agentId.toString()}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Domain</p>
                <p className="font-bold break-all">{agent.agentDomain}</p>
              </div>
              {publicKey && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Wallet</p>
                  <p className="font-mono font-bold">{truncateBase58(publicKey)}</p>
                </div>
              )}
              <Button
                onClick={() => {
                  setShowDialog(false);
                  navigate("/campaign");
                }}
                className="w-full bg-[#FACC15] hover:bg-[#EAB308] text-black font-bold py-2 rounded-lg"
              >
                Go to Dashboard
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">
                This wallet has not been registered to APEX yet. Head to the Campaign page to
                register a new agent and start running ads on Solana.
              </p>
              <Button
                onClick={() => {
                  setShowDialog(false);
                  navigate("/campaign");
                }}
                className="w-full bg-[#FACC15] hover:bg-[#EAB308] text-black font-bold py-2 rounded-lg"
              >
                Register an Agent
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
