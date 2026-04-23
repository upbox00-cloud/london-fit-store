const crypto = require("crypto");

function hashValue(value) {
  const cleanValue = String(value || "").trim().toLowerCase();

  if (!cleanValue) {
    return undefined;
  }

  return crypto.createHash("sha256").update(cleanValue).digest("hex");
}

function cleanObject(value) {
  return Object.fromEntries(
    Object.entries(value || {}).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null && entryValue !== "")
  );
}

async function sendMetaEvent({ eventName, eventId, eventSourceUrl, userData = {}, customData = {} }) {
  const pixelId = process.env.META_PIXEL_ID || "1379788584166728";
  const accessToken = process.env.META_ACCESS_TOKEN;
  const graphVersion = process.env.META_GRAPH_VERSION || "v21.0";

  if (!accessToken || !pixelId || !eventName) {
    return { skipped: true };
  }

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: "website",
        event_source_url: eventSourceUrl,
        user_data: cleanObject({
          client_ip_address: userData.client_ip_address,
          client_user_agent: userData.client_user_agent,
          fbp: userData.fbp,
          fbc: userData.fbc,
          em: hashValue(userData.email),
          ph: hashValue(userData.phone)
        }),
        custom_data: cleanObject(customData)
      }
    ]
  };

  const response = await fetch(`https://graph.facebook.com/${graphVersion}/${pixelId}/events?access_token=${accessToken}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`Meta CAPI error: ${response.status} ${JSON.stringify(body)}`);
  }

  return body;
}

module.exports = {
  sendMetaEvent
};
