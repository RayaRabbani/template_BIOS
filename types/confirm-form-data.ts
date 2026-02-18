export type ConfirmFormData = {
  tanggalPinjam?: string;
  tanggalKembali?: string;
  tanggalPermintaan?: string;
  lokasi?: string;
  unitKerja?: string;
  catatan?: string;
  approver?: {
    id?: number | string;
    name?: string;
    nip?: string;
    avatar?: string;
  };
};

export default ConfirmFormData;