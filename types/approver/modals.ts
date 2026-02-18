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

export type ModalAsset = {
  id?: string | number;
  nama?: string;
  pic?: string | null;
  qty?: number;
};

export type ModalTarget = {
  id?: number;
  transactionNo?: string;
  employee?: string;
  item?: ModalAsset[];
  type?: "peminjaman" | "permintaan" | string;
  tipe?: string;
  nama?: string;
  transaction_id?: string;
  assetName?: string;
  assetImage?: string | null;
  qty?: number;
};

export type DetailApprovalData = {
  id: number | string;
  transactionNo: string;
  assetName: string;
  qty?: number;
  assetImage?: string | null;
  date?: string;
  approveDate?: string;
  returnDate?: string;
  tgl_permintaan?: string | null;
  tgl_peminjaman?: string | null;
  approval_at?: string | null;
  status: "pending" | "approved" | "rejected" | "completed" | "cancelled";
  variant?: "default" | "success" | "danger";
  pic_approval?: string | null;
  no_badge_approval?: string | null;
  nama_approval?: string | null;
  item?: Array<{
    id?: string | number;
    nama?: string;
    pic?: string | null;
    qty?: number;
  }>;
};
