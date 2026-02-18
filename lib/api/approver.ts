import axios, { AxiosInstance } from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY!;

const client: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'x-api-key': API_KEY,
  },
});

export type ApiResponse<T = unknown> = {
  statusCode?: number;
  message?: string;
  data?: T;
};

export type ApprovalPayload = {
  no_badge_approval: string;
  nama_approval: string;
  pic_approval: string;
  catatan_approval: string;
};

export async function getPeminjamanApprovals(
  employeeId: string | number,
  options?: {
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<ApiResponse> {
  const params = new URLSearchParams();
  if (options?.search) params.append('search', options.search);
  if (options?.status && options.status !== 'all')
    params.append('status', options.status);
  if (options?.dateFrom) params.append('date_from', options.dateFrom);
  if (options?.dateTo) params.append('date_to', options.dateTo);

  const queryString = params.toString();
  const url = `/transaksi-peminjaman/employee-approval/${employeeId}${
    queryString ? '?' + queryString : ''
  }`;

  const res = await client.get<ApiResponse>(url);
  return res.data;
}

export async function getPermintaanApprovals(
  employeeId: string | number,
  options?: {
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<ApiResponse> {
  const params = new URLSearchParams();
  if (options?.search) params.append('search', options.search);
  if (options?.status && options.status !== 'all')
    params.append('status', options.status);
  if (options?.dateFrom) params.append('date_from', options.dateFrom);
  if (options?.dateTo) params.append('date_to', options.dateTo);

  const queryString = params.toString();
  const url = `/transaksi-permintaan/employee-approval/${employeeId}${
    queryString ? '?' + queryString : ''
  }`;

  const res = await client.get<ApiResponse>(url);
  return res.data;
}

export async function getOfficeSuppliesApprovals(
  noBadge: string | number,
  options?: {
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<ApiResponse> {
  const params = new URLSearchParams();
  if (options?.search) params.append('search', options.search);
  if (options?.status && options.status !== 'all')
    params.append('status', options.status);
  if (options?.dateFrom) params.append('date_from', options.dateFrom);
  if (options?.dateTo) params.append('date_to', options.dateTo);

  const queryString = params.toString();
  const url = `/transaksi-permintaan-consumable/employee-approval/${noBadge}${
    queryString ? '?' + queryString : ''
  }`;

  const res = await client.get<ApiResponse>(url);
  return res.data;
}

export async function getApprovals(
  path: string,
  employeeId: string | number
): Promise<ApiResponse> {
  const res = await client.get<ApiResponse>(`${path}/${employeeId}`);
  return res.data;
}

export async function approvePeminjamanRequest(
  id: string | number
  // payload: ApprovalPayload
): Promise<ApiResponse> {
  const res = await client.put<ApiResponse>(
    `/transaksi-peminjaman/approval/${id}`
  );
  return res.data;
}

export async function rejectPeminjamanRequest(
  id: string | number
  // payload: ApprovalPayload
): Promise<ApiResponse> {
  const res = await client.put<ApiResponse>(
    `/transaksi-peminjaman/reject/${id}`
  );
  return res.data;
}

export async function approvePermintaanRequest(
  id: string | number
): Promise<ApiResponse> {
  const res = await client.put<ApiResponse>(
    `/transaksi-permintaan/approval/${id}`
  );
  return res.data;
}

export async function rejectPermintaanRequest(
  id: string | number
): Promise<ApiResponse> {
  const res = await client.put<ApiResponse>(
    `/transaksi-permintaan/reject/${id}`
  );
  return res.data;
}

export async function approveOfficeSuppliesRequest(
  id: string | number
): Promise<ApiResponse> {
  const res = await client.put<ApiResponse>(
    `/transaksi-permintaan-consumable/approval/${id}`
  );
  return res.data;
}

export async function rejectOfficeSuppliesRequest(
  id: string | number
): Promise<ApiResponse> {
  const res = await client.put<ApiResponse>(
    `/transaksi-permintaan-consumable/reject/${id}`
  );
  return res.data;
}

export default client;
