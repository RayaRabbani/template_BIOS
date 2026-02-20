'use client';

import React from 'react';

import { usePathname } from 'next/navigation';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';

type Props = {
  children: React.ReactNode;
};

export default function ConditionalSidebar({ children }: Props) {
  const pathname = usePathname();

  // Hide sidebars on auth routes (e.g. /auth/signin)
  const hide = typeof pathname === 'string' && pathname.startsWith('/auth');

  if (hide) {
    return (
      <div className="flex h-screen flex-col overflow-hidden">
        <div className="flex-1 overflow-auto px-4 py-4 md:px-6">{children}</div>
        <Toaster />
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': '350px',
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset className="flex h-screen flex-col overflow-hidden">
        <div className="flex-1 overflow-auto px-4 py-4 md:px-6">{children}</div>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
