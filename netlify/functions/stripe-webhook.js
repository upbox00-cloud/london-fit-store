const Stripe = require("stripe");
const { sendMetaEvent } = require("./meta-capi");

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatAmount(amountTotal, currency) {
  const amount = Number(amountTotal || 0) / 100;
  const safeCurrency = String(currency || "gbp").toUpperCase();
  return `${safeCurrency} ${amount.toFixed(2)}`;
}

function numericAmount(amountTotal) {
  return Number((Number(amountTotal || 0) / 100).toFixed(2));
}

async function sendProcessingEmail({ to, order }) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.ORDER_FROM_EMAIL;

  if (!resendApiKey || !fromEmail || !to) {
    return;
  }

  const supportEmail = process.env.SUPPORT_EMAIL || fromEmail;
  const storeName = process.env.STORE_NAME || "London Fit";
  const customerName = order.customerName || "there";
  const html = `
    <div style="font-family:Arial,sans-serif;background:#f7f3ff;padding:24px;color:#1b1530;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e8ddff;">
        <div style="padding:28px 28px 18px;background:linear-gradient(135deg,#ff4f93,#6cc6ff);color:#140b22;">
          <div style="font-size:12px;letter-spacing:1.8px;text-transform:uppercase;font-weight:700;">${escapeHtml(storeName)}</div>
          <h1 style="margin:10px 0 0;font-size:28px;line-height:1.05;">Your order is now being processed</h1>
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">Hi ${escapeHtml(customerName)},</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">Thank you for shopping with ${escapeHtml(storeName)}. We have received your payment successfully and your order is now being processed by our team.</p>
          <div style="margin:20px 0;padding:18px;border-radius:16px;background:#f8f5ff;border:1px solid #ece3ff;">
            <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6b608a;margin-bottom:10px;">Order summary</div>
            <p style="margin:0 0 8px;font-size:15px;line-height:1.6;"><strong>Product:</strong> London Fit(TM) Sculpt Flare Leggings</p>
            <p style="margin:0 0 8px;font-size:15px;line-height:1.6;"><strong>Colour:</strong> ${escapeHtml(order.colour)}</p>
            <p style="margin:0 0 8px;font-size:15px;line-height:1.6;"><strong>Size:</strong> ${escapeHtml(order.size)}</p>
            <p style="margin:0 0 8px;font-size:15px;line-height:1.6;"><strong>Quantity:</strong> ${escapeHtml(order.quantity)}</p>
            <p style="margin:0 0 8px;font-size:15px;line-height:1.6;"><strong>Total paid:</strong> ${escapeHtml(order.total)}</p>
            <p style="margin:0;font-size:15px;line-height:1.6;"><strong>Order reference:</strong> ${escapeHtml(order.reference)}</p>
          </div>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">We will send your tracking code as soon as your order is dispatched.</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">Thank you for trusting ${escapeHtml(storeName)}.</p>
          <p style="margin:0;font-size:14px;line-height:1.7;color:#6b608a;">If you need help, reply to this email or contact ${escapeHtml(supportEmail)}.</p>
        </div>
      </div>
    </div>
  `;

  const text = [
    `Hi ${customerName},`,
    "",
    `Thank you for shopping with ${storeName}.`,
    "We have received your payment successfully and your order is now being processed by our team.",
    "",
    "Order summary:",
    `- Product: London Fit(TM) Sculpt Flare Leggings`,
    `- Colour: ${order.colour}`,
    `- Size: ${order.size}`,
    `- Quantity: ${order.quantity}`,
    `- Total paid: ${order.total}`,
    `- Order reference: ${order.reference}`,
    "",
    "We will send your tracking code as soon as your order is dispatched.",
    "",
    `Thank you for trusting ${storeName}.`
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      reply_to: supportEmail,
      subject: "Your London Fit order is being processed",
      html,
      text
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend email failed: ${response.status} ${errorText}`);
  }
}

exports.handler = async (event) => {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    return {
      statusCode: 500,
      body: "Stripe webhook is not configured."
    };
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2026-02-25.clover"
  });
  const signature = event.headers["stripe-signature"] || event.headers["Stripe-Signature"];

  if (!signature) {
    return {
      statusCode: 400,
      body: "Missing Stripe signature."
    };
  }

  try {
    const rawBody = event.isBase64Encoded ? Buffer.from(event.body || "", "base64") : Buffer.from(event.body || "", "utf8");
    const stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    if (stripeEvent.type === "checkout.session.completed") {
      const session = stripeEvent.data.object;
      const customerEmail = session.customer_details?.email || session.customer_email;
      const customerName = session.customer_details?.name || "Customer";
      const customerPhone = session.customer_details?.phone;
      const order = {
        colour: session.metadata?.colour || "Mocha Taupe",
        size: session.metadata?.size || "S",
        quantity: session.metadata?.quantity || "1",
        total: formatAmount(session.amount_total, session.currency),
        reference: session.payment_intent || session.id,
        customerName
      };

      await sendProcessingEmail({
        to: customerEmail,
        order
      });

      try {
        await sendMetaEvent({
          eventName: "Purchase",
          eventId: session.metadata?.purchase_event_id || session.id,
          eventSourceUrl: process.env.SITE_URL || process.env.URL || session.success_url,
          userData: {
            email: customerEmail,
            phone: customerPhone
          },
          customData: {
            content_name: `London Fit Sculpt Flare Leggings - ${order.colour} / ${order.size}`,
            content_category: "Leggings",
            content_type: "product",
            content_ids: [`london-fit-sculpt-flare-legging-${order.colour.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${order.size.toLowerCase()}`],
            value: numericAmount(session.amount_total),
            currency: String(session.currency || "gbp").toUpperCase(),
            contents: [
              {
                id: `london-fit-sculpt-flare-legging-${order.colour.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${order.size.toLowerCase()}`,
                quantity: Number.parseInt(order.quantity, 10) || 1,
                item_price: 22.99
              }
            ]
          }
        });
      } catch (metaError) {
        console.error("Meta Purchase CAPI error:", metaError);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return {
      statusCode: 400,
      body: `Webhook Error: ${error.message}`
    };
  }
};
