export const resolveAssetImage = (
  gambar?: string | null,
  source?:
    | 'office'
    | 'asset'
    | 'kategori'
    | 'employee'
    | 'employeeApproval'
    | 'transaksi'
) => {
  if (!gambar) return null;

  const clean = String(gambar).trim();

  if (/^https?:\/\//i.test(clean)) {
    // Handle double URLs: "https://.../https://..."
    const lastHttpIndex = clean.lastIndexOf('http://');
    const lastHttpsIndex = clean.lastIndexOf('https://');
    const lastIndex = Math.max(lastHttpIndex, lastHttpsIndex);

    if (lastIndex > 0) {
      const url = clean.substring(lastIndex);
      // Correction for 'transaksi' special cases if the incoming full URL specifically says 'asset/asset'
      if (source === 'transaksi' && url.includes('/asset/asset/')) {
        return url.replace('/asset/asset/', '/asset/transaksi/');
      }
      return url;
    }

    // Even if it's not a double URL, if the source is 'transaksi' but the string is already a full URL pointing to 'asset/asset', force it to 'asset/transaksi'
    if (source === 'transaksi' && clean.includes('/asset/asset/')) {
      return clean.replace('/asset/asset/', '/asset/transaksi/');
    }

    return clean;
  }

  const filename = clean.split('~')[0];

  // If even after split it looks like an URL, return only the last part
  if (filename.includes('http://') || filename.includes('https://')) {
    const lastHttpIndex = filename.lastIndexOf('http://');
    const lastHttpsIndex = filename.lastIndexOf('https://');
    const lastIndex = Math.max(lastHttpIndex, lastHttpsIndex);
    return filename.substring(lastIndex);
  }

  switch (source) {
    case 'office':
    case 'asset':
      return `https://storage.googleapis.com/pkc_gcp-storage/asset/asset/${filename}`;

    case 'kategori':
      return `https://storage.googleapis.com/pkc_gcp-storage/asset/kategori/${filename}`;

    case 'transaksi':
      return `https://storage.googleapis.com/pkc_gcp-storage/asset/transaksi/${filename}`;

    case 'employee':
    case 'employeeApproval':
      return `https://statics.pupuk-kujang.co.id/demplon/picemp/${filename}`;

    default:
      return `https://storage.googleapis.com/pkc_gcp-storage/asset/kategori/${filename}`;
  }
};
