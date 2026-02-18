'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Inbox } from 'lucide-react';
import { useSession } from 'next-auth/react';

import AssetCard from '@/components/asset-card';
import CartModal from '@/components/modals/user/barang-inventaris/cart-modal';
import Navbar from '@/components/navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
    setLoading(true);
    try {
      const json = await getKategori(q);
      setAssets((json?.data as Asset[]) || []);
    } catch (error) {
      console.error('Error fetch kategori:', error);
      setAssets([]);
    } finally {
      setLoading(false);
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
                  Tidak ada asset yang cocok dengan pencarian.
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
                  type="peminjaman"
                  addModal="kategori"
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
        type="peminjaman"
        onRefresh={refreshAllData}
      />
    </>
  );
}
