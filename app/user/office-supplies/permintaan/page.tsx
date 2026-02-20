'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Inbox } from 'lucide-react';
import { useSession } from 'next-auth/react';

import AssetCard from '@/components/asset-card';
import CartModal from '@/components/modals/user/office-supplies/cart-modal';
import Navbar from '@/components/navbar';
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
  }, [session?.user?.id]);

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

      <div className="mt-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <AssetCard
                key={i}
                loading={true}
                item={{} as unknown as Asset}
                onAdd={() => {}}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-neutral-100 p-4 dark:bg-neutral-800">
              <Inbox
                size={32}
                className="text-neutral-400 dark:text-neutral-500"
              />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Tidak ada data
            </h3>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              Tidak ada produk yang cocok dengan pencarian.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
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
      </div>

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
