import { describe, it, expect } from "vitest";
import { calculateNetPayout } from "../lib/payout-math";

describe("Escrow Payout Mathematics", () => {
  it("computes standard payouts correctly", () => {
    // $100 sale + $5 shipping - $5 fee
    const payout = calculateNetPayout(10000, 500, 500);
    expect(payout).toBe(10000); // 10,000 cents
  });

  it("prevents negative payout calculations structurally", () => {
    // $5 sale + $0 shipping - $10 fee. Mathematically impossible natively, but validates constraints
    expect(() => calculateNetPayout(500, 0, 1000)).toThrowError("Calculated net payout resulted in a negative value. Escrow blocked.");
  });

  it("blocks floating point logic through integer constraints natively rejecting negative inputs", () => {
    expect(() => calculateNetPayout(-100, 500, 500)).toThrowError("Financial values cannot be negative.");
  });
});
