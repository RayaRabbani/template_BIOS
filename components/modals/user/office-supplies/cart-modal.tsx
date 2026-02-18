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
  }, [setCart]);

  useEffect(() => {
    if (!open) return;
    fetchCart();
  }, [open, fetchCart]);

  const [deletingIds, setDeletingIds] = useState<number[]>([]);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (typeof id !== 'number') return;
    setDeletingIds(s => [...s, id]);
    try {
      await deleteProductCart(id);
      setCart(prev => prev.filter(c => c.id !== id));
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
            'max-w-3xl rounded-sm border bg-white shadow-xl dark:bg-neutral-900',
            'transition-all',
            "transition-all [&_button[data-slot='dialog-close']]:top-6"
          )}
        >
          <DialogHeader className="-mt-2">
            <DialogTitle className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              Detail Permintaan
            </DialogTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {' '}
              Berikut detail permintaan barang office supplies anda.
            </p>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] overflow-hidden rounded-sm">
            <div className="mt-2 space-y-4">
              {items.length === 0 && (
                <p className="py-6 text-center text-gray-500 dark:text-gray-400">
                  Belum ada barang dalam keranjang
                </p>
              )}

              {items.map((item: CartItem) => (
                <div
                  key={item.id as number}
                  className={cn(
                    'flex w-full items-center justify-between rounded-sm p-4',
                    'border border-neutral-200 bg-gray-50 dark:border-neutral-700 dark:bg-neutral-800',
                    'transition-all hover:shadow-md'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-16 w-16 cursor-zoom-in items-center justify-center overflow-hidden rounded-sm bg-gray-100 dark:bg-neutral-700"
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
                          width={64}
                          height={64}
                          alt={String(item.name)}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-neutral-400 dark:text-neutral-500">
                          No Image
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-base font-medium text-neutral-900 dark:text-neutral-100">
                        {String(item.name)}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Jumlah: {String(item.qty)}
                        {item.satuan_nama ? ` ${String(item.satuan_nama)}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 dark:border-neutral-600 dark:bg-neutral-700">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => decreaseQty(item.id as number)}
                        disabled={Number(item.qty) <= 1}
                        className={cn(
                          'h-5 w-5 rounded-full',
                          Number(item.qty) <= 1
                            ? 'cursor-not-allowed opacity-50'
                            : 'cursor-pointer hover:bg-gray-200 dark:hover:bg-neutral-600'
                        )}
                      >
                        <Minus
                          size={16}
                          className="text-neutral-700 dark:text-neutral-200"
                        />
                      </Button>
                      <span className="text-sm text-neutral-800 dark:text-neutral-100">
                        {String(item.qty)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => increaseQty(item.id as number)}
                        className="h-5 w-5 cursor-pointer rounded-full hover:bg-gray-200 dark:hover:bg-neutral-600"
                      >
                        <Plus
                          size={16}
                          className="text-neutral-700 dark:text-neutral-200"
                        />
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
                      className="h-9 w-9 cursor-pointer rounded-full bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50"
                    >
                      <Trash
                        size={16}
                        className="text-red-600 dark:text-red-300"
                      />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {items.length > 0 && (
            <div className="mt-3 flex justify-end">
              <Button
                className="flex cursor-pointer items-center gap-2 rounded-sm bg-[#01793b] px-6 py-2 text-white transition hover:bg-[#016c33] dark:bg-[##01793b] dark:text-white dark:hover:bg-[#043014]"
                onClick={() => setOpenConfirm(true)}
              >
                <ClipboardCopy className="h-4 w-4" />
                Permintaan
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={openSaveConfirm} onOpenChange={setOpenSaveConfirm}>
        <AlertDialogContent className="max-w-sm rounded-sm bg-white p-4 dark:bg-neutral-900">
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
        <AlertDialogContent className="max-w-sm rounded-sm bg-white p-4 dark:bg-neutral-900">
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
