import { creaMagatzemIdb } from '../utils/magatzemLocal.js';
import { elementDeFilaPublicada, mapSectionSubmissionToItem } from './mapejadorSeccions.js';
import { elementDeMurMembre } from './murPublic.js';
import { capturaAbastProjeccions, capturaDestinsDeFontCataleg, capturaFontCataleg, clauFontCataleg, destinsPerAudiencia,
  errorProjeccioCataleg, idPublicacioProjeccio, payloadProjeccioCataleg, projeccioCatalegDe } from './projeccionsCataleg.js';

const AUDIENCIES = ['privada', 'publica'];
const enter = value => Number.isSafeInteger(value) && value >= 0;
const instant = value => typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?(?:Z|[+-]\d\d:\d\d)$/.test(value) && Number.isFinite(Date.parse(value));
function registreNet(input) {
  const font = capturaFontCataleg(input.font), destins = capturaDestinsDeFontCataleg(font, input.destins);
  if (input.clau !== clauFontCataleg(font) || !enter(input.seq) || input.seq < 1 || input.seq >= Number.MAX_SAFE_INTEGER
    || !AUDIENCIES.every(a => enter(input.confirmacions?.[a]) && input.confirmacions[a] <= input.seq)
    || !AUDIENCIES.every(a => /^[0-9a-f-]{36}$/.test(input.ids?.[a])) || typeof input.publicaIntentada !== 'boolean'
    || input.versions !== undefined && !AUDIENCIES.every(a => input.versions?.[a] === null || instant(input.versions?.[a]))) throw errorProjeccioCataleg('registre-invalid');
  return { clau: input.clau, font, destins, seq: input.seq, ids: { ...input.ids },
    confirmacions: { ...input.confirmacions }, publicaIntentada: input.publicaIntentada,
    versions: input.versions ? { ...input.versions } : { privada: null, publica: null } };
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
 * Onada R32 · D-R32-PUB-1 (pendent del Mestre) · `versionada`: el registre
 * guarda la versió del servidor de cada audiència (la de l'últim ACK i, només
 * si és versionada, l'adopció exacta d'abaix), però només l'envia com a
 * `expectedUpdatedAt` si qui crea el servei
 * declara un backend amb CAS de publicacions. Cap backend viu en té (la
 * migració 20261115231000 es va rebutjar a R30): per defecte no viatja i la
 * publicació continua sent l'upsert per id que el servidor viu accepta.
 */
export function creaServeiProjeccionsCataleg({ abast, magatzem, publica, comprovaSessio = () => {}, subtil, lectora = false, versionada = false, ...opcions }) {
  const scope = capturaAbastProjeccions(abast);
  const base = magatzem ?? creaMagatzemProjeccionsCataleg({ abast: scope, ...opcions });
  let tancat = false, enVol = null;
  const comprova = () => { if (tancat) throw new DOMException('Espai tancat.', 'AbortError'); comprovaSessio(); };
  const escriu = () => { comprova(); if (lectora) throw errorProjeccioCataleg('nomes-lectura'); };
  async function prepara() { comprova(); await base.prepara(); comprova(); if (!lectora) { await base.obtinBloqueig(); comprova(); } }
  async function llista() { comprova(); const rows = await base.totes('projeccions'); comprova(); return rows.map(registreNet); }
  async function desa(fontInput, destinsInput) {
    escriu(); const font = capturaFontCataleg(fontInput), destins = capturaDestinsDeFontCataleg(font, destinsInput), clau = clauFontCataleg(font);
    const ids = Object.fromEntries(await Promise.all(AUDIENCIES.map(async a => [a, await idPublicacioProjeccio(scope, font, a, subtil)])));
    comprova();
    const saved = await base.actualitza('projeccions', clau, old => {
      comprova();
      const seq = (old?.seq ?? 0) + 1;
      return registreNet({ clau, font, destins, seq, ids, confirmacions: old?.confirmacions ?? { publica: 0, privada: 0 }, publicaIntentada: old?.publicaIntentada ?? false,
        versions: old?.versions });
    });
    comprova(); return saved;
  }
  /* Onada R32 (Gauntlet del Carril 1) · El testimoni d'una audiència només val
     si és el de l'última escriptura confirmada. Un ACK sense versió estricta
     (Node 0 i l'adaptador local no en tornen, i content.js no n'inventa cap)
     ha canviat updated_at al servidor: la versió anterior ja és rància i
     queda null («desconeguda»), mai la de la revisió d'abans. */
  const confirma = (row, audiencia, saved) => base.actualitza('projeccions', row.clau, current => {
    comprova(); if (!current) throw errorProjeccioCataleg('registre-invalid');
    return registreNet({ ...current, versions: { ...registreNet(current).versions, [audiencia]: instant(saved?.updatedAt) ? saved.updatedAt : null },
      confirmacions: { ...current.confirmacions, [audiencia]: Math.max(current.confirmacions[audiencia], row.seq) } });
  });
  /* Les versions que un registre confirmat i sense versió pot adoptar d'una
     lectura remota: només les d'una fila única que és exactament la projecció
     que es va confirmar. Pura: no toca el magatzem. Null si no n'adopta cap. */
  function versionsAdoptables(net, items) {
    let versions = null;
    for (const audiencia of AUDIENCIES) {
      if (net.versions[audiencia] !== null || net.confirmacions[audiencia] !== net.seq) continue;
      const matches = items.filter(candidate => candidate?.id === net.ids[audiencia]);
      const item = matches.length === 1 ? matches[0] : null;
      const remote = projeccioCatalegDe(item), destins = destinsPerAudiencia(net.destins, audiencia);
      const font = destins.length ? net.font : { ...net.font, title: 'Publicació retirada', subtitle: '', lead: '' };
      if (remote?.ownerId !== scope.ownerId || remote.audiencia !== audiencia || remote.local || remote.pendent || !instant(item.updated_at)) continue;
      const id = net.ids[audiencia], sectionId = audiencia === 'publica' ? 'mur' : 'notes', createdAt = item.created_at;
      const payload = mapSectionSubmissionToItem({ id, sectionId, ownerUserId: scope.ownerId, createdAt,
        payload: { ...payloadProjeccioCataleg({ font, destins, audiencia }), id, sectionId, ownerUserId: scope.ownerId, created_at: createdAt } });
      const expected = audiencia === 'publica' ? elementDeMurMembre({ id, section_id: sectionId, owner_user_id: scope.ownerId,
        author_org_id: item.authorOrgId, title: font.title, payload, created_at: createdAt, updated_at: item.updated_at }, sectionId)
        : { ...elementDeFilaPublicada({ id, payload, titol: font.title, createdAt, updatedAt: item.updated_at,
          ownerUserId: scope.ownerId, authorOrgId: item.authorOrgId, sectionId }), sectionId };
      const stable = (value, depth = 0) => Array.isArray(value) ? value.map(entry => stable(entry, depth + 1)) : value && typeof value === 'object'
        ? Object.fromEntries(Object.keys(value).sort().filter(key => depth || !['created_at', 'updated_at', 'updatedAt', 'author', 'author_name'].includes(key)).map(key => [key, stable(value[key], depth + 1)])) : value;
      if (JSON.stringify(stable(item)) === JSON.stringify(stable(expected))) versions = { ...(versions ?? net.versions), [audiencia]: item.updated_at };
    }
    return versions;
  }
  /* Onada R32 (Gauntlet del Carril 1) · L'adopció és comptabilitat local i la
     crida el hook dins de cada lectura remota. Per això només escriu quan una
     audiència adopta de veres (la comparació va abans de demanar el magatzem:
     una fila divergent no escriu ni avisa les altres pestanyes a cada lectura)
     i mai des d'una pestanya que el magatzem deixa lectora (una altra té el
     bloqueig): eixa lectura no pot fallar amb NOMES_LECTURA, i la pestanya
     escriptora ja l'adoptarà amb la seua.
     Mentre D-R32-PUB-1 continue pendent (servei no `versionada`), les versions
     no viatgen mai i adoptar-les seria E/S local sense cap efecte: ix abans de
     tocar el magatzem, i la lectura remota torna a ser només de xarxa, com al
     viu. Torna true si alguna audiència ha adoptat una versió. */
  async function adoptaVersionsRemotes(items) {
    escriu();
    if (!Array.isArray(items)) throw errorProjeccioCataleg('resposta-invalida');
    if (versionada !== true || base.mode === 'lectora') return false;
    let adoptada = false;
    for (const row of await llista()) {
      if (!versionsAdoptables(row, items)) continue;
      await base.actualitza('projeccions', row.clau, current => {
        comprova(); if (!current) return undefined;
        const net = registreNet(current), versions = versionsAdoptables(net, items);
        if (!versions) return undefined;
        adoptada = true; return registreNet({ ...net, versions });
      });
    }
    return adoptada;
  }
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
        if (versionada === true && pending.versions[audiencia] !== null) submission.expectedUpdatedAt = pending.versions[audiencia];
        const saved = await publica(submission);
        comprova();
        if (saved?.id !== submission.id || saved?.sectionId !== submission.sectionId
          || JSON.stringify(saved?.payload?.projeccioCataleg) !== JSON.stringify(payload.projeccioCataleg)) throw errorProjeccioCataleg('confirmacio-invalida');
        await confirma(pending, audiencia, saved);
      }
    }
  }
  return {
    prepara, llista, desa, adoptaVersionsRemotes,
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
