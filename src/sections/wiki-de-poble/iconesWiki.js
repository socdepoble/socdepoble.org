/**
 * iconesWiki.js — l'emoji de cada fitxa i de cada carpeta de la Wiki de Poble.
 *
 * Ordre del Mestre (261007) · Els ítems de la Wiki porten emojis distints i
 * amb sentit, com els espècimens de Disseny: la Consola, les eines locals de
 * la Maquinària de la IAIA i cada document.
 *
 * Ordre del Mestre (pla 261007_0012, §0.7, «Emojis a l'Índex de la Wiki
 * (Carpetes i Arrel)») · La llista lateral era massa repetitiva amb la mateixa
 * carpeta de Lucide a tots els apartats: CADA carpeta i subcarpeta de la Wiki
 * porta ara un emoji propi i semàntic (ICONES_CARPETES_WIKI), i la portada
 * («Wiki de Poble»), el seu (ICONA_PORTADA). A l'arbre es pinten menuts, com
 * la icona de Lucide germana (NavGlyph); a la llista de fitxes, XL (ItemMedia).
 * La Llei de la Roda Dentada (261007: les carpetes de sistema fan servir
 * exclusivament Lucide) és de les carpetes del Bloc de Notes (Mur, Mercat,
 * Pobles…), no de les de la Wiki.
 *
 * El manifest (src/data/wikiManifest.js) és generat i no porta cap camp
 * d'icona: el mapatge viu ací, al costat de la secció, i no es toca el
 * generat. L'ordre de tria d'un document:
 *   1. el seu propi, per id (ICONES_PER_ID);
 *   2. el prefix de l'id: ADR-… (decisions d'arquitectura), índexs
 *      (00_index…, index_…) i actes;
 *   3. el tipus del frontmatter (attributes.type: norma, plantilla, hub…);
 *   4. el document genèric (📄).
 * Una carpeta tria la seua entrada d'ICONES_CARPETES_WIKI o, si el manifest
 * en porta una de nova, la carpeta de Lucide (glifDeCarpetaWiki).
 * Tots són emojis RGI de Unicode 13 o anteriors (es veuen a Safari 16):
 * iconesWiki.test.js ho comprova. Les carpetes, que l'arbre mostra sempre,
 * porten emojis d'Unicode 9 o anteriors (el CODEX HUMÀ, 💓 i no 🫀, d'Unicode
 * 13): la font d'emojis de Windows 10, amb què pinta Chrome, no porta els
 * d'Unicode 12 i 13 (revisió del §0.7, R5).
 */
import { GLIF_CARPETA } from '../../components/universal/workspace/NavGlyph.jsx';

/* La portada de la Wiki (__intro) i la seua entrada a l'arbre (__intro_cat):
   el llibre obert, el de la base de coneixement que es llig. Cap document ni
   cap carpeta no el porta. En obrir-la, la imatge de la seua capçalera no
   canvia: la pinta el detall, del seu copy (WikiDePobleSection, WikiDetail). */
export const ICONA_PORTADA = '📖';

/* Els ítems que declara la secció i que nomena l'ordre: la portada, la
   Consola i les eines locals. La Consola porta l'engranatge de la convenció
   del catàleg (⚙️ Consola, EspecimenUniversalCard). destinsEmoji.js llig
   d'ací el de la portada. */
export const ICONES_ITEMS_WIKI = Object.freeze({
  __intro: ICONA_PORTADA,
  consola_termodinamica: '⚙️',
  tractors_aprovacio: '🚜',
  sentinelles_panell: '💂',
  agents_panell: '🤖'
});

/* Les entrades de l'arbre de la Wiki, per id: les dues fixes que declara la
   secció (la portada i la Maquinària de la IAIA) i cada carpeta i subcarpeta
   del manifest (folder:<ruta>). Distintes entre germanes i entre totes elles.
   Un id que el manifest ja no porta no fa res; una carpeta nova sense entrada
   porta la carpeta de Lucide (glifDeCarpetaWiki) fins que en tinga una. */
export const ICONES_CARPETES_WIKI = Object.freeze({
  /* Les fixes de la secció */
  __intro_cat: ICONA_PORTADA,
  maquinaria_cat: '🎛️',
  /* SER, SABER i ACTUAR: el que som, el que sabem i el que fem. */
  'folder:01_ser': '🌱',
  'folder:02_saber': '🦉',
  'folder:03_actuar': '🔨',
  /* SABER */
  'folder:02_saber/03_consola_termodinamica': '🌡️',
  'folder:02_saber/architecture': '📐',
  'folder:02_saber/codex_huma': '💓',
  'folder:02_saber/obsidian_plugins': '💎',
  'folder:02_saber/protocols_tecnics': '🔬',
  /* ACTUAR */
  'folder:03_actuar/plantilles': '📋'
});

/* Els documents del manifest, un per un, pel que diuen. Un id que el
   manifest ja no porta no fa res: el document nou cau a les regles. */
export const ICONES_PER_ID = Object.freeze({
  /* SER */
  '01_identitat': '🪞',
  '02_genotip': '🧬',
  '03_equip_ia': '👥',
  '04_taula_potencia_models': '📊',
  agents_equip_ia: '🦾',
  personalitat_iaia: '👵',
  /* SABER */
  '00_arquitectura_tecnica_unificada': '🏗️',
  '00_full_de_ruta': '🛣️',
  '00_visio_i_pilars': '🔭',
  '01_trellat': '💡',
  anatomia_cognitiva: '🧠',
  antigravity: '🛸',
  coneixement: '📚',
  connectors_mcp_disseny: '🔌',
  connexio_radical: '🔗',
  doc_governanca: '🗳️',
  doc_logos_oficials: '🖼️',
  el_projecte: '🏘️',
  estandard_integracio_react: '⚛️',
  estandard_ui_universal: '🖥️',
  forja_to_core: '⚒️',
  govern: '🧭',
  graf: '🕸️',
  identitat: '🆔',
  identitat_visual: '🎨',
  llei_05_privacitat: '🔒',
  llibre_blanc_produccio_pedra_seca: '📘',
  maquina: '🛠️',
  memoria_aprenentatges: '📓',
  perfil_psiquiatric: '🛋️',
  sdp_lock: '🔐',
  sistema_immunitari: '🦠',
  soci_sollutia: '🤝',
  /* SABER · Consola termodinàmica */
  '00_portada': '🏠',
  '01_fluxos_skills': '🔀',
  '02_calendari': '📅',
  '03_inventari_skills': '📦',
  '04_contracte_de_dades': '✍️',
  '05_actors_i_salut': '🩺',
  /* SABER · Arquitectura i còdex humà */
  '260913_0635_arquitectura_perfil_universal': '👤',
  arquitectura_l_anima: '🕊️',
  arquitectura_protocol_lazaro: '♻️',
  arquitectura_sistema_nervios: '⚡',
  /* SABER · Connectors d'Obsidian */
  homepage: '🏡',
  plugins: '🧩',
  /* SABER · Protocols tècnics */
  a11y_seo_trellat: '♿',
  auditoria_canonica: '🔍',
  futur_adaptacio: '🔮',
  seguretat_execucio: '🛡️',
  self_repair: '🩹',
  sgq_prompts: '💬',
  successio_lazaro_execucio: '👑',
  taxonomia_documental: '🏷️',
  /* ACTUAR · Plantilles */
  brainstorming: '💭',
  branding: '📣',
  bundle: '🎁',
  doc_to_app: '📲',
  estudi_consell: '🗣️',
  pla: '🗺️',
  pla_implementacio: '🔧',
  produccio: '🏭',
  prompt_consell: '📨',
  prompt_local: '💻',
  prompt_nano_banana: '🍌',
  skill: '🎓'
});

/* Per prefix de l'id: les famílies que creixen soles. */
export const ICONA_ADR = '🏛️';
export const ICONA_INDEX = '📇';
export const ICONA_ACTA = '📜';

/* Per tipus del frontmatter (tooling/wiki/schema.json). Cap no repetix el
   d'una carpeta: una plantilla nova sense entrada pròpia porta 📝, no el 📋
   de la carpeta PLANTILLES on viu (iconesWiki.test.js ho vigila). */
export const ICONES_PER_TIPUS = Object.freeze({
  index: ICONA_INDEX,
  acta: ICONA_ACTA,
  norma: '⚖️',
  plantilla: '📝',
  hub: '🕸️',
  protocol: '📏',
  skill: '🧰'
});

/* El document genèric: el que no diu res més. */
export const ICONA_DOCUMENT = '📄';

const propia = (mapa, clau) => (Object.prototype.hasOwnProperty.call(mapa, clau) ? mapa[clau] : null);

/**
 * El glif d'una entrada de l'arbre de la Wiki (una carpeta del manifest o una
 * de les fixes de la secció), pel seu id: el seu emoji o, si encara no en té,
 * la carpeta de Lucide (GLIF_CARPETA). Pura: una carpeta nova del manifest no
 * peta res, i un id que es diu com una propietat d'objecte no trau cap valor
 * heretat.
 */
export function glifDeCarpetaWiki(id) {
  return propia(ICONES_CARPETES_WIKI, String(id ?? '')) || GLIF_CARPETA;
}

/** L'emoji d'un document del manifest ({ id, attributes: { type } }). */
export function iconaDeDocument(document) {
  const id = String(document?.id ?? '');
  const tipus = String(document?.attributes?.type ?? '');
  return propia(ICONES_PER_ID, id)
    || (/^ADR-/i.test(id) ? ICONA_ADR : null)
    || (/^(?:00_)?index(?:_|$)/.test(id) ? ICONA_INDEX : null)
    || (/^acta(?:_|$)/.test(id) ? ICONA_ACTA : null)
    || propia(ICONES_PER_TIPUS, tipus)
    || ICONA_DOCUMENT;
}
