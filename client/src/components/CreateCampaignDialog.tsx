/**
 * CreateCampaignDialog (Solana)
 *
 * Collects campaign parameters and submits to the apex-solana program in a
 * single transaction. The SPL token transfer into the vault PDA happens
 * atomically inside `create_campaign` — no separate "approve" step is needed.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, DollarSign, Calendar, FileText, Type, AlignLeft } from "lucide-react";
import { toast } from "sonner";
import BN from "bn.js";

import { useCreateCampaign } from "@/lib/solana/hooks/useCampaign";
import { parseUsdc } from "@/lib/solana/utils";
import { explorerTxUrl } from "@/lib/solana/config";

interface CreateCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  advertiserId: BN;
  onSuccess?: () => void;
}

interface CampaignSpec {
  title: string;
  description: string;
  rules: string;
  createdAt: number;
}

export function CreateCampaignDialog({
  open,
  onOpenChange,
  advertiserId,
  onSuccess,
}: CreateCampaignDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [cpaAmount, setCpaAmount] = useState("");
  const [startDateTime, setStartDateTime] = useState("");
  const [expiryDateTime, setExpiryDateTime] = useState("");
  const [rules, setRules] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const createCampaign = useCreateCampaign();

  const reset = () => {
    setTitle("");
    setDescription("");
    setBudgetAmount("");
    setCpaAmount("");
    setStartDateTime("");
    setExpiryDateTime("");
    setRules("");
    setValidationError(null);
  };

  const handleSubmit = async () => {
    setValidationError(null);
    try {
      if (!title.trim()) throw new Error("Title is required");
      if (!budgetAmount || parseFloat(budgetAmount) <= 0) throw new Error("Budget must be > 0");
      if (!cpaAmount || parseFloat(cpaAmount) <= 0) throw new Error("CPA must be > 0");
      if (parseFloat(cpaAmount) > parseFloat(budgetAmount))
        throw new Error("CPA cannot exceed budget");
      if (!startDateTime || !expiryDateTime) throw new Error("Start and expiry are required");

      const startSec = Math.floor(new Date(startDateTime).getTime() / 1000);
      const expirySec = Math.floor(new Date(expiryDateTime).getTime() / 1000);
      const nowSec = Math.floor(Date.now() / 1000);
      if (startSec >= expirySec) throw new Error("Start must be before expiry");
      if (expirySec <= nowSec) throw new Error("Expiry must be in the future");

      const spec: CampaignSpec = {
        title: title.trim(),
        description: description.trim(),
        rules: rules.trim(),
        createdAt: nowSec,
      };

      const result = await createCampaign.mutateAsync({
        advertiserId,
        budgetAmount: parseUsdc(budgetAmount),
        cpaAmount: parseUsdc(cpaAmount),
        startTime: new BN(startSec),
        expiryTime: new BN(expirySec),
        spec: Buffer.from(JSON.stringify(spec)),
      });

      toast.success("Campaign created", {
        description: `Tx: ${result.signature.slice(0, 8)}…`,
        action: {
          label: "View",
          onClick: () => window.open(explorerTxUrl(result.signature), "_blank"),
        },
      });

      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setValidationError(msg);
      toast.error("Failed to create campaign", { description: msg });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Campaign</DialogTitle>
          <DialogDescription>
            Fund a new on-chain campaign. The full budget is escrowed in a vault PDA when this
            transaction confirms — no separate approval step.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              Title
            </Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              <AlignLeft className="w-4 h-4" />
              Description
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Budget (USDC)
              </Label>
              <Input
                id="budget"
                type="number"
                inputMode="decimal"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpa" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                CPA (USDC)
              </Label>
              <Input
                id="cpa"
                type="number"
                inputMode="decimal"
                value={cpaAmount}
                onChange={(e) => setCpaAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Start
              </Label>
              <Input
                id="start"
                type="datetime-local"
                value={startDateTime}
                onChange={(e) => setStartDateTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiry" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Expiry
              </Label>
              <Input
                id="expiry"
                type="datetime-local"
                value={expiryDateTime}
                onChange={(e) => setExpiryDateTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rules" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Targeting / rules
            </Label>
            <Input
              id="rules"
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder="e.g. minimum quality score 70"
            />
          </div>

          {validationError && <p className="text-sm text-red-600">{validationError}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={createCampaign.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createCampaign.isPending}
            className="bg-[#FACC15] hover:bg-[#EAB308] text-black font-bold"
          >
            {createCampaign.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating…
              </>
            ) : (
              "Create campaign"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
