import "server-only";
import Stripe from "stripe";
import { env } from "./env";

export function stripe() {
  if (!env.stripeSecretKey) throw new Error("Falta STRIPE_SECRET_KEY");
  return new Stripe(env.stripeSecretKey);
}
