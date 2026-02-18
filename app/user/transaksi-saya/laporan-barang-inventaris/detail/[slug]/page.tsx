"use client";

import { useSearchParams, useParams } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useState, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type {
  StatusHistory,
  Item,
  ItemApi,
  ApiTransaksi,
  TransactionDetail,
} from "@/types/user/barang-inventaris/transaksi";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { resolveAssetImage } from "@/lib/images";
import {
  getTransaksiBySlug,
  getTransaksiItems,
  cancelPeminjamanTransaksiRequest,
  cancelPermintaanTransaksiRequest,
  getPenyerahanTransaksi,
  getPeminjamanTransaksi,
} from "@/lib/api/user";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Mail,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Clock3,
  MailCheck,
  FileCheck,
  HandHeart,
  FileText,
  HourglassIcon,
} from "lucide-react";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

export default function DetailPage() {
  const [search, setSearch] = useState("");
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
      const payload = await getTransaksiBySlug(slug);
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
      if (data.id && data.status_konfirmasi === "Dikonfirmasi") {
        try {
          const penyerahanData = await getPenyerahanTransaksi(data.id);
          console.log("Penyerahan data:", penyerahanData);
          // Store penyerahan data if it has the expected structure
          if (penyerahanData && typeof penyerahanData === "object") {
            const responseData = (penyerahanData as Record<string, unknown>)
              ?.data;
            if (Array.isArray(responseData) && responseData.length > 0) {
              const firstPenyerahan = responseData.find(
                (item: Record<string, unknown>) => item.status === "Penyerahan"
              );
              if (firstPenyerahan) {
                penyerahanInfo = firstPenyerahan;
                setPenyerahanData(firstPenyerahan);
              }
            }
          }
        } catch (err) {
          console.warn(
            "[transaksi-detail] failed to fetch penyerahan data",
            err
          );
        }

        try {
          const peminjamanData = await getPeminjamanTransaksi(data.id);
          console.log("Peminjaman data:", peminjamanData);
        } catch (err) {
          console.warn(
            "[transaksi-detail] failed to fetch peminjaman data",
            err
          );
        }
      }

      const statusHistory: StatusHistory[] = [];

      if (data.created_at) {
        statusHistory.push({
          status: "Diajukan",
          timestamp: data.created_at,
          actor: data.nama ?? "System",
        });
      }

      if (data.approval_at) {
        statusHistory.push({
          status: data.status_approval ?? "Disetujui",
          timestamp: data.approval_at,
          actor: data.nama_approval ?? "System",
        });
      }

      if (data.konfirmasi_at) {
        statusHistory.push({
          status: data.status_konfirmasi ?? "Dikonfirmasi",
          timestamp: data.konfirmasi_at,
          actor: data.nama_konfirmasi ?? "System",
        });
      }

      if (
        data.updated_at &&
        !statusHistory.find((s) => s.timestamp === data.updated_at)
      ) {
        statusHistory.push({
          status: data.status ?? "Status",
          timestamp: data.updated_at,
          actor: data.nama ?? "System",
        });
      }

      // Add penyerahan status if exists
      if (
        penyerahanInfo &&
        (penyerahanInfo as Record<string, unknown>).tgl_penyerahan &&
        (penyerahanInfo as Record<string, unknown>).name_employee
      ) {
        statusHistory.push({
          status: "Penyerahan",
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
        const payloadItems = await getTransaksiItems(slug);
        const itemResult = (() => {
          const p = payloadItems as unknown;
          if (p && typeof p === "object") {
            const pObj = p as Record<string, unknown>;
            const d = pObj.data;
            if (d && typeof d === "object") {
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
            name: it.nama ?? it.name ?? "-",
            quantity: Number(it.qty_count ?? it.qty ?? 1),
            image: resolveAssetImage(it.pic ?? undefined, "asset") ?? undefined,
          }));
          // detect if any item has confirmation in process
          const anyInProcess = itemResult.some((it) =>
            ((it.is_konfirmasi ?? "") as string)
              .toString()
              .toLowerCase()
              .includes("proses")
          );
          setHasItemConfirmationInProcess(anyInProcess);
        }
      } catch (err) {
        console.warn("[transaksi-detail] failed to fetch item details", err);
      }

      const parsed: TransactionDetail = {
        slug: String(data.slug ?? ""),
        transactionNo: String(data.no_transaksi ?? data.transactionNo ?? ""),
        date: (data.tgl_peminjaman ?? data.tgl_permintaan ?? undefined) as
          | string
          | undefined,
        returnDate: (data.tgl_pengembalian ?? undefined) as string | undefined,
        employee: String(data.nama ?? ""),
        badge: (data.no_badge ?? undefined) as string | undefined,
        employeePic: (data.pic ?? undefined) as string | undefined,
        note: (data.catatan ?? data.catatan_approval ?? undefined) as
          | string
          | undefined,
        items,
        type:
          (data.tipe ?? data.type ?? "Peminjaman").toString().toLowerCase() ===
          "permintaan"
            ? "permintaan"
            : "peminjaman",
        statusHistory,
        id: data.id,
        status: data.status ?? null,
      };
      setAssetImage(
        (data.gambar ?? data.assetImage ?? undefined) as string | undefined
      );
      setTransaction(parsed);
    } catch (error) {
      console.error(error);
    }
  }, [slug]);

  const refreshData = useCallback(async () => {
    // reset confirmation flag on slug change
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
          breadcrumb={["Transaksi Barang Inventaris"]}
          search={search}
          onSearchChange={setSearch}
          showCart={false}
          showSearch={false}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-4">
          <div className="col-span-2 space-y-4">
            <div className="rounded-sm shadow-lg border border-neutral-200 dark:border-neutral-800 dark:bg-neutral-900 p-4">
              <Skeleton className="h-6 w-56 mb-4" />
              <div className="mt-6 flex justify-center">
                <Skeleton className="h-56 w-56 rounded" />
              </div>
            </div>

            <div className="rounded-sm border shadow-lg border-neutral-200 dark:border-neutral-800 dark:bg-neutral-900 p-4 space-y-4">
              <div>
                <Skeleton className="h-5 w-48 mb-2" />
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
            <div className="rounded-sm shadow-lg border border-neutral-200 dark:border-neutral-800 dark:bg-neutral-900 p-4">
              <Skeleton className="h-40 w-full" />
            </div>

            <div className="rounded-sm shadow-lg border border-neutral-200 dark:border-neutral-800 dark:bg-neutral-900 p-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-3 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );

  const formatTimestamp = (ts?: string | undefined) => {
    if (!ts) return "";
    try {
      const d = parseISO(ts);
      return format(d, "d MMMM yyyy - HH:mm", { locale: idLocale });
    } catch {
      return ts ?? "";
    }
  };

  return (
    <div className="space-y-6">
      <Navbar
        title="Detail Transaksi"
        breadcrumb={["Transaksi Barang Inventaris"]}
        search={search}
        onSearchChange={setSearch}
        showCart={false}
        showSearch={false}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-4">
        <div className="col-span-2 space-y-4">
          <Card className="rounded-sm shadow-lg border border-neutral-200 dark:border-neutral-800 dark:bg-neutral-900">
            <CardContent className="">
              <CardTitle className="text-m dark:text-white">
                Scan QR untuk melihat detail transaksi
              </CardTitle>

              <div className="mt-6 flex justify-center">
                <div className="p-6 rounded-sm shadow bg-white/70 dark:bg-neutral-800 border dark:border-neutral-700 backdrop-blur">
                  <QRCodeCanvas value={transaction.slug ?? ""} size={230} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-sm border shadow-lg border-neutral-200 dark:border-neutral-800 dark:bg-neutral-900">
            <CardHeader>
              <CardTitle className="text-m dark:text-white">
                Informasi Transaksi
              </CardTitle>
              <p className="text-sm mt-1 text-neutral-600 dark:text-neutral-400">
                Berikut Detail Informasi Transaksi Saya
              </p>
            </CardHeader>

            <CardContent className="space-y-5 text-sm">
              <div className="flex justify-between py-1">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                  No Transaksi
                </span>
                <span className="font-bold dark:text-white text-neutral-900">
                  {transaction.transactionNo}
                </span>
              </div>

              <div className="flex justify-between py-1">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                  Tanggal{" "}
                  {transaction.type === "permintaan"
                    ? "Permintaan"
                    : "Peminjaman"}
                </span>
                <span className="font-bold dark:text-white text-neutral-900">
                  {formatTimestamp(transaction.date)}
                </span>
              </div>

              {transaction.type === "peminjaman" && (
                <div className="flex justify-between py-1">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                    Tanggal Pengembalian
                  </span>
                  <span className="font-bold dark:text-white text-neutral-900">
                    {transaction.returnDate
                      ? formatTimestamp(transaction.returnDate)
                      : "-"}
                  </span>
                </div>
              )}

              <div className="pt-1">
                <p className="font-semibold text-neutral-700 dark:text-neutral-300">
                  Employee
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <Avatar className="w-11 h-11 rounded-full overflow-hidden border object-cover">
                    {transaction.employeePic ? (
                      <AvatarImage
                        src={transaction.employeePic ?? undefined}
                        alt={transaction.employee}
                      />
                    ) : (
                      <AvatarFallback>
                        {transaction.employee
                          ? transaction.employee
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()
                          : "?"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="font-medium dark:text-white">
                      {transaction.employee}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {transaction.badge ?? "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="font-semibold text-neutral-700 dark:text-neutral-300">
                  Catatan
                </p>
                <p className="mt-1 font-medium dark:text-white">
                  {transaction.note ?? "-"}
                </p>
              </div>

              <div className="mt-4">
                <p className="font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Status
                </p>
                <div className="relative">
                  <div
                    className="absolute left-6 top-0 bottom-8 w-0.5 
                      bg-gradient-to-b 
                      from-blue-500 via-neutral-400 to-green-500
                      dark:from-blue-400 dark:via-neutral-700 dark:to-green-400"
                  />

                  {transaction.statusHistory.map((s, i) => {
                    const key = (s.status || "").toString().toLowerCase();

                    const color = key.includes("diajukan")
                      ? "bg-blue-600"
                      : key.includes("pending")
                      ? "bg-yellow-500"
                      : key.includes("disetujui")
                      ? ""
                      : key.includes("konfirmasi")
                      ? ""
                      : key.includes("penyerahan")
                      ? "bg-orange-500"
                      : key.includes("selesai") || key.includes("completed")
                      ? "bg-slate-600"
                      : "bg-red-600";

                    const Icon = key.includes("diajukan")
                      ? Mail
                      : key.includes("pending")
                      ? Clock3
                      : key.includes("disetujui")
                      ? CheckCircle
                      : key.includes("konfirmasi")
                      ? FileCheck
                      : key.includes("penyerahan")
                      ? HandHeart
                      : key.includes("selesai") || key.includes("completed")
                      ? MailCheck
                      : XCircle;

                    return (
                      <div
                        key={i}
                        className="relative flex gap-4 items-start mb-6"
                      >
                        <div
                          className={`
                            w-11 h-11 flex items-center justify-center rounded-full 
                            shadow-sm ring-2 ring-white/40 dark:ring-neutral-800/40
                            ${color}
                          `}
                          style={{
                            position: "absolute",
                            left: "15px",
                            transform: "translateX(-25%)",
                            backgroundColor: (key.includes("disetujui") || key.includes("konfirmasi")) ? '#01793b' : undefined
                          }}
                        >
                          <Icon size={22} color="white" />
                        </div>

                        <div
                          className="
                          ml-14
                          backdrop-blur-lg 
                          bg-white/20 dark:bg-neutral-900/20 
                          p-4 rounded-sm 
                          border-2 border-white/50 dark:border-neutral-600/60
                          shadow-xl
                        "
                        >
                          <p className="font-semibold dark:text-neutral-100 text-neutral-900">
                            {(() => {
                              const key = (s.status || "")
                                .toString()
                                .toLowerCase();
                              if (
                                key.includes("selesai") ||
                                key.includes("completed")
                              ) {
                                return `Transaksi Selesai`;
                              }
                              if (key.includes("pending")) {
                                return `Pending menunggu Approval`;
                              }
                              if (key.includes("penyerahan")) {
                                return `Diterima oleh ${s.actor}`;
                              }
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
                    (transaction?.status ?? "")
                      .toString()
                      .toLowerCase()
                      .includes("disetujui")) &&
                    !(transaction?.status ?? "")
                      .toString()
                      .toLowerCase()
                      .includes("batal") && (
                      <div className="relative flex gap-4 items-start mb-6">                        
                        <div
                          className="
                            w-11 h-11 flex items-center justify-center rounded-full 
                            shadow-sm ring-2 ring-white/40 dark:ring-neutral-800/40
                            bg-blue-600
                          "
                          style={{
                            position: "absolute",
                            left: "15px",
                            transform: "translateX(-25%)",
                          }}
                        >
                          <HourglassIcon className="w-6 h-6 text-white animate-spin" />
                        </div>
                        
                        <div
                          className="
                            ml-14
                            backdrop-blur-lg 
                            bg-white/20 dark:bg-neutral-900/20 
                            p-4 rounded-sm 
                            border-2 border-white/50 dark:border-neutral-600/60
                            shadow-sm
                          "
                        >
                          <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                            Menunggu Konfirmasi Kompilator
                          </p>

                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Permintaan sedang diproses oleh pihak terkait
                          </p>

                          <div className="mt-3">
                            <Button
                              className="w-full bg-red-600 text-white hover:bg-red-500 cursor-pointer"
                              disabled={cancelLoading}
                              onClick={() => {
                                if (!transaction?.id) return;
                                setShowCancelDialog(true);
                              }}
                            >
                              Batalkan{" "}
                              {transaction?.type === "permintaan"
                                ? "Permintaan"
                                : "Peminjaman"}{" "}
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
                      className="w-full bg-blue-600 text-white hover:bg-blue-700 rounded-sm flex items-center gap-2 justify-center cursor-pointer"
                      onClick={() => {
                        if (
                          penyerahanData &&
                          typeof penyerahanData === "object"
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
                                url: `https://storage.googleapis.com/pkc_gcp-storage/asset/asset/${firstImage.gambar}`,
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
          <Card className="sticky top-0 rounded-sm shadow-lg border rounded-sm shadow-lg border border-neutral-200 dark:border-neutral-800 dark:bg-neutral-900">
            <CardHeader>
              <CardTitle className="text-m dark:text-white">
                {penyerahanData
                  ? "Detail Penyerahan Asset"
                  : transaction.type === "permintaan"
                  ? "Detail Permintaan Asset"
                  : "Detail Peminjaman Asset"}
              </CardTitle>
              <p className="text-sm mt-1 text-neutral-600 dark:text-neutral-400">
                {penyerahanData
                  ? "Berikut Detail Penyerahan Asset"
                  : transaction.type === "permintaan"
                  ? "Berikut Detail Permintaan Asset"
                  : "Berikut Detail Peminjaman Asset"}
              </p>
            </CardHeader>

            <CardContent>
              {penyerahanData ? (
                (() => {
                  // Get all penyerahan items from the response
                  const penyerahanItems = Array.isArray(
                    (penyerahanData as Record<string, unknown>).data
                  )
                    ? ((penyerahanData as Record<string, unknown>)
                        .data as Record<string, unknown>[])
                    : [penyerahanData as Record<string, unknown>];

                  return (
                    <div>
                      <p className="text-m text-neutral-700 dark:text-neutral-300 mb-2">
                        Asset Yang Diserahkan
                      </p>

                      {penyerahanItems.length > 3 ? (
                        <ScrollArea className="mt-2 max-h-54 h-54">
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
                                ? `https://storage.googleapis.com/pkc_gcp-storage/asset/asset/${gambarInventory[0].gambar}`
                                : assetImage ?? "";

                              return (
                                <div
                                  key={i}
                                  className="flex items-center gap-4 border border-neutral-200 dark:border-neutral-700 p-3 rounded-sm shadow-sm"
                                >
                                  <Image
                                    src={imageUrl}
                                    width={70}
                                    height={70}
                                    alt={(item.nama as string) ?? "asset"}
                                    className="rounded-sm object-cover cursor-zoom-in hover:opacity-80 transition"
                                    onClick={() => setPreviewImage(imageUrl)}
                                  />
                                  <div>
                                    <p className="text-m dark:text-white">
                                      {item.nama as string}
                                    </p>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                      Diserahkan: 1
                                    </p>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                      Diterima oleh:{" "}
                                      {item.name_employee as string}
                                    </p>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                      {item.tgl_penyerahan
                                        ? format(
                                            parseISO(
                                              item.tgl_penyerahan as string
                                            ),
                                            "d MMMM yyyy - HH:mm",
                                            { locale: idLocale }
                                          )
                                        : "-"}
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
                              ? `https://storage.googleapis.com/pkc_gcp-storage/asset/asset/${gambarInventory[0].gambar}`
                              : assetImage ?? "";

                            return (
                              <div
                                key={i}
                                className="flex items-center gap-4 border border-neutral-200 dark:border-neutral-700 p-3 rounded-sm shadow-sm"
                              >
                                <Image
                                  src={imageUrl}
                                  width={70}
                                  height={70}
                                  alt={(item.nama as string) ?? "asset"}
                                  className="rounded-sm object-cover cursor-zoom-in hover:opacity-80 transition"
                                  onClick={() => setPreviewImage(imageUrl)}
                                />
                                <div>
                                  <p className="text-m dark:text-white">
                                    {item.nama as string}
                                  </p>
                                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                    Diserahkan: 1
                                  </p>
                                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                    Diterima oleh:{" "}
                                    {item.name_employee as string}
                                  </p>
                                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    {item.tgl_penyerahan
                                      ? format(
                                          parseISO(
                                            item.tgl_penyerahan as string
                                          ),
                                          "d MMMM yyyy - HH:mm",
                                          { locale: idLocale }
                                        )
                                      : "-"}
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
                    {transaction.type === "permintaan"
                      ? "List Permintaan Asset"
                      : "List Pengajuan Asset"}
                  </p>

                  {transaction.items.length > 3 ? (
                    <ScrollArea className="mt-2 max-h-54 h-54">
                      <div className="space-y-4">
                        {transaction.items.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-4 border border-neutral-200 dark:border-neutral-700 p-3 rounded-sm shadow-sm"
                          >
                            <Image
                              src={item.image ?? assetImage ?? ""}
                              width={70}
                              height={70}
                              alt={item.name ?? "asset"}
                              className="rounded-sm object-cover cursor-zoom-in hover:opacity-80 transition"
                              onClick={() =>
                                setPreviewImage(item.image ?? assetImage ?? "")
                              }
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm dark:text-white font-medium leading-tight break-words">
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
                          className="flex items-center gap-4 border border-neutral-200 dark:border-neutral-700 p-3 rounded-sm shadow-sm"
                        >
                          <Image
                            src={item.image ?? assetImage ?? ""}
                            width={70}
                            height={70}
                            alt={item.name ?? "asset"}
                            className="rounded-sm object-cover cursor-zoom-in hover:opacity-80 transition"
                            onClick={() =>
                              setPreviewImage(item.image ?? assetImage ?? "")
                            }
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm dark:text-white font-medium leading-tight break-words">
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
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl w-full h-[80vh] rounded-sm overflow-hidden bg-transparent">
            <Image
              src={previewImage ?? ""}
              alt="Preview"
              fill
              className="object-contain cursor-zoom-out"
              onClick={() => setPreviewImage(null)}
            />
          </div>
        </div>
      )}
      <Dialog open={showPenyerahanModal} onOpenChange={setShowPenyerahanModal}>
        <DialogContent className="rounded-sm max-w-2xl transition-all [&_button[data-slot='dialog-close']]:top-6">
          <DialogHeader>
            <DialogTitle>Bukti Penerimaan</DialogTitle>
            <DialogDescription>
              Berikut Bukti Penerimaan Asset
            </DialogDescription>
          </DialogHeader>
          {penyerahanImage && (
            <div className="relative w-full h-96 bg-neutral-100 dark:bg-neutral-800 rounded-sm overflow-hidden">
              <Image
                src={penyerahanImage.url}
                alt={penyerahanImage.name}
                fill
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Pembatalan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin membatalkan{" "}
              {transaction?.type === "permintaan" ? "permintaan" : "peminjaman"}{" "}
              asset ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="cursor-pointer rounded-sm"
              disabled={cancelLoading}
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 cursor-pointer rounded-sm"
              disabled={cancelLoading}
              onClick={async () => {
                if (!transaction?.id) return;
                try {
                  setCancelLoading(true);
                  if (transaction.type === "peminjaman") {
                    await cancelPeminjamanTransaksiRequest(transaction.id!);
                  } else {
                    await cancelPermintaanTransaksiRequest(transaction.id!);
                  }
                  toast.success(
                    `${
                      transaction.type === "permintaan"
                        ? "Permintaan"
                        : "Peminjaman"
                    } asset berhasil dibatalkan`
                  );
                  setShowCancelDialog(false);
                  await refreshData();
                } catch (err) {
                  console.error(err);
                  toast.error(
                    "Terjadi kesalahan saat membatalkan transaksi. Silakan coba lagi."
                  );
                } finally {
                  setCancelLoading(false);
                }
              }}
            >
              {cancelLoading ? "Membatalkan..." : "Ya, Batalkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>{" "}
    </div>
  );
}
