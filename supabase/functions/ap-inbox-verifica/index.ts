// @ts-nocheck -- JavaScript pla dins de .ts: el llig ESLint (espree) i Deno no hi demana tipus.
/* B5 (marató 261101_2143; P1-23 fase 2 / P2-07) · L'embolcall Deno de
   ap-inbox-verifica: tota la lògica és a gestor.js (Vitest). NO desplegada; el
   desplegament és del Mestre, mai d'un agent (supabase/README.md, «Funció
   ap-inbox-verifica»), amb --no-verify-jwt (els servidors remots no porten JWT).
   Desplegada, naix APAGADA: només SDP_AP_ACTIVA=1 l'encén.
   Només es lligen les variables que fa servir el gestor. El resoledor és
   Deno.resolveDns si l'entorn el té (un nom que no existix, NotFound, és cap
   adreça); si no, el gestor tanca les obtencions i els enviaments (fallada
   tancada). EdgeRuntime.waitUntil, si existix, deixa acabar la passada curta
   de la cua després de respondre. */
/* global Deno, EdgeRuntime */
import { creaGestor } from './gestor.js';

const NOMS = [
  'SDP_AP_ACTIVA', 'SDP_AP_ORIGEN', 'SDP_AP_INBOX_PUBLICA', 'SDP_AP_CLAUS_PRIVADES', 'SDP_AP_NODES_CONFIANCA',
  'SDP_CRON_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'
];

const variable = (nom) => {
  try {
    return Deno.env.get(nom) ?? undefined;
  } catch {
    return undefined;
  }
};

const resolDns = typeof Deno.resolveDns === 'function'
  ? async (host, tipus, { signal } = {}) => {
    try {
      return await Deno.resolveDns(host, tipus, { signal });
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) return [];
      throw error;
    }
  }
  : null;

const espera = typeof EdgeRuntime !== 'undefined' && typeof EdgeRuntime?.waitUntil === 'function'
  ? (promesa) => EdgeRuntime.waitUntil(promesa)
  : null;

Deno.serve(creaGestor({ env: Object.fromEntries(NOMS.map((nom) => [nom, variable(nom)])), resolDns, espera }));
