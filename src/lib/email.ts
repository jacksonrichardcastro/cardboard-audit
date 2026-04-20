import { Resend } from "resend";

import { env } from "@/env";

// Will explicitly crash via env schema if missing (unless optional depending on exact environment logic)
const resend = new Resend(env.RESEND_API_KEY);

export async function sendOrderDeliveryNotification(buyerEmail: string, orderId: number, trackingNo: string) {
  try {
    if (!env.RESEND_API_KEY) {
      console.log(`[MOCK EMAIL SENT] Alerted ${buyerEmail} that Order #${orderId} was safely delivered!`);
      return { success: true, mocked: true };
    }

    const { data, error } = await resend.emails.send({
      from: "CardBound Logistics <hello@cardbound.com>",
      to: buyerEmail,
      subject: `Your Grail has Arrived! (Order #${orderId})`,
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: auto; padding: 20px;">
          <h2 style="color: #10B981;">Delivery Confirmed!</h2>
          <p>Great news! The carrier has officially scanned your package as Delivered.</p>
          <p><strong>Tracking Number:</strong> ${trackingNo}</p>
          <br/>
          <p>The CardBound Escrow lock has successfully cleared. We hope you enjoy the newest addition to your collection!</p>
          <a href="${env.NEXT_PUBLIC_APP_URL}/orders/${orderId}" style="display:inline-block; padding: 12px 24px; background: #6D28D9; color: white; border-radius: 6px; text-decoration: none;">View Transparency Ledger</a>
        </div>
      `,
    });

    if (error) {
      console.error("[RESEND_API_ERROR]", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("[INTERNAL_EMAIL_ERROR]", error);
    return { success: false, error };
  }
}
