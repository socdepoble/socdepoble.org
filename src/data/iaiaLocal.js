/**
 * iaiaLocal.js — el primer pas d'intel·ligència local de la IAIA MarIA.
 *
 * Gauntlet 261016_1530 (Bloc 3.6.6; relleu F25; MCR b36_xat.3) · Quan algú
 * escriu a la IAIA en llavor o en local, el magatzem que fa de servidor en
 * estos dos modes (localXat.js) li demana una resposta ací.
 * Gauntlet 261022_0225 (crítica Claude) · En remot l'adaptador mai no escriu
 * per ella: cap missatge del fil ix d'este mòdul, i això no canvia. El que sí
 * que pot oferir la interfície, també en remot, és la consulta documental
 * (consultaTecnicaIAIA, que pinta ConsultaIAIA.jsx): local, rotulada com a
 * ajuda amb la Wiki, que es queda al navegador i no publica res ni al fil ni
 * al grup públic de /iaia.
 *
 * QUÈ FA
 *   Busca els 3 documents de la Wiki pública més pròxims a la pregunta i
 *   compon, en valencià, «Això és el que en sé per la Wiki de Poble:» amb un
 *   fragment del document i la seua font /wikidepoble?item=<slug>. Un
 *   document només hi entra si el que se'n mostra (el títol i el fragment)
 *   porta prou paraules de la pregunta (cercaRellevant). Si cap document no
 *   passa eixe llindar, o si la Wiki no es pot carregar a temps, torna null, i
 *   qui la crida respon amb RESPOSTA_IAIA, la frase de sempre. A un missatge
 *   sense cap paraula que busque (una salutació, un «gràcies», un «ok»), la
 *   salutació de la IAIA.
 *
 * D'ON TRAU LA WIKI
 *   De src/data/wikiManifest.js, que ja és al paquet (és el que pinta
 *   /wikidepoble) i només porta el que deixa eixir la política de publicació
 *   del compilador (tooling/wiki/compile-wiki-to-app.mjs). Es carrega amb
 *   import() la primera vegada que algú escriu a la IAIA o obri la consulta:
 *   cap byte més al tros d'entrada ni al nucli, i cap descàrrega de
 *   public/rag-index.json. No fa servir tooling/wiki/core/edge_rag.mjs, que
 *   indexa documents no públics.
 *
 * COM BUSCA
 *   JS pur, sense dependències ni models. Tokenització simple (minúscules,
 *   sense diacrítics, «l·l» com a «ll», paraules de 3 lletres o més, fora les
 *   paraules buides i les salutacions), una arrel lleugera («pujo», «puge» i
 *   «pujar» comparteixen arrel) i una puntuació BM25 sobre el títol, el
 *   subtítol, la descripció, les etiquetes i el cos de cada document, amb més
 *   pes per al títol. Un missatge que només porta paraules buides, salutacions
 *   o el nom de la IAIA («Bon dia, IAIA», «Gràcies», «Qui ets?») no busca res.
 */

import { iniciDelContingut } from '../utils/iniciEditorial.js';
import { SALUTACIO_TECNICA_IAIA } from './iaiaTextos.js';
export { SALUTACIO_TECNICA_IAIA } from './iaiaTextos.js';
export const ENCAPCALAMENT_DE_LA_WIKI = 'Això és el que en sé per la Wiki de Poble:';
/* La ruta de la Wiki de Poble (SECTIONS · 'wikidepoble'). Ací en literal: el
   registre de seccions porta icones de la interfície i este mòdul viu al tros
   del magatzem local. iaiaLocal.test.js vigila que coincidisquen. */
export const RUTA_DE_LA_WIKI = '/wikidepoble';
export const DOCUMENTS_PER_RESPOSTA = 3;
export const MAXIM_PREGUNTA_IAIA = 2000;
const MAXIM_FRAGMENT = 360;
/* Si la Wiki no ha arribat en este temps, la IAIA contesta la frase de sempre
   i la càrrega continua: la pregunta següent ja la troba. */
export const TEMPS_MAXIM_DE_LA_WIKI = 4000;
/* Gauntlet 261022_0225 (crítica Claude) · La consulta l'espera qui pregunta,
   amb «Consultant la Wiki…» a la vista i el diàleg per a tancar-la: la
   primera càrrega (183 KB gzip) té més marge en una connexió lenta del poble.
   Si tampoc no arriba, la càrrega continua i tornar-ho a provar la troba. */
export const TEMPS_MAXIM_DE_LA_CONSULTA = 15000;

/* Pes de cada camp del document en la freqüència d'un terme. */
const PES_TITOL = 3;
const PES_FITXA = 2;
const PES_COS = 1;
/* Paràmetres habituals de BM25. */
const K1 = 1.2;
const B = 0.75;
const LLARGARIA_MINIMA = 3;

/* Paraules buides del valencià (sense diacrítics, com les deixa plega), les
   salutacions i les peticions que no diuen de què es parla («explica'm»), i
   el soroll dels enllaços del Markdown. Gauntlet 261022_0225 (crítica
   Claude) · També el verb «portar» («Qui porta Sóc de Poble?»): a la Wiki,
   «porta» és quasi sempre una porta de qualitat («npm run porta»), i
   «portes» en faria «port», el del backend. */
const PARAULES_BUIDES = new Set(`
  el la els les lo los un una uns unes del dels als pel pels per amb que qui com
  quan quant quanta quants quantes quin quina quins quines perque pero doncs sino
  mes menys molt molta molts moltes poc poca pocs poques tot tota tots totes cap res
  algu alguna algun alguns algunes altre altra altres mateix mateixa mateixos mateixes
  aixo aco allo aquest aquesta aquests aquestes este esta estos estes eixe eixa eixos
  eixes aquell aquella aquells aquelles ara aci alla aqui ahi aixi tambe encara sempre
  mai sense sobre entre fins des desde cada contra segons durant mentre despres abans
  dins fora davant darrere damunt davall sota jo ell ella ells elles nosaltres
  vosaltres voste vostes meu meua meva meus meues meves teu teua teva teus teues teves
  seu seua seva seus seues seves nostre nostra nostres vostre vostra vostres mon ton
  son ens lis soc ets som sou era eren sera seria ser estar estic estas estem esteu
  estan estava haver has hem heu han havia fer faig fas fem feu fan feia pot poden
  puc pots podem podeu podria podries vull vols vol volem voleu volen voldria saber
  saps sap sabem sabeu saben sabries dir dius diu digues digueu explica explicam
  explicar parla parlam parlar conta contam contar ensenya ensenyam mostra mostram
  busca cerca troba necessite necessito porta portes porten portar hola bon bona bons bones dia dies tarda tardes
  funciona funcionen funcionar utilitza utilitzar usar utilitze ajudes ajuda ajudar
  nit nits matinada adeu siau salut gracies merce ei ep vale item http https www html
`.trim().split(/\s+/));

/* El nom de qui escriu no diu de què es parla: una pregunta que només porta
   estes paraules (a més de les buides) no busca res. */
const NOMS_DE_LA_IAIA = new Set(['iaia', 'maria']);

/* Gauntlet 261022_0225 (crítica Claude) · El coneixement d'ajuda és el que
   s'adreça a les persones. Les plantilles, els prompts, els paquets, les
   skills i els protocols són instruccions per a qui treballa la Wiki, i estos
   documents, tot i ser públics, parlen a la IA («Quan calga col·laboració, tin
   en compte…»): la IAIA no els cita com a resposta. El Llibre d'Or tampoc:
   és la memòria de les auditories de l'equip («un db reset que va esborrar
   el compte… (fonts: …auditoria_claude.md)»), i responia «Com esborre el
   meu compte?». Ni les fitxes i carpetes de treball de l'equip (la taula de
   models, l'equip IA, els connectors d'Obsidian, la Consola Termodinàmica):
   «Quant costa?» trobava el preu dels models i «Com faig una nota?», el
   directori de connectors d'Obsidian. El manifest encara no porta cap camp
   d'audiència; quan el porte, esta llista passa a ser-ne la llista blanca. */
const TIPUS_NO_D_AJUDA = new Set(['plantilla', 'prompt', 'bundle', 'skill', 'protocol']);
const INSTRUCCIONS_PER_A_LA_IA = new Set(['personalitat_iaia', 'perfil_psiquiatric', 'agents_equip_ia', 'sgq_prompts', '03_llibre_d_or_memoria_episodica',
  '04_taula_potencia_models', '03_equip_ia']);
const CARPETES_DE_L_EQUIP = new Set(['folder:02_saber/obsidian_plugins', 'folder:02_saber/03_consola_termodinamica']);
/* La mateixa frontera que publicMetadata (tooling/wiki/lib/publication-policy.mjs):
   una visibilitat explícita que no és 'public' i els estats arxivat i
   quarantena no ixen mai, encara que un carregador injectat (un pont de
   servidor, una prova) els torne. iaiaLocal.consulta.test.js les compara. */
const ESTATS_NO_PUBLICS = new Set(['arxivat', 'quarantena']);

/** Minúscules, sense diacrítics i «l·l» com a «ll». */
const plega = (text) => String(text ?? '').normalize('NFD').replace(/\p{M}/gu, '').replace(/·/g, '').toLowerCase();

/** El Markdown sense els destins dels enllaços ni les adreces soltes. */
const senseEnllacos = (text) => String(text ?? '').replace(/\]\([^)]*\)/g, ']').replace(/https?:\/\/\S+/g, ' ');

/**
 * Les paraules que compten d'un text: plegades, de 3 lletres o més, amb
 * alguna lletra i fora de les paraules buides. Funció pura.
 * @param {string} text
 * @returns {string[]}
 */
export function tokenitza(text) {
  return plega(senseEnllacos(text))
    .split(/[^\p{L}\p{N}]+/u)
    .filter((paraula) => paraula.length >= LLARGARIA_MINIMA && /\p{L}/u.test(paraula) && !PARAULES_BUIDES.has(paraula));
}

/* Gauntlet 261022_0225 (crítica Claude) · L'arrel lleugera. Torna com a molt
   una terminació de plural al seu singular («sistemes» → «sistema»,
   «preparades» → «preparada») i després lleva una de verb (infinitiu,
   persona o participi), mai una derivativa, i deixa sempre 3 lletres o més;
   al final iguala les alternances («busqu-» i «busc-», «pagu-» i «pag-»,
   «pug-» i «puj-»). Així «paper» i «papers», «cadena» i «cadenes», o
   «esborre» i «esborrades», casen, i «barates» ja no fa «bar». */
const PLURALS = [['ades', 'ada'], ['ats', 'at'], ['es', 'a'], ['os', 'o'], ['s', '']];
const TERMINACIONS_DEL_VERB = ['ada', 'ar', 'er', 'ir', 'en', 'em', 'eu', 'at', 'a', 'e', 'o'];
const terminacioDe = (text, terminacions) => terminacions.find((t) => text.endsWith(t) && text.length - t.length >= LLARGARIA_MINIMA);
const singular = (text) => {
  const parell = PLURALS.find(([plural]) => terminacioDe(text, [plural]));
  return parell ? text.slice(0, -parell[0].length) + parell[1] : text;
};
const lleva = (text, terminacions) => {
  const terminacio = terminacioDe(text, terminacions);
  return terminacio ? text.slice(0, -terminacio.length) : text;
};

/** L'arrel d'una paraula ja plegada: «pujo», «puge» i «pujar» fan «puj». Funció pura. */
export function arrel(paraula) {
  return lleva(singular(String(paraula ?? '')), TERMINACIONS_DEL_VERB)
    .replace(/qu$/, 'c').replace(/gu$/, 'g').replace(/g$/, 'j');
}

const arrels = (text) => tokenitza(text).map(arrel);

/* El títol del Markdown com a text pla, amb les mateixes regles que la Wiki
   (wiki-de-poble/parseMarkdown.js · textPla, i editorial.js · llevaPuntFinal):
   la IAIA nomena el document com el nomena la seua pàgina. iaiaLocal.test.js
   ho compara amb extreuEditorial per a tota la Wiki. */
function textPla(md, llevaPunt = true) {
  const net = md
    .replace(/[ \t]+#+[ \t]*$/, '')
    .replace(/<[^>]*>/g, '')
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__)(\S(?:[^\n]*?\S)?)\1/g, '$2')
    .replace(/\*(\S(?:[^*\n]*?\S)?)\*/g, '$1')
    .replace(/(^|[\s(])_(\S(?:[^_\n]*?\S)?)_(?=$|[\s).,;:!?])/g, '$1$2')
    .trim();
  if (!llevaPunt) return net;
  const ambPunt = /^([\s\S]*[^.])\.$/.exec(net);
  return ambPunt ? ambPunt[1].replace(/\s+$/, '') : net;
}

/**
 * El títol d'un document de la Wiki: el de la seua capçalera «# Títol» (el
 * que pinta la pàgina) o, si no en té, el del manifest. Funció pura.
 */
export function titolDeDocument(item) {
  const cos = String(item?.content ?? '');
  const text = (cos.charCodeAt(0) === 0xFEFF ? cos.slice(1) : cos).replace(/\r\n?/g, '\n');
  const inici = iniciDelContingut(text);
  const primera = inici < text.length ? text.slice(text.lastIndexOf('\n', inici - 1) + 1).split('\n')[0] : '';
  const capcalera = primera !== undefined ? /^# (.*)$/.exec(primera) : null;
  const titol = capcalera ? textPla(capcalera[1]) : '';
  return titol || String(item?.title || item?.id || '');
}

/* encodeURIComponent deixa sense codificar «!'()*». Es codifiquen també
   perquè la ruta només porte lletres, xifres i «_.~-%», que és el que la
   bombolla de la IAIA reconeix com a ruta sencera (sections/xat/enllacos.js ·
   PATRO_RUTA_WIKI). Un parèntesi o una cometa del text no hi entren mai. El
   punt final també es codifica: la bombolla el llig com el de la frase. */
const codificaId = (id) => encodeURIComponent(String(id ?? ''))
  .replace(/[!'()*]/g, (caracter) => `%${caracter.charCodeAt(0).toString(16).toUpperCase()}`)
  .replace(/\.$/, '%2E');

/** L'enllaç intern d'un document de la Wiki de Poble. */
export const rutaDeDocumentWiki = (id) => `${RUTA_DE_LA_WIKI}?item=${codificaId(id)}`;

/** Suma `pes` a cada paraula de `paraules` dins de `freq`. */
function acumula(freq, paraules, pes) {
  for (const paraula of paraules) freq.set(paraula, (freq.get(paraula) || 0) + pes);
  return paraules.length * pes;
}

/* Gauntlet 261022_0225 (crítica Claude) · El codi en línia (`npm run
   porta`, `mercat` dins d'una consulta), els noms de fitxer i els
   identificadors (amb «_», «/» o una extensió) no són prosa que responga a
   una persona del poble: es mostren, però no compten per a triar el
   fragment ni per al llindar de rellevància. */
const CODI_EN_LINIA = /`[^`\n]+`/g;
const NOMS_DE_CODI = /\S*[_/\\]\S*|\S+\.(?:md|mjs|js|jsx|json|css|html|sql)\b/giu;
const prosa = (text) => String(text ?? '').replace(NOMS_DE_CODI, ' ');

/* Fragments citables, mai instruccions executables. El corpus continua sent
   exclusivament el manifest públic; ni el RAG intern ni l'Escriptori.
   `termes` són les arrels de la prosa del bloc, sense el codi. */
function fragmentsDe(content) {
  return String(content ?? '')
    .replace(/^---\s*\n[\s\S]*?\n---\s*(?:\n|$)/, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/```[^\n]*\n[\s\S]*?```/g, '')
    .replace(/~~~[^\n]*\n[\s\S]*?~~~/g, '')
    .split(/\n\s*\n|\n(?=\s*[-*]\s)/)
    .map((bloc) => bloc.split('\n').filter((linia) => !/^\s*(?:#{1,6}\s|\||[-*_]{3,}\s*$)/.test(linia)).join(' '))
    .map((bloc) => ({ bloc, text: textPla(bloc, false).replace(/^\s*[-*>]\s*/, '').replace(/\s+/g, ' ').trim() }))
    .filter(({ text }) => text.length >= 24)
    .map(({ bloc, text }) => ({ text, termes: new Set(arrels(prosa(textPla(bloc.replace(CODI_EN_LINIA, ' '), false)))) }));
}

/* El fragment que es mostra i les arrels de prosa que hi queden visibles.
   `termes` són les arrels de la pregunta i `exactes`, les seues paraules. */
function fragmentRellevant(fragments, termes, exactes) {
  let millor = null;
  let puntuacio = 0;
  for (const fragment of fragments || []) {
    const coincidencies = termes.filter((terme) => fragment.termes.has(terme)).length;
    if (coincidencies > puntuacio) { millor = fragment; puntuacio = coincidencies; }
  }
  if (!millor) return { text: '', vist: [] };
  const text = retallaFragment(millor.text, termes, exactes);
  return { text, vist: arrels(prosa(text)).filter((terme) => millor.termes.has(terme)) };
}

function retallaFragment(millor, termes, exactes) {
  if (millor.length <= MAXIM_FRAGMENT) return millor;
  /* La paraula que justifica la resposta ha de quedar visible, encara que
     aparega al final d'un paràgraf llarg. Preferix un límit de frase, i la
     paraula tal com s'ha escrit a una que només en comparteix l'arrel. */
  const paraules = [...millor.matchAll(/[\p{L}\p{N}\p{M}·]+/gu)].map((paraula) => ({ index: paraula.index, plegada: plega(paraula[0]) }));
  const exacta = paraules.find((paraula) => exactes.includes(paraula.plegada));
  const perArrel = paraules.find((paraula) => termes.includes(arrel(paraula.plegada)));
  const primera = (exacta || perArrel)?.index ?? 0;
  let inici = primera < MAXIM_FRAGMENT / 2 ? 0 : Math.max(0, primera - 100);
  if (inici > 0) {
    const frase = millor.lastIndexOf('. ', primera);
    inici = frase >= inici ? frase + 2 : millor.indexOf(' ', inici) + 1;
  }
  const maxim = inici + MAXIM_FRAGMENT;
  const tall = millor.length > maxim ? millor.lastIndexOf(' ', maxim) : millor.length;
  const fi = tall > inici ? tall : maxim;
  return `${inici ? '…' : ''}${millor.slice(inici, fi)}${fi < millor.length ? '…' : ''}`;
}

/* Gauntlet 261022_0225 (crítica Claude) · El mirall de publicMetadata. */
function esPublic(item) {
  const atributs = item.attributes;
  if (atributs != null && (typeof atributs !== 'object' || Array.isArray(atributs))) return false;
  for (const capa of [item, atributs || {}]) {
    if (Object.hasOwn(capa, 'visibility') && capa.visibility !== 'public') return false;
    if (ESTATS_NO_PUBLICS.has(capa.status)) return false;
  }
  return true;
}

/**
 * L'índex de cerca d'una llista de documents del manifest ({ id, title,
 * subtitle, tags, attributes, content }). Funció pura.
 */
export function construeixIndex(items = []) {
  const documents = [];
  const docsAmb = new Map();
  for (const item of Array.isArray(items) ? items : []) {
    if (!item || !item.id || !esPublic(item)) continue;
    if (TIPUS_NO_D_AJUDA.has(item.attributes?.type) || INSTRUCCIONS_PER_A_LA_IA.has(String(item.id))
      || CARPETES_DE_L_EQUIP.has(item.categoryId)) continue;
    const titol = titolDeDocument(item);
    const freq = new Map();
    const etiquetes = [...(Array.isArray(item.tags) ? item.tags : []), ...(Array.isArray(item.attributes?.tags) ? item.attributes.tags : [])];
    let llargaria = acumula(freq, arrels(`${titol} ${item.title || ''}`), PES_TITOL);
    llargaria += acumula(freq, arrels(`${item.subtitle || ''} ${item.attributes?.description || ''} ${etiquetes.join(' ')}`), PES_FITXA);
    llargaria += acumula(freq, arrels(item.content), PES_COS);
    if (!freq.size) continue;
    documents.push({ id: String(item.id), titol, arrelsDelTitol: new Set(arrels(titol)), freq, llargaria, fragments: fragmentsDe(item.content) });
    for (const paraula of freq.keys()) docsAmb.set(paraula, (docsAmb.get(paraula) || 0) + 1);
  }
  const mitjana = documents.length ? documents.reduce((suma, d) => suma + d.llargaria, 0) / documents.length : 0;
  return { documents, docsAmb, mitjana };
}

/** Les paraules d'una pregunta que busquen, sense repetir; buit si només saluda o nomena la IAIA. */
export function termesDeLaPregunta(pregunta) {
  return [...new Set(tokenitza(pregunta))].filter((terme) => !NOMS_DE_LA_IAIA.has(terme));
}

const arrelsDeLaPregunta = (pregunta) => [...new Set(termesDeLaPregunta(pregunta).map(arrel))];

/* Tots els documents amb alguna paraula de la pregunta, de més a menys
   puntuació BM25, amb el fragment i les arrels de la pregunta que s'hi veuen
   (el títol i la prosa del fragment). Els empats es desfan per l'id. */
function puntua(index, termes, exactes) {
  const documents = index?.documents || [];
  if (!termes.length || !documents.length) return [];
  const n = documents.length;
  const idf = new Map(termes.map((terme) => {
    const df = index.docsAmb.get(terme) || 0;
    return [terme, Math.log(1 + (n - df + 0.5) / (df + 0.5))];
  }));
  const resultats = [];
  for (const document of documents) {
    let puntuacio = 0;
    const norma = K1 * (1 - B + B * (document.llargaria / (index.mitjana || 1)));
    for (const terme of termes) {
      const tf = document.freq.get(terme);
      if (tf) puntuacio += idf.get(terme) * ((tf * (K1 + 1)) / (tf + norma));
    }
    if (puntuacio > 0) {
      const { text, vist } = fragmentRellevant(document.fragments, termes, exactes);
      const visibles = new Set([...document.arrelsDelTitol, ...vist]);
      resultats.push({ id: document.id, titol: document.titol, puntuacio, fragment: text,
        vistos: termes.filter((terme) => visibles.has(terme)).length,
        alTitol: termes.some((terme) => document.arrelsDelTitol.has(terme)) });
    }
  }
  return resultats.sort((a, b) => b.puntuacio - a.puntuacio || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

const sensePuntsInterns = ({ id, titol, puntuacio, fragment }) => ({ id, titol, puntuacio, fragment });

/**
 * Els `limit` documents més pròxims a la pregunta, de més a menys, amb la
 * seua puntuació BM25. Cap document sense cap paraula de la pregunta. Els
 * empats es desfan per l'identificador. Funció pura.
 * @returns {{ id: string, titol: string, puntuacio: number, fragment: string }[]}
 */
export function cerca(index, pregunta, limit = DOCUMENTS_PER_RESPOSTA) {
  return puntua(index, arrelsDeLaPregunta(pregunta), termesDeLaPregunta(pregunta))
    .slice(0, Math.max(0, limit)).map(sensePuntsInterns);
}

/* Gauntlet 261022_0225 (crítica Claude) · El llindar de rellevància. Una
   puntuació BM25 positiva no vol dir que el document responga: «Com esborre
   el meu compte?» trobava una ADR que «només esborre amb una confirmació del
   servidor», amb més punts que la font bona de «Què és Sollutia?». Per això
   el llindar no és cap puntuació: és el que en veu qui pregunta. El títol i
   la prosa del fragment mostrat han de portar totes les arrels de la
   pregunta quan en són una o dues, i dues com a mínim quan en són més. Una
   pregunta d'una sola paraula («Què és un node?», «Quant costa?») no en té
   cap altra que confirme el tema: el document l'ha de portar al títol. */
const vistosMinims = (termes) => Math.min(termes.length, 2);
const passaElLlindar = (resultat, termes) => resultat.vistos >= vistosMinims(termes) && (termes.length > 1 || resultat.alTitol);

/**
 * Com `cerca`, però només amb els documents que passen el llindar de
 * rellevància, triats d'entre tots: si cap no hi passa, cap. Funció pura.
 */
export function cercaRellevant(index, pregunta, limit = DOCUMENTS_PER_RESPOSTA) {
  const termes = arrelsDeLaPregunta(pregunta);
  return puntua(index, termes, termesDeLaPregunta(pregunta))
    .filter((resultat) => passaElLlindar(resultat, termes))
    .slice(0, Math.max(0, limit)).map(sensePuntsInterns);
}

/**
 * La resposta de la IAIA amb els documents trobats, o null si no n'hi ha cap.
 * Funció pura.
 */
export function componResposta(resultats) {
  if (!Array.isArray(resultats) || !resultats.length) return null;
  return [
    ENCAPCALAMENT_DE_LA_WIKI,
    ...resultats.map((resultat) => `${resultat.fragment ? `${resultat.fragment}\n` : ''}· ${resultat.titol} — ${rutaDeDocumentWiki(resultat.id)}`)
  ].join('\n');
}

/* La Wiki del paquet, a demanda. */
const carregaWikiDelPaquet = () => import('./wikiManifest.js').then((modul) => modul.wikiManifest);

/* L'índex es construïx una sola vegada per pestanya. Si la càrrega falla, es
   descarta i la pregunta següent ho torna a provar. */
let indexDelPaquet = null;

function indexDe(carrega) {
  if (carrega !== carregaWikiDelPaquet) return Promise.resolve().then(carrega).then((manifest) => construeixIndex(manifest?.items));
  if (!indexDelPaquet) {
    indexDelPaquet = Promise.resolve().then(carrega).then((manifest) => construeixIndex(manifest?.items));
    indexDelPaquet.catch(() => { indexDelPaquet = null; });
  }
  return indexDelPaquet;
}

/**
 * Gauntlet 261022_0225 (crítica Claude) · Comença a baixar la Wiki del
 * paquet abans de la primera pregunta (ConsultaIAIA ho fa en obrir-se): el
 * temps d'escriure-la cobrix la descàrrega. Només la baixa: l'índex es
 * construïx a la primera pregunta, mentre es veu «Consultant la Wiki…», i no
 * ocupa el fil principal mentre algú escriu. import() es queda el mòdul, i la
 * pregunta no el torna a demanar. Mai no rebutja; una fallada es descarta i
 * la pregunta la torna a provar.
 */
export function preparaWikiDeLaIAIA() {
  carregaWikiDelPaquet().catch(() => {});
}

/** Una promesa que es resol amb `reserva` si `promesa` no ha acabat en `ms`. */
function ambTempsMaxim(promesa, ms, reserva) {
  let rellotge = null;
  const temps = new Promise((resol) => { rellotge = setTimeout(() => resol(reserva), ms); });
  return Promise.race([promesa, temps]).finally(() => clearTimeout(rellotge));
}

/**
 * La resposta de la IAIA local a una pregunta: el text amb els (com a molt) 3
 * documents de la Wiki que passen el llindar de rellevància, o null si no
 * n'hi ha cap, si la Wiki no es pot carregar o si no arriba en `tempsMaxim`
 * ms. A un missatge sense cap paraula que busque (una salutació, un
 * «gràcies», un «ok», «Qui ets?»; Gauntlet 261022_0225, crítica Claude), la
 * salutació de la IAIA, la mateixa que la benvinguda: abans responia «Ara
 * estic en proves» just després de prometre preguntes tècniques. Mai no
 * rebutja. `carrega` (per a les proves) torna el manifest; per defecte, el
 * del paquet.
 * @returns {Promise<string|null>}
 */
export async function respostaDeLaIAIA(pregunta, { carrega = carregaWikiDelPaquet, tempsMaxim = TEMPS_MAXIM_DE_LA_WIKI } = {}) {
  if (typeof pregunta !== 'string' || pregunta.length > MAXIM_PREGUNTA_IAIA) return null;
  if (!termesDeLaPregunta(pregunta).length) return pregunta.trim() ? SALUTACIO_TECNICA_IAIA : null;
  try {
    const index = await ambTempsMaxim(indexDe(carrega), tempsMaxim, null);
    return index ? componResposta(cercaRellevant(index, pregunta)) : null;
  } catch {
    return null;
  }
}

/** Consulta documental privada de la interfície, també en mode remot.
 * No envia ni desa missatges, no impersona l'agent del servidor. La resposta
 * és extractiva: cada afirmació prové del document enllaçat, i només hi entra
 * el que passa el llindar de rellevància (si no, 'sense_resultats'). */
export async function consultaTecnicaIAIA(pregunta, {
  carrega = carregaWikiDelPaquet, tempsMaxim = TEMPS_MAXIM_DE_LA_CONSULTA, signal
} = {}) {
  if (signal?.aborted) return { estat: 'cancel·lada', fonts: [] };
  if (typeof pregunta !== 'string' || !pregunta.trim() || pregunta.length > MAXIM_PREGUNTA_IAIA) {
    return { estat: 'pregunta_invalida', fonts: [] };
  }
  if (!termesDeLaPregunta(pregunta).length) return { estat: 'salutacio', text: SALUTACIO_TECNICA_IAIA, fonts: [] };
  let atura;
  const cancel = new Promise((resol) => { atura = () => resol(null); });
  signal?.addEventListener('abort', atura, { once: true });
  try {
    const index = await ambTempsMaxim(Promise.race([indexDe(carrega), cancel]), tempsMaxim, null);
    if (signal?.aborted) return { estat: 'cancel·lada', fonts: [] };
    if (!index) return { estat: 'no_disponible', fonts: [] };
    const fonts = cercaRellevant(index, pregunta).map(({ id, titol, fragment }) => ({ id, titol, fragment, ruta: rutaDeDocumentWiki(id) }));
    return fonts.length ? { estat: 'resposta', fonts, text: componResposta(fonts) } : { estat: 'sense_resultats', fonts: [] };
  } catch {
    return { estat: 'no_disponible', fonts: [] };
  } finally {
    signal?.removeEventListener('abort', atura);
  }
}

/** Per a les proves: oblida l'índex de la Wiki del paquet. */
export function oblidaIndexDeLaWiki() {
  indexDelPaquet = null;
}
