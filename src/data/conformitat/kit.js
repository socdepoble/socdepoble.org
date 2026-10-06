/* Kit de conformitat del port (261006) · NOMÉS PROVES.
   Un adaptador és conforme quan cada CAS d'este fitxer passa amb ell. Les
   signatures són les del port tal com les crida la interfície: config va
   sempre l'últim i les opcions d'una crida del Xat viatgen dins de config
   (limit, llegitFinsSeq…). La presència del nucli i de les capacitats ja la
   comprova validaBackendImplementation (backendPort.js); ací es mira el que
   tornen.
   Pur: només importa el contracte. No importa cap adaptador ni cap corredor
   de proves; qui el passa decidix com. L'adaptador Supabase el passa en mode
   'seed' i sense xarxa (src/data/supabase/conformitat.test.js). Un altre
   adaptador que trie Sóc de Poble s'hi enxufa igual, amb un fetch de mentida que servisca
   les seues captures reals.
   Els casos d'ESCRIPTURA (escriu: true) només corren amb
   contextDeConformitat({ escriptures: true }): creen dades. */
import { CAPACITATS, CONTRACTE_NUCLI } from '../contracte.js';

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
    metode: 'loadCoreContent', titol: 'loadCoreContent(ownerUserId, config) → { towns[], pages[], agents[], pageCopy }',
    requerix: ['ownerUserId'],
    arguments: (ctx) => [ctx.ownerUserId, ctx.config],
    comprova: (valor) => [
      ...exigixLlistes(valor, ['towns', 'agents']),
      ...(Array.isArray(valor?.pages) ? [] : ['pages havia de ser una llista']),
      ...(esObjecte(valor?.pageCopy) ? [] : ['pageCopy havia de ser un objecte'])
    ]
  }),
  cas({
    metode: 'loadMur', titol: 'loadMur(ownerUserId, config) → { feedPosts[], events[], marketItems[] }',
    requerix: ['ownerUserId'],
    arguments: (ctx) => [ctx.ownerUserId, ctx.config],
    comprova: (valor) => exigixLlistes(valor, ['feedPosts', 'events', 'marketItems'])
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
      ctx.filId = fils[0]?.id ?? null;
      ctx.filEscrivible = fils.find(ESCRIVIBLE)?.id ?? null;
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
  cas({
    metode: 'comprovaServidor', capacitat: 'salut', titol: 'comprovaServidor(config) → { ok: boolean }, mai rebutja',
    arguments: (ctx) => [ctx.config],
    comprova: (valor) => (typeof valor?.ok === 'boolean' ? [] : [`havia de ser { ok: boolean }: ${JSON.stringify(valor)}`])
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
  cas({
    metode: 'listMyAgents', capacitat: 'agents', titol: 'listMyAgents(config) → Agent[]',
    arguments: (ctx) => [ctx.config],
    comprova: (llista) => exigixLlistaAmbId(llista, 'agents')
  }),
  cas({
    metode: 'elMeuRol', capacitat: 'sessio', titol: 'elMeuRol(config) → null sense sessió | text',
    arguments: (ctx) => [ctx.config],
    comprova: (rol) => (rol === null || esTextNoBuit(rol) ? [] : [`rol: ${JSON.stringify(rol)}`])
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
