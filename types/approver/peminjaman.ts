export type ApiItem = {
  id?: string;
  transaksi_id?: string;
  kategori_id?: number;
  kompilator_id?: number;
  no_badge?: string;
  nama?: string;
  pic?: string | null;
  qty?: number;
  catatan?: string;
  status?: number;
  created_at?: string;
  updated_at?: string;
};

export type ApiTransaksi = {
  id?: string;
  kode_unit?: string;
  no_transaksi?: string;
  no_transaction?: string;
  tgl_peminjaman?: string;
  tgl_pengembalian?: string;
  tgl_pinjam?: string;
  tgl_kembali?: string;
  no_badge?: string;
  nama?: string;
  nama_peminjam?: string;
  pic?: string | null;
  status?: string;
  catatan?: string;
  catatan_approval?: string;
  no_badge_approval?: string;
  nama_approval?: string;
  pic_approval?: string | null;
  approval_at?: string;
  created_at?: string;
  updated_at?: string;
  item?: ApiItem[];
  qty?: number;
};

export type ApiResponse = {
  statusCode?: number;
  message?: string;
  data?: ApiTransaksi[];
};

export type HistoryItem = {
  id: number;
  type: "peminjaman" | "permintaan";
  transactionNo: string;
  date: string;
  employee: string;
  status: "pending" | "approved" | "rejected" | "completed" | "cancelled";
  returnDate?: string;
  assetName?: string;
  assetImage?: string;
  pic?: string | null;
  no_badge?: string | null;
  pic_approval?: string | null;
  nama_approval?: string | null;
  approval_at?: string | null;
  no_badge_approval?: string | null;
  tgl_permintaan?: string | null;
  tgl_peminjaman?: string | null;
  qty?: number;
  item?: Array<{
    id?: string | number;
    nama?: string;
    pic?: string | null;
    qty?: number;
  }>;
};