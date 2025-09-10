// pages/api/checkout/start.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

// Helper: figure out your public base URL (works on Vercel)
function getSiteUrl(req: NextApiRequest) {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const proto = (req.headers["x-forwarded-proto"] as string) || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "";
  return `${proto}://${host}`;
}

// Normalize phone -> digits only, keep leading +
function normalizePhone(phone?: string) {
  if (!phone) return "";
  const trimmed = phone.toString().trim();
  if (trimmed.startsWith("+")) {
    return "+" + trimmed.replace(/[^\d]/g, "");
  }
  return trimmed.replace(/[^\d]/g, "");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 1) Identify the signed-in user from the Supabase access token cookie or Authorization header
    const accessToken =
      (req.cookies && (req.cookies["sb-access-token"] as string)) ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : undefined);

    if (!accessToken) {
      return res.status(401).json({ error: "Not signed in" });
    }

    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    );

    const {
      data: { user },
      error: userErr,
    } = await supabaseAnon.auth.getUser(accessToken);

    if (userErr || !user) {
      return res.status(401).json({ error: "Invalid session" });
    }

    // 2) Get plan and optional phone from body
    //    plan must be "monthly" or "annual"
    const { plan, phone } = (req.body ?? {}) as {
      plan: "monthly" | "annual";
      phone?: string;
    };

    if (!plan || !["monthly", "annual"].includes(plan)) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    // Map plan -> Stripe Price IDs (set these in Vercel env)
    const priceId =
      plan === "monthly"
        ? process.env.STRIPE_PRICE_MONTHLY
        : process.env.STRIPE_PRICE_ANNUAL;

    if (!priceId) {
      return res
        .status(500)
        .json({ error: "Missing STRIPE_PRICE_MONTHLY/ANNUAL env vars" });
    }

    const siteUrl = getSiteUrl(req);
    const normalizedPhone = normalizePhone(phone);

    // 3) Create the Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      allow_promotion_codes: true, // LAUNCH40 works if you've created that in Stripe
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/signup?canceled=1`,
      // Helps us find the owner in webhooks
      client_reference_id: user.id,
      customer_email: user.email || undefined,
      metadata: {
        user_id: user.id,
        plan,
        phone: normalizedPhone,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan,
          phone: normalizedPhone,
        },
      },
    });

    // 4) Send Checkout URL back to the browser
    return res.status(200).json({ id: session.id, url: session.url });
  } catch (err: any) {
    console.error("checkout/start error:", err);
    return res.status(500).json({ error: err?.message || "Server error" });
  }
}
