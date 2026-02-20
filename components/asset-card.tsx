'use client';

import { useState } from 'react';

import Image from 'next/image';

import { CirclePlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { resolveAssetImage } from '@/lib/images';
import { cn } from '@/lib/utils';
import type { AssetCardProps } from '@/types/user/components';

import { AddAssetModal } from './modals/user/barang-inventaris/add-asset-modal';
import AddOfficeSupplyModal from './modals/user/office-supplies/add-asset-modal';

export default function AssetCard({
  item,
  onAdd,
  onAddedSuccess,
  type = 'peminjaman',
  addModal = 'default',
  allItems = [],
  loading = false,
}: AssetCardProps) {
  const [open, setOpen] = useState(false);
  const [openPreview, setOpenPreview] = useState(false);
  const imageUrl =
    !loading && item
      ? resolveAssetImage(
          item.gambar,
          addModal === 'office'
            ? 'office'
            : addModal === 'kategori'
              ? 'kategori'
              : 'asset'
        )
      : '';

  if (loading) {
    return (
      <div className="group relative overflow-hidden rounded-2xl border border-neutral-100 bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="aspect-[4/3] w-full rounded-xl bg-neutral-100 dark:bg-neutral-800">
          <Skeleton className="h-full w-full" />
        </div>
        <div className="px-1 pt-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="mt-4">
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white p-3 shadow-sm transition-all duration-300',
          'hover:border-emerald-100/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]',
          'dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-emerald-900/50 dark:hover:shadow-neutral-900/50'
        )}
      >
        <div
          className="relative aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-xl bg-neutral-50 dark:bg-neutral-800"
          onClick={() => setOpenPreview(true)}
          role="button"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') setOpenPreview(true);
          }}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={item.kategori}
              fill
              unoptimized
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-neutral-300">
              <div className="rounded-full bg-neutral-100 p-3 dark:bg-neutral-800">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <span className="text-xs font-medium">No Image</span>
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-black/5 ring-inset dark:ring-white/10" />
        </div>

        <div className="flex flex-1 flex-col px-1 pt-4">
          <div className="flex-1 space-y-1">
            <h3 className="line-clamp-1 text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
              {item.kategori}
            </h3>

            <p className="line-clamp-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
              {item.kompilator?.kompilator || 'Unknown Department'}
            </p>
          </div>

          <div className="mt-5">
            <Button
              className={cn(
                'h-10 w-full border border-emerald-200/50 shadow-none',
                'bg-emerald-50 text-emerald-700 hover:border-transparent hover:bg-emerald-600 hover:text-white',
                'dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white',
                'flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-300'
              )}
              onClick={() => setOpen(true)}
              size="sm"
            >
              <CirclePlus className="h-4 w-4" />
              <span>Tambahkan</span>
            </Button>
          </div>
        </div>
      </div>

      {addModal === 'office' ? (
        <AddOfficeSupplyModal
          open={open}
          onClose={() => setOpen(false)}
          produkId={item.id}
          onSubmit={data => {
            onAdd({
              ...item,
              qty: data.qty,
              note: data.notes,
            });
            setOpen(false);
            if (typeof onAddedSuccess === 'function') onAddedSuccess();
          }}
        />
      ) : (
        <AddAssetModal
          open={open}
          onClose={() => setOpen(false)}
          item={item}
          type={type}
          suggestedItems={allItems}
          onSubmit={data => {
            onAdd({
              ...item,
              qty: data.qty,
              note: data.notes,
            });
            setOpen(false);
            if (typeof onAddedSuccess === 'function') onAddedSuccess();
          }}
          onSuccess={onAddedSuccess}
        />
      )}

      <Dialog open={openPreview} onOpenChange={setOpenPreview}>
        <DialogContent className="max-w-4xl border-none bg-transparent p-0 shadow-none [&>button]:hidden">
          <DialogHeader>
            <DialogTitle className="sr-only">
              Preview of {item.kategori}
            </DialogTitle>
          </DialogHeader>

          <div className="relative h-[80vh] w-full bg-transparent">
            <Image
              src={imageUrl || '/images/no-image.png'}
              alt={item.kategori}
              fill
              unoptimized
              className="cursor-zoom-out object-contain"
              onClick={() => setOpenPreview(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
