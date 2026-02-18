'use client';

import { ChangeEvent, useEffect, useState } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { CirclePlus, ZoomIn } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

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
import { createProductCart, getProdukById } from '@/lib/api/user';
import { resolveAssetImage } from '@/lib/images';
import type { ProdukDetail } from '@/types/add-office-supplies';

type Props = {
  open: boolean;
  onClose: () => void;
  produkId: string | null;
  onSubmit: (data: {
    id: string;
    name: string;
    qty: number;
    notes: string;
    unit: string;
    photo?: string;
  }) => void;
};

export default function AddOfficeSupplyModal({
  open,
  onClose,
  produkId,
  onSubmit,
}: Props) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [produk, setProduk] = useState<ProdukDetail | null>(null);
  const [unit, setUnit] = useState<string>('');

  const [openUnitPicker, setOpenUnitPicker] = useState(false);
  const [unitSearch, setUnitSearch] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<string | undefined>(
    undefined
  );
  const { data: session } = useSession();

  useEffect(() => {
    if (openUnitPicker) {
      setSelectedUnit(unit || undefined);
    }
  }, [openUnitPicker, unit]);
  const [openPreview, setOpenPreview] = useState(false);
  const [units, setUnits] = useState<string[]>([]);

  const form = useForm<{
    name: string;
    qty: string;
    notes: string;
    unit: string;
  }>({
    defaultValues: { name: '', qty: '', notes: '', unit: '' },
    mode: 'onTouched',
  });

  useEffect(() => {
    form.reset({
      name: produk?.nama ?? '',
      qty: form.getValues().qty || '',
      notes: '',
      unit: unit || '',
    });
  }, [produk, unit, form]);

  const router = useRouter();

  useEffect(() => {
    if (!open || !produkId) return;

    const fetchProduk = async () => {
      try {
        setLoading(true);
        const json = await getProdukById(produkId!);
        const data: ProdukDetail | null = (json?.data ??
          null) as ProdukDetail | null;

        setProduk(data);
        setName(data?.nama ?? '');

        const apiUnits = data?.produksatuan?.map(u => u.satuan_nama) ?? [];
        setUnits(apiUnits);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduk();
  }, [open, produkId]);

  const handleSubmit = async () => {
    if (!produk) return;

    const values = form.getValues();
    const isValid = await form.trigger();
    if (!values.unit) {
      form.setError('unit', { message: 'Satuan harus dipilih' });
    }
    if (!isValid || !values.unit) return;
    const parsedQty = Number(values.qty);

    const selectedSatuan = produk.produksatuan?.find(
      s => s.satuan_nama === unit
    );

    if (!selectedSatuan) {
      form.setError('unit', { message: 'Satuan tidak ditemukan' });
      return;
    }

    try {
      setLoading(true);

      const payload = {
        kategori_id: produk.kategori_id,
        kompilator_id: produk.kompilator_id,
        no_badge: session?.user?.id || '',
        nama: produk.nama,
        pic: produk.gambarproduk?.[0]?.gambar ?? '',
        qty: parsedQty,
        satuan_id: Number(selectedSatuan.satuan_id),
        satuan_nama: selectedSatuan.satuan_nama,
        produk_id: selectedSatuan.produk_id,
        catatan: values.notes || '',
      };

      await createProductCart(payload);

      toast.success('Barang berhasil ditambahkan ke keranjang');

      try {
        onSubmit({
          id: produk.id,
          name: produk.nama,
          qty: parsedQty,
          notes: values.notes || '',
          unit,
          photo: produk.gambarproduk?.[0]?.gambar,
        });
      } catch (e) {
        console.warn('onSubmit handler error:', e);
      }

      onClose();
      router.refresh();
    } catch (err) {
      console.error('POST keranjang error:', err);
      toast.error('Gagal menambahkan barang');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const imageUrl = resolveAssetImage(
    produk?.gambarproduk?.[0]?.gambar,
    'office'
  );

  const safeImage = imageUrl ?? '/images/no-image.png';

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="my-4 w-[90%] overflow-hidden rounded-sm border border-neutral-200 bg-white p-0 shadow-xl sm:my-2 sm:max-w-md md:max-w-lg dark:border-neutral-700 dark:bg-neutral-900 [&_button[data-slot='dialog-close']]:top-5">
          <div className="sticky top-0 border-neutral-200 bg-white px-6 pt-4 dark:border-neutral-700 dark:bg-neutral-900">
            <DialogHeader>
              <DialogTitle className="text-lg">Tambahkan Barang</DialogTitle>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Berikut detail barang yang anda akan Minta
              </p>
            </DialogHeader>
          </div>

          <ScrollArea className="max-h-[55vh] overflow-hidden rounded-sm">
            <div className="space-y-4 px-6 pt-2 pb-0">
              <div
                className="group relative h-44 w-full cursor-zoom-in overflow-hidden rounded-sm border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
                onClick={() => setOpenPreview(true)}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') setOpenPreview(true);
                }}
              >
                {imageUrl ? (
                  <>
                    <Image
                      src={safeImage}
                      alt={name}
                      fill
                      unoptimized
                      className="object-cover"
                    />

                    <div
                      className="absolute inset-0 flex cursor-zoom-in items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100"
                      onClick={e => {
                        e.stopPropagation();
                        setOpenPreview(true);
                      }}
                    >
                      <ZoomIn size={28} className="text-white" />
                    </div>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center text-neutral-400">
                    No Image
                  </div>
                )}
              </div>

              <Dialog open={openPreview} onOpenChange={setOpenPreview}>
                <DialogContent className="max-w-4xl border-none bg-transparent p-0 [&>button]:hidden">
                  <DialogHeader>
                    <VisuallyHidden>
                      <DialogTitle className="sr-only">
                        Preview of {name}
                      </DialogTitle>
                    </VisuallyHidden>
                  </DialogHeader>

                  <div className="relative h-[80vh] w-full">
                    <Image
                      src={safeImage}
                      alt={name}
                      fill
                      className="cursor-zoom-out object-contain"
                      onClick={() => setOpenPreview(false)}
                    />
                  </div>
                </DialogContent>
              </Dialog>

              <div className="space-y-3">
                <Form {...form}>
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      form.handleSubmit(handleSubmit)();
                    }}
                    className="space-y-3"
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Barang</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              readOnly
                              placeholder="Nama Barang"
                              className="dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 items-end gap-3">
                      <div className="col-span-1">
                        <label className="text-sm font-medium dark:text-neutral-300">
                          {' '}
                          <span className="mr-1 text-red-500">*</span>Satuan
                          Barang
                        </label>
                        <div className="relative">
                          <Input
                            readOnly
                            value={unit || ''}
                            onClick={() => {
                              setUnitSearch('');
                              setSelectedUnit(unit || undefined);
                              setOpenUnitPicker(true);
                            }}
                            placeholder="Pilih Satuan"
                            className="cursor-pointer pr-9 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                          />

                          <input
                            type="hidden"
                            {...form.register('unit', {
                              required: 'Satuan harus dipilih',
                            })}
                          />
                          {form.formState.errors.unit && (
                            <p className="mt-1 text-xs text-red-500">
                              {form.formState.errors.unit?.message as string}
                            </p>
                          )}
                        </div>
                        <Dialog
                          open={openUnitPicker}
                          onOpenChange={setOpenUnitPicker}
                        >
                          <DialogContent className="w-[92%] max-w-sm overflow-hidden rounded-sm border border-neutral-200 bg-white p-0 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
                            <div className="border-b border-neutral-200 px-3 py-3 dark:border-neutral-700">
                              <DialogTitle className="text-base font-semibold">
                                Pilih Satuan
                              </DialogTitle>
                              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                Pilih satuan barang
                              </p>
                            </div>

                            <div className="max-h-80 space-y-2 overflow-y-auto px-3 py-2">
                              <Input
                                placeholder="Search Satuan..."
                                value={unitSearch}
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                  setUnitSearch(e.target.value)
                                }
                                className="h-9 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                              />

                              <div className="mt-1 space-y-2">
                                {units
                                  .filter(u =>
                                    u
                                      .toLowerCase()
                                      .includes(unitSearch.toLowerCase())
                                  )
                                  .map(u => {
                                    const active = selectedUnit === u;
                                    return (
                                      <Button
                                        key={u}
                                        variant="ghost"
                                        onClick={() => setSelectedUnit(u)}
                                        className={`flex w-full cursor-pointer items-center justify-between rounded-sm border px-3 py-2 transition-all ${
                                          active
                                            ? 'border-neutral-300 bg-neutral-900/5 dark:bg-neutral-800'
                                            : 'border-neutral-200 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800'
                                        }`}
                                      >
                                        <span className="text-sm">{u}</span>

                                        <div
                                          className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
                                            active
                                              ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                                              : 'border-neutral-300 dark:border-neutral-600'
                                          }`}
                                        >
                                          {active && (
                                            <svg
                                              width="12"
                                              height="12"
                                              viewBox="0 0 24 24"
                                              stroke="currentColor"
                                              strokeWidth="3"
                                              fill="none"
                                            >
                                              <path d="M5 13l4 4L19 7" />
                                            </svg>
                                          )}
                                        </div>
                                      </Button>
                                    );
                                  })}
                              </div>
                            </div>

                            <div className="border-t border-neutral-200 bg-white px-3 py-3 dark:border-neutral-700 dark:bg-neutral-900">
                              <Button
                                className="w-full cursor-pointer rounded-sm bg-black text-white dark:bg-white dark:text-black"
                                onClick={() => {
                                  if (selectedUnit) {
                                    setUnit(selectedUnit);
                                    form.setValue('unit', selectedUnit);
                                    form.clearErrors('unit');
                                  }
                                  setOpenUnitPicker(false);
                                }}
                              >
                                Pilih
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>

                      <div className="col-span-2">
                        <Controller
                          control={form.control}
                          name="qty"
                          rules={{
                            required: 'Qty harus lebih besar dari 0',
                            validate: v =>
                              Number(v) > 0 || 'Qty harus lebih besar dari 0',
                          }}
                          render={({ field, fieldState }) => (
                            <div>
                              <label className="text-sm font-medium dark:text-neutral-300">
                                <span className="mr-1 text-red-500">*</span>Qty
                              </label>
                              <Input
                                {...field}
                                type="number"
                                min={1}
                                onChange={(
                                  e: ChangeEvent<HTMLInputElement>
                                ) => {
                                  const v = e.target.value;
                                  if (v === '') {
                                    field.onChange('');
                                    return;
                                  }
                                  const n = Number(v);
                                  if (!Number.isFinite(n) || isNaN(n)) {
                                    field.onChange('');
                                    return;
                                  }
                                  field.onChange(String(n));
                                }}
                                placeholder="Qty"
                                className="dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                              />
                              {fieldState.error && (
                                <p className="mt-1 text-xs text-red-500">
                                  {fieldState.error.message}
                                </p>
                              )}
                            </div>
                          )}
                        />
                      </div>
                    </div>

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
                              className="mb-4 min-h-[80px] dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </div>
            </div>
          </ScrollArea>

          <div className="opt-0 sticky bottom-0 z-10 bg-white px-6 pb-3 dark:border-neutral-700 dark:bg-neutral-900">
            <Button
              className="w-full cursor-pointer rounded-sm bg-[#01793b] bg-black text-white hover:bg-[#016c33] dark:bg-[##01793b] dark:text-white dark:hover:bg-[#043014]"
              onClick={handleSubmit}
              disabled={loading}
            >
              <CirclePlus className="mr-2 h-4 w-4" />
              {loading ? 'Menyimpan...' : 'Tambahkan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
