/* Kit de conformitat del port (261006) · NOMÉS PROVES.
   Un adaptador és conforme quan cada CAS d'este fitxer passa amb ell. Les
   signatures són les del port tal com les crida la interfície: config va
   sempre l'últim i les opcions d'una crida del Xat viatgen dins de config
   (limit, llegitFinsSeq…). La presència del nucli i de les capacitats ja la
   comprova validaBackendImplementation (backendPort.js); ací es mira el que
   tornen.
   Pur: només importa el contracte. No importa cap adaptador ni cap corredor
   de proves; qui el passa decidix com. L'adaptador Supabase el passa dues
   vegades (src/data/supabase/conformitat.test.js): en mode 'seed' i sense
   xarxa, i en mode 'remote' amb un doble del servidor (fetch i supabase-js
   falsos que servixen captures congelades amb les columnes de les
   migracions). Un altre adaptador que trie Sóc de Poble s'hi enxufa igual,
   amb un fetch de mentida que servisca les seues captures reals.
   Els casos d'ESCRIPTURA (escriu: true) només corren amb
   contextDeConformitat({ escriptures: true }): creen dades. */
import {
  CAPACITATS, CODI_MODERACIO, COLECCIONS_DADES_OBERTES, CONTRACTE_NUCLI, LIMIT_DADES_OBERTES, SECCIONS_PAGINABLES, TIPUS_BLOQUEJAT, TIPUS_SEGUIT
} from '../contracte.js';

/* ── Ajudants de forma: cada un torna la llista de falles (buida = conforme). ── */

const tipusDe = (valor) => (valor === null ? 'null' : Array.isArray(valor) ? 'array' : typeof valor);
const esObjecte = (valor) => tipusDe(valor) === 'object';
const esTextNoBuit = (valor) => typeof valor === 'string' && valor.trim() !== '';
const esEnter = (valor) => Number.isSafeInteger(valor) && valor >= 0;
const teId = (element) => esObjecte(element) && element.id !== null && element.id !== undefined && String(element.id) !== '';

function exigixLlistes(valor, claus) {
  if (!esObjecte(valor)) return [`havia de ser un objecte i és ${tipusDe(valor)}`];
  const falles = [];
  for (const clau of claus) {
    if (!Array.isArray(valor[clau])) falles.push(`${clau} havia de ser una llista i és ${tipusDe(valor[clau])}`);
    else if (!valor[clau].every(teId)) falles.push(`${clau} té elements sense id`);
  }
  return falles;
}

const exigixLlistaAmbId = (valor, nom) => {
  if (!Array.isArray(valor)) return [`${nom} havia de ser una llista i és ${tipusDe(valor)}`];
  return valor.every(teId) ? [] : [`${nom} té elements sense id`];
};

/* Una Conversa del Xat (supabase/xat.js mapejaFil, localXat conversaDe). */
function fallesDeConversa(fil) {
  if (!teId(fil)) return ['una conversa sense id'];
  const falles = [];
  if (!esTextNoBuit(fil.tipus)) falles.push(`la conversa ${fil.id} no té tipus`);
  for (const clau of ['ultimSeq', 'llegitFinsSeq', 'rebutFinsSeq', 'noLlegits']) {
    if (!esEnter(fil[clau])) falles.push(`la conversa ${fil.id} té ${clau} = ${JSON.stringify(fil[clau])}`);
  }
  if (!Array.isArray(fil.altres)) falles.push(`la conversa ${fil.id} no porta la llista altres`);
  return falles;
}

/* Un Missatge del Xat: seq enter, text o null (els de sistema). */
function fallesDeMissatge(missatge, filId) {
  if (!teId(missatge)) return ['un missatge sense id'];
  const falles = [];
  if (!esEnter(missatge.seq)) falles.push(`el missatge ${missatge.id} té seq = ${JSON.stringify(missatge.seq)}`);
  if (String(missatge.filId) !== String(filId)) falles.push(`el missatge ${missatge.id} és del fil ${missatge.filId}, no del ${filId}`);
  if (missatge.text !== null && typeof missatge.text !== 'string') falles.push(`el missatge ${missatge.id} té un text que no és text ni null`);
  if (!esTextNoBuit(missatge.tipus)) falles.push(`el missatge ${missatge.id} no té tipus`);
  return falles;
}

/* Decisió 4 del Mestre (261007) · El camp ADDITIU i opcional `paginacio` de
   loadMur (capacitat 'paginacioSeccions'): absent, o un objecte amb un cursor
   de text per a cada secció de SECCIONS_PAGINABLES que té més pàgines. */
function fallesDePaginacio(paginacio) {
  if (paginacio === undefined) return [];
  if (!esObjecte(paginacio)) return [`paginacio havia de ser un objecte i és ${tipusDe(paginacio)}`];
  return Object.entries(paginacio).flatMap(([seccio, cursor]) => [
    ...(Object.hasOwn(SECCIONS_PAGINABLES, seccio) ? [] : [`paginacio porta una secció que no es pagina: ${seccio}`]),
    ...(esTextNoBuit(cursor) ? [] : [`el cursor de ${seccio} havia de ser text no buit i és ${tipusDe(cursor)}`])
  ]);
}

/* Onada 11 (261010; prompt 261010_1730, tasca 2) · El camp ADDITIU i opcional
   `personalitzacio` de loadCoreContent (capacitat 'personalitzacio'): absent,
   o un objecte amb taxonomia i estil, cada una null o { payload, versio }. */
const CLAUS_PERSONALITZACIO = ['taxonomia', 'estil'];
function fallesDePersonalitzacio(personalitzacio) {
  if (personalitzacio === undefined) return [];
  if (!esObjecte(personalitzacio)) return [`personalitzacio havia de ser un objecte i és ${tipusDe(personalitzacio)}`];
  return CLAUS_PERSONALITZACIO.flatMap((clau) => {
    const valor = personalitzacio[clau];
    if (valor === null) return [];
    if (!esObjecte(valor)) return [`personalitzacio.${clau} havia de ser null o { payload, versio } i és ${tipusDe(valor)}`];
    return [
      ...(esObjecte(valor.payload) ? [] : [`personalitzacio.${clau}.payload havia de ser un objecte`]),
      ...(esEnter(valor.versio) ? [] : [`personalitzacio.${clau}.versio havia de ser un enter`])
    ];
  });
}

/* Onada 11 · Un rebuig del port amb un `code` de text (CODI_SEGON_FACTOR,
   CODI_PERSONALITZACIO, errorsBackend.js): la interfície decidix pel codi. */
const rebuigAmbCode = (error) => (error instanceof Error && esTextNoBuit(error.code)
  ? []
  : [`havia de rebutjar amb un Error amb code: ${tipusDe(error)} ${JSON.stringify(error?.code ?? null)}`]);
/* Fase D (261020, tasca 2) · Un rebuig amb un code concret (CODI_MODERACIO). */
const rebuigAmbCodi = (esperat) => (error) => [
  ...rebuigAmbCode(error),
  ...(error?.code === undefined || error.code === esperat ? [] : [`el code havia de ser ${esperat} i és ${JSON.stringify(error.code)}`])
];
const CODIS_SENSE_SEGON_FACTOR = ['cal-segon-factor', 'sense-sessio'];
const rebuigSenseSegonFactor = (error) => [
  ...rebuigAmbCode(error),
  ...(error?.code === undefined || CODIS_SENSE_SEGON_FACTOR.includes(error.code) ? [] : [`el code havia de ser ${CODIS_SENSE_SEGON_FACTOR.join(' o ')} i és ${JSON.stringify(error.code)}`])
];

/* Una pàgina de loadSeccioPage: elements amb id, complete boolean i
   nextCursor null només quan és completa. */
const fallesDePaginaDeSeccio = (pagina) => [
  ...exigixLlistes(pagina, ['elements']),
  ...(typeof pagina?.complete === 'boolean' ? [] : ['complete havia de ser boolean']),
  ...(pagina?.complete === (pagina?.nextCursor === null) ? [] : ['complete i nextCursor null han d’anar junts']),
  ...(pagina?.nextCursor === null || esTextNoBuit(pagina?.nextCursor) ? [] : ['nextCursor havia de ser null o text no buit'])
];

/* T8b · P0-23 (BOT-A2; assalt 261101) · La versió mínima de l'app nativa
   (capacitat 'versioClient'): null, o { versioMinima: enter ≥ 1, enllac:
   text https | null } i res més. */
const CAMPS_DE_VERSIO_MINIMA = Object.freeze(['versioMinima', 'enllac']);
const fallesDeVersioMinima = (valor) => {
  if (valor === null) return [];
  if (!esObjecte(valor)) return [`havia de ser null o un objecte i és ${tipusDe(valor)}`];
  return [
    ...(Number.isSafeInteger(valor.versioMinima) && valor.versioMinima >= 1 ? [] : [`versioMinima havia de ser un enter ≥ 1: ${JSON.stringify(valor.versioMinima)}`]),
    ...(valor.enllac === null || (typeof valor.enllac === 'string' && /^https:\/\/\S+$/.test(valor.enllac)) ? [] : [`enllac havia de ser null o una adreça https: ${JSON.stringify(valor.enllac)?.slice(0, 120)}`]),
    ...Object.keys(valor).filter((camp) => !CAMPS_DE_VERSIO_MINIMA.includes(camp)).map((camp) => `la versió mínima porta un camp de més: ${camp}`)
  ];
};

/* T6b (IDEA-14) · Un seguiment o un seguidor: id de text, nom de text o
   null, creatAl ISO o null. L'id del seguit de conformitat té forma d'UUID
   perquè en remot arribe al servidor, i no és de ningú. */
const ID_SEGUIT_DE_CONFORMITAT = '00000000-0000-4000-8000-00000000c0f0';
/* IDEA-22 · Una entitat amb forma d'UUID que no existix: no l'administra ningú. */
const ID_ENTITAT_DE_CONFORMITAT = '00000000-0000-4000-8000-00000000c0f1';
const fallesDeSeguidor = (s, nom) => [
  ...(esTextNoBuit(s?.id) ? [] : [`un ${nom} sense id de text`]),
  ...(s?.nom === null || typeof s?.nom === 'string' ? [] : [`el ${nom} ${s?.id} té un nom que no és text ni null`]),
  ...(s?.creatAl === null || esTextNoBuit(s?.creatAl) ? [] : [`el ${nom} ${s?.id} té un creatAl que no és text ni null`])
];

/* IDEA-22, punt 2 (pla 261025_0200) · La titular de loadTitularPublic: null o
   { tipus: 'persona', id, nom, avatar } i res més. Mai cap correu ni cap rol:
   qui administra una entitat no es dedueix mai d'esta lectura. */
const CAMPS_DE_TITULAR = Object.freeze(['tipus', 'id', 'nom', 'avatar']);
const motiuDelCampDeMes = (camp) => (/mail|correu/i.test(camp) ? `la titular porta un correu (${camp})`
  : /^(role|rol)$/i.test(camp) ? `la titular porta un rol (${camp})` : `la titular porta un camp de més: ${camp}`);
const fallesDeTitular = (valor) => {
  if (valor === null) return [];
  if (!esObjecte(valor)) return [`havia de ser null o un objecte i és ${tipusDe(valor)}`];
  return [
    ...(valor.tipus === 'persona' ? [] : [`la titular té tipus ${JSON.stringify(valor.tipus)}`]),
    ...(esTextNoBuit(valor.id) ? [] : ['la titular no té id de text']),
    ...(esTextNoBuit(valor.nom) ? [] : ['la titular no té nom']),
    ...(typeof valor.avatar === 'string' ? [] : ['l’avatar de la titular no és text']),
    ...Object.keys(valor).filter((camp) => !CAMPS_DE_TITULAR.includes(camp)).map(motiuDelCampDeMes)
  ];
};

/* Els fils on la interfície pot escriure: una comunitat no té missatges propis
   i al canal només hi escriuen els administradors (contracte del Xat §1-§3). */
const ESCRIVIBLE = (fil) => !['comunitat', 'canal'].includes(fil?.tipus);

/* ── Els casos, en ordre: alguns deixen al context el que necessiten els següents. ── */

/**
 * @typedef {object} Cas
 * @property {string} metode      nom del port
 * @property {string|null} capacitat  null si és del nucli
 * @property {boolean} escriu      crea o canvia dades
 * @property {'resol'|'rebutja'} espera
 * @property {string} titol        la signatura i el que s'espera
 * @property {string[]} requerix   claus del context que han d'estar plenes
 * @property {(ctx: object) => any[]} arguments
 * @property {(valor: any, ctx: object) => string[]} comprova
 * @property {(valor: any, ctx: object) => void} [desa]
 */
const cas = (definicio) => Object.freeze({ capacitat: null, escriu: false, espera: 'resol', requerix: [], ...definicio });


/* FEDI-17 · Casos additius. Les precondicions són del corredor, mai una
   detecció del proveïdor: compte operatiu, compte en mode de prova o sense
   sessió són escenaris diferents. El kit no adopta credencials ni activa
   transports privats per defecte. Les guardes amb dataMode seed ho diuen
   al títol; no acrediten cap petició remota. */
const esInstant = v => typeof v === 'string' && Number.isFinite(Date.parse(v));
const rebuigAmbMissatge = missatge => e => e instanceof Error && e.message === missatge
  ? [] : [`havia de rebutjar amb el missatge de domini: ${missatge}`];
const senseSessio = e => e instanceof Error && /^Cal iniciar sessió[. ]/.test(e.message)
  ? [] : ['havia de rebutjar per falta de sessió'];
const fallesBaixa = demanada => v => !esObjecte(v) ? ['la baixa havia de ser un objecte'] : [
  ...(v.demanada === demanada ? [] : ['estat de baixa incorrecte']),
  ...(demanada ? (esInstant(v.demanadaAl) && esInstant(v.purgaPrevistaAl)
    && Date.parse(v.purgaPrevistaAl) > Date.parse(v.demanadaAl) ? [] : ['dates de quarantena invàlides'])
    : (v.demanadaAl === null && v.purgaPrevistaAl === null ? [] : ['una baixa no demanada havia de tindre dates null']))
];
const argumentsCompte = (metode, ctx) => metode === 'registraConsentiment' ? ['analitica', 'conformitat-v1', ctx.config]
  : metode === 'revocaConsentiment' ? ['analitica', ctx.config]
    : metode === 'demanaBaixa' ? [{ motiu: 'conformitat' }, ctx.config] : [ctx.config];
const casosCompte = (metode, comprova, escriu = false) => [
  cas({ metode, capacitat: CAPACITATS.compte.includes(metode) ? 'compte' : 'consentiment', escriu,
    requerix: ['compteOperatiu'], titol: `${metode}: compte operatiu de prova, resultat del contracte`,
    arguments: ctx => argumentsCompte(metode, ctx), comprova }),
  cas({ metode, capacitat: CAPACITATS.compte.includes(metode) ? 'compte' : 'consentiment', espera: 'rebutja',
    requerix: ['compteModeProva'], titol: `${metode}: compte remot en mode seed rebutja mode-local sense transport`,
    arguments: ctx => argumentsCompte(metode, ctx), comprova: rebuigAmbCodi('mode-local') }),
  cas({ metode, capacitat: CAPACITATS.compte.includes(metode) ? 'compte' : 'consentiment', espera: 'rebutja',
    requerix: ['compteSenseSessio'], titol: `${metode}: compte local sense sessió rebutja sense canviar dades`,
    arguments: ctx => argumentsCompte(metode, ctx), comprova: senseSessio })
];

function casosFedi17() {
  return [
    cas({ metode: 'appendChatMessages', escriu: true, requerix: ['filEscrivible'],
      titol: 'appendChatMessages: dos textos confirmats en ordre i en el mateix fil',
      arguments: ctx => [[{ filId: ctx.filEscrivible, text: 'Conformitat lot 1' }, { threadId: ctx.filEscrivible, text: 'Conformitat lot 2' }], ctx.config],
      comprova: (v, ctx) => !Array.isArray(v) || v.length !== 2 ? ['el lot havia de confirmar dos missatges'] : [
        ...v.flatMap(m => fallesDeMissatge(m, ctx.filEscrivible)),
        ...(v[0]?.text === 'Conformitat lot 1' && v[1]?.text === 'Conformitat lot 2' ? [] : ['textos del lot alterats o desordenats']),
        ...(v[0]?.seq < v[1]?.seq ? [] : ['seq del lot no ascendent'])
      ] }),
    cas({ metode: 'creaFilDirecte', escriu: true, requerix: ['destinatariDirecte'],
      titol: 'creaFilDirecte: destinatari explícit de prova, identificador de fil no buit',
      arguments: ctx => [ctx.destinatariDirecte, 'Conformitat directa', ctx.config],
      comprova: v => esTextNoBuit(v) ? [] : ['el fil directe no té identificador'], desa: (v, ctx) => { ctx.filDirecte = v; } }),
    cas({ metode: 'loadFils', escriu: true, requerix: ['filDirecte'],
      titol: 'loadFils: el fil directe creat es retroba amb el destinatari demanat', arguments: ctx => [ctx.config],
      comprova: (v, ctx) => Array.isArray(v) && v.some(f => f.id === ctx.filDirecte && f.tipus === 'directe' && f.altres?.some(a => a.id === ctx.destinatariDirecte))
        ? [] : ['el fil directe no es retroba amb el destinatari demanat'] }),
    cas({ metode: 'appendSectionSubmissionNetworkOnly', escriu: true, requerix: ['publicacioOperativa'],
      titol: 'appendSectionSubmissionNetworkOnly: conserva id, autora, secció i text publicat',
      arguments: ctx => [{ id: ctx.idPublicacio, sectionId: 'mur', title: 'Publicació de conformitat', description: 'Text del contracte', actor: { tipus: 'persona', id: ctx.ownerUserId } }, ctx.config],
      comprova: (v, ctx) => !esObjecte(v) ? ['la publicació no és un objecte'] : [
        ...(v.id === ctx.idPublicacio && v.ownerUserId === ctx.ownerUserId && v.sectionId === 'mur' && v.authorOrgId === null ? [] : ['identitat o autoria de la publicació alterada']),
        ...(v.title === 'Publicació de conformitat' && v.description === 'Text del contracte' && esObjecte(v.payload) ? [] : ['contingut publicat alterat'])
      ] }),
    cas({ metode: 'appendSectionSubmissionNetworkOnly', espera: 'rebutja', requerix: ['compteModeProva'],
      titol: 'appendSectionSubmissionNetworkOnly: mode seed remot rebutja mode-local sense publicar',
      arguments: ctx => [{ sectionId: 'mur', title: 'No es publica' }, ctx.config], comprova: rebuigAmbCodi('mode-local') }),
    cas({ metode: 'appendSectionSubmissionNetworkOnly', espera: 'rebutja', requerix: ['compteSenseSessio'],
      titol: 'appendSectionSubmissionNetworkOnly: sense sessió local no publica',
      arguments: ctx => [{ sectionId: 'mur' }, ctx.config], comprova: senseSessio }),
    cas({ metode: 'loginWithMagicLink', espera: 'rebutja',
      titol: 'loginWithMagicLink: servei desactivat o mode-local, mai èxit de sessió',
      arguments: ctx => ['conformitat@poble.invalid', { ...ctx.config, dataMode: 'seed' }],
      comprova: e => e?.code === 'mode-local' ? rebuigAmbCodi('mode-local')(e)
        : rebuigAmbMissatge("L'entrada per Magic Link està temporalment desactivada per seguretat (manca PKCE). Utilitza l'entrada amb Google.")(e) }),
    ...['registerWithPassword', 'loginWithPassword', 'loginWithGoogle', 'recullTornadaOAuth', 'definixContrasenyaNova'].map(metode => cas({
      metode, capacitat: metode === 'definixContrasenyaNova' ? 'recuperacioContrasenya' : null, espera: 'rebutja',
      titol: `${metode}: guarda explícita de mode seed, rebuig mode-local sense credencials reals`,
      arguments: ctx => {
        const config = { ...ctx.config, dataMode: 'seed' };
        return metode === 'registerWithPassword' ? ['conformitat@poble.invalid', 'Prova-no-real-120!', {}, config]
          : metode === 'loginWithPassword' ? ['conformitat@poble.invalid', 'Prova-no-real-120!', config]
            : metode === 'definixContrasenyaNova' ? ['Prova-no-real-120!', config] : [config];
      }, comprova: rebuigAmbCodi('mode-local')
    })),
    cas({ metode: 'createOrganization', espera: 'rebutja',
      titol: 'createOrganization: mode seed no crea cap organització remota',
      arguments: ctx => [{ kind: 'company', name: 'Conformitat', slug: 'conformitat', town_name: 'Poble de conformitat' }, { ...ctx.config, dataMode: 'seed' }],
      comprova: e => e?.code === 'mode-local' ? rebuigAmbCodi('mode-local')(e)
        : rebuigAmbMissatge('Inicia sessió des del formulari d’entrada abans de crear una organització al servidor.')(e) }),
    cas({ metode: 'updateOrganization', espera: 'rebutja',
      titol: 'updateOrganization: cap camp admés rebutja abans de cap escriptura',
      arguments: ctx => [ID_ENTITAT_DE_CONFORMITAT, { campAli: 'no es desa' }, ctx.config],
      comprova: rebuigAmbMissatge('Cap camp de l’organització per desar.') }),
    cas({ metode: 'updateProfile', espera: 'rebutja',
      titol: 'updateProfile: username invàlid rebutja SDP-USER-001 abans de desar',
      arguments: ctx => [{ username: '!' }, ctx.config], comprova: rebuigAmbCodi('SDP-USER-001') }),
    cas({ metode: 'updateUserPassword', espera: 'rebutja', requerix: ['contrasenyaLocal'],
      titol: 'updateUserPassword: adaptador sense servei de credencials rebutja mode-local',
      arguments: ctx => ['Prova-no-real-120!', ctx.config], comprova: rebuigAmbCodi('mode-local') }),
    cas({ metode: 'updateUserPassword', escriu: true, requerix: ['credencialsDeProva'],
      titol: 'updateUserPassword: canvi explícit de credencials al servidor de prova confirma true',
      arguments: ctx => ['Prova-no-real-120!', ctx.config], comprova: v => v === true ? [] : ['el canvi de contrasenya no està confirmat'] }),
    cas({ metode: 'adoptaSessioExterna', capacitat: 'sessioExterna',
      titol: 'adoptaSessioExterna: null no és sessió i retorna false', arguments: ctx => [null, ctx.config],
      comprova: v => v === false ? [] : ['una sessió externa nul·la ha sigut acceptada'] }),
    cas({ metode: 'refrescaSessio', capacitat: 'sessio',
      titol: 'refrescaSessio: retorna boolean sense inventar cap sessió', arguments: ctx => [ctx.config],
      comprova: v => typeof v === 'boolean' ? [] : ['la renovació havia de tornar boolean'] }),
    cas({ metode: 'loadActesAgenda', capacitat: 'agenda',
      titol: 'loadActesAgenda: rang semiobert, actes amb inici i fi compatibles',
      arguments: ctx => [{ desde: '2026-01-01T00:00:00Z', fins: '2027-01-01T00:00:00Z' }, ctx.config],
      comprova: v => !Array.isArray(v) ? ['l’agenda havia de ser una llista'] : v.flatMap(a => [
        ...(teId(a) && esInstant(a.inici) && (a.fi === null || a.fi === undefined || esInstant(a.fi)) ? [] : ['acte sense id o dates vàlides']),
        ...(Date.parse(a?.inici) < Date.parse('2027-01-01T00:00:00Z') && Date.parse(a?.fi ?? a?.inici) >= Date.parse('2026-01-01T00:00:00Z') ? [] : ['acte fora del rang semiobert'])
      ]) }),
    cas({ metode: 'updateAgent', capacitat: 'agents', espera: 'rebutja',
      titol: 'updateAgent: agent inexistent o servei remot absent, mai una fila inventada',
      arguments: ctx => ['conformitat-agent-inexistent', { name: 'No es desa' }, ctx.config],
      comprova: e => e instanceof Error && (e.status === 403 || e.message === "No s'ha pogut actualitzar l'agent."
        || e.message === 'Els agents IA encara no tenen contracte de dades al servidor.') ? [] : ['rebuig de l’agent alié o servei absent incorrecte'] }),
    cas({ metode: 'reclamaOrganitzacio', capacitat: 'reclamacions', espera: 'rebutja',
      titol: 'reclamaOrganitzacio: organització absent rebutja un codi de reclamació',
      arguments: ctx => ['', { justificacio: 'Conformitat sense objectiu' }, ctx.config],
      comprova: e => [...rebuigAmbCode(e), ...(['SDP-CLAIM-000', 'SDP-CLAIM-001'].includes(e?.code) ? [] : ['codi de reclamació incorrecte'])] }),
    ...Object.entries({
      publicaIdentitatXat: ctx => [{ declaracio: {}, autofirma: 'opaca' }, ctx.config],
      laMevaIdentitatXat: ctx => [ctx.config],
      desaFraseXat: ctx => [{ kid: 'opac', frase: 'opaca' }, ctx.config],
      desaLlibretaXat: ctx => [{ comptador: 0, llibreta: { iv: 'opac', ct: 'opac', firma: 'opaca' } }, ctx.config],
      laMevaLlibretaXat: ctx => [ctx.config],
      estatXifratXat: ctx => [[ctx.filId ?? ID_SEGUIT_DE_CONFORMITAT], ctx.config],
      epoquesDelFilXat: ctx => [ctx.filId ?? ID_SEGUIT_DE_CONFORMITAT, 0, ctx.config],
      sobresMeusXat: ctx => [ctx.filId ?? ID_SEGUIT_DE_CONFORMITAT, [1], ctx.config],
      obriEpocaXat: ctx => [ctx.filId ?? ID_SEGUIT_DE_CONFORMITAT, { declaracio: {}, firma: 'opaca' }, ctx.config],
      enviaXifratXat: ctx => [ctx.filId ?? ID_SEGUIT_DE_CONFORMITAT, { id: ctx.idMissatge, text: null, xifrat: { opac: true } }, ctx.config],
      reembolcallaXat: ctx => [ctx.filId ?? ID_SEGUIT_DE_CONFORMITAT, [{ epoca: 1, receptor: ID_SEGUIT_DE_CONFORMITAT, enc: 'opac', ct: 'opac' }], ctx.config],
      demanaXifratXat: ctx => [ctx.filId ?? ID_SEGUIT_DE_CONFORMITAT, ctx.config],
      publicaAdjuntXifratXat: ctx => [ctx.filId ?? ID_SEGUIT_DE_CONFORMITAT, { id: ctx.idMissatge, blob: new Uint8Array(64), mida: 64, xifrat: { opac: true } }, ctx.config],
      bytesAdjuntXat: ctx => [ctx.idMissatge, ctx.config]
    }).map(([metode, argumentsDelCas]) => cas({ metode,
      capacitat: CAPACITATS.clausXat.includes(metode) ? 'clausXat' : 'xatMultimediaXifrat', espera: 'rebutja',
      titol: `${metode}: guarda explícita de mode seed rebutja sense-capacitat, sense claus ni bytes simulats`,
      arguments: ctx => argumentsDelCas({ ...ctx, config: { ...ctx.config, dataMode: 'seed' } }),
      comprova: rebuigAmbCodi('sense-capacitat') })),
    ...[
      ['publicaIdentitatXat', ctx => [{ declaracio: { kid: 'kid-opac' }, autofirma: 'firma-opaca' }, ctx.config], v => v === 'kid-opac' ? [] : ['kid confirmat incorrecte']],
      ['laMevaIdentitatXat', ctx => [ctx.config], (v, ctx) => Array.isArray(v) && v.length === 1 && v[0].usuariId === ctx.ownerUserId && v[0].kid === 'kid-opac'
        && v[0].sigPub === 'sig-opaca' && v[0].dhPub === 'dh-opaca' && esObjecte(v[0].declaracio) && v[0].autofirma === 'firma-opaca' ? [] : ['identitat xifrada mal mapada']],
      ['desaFraseXat', ctx => [{ kid: 'kid-opac', frase: 'frase-xifrada-opaca' }, ctx.config], v => v === true ? [] : ['frase no confirmada']],
      ['desaLlibretaXat', ctx => [{ comptador: 0, llibreta: { iv: 'iv-opac', ct: 'ct-opac', firma: 'firma-opaca' } }, ctx.config], v => v === 1 ? [] : ['comptador de llibreta no incrementat']],
      ['laMevaLlibretaXat', ctx => [ctx.config], v => esObjecte(v) && v.kid === 'kid-opac' && v.comptador === 1 && v.iv === 'iv-opac' && v.ct === 'ct-opac' && v.firma === 'firma-opaca' ? [] : ['llibreta xifrada alterada']],
      ['estatXifratXat', ctx => [[ctx.filId], ctx.config], (v, ctx) => Array.isArray(v) && v.length === 1 && v[0].filId === ctx.filId && v[0].epoca === 1 && v[0].e2eeDesDeSeq === 3 ? [] : ['estat de xifrat mal mapat']],
      ['epoquesDelFilXat', ctx => [ctx.filId, 0, ctx.config], (v, ctx) => Array.isArray(v) && v.length === 1 && v[0].epoca === 1 && v[0].autorId === ctx.ownerUserId && esObjecte(v[0].declaracio) && v[0].firma === 'firma-opaca' ? [] : ['època xifrada mal mapada']],
      ['sobresMeusXat', ctx => [ctx.filId, [1], ctx.config], (v, ctx) => Array.isArray(v) && v.length === 1 && v[0].epoca === 1 && v[0].receptor === ctx.ownerUserId && v[0].kidReceptor === 'kid-opac' && v[0].enc === 'enc-opac' && v[0].ct === 'ct-opac' ? [] : ['sobre opac alterat']],
      ['enviaXifratXat', ctx => [ctx.filId, { id: ctx.idXifrat, text: null, xifrat: { ct: 'ct-opac' } }, ctx.config], (v, ctx) => [
        ...fallesDeMissatge(v, ctx.filId), ...(v?.id === ctx.idXifrat && v?.text === null && v?.xifrat?.ct === 'ct-opac' ? [] : ['el missatge xifrat no conserva id, text null i sobre opac'])
      ]]
    ].map(([metode, argumentsDelCas, comprova]) => cas({ metode, capacitat: 'clausXat', escriu: true, requerix: ['transportXifrat', 'filId'],
      titol: `${metode}: transport opac de prova amb confirmació i mapatge del DTO`, arguments: argumentsDelCas, comprova })),
    ...['inscriuFactor', 'reptaFactor', 'verificaFactor', 'retiraFactor'].map(metode => cas({ metode, capacitat: 'segonFactor', espera: 'rebutja',
      titol: `${metode}: guarda explícita de mode seed rebutja no-disponible sense MFA simulat`,
      arguments: ctx => [metode === 'verificaFactor' ? { factorId: 'conformitat-sense-factor', repteId: 'conformitat-sense-repte', codi: '000000' } : 'conformitat-sense-factor', { ...ctx.config, dataMode: 'seed' }],
      comprova: rebuigAmbCodi('no-disponible') })),
    ...casosCompte('estatBaixa', fallesBaixa(false)),
    ...casosCompte('estatConsentiment', v => !esObjecte(v) ? ['el consentiment havia de ser un objecte'] : [
      ...['versioVigent', 'url', 'textSha256'].flatMap(k => v[k] === null || esTextNoBuit(v[k]) ? [] : [`${k} havia de ser text o null`]),
      ...(Array.isArray(v.consentiments) && v.consentiments.every(a => esTextNoBuit(a?.tipus) && ['accepta', 'revoca'].includes(a?.accio)
        && (a.versio === null || esTextNoBuit(a.versio)) && esInstant(a.al)) ? [] : ['actes de consentiment malformats']),
      ...(typeof v.calReconsentir === 'boolean' ? [] : ['calReconsentir havia de ser boolean'])
    ]),
    ...casosCompte('registraConsentiment', v => {
      /* El port històric no fixa el retorn de registraConsentiment: Supabase
         pot tornar void. La lectura posterior acredita la mutació. */
      return v === undefined || v === null || (esObjecte(v) && v.tipus === 'analitica' && v.accio === 'accepta' && v.versio === 'conformitat-v1' && esInstant(v.al))
        ? [] : ['confirmació de consentiment invàlida'];
    }, true),
    cas({ metode: 'estatConsentiment', capacitat: 'consentiment', escriu: true, requerix: ['compteOperatiu'],
      titol: 'estatConsentiment: el registre analitica es llig com a últim acte accepta', arguments: ctx => [ctx.config],
      comprova: v => Array.isArray(v?.consentiments) && v.consentiments.filter(a => a.tipus === 'analitica').length === 1 && v.consentiments.some(a => a.tipus === 'analitica' && a.accio === 'accepta' && a.versio === 'conformitat-v1' && esInstant(a.al)) ? [] : ['el consentiment registrat no es retroba'] }),
    ...casosCompte('revocaConsentiment', v => v === undefined ? [] : ['revocar havia de resoldre sense valor'], true),
    cas({ metode: 'estatConsentiment', capacitat: 'consentiment', escriu: true, requerix: ['compteOperatiu'],
      titol: 'estatConsentiment: revocar conserva un últim acte revoca', arguments: ctx => [ctx.config],
      comprova: v => Array.isArray(v?.consentiments) && v.consentiments.filter(a => a.tipus === 'analitica').length === 1 && v.consentiments.some(a => a.tipus === 'analitica' && a.accio === 'revoca' && a.versio === null && esInstant(a.al)) ? [] : ['el consentiment revocat no es retroba'] }),
    ...casosCompte('cancelaBaixa', fallesBaixa(false), true),
    ...casosCompte('exportaLesMeuesDades', (v, ctx) => !esObjecte(v) ? ['l’exportació havia de ser un objecte'] : [
      ...(v.format === 'socdepoble.exportacio.v1' ? [] : ['format d’exportació incorrecte']),
      ...(teId(v.perfil) && v.perfil.id === ctx.ownerUserId ? [] : ['l’exportació no pertany a la persona de la sessió']),
      ...['notes', 'consentiments'].flatMap(k => Array.isArray(v[k]) ? [] : [`l’exportació no porta ${k}[]`]),
      ...['seguiments', 'bloquejos'].flatMap(k => v[k] === undefined || Array.isArray(v[k]) ? [] : [`l’exportació porta ${k} malformat`]),
      ...(Array.isArray(v.consentiments) && ['accepta', 'revoca'].every(accio => v.consentiments.some(a => a.tipus === 'analitica' && a.accio === accio)) ? [] : ['l’exportació ha perdut l’historial del consentiment'])
    ]),
    /* La baixa tanca la sessió: cap cas següent necessita sessió ni escriu. */
    ...casosCompte('demanaBaixa', fallesBaixa(true), true),
    cas({ metode: 'logout', escriu: true, titol: 'logout: eixida de pestanya explícita, resol void i el corredor comprova sessió buida',
      arguments: ctx => [ctx.config, { scope: 'local', abast: 'pestanya' }],
      comprova: v => v === undefined ? [] : ['logout havia de resoldre sense valor'] })
  ];
}

export const CASOS = Object.freeze([
  /* Lot 2 PN-01: casos comuns als transports seed i remote. */
  cas({ metode: 'resolveAsset', capacitat: 'mitjans', titol: 'resolveAsset preserva una URL pública sense consultar Storage', arguments: ctx => ['https://example.org/public.webp', ctx.config], comprova: v => v === 'https://example.org/public.webp' ? [] : ['URL pública alterada'] }),
  cas({ metode: 'promoteToPublic', capacitat: 'mitjans', titol: 'promoteToPublic no torna a publicar un recurs ja públic', arguments: ctx => ['https://example.org/public.webp', ctx.config], comprova: v => v === 'https://example.org/public.webp' ? [] : ['recurs públic alterat'] }),
  cas({ metode: 'getPublicUrl', capacitat: 'mitjans', titol: 'getPublicUrl rebutja un bucket buit abans del transport', arguments: ctx => ['', '', ctx.config], espera: 'rebutja', comprova: e => e instanceof Error ? [] : ['rebuig no estructurat'] }),
  cas({ metode: 'uploadToStorage', capacitat: 'mitjans', titol: 'uploadToStorage rebutja una entrada sense Blob', arguments: ctx => [null, {}, ctx.config], espera: 'rebutja', comprova: e => e instanceof Error ? [] : ['rebuig no estructurat'] }),
  cas({ metode: 'adminListUsers', capacitat: 'admin', titol: 'adminListUsers retorna una llista amb ids', arguments: ctx => [10, 0, ctx.config], comprova: v => exigixLlistaAmbId(v, 'persones') }),
  cas({ metode: 'adminListOrganizations', capacitat: 'admin', titol: 'adminListOrganizations retorna una llista amb ids', arguments: ctx => [ctx.config], comprova: v => exigixLlistaAmbId(v, 'organitzacions') }),
  cas({ metode: 'lesMevesReclamacions', capacitat: 'reclamacions', titol: 'lesMevesReclamacions retorna només les pròpies i amb id', arguments: ctx => [ctx.config], comprova: v => exigixLlistaAmbId(v, 'reclamacions') }),
  cas({ metode: 'clausDeXat', capacitat: 'clausXat', titol: 'clausDeXat no accepta un destinatari malformat', arguments: ctx => [['id-no-valid'], ctx.config], espera: 'rebutja', comprova: e => e instanceof Error ? [] : ['rebuig no estructurat'] }),
  /* ── Nucli · lectures ── */
  cas({
    metode: 'getRuntimeDataMode', titol: "getRuntimeDataMode(config) → 'remote' | 'seed' | 'local'",
    arguments: (ctx) => [ctx.config],
    comprova: (mode) => (['remote', 'seed', 'local'].includes(mode) ? [] : [`mode desconegut: ${JSON.stringify(mode)}`])
  }),
  cas({
    metode: 'getBackendConfigurat', titol: 'getBackendConfigurat(config) → boolean',
    arguments: (ctx) => [ctx.config],
    comprova: (valor) => (typeof valor === 'boolean' ? [] : [`havia de ser boolean i és ${tipusDe(valor)}`])
  }),
  cas({
    metode: 'getDefaultUserId', titol: 'getDefaultUserId() → text no buit (la sessió o el convidat)',
    arguments: () => [],
    comprova: (id) => (esTextNoBuit(id) ? [] : [`id buit o de tipus ${tipusDe(id)}`]),
    desa: (id, ctx) => { ctx.ownerUserId = id; }
  }),
  cas({
    metode: 'getCurrentUser', titol: 'getCurrentUser() → null | { id }',
    arguments: () => [],
    comprova: (usuari) => (usuari === null || teId(usuari) ? [] : [`ni null ni usuari amb id: ${tipusDe(usuari)}`])
  }),
  cas({
    metode: 'loadCoreContent', titol: 'loadCoreContent(ownerUserId, config) → { towns[], pages[], agents[], pageCopy, personalitzacio? }',
    requerix: ['ownerUserId'],
    arguments: (ctx) => [ctx.ownerUserId, ctx.config],
    comprova: (valor) => [
      ...exigixLlistes(valor, ['towns', 'agents']),
      ...(Array.isArray(valor?.pages) ? [] : ['pages havia de ser una llista']),
      ...(esObjecte(valor?.pageCopy) ? [] : ['pageCopy havia de ser un objecte']),
      ...fallesDePersonalitzacio(valor?.personalitzacio)
    ]
  }),
  cas({
    metode: 'loadMur', titol: 'loadMur(ownerUserId, config) → { feedPosts[], events[], marketItems[], paginacio? }',
    requerix: ['ownerUserId'],
    arguments: (ctx) => [ctx.ownerUserId, ctx.config],
    comprova: (valor) => [
      ...exigixLlistes(valor, ['feedPosts', 'events', 'marketItems']),
      ...fallesDePaginacio(valor?.paginacio)
    ]
  }),
  cas({
    metode: 'loadMultimedia', titol: 'loadMultimedia(ownerUserId, config) → { mediaItems[] }',
    requerix: ['ownerUserId'],
    arguments: (ctx) => [ctx.ownerUserId, ctx.config],
    comprova: (valor) => exigixLlistes(valor, ['mediaItems'])
  }),
  cas({
    metode: 'loadNotes', titol: 'loadNotes(ownerUserId, config) → { notes[], noteFolders[], notesComplete }',
    requerix: ['ownerUserId'],
    arguments: (ctx) => [ctx.ownerUserId, ctx.config],
    comprova: (valor) => [
      ...exigixLlistes(valor, ['notes', 'noteFolders']),
      ...(typeof valor?.notesComplete === 'boolean' ? [] : ['notesComplete havia de ser boolean'])
    ]
  }),
  cas({
    metode: 'getProfile', titol: 'getProfile(config) → null | { id } de la sessió',
    arguments: (ctx) => [ctx.config],
    comprova: (perfil) => (perfil === null || teId(perfil) ? [] : [`ni null ni perfil amb id: ${tipusDe(perfil)}`])
  }),
  cas({
    metode: 'listMyOrganizations', titol: 'listMyOrganizations(config) → Organitzacio[] (buida sense sessió)',
    arguments: (ctx) => [ctx.config],
    comprova: (llista) => exigixLlistaAmbId(llista, 'organitzacions')
  }),
  cas({
    metode: 'loadFils', titol: 'loadFils(config) → Conversa[] amb seq enters',
    arguments: (ctx) => [ctx.config],
    comprova: (fils) => (Array.isArray(fils) ? fils.flatMap(fallesDeConversa) : [`havia de ser una llista i és ${tipusDe(fils)}`]),
    desa: (fils, ctx) => {
      /* Ordre del Mestre (261007) · Una fila sintètica (Conversa.perDefecte,
         contracte.js) no és cap fil del servidor: ni es llig ni s'hi escriu. */
      const reals = fils.filter((fil) => !fil.perDefecte);
      ctx.filId = reals[0]?.id ?? null;
      ctx.filEscrivible = reals.find(ESCRIVIBLE)?.id ?? null;
    }
  }),
  cas({
    metode: 'loadMissatges', titol: 'loadMissatges(filId, config) → Missatge[] del fil, per seq ascendent',
    requerix: ['filId'],
    arguments: (ctx) => [ctx.filId, ctx.config],
    comprova: (missatges, ctx) => {
      if (!Array.isArray(missatges)) return [`havia de ser una llista i és ${tipusDe(missatges)}`];
      const falles = missatges.flatMap((m) => fallesDeMissatge(m, ctx.filId));
      const seqs = missatges.map((m) => m?.seq);
      if (seqs.some((seq, i) => i > 0 && seq <= seqs[i - 1])) falles.push(`seq no ascendent: ${seqs.join(',')}`);
      return falles;
    }
  }),
  cas({
    metode: 'carregaMembres', titol: 'carregaMembres(text, config) → { usuari_id, nom }[]',
    arguments: (ctx) => ['', ctx.config],
    comprova: (membres) => {
      if (!Array.isArray(membres)) return [`havia de ser una llista i és ${tipusDe(membres)}`];
      return membres.filter((m) => !esTextNoBuit(String(m?.usuari_id ?? '')) || typeof m?.nom !== 'string')
        .map((m) => `membre sense usuari_id o nom: ${JSON.stringify(m)?.slice(0, 120)}`);
    }
  }),
  cas({
    metode: 'subscribeToXat',
    titol: 'subscribeToXat(filId, callback, config) → { subscription, error } (un no-op amb tots dos null és vàlid)',
    requerix: ['filId'],
    arguments: (ctx) => [ctx.filId, (error, avis) => { ctx.avisos.push({ error, avis }); }, ctx.config],
    comprova: (valor) => (esObjecte(valor) && 'subscription' in valor && 'error' in valor
      ? (valor.error ? [`el canal ha tornat error: ${valor.error?.message ?? valor.error}`] : [])
      : ['havia de tornar { subscription, error }']),
    desa: (valor, ctx) => { ctx.subscripcio = valor.subscription; ctx.subscrit = true; }
  }),
  /* El canal pot avisar d'una fallada pel callback després d'haver tornat
     { subscription, error: null }: es comprova en tancar-lo. */
  cas({
    metode: 'unsubscribeFromXat',
    titol: 'unsubscribeFromXat(subscription, config) resol, també amb subscription null; el canal no ha avisat de cap error',
    requerix: ['subscrit'],
    arguments: (ctx) => [ctx.subscripcio, ctx.config],
    comprova: (_valor, ctx) => ctx.avisos.filter((avis) => avis.error)
      .map((avis) => `el canal ha avisat d'un error: ${avis.error?.message ?? avis.error}`)
  }),

  /* ── Nucli · escriptures (només amb escriptures: true) ── */
  cas({
    metode: 'createNote', escriu: true, titol: 'createNote(input, config) → Nota { id, revision: 0 }',
    arguments: (ctx) => [{ title: 'Conformitat', content: '<p>Kit de conformitat</p>' }, ctx.config],
    comprova: (nota) => [
      ...(teId(nota) ? [] : ['la nota no té id']),
      ...(nota?.revision === 0 ? [] : [`revision havia de ser 0 i és ${JSON.stringify(nota?.revision)}`])
    ],
    desa: (nota, ctx) => { ctx.notaId = nota.id; }
  }),
  cas({
    metode: 'updateNote', escriu: true, titol: 'updateNote(id, updates, expectedRevision, config) → revision + 1',
    requerix: ['notaId'],
    arguments: (ctx) => [ctx.notaId, { title: 'Conformitat 2' }, 0, ctx.config],
    comprova: (nota, ctx) => [
      ...(String(nota?.id) === String(ctx.notaId) ? [] : ['torna una altra nota']),
      ...(nota?.revision === 1 ? [] : [`revision havia de ser 1 i és ${JSON.stringify(nota?.revision)}`]),
      ...(nota?.title === 'Conformitat 2' ? [] : ['el títol no s’ha desat'])
    ]
  }),
  cas({
    metode: 'updateNote', escriu: true, espera: 'rebutja',
    titol: 'updateNote amb una revisió vella rebutja amb status 409',
    requerix: ['notaId'],
    arguments: (ctx) => [ctx.notaId, { title: 'Conformitat vella' }, 0, ctx.config],
    comprova: (error) => (error?.status === 409 ? [] : [`havia de ser status 409 i és ${JSON.stringify(error?.status)} (${error?.message})`])
  }),
  cas({
    metode: 'loadNotes', escriu: true,
    titol: 'loadNotes(ownerUserId, { ...config, noteId }) → la nota sencera i noteResolution found',
    requerix: ['ownerUserId', 'notaId'],
    arguments: (ctx) => [ctx.ownerUserId, { ...ctx.config, noteId: ctx.notaId }],
    comprova: (valor, ctx) => {
      const nota = valor?.notes?.find((n) => String(n.id) === String(ctx.notaId));
      return [
        ...(nota ? [] : ['la nota creada no hi és']),
        ...(nota && nota.contentLoaded !== true ? ['el detall havia de portar contentLoaded: true'] : []),
        ...(valor?.noteResolution?.status === 'found' ? [] : [`noteResolution: ${JSON.stringify(valor?.noteResolution)}`])
      ];
    }
  }),
  /* ── P1-27 · Capacitat 'cicleNotes' (paperera, arxiu i esborrat definitiu),
     sobre la nota que han deixat createNote i updateNote (revisió 1). La
     mateixa guarda de revisió que updateNote: una vella rebutja amb 409. ── */
  cas({
    metode: 'mouNota', capacitat: 'cicleNotes', escriu: true,
    titol: "mouNota(id, 'arxivada', expectedRevision, config) → la mateixa nota, estat 'arxivada' i revision + 1",
    requerix: ['notaId'],
    arguments: (ctx) => [ctx.notaId, 'arxivada', 1, ctx.config],
    comprova: (nota, ctx) => [
      ...(String(nota?.id) === String(ctx.notaId) ? [] : ['torna una altra nota']),
      ...(nota?.estat === 'arxivada' ? [] : [`estat havia de ser 'arxivada' i és ${JSON.stringify(nota?.estat)}`]),
      ...(nota?.revision === 2 ? [] : [`revision havia de ser 2 i és ${JSON.stringify(nota?.revision)}`])
    ]
  }),
  cas({
    metode: 'mouNota', capacitat: 'cicleNotes', escriu: true, espera: 'rebutja',
    titol: 'mouNota amb una revisió vella rebutja amb status 409',
    requerix: ['notaId'],
    arguments: (ctx) => [ctx.notaId, 'paperera', 1, ctx.config],
    comprova: (error) => (error?.status === 409 ? [] : [`havia de ser status 409 i és ${JSON.stringify(error?.status)} (${error?.message})`])
  }),
  cas({
    metode: 'esborraNota', capacitat: 'cicleNotes', escriu: true,
    titol: 'esborraNota(id, expectedRevision, config) → { id } de la nota esborrada',
    requerix: ['notaId'],
    arguments: (ctx) => [ctx.notaId, 2, ctx.config],
    comprova: (valor, ctx) => (String(valor?.id) === String(ctx.notaId) ? [] : [`havia de tornar { id: ${JSON.stringify(ctx.notaId)} } i torna ${JSON.stringify(valor)?.slice(0, 120)}`])
  }),
  /* Sense este cas, un esborrat que no esborra passaria per bo. */
  cas({
    metode: 'esborraNota', capacitat: 'cicleNotes', escriu: true, espera: 'rebutja',
    titol: 'esborraNota d’una nota ja esborrada rebutja amb status 404',
    requerix: ['notaId'],
    arguments: (ctx) => [ctx.notaId, 2, ctx.config],
    comprova: (error) => (error?.status === 404 ? [] : [`havia de ser status 404 i és ${JSON.stringify(error?.status)} (${error?.message})`])
  }),
  cas({
    metode: 'enviaMissatge', escriu: true,
    titol: 'enviaMissatge(filId, { id, text }, config) → Missatge amb seq; el mateix id no duplica',
    requerix: ['filEscrivible'],
    arguments: (ctx) => [ctx.filEscrivible, { id: ctx.idMissatge, text: 'Hola des del kit de conformitat' }, ctx.config],
    comprova: (missatge, ctx) => [
      ...fallesDeMissatge(missatge, ctx.filEscrivible),
      ...(String(missatge?.id) === ctx.idMissatge ? [] : ['no conserva l’id de la persona (idempotència)'])
    ],
    desa: (missatge, ctx) => { ctx.seqEnviat = missatge.seq; }
  }),
  cas({
    metode: 'enviaMissatge', escriu: true,
    titol: 'enviaMissatge amb un id ja enviat torna el mateix missatge',
    requerix: ['filEscrivible', 'seqEnviat'],
    arguments: (ctx) => [ctx.filEscrivible, { id: ctx.idMissatge, text: 'Hola des del kit de conformitat' }, ctx.config],
    comprova: (missatge, ctx) => (missatge?.seq === ctx.seqEnviat ? [] : [`un reenviament ha creat el seq ${missatge?.seq} (l’original era ${ctx.seqEnviat})`])
  }),
  cas({
    metode: 'marcaLlegit', escriu: true,
    titol: 'marcaLlegit(filId, { ...config, llegitFinsSeq }) → { llegitFinsSeq, rebutFinsSeq }',
    requerix: ['filEscrivible', 'seqEnviat'],
    arguments: (ctx) => [ctx.filEscrivible, { ...ctx.config, llegitFinsSeq: ctx.seqEnviat }],
    comprova: (marca, ctx) => [
      ...(esEnter(marca?.llegitFinsSeq) && marca.llegitFinsSeq >= ctx.seqEnviat ? [] : [`llegitFinsSeq: ${JSON.stringify(marca?.llegitFinsSeq)}`]),
      ...(esEnter(marca?.rebutFinsSeq) && marca.rebutFinsSeq >= marca.llegitFinsSeq ? [] : [`rebutFinsSeq: ${JSON.stringify(marca?.rebutFinsSeq)}`])
    ]
  }),

  /* ── Capacitats (un adaptador sense la capacitat no les passa: omés) ── */
  cas({
    metode: 'loadNotesPage', capacitat: 'paginacioNotes',
    titol: 'loadNotesPage({ ownerUserId, cursor, limit }, config) → { notes[], complete, nextCursor }',
    requerix: ['ownerUserId'],
    arguments: (ctx) => [{ ownerUserId: ctx.ownerUserId, cursor: null, limit: 50 }, ctx.config],
    comprova: (pagina) => [
      ...exigixLlistes(pagina, ['notes', 'noteFolders']),
      ...(typeof pagina?.complete === 'boolean' ? [] : ['complete havia de ser boolean']),
      ...(pagina?.complete === (pagina?.nextCursor === null) ? [] : ['complete i nextCursor null han d’anar junts'])
    ]
  }),
  /* Decisió 4 del Mestre (261007) · «Carregar-ne més» al Mur i al Mercat. */
  cas({
    metode: 'loadSeccioPage', capacitat: 'paginacioSeccions',
    titol: "loadSeccioPage({ seccio: 'mur', cursor: null, limit }, config) → { elements[], complete, nextCursor }",
    arguments: (ctx) => [{ seccio: 'mur', cursor: null, limit: 50 }, ctx.config],
    comprova: fallesDePaginaDeSeccio
  }),
  cas({
    metode: 'loadSeccioPage', capacitat: 'paginacioSeccions', espera: 'rebutja',
    titol: 'loadSeccioPage d’una secció que no es pagina (notes) rebutja',
    arguments: (ctx) => [{ seccio: 'notes', cursor: null, limit: 50 }, ctx.config],
    comprova: (error) => (error instanceof Error ? [] : [`havia de rebutjar amb un Error: ${tipusDe(error)}`])
  }),
  cas({
    metode: 'comprovaServidor', capacitat: 'salut', titol: 'comprovaServidor(config) → { ok: boolean }, mai rebutja',
    arguments: (ctx) => [ctx.config],
    comprova: (valor) => (typeof valor?.ok === 'boolean' ? [] : [`havia de ser { ok: boolean }: ${JSON.stringify(valor)}`])
  }),
  /* T8b · P0-23 (BOT-A2; assalt 261101) · La versió mínima de l'app nativa:
     una plataforma que no és nativa no en té cap, i la d'Android és null
     (sense servidor o sense la migració) o un enter amb el seu enllaç. Cap
     cas no escriu. */
  cas({
    metode: 'versioMinimaClient', capacitat: 'versioClient',
    titol: "versioMinimaClient('web', config) → null: la web no té cap versió mínima",
    arguments: (ctx) => ['web', ctx.config],
    comprova: (valor) => (valor === null ? [] : [`havia de ser null: ${JSON.stringify(valor)?.slice(0, 120)}`])
  }),
  cas({
    metode: 'versioMinimaClient', capacitat: 'versioClient',
    titol: "versioMinimaClient('android', config) → null | { versioMinima: enter ≥ 1, enllac: https | null }",
    arguments: (ctx) => ['android', ctx.config],
    comprova: fallesDeVersioMinima
  }),
  /* Fase D (261020, tasca 1) · Un proveïdor desconegut es rebutja amb un code
     abans de cap petició i sense tocar la sessió: el kit no té cap testimoni de veres. */
  cas({
    metode: 'entraAmbTokenDeProveidor', capacitat: 'entradaAmbToken', espera: 'rebutja',
    titol: "entraAmbTokenDeProveidor('desconegut', credencial, config) rebutja amb un code sense xarxa ni sessió",
    arguments: (ctx) => ['desconegut', { testimoni: 'a.b.c', nonce: null, testimoniAcces: null, nom: null }, ctx.config],
    comprova: rebuigAmbCode
  }),
  cas({
    metode: 'obriFilDePagina', capacitat: 'xatDePagina',
    titol: 'obriFilDePagina(objecte, config) → null per a un subjecte sense xat (una nota)',
    arguments: (ctx) => [{ tipus: 'nota', id: 'conformitat', ruta: '/notes/conformitat' }, ctx.config],
    comprova: (valor) => (valor === null ? [] : [`havia de ser null: ${JSON.stringify(valor)?.slice(0, 120)}`])
  }),
  cas({
    metode: 'loadPerfilPublic', capacitat: 'directori',
    titol: 'loadPerfilPublic(idOSlug, config) → null per a un perfil que no existix',
    arguments: (ctx) => ['conformitat-sense-perfil', ctx.config],
    comprova: (valor) => (valor === null ? [] : [`havia de ser null: ${JSON.stringify(valor)?.slice(0, 120)}`])
  }),
  /* Pla 261022_1955 (Cercador Universal, T1) · El directori públic: una
     llista de files amb id i nom, i mai cap correu (contracte.js). */
  cas({
    metode: 'listPublicOrganizations', capacitat: 'directoriEntitats',
    titol: 'listPublicOrganizations({ limit }, config) → Fila[] amb id i nom, sense correu',
    arguments: (ctx) => [{ limit: 5 }, ctx.config],
    comprova: (llista) => {
      const falles = exigixLlistaAmbId(llista, 'organitzacions');
      if (falles.length) return falles;
      if (llista.length > 5) falles.push(`el límit era 5 i en torna ${llista.length}`);
      for (const fila of llista) {
        if (!esTextNoBuit(fila.name)) falles.push(`la fila ${fila.id} no té nom`);
        /* P1-13 · C11-05 · correu_public és de la fitxa pública, mai del llistat. */
        if (['contact_email', 'public_email', 'correu_public', 'email', 'correu'].some((camp) => Object.hasOwn(fila, camp))) {
          falles.push(`la fila ${fila.id} porta un correu`);
        }
      }
      return falles;
    },
    /* IDEA-22, punt 2 · Una organització pública de veres per a loadTitularPublic. */
    desa: (llista, ctx) => { ctx.orgPublica = llista[0]?.id ?? null; }
  }),
  /* P1-11 (pla 261024_2230, T5B-01) · El filtre per poble (la pestanya
     «Empreses i entitats» de /pobles/:id): un poble que cap fila porta torna
     una llista buida, mai les organitzacions de tots els pobles. Un amfitrió
     que ignorara `poble` pintaria a la pestanya d'un poble les entitats dels
     altres. */
  cas({
    metode: 'listPublicOrganizations', capacitat: 'directoriEntitats',
    titol: 'listPublicOrganizations({ poble }, config) → només files d’eixe poble (cap per a un poble inexistent)',
    arguments: (ctx) => [{ poble: 'Poble de conformitat que no existix', limit: 5 }, ctx.config],
    comprova: (llista) => {
      const falles = exigixLlistaAmbId(llista, 'organitzacions');
      if (falles.length) return falles;
      for (const fila of llista) {
        if (fila.town_name !== 'Poble de conformitat que no existix') falles.push(`la fila ${fila.id} és d’un altre poble (${JSON.stringify(fila.town_name)})`);
      }
      return falles;
    }
  }),
  /* T2 · D04/D10 (assalt 261101) · Les dades obertes (contracte.js): les
     quatre claus sempre presents, cada una null (sense font) o una llista amb
     id, i cap fila d'una persona propietària ni cap correu. Un poble que no
     existix només llig: segur contra qualsevol servidor. */
  cas({
    metode: 'llegixDadesObertes', capacitat: 'dadesObertes',
    titol: 'llegixDadesObertes({ poble }, config) → { noticies, agenda, memoria, memoriaOral }: null o llistes amb id, sense persones ni correus',
    arguments: (ctx) => [{ poble: { slug: 'poble-de-conformitat-que-no-existix', nom: 'Poble de conformitat que no existix' } }, ctx.config],
    comprova: (valor) => {
      if (!esObjecte(valor)) return [`havia de ser un objecte i és ${tipusDe(valor)}`];
      const falles = [];
      for (const coleccio of COLECCIONS_DADES_OBERTES) {
        if (!Object.hasOwn(valor, coleccio)) { falles.push(`falta la col·lecció ${coleccio}`); continue; }
        if (valor[coleccio] === null) continue;
        const delaLlista = exigixLlistaAmbId(valor[coleccio], coleccio);
        if (delaLlista.length) { falles.push(...delaLlista); continue; }
        /* Gauntlet D-04 · Cap llista passa del sostre del contracte. */
        if (valor[coleccio].length > LIMIT_DADES_OBERTES) falles.push(`${coleccio} passa de ${LIMIT_DADES_OBERTES} elements`);
        for (const fila of valor[coleccio]) {
          if (['owner_user_id', 'ownerUserId'].some((camp) => Object.hasOwn(fila, camp))) falles.push(`${coleccio}: la fila ${fila.id} és d’una persona propietària`);
          if (['email', 'correu', 'contact_email', 'public_email', 'correu_public'].some((camp) => Object.hasOwn(fila, camp))) falles.push(`${coleccio}: la fila ${fila.id} porta un correu`);
        }
      }
      return falles;
    }
  }),
  /* T2 · D04/D10 · La restauració valida abans d'escriure: un lot sense
     municipi és un TypeError i no toca res (segur contra qualsevol servidor). */
  cas({
    metode: 'restauraDadesObertes', capacitat: 'restauracioDadesObertes', espera: 'rebutja',
    titol: 'restauraDadesObertes rebutja un lot sense municipi i no escriu res',
    arguments: (ctx) => [{ format: 'socdepoble.dadesobertes.v1', versio: '1.2.0', entitats: [], noticies: [], agenda: [], memoria: [], memoriaOral: [] }, ctx.config],
    comprova: (e) => (e instanceof TypeError ? [] : [`havia de rebutjar amb un TypeError: ${e?.name ?? tipusDe(e)}`])
  }),
  /* Gauntlet D-01 (assalt 261101) · Un id que ja és d'un altre poble: l'entitat
     pública que ha deixat el directori (orgPublica) no és del poble de
     conformitat, i el lot d'eixe poble no se la pot quedar. Rebutja amb `code`
     'conflicte-identificador' (contracte.js) i sense escriure res. Només amb
     escriptures: un adaptador que no ho comprova escriuria el lot. */
  cas({
    metode: 'restauraDadesObertes', capacitat: 'restauracioDadesObertes', escriu: true, espera: 'rebutja', requerix: ['orgPublica'],
    titol: "restauraDadesObertes rebutja amb 'conflicte-identificador' un id que ja és d'un altre poble (l'entitat del directori)",
    arguments: (ctx) => [{
      format: 'socdepoble.dadesobertes.v1', versio: '1.2.0',
      municipi: { slug: 'poble-de-conformitat-que-no-existix', nom: 'Poble de conformitat que no existix' },
      entitats: [{ id: String(ctx.orgPublica), name: 'Entitat de conformitat', town_name: 'Poble de conformitat que no existix', visibility: 'public' }],
      noticies: [], agenda: [], memoria: [], memoriaOral: []
    }, ctx.config],
    comprova: (e) => (e?.code === 'conflicte-identificador' ? [] : [`havia de rebutjar amb el codi conflicte-identificador: ${motiuDe(e?.code ?? e?.name ?? tipusDe(e))}`])
  }),
  cas({
    metode: 'listMyAgents', capacitat: 'agents', titol: 'listMyAgents(config) → Agent[]',
    arguments: (ctx) => [ctx.config],
    comprova: (llista) => exigixLlistaAmbId(llista, 'agents')
  }),
  cas({
    metode: 'elMeuRol', capacitat: 'sessio', titol: 'elMeuRol(config) → null sense sessió | text',
    arguments: (ctx) => [ctx.config],
    comprova: (rol) => (rol === null || esTextNoBuit(rol) ? [] : [`rol: ${JSON.stringify(rol)}`])
  }),
  /* Ordre del Mestre (261008, grup C) · Els membres d'una organització: la
     llista només la veu qui l'administra, i un error del port porta sempre un
     `code` (contracte.js, MISSATGES_MEMBRES_ORGANITZACIO). Una organització
     que no existix no és de ningú: rebutja amb codi, sense sessió (000) o amb
     sessió (002), i sense escriure res. */
  cas({
    metode: 'llistaMembresOrganitzacio', capacitat: 'membresOrganitzacio', espera: 'rebutja',
    titol: 'llistaMembresOrganitzacio(orgId, config) d’una organització que no existix rebutja amb un code',
    arguments: (ctx) => ['conformitat-sense-organitzacio', ctx.config],
    comprova: (error) => (error instanceof Error && esTextNoBuit(error.code)
      ? []
      : [`havia de rebutjar amb un Error amb code: ${tipusDe(error)} ${JSON.stringify(error?.code ?? null)}`])
  }),
  /* P1-27 (Llibre Mestre: «40 de 96 mètodes sense cas al kit»; guàrdia
     nocturna 261030, Fase 3, P1Y) · Casos nous per a mètodes que cap cas no
     provava. Com el de dalt, tots rebutgen ABANS d'escriure res: una
     organització o una persona que no existixen no les administra ningú, un
     correu que no ho és no es desa i una recuperació sense correu no ix cap a
     GoTrue. Rebutgen amb un Error amb `code` (sense sessió, amb sessió, en
     local o en remot), i cap no toca dades de veres. */
  cas({
    metode: 'desaMembreOrganitzacio', capacitat: 'membresOrganitzacio', espera: 'rebutja',
    titol: 'desaMembreOrganitzacio(orgId, { tipus, id, rol }, config) en una organització que no existix rebutja amb un code',
    arguments: (ctx) => ['conformitat-sense-organitzacio', { tipus: 'persona', id: 'conformitat-sense-persona', rol: 'member' }, ctx.config],
    comprova: rebuigAmbCode
  }),
  cas({
    metode: 'llevaMembreOrganitzacio', capacitat: 'membresOrganitzacio', espera: 'rebutja',
    titol: 'llevaMembreOrganitzacio(orgId, { tipus, id }, config) en una organització que no existix rebutja amb un code',
    arguments: (ctx) => ['conformitat-sense-organitzacio', { tipus: 'persona', id: 'conformitat-sense-persona' }, ctx.config],
    comprova: rebuigAmbCode
  }),
  /* IDEA-24 (marató 261101_2143, B4) · La transferència de la propietat
     (capacitat 'transferenciaPropietat'). Cap cas no escriu: el kit no és
     la propietària de res. Una organització que no existix (amb un id que no
     és cap UUID: cap servidor no hi arriba) i una destinatària que no és una
     persona rebutgen amb un code, sense sessió o amb sessió, i sense canviar
     cap rol. */
  cas({
    metode: 'transfereixPropietatOrganitzacio', capacitat: 'transferenciaPropietat', espera: 'rebutja',
    titol: "transfereixPropietatOrganitzacio(orgId, { tipus: 'persona', id }, config) d’una organització que no existix rebutja amb un code",
    arguments: (ctx) => ['conformitat-sense-organitzacio', { tipus: 'persona', id: 'conformitat-sense-persona' }, ctx.config],
    comprova: rebuigAmbCode
  }),
  cas({
    metode: 'transfereixPropietatOrganitzacio', capacitat: 'transferenciaPropietat', espera: 'rebutja',
    titol: "transfereixPropietatOrganitzacio(orgId, { tipus: 'organitzacio', id }, config) rebutja amb un code: només una persona pot ser propietària",
    arguments: (ctx) => ['conformitat-sense-organitzacio', { tipus: 'organitzacio', id: 'conformitat-sense-organitzacio-2' }, ctx.config],
    comprova: rebuigAmbCode
  }),
  cas({
    metode: 'llegeixContacteOrganitzacio', capacitat: 'contacteOrganitzacio', espera: 'rebutja',
    titol: 'llegeixContacteOrganitzacio(orgId, config) d’una organització que no existix rebutja amb un code',
    arguments: (ctx) => ['conformitat-sense-organitzacio', ctx.config],
    comprova: rebuigAmbCode
  }),
  cas({
    metode: 'desaContacteOrganitzacio', capacitat: 'contacteOrganitzacio', espera: 'rebutja',
    titol: "desaContacteOrganitzacio(orgId, { correu: 'no és cap correu', public: true }, config) rebutja amb un code i no desa res",
    arguments: (ctx) => ['conformitat-sense-organitzacio', { correu: 'no és cap correu', public: true }, ctx.config],
    comprova: rebuigAmbCode
  }),
  cas({
    metode: 'demanaRecuperacioContrasenya', capacitat: 'recuperacioContrasenya', espera: 'rebutja',
    titol: "demanaRecuperacioContrasenya('', config) sense correu rebutja amb un code, sense cap petició",
    arguments: (ctx) => ['', ctx.config],
    comprova: rebuigAmbCode
  }),
  /* Onada 11 (261010; prompt 261010_1730, tasca 2) · El segon factor del
     superadmin. El kit no té cap aplicació d'autenticació: només pot
     comprovar la llista i que cada rebuig porta un `code` de
     CODI_SEGON_FACTOR (errorsBackend.js). Un factor o un repte que no
     existixen no són de ningú: rebutgen amb code, amb sessió o sense (sense
     servidor d'autenticació, 'no-disponible'). Inscriure un factor crearia
     dades al servidor: el kit demana que el node ho rebutge amb code quan no
     pot (sense sessió, sense GoTrue o amb el TOTP no habilitat), i la
     inscripció real queda per a la prova de fum amb un servidor de veres. */
  cas({
    metode: 'llistaFactors', capacitat: 'segonFactor',
    titol: "llistaFactors(config) → Factor[] ({ id, nom, tipus: 'totp', estat: 'verificat' | 'pendent' }); buida sense sessió",
    arguments: (ctx) => [ctx.config],
    comprova: (llista) => {
      if (!Array.isArray(llista)) return [`havia de ser una llista i és ${tipusDe(llista)}`];
      return llista.flatMap((factor) => [
        ...(teId(factor) ? [] : ['un factor sense id']),
        ...(factor?.tipus === 'totp' ? [] : [`el factor ${factor?.id} no és totp`]),
        ...(['verificat', 'pendent'].includes(factor?.estat) ? [] : [`el factor ${factor?.id} té estat ${JSON.stringify(factor?.estat)}`]),
        ...(typeof factor?.nom === 'string' ? [] : [`el factor ${factor?.id} no té nom de text`])
      ]);
    }
  }),
  cas({
    metode: 'inscriuFactor', capacitat: 'segonFactor', espera: 'rebutja',
    titol: 'inscriuFactor(nom, config) quan el node no pot inscriure (sense sessió, sense servidor o TOTP no habilitat) rebutja amb un code',
    arguments: (ctx) => ['Conformitat', ctx.config],
    comprova: rebuigAmbCode
  }),
  cas({
    metode: 'reptaFactor', capacitat: 'segonFactor', espera: 'rebutja',
    titol: 'reptaFactor(factorId, config) d’un factor que no existix rebutja amb un code',
    arguments: (ctx) => ['conformitat-sense-factor', ctx.config],
    comprova: rebuigAmbCode
  }),
  cas({
    metode: 'verificaFactor', capacitat: 'segonFactor', espera: 'rebutja',
    titol: 'verificaFactor({ factorId, repteId, codi }, config) d’un factor que no existix rebutja amb un code i no toca la sessió',
    arguments: (ctx) => [{ factorId: 'conformitat-sense-factor', repteId: 'conformitat-sense-repte', codi: '000000' }, ctx.config],
    comprova: rebuigAmbCode
  }),
  cas({
    metode: 'retiraFactor', capacitat: 'segonFactor', espera: 'rebutja',
    titol: 'retiraFactor(factorId, config) d’un factor que no existix rebutja amb un code',
    arguments: (ctx) => ['conformitat-sense-factor', ctx.config],
    comprova: rebuigAmbCode
  }),
  /* Onada 11 · La personalització del poble només la desa un superadmin amb
     el segon factor confirmat: sense sessió, 'sense-sessio'; amb una sessió
     sense aal2, el servidor ho diu i el port traduïx a 'cal-segon-factor'. */
  cas({
    metode: 'adminDesaPersonalitzacio', capacitat: 'personalitzacio', espera: 'rebutja',
    titol: "adminDesaPersonalitzacio({ clau: 'taxonomia', payload, versio }, config) sense el segon factor rebutja amb code cal-segon-factor o sense-sessio",
    arguments: (ctx) => [{ clau: 'taxonomia', payload: { categories: [] }, versio: null }, ctx.config],
    comprova: rebuigSenseSegonFactor
  }),
  cas({
    metode: 'adminHistorialPersonalitzacio', capacitat: 'personalitzacio', espera: 'rebutja',
    titol: "adminHistorialPersonalitzacio('taxonomia', config) sense el segon factor rebutja amb code cal-segon-factor o sense-sessio",
    arguments: (ctx) => ['taxonomia', ctx.config],
    comprova: rebuigSenseSegonFactor
  }),
  /* FEDI-04 · Inputs invàlids: cap lectura privada ni efecte al servidor.
     Els casos positius només s'activen amb un operador autoritzat explícit;
     la bandera del corredor no substituïx l'autorització del servidor. */
  cas({
    metode: 'adminLlistaPobles', capacitat: 'administracioMultipoble', espera: 'rebutja',
    titol: 'adminLlistaPobles(config) amb tenant malformat rebutja abast-invalid abans del transport',
    arguments: ctx => [{ ...ctx.config, tenantId: 'conformitat-tenant-invalid' }],
    comprova: rebuigAmbCodi('abast-invalid')
  }),
  cas({
    metode: 'adminLligPersonalitzacio', capacitat: 'administracioMultipoble', espera: 'rebutja',
    titol: 'adminLligPersonalitzacio(config) amb tenant malformat rebutja abast-invalid abans del transport',
    arguments: ctx => [{ ...ctx.config, tenantId: 'conformitat-tenant-invalid' }],
    comprova: rebuigAmbCodi('abast-invalid')
  }),
  cas({
    metode: 'adminLlistaPobles', capacitat: 'administracioMultipoble', requerix: ['adminMultipobleAutoritzat'],
    titol: 'adminLlistaPobles(config) autoritzat → llista mínima de tenants UUID únics, slug i nom',
    arguments: ctx => [ctx.config],
    comprova: valor => {
      if (!Array.isArray(valor)) return ['els pobles administrats havien de ser una llista'];
      const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
      const malformat = valor.some(f => !esObjecte(f) || typeof f.id !== 'string' || !uuid.test(f.id) || typeof f.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(f.slug)
        || !esTextNoBuit(f.nom) || Object.keys(f).some(k => !['id', 'slug', 'nom'].includes(k)));
      return [
        ...(malformat ? ['poble administrat sense UUID, slug o nom vàlids, o amb camps de més'] : []),
        ...(new Set(valor.map(f => f?.id)).size !== valor.length ? ['tenants administrats repetits'] : [])
      ];
    }
  }),
  cas({
    metode: 'adminLligPersonalitzacio', capacitat: 'administracioMultipoble', requerix: ['adminMultipobleAutoritzat', 'tenantAdministrat'],
    titol: 'adminLligPersonalitzacio(config) autoritzat per tenant explícit → taxonomia i estil versionats',
    arguments: ctx => [{ ...ctx.config, tenantId: ctx.tenantAdministrat }],
    comprova: valor => !esObjecte(valor) ? ['la personalització administrada havia de ser un objecte'] : [
      ...fallesDePersonalitzacio(valor),
      ...(Object.keys(valor).some(k => !CLAUS_PERSONALITZACIO.includes(k)) ? ['personalització administrada amb camps de més'] : [])
    ]
  }),
  /* Pla 261018_1605 (Tasca 4, D8; correcció de la revisió) · La biblioteca de
     fotos del Perfil (capacitat 'mitjansPropis'). La llista és sempre una
     llista (buida en llavor, en local o sense sessió), i cada foto porta la
     seua referència opaca del bucket públic. Esborrar una referència que no
     és de qui crida (ni del seu poble ni de la seua carpeta) rebutja amb code
     sense tocar el servidor: el kit mai esborra res de veres. */
  cas({
    metode: 'llistaElsMeusMitjans', capacitat: 'mitjansPropis',
    titol: "llistaElsMeusMitjans(config) → Mitja[] amb ref 'sdp-media://mitjans/…' ([] sense servidor ni sessió)",
    arguments: (ctx) => [ctx.config],
    comprova: (llista) => {
      if (!Array.isArray(llista)) return [`havia de ser una llista i és ${tipusDe(llista)}`];
      return llista.every((mitja) => esObjecte(mitja) && typeof mitja.ref === 'string' && mitja.ref.startsWith('sdp-media://mitjans/')
        && typeof mitja.esborrable === 'boolean')
        ? []
        : ['cada foto havia de portar una ref sdp-media://mitjans/… i esborrable boolean'];
    }
  }),
  cas({
    metode: 'esborraElMeuMitja', capacitat: 'mitjansPropis', espera: 'rebutja',
    titol: 'esborraElMeuMitja(ref, config) d’una foto que no és de qui crida rebutja amb un code',
    arguments: (ctx) => ['sdp-media://mitjans/conformitat/no-es-meua/avatars/conformitat.webp', ctx.config],
    comprova: rebuigAmbCode
  }),
  ...['quotaXat', 'publicaAdjuntXat', 'urlAdjuntXat', 'descartaAdjuntXat'].map((metode) => cas({
    metode, capacitat: 'xatMultimedia', espera: 'rebutja',
    titol: `${metode}: sense servei remot rebutja amb code, mai simula adjunts privats`,
    arguments: (ctx) => {
      const config = { ...ctx.config, dataMode: 'seed' };
      return metode === 'quotaXat' ? [config] : ['urlAdjuntXat', 'descartaAdjuntXat'].includes(metode) ? ['invalid', config] : ['invalid', {}, config];
    },
    comprova: rebuigAmbCode
  })),
  /* Fase D (261020, tasca 2; pla 261020_1300) · La moderació (capacitats
     'moderacio' i 'normesConvivencia'). Cap cas no escriu: la llista i
     l'estat de les normes només es lligen, i els rebuigs ixen de la regla
     d'entrada del contracte (denunciaDelContracte, autorDelContracte i la
     versió vigent), abans de cap xarxa. */
  cas({
    metode: 'llistaBloquejos', capacitat: 'moderacio',
    titol: "llistaBloquejos(config) → Bloqueig[] ({ tipus: 'persona' | 'entitat', id, nom: text | null, creatAl: ISO | null }); buida sense sessió",
    arguments: (ctx) => [ctx.config],
    comprova: (llista) => {
      if (!Array.isArray(llista)) return [`havia de ser una llista i és ${tipusDe(llista)}`];
      return llista.flatMap((b) => [
        ...(TIPUS_BLOQUEJAT.includes(b?.tipus) ? [] : [`un bloqueig té tipus ${JSON.stringify(b?.tipus)}`]),
        ...(esTextNoBuit(b?.id) ? [] : ['un bloqueig sense id de text']),
        ...(b?.nom === null || typeof b?.nom === 'string' ? [] : [`el bloqueig ${b?.id} té un nom que no és text ni null`]),
        ...(b?.creatAl === null || esTextNoBuit(b?.creatAl) ? [] : [`el bloqueig ${b?.id} té un creatAl que no és text ni null`])
      ]);
    }
  }),
  cas({
    metode: 'denunciaContingut', capacitat: 'moderacio', espera: 'rebutja',
    titol: "denunciaContingut({ objecte, motiu: 'inventat' }, config) rebutja amb code motiu-invalid sense xarxa",
    arguments: (ctx) => [{ objecte: { tipus: 'publicacio', id: 'conformitat-sense-objecte' }, motiu: 'inventat' }, ctx.config],
    comprova: rebuigAmbCodi(CODI_MODERACIO.MOTIU_INVALID)
  }),
  cas({
    metode: 'bloquejaAutor', capacitat: 'moderacio', espera: 'rebutja',
    titol: "bloquejaAutor({ tipus: 'persona', id: '' }, config) rebutja amb code objectiu-invalid sense xarxa",
    arguments: (ctx) => [{ tipus: 'persona', id: '' }, ctx.config],
    comprova: rebuigAmbCodi(CODI_MODERACIO.OBJECTIU_INVALID)
  }),
  cas({
    metode: 'desbloquejaAutor', capacitat: 'moderacio', espera: 'rebutja',
    titol: "desbloquejaAutor({ tipus: 'inventat', id }, config) rebutja amb code objectiu-invalid sense xarxa",
    arguments: (ctx) => [{ tipus: 'inventat', id: 'conformitat' }, ctx.config],
    comprova: rebuigAmbCodi(CODI_MODERACIO.OBJECTIU_INVALID)
  }),
  cas({
    metode: 'estatNormes', capacitat: 'normesConvivencia',
    titol: 'estatNormes(config) → { versio: text | null, acceptadaAl: ISO | null }',
    arguments: (ctx) => [ctx.config],
    comprova: (estat) => {
      if (!esObjecte(estat)) return [`havia de ser un objecte i és ${tipusDe(estat)}`];
      return [
        ...(estat.versio === null || esTextNoBuit(estat.versio) ? [] : [`versio havia de ser text o null i és ${tipusDe(estat.versio)}`]),
        ...(estat.acceptadaAl === null || esTextNoBuit(estat.acceptadaAl) ? [] : [`acceptadaAl havia de ser text o null i és ${tipusDe(estat.acceptadaAl)}`])
      ];
    }
  }),
  cas({
    metode: 'acceptaNormes', capacitat: 'normesConvivencia', espera: 'rebutja',
    titol: "acceptaNormes('no-es-cap-versio', config) rebutja amb code versio-invalida sense xarxa",
    arguments: (ctx) => ['no-es-cap-versio', ctx.config],
    comprova: rebuigAmbCodi(CODI_MODERACIO.VERSIO_INVALIDA)
  }),
  /* T6b (IDEA-14; decisió del Mestre, 261024) · Els seguiments (capacitat
     'seguiments'). Cap cas no escriu: el kit no coneix cap persona ni cap
     entitat de veres que es puga seguir. Les lectures es comproven per la
     forma, i els rebuigs ixen de la regla d'entrada del contracte
     (seguitDelContracte, SDP-SEG-001), abans de cap xarxa. Una entitat que no
     existix no l'administra ningú: rebutja amb code. */
  cas({
    metode: 'estatSeguiment', capacitat: 'seguiments',
    titol: "estatSeguiment({ tipus: 'persona', id }, config) d’algú que no seguixes → { seguint: false, creatAl: null }",
    arguments: (ctx) => [{ tipus: 'persona', id: ID_SEGUIT_DE_CONFORMITAT }, ctx.config],
    comprova: (estat) => {
      if (!esObjecte(estat)) return [`havia de ser un objecte i és ${tipusDe(estat)}`];
      return [
        ...(estat.seguint === false ? [] : [`seguint havia de ser false i és ${JSON.stringify(estat.seguint)}`]),
        ...(estat.creatAl === null ? [] : [`creatAl havia de ser null i és ${JSON.stringify(estat.creatAl)}`])
      ];
    }
  }),
  cas({
    metode: 'elsMeusSeguiments', capacitat: 'seguiments',
    titol: "elsMeusSeguiments(config) → [{ tipus: 'persona' | 'entitat', id, nom: text | null, creatAl: ISO | null }]",
    arguments: (ctx) => [ctx.config],
    comprova: (llista) => {
      if (!Array.isArray(llista)) return [`havia de ser una llista i és ${tipusDe(llista)}`];
      return llista.flatMap((s) => [
        ...(TIPUS_SEGUIT.includes(s?.tipus) ? [] : [`un seguiment té tipus ${JSON.stringify(s?.tipus)}`]),
        ...fallesDeSeguidor(s, 'seguiment')
      ]);
    }
  }),
  /* C0200-01 (auditoria Codex 261025_0200) · Un seguidor també porta tipus
     de TIPUS_SEGUIT, com un seguiment: sense ell, Seguidors no sap dir que
     qui et seguix és una entitat, i un adaptador antic que no el mapeja
     passava per conforme. */
  cas({
    metode: 'quiEmSegueix', capacitat: 'seguiments',
    titol: "quiEmSegueix({}, config) → [{ tipus: 'persona' | 'entitat', id, nom: text | null, creatAl: ISO | null }]",
    arguments: (ctx) => [{}, ctx.config],
    comprova: (llista) => (Array.isArray(llista)
      ? llista.flatMap((s) => [
        ...(TIPUS_SEGUIT.includes(s?.tipus) ? [] : [`un seguidor té tipus ${JSON.stringify(s?.tipus)}`]),
        ...fallesDeSeguidor(s, 'seguidor')
      ])
      : [`havia de ser una llista i és ${tipusDe(llista)}`])
  }),
  cas({
    metode: 'quiEmSegueix', capacitat: 'seguiments', espera: 'rebutja',
    titol: 'quiEmSegueix({ orgId }, config) d’una entitat que no existix rebutja amb un code',
    arguments: (ctx) => [{ orgId: 'conformitat-sense-organitzacio' }, ctx.config],
    comprova: rebuigAmbCode
  }),
  cas({
    metode: 'segueix', capacitat: 'seguiments', espera: 'rebutja',
    titol: "segueix({ tipus: 'inventat', id }, config) rebutja amb code SDP-SEG-001 sense xarxa",
    arguments: (ctx) => [{ tipus: 'inventat', id: ID_SEGUIT_DE_CONFORMITAT }, ctx.config],
    comprova: rebuigAmbCodi('SDP-SEG-001')
  }),
  /* IDEA-22 (pla 261025_0045, T5; Directiva del Mestre 261025) · Connectar
     com una entitat (`com`) que no administres: SDP-SEG-007. Tampoc no
     escriu. Com quiEmSegueix({ orgId }), demana qui crida: la sessió en
     remot (la del doble) o el convidat en local; sense cap sessió, un
     adaptador remot diu SDP-SEG-000 abans de cap xarxa. */
  cas({
    metode: 'segueix', capacitat: 'seguiments', espera: 'rebutja',
    titol: "segueix({ tipus: 'persona', id, com }, config) com una entitat que no administres rebutja amb code SDP-SEG-007",
    arguments: (ctx) => [{ tipus: 'persona', id: ID_SEGUIT_DE_CONFORMITAT, com: ID_ENTITAT_DE_CONFORMITAT }, ctx.config],
    comprova: rebuigAmbCodi('SDP-SEG-007')
  }),
  cas({
    metode: 'deixaDeSeguir', capacitat: 'seguiments', espera: 'rebutja',
    titol: "deixaDeSeguir({ tipus: 'persona', id: '' }, config) rebutja amb code SDP-SEG-001 sense xarxa",
    arguments: (ctx) => [{ tipus: 'persona', id: '' }, ctx.config],
    comprova: rebuigAmbCodi('SDP-SEG-001')
  }),
  /* IDEA-22, punt 2 (Directiva del Mestre; pla 261025_0200) · La titular que
     ha triat mostrar-se (capacitat 'titularPublic') i la seua tria
     ('consentimentTitular'). Cap cas no escriu: el kit no és la propietària de
     res. D'una organització que no existix, la lectura és null (sense dir per
     què) i la tria rebutja amb un code; d'una pública del directori (si un cas
     anterior n'ha deixat cap), null o una persona i res més. */
  cas({
    metode: 'loadTitularPublic', capacitat: 'titularPublic',
    titol: 'loadTitularPublic(orgId, config) → null per a una organització que no existix',
    arguments: (ctx) => [ID_ENTITAT_DE_CONFORMITAT, ctx.config],
    comprova: (valor) => (valor === null ? [] : [`havia de ser null: ${JSON.stringify(valor)?.slice(0, 120)}`])
  }),
  cas({
    metode: 'loadTitularPublic', capacitat: 'titularPublic', requerix: ['orgPublica'],
    titol: "loadTitularPublic(orgId, config) d’una organització pública → null | { tipus: 'persona', id, nom, avatar }, mai cap correu ni cap rol",
    arguments: (ctx) => [ctx.orgPublica, ctx.config],
    comprova: fallesDeTitular
  }),
  cas({
    metode: 'estatTitularPublic', capacitat: 'consentimentTitular', espera: 'rebutja',
    titol: 'estatTitularPublic(orgId, config) d’una organització que no existix rebutja amb un code: no n’ets la propietària',
    arguments: (ctx) => [ID_ENTITAT_DE_CONFORMITAT, ctx.config],
    comprova: rebuigAmbCode
  }),
  cas({
    metode: 'marcaTitularPublic', capacitat: 'consentimentTitular', espera: 'rebutja',
    titol: "marcaTitularPublic(orgId, 'sí', config) rebutja amb code SDP-TIT-002 sense xarxa",
    arguments: (ctx) => [ID_ENTITAT_DE_CONFORMITAT, 'sí', ctx.config],
    comprova: rebuigAmbCodi('SDP-TIT-002')
  }),
  cas({
    metode: 'marcaTitularPublic', capacitat: 'consentimentTitular', espera: 'rebutja',
    titol: 'marcaTitularPublic(orgId, true, config) d’una organització que no existix rebutja amb un code i no desa res',
    arguments: (ctx) => [ID_ENTITAT_DE_CONFORMITAT, true, ctx.config],
    comprova: rebuigAmbCode
  }),
  /* B8C-2 (marató 261101_2143; Bloc B8) · El silenci d'una conversa
     (capacitat 'silenciXat') i els aparells dels avisos push ('avisosPush').
     Una durada, una plataforma o una adreça fora del contracte es rebutgen
     amb un code, sense escriure ni cap petició. Amb escriptures, el fil
     escrivible se silencia 8 hores (la fi, entre ara + 7 h 59 min i ara +
     8 h 1 min: el rellotge del servidor i el del kit poden diferir) i després
     se'n desfà el silenci: el kit deixa el fil com l'ha trobat. Cap cas desa
     cap aparell: el kit no té cap endpoint ni cap testimoni de veres. */
  cas({
    metode: 'silenciaFil', capacitat: 'silenciXat', espera: 'rebutja',
    titol: "silenciaFil({ filId, durada: 'una-hora' }, config) rebutja amb SILENCI_INVALID sense escriure",
    arguments: (ctx) => [{ filId: ctx.filId ?? 'conformitat-sense-fil', durada: 'una-hora' }, ctx.config],
    comprova: rebuigAmbCodi('SILENCI_INVALID')
  }),
  /* ARB-B8C2-03 · Una fila d'ajuda (el prefix de xatsPerDefecte.js, que el kit
     no importa: només coneix ../contracte.js) no és cap conversa: el mateix
     SILENCI_INVALID a tots els adaptadors, sense cap petició. */
  cas({
    metode: 'silenciaFil', capacitat: 'silenciXat', espera: 'rebutja',
    titol: "silenciaFil({ filId: 'sdp-per-defecte:…', durada: '8h' }, config) d’una fila d’ajuda rebutja amb SILENCI_INVALID sense escriure",
    arguments: (ctx) => [{ filId: 'sdp-per-defecte:conformitat', durada: '8h' }, ctx.config],
    comprova: rebuigAmbCodi('SILENCI_INVALID')
  }),
  cas({
    metode: 'silenciaFil', capacitat: 'silenciXat', escriu: true, requerix: ['filEscrivible'],
    titol: "silenciaFil({ filId, durada: '8h' }, config) → { silenciatFinsAl: ISO entre ara + 7 h 59 min i ara + 8 h 1 min }",
    arguments: (ctx) => [{ filId: ctx.filEscrivible, durada: '8h' }, ctx.config],
    comprova: (valor) => {
      if (!esObjecte(valor)) return [`havia de ser { silenciatFinsAl } i és ${tipusDe(valor)}`];
      const fi = typeof valor.silenciatFinsAl === 'string' ? Date.parse(valor.silenciatFinsAl) : Number.NaN;
      const ara = Date.now();
      return Number.isFinite(fi) && fi >= ara + 479 * 60000 && fi <= ara + 481 * 60000
        ? [] : [`silenciatFinsAl havia de ser ara + 8 h (±1 min): ${JSON.stringify(valor.silenciatFinsAl)?.slice(0, 80)}`];
    }
  }),
  cas({
    metode: 'silenciaFil', capacitat: 'silenciXat', escriu: true, requerix: ['filEscrivible'],
    titol: "silenciaFil({ filId, durada: 'cap' }, config) → { silenciatFinsAl: null }: el silenci es desfà",
    arguments: (ctx) => [{ filId: ctx.filEscrivible, durada: 'cap' }, ctx.config],
    comprova: (valor) => (esObjecte(valor) && valor.silenciatFinsAl === null
      ? [] : [`havia de ser { silenciatFinsAl: null }: ${JSON.stringify(valor)?.slice(0, 120)}`])
  }),
  cas({
    metode: 'desaDispositiuAvisos', capacitat: 'avisosPush', espera: 'rebutja',
    titol: "desaDispositiuAvisos({ plataforma: 'fax', adreca: 'x' }, config) rebutja amb un code sense cap petició",
    arguments: (ctx) => [{ plataforma: 'fax', adreca: 'x' }, ctx.config],
    comprova: rebuigAmbCode
  }),
  cas({
    metode: 'retiraDispositiuAvisos', capacitat: 'avisosPush', espera: 'rebutja',
    titol: "retiraDispositiuAvisos({ plataforma: 'web', adreca: 'http://insegur' }, config) rebutja amb un code sense cap petició",
    arguments: (ctx) => [{ plataforma: 'web', adreca: 'http://insegur' }, ctx.config],
    comprova: rebuigAmbCode
  }),
  ...casosFedi17(),
  /* FEDI23 · Els 172 casos previs conserven ordre i contracte. */
  ...['preferenciesConnexions', 'desaVisibilitatConnexions', 'connexionsPubliquesDe',
    'membresIEntitatsConnectadesDe', 'inclouPersonaEnEntitat', 'solicitaUnirSeAEntitat'].map(metode => cas({
    metode, capacitat: 'connexionsPubliques', espera: 'rebutja',
    titol: `${metode}: entrada buida rebutja SDP-CONN-001 abans de cap efecte`,
    arguments: ctx => [{}, ctx.config], comprova: rebuigAmbCodi('SDP-CONN-001')
  })),
  // R6: append-only after the historical 178 cases. Email proof is a neutral
  // optional capability; an adapter without an email service leaves it absent.
  ...[
    ['confirmaCorreu','verificacioCorreu',ctx=>['bad-token','explicit-test-password',{},ctx.config]],
    ['reenviaVerificacioCorreu','verificacioCorreu',ctx=>[null,ctx.config]],
    ['demanaRestablimentCorreu','recuperacioCorreu',ctx=>[null,ctx.config]],
    ['restablixContrasenyaAmbCorreu','recuperacioCorreu',ctx=>['bad-token','explicit-test-password',null,ctx.config]]
  ].map(([metode,capacitat,args])=>cas({metode,capacitat,espera:'rebutja',titol:metode+': entrada malformada no inicia prova ni recuperació',arguments:args,
    comprova:rebuigAmbCodi('SDP-CORREU-001')})),
  cas({metode:'creaCarpetaNotes',capacitat:'carpetesNotes',espera:'rebutja',titol:'R12: nom de carpeta buit rebutja abans de persistir',arguments:ctx=>[{nom:'  '},ctx.config],comprova:error=>error?.name==='TypeError'?[]:['ha de rebutjar el nom invàlid amb TypeError']}),
  cas({metode:'adminActualitzaPublicacioEditorial',capacitat:'edicioEditorial',espera:'rebutja',titol:'R12: entrada editorial malformada rebutja abans de qualsevol efecte',arguments:ctx=>[{},ctx.config],comprova:rebuigAmbCodi('editorial-invalid')}),
  ...['adminLlistaUsuarisRegistrats','adminAssignaMembreOrganitzacio','adminConnectaUsuari'].map(metode=>cas({metode,capacitat:'administracioUsuaris',espera:'rebutja',titol:`R13: ${metode} rebutja arguments invàlids abans de qualsevol efecte`,arguments:ctx=>[{limit:0},ctx.config],comprova:error=>error?.name==='TypeError'?[]:['cal TypeError abans d’operar']})),
  cas({metode:'importaMunicipiOpenData',capacitat:'importacioPaquetMunicipal',espera:'rebutja',titol:'R13: un paquet municipal sense bytes ni SHA no s’importa',arguments:ctx=>[null,'',ctx.config],comprova:error=>error instanceof Error?[]:['cal rebutjar el paquet invàlid']}),
  ...['loadSeedRevisions', 'desaRevisioSeed'].map(metode => cas({ metode, capacitat: 'revisionsLlavor', espera: 'rebutja', titol: `P1-75: ${metode} rebutja dades malformades abans de qualsevol efecte`, arguments: ctx => [{}, ctx.config], comprova: rebuigAmbCodi('seed-invalid') }))
]);

/**
 * El context compartit d'una passada. `config` és el de l'adaptador (el mode
 * de dades, l'origen…); `escriptures` activa els casos que creen dades.
 */
export function contextDeConformitat({ config = {}, escriptures = false, adminMultipobleAutoritzat = false, tenantAdministrat = null, escenaris = {} } = {}) {
  return {
    config, escriptures, adminMultipobleAutoritzat: adminMultipobleAutoritzat === true, tenantAdministrat,
    ...Object.fromEntries(['compteOperatiu', 'compteModeProva', 'compteSenseSessio', 'publicacioOperativa', 'credencialsDeProva', 'contrasenyaLocal', 'transportXifrat'].map(k => [k, escenaris[k] === true])),
    destinatariDirecte: typeof escenaris.destinatariDirecte === 'string' && escenaris.destinatariDirecte.trim() ? escenaris.destinatariDirecte : null,
    idPublicacio: globalThis.crypto.randomUUID(), idXifrat: globalThis.crypto.randomUUID(),
    ownerUserId: null, filId: null, filEscrivible: null, subscripcio: null, subscrit: false, avisos: [],
    notaId: null, seqEnviat: null, orgPublica: null,
    /* Un id per passada: la idempotència es prova amb el MATEIX id dues voltes.
       UUID aleatori i no derivat del rellotge (L3 de tractor-persistencia): dues
       passades contra un servidor compartit no han de compartir id. */
    idMissatge: globalThis.crypto.randomUUID()
  };
}

const omes = (motiu) => ({ estat: 'omés', falles: [], motiu });

/* El text d'una excepció qualsevol, sense llançar-ne una altra (un Symbol o un
   objecte sense prototip no es convertixen en text). */
function motiuDe(error) {
  try {
    return String(error?.message ?? error);
  } catch {
    return `una excepció de tipus ${tipusDe(error)}`;
  }
}

/**
 * Executa un cas. Torna { estat: 'ok' | 'falla' | 'omés', falles, motiu }.
 * Cap cas no llança: una excepció inesperada és una falla amb el seu missatge.
 */
export async function executaCas(c, adaptador, ctx) {
  const delContracte = c.capacitat ? CAPACITATS[c.capacitat]?.includes(c.metode) : CONTRACTE_NUCLI.includes(c.metode);
  if (!delContracte) return { estat: 'falla', falles: [`${c.metode} no és del contracte (${c.capacitat ?? 'nucli'})`], motiu: null };
  if (c.escriu && !ctx.escriptures) return omes('escriptura no demanada');
  if (typeof adaptador?.[c.metode] !== 'function') {
    return c.capacitat ? omes(`capacitat ${c.capacitat} absent`) : { estat: 'falla', falles: [`falta ${c.metode} del nucli`], motiu: null };
  }
  const buides = c.requerix.filter((clau) => ctx[clau] === null || ctx[clau] === undefined || ctx[clau] === false);
  if (buides.length) return omes(`sense ${buides.join(', ')} (un cas anterior no l'ha deixat)`);
  let valor;
  let rebutjat = false;
  try {
    valor = await adaptador[c.metode](...c.arguments(ctx));
  } catch (error) {
    valor = error;
    rebutjat = true;
  }
  if (rebutjat !== (c.espera === 'rebutja')) {
    const detall = rebutjat ? `ha rebutjat: ${motiuDe(valor)}` : 'ha resolt i havia de rebutjar';
    return { estat: 'falla', falles: [detall], motiu: null };
  }
  /* Una forma prou mal feta pot fer petar la comprovació mateixa (o el desat):
     també és una falla de l'adaptador, mai un rebuig de l'executor. */
  let falles;
  try {
    falles = c.comprova(valor, ctx);
    if (!falles.length) c.desa?.(valor, ctx);
  } catch (error) {
    return { estat: 'falla', falles: [`la forma tornada no es pot comprovar: ${motiuDe(error)}`], motiu: null };
  }
  return { estat: falles.length ? 'falla' : 'ok', falles, motiu: null };
}

/** Els mètodes del contracte que cap cas no prova encara: el deute del kit, a la vista. */
export function metodesSenseCas() {
  const coberts = new Set(CASOS.map((c) => c.metode));
  return [...CONTRACTE_NUCLI, ...Object.values(CAPACITATS).flat()].filter((nom) => !coberts.has(nom));
}
