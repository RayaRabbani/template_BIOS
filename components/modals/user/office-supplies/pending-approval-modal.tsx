'use client';

import React, { useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { Eye, Inbox, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  cancelOfficeSuppliesRequest,
  getPendingConsumable,
} from '@/lib/api/user';
import { resolveAssetImage } from '@/lib/images';
import { cn } from '@/lib/utils';
import type {
  ApiTransaksi,
  DetailApprovalData,
} from '@/types/user/office-supplies/modals';

import DetailApprovalModal from './detail-approval-modal';

// New response structure for office supplies
type OfficeSuppliesResponse = {
  statusCode: number;
  message: string;
  data: {
    data: ApiTransaksi[];
  };
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  showOnly?: 'peminjaman' | 'permintaan';
  onRefresh?: () => void;
};

export default function PendingApprovalModal({
  open,
  onOpenChange,
  showOnly,
  onRefresh,
}: Props) {
  const initialTab: 'peminjaman' | 'permintaan' = showOnly
    ? showOnly
    : 'peminjaman';
  const [tab, setTab] = React.useState<'peminjaman' | 'permintaan'>(initialTab);
  const [data, setData] = useState<ApiTransaksi[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailType, setDetailType] = useState<'peminjaman' | 'permintaan'>(
    'peminjaman'
  );
  const [detailData, setDetailData] = useState<DetailApprovalData | null>(null);
  const [pinjamCount, setPinjamCount] = useState<number>(0);
  const [permintaanCount, setPermintaanCount] = useState<number>(0);
  // AlertDialog / confirmation state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [pendingCancelTarget, setPendingCancelTarget] = useState<{
    id: string | number;
    type: 'peminjaman' | 'permintaan';
  } | null>(null);

  const { data: session } = useSession();

  const statusSoftColor = (status: string) => {
    const s = (status || '').toString().toLowerCase();

    if (s.includes('disetujui') || s.includes('approved')) {
      return 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300';
    }

    // cancelled / dibatalkan -> red
    if (
      s.includes('dibatalkan') ||
      s.includes('cancel') ||
      s.includes('canceled')
    ) {
      return 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300';
    }

    if (s.includes('ditolak') || s.includes('rejected')) {
      return 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300';
    }

    // submitted/pending -> blue (user requested Diajukan to be blue)
    if (
      s.includes('diajukan') ||
      s.includes('menunggu') ||
      s.includes('pending')
    ) {
      return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300';
    }

    if (s.includes('selesai') || s.includes('completed')) {
      return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300';
    }

    return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300';
  };

  useEffect(() => {
    async function fetchPending() {
      setLoading(true);
      setError(null);
      try {
        const id = session?.user?.id || '0'; // from session
        const json = (await getPendingConsumable(id)) as OfficeSuppliesResponse;

        // Extract transactions from the new nested structure
        const transactions = json?.data?.data || [];
        setData(transactions);

        // compute pending counts by checking status text (Diajukan / pending)
        const pendingCount = Array.isArray(transactions)
          ? transactions.filter(it => {
              const s = (it?.status || '').toString().toLowerCase();
              return (
                s.includes('diajukan') ||
                s.includes('menunggu') ||
                s.includes('pending')
              );
            }).length
          : 0;

        // Since office supplies only has permintaan (requests), set both counts to the same value
        // or differentiate based on transaction type if needed
        setPinjamCount(0); // Office supplies doesn't have peminjaman
        setPermintaanCount(pendingCount);
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    }

    if (open) fetchPending();
  }, [open]);

  const currentList = data || [];

  const handleCancel = async (
    id: string | number,
    type: 'peminjaman' | 'permintaan'
  ) => {
    // open confirmation dialog (shadcn AlertDialog)
    setPendingCancelTarget({ id, type });
    setCancelDialogOpen(true);
  };

  // perform actual cancellation after user confirms in AlertDialog
  const performCancelConfirmed = async (id: string | number) => {
    try {
      await cancelOfficeSuppliesRequest(id);

      // Refresh data after successful cancellation
      const employeeId = session?.user?.id || '0';
      const json = (await getPendingConsumable(
        employeeId
      )) as OfficeSuppliesResponse;
      const transactions = json?.data?.data || [];
      setData(transactions);

      // recompute pending counts
      const pendingCount = Array.isArray(transactions)
        ? transactions.filter(it => {
            const s = (it?.status || '').toString().toLowerCase();
            return (
              s.includes('diajukan') ||
              s.includes('menunggu') ||
              s.includes('pending')
            );
          }).length
        : 0;

      setPinjamCount(0); // Office supplies doesn't have peminjaman
      setPermintaanCount(pendingCount);

      toast.success('Transaksi berhasil dibatalkan');

      // Call parent refresh if provided
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error canceling transaction:', error);
      toast.error('Gagal membatalkan transaksi');
    } finally {
      setPendingCancelTarget(null);
      setCancelDialogOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-xl overflow-hidden rounded-md border border-neutral-200 bg-white p-0 shadow-[0_12px_45px_-10px_rgba(0,0,0,0.2)] dark:border-neutral-800 dark:bg-neutral-900">
        <div className="p-6">
          <DialogHeader className="-mt-2 mb-4">
            <DialogTitle className="text-lg">Menunggu Persetujuan</DialogTitle>
          </DialogHeader>

          <div className="mb-2 flex rounded-md bg-neutral-100 dark:bg-neutral-800">
            {['peminjaman', 'permintaan']
              .filter(t => !showOnly || showOnly === t)
              .map(t => (
                <Button
                  key={t}
                  variant="ghost"
                  className={`relative flex-1 cursor-pointer rounded-md py-2 text-sm font-medium transition ${
                    tab === t
                      ? 'bg-[#01793b] text-white shadow hover:bg-[#016c33] hover:text-white dark:bg-[#052E16] dark:text-white dark:hover:bg-[#043014]'
                      : 'text-neutral-600 hover:bg-transparent hover:text-neutral-600 dark:text-neutral-300 dark:hover:bg-transparent dark:hover:text-neutral-300'
                  }`}
                  onClick={() => setTab(t as 'peminjaman' | 'permintaan')}
                >
                  <div className="flex items-center justify-center gap-3">
                    <span className="select-none">
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </span>
                  </div>

                  <span
                    className={cn(
                      'absolute -top-3 -right-1 flex items-center justify-center',
                      'h-7 w-7 min-w-[20px] rounded-full px-1 text-[13px] font-semibold',
                      'border',
                      tab === t
                        ? 'border-neutral-200 bg-white text-black shadow-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-white'
                        : 'border-neutral-300 bg-neutral-200 text-neutral-700 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-200'
                    )}
                    aria-hidden
                  >
                    {t === 'peminjaman' ? pinjamCount : permintaanCount}
                  </span>
                </Button>
              ))}
          </div>

          <ScrollArea
            className={cn(currentList.length > 3 ? 'h-[280px]' : 'h-auto')}
          >
            <div className="min-h-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="space-y-3"
                >
                  {loading && (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-md border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800"
                        >
                          <div className="flex-1">
                            <Skeleton className="mb-2 h-4 w-32" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                          </div>
                          <div className="flex gap-2">
                            <Skeleton className="h-8 w-8 rounded-md" />
                            <Skeleton className="h-8 w-8 rounded-md" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  {!loading &&
                    !error &&
                    (currentList.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-8 text-center text-neutral-500">
                        <Inbox className="mb-3 h-14 w-14 text-neutral-400" />
                        <p className="font-medium">
                          Tidak ada permintaan yang menunggu
                        </p>
                        <p className="text-sm">
                          Semua pengajuan sudah diproses atau belum ada
                          pengajuan.
                        </p>
                      </div>
                    ) : (
                      currentList.map(item => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-md border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {item.no_transaksi}
                            </p>

                            <span
                              className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusSoftColor(
                                item.status
                              )}`}
                              style={
                                (item.status || '')
                                  .toString()
                                  .toLowerCase()
                                  .includes('disetujui') ||
                                (item.status || '')
                                  .toString()
                                  .toLowerCase()
                                  .includes('approved')
                                  ? {
                                      backgroundColor: '#01793b',
                                      color: '#ffffff',
                                    }
                                  : {}
                              }
                            >
                              {item.status}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            {item.status
                              ?.toLowerCase()
                              .includes('diajukan') && (
                              <Button
                                size="sm"
                                className={cn(
                                  'flex size-8 cursor-pointer items-center justify-center rounded-md shadow-sm transition',
                                  'bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-800/30'
                                )}
                                onClick={() => handleCancel(item.id, tab)}
                              >
                                <X
                                  size={16}
                                  className="text-red-600 dark:text-red-300"
                                />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              className={cn(
                                'flex size-8 cursor-pointer items-center justify-center rounded-md border shadow-sm transition',
                                'border-gray-300 bg-white text-black hover:bg-gray-100',
                                'dark:border-neutral-700 dark:bg-black dark:text-white dark:hover:bg-neutral-800'
                              )}
                              onClick={() => {
                                const firstItem =
                                  item.item && item.item.length > 0
                                    ? item.item[0]
                                    : undefined;
                                const mapped = {
                                  id: item.id,
                                  transactionNo: item.no_transaksi,
                                  assetName: firstItem
                                    ? firstItem.nama
                                    : item.nama,
                                  assetImage: firstItem
                                    ? resolveAssetImage(firstItem.pic, 'asset')
                                    : undefined,
                                  requestDate: item.tgl_permintaan ?? undefined,
                                  approveDate: item.approval_at ?? undefined,
                                  returnDate: undefined, // Office supplies doesn't have return date
                                  status:
                                    item.status === 'Disetujui'
                                      ? 'approved'
                                      : item.status === 'Ditolak'
                                        ? 'rejected'
                                        : item.status === 'Selesai'
                                          ? 'completed'
                                          : 'pending',
                                  approverName: item.nama_approval ?? undefined,
                                  approverNip:
                                    item.no_badge_approval ?? undefined,
                                  approverAvatar:
                                    item.pic_approval &&
                                    item.pic_approval !== '-'
                                      ? item.pic_approval
                                      : undefined,
                                  item: Array.isArray(item.item)
                                    ? item.item.map(it => ({
                                        id: it.id,
                                        nama: it.nama,
                                        pic: resolveAssetImage(it.pic, 'asset'),
                                        qty: it.qty,
                                      }))
                                    : undefined,
                                } as const;

                                setDetailData(mapped);
                                setDetailType(tab);
                                setDetailOpen(true);
                              }}
                            >
                              <Eye size={16} />
                            </Button>
                          </div>
                        </div>
                      ))
                    ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>

        <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <AlertDialogContent className="rounded-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Konfirmasi Pembatalan</AlertDialogTitle>
              <p className="mt-2 text-sm text-neutral-600">
                Apakah Anda yakin ingin membatalkan transaksi ini?
              </p>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                className="cursor-pointer rounded-md"
                onClick={() => {
                  setCancelDialogOpen(false);
                  setPendingCancelTarget(null);
                }}
              >
                Batal
              </AlertDialogCancel>
              <AlertDialogAction
                className="cursor-pointer rounded-md"
                onClick={() => {
                  if (pendingCancelTarget) {
                    performCancelConfirmed(pendingCancelTarget.id);
                  }
                }}
              >
                Ya, Batalkan
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <DetailApprovalModal
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          data={detailData}
          type={detailType}
        />
      </DialogContent>
    </Dialog>
  );
}
