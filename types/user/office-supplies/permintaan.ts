export type ApiCartItem = {
  id?: string | number;
  produk_id?: string | number;
  nama?: string;
  pic?: string;
  gambar?: string;
  gambarproduk?: { gambar?: string }[];
  produk?: { nama?: string; pic?: string; gambarproduk?: { gambar?: string }[] };
  qty?: number | string;
  [k: string]: unknown;
};
