/**
 * Action Menu Component
 * Standardized dropdown menu for row actions
 */

'use client';

import { MoreHorizontal, Eye, Pencil, Trash2, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

export interface ActionMenuItem {
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
  external?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  trigger?: React.ReactNode;
}

export function ActionMenu({ items, trigger }: ActionMenuProps) {
  const defaultItems = items.filter((item) => item.variant !== 'destructive');
  const destructiveItems = items.filter((item) => item.variant === 'destructive');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Aksi</span>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {defaultItems.map((item, index) => (
          <MenuItem key={index} item={item} />
        ))}
        {destructiveItems.length > 0 && defaultItems.length > 0 && (
          <DropdownMenuSeparator />
        )}
        {destructiveItems.map((item, index) => (
          <MenuItem key={`destructive-${index}`} item={item} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MenuItem({ item }: { item: ActionMenuItem }) {
  const content = (
    <>
      {item.icon}
      {item.label}
      {item.external && <ExternalLink className="ml-auto h-3 w-3" />}
    </>
  );

  if (item.href) {
    return (
      <DropdownMenuItem asChild disabled={item.disabled}>
        <Link
          href={item.href}
          target={item.external ? '_blank' : undefined}
          rel={item.external ? 'noopener noreferrer' : undefined}
          className="flex items-center gap-2"
        >
          {content}
        </Link>
      </DropdownMenuItem>
    );
  }

  return (
    <DropdownMenuItem
      onClick={item.onClick}
      disabled={item.disabled}
      className={item.variant === 'destructive' ? 'text-destructive focus:text-destructive' : ''}
    >
      <span className="flex items-center gap-2">{content}</span>
    </DropdownMenuItem>
  );
}

// Pre-configured common action items
export const commonActions = {
  view: (href: string): ActionMenuItem => ({
    label: 'Lihat Detail',
    icon: <Eye className="h-4 w-4" />,
    href,
  }),
  edit: (href: string): ActionMenuItem => ({
    label: 'Edit',
    icon: <Pencil className="h-4 w-4" />,
    href,
  }),
  delete: (onClick: () => void): ActionMenuItem => ({
    label: 'Hapus',
    icon: <Trash2 className="h-4 w-4" />,
    onClick,
    variant: 'destructive',
  }),
  copy: (onClick: () => void): ActionMenuItem => ({
    label: 'Salin',
    icon: <Copy className="h-4 w-4" />,
    onClick,
  }),
};
