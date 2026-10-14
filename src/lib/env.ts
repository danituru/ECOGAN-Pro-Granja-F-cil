/**
 * Variables de entorno. Si falta alguna, la aplicación funciona en "modo pruebas":
 * la landing, el comprobador y el formulario de demostración funcionan sin servicios externos.
 */
export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "GranjaFácil <hola@example.com>",
  emailOperador: process.env.EMAIL_OPERADOR ?? "",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  cronSecret: process.env.CRON_SECRET ?? "",
};

export const hayBaseDeDatos = () => Boolean(env.supabaseUrl && env.supabaseAnonKey);
export const hayStripe = () => Boolean(env.stripeSecretKey);
export const hayEmail = () => Boolean(env.resendApiKey);
