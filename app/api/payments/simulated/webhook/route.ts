import { processSignedSimulatedWebhook } from "@/lib/payments/simulator";

export async function POST(request: Request) {
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > 16_384) {
    return Response.json({ received: false, error: "Testwebhook is te groot." }, { status: 413 });
  }
  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody, "utf8") > 16_384) {
    return Response.json({ received: false, error: "Testwebhook is te groot." }, { status: 413 });
  }
  try {
    const result = await processSignedSimulatedWebhook(
      rawBody,
      request.headers.get("x-tkua-test-timestamp"),
      request.headers.get("x-tkua-test-signature"),
    );
    return Response.json(
      result.ok ? { received: true } : { received: false, error: result.message },
      { status: result.status, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ received: false, error: "De lokale testsimulator is niet beschikbaar." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
