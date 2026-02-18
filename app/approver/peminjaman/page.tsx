'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';

import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { endOfDay, format, parseISO, startOfDay } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  Calendar as CalendarIcon,
  Check,
  Eye,
  Funnel,
  Inbox,
  X,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import type { DateRange } from 'react-day-picker';
import { toast } from 'sonner';

import ApproverBell from '@/components/modals/approver/approver-bell';
import ConfirmApprover from '@/components/modals/approver/confirm-approver';
import DetailApprovalModal from '@/components/modals/approver/detail-approver-modal';
import Navbar from '@/components/navbar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import Pagination from '@/components/ui/pagination';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  approvePeminjamanRequest,
  getPeminjamanApprovals,
  rejectPeminjamanRequest,
} from '@/lib/api/approver';
import { resolveAssetImage } from '@/lib/images';
import { cn } from '@/lib/utils';
import type {
  ApiItem,
  ApiResponse,
  ApiTransaksi,
  HistoryItem,
} from '@/types/approver/peminjaman';

export default function HistoryPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openPreview, setOpenPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | undefined | null>(
    null
  );

  const [search, setSearch] = useState('');

  const [filterStatus, setFilterStatus] = useState<
    'all' | 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
  >('all');
  const [filterOpen, setFilterOpen] = useState(false);

  const [appliedPeriod, setAppliedPeriod] = useState<DateRange | undefined>(
    undefined
  );
  const [stagedPeriod, setStagedPeriod] = useState<DateRange | undefined>(
    undefined
  );
  const [periodOpen, setPeriodOpen] = useState(false);

  const [openDetail, setOpenDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    'approve' | 'reject' | 'cancel' | null
  >(null);
  const [confirmTargetId, setConfirmTargetId] = useState<number | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  useEffect(() => {
    setPage(1);
  }, [search, filterStatus, appliedPeriod]);
  const paginated = data.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    async function loadApproverData() {
      setLoading(true);
      try {
        const options: {
          search?: string;
          status?: string;
          dateFrom?: string;
          dateTo?: string;
        } = {};

        if (search) options.search = search;
        if (filterStatus !== 'all') {
          switch (filterStatus) {
            case 'pending':
              options.status = 'pending';
              break;
            case 'approved':
              options.status = 'approved';
              break;
            case 'rejected':
              options.status = 'rejected';
              break;
            case 'completed':
              options.status = 'completed';
              break;
            case 'cancelled':
              options.status = 'cancelled';
              break;
          }
        }
        if (appliedPeriod?.from)
          options.dateFrom = format(appliedPeriod.from, 'yyyy-MM-dd');
        if (appliedPeriod?.to)
          options.dateTo = format(appliedPeriod.to, 'yyyy-MM-dd');

        if (!session?.user?.id) {
          console.warn('No user session available');
          setData([]);
          return;
        }

        const json = (await getPeminjamanApprovals(
          session.user.id,
          options
        )) as ApiResponse;

        if (!json || !Array.isArray(json.data)) {
          setData([]);
          return;
        }

        if (json.data.length === 0) {
          setData([]);
          return;
        }

        const mapped: HistoryItem[] = (json.data ?? []).map(
          (d: ApiTransaksi) => {
            const firstItem: ApiItem | null =
              Array.isArray(d.item) && d.item.length > 0 ? d.item[0] : null;

            const statusRaw = (d.status || '').toString().toLowerCase();
            let status: HistoryItem['status'] = 'pending';
            if (statusRaw.includes('batal') || statusRaw.includes('dibatalkan'))
              status = 'cancelled';
            else if (
              statusRaw.includes('tolak') ||
              statusRaw.includes('ditolak')
            )
              status = 'rejected';
            else if (
              statusRaw.includes('setuju') ||
              statusRaw.includes('disetujui') ||
              statusRaw.includes('diterima')
            )
              status = 'approved';
            else if (
              statusRaw.includes('selesai') ||
              statusRaw.includes('done') ||
              statusRaw.includes('completed')
            )
              status = 'completed';
            else status = 'pending';

            return {
              id: Number(d.id ?? 0),
              type: 'peminjaman',
              transactionNo: String(d.no_transaksi ?? d.no_transaction ?? '-'),
              date: String(d.tgl_peminjaman ?? d.tgl_pinjam ?? ''),
              tgl_peminjaman: d.tgl_peminjaman ?? d.tgl_pinjam ?? null,
              returnDate: d.tgl_pengembalian ?? undefined,
              approval_at: d.approval_at ?? null,
              employee: String(d.nama ?? d.nama_peminjam ?? '-'),
              no_badge: d.no_badge ?? null,
              nama_approval: d.nama_approval ?? null,
              pic_approval: d.pic_approval ?? null,
              no_badge_approval: d.no_badge_approval ?? null,
              pic: d.pic ?? null,
              qty: firstItem?.qty ?? d.qty ?? 1,
              status,
              assetName: firstItem?.nama ?? undefined,
              assetImage:
                resolveAssetImage(
                  firstItem?.pic ?? d.pic ?? null,
                  firstItem?.pic ? 'asset' : 'employee'
                ) ?? undefined,
              item: Array.isArray(d.item)
                ? d.item.map(it => ({
                    id: it.id ?? undefined,
                    nama: it.nama,
                    pic: resolveAssetImage(it.pic ?? null, 'asset'),
                    qty: it.qty,
                  }))
                : undefined,
            } as HistoryItem;
          }
        );

        setData(mapped.length > 0 ? mapped : []);

        if (
          search ||
          filterStatus !== 'all' ||
          appliedPeriod?.from ||
          appliedPeriod?.to
        ) {
          const frontendFiltered = mapped.filter(item => {
            let matches = true;

            if (search) {
              const query = search.toLowerCase();
              const searchMatches =
                item.transactionNo.toLowerCase().includes(query) ||
                item.employee.toLowerCase().includes(query) ||
                (item.assetName ?? '').toLowerCase().includes(query);
              matches = matches && searchMatches;
            }

            if (filterStatus !== 'all') {
              matches = matches && item.status === filterStatus;
            }

            if (appliedPeriod?.from || appliedPeriod?.to) {
              try {
                const itemDate = parseISO(item.date);
                if (appliedPeriod?.from) {
                  matches =
                    matches && itemDate >= startOfDay(appliedPeriod.from);
                }
                if (appliedPeriod?.to) {
                  matches = matches && itemDate <= endOfDay(appliedPeriod.to);
                }
              } catch (error) {
                console.warn('Date parsing error:', error);
                matches = false;
              }
            }

            return matches;
          });

          setData(frontendFiltered);
        }
      } catch (error) {
        console.error('Failed to load approvals:', error);
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    loadApproverData();
  }, [search, filterStatus, appliedPeriod, session?.user?.id]);

  const statusSoftColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-white';
      case 'pending':
        return 'bg-yellow-100/70 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'rejected':
        return 'bg-red-100/70 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'cancelled':
        return 'bg-gray-100/70 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      default:
        return 'bg-blue-100/70 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  function handleApprove(id: number) {
    setConfirmAction('approve');
    setConfirmTargetId(id);
    setConfirmOpen(true);
  }

  function handleReject(id: number) {
    setConfirmAction('reject');
    setConfirmTargetId(id);
    setConfirmOpen(true);
  }

  async function performConfirm(note?: string) {
    if (!confirmAction || confirmTargetId == null) return;
    const currentAction = confirmAction;

    try {
      setConfirmLoading(true);

      let apiResult;
      if (currentAction === 'approve') {
        apiResult = await approvePeminjamanRequest(confirmTargetId);
        if (apiResult.statusCode === 200 || apiResult.statusCode === 201) {
          setData(d =>
            d.map(it =>
              it.id === confirmTargetId ? { ...it, status: 'approved' } : it
            )
          );
          toast.success('Permintaan berhasil disetujui');
        } else {
          throw new Error(apiResult.message || 'Gagal menyetujui peminjaman');
        }
      } else if (currentAction === 'reject') {
        apiResult = await rejectPeminjamanRequest(confirmTargetId);
        if (apiResult.statusCode === 200 || apiResult.statusCode === 201) {
          setData(d =>
            d.map(it =>
              it.id === confirmTargetId ? { ...it, status: 'rejected' } : it
            )
          );
          toast.success('Permintaan berhasil ditolak');
        } else {
          throw new Error(apiResult.message || 'Gagal menolak peminjaman');
        }
      }
    } catch (error) {
      console.error('Error performing action:', error);
      const serverMsg =
        error instanceof Error && error.message ? error.message : null;
      const baseMsg =
        currentAction === 'approve'
          ? 'Gagal menyetujui peminjaman'
          : currentAction === 'reject'
            ? 'Gagal menolak peminjaman'
            : 'Gagal membatalkan peminjaman';
      toast.error(
        serverMsg && serverMsg !== baseMsg
          ? `${baseMsg}: ${serverMsg}`
          : baseMsg
      );
    } finally {
      setConfirmLoading(false);
      setConfirmOpen(false);
      setConfirmAction(null);
      setConfirmTargetId(null);
    }
  }

  function formatWithTime(dateStr?: string | null) {
    if (!dateStr) return null;
    try {
      const d = parseISO(dateStr);
      return format(d, 'd MMMM yyyy - HH:mm', { locale: idLocale });
    } catch {
      return null;
    }
  }

  const getAssetsForItem = (it: HistoryItem) => {
    if (Array.isArray(it.item) && it.item.length > 0)
      return it.item.map(a => ({ nama: a.nama, pic: a.pic, id: a.id }));
    if (it.assetName || it.assetImage)
      return [
        {
          nama: it.assetName ?? '-',
          pic: it.assetImage ?? '/placeholder.png',
          id: 'main',
        },
      ];
    return [] as Array<{
      nama?: string | undefined;
      pic?: string | null;
      id?: string | number | undefined;
    }>;
  };

  return (
    <>
      <Navbar
        title="Approval Peminjaman Asset"
        showSearch={false}
        showCart={false}
        rightAction={
          <ApproverBell
            data={data}
            showOnly="peminjaman"
            onSelectItem={item => {
              setSelectedItem(item);
              setOpenDetail(true);
            }}
          />
        }
      />
      <div className="-mt-1">
        <CardContent className="p-0">
          <div className="mb-4 flex flex-col items-start justify-between md:flex-row md:items-center">
            <div className="relative w-full md:w-62">
              <input
                type="text"
                placeholder="Filter..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-8 w-full rounded-lg rounded-sm border border-gray-300 bg-white px-3 py-2 text-sm text-black placeholder-gray-500 hover:bg-gray-50 focus:border-[#01793b] focus:ring-1 focus:ring-[#01793b] focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-400 dark:hover:bg-neutral-700"
              />
            </div>

            <div className="mt-2 flex w-full flex-col gap-2 md:mt-0 md:w-auto md:flex-row">
              <Popover open={periodOpen} onOpenChange={setPeriodOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex w-full cursor-pointer items-center justify-center gap-2 md:w-auto"
                  >
                    <CalendarIcon
                      size={16}
                      className="text-neutral-700 dark:text-neutral-300"
                    />

                    <span className="text-sm">
                      {appliedPeriod && appliedPeriod.from && appliedPeriod.to
                        ? `${format(
                            appliedPeriod.from,
                            'dd-MM-yyyy'
                          )} to ${format(appliedPeriod.to, 'dd-MM-yyyy')}`
                        : 'Select period'}
                    </span>
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-2">
                  <div className="flex flex-col gap-2">
                    <Calendar
                      mode="range"
                      captionLayout="dropdown"
                      fromYear={2015}
                      toYear={new Date().getFullYear()}
                      selected={stagedPeriod}
                      onSelect={d =>
                        setStagedPeriod(d as DateRange | undefined)
                      }
                    />

                    <div className="flex justify-end gap-2">
                      <Button
                        className="cursor-pointer"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setStagedPeriod(undefined);
                        }}
                      >
                        Clear
                      </Button>
                      <Button
                        className="cursor-pointer"
                        style={{ backgroundColor: '#01793b', color: 'white' }}
                        size="sm"
                        onClick={() => {
                          setAppliedPeriod(stagedPeriod);
                          setPeriodOpen(false);
                        }}
                        onMouseEnter={e =>
                          (e.currentTarget.style.backgroundColor = '#015f2f')
                        }
                        onMouseLeave={e =>
                          (e.currentTarget.style.backgroundColor = '#01793b')
                        }
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex w-full cursor-pointer items-center justify-center gap-2 md:w-auto"
                  >
                    <Funnel size={16} /> Filter
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-72">
                  <div className="space-y-3">
                    <div>
                      <div className="mb-1 text-xs font-medium">Status</div>
                      <Select
                        value={filterStatus}
                        onValueChange={v =>
                          setFilterStatus(
                            v as
                              | 'all'
                              | 'pending'
                              | 'approved'
                              | 'rejected'
                              | 'completed'
                              | 'cancelled'
                          )
                        }
                      >
                        <SelectTrigger size="sm" className="w-full">
                          <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="all">Semua</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Disetujui</SelectItem>
                          <SelectItem value="rejected">Ditolak</SelectItem>
                          <SelectItem value="cancelled">Dibatalkan</SelectItem>
                          <SelectItem value="completed">Selesai</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFilterStatus('all');
                        }}
                      >
                        Reset
                      </Button>
                      <Button
                        style={{ backgroundColor: '#01793b', color: 'white' }}
                        size="sm"
                        onClick={() => setFilterOpen(false)}
                        onMouseEnter={e =>
                          (e.currentTarget.style.backgroundColor = '#015f2f')
                        }
                        onMouseLeave={e =>
                          (e.currentTarget.style.backgroundColor = '#01793b')
                        }
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="relative hidden overflow-hidden rounded-sm border border-neutral-200 bg-white/50 backdrop-blur md:block dark:border-neutral-800 dark:bg-neutral-900/50">
            {loading ? (
              <div className="p-6">
                <Table>
                  <TableBody>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i} className="animate-pulse">
                        <TableCell>
                          <Skeleton className="h-4 w-6" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-28" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-12" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : data.length === 0 ? (
              <div className="flex items-center justify-center p-12">
                <div className="text-center">
                  <Inbox
                    size={48}
                    className="mx-auto text-neutral-400 dark:text-neutral-500"
                  />
                  <h3 className="mt-4 text-lg font-semibold text-neutral-700 dark:text-neutral-200">
                    Tidak ada data
                  </h3>
                  <p className="mt-2 text-sm text-neutral-500">
                    {search ||
                    filterStatus !== 'all' ||
                    appliedPeriod?.from ||
                    appliedPeriod?.to
                      ? 'Tidak ada data yang sesuai dengan filter yang dipilih.'
                      : 'Tidak ada pengajuan peminjaman untuk periode ini.'}
                  </p>
                </div>
              </div>
            ) : (
              <ScrollArea className="w-full">
                <div className="min-w-[1200px]">
                  <Table>
                    <TableHeader className="bg-neutral-100/60 dark:bg-neutral-800/40">
                      <TableRow>
                        <TableHead className="pl-6 font-semibold text-neutral-700 dark:text-neutral-300">
                          <div className="flex items-center gap-1">
                            No Transaksi
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-neutral-700 dark:text-neutral-300">
                          <div className="flex items-center gap-1">
                            Nama Asset
                          </div>
                        </TableHead>

                        <TableHead className="font-semibold text-neutral-700 dark:text-neutral-300">
                          <div className="flex items-center gap-1">Tanggal</div>
                        </TableHead>

                        <TableHead className="font-semibold text-neutral-700 dark:text-neutral-300">
                          <div className="flex items-center gap-1">
                            Peminjam
                          </div>
                        </TableHead>

                        <TableHead className="font-semibold text-neutral-700 dark:text-neutral-300">
                          <div className="flex items-center gap-1">Status</div>
                        </TableHead>

                        <TableHead className="pr-6 text-center font-semibold text-neutral-700 dark:text-neutral-300">
                          Aksi
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {paginated.map((item, idx) => (
                        <TableRow
                          key={item.id}
                          className="transition hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
                        >
                          <TableCell className="pl-6 font-medium">
                            {item.transactionNo}
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex -space-x-2">
                                {getAssetsForItem(item)
                                  .slice(0, 3)
                                  .map((a, i) => {
                                    const totalAssets =
                                      getAssetsForItem(item).length;
                                    const isLastVisibleItem =
                                      i === 2 && totalAssets > 3;
                                    const remainingCount = totalAssets - 3;

                                    return (
                                      <div
                                        key={String(a.id) + String(i)}
                                        className="relative h-12 w-12 cursor-zoom-in overflow-hidden rounded-sm border border-neutral-200 bg-white dark:border-neutral-700"
                                      >
                                        <Image
                                          src={a.pic ?? '/placeholder.png'}
                                          alt={a.nama ?? 'asset'}
                                          width={48}
                                          height={48}
                                          className="h-12 w-12 object-cover"
                                          onClick={() => {
                                            setPreviewImage(
                                              a.pic ?? '/placeholder.png'
                                            );
                                            setOpenPreview(true);
                                          }}
                                          role="button"
                                          tabIndex={0}
                                        />
                                        {isLastVisibleItem && (
                                          <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs font-bold text-white">
                                            +{remainingCount}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                              </div>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="block max-w-[260px] cursor-help truncate font-medium">
                                    {(() => {
                                      const assets = getAssetsForItem(item);
                                      const names = assets
                                        .slice(0, 3)
                                        .map(a => a.nama ?? '-');
                                      const more =
                                        assets.length > 3
                                          ? ` +${assets.length - 3} lainnya`
                                          : '';
                                      return names.join(', ') + more;
                                    })()}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-sm">
                                  <div className="space-y-1">
                                    {(() => {
                                      const assets = getAssetsForItem(item);
                                      const maxShow = 3;
                                      const shown = assets.slice(0, maxShow);
                                      const more =
                                        assets.length > maxShow
                                          ? assets.length - maxShow
                                          : 0;

                                      return (
                                        <>
                                          {shown.map(a => (
                                            <div
                                              key={String(a.id)}
                                              className="text-sm"
                                            >
                                              {a.nama}
                                            </div>
                                          ))}
                                          {more > 0 && (
                                            <div className="text-sm text-neutral-500">
                                              +{more} lainnya
                                            </div>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>

                          <TableCell className="w-56">
                            <div className="flex flex-col gap-1.5 text-[13px] leading-tight">
                              <div className="flex items-start gap-2">
                                <div>
                                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                    Peminjaman
                                  </div>
                                  <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                                    {formatWithTime(item.date) ?? '-'}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-1 flex items-start gap-2">
                                <div>
                                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                    Pengembalian
                                  </div>
                                  <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                                    {item.returnDate ? (
                                      (formatWithTime(item.returnDate) ?? '-')
                                    ) : (
                                      <span className="inline-block rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                                        Belum kembali
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex min-w-0 items-center gap-3">
                              <Avatar className="h-9 w-9 overflow-hidden rounded-full">
                                <AvatarImage
                                  src={item.pic ?? '/images/avatar-pic.jpg'}
                                  alt={item.employee ?? 'avatar'}
                                />
                                <AvatarFallback className="rounded-full">
                                  {item.employee
                                    ?.split(' ')
                                    .map(n => n[0])
                                    .slice(0, 2)
                                    .join('')}
                                </AvatarFallback>
                              </Avatar>

                              <div className="flex min-w-0 flex-col">
                                <span className="truncate text-sm font-semibold">
                                  {item.employee ?? '-'}
                                </span>

                                <span className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                                  {item.no_badge ?? '-'}
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusSoftColor(
                                item.status
                              )}`}
                              style={
                                item.status === 'approved'
                                  ? { backgroundColor: '#01793b' }
                                  : {}
                              }
                            >
                              {(() => {
                                const s = (item.status ?? '')
                                  .toString()
                                  .toLowerCase();
                                if (
                                  s.includes('rejected') ||
                                  s.includes('ditolak')
                                )
                                  return 'Ditolak';
                                if (
                                  s.includes('cancelled') ||
                                  s.includes('dibatalkan')
                                )
                                  return 'Dibatalkan';
                                if (
                                  s.includes('completed') ||
                                  s.includes('selesai')
                                )
                                  return 'Selesai';
                                if (
                                  s.includes('approved') ||
                                  s.includes('disetujui')
                                )
                                  return 'Disetujui';
                                if (
                                  s.includes('diajukan') ||
                                  s.includes('pending')
                                )
                                  return 'Menunggu';
                                return item.status;
                              })()}
                            </span>
                          </TableCell>

                          <TableCell className="pr-6 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {item.status === 'pending' && (
                                <>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleApprove(item.id)}
                                        aria-label="Approve"
                                        className="cursor-pointer"
                                        style={{ backgroundColor: '#01793b15' }}
                                      >
                                        <Check
                                          className="h-5 w-5"
                                          style={{ color: '#01793b' }}
                                        />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Approve</TooltipContent>
                                  </Tooltip>

                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleReject(item.id)}
                                        aria-label="Reject"
                                        className="cursor-pointer bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-800/30"
                                      >
                                        <X className="h-5 w-5 text-red-600 dark:text-red-300" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Reject</TooltipContent>
                                  </Tooltip>
                                </>
                              )}

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setSelectedItem(item);
                                      setOpenDetail(true);
                                    }}
                                    aria-label="View details"
                                    className={cn(
                                      'flex size-8 cursor-pointer items-center justify-center rounded-sm border shadow-sm transition',
                                      'border-gray-300 bg-white text-black hover:bg-gray-100',
                                      'dark:border-neutral-700 dark:bg-black dark:text-white dark:hover:bg-neutral-800'
                                    )}
                                  >
                                    <Eye />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}
          </div>
        </CardContent>

        <div className="space-y-4 p-2 md:hidden">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Card
                  key={i}
                  className="overflow-hidden rounded-sm border border-neutral-200 bg-white/80 p-4 shadow-md backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/70"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-sm border border-neutral-200 bg-white shadow-sm dark:border-neutral-700">
                      <Skeleton className="h-16 w-16 rounded-sm" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-16" />
                      </div>

                      <div className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                        <Skeleton className="h-4 w-40" />
                        <div className="mt-2">
                          <Skeleton className="h-4 w-28" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            : paginated.map(item => (
                <Card
                  key={item.id}
                  className="overflow-hidden rounded-sm border border-neutral-200 bg-white/80 p-4 shadow-md backdrop-blur-sm transition hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900/70"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 overflow-hidden rounded-sm border border-neutral-200 bg-white shadow-sm dark:border-neutral-700">
                      {(() => {
                        const assets = getAssetsForItem(item);
                        const first = assets[0];
                        return (
                          <div className="relative">
                            <Image
                              src={
                                first?.pic ??
                                item.assetImage ??
                                '/placeholder.png'
                              }
                              alt={first?.nama ?? item.assetName ?? 'Asset'}
                              width={64}
                              height={64}
                              className="h-16 w-16 cursor-zoom-in rounded-sm border border-neutral-200 object-cover shadow-sm dark:border-neutral-700"
                              onClick={() => {
                                setPreviewImage(
                                  first?.pic ??
                                    item.assetImage ??
                                    '/placeholder.png'
                                );
                                setOpenPreview(true);
                              }}
                              role="button"
                              tabIndex={0}
                            />

                            {assets.length > 1 && (
                              <span className="absolute -top-1 -right-1 rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-xs text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200">
                                +{assets.length - 1}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between">
                        <p className="max-w-[140px] truncate text-base leading-tight font-semibold">
                          {item.transactionNo}
                        </p>

                        <span
                          className={`ml-3 rounded-full px-3 py-1 text-[10px] font-semibold whitespace-nowrap ${statusSoftColor(
                            item.status
                          )}`}
                          style={
                            item.status === 'approved'
                              ? { backgroundColor: '#01793b' }
                              : {}
                          }
                        >
                          {(() => {
                            const s = (item.status ?? '')
                              .toString()
                              .toLowerCase();
                            if (s.includes('rejected') || s.includes('ditolak'))
                              return 'Ditolak';
                            if (
                              s.includes('cancelled') ||
                              s.includes('dibatalkan')
                            )
                              return 'Dibatalkan';
                            if (
                              s.includes('completed') ||
                              s.includes('selesai')
                            )
                              return 'Selesai';
                            if (
                              s.includes('approved') ||
                              s.includes('disetujui')
                            )
                              return 'Disetujui';
                            if (s.includes('diajukan') || s.includes('pending'))
                              return 'Menunggu';
                            return item.status;
                          })()}
                        </span>
                      </div>

                      <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                          Peminjaman
                        </div>
                        <div className="font-medium">
                          {formatWithTime(item.date) ?? '-'}
                        </div>
                        <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                          Pengembalian
                        </div>
                        <div className="font-medium">
                          {item.returnDate ? (
                            (formatWithTime(item.returnDate) ?? '-')
                          ) : (
                            <span className="inline-block rounded-full bg-yellow-50 px-2 py-0.5 text-[11px] text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                              Belum kembali
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">
                        {(() => {
                          const assets = getAssetsForItem(item);
                          const names = assets
                            .slice(0, 2)
                            .map(a => a.nama ?? '-');
                          const more =
                            assets.length > 2
                              ? ` +${assets.length - 2} lainnya`
                              : '';
                          const display = names.join(', ') + more;
                          return (
                            <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                              <div className="max-w-full truncate overflow-hidden">
                                {display.length > 35
                                  ? display.slice(0, 32) + '...'
                                  : display}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                        {item.employee}
                      </p>

                      <div className="mt-3 flex gap-2">
                        {item.status === 'pending' && (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleApprove(item.id)}
                                  aria-label="Approve"
                                  className="cursor-pointer"
                                  style={{ backgroundColor: '#01793b15' }}
                                >
                                  <Check
                                    className="h-5 w-5"
                                    style={{ color: '#01793b' }}
                                  />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Approve</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleReject(item.id)}
                                  aria-label="Reject"
                                  className="cursor-pointer bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-800/30"
                                >
                                  <X className="h-5 w-5 text-red-600 dark:text-red-300" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Reject</TooltipContent>
                            </Tooltip>
                          </>
                        )}

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedItem(item);
                                setOpenDetail(true);
                              }}
                              aria-label="View details"
                              className={cn(
                                'flex size-8 cursor-pointer items-center justify-center rounded-sm border shadow-sm transition',
                                'border-gray-300 bg-white text-black hover:bg-gray-100',
                                'dark:border-neutral-700 dark:bg-black dark:text-white dark:hover:bg-neutral-800'
                              )}
                            >
                              <Eye />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            Menampilkan {data.length === 0 ? 0 : (page - 1) * pageSize + 1} -{' '}
            {Math.min(page * pageSize, data.length)} dari {data.length}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>

        <DetailApprovalModal
          open={openDetail}
          onClose={() => setOpenDetail(false)}
          data={
            selectedItem
              ? {
                  ...selectedItem,
                  assetName: selectedItem.assetName ?? 'Tidak ada nama asset',
                  assetImage: selectedItem.assetImage ?? null,
                }
              : null
          }
        />

        <ConfirmApprover
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          action={confirmAction}
          target={data.find(it => it.id === confirmTargetId) ?? null}
          onConfirm={performConfirm}
          loading={confirmLoading}
          type="peminjaman"
        />

        <Dialog open={openPreview} onOpenChange={setOpenPreview}>
          <DialogContent
            showCloseButton={false}
            className="w-[90vw] max-w-none border-none bg-transparent p-0 shadow-none [&>button]:hidden"
          >
            <VisuallyHidden>
              <DialogTitle>Preview Image</DialogTitle>
            </VisuallyHidden>

            <div className="relative h-[80vh] w-full bg-transparent">
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
      </div>
    </>
  );
}
