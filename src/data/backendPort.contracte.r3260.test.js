// @vitest-environment node
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { parse } from '@babel/parser';
import { afterEach, expect, test, vi } from 'vitest';
import * as port from './backendPort.js';
import * as contract from './contracte.js';
import { estatPort } from './backendPortEstat.js';

// Golden independent de l'ABI anterior al refactor, preimatge SHA-256
// 52843897386db625939b7e124436254faaeef24538cbc0f79ace008ad183327a.
// C10 afegix eliminaPerATothom sense llevar cap dels 186 noms anteriors.
// No es genera des del contracte viu durant la prova: un nom nou o un canvi
// d'ordre han d'obligar a revisar explícitament els bindings del port.
const ABI = Object.freeze([
  "loadCoreContent",
  "loadMur",
  "loadMultimedia",
  "loadNotes",
  "appendChatMessages",
  "appendSectionSubmissionNetworkOnly",
  "updateNote",
  "loginWithMagicLink",
  "registerWithPassword",
  "loginWithPassword",
  "loginWithGoogle",
  "listMyOrganizations",
  "createOrganization",
  "updateOrganization",
  "updateProfile",
  "updateUserPassword",
  "getProfile",
  "recullTornadaOAuth",
  "logout",
  "getCurrentUser",
  "getBackendConfigurat",
  "getRuntimeDataMode",
  "getDefaultUserId",
  "createNote",
  "loadFils",
  "loadMissatges",
  "enviaMissatge",
  "marcaLlegit",
  "creaFilDirecte",
  "carregaMembres",
  "subscribeToXat",
  "unsubscribeFromXat",
  "prefixMitjansPublics",
  "classificaCamiMitja",
  "esReferenciaMitjaPrivada",
  "normalitzaVerificacioRecuperacio",
  "urlAutoritzacioGoogle",
  "bescanviaCodiOAuth",
  "confirmaCapturaCrdtRural",
  "registraDenunciaDiligent",
  "revisaDenunciaDiligent",
  "llistaDenunciesDiligents",
  "revocaPublicacioMur",
  "drenaRevocacionsMur",
  "encuaRevocacioNotaMur",
  "lligPublicadorsRegistrats",
  "traspassaPublicacio",
  "reverteixTraspasPublicacio",
  "loadProjeccionsCataleg",
  "adminResumSessionsDispositius",
  "adminLlistaSessionsDispositius",
  "estatCuradoriaCultural",
  "llistaAportacionsCulturals",
  "enviaAportacioCultural",
  "revisaAportacioCultural",
  "consultaIAIA",
  "loadRitmeXat",
  "actualitzaPresenciaXat",
  "carregaAccionsMissatges",
  "alternaReaccio",
  "alternaDestacat",
  "alternaFixat",
  "eliminaPerAMi",
  "eliminaPerATothom",
  "creaCarpetaNotes",
  "adminActualitzaPublicacioEditorial",
  "loadSeedRevisions",
  "desaRevisioSeed",
  "desaPublicacioPropia",
  "llistaRevisionsPagina",
  "desaRevisioPagina",
  "restauraRevisioPagina",
  "llistaRevisionsPatrimoni",
  "desaRevisioPatrimoni",
  "esborraRevisioPatrimoni",
  "adoptaSessioExterna",
  "loadNotesPage",
  "llegixCopiaCompte",
  "restauraCopiaCompte",
  "loadSeccioPage",
  "adminListUsers",
  "adminListOrganizations",
  "adminLlistaUsuarisRegistrats",
  "adminAssignaMembreOrganitzacio",
  "adminConnectaUsuari",
  "importaMunicipiOpenData",
  "confirmaCorreu",
  "reenviaVerificacioCorreu",
  "demanaRestablimentCorreu",
  "restablixContrasenyaAmbCorreu",
  "refrescaSessio",
  "elMeuRol",
  "uploadToStorage",
  "getPublicUrl",
  "resolveAsset",
  "promoteToPublic",
  "llistaElsMeusMitjans",
  "esborraElMeuMitja",
  "quotaXat",
  "publicaAdjuntXat",
  "urlAdjuntXat",
  "descartaAdjuntXat",
  "publicaIdentitatXat",
  "laMevaIdentitatXat",
  "desaFraseXat",
  "clausDeXat",
  "desaLlibretaXat",
  "laMevaLlibretaXat",
  "estatXifratXat",
  "epoquesDelFilXat",
  "sobresMeusXat",
  "obriEpocaXat",
  "enviaXifratXat",
  "reembolcallaXat",
  "demanaXifratXat",
  "publicaAdjuntXifratXat",
  "bytesAdjuntXat",
  "loadActesAgenda",
  "exportaLesMeuesDades",
  "estatBaixa",
  "demanaBaixa",
  "cancelaBaixa",
  "estatConsentiment",
  "registraConsentiment",
  "revocaConsentiment",
  "mouNota",
  "esborraNota",
  "loadPerfilPublic",
  "listPublicOrganizations",
  "listMyAgents",
  "updateAgent",
  "reclamaOrganitzacio",
  "lesMevesReclamacions",
  "llegeixContacteOrganitzacio",
  "desaContacteOrganitzacio",
  "obriFilDePagina",
  "comprovaServidor",
  "versioMinimaClient",
  "demanaRecuperacioContrasenya",
  "definixContrasenyaNova",
  "entraAmbTokenDeProveidor",
  "llistaMembresOrganitzacio",
  "desaMembreOrganitzacio",
  "llevaMembreOrganitzacio",
  "transfereixPropietatOrganitzacio",
  "llistaFactors",
  "inscriuFactor",
  "reptaFactor",
  "verificaFactor",
  "retiraFactor",
  "adminDesaPersonalitzacio",
  "adminHistorialPersonalitzacio",
  "adminLlistaPobles",
  "adminLligPersonalitzacio",
  "denunciaContingut",
  "llistaBloquejos",
  "bloquejaAutor",
  "desbloquejaAutor",
  "registraDenunciaPublica",
  "adminSafataDenuncies",
  "adminRevisaDenuncia",
  "estatNormes",
  "acceptaNormes",
  "segueix",
  "deixaDeSeguir",
  "estatSeguiment",
  "elsMeusSeguiments",
  "quiEmSegueix",
  "loadTitularPublic",
  "estatTitularPublic",
  "marcaTitularPublic",
  "llegixDadesObertes",
  "restauraDadesObertes",
  "desaDispositiuAvisos",
  "retiraDispositiuAvisos",
  "silenciaFil",
  "preferenciesConnexions",
  "desaVisibilitatConnexions",
  "connexionsPubliquesDe",
  "membresIEntitatsConnectadesDe",
  "inclouPersonaEnEntitat",
  "solicitaUnirSeAEntitat",
  "llistaRevisionsEditorialsWp",
  "desaRevisioEditorialWp",
  "lligConsensIsoglossesPoble",
  "votaVariantIsoglossaPoble",
  "desaAportacioVeuPoble",
]);
// Excepcions: 11 wrappers especials i els dos delegats PURE de portabilitat.
const CUSTOM = Object.freeze({
  "updateNote": "abb9f8b828bdc33c08ecd44e22e73f7db50781c50dd15b7a19dfa98a963de26b",
  "recullTornadaOAuth": "596c26f78dce6c00b04028b85f1962fb1120c19f33de0e3f760caf537058ead6",
  "prefixMitjansPublics": "e743a739169f4b08ffe61bcdaaff22d601f50bdff8d8df3b2c800db3ead1cad3",
  "classificaCamiMitja": "228a62f8747e63881c2c39c7c4130782ce0a940589231b614f6829dd70b1a1a4",
  "esReferenciaMitjaPrivada": "99c5f164a581897ab8d400cd46a37597dbd9457b2462ac609de337b3105c1b72",
  "normalitzaVerificacioRecuperacio": "8e36fa9e1b96d0354dc17bc9558494b227b15e245b15e6a10b8fe6359f5f4249",
  "urlAutoritzacioGoogle": "515352ce494337f8186ca4fed9e468de4e440191a7eca9d00ad57667581b53a4",
  "bescanviaCodiOAuth": "8c17c1c94b1f83100493794a9096520d1b951f8a5f3d74a887d8a2bb682272fa",
  "llegixCopiaCompte": "65753e06f5ce370c670a7840f708a7a00adfe7173caa210d99a7078577d55e2e",
  "restauraCopiaCompte": "42d4e9a8dcf94f06450611a65285a9c58dd8338d4f7d71c12dae494a5376b274",
  "uploadToStorage": "b854333f8f5f5520913c1c8bcce80b1df240d739ea4fc3d0209d0e5d84236dd4",
  "mouNota": "b33c4de88e85637c6952acad1eb57a7b9257c789ab364ff270018262f347e57c",
  "esborraNota": "12b5acaf97e96c845d92a59be1dd5b9efd1c220a64e991f6c4f7f946ebbdf49d"
});
const GENERIC = ABI.filter(name => !Object.hasOwn(CUSTOM, name));
const READS = ['loadCoreContent', 'loadMur', 'loadMultimedia', 'loadNotes', 'loadNotesPage'];
const HELPERS = ['destroy', 'freezeImplementation', 'getBackendImplementation',
  'setBackendImplementation', 'teCapacitat', 'validaBackendImplementation'];
const sha = text => createHash('sha256').update(text).digest('hex');
const readSource = () => fs.readFileSync(new URL('./backendPort.js', import.meta.url), 'utf8');
const parseSource = text => parse(text, { sourceType: 'module' }).program.body;
function mapperOf(body) {
  const declaration = body.flatMap(node => node.type === 'VariableDeclaration' ? node.declarations : [])
    .find(node => node.id.name === 'metodesDelContracte'
      && node.init?.type === 'CallExpression' && node.init.callee?.type === 'MemberExpression'
      && node.init.callee.object.name === 'CONTRACTE_BACKEND'
      && node.init.callee.property.name === 'map' && node.init.arguments[0]?.name === 'asseguraMetode');
  const aliases = body.filter(node => node.type === 'ExportNamedDeclaration')
    .flatMap(node => node.declaration?.declarations ?? [])
    .filter(node => node.init?.type === 'MemberExpression' && node.init.object.name === 'metodesDelContracte');
  return { declaration, aliases };
}
function assertAbi(order, mapper) {
  if (JSON.stringify(order) !== JSON.stringify(ABI)) throw new Error('ABI drift: noms o ordre del contracte.');
  if (!mapper.declaration || mapper.aliases.length !== GENERIC.length) throw new Error('ABI drift: nombre de bindings.');
  for (const name of GENERIC) {
    const alias = mapper.aliases.find(node => node.id.name === name);
    if (!alias?.init.computed || alias.init.property.type !== 'NumericLiteral'
      || alias.init.property.value !== ABI.indexOf(name)) throw new Error('ABI drift: binding de ' + name);
  }
}
afterEach(() => {
  port.destroy(); estatPort.currentImpl = null; estatPort.isLocked = false;
  vi.doUnmock('./contracte.js');
});

function backend() {
  const calls = [], marker = Object.freeze({ result: 'synthetic-unique-return' });
  const failure = new Error('synthetic-unique-cause');
  const value = { marker, notes: [], noteFolders: [], feedPosts: [], events: [],
    marketItems: [], towns: [], pages: [], agents: [], mediaItems: [] };
  const impl = Object.fromEntries(ABI.map(name => [name, function (...args) {
    calls.push({ name, receiver: this, args });
    if (args[0]?.fail) throw failure;
    return READS.includes(name) ? value : marker;
  }]));
  return { impl, calls, marker, failure, value };
}
async function checkForwarding(api, name) {
  const fixture = backend(); api.setBackendImplementation(fixture.impl);
  const query = { payload: 'kept' }, options = { flag: 'kept' };
  const result = await api[name](query, options);
  const call = fixture.calls.at(-1);
  if (call?.name !== name) throw new Error('ABI drift: ' + name + ' delega en ' + call?.name);
  expect(call.receiver).toBe(fixture.impl); expect(call.args).toHaveLength(2);
  if (READS.includes(name)) {
    expect(result.marker).toBe(fixture.marker); expect(call.args[1].flag).toBe('kept');
    expect(call.args[1].signal).toBeInstanceOf(AbortSignal);
    expect(call.args[0]).toEqual(name === 'loadNotesPage' ? { ...query, signal: call.args[1].signal } : query);
    expect(estatPort.lecturesEnVol.size).toBe(0);
  } else {
    expect(result).toBe(fixture.marker); expect(call.args[0]).toBe(query); expect(call.args[1]).toBe(options);
  }
  let caught;
  try { await api[name]({ fail: true }, options); } catch (error) { caught = error; }
  expect(caught).toBe(fixture.failure);
  if (!contract.CONTRACTE_NUCLI.includes(name)) {
    api.setBackendImplementation(Object.fromEntries(contract.CONTRACTE_NUCLI.map(key => [key, () => null])));
    expect(() => api[name](query, options)).toThrow('[backendPort] El mètode "' + name + '" no està implementat al backend actual.');
  }
}

test('ABI C10: 187 noms, 174 bindings i 13 excepcions, preservant els 186 noms anteriors', () => {
  expect(ABI).toHaveLength(187); expect(GENERIC).toHaveLength(174); expect(Object.keys(CUSTOM)).toHaveLength(13);
  assertAbi(contract.CONTRACTE_BACKEND, mapperOf(parseSource(readSource())));
  expect(Object.keys(port).sort()).toEqual([...ABI, ...HELPERS].sort());
});

test('els cossos de guardes i les 13 excepcions de la taula conserven els bytes de la preimatge', () => {
  const source = readSource(), body = parseSource(source), start = source.indexOf('/* C8 · ABI');
  expect(start).toBeGreaterThan(0); expect(sha(source.slice(0, start))).toBe('e9c9657d620916aebb86c529d6d907004f86f67de4a02b441d2d64b423fcc093');
  for (const [name, expected] of Object.entries(CUSTOM)) {
    const node = body.find(n => n.type === 'ExportNamedDeclaration'
      && n.declaration?.declarations?.some(d => d.id.name === name));
    expect(node, name).toBeTruthy(); expect(sha(source.slice(node.start, node.end)), name).toBe(expected);
  }
});

test.each(GENERIC)('forwarding públic exacte de %s: this, arguments, retorn, causa i absent opcional', async name => {
  await checkForwarding(port, name);
});

test.each(READS)('la forma invàlida de %s continua refusada pel guard del port', async name => {
  const fixture = backend(); fixture.impl[name] = () => null; port.setBackendImplementation(fixture.impl);
  await expect(port[name]({}, {})).rejects.toMatchObject({ codi: 'BACKEND_RESPOSTA_INVALIDA' });
  expect(estatPort.lecturesEnVol.size).toBe(0);
});

test('calibració negativa: swap real de dos ordinals del contracte fa fallar l’oracle de forwarding', async () => {
  const wrong = [...contract.CONTRACTE_BACKEND]; [wrong[0], wrong[1]] = [wrong[1], wrong[0]];
  expect(() => assertAbi(wrong, mapperOf(parseSource(readSource())))).toThrow('ABI drift');
  // El port real s'avalua amb el contracte mutat. No és només una comparació
  // de strings: el transport canari mostra que el nom públic apunta al veí.
  vi.doMock('./contracte.js', () => ({ ...contract, CONTRACTE_BACKEND: Object.freeze(wrong) }));
  const mutant = await import('./backendPort.js?c8-order-drift');
  try { await expect(checkForwarding(mutant, ABI[0])).rejects.toThrow('ABI drift'); }
  finally { mutant.destroy(); vi.doUnmock('./contracte.js'); }
});
