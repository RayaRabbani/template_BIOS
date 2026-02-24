'use client';

import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';

import Image from 'next/image';

import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { ClipboardCopy, Minus, Plus, Trash } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
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
import {
  deleteProductCart,
  getOfficeCart,
  updateCartItemConsumable,
} from '@/lib/api/user';
import { resolveAssetImage } from '@/lib/images';
import { cn } from '@/lib/utils';
import { CartItem } from '@/types/cart';
import type { ApiCartItem } from '@/types/user/office-supplies/modals';

import ConfirmModal from './confirm-modal';

type Props = {
  open: boolean;
  setOpen: (value: boolean) => void;
  cart: CartItem[];
  setCart: Dispatch<SetStateAction<CartItem[]>>;
  onEdit?: (item: CartItem) => void;
  type?: 'permintaan';
  source?: string;
  onRefresh?: () => Promise<void>;
};

export default function OfficeCartModal({
  open,
  setOpen,
  cart,
  setCart,
  type = 'permintaan',
  source = 'office',
  onRefresh,
}: Props) {
  const { data: session } = useSession();
  const NO_BADGE = session?.user?.id || '';

  const [openPreview, setOpenPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | undefined | null>(
    null
  );
  const [openConfirm, setOpenConfirm] = useState(false);
  const [originalItems, setOriginalItems] = useState<CartItem[] | null>(null);
  const [openSaveConfirm, setOpenSaveConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const items = cart as CartItem[];

  const fetchCart = useCallback(async () => {
    if (!NO_BADGE) return;
    try {
      const json = await getOfficeCart(NO_BADGE);
      const data = json?.data;

      if (Array.isArray(data)) {
        const mapped: CartItem[] = (data as ApiCartItem[]).map((it, idx) => {
          const id = Number(it.id ?? it.produk_id ?? idx);
          const name = it.nama ?? it.produk?.nama ?? '';
          const qty = Number(it.qty ?? 1) || 1;

          let image: string | undefined;
          const gambar =
            it.pic ??
            it.gambar ??
            it.gambarproduk?.[0]?.gambar ??
            it.produk?.pic ??
            it.produk?.gambarproduk?.[0]?.gambar;
          if (gambar) {
            const resolved = resolveAssetImage(gambar, 'office');
            if (resolved) image = resolved;
          }

          return {
            id,
            name,
            qty,
            image,
            photo: it.pic,
            note: it.catatan ?? undefined,
            satuan_nama: it.satuan_nama ?? undefined,
          } as CartItem;
        });

        setCart(mapped);
        setOriginalItems(mapped.map(it => ({ ...it })));
      }
    } catch (err: unknown) {
      console.error('Failed to fetch office cart:', err);
    }
  }, [setCart, NO_BADGE]);

  useEffect(() => {
    if (!open) return;
    fetchCart();
  }, [open, fetchCart]);

  // prefetch cart item images to warm browser cache
  useEffect(() => {
    if (!items || items.length === 0) return;
    const imgs: HTMLImageElement[] = [];
    items.forEach(it => {
      const src = typeof it.image === 'string' ? it.image : undefined;
      if (!src) return;
      try {
        const img = typeof window !== 'undefined' ? new window.Image() : null;
        if (img) {
          img.src = src;
          imgs.push(img);
        }
      } catch {
        // ignore
      }
    });

    return () => {
      imgs.forEach(i => {
        try {
          i.src = '';
        } catch {}
      });
    };
  }, [items]);

  const [deletingIds, setDeletingIds] = useState<number[]>([]);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (typeof id !== 'number') return;
    setDeletingIds(s => [...s, id]);
    try {
      await deleteProductCart(id);
      try {
        await fetchCart();
      } catch (err) {
        console.error('Failed to refresh cart after delete:', err);
      }

      if (typeof onRefresh === 'function') {
        try {
          await onRefresh();
        } catch (err) {
          console.error('onRefresh failed after delete:', err);
        }
      }

      toast.success('Barang dihapus dari keranjang');
    } catch (err: unknown) {
      console.error('Failed to delete cart item:', err);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error('Gagal menghapus barang: ' + msg);
    } finally {
      setDeletingIds(s => s.filter(i => i !== id));
    }
  };

  const increaseQty = (id: number) => {
    setCart(
      items.map(c => (c.id === id ? { ...c, qty: (c.qty as number) + 1 } : c))
    );
    setOpenSaveConfirm(true);
  };

  const decreaseQty = (id: number) => {
    setCart(
      items.map(c =>
        c.id === id && (c.qty as number) > 1
          ? { ...c, qty: (c.qty as number) - 1 }
          : c
      )
    );
    setOpenSaveConfirm(true);
  };

  const saveChanges = async () => {
    if (!originalItems) return;
    setSaving(true);
    try {
      const updates = items.filter(it => {
        const orig = originalItems.find(o => o.id === it.id);
        return orig && Number(orig.qty) !== Number(it.qty);
      });

      for (const u of updates) {
        try {
          await updateCartItemConsumable(
            u.id as string | number,
            Number(u.qty),
            {}
          );
        } catch (err) {
          console.error('Failed to update consumable cart item:', err);
          throw err;
        }
      }

      setOriginalItems(items.map(it => ({ ...it })));
      toast.success('Perubahan keranjang disimpan');
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error('Gagal menyimpan perubahan: ' + msg);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = () => {
    setOpenConfirm(false);
    setOpen(false);
    setCart([]);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={v => setOpen(v)}>
        <DialogContent
          className={cn(
            'rounded-md border border-neutral-200 bg-white p-4 shadow-xl sm:p-6 dark:border-neutral-800 dark:bg-neutral-900',
            'transition-all'
          )}
          style={{ maxWidth: '54rem' }}
        >
          <DialogHeader className="-mt-2 space-y-1">
            <DialogTitle className="text-lg font-bold tracking-tight text-neutral-900 sm:text-xl dark:text-neutral-100">
              Detail Permintaan
            </DialogTitle>
            <p className="text-xs font-medium text-neutral-500 sm:text-sm dark:text-neutral-400">
              Berikut detail permintaan barang office supplies anda.
            </p>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] overflow-hidden rounded-md">
            <div className="mt-2 space-y-4">
              {items.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center text-neutral-500 sm:py-12">
                  <div className="mb-3 rounded-full bg-neutral-100 p-3 dark:bg-neutral-800">
                    <ClipboardCopy size={35} className="opacity-40" />
                  </div>
                  <p className="text-sm">Belum ada barang dalam keranjang</p>
                </div>
              )}

              {items.map((item: CartItem) => (
                <div
                  key={item.id as number}
                  className={cn(
                    'group relative flex w-full flex-col items-start justify-between rounded-md border border-neutral-200 bg-white p-3 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md sm:flex-row sm:items-center dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-emerald-900'
                  )}
                >
                  <div className="flex w-full items-start gap-3 sm:gap-4">
                    <div
                      className="relative h-16 w-16 flex-shrink-0 cursor-zoom-in overflow-hidden rounded-md border border-neutral-100 bg-neutral-50 sm:h-20 sm:w-20 dark:border-neutral-800 dark:bg-neutral-800"
                      onClick={() => {
                        setPreviewImage(
                          typeof item.image === 'string' ? item.image : null
                        );
                        setOpenPreview(true);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setPreviewImage(
                            typeof item.image === 'string' ? item.image : null
                          );
                          setOpenPreview(true);
                        }
                      }}
                    >
                      {typeof item.image === 'string' ? (
                        <Image
                          src={item.image as string}
                          width={80}
                          height={80}
                          alt={String(item.name)}
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-neutral-400 dark:text-neutral-500">
                          No Image
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 pt-0.5">
                      <h4 className="line-clamp-2 text-sm leading-tight font-semibold text-neutral-900 sm:text-base dark:text-neutral-100">
                        {String(item.name)}
                      </h4>
                      <div className="mt-1.5 flex items-center gap-2 sm:mt-2">
                        <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600 sm:px-2.5 sm:py-1 sm:text-xs dark:bg-neutral-800 dark:text-neutral-400">
                          Jumlah: {String(item.qty)}
                          {item.satuan_nama
                            ? ` ${String(item.satuan_nama)}`
                            : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex w-full items-center justify-between border-t border-neutral-50 pt-3 sm:mt-0 sm:w-auto sm:gap-4 sm:border-t-0 sm:pt-0 sm:pr-2 dark:border-neutral-800">
                    <div className="flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2 py-1 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => decreaseQty(item.id as number)}
                        disabled={Number(item.qty) <= 1}
                        className={cn(
                          'h-7 w-7 rounded-full transition-colors hover:bg-neutral-100 sm:h-8 sm:w-8 dark:hover:bg-neutral-700',
                          Number(item.qty) <= 1
                            ? 'cursor-not-allowed opacity-30'
                            : 'cursor-pointer'
                        )}
                      >
                        <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                      <span className="min-w-[1.2rem] text-center text-xs font-semibold text-neutral-900 tabular-nums sm:min-w-[1.5rem] sm:text-sm dark:text-neutral-100">
                        {String(item.qty)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => increaseQty(item.id as number)}
                        className="h-7 w-7 cursor-pointer rounded-full transition-colors hover:bg-neutral-100 sm:h-8 sm:w-8 dark:hover:bg-neutral-700"
                      >
                        <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setDeleteTargetId(item.id as number);
                        setOpenDeleteConfirm(true);
                      }}
                      disabled={deletingIds.includes(item.id as number)}
                      className="h-8 w-8 cursor-pointer rounded-full bg-red-50 text-red-600 transition-colors hover:bg-red-100 hover:text-red-700 sm:h-9 sm:w-9 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                    >
                      <Trash className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {items.length > 0 && (
            <div className="mt-3 flex justify-end">
              <Button
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-[#01793b] px-6 py-2 font-medium text-white shadow-sm transition-all hover:bg-[#016c33] hover:shadow-md sm:w-auto dark:bg-[#01793b] dark:text-white dark:hover:bg-[#043014]"
                onClick={() => setOpenConfirm(true)}
              >
                <ClipboardCopy className="h-4 w-4" />
                <span>Permintaan</span>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* </Dialog> */}

      <AlertDialog open={openSaveConfirm} onOpenChange={setOpenSaveConfirm}>
        <AlertDialogContent className="max-w-sm rounded-md bg-white p-4 dark:bg-neutral-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold">
              Perubahan belum disimpan
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Anda mengedit barang pada detail permintaan, apakah anda yakin
              dengan perubahan tersebut?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="mt-4 flex justify-end gap-3">
            <AlertDialogCancel asChild>
              <Button
                className="cursor-pointer"
                variant="ghost"
                onClick={() => {
                  setOpenSaveConfirm(false);
                  if (originalItems)
                    setCart(originalItems.map(it => ({ ...it })));
                }}
              >
                Tidak
              </Button>
            </AlertDialogCancel>

            <AlertDialogAction asChild>
              <Button
                className="cursor-pointer bg-black text-white hover:bg-neutral-800"
                onClick={async () => {
                  try {
                    await saveChanges();
                  } finally {
                    setOpenSaveConfirm(false);
                    try {
                      await fetchCart();
                    } catch (err) {
                      console.error(
                        'Failed to refresh cart after save attempt:',
                        err
                      );
                    }
                  }
                }}
                disabled={saving}
              >
                {saving ? 'Menyimpan...' : 'Ya'}
              </Button>
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={openDeleteConfirm} onOpenChange={setOpenDeleteConfirm}>
        <AlertDialogContent className="max-w-sm rounded-md bg-white p-4 dark:bg-neutral-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold">
              Hapus item dari keranjang?
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Anda yakin ingin menghapus item ini dari keranjang? Tindakan ini
              tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="mt-4 flex justify-end gap-3">
            <AlertDialogCancel asChild>
              <Button
                className="cursor-pointer"
                variant="ghost"
                onClick={() => {
                  setOpenDeleteConfirm(false);
                  setDeleteTargetId(null);
                }}
              >
                Batal
              </Button>
            </AlertDialogCancel>

            <AlertDialogAction asChild>
              <Button
                className="cursor-pointer bg-red-600 text-white hover:bg-red-700"
                onClick={async () => {
                  if (deleteTargetId != null) {
                    await handleDelete(deleteTargetId);
                  }
                  setOpenDeleteConfirm(false);
                  setDeleteTargetId(null);
                }}
                disabled={
                  deleteTargetId != null && deletingIds.includes(deleteTargetId)
                }
              >
                Hapus
              </Button>
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <ConfirmModal
        open={openConfirm}
        setOpen={setOpenConfirm}
        type={type}
        source={source}
        onSubmit={handleSubmit}
        onRefresh={onRefresh}
      />

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
                priority
                className="cursor-zoom-out object-contain"
                onClick={() => setOpenPreview(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
