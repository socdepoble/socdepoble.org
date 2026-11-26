import * as protocolPublicPort from './backendProtocolPublic.js';
import { CODI_BACKEND_INABASTABLE } from './errorsBackend.js';
import { heretaServeiXifratXat } from './xifratXatServei.js';
import { CONTRACTE_BACKEND, CONTRACTE_NUCLI, CAPACITATS } from './contracte.js';
/* P0-16 (consola del Mestre, 261103) · L'adaptador, el segell, el desmuntatge
   i les lectures en vol no viuen ací sinó a backendPortEstat.js, un per
   document: una instància nova d'este mòdul (el ?t= de l'HMR) veu el mateix
   backend segellat que la vella, en compte de nàixer buida. */
import { estatPort } from './backendPortEstat.js';
import { versioSessio } from './identitat.js';

const avortaLectures = () => { for (const control of estatPort.lecturesEnVol) control.abort(); estatPort.lecturesEnVol.clear(); };
const FORMES_LECTURA = Object.freeze({ loadCoreContent: ['towns', 'pages', 'agents'], loadMur: ['feedPosts', 'events', 'marketItems'], loadMultimedia: ['mediaItems'], loadNotes: ['notes', 'noteFolders'], loadNotesPage: ['notes'] });
const esFila = v => v !== null && typeof v === 'object' && !Array.isArray(v);
/* Una clau que no és una llista rebutja la lectura sencera. Un forat dins d'una
   llista (un null, un número) només cau ell: la doctrina PN-02 de
   CoreContentContext (nomesFitxes) és que la resta de fitxes es pinta. Mai es
   muta la resposta de l'adaptador; una llista neta es torna tal qual. */
function validaLectura(nom, valor) {
  if (!esFila(valor) || FORMES_LECTURA[nom].some(clau => !Array.isArray(valor[clau]))) {
    throw Object.assign(new TypeError(`[backendPort] Resposta invàlida de ${nom}.`), { codi: 'BACKEND_RESPOSTA_INVALIDA' });
  }
  const ambForats = FORMES_LECTURA[nom].filter(clau => !valor[clau].every(esFila));
  if (!ambForats.length) return valor;
  const net = { ...valor };
  for (const clau of ambForats) net[clau] = valor[clau].filter(esFila);
  return net;
}
function lligAmbGuardes(nom, args, backend) {
  const control = new AbortController();
  const config = args[1] && typeof args[1] === 'object' ? args[1] : {};
  const avorta = () => control.abort();
  const senyals = [...new Set([config.signal, ...(nom === 'loadNotesPage' ? [args[0]?.signal] : [])].filter(Boolean))];
  if (senyals.some(s => typeof s.addEventListener !== 'function' || typeof s.removeEventListener !== 'function')) return Promise.reject(new TypeError('AbortSignal invàlid.'));
  if (senyals.some(s => s.aborted)) return Promise.reject(new DOMException('Operació cancel·lada.', 'AbortError'));
  const deslliga = () => { for (const signal of senyals) { try { signal.removeEventListener('abort', avorta); } catch { /* Continuar la neteja. */ } } };
  try { for (const signal of senyals) signal.addEventListener('abort', avorta, { once: true }); }
  catch (error) { deslliga(); return Promise.reject(error); }
  estatPort.lecturesEnVol.add(control);
  let rebutja;
  const interrompuda = new Promise((_resol, reject) => { rebutja = reject; });
  const talla = () => rebutja(control.signal.reason ?? new DOMException('Operació cancel·lada.', 'AbortError'));
  control.signal.addEventListener('abort', talla, { once: true });
  const rellotge = setTimeout(() => control.abort(Object.assign(new Error('El backend no ha respost a temps.'), { name: 'TimeoutError', codi: CODI_BACKEND_INABASTABLE })), 15000);
  const feina = Promise.resolve().then(() => {
    if (control.signal.aborted) throw control.signal.reason;
    return backend[nom](nom === 'loadNotesPage' ? { ...args[0], signal: control.signal } : args[0], { ...config, signal: control.signal });
  }).then(async valor => {
    if (control.signal.aborted || estatPort.currentImpl !== backend) throw new DOMException('Operació cancel·lada.', 'AbortError');
    const net = validaLectura(nom, valor);
    if (nom !== 'loadMur') return net;
    // El llibre és un tros diferit: mai entra al paquet síncron del port.
    const { completaMurAmbWiki } = await import('./wikiAlMur.js');
    const mur = await completaMurAmbWiki(net);
    if (control.signal.aborted || estatPort.currentImpl !== backend) throw new DOMException('Operació cancel·lada.', 'AbortError');
    return mur;
  });
  return Promise.race([feina, interrompuda]).finally(() => {
    clearTimeout(rellotge); deslliga(); control.signal.removeEventListener('abort', talla); estatPort.lecturesEnVol.delete(control);
  });
}
const EMPTY = Object.freeze(Object.create(null));

export function setBackendImplementation(impl, force = false) {
  const isDev = import.meta.env?.DEV === true ||
    (typeof process !== 'undefined' && process.env.NODE_ENV === 'development');
  if (estatPort.isLocked && !(force && isDev)) throw new Error('[backendPort] Backend bloquejat');
  if (!impl || typeof impl !== 'object') throw new TypeError('[backendPort] Implementació invàlida');
  const prepared = validaBackendImplementation(impl);
  // Commit després de validar-ho tot; cap mètode de la implementació vella sobreviu.
  avortaLectures();
  estatPort.dispose?.();
  estatPort.currentImpl = prepared.candidate;
  estatPort.dispose = prepared.dispose;
}
export function validaBackendImplementation(impl) {
  if (!impl || typeof impl !== 'object') throw new TypeError('[backendPort] Implementació invàlida');
  const candidate = Object.create(null);
  for (const name of CONTRACTE_BACKEND) {
    // La resolució normal conserva l'override de la instància/subclasse.
    // Els getters no s'executen com a efecte lateral de validar el contracte.
    let owner = impl, descriptor;
    while (owner && owner !== Object.prototype) {
      descriptor = Object.getOwnPropertyDescriptor(owner, name);
      if (descriptor) break;
      owner = Object.getPrototypeOf(owner);
    }
    if (!descriptor) continue;
    /* Sanejament R15 (B2) · Una capacitat opcional que l'adaptador apaga en compilar
       s'exporta com a `undefined` (src/data/supabase/index.js, banderes de build literals):
       és absent, com si no s'exportara. Un getter o un altre valor continuen rebutjats, i
       un mètode del nucli absent ho diu la comprovació «Nucli incomplet» de baix. */
    if ('value' in descriptor && descriptor.value === undefined && !CONTRACTE_NUCLI.includes(name)) continue;
    if (!('value' in descriptor) || typeof descriptor.value !== 'function')
      throw new TypeError(`[backendPort] ${name} ha de ser un mètode`);
    candidate[name] = descriptor.value.bind(impl);
  }
  const missing = CONTRACTE_NUCLI.filter(name => typeof candidate[name] !== 'function');
  if (missing.length) throw new Error(`[backendPort] Nucli incomplet: ${missing.join(', ')}`);
  for (const [cap, methods] of Object.entries(CAPACITATS)) {
    const count = methods.filter(name => typeof candidate[name] === 'function').length;
    if (count && count !== methods.length) throw new Error(`[backendPort] Capacitat parcial: ${cap}`);
  }
  let teardownOwner = impl, teardown;
  while (teardownOwner && teardownOwner !== Object.prototype) {
    teardown = Object.getOwnPropertyDescriptor(teardownOwner, 'destroy');
    if (teardown) break;
    teardownOwner = Object.getPrototypeOf(teardownOwner);
  }
  if (teardown && (!('value' in teardown) || typeof teardown.value !== 'function'))
    throw new TypeError('[backendPort] destroy invàlid');
  Object.freeze(candidate);
  heretaServeiXifratXat(impl, candidate);
  return { candidate, dispose: teardown ? teardown.value.bind(impl) : null };
}
export function getBackendImplementation() { return estatPort.currentImpl || EMPTY; }
export function freezeImplementation() {
  if (!estatPort.currentImpl) throw new Error('[backendPort] No hi ha backend per segellar');
  estatPort.isLocked = true;
}
export function destroy() { avortaLectures(); const fn = estatPort.dispose; estatPort.dispose = null; return fn?.(); }
export function teCapacitat(cap) {
  const impl = estatPort.currentImpl;
  return Object.hasOwn(CAPACITATS, cap) && !!impl && CAPACITATS[cap].every(name => typeof impl[name] === 'function');
}

const asseguraMetode = (nom) => (...args) => {
  const backend = estatPort.currentImpl;
  if (!backend || typeof backend[nom] !== 'function') {
    throw new Error(`[backendPort] El mètode "${nom}" no està implementat al backend actual.`);
  }
  return Object.hasOwn(FORMES_LECTURA, nom) ? lligAmbGuardes(nom, args, backend) : backend[nom](...args);
};

// R21 · La mutació remota és CAS i el trigger revoca dins de la mateixa
// transacció. Si falla el transport, la cua guarda ID+revisió sense cap GET
// previ. No s'anuncia un DELETE local reeixit: l'error original continua.
// Gauntlet R22 (dades-02, notes-02) · Només s'encua quan hi ha alguna cosa a
// retirar: l'acte publicat (revocaPublicacioId). Una nota que no s'ha publicat
// mai no té res al Mur, i el servidor no pot confirmar mai una retirada sense
// acte (42501 si ja no hi és, 40001 si la revisió ha avançat): la fila quedava
// pendent per sempre. Amb l'acte, el servidor sempre convergix (retired_at).
// Gauntlet R22 (dades-04) · Si encuar falla (sense IndexedDB, diari ple, o un
// mode que no és el remot), l'error que es llança és l'ORIGINAL (el 409 o el
// 404 que el Bloc llig per a refrescar), amb la marca revocacioNoPersistida, i
// mai revocacioPendent: no hi ha cap retirada pendent que es puga prometre.
const mutacioDeNota = (nom, retira) => (...args) => {
  const backend = estatPort.currentImpl;
  if (!backend || typeof backend[nom] !== 'function') return asseguraMetode(nom)(...args);
  const actor = backend.getCurrentUser?.()?.id;
  const epoch = versioSessio;
  const result = backend[nom](...args);
  const revision = args[nom === 'esborraNota' ? 1 : 2];
  if (!retira(args) || typeof backend.encuaRevocacioNotaMur !== 'function'
      || !Number.isSafeInteger(revision) || revision < 0 || !result?.catch) return result;
  const config = args[nom === 'esborraNota' ? 2 : 3] || {};
  const publicacioId = (nom === 'updateNote' ? args[1]?.revocaPublicacioId : null) || config.revocaPublicacioId || null;
  if (!publicacioId) return result;
  return result.catch(async error => {
    // Conservar la voluntat també davant 403/404: el desplegament o permís pot canviar.
    const transport = error?.name !== 'AbortError' && error?.revocacioNoReencuar !== true;
    if (transport && estatPort.currentImpl === backend && backend.getCurrentUser?.()?.id === actor && epoch === versioSessio) {
      let encuada;
      try {
        encuada = await backend.encuaRevocacioNotaMur(args[0], revision, config, publicacioId);
      } catch (causa) {
        if (error && typeof error === 'object') error.revocacioNoPersistida = causa?.codi || causa?.name || true;
        throw error;
      }
      if (encuada?.pendent !== false && error && typeof error === 'object') error.revocacioPendent = true;
    }
    throw error;
  });
};

/* C8 · ABI: els noms ja viuen a CONTRACTE_BACKEND. Esta taula evita repetir
   174 literals en l'arrencada i conserva els exports Identifier de les portes.
   Els índexs són l'ordre canònic del contracte: backendPort.contracte.r3260.test.js
   acredita cada nom/target i refusa canvis d'ordre amb un mutant real.
   Les 13 excepcions conserven el codi propi: updateNote, recullTornadaOAuth,
   els sis mètodes de protocol/OAuth, uploadToStorage, mouNota i esborraNota,
   més els dos delegats PURE llegixCopiaCompte/restauraCopiaCompte, que continuen
   permetent eliminar les capacitats opcionals de portabilitat no consumides. */
const metodesDelContracte = CONTRACTE_BACKEND.map(asseguraMetode);

export const adoptaSessioExterna = metodesDelContracte[75];
export const getDefaultUserId = metodesDelContracte[22];
export const refrescaSessio = metodesDelContracte[90];
export const confirmaCorreu = metodesDelContracte[86];
export const reenviaVerificacioCorreu = metodesDelContracte[87];
export const demanaRestablimentCorreu = metodesDelContracte[88];
export const restablixContrasenyaAmbCorreu = metodesDelContracte[89];
export const elMeuRol = metodesDelContracte[91];

export const loadCoreContent = metodesDelContracte[0];
export const loadMur = metodesDelContracte[1];
export const loadMultimedia = metodesDelContracte[2];
export const loadNotesPage = metodesDelContracte[76];
/* Decisió 4 del Mestre (261007) · «Carregar-ne més» (capacitat
   'paginacioSeccions'). No és nucli: MurContext pregunta abans amb
   teCapacitat i, sense ella, no ofereix el botó. */
export const loadSeccioPage = metodesDelContracte[79];
export const loadProjeccionsCataleg = metodesDelContracte[48];
export const loadNotes = metodesDelContracte[3];
export const appendChatMessages = metodesDelContracte[4];

export const appendSectionSubmissionNetworkOnly = metodesDelContracte[5];
export const desaPublicacioPropia = metodesDelContracte[68];
export const llistaRevisionsPagina = metodesDelContracte[69];
export const desaRevisioPagina = metodesDelContracte[70];
export const restauraRevisioPagina = metodesDelContracte[71];
export const updateNote = mutacioDeNota('updateNote', args => args[1]?.isPublished === false);
export const revocaPublicacioMur = metodesDelContracte[42];
export const drenaRevocacionsMur = metodesDelContracte[43];
export const encuaRevocacioNotaMur = metodesDelContracte[44];
export const loginWithMagicLink = metodesDelContracte[7];
export const registerWithPassword = metodesDelContracte[8];
export const loginWithPassword = metodesDelContracte[9];
export const loginWithGoogle = metodesDelContracte[10];
export const listMyOrganizations = metodesDelContracte[11];
export const createOrganization = metodesDelContracte[12];
export const updateOrganization = metodesDelContracte[13];
export const updateProfile = metodesDelContracte[14];
export const updateUserPassword = metodesDelContracte[15];
export const getProfile = metodesDelContracte[16];
export const recullTornadaOAuth = async (...args) => {
  await import('../host.js').then(m => m.quanLlest());
  const backend = estatPort.currentImpl;
  if (!backend || typeof backend['recullTornadaOAuth'] !== 'function') {
    return Promise.reject(new Error(`[backendPort] El mètode "recullTornadaOAuth" no està implementat al backend actual.`));
  }
  return backend['recullTornadaOAuth'](...args);
};
export const logout = metodesDelContracte[18];
export const getCurrentUser = metodesDelContracte[19];
export const getBackendConfigurat = metodesDelContracte[20];
export const getRuntimeDataMode = metodesDelContracte[21];


// Nous mètodes per al Xat v2 i el pont amb Notes
export const createNote = metodesDelContracte[23];
export const creaCarpetaNotes = metodesDelContracte[64];
export const loadFils = metodesDelContracte[24];
export const loadMissatges = metodesDelContracte[25];
export const enviaMissatge = metodesDelContracte[26];
export const marcaLlegit = metodesDelContracte[27];
export const loadRitmeXat = metodesDelContracte[56];
export const actualitzaPresenciaXat = metodesDelContracte[57];
/* P0-122 · Grup opcional complet; estat local i optimisme són del servei. */
export const carregaAccionsMissatges = metodesDelContracte[58];
export const alternaReaccio = metodesDelContracte[59];
export const alternaDestacat = metodesDelContracte[60];
export const alternaFixat = metodesDelContracte[61];
export const eliminaPerAMi = metodesDelContracte[62];
export const eliminaPerATothom = metodesDelContracte[63];
export const creaFilDirecte = metodesDelContracte[28];
export const carregaMembres = metodesDelContracte[29];
export const subscribeToXat = metodesDelContracte[30];
export const unsubscribeFromXat = metodesDelContracte[31];

// Mode Administrador
export const adminListUsers = metodesDelContracte[80];
export const adminLlistaUsuarisRegistrats = metodesDelContracte[82];
export const adminAssignaMembreOrganitzacio = metodesDelContracte[83];
export const adminConnectaUsuari = metodesDelContracte[84];
export const adminListOrganizations = metodesDelContracte[81];


/* Fase 4 · Mitjans (capacitat 'mitjans').
   Cap component importa Supabase: demanen la capacitat i, si no hi és,
   es queden amb el comportament d'abans. */
export const uploadToStorage = async (...args) => {
  await import('../host.js').then(m => m.quanLlest());
  const backend = estatPort.currentImpl;
  if (!backend || typeof backend['uploadToStorage'] !== 'function') {
    throw new Error(`[backendPort] El mètode "uploadToStorage" no està implementat al backend actual.`);
  }
  return backend['uploadToStorage'](...args);
};
export const getPublicUrl = metodesDelContracte[93];
export const resolveAsset = metodesDelContracte[94];
export const promoteToPublic = metodesDelContracte[95];

/* Pla 261018_1605 (Tasca 4, D8; ordre del Mestre, 18-10-2026) · La biblioteca
   de fotos pròpies (capacitat 'mitjansPropis'). No és nucli ni part de
   'mitjans': «Multimèdia» pregunta abans amb teCapacitat i, sense ella, només
   pinta les fotos actives de la fitxa. */
export const llistaElsMeusMitjans = metodesDelContracte[96];
export const esborraElMeuMitja = metodesDelContracte[97];
export const quotaXat = metodesDelContracte[98];
export const publicaAdjuntXat = metodesDelContracte[99];
export const urlAdjuntXat = metodesDelContracte[100];
export const descartaAdjuntXat = metodesDelContracte[101];

/* P1-12 · Capacitats E2EE opcionals de §8.3. Delegació exacta: no crea claus,
   no activa xifratge ni fabrica un transport absent. Pregunta teCapacitat
   abans d'usar el grup; un mètode absent conserva el rebuig del port. */
export const publicaIdentitatXat = metodesDelContracte[102];
export const laMevaIdentitatXat = metodesDelContracte[103];
export const desaFraseXat = metodesDelContracte[104];
export const clausDeXat = metodesDelContracte[105];
export const desaLlibretaXat = metodesDelContracte[106];
export const laMevaLlibretaXat = metodesDelContracte[107];
export const estatXifratXat = metodesDelContracte[108];
export const epoquesDelFilXat = metodesDelContracte[109];
export const sobresMeusXat = metodesDelContracte[110];
export const obriEpocaXat = metodesDelContracte[111];
export const enviaXifratXat = metodesDelContracte[112];
export const reembolcallaXat = metodesDelContracte[113];
export const demanaXifratXat = metodesDelContracte[114];
export const publicaAdjuntXifratXat = metodesDelContracte[115];
export const bytesAdjuntXat = metodesDelContracte[116];

/* Fase 5 · Agenda */
export const loadActesAgenda = metodesDelContracte[117];

/* Fase 1 · Compte i consentiment (capacitats 'compte' i 'consentiment').
   Cap és nucli: la interfície pregunta abans amb teCapacitat, perquè
   asseguraMetode llança de manera síncrona si el backend no les té. */
export const exportaLesMeuesDades = metodesDelContracte[118];
export const llegixCopiaCompte = /* @__PURE__ */ asseguraMetode('llegixCopiaCompte');
export const restauraCopiaCompte = /* @__PURE__ */ asseguraMetode('restauraCopiaCompte');
export const estatBaixa = metodesDelContracte[119];
export const demanaBaixa = metodesDelContracte[120];
export const cancelaBaixa = metodesDelContracte[121];
export const estatConsentiment = metodesDelContracte[122];
export const registraConsentiment = metodesDelContracte[123];
export const revocaConsentiment = metodesDelContracte[124];

/* Cicle de vida de les notes (capacitat 'cicleNotes'). Tampoc és nucli:
   l'editor només pinta «Borrar» si teCapacitat('cicleNotes'). */
export const mouNota = mutacioDeNota('mouNota', args => ['paperera','arxivada'].includes(args[1]));
export const esborraNota = mutacioDeNota('esborraNota', () => true);

/* Lògica d'Usuari · perfil públic (capacitat 'directori') i agents IA
   administrats (capacitat 'agents'). Cap és nucli: la interfície pregunta
   abans amb teCapacitat. */
export const loadPerfilPublic = metodesDelContracte[127];
/* Pla 261022_1955 (T1) · El directori públic de les organitzacions (capacitat
   'directoriEntitats'). No és nucli: /cerca pregunta abans amb teCapacitat i,
   sense ella, no el demana. */
export const listPublicOrganizations = metodesDelContracte[128];
/* T2 · D04/D10 (assalt 261101) · Les dades obertes del poble (capacitat
   'dadesObertes') i la seua restauració ('restauracioDadesObertes'). No són
   nucli ni van a FORMES_LECTURA: null hi és una resposta vàlida (com
   listPublicOrganizations, la forma la valida qui crida). */
export const llegixDadesObertes = metodesDelContracte[171];
export const restauraDadesObertes = metodesDelContracte[172];
export const importaMunicipiOpenData = metodesDelContracte[85];
export const listMyAgents = metodesDelContracte[129];
export const updateAgent = metodesDelContracte[130];

/* T43 (ordre del Mestre, 260928) · Administrar organitzacions (capacitat
   'reclamacions') i el seu correu opcional ('contacteOrganitzacio'). Cap és
   nucli: la interfície pregunta abans amb teCapacitat. */
export const reclamaOrganitzacio = metodesDelContracte[131];
export const lesMevesReclamacions = metodesDelContracte[132];
export const llegeixContacteOrganitzacio = metodesDelContracte[133];
export const desaContacteOrganitzacio = metodesDelContracte[134];

/* T63.2 i T67 · El xat comú d'una Pàgina Universal (capacitat 'xatDePagina').
   No és nucli: XatContext pregunta abans amb teCapacitat i, sense ella,
   rebutja amb un error de codi 'sense-capacitat'. */
export const obriFilDePagina = metodesDelContracte[135];

/* T2 i T4 · Salut del node (capacitat 'salut'). No és nucli: /registre
   pregunta abans amb teCapacitat i, sense ella, canvia de mode com abans. */
export const comprovaServidor = metodesDelContracte[136];

/* T8b · P0-23 (BOT-A2; assalt 261101) · La versió mínima de l'app nativa
   (capacitat 'versioClient'). No és nucli: l'entrada nativa pregunta abans
   amb teCapacitat i, sense ella, l'app entra com sempre. */
export const versioMinimaClient = metodesDelContracte[137];

/* R (Onada 3, 261003) · Recuperar la contrasenya (capacitat
   'recuperacioContrasenya'). No és nucli: /registre pregunta abans amb
   teCapacitat i, sense ella, no pinta l'enllaç. R2 · definixContrasenyaNova
   verifica l'enllaç pendent i definix en una sola crida (contracte.js). */
export const demanaRecuperacioContrasenya = metodesDelContracte[138];
export const definixContrasenyaNova = metodesDelContracte[139];

/* Fase D (261020, tasca 1) · Entrar amb el testimoni d'un proveïdor (capacitat
   'entradaAmbToken'): el full natiu d'Apple o de Google. No és nucli: /registre
   pregunta abans amb teCapacitat i, sense ella, no pinta els botons natius. */
export const entraAmbTokenDeProveidor = metodesDelContracte[140];

/* Ordre del Mestre (261008, grup C) · Els membres d'una organització
   (capacitat 'membresOrganitzacio'). No és nucli: el Perfil pregunta abans
   amb teCapacitat i, sense ella, no pinta la gestió de membres ni «Eixir». */
export const llistaMembresOrganitzacio = metodesDelContracte[141];
export const desaMembreOrganitzacio = metodesDelContracte[142];
export const llevaMembreOrganitzacio = metodesDelContracte[143];
/* IDEA-24 (marató 261101_2143, B4) · La transferència atòmica de la
   propietat (capacitat 'transferenciaPropietat'). No és nucli: qui l'oferisca
   ha de preguntar abans amb teCapacitat i, sense ella, no oferir-la. */
export const transfereixPropietatOrganitzacio = metodesDelContracte[144];

/* Onada 11 (261010; prompt 261010_1730, tasca 2) · El segon factor del
   superadmin (capacitat 'segonFactor'). No és nucli: «El compte» pregunta
   abans amb teCapacitat i, sense ella, no pinta la inscripció. */
export const llistaFactors = metodesDelContracte[145];
export const inscriuFactor = metodesDelContracte[146];
export const reptaFactor = metodesDelContracte[147];
export const verificaFactor = metodesDelContracte[148];
export const retiraFactor = metodesDelContracte[149];

/* Onada 11 (261010; prompt 261010_1730, tasca 2) · La personalització del
   poble (capacitat 'personalitzacio'). No és nucli: el Tauler pregunta abans
   amb teCapacitat i, sense ella, no pinta «Desa». La lectura va dins de
   loadCoreContent (camp additiu `personalitzacio`). */
export const adminDesaPersonalitzacio = metodesDelContracte[150];
export const adminHistorialPersonalitzacio = metodesDelContracte[151];
export const adminActualitzaPublicacioEditorial = metodesDelContracte[65];
export const lligPublicadorsRegistrats = metodesDelContracte[45];
export const traspassaPublicacio = metodesDelContracte[46];
export const reverteixTraspasPublicacio = metodesDelContracte[47];
export const loadSeedRevisions = metodesDelContracte[66];
export const desaRevisioSeed = metodesDelContracte[67];
export const llistaRevisionsPatrimoni = metodesDelContracte[72];
export const desaRevisioPatrimoni = metodesDelContracte[73];
export const esborraRevisioPatrimoni = metodesDelContracte[74];
export const adminLlistaPobles = metodesDelContracte[152];
export const adminLligPersonalitzacio = metodesDelContracte[153];

/* Fase D (261020, tasca 2; pla 261020_1300) · La moderació (capacitat
   'moderacio') i les normes de convivència ('normesConvivencia'). Cap és
   nucli: ModeracioContext pregunta abans amb teCapacitat i, sense elles,
   cap targeta ni bombolla no pinta «Més opcions» ni cap porta de normes. */
export const denunciaContingut = metodesDelContracte[154];
export const registraDenunciaPublica = metodesDelContracte[158];
export const adminSafataDenuncies = metodesDelContracte[159];
export const adminRevisaDenuncia = metodesDelContracte[160];
export const llistaBloquejos = metodesDelContracte[155];
export const bloquejaAutor = metodesDelContracte[156];
export const desbloquejaAutor = metodesDelContracte[157];
export const estatNormes = metodesDelContracte[161];
export const acceptaNormes = metodesDelContracte[162];

/* T6b (IDEA-14; decisió del Mestre, 261024) · «Connectar / Seguir», el
   seguiment d'un sol sentit d'una persona o d'una entitat (capacitat
   'seguiments'). No és nucli: /connectar i el Perfil pregunten abans amb
   teCapacitat i, sense ella, no pinten «Connectar amb {nom}» ni el veïnat connectat. */
export const segueix = metodesDelContracte[163];
export const deixaDeSeguir = metodesDelContracte[164];
export const estatSeguiment = metodesDelContracte[165];
export const elsMeusSeguiments = metodesDelContracte[166];
export const quiEmSegueix = metodesDelContracte[167];

/* IDEA-22, punt 2 (Directiva del Mestre; pla 261025_0200) · La persona
   titular d'una entitat, només si ella ho ha triat (capacitat
   'titularPublic'), i la seua tria (capacitat 'consentimentTitular'). Cap és
   nucli: /connectar i la gestió dels membres pregunten abans amb teCapacitat. */
export const loadTitularPublic = metodesDelContracte[168];
export const estatTitularPublic = metodesDelContracte[169];
export const marcaTitularPublic = metodesDelContracte[170];

/* B8C-2 (marató 261101_2143; Bloc B8) · Els aparells dels avisos push del
   Xat (capacitat 'avisosPush') i el silenci d'una conversa ('silenciXat').
   Cap és nucli: la interfície pregunta abans amb teCapacitat i, sense elles,
   no oferix l'interruptor dels avisos i el silenci es queda en la memòria
   de la pàgina. */
export const desaDispositiuAvisos = metodesDelContracte[173];
export const retiraDispositiuAvisos = metodesDelContracte[174];
export const silenciaFil = metodesDelContracte[175];

/* FEDI23 · capacitat opcional completa, sense fallback que publique privats. */
export const preferenciesConnexions = metodesDelContracte[176];
export const desaVisibilitatConnexions = metodesDelContracte[177];
export const connexionsPubliquesDe = metodesDelContracte[178];
export const membresIEntitatsConnectadesDe = metodesDelContracte[179];
export const inclouPersonaEnEntitat = metodesDelContracte[180];
export const solicitaUnirSeAEntitat = metodesDelContracte[181];

export const consultaIAIA = metodesDelContracte[55];

/* R15 · Autoritat de sessions i curadoria resolta exclusivament pel servidor. */
export const adminResumSessionsDispositius = metodesDelContracte[49];
export const adminLlistaSessionsDispositius = metodesDelContracte[50];
export const estatCuradoriaCultural = metodesDelContracte[51];
export const llistaAportacionsCulturals = metodesDelContracte[52];
export const enviaAportacioCultural = metodesDelContracte[53];
export const revisaAportacioCultural = metodesDelContracte[54];

/* P0-111 / R30 P1-79 · Revisions WP: desa({wpId,estat,nota,autoria,desti,
   actualitzatEsperat}) és CAS. null/absent només crea; una fila existent
   requerix l’instant opac llegit del mateix backend. conflicte-versio conserva
   l’esborrany local i requerix revisió explícita abans del reintent. Un
   servidor sense RPC CAS rebutja amb no-disponible: l’esborrany queda al
   navegador i mai no es prova una signatura antiga sense guarda. */
export const llistaRevisionsEditorialsWp = metodesDelContracte[182];
export const desaRevisioEditorialWp = metodesDelContracte[183];

/* R24 · CODEX-R24-03 · El consens del joc «D'on parles?» (capacitat 'consensIsoglosses'). No és
   nucli: la targeta pregunta abans si el backend segellat té el mètode i, sense ell, es queda
   amb la llavor i el dispositiu. */
export const lligConsensIsoglossesPoble = metodesDelContracte[184];
export const votaVariantIsoglossaPoble = metodesDelContracte[185];
export const desaAportacioVeuPoble = metodesDelContracte[186];

/* v1.2.25 · Costures 8 i 9 · La cerca dins d'una conversa (capacitat 'xatCerca', C1). No és nucli i cap pantalla
   no la consumix encara (les costures 15 i 16 la cablaran): la que ho faça ha de preguntar abans amb teCapacitat i,
   sense ella o amb 'sense-capacitat', cercar només en els missatges carregats. */
export const cercaMissatgesFil = metodesDelContracte[187];
export const cercaMissatgesFilPaginada = metodesDelContracte[188];
export const carregaMissatgeFilPerId = metodesDelContracte[189];

/* R32.13 optional capabilities; absence is explicit, never a synthetic ACK. */
export const confirmaCapturaCrdtRural = metodesDelContracte[38];
export const registraDenunciaDiligent = metodesDelContracte[39];
export const revisaDenunciaDiligent = metodesDelContracte[40];
export const llistaDenunciesDiligents = metodesDelContracte[41];

/* R32.19 · API pública completa del port. Les consultes pures també es
   poden importar de la seua fulla neutral, sense carregar la resta del port. */
export const prefixMitjansPublics = protocolPublicPort.prefixMitjansPublics;
export const classificaCamiMitja = protocolPublicPort.classificaCamiMitja;
export const esReferenciaMitjaPrivada = protocolPublicPort.esReferenciaMitjaPrivada;
export const normalitzaVerificacioRecuperacio = protocolPublicPort.normalitzaVerificacioRecuperacio;
export const urlAutoritzacioGoogle = protocolPublicPort.urlAutoritzacioGoogle;
export const bescanviaCodiOAuth = protocolPublicPort.bescanviaCodiOAuth;
