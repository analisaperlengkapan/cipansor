"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Copy, CheckCircle2 } from "lucide-react";
import { authApi } from "@/lib/api";
import { toast } from "sonner";

const setupSchema = z.object({
  token: z.string().min(6, "Token must be 6 digits"),
});

type SetupForm = z.infer<typeof setupSchema>;

interface TwoFactorSetupProps {
  onComplete: () => void;
}

export function TwoFactorSetup({ onComplete }: TwoFactorSetupProps) {
  const [step, setStep] = useState<"scan" | "verify" | "recovery">("scan");
  const [secret, setSecret] = useState<string>("");
  const [qrCode, setQrCode] = useState<string>("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetupForm>({
    resolver: zodResolver(setupSchema),
  });

  useEffect(() => {
    const fetchSecret = async () => {
      try {
        const res = await authApi.generate2FA();
        setSecret(res.data.data.secret);
        setQrCode(res.data.data.qrCodeUrl);
      } catch (error) {
        toast.error("Failed to generate 2FA secret");
      }
    };
    fetchSecret();
  }, []);

  const onVerify = async (data: SetupForm) => {
    setIsLoading(true);
    try {
      const res = await authApi.enable2FA({
        token: data.token,
        secret: secret,
      });
      setRecoveryCodes(res.data.data.recoveryCodes);
      setStep("recovery");
      toast.success("2FA Enabled Successfully");
    } catch (error) {
      // Error handled by interceptor or store usually, but here we call api directly
      // Interceptor handles toast
    } finally {
      setIsLoading(false);
    }
  };

  const copyRecoveryCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join("\n"));
    toast.success("Recovery codes copied to clipboard");
  };

  if (!qrCode && step === "scan") {
    return <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Setup Two-Factor Authentication</h3>
        <p className="text-sm text-muted-foreground">
          {step === "scan" || step === "verify"
            ? "Scan the QR code with your authenticator app."
            : "Save your recovery codes."}
        </p>
      </div>

      {step !== "recovery" && (
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-white p-2 rounded-lg border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
          </div>

          <div className="w-full text-center">
             <p className="text-xs text-muted-foreground mb-1">Manual Entry Code:</p>
             <code className="bg-muted p-2 rounded text-sm font-mono break-all block">{secret}</code>
          </div>

          <form onSubmit={handleSubmit(onVerify)} className="w-full space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Verification Code</Label>
              <Input
                id="token"
                placeholder="123456"
                autoComplete="one-time-code"
                {...register("token")}
              />
              {errors.token && (
                <p className="text-sm text-destructive">{errors.token.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify & Enable
            </Button>
          </form>
        </div>
      )}

      {step === "recovery" && (
        <div className="space-y-4">
          <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 p-4 border border-amber-200 dark:border-amber-900">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium mb-1">Important!</p>
                <p>
                  Save these recovery codes in a safe place. You will need them if you lose access to your authenticator app.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-muted p-4 rounded-lg font-mono text-sm">
            {recoveryCodes.map((code, i) => (
              <div key={i} className="text-center">{code}</div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={copyRecoveryCodes}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy Codes
          </Button>

          <Button onClick={onComplete} className="w-full">
            Done
          </Button>
        </div>
      )}
    </div>
  );
}
