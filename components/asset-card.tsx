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
  const imageUrl = resolveAssetImage(
    item.gambar,
    addModal === 'office'
      ? 'office'
      : addModal === 'kategori'
        ? 'kategori'
        : 'asset'
  );

  if (loading) {
    return (
      <div className="animate-pulse overflow-hidden rounded-sm border bg-white shadow-sm dark:bg-neutral-900">
        <div className="relative h-56 w-full bg-gray-200 dark:bg-neutral-800" />

        <div className="p-4">
          <div className="mb-2 h-6 w-3/4">
            <Skeleton className="h-6 w-full" />
          </div>
          <div className="mb-4 h-4 w-1/2">
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="h-10">
            <Skeleton className="h-10 w-full rounded-sm" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          'group cursor-pointer overflow-hidden rounded-sm border bg-white shadow-sm dark:bg-neutral-900',
          'transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
          'dark:hover:translate-y-0 dark:hover:shadow-none'
        )}
      >
        <div
          className="relative h-56 w-full cursor-zoom-in overflow-hidden bg-gray-200 dark:bg-neutral-800"
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
              className="object-cover transition-all duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400">
              Tidak ada gambar
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="truncate text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {item.kategori}
          </h3>

          <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
            {item.kompilator?.kompilator}
          </p>

          <Button
            className={cn(
              'mt-4 w-full cursor-pointer rounded-sm font-medium transition-all duration-200',
              'bg-[#01793b] text-white hover:bg-[#016c33]',
              'dark:bg-[##01793b] dark:text-white dark:hover:bg-[#043014]',
              'flex items-center justify-center gap-2'
            )}
            onClick={() => setOpen(true)}
          >
            <CirclePlus className="h-4 w-4" />
            <span>Tambahkan</span>
          </Button>
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
