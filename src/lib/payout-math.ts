/**
 * P0-8: Escrow Payout Formula
 * Centralized, verifiable logic for moving dollars to Sellers.
 * Math expects arguments to be in exact cents to prevent floating point chaos.
 * 
 * Formula: Net Payout = Item Price + Collected Shipping - Platform Fee
 * Note: Platform natively absorbs initial Stripe processing fees in MVP tier.
 */

export function calculateNetPayout(priceCentsAtSale: number, shippingCents: number, feeCents: number): number {
  if (priceCentsAtSale < 0 || shippingCents < 0 || feeCents < 0) {
    throw new Error("Financial values cannot be negative.");
  }
  
  const netPayoutCents = priceCentsAtSale + shippingCents - feeCents;
  
  if (netPayoutCents < 0) {
    throw new Error("Calculated net payout resulted in a negative value. Escrow blocked.");
  }
  
  return netPayoutCents;
}
