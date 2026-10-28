/* T8 (261024; P0-20, auditoria Codex 261024_1315 C-06) · El worker que buida
   private.purga_storage_pendent, la cua de fitxers que deixen la purga d'una
   baixa (2609261500, 2609282100 i 2610241440) i la neteja dels adjunts del
   xat (2610220240).
   Pur i sense dependències: fetch, WebCrypto, TextEncoder, AbortController i
   setTimeout, que tenen igual Deno (index.ts) i Node (les proves Vitest).
   Mai Buffer ni Deno.*: trencaria un dels dos costats.
   Cada passada, mentre quede temps i cua: reclama un lot
   (purga_fitxers_reclama, que suma l'intent i fa de reserva), l'esborra per
   l'API REST de Storage amb la clau de servei (DELETE
   /storage/v1/object/<bucket> amb {prefixes}, el mateix cos que el remove()
   de storage-js) i el marca fet (purga_fitxers_fets, que només lleva les
   files l'objecte de les quals ja no és a storage.objects) o fallit
   (purga_fitxers_fallits). Un objecte que ja no hi era és fet: Storage no el
   torna i un 404 vol dir que no hi ha res a esborrar.
   Cap nom d'objecte ix d'ací: ni a la resposta ni al registre, només
   recomptes. Cap secret tampoc: la clau de servei només va a les capçaleres. */

export const PURGA = Object.freeze({
  /* La capçalera del cron, la mateixa que la de compte-apple (SDP_CRON_SECRET). */
  CAPCALERA: 'x-sdp-cron',
  SECRET_MINIM: 32,
  /* Files per reclamació (la RPC en dona 200 com a molt) i noms per DELETE. */
  LOT: 50,
  PER_PETICIO: 100,
  MAX_LOTS: 20,
  /* Temps de paret d'una passada i topall de cada petició. Un lot nou només
     comença si hi caben tres peticions (reclamar, esborrar i marcar) i un
     tros, si n'hi caben dos: una passada no passa mai de PRESSUPOST_MS. El
     que quede reclamat sense provar torna sol després de l'espera. */
  PRESSUPOST_MS: 50000,
  TOPALL_MS: 8000
});

const FORMA_BUCKET = /^[A-Za-z0-9_.-]{1,100}$/;
const FORMA_URL = /^https?:\/\/[^\s/?#]+$/;

const textNet = (valor) => (typeof valor === 'string' ? valor.trim() : '');

/* Com la de compte-apple: la clau legada és un JWT (també a Authorization);
   la nova sb_secret_ només va a apikey. */
export const capcaleresDeServei = (clau) => {
  const c = textNet(clau);
  return { apikey: c, ...(c.startsWith('eyJ') ? { Authorization: `Bearer ${c}` } : {}) };
};

/** Comparació en temps constant: el resum SHA-256 de tots dos, que tampoc no filtra la llargària. */
export async function igualsEnTempsConstant(a, b, subtle = globalThis.crypto.subtle) {
  const codifica = new TextEncoder();
  const [x, y] = await Promise.all([
    subtle.digest('SHA-256', codifica.encode(String(a))),
    subtle.digest('SHA-256', codifica.encode(String(b)))
  ]);
  const vx = new Uint8Array(x);
  const vy = new Uint8Array(y);
  let diferencia = 0;
  for (let i = 0; i < vx.length; i++) diferencia |= vx[i] ^ vy[i];
  return diferencia === 0;
}

const resposta = (estat, cos, capcaleres = {}) => new Response(JSON.stringify(cos), {
  status: estat,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...capcaleres }
});

const errorDe = (codi) => Object.assign(new Error(codi), { codi });

/* Una promesa que perd la cursa amb el senyal: el topall talla encara que el cos no l'escolte. */
const finsAlTopall = (promesa, senyal) => new Promise((resol, rebutja) => {
  const talla = () => rebutja(errorDe('temps'));
  if (senyal.aborted) { talla(); return; }
  senyal.addEventListener('abort', talla, { once: true });
  promesa.then(resol, rebutja).finally(() => senyal.removeEventListener('abort', talla));
});

/**
 * fetch amb topall: AbortController i setTimeout, que tenen els dos costats.
 * P1-18 (Codex C0545-WM2, el mateix patró que compte-apple) · El topall dura
 * fins que `llig` ha consumit la resposta: unes capçaleres que arriben i un
 * cos que penja també s'avorten («temps»). Després, el cos que `llig` no ha
 * volgut (un 2xx de Storage, un estat que no és 2xx) es cancel·la. Un error
 * de `llig` amb codi passa tal qual.
 */
async function ambTopall(fetch, url, opcions, topallMs, llig) {
  const control = new AbortController();
  const rellotge = setTimeout(() => control.abort(), topallMs);
  let r = null;
  try {
    r = await fetch(url, { ...opcions, signal: control.signal });
    return await finsAlTopall(Promise.resolve().then(() => llig(r)), control.signal);
  } catch (error) {
    if (control.signal.aborted) throw errorDe('temps');
    throw error?.codi ? error : errorDe('xarxa');
  } finally {
    clearTimeout(rellotge);
    r?.body?.cancel?.().catch(() => {});
  }
}

async function llegixJson(r) {
  try { return await r.json(); } catch { return null; }
}

/**
 * Com ha anat el DELETE de Storage. 2xx: fet (la resposta llista els
 * esborrats; un nom que ja no hi era no hi apareix). 404, o el 400 amb
 * statusCode '404' de les versions velles de storage-api: no hi ha res a
 * esborrar, i també és fet. La resta, fallit amb l'estat HTTP i prou.
 * purga_fitxers_fets ho torna a comprovar a storage.objects.
 */
export async function classificaStorage(r) {
  if (r.status >= 200 && r.status < 300) return { fet: true };
  if (r.status === 404) return { fet: true };
  if (r.status === 400) {
    const cos = await llegixJson(r);
    if (cos && String(cos.statusCode) === '404') return { fet: true };
  }
  return { fet: false, error: `storage ${r.status}` };
}

/** Les files reclamades que tenen una forma vàlida, agrupades per bucket. */
export function perBucket(files) {
  const grups = new Map();
  for (const f of Array.isArray(files) ? files : []) {
    const id = Number(f?.id);
    if (!Number.isSafeInteger(id) || id <= 0) continue;
    if (typeof f?.bucket_id !== 'string' || !FORMA_BUCKET.test(f.bucket_id)) continue;
    if (typeof f?.nom !== 'string' || f.nom.length === 0 || f.nom.length > 1024) continue;
    if (!grups.has(f.bucket_id)) grups.set(f.bucket_id, []);
    grups.get(f.bucket_id).push({ id, nom: f.nom });
  }
  return grups;
}

export function trossos(llista, mida) {
  const eixida = [];
  for (let i = 0; i < llista.length; i += mida) eixida.push(llista.slice(i, i + mida));
  return eixida;
}

/**
 * @param {object} dependencies
 * @param {Record<string,string|undefined>} dependencies.env SUPABASE_URL,
 *   SUPABASE_SERVICE_ROLE_KEY (les injecta Supabase) i SDP_CRON_SECRET.
 * @returns {(req: Request) => Promise<Response>}
 */
export function creaGestor({
  env = {}, fetch = globalThis.fetch, subtle = globalThis.crypto.subtle,
  ara = Date.now, registre = console, opcions = {}
} = {}) {
  const o = { ...PURGA, ...opcions };

  return async function gestor(req) {
    if (req.method !== 'POST') return resposta(405, { ok: false, error: 'metode' }, { Allow: 'POST' });

    const secret = textNet(env.SDP_CRON_SECRET);
    const base = textNet(env.SUPABASE_URL).replace(/\/+$/, '');
    const clau = textNet(env.SUPABASE_SERVICE_ROLE_KEY);
    if (secret.length < o.SECRET_MINIM || !FORMA_URL.test(base) || !clau) {
      registre.error('[purga-fitxers] Falta la configuració de la funció.');
      return resposta(503, { ok: false, error: 'config' });
    }
    if (!(await igualsEnTempsConstant(textNet(req.headers.get(o.CAPCALERA)), secret, subtle))) {
      return resposta(401, { ok: false, error: 'no-autoritzat' });
    }

    const servei = capcaleresDeServei(clau);
    const rpc = (nom, cos) => ambTopall(fetch, `${base}/rest/v1/rpc/${nom}`, {
      method: 'POST',
      headers: { ...servei, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(cos)
    }, o.TOPALL_MS, async (r) => {
      if (!r.ok) throw errorDe(`base ${r.status}`);
      return llegixJson(r);
    });
    const esborra = async (bucket, noms) => {
      try {
        return await ambTopall(fetch, `${base}/storage/v1/object/${encodeURIComponent(bucket)}`, {
          method: 'DELETE',
          headers: { ...servei, 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ prefixes: noms })
        }, o.TOPALL_MS, classificaStorage);
      } catch (error) {
        return { fet: false, error: error?.codi === 'temps' ? 'temps' : 'xarxa' };
      }
    };

    const inici = ara();
    const queda = () => o.PRESSUPOST_MS - (ara() - inici);
    const recompte = { fets: 0, fallits: 0, pendents: 0, sense_provar: 0, lots: 0 };
    let esgotat = false;

    try {
      while (recompte.lots < o.MAX_LOTS) {
        if (queda() < 3 * o.TOPALL_MS) { esgotat = true; break; }
        const files = await rpc('purga_fitxers_reclama', { p_limit: o.LOT });
        if (!Array.isArray(files) || !files.length) break;
        recompte.lots += 1;
        const grups = perBucket(files);
        let valides = 0;
        for (const grup of grups.values()) valides += grup.length;
        /* Una fila amb forma estranya no es toca: torna i, al sostre d'intents, es revisa a mà. */
        recompte.sense_provar += files.length - valides;
        for (const [bucket, grup] of grups) {
          for (const tros of trossos(grup, o.PER_PETICIO)) {
            if (queda() < 2 * o.TOPALL_MS) { esgotat = true; recompte.sense_provar += tros.length; continue; }
            const ids = tros.map((f) => f.id);
            const resultat = await esborra(bucket, tros.map((f) => f.nom));
            if (resultat.fet) {
              const fets = Number(await rpc('purga_fitxers_fets', { p_ids: ids })) || 0;
              recompte.fets += fets;
              recompte.pendents += Math.max(0, ids.length - fets);
            } else {
              await rpc('purga_fitxers_fallits', { p_ids: ids, p_error: resultat.error });
              recompte.fallits += ids.length;
            }
          }
        }
        if (esgotat) break;
      }
    } catch (error) {
      /* La base no respon: el que s'havia reclamat torna sol després de l'espera. */
      registre.error('[purga-fitxers] La base no respon:', error?.codi ?? 'error');
      return resposta(502, { ok: false, error: 'base', ...recompte });
    }

    registre.info(`[purga-fitxers] fets=${recompte.fets} fallits=${recompte.fallits} pendents=${recompte.pendents} sense_provar=${recompte.sense_provar} lots=${recompte.lots}`);
    return resposta(200, { ok: true, ...recompte, esgotat });
  };
}
