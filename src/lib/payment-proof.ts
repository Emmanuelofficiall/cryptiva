export const PAYMENT_PROOF_MAX_BYTES = 5 * 1024 * 1024;
export const PAYMENT_PROOF_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export function validatePaymentProof(file: { size: number; type: string } | null): string | null {
  if (!file) return "Upload payment proof before submitting.";
  if (!PAYMENT_PROOF_TYPES.includes(file.type)) return "Choose a JPG, PNG, WebP image or PDF.";
  if (file.size <= 0 || file.size > PAYMENT_PROOF_MAX_BYTES) return "Payment proof must be between 1 byte and 5 MB.";
  return null;
}