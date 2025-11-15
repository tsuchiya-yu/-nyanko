export function sanitizeFileName(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.');
  const baseName = dotIndex > -1 ? fileName.substring(0, dotIndex) : fileName;
  const extension = dotIndex > -1 ? fileName.substring(dotIndex) : '';
  const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
  return sanitizedBaseName + extension;
}

// Convert a public URL from Supabase to the storage path relative to the bucket
// Example:
//   https://<project>.supabase.co/storage/v1/object/public/pet-photos/diaries/123/a.png
// -> diaries/123/a.png
export function extractStoragePathFromPublicUrl(publicUrl: string, bucket: string): string | null {
  try {
    const url = new URL(publicUrl);
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = url.pathname.indexOf(marker);
    if (idx === -1) return null;
    return url.pathname.substring(idx + marker.length);
  } catch {
    return null;
  }
}

