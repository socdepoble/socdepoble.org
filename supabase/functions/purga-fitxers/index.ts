/* T8 (261024; P0-20) · L'embolcall Deno de purga-fitxers: tota la lògica és a gestor.js (Vitest). Només rep les tres variables que fa servir. Desplegament amb --no-verify-jwt (supabase/README.md, «Funció purga-fitxers»). */
/* global Deno */
import { creaGestor } from './gestor.js';

Deno.serve(creaGestor({
  env: {
    SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
    SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    SDP_CRON_SECRET: Deno.env.get('SDP_CRON_SECRET')
  }
}));
