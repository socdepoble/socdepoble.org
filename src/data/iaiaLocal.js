/**
 * iaiaLocal.js — el primer pas d'intel·ligència local de la IAIA MarIA.
 *
 * Gauntlet 261016_1530 (Bloc 3.6.6; relleu F25; MCR b36_xat.3) · Quan algú
 * escriu a la IAIA en llavor o en local, el magatzem que fa de servidor en
 * estos dos modes (localXat.js) li demana una resposta ací. En remot cap codi
 * del client respon per ella, i això no canvia.
 *
 * QUÈ FA
 *   Busca els 3 documents de la Wiki pública més pròxims a la pregunta i
 *   compon, en valencià, «Això és el que en sé per la Wiki de Poble:» amb una
 *   línia per document: el seu títol i l'enllaç /wikidepoble?item=<slug>. Si
 *   cap document no hi casa, o si la Wiki no es pot carregar a temps, torna
 *   null, i qui la crida respon amb RESPOSTA_IAIA, la frase de sempre.
 *
 * D'ON TRAU LA WIKI
 *   De src/data/wikiManifest.js, que ja és al paquet (és el que pinta
 *   /wikidepoble) i només porta el que deixa eixir la política de publicació
 *   del compilador (tooling/wiki/compile-wiki-to-app.mjs). Es carrega amb
 *   import() la primera vegada que algú escriu a la IAIA: cap byte més al tros
 *   d'entrada ni al nucli, i cap descàrrega de public/rag-index.json. No fa
 *   servir tooling/wiki/core/edge_rag.mjs, que indexa documents no públics.
 *
 * COM BUSCA
 *   JS pur, sense dependències ni models. Tokenització simple (minúscules,
 *   sense diacrítics, «l·l» com a «ll», paraules de 3 lletres o més, fora les
 *   paraules buides i les salutacions) i una puntuació BM25 sobre el títol, el
 *   subtítol, la descripció, les etiquetes i el cos de cada document, amb més
 *   pes per al títol. Una pregunta que només saluda o nomena la IAIA («Bon
 *   dia, IAIA») no busca res.
 */

export const ENCAPCALAMENT_DE_LA_WIKI = 'Això és el que en sé per la Wiki de Poble:';
/* La ruta de la Wiki de Poble (SECTIONS · 'wikidepoble'). Ací en literal: el
   registre de seccions porta icones de la interfície i este mòdul viu al tros
   del magatzem local. iaiaLocal.test.js vigila que coincidisquen. */
export const RUTA_DE_LA_WIKI = '/wikidepoble';
export const DOCUMENTS_PER_RESPOSTA = 3;
/* Si la Wiki no ha arribat en este temps, la IAIA contesta la frase de sempre
   i la càrrega continua: la pregunta següent ja la troba. */
export const TEMPS_MAXIM_DE_LA_WIKI = 4000;

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
   el soroll dels enllaços del Markdown. */
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
  busca cerca troba necessite necessito hola bon bona bons bones dia dies tarda tardes
  nit nits matinada adeu siau salut gracies merce ei ep vale item http https www html
`.trim().split(/\s+/));

/* El nom de qui escriu no diu de què es parla: una pregunta que només porta
   estes paraules (a més de les buides) no busca res. */
const NOMS_DE_LA_IAIA = new Set(['iaia', 'maria']);

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

/* El títol del Markdown com a text pla, amb les mateixes regles que la Wiki
   (wiki-de-poble/parseMarkdown.js · textPla, i editorial.js · llevaPuntFinal):
   la IAIA nomena el document com el nomena la seua pàgina. iaiaLocal.test.js
   ho compara amb extreuEditorial per a tota la Wiki. */
function textPla(md) {
  const net = md
    .replace(/[ \t]+#+[ \t]*$/, '')
    .replace(/<[^>]*>/g, '')
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__)(\S(?:[^\n]*?\S)?)\1/g, '$2')
    .replace(/\*(\S(?:[^*\n]*?\S)?)\*/g, '$1')
    .replace(/(^|[\s(])_(\S(?:[^_\n]*?\S)?)_(?=$|[\s).,;:!?])/g, '$1$2')
    .trim();
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
  const primera = text.split('\n').find((linia) => linia.trim() !== '');
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

/**
 * L'índex de cerca d'una llista de documents del manifest ({ id, title,
 * subtitle, tags, attributes, content }). Funció pura.
 */
export function construeixIndex(items = []) {
  const documents = [];
  const docsAmb = new Map();
  for (const item of Array.isArray(items) ? items : []) {
    if (!item || !item.id) continue;
    const titol = titolDeDocument(item);
    const freq = new Map();
    const etiquetes = [...(Array.isArray(item.tags) ? item.tags : []), ...(Array.isArray(item.attributes?.tags) ? item.attributes.tags : [])];
    let llargaria = acumula(freq, tokenitza(`${titol} ${item.title || ''}`), PES_TITOL);
    llargaria += acumula(freq, tokenitza(`${item.subtitle || ''} ${item.attributes?.description || ''} ${etiquetes.join(' ')}`), PES_FITXA);
    llargaria += acumula(freq, tokenitza(item.content), PES_COS);
    if (!freq.size) continue;
    documents.push({ id: String(item.id), titol, freq, llargaria });
    for (const paraula of freq.keys()) docsAmb.set(paraula, (docsAmb.get(paraula) || 0) + 1);
  }
  const mitjana = documents.length ? documents.reduce((suma, d) => suma + d.llargaria, 0) / documents.length : 0;
  return { documents, docsAmb, mitjana };
}

/** Les paraules d'una pregunta que busquen, sense repetir; buit si només saluda o nomena la IAIA. */
export function termesDeLaPregunta(pregunta) {
  const termes = [...new Set(tokenitza(pregunta))];
  return termes.some((terme) => !NOMS_DE_LA_IAIA.has(terme)) ? termes : [];
}

/**
 * Els `limit` documents més pròxims a la pregunta, de més a menys, amb la
 * seua puntuació BM25. Cap document sense cap paraula de la pregunta. Els
 * empats es desfan per l'identificador. Funció pura.
 * @returns {{ id: string, titol: string, puntuacio: number }[]}
 */
export function cerca(index, pregunta, limit = DOCUMENTS_PER_RESPOSTA) {
  const termes = termesDeLaPregunta(pregunta);
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
    if (puntuacio > 0) resultats.push({ id: document.id, titol: document.titol, puntuacio });
  }
  resultats.sort((a, b) => b.puntuacio - a.puntuacio || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return resultats.slice(0, Math.max(0, limit));
}

/**
 * La resposta de la IAIA amb els documents trobats, o null si no n'hi ha cap.
 * Funció pura.
 */
export function componResposta(resultats) {
  if (!Array.isArray(resultats) || !resultats.length) return null;
  return [
    ENCAPCALAMENT_DE_LA_WIKI,
    ...resultats.map((resultat) => `· ${resultat.titol} — ${rutaDeDocumentWiki(resultat.id)}`)
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

/** Una promesa que es resol amb `reserva` si `promesa` no ha acabat en `ms`. */
function ambTempsMaxim(promesa, ms, reserva) {
  let rellotge = null;
  const temps = new Promise((resol) => { rellotge = setTimeout(() => resol(reserva), ms); });
  return Promise.race([promesa, temps]).finally(() => clearTimeout(rellotge));
}

/**
 * La resposta de la IAIA local a una pregunta: el text amb els 3 documents
 * més pròxims de la Wiki, o null si no n'hi ha cap, si la Wiki no es pot
 * carregar o si no arriba en `tempsMaxim` ms. Mai no rebutja.
 * `carrega` (per a les proves) torna el manifest; per defecte, el del paquet.
 * @returns {Promise<string|null>}
 */
export async function respostaDeLaIAIA(pregunta, { carrega = carregaWikiDelPaquet, tempsMaxim = TEMPS_MAXIM_DE_LA_WIKI } = {}) {
  if (!termesDeLaPregunta(pregunta).length) return null;
  try {
    const index = await ambTempsMaxim(indexDe(carrega), tempsMaxim, null);
    return index ? componResposta(cerca(index, pregunta)) : null;
  } catch {
    return null;
  }
}

/** Per a les proves: oblida l'índex de la Wiki del paquet. */
export function oblidaIndexDeLaWiki() {
  indexDelPaquet = null;
}
