# Despliegue de la web de reservas (Vercel + Supabase + Resend)

Tiempo estimado: 30-45 minutos. Todo tiene plan gratuito suficiente para empezar.

## 1. Supabase (base de datos)
1. Crea una cuenta en https://supabase.com y un proyecto nuevo. **Región: Europa** (p. ej. Frankfurt o París), por el RGPD.
2. Abre **SQL Editor → New query**, pega el contenido de `supabase/migrations/20261013000000_inicial.sql` y pulsa **Run**. Repite con `supabase/migrations/20261014000000_reservas.sql`.
3. En **Project Settings → API** copia: `Project URL`, la clave `anon public` y la clave `service_role` (esta última es secreta).
4. Para ver las reservas mientras no exista el panel: **Table Editor → reservas**.

## 2. Resend (correo de aviso)
1. Crea una cuenta en https://resend.com.
2. **Domains → Add domain** con tu dominio y añade los registros DNS que te indique (si aún no tienes dominio, puedes probar enviando solo a tu propio correo con el remitente `onboarding@resend.dev`).
3. **API Keys → Create API key** y cópiala.

## 3. GitHub (código)
1. Crea un repositorio **privado** en GitHub (p. ej. `granjafacil`).
2. Dime el nombre y lo subo yo desde aquí (o súbelo tú con `git push`).

## 4. Vercel (publicación)
1. Entra en https://vercel.com con tu cuenta de GitHub → **Add New → Project** → elige el repositorio.
2. En **Environment Variables** añade (los valores de los pasos 1 y 2):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `EMAIL_FROM` (p. ej. `GranjaFácil <hola@tudominio.es>` o `GranjaFácil <onboarding@resend.dev>`)
   - `EMAIL_OPERADOR` (tu correo)
   - `NEXT_PUBLIC_APP_URL` (la URL que te dé Vercel, p. ej. `https://granjafacil.vercel.app`)
3. **Deploy**. En 2-3 minutos tendrás la URL de prueba.
4. En **Settings → Functions** elige la región `fra1` (Frankfurt) para que el servidor esté en la UE.

## 5. Comprobar
1. Abre la URL en el móvil, haz una reserva de prueba.
2. Debe aparecer en Supabase (tabla `reservas`) y llegarte el correo con el enlace de WhatsApp.
3. Borra la reserva de prueba en Supabase.

## Antes de anunciarla
- Rellena tu nombre, NIF y correo de contacto (aparecen en la política de privacidad). Hasta que exista el panel de configuración, en Supabase: tabla `configuracion`, fila con clave `operador` y valor `{"nombre":"…","nif":"…","email":"…","telefono":"…"}`.
- Revisa los textos de privacidad con un asesor (están marcados como provisionales).
- Dominio propio (opcional): en Vercel, **Settings → Domains**.
