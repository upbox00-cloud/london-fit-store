const Stripe = require("stripe");

const allowedColours = new Set(["Mocha Taupe", "Rose Pink", "Classic Black", "Soft Cream"]);
const allowedSizes = new Set(["S", "M", "L", "XL"]);
const colourImageMap = {
  "Mocha Taupe": "model-taupe.png",
  "Rose Pink": "model-pink.png",
  "Classic Black": "model-black.png",
  "Soft Cream": "model-cream.png"
};

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed." })
      };
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Stripe is not configured yet." })
      };
    }

    const stripe = new Stripe(stripeSecretKey);
    const payload = JSON.parse(event.body || "{}");
    const safeColour = allowedColours.has(payload.colour) ? payload.colour : "Mocha Taupe";
    const safeSize = allowedSizes.has(payload.size) ? payload.size : "S";
    const safeQuantity = Math.min(9, Math.max(1, Number.parseInt(payload.quantity, 10) || 1));
    const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || "http://localhost:8888";
    const selectedImage = colourImageMap[safeColour] || "model-taupe.png";
    const totalAmount = 2299 * safeQuantity;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      submit_type: "pay",
      success_url: `${siteUrl}/?checkout=success`,
      cancel_url: `${siteUrl}/?checkout=cancel`,
      billing_address_collection: "required",
      phone_number_collection: {
        enabled: true
      },
      shipping_address_collection: {
        allowed_countries: ["GB", "PT", "IE", "ES", "FR", "DE", "IT", "NL", "BE", "LU"]
      },
      line_items: [
        {
          quantity: safeQuantity,
          price_data: {
            currency: "gbp",
            unit_amount: 2299,
            product_data: {
              name: `London Fit™ Sculpt Flare Legging x${safeQuantity}`,
              description: `Colour: ${safeColour} | Size: ${safeSize} | Qty: ${safeQuantity} | Total: £${(totalAmount / 100).toFixed(2)}`,
              images: [`${siteUrl}/images/${selectedImage}`],
              metadata: {
                colour: safeColour,
                size: safeSize
              }
            }
          }
        }
      ],
      metadata: {
        colour: safeColour,
        size: safeSize,
        quantity: String(safeQuantity)
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url })
    };
  } catch (error) {
    console.error("Netlify Stripe checkout error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Unable to start checkout right now." })
    };
  }
};
