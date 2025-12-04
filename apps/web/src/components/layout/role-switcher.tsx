'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/auth';
import { ChevronDown, Check, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserRole {
  id: string;
  isPrimary: boolean;
  role: {
    id: string;
    code: string;
    name: string;
    realm: string;
  };
  unit?: {
    id: string;
    name: string;
  } | null;
}

interface RoleSwitcherProps {
  className?: string;
}

// Realm display names
const realmDisplayNames: Record<string, string> = {
  GLOBAL: 'Global',
  YAYASAN: 'Yayasan',
  PAUD: 'PAUD',
  SD_IT: 'SD IT',
  SMP_IT: 'SMP IT',
  SMA_ALQURAN: 'SMA Al-Qur\'an',
};

// Realm colors for badges
const realmColors: Record<string, string> = {
  GLOBAL: 'bg-purple-500',
  YAYASAN: 'bg-amber-500',
  PAUD: 'bg-pink-500',
  SD_IT: 'bg-green-500',
  SMP_IT: 'bg-blue-500',
  SMA_ALQURAN: 'bg-emerald-500',
};

export function RoleSwitcher({ className }: RoleSwitcherProps) {
  const { user, switchRole } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  
  const userRoles = user?.userRoles as UserRole[] | undefined;
  
  // If user has no roles or only one role, don't show switcher
  if (!userRoles || userRoles.length <= 1) {
    const singleRole = userRoles?.[0];
    if (singleRole) {
      return (
        <div className={cn('flex items-center gap-2', className)}>
          <Badge variant="secondary" className={cn('text-white', realmColors[singleRole.role.realm])}>
            {realmDisplayNames[singleRole.role.realm]}
          </Badge>
          <span className="text-sm font-medium">{singleRole.role.name}</span>
        </div>
      );
    }
    return null;
  }
  
  // Find current active (primary) role
  const activeRole = userRoles.find(r => r.isPrimary) || userRoles[0];
  
  const handleSwitchRole = async (roleAssignmentId: string) => {
    if (roleAssignmentId === activeRole?.id) return;
    
    setIsLoading(true);
    try {
      await switchRole(roleAssignmentId);
    } catch (error) {
      console.error('Failed to switch role:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Group roles by realm
  const rolesByRealm = userRoles.reduce((acc, role) => {
    const realm = role.role.realm;
    if (!acc[realm]) acc[realm] = [];
    acc[realm].push(role);
    return acc;
  }, {} as Record<string, UserRole[]>);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={cn('gap-2', className)}
          disabled={isLoading}
        >
          <Badge 
            variant="secondary" 
            className={cn('text-white text-xs', realmColors[activeRole.role.realm])}
          >
            {realmDisplayNames[activeRole.role.realm]}
          </Badge>
          <span className="hidden sm:inline max-w-[150px] truncate">
            {activeRole.role.name}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
        <DropdownMenuLabel>Pilih Role</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {Object.entries(rolesByRealm).map(([realm, roles]) => (
          <div key={realm}>
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              {realmDisplayNames[realm]}
            </DropdownMenuLabel>
            {roles.map((role) => (
              <DropdownMenuItem
                key={role.id}
                onClick={() => handleSwitchRole(role.id)}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex flex-col">
                    <span className="font-medium">{role.role.name}</span>
                    {role.unit && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {role.unit.name}
                      </span>
                    )}
                  </div>
                  {role.id === activeRole.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
