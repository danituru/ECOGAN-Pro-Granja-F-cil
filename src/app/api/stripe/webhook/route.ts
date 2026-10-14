import { NextResponse, type NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { env } from "@/lib/env";
import { confirmarPago } from "@/lib/pagos";

/** Aviso de Stripe cuando se completa un pago (también si el cliente cierra la ventana antes de volver). */
export async function POST(request: NextRequest) {
  const firma = request.headers.get("stripe-signature");
  if (!firma || !env.stripeWebhookSecret) return NextResponse.json({ error: "sin firma" }, { status: 400 });
  const cuerpo = await request.text();
  let evento;
  try {
    evento = stripe().webhooks.constructEvent(cuerpo, firma, env.stripeWebhookSecret);
  } catch {
    return NextResponse.json({ error: "firma no válida" }, { status: 400 });
  }
  if (evento.type === "checkout.session.completed" || evento.type === "checkout.session.async_payment_succeeded") {
    const r = await confirmarPago(evento.data.object.id, { base: request.nextUrl.origin });
    if (!r.ok) console.warn("Pago no confirmado todavía", evento.data.object.id);
  }
  return NextResponse.json({ recibido: true });
}
