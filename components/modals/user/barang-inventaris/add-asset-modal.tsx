'use client';

import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { CirclePlus, Inbox, ZoomIn } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  createBorrowingCart,
  createRequestCart,
  getInventoryBorrowingAvailable,
  getInventoryRequestAvailable,
} from '@/lib/api/user';
import { resolveAssetImage } from '@/lib/images';
import type { UIAsset } from '@/types/user/barang-inventaris/modals';

type Props = {
  open: boolean;
  onClose: () => void;
  item: UIAsset | null;
  onSubmit: (data: {
    id: number;
    name: string;
    qty: number;
    notes: string;
    photo?: string;
  }) => void;
  type?: 'peminjaman' | 'permintaan';
  suggestedItems?: UIAsset[];
  onSuccess?: () => void;
};

export function AddAssetModal({
  open,
  onClose,
  item,
  onSubmit,
  type = 'peminjaman',
  suggestedItems = [],
  onSuccess,
}: Props) {
  const { data: session } = useSession();
  const isPermintaan = type === 'permintaan';
  const [fetchedItems, setFetchedItems] = useState<UIAsset[] | null>(null);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const displayItems: UIAsset[] = fetchedItems ?? (suggestedItems || []);

  const noData =
    !loadingAssets &&
    (!displayItems || displayItems.length === 0) &&
    !fetchError;

  const [name, setName] = useState((item as UIAsset)?.name || '');
  const [qty, setQty] = useState('');
  const [notes, setNotes] = useState('');
  const [openPreview, setOpenPreview] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<UIAsset | null>(item);
  const formRef = useRef<HTMLDivElement | null>(null);
  const [previewAsset, setPreviewAsset] = useState<UIAsset | null>(null);

  type FormValues = {
    name: string;
    qty: string | number;
    notes: string;
  };

  const form = useForm<FormValues>({
    defaultValues: {
      name: name,
      qty: qty,
      notes: notes,
    },
  });

  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = form.handleSubmit(
    async values => {
      const payloadId = Number(selectedAsset?.id || (item as UIAsset).id);
      const parsedQty = Number(values.qty);

      if (type === 'peminjaman') {
        try {
          setSubmitting(true);

          const payload = {
            kategori_id: payloadId,
            kompilator_id: selectedAsset?.kompilator_id ?? 3,
            no_badge: session?.user?.id || '',
            nama: values.name,
            pic: selectedAsset?.image ?? (item as UIAsset).image ?? '',
            qty: parsedQty,
            catatan: values.notes || '',
          } as const;

          await createBorrowingCart(payload);
          toast.success('Barang berhasil ditambahkan ke keranjang');

          try {
            onSubmit({
              id: payloadId,
              name: values.name,
              qty: parsedQty,
              notes: values.notes,
              photo:
                selectedAsset?.image ?? (item as UIAsset).image ?? undefined,
            });
          } catch (e) {
            console.warn('onSubmit handler error:', e);
          }

          onClose();
          try {
            if (typeof onSuccess === 'function') onSuccess();
          } catch {}
          router.refresh();
        } catch (err) {
          console.error('POST keranjang borrowing error:', err);
          toast.error('Gagal menambahkan barang ke keranjang');
        } finally {
          setSubmitting(false);
        }
      } else {
        try {
          setSubmitting(true);

          const payload = {
            kategori_id: payloadId,
            kompilator_id: selectedAsset?.kompilator_id ?? 3,
            no_badge: session?.user?.id || '',
            nama: values.name,
            pic: selectedAsset?.image ?? (item as UIAsset).image ?? '',
            qty: parsedQty,
            catatan: values.notes || '',
          } as const;

          await createRequestCart(payload);
          toast.success('Barang berhasil ditambahkan ke keranjang permintaan');

          try {
            onSubmit({
              id: payloadId,
              name: values.name,
              qty: parsedQty,
              notes: values.notes,
              photo:
                selectedAsset?.image ?? (item as UIAsset).image ?? undefined,
            });
          } catch (e) {
            console.warn('onSubmit handler error:', e);
          }

          onClose();
          try {
            if (typeof onSuccess === 'function') onSuccess();
          } catch {}
          router.refresh();
        } catch (err) {
          console.error('POST keranjang request error:', err);
          toast.error('Gagal menambahkan barang ke keranjang permintaan');
        } finally {
          setSubmitting(false);
        }
      }
    },
    errors => {
      const first = Object.keys(errors)[0] as keyof FormValues | undefined;
      if (first) {
        try {
          form.setFocus(first as keyof FormValues);
        } catch (e) {
          console.error(e);
        }
      }
    }
  );

  useEffect(() => {
    let mounted = true;
    async function loadAvailable() {
      const kategoriId = (item as UIAsset | null)?.id;
      if (!kategoriId) return;
      try {
        setLoadingAssets(true);
        setFetchError(null);

        const payload =
          type === 'peminjaman'
            ? await getInventoryBorrowingAvailable(kategoriId)
            : await getInventoryRequestAvailable(kategoriId);

        const data = (payload?.data ?? payload) as unknown;
        if (!mounted) return;

        if (Array.isArray(data)) {
          const mapped: UIAsset[] = (data as unknown[]).map(d => {
            const rec = d as Record<string, unknown>;
            const id = rec.id ?? rec.kategori_id ?? rec._id ?? Math.random();
            const name = String(rec.nama ?? rec.name ?? '');

            let image: string | null = null;
            let available = 0;
            const countObj = rec._count as Record<string, unknown> | undefined;
            if (countObj && typeof countObj.nama !== 'undefined') {
              try {
                available = Number(countObj.nama ?? 0) || 0;
              } catch (e) {
                available = 0;
              }
            }

            const gambarinv = rec.gambarinventory;
            if (Array.isArray(gambarinv) && gambarinv.length > 0) {
              const first = gambarinv[0] as Record<string, unknown> | undefined;
              const g = first?.gambar as string | undefined;
              image = resolveAssetImage(g ?? undefined, 'asset') ?? null;
            }

            return {
              id: id as number | string,
              name,
              available,
              desc: undefined,
              image,
            } as UIAsset;
          });
          setFetchedItems(mapped);
        } else {
          setFetchedItems([]);
        }
      } catch (err: unknown) {
        console.error('Failed to fetch available inventory:', err);
        setFetchError(err instanceof Error ? err.message : String(err));
        setFetchedItems([]);
      } finally {
        setLoadingAssets(false);
      }
    }

    if (open) loadAvailable();
    return () => {
      mounted = false;
    };
  }, [open, type, item]);

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="my-4 w-[90%] overflow-hidden rounded-sm border border-neutral-200 bg-white p-0 shadow-xl sm:my-2 sm:max-w-md md:max-w-lg dark:border-neutral-700 dark:bg-neutral-900 [&_button[data-slot='dialog-close']]:top-5">
          <div className="sticky top-0 border-neutral-200 bg-white px-6 pt-4 dark:border-neutral-700 dark:bg-neutral-900">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Tambahkan Barang Inventaris
              </DialogTitle>
              <p className="text-sm text-neutral-700 dark:text-neutral-400">
                {isPermintaan
                  ? 'Berikut detail barang inventaris yang anda akan minta'
                  : 'Berikut detail barang inventaris yang anda akan pinjam'}
              </p>
            </DialogHeader>
          </div>

          <ScrollArea className="max-h-[55vh]">
            <div className="space-y-4 px-6 py-0">
              {noData ? (
                <div className="flex w-full flex-col items-center justify-center py-4">
                  <div className="mb-2 flex h-16 w-16 items-center justify-center">
                    <Inbox
                      size={48}
                      className="mx-auto text-neutral-400 dark:text-neutral-500"
                    />
                  </div>
                  <h3 className="mb-1 text-lg font-semibold text-neutral-800 dark:text-neutral-100">
                    Tidak ada data
                  </h3>
                  <p className="mt-1 text-center text-sm text-neutral-600 dark:text-neutral-400">
                    Tidak ada barang inventaris tersedia.
                  </p>
                </div>
              ) : (
                <>
                  {displayItems && displayItems.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Pilih Barang Inventaris
                      </label>
                      {(() => {
                        const count = displayItems.length;
                        if (count === 1) {
                          const s = displayItems[0];
                          const active = selectedAsset?.id === s.id;
                          return (
                            <div className="mt-4">
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                  if (
                                    typeof s.available === 'number' &&
                                    s.available === 0
                                  )
                                    return;
                                  setSelectedAsset(s);
                                  setName(s.name || '');
                                  form.setValue('name', s.name || '');
                                  setTimeout(
                                    () =>
                                      formRef.current?.scrollIntoView({
                                        behavior: 'smooth',
                                        block: 'start',
                                      }),
                                    50
                                  );
                                }}
                                disabled={
                                  typeof s.available === 'number' &&
                                  s.available === 0
                                }
                                aria-disabled={
                                  typeof s.available === 'number' &&
                                  s.available === 0
                                }
                                className={`mx-auto flex w-full max-w-[454px] flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white text-left shadow-sm transition-colors duration-150 hover:shadow-md focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 ${
                                  active
                                    ? 'ring-2 ring-black ring-offset-4 ring-offset-white dark:ring-offset-neutral-900'
                                    : ''
                                }`}
                              >
                                <div className="relative h-64 w-full bg-neutral-100 dark:bg-neutral-800">
                                  {s.image ? (
                                    <Image
                                      src={s.image!}
                                      alt={s.name || ''}
                                      fill
                                      className="object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-neutral-400">
                                      No Image
                                    </div>
                                  )}
                                  {s.image &&
                                    !(
                                      typeof s.available === 'number' &&
                                      s.available === 0
                                    ) && (
                                      <div
                                        className="absolute inset-0 flex cursor-zoom-in items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100"
                                        onClick={e => {
                                          e.stopPropagation();
                                          setPreviewAsset(s);
                                          setOpenPreview(true);
                                        }}
                                      >
                                        <ZoomIn
                                          size={28}
                                          className="text-white"
                                        />
                                      </div>
                                    )}
                                </div>
                                <div
                                  className={`overflow-hidden p-4 ${
                                    typeof s.available === 'number' &&
                                    s.available === 0
                                      ? ''
                                      : 'cursor-pointer'
                                  }`}
                                >
                                  <div>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <p className="mb-1 line-clamp-2 text-base leading-normal font-semibold text-neutral-900 dark:text-neutral-100">
                                          {s.name}
                                        </p>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">
                                        {s.name}
                                      </TooltipContent>
                                    </Tooltip>
                                    {!isPermintaan && (
                                      <div className="mt-2 flex items-center justify-start">
                                        <Badge
                                          variant={
                                            typeof s.available === 'number' &&
                                            s.available > 0
                                              ? 'default'
                                              : 'outline'
                                          }
                                          className={
                                            typeof s.available === 'number' &&
                                            s.available === 0
                                              ? 'bg-black text-white dark:bg-white dark:text-black'
                                              : ''
                                          }
                                        >
                                          Tersedia:{' '}
                                          {typeof s.available === 'number'
                                            ? s.available
                                            : 0}
                                        </Badge>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </button>
                            </div>
                          );
                        }

                        return (
                          <div className="mt-4 grid grid-cols-2 gap-4">
                            {displayItems.map(s => {
                              const active = selectedAsset?.id === s.id;
                              return (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => {
                                    if (
                                      typeof s.available === 'number' &&
                                      s.available === 0
                                    )
                                      return;
                                    setSelectedAsset(s);
                                    setName(s.name || '');
                                    form.setValue('name', s.name || '');
                                    setTimeout(
                                      () =>
                                        formRef.current?.scrollIntoView({
                                          behavior: 'smooth',
                                          block: 'start',
                                        }),
                                      50
                                    );
                                  }}
                                  disabled={
                                    typeof s.available === 'number' &&
                                    s.available === 0
                                  }
                                  aria-disabled={
                                    typeof s.available === 'number' &&
                                    s.available === 0
                                  }
                                  className={`relative mt-0 w-full overflow-hidden rounded-lg border border-neutral-200 bg-white text-left shadow-sm transition-colors duration-150 hover:shadow-md focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 ${
                                    active
                                      ? 'ring-2 ring-black ring-offset-4 ring-offset-white dark:ring-offset-neutral-900'
                                      : ''
                                  }`}
                                >
                                  <div className="relative h-44 w-full bg-neutral-100 dark:bg-neutral-800">
                                    {s.image ? (
                                      <Image
                                        src={s.image!}
                                        alt={s.name || ''}
                                        fill
                                        className="object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center text-neutral-400">
                                        No Image
                                      </div>
                                    )}
                                    {s.image &&
                                      !(
                                        typeof s.available === 'number' &&
                                        s.available === 0
                                      ) && (
                                        <div
                                          className="absolute inset-0 flex cursor-zoom-in items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100"
                                          onClick={e => {
                                            e.stopPropagation();
                                            setPreviewAsset(s);
                                            setOpenPreview(true);
                                          }}
                                        >
                                          <ZoomIn
                                            size={28}
                                            className="text-white"
                                          />
                                        </div>
                                      )}
                                  </div>
                                  <div
                                    className={`overflow-hidden p-4 ${
                                      typeof s.available === 'number' &&
                                      s.available === 0
                                        ? ''
                                        : 'cursor-pointer'
                                    }`}
                                  >
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <p className="mb-1 line-clamp-2 text-sm leading-normal font-semibold text-neutral-900 dark:text-neutral-100">
                                          {s.name}
                                        </p>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">
                                        {s.name}
                                      </TooltipContent>
                                    </Tooltip>
                                    {!isPermintaan && (
                                      <div className="mt-2">
                                        <Badge
                                          variant={
                                            typeof s.available === 'number' &&
                                            s.available > 0
                                              ? 'default'
                                              : 'outline'
                                          }
                                          className={
                                            typeof s.available === 'number' &&
                                            s.available === 0
                                              ? 'bg-black text-white dark:bg-white dark:text-black'
                                              : ''
                                          }
                                        >
                                          Tersedia:{' '}
                                          {typeof s.available === 'number'
                                            ? s.available
                                            : 0}
                                        </Badge>
                                      </div>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {(!displayItems || displayItems.length === 0) && (
                    <div className="py-4">
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {loadingAssets
                          ? 'Memuat barang...'
                          : fetchError
                            ? `Gagal memuat: ${fetchError}`
                            : 'Tidak ada barang tersedia.'}
                      </p>
                    </div>
                  )}

                  <Form {...form}>
                    <div ref={formRef}>
                      <FormField
                        control={form.control}
                        name="name"
                        rules={{ required: 'Nama barang wajib diisi' }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="gap-0">
                              <span className="mr-1 text-red-500">*</span>Nama
                              Barang Inventaris
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Nama Barang Inventaris"
                                readOnly={!!selectedAsset}
                                className={
                                  'bg-white text-neutral-900 placeholder:text-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500 ' +
                                  (selectedAsset ? 'cursor-not-allowed' : '')
                                }
                                onChange={e => {
                                  field.onChange(e);
                                  setName(e.target.value);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="qty"
                      rules={{
                        required: 'Qty wajib diisi',
                        validate: v => {
                          const num = Number(v);
                          if (!(num > 0)) return 'Qty harus lebih dari 0';

                          if (isPermintaan) return true;
                          const avail =
                            typeof selectedAsset?.available === 'number'
                              ? selectedAsset!.available
                              : undefined;
                          if (typeof avail === 'number' && num > avail)
                            return `Qty tidak boleh lebih dari ${avail}`;
                          return true;
                        },
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="gap-0">
                            <span className="mr-1 text-red-500">*</span>Qty
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              placeholder="Qty"
                              min={1}
                              max={
                                isPermintaan
                                  ? undefined
                                  : typeof selectedAsset?.available === 'number'
                                    ? selectedAsset.available
                                    : undefined
                              }
                              step={1}
                              className="bg-white text-neutral-900 placeholder:text-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500"
                              onChange={e => {
                                const raw = e.target.value;

                                if (raw === '') {
                                  field.onChange(raw);
                                  setQty(raw);
                                  return;
                                }
                                const num = Number(raw);
                                if (Number.isNaN(num)) {
                                  return;
                                }
                                const avail =
                                  typeof selectedAsset?.available === 'number'
                                    ? selectedAsset.available
                                    : undefined;
                                let clamped = num;
                                if (clamped < 1) clamped = 1;

                                if (
                                  !isPermintaan &&
                                  typeof avail === 'number' &&
                                  clamped > avail
                                )
                                  clamped = avail;
                                const out = String(clamped);

                                field.onChange(out);
                                setQty(out);
                              }}
                              onBlur={e => {
                                const raw = e.target.value;
                                if (raw === '') {
                                  const avail =
                                    typeof selectedAsset?.available === 'number'
                                      ? selectedAsset.available
                                      : undefined;
                                  const defaultVal =
                                    typeof avail === 'number' && avail < 1
                                      ? String(avail)
                                      : '1';
                                  field.onChange(defaultVal);
                                  setQty(defaultVal);
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Catatan (Opsional)</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Catatan"
                              className="min-h-[80px] bg-white text-neutral-900 placeholder:text-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500"
                              onChange={e => {
                                field.onChange(e);
                                setNotes(e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </Form>
                </>
              )}
            </div>
          </ScrollArea>

          {!noData && (
            <div className="sticky bottom-0 z-10 border-neutral-200 bg-white px-6 pt-4 pb-4 dark:border-neutral-700 dark:bg-neutral-900">
              <Button
                className="w-full cursor-pointer rounded-sm bg-[#01793b] bg-black text-white transition-colors hover:bg-[#016c33] dark:bg-[##01793b] dark:text-white dark:hover:bg-[#043014]"
                onClick={() => handleSubmit()}
                disabled={submitting}
              >
                <CirclePlus />
                Tambahkan
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={openPreview}
        onOpenChange={v => {
          setOpenPreview(v);
          if (!v) setPreviewAsset(null);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-w-4xl overflow-hidden rounded-sm border-none bg-transparent p-0"
        >
          <VisuallyHidden>
            <DialogTitle>Preview Image</DialogTitle>
          </VisuallyHidden>

          <div className="relative h-[80vh] w-full">
            {(previewAsset?.image ||
              selectedAsset?.image ||
              (item as UIAsset).image) && (
              <Image
                src={
                  (previewAsset?.image ??
                    selectedAsset?.image ??
                    (item as UIAsset).image) ||
                  ''
                }
                alt={(previewAsset?.name ?? selectedAsset?.name) || 'Preview'}
                fill
                className="cursor-zoom-out object-contain"
                onClick={() => {
                  setOpenPreview(false);
                  setPreviewAsset(null);
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
