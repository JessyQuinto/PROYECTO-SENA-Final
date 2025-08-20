type BrevoSender = { email: string; name?: string };
type BrevoRecipient = { email: string; name?: string };

export async function sendWithBrevo(params: {
  sender: BrevoSender;
  to: BrevoRecipient[];
  subject: string;
  htmlContent: string;
  textContent?: string;
}) {
  const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
  if (!BREVO_API_KEY) throw new Error("Falta BREVO_API_KEY en variables de entorno");

  const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: params.sender,
      to: params.to,
      subject: params.subject,
      htmlContent: params.htmlContent,
      ...(params.textContent ? { textContent: params.textContent } : {}),
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Brevo error ${resp.status}: ${errText}`);
  }
  return resp.json();
}


