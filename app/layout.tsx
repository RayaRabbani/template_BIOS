import type { Metadata } from 'next';
import { Geist, Geist_Mono, Inter } from 'next/font/google';

import { SessionProvider } from 'next-auth/react';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ApiProvider } from '@/providers/api-provider';

import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'BIOS | Barang Inventaris & Office Supplies',
  description:
    'Sistem manajemen barang inventaris dan office supplies Pupuk Kujang',
  keywords: [
    'inventaris',
    'office supplies',
    'pupuk kujang',
    'barang',
    'peminjaman',
    'permintaan',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} h-screen flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 antialiased transition-all duration-300 dark:bg-neutral-900`}
      >
        <SessionProvider>
          <ApiProvider>
            <TooltipProvider>
              <SidebarProvider
                style={
                  {
                    '--sidebar-width': '350px',
                  } as React.CSSProperties
                }
              >
                <AppSidebar />
                <SidebarInset className="flex h-screen flex-col overflow-hidden">
                  <div className="flex-1 overflow-auto px-4 py-4 md:px-6">
                    {children}
                  </div>
                </SidebarInset>
              </SidebarProvider>
            </TooltipProvider>
          </ApiProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
