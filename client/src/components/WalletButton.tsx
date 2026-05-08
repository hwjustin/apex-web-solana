/**
 * WalletButton — Solana wallet connect/disconnect.
 *
 * Wraps `@solana/wallet-adapter-react-ui`'s modal so the visual style stays
 * consistent with the rest of the APEX nav (yellow accent, dark pill).
 */

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { truncateBase58 } from "@/lib/solana/utils";
import { Wallet } from "lucide-react";

export function WalletButton() {
  const { publicKey, connected, disconnect, connecting } = useWallet();
  const { setVisible } = useWalletModal();

  const handleClick = () => {
    if (connected) {
      void disconnect();
    } else {
      setVisible(true);
    }
  };

  const label = connecting
    ? "Connecting…"
    : connected && publicKey
      ? truncateBase58(publicKey)
      : "Connect Wallet";

  return (
    <Button
      onClick={handleClick}
      className="bg-black hover:bg-gray-800 text-white font-semibold px-4 md:px-6 py-2 rounded-full flex items-center gap-2"
    >
      <Wallet className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{connected ? "Wallet" : "Connect"}</span>
    </Button>
  );
}
