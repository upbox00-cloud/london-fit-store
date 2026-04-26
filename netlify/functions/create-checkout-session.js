const Stripe = require("stripe");

const allowedColours = new Set(["Mocha Taupe", "Rose Pink", "Classic Black", "Soft Cream"]);
const allowedSizes = new Set(["S", "M", "L", "XL"]);
const colourImageMap = {
  "Mocha Taupe": "model-taupe.jpg",
  "Rose Pink": "model-pink.jpg",
  "Classic Black": "model-black.jpg",
  "Soft Cream": "model-cream.jpg"
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

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2026-02-25.clover"
    });
    const payload = JSON.parse(event.body || "{}");
    const safeColour = allowedColours.has(payload.colour) ? payload.colour : "Mocha Taupe";
    const safeSize = allowedSizes.has(payload.size) ? payload.size : "S";
    const safeQuantity = Math.min(9, Math.max(1, Number.parseInt(payload.quantity, 10) || 1));
    const safePurchaseEventId = String(payload.purchase_event_id || "").slice(0, 120);
    const siteUrl = process.env.SITE_URL || process.env.URL || process.env.DEPLOY_PRIME_URL || "http://localhost:8888";
    const selectedImage = colourImageMap[safeColour] || "model-taupe.jpg";
    const totalAmount = 2299 * safeQuantity;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      submit_type: "pay",
      success_url: `${siteUrl}/?checkout=success&session_id={CHECKOUT_SESSION_ID}&qty=${safeQuantity}&total=${(totalAmount / 100).toFixed(2)}&purchase_event_id=${encodeURIComponent(safePurchaseEventId)}`,
      cancel_url: `${siteUrl}/?checkout=cancel`,
      customer_creation: "always",
      billing_address_collection: "required",
      phone_number_collection: {
        enabled: true
      },
      shipping_address_collection: {
        allowed_countries: ["GB"]
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: 0,
              currency: "gbp"
            },
            display_name: "Free UK Shipping",
            delivery_estimate: {
              minimum: {
                unit: "business_day",
                value: 5
              },
              maximum: {
                unit: "business_day",
                value: 10
              }
            }
          }
        }
      ],
      payment_intent_data: {
        metadata: {
          colour: safeColour,
          size: safeSize,
          quantity: String(safeQuantity),
          purchase_event_id: safePurchaseEventId
        }
      },
      line_items: [
        {
          quantity: safeQuantity,
          price_data: {
            currency: "gbp",
            unit_amount: 2299,
            product_data: {
              name: "London Fit Sculpt Flare Leggings",
              description: `Colour: ${safeColour} | Size: ${safeSize} | Quantity: ${safeQuantity} | Total: GBP ${(totalAmount / 100).toFixed(2)}`,
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
        quantity: String(safeQuantity),
        store_name: "London Fit",
        order_email_flow: "processing_confirmation",
        purchase_event_id: safePurchaseEventId
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
