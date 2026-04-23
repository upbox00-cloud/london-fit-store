const { sendMetaEvent } = require("./meta-capi");

function getClientIp(event) {
  return (
    event.headers["x-nf-client-connection-ip"] ||
    event.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    event.headers["client-ip"] ||
    ""
  );
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed." })
    };
  }

  try {
    const payload = JSON.parse(event.body || "{}");

    await sendMetaEvent({
      eventName: payload.event_name,
      eventId: payload.event_id,
      eventSourceUrl: payload.event_source_url,
      userData: {
        client_ip_address: getClientIp(event),
        client_user_agent: event.headers["user-agent"],
        fbp: payload.fbp,
        fbc: payload.fbc
      },
      customData: payload.custom_data
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };
  } catch (error) {
    console.error("Meta browser event error:", error);

    return {
      statusCode: 200,
      body: JSON.stringify({ received: false })
    };
  }
};
