"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const verifySchema = z.object({
  token: z.string().min(6, "Token must be at least 6 characters"),
});

type VerifyForm = z.infer<typeof verifySchema>;

interface TwoFactorVerifyProps {
  onVerify: (token: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export function TwoFactorVerify({
  onVerify,
  isLoading,
  error,
}: TwoFactorVerifyProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyForm>({
    resolver: zodResolver(verifySchema),
  });

  const onSubmit = async (data: VerifyForm) => {
    await onVerify(data.token);
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Two-Factor Authentication</h3>
        <p className="text-sm text-muted-foreground">
          Enter the code from your authenticator app.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="token">Authentication Code</Label>
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
          Verify
        </Button>
      </form>
    </div>
  );
}
