/**
 * pegats/t1-skills.mjs — T1 · Sanejament de skills, contracte.llig i test:node
 * (torn_d8024ad3-9c76-48e7-b402-348fbb2dedb5, part B del pla 260930_0040).
 *
 * No escriu res. Cada operació rep el contingut ACTUAL i torna el NOU; el
 * generador (lease.mjs) en fa el pla sdp.mutation.v1 i l'executor l'aplica.
 *
 * CONTRACTE AMB EL GENERADOR
 *   · Les operacions s'apliquen en l'ordre de l'array.
 *   · `aplica(actual, nous)` rep com a segon argument el mapa ruta → contingut
 *     nou de les operacions JA aplicades (Map o objecte pla). Les operacions
 *     que declaren `depen` el necessiten i fallen tancades si hi falta una
 *     ruta: el pany i el deute han de portar el SHA de l'esquema NOU, i els
 *     índexs només es regeneren al costat de la skill que els canvia.
 *   · Tota funció és pura: només text, JSON i node:crypto.
 *   · Si el canvi ja hi és, l'operació llança Error; mai el duplica.
 *
 * DECISIONS QUE NO ESTAN A LA VISTA
 *   · schema.json, el pany i el deute formen una sola transició de llei
 *     (f854d085 → nou). Si algú ha tocat l'esquema, el pany o el deute des
 *     d'eixe SHA, les tres operacions fallen: una llei canviada per un altre
 *     s'ha de tornar a revisar, no s'absorbix.
 *   · El sostre del deute (`max`) no es toca. Només canvia el SHA.
 *   · sdp-calendari-agricola i sdp-workflow reben també «## Vincles». Sense
 *     eixa secció tenen F9, i la Porta Frontmatter rebutja qualsevol fitxer
 *     MODIFICAT amb deute actiu (tractor-frontmatter.mjs:521-533): afegir
 *     només contracte.llig deixaria el pre-commit en roig.
 *   · manifest.yaml no té operació: ja és la projecció exacta del disc
 *     resultant (ho comprova tests/governanca-260930-t1.test.mjs).
 *   · 00_INDEX_SKILLS.md es regenera sencer amb la mateixa plantilla que
 *     tooling/brain/cataleg_skills.mjs:79-85, però només si l'índex actual ja
 *     és una projecció fidel de les seues pròpies entrades. Un índex editat a
 *     mà no es «corregix» en silenci.
 */
import { createHash } from 'node:crypto';

/* ──────────────────────────── Constants del torn ──────────────────────────── */

const ESQUEMA = 'tooling/wiki/schema.json';
const PANY = 'tooling/wiki/schema-cutover.lock.json';
const DEUTE = '.agents/deute/.frontmatter-deute.json';
const INDEX = '.agents/skills/00_INDEX_SKILLS.md';
const INDEX_ROUTER = '.agents/skills_index.json';
const PACKAGE = 'package.json';
const skill = (id) => `.agents/skills/${id}/SKILL.md`;

/** SHA-256 de l'esquema que hui segellen el pany i el deute. */
export const SHA_ESQUEMA_PREVI = 'f854d085af54464f9f7409028727601d0878c7c1c17a7715351c81b118b30ba9';
const METODE_DEUTE = 'F1-per-clau/v2';

/** Mai 90_arxiu_historic (AGENTS §5, 04_contracte_de_dades.md:91-96) i sense espais. */
export const PATRO_LLIG = String.raw`^(?!.*90_arxiu_historic)\S+$`;
export const PROPIETAT_LLIG = Object.freeze({
  type: 'array',
  items: Object.freeze({ type: 'string', minLength: 1, pattern: PATRO_LLIG }),
  uniqueItems: true,
});

export const NETEJA = 'core-neteja-brossa';
export const DESCRIPCIO_NETEJA = "Tractor de neteja d'arrels. Retira de l'arrel de socdepoble.org la brossa solta (logs, pegats, sondes) sense tocar mai la configuració de les eines, l'estat local ni res versionat.";
export const TRIGGERS_NETEJA = Object.freeze(["brossa a l'arrel", "neteja de l'arrel", "fitxers solts a l'arrel", 'neteja_brossa_arrel']);

/** Lectures declarades: les que la prosa de cada skill ja nomena (informe H1 §2). */
export const LECTURES = Object.freeze({
  'core-memoria-historica': Object.freeze(['_wiki_de_poble/02_saber/memoria_aprenentatges.md', '.agents/skills/wiki-cicle-de-vida/SKILL.md']),
  'sdp-calendari-agricola': Object.freeze(['.agents/skills/sdp-pedra-seca/SKILL.md']),
  'sdp-casos-us-essencials': Object.freeze(['.agents/skills/sdp-pedra-seca/SKILL.md', '.agents/skills/core-identitat/SKILL.md']),
  'sdp-workflow': Object.freeze(['.agents/skills/wiki-busca-skills/SKILL.md']),
});

export const TESTS_ENXUFE = Object.freeze(['tests/enxufe-plugin.test.mjs', 'tests/enxufe-empaqueta.test.mjs']);

const VINCLES = '## Vincles\n- [[00_INDEX_SKILLS]]\n';

/* ──────────────────────────── Primitives pures ──────────────────────────── */

const sha256 = (text) => createHash('sha256').update(text, 'utf8').digest('hex');

function unaVegada(text, ancora, on) {
  const primer = text.indexOf(ancora);
  if (primer === -1) throw new Error(`${on}: l'ancoratge no hi és; el fitxer ha canviat des que es va preparar el pegat`);
  if (text.indexOf(ancora, primer + 1) !== -1) throw new Error(`${on}: l'ancoratge hi apareix més d'una vegada`);
  return primer;
}

function substituixUna(text, ancora, nou, on) {
  const i = unaVegada(text, ancora, on);
  return text.slice(0, i) + nou + text.slice(i + ancora.length);
}

function contingutNou(nous, ruta, on) {
  const valor = nous instanceof Map ? nous.get(ruta) : nous?.[ruta];
  if (typeof valor !== 'string') {
    throw new Error(`${on}: falta el contingut nou de ${ruta}; el generador l'ha d'aplicar abans i passar el mapa de continguts nous`);
  }
  return valor;
}

function json(text, on) {
  try { return JSON.parse(text); } catch (e) { throw new Error(`${on}: JSON il·legible (${e.message})`); }
}

/** Posició del `---` de tancament del frontmatter inicial (LF estricte). */
function tancamentFrontmatter(text, on) {
  if (!text.startsWith('---\n')) throw new Error(`${on}: no comença per un frontmatter LF`);
  const tanca = text.indexOf('\n---\n', 3);
  if (tanca === -1) throw new Error(`${on}: frontmatter sense tancar`);
  return tanca + 1;
}

function afigLectures(id) {
  const ruta = skill(id);
  const on = `${ruta} (contracte.llig)`;
  const cometes = id === 'sdp-calendari-agricola'; // el fitxer cita tots els valors
  const bloc = ['contracte.llig:', ...LECTURES[id].map((r) => `  - ${cometes ? JSON.stringify(r) : r}`), ''].join('\n');
  return (actual) => {
    const fi = tancamentFrontmatter(actual, on);
    const cru = actual.slice(4, fi);
    if (/^contracte\.llig:/m.test(cru)) throw new Error(`${on}: contracte.llig ja hi és; el pegat ja s'ha aplicat`);
    if (/^contracte:/m.test(cru)) throw new Error(`${on}: hi ha un mapa niat «contracte:»; parseYamlLite no el llig i cal decidir-lo abans`);
    return actual.slice(0, fi) + bloc + actual.slice(fi);
  };
}

function afigVincles(actual, on) {
  if (/^## Vincles[ \t]*$/m.test(actual)) throw new Error(`${on}: ja té una secció «## Vincles»; el pegat ja s'ha aplicat`);
  return `${actual.replace(/\n+$/, '')}\n\n${VINCLES}`;
}

/* ──────────────────────────── Esquema, pany i deute ──────────────────────────── */

const ANCORA_REFLEX = '    "reflex": {\n      "type": "string"\n    }\n  }\n}';
const NOU_REFLEX = [
  '    "reflex": {',
  '      "type": "string"',
  '    },',
  '    "contracte.llig": {',
  '      "type": "array",',
  '      "items": {',
  '        "type": "string",',
  '        "minLength": 1,',
  `        "pattern": ${JSON.stringify(PATRO_LLIG)}`,
  '      },',
  '      "uniqueItems": true',
  '    }',
  '  }',
  '}',
].join('\n');

function aplicaEsquema(actual) {
  const on = ESQUEMA;
  if (actual.includes('"contracte.llig"')) throw new Error(`${on}: la propietat contracte.llig ja hi és; el pegat ja s'ha aplicat`);
  if (sha256(actual) !== SHA_ESQUEMA_PREVI) {
    throw new Error(`${on}: l'esquema no és el que segellen el pany i el deute (${SHA_ESQUEMA_PREVI.slice(0, 8)}); una altra mà l'ha canviat i la transició s'ha de revisar`);
  }
  // Només vàlid si `reflex` continua sent l'última propietat.
  const nou = substituixUna(actual, ANCORA_REFLEX, NOU_REFLEX, on);
  const esquema = json(nou, on);
  if (JSON.stringify(esquema.properties['contracte.llig']) !== JSON.stringify(PROPIETAT_LLIG)) throw new Error(`${on}: la propietat nova no és la prevista`);
  return nou;
}

function aplicaSegell(clau) {
  return (actual, nous) => {
    const on = clau === 'schemaSha256' ? PANY : DEUTE;
    const esquemaNou = contingutNou(nous, ESQUEMA, on);
    const shaNou = sha256(esquemaNou);
    if (shaNou === SHA_ESQUEMA_PREVI) throw new Error(`${on}: l'esquema nou té el mateix SHA que el previ`);
    if (actual.includes(`"${clau}": "${shaNou}"`)) throw new Error(`${on}: ja porta el SHA nou; el pegat ja s'ha aplicat`);
    const nou = substituixUna(actual, `"${clau}": "${SHA_ESQUEMA_PREVI}"`, `"${clau}": "${shaNou}"`, on);
    const dades = json(nou, on);
    if (dades[clau] !== shaNou) throw new Error(`${on}: ${clau} no ha quedat segellat`);
    if (clau === 'esquemaSha256') {
      // tractor-frontmatter.mjs:475 també exigix el mateix $id i el mateix mètode.
      if (dades.esquema !== json(esquemaNou, on).$id || dades.metode !== METODE_DEUTE) {
        throw new Error(`${on}: el deute és d'una altra llei (esquema o mètode); resegellar-lo ací l'absorbiria`);
      }
    }
    return nou;
  };
}

/* ──────────────────────────── core-neteja-brossa ──────────────────────────── */

const FM_NETEJA_ANTIC = `---\nname: ${NETEJA}\ndescription: ${DESCRIPCIO_NETEJA}\n---\n`;
export const FM_NETEJA_NOU = [
  '---',
  'type: skill',
  'status: actiu',
  `description: ${DESCRIPCIO_NETEJA}`,
  `name: ${NETEJA}`,
  'triggers_on:',
  ...TRIGGERS_NETEJA.map((t) => `  - ${t}`),
  '---',
  '',
].join('\n');

function aplicaNeteja(actual) {
  const on = skill(NETEJA);
  if (actual.startsWith(FM_NETEJA_NOU)) throw new Error(`${on}: ja porta el frontmatter complet; el pegat ja s'ha aplicat`);
  if (!actual.startsWith(FM_NETEJA_ANTIC)) {
    throw new Error(`${on}: el frontmatter actual no és el previst (name + description sense canvis); reviseu-lo abans de regenerar`);
  }
  unaVegada(actual, FM_NETEJA_ANTIC, on);
  // El cos queda intacte; només s'hi afig la secció de Vincles al final.
  return afigVincles(FM_NETEJA_NOU + actual.slice(FM_NETEJA_ANTIC.length), on);
}

function exigixNeteja(nous, on) {
  if (!contingutNou(nous, skill(NETEJA), on).startsWith(FM_NETEJA_NOU)) {
    throw new Error(`${on}: la skill ${NETEJA} del mateix paquet no porta el frontmatter previst`);
  }
}

/* ──────────────────────────── Índexs derivats ──────────────────────────── */

// Còpia literal de la plantilla de cataleg_skills.mjs:79-85.
const CAPCALERA_INDEX = [
  '---', 'type: index', 'status: generat',
  'description: Catàleg determinista de les skills actives, generat des de les fonts canòniques.',
  'tags:', '  - skills', '  - core', '---', '', '# Catàleg de skills', '',
  'Font executiva única: `.agents/skills/`. Este índex només referencia les fonts.', '',
];
const PEU_INDEX = ['', '', '## Vincles', '- [[.agents/index]]', ''];
const ENTRADA_INDEX = /^- \[\[([a-z0-9]+(?:-[a-z0-9]+)*)\/SKILL\|\1\]\]: (.*)$/;

export function projeccioIndex(entrades) {
  return [...CAPCALERA_INDEX, ...entrades.map((e) => `- [[${e.id}/SKILL|${e.id}]]: ${e.description}`), ...PEU_INDEX].join('\n');
}

function aplicaIndex(actual, nous) {
  const on = INDEX;
  exigixNeteja(nous, on);
  const linies = actual.split('\n');
  const cos = linies.slice(CAPCALERA_INDEX.length, linies.length - PEU_INDEX.length);
  const entrades = cos.map((l) => {
    const m = ENTRADA_INDEX.exec(l);
    if (!m) throw new Error(`${on}: línia fora de la projecció: «${l.slice(0, 60)}»`);
    return { id: m[1], description: m[2] };
  });
  if (projeccioIndex(entrades) !== actual) {
    throw new Error(`${on}: l'índex actual no és una projecció fidel de cataleg_skills.mjs; regenereu-lo i torneu a preparar el paquet`);
  }
  if (entrades.some((e) => e.id === NETEJA)) throw new Error(`${on}: ${NETEJA} ja hi és; el pegat ja s'ha aplicat`);
  const totes = [...entrades, { id: NETEJA, description: DESCRIPCIO_NETEJA.replace(/\s+/g, ' ') }];
  // Mateix ordre que inventari(): comparació de codis, no localeCompare.
  totes.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return projeccioIndex(totes);
}

function aplicaIndexRouter(actual, nous) {
  const on = INDEX_ROUTER;
  exigixNeteja(nous, on);
  const index = json(actual, on);
  if (`${JSON.stringify(index, null, 2)}\n` !== actual) throw new Error(`${on}: no té el format de build_skills_index.mjs:51`);
  if (index.schema !== 'sdp.skills_index.v1' || !Array.isArray(index.core) || !index.plugins || typeof index.plugins !== 'object') {
    throw new Error(`${on}: estructura desconeguda`);
  }
  if (index.core.some((r) => r?.name === NETEJA)) throw new Error(`${on}: ${NETEJA} consta com a core i el seu frontmatter no ho declara`);
  const registre = index.plugins[NETEJA];
  if (!registre || registre.name !== NETEJA || registre.path !== skill(NETEJA) || registre.description !== DESCRIPCIO_NETEJA) {
    throw new Error(`${on}: el registre de ${NETEJA} no és el previst`);
  }
  if (JSON.stringify(registre.triggers_on) === JSON.stringify(TRIGGERS_NETEJA)) throw new Error(`${on}: els disparadors ja hi són; el pegat ja s'ha aplicat`);
  if (!Array.isArray(registre.triggers_on) || registre.triggers_on.length) throw new Error(`${on}: disparadors inesperats: ${JSON.stringify(registre.triggers_on)}`);
  registre.triggers_on = [...TRIGGERS_NETEJA];
  return `${JSON.stringify(index, null, 2)}\n`;
}

/* ──────────────────────────── package.json ──────────────────────────── */

function aplicaPackage(actual) {
  const on = PACKAGE;
  const trobades = [...actual.matchAll(/^ {4}"test:node": "node --test ([^"\n]*)",$/gm)];
  if (trobades.length !== 1) throw new Error(`${on}: l'script test:node ha d'aparéixer exactament una vegada (${trobades.length})`);
  const [linia, fitxers] = trobades[0];
  const llista = fitxers.split(' ');
  const presents = TESTS_ENXUFE.filter((t) => llista.includes(t));
  if (presents.length === TESTS_ENXUFE.length) throw new Error(`${on}: test:node ja porta les bateries d'enxufe; el pegat ja s'ha aplicat`);
  if (presents.length) throw new Error(`${on}: test:node ja porta ${presents.join(', ')}; estat parcial, reviseu-lo a mà`);
  // S'afigen al final: altres pegats poden allargar la mateixa llista.
  const nou = substituixUna(actual, linia, `    "test:node": "node --test ${[...llista, ...TESTS_ENXUFE].join(' ')}",`, on);
  json(nou, on);
  return nou;
}

/* ──────────────────────────── Operacions ──────────────────────────── */

export const operacions = [
  {
    ruta: ESQUEMA,
    descripcio: 'T1: propietat contracte.llig (llista de rutes no buides, úniques i mai de 90_arxiu_historic) després de reflex; $id sense canvis.',
    aplica: aplicaEsquema,
  },
  {
    ruta: PANY,
    descripcio: 'T1: schemaSha256 = SHA-256 dels bytes nous de schema.json; la resta del pany igual.',
    depen: [ESQUEMA],
    aplica: aplicaSegell('schemaSha256'),
  },
  {
    ruta: DEUTE,
    descripcio: 'T1: esquemaSha256 = SHA-256 nou de schema.json; sostre max, esquema, mètode i data sense canvis.',
    depen: [ESQUEMA],
    aplica: aplicaSegell('esquemaSha256'),
  },
  {
    ruta: skill(NETEJA),
    descripcio: 'T1: frontmatter complet (type, status actiu, description sense canvis, name, triggers_on) i «## Vincles» amb [[00_INDEX_SKILLS]]; cos intacte.',
    aplica: aplicaNeteja,
  },
  {
    ruta: skill('core-telemetria-huma'),
    descripcio: 'T1: «## Vincles» amb [[00_INDEX_SKILLS]] (F9).',
    aplica: (actual) => afigVincles(actual, skill('core-telemetria-huma')),
  },
  {
    ruta: skill('core-memoria-historica'),
    descripcio: 'T1: contracte.llig amb memoria_aprenentatges i wiki-cicle-de-vida (prosa, línies 17 i 21).',
    aplica: afigLectures('core-memoria-historica'),
  },
  {
    ruta: skill('sdp-calendari-agricola'),
    descripcio: 'T1: contracte.llig amb sdp-pedra-seca (prosa, línia 24) i «## Vincles», sense la qual la Porta Frontmatter rebutja el fitxer modificat (F9).',
    aplica: (actual) => afigVincles(afigLectures('sdp-calendari-agricola')(actual), skill('sdp-calendari-agricola')),
  },
  {
    ruta: skill('sdp-casos-us-essencials'),
    descripcio: 'T1: contracte.llig amb sdp-pedra-seca i core-identitat (prosa, línia 64).',
    aplica: afigLectures('sdp-casos-us-essencials'),
  },
  {
    ruta: skill('sdp-workflow'),
    descripcio: 'T1: contracte.llig amb wiki-busca-skills (prosa, línia 21; fora el camí de 90_arxiu_historic) i «## Vincles» (F9).',
    aplica: (actual) => afigVincles(afigLectures('sdp-workflow')(actual), skill('sdp-workflow')),
  },
  {
    ruta: INDEX,
    descripcio: 'T1: projecció de cataleg_skills.mjs amb core-neteja-brossa inserida en ordre.',
    depen: [skill(NETEJA)],
    aplica: aplicaIndex,
  },
  {
    ruta: INDEX_ROUTER,
    descripcio: 'T1: projecció de build_skills_index.mjs; disparadors de core-neteja-brossa.',
    depen: [skill(NETEJA)],
    aplica: aplicaIndexRouter,
  },
  {
    ruta: PACKAGE,
    descripcio: 'T1: test:node amb tests/enxufe-plugin.test.mjs i tests/enxufe-empaqueta.test.mjs al final de la llista.',
    aplica: aplicaPackage,
  },
];
