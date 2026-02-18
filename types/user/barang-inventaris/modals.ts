export type UIAsset = {
  id: number | string;
  name?: string;
  desc?: string;
  image?: string | null;
  available?: number;
  kompilator_id?: number;
};

export type ApiCartItem = {
  id?: string | number;
  produk_id?: string | number;
  kategori_id?: number;
  kompilator_id?: number;
  tipe?: string;
  no_badge?: string;
  nama?: string;
  pic?: string;
  gambar?: string;
  qty?: number | string;
  catatan?: string;
  status?: number;
  created_at?: string;
  updated_at?: string;
  satuan_nama?: string;
  produk?: {
    nama?: string;
    pic?: string;
    gambarproduk?: { gambar?: string }[];
  };
};

export type ApiItem = {
  id: string;
  transaksi_id: string;
  kategori_id: number;
  kompilator_id: number;
  no_badge: string;
  nama: string;
  pic: string;
  qty: number;
  catatan: string;
  status: number;
  created_at: string;
  updated_at: string;
};

export type ApiTransaksi = {
  id: string;
  kode_unit: string;
  no_transaksi: string;
  tgl_peminjaman?: string | null;
  tgl_pengembalian?: string | null;
  tgl_permintaan?: string | null;
  no_badge: string;
  nama: string;
  pic: string;
  status: string;
  catatan: string;
  catatan_approval: string;
  no_badge_approval: string;
  nama_approval: string;
  pic_approval: string;
  approval_at?: string | null;
  created_at: string;
  updated_at: string;
  item: ApiItem[];
};

export type ApiResponseData = {
  pinjamResult: ApiTransaksi[];
  perbaikanResult: unknown[];
  permintaanResult: ApiTransaksi[];
};

export type PendingApiResponse = {
  data?: ApiResponseData & {
    countPinjam?: number;
    count_pinjam?: number;
    countPermintaan?: number;
    count_permintaan?: number;
    countTotal?: number;
  };
  countPinjam?: number;
  count_pinjam?: number;
  countPermintaan?: number;
  count_permintaan?: number;
  countTotal?: number;
  pinjamResult?: ApiTransaksi[];
  permintaanResult?: ApiTransaksi[];
  perbaikanResult?: unknown[];
};

export type DetailApprovalData = {
  id: number | string;
  transactionNo: string;
  assetName: string;
  assetImage?: string | null;
  tgl_permintaan?: string | null;
  requestDate?: string;
  approveDate?: string;
  returnDate?: string;
  status: "pending" | "approved" | "rejected" | "completed" | "cancelled";
  variant?: "default" | "success" | "danger";
  approverName?: string;
  approverNip?: string;
  approverAvatar?: string | null;
  item?: Array<{
    id?: string | number;
    nama?: string;
    pic?: string | null;
    qty?: number;
  }>;
};

export type LokasiApiItem = {
  id?: number | string;
  qrcode?: string;
  lokasi?: string;
  area?: string;
  created_at?: string;
  updated_at?: string;
  id_unit?: string;
  fungsi?: string;
  unitkerja?: {
    code?: string;
    name?: string;
    type?: string;
    id?: string;
    leader?: string | number;
  };
  [key: string]: unknown;
};
