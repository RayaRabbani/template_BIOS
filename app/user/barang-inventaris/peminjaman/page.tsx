'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Inbox } from 'lucide-react';
import { useSession } from 'next-auth/react';

import AssetCard from '@/components/asset-card';
import CartModal from '@/components/modals/user/barang-inventaris/cart-modal';
import Navbar from '@/components/navbar';
import { getBorrowingCart, getKategori } from '@/lib/api/user';
import { Asset } from '@/types/asset';
import { CartItem } from '@/types/cart';

export default function PeminjamanPage() {
  const { data: session } = useSession();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [openCart, setOpenCart] = useState(false);
  const [search, setSearch] = useState('');
  const [serverCartCount, setServerCartCount] = useState<number | null>(null);

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const searchTimer = useRef<number | null>(null);
  const assetsRef = useRef<Asset[]>([]);
  const isFirstSearch = useRef(true);

  const fetchServerCart = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const noBadge = session.user.id;
      const json = await getBorrowingCart(noBadge);
      const data = json?.data;
      if (Array.isArray(data)) setServerCartCount(data.length);
      else if (typeof data === 'number') setServerCartCount(data);
      else setServerCartCount(0);
    } catch (err) {
      console.error('Error fetch borrowing cart:', err);
      setServerCartCount(null);
    }
  }, [session?.user?.id]);

  const fetchKategoriData = useCallback(async (q?: string) => {
    const shouldShowLoading = assetsRef.current.length === 0;
    if (shouldShowLoading) setLoading(true);
    try {
      const json = await getKategori(q);
      const newAssets = (json?.data as Asset[]) || [];
      setAssets(newAssets);
      assetsRef.current = newAssets;
    } catch (error) {
      console.error('Error fetch kategori:', error);
      setAssets([]);
      assetsRef.current = [];
    } finally {
      if (shouldShowLoading) setLoading(false);
    }
  }, []);

  const refreshAllData = useCallback(async () => {
    await Promise.all([
      fetchServerCart(),
      fetchKategoriData(search.trim() || undefined),
    ]);
  }, [fetchServerCart, fetchKategoriData, search]);

  useEffect(() => {
    fetchKategoriData();
    fetchServerCart();

    return () => {
      if (searchTimer.current) {
        window.clearTimeout(searchTimer.current);
        searchTimer.current = null;
      }
    };
  }, [fetchKategoriData, fetchServerCart]);

  useEffect(() => {
    if (isFirstSearch.current) {
      isFirstSearch.current = false;
      return;
    }

    if (searchTimer.current) {
      window.clearTimeout(searchTimer.current);
      searchTimer.current = null;
    }

    searchTimer.current = window.setTimeout(async () => {
      await fetchKategoriData(search.trim() || undefined);
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
        title="Peminjaman Barang Inventaris"
        cartCount={Math.max(0, serverCartCount ?? cart.length)}
        onCartClick={() => setOpenCart(true)}
        search={search}
        onSearchChange={setSearch}
        cartLabel="Detail Peminjaman"
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
              Tidak ada asset yang cocok dengan pencarian &quot;{search}&quot;.
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
                type="peminjaman"
                addModal="kategori"
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
        type="peminjaman"
        onRefresh={refreshAllData}
      />
    </>
  );
}
