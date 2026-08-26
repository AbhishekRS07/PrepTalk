const MAX_PDF_BYTES = 8 * 1024 * 1024; // 8MB — comfortably covers a real resume, not a DoS vector

/**
 * Validates a File before it's read into memory and parsed. Rejects on size before
 * touching the bytes at all — none of the resume upload routes had any size cap, so an
 * oversized upload would be read fully into memory before extraction even started.
 * Also checks the PDF magic bytes (`%PDF-`) rather than trusting `file.type`/filename,
 * both of which are client-supplied and trivially spoofed.
 */
export async function validatePdfUpload(file) {
  if (!file) return { ok: false, error: "No file provided." };
  if (file.size > MAX_PDF_BYTES) {
    return { ok: false, error: `File too large — max ${MAX_PDF_BYTES / (1024 * 1024)}MB.` };
  }

  const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  const signature = String.fromCharCode(...head);
  if (signature !== "%PDF-") {
    return { ok: false, error: "That doesn't look like a valid PDF file." };
  }

  return { ok: true };
}
