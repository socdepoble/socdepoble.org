import { esTokenPublicacio, ordreTokenPublicacio } from './publicacionsCas.js';
import { creaMagatzemIdb } from '../utils/magatzemLocal.js';
import { elementDeFilaPublicada, mapSectionSubmissionToItem } from './mapejadorSeccions.js';
import { elementDeMurMembre } from './murPublic.js';
import { capturaAbastProjeccions, capturaDestinsDeFontCataleg, capturaFontCataleg, clauFontCataleg, destinsPerAudiencia,
  errorProjeccioCataleg, idPublicacioProjeccio, payloadProjeccioCataleg, projeccioCatalegDe } from './projeccionsCataleg.js';

const AUDIENCIES = ['privada', 'publica'];
const INCIDENCIES = ['conflicte-versio', 'versio-desconeguda', 'rebuig-servidor'];
const UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const copia = value => JSON.parse(JSON.stringify(value));
const enter = value => Number.isSafeInteger(value) && value >= 0;
const instant = esTokenPublicacio;
function registreNet(input) {
  const font = capturaFontCataleg(input.font), destins = capturaDestinsDeFontCataleg(font, input.destins);
  if (input.clau !== clauFontCataleg(font) || !enter(input.seq) || input.seq < 1 || input.seq >= Number.MAX_SAFE_INTEGER
    || !AUDIENCIES.every(a => enter(input.confirmacions?.[a]) && input.confirmacions[a] <= input.seq)
    || !AUDIENCIES.every(a => /^[0-9a-f-]{36}$/.test(input.ids?.[a])) || typeof input.publicaIntentada !== 'boolean'
    || input.versions !== undefined && !AUDIENCIES.every(a => input.versions?.[a] === null || instant(input.versions?.[a]))) throw errorProjeccioCataleg('registre-invalid');
  const operacions = {};
  for (const audiencia of AUDIENCIES) {
    const op = input.operacions?.[audiencia] ?? null;
    if (op === null) { operacions[audiencia] = null; continue; }
    const opFont = capturaFontCataleg(op.font), opDestins = capturaDestinsDeFontCataleg(opFont, op.destins);
    if (!UUID.test(op.id ?? '') || !enter(op.seq) || op.seq > input.seq || op.seq <= input.confirmacions[audiencia]
      || clauFontCataleg(opFont) !== input.clau || op.expectedUpdatedAt !== null && !instant(op.expectedUpdatedAt)) throw errorProjeccioCataleg('registre-invalid');
    operacions[audiencia] = { id: op.id, seq: op.seq, font: opFont, destins: opDestins, expectedUpdatedAt: op.expectedUpdatedAt };
  }
  /* R32.15 · D-R32.14-1 · Una incidència de versió aparta l'audiència de la cua
     automàtica fins que algú la resol: ni es reintenta per sempre ni encalla les
     referències de darrere. Els registres antics no en porten (null). */
  /* Tolerant: una incidència d'un build posterior (codi desconegut) es descarta i
     l'audiència torna a la cua; mai fa caure el magatzem sencer. */
  const incidencies = {};
  for (const audiencia of AUDIENCIES) {
    const inc = input.incidencies?.[audiencia] ?? null;
    incidencies[audiencia] = inc && typeof inc === 'object' && INCIDENCIES.includes(inc.codi) && enter(inc.seq) && inc.seq >= 1 && inc.seq <= input.seq
      ? { codi: inc.codi, seq: inc.seq } : null;
  }
  return { clau: input.clau, font, destins, seq: input.seq, ids: { ...input.ids },
    confirmacions: { ...input.confirmacions }, publicaIntentada: input.publicaIntentada,
    versions: input.versions ? { ...input.versions } : { privada: null, publica: null },
    cas: input.cas === true || AUDIENCIES.some(a => operacions[a] !== null), operacions, incidencies };
}
export function creaMagatzemProjeccionsCataleg({ abast, ...opcions }) {
  const scope = capturaAbastProjeccions(abast);
  return creaMagatzemIdb({ nom: `sdp-projeccions-cataleg-v1:${JSON.stringify(scope)}`, versio: 1,
    stores: { projeccions: { clau: 'clau' } }, llistaBlanca: { projeccions: registreNet }, ...opcions });
}
export const registreProjeccioPendent = row => AUDIENCIES.some(a => row.confirmacions[a] !== row.seq);
/** R32.15 · Pendent, però fora de la cua automàtica fins a una resolució explícita. */
export const registreProjeccioAmbIncidencia = row => AUDIENCIES.some(a => (row.incidencies?.[a] ?? null) !== null);
const esConflicteVersio = error => error?.codi === 'conflicte-versio' || error?.code === 'conflicte-versio';
/* Rebutjos deterministes del CAS per a una fila concreta (autoria perduda, contingut
   no publicable, retirada per moderació, hash d'operació divergent): reintentar-los
   no canvia res. La xarxa, la sessió i l'RPC absent continuen aturant la cua. */
const esRebuigPermanent = error => [error?.message, error?.cause?.message].some(m => /SDP-PUB-CAS-00[1245]/.test(String(m ?? '')));
export function filesDeRegistreProjeccio(row, abast) {
  const scope = capturaAbastProjeccions(abast), net = registreNet(row);
  return AUDIENCIES.map(audiencia => ({ id: net.ids[audiencia], ownerUserId: scope.ownerId,
    sectionId: audiencia === 'publica' ? 'mur' : 'notes',
    ...payloadProjeccioCataleg({ font: net.font, destins: destinsPerAudiencia(net.destins, audiencia), audiencia }),
    _projeccioLocal: true, _projeccioPendent: registreProjeccioPendent(net),
    ...(net.incidencies[audiencia] ? { _projeccioIncidencia: net.incidencies[audiencia].codi } : {}) }));
}
/** Durable outbox, one immutable row per audience. A partial acknowledgement
 * is pending, never a successful publication. Server RLS remains authoritative.
 * No automatic replay under a different account/actor/backend is possible.
 * PRODUCCIO-01 (R15b) · `lectora`: una superfície que només llig (el Mur, el
 * Mercat) no agafa el bloqueig d'escriptura del magatzem, que és un per compte
 * i abast entre totes les pestanyes, i no hi escriu mai (ni desa ni
 * sincronitza): així no deixa en mode lector el catàleg d'una altra pestanya.
 * R32.11 · `versionada` opt-in: crea i actualitza amb el nou CAS general.
 * Cada operació es desa abans del primer dispatch i sobreviu a ACK perdut,
 * recàrrega i nova edició local. Producció continua opt-out fins rebut manual.
 * Una versió desconeguda després d'un ACK legacy exigeix adoptar-la de lectura.
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
        versions: old?.versions, cas: old?.cas, operacions: old?.operacions,
        incidencies: Object.fromEntries(AUDIENCIES.map(a => [a, old?.incidencies?.[a]?.codi === 'rebuig-servidor' ? null : old?.incidencies?.[a] ?? null])) });
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
    const net = registreNet(current);
    if (versionada === true && (row.operacions?.[audiencia]?.id ?? null) !== (net.operacions[audiencia]?.id ?? null)) throw errorProjeccioCataleg('confirmacio-invalida');
    return registreNet({ ...net, operacions: { ...net.operacions, [audiencia]: null }, versions: { ...net.versions, [audiencia]: instant(saved?.updatedAt) ? saved.updatedAt : null },
      incidencies: { ...net.incidencies, [audiencia]: null },
      confirmacions: { ...current.confirmacions, [audiencia]: Math.max(current.confirmacions[audiencia], row.seq) } });
  });
  /* Les versions que un registre confirmat i sense versió pot adoptar d'una
     lectura remota: només les d'una fila única que és exactament la projecció
     que es va confirmar. Pura: no toca el magatzem. Null si no n'adopta cap. */
  function versionsAdoptables(net, items, normalitzaDestins) {
    let versions = null, confirmacions = null, incidencies = null;
    for (const audiencia of AUDIENCIES) {
      /* R32.15 · Una incidència de conflicte es tanca sola quan el servidor ja té
         exactament la projecció local d'ara: no hi ha res a escriure. */
      const tanca = net.incidencies[audiencia]?.codi === 'conflicte-versio' && !net.operacions[audiencia];
      if (!tanca && (net.operacions[audiencia] || net.versions[audiencia] !== null || net.confirmacions[audiencia] !== net.seq)) continue;
      const matches = items.filter(candidate => candidate?.id === net.ids[audiencia]);
      const item = matches.length === 1 ? matches[0] : null;
      const remote = projeccioCatalegDe(item), destins = destinsPerAudiencia(net.destins, audiencia);
      const font = destins.length ? net.font : { ...net.font, title: 'Publicació retirada', subtitle: '', lead: '' };
      if (remote?.ownerId !== scope.ownerId || remote.audiencia !== audiencia || remote.local || remote.pendent || !instant(item.updated_at)) continue;
      const id = net.ids[audiencia], sectionId = audiencia === 'publica' ? 'mur' : 'notes', createdAt = item.created_at;
      const cru = payloadProjeccioCataleg({ font, destins, audiencia });
      // C26-1: compara la mateixa projecció canònica que ha escrit el port.
      // Els ACK legacy sense categoriesSistema continuen comparant-se íntegres.
      const publicable = Object.hasOwn(item, 'categoriesSistema') ? normalitzaDestins(cru, sectionId) : cru;
      const payload = mapSectionSubmissionToItem({ id, sectionId, ownerUserId: scope.ownerId, createdAt,
        payload: { ...publicable, id, sectionId, ownerUserId: scope.ownerId, created_at: createdAt } });
      const expected = audiencia === 'publica' ? elementDeMurMembre({ id, section_id: sectionId, owner_user_id: scope.ownerId,
        author_org_id: item.authorOrgId, title: font.title, payload, created_at: createdAt, updated_at: item.updated_at }, sectionId)
        : { ...elementDeFilaPublicada({ id, payload, titol: font.title, createdAt, updatedAt: item.updated_at,
          ownerUserId: scope.ownerId, authorOrgId: item.authorOrgId, sectionId }), sectionId };
      const stable = (value, depth = 0) => Array.isArray(value) ? value.map(entry => stable(entry, depth + 1)) : value && typeof value === 'object'
        ? Object.fromEntries(Object.keys(value).sort().filter(key => depth || !['created_at', 'updated_at', 'updatedAt', 'author', 'author_name'].includes(key)).map(key => [key, stable(value[key], depth + 1)])) : value;
      if (JSON.stringify(stable(item)) !== JSON.stringify(stable(expected))) continue;
      versions = { ...(versions ?? net.versions), [audiencia]: item.updated_at };
      if (tanca) {
        confirmacions = { ...(confirmacions ?? net.confirmacions), [audiencia]: net.seq };
        incidencies = { ...(incidencies ?? net.incidencies), [audiencia]: null };
      }
    }
    return versions && { versions, ...(confirmacions ? { confirmacions, incidencies } : {}) };
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
    const { categoriesSistemaPerPublicar } = await import('../utils/publicacioSistema.js');
    comprova();
    let adoptada = false;
    for (const row of await llista()) {
      if (!versionsAdoptables(row, items, categoriesSistemaPerPublicar)) continue;
      await base.actualitza('projeccions', row.clau, current => {
        comprova(); if (!current) return undefined;
        const net = registreNet(current), adopcio = versionsAdoptables(net, items, categoriesSistemaPerPublicar);
        if (!adopcio) return undefined;
        adoptada = true; return registreNet({ ...net, ...adopcio });
      });
    }
    return adoptada;
  }
  /* R32.15 · D-R32.14-1 · El servidor ha rebutjat l'operació (versió esperada
     vella) o no se'n coneix la versió: l'audiència passa a incidència durable i
     l'operació rància ix de la cua. Només si l'operació encara és la mateixa. */
  const marcaIncidencia = (clau, audiencia, opId, codi) => base.actualitza('projeccions', clau, current => {
    comprova(); if (!current) throw errorProjeccioCataleg('registre-invalid');
    const net = registreNet(current), op = net.operacions[audiencia];
    if (opId !== null && op?.id !== opId) return net;
    return registreNet({ ...net, operacions: { ...net.operacions, [audiencia]: null },
      incidencies: { ...net.incidencies, [audiencia]: { codi, seq: op?.seq ?? net.seq } } });
  });
  /* Resolució explícita (decisió de la persona, mai automàtica): la nova base és
     la versió remota que acaba de llegir; la pròxima sincronització hi aplica
     l'edició local amb una operació nova, una sola vegada. */
  async function resolIncidencia(clau, audiencia, { versioRemota } = {}) {
    escriu();
    if (versionada !== true) throw errorProjeccioCataleg('cas-no-disponible');
    // null: la fila remota no existix i l'operació nova serà una creació (mai sobreescriu).
    if (!AUDIENCIES.includes(audiencia) || versioRemota !== null && !instant(versioRemota)) throw errorProjeccioCataleg('versio-invalida');
    const saved = await base.actualitza('projeccions', clau, current => {
      comprova(); if (!current) throw errorProjeccioCataleg('registre-invalid');
      const net = registreNet(current);
      if (!net.incidencies[audiencia]) throw errorProjeccioCataleg('sense-incidencia');
      // Amb null, l'audiència torna a «mai confirmada»: la pròxima operació és una creació.
      return registreNet({ ...net, versions: { ...net.versions, [audiencia]: versioRemota }, incidencies: { ...net.incidencies, [audiencia]: null },
        ...(versioRemota === null ? { confirmacions: { ...net.confirmacions, [audiencia]: 0 } } : {}) });
    });
    comprova(); return saved;
  }
  async function sincronitzaAra() {
    escriu();
    if (typeof publica !== 'function') throw errorProjeccioCataleg('sincronitzacio-no-disponible');
    // Sense CAS (rollback del flag), les incidències no compten: el camí legacy publica i confirma les neteja.
    const teIncidencia = (row, audiencia) => versionada === true && row.incidencies[audiencia] !== null;
    for (;;) {
      // Per audiència: una incidència al Mur no atura la nota privada, ni a l'inrevés.
      const pending = (await llista()).find(row => AUDIENCIES.some(a => row.confirmacions[a] !== row.seq && !teIncidencia(row, a)));
      if (!pending) break;
      if (pending.cas && versionada !== true) throw errorProjeccioCataleg('cas-no-disponible');
      for (const audiencia of AUDIENCIES) {
        comprova();
        let row = versionada === true ? (await llista()).find(candidate => candidate.clau === pending.clau) : pending;
        if (!row) throw errorProjeccioCataleg('registre-invalid');
        if (row.confirmacions[audiencia] === row.seq) continue;
        const destinsActuals = destinsPerAudiencia(row.destins, audiencia);
        // Una referència només privada no filtra ni l'id al Mur (i confirmar en neteja una incidència rància).
        if (audiencia === 'publica' && !destinsActuals.length && !row.publicaIntentada && !row.operacions[audiencia]) { await confirma(row, audiencia); continue; }
        if (teIncidencia(row, audiencia)) continue;
        if (versionada === true) {
          row = await base.actualitza('projeccions', pending.clau, current => {
            comprova(); const net = registreNet(current);
            if (net.operacions[audiencia] || net.confirmacions[audiencia] === net.seq
              || audiencia === 'publica' && !destinsPerAudiencia(net.destins, audiencia).length && !net.publicaIntentada) return net;
            // Un Mur mai intentat no té cap fila remota: l'operació és una creació (expectedUpdatedAt null).
            if (net.confirmacions[audiencia] > 0 && net.versions[audiencia] === null && !(audiencia === 'publica' && !net.publicaIntentada)) {
              return registreNet({ ...net, incidencies: { ...net.incidencies, [audiencia]: { codi: 'versio-desconeguda', seq: net.seq } } });
            }
            const id = globalThis.crypto?.randomUUID?.();
            if (!UUID.test(id ?? '')) throw errorProjeccioCataleg('aleatorietat-no-disponible');
            return registreNet({ ...net, cas: true, publicaIntentada: net.publicaIntentada || audiencia === 'publica',
              operacions: { ...net.operacions, [audiencia]: { id, seq: net.seq, font: net.font, destins: net.destins, expectedUpdatedAt: net.versions[audiencia] } } });
          });
          comprova();
          if (teIncidencia(row, audiencia)) continue;
          if (!row.operacions[audiencia]) { if (row.confirmacions[audiencia] !== row.seq) await confirma(row, audiencia); continue; }
        } else if (audiencia === 'publica') {
          await base.actualitza('projeccions', pending.clau, current => { comprova(); return registreNet({ ...current, publicaIntentada: true }); });
        }
        comprova();
        const op = versionada === true ? row.operacions[audiencia] : null;
        const source = op ?? row, destins = destinsPerAudiencia(source.destins, audiencia);
        const font = destins.length ? source.font : { ...source.font, title: 'Publicació retirada', subtitle: '', lead: '' };
        const payload = payloadProjeccioCataleg({ font, destins, audiencia });
        const submission = { id: row.ids[audiencia], sectionId: audiencia === 'publica' ? 'mur' : 'notes', payload: copia(payload) };
        if (op) { submission.expectedUpdatedAt = op.expectedUpdatedAt; submission.operationId = op.id; }
        let saved;
        try { saved = await publica(submission); }
        catch (error) {
          if (!op || !(esConflicteVersio(error) || esRebuigPermanent(error))) throw error;
          comprova(); await marcaIncidencia(row.clau, audiencia, op.id, esConflicteVersio(error) ? 'conflicte-versio' : 'rebuig-servidor'); continue;
        }
        comprova();
        if (saved?.id !== row.ids[audiencia] || saved?.sectionId !== (audiencia === 'publica' ? 'mur' : 'notes')
          || JSON.stringify(saved?.payload?.projeccioCataleg) !== JSON.stringify(payload.projeccioCataleg)
          || op && (saved.operationId !== op.id || !instant(saved.updatedAt) || op.expectedUpdatedAt !== null && ordreTokenPublicacio(saved.updatedAt) <= ordreTokenPublicacio(op.expectedUpdatedAt))) throw errorProjeccioCataleg('confirmacio-invalida');
        await confirma(op ? { ...row, seq: op.seq } : row, audiencia, saved);
      }
    }
    /* La cua ha avançat tot el que podia. Les incidències que queden s'avisen
       sense cap crida al servidor: l'esborrany continua desat localment. */
    const incidencies = (await llista()).filter(registreProjeccioPendent)
      .flatMap(row => AUDIENCIES.filter(a => teIncidencia(row, a)).map(audiencia => ({ clau: row.clau, audiencia, codi: row.incidencies[audiencia].codi })));
    if (incidencies.length) throw Object.assign(errorProjeccioCataleg('incidencia-versio'), { incidencies });
  }
  return {
    prepara, llista, desa, adoptaVersionsRemotes, resolIncidencia,
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
