"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { authApi } from "@/lib/api";
import { TwoFactorSetup } from "@/components/auth/TwoFactorSetup";
import { TwoFactorVerify } from "@/components/auth/TwoFactorVerify";
import { toast } from "sonner";
import { ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";

export function TwoFactorSettings() {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isDisableOpen, setIsDisableOpen] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await authApi.get2FAStatus();
      setIsEnabled(res.data.data.isEnabled);
    } catch {
      toast.error("Failed to fetch 2FA status");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleDisable = async (token: string) => {
    try {
      await authApi.disable2FA({ token });
      toast.success("2FA Disabled Successfully");
      setIsDisableOpen(false);
      fetchStatus();
    } catch {
      // Error handled by interceptor
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isEnabled ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full text-sm font-medium">
                <ShieldCheck className="h-4 w-4" />
                Enabled
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full text-sm font-medium">
                <ShieldAlert className="h-4 w-4" />
                Disabled
              </div>
            )}
          </div>

          {!isEnabled ? (
            <Dialog open={isSetupOpen} onOpenChange={setIsSetupOpen}>
              <DialogTrigger asChild>
                <Button>Activate 2FA</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
                  <DialogDescription>
                    Scan the QR code with your authenticator app (Google
                    Authenticator, Authy, etc).
                  </DialogDescription>
                </DialogHeader>
                <TwoFactorSetup
                  onComplete={() => {
                    setIsSetupOpen(false);
                    fetchStatus();
                  }}
                />
              </DialogContent>
            </Dialog>
          ) : (
            <Dialog open={isDisableOpen} onOpenChange={setIsDisableOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">Deactivate 2FA</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
                  <DialogDescription>
                    Please enter your OTP to confirm deactivation.
                  </DialogDescription>
                </DialogHeader>
                <TwoFactorVerify onVerify={handleDisable} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
