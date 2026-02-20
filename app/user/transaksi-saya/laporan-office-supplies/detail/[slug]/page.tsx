'use client';

import { useCallback, useEffect, useState } from 'react';

import Image from 'next/image';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  ArrowLeft,
  CheckCircle,
  Clock3,
  FileText,
  HandHeart,
  HourglassIcon,
  Mail,
  MailCheck,
  XCircle,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'sonner';

import Navbar from '@/components/navbar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  cancelOfficeSuppliesTransaksiRequest,
  getPeminjamanTransaksi,
  getPenyerahanTransaksi,
  getTransaksiConsumableBySlug,
  getTransaksiConsumableItems,
} from '@/lib/api/user';
import { resolveAssetImage } from '@/lib/images';
import type {
  ApiTransaksi,
  Item,
  ItemApi,
  StatusHistory,
  TransactionDetail,
} from '@/types/user/office-supplies/transaksi';

export default function DetailPage() {
  const [search, setSearch] = useState('');
  useSearchParams();
  const [transaction, setTransaction] = useState<TransactionDetail | null>(
    null
  );
  const [hasItemConfirmationInProcess, setHasItemConfirmationInProcess] =
    useState<boolean>(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | undefined | null>(
    null
  );
  const [assetImage, setAssetImage] = useState<string | undefined | null>(null);
  const [penyerahanData, setPenyerahanData] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [showPenyerahanModal, setShowPenyerahanModal] = useState(false);
  const [penyerahanImage, setPenyerahanImage] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const router = useRouter();

  const { slug } = useParams<{ slug: string }>();

  const fetchDetail = useCallback(async () => {
    if (!slug) return;

    try {
      const payload = await getTransaksiConsumableBySlug(slug);
      const data = (payload?.data ?? payload) as unknown as ApiTransaksi;

      let items: Item[] = Array.isArray(data.items)
        ? data.items
        : data.assetName
          ? [
              {
                name: data.assetName,
                quantity: data.quantity ?? 1,
                image: data.assetImage,
              },
            ]
          : [];

      // Call additional APIs for penyerahan and peminjaman transaksi only if status_konfirmasi is "Dikonfirmasi"
      let penyerahanInfo = null;
      if (data.id && data.status_konfirmasi === 'Dikonfirmasi') {
        try {
          const penyerahanResponse = await getPenyerahanTransaksi(data.id);
          console.log('Penyerahan data:', penyerahanResponse);
          // Store penyerahan data if it has the expected structure
          if (penyerahanResponse && typeof penyerahanResponse === 'object') {
            const responseData = (penyerahanResponse as Record<string, unknown>)
              ?.data;
            if (Array.isArray(responseData) && responseData.length > 0) {
              const firstPenyerahan = responseData.find(
                (item: Record<string, unknown>) => item.status === 'Penyerahan'
              );
              if (firstPenyerahan) {
                penyerahanInfo = firstPenyerahan;
                setPenyerahanData(firstPenyerahan);
              }
            }
          }
        } catch (err) {
          console.warn(
            '[transaksi-detail] failed to fetch penyerahan data',
            err
          );
        }

        try {
          const peminjamanData = await getPeminjamanTransaksi(data.id);
          console.log('Peminjaman data:', peminjamanData);
        } catch (err) {
          console.warn(
            '[transaksi-detail] failed to fetch peminjaman data',
            err
          );
        }
      }

      const statusHistory: StatusHistory[] = [];

      if (data.created_at) {
        statusHistory.push({
          status: 'Diajukan',
          timestamp: data.created_at,
          actor: data.nama ?? 'System',
        });
      }

      if (data.approval_at) {
        statusHistory.push({
          status: data.status_approval ?? 'Disetujui',
          timestamp: data.approval_at,
          actor: data.nama_approval ?? 'System',
        });
      }

      if (data.konfirmasi_at) {
        statusHistory.push({
          status: data.status_konfirmasi ?? 'Dikonfirmasi',
          timestamp: data.konfirmasi_at,
          actor: data.nama_konfirmasi ?? 'System',
        });
      }

      if (
        data.updated_at &&
        !statusHistory.find(s => s.timestamp === data.updated_at)
      ) {
        statusHistory.push({
          status: data.status ?? 'Status',
          timestamp: data.updated_at,
          actor: data.nama ?? 'System',
        });
      }

      // Add penyerahan status if exists
      if (
        penyerahanInfo &&
        (penyerahanInfo as Record<string, unknown>).tgl_penyerahan &&
        (penyerahanInfo as Record<string, unknown>).name_employee
      ) {
        statusHistory.push({
          status: 'Penyerahan',
          timestamp: (penyerahanInfo as Record<string, unknown>)
            .tgl_penyerahan as string,
          actor: (penyerahanInfo as Record<string, unknown>)
            .name_employee as string,
        });
      }

      // Sort status history by timestamp to ensure chronological order
      statusHistory.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return timeA - timeB;
      });

      try {
        const payloadItems = await getTransaksiConsumableItems(slug);
        const itemResult = (() => {
          const p = payloadItems as unknown;
          if (p && typeof p === 'object') {
            const pObj = p as Record<string, unknown>;
            const d = pObj.data;
            if (d && typeof d === 'object') {
              const dObj = d as Record<string, unknown>;
              const ir = dObj.itemResult ?? dObj.itemresult ?? dObj.item_result;
              if (Array.isArray(ir)) return ir as ItemApi[];
            }

            const topIr =
              pObj.itemResult ?? pObj.itemresult ?? pObj.item_result;
            if (Array.isArray(topIr)) return topIr as ItemApi[];
          }
          return [] as ItemApi[];
        })();

        if (itemResult.length) {
          items = itemResult.map((it: ItemApi) => ({
            name: it.nama ?? it.name ?? '-',
            quantity: Number(it.qty_count ?? it.qty ?? 1),
            image: resolveAssetImage(it.pic ?? undefined, 'asset') ?? undefined,
          }));
          const anyInProcess = itemResult.some(it =>
            ((it.is_konfirmasi ?? '') as string)
              .toString()
              .toLowerCase()
              .includes('proses')
          );
          setHasItemConfirmationInProcess(anyInProcess);
        }
      } catch (err) {
        console.warn('[transaksi-detail] failed to fetch item details', err);
      }

      const parsed: TransactionDetail = {
        slug: String(data.slug ?? ''),
        transactionNo: String(data.no_transaksi ?? data.transactionNo ?? ''),
        date: (data.tgl_peminjaman ?? data.tgl_permintaan) as
          | string
          | null
          | undefined,
        returnDate: (data.tgl_pengembalian ?? undefined) as
          | string
          | null
          | undefined,
        employee: String(data.nama ?? ''),
        badge: (data.no_badge ?? undefined) as string | null | undefined,
        employeePic: (data.pic ?? undefined) as string | null | undefined,
        note: (data.catatan ?? data.catatan_approval ?? undefined) as
          | string
          | null
          | undefined,
        items,
        type:
          (data.tipe ?? data.type ?? 'Peminjaman').toString().toLowerCase() ===
          'permintaan'
            ? 'permintaan'
            : 'peminjaman',
        statusHistory,
        id: data.id,
        status: data.status ?? null,
      };
      setAssetImage(data.gambar ?? data.assetImage ?? null);
      setTransaction(parsed);
    } catch (error) {
      console.error(error);
    }
  }, [slug]);

  const refreshData = useCallback(async () => {
    setHasItemConfirmationInProcess(false);
    await fetchDetail();
  }, [fetchDetail]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  if (!transaction)
    return (
      <div className="space-y-6">
        <Navbar
          title="Detail Transaksi"
          breadcrumb={['Transaksi Office Supplies']}
          search={search}
          onSearchChange={setSearch}
          showCart={false}
          showSearch={false}
        />

        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="col-span-2 space-y-4">
            <div className="rounded-md border border-neutral-100 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <Skeleton className="mb-4 h-6 w-56" />
              <div className="mt-6 flex justify-center">
                <Skeleton className="h-56 w-56 rounded" />
              </div>
            </div>

            <div className="space-y-4 rounded-md border border-neutral-100 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div>
                <Skeleton className="mb-2 h-5 w-48" />
                <Skeleton className="h-3 w-64" />
              </div>

              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between py-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-md border border-neutral-100 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <Skeleton className="h-40 w-full" />
            </div>

            <div className="space-y-2 rounded-md border border-neutral-100 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-3 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );

  const formatTimestamp = (ts?: string | null) => {
    if (!ts) return '';
    try {
      const d = parseISO(ts as string);
      return format(d, 'd MMMM yyyy - HH:mm', { locale: idLocale });
    } catch {
      return (ts as string) ?? '';
    }
  };

  return (
    <div className="space-y-6">
      <Navbar
        title="Detail Transaksi"
        breadcrumb={['Transaksi Office Supplies']}
        search={search}
        onSearchChange={setSearch}
        showCart={false}
        showSearch={false}
      />
      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="col-span-2 space-y-4">
          <Card className="rounded-md border border-neutral-100 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <CardContent className="">
              <CardTitle className="text-m dark:text-white">
                Scan QR untuk melihat detail transaksi
              </CardTitle>

              <div className="mt-6 flex justify-center">
                <div className="rounded-md border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
                  <QRCodeCanvas value={transaction.slug} size={230} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-md border border-neutral-100 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <CardHeader>
              <CardTitle className="text-m dark:text-white">
                Informasi Transaksi
              </CardTitle>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                Berikut Detail Informasi Transaksi Saya
              </p>
            </CardHeader>

            <CardContent className="space-y-5 text-sm">
              <div className="flex justify-between py-1">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                  No Transaksi
                </span>
                <span className="font-bold text-neutral-900 dark:text-white">
                  {transaction.transactionNo}
                </span>
              </div>

              <div className="flex justify-between py-1">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                  Tanggal Permintaan
                </span>
                <span className="font-bold text-neutral-900 dark:text-white">
                  {formatTimestamp(transaction.date)}
                </span>
              </div>

              {/* {transaction.type !== "permintaan" && (
                <div className="flex justify-between py-1">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">Tanggal Pengembalian</span>
                  <span className="font-bold dark:text-white text-neutral-900">{transaction.returnDate ? formatTimestamp(transaction.returnDate) : "-"}</span>
                </div>
              )} */}

              <div className="pt-1">
                <p className="font-semibold text-neutral-700 dark:text-neutral-300">
                  Employee
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <Avatar className="h-11 w-11 overflow-hidden rounded-full border object-cover">
                    {transaction.employeePic ? (
                      <AvatarImage
                        src={transaction.employeePic ?? undefined}
                        alt={transaction.employee}
                        className="h-full w-full object-cover object-top"
                      />
                    ) : (
                      <AvatarFallback>
                        {transaction.employee
                          ? transaction.employee
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
                    <p className="font-medium dark:text-white">
                      {transaction.employee}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {transaction.badge ?? '-'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="font-semibold text-neutral-700 dark:text-neutral-300">
                  Catatan
                </p>
                <p className="mt-1 font-medium dark:text-white">
                  {transaction.note ?? '-'}
                </p>
              </div>

              <div className="mt-4">
                <p className="mb-2 font-semibold text-neutral-700 dark:text-neutral-300">
                  Status
                </p>
                <div className="relative">
                  <div className="absolute top-0 bottom-8 left-6 w-0.5 bg-gradient-to-b from-blue-500 via-neutral-400 to-green-500 dark:from-blue-400 dark:via-neutral-700 dark:to-green-400" />

                  {transaction.statusHistory.map((s, i) => {
                    const color =
                      s.status === 'Diajukan'
                        ? 'bg-blue-600'
                        : s.status === 'Pending'
                          ? 'bg-yellow-500'
                          : s.status === 'Disetujui'
                            ? ''
                            : s.status === 'Penyerahan'
                              ? 'bg-orange-500'
                              : s.status === 'Selesai'
                                ? 'bg-slate-600'
                                : 'bg-red-600';

                    const Icon =
                      s.status === 'Diajukan'
                        ? Mail
                        : s.status === 'Pending'
                          ? Clock3
                          : s.status === 'Disetujui'
                            ? CheckCircle
                            : s.status === 'Penyerahan'
                              ? HandHeart
                              : s.status === 'Selesai'
                                ? MailCheck
                                : XCircle;

                    return (
                      <div
                        key={i}
                        className="relative mb-6 flex items-start gap-4"
                      >
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-full shadow-sm ring-2 ring-white/40 dark:ring-neutral-800/40 ${color} `}
                          style={{
                            position: 'absolute',
                            left: '15px',
                            transform: 'translateX(-25%)',
                            backgroundColor:
                              s.status === 'Disetujui' ? '#01793b' : undefined,
                          }}
                        >
                          <Icon size={22} color="white" />
                        </div>

                        <div className="ml-14 rounded-md border border-neutral-100 bg-white p-4 shadow-sm dark:border-neutral-700">
                          <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {(() => {
                              const key = (s.status || '')
                                .toString()
                                .toLowerCase();
                              if (
                                key.includes('selesai') ||
                                key.includes('completed')
                              )
                                return 'Transaksi Selesai';
                              if (key.includes('pending'))
                                return 'Pending menunggu Approval';
                              if (key.includes('penyerahan'))
                                return `Diterima oleh ${s.actor}`;
                              return `${s.status} oleh ${s.actor}`;
                            })()}
                          </p>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {formatTimestamp(s.timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {(hasItemConfirmationInProcess ||
                    (transaction?.status ?? '')
                      .toString()
                      .toLowerCase()
                      .includes('disetujui')) &&
                    !(transaction?.status ?? '')
                      .toString()
                      .toLowerCase()
                      .includes('batal') && (
                      <div className="relative mb-6 flex items-start gap-4">
                        <div
                          className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 shadow-sm ring-2 ring-white/40 dark:ring-neutral-800/40"
                          style={{
                            position: 'absolute',
                            left: '15px',
                            transform: 'translateX(-25%)',
                          }}
                        >
                          <HourglassIcon className="h-6 w-6 animate-spin text-white" />
                        </div>

                        <div className="ml-14 rounded-md border border-neutral-100 bg-white p-4 shadow-sm dark:border-neutral-700">
                          <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                            Menunggu Konfirmasi Kompilator
                          </p>

                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Permintaan sedang diproses oleh pihak terkait
                          </p>

                          <div className="mt-3">
                            <Button
                              className="w-full cursor-pointer bg-red-600 text-white hover:bg-red-500"
                              disabled={cancelLoading}
                              onClick={() => {
                                if (!transaction?.id) return;
                                setShowCancelDialog(true);
                              }}
                            >
                              Batalkan{' '}
                              {transaction?.type === 'permintaan'
                                ? 'Permintaan'
                                : 'Peminjaman'}{' '}
                              Asset
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                </div>

                {penyerahanData && (
                  <div className="mt-6">
                    <Button
                      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                      onClick={() => {
                        if (
                          penyerahanData &&
                          typeof penyerahanData === 'object'
                        ) {
                          const gambarInventory = (
                            penyerahanData as Record<string, unknown>
                          ).gambarinventory;
                          const namaAsset = (
                            penyerahanData as Record<string, unknown>
                          ).nama;
                          if (
                            Array.isArray(gambarInventory) &&
                            gambarInventory.length > 0
                          ) {
                            const firstImage = gambarInventory[0] as Record<
                              string,
                              unknown
                            >;
                            if (firstImage && firstImage.gambar) {
                              setPenyerahanImage({
                                url: `https://storage.googleapis.com/pkc_gcp-storage/asset/kategori/${firstImage.gambar}`,
                                name: String(namaAsset || firstImage.gambar),
                              });
                              setShowPenyerahanModal(true);
                            }
                          }
                        }
                      }}
                    >
                      <FileText size={18} />
                      Lihat Bukti Penerimaan
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-2 lg:col-span-1">
          <Card className="sticky top-2 rounded-md border border-neutral-100 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <CardHeader>
              <CardTitle className="text-m dark:text-white">
                {penyerahanData
                  ? 'Detail Penyerahan Asset'
                  : 'Detail Permintaan Asset'}
              </CardTitle>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                {penyerahanData
                  ? 'Berikut Detail Penyerahan Asset'
                  : 'Berikut Detail Permintaan Asset'}
              </p>
            </CardHeader>

            <CardContent>
              {penyerahanData ? (
                (() => {
                  const penyerahanItems = Array.isArray(
                    (penyerahanData as Record<string, unknown>).data
                  )
                    ? ((penyerahanData as Record<string, unknown>)
                        .data as Record<string, unknown>[])
                    : [penyerahanData as Record<string, unknown>];

                  return (
                    <div>
                      <p className="text-m mb-2 text-neutral-700 dark:text-neutral-300">
                        Asset Yang Diserahkan
                      </p>

                      {penyerahanItems.length > 2 ? (
                        <ScrollArea className="mt-2 h-54 max-h-54">
                          <div className="space-y-4">
                            {penyerahanItems.map((item, i) => {
                              const gambarInventory = Array.isArray(
                                item.gambarinventory
                              )
                                ? (item.gambarinventory as Record<
                                    string,
                                    unknown
                                  >[])
                                : [];
                              const imageUrl = gambarInventory[0]?.gambar
                                ? `https://storage.googleapis.com/pkc_gcp-storage/asset/kategori/${gambarInventory[0].gambar}`
                                : (assetImage ?? '');

                              return (
                                <div
                                  key={i}
                                  className="flex items-center gap-4 rounded-md border border-neutral-100 p-3 shadow-sm dark:border-neutral-700"
                                >
                                  <Image
                                    src={imageUrl}
                                    width={70}
                                    height={70}
                                    alt={(item.nama as string) ?? 'asset'}
                                    className="cursor-zoom-in rounded-md object-cover transition hover:opacity-80"
                                    onClick={() => setPreviewImage(imageUrl)}
                                  />
                                  <div>
                                    <p className="text-m dark:text-white">
                                      {item.nama as string}
                                    </p>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                      Diserahkan: 1
                                    </p>
                                    <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                                      Diterima oleh:{' '}
                                      {item.name_employee as string}
                                    </p>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                      {item.tgl_penyerahan
                                        ? format(
                                            parseISO(
                                              item.tgl_penyerahan as string
                                            ),
                                            'd MMMM yyyy - HH:mm',
                                            { locale: idLocale }
                                          )
                                        : '-'}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="mt-2 space-y-4">
                          {penyerahanItems.map((item, i) => {
                            const gambarInventory = Array.isArray(
                              item.gambarinventory
                            )
                              ? (item.gambarinventory as Record<
                                  string,
                                  unknown
                                >[])
                              : [];
                            const imageUrl = gambarInventory[0]?.gambar
                              ? `https://storage.googleapis.com/pkc_gcp-storage/asset/kategori/${gambarInventory[0].gambar}`
                              : (assetImage ?? '');

                            return (
                              <div
                                key={i}
                                className="flex items-center gap-4 rounded-md border border-neutral-100 p-3 shadow-sm dark:border-neutral-700"
                              >
                                <Image
                                  src={imageUrl}
                                  width={70}
                                  height={70}
                                  alt={(item.nama as string) ?? 'asset'}
                                  className="cursor-zoom-in rounded-md object-cover transition hover:opacity-80"
                                  onClick={() => setPreviewImage(imageUrl)}
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm leading-tight font-medium break-words dark:text-white">
                                    {item.nama as string}
                                  </p>
                                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                    Diserahkan: 1
                                  </p>
                                  <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                                    Diterima oleh:{' '}
                                    {item.name_employee as string}
                                  </p>
                                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    {item.tgl_penyerahan
                                      ? format(
                                          parseISO(
                                            item.tgl_penyerahan as string
                                          ),
                                          'd MMMM yyyy - HH:mm',
                                          { locale: idLocale }
                                        )
                                      : '-'}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div>
                  <p className="text-m text-neutral-700 dark:text-neutral-300">
                    List Pengajuan Asset
                  </p>

                  {transaction.items.length > 2 ? (
                    <ScrollArea className="mt-2 h-54 max-h-54">
                      <div className="space-y-4">
                        {transaction.items.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-4 rounded-md border border-neutral-100 p-3 shadow-sm dark:border-neutral-700"
                          >
                            <Image
                              src={item.image ?? assetImage ?? ''}
                              width={70}
                              height={70}
                              alt={item.name ?? 'asset'}
                              className="cursor-zoom-in rounded-md object-cover transition hover:opacity-80"
                              onClick={() =>
                                setPreviewImage(item.image ?? assetImage ?? '')
                              }
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm leading-tight font-medium break-words dark:text-white">
                                {item.name}
                              </p>
                              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                Diajukan: {item.quantity}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="mt-2 space-y-4">
                      {transaction.items.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-4 rounded-md border border-neutral-100 p-3 shadow-sm dark:border-neutral-700"
                        >
                          <Image
                            src={item.image ?? assetImage ?? ''}
                            width={70}
                            height={70}
                            alt={item.name ?? 'asset'}
                            className="cursor-zoom-in rounded-md object-cover transition hover:opacity-80"
                            onClick={() =>
                              setPreviewImage(item.image ?? assetImage ?? '')
                            }
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm leading-tight font-medium break-words dark:text-white">
                              {item.name}
                            </p>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                              Diajukan: {item.quantity}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative h-[80vh] w-full max-w-4xl overflow-hidden rounded-md bg-transparent">
            <Image
              src={previewImage}
              alt="Preview"
              fill
              className="cursor-zoom-out object-contain"
              onClick={() => setPreviewImage(null)}
            />
          </div>
        </div>
      )}
      <Dialog open={showPenyerahanModal} onOpenChange={setShowPenyerahanModal}>
        <DialogContent className="max-w-2xl rounded-md transition-all">
          <DialogHeader>
            <DialogTitle>Bukti Penerimaan</DialogTitle>
            <DialogDescription>
              Berikut Bukti Penerimaan Asset
            </DialogDescription>
          </DialogHeader>
          {penyerahanImage && (
            <div className="relative h-96 w-full overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-800">
              <Image
                src={penyerahanImage.url}
                alt={penyerahanImage.name}
                fill
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>{' '}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="rounded-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Pembatalan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin membatalkan permintaan office supplies
              ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="cursor-pointer rounded-md"
              disabled={cancelLoading}
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer rounded-md bg-red-600 hover:bg-red-700"
              disabled={cancelLoading}
              onClick={async () => {
                if (!transaction?.id) return;
                try {
                  setCancelLoading(true);
                  await cancelOfficeSuppliesTransaksiRequest(transaction.id!);
                  toast.success(
                    'Permintaan office supplies berhasil dibatalkan'
                  );
                  setShowCancelDialog(false);
                  await refreshData();
                } catch (err) {
                  console.error(err);
                  toast.error(
                    'Terjadi kesalahan saat membatalkan permintaan. Silakan coba lagi.'
                  );
                } finally {
                  setCancelLoading(false);
                }
              }}
            >
              {cancelLoading ? 'Membatalkan...' : 'Ya, Batalkan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>{' '}
    </div>
  );
}
