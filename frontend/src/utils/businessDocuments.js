export const businessDocumentLocation = (value, origin) => {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value, origin);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
    if (url.origin !== new URL(origin).origin) return { external: true, url: url.href };
    if (!/^\/uploads\/permits\/[a-z0-9][a-z0-9._-]{0,220}\.(jpg|jpeg|png|webp|pdf)$/i.test(url.pathname)
        || url.pathname.includes('..')) return null;
    return { external: false, url: url.href };
  } catch { return null; }
};

export const documentPreviewType = mime => {
  const type = String(mime || '').split(';')[0].trim().toLowerCase();
  if (['image/jpeg', 'image/png', 'image/webp'].includes(type)) return 'image';
  return type === 'application/pdf' ? 'pdf' : null;
};

export const businessDocumentError = async error => {
  const status = error.response?.status;
  if ([404, 410].includes(status)) return 'This uploaded file is missing from the server. The owner needs to upload it again, or restore it from a backup.';
  if (status === 401) return 'Your session expired. Sign in again to view the document.';
  if (status === 403) return 'Only the submitting owner and administrators can view this document.';
  let data = error.response?.data;
  if (typeof data?.text === 'function') {
    try { data = JSON.parse(await data.text()); } catch { data = null; }
  }
  return typeof data?.error === 'string' ? data.error : 'Unable to load the document. Please try again.';
};
