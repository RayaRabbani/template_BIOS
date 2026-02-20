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
import type { DetailApprovalData } from '@/types/user/office-supplies/modals';

type DetailApprovalModalProps = {
  open: boolean;
  onClose: () => void;
  data: DetailApprovalData | null;
  type: 'peminjaman' | 'permintaan';
};

export default function DetailApprovalModal({
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

  const safeImage =
    data.assetImage && data.assetImage.trim() !== ''
      ? data.assetImage
      : '/placeholder.png';

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
        className={`max-h-[80vh] w-full max-w-xl overflow-y-auto rounded-md border border-neutral-200 bg-white p-0 shadow-[0_12px_45px_-10px_rgba(0,0,0,0.25)] sm:max-h-none sm:overflow-visible dark:border-neutral-800 dark:bg-neutral-900`}
      >
        <div className="p-6">
          <DialogHeader className="-mt-3">
            <DialogTitle className="text-lg tracking-wide">
              {type === 'peminjaman'
                ? `#${data.id} Detail Peminjaman Asset`
                : `#${data.id} Detail Permintaan Asset`}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="-mt-4 px-6">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Nomor Transaksi:
            <span className="ml-1 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
              {data.transactionNo}
            </span>
          </p>
        </div>

        <div className="-mt-4 flex items-center justify-between px-6">
          <p className="font-semibold">
            {type === 'peminjaman'
              ? 'Timeline Peminjaman'
              : 'Timeline Permintaan'}
          </p>
        </div>

        <div className="mt-3 grid grid-cols-1 px-6 md:grid-cols-[1fr_220px]">
          <div className="relative ml-3 border-l border-neutral-300 dark:border-neutral-700">
            {type === 'peminjaman' ? (
              <>
                <TimelineItem
                  title="Pengajuan Peminjaman"
                  time={
                    data.requestDate
                      ? (formatWithTime(data.requestDate) ?? '-')
                      : '-'
                  }
                  active
                />

                {data.status === 'rejected' ? (
                  <TimelineItem
                    title="Ditolak Oleh"
                    time={
                      data.approveDate
                        ? (formatWithTime(data.approveDate) ?? '-')
                        : '-'
                    }
                    approver={{
                      name: data.approverName ?? '-',
                      nip: data.approverNip ?? '',
                      avatar:
                        data.approverAvatar &&
                        data.approverAvatar.trim() !== '-' &&
                        data.approverAvatar.trim() !== ''
                          ? data.approverAvatar
                          : '/images/avatar-pic.jpg',
                    }}
                    variant="danger"
                    active
                  />
                ) : data.status === 'approved' ||
                  data.status === 'completed' ? (
                  <TimelineItem
                    title="Disetujui Oleh"
                    time={
                      data.approveDate
                        ? (formatWithTime(data.approveDate) ?? '-')
                        : '-'
                    }
                    approver={{
                      name: data.approverName ?? '-',
                      nip: data.approverNip ?? '',
                      avatar: data.approverAvatar ?? '/images/avatar-pic.jpg',
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
                <TimelineItem
                  title="Tanggal Pengembalian"
                  time={
                    data.returnDate
                      ? (formatWithTime(data.returnDate) ?? '-')
                      : '-'
                  }
                />
              </>
            ) : (
              <>
                <TimelineItem
                  title="Pengajuan Permintaan"
                  time={
                    data.requestDate
                      ? (formatWithTime(data.requestDate) ?? '-')
                      : '-'
                  }
                  active
                />

                {data.status === 'rejected' ? (
                  <TimelineItem
                    title="Ditolak Oleh"
                    time={
                      data.approveDate
                        ? (formatWithTime(data.approveDate) ?? '-')
                        : '-'
                    }
                    approver={{
                      name: data.approverName ?? '-',
                      nip: data.approverNip ?? '',
                      avatar:
                        data.approverAvatar &&
                        data.approverAvatar.trim() !== '-' &&
                        data.approverAvatar.trim() !== ''
                          ? data.approverAvatar
                          : '/images/avatar-pic.jpg',
                    }}
                    variant="danger"
                    active
                  />
                ) : data.status === 'approved' ||
                  data.status === 'completed' ? (
                  <TimelineItem
                    title="Disetujui Oleh"
                    time={
                      data.approveDate
                        ? (formatWithTime(data.approveDate) ?? '-')
                        : '-'
                    }
                    approver={{
                      name: data.approverName ?? '-',
                      nip: data.approverNip ?? '',
                      avatar: data.approverAvatar ?? '/images/avatar-pic.jpg',
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

          <div className="w-[200px] shrink-0">
            <StatusSummaryCard data={data} />
          </div>
        </div>

        <div className="-mt-4 mb-4 px-6">
          <p className="mb-3 font-semibold">List Asset</p>

          {Array.isArray(data.item) && data.item.length > 0 ? (
            <ScrollArea
              className={
                (data.item?.length ?? 0) > 3
                  ? 'h-64 max-h-64 overflow-hidden rounded-md'
                  : 'overflow-hidden rounded-md'
              }
            >
              <div className="space-y-3">
                {data.item.map(it => {
                  const img =
                    it?.pic && it.pic.trim() !== ''
                      ? it.pic.startsWith('http')
                        ? it.pic
                        : `/images/${it.pic}`
                      : '/placeholder.png';

                  return (
                    <div
                      key={it.id}
                      className="flex w-full items-center gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-3 transition-colors hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800/40 dark:hover:bg-neutral-800/60"
                    >
                      <Image
                        src={img}
                        alt={it?.nama ?? 'asset'}
                        width={60}
                        height={60}
                        className="h-14 w-14 flex-shrink-0 cursor-zoom-in rounded-md border border-neutral-300 object-cover dark:border-neutral-700"
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
                        <p className="truncate text-sm leading-tight font-semibold">
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
          ) : (
            <div className="flex w-full items-center gap-4 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/40">
              <Image
                src={safeImage}
                alt="asset"
                width={70}
                height={70}
                className="h-16 w-16 cursor-zoom-in rounded-md border border-neutral-300 object-cover dark:border-neutral-700"
                onClick={() => {
                  setPreviewImage(safeImage);
                  setOpenPreview(true);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setPreviewImage(safeImage);
                    setOpenPreview(true);
                  }
                }}
              />

              <div>
                <p className="text-base leading-tight font-semibold">
                  {data.assetName}
                </p>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-200">
                  Jumlah : 1
                </p>
              </div>
            </div>
          )}
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
          <Avatar className="h-12 w-12 overflow-hidden rounded-full border border-neutral-300 dark:border-neutral-700">
            {approver.avatar ? (
              <AvatarImage
                src={approver.avatar}
                alt={approver.name ?? 'approver'}
                className="object-cover object-top w-full h-full"
              />
            ) : (
              <AvatarFallback>
                {approver.name
                  ? approver.name
                      .split(' ')
                      .map(n => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
                  : '?'}
              </AvatarFallback>
            )}
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

function StatusSummaryCard({ data }: { data: DetailApprovalData }) {
  const totalItem =
    Array.isArray(data.item) && data.item.length > 0
      ? data.item.reduce((sum, it) => sum + (it.qty ?? 1), 0)
      : 1;

  const statusLabel =
    data.status === 'approved'
      ? 'Disetujui'
      : data.status === 'rejected'
        ? 'Ditolak'
        : data.status === 'completed'
          ? 'Selesai'
          : 'Menunggu';

  const statusColor =
    data.status === 'approved'
      ? 'text-green-600'
      : data.status === 'rejected'
        ? 'text-red-600'
        : data.status === 'completed'
          ? 'text-slate-600'
          : 'text-yellow-600';

  return (
    <div className="rounded-md border border-neutral-200 bg-white/70 p-4 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/60 ml-4">
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        Status Saat Ini
      </p>

      <p className={`text-m mt-1 font-semibold ${statusColor}`}>
        {statusLabel}
      </p>

      <div className="mt-3 text-sm">
        <p className="text-neutral-500 dark:text-neutral-400">Total Asset</p>
        <p className="text-m font-semibold text-neutral-900 dark:text-white">
          {totalItem} Item
        </p>
      </div>
    </div>
  );
}
