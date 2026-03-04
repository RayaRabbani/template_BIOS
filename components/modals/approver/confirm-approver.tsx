'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { resolveAssetImage } from '@/lib/images';
import type { ModalTarget } from '@/types/approver/modals';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  action: 'approve' | 'reject' | 'cancel' | null;
  target: ModalTarget | null;
  onConfirm: (note?: string) => Promise<void> | void;
  loading?: boolean;
  type?: 'peminjaman' | 'permintaan' | 'office-supplies';
};

export default function ConfirmApprover({
  open,
  onOpenChange,
  action,
  target,
  onConfirm,
  loading,
  type = 'peminjaman',
}: Props) {
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setNote('');
        setError(null);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [open]);

  const showNoteField =
    (type === 'peminjaman' ||
      type === 'permintaan' ||
      type === 'office-supplies') &&
    (action === 'approve' || action === 'reject');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-lg flex-col overflow-hidden rounded-md bg-white dark:bg-neutral-900">
        <DialogTitle className="-mt-1 mb-2">
          {action === 'approve'
            ? 'Konfirmasi Approve'
            : action === 'cancel'
              ? 'Konfirmasi Cancel'
              : 'Konfirmasi Reject'}
        </DialogTitle>

        {(() => {
          if (!target) {
            return (
              <p className="text-sm text-neutral-600">
                Transaksi tidak ditemukan.
              </p>
            );
          }

          return (
            <div className="flex flex-1 flex-col gap-4 overflow-hidden">
              <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/40">
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="text-neutral-500">No Transaksi</div>
                  <div className="font-semibold">
                    {target.transactionNo ?? target.transaction_id ?? '-'}
                  </div>
                  {(() => {
                    const tType = target.type ?? target.tipe;
                    const label =
                      tType === 'peminjaman' ? 'Peminjam' : 'Pengaju';
                    const value = target.employee ?? target.nama ?? '-';
                    return (
                      <>
                        <div className="text-neutral-500">{label}</div>
                        <div className="font-semibold">{value}</div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="flex flex-col gap-2 overflow-hidden">
                <p className="text-sm font-semibold">
                  Daftar Asset (
                  {(() => {
                    if (Array.isArray(target.item) && target.item.length > 0) {
                      return target.item.length;
                    }
                    if (target.assetName) {
                      return 1;
                    }
                    return 0;
                  })()}
                  )
                </p>

                <ScrollArea
                  className={`${
                    (Array.isArray(target.item) && target.item.length > 1) ||
                    (!target.item?.length && target.assetName)
                      ? 'h-[200px] max-h-[200px]'
                      : 'h-[100px] max-h-[100px]'
                  } overflow-hidden rounded-md`}
                >
                  <div className="mt-1 mb-1 space-y-3">
                    {Array.isArray(target.item) && target.item.length > 0 ? (
                      // Display items from array
                      target.item.map((asset, index) => (
                        <div
                          key={asset.id ?? index}
                          className="flex items-center gap-3 rounded-sm border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-800/40"
                        >
                          <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-sm border">
                            {resolveAssetImage(
                              asset.pic,
                              type === 'office-supplies' ? 'office' : 'asset'
                            ) ? (
                              <Image
                                src={
                                  resolveAssetImage(
                                    asset.pic,
                                    type === 'office-supplies'
                                      ? 'office'
                                      : 'asset'
                                  ) ?? '/placeholder.png'
                                }
                                alt={asset.nama || '-'}
                                width={56}
                                height={56}
                                className="h-14 w-14 rounded-sm object-cover object-top"
                              />
                            ) : (
                              <div className="flex h-14 w-14 items-center justify-center rounded-sm bg-neutral-100 text-sm">
                                {asset.nama?.substring(0, 2).toUpperCase() ||
                                  'AS'}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium break-words whitespace-normal">
                              {asset.nama}
                            </p>
                            <p className="text-xs text-neutral-500">
                              Jumlah: {asset.qty ?? 0}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : target.assetName ? (
                      // Fallback: display single asset from individual properties
                      <div className="flex items-center gap-3 rounded-sm border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-800/40">
                        <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-sm border">
                          {resolveAssetImage(
                            (target as ModalTarget & { assetImage?: string })
                              .assetImage,
                            type === 'office-supplies' ? 'office' : 'asset'
                          ) ? (
                            <Image
                              src={
                                resolveAssetImage(
                                  (
                                    target as ModalTarget & {
                                      assetImage?: string;
                                    }
                                  ).assetImage,
                                  type === 'office-supplies'
                                    ? 'office'
                                    : 'asset'
                                ) ?? '/placeholder.png'
                              }
                              alt={target.assetName || '-'}
                              width={56}
                              height={56}
                              className="h-14 w-14 rounded-sm object-cover object-top"
                            />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-sm bg-neutral-100 text-sm">
                              {target.assetName
                                ?.substring(0, 2)
                                .toUpperCase() || 'AS'}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium break-words whitespace-normal">
                            {target.assetName}
                          </p>
                          <p className="text-xs text-neutral-500">
                            Jumlah:{' '}
                            {(target as ModalTarget & { qty?: number }).qty ??
                              1}
                          </p>
                        </div>
                      </div>
                    ) : (
                      // No data available
                      <p className="py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
                        Tidak ada data asset
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          );
        })()}

        {showNoteField && (
          <div className="mb-2">
            <label className="mb-1 block text-sm text-neutral-500">
              Catatan{' '}
              {action === 'reject' ? (
                <span className="text-red-500">*</span>
              ) : (
                '(opsional)'
              )}
            </label>
            <Textarea
              value={note}
              onChange={e => {
                setNote(e.target.value);
                if (e.target.value.trim()) setError(null);
              }}
              placeholder={
                action === 'approve'
                  ? 'Tambahkan catatan persetujuan...'
                  : 'Tambahkan alasan penolakan...'
              }
              className={`min-h-[80px] ${error ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            />
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
          </div>
        )}

        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {action === 'approve'
            ? 'Yakin ingin menyetujui transaksi ini?'
            : action === 'cancel'
              ? 'Yakin ingin membatalkan transaksi ini?'
              : 'Yakin ingin menolak transaksi ini?'}
        </p>

        <div className="flex justify-end gap-2">
          <Button
            className="cursor-pointer text-neutral-700 dark:text-neutral-300"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>

          <Button
            size="sm"
            onClick={() => {
              if (action === 'reject' && !note.trim()) {
                setError('Catatan alasan penolakan wajib diisi.');
                return;
              }
              onConfirm(showNoteField ? note : undefined);
            }}
            className={
              (action === 'approve'
                ? 'cursor-pointer text-white'
                : action === 'cancel'
                  ? 'bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-500 dark:text-white dark:hover:bg-orange-600'
                  : 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:text-white dark:hover:bg-red-600') +
              ' flex cursor-pointer items-center justify-center leading-none'
            }
            style={action === 'approve' ? { backgroundColor: '#01793b' } : {}}
            disabled={loading}
          >
            {loading
              ? 'Processing...'
              : action === 'approve'
                ? 'Approve'
                : action === 'cancel'
                  ? 'Cancel'
                  : 'Reject'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
