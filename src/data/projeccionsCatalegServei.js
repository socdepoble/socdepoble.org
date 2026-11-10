import { creaMagatzemIdb } from '../utils/magatzemLocal.js';
import { capturaAbastProjeccions, capturaDestinsCataleg, capturaFontCataleg, clauFontCataleg, destinsPerAudiencia,
  errorProjeccioCataleg, idPublicacioProjeccio, payloadProjeccioCataleg } from './projeccionsCataleg.js';

const AUDIENCIES = ['privada', 'publica'];
const enter = value => Number.isSafeInteger(value) && value >= 0;
function registreNet(input) {
  const font = capturaFontCataleg(input.font), destins = capturaDestinsCataleg(input.destins);
  if (input.clau !== clauFontCataleg(font) || !enter(input.seq) || input.seq < 1 || input.seq >= Number.MAX_SAFE_INTEGER
    || !AUDIENCIES.every(a => enter(input.confirmacions?.[a]) && input.confirmacions[a] <= input.seq)
    || !AUDIENCIES.every(a => /^[0-9a-f-]{36}$/.test(input.ids?.[a])) || typeof input.publicaIntentada !== 'boolean') throw errorProjeccioCataleg('registre-invalid');
  return { clau: input.clau, font, destins, seq: input.seq, ids: { ...input.ids },
    confirmacions: { ...input.confirmacions }, publicaIntentada: input.publicaIntentada };
}
export function creaMagatzemProjeccionsCataleg({ abast, ...opcions }) {
  const scope = capturaAbastProjeccions(abast);
  return creaMagatzemIdb({ nom: `sdp-projeccions-cataleg-v1:${JSON.stringify(scope)}`, versio: 1,
    stores: { projeccions: { clau: 'clau' } }, llistaBlanca: { projeccions: registreNet }, ...opcions });
}
export const registreProjeccioPendent = row => AUDIENCIES.some(a => row.confirmacions[a] !== row.seq);
export function filesDeRegistreProjeccio(row, abast) {
  const scope = capturaAbastProjeccions(abast), net = registreNet(row);
  return AUDIENCIES.map(audiencia => ({ id: net.ids[audiencia], ownerUserId: scope.ownerId,
    sectionId: audiencia === 'publica' ? 'mur' : 'notes',
    ...payloadProjeccioCataleg({ font: net.font, destins: destinsPerAudiencia(net.destins, audiencia), audiencia }),
    _projeccioLocal: true, _projeccioPendent: registreProjeccioPendent(net) }));
}
/** Durable outbox, one immutable row per audience. A partial acknowledgement
 * is pending, never a successful publication. Server RLS remains authoritative.
 * No automatic replay under a different account/actor/backend is possible.
 * PRODUCCIO-01 (R15b) · `lectora`: una superfície que només llig (el Mur, el
 * Mercat) no agafa el bloqueig d'escriptura del magatzem, que és un per compte
 * i abast entre totes les pestanyes, i no hi escriu mai (ni desa ni
 * sincronitza): així no deixa en mode lector el catàleg d'una altra pestanya.
 */
export function creaServeiProjeccionsCataleg({ abast, magatzem, publica, comprovaSessio = () => {}, subtil, lectora = false, ...opcions }) {
  const scope = capturaAbastProjeccions(abast);
  const base = magatzem ?? creaMagatzemProjeccionsCataleg({ abast: scope, ...opcions });
  let tancat = false, enVol = null;
  const comprova = () => { if (tancat) throw new DOMException('Espai tancat.', 'AbortError'); comprovaSessio(); };
  const escriu = () => { comprova(); if (lectora) throw errorProjeccioCataleg('nomes-lectura'); };
  async function prepara() { comprova(); await base.prepara(); comprova(); if (!lectora) { await base.obtinBloqueig(); comprova(); } }
  async function llista() { comprova(); const rows = await base.totes('projeccions'); comprova(); return rows.map(registreNet); }
  async function desa(fontInput, destinsInput) {
    escriu(); const font = capturaFontCataleg(fontInput), destins = capturaDestinsCataleg(destinsInput), clau = clauFontCataleg(font);
    const ids = Object.fromEntries(await Promise.all(AUDIENCIES.map(async a => [a, await idPublicacioProjeccio(scope, font, a, subtil)])));
    comprova();
    const saved = await base.actualitza('projeccions', clau, old => {
      comprova();
      const seq = (old?.seq ?? 0) + 1;
      return registreNet({ clau, font, destins, seq, ids, confirmacions: old?.confirmacions ?? { publica: 0, privada: 0 }, publicaIntentada: old?.publicaIntentada ?? false });
    });
    comprova(); return saved;
  }
  const confirma = (row, audiencia) => base.actualitza('projeccions', row.clau, current => {
    comprova(); if (!current) throw errorProjeccioCataleg('registre-invalid');
    return registreNet({ ...current, confirmacions: { ...current.confirmacions, [audiencia]: Math.max(current.confirmacions[audiencia], row.seq) } });
  });
  async function sincronitzaAra() {
    escriu();
    if (typeof publica !== 'function') throw errorProjeccioCataleg('sincronitzacio-no-disponible');
    for (;;) {
      const pending = (await llista()).find(registreProjeccioPendent);
      if (!pending) return;
      for (const audiencia of AUDIENCIES) {
        comprova(); if (pending.confirmacions[audiencia] === pending.seq) continue;
        const destins = destinsPerAudiencia(pending.destins, audiencia);
        // A private-only reference must not leak even its source id into Mur.
        if (audiencia === 'publica' && !destins.length && !pending.publicaIntentada) { await confirma(pending, audiencia); continue; }
        if (audiencia === 'publica') {
          await base.actualitza('projeccions', pending.clau, current => { comprova(); return registreNet({ ...current, publicaIntentada: true }); });
        }
        comprova();
        const font = destins.length ? pending.font : { ...pending.font, title: 'Publicació retirada', subtitle: '', lead: '' };
        const payload = payloadProjeccioCataleg({ font, destins, audiencia });
        const submission = { id: pending.ids[audiencia], sectionId: audiencia === 'publica' ? 'mur' : 'notes', payload };
        const saved = await publica(submission);
        comprova();
        if (saved?.id !== submission.id || saved?.sectionId !== submission.sectionId
          || JSON.stringify(saved?.payload?.projeccioCataleg) !== JSON.stringify(payload.projeccioCataleg)) throw errorProjeccioCataleg('confirmacio-invalida');
        await confirma(pending, audiencia);
      }
    }
  }
  return {
    prepara, llista, desa,
    get persistent() { return base.persistent; },
    get mode() { return base.mode; },
    sincronitza() {
      if (!enVol) enVol = sincronitzaAra().finally(() => { enVol = null; });
      return enVol;
    },
    subscriu: listener => base.subscriu(listener),
    tanca() { if (tancat) return; tancat = true; base.tanca(); }
  };
}
