import Stripe from "stripe";
import { supabaseAdmin } from "../../../server/supabaseAdmin";

export const config = {
  api: { bodyParser: false },
};

function buffer(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readable.on("data", (chunk) => chunks.push(chunk));
    readable.on("end", () => resolve(Buffer.concat(chunks)));
    readable.on("error", reject);
  });
}

export default async function handler(req, res) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

  const sig = req.headers["stripe-signature"];
  const rawBody = await buffer(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const anuncioId = session?.metadata?.anuncioId;

      if (anuncioId) {
        // publicar anuncio
        const { error } = await supabaseAdmin
          .from("anuncios")
          .update({ status: "published", paid_at: new Date().toISOString() })
          .eq("id", anuncioId);

        if (error) throw error;
      }
    }

    res.json({ received: true });
  } catch (e) {
    res.status(500).json({ error: e.message || "Server error" });
  }
}
