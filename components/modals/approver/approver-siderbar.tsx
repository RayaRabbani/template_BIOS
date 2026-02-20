'use client';

import { useState } from 'react';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import {
  BookCheck,
  FilePlus,
  HandCoins,
  PackagePlus,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export function ApproverSidebar({
  className,
  onToggle,
}: {
  className?: string;
  onToggle?: (v: boolean) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  function toggle() {
    setCollapsed(!collapsed);
    onToggle?.(!collapsed);
  }

  return (
    <div className="relative">
      <aside
        className={cn(
          `fixed top-0 left-0 flex h-screen flex-col border-r bg-white transition-all duration-300 dark:bg-neutral-900`,
          collapsed ? 'w-20' : 'w-64',
          className
        )}
      >
        <div
          className={cn(
            'flex items-center gap-3 px-4 py-4 transition-all',
            collapsed ? 'justify-center' : ''
          )}
        >
          <div className="rounded-md bg-neutral-50 p-1 dark:bg-neutral-800">
            <BookCheck className="text-neutral-800 dark:text-neutral-200" />
          </div>

          {!collapsed && (
            <h1 className="text-base font-semibold whitespace-nowrap text-neutral-900 dark:text-neutral-100">
              BIOS
            </h1>
          )}
        </div>

        <nav
          className={cn(
            'flex-1 space-y-1 px-3 text-sm transition-all',
            collapsed ? 'mt-1' : ''
          )}
        >
          {!collapsed && (
            <p className="mb-2 text-xs text-gray-500 uppercase dark:text-neutral-200">
              Approval
            </p>
          )}

          <SidebarItem
            collapsed={collapsed}
            href="/approver/peminjaman"
            label="Peminjaman"
            icon={
              <HandCoins
                style={{ width: '20px', height: '20px', flexShrink: 0 }}
              />
            }
          />

          <SidebarItem
            collapsed={collapsed}
            href="/approver/permintaan"
            label="Permintaan"
            icon={
              <FilePlus
                style={{ width: '20px', height: '20px', flexShrink: 0 }}
              />
            }
          />

          <SidebarItem
            collapsed={collapsed}
            href="/approver/office-supplies"
            label="Permintaan Office Supplies"
            icon={
              <PackagePlus
                style={{ width: '20px', height: '20px', flexShrink: 0 }}
              />
            }
          />
        </nav>

        <Button
          variant="secondary"
          size="icon"
          onClick={toggle}
          className={cn(
            `absolute top-6 z-50 hidden h-11 w-11 -translate-x-8 cursor-pointer items-center justify-center rounded-full border bg-white shadow-md transition hover:scale-110 md:flex dark:bg-neutral-800`,
            collapsed ? 'left-[5rem]' : 'left-[16rem]'
          )}
        >
          {collapsed ? (
            <PanelLeftOpen size={26} className="!h-auto !w-auto" />
          ) : (
            <PanelLeftClose size={26} className="!h-auto !w-auto" />
          )}
        </Button>

        <div
          className={cn(
            'border-t border-neutral-200 px-3 pt-2 pb-4 dark:border-neutral-800',
            collapsed ? 'flex items-center justify-center' : ''
          )}
        >
          <Popover>
            <PopoverTrigger asChild>
              <button
                aria-label="Profile options"
                className={cn(
                  'w-full cursor-pointer rounded-md px-3 py-2 text-left transition-all hover:bg-gray-50 hover:shadow-sm dark:hover:bg-neutral-800',
                  collapsed
                    ? 'flex items-center justify-center'
                    : 'flex items-center gap-3'
                )}
              >
                <Avatar className="h-9 w-9 overflow-hidden rounded-full">
                  <AvatarImage src="/images/avatar-pic.jpg" alt="profile" className="object-cover object-top w-full h-full" />
                  <AvatarFallback className="rounded-full">JA</AvatarFallback>
                </Avatar>

                {!collapsed && (
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Joko Akbar</span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      Approver
                    </span>
                  </div>
                )}
              </button>
            </PopoverTrigger>

            <PopoverContent
              side="right"
              align="start"
              sideOffset={8}
              className="w-48 rounded-md border border-neutral-200 bg-white p-2 shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
            >
              <NavCard />
            </PopoverContent>
          </Popover>
        </div>
      </aside>
    </div>
  );
}

function NavCard() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="ghost"
        onClick={() => router.push('/user/barang-inventaris/peminjaman')}
        className="w-full cursor-pointer justify-start px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        <span className="font-medium">User</span>
      </Button>

      <Button
        variant="ghost"
        onClick={() => router.push('/approver/peminjaman')}
        className="w-full cursor-pointer justify-start px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        <span className="font-medium">Approver</span>
      </Button>
    </div>
  );
}

function SidebarItem({
  href,
  label,
  icon,
  collapsed,
}: {
  href: string;
  label: string;
  icon?: React.ReactNode;
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const active = pathname && (pathname === href || pathname.startsWith(href));

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 transition-colors',
        active
          ? 'bg-[#01793b] font-semibold text-white dark:bg-[#01793b]'
          : 'text-neutral-700 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-800',
        collapsed && 'justify-center px-2'
      )}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}
