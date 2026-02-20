'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { endOfDay, format, parseISO, startOfDay } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  Calendar as CalendarIcon,
  Eye,
  Funnel,
  Inbox,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import type { DateRange } from 'react-day-picker';

import DetailApprovalModal from '@/components/modals/user/barang-inventaris/detail-approver-modal';
import PendingApprovalModal from '@/components/modals/user/barang-inventaris/pending-approval-modal';
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
import { Switch } from '@/components/ui/switch';
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
  extractPendingCountFromData,
  getPendingTransaksi,
  getTransaksiByBadge,
} from '@/lib/api/user';
import { resolveAssetImage } from '@/lib/images';
import { cn } from '@/lib/utils';
import type {
  ApiTransaksi,
  HistoryItem,
} from '@/types/user/barang-inventaris/transaksi';

const __initialFetchShownForUser = new Set<string>();

export default function HistoryPage() {
  const [data, setData] = useState<HistoryItem[]>([]);
  const [openPreview, setOpenPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | undefined | null>(
    null
  );
  const [search, setSearch] = useState('');
  const [openApproval, setOpenApproval] = useState(false);
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'pending' | 'approved' | 'rejected' | 'completed'
  >('all');
  const [filterType, setFilterType] = useState<
    'all' | 'peminjaman' | 'permintaan'
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
  const [selectedItem] = useState<HistoryItem | null>(null);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const { data: session } = useSession();

  const router = useRouter();

  const getValidImageUrl = (pic?: string | null): string => {
    const resolved = resolveAssetImage(pic, 'asset');
    return resolved || '/placeholder.png';
  };

  const [visibleCols, setVisibleCols] = useState({
    type: true,
    asset: true,
    employee: true,
    date: true,
    transactionNo: true,
    status: true,
  });

  const searchTimer = useRef<number | null>(null);
  const isFirstSearch = useRef(true);
  const dataRef = useRef<HistoryItem[]>([]);

  const getAssetsForItem = (it: HistoryItem) => {
    if (Array.isArray(it.itemResult) && it.itemResult.length > 0)
      return it.itemResult.map(a => ({ nama: a.nama, pic: a.pic, id: a.id }));
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

  const fetchTransaksi = useCallback(
    async (
      q?: string,
      status?: string,
      type?: string,
      startDate?: string,
      endDate?: string
    ) => {
      if (!session?.user?.id) return;
      const shouldShowLoading = dataRef.current.length === 0;
      const userKey = String(session?.user?.id ?? 'anon');
      const shouldShowLoadingNow =
        shouldShowLoading && !__initialFetchShownForUser.has(userKey);
      if (shouldShowLoadingNow) setLoading(true);
      try {
        const json = await getTransaksiByBadge(
          Number(session?.user?.id) || 0,
          q,
          status,
          type,
          startDate,
          endDate
        );
        const raw = (json.data as ApiTransaksi[]) ?? [];
        const list = raw
          .filter(
            (it: ApiTransaksi) =>
              (it.tipe ?? '').toLowerCase() === 'peminjaman' ||
              (it.tipe ?? '').toLowerCase() === 'permintaan'
          )
          .map((it: ApiTransaksi, idx: number) => {
            let status: HistoryItem['status'] = 'pending';

            const apiStatus = (it.status ?? '').toLowerCase();
            if (apiStatus === 'dibatalkan' || apiStatus === 'rejected') {
              status = 'rejected';
            } else if (apiStatus === 'selesai' || apiStatus === 'completed') {
              status = 'completed';
            } else if (apiStatus === 'disetujui' || apiStatus === 'approved') {
              status = 'approved';
            } else if (
              ((it.status_approval ?? '') as string).toLowerCase() ===
                'disetujui' ||
              ((it.status_konfirmasi ?? '') as string).toLowerCase() ===
                'dikonfirmasi'
            ) {
              status = 'approved';
            }

            let type: HistoryItem['type'] = 'permintaan';
            const apiType = (it.tipe ?? '').toLowerCase();
            if (apiType === 'peminjaman') {
              type = 'peminjaman';
            } else if (apiType === 'permintaan') {
              type = 'permintaan';
            }

            return {
              id: Number(it.id) || idx,
              type,
              transactionNo: it.no_transaksi ?? '-',
              slug: it.slug ?? null,
              date:
                it.tgl_permintaan ?? it.tgl_peminjaman ?? it.created_at ?? '',
              employee: it.nama ?? '-',
              no_badge: it.no_badge ?? '-',
              pic: it.pic ?? null,
              status,
              confirmationStatus: it.status_konfirmasi ?? null,
              returnDate: it.tgl_pengembalian ?? null,
              itemResult: it.itemResult ?? [],
            } as HistoryItem;
          });

        setData(list);
        dataRef.current = list;
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
        __initialFetchShownForUser.add(userKey);
      }
    },
    [session?.user?.id]
  );

  const handleRefreshAfterCancel = useCallback(async () => {
    const startDate = appliedPeriod?.from
      ? format(appliedPeriod.from, 'yyyy-MM-dd')
      : undefined;
    const endDate = appliedPeriod?.to
      ? format(appliedPeriod.to, 'yyyy-MM-dd')
      : undefined;

    fetchTransaksi(
      search.trim() || undefined,
      filterStatus === 'all' ? undefined : filterStatus,
      filterType === 'all' ? undefined : filterType,
      startDate,
      endDate
    );

    try {
      const payload = await getPendingTransaksi(session?.user?.id || '0');
      const count = extractPendingCountFromData(payload);
      setPendingCount(count);
    } catch (e) {
      console.error(e);
    }
  }, [
    search,
    filterStatus,
    filterType,
    appliedPeriod,
    fetchTransaksi,
    session?.user?.id,
  ]);

  useEffect(() => {
    fetchTransaksi();

    return () => {
      if (searchTimer.current) {
        window.clearTimeout(searchTimer.current);
        searchTimer.current = null;
      }
    };
  }, [fetchTransaksi]);

  useEffect(() => {
    if (isFirstSearch.current) {
      isFirstSearch.current = false;
      return;
    }

    if (searchTimer.current) {
      window.clearTimeout(searchTimer.current);
      searchTimer.current = null;
    }

    searchTimer.current = window.setTimeout(() => {
      const startDate = appliedPeriod?.from
        ? format(appliedPeriod.from, 'yyyy-MM-dd')
        : undefined;
      const endDate = appliedPeriod?.to
        ? format(appliedPeriod.to, 'yyyy-MM-dd')
        : undefined;

      fetchTransaksi(
        search.trim() || undefined,
        filterStatus === 'all' ? undefined : filterStatus,
        filterType === 'all' ? undefined : filterType,
        startDate,
        endDate
      );
    }, 300);

    return () => {
      if (searchTimer.current) {
        window.clearTimeout(searchTimer.current);
        searchTimer.current = null;
      }
    };
  }, [search, filterStatus, filterType, appliedPeriod, fetchTransaksi]);

  useEffect(() => {
    let mounted = true;
    async function loadPending() {
      if (!session?.user?.id) return;
      try {
        const json = await getPendingTransaksi(session.user.id);
        const count = extractPendingCountFromData(json);
        if (mounted) setPendingCount(count);
      } catch (e) {
        console.error(e);
      }
    }

    loadPending();
    return () => {
      mounted = false;
    };
  }, [session?.user?.id]);

  const filtered = data.filter(item => {
    const query = search.toLowerCase();

    const assetNames =
      item.itemResult
        ?.map(asset => asset.nama?.toLowerCase() || '')
        .join(' ') || '';

    const matchesSearch =
      !search.trim() ||
      item.transactionNo.toLowerCase().includes(query) ||
      item.employee.toLowerCase().includes(query) ||
      (item.assetName ?? '').toLowerCase().includes(query) ||
      item.type.toLowerCase().includes(query) ||
      assetNames.includes(query);

    const matchesStatus =
      filterStatus === 'all' || item.status === filterStatus;
    const matchesType = filterType === 'all' || item.type === filterType;

    let matchesPeriod = true;
    if (appliedPeriod && appliedPeriod.from && appliedPeriod.to) {
      const start = startOfDay(appliedPeriod.from);
      const end = endOfDay(appliedPeriod.to);
      const d = parseISO(item.date);
      matchesPeriod = d >= start && d <= end;
    }

    return matchesSearch && matchesStatus && matchesType && matchesPeriod;
  });

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => {
    if (page !== 1) {
      const t = setTimeout(() => setPage(1), 0);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterStatus, filterType, appliedPeriod]);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const statusSoftColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-white';
      case 'pending':
        return 'bg-yellow-100/70 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'rejected':
        return 'bg-red-100/70 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-blue-100/70 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

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
    <>
      <Navbar
        title="Transaksi Barang Inventaris"
        showSearch={false}
        showCart={true}
        cartCount={pendingCount}
        cartLabel="Menunggu Persetujuan"
        onCartClick={() => setOpenApproval(true)}
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
                className="h-8 w-full rounded-lg rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black placeholder-gray-500 hover:bg-gray-50 focus:border-[#01793b] focus:ring-1 focus:ring-[#01793b] focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-400 dark:hover:bg-neutral-700"
              />
            </div>

            <div className="mt-2 flex w-full flex-col gap-2 md:mt-0 md:w-auto md:flex-row">
              <Popover open={periodOpen} onOpenChange={setPeriodOpen}>
                <PopoverTrigger asChild>
                  <Button
                    suppressHydrationWarning
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
                    suppressHydrationWarning
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
                          <SelectItem value="rejected">Dibatalkan</SelectItem>
                          <SelectItem value="completed">Selesai</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <div className="mb-1 text-xs font-medium">Tipe</div>
                      <Select
                        value={filterType}
                        onValueChange={v =>
                          setFilterType(
                            v as 'all' | 'peminjaman' | 'permintaan'
                          )
                        }
                      >
                        <SelectTrigger size="sm" className="w-full">
                          <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="all">Semua</SelectItem>
                          <SelectItem value="peminjaman">Peminjaman</SelectItem>
                          <SelectItem value="permintaan">Permintaan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFilterStatus('all');
                          setFilterType('all');
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

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    suppressHydrationWarning
                    variant="outline"
                    size="sm"
                    className="flex w-full cursor-pointer items-center justify-center gap-2 md:w-auto"
                  >
                    <SlidersHorizontal size={16} /> View
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3">
                  <h3 className="mb-2 text-sm font-semibold">Toggle columns</h3>

                  <div className="space-y-2">
                    {[
                      { key: 'type', label: 'Tipe' },
                      { key: 'transactionNo', label: 'No transaksi' },
                      { key: 'date', label: 'Tanggal' },
                      { key: 'employee', label: 'Employee' },
                      { key: 'status', label: 'Status' },
                    ].map(c => (
                      <div
                        key={c.key}
                        className="flex items-center justify-between rounded-md p-1.5 transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        <span className="text-sm">{c.label}</span>

                        <Switch
                          checked={
                            visibleCols[c.key as keyof typeof visibleCols] ??
                            true
                          }
                          onCheckedChange={val =>
                            setVisibleCols(s => ({ ...s, [c.key]: !!val }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="relative hidden overflow-hidden rounded-md border border-neutral-200 bg-white/50 backdrop-blur md:block dark:border-neutral-800 dark:bg-neutral-900/50">
            {loading ? (
              <div className="p-6">
                <Table>
                  <TableBody>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i} className="animate-pulse">
                        <TableCell>
                          <Skeleton className="h-4 w-8" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-full max-w-[140px]" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-full max-w-[220px]" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-full max-w-[200px]" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-full max-w-[180px]" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-full max-w-[120px]" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-full max-w-[60px]" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : filtered.length === 0 ? (
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
                    Tidak ada transaksi barang inventaris untuk periode ini.
                  </p>
                </div>
              </div>
            ) : (
              <ScrollArea className="w-full">
                <div className="min-w-[1200px]">
                  <Table>
                    <TableHeader className="bg-neutral-100/60 dark:bg-neutral-800/40">
                      <TableRow>
                        {visibleCols.type && (
                          <TableHead className="pl-6 font-semibold text-neutral-700 dark:text-neutral-300">
                            Tipe
                          </TableHead>
                        )}
                        {visibleCols.transactionNo && (
                          <TableHead className="font-semibold text-neutral-700 dark:text-neutral-300">
                            No Transaksi
                          </TableHead>
                        )}
                        {visibleCols.asset && (
                          <TableHead className="font-semibold text-neutral-700 dark:text-neutral-300">
                            Nama Asset
                          </TableHead>
                        )}
                        {visibleCols.employee && (
                          <TableHead className="font-semibold text-neutral-700 dark:text-neutral-300">
                            Employee
                          </TableHead>
                        )}
                        {visibleCols.date && (
                          <TableHead className="font-semibold text-neutral-700 dark:text-neutral-300">
                            Tanggal
                          </TableHead>
                        )}
                        {visibleCols.status && (
                          <TableHead className="font-semibold text-neutral-700 dark:text-neutral-300">
                            Status
                          </TableHead>
                        )}

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
                          {visibleCols.type && (
                            <TableCell className="pl-6 font-medium capitalize">
                              {item.type}
                            </TableCell>
                          )}

                          {visibleCols.transactionNo && (
                            <TableCell className="font-medium">
                              {item.transactionNo}
                            </TableCell>
                          )}

                          {visibleCols.asset && (
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
                                          className="relative h-12 w-12 cursor-zoom-in overflow-hidden rounded-md border border-neutral-200 bg-white dark:border-neutral-700"
                                        >
                                          <Image
                                            src={getValidImageUrl(a.pic)}
                                            alt={a.nama ?? 'asset'}
                                            width={48}
                                            height={48}
                                            className="h-12 w-12 object-cover"
                                            onClick={() => {
                                              setPreviewImage(
                                                getValidImageUrl(a.pic)
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
                          )}

                          {visibleCols.employee && (
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9 overflow-hidden rounded-full border">
                                  {item.pic ? (
                                    <AvatarImage
                                      src={item.pic}
                                      alt={item.employee ?? 'avatar'}
                                      className="h-full w-full object-cover object-top"
                                    />
                                  ) : (
                                    <AvatarFallback>
                                      {item.employee
                                        ? item.employee
                                            .split(' ')
                                            .map(n => n[0])
                                            .slice(0, 2)
                                            .join('')
                                            .toUpperCase()
                                        : '?'}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <div className="flex min-w-0 flex-col">
                                  <span className="truncate text-sm font-semibold">
                                    {item.employee}
                                  </span>
                                  <span className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                                    {item.no_badge}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                          )}

                          {visibleCols.date && (
                            <TableCell className="w-56">
                              {item.type === 'peminjaman' ? (
                                <div className="flex flex-col gap-1.5 text-[13px] leading-tight">
                                  <div>
                                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                      Peminjaman
                                    </div>
                                    <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                                      {formatWithTime(item.date)}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                      Pengembalian
                                    </div>
                                    <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                                      {item.returnDate ? (
                                        formatWithTime(item.returnDate)
                                      ) : (
                                        <span className="inline-block rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                                          Belum kembali
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                                  {formatWithTime(item.date)}
                                </div>
                              )}
                            </TableCell>
                          )}

                          {visibleCols.status && (
                            <TableCell>
                              <div>
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

                                {item.confirmationStatus?.toLowerCase() ===
                                  'proses' &&
                                  item.status !== 'rejected' && (
                                    <div className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      <span>
                                        Menunggu konfirmasi kompilator
                                      </span>
                                    </div>
                                  )}
                              </div>
                            </TableCell>
                          )}

                          <TableCell className="pr-6 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      router.push(
                                        `/user/transaksi-saya/laporan-barang-inventaris/detail/${encodeURIComponent(
                                          item.slug ?? item.transactionNo
                                        )}`
                                      )
                                    }
                                    aria-label="View details"
                                    className={cn(
                                      'flex size-8 cursor-pointer items-center justify-center rounded-md border shadow-sm transition',
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
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="rounded-md p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <Skeleton className="mb-2 h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
              </Card>
            ))
          ) : filtered.length === 0 ? (
            <Card className="w-full rounded-md border border-neutral-200 bg-white/80 p-6 text-center shadow-md dark:border-neutral-800 dark:bg-neutral-900/70">
              <Inbox
                size={36}
                className="mx-auto text-neutral-400 dark:text-neutral-500"
              />
              <h3 className="text-base font-semibold text-neutral-700 dark:text-neutral-200">
                Tidak ada data
              </h3>
              <p className="text-sm text-neutral-500">
                Tidak ada transaksi barang inventaris untuk periode ini.
              </p>
            </Card>
          ) : (
            paginated.map(item => (
              <Card
                key={item.id}
                className="overflow-hidden rounded-md border border-neutral-200 bg-white/80 p-4 shadow-md backdrop-blur-sm transition hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900/70"
              >
                <div className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                      {item.transactionNo}
                    </p>
                    {visibleCols.status && (
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-semibold ${statusSoftColor(
                          item.status
                        )}`}
                        style={
                          item.status === 'approved'
                            ? { backgroundColor: '#01793b', color: 'white' }
                            : {}
                        }
                      >
                        {item.status === 'rejected'
                          ? 'Dibatalkan'
                          : item.status === 'completed'
                            ? 'Selesai'
                            : item.status === 'approved'
                              ? 'Disetujui'
                              : 'Menunggu'}
                      </span>
                    )}
                  </div>

                  {item.confirmationStatus &&
                    (item.confirmationStatus as string).toLowerCase() ===
                      'proses' &&
                    item.status !== 'rejected' && (
                      <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Menunggu konfirmasi kompilator</span>
                      </div>
                    )}

                  <div className="text-sm">
                    <div className="text-[11px] text-neutral-500 capitalize dark:text-neutral-400">
                      {item.type}
                    </div>
                    <div className="font-medium text-neutral-800 dark:text-neutral-200">
                      {new Date(item.date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    {item.type === 'peminjaman' && item.returnDate && (
                      <div className="mt-1">
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          Pengembalian
                        </div>
                        <div className="font-medium text-neutral-800 dark:text-neutral-200">
                          {new Date(item.returnDate).toLocaleDateString(
                            'id-ID',
                            {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {visibleCols.asset && (
                    <div className="flex items-start gap-3">
                      {(() => {
                        const assets = getAssetsForItem
                          ? getAssetsForItem(item)
                          : [];
                        const firstAsset = assets[0];
                        const fallbackImage = item.assetImage;

                        if (firstAsset) {
                          return (
                            <div className="h-16 w-16 flex-shrink-0 cursor-zoom-in overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-700">
                              <Image
                                src={
                                  getValidImageUrl
                                    ? getValidImageUrl(firstAsset.pic)
                                    : firstAsset.pic || '/placeholder.png'
                                }
                                alt={firstAsset.nama ?? 'asset'}
                                width={64}
                                height={64}
                                className="h-16 w-16 object-cover"
                                onClick={() => {
                                  const imageUrl = getValidImageUrl
                                    ? getValidImageUrl(firstAsset.pic)
                                    : firstAsset.pic || '/placeholder.png';
                                  setPreviewImage(imageUrl);
                                  setOpenPreview(true);
                                }}
                              />
                            </div>
                          );
                        } else if (fallbackImage) {
                          return (
                            <div className="h-16 w-16 flex-shrink-0 cursor-zoom-in overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-700">
                              <Image
                                src={fallbackImage}
                                alt={item.assetName ?? 'asset'}
                                width={64}
                                height={64}
                                className="h-16 w-16 object-cover"
                                onClick={() => {
                                  setPreviewImage(fallbackImage);
                                  setOpenPreview(true);
                                }}
                              />
                            </div>
                          );
                        }
                        return null;
                      })()}
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 font-semibold text-neutral-900 dark:text-neutral-100">
                          {(() => {
                            const assets = getAssetsForItem
                              ? getAssetsForItem(item)
                              : [];
                            if (assets.length === 0)
                              return (
                                item.assetName || 'Nama asset tidak tersedia'
                              );
                            const names = assets
                              .map(
                                (a: {
                                  nama?: string | undefined;
                                  pic?: string | null;
                                  id?: string | number | undefined;
                                }) => a.nama
                              )
                              .filter(Boolean);
                            return names.length > 0
                              ? names.join(', ')
                              : item.assetName || 'Nama asset tidak tersedia';
                          })()}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <p className="text-neutral-600 dark:text-neutral-400">
                      {item.employee}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        router.push(
                          `/user/transaksi-saya/laporan-barang-inventaris/detail/${encodeURIComponent(
                            item.slug ?? item.transactionNo
                          )}`
                        )
                      }
                      className={cn(
                        'flex size-8 cursor-pointer items-center justify-center rounded-md border shadow-sm transition',
                        'border-gray-300 bg-white text-black hover:bg-gray-100',
                        'dark:border-neutral-700 dark:bg-black dark:text-white dark:hover:bg-neutral-800'
                      )}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm text-neutral-600">
            Menampilkan {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}{' '}
            - {Math.min(page * pageSize, filtered.length)} dari{' '}
            {filtered.length}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>

        <PendingApprovalModal
          open={openApproval}
          onOpenChange={setOpenApproval}
          onRefresh={handleRefreshAfterCancel}
        />

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
          type={selectedItem?.type ?? 'peminjaman'}
        />
        <Dialog open={openPreview} onOpenChange={setOpenPreview}>
          <DialogContent
            showCloseButton={false}
            className="max-w-4xl border-none bg-transparent p-0 [&>button]:hidden"
          >
            <VisuallyHidden>
              <DialogTitle>Preview Image</DialogTitle>
            </VisuallyHidden>

            <div className="relative h-[80vh] w-full max-w-4xl overflow-hidden rounded-md bg-transparent">
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
