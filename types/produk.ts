export type ProdukApi = {
  id: string;
  nama: string;
  kategori: {
    tipe: string;
  } | null;
  kompilator: {
    kompilator: string;
  } | null;
  gambarproduk: {
    gambar: string;
  }[];
};