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
import { CAPACITATS, CODI_MODERACIO, CONTRACTE_NUCLI, SECCIONS_PAGINABLES, TIPUS_BLOQUEJAT, TIPUS_SEGUIT } from '../contracte.js';

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

export const CASOS = Object.freeze([
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
        if (['contact_email', 'public_email', 'email', 'correu'].some((camp) => Object.hasOwn(fila, camp))) {
          falles.push(`la fila ${fila.id} porta un correu`);
        }
      }
      return falles;
    }
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
  cas({
    metode: 'quiEmSegueix', capacitat: 'seguiments',
    titol: 'quiEmSegueix({}, config) → [{ id, nom: text | null, creatAl: ISO | null }]',
    arguments: (ctx) => [{}, ctx.config],
    comprova: (llista) => (Array.isArray(llista)
      ? llista.flatMap((s) => fallesDeSeguidor(s, 'seguidor'))
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
  })
]);

/**
 * El context compartit d'una passada. `config` és el de l'adaptador (el mode
 * de dades, l'origen…); `escriptures` activa els casos que creen dades.
 */
export function contextDeConformitat({ config = {}, escriptures = false } = {}) {
  return {
    config, escriptures,
    ownerUserId: null, filId: null, filEscrivible: null, subscripcio: null, subscrit: false, avisos: [],
    notaId: null, seqEnviat: null,
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
