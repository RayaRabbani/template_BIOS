'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Inbox } from 'lucide-react';
import { useSession } from 'next-auth/react';

import AssetCard from '@/components/asset-card';
import CartModal from '@/components/modals/user/office-supplies/cart-modal';
import Navbar from '@/components/navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getOfficeCart, getProdukAvailable } from '@/lib/api/user';
import { resolveAssetImage } from '@/lib/images';
import { mapProdukToAsset } from '@/lib/produk';
import { Asset } from '@/types/asset';
import { CartItem } from '@/types/cart';
import { ProdukApi } from '@/types/produk';
import type { ApiCartItem } from '@/types/user/office-supplies/permintaan';

export default function PermintaanOfficePage() {
  const { data: session } = useSession();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [serverCartCount, setServerCartCount] = useState<number | null>(null);
  const [openCart, setOpenCart] = useState(false);
  const [search, setSearch] = useState('');

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const searchTimer = useRef<number | null>(null);

  const fetchProdukData = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const json = await getProdukAvailable(q);
      const data = (json?.data as ProdukApi[]) || [];
      setAssets(data.map(mapProdukToAsset));
    } catch (error) {
      console.error('Error fetch produk:', error);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCartData = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const noBadge = session.user.id;
      const json = await getOfficeCart(noBadge);
      const data = json?.data as ApiCartItem[] | unknown;

      if (Array.isArray(data)) {
        const mapped: CartItem[] = (data as ApiCartItem[]).map((it, idx) => {
          const id = Number(it.id ?? it.produk_id ?? idx);
          const name = (it.nama ?? it.produk?.nama ?? '') as string;
          const qty = Number(it.qty ?? 1) || 1;
          const gambar = (it.pic ??
            it.gambar ??
            it.gambarproduk?.[0]?.gambar ??
            it.produk?.pic) as string | undefined;
          const image = gambar
            ? resolveAssetImage(gambar, 'office')
            : undefined;

          return {
            id,
            name,
            qty,
            image,
          } as CartItem;
        });

        setCart(mapped);
        setServerCartCount(mapped.length);
      } else {
        setCart([]);
        setServerCartCount(0);
      }
    } catch (err) {
      console.error('Error fetching office cart:', err);
      setServerCartCount(null);
    }
  }, []);

  const refreshAllData = useCallback(async () => {
    await Promise.all([
      fetchProdukData(search.trim() || undefined),
      fetchCartData(),
    ]);
  }, [fetchProdukData, fetchCartData, search]);

  useEffect(() => {
    fetchProdukData();
    fetchCartData();

    return () => {
      if (searchTimer.current) {
        window.clearTimeout(searchTimer.current);
        searchTimer.current = null;
      }
    };
  }, [fetchProdukData, fetchCartData]);

  useEffect(() => {
    if (searchTimer.current) {
      window.clearTimeout(searchTimer.current);
      searchTimer.current = null;
    }

    searchTimer.current = window.setTimeout(async () => {
      await fetchProdukData(search.trim() || undefined);
    }, 300);

    return () => {
      if (searchTimer.current) {
        window.clearTimeout(searchTimer.current);
        searchTimer.current = null;
      }
    };
  }, [search]);

  const filtered = assets.filter(
    item =>
      item.kategori.toLowerCase().includes(search.toLowerCase()) ||
      item.kompilator.kompilator.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (item: Asset) => {
    setCart(prev => [...prev, { ...item, qty: 1, note: '' }]);
  };

  return (
    <>
      <Navbar
        title="Permintaan Office Supplies"
        cartCount={Math.max(0, serverCartCount ?? cart.length)}
        onCartClick={() => setOpenCart(true)}
        search={search}
        onSearchChange={setSearch}
        cartLabel="Detail Permintaan"
      />

      <Card>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse overflow-hidden rounded-sm border bg-white shadow-sm dark:bg-neutral-900"
                >
                  <div className="relative h-56 w-full bg-gray-200 dark:bg-neutral-800" />

                  <div className="p-4">
                    <div className="mb-2 h-6 w-3/4">
                      <Skeleton className="h-6 w-full" />
                    </div>
                    <div className="mb-4 h-4 w-1/2">
                      <Skeleton className="h-4 w-full" />
                    </div>
                    <div className="h-10">
                      <Skeleton className="h-10 w-full rounded-sm" />
                    </div>
                  </div>
                </div>
              ))}
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
                  Tidak ada produk yang cocok dengan pencarian.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {filtered.map(item => (
                <AssetCard
                  key={item.id}
                  item={item}
                  onAdd={handleAdd}
                  onAddedSuccess={refreshAllData}
                  type="permintaan"
                  addModal="office"
                  allItems={assets}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CartModal
        open={openCart}
        setOpen={setOpenCart}
        cart={cart}
        setCart={setCart}
        type="permintaan"
        source="office"
        onRefresh={refreshAllData}
      />
    </>
  );
}
