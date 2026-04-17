const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const Stripe = require("stripe");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn("Missing STRIPE_SECRET_KEY. Stripe checkout endpoint will not work until it is configured.");
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

app.use(express.json());
app.use(express.static(__dirname));

const allowedColours = new Set(["Mocha Taupe", "Rose Pink", "Classic Black", "Soft Cream"]);
const allowedSizes = new Set(["S", "M", "L", "XL"]);
const colourImageMap = {
  "Mocha Taupe": "model-taupe.png",
  "Rose Pink": "model-pink.png",
  "Classic Black": "model-black.png",
  "Soft Cream": "model-cream.png"
};

app.post("/api/create-checkout-session", async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe is not configured yet." });
    }

    const { colour, size, quantity } = req.body || {};

    const safeColour = allowedColours.has(colour) ? colour : "Mocha Taupe";
    const safeSize = allowedSizes.has(size) ? size : "S";
    const safeQuantity = Math.min(9, Math.max(1, Number.parseInt(quantity, 10) || 1));

    const origin = `${req.protocol}://${req.get("host")}`;
    const selectedImage = colourImageMap[safeColour] || "model-taupe.png";
    const totalAmount = 2299 * safeQuantity;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      submit_type: "pay",
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=cancel`,
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
              name: `London Fit Sculpt Leggings x${safeQuantity}`,
              description: `Colour: ${safeColour} | Size: ${safeSize} | Qty: ${safeQuantity} | Total: £${(totalAmount / 100).toFixed(2)}`,
              images: [`${origin}/images/${selectedImage}`],
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

    res.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout session error:", error);
    res.status(500).json({ error: "Unable to start checkout right now." });
  }
});

app.listen(port, () => {
  console.log(`London Fit store running at http://localhost:${port}`);
});
