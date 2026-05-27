/**
 * Payment integration scaffold — İyzico / Stripe
 * Implement when checkout flow is activated.
 */

export type PaymentProvider = "iyzico" | "stripe";

export type CheckoutSessionInput = {
  leadId: string;
  amount: number;
  currency: "TRY";
  customerEmail?: string;
  customerPhone: string;
  description: string;
};

export async function createCheckoutSession(
  _provider: PaymentProvider,
  _input: CheckoutSessionInput
): Promise<{ url: string; sessionId: string } | null> {
  // TODO: Wire İyzico Checkout Form or Stripe Checkout Session
  if (process.env.NODE_ENV === "development") {
    console.warn("[payments] Checkout not configured yet");
  }
  return null;
}
