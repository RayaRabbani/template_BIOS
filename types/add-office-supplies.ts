export type ProdukDetail = {
  id: string;
  nama: string;
  kategori_id: string;
  kompilator_id: string;
  produkatribut: {
    atribut: string;
    value: string;
  }[];
  produksatuan: {
    qty: string;
    produk_id: string;
    satuan_nama: string;
    satuan_id: string;
  }[];
  gambarproduk: {
    gambar: string;
  }[];
};