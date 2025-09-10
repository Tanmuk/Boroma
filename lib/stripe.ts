// lib/stripe.ts
import Stripe from "stripe";

// Avoid re-creating the client on hot reloads in dev
const globalForStripe = global as unknown as { stripe?: Stripe };

export const stripe =
  globalForStripe.stripe ??
  new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2024-06-20",
  });

if (process.env.NODE_ENV !== "production") globalForStripe.stripe = stripe;
