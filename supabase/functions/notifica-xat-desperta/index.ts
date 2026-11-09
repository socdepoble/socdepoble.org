/* global Deno, EdgeRuntime */
/* Keep verify_jwt enabled for this user-facing function. */
import { creaDespertador } from './gestor.js';
import { creaGestor } from '../notifica-xat/gestor.js';
import { creaEnviadorsNatius } from '../notifica-xat/natius.js';
const env = {
  SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  SDP_CRON_SECRET: Deno.env.get('SDP_CRON_SECRET'),
  SDP_PUSH_ACTIU: Deno.env.get('SDP_PUSH_ACTIU'),
  SDP_PUSH_VAPID_PUBLICA: Deno.env.get('SDP_PUSH_VAPID_PUBLICA'),
  SDP_PUSH_VAPID_PRIVADA: Deno.env.get('SDP_PUSH_VAPID_PRIVADA'),
  SDP_PUSH_VAPID_SUBJECTE: Deno.env.get('SDP_PUSH_VAPID_SUBJECTE'),
  SDP_APNS_EQUIP: Deno.env.get('SDP_APNS_EQUIP'),
  SDP_APNS_CLAU_ID: Deno.env.get('SDP_APNS_CLAU_ID'),
  SDP_APNS_CLAU_P8: Deno.env.get('SDP_APNS_CLAU_P8'),
  SDP_APNS_TOPIC: Deno.env.get('SDP_APNS_TOPIC'),
  SDP_APNS_ENTORN: Deno.env.get('SDP_APNS_ENTORN'),
  SDP_FCM_COMPTE_SERVEI: Deno.env.get('SDP_FCM_COMPTE_SERVEI')
};
Deno.serve(creaDespertador({ env, worker: creaGestor({ env, creaEnviadorsNatius }), background: (task) => EdgeRuntime.waitUntil(task) }));
