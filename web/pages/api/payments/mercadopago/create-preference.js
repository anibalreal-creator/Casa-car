
export default async function handler(req, res) {
  try {
    const { listingId } = req.body;

    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      return res.status(500).json({
        error: "Falta configurar MERCADOPAGO_ACCESS_TOKEN"
      });
    }

    const preference = {
      items: [
        {
          title: "Casa-Car Premium",
          quantity: 1,
          currency_id: "ARS",
          unit_price: 100,
        },
      ],
      back_urls: {
        success: "https://casa-car-two.vercel.app/mis-anuncios?mp=success",
        failure: "https://casa-car-two.vercel.app/mis-anuncios?mp=failure",
        pending: "https://casa-car-two.vercel.app/mis-anuncios?mp=pending",
      },
      metadata: { listing_id: listingId, source: 'casa-car', feature: 'featured_listing' },
      notification_url: "https://casa-car-two.vercel.app/api/payments/mercadopago/webhook",
      external_reference: `listing:${listingId}`,
    };

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preference),
    });

    const data = await response.json();

    return res.status(200).json({
      checkout_url: data.init_point,
      chosen_checkout_url: data.init_point,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creando preferencia" });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: '4mb',
  },
};
