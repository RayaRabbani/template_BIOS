'use client';

import Link from 'next/link';

import { FileText, Home, LayoutDashboard, Settings, Users } from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const NAV_ICON_SIZE = '3rem';

const navItems = [
  { href: '/', icon: Home, label: 'Beranda' },
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/', icon: FileText, label: 'Dokumen' },
  { href: '/', icon: Users, label: 'Pengguna' },
  { href: '/', icon: Settings, label: 'Pengaturan' },
];

export function AppNavSidebar() {
  return (
    <aside
      data-slot="nav-sidebar"
      data-nav-sidebar
      className={cn(
        'bg-sidebar text-sidebar-foreground border-sidebar-border fixed inset-y-0 left-0 z-30 hidden flex-col border-r md:flex',
        `w-[${NAV_ICON_SIZE}]`
      )}
      style={{ width: NAV_ICON_SIZE }}
    >
      <div className="border-sidebar-border flex h-14 shrink-0 items-center justify-center border-b">
        <span className="text-sidebar-foreground text-lg font-semibold">D</span>
      </div>
      <nav
        className="flex flex-1 flex-col gap-1 p-2"
        aria-label="Navigasi utama"
      >
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <Tooltip key={item.label}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex size-10 items-center justify-center rounded-md transition-colors"
                  aria-label={item.label}
                >
                  <Icon className="size-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    </aside>
  );
}
