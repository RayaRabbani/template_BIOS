export type Approver = {
  id: number | string;
  name: string;
  nip: string;
  avatar?: string;
};

export type ApiCartItem = {
  id?: string | number;
  produk_id?: string | number;
  kategori_id?: number;
  kompilator_id?: number;
  catatan?: string;
  nama?: string;
  pic?: string;
  gambar?: string;
  status?: number;
  created_at?: string;
  updated_at?: string;
  qty?: number | string;
  satuan_id?: number | string;
  satuan_nama?: string;
  no_badge?: string;
  produk?: {
    nama?: string;
    pic?: string;
    gambarproduk?: { gambar?: string }[];
  };
  gambarproduk?: { gambar?: string }[];
};

export type ApiItem = {
  id: string;
  produk_id: string;
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
  satuan_id: number;
  satuan_nama: string;
};

export type ApiTransaksi = {
  id: string;
  no_transaksi: string;
  tgl_permintaan: string;
  no_badge: string;
  nama: string;
  pic: string;
  status: string;
  catatan: string;
  catatan_approval: string | null;
  no_badge_approval: string;
  nama_approval: string;
  pic_approval: string;
  approval_at: string | null;
  created_at: string;
  updated_at: string;
  item: ApiItem[];
};

export type DetailApprovalData = {
  id: number | string;
  transactionNo: string;
  assetName: string;
  assetImage?: string | null;
  requestDate?: string;
  approveDate?: string;
  returnDate?: string;
  status: "pending" | "approved" | "rejected" | "completed";
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
