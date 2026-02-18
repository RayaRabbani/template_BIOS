export const resolveAssetImage = (
  gambar?: string | null,
  source?: "office" | "asset" | "kategori" | "employee" | "employeeApproval"
) => {
  if (!gambar) return null;

  const clean = String(gambar).trim();

  if (/^https?:\/\//i.test(clean)) {
    return clean;
  }

  const filename = clean.split("~")[0];

  switch (source) {
    case "office":
    case "asset":
      return `https://storage.googleapis.com/pkc_gcp-storage/asset/asset/${filename}`;

    case "kategori":
      return `https://storage.googleapis.com/pkc_gcp-storage/asset/kategori/${filename}`;

    case "employee":
    case "employeeApproval":
      return `https://statics.pupuk-kujang.co.id/demplon/picemp/${filename}`;

    default:
      return `https://storage.googleapis.com/pkc_gcp-storage/asset/kategori/${filename}`;
  }
};
