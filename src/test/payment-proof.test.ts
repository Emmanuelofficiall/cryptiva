import { describe, expect, it } from "vitest";
import { validatePaymentProof } from "@/lib/payment-proof";

describe("deposit evidence", () => {
  it("requires uploaded payment proof", () => expect(validatePaymentProof(null)).not.toBeNull());
  it("accepts payment images and PDFs", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp", "application/pdf"]) expect(validatePaymentProof({ size: 100, type })).toBeNull();
    expect(validatePaymentProof({ size: 100, type: "text/html" })).not.toBeNull();
  });
  it("caps evidence at 5 MB", () => {
    expect(validatePaymentProof({ size: 5242880, type: "image/png" })).toBeNull();
    expect(validatePaymentProof({ size: 5242881, type: "image/png" })).not.toBeNull();
  });
});