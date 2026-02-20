import axios from 'axios';

import client, { ApiResponse } from '@/lib/api/approver';
import type { ProdukDetail } from '@/types/add-office-supplies';
import type { Asset } from '@/types/asset';
import type { EmployeeApi } from '@/types/employee';
import type { ProdukApi } from '@/types/produk';

function getDemplonAuth() {
  const username = process.env.NEXT_PUBLIC_DEMPLON_USERNAME || 'demplonadmin';
  const password = process.env.NEXT_PUBLIC_DEMPLON_PASSWORD || '9845802-fa98458e-817d-48c3-877d-5d3f23c0ef23';

  if (!username || !password) {
    throw new Error(
      'NEXT_PUBLIC_DEMPLON_USERNAME and NEXT_PUBLIC_DEMPLON_PASSWORD must be set'
    );
  }

  return { username, password };
}

export async function getKategori(
  q?: string,
  page?: number
): Promise<ApiResponse<Asset[]>> {
  const params: Record<string, unknown> = {};
  if (q && q.length > 0) params.q = q;
  if (page && Number(page) > 0) params.page = Number(page);

  const res = await client.get<ApiResponse<Asset[]>>(`/kategori/tipe/asset`, {
    params,
  });
  return res.data;
}

export async function getBorrowingCart(
  noBadge: string | number
): Promise<ApiResponse<unknown>> {
  const res = await client.get<ApiResponse<unknown>>(
    `/keranjang/borrowing/${noBadge}`
  );
  return res.data;
}

export async function getRequestCart(
  noBadge: string | number
): Promise<ApiResponse<unknown>> {
  const res = await client.get<ApiResponse<unknown>>(
    `/keranjang/request/${noBadge}`
  );
  return res.data;
}

export async function deleteCartItem(
  id: string | number
): Promise<ApiResponse<unknown>> {
  const res = await client.delete<ApiResponse<unknown>>(`/keranjang/${id}`);
  return res.data;
}

export async function deleteProductCart(
  id: string | number
): Promise<ApiResponse<unknown>> {
  const res = await client.delete<ApiResponse<unknown>>(
    `/keranjang/produk/${id}`
  );
  return res.data;
}

export async function updateCartItemConsumable(
  id: string | number,
  qty: number,
  payload: unknown
): Promise<ApiResponse<unknown>> {
  const res = await client.put<ApiResponse<unknown>>(
    `/keranjang/keranjang-produk-qty/${id}/${qty}`,
    payload
  );
  return res.data;
}

export async function updateCartItemRequest(
  id: string | number,
  qty: number,
  payload: unknown
): Promise<ApiResponse<unknown>> {
  const res = await client.put<ApiResponse<unknown>>(
    `/keranjang/keranjang-qty/${id}/${qty}`,
    payload
  );
  return res.data;
}

export async function createProductCart(
  payload: unknown
): Promise<ApiResponse<unknown>> {
  const res = await client.post<ApiResponse<unknown>>(
    `/keranjang/create/produk`,
    payload
  );
  return res.data;
}

export async function createBorrowingCart(
  payload: unknown
): Promise<ApiResponse<unknown>> {
  const res = await client.post<ApiResponse<unknown>>(
    `/keranjang/create/borrowing`,
    payload
  );
  return res.data;
}

export async function createRequestCart(
  payload: unknown
): Promise<ApiResponse<unknown>> {
  const res = await client.post<ApiResponse<unknown>>(
    `/keranjang/create/request`,
    payload
  );
  return res.data;
}

export async function getProdukById(
  produkId: string | number
): Promise<ApiResponse<ProdukDetail>> {
  const res = await client.get<ApiResponse<ProdukDetail>>(
    `/produk/${produkId}`
  );
  return res.data;
}

export async function getPendingTransaksi(
  id: string | number
): Promise<ApiResponse<unknown>> {
  const res = await client.get<ApiResponse<unknown>>(
    `/transaksi/pending/${id}`
  );
  return res.data;
}

export async function getPendingConsumable(
  id: string | number
): Promise<ApiResponse<unknown>> {
  const res = await client.get<ApiResponse<unknown>>(
    `/transaksi-consumable/pending/${id}`
  );
  return res.data;
}

export async function cancelPeminjamanRequest(
  id: string | number
): Promise<ApiResponse<unknown>> {
  const res = await client.put<ApiResponse<unknown>>(
    `/transaksi-peminjaman/cancle/${id}`,
    {}
  );
  return res.data;
}

export async function cancelPermintaanRequest(
  id: string | number
): Promise<ApiResponse<unknown>> {
  const res = await client.put<ApiResponse<unknown>>(
    `/transaksi-permintaan/cancle/${id}`,
    {}
  );
  return res.data;
}

export async function cancelOfficeSuppliesRequest(
  id: string | number
): Promise<ApiResponse> {
  const res = await client.put<ApiResponse>(
    `/transaksi-permintaan-consumable/cancle/${id}`
  );
  return res.data;
}

export async function cancelPeminjamanTransaksiRequest(
  id: string | number
): Promise<ApiResponse<unknown>> {
  const res = await client.put<ApiResponse<unknown>>(
    `/transaksi/cancle-borrowing/${id}`,
    {}
  );
  return res.data;
}

export async function cancelPermintaanTransaksiRequest(
  id: string | number
): Promise<ApiResponse<unknown>> {
  const res = await client.put<ApiResponse<unknown>>(
    `/transaksi/cancle-request/${id}`,
    {}
  );
  return res.data;
}

export async function cancelOfficeSuppliesTransaksiRequest(
  id: string | number
): Promise<ApiResponse<unknown>> {
  const res = await client.put<ApiResponse<unknown>>(
    `/transaksi-consumable/cancle-request/${id}`,
    {}
  );
  return res.data;
}

export async function getProdukAvailable(
  q?: string
): Promise<ApiResponse<ProdukApi[]>> {
  const params: Record<string, unknown> = {};
  if (q && q.length > 0) params.q = q;
  const res = await client.get<ApiResponse<ProdukApi[]>>(`/produk/available`, {
    params,
  });
  return res.data;
}

export async function getTransaksiByBadge(
  noBadge: string | number,
  q?: string,
  status?: string,
  type?: string,
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<unknown>> {
  const params: Record<string, unknown> = {};
  if (q && q.length > 0) params.q = q;
  if (status && status !== 'all') params.status = status;
  if (type && type !== 'all') params.type = type;
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  const res = await client.get<ApiResponse<unknown>>(
    `/transaksi/no_badge/${noBadge}`,
    { params }
  );
  return res.data;
}

export async function getTransaksiConsumableByBadge(
  noBadge: string | number,
  q?: string,
  status?: string,
  type?: string,
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<unknown>> {
  const params: Record<string, unknown> = {};
  if (q && q.length > 0) params.q = q;
  if (status && status !== 'all') params.status = status;
  if (type && type !== 'all') params.type = type;
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  const res = await client.get<ApiResponse<unknown>>(
    `/transaksi-consumable/no_badge/${noBadge}`,
    { params }
  );
  return res.data;
}

export async function getUnits(): Promise<ApiResponse<unknown>> {
  const res = await client.get<ApiResponse<unknown>>(`/unit`);
  return res.data;
}

export async function getLokasiByUnit(
  unitId: string | number
): Promise<ApiResponse<unknown>> {
  const res = await client.get<ApiResponse<unknown>>(`/lokasi/unit/${unitId}`);
  return res.data;
}

export async function getEmployeeById(
  id: string | number
): Promise<EmployeeApi> {
  const url = `https://demplon.pupuk-kujang.co.id/admin/api/hr/employees/${id}/`;
  const res = await axios.get<EmployeeApi>(url, {
    auth: getDemplonAuth(),
  });
  return res.data as EmployeeApi;
}

export async function getAllEmployees(): Promise<EmployeeApi[]> {
  const url = 'https://demplon.pupuk-kujang.co.id/admin/api/hr/employees/';
  const res = await axios.get<EmployeeApi[]>(url, {
    auth: getDemplonAuth(),
  });
  return res.data as EmployeeApi[];
}

export async function getEmployeesByRoles(
  roleIds: string[]
): Promise<EmployeeApi[]> {
  const url = 'https://demplon.pupuk-kujang.co.id/admin/api/hr/employees/';
  const roleParams = roleIds
    .map(id => `roleid[]=${encodeURIComponent(id)}`)
    .join('&');

  const res = await axios.get<EmployeeApi[]>(`${url}?${roleParams}`, {
    auth: getDemplonAuth(),
  });
  return res.data as EmployeeApi[];
}

export async function searchEmployeesByRoles(
  roleIds: string[],
  search?: string
): Promise<EmployeeApi[]> {
  const url = 'https://demplon.pupuk-kujang.co.id/admin/api/hr/employees/';
  const roleParams = roleIds
    .map(id => `roleid[]=${encodeURIComponent(id)}`)
    .join('&');

  const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
  const fullUrl = `${url}?${roleParams}${searchParam}`;

  const res = await axios.get<EmployeeApi[]>(fullUrl, {
    auth: getDemplonAuth(),
  });
  return res.data as EmployeeApi[];
}

export async function getTransaksiBySlug(
  slug: string
): Promise<ApiResponse<unknown>> {
  const res = await client.get<ApiResponse<unknown>>(`/transaksi/slug/${slug}`);
  return res.data;
}

export async function getTransaksiItems(
  slug: string
): Promise<ApiResponse<unknown>> {
  const res = await client.get<ApiResponse<unknown>>(`/transaksi/item/${slug}`);
  return res.data;
}
export async function getTransaksiConsumableBySlug(
  slug: string
): Promise<ApiResponse<unknown>> {
  const res = await client.get<ApiResponse<unknown>>(
    `/transaksi-consumable/slug/${slug}`
  );
  return res.data;
}

export async function getTransaksiConsumableItems(
  slug: string
): Promise<ApiResponse<unknown>> {
  const res = await client.get<ApiResponse<unknown>>(
    `/transaksi-consumable/item/${slug}`
  );
  return res.data;
}

export async function getInventoryBorrowingAvailable(
  kategoriId: string | number
): Promise<ApiResponse<unknown>> {
  const res = await client.get<ApiResponse<unknown>>(
    `/inventory/borrowing-available/${kategoriId}`
  );
  return res.data;
}

export async function getInventoryRequestAvailable(
  kategoriId: string | number
): Promise<ApiResponse<unknown>> {
  const res = await client.get<ApiResponse<unknown>>(
    `/inventory/request-available/${kategoriId}`
  );
  return res.data;
}

export async function getOfficeCart(
  noBadge: string | number
): Promise<ApiResponse<unknown>> {
  const res = await client.get<ApiResponse<unknown>>(
    `/keranjang/produk-employee/${noBadge}`
  );
  return res.data;
}

export async function createTransaksiPeminjaman(payload: {
  kode_unit: string;
  no_badge: string;
  nama: string;
  pic: string;
  no_badge_approval: string;
  nama_approval: string;
  pic_approval: string;
  tgl_peminjaman: string;
  tgl_pengembalian: string;
  catatan: string;
  approval: string;
}): Promise<ApiResponse<unknown>> {
  const res = await client.post<ApiResponse<unknown>>(
    '/transaksi-peminjaman/create',
    {
      approval: payload.approval,
      catatan: payload.catatan,
      kode_unit: payload.kode_unit,
      nama: payload.nama,
      nama_approval: payload.nama_approval,
      no_badge: payload.no_badge,
      no_badge_approval: payload.no_badge_approval,
      pic: payload.pic,
      pic_approval: payload.pic_approval,
      tgl_peminjaman: payload.tgl_peminjaman,
      tgl_pengembalian: payload.tgl_pengembalian,
    }
  );
  return res.data;
}

// Create transaksi permintaan
export async function createTransaksiPermintaan(payload: {
  lokasi_id: string | number;
  kode_unit: string;
  no_badge: string;
  nama: string;
  pic: string;
  no_badge_approval: string;
  nama_approval: string;
  pic_approval: string;
  tgl_permintaan: string;
  catatan: string;
  approval: string;
}): Promise<ApiResponse<unknown>> {
  const res = await client.post<ApiResponse<unknown>>(
    '/transaksi-permintaan/create',
    {
      approval: payload.approval,
      catatan: payload.catatan,
      kode_unit: payload.kode_unit,
      lokasi_id: String(payload.lokasi_id),
      nama: payload.nama,
      nama_approval: payload.nama_approval,
      no_badge: payload.no_badge,
      no_badge_approval: payload.no_badge_approval,
      pic: payload.pic,
      pic_approval: payload.pic_approval,
      tgl_permintaan: payload.tgl_permintaan,
    }
  );
  return res.data;
}

// Create transaksi permintaan consumable
export async function createTransaksiPermintaanConsumable(payload: {
  no_badge: string;
  nama: string;
  pic: string;
  no_badge_approval: string;
  nama_approval: string;
  pic_approval: string;
  tgl_permintaan: string;
  catatan: string;
  approval: string;
}): Promise<ApiResponse<unknown>> {
  const res = await client.post<ApiResponse<unknown>>(
    '/transaksi-permintaan-consumable/create',
    {
      no_badge: payload.no_badge,
      nama: payload.nama,
      pic: payload.pic,
      no_badge_approval: payload.no_badge_approval,
      nama_approval: payload.nama_approval,
      pic_approval: payload.pic_approval,
      tgl_permintaan: payload.tgl_permintaan,
      catatan: payload.catatan,
      approval: payload.approval,
    }
  );
  return res.data;
}

export async function sendApproverNotification(payload: {
  channels: string[];
  employeeIds: string[];
  type: string;
  category: string;
  title: string;
  body: string;
}): Promise<unknown> {
  const url = 'https://demplon.pupuk-kujang.co.id/admin/api/demplon/panon/';

  const form = new URLSearchParams();
  for (const ch of payload.channels) form.append('channel[]', ch);
  for (const eid of payload.employeeIds) form.append('employeeid[]', eid);
  form.append('type', payload.type);
  form.append('category', payload.category);
  form.append('title', payload.title);
  form.append('body', payload.body);

  const res = await axios.post(url, form.toString(), {
    auth: getDemplonAuth(),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return res.data;
}

export function extractCountFromResponse(resp: ApiResponse | unknown): number {
  if (resp == null) return 0;

  const asRecord = resp as Record<string, unknown>;

  function getCountFromRecord(r?: Record<string, unknown>): unknown {
    if (!r) return undefined;
    const keys = [
      'countTotal',
      'count_total',
      'countPinjam',
      'count_pinjam',
      'countPermintaan',
      'count_permintaan',
    ];
    for (const k of keys) {
      const v = r[k];
      if (typeof v === 'number' || typeof v === 'string') return v;
    }
    return undefined;
  }

  let value = getCountFromRecord(asRecord);
  if (value === undefined) {
    const data = asRecord.data;
    if (data && typeof data === 'object') {
      value = getCountFromRecord(data as Record<string, unknown>);
    }
  }

  if (value !== undefined) {
    return Number(value ?? 0) || 0;
  }

  return extractPendingCountFromData(asRecord);
}

export function extractPendingCountFromData(
  resp: ApiResponse | unknown
): number {
  if (resp == null) return 0;

  const asRecord = resp as Record<string, unknown>;
  let count = 0;

  const data = asRecord.data as Record<string, unknown> | undefined;
  if (!data) return 0;

  const pinjamResult = data.pinjamResult;
  if (Array.isArray(pinjamResult)) {
    const pendingPinjam = pinjamResult.filter(
      (item: Record<string, unknown>) => item.status === 'Diajukan'
    );
    count += pendingPinjam.length;
  }

  const permintaanResult = data.permintaanResult;
  if (Array.isArray(permintaanResult)) {
    const pendingPermintaan = permintaanResult.filter(
      (item: Record<string, unknown>) => item.status === 'Diajukan'
    );
    count += pendingPermintaan.length;
  }

  return count;
}

export async function getPenyerahanTransaksi(
  transaksiId: string | number
): Promise<ApiResponse<unknown>> {
  const res = await client.get<ApiResponse<unknown>>(
    `/penyerahan/transaksi/${transaksiId}`
  );
  return res.data;
}

export async function getPeminjamanTransaksi(
  transaksiId: string | number
): Promise<ApiResponse<unknown>> {
  const res = await client.get<ApiResponse<unknown>>(
    `/peminjaman/transaksi/${transaksiId}`
  );
  return res.data;
}

export default client;
