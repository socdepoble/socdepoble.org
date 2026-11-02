/* B5 (marató 261101_2143; P1-23 fase 2; spec B5-FEDERACIO §2.3) · El port del
   magatzem de la inbox (src/data/federacio/inboxActivityPub.js,
   creaMagatzemInboxEnMemoria) i el de la cua d'eixida (cuaLliurament.js,
   creaCuaEnMemoria) sobre les RPC public.ap_* de la migració
   supabase/migrations/2611020106_ap_inbox_persistencia_i_cua.sql (NO aplicada),
   per PostgREST amb la clau de servei.
   · Cada mètode és UNA crida POST <base>/rest/v1/rpc/<nom> amb paràmetres
     tipats (l'únic jsonb és el cos de l'Accept a ap_cua_encua) i un topall.
   · RPC_AP és el contracte: el nom i els paràmetres, en ordre, de cada RPC.
     La crida es nega si el cos no hi coincidix exactament, i les proves el
     comparen amb les signatures de la migració (magatzem.conformitat.test.js).
   · Errors: SDP-AP-QUOTA (54000) → RangeError amb el mateix missatge que la
     memòria; qualsevol altra cosa (xarxa, temps, una fila amb forma estranya,
     un error de PostgREST) → Error('magatzem_no_disponible'), sense el cos de
     PostgREST ni cap secret.
   · Cada fila que torna la base es valida i es reconstruïx camp a camp: cap
     spread d'un objecte remot. */
import { capcaleresDeServei } from '../purga-fitxers/gestor.js';
import { RETENCIO_ACTIVITAT_MS, RETENCIO_LAPIDA_MS, hostDeQuota } from '../../../src/data/federacio/inboxActivityPub.js';
import { CUA, finsAlTopall } from './cuaLliurament.js';

export const LIMITS_PER_DEFECTE = Object.freeze({ maximPerHost: 1000, maxim: 100_000, maximSeguidors: 10_000, maximAlertes: 10_000, maximIntents: CUA.MAXIM_INTENTS });

/* El contracte amb la migració: nom de cada RPC i els seus paràmetres, en l'ordre de la signatura. */
export const RPC_AP = Object.freeze({
  ap_inbox_reclama: Object.freeze(['p_activitat_id', 'p_actor', 'p_host', 'p_tipus', 'p_retencio_s', 'p_maxim_per_host', 'p_maxim']),
  ap_inbox_confirma: Object.freeze(['p_activitat_id']),
  ap_inbox_allibera: Object.freeze(['p_activitat_id']),
  ap_seguidor_desa: Object.freeze(['p_slug', 'p_actor', 'p_inbox', 'p_follow_id', 'p_accept_id', 'p_maxim']),
  ap_seguidor_retira: Object.freeze(['p_slug', 'p_actor', 'p_follow_id']),
  ap_actor_remot_retira: Object.freeze(['p_actor']),
  ap_alerta_desa: Object.freeze(['p_id', 'p_actor', 'p_via', 'p_activitat', 'p_tipus', 'p_url', 'p_nom', 'p_text', 'p_publicat', 'p_caduca', 'p_rebuda', 'p_maxim']),
  ap_alerta_retira: Object.freeze(['p_id', 'p_actor', 'p_activitat', 'p_lapida', 'p_lapida_s']),
  ap_alertes_vigents: Object.freeze(['p_ara']),
  ap_cua_encua: Object.freeze(['p_slug', 'p_inbox', 'p_activitat_id', 'p_cos']),
  ap_cua_reclama: Object.freeze(['p_limit']),
  ap_cua_resol: Object.freeze(['p_id', 'p_resultat', 'p_espera_s', 'p_error', 'p_maxim_intents']),
  ap_purga: Object.freeze([])
});

/* Els missatges de quota de la memòria, els mateixos que la migració posa darrere de «SDP-AP-QUOTA: ». */
export const MISSATGES_QUOTA = Object.freeze({ host: 'Quota de la inbox esgotada per a este origen.', ple: 'Magatzem de la inbox ple.' });
const PREFIX_QUOTA = 'SDP-AP-QUOTA: ';
const FORMA_URL = /^https?:\/\/[^\s/?#]+$/;
const RESULTATS = Object.freeze(['fet', 'reintent', 'fallit']);

const noDisponible = () => new Error('magatzem_no_disponible');
const enter = (valor, minim, maxim, perDefecte) => (Number.isSafeInteger(valor) ? Math.min(maxim, Math.max(minim, valor)) : perDefecte);
const esObjecte = (valor) => Boolean(valor) && typeof valor === 'object' && !Array.isArray(valor);
const textONull = (valor) => (valor === null || typeof valor === 'string' ? valor : undefined);
/* Un instant de la base (ISO amb +00:00) en l'ISO de la memòria, o undefined si no s'entén. */
const instant = (valor) => {
  if (typeof valor !== 'string') return undefined;
  const ms = Date.parse(valor);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : undefined;
};
const isoONull = (ms) => (Number.isFinite(ms) ? new Date(ms).toISOString() : null);

/* Un error de PostgREST: només la quota es tradueix; la resta, sense detall. */
function errorDeBase(cos) {
  const missatge = esObjecte(cos) && typeof cos.message === 'string' ? cos.message : '';
  if (esObjecte(cos) && cos.code === '54000' && missatge.startsWith(PREFIX_QUOTA)) {
    const text = missatge.slice(PREFIX_QUOTA.length);
    return new RangeError(text === MISSATGES_QUOTA.host ? MISSATGES_QUOTA.host : MISSATGES_QUOTA.ple);
  }
  return noDisponible();
}

/* La fila d'una alerta vigent, camp a camp, o llança. */
function alertaDeFila(f) {
  if (!esObjecte(f)) throw noDisponible();
  const alerta = {
    id: f.id, actor: f.actor, via: textONull(f.via), activitat: f.activitat, tipus: f.tipus, url: textONull(f.url),
    nom: f.nom, text: f.text, publicat: f.publicat === null ? null : instant(f.publicat), caduca: instant(f.caduca), rebuda: instant(f.rebuda)
  };
  const bona = typeof alerta.id === 'string' && typeof alerta.actor === 'string' && alerta.via !== undefined && typeof alerta.activitat === 'string'
    && (alerta.tipus === 'alerta' || alerta.tipus === 'bandol_urgent') && alerta.url !== undefined && typeof alerta.nom === 'string'
    && typeof alerta.text === 'string' && alerta.publicat !== undefined && alerta.caduca !== undefined && alerta.rebuda !== undefined;
  if (!bona) throw noDisponible();
  return alerta;
}

/* Una fila reclamada de la cua, camp a camp, o llança. */
function filaDeCua(f) {
  if (!esObjecte(f) || !Number.isSafeInteger(f.id) || f.id <= 0 || typeof f.slug !== 'string' || typeof f.inbox !== 'string'
    || typeof f.activitat_id !== 'string' || !esObjecte(f.cos) || !Number.isSafeInteger(f.intents) || f.intents < 0) throw noDisponible();
  return { id: f.id, slug: f.slug, inbox: f.inbox, activitat_id: f.activitat_id, cos: f.cos, intents: f.intents };
}

const boolea = (valor) => { if (typeof valor !== 'boolean') throw noDisponible(); return valor; };
const unDe = (valor, valors) => { if (!valors.includes(valor)) throw noDisponible(); return valor; };

/**
 * El magatzem i la cua sobre PostgREST. `base`: SUPABASE_URL; `clau`: la clau
 * de servei (només viatja a les capçaleres). `limits`: els sostres que reben
 * les RPC (enters; un valor estrany pren el per defecte).
 */
export function creaMagatzemPostgrest({ base, clau, fetch = globalThis.fetch, topallMs = 8000, limits = LIMITS_PER_DEFECTE } = {}) {
  let arrel = String(base ?? '').trim();
  while (arrel.endsWith('/')) arrel = arrel.slice(0, -1);
  const secret = String(clau ?? '').trim();
  if (!FORMA_URL.test(arrel) || !secret || typeof fetch !== 'function') throw new TypeError('Cal la base, la clau de servei i fetch.');
  const lim = esObjecte(limits) ? limits : {};
  const l = Object.freeze({
    maximPerHost: enter(lim.maximPerHost, 1, 100_000, LIMITS_PER_DEFECTE.maximPerHost),
    maxim: enter(lim.maxim, 1, 1_000_000, LIMITS_PER_DEFECTE.maxim),
    maximSeguidors: enter(lim.maximSeguidors, 1, 1_000_000, LIMITS_PER_DEFECTE.maximSeguidors),
    maximAlertes: enter(lim.maximAlertes, 1, 1_000_000, LIMITS_PER_DEFECTE.maximAlertes),
    maximIntents: enter(lim.maximIntents, 1, 50, LIMITS_PER_DEFECTE.maximIntents)
  });
  const servei = capcaleresDeServei(secret);

  async function rpc(nom, params) {
    const esperats = RPC_AP[nom];
    if (!esperats || Object.keys(params).join(',') !== esperats.join(',')) throw new TypeError(`RPC fora del contracte: ${nom}`);
    const control = new AbortController();
    const rellotge = setTimeout(() => control.abort(), topallMs);
    let r = null;
    try {
      r = await finsAlTopall(fetch(`${arrel}/rest/v1/rpc/${nom}`, {
        method: 'POST',
        headers: { ...servei, 'Content-Type': 'application/json', Accept: 'application/json' },
        // Un undefined viatja com a null: el cos porta sempre tots els paràmetres de la signatura.
        body: JSON.stringify(params, (clauJson, valor) => (valor === undefined ? null : valor)),
        signal: control.signal
      }), control.signal);
      let cos;
      try { cos = await finsAlTopall(r.json(), control.signal); } catch { cos = undefined; }
      if (r.ok && cos !== undefined) return cos;
      throw r.ok ? noDisponible() : errorDeBase(cos);
    } catch (error) {
      throw error instanceof RangeError ? error : noDisponible();
    } finally {
      clearTimeout(rellotge);
    }
  }

  return Object.freeze({
    /* ── el port de la inbox ── */
    async reclamaActivitat(id, { actor, tipus } = {}) {
      return boolea(await rpc('ap_inbox_reclama', {
        p_activitat_id: id, p_actor: actor, p_host: hostDeQuota(actor), p_tipus: tipus,
        p_retencio_s: RETENCIO_ACTIVITAT_MS / 1000, p_maxim_per_host: l.maximPerHost, p_maxim: l.maxim
      }));
    },
    async alliberaActivitat(id) { return boolea(await rpc('ap_inbox_allibera', { p_activitat_id: id })); },
    async confirmaActivitat(id) { return boolea(await rpc('ap_inbox_confirma', { p_activitat_id: id })); },
    async desaSeguidor({ slug, actor, inbox, followId, acceptId } = {}) {
      return unDe(await rpc('ap_seguidor_desa', {
        p_slug: slug, p_actor: actor, p_inbox: inbox, p_follow_id: followId, p_accept_id: acceptId, p_maxim: l.maximSeguidors
      }), ['nou', 'existent']);
    },
    async retiraSeguidor({ slug, actor, followId = null } = {}) {
      return boolea(await rpc('ap_seguidor_retira', { p_slug: slug, p_actor: actor, p_follow_id: followId || null }));
    },
    async retiraActorRemot(actor) {
      const n = await rpc('ap_actor_remot_retira', { p_actor: actor });
      if (!Number.isSafeInteger(n) || n < 0) throw noDisponible();
      return n;
    },
    async desaAlertaRemota(alerta = {}) {
      return unDe(await rpc('ap_alerta_desa', {
        p_id: alerta.id, p_actor: alerta.actor, p_via: alerta.via ?? null, p_activitat: alerta.activitat, p_tipus: alerta.tipus,
        p_url: alerta.url ?? null, p_nom: alerta.nom ?? '', p_text: alerta.text ?? '', p_publicat: alerta.publicat ?? null,
        p_caduca: alerta.caduca, p_rebuda: alerta.rebuda, p_maxim: l.maximAlertes
      }), ['nova', 'existent', 'esborrada']);
    },
    async retiraAlertaRemota({ id = null, actor, activitat = null, lapida = false } = {}) {
      return boolea(await rpc('ap_alerta_retira', {
        p_id: id || null, p_actor: actor, p_activitat: id ? null : activitat || null, p_lapida: lapida === true, p_lapida_s: RETENCIO_LAPIDA_MS / 1000
      }));
    },
    async llistaAlertesVigents(ara) {
      const files = await rpc('ap_alertes_vigents', { p_ara: isoONull(ara) });
      if (!Array.isArray(files)) throw noDisponible();
      return files.map(alertaDeFila);
    },
    async purga() {
      const r = await rpc('ap_purga', {});
      const comptes = esObjecte(r) ? { activitats: r.activitats, alertes: r.alertes, lapides: r.lapides, cua: r.cua } : null;
      if (!comptes || !Object.values(comptes).every((n) => Number.isSafeInteger(n) && n >= 0)) throw noDisponible();
      return comptes;
    },
    /* ── el port de la cua ── */
    async encua({ slug, inbox, activitat } = {}) {
      if (!esObjecte(activitat) || typeof activitat.id !== 'string') throw new TypeError('Lliurament invàlid.');
      return boolea(await rpc('ap_cua_encua', { p_slug: slug, p_inbox: inbox, p_activitat_id: activitat.id, p_cos: activitat }));
    },
    async reclama(limit = CUA.LOT) {
      const files = await rpc('ap_cua_reclama', { p_limit: enter(limit, 1, 100, CUA.LOT) });
      if (!Array.isArray(files)) throw noDisponible();
      return files.map(filaDeCua);
    },
    async resol({ id, resultat, esperaS = null, error = null } = {}) {
      if (!RESULTATS.includes(resultat)) throw new TypeError('Resultat desconegut.');
      const estat = await rpc('ap_cua_resol', {
        p_id: id, p_resultat: resultat, p_espera_s: Number.isFinite(esperaS) ? Math.round(esperaS) : null,
        p_error: typeof error === 'string' ? error.slice(0, 200) : null, p_maxim_intents: l.maximIntents
      });
      return estat === null ? null : unDe(estat, ['fet', 'pendent', 'fallit']);
    }
  });
}
