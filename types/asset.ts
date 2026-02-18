export type Asset = {
  id: string;
  kategori: string;
  gambar: string | null;
  kompilator: {
    kompilator: string;
  };
  masaManfaat?: {
    metode_penyusutan: string;
  };
};