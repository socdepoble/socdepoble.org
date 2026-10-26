/**
 * grafMapa.js — del Mapa (sdp.mapa.v1) al graf de l'Explorador del cervell.
 *
 * Pur: sense React, sense disc i sense xarxa. Els filtres imiten els del graf
 * d'Obsidian (tipus, òrfens, cerca, fletxes, forces) però parlen el
 * vocabulari tancat del contracte (contracteMapa.js). Traduïx al valencià el
 * que el «Mapa de mis agentes» d'Emowe deia en castellà.
 */
import { TIPUS_NODE, TIPUS_ARESTA, CONFIANCES } from './contracteMapa.js';
import { COLOR_DE_SEVERITAT, toDeColor } from '../semafor.js';

export const NOMS_TIPUS = Object.freeze({
  skill: 'Skill', plantilla: 'Plantilla', ruta: 'Ruta documental', script: 'Script',
  hook: 'Hook', tasca: 'Tasca', agent: 'Agent', document: 'Document', porta: 'Porta'
});

export const NOMS_CONFIANCA = Object.freeze({
  declarat: 'declarat: escrit en un camp estructurat',
  derivat: 'derivat: tret per un analitzador determinista',
  inferit: 'inferit: tret de la prosa (es pinta discontinu)'
});

/* Colors només amb tokens semàntics (Pedra Seca §2); el canvas els resol. */
export const ESTIL_MAPA = Object.freeze({
  radis: Object.freeze({ agent: 11, skill: 10, ruta: 8, plantilla: 7, hook: 7, tasca: 7, porta: 7, script: 5, document: 5 }),
  colors: Object.freeze({
    skill: 'var(--sdp-accent)',
    ruta: 'var(--sdp-accio)',
    plantilla: 'var(--sdp-exit)',
    agent: 'var(--sdp-text-titol)',
    hook: 'var(--sdp-avis)',
    tasca: 'var(--sdp-accio-text)',
    porta: 'var(--sdp-error)',
    script: 'var(--sdp-text-suau)',
    document: 'var(--sdp-vora-forta)'
  }),
  noms: NOMS_TIPUS,
  etiquetaAmbZoom: Object.freeze({ agent: 0.6, skill: 0.8 })
});

/* Forces del graf. «Espaiat» porta la distància d'enllaç 250 del graf del Mestre a Obsidian. */
export const FORCES = Object.freeze({
  compacte: Object.freeze({ repulsio: 400, llargaria: 90, molla: 0.06, gravetat: 0.02 }),
  normal: Object.freeze({ repulsio: 800, llargaria: 150, molla: 0.05, gravetat: 0.01 }),
  espaiat: Object.freeze({ repulsio: 1600, llargaria: 250, molla: 0.04, gravetat: 0.006 })
});

/* T4 (ordre del Mestre, 260930) · l'Explorador apaga l'inspector de
   BrainGraph (inspector={false}) i pinta el seu detall (DetallPeca.jsx):
   del canvas només queda el nom accessible. */
export const TEXTOS_EXPLORADOR = Object.freeze({
  canvas: 'Graf dels agents del Mas. Per a triar una peça amb el teclat, usa «Tria una peça» del detall.'
});

export function filtresInicials() {
  return {
    tipus: Object.fromEntries(TIPUS_NODE.map((t) => [t, true])),
    confiances: Object.fromEntries(CONFIANCES.map((c) => [c, true])),
    orfes: true,
    fletxes: true,
    cerca: ''
  };
}

/** Nom curt per a pintar: sense prefix de tipus ni ruta sencera. */
export function etiquetaNode(node) {
  const id = String(node?.id ?? '');
  const tall = id.indexOf(':');
  const tipus = tall >= 0 ? id.slice(0, tall) : '';
  const cos = tall >= 0 ? id.slice(tall + 1) : id;
  if (tipus === 'script' && cos.startsWith('npm:')) return `npm run ${cos.slice(4)}`;
  if (tipus === 'hook') {
    const [arnes, ...esdeveniment] = cos.split(':');
    return esdeveniment.length ? `${esdeveniment.join(':')} · ${arnes}` : cos;
  }
  if (['plantilla', 'script', 'document'].includes(tipus)) return cos.split('/').filter(Boolean).pop() || cos;
  return cos || id;
}

/**
 * Graf per a BrainGraph. La cerca mostra els nodes que hi casen i els seus
 * veïns directes, com Obsidian: buscar una skill és vore amb qui parla.
 */
export function grafDelMapa(mapa, filtres = filtresInicials()) {
  const arestes = mapa.arestes.filter((a) => filtres.confiances?.[a.confianca] !== false);
  const grau = new Map();
  for (const a of arestes) {
    grau.set(a.de, (grau.get(a.de) || 0) + 1);
    grau.set(a.a, (grau.get(a.a) || 0) + 1);
  }
  const base = new Set(mapa.nodes
    .filter((n) => filtres.tipus?.[n.tipus] !== false && (filtres.orfes !== false || grau.has(n.id)))
    .map((n) => n.id));

  const cerca = String(filtres.cerca || '').trim().toLowerCase();
  let visibles = base;
  if (cerca) {
    const casen = new Set(mapa.nodes
      .filter((n) => base.has(n.id) && (n.id.toLowerCase().includes(cerca) || etiquetaNode(n).toLowerCase().includes(cerca)))
      .map((n) => n.id));
    visibles = new Set(casen);
    for (const a of arestes) {
      if (casen.has(a.de) && base.has(a.a)) visibles.add(a.a);
      if (casen.has(a.a) && base.has(a.de)) visibles.add(a.de);
    }
  }

  const nodes = mapa.nodes.filter((n) => visibles.has(n.id)).map((n) => ({
    id: n.id, label: etiquetaNode(n), type: n.tipus, font: n.font, atributs: n.atributs
  }));
  const links = arestes.filter((a) => visibles.has(a.de) && visibles.has(a.a)).map((a) => ({
    source: a.de, target: a.a, type: a.tipus, confianca: a.confianca, discontinu: a.confianca === 'inferit'
  }));
  return { nodes, links };
}

const VERBS_DE_CRIDA = new Set(['crida', 'dispara', 'encamina', 'carrega', 'governa']);

/** Entrades i eixides d'un node: el «qué lee / qué produce» d'Emowe, amb confiança. */
export function relacionsDe(mapa, id) {
  const surten = mapa.arestes.filter((a) => a.de === id);
  const entren = mapa.arestes.filter((a) => a.a === id);
  const llig = surten.filter((a) => a.tipus === 'llig');
  const escriu = surten.filter((a) => a.tipus === 'escriu');
  return {
    llig,
    escriu,
    crida: surten.filter((a) => VERBS_DE_CRIDA.has(a.tipus)),
    elCriden: entren,
    avisos: mapa.avisos.filter((a) => a.node === id),
    // Caixa opaca: no declara què llig ni què produïx; no es pot encadenar.
    opaca: llig.length === 0 && escriu.length === 0
  };
}

/** Files de la pestanya «Entrades i eixides»: skills i rutes; com a Emowe, les opaques al final. */
export function filesEntradesEixides(mapa, cerca = '') {
  const q = String(cerca).trim().toLowerCase();
  return mapa.nodes
    .filter((n) => n.tipus === 'skill' || n.tipus === 'ruta')
    .map((n) => ({ node: n, ...relacionsDe(mapa, n.id) }))
    .filter((f) => !q || f.node.id.toLowerCase().includes(q)
      || [...f.llig, ...f.escriu].some((a) => a.a.toLowerCase().includes(q)))
    .sort((x, y) => Number(x.opaca) - Number(y.opaca) || x.node.id.localeCompare(y.node.id));
}

/* ── T4 (ordre del Mestre, 260930) · el detall d'una peça ────────────────
   Tot el que pinta DetallPeca.jsx ix d'ací, pur i provable: quin fitxer és
   cada peça, si té pàgina a la Wiki, si es pot obrir a l'editor, les
   relacions dites amb verbs i els avisos dits amb paraules. relacionsDe no
   canvia: EntradesEixides i actorsMapa en depenen. */

/* Els tons d'Insignia de la Consola: els de la taula de Salut (MapaConsola.jsx).
   Neteja 261007 (prompt 261007_1628, peça D) · Esta és la seua única font.
   Abans TO_CONFIANCA es copiava a MapaConsola.jsx, FluxosMapa.jsx i
   EntradesEixides.jsx, TO_SEVERITAT a AvisosMapa.jsx, i TO_ESTAT i
   TEXT_ESTAT a MapaConsola.jsx, CalendariMapa.jsx i XifresMas.jsx; totes les
   còpies eren iguals, llevat del N/A de les mètriques que XifresMas.jsx
   afig damunt d'estes (vegeu-lo allà). Una prova (tonsMapa.test.js) fixa
   que cobrixen tot el vocabulari del contracte (contracteMapa.js). */
/* Onada 6, requisit 8 (semàfor) · Els tons són els del semàfor de la
   Consola (semafor.js): verd, taronja i roig segons la gravetat, i neutre per
   al que només informa. Cap blau ('info'): abans el portaven la confiança
   declarada i la severitat baixa, un quart color que no deia cap gravetat.
   La confiança no és salut: només l'inferit avisa, perquè ix de la prosa. */
export const TO_CONFIANCA = Object.freeze({ declarat: 'neutre', derivat: 'neutre', inferit: 'avis' });
/* Alta → roig; mitjana i baixa → taronja (COLOR_DE_SEVERITAT, semafor.js). */
export const TO_SEVERITAT = Object.freeze(Object.fromEntries(
  Object.entries(COLOR_DE_SEVERITAT).map(([severitat, color]) => [severitat, toDeColor(color)])
));
/* L'estat d'una tasca del Mapa (ESTATS_TASCA): el to de la seua insígnia i com es diu.
   VIU verd; MORT roig; sense llançador, sense declaració i desconegut, taronja:
   el que no consta que corra no es pot dir bo (Onada 6). */
export const TO_ESTAT = Object.freeze({
  viu: 'exit', mort: 'error', 'declarat-sense-llancador': 'avis',
  'llancador-sense-declaracio': 'avis', desconegut: 'avis'
});
export const TEXT_ESTAT = Object.freeze({
  viu: 'viu', mort: 'mort', 'declarat-sense-llancador': 'sense llançador',
  'llancador-sense-declaracio': 'sense declaració', desconegut: 'desconegut'
});

/** Què és cada tipus de peça, en una línia. */
export const QUE_ES = Object.freeze({
  skill: 'Procediment d’un agent: un SKILL.md de .agents/skills/ que es carrega quan la tasca el demana.',
  plantilla: 'Plantilla documental: el motle que copia cada document nou d’este tipus.',
  ruta: 'Ruta documental del PROTOCOLLEDGE: diu quina plantilla, quina skill i quins destins té un tipus de document.',
  script: 'Script del repositori. El Mapa sap qui el crida, però no analitza què llig ni què escriu.',
  hook: 'Hook: una ordre que l’arnés d’un agent executa sola quan passa un esdeveniment.',
  tasca: 'Tasca programada: una faena que un llançador (launchd, un hook de git o una altra tasca) executa sense ningú davant.',
  agent: 'Agent: l’arnés d’una IA que treballa al Mas; carrega documents i dispara hooks.',
  document: 'Document o carpeta del repositori: no actua; el lligen, l’escriuen o el carreguen altres peces.',
  porta: 'Porta de qualitat: una comprovació que para la cadena si falla.'
});
const QUE_ES_NPM = 'Ordre npm declarada a package.json: el Mapa sap quins scripts i quines altres ordres crida.';

/* Cada aresta es llig des dels dos caps: «ix» des de qui la fa, «entra»
   des de qui la rep. */
export const VERBS = Object.freeze({
  crida: Object.freeze({ ix: 'Crida', entra: 'El crida' }),
  llig: Object.freeze({ ix: 'Llig', entra: 'El llig' }),
  escriu: Object.freeze({ ix: 'Escriu a', entra: 'Hi escriu' }),
  dispara: Object.freeze({ ix: 'Dispara', entra: 'El dispara' }),
  encamina: Object.freeze({ ix: 'Encamina a', entra: 'L’encamina' }),
  carrega: Object.freeze({ ix: 'Carrega', entra: 'El carrega' }),
  governa: Object.freeze({ ix: 'Governa', entra: 'El governa' })
});

/* Els codis d'avís de construeixMapa.js dits per a persones. Els set
   últims són el contracte de les skills (T1) i les fonts de vigilància
   (T12). Un codi que no siga ací es pinta tal qual: mai s'amaga. */
export const TEXTOS_AVIS = Object.freeze({
  'script-absent': 'L’script no és al disc: qui el crida fallarà en executar-lo.',
  'font-absent': 'La font que el Mapa havia de llegir no hi és: el que en depén es pinta com a desconegut, no com a bo.',
  'skill-fantasma': 'Algú la nomena (l’índex, el catàleg, el segell o una ruta), però la seua carpeta no és al disc.',
  'frontmatter-invalid': 'El frontmatter no passa l’esquema de la Wiki (tooling/wiki/schema.json).',
  'nom-diferent-carpeta': 'El camp name del frontmatter no coincidix amb el nom de la carpeta.',
  'fora-index': 'No és a l’índex de skills (.agents/skills_index.json): el router no la pot disparar.',
  /* Onada 6 · Una skill que CLAUDE.md importa amb @ sí que la veu Claude Code
     (sencera, a cada sessió): la frase ja no ho nega, i l'evidència ho diu. */
  'fora-cataleg-claude': 'No és al catàleg de Claude (.claude/skills/): Claude Code no la pot triar ni carregar a demanda com a skill.',
  'fora-segell': 'No és al segell de skills: el seu contingut no està acreditat.',
  'segell-divergent': 'El contingut ha canviat des de l’últim segellat: l’empremta no coincidix amb la del segell.',
  pes: 'Passa del llindar de pes (3.000 paraules o uns 4.000 tokens): embossa el context de qui la carrega.',
  'crida-inexistent': 'La seua prosa cita una skill que no existix.',
  'disparador-decoratiu': 'Els seus disparadors no poden saltar sols (llista buida o només el nom de la skill): el router no la triarà mai.',
  'disparador-ample': 'Té disparadors massa curts o massa comuns: salten dins de paraules corrents.',
  'tasca-sense-llancador': 'Està declarada al registre de tasques, però cap llançador l’executa.',
  'tasca-morta': 'Té llançador, però no corre: l’script falta, l’últim intent va fallar o fa més de dos cicles que no fa res.',
  'llancador-sense-declaracio': 'Un llançador de launchd l’executa, però no és al registre de tasques.',
  'hook-sense-consumidor': 'Està declarat, però cap evidència diu que l’arnés l’execute.',
  orfe: 'Cap relació declarada o derivada hi arriba: ningú la crida ni la carrega.',
  'contracte-absent': 'El contracte declara que llig un fitxer que no existix: és un contracte trencat, no una lectura.',
  'fitxer-absent': 'Un contracte el declara, però el fitxer no és al disc: qui l’havia de llegir no el trobarà.',
  'segell-trencat': 'El segell no quadra amb el disc: hi ha skills fora del segell o divergents, i cal reconciliar-lo abans de confiar en cap empremta.',
  'torns-caducats': 'Hi ha torns oberts que han caducat sense tancar-se.',
  'escriptori-sense-ancora': 'Este document de l’Escriptori no té cap enllaç des de l’índex actiu (00_index_escriptori.md).',
  // Ordre del Mestre, 261004 · el document ancorat sense rebut ja no s'escapa.
  'escriptori-sense-rebut': 'Este document de l’Escriptori no té el rebut de cap torn: no consta quin torn el va crear ni amb quina plantilla.',
  /* Onada 6 · La signatura és l'empremta del cos (fonts-vigilancia.mjs ·
     analitzaLedger): quan no quadra, el cos s'ha editat sense tornar-lo a
     segellar. Els fòssils i les línies mal formades es compten a part i poden
     ser zero: la frase d'abans en feia la causa i contradeia l'evidència.
     Correcció de l'Onada 6 (revisió adversarial) · analitzaLedger també el
     dona per invàlid quan falta algun dels dos segells: la frase diu les dues
     causes, com l'evidència del compilador. */
  'ledger-invalid': 'La signatura del LEDGER no és vàlida: el cos del Llibre d’Obra no quadra amb el seu segell (s’ha editat sense tornar-lo a segellar) o li falta el segell. Els segells fòssils i les línies mal formades es compten a part.',
  // Onada 6 · La frontissa roja ja no és només una fracció de la salut: un avís per clau que falla.
  'frontissa-roja': 'La frontissa de contingut està roja: esta clau estructural de PAGE_COPY falta o no té l’empremta aprovada, i el pre-commit es para.',
  // 261026 · Les dues portes de la salut, com la frontissa: roges, avís alt, amb la causa a l'evidència.
  'porta-documents-roja': 'Este document no passa la porta documental (tooling/gates/porta-documents.mjs): l’evidència diu per què, i la cadena de portes es para.',
  'cadena-portes-roja': 'La cadena de portes de només lectura (node tooling/gates/run-portes.mjs --diagnostic) té passos en roig: el pre-commit es para fins que es reparen.',
  'recaiguda-recent': 'El LEDGER anota una recaiguda recent d’esta skill: una correcció del Mestre que ja estava apresa s’ha tornat a trencar.'
});

/* Etiquetes dels atributs que escriu el compilador. `boolea`: sense dada
   es pinta com a insígnia; `mono`: text de màquina, amagat pel mode
   privacitat. Les claus que no són ací es pinten amb el seu nom. */
export const ETIQUETES_ATRIBUT = Object.freeze({
  core: { etiqueta: 'Skill del nucli', boolea: true },
  status: { etiqueta: 'Estat' },
  al_disc: { etiqueta: 'Al disc', boolea: true },
  al_index: { etiqueta: 'A l’índex de skills', boolea: true },
  al_cataleg_claude: { etiqueta: 'Al catàleg de Claude', boolea: true },
  al_segell: { etiqueta: 'Al segell', boolea: true },
  paraules: { etiqueta: 'Paraules' },
  llicons: { etiqueta: 'Lliçons del Mestre' },
  absent: { etiqueta: 'Absent del disc', boolea: true },
  arnes: { etiqueta: 'Arnés' },
  esdeveniment: { etiqueta: 'Esdeveniment' },
  consumidor_acreditat: { etiqueta: 'Consumidor acreditat', boolea: true },
  ordre: { etiqueta: 'Ordre', mono: true },
  rol: { etiqueta: 'Rol' },
  tipus_document: { etiqueta: 'Tipus de document' },
  versio: { etiqueta: 'Versió' },
  nivell: { etiqueta: 'Nivell' },
  llancador: { etiqueta: 'Llançador' }
});

/** Tipus i cos d'un identificador `tipus:cos`. */
function parts(id) {
  const text = String(id ?? '');
  const tall = text.indexOf(':');
  return tall >= 0 ? { tipus: text.slice(0, tall), cos: text.slice(tall + 1) } : { tipus: '', cos: text };
}

/** Què és esta peça, en una línia (una ordre npm no és un fitxer d'script). */
export function queEs(node) {
  const { tipus, cos } = parts(node?.id);
  if (tipus === 'script' && cos.startsWith('npm:')) return QUE_ES_NPM;
  return QUE_ES[tipus] ?? QUE_ES[node?.tipus] ?? '';
}

/**
 * On és la peça. Una skill, una plantilla, un script o un document són el
 * seu fitxer (rol «fitxer», l'identificador du la ruta). La resta viuen
 * dins del fitxer que les declara (rol «declarat»: `font`). Sense cap dels
 * dos, el Mapa no ho sap i no s'inventa. Un document amb #CLAU és una clau
 * dins del seu fitxer (els errors de la frontissa, Onada 6): el fitxer és el
 * de davant del #, rol «declarat».
 */
export function fitxerDelNode(node) {
  const { tipus, cos } = parts(node?.id);
  if (tipus === 'skill' && cos) return { ruta: `.agents/skills/${cos}/SKILL.md`, rol: 'fitxer' };
  if (tipus === 'document' && cos && cos.includes('#')) return { ruta: cos.slice(0, cos.indexOf('#')), rol: 'declarat' };
  if (['plantilla', 'script', 'document'].includes(tipus) && cos && !cos.startsWith('npm:')) return { ruta: cos, rol: 'fitxer' };
  if (typeof node?.font === 'string' && node.font) return { ruta: node.font, rol: 'declarat' };
  return { ruta: null, rol: null };
}

const ARREL_WIKI = '_wiki_de_poble/';

/**
 * El document publicat que és esta ruta, o null. Casa com el compilador de
 * la Wiki (tooling/wiki/compile-wiki-to-app.mjs): l'id és el nom sense
 * `.md` i la carpeta, `folder:<dir relatiu a _wiki_de_poble>` (null a
 * l'arrel). Només s'hi publiquen 01_ser, 02_saber i 03_actuar.
 */
export function documentWiki(ruta, manifest) {
  if (typeof ruta !== 'string' || !ruta.startsWith(ARREL_WIKI) || !ruta.endsWith('.md')) return null;
  const relativa = ruta.slice(ARREL_WIKI.length);
  const tall = relativa.lastIndexOf('/');
  const carpeta = tall >= 0 ? relativa.slice(0, tall) : '';
  const id = relativa.slice(tall + 1, -'.md'.length);
  const categoria = carpeta ? `folder:${carpeta}` : null;
  const item = (manifest?.items || []).find((i) => i.id === id && (i.categoryId ?? null) === categoria);
  return item ? { id: item.id, titol: item.title || item.id, href: `/wikidepoble?item=${encodeURIComponent(item.id)}` } : null;
}

const CODIS_FITXER_ABSENT = new Set(['script-absent', 'font-absent', 'skill-fantasma', 'fitxer-absent']);

/** El Mapa sap que el fitxer d'esta peça no és al disc. */
export function fitxerAbsent(avisos = []) {
  return avisos.some((a) => CODIS_FITXER_ABSENT.has(a.codi));
}

/* Un esquema (`file:`, `https:`) o una unitat (`C:`): l'obridor de Vite
   obri una URL file:// tal qual, fora del repositori. */
const ESQUEMA_O_UNITAT = /^[a-z][a-z0-9+.-]*:/i;

/**
 * «Obrir a l'editor» usa l'obridor de Vite (/__open-in-editor), que només
 * existix en desenvolupament i resol la ruta des de l'arrel del repositori.
 * Per això: només en `dev`, només rutes relatives del repositori (ni `~`,
 * ni absolutes, ni esquemes ni unitats, ni `..`) amb extensió, i mai si el
 * fitxer falta.
 */
export function rutaEditable(ruta, dev, avisos = []) {
  if (!dev || typeof ruta !== 'string' || !ruta) return false;
  if (ruta.startsWith('~') || ruta.startsWith('/') || ESQUEMA_O_UNITAT.test(ruta)
    || ruta.includes('\\') || ruta.split('/').includes('..')) return false;
  if (!/\.[a-z0-9]+$/i.test(ruta.split('/').pop())) return false;
  return !fitxerAbsent(avisos);
}

const ORDRE_VERB = new Map(TIPUS_ARESTA.map((t, i) => [t, i]));

/**
 * Relacions d'una peça dites amb verbs: les que ixen («Què fa») i les que
 * entren («Qui hi arriba»), per ordre del contracte i, dins, pel nom.
 */
export function relacionsPerVerb(mapa, id) {
  const fila = (a, sentit) => {
    const altre = sentit === 'ix' ? a.a : a.de;
    return {
      id: altre,
      tipusPeca: parts(altre).tipus,
      tipus: a.tipus,
      verb: VERBS[a.tipus]?.[sentit] ?? a.tipus,
      confianca: a.confianca,
      evidencia: a.evidencia ?? null
    };
  };
  const ordena = (files) => files.sort((x, y) => (ORDRE_VERB.get(x.tipus) ?? TIPUS_ARESTA.length)
    - (ORDRE_VERB.get(y.tipus) ?? TIPUS_ARESTA.length) || etiquetaNode(x).localeCompare(etiquetaNode(y)));
  return {
    ixen: ordena(mapa.arestes.filter((a) => a.de === id).map((a) => fila(a, 'ix'))),
    entren: ordena(mapa.arestes.filter((a) => a.a === id).map((a) => fila(a, 'entra')))
  };
}

/**
 * El motiu honest de «Què fa» quan el Mapa no hi pot dir prou: una skill
 * sense contracte i un script són caixes opaques encara que tinguen files;
 * un document no actua. Null si les files ja ho diuen tot.
 */
export function notaEixides(node, ixen) {
  const { tipus, cos } = parts(node?.id);
  const contracte = ixen.some((f) => f.tipus === 'llig' || f.tipus === 'escriu');
  if (tipus === 'skill' && !contracte) return 'Caixa opaca: no declara contracte, i el Mapa no sap què llig ni què escriu.';
  if (tipus === 'script' && !cos.startsWith('npm:') && !contracte) return 'El Mapa no analitza el codi dels scripts: no sap què llig ni què escriu.';
  if (ixen.length) return null;
  if (tipus === 'document') return 'Un document no actua: el lligen, l’escriuen o el carreguen altres peces.';
  return 'El Mapa no hi coneix cap relació que isca d’esta peça.';
}

/** Els atributs d'una peça amb etiqueta en valencià; cap clau s'amaga. */
export function dadesDelNode(node) {
  const atributs = node?.atributs && typeof node.atributs === 'object' ? node.atributs : {};
  const conegudes = Object.keys(ETIQUETES_ATRIBUT).filter((c) => Object.hasOwn(atributs, c));
  const altres = Object.keys(atributs).filter((c) => !Object.hasOwn(ETIQUETES_ATRIBUT, c)).sort();
  return [...conegudes, ...altres].map((clau) => {
    const valor = atributs[clau];
    const meta = ETIQUETES_ATRIBUT[clau];
    const boolea = typeof valor === 'boolean' || (valor == null && Boolean(meta?.boolea));
    let text = String(valor);
    if (valor == null) text = 'sense dada';
    else if (typeof valor === 'boolean') text = valor ? 'sí' : 'no';
    else if (typeof valor === 'object') text = JSON.stringify(valor);
    // Un atribut només informa (Onada 6, semàfor): neutre, també quan és «sí».
    return { clau, etiqueta: meta?.etiqueta ?? clau, text, boolea, mono: Boolean(meta?.mono), to: 'neutre' };
  });
}

/**
 * Opcions del selector «Tria una peça»: les peces del graf, «Tipus · nom»
 * per ordre alfabètic. Dos noms iguals porten el cos sencer; en mode
 * `privat`, que no ensenya rutes, un ordinal per identificador («nom (2)»).
 * Una peça triada que els filtres amaguen s'hi afig al final, dita, perquè
 * el selector no menteixca.
 */
export function opcionsPeces(nodes, amagada = null, { privat = false } = {}) {
  const nomTipus = (n) => { const t = n.type ?? n.tipus; return NOMS_TIPUS[t] ?? t; };
  const base = nodes.map((n) => ({ valor: n.id, etiqueta: `${nomTipus(n)} · ${etiquetaNode(n)}` }));
  const repetits = new Map();   // etiqueta → identificadors que la porten, ordenats
  for (const o of base) {
    if (!repetits.has(o.etiqueta)) repetits.set(o.etiqueta, []);
    repetits.get(o.etiqueta).push(o.valor);
  }
  for (const ids of repetits.values()) ids.sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
  const desambigua = (o, i) => {
    const ids = repetits.get(o.etiqueta);
    if (ids.length < 2) return o;
    if (privat) return { ...o, etiqueta: `${o.etiqueta} (${ids.indexOf(o.valor) + 1})` };
    return { ...o, etiqueta: `${nomTipus(nodes[i])} · ${parts(o.valor).cos}` };
  };
  const opcions = base.map(desambigua).sort((x, y) => x.etiqueta.localeCompare(y.etiqueta));
  const finals = amagada ? [{ valor: amagada.id, etiqueta: `${nomTipus(amagada)} · ${etiquetaNode(amagada)} (amagada pels filtres)` }] : [];
  return [{ valor: '', etiqueta: 'Cap peça triada' }, ...opcions, ...finals];
}
