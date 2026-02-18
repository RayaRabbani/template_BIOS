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