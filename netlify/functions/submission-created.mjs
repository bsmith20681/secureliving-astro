export default async (event) => {
  const { payload } = JSON.parse(event.body);
  const webhookUrl = process.env.MAKE_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error("MAKE_WEBHOOK_URL environment variable is not configured");
    return { statusCode: 500, body: "Webhook URL not configured" };
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      form_name: payload.form_name,
      submitted_at: payload.created_at,
      data: payload.data,
    }),
  });

  if (!response.ok) {
    console.error(`Webhook failed with status ${response.status}`);
    return { statusCode: 500, body: "Webhook delivery failed" };
  }

  return { statusCode: 200, body: "OK" };
};
