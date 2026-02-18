'use client';

import { useState } from 'react';

import Image from 'next/image';

import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { DetailApprovalData } from '@/types/approver/modals';

type DetailApprovalModalProps = {
  open: boolean;
  onClose: () => void;
  data: DetailApprovalData | null;
  type?: 'peminjaman' | 'permintaan';
};

export default function DetailApproverModal({
  open,
  onClose,
  data,
  type,
}: DetailApprovalModalProps) {
  const [openPreview, setOpenPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | undefined | null>(
    null
  );

  if (!data) return null;

  const inferredType: 'peminjaman' | 'permintaan' = data.tgl_permintaan
    ? 'permintaan'
    : data.tgl_peminjaman
      ? 'peminjaman'
      : (type ?? 'peminjaman');

  const safeImage =
    data.assetImage && data.assetImage.trim() !== ''
      ? data.assetImage
      : '/placeholder.png';

  const items =
    Array.isArray(data.item) && data.item.length > 0 ? data.item : [];

  const renderItems =
    items.length > 0
      ? items
      : data.assetName || data.assetImage
        ? [
            {
              id: 'main',
              nama: data.assetName ?? 'Unknown Asset',
              pic: data.assetImage ?? safeImage,
              qty: data.qty ?? 1,
            },
          ]
        : [];
  function formatWithTime(dateStr?: string | null) {
    if (!dateStr) return null;
    try {
      const d = parseISO(dateStr);
      return format(d, 'd MMMM yyyy - HH:mm', { locale: idLocale });
    } catch {
      return null;
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={`w-full max-w-xl rounded-sm border border-neutral-200 bg-white p-0 shadow-[0_12px_45px_-10px_rgba(0,0,0,0.25)] dark:border-neutral-800 dark:bg-neutral-900 [&_button[data-slot='dialog-close']]:top-5 ${
          inferredType === 'peminjaman'
            ? 'max-h-[80vh] overflow-y-auto sm:max-h-none sm:overflow-visible'
            : ''
        } `}
      >
        <div className="p-6">
          <DialogHeader className="-mt-2">
            <DialogTitle className="text-lg font-semibold tracking-wide">
              {inferredType === 'peminjaman'
                ? `#${data.id} Detail Peminjaman Asset`
                : `#${data.id} Detail Permintaan Asset`}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="-mt-4 px-6">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Nomor Transaksi:
            <span className="ml-1 font-medium text-neutral-700 dark:text-neutral-200">
              {data.transactionNo}
            </span>
          </p>
        </div>

        <div className="flex items-center justify-between px-6">
          <p className="font-semibold">
            {inferredType === 'peminjaman'
              ? 'Timeline Peminjaman'
              : 'Timeline Permintaan'}
          </p>
        </div>

        <div className="px-6">
          <div className="relative ml-3 border-l border-neutral-300 dark:border-neutral-700">
            {inferredType === 'peminjaman' ? (
              <>
                <TimelineItem
                  title="Pengajuan Peminjaman"
                  time={data.date ? (formatWithTime(data.date) ?? '-') : '-'}
                  active
                />

                {data.status === 'cancelled' ? (
                  <TimelineItem
                    title="Dibatalkan"
                    time={
                      data.approval_at
                        ? (formatWithTime(data.approval_at) ?? '-')
                        : '-'
                    }
                    variant="danger"
                    active
                  />
                ) : data.status === 'rejected' ? (
                  <TimelineItem
                    title="Ditolak"
                    time={
                      data.approval_at
                        ? (formatWithTime(data.approval_at) ?? '-')
                        : '-'
                    }
                    approver={{
                      name: data.nama_approval ?? '-',
                      nip: data.no_badge_approval ?? '-',
                      avatar: data.pic_approval ?? '/images/avatar-pic.jpg',
                    }}
                    variant="danger"
                    active
                  />
                ) : data.status === 'approved' ||
                  data.status === 'completed' ? (
                  <TimelineItem
                    title="Disetujui Oleh"
                    time={
                      data.approval_at
                        ? (formatWithTime(data.approval_at) ?? '-')
                        : '-'
                    }
                    approver={{
                      name: data.nama_approval ?? '-',
                      nip: data.no_badge_approval ?? '-',
                      avatar: data.pic_approval ?? '/images/avatar-pic.jpg',
                    }}
                    variant="success"
                    active
                  />
                ) : (
                  <TimelineItem
                    title="Menunggu Persetujuan"
                    time="Sedang diproses..."
                    active
                  />
                )}
                {data.status !== 'rejected' && data.status !== 'cancelled' && (
                  <TimelineItem
                    title="Tanggal Pengembalian"
                    time={
                      data.returnDate
                        ? (formatWithTime(data.returnDate) ?? '-')
                        : '-'
                    }
                  />
                )}
              </>
            ) : (
              <>
                <TimelineItem
                  title="Pengajuan Permintaan"
                  time={
                    data.date
                      ? (formatWithTime(data.tgl_permintaan) ?? '-')
                      : '-'
                  }
                  active
                />

                {data.status === 'cancelled' ? (
                  <TimelineItem
                    title="Dibatalkan"
                    time={
                      data.approval_at
                        ? (formatWithTime(data.approval_at) ?? '-')
                        : '-'
                    }
                    variant="danger"
                    active
                  />
                ) : data.status === 'rejected' ? (
                  <TimelineItem
                    title="Ditolak"
                    time={
                      data.approval_at
                        ? (formatWithTime(data.approval_at) ?? '-')
                        : '-'
                    }
                    approver={{
                      name: data.nama_approval ?? '-',
                      nip: data.no_badge_approval ?? '-',
                      avatar: data.pic_approval ?? '/images/avatar-pic.jpg',
                    }}
                    variant="danger"
                    active
                  />
                ) : data.status === 'approved' ||
                  data.status === 'completed' ? (
                  <TimelineItem
                    title="Disetujui Oleh"
                    time={
                      data.approval_at
                        ? (formatWithTime(data.approval_at) ?? '-')
                        : '-'
                    }
                    approver={{
                      name: data.nama_approval ?? '-',
                      nip: data.no_badge_approval ?? '-',
                      avatar: data.pic_approval ?? '/images/avatar-pic.jpg',
                    }}
                    variant="success"
                    active
                  />
                ) : (
                  <TimelineItem
                    title="Menunggu Persetujuan"
                    time="Sedang diproses..."
                    active
                  />
                )}
              </>
            )}
          </div>
        </div>

        <div className="mb-4 px-6">
          <p className="mb-3 font-semibold">
            List Asset{' '}
            {renderItems.length > 1 ? `(${renderItems.length} items)` : ''}
          </p>

          <ScrollArea
            className={
              renderItems.length > 2
                ? 'h-48 max-h-48 overflow-hidden rounded-sm'
                : 'overflow-hidden rounded-sm'
            }
          >
            <div className="space-y-3">
              {renderItems.map(it => {
                const srcPic = it?.pic ?? '/placeholder.png';
                // Ensure proper image URL - it should already be resolved from the pages
                const img =
                  typeof srcPic === 'string' && srcPic.trim() !== ''
                    ? srcPic.startsWith('http')
                      ? srcPic // Already a full URL
                      : srcPic.startsWith('/')
                        ? srcPic // Relative URL
                        : `/images/${srcPic}` // Fallback to images folder
                    : '/placeholder.png';

                return (
                  <div
                    key={it.id}
                    className="flex w-full items-center gap-3 rounded-sm border border-neutral-200 bg-neutral-50 p-3 transition-colors hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800/40 dark:hover:bg-neutral-800/60"
                  >
                    <Image
                      src={img}
                      alt={it?.nama ?? 'asset'}
                      width={60}
                      height={60}
                      className="h-14 w-14 flex-shrink-0 cursor-zoom-in rounded-sm border border-neutral-300 object-cover dark:border-neutral-700"
                      onClick={() => {
                        setPreviewImage(img);
                        setOpenPreview(true);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setPreviewImage(img);
                          setOpenPreview(true);
                        }
                      }}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-tight font-semibold">
                        {it?.nama ?? 'Unknown Item'}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                        Jumlah: {it?.qty ?? 1}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
        <Dialog open={openPreview} onOpenChange={setOpenPreview}>
          <DialogContent
            showCloseButton={false}
            className="max-w-4xl border-none bg-transparent p-0 [&>button]:hidden"
          >
            <VisuallyHidden>
              <DialogTitle>Preview Image</DialogTitle>
            </VisuallyHidden>

            <div className="relative h-[80vh] w-full">
              {previewImage && (
                <Image
                  src={previewImage}
                  alt="Preview"
                  fill
                  className="cursor-zoom-out object-contain"
                  onClick={() => setOpenPreview(false)}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

function TimelineItem({
  title,
  time,
  active,
  approver,
  variant = 'default',
}: {
  title: string;
  time: string;
  active?: boolean;
  approver?: {
    name: string;
    nip: string;
    avatar: string;
  };
  variant?: 'default' | 'success' | 'danger';
}) {
  const isDanger = variant === 'danger';
  const isSuccess = variant === 'success';

  return (
    <div className="relative pb-6 pl-6">
      <div
        className={`absolute top-1 -left-[7px] h-4 w-4 rounded-full border ${
          isDanger
            ? 'border-red-700 bg-red-600 dark:border-red-400 dark:bg-red-500'
            : isSuccess
              ? 'border-green-700 bg-green-600 dark:border-green-400 dark:bg-green-500'
              : active
                ? 'border-black bg-black dark:border-white dark:bg-white'
                : 'border-neutral-400 bg-neutral-200 dark:bg-neutral-700'
        } `}
        style={
          isSuccess
            ? { backgroundColor: '#01793b', borderColor: '#01793b' }
            : undefined
        }
      />

      <p
        className={`font-medium ${
          isDanger
            ? 'text-red-600 dark:text-red-400'
            : isSuccess
              ? 'text-green-600 dark:text-green-400'
              : ''
        } `}
        style={isSuccess ? { color: '#01793b' } : undefined}
      >
        {title}
      </p>

      <p
        className={`text-xs ${
          isDanger
            ? 'text-red-400 dark:text-red-500'
            : isSuccess
              ? 'text-green-500 dark:text-green-400'
              : 'text-neutral-500'
        } `}
        style={isSuccess ? { color: '#01793b' } : undefined}
      >
        {time}
      </p>

      {approver && (
        <div className="mt-2 ml-1 flex items-center gap-3">
          <Avatar className="h-11 w-11 overflow-hidden rounded-full">
            <AvatarImage src={approver.avatar} alt={approver.name} />
            <AvatarFallback className="rounded-full">
              {approver.name
                .split(' ')
                .map(n => n[0])
                .slice(0, 2)
                .join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold">{approver.name}</p>
            <p className="text-xs text-neutral-500">{approver.nip}</p>
          </div>
        </div>
      )}
    </div>
  );
}
