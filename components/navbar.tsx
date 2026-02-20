'use client';

import React from 'react';

import { usePathname, useRouter } from 'next/navigation';

import { DialogTitle } from '@radix-ui/react-dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { ChevronRight, Folder, List, Search } from 'lucide-react';
import { useTheme } from 'next-themes';

import { CustomBIOSSidebar } from '@/components/app-sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export interface NavbarProps {
  title?: string | React.ReactNode;
  breadcrumb?: string[];
  leftAction?: React.ReactNode;
  cartCount?: number;
  onCartClick?: () => void;
  search?: string;
  onSearchChange?: (v: string) => void;
  showCart?: boolean;
  showSearch?: boolean;
  rightAction?: React.ReactNode;
  cartLabel?: string;
}

export default function Navbar({
  title,
  breadcrumb = [],
  leftAction,
  cartCount = 0,
  onCartClick,
  search,
  onSearchChange,
  showCart = true,
  showSearch = true,
  rightAction,
  cartLabel,
}: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const pathname = usePathname();
  const isApprover =
    typeof pathname === 'string' && pathname.startsWith('/approver');
  const router = useRouter();

  React.useEffect(() => {
    setMounted(true);
  }, []);
  const { openMobile, setOpenMobile } = useSidebar();

  if (!mounted) return null;
  return (
    <div className="mb-6">
      <div className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="md:hidden">
              <SidebarTrigger className="cursor-pointer" />
              <Sheet open={openMobile} onOpenChange={setOpenMobile}>
                <SheetContent side="left" className="w-64 p-0">
                  <CustomBIOSSidebar />
                </SheetContent>
              </Sheet>
            </div>

            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {title}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {(() => {
                  const t = (title || '').toString().toLowerCase();

                  // Approver
                  if (t.includes('approval') && t.includes('peminjaman'))
                    return 'Daftar Data Approval Peminjaman Asset';
                  if (
                    t.includes('approval') &&
                    t.includes('permintaan') &&
                    t.includes('office')
                  )
                    return 'Daftar Data Approval Permintaan Office Supplies';
                  if (t.includes('approval') && t.includes('permintaan'))
                    return 'Daftar Data Approval Permintaan Asset';

                  // User
                  if (
                    t.includes('peminjaman') &&
                    (t.includes('barang') ||
                      t.includes('inventaris') ||
                      t.includes('asset'))
                  )
                    return 'Daftar Peminjaman Barang Inventaris';
                  if (
                    t.includes('permintaan') &&
                    (t.includes('barang') ||
                      t.includes('inventaris') ||
                      t.includes('asset'))
                  )
                    return 'Daftar Permintaan Barang Inventaris';
                  if (
                    t.includes('permintaan') &&
                    (t.includes('office') ||
                      t.includes('consumable') ||
                      t.includes('supplies'))
                  )
                    return 'Daftar Permintaan Office Supplies';
                  if (
                    t.includes('transaksi') &&
                    (t.includes('barang') ||
                      t.includes('inventaris') ||
                      t.includes('asset'))
                  )
                    return 'Daftar Data Transaksi Asset';
                  if (
                    t.includes('transaksi') &&
                    (t.includes('consumable') || t.includes('office'))
                  )
                    return 'Daftar Data Transaksi Consumable';

                  // Fallbacks
                  if (
                    t.includes('office') ||
                    t.includes('consumable') ||
                    t.includes('supplies')
                  )
                    return 'Office Supplies';
                  if (
                    t.includes('barang') ||
                    t.includes('inventaris') ||
                    t.includes('asset')
                  )
                    return 'Barang Inventaris';
                  return 'Detail Transaksi';
                })()}
              </p>
            </div>
          </div>

          <div className="hidden flex-1 md:flex"></div>

          <div className="flex items-center gap-3">
            {isApprover && rightAction ? (
              <div className="hidden items-center md:flex">{rightAction}</div>
            ) : null}
            {showSearch && (
              <div className="hidden items-center gap-2 md:flex">
                {/* <Button
                  variant="outline"
                  size="icon"
                  className="cursor-pointer rounded-full border border-gray-300 hover:bg-gray-50 dark:border-neutral-600 dark:hover:bg-neutral-700"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </Button> */}

                <div className="relative">
                  <Search
                    size={16}
                    className="absolute top-1/2 left-3 -translate-y-1/2 text-black dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={search || ''}
                    onChange={e => onSearchChange?.(e.target.value)}
                    className="h-10 w-48 rounded-md border border-gray-300 bg-white py-1 pr-3 pl-10 text-sm text-black placeholder-black placeholder:font-semibold focus:border-transparent focus:ring-2 focus:ring-[#01793b] focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-white dark:placeholder-white"
                  />
                </div>
              </div>
            )}

            {/* {!showSearch && (
              <Button
                variant="outline"
                size="icon"
                className="cursor-pointer rounded-full border border-gray-300 hover:bg-gray-50 dark:border-neutral-600 dark:hover:bg-neutral-700"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </Button>
            )} */}

            {showCart && (
              <Button
                className={cn(
                  'relative flex h-10 cursor-pointer items-center rounded-md px-3 text-sm shadow-sm transition',
                  'bg-[#01793b] text-white hover:bg-[#016c33]',
                  'dark:bg-[#01793b] dark:text-white dark:hover:bg-[#043014]'
                )}
                onClick={onCartClick}
              >
                <List size={18} className="sm:mr-1" />
                <span className="hidden sm:inline">
                  {cartLabel ?? 'Peminjaman'}
                </span>
                {((cartLabel || '').toString().toLowerCase() === 'pending'
                  ? true
                  : cartCount >= 0) && (
                  <span className="text-s absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[12px] text-white shadow-md">
                    {cartCount}
                  </span>
                )}
              </Button>
            )}

            {!isApprover && rightAction}
          </div>
        </div>

        <div className="mt-4 flex flex-col">
          <div className="overflow-x-auto px-1">
            <div className="flex min-w-0 flex-nowrap items-center gap-2">
              {leftAction && (
                <div className="mr-2 flex-shrink-0">{leftAction}</div>
              )}

              <div className="hidden items-center gap-2 md:flex">
                <SidebarTrigger className="rounded p-1 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800" />
                <div className="h-5 w-px bg-gray-300 dark:bg-gray-600"></div>
              </div>

              <div className="flex h-8 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-300">
                <Folder size={16} />
              </div>

              {breadcrumb.length > 0 ? (
                <>
                  <ChevronRight size={16} className="text-gray-800" />
                  {(() => {
                    const item = breadcrumb[0];
                    const href =
                      item?.toLowerCase().includes('barang inventaris') ||
                      item
                        ?.toLowerCase()
                        .includes('transaksi barang inventaris')
                        ? '/user/transaksi-saya/laporan-barang-inventaris'
                        : item?.toLowerCase().includes('office supplies') ||
                            item
                              ?.toLowerCase()
                              .includes('transaksi office supplies')
                          ? '/user/transaksi-saya/laporan-office-supplies'
                          : undefined;

                    return (
                      <div className="flex h-8 items-center rounded-md border border-gray-200 bg-white text-sm text-gray-700 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-300">
                        {href ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(href)}
                            className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            <Folder size={16} />
                            {item}
                          </Button>
                        ) : (
                          <span className="font-medium">{item}</span>
                        )}
                      </div>
                    );
                  })()}

                  <ChevronRight size={16} className="text-gray-800" />
                  <div className="flex h-8 items-center rounded-md border border-gray-200 bg-white text-sm text-gray-700 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-300">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      <Folder size={16} />
                      {title}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <ChevronRight size={16} className="text-gray-800" />
                  <div className="flex h-8 items-center rounded-md border border-gray-200 bg-white text-sm text-gray-700 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-300">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      <Folder size={16} />
                      {title}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showSearch && (
        <div className="py-3 md:hidden">
          <Input
            type="text"
            placeholder="Search..."
            value={search || ''}
            onChange={e => onSearchChange?.(e.target.value)}
            className="h-10 w-full rounded-md py-1 placeholder:font-bold"
          />
        </div>
      )}
    </div>
  );
}
