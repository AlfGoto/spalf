"use client";

import { useState } from "react";
import { Button } from "@/package/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/package/ui/dialog";
import { Input } from "@/package/ui/input";
import { Label } from "@/package/ui/label";
import { Copy, Check, AlertTriangle } from "lucide-react";

interface SecretDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  secretToken: string;
  authorizationHeader: string;
  integrationId: string;
}

export function SecretDialog({
  open,
  onOpenChange,
  title,
  secretToken,
  authorizationHeader,
  integrationId,
}: SecretDialogProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Fallback for browsers that don't support clipboard API
      console.error("Failed to copy to clipboard");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Save this information now. The secret token will not be shown again!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Important:</strong> Copy and securely store these
              credentials. The secret token cannot be retrieved after closing
              this dialog.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Integration ID</Label>
            <div className="flex gap-2">
              <Input
                value={integrationId}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleCopy(integrationId, "id")}
              >
                {copiedField === "id" ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Secret Token</Label>
            <div className="flex gap-2">
              <Input
                value={secretToken}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleCopy(secretToken, "secret")}
              >
                {copiedField === "secret" ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Authorization Header</Label>
            <p className="text-xs text-gray-500 mb-1">
              Use this in your API requests as the Authorization header.
            </p>
            <div className="flex gap-2">
              <Input
                value={authorizationHeader}
                readOnly
                className="font-mono text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleCopy(authorizationHeader, "header")}
              >
                {copiedField === "header" ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            I've Saved the Credentials
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
