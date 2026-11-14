# Martini · MVP

PWA estática (sin build): `index.html`, `app.js`, `styles.css` (tokens del prototipo v12), `app.css`.
Backend: Supabase. Pegar `supabase/schema.sql` en el SQL Editor y completar `config.js` con el Project URL y la anon key.
En Supabase > Authentication > Sign In / Providers > Email, apagar "Confirm email".
Código de invitación por defecto: `BARRA-01` (tabla `codes`).

Pruebas: `supabase/test/` (reglas de la barra contra Postgres local) y `node test/smoke.js <carpeta>` (recorrido completo con cliente falso).
