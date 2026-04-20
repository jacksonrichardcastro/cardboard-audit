# Escrow Payout Mathematics

As mandated by **P0-8 Payout Math**, the Stripe Connect ledger operates mathematically off the following unified formula explicitly resolving the Escrow block across the platform:

```typescript
netPayoutCents = priceCentsAtSale + shippingCents - feeCents;
```

**Key Adjustments:**
- `shippingCents` has been intrinsically mapped directly to the vendor's ledger rather than disappearing.
- Standard Stripe processing fees (`~2.9% + 30¢`) natively subtract from the Platform's retained `feeCents` pool. The Seller does *not* absorb Stripe's network tax.
- Floating-point variations are functionally eliminated by storing all values strictly as integer Cents inside PostgreSQL.

**Execution Triggers (P0-7):**
The `stripe.transfers.create` command *only* fires explicitly when the Drizzle framework evaluates `BUYER_CONFIRMED` upon an order array, either manually executed by the Buyer's routing dashboard or automatically captured by the 72-hour `deliveredAt` cron job bounds.
