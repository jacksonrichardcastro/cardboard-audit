import { describe, it, expect } from "vitest";
import {
  canTransition,
  nextStatesFor,
  parseOrderState,
  ORDER_STATES,
} from "@/lib/orders/state-machine";

/**
 * Unit tests for the order state machine. No DB, no network — the module
 * is pure, and every call site in the app routes through canTransition()
 * so the edge cases here are load-bearing.
 */

describe("state machine: canTransition", () => {
  it("allows seller to PAID -> PACKAGED (UI shortcut path)", () => {
    expect(canTransition("PAID", "PACKAGED", "seller")).toBe(true);
  });

  it("allows seller to PAID -> SELLER_RECEIVED (explicit path)", () => {
    expect(canTransition("PAID", "SELLER_RECEIVED", "seller")).toBe(true);
  });

  it("forbids buyer from making seller-only transitions", () => {
    expect(canTransition("PAID", "PACKAGED", "buyer")).toBe(false);
    expect(canTransition("PACKAGED", "SHIPPED", "buyer")).toBe(false);
  });

  it("forbids seller from making system-only transitions", () => {
    // carrier webhook drives IN_TRANSIT -> PENDING_BUYER_CONFIRM, not the seller
    expect(canTransition("IN_TRANSIT", "PENDING_BUYER_CONFIRM", "seller")).toBe(false);
    expect(canTransition("SHIPPED", "IN_TRANSIT", "seller")).toBe(false);
  });

  it("allows system to flip SHIPPED -> IN_TRANSIT and IN_TRANSIT -> PENDING_BUYER_CONFIRM", () => {
    expect(canTransition("SHIPPED", "IN_TRANSIT", "system")).toBe(true);
    expect(canTransition("IN_TRANSIT", "PENDING_BUYER_CONFIRM", "system")).toBe(true);
  });

  it("allows buyer to confirm receipt from PENDING_BUYER_CONFIRM", () => {
    expect(canTransition("PENDING_BUYER_CONFIRM", "BUYER_CONFIRMED", "buyer")).toBe(true);
  });

  it("allows system (auto-confirm sweeper) to confirm receipt", () => {
    expect(canTransition("PENDING_BUYER_CONFIRM", "BUYER_CONFIRMED", "system")).toBe(true);
  });

  it("forbids confirming an order that hasn't reached PENDING_BUYER_CONFIRM yet", () => {
    expect(canTransition("PAID", "BUYER_CONFIRMED", "buyer")).toBe(false);
    expect(canTransition("SHIPPED", "BUYER_CONFIRMED", "buyer")).toBe(false);
    expect(canTransition("SHIPPED", "BUYER_CONFIRMED", "system")).toBe(false);
  });

  it("allows buyers to open disputes from any pre-confirmation state", () => {
    const preConfirm: Array<"PAID" | "SELLER_RECEIVED" | "PACKAGED" | "SHIPPED" | "IN_TRANSIT" | "PENDING_BUYER_CONFIRM"> =
      ["PAID", "SELLER_RECEIVED", "PACKAGED", "SHIPPED", "IN_TRANSIT", "PENDING_BUYER_CONFIRM"];
    for (const from of preConfirm) {
      expect(canTransition(from, "DISPUTED", "buyer")).toBe(true);
    }
  });

  it("keeps REFUNDED terminal — no outbound transitions", () => {
    for (const to of ORDER_STATES) {
      for (const actor of ["seller", "buyer", "system", "admin"] as const) {
        expect(canTransition("REFUNDED", to, actor)).toBe(false);
      }
    }
  });

  it("only admin can resolve a DISPUTED order", () => {
    expect(canTransition("DISPUTED", "REFUNDED", "admin")).toBe(true);
    expect(canTransition("DISPUTED", "BUYER_CONFIRMED", "admin")).toBe(true);
    expect(canTransition("DISPUTED", "REFUNDED", "buyer")).toBe(false);
    expect(canTransition("DISPUTED", "REFUNDED", "seller")).toBe(false);
    expect(canTransition("DISPUTED", "REFUNDED", "system")).toBe(false);
  });
});

describe("state machine: nextStatesFor", () => {
  it("returns the seller's menu from PAID", () => {
    const next = nextStatesFor("PAID", "seller");
    expect(next).toContain("PACKAGED");
    expect(next).toContain("SELLER_RECEIVED");
    // seller never sees DISPUTED in their affordances; that's a buyer/admin path
    expect(next).not.toContain("DISPUTED");
  });

  it("returns an empty list from REFUNDED", () => {
    expect(nextStatesFor("REFUNDED", "admin")).toEqual([]);
    expect(nextStatesFor("REFUNDED", "seller")).toEqual([]);
  });
});

describe("state machine: parseOrderState", () => {
  it("narrows known strings to the OrderState type", () => {
    expect(parseOrderState("PAID")).toBe("PAID");
    expect(parseOrderState("BUYER_CONFIRMED")).toBe("BUYER_CONFIRMED");
  });

  it("returns undefined for unknown strings (including legacy DELIVERED)", () => {
    // DELIVERED was an older state that shows up in some frontend code —
    // if it ever reaches the machine unconverted, we must reject it
    // rather than silently treat it as valid.
    expect(parseOrderState("DELIVERED")).toBeUndefined();
    expect(parseOrderState("")).toBeUndefined();
    expect(parseOrderState("paid")).toBeUndefined(); // case-sensitive
  });
});
