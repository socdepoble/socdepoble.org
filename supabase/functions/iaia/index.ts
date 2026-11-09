/* global Deno, EdgeRuntime */
import {creaGestorIAIA} from './gestor.js';
import {creaGestor as creaGestorAvisos} from '../notifica-xat/gestor.js';
import {creaEnviadorsNatius} from '../notifica-xat/natius.js';
import {creaWakePostcommit} from '../notifica-xat/postcommit.js';
const keys=['SUPABASE_URL','SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','SDP_IAIA_ACTIVA','SDP_IAIA_ORIGIN','SDP_IAIA_ORIGINS','SDP_IAIA_TENANT','SDP_IAIA_MODEL_ENDPOINT','SDP_IAIA_MODEL','SDP_IAIA_MODEL_TOKEN',
  'SDP_CRON_SECRET','SDP_PUSH_ACTIU','SDP_PUSH_VAPID_PUBLICA','SDP_PUSH_VAPID_PRIVADA','SDP_PUSH_VAPID_SUBJECTE','SDP_APNS_EQUIP','SDP_APNS_CLAU_ID','SDP_APNS_CLAU_P8','SDP_APNS_TOPIC','SDP_APNS_ENTORN','SDP_FCM_COMPTE_SERVEI'];
const env=Object.fromEntries(keys.map(k=>[k,Deno.env.get(k)]));
const worker=creaGestorAvisos({env,creaEnviadorsNatius});
const wakeAfterPersist=creaWakePostcommit({env,worker,background:task=>EdgeRuntime.waitUntil(task)});
Deno.serve(creaGestorIAIA({env,wakeAfterPersist}));
