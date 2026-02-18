import type { ProdukApi } from "@/types/produk";
import type { Asset } from "@/types/asset";

export const PRODUCT_IMAGE_BASE =
  "https://storage.googleapis.com/pkc_gcp-storage/asset/asset/";

export const buildProductImage = (filename?: string | null) =>
  filename ? `${PRODUCT_IMAGE_BASE}${filename}` : null;

export const mapProdukToAsset = (item: ProdukApi): Asset => ({
  id: item.id,
  kategori: item.nama,
  gambar: buildProductImage(item.gambarproduk?.[0]?.gambar),
  kompilator: {
    kompilator: item.kompilator?.kompilator ?? "-",
  },
  masaManfaat: {
    metode_penyusutan: item.kategori?.tipe ?? "",
  },
});

export default {
  PRODUCT_IMAGE_BASE,
  buildProductImage,
  mapProdukToAsset,
};
