"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
  Building2,
  GraduationCap,
  Users,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

// Demo credentials for different roles organized by realm
const demoCredentials = [
  // Global
  {
    role: "Super Admin",
    email: "superadmin@cipansor.id",
    password: "SuperAdmin123!",
    description: "Akses penuh seluruh sistem",
    realm: "GLOBAL",
    icon: ShieldCheck,
    color: "bg-purple-600",
  },
  // Yayasan
  {
    role: "Ketua Yayasan",
    email: "ketua@cipansor.id",
    password: "Ketua123!",
    description: "Ketua pengurus yayasan",
    realm: "YAYASAN",
    icon: Building2,
    color: "bg-amber-500",
  },
  // SMP IT
  {
    role: "Admin SMP IT",
    email: "admin@smpit.sch.id",
    password: "Admin123!",
    description: "Administrator SMP IT",
    realm: "SMP_IT",
    icon: Building2,
    color: "bg-blue-500",
  },
  {
    role: "Kepala SMP IT",
    email: "kepala@smpit.sch.id",
    password: "Kepala123!",
    description: "Kepala Sekolah + Guru",
    realm: "SMP_IT",
    icon: GraduationCap,
    color: "bg-blue-600",
  },
  {
    role: "Guru SMP IT",
    email: "ahmad@smpit.sch.id",
    password: "Teacher123!",
    description: "Guru SMP IT",
    realm: "SMP_IT",
    icon: GraduationCap,
    color: "bg-green-500",
  },
  {
    role: "Orang Tua SMP IT",
    email: "parent1@smpit.sch.id",
    password: "Parent123!",
    description: "Orang tua siswa SMP IT",
    realm: "SMP_IT",
    icon: Users,
    color: "bg-orange-500",
  },
  {
    role: "Siswa SMP IT",
    email: "student1@smpit.sch.id",
    password: "Student123!",
    description: "Siswa SMP IT",
    realm: "SMP_IT",
    icon: UserCircle,
    color: "bg-cyan-500",
  },
  // SD IT
  {
    role: "Admin SD IT",
    email: "admin@sdit.sch.id",
    password: "Admin123!",
    description: "Administrator SD IT",
    realm: "SD_IT",
    icon: Building2,
    color: "bg-green-600",
  },
];

// Group credentials by realm for display
const realmLabels: Record<string, string> = {
  GLOBAL: "Global",
  YAYASAN: "Yayasan",
  SMP_IT: "SMP IT",
  SD_IT: "SD IT",
  TK_QURAN: "TK Qur'an",
  SMA_QURAN: "SMA Qur'an",
  PESANTREN: "Pesantren",
};

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      clearError();
      await login(data);
      router.push("/dashboard");
    } catch {
      // Error is handled in store
    }
  };

  const handleDemoLogin = (credential: (typeof demoCredentials)[0]) => {
    clearError();
    setSelectedDemo(credential.role);
    setValue("email", credential.email);
    setValue("password", credential.password);
  };

  const handleQuickLogin = async (credential: (typeof demoCredentials)[0]) => {
    try {
      clearError();
      setSelectedDemo(credential.role);
      await login({ email: credential.email, password: credential.password });
      router.push("/dashboard");
    } catch {
      // Error is handled in store
    }
  };

  return (
    <div className="flex min-h-screen bg-linear-to-br from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800">
      {/* Left side - Demo Credentials */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-8 xl:p-12">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Demo Credentials
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Click any role to try the demo. Each role has different access
            levels.
          </p>

          <div className="grid gap-3">
            {demoCredentials.map((cred) => {
              const Icon = cred.icon;
              return (
                <button
                  key={cred.role}
                  onClick={() => handleQuickLogin(cred)}
                  disabled={isLoading}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                    "hover:bg-white hover:shadow-md dark:hover:bg-gray-800",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    selectedDemo === cred.role && isLoading
                      ? "bg-white shadow-md ring-2 ring-primary dark:bg-gray-800"
                      : "bg-white/50 dark:bg-gray-800/50",
                  )}
                >
                  <div className={cn("p-2 rounded-lg text-white", cred.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {cred.role}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {cred.description}
                    </div>
                  </div>
                  {selectedDemo === cred.role && isLoading && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Note:</strong> This is a demo environment. All data is
              sample data and will be reset periodically.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground shadow-lg">
              C
            </div>
            <CardTitle className="text-2xl">Welcome to Cipansor</CardTitle>
            <CardDescription>
              Yayasan Pesantren Cipansor Management System
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    {...register("password")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>

            {/* Mobile Demo Credentials */}
            <div className="mt-6 border-t pt-4 lg:hidden">
              <p className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Quick Demo Login
              </p>
              <div className="grid grid-cols-2 gap-2">
                {demoCredentials.slice(0, 4).map((cred) => {
                  const Icon = cred.icon;
                  return (
                    <button
                      key={cred.role}
                      onClick={() => handleDemoLogin(cred)}
                      disabled={isLoading}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg border text-left transition-all text-sm",
                        "hover:bg-muted disabled:opacity-50",
                      )}
                    >
                      <div
                        className={cn("p-1.5 rounded text-white", cred.color)}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-medium truncate">{cred.role}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2 mt-2">
                {demoCredentials.slice(4).map((cred) => {
                  const Icon = cred.icon;
                  return (
                    <button
                      key={cred.role}
                      onClick={() => handleDemoLogin(cred)}
                      disabled={isLoading}
                      className={cn(
                        "flex-1 flex items-center gap-2 p-2 rounded-lg border text-left transition-all text-sm",
                        "hover:bg-muted disabled:opacity-50",
                      )}
                    >
                      <div
                        className={cn("p-1.5 rounded text-white", cred.color)}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-medium truncate">{cred.role}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
