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
 *
 * IDEA-56 (pla 261029_1605, Bloc F.2) · El cervell local zero-tokens: DUES
 * CAPES, cap byte cap a cap servei extern.
 *   1. La capa local, síncrona i sense xarxa: l'Atles Operatiu del Sistema
 *      (ATLES_OPERATIU, ací mateix) i les fitxes dels pobles de la llavor
 *      (MOCK_TOWNS, que ja és al tros d'entrada). Respon «Què és el Mercat?»,
 *      «Qui és Javi?»… en microtasques, sense baixar res. Índex curat: un
 *      document només hi entra si porta la paraula al títol o a les claus.
 *   2. Si l'Atles no ho sap, la Wiki pública i les pàgines de PAGE_COPY
 *      triades (PAGINES_PER_A_LA_IAIA: ni la legal, que porta el NIF i el
 *      domicili del titular, ni la maquinària de l'equip), amb import() les
 *      dues. Només la Wiki estalvia bytes (wikiManifest, uns 187 KB gzip):
 *      PAGE_COPY ja ha arribat en arrencar amb l'adaptador i el contingut
 *      core, i el seu import() la troba feta (Gauntlet Loop 261029, cicle 1;
 *      XatSection.pes.test.js en mesura el graf real).
 *   La tokenització entén el castellà (EQUIVALENCIES i paraules buides) i
 *   «Sóc de Poble» com un sol terme, però la IAIA respon en valencià. Una
 *   resposta de l'Atles o d'una pàgina porta la capçalera
 *   ENCAPCALAMENT_DE_SOC_DE_POBLE i la ruta interna de la secció (RUTA_INTERNA,
 *   la mateixa llista tancada que la bombolla converteix en enllaç,
 *   sections/xat/enllacos.js). La consulta del diàleg (consultaTecnicaIAIA)
 *   continua sent la Wiki sola.
 *
 * P1-24 (Onada 2, 261101) · Entre les dues capes, el rebost rural
 * (iaiaRebostRural.js): càpsules curades de cultura i d'ús quotidià, també
 * sense xarxa, en un índex curat a part (cercaAlRebostRural). Només hi entra
 * la pregunta que l'Atles no sap, i el rànquing de l'Atles no canvia.
 */

import { iniciDelContingut } from '../utils/iniciEditorial.js';
import { CAPSULES_RURALS } from './iaiaRebostRural.js';
import { ajudaDePublicacioIAIA } from './iaiaPublicacions.js';
import { MOCK_TOWNS } from '../sections/pobles/townsSeed.js';
import { SALUTACIO_TECNICA_IAIA } from './iaiaTextos.js';
export { SALUTACIO_TECNICA_IAIA } from './iaiaTextos.js';
export const ENCAPCALAMENT_DE_LA_WIKI = 'Això és el que en sé per la Wiki de Poble:';
/* IDEA-56 (Bloc F.2) · La capçalera quan algun document de la resposta és de
   l'Atles, d'un poble o d'una pàgina de Sóc de Poble, no de la Wiki. */
export const ENCAPCALAMENT_DE_SOC_DE_POBLE = 'Això és el que en sé de Sóc de Poble:';
/* La ruta de la Wiki de Poble (SECTIONS · 'wikidepoble'). Ací en literal: el
   registre de seccions porta icones de la interfície i este mòdul viu al tros
   del magatzem local. iaiaLocal.test.js vigila que coincidisquen. */
export const RUTA_DE_LA_WIKI = '/wikidepoble';
export const DOCUMENTS_PER_RESPOSTA = 3;
export const MAXIM_PREGUNTA_IAIA = 2000;
const MAXIM_FRAGMENT = 360;
/* IDEA-56 (Bloc F.2) · Una entrada de l'Atles es diu sencera: cap passa
   d'este màxim (iaiaLocal.atles.test.js ho vigila). */
export const MAXIM_FRAGMENT_DE_L_ATLES = 600;
/* IDEA-56 (Bloc F.2) · Una pregunta d'una paraula que només és al cos d'una
   pàgina de Sóc de Poble la troba si és específica: com a molt en tants
   documents de la segona capa. */
export const DF_MAXIM_DEL_COS = 3;
/* Si la Wiki no ha arribat en este temps, la IAIA contesta la frase de sempre
   i la càrrega continua: la pregunta següent ja la troba. */
export const TEMPS_MAXIM_DE_LA_WIKI = 4000;
/* Gauntlet 261022_0225 (crítica Claude) · La consulta l'espera qui pregunta,
   amb «Consultant la Wiki…» a la vista i el diàleg per a tancar-la: la
   primera càrrega (187 KB gzip) té més marge en una connexió lenta del poble.
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
   «portes» en faria «port», el del backend. Gauntlet f4a (corrector
   iaia-consulta) · «salut» ja no hi és: també és el nom d'una app
   (SALUTACIO_QUE_ES_NOM). */
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
  nit nits matinada adeu siau gracies merce ei ep vale item http https www html
  las quien quienes cual cuales como donde cuando cuanto cuanta cuantos cuantas porque para por
  uno unos unas ese esa esos esas eso esto estos aquel aquellos aquellas hay hace hacen hacer
  puedo puede pueden puedes quiero quieres sabes dime dinos hablame hablar habla cuentame
  explicame ayudame ayuda funcionan utilizar muy mucho mucha muchos muchas nada todo toda todos
  todas algo desde hasta sin con tambien ahora alli gracias buenos buenas dias noches adios eres
  soy somos estoy tengo tiene tienen mis tus sus nuestro nuestra vuestro vuestra ellos ellas
  nosotros vosotros usted ustedes
`.trim().split(/\s+/));
/* IDEA-56 (Bloc F.2) · Les paraules buides del castellà de les dues últimes
   línies: la IAIA entén «¿Qué es el mercado?» i respon en valencià. Mai
   «mas»: el castellà «más» plega a «mas», que és el Mas, la plataforma. */

/* IDEA-56 (Bloc F.2) · El castellà més habitual de les preguntes sobre Sóc
   de Poble, plegat, cap a la paraula valenciana del corpus (també plegada). */
export const EQUIVALENCIES = Object.freeze({
  mercado: 'mercat', mercadillo: 'mercat', muro: 'mur', pueblo: 'poble', pueblos: 'pobles', chat: 'xat', chats: 'xats',
  mensaje: 'missatge', mensajes: 'missatges', notas: 'notes', cuaderno: 'notes', libreta: 'notes', archivo: 'arxiu',
  archivos: 'arxius', carpetas: 'carpetes', fotografias: 'fotografies', imagenes: 'imatges', javier: 'javi', tecnico: 'tecnic',
  servicio: 'servei', soporte: 'suport', tiempo: 'temps', calendario: 'calendari', proyecto: 'projecte', descargas: 'descarregues',
  descargar: 'descarregar', instalar: 'installar', aplicacion: 'aplicacio', privacidad: 'privacitat', datos: 'dades',
  cuenta: 'compte', borrar: 'esborrar', registrarse: 'registrar', registro: 'registre', asociacion: 'associacio',
  tarjeta: 'targeta', propon: 'proposa', proponer: 'proposa', vender: 'vendre', anuncio: 'anunci', anuncios: 'anuncis',
  ordenador: 'ordinador', movil: 'mobil', version: 'versio', versiones: 'versions',
  /* Gauntlet 261029 (cicle 1, atles-xat-sense-negreta) · «¿Cómo pongo negrita?». */
  negrita: 'negreta', poner: 'posar', pongo: 'poso',
  /* Ordre del Mestre (30-10-2026; candidatura NLnet NGI Fediversity) · «¿Qué es la subvención de NLnet?». */
  subvencion: 'subvencio', subvenciones: 'subvencio',
  /* Ordre del Mestre (30-10-2026, ~00:50) · «¿Qué nodos hay?», «¿Puedo abrir el nodo de mi pueblo?». */
  nodo: 'node', nodos: 'nodes', abrir: 'obrir',
  /* P1-24 / IDEA-31 (Part 3) · Cultura rural, camp i ús pràctic en castellà i col·loquial. */
  aceite: 'oli', aceituna: 'oliva', aceitunas: 'olives', almazara: 'almassera', cosecha: 'collita',
  huerta: 'horta', huerto: 'hort', tomate: 'tomaca', tomates: 'tomaques', sembrar: 'sembrar', regar: 'reg',
  fiesta: 'festa', fiestas: 'festes', evento: 'acte', eventos: 'actes',
  fuente: 'font', fuentes: 'fonts', sendero: 'senda', senderos: 'sendes', ruta: 'ruta', rutas: 'rutes',
  comercio: 'comerc', tienda: 'botiga', empresa: 'empresa', cooperativa: 'cooperativa',
  exportar: 'exportar', idioma: 'llengua', idiomas: 'llengues', traducir: 'traduir',
  buscador: 'cercador', filtrar: 'filtrar', filtro: 'filtre', encontrar: 'localitzar',
  /* P1-24 (Onada 2) · El rebost rural (iaiaRebostRural.js) en castellà. */
  piedra: 'pedra', receta: 'recepta', recetas: 'receptes', recetario: 'receptari', refran: 'refrany', refranes: 'refranys',
  oficio: 'ofici', oficios: 'oficis', herramientas: 'eines', lavadero: 'llavador', lavaderos: 'llavadors', cancion: 'canco',
  canciones: 'cancons', cancionero: 'canconer', cartel: 'cartell', carteles: 'cartells', reunion: 'reunio', reuniones: 'reunions',
  objeto: 'objecte', perdido: 'perdut', quedada: 'trobada', toponimos: 'toponims',
  coche: 'cotxe', coches: 'cotxes', viaje: 'viatge', viajes: 'viatges', bando: 'bandol', bandos: 'bandols'
});

/* IDEA-56 (Bloc F.2) · «Sóc de Poble» (o «soy de pueblo») és un sol terme:
   si no, «sóc» és paraula buida i «poble» casa amb Pobles i amb cada fitxa. */
const FRASE_SOC_DE_POBLE = /\b(?:soc|soy) de (?:poble|pueblo)\b|\bsocdepoble\b/g;

/* El nom de qui escriu no diu de què es parla: una pregunta que només porta
   estes paraules (a més de les buides) no busca res. */
const NOMS_DE_LA_IAIA = new Set(['iaia', 'maria']);

/* Gauntlet f4a (corrector iaia-consulta) · «Salut» saluda i és el nom d'una
   app (src/apps/salut; ADR-2026-10: «el Bar, Salut, la Nevera…»). És el nom
   de l'app en una frase que pregunta (acaba en «?» o comença per un
   interrogatiu) quan alguna paraula d'abans no és una salutació ni el nom de
   la IAIA: «Què és Salut?», «Com funciona Salut». Si no, saluda: «Salut!»,
   «IAIA, salut! Com va?», «Salut, què és el Mercat?», «Gràcies i salut». */
const SALUTACIO_QUE_ES_NOM = 'salut';
const SALUTACIONS = new Set(['hola', 'bon', 'bona', 'bons', 'bones', 'dia', 'dies', 'tarda', 'tardes', 'nit', 'nits', 'ei', 'ep',
  'buenos', 'buenas', 'dias', 'noches', ...NOMS_DE_LA_IAIA]);
const INTERROGATIUS = new Set(['que', 'qui', 'com', 'quin', 'quina', 'quins', 'quines', 'quan', 'quant', 'on', 'explica', 'explicam',
  'parla', 'parlam', 'conta', 'contam', 'ensenya', 'ensenyam', 'mostra', 'mostram', 'digues', 'busca', 'cerca', 'troba', 'quien', 'como',
  'cual', 'donde', 'cuando', 'dime', 'hablame', 'cuentame', 'explicame']);

/** Si el missatge nomena l'app Salut, i no saluda. Funció pura. */
function salutEsNom(pregunta) {
  for (const frase of String(pregunta ?? '').match(/[^.!?…]+[.!?…]*/gu) || []) {
    const paraules = plega(frase).match(/[\p{L}\p{N}]+/gu) || [];
    if ((/[?¿]/u.test(frase) || INTERROGATIUS.has(paraules[0])) && paraules.some((paraula, i) => paraula === SALUTACIO_QUE_ES_NOM
      && paraules.slice(0, i).some((abans) => !SALUTACIONS.has(abans)))) return true;
  }
  return false;
}

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
    .replace(FRASE_SOC_DE_POBLE, ' socdepoble ')
    .split(/[^\p{L}\p{N}]+/u)
    /* Object.hasOwn: «constructor» o «toString» són paraules, no claus heretades. */
    .map((paraula) => (Object.hasOwn(EQUIVALENCIES, paraula) ? EQUIVALENCIES[paraula] : paraula))
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

/* Ordre del Mestre (30-10-2026; f4 D.2, P1-49 «cercador guiat de la Wiki») ·
   El nom d'una eina tal com l'escriu la Wiki: amb majúscula a mitja frase
   («al Mur i al Mercat», «la Consola Termodinàmica», «l'App»), o la primera
   paraula de l'etiqueta en negreta que obri un bloc («**Xat E2EE del
   poble…**»). La majúscula de l'inici d'una frase, d'un parèntesi o d'unes
   cometes no diu res («(Nota: …)»), ni la de «Poble» dins de «Sóc de Poble»,
   que és la plataforma. Es compara la paraula sencera (plegada i amb les
   EQUIVALENCIES), no l'arrel: «Com faig una nota?» no pregunta per «Notes».
   Gauntlet f4a (corrector iaia-consulta) · Tampoc no diuen res: la majúscula
   darrere d'un «·», d'una barra o d'un nom de codi que tanca la frase
   («Data: … · Hora: …», «…doctrina A10/offline. Mostrar…»); la d'una
   paraula cridada («L'ESTAT», «ESTRICTAMENT PROHIBIT»; una sigla com «TPV» o
   «E2EE» continua sent un nom); ni la del títol que obri una frase amb una
   paraula que compta («Plantilla Prompt Consell», «Plantilla de Bundle de
   Codi», «Concepte Foto»). L'etiqueta compta si la seua primera paraula, tal
   com s'escriu, és un nom amb majúscula: «**El que demana el Mestre**» o
   «**La regla:**» no en fan cap. */
const OBRIN_FRASE = new Set(['.', '!', '?', '…', ':', ';', '(', '[', '«', '“', '"', '—', '–', '·', '•', '|', '/']);
const SOC_DE_POBLE_ESCRIT = /(?:s[oó]c|soy) de (?:poble|pueblo)/giu;
const ETIQUETA_DEL_BLOC = /^\s*(?:[-*+>]\s+|\d+[.)]\s+)?(?:\*\*|__)([^*_\n]+?)(?:\*\*|__)/u;
/* Una paraula, amb el punt volat només entre lletres («col·lecció»): un «·» solt separa. */
const PARAULA = /[\p{L}\p{N}\p{M}]+(?:·[\p{L}\p{N}\p{M}]+)*/gu;
/* Les paraules que lliguen un títol: «Plantilla d'Acta de Sessió», «Branding i Identitat Visual». */
const LLIGAMS_DEL_TITOL = new Set(['de', 'd', 'del', 'dels', 'i']);
const ambMajuscula = (paraula) => /^\p{Lu}/u.test(paraula);
const esCridada = (paraula) => !/\p{Ll}/u.test(paraula) && (paraula.match(/\p{Lu}/gu) || []).length >= 5;
/* Com prosa(), però el nom de codi deixa el punt que el tancava, i una barra solta, la barra. */
const senseCodi = (text) => String(text ?? '')
  .replace(NOMS_DE_CODI, (codi) => (codi === '/' ? ' / ' : ` ${/[.!?…:;]+$/u.exec(codi)?.[0] ?? ''} `));

/** Les paraules (plegades) que un text escriu com a nom, a mitja frase, tantes vegades com hi són. Funció pura. */
function nomsEscritsA(text) {
  const net = senseCodi(String(text ?? '').normalize('NFC').replace(SOC_DE_POBLE_ESCRIT, ' socdepoble '));
  const noms = [];
  let fi = 0;
  let titol = false;
  for (const { 0: paraula, index } of net.matchAll(PARAULA)) {
    const iniciDeFrase = fi === 0 || OBRIN_FRASE.has(net.slice(fi, index).replace(/\s+/g, '').slice(-1));
    fi = index + paraula.length;
    if (iniciDeFrase) titol = ambMajuscula(paraula) && tokenitza(paraula).length > 0;
    else if (!ambMajuscula(paraula)) titol = titol && LLIGAMS_DEL_TITOL.has(plega(paraula));
    else if (!titol && !esCridada(paraula)) noms.push(...tokenitza(paraula));
  }
  return noms;
}

/** Les paraules (plegades) que un text escriu com a nom, a mitja frase. Funció pura. */
const nomsDe = (text) => new Set(nomsEscritsA(text));

/** La primera paraula de l'etiqueta en negreta que obri un bloc del Markdown, si s'hi escriu com a nom. */
function etiquetaDe(bloc) {
  const etiqueta = ETIQUETA_DEL_BLOC.exec(bloc);
  const [primera] = etiqueta ? senseCodi(textPla(etiqueta[1].replace(CODI_EN_LINIA, ' '), false)).match(PARAULA) || [] : [];
  return new Set(primera && ambMajuscula(primera) && !esCridada(primera) ? tokenitza(primera).slice(0, 1) : []);
}

/* Els blocs citables del Markdown, amb el seu text pla, i la seua prosa: sense
   el codi en línia ni els noms de codi. */
function blocsDe(content) {
  return String(content ?? '')
    .replace(/^---\s*\n[\s\S]*?\n---\s*(?:\n|$)/, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/```[^\n]*\n[\s\S]*?```/g, '')
    .replace(/~~~[^\n]*\n[\s\S]*?~~~/g, '')
    .split(/\n\s*\n|\n(?=\s*[-*]\s)/)
    .map((bloc) => bloc.split('\n').filter((linia) => !/^\s*(?:#{1,6}\s|\||[-*_]{3,}\s*$)/.test(linia)).join(' '))
    .map((bloc) => ({ bloc, text: textPla(bloc, false).replace(/^\s*[-*>]\s*/, '').replace(/\s+/g, ' ').trim() }))
    .filter(({ text }) => text.length >= 24);
}
const prosaDelBloc = (bloc) => prosa(textPla(bloc.replace(CODI_EN_LINIA, ' '), false));

/* Fragments citables, mai instruccions executables. El corpus continua sent
   exclusivament el manifest públic; ni el RAG intern ni l'Escriptori.
   `termes` són les arrels de la prosa del bloc, sense el codi, i `etiqueta`,
   la primera paraula de la seua etiqueta en negreta (nomsDe). */
function fragmentsDe(content) {
  return blocsDe(content).map(({ bloc, text }) => ({ text, termes: new Set(arrels(prosaDelBloc(bloc))), etiqueta: etiquetaDe(bloc) }));
}

/* Gauntlet f4a (corrector iaia-consulta) · Una paraula comuna de la Wiki: la
   prosa de més de DOCUMENTS_EN_MINUSCULA documents l'escriu en minúscula, i
   l'escriu més vegades en minúscula que com a nom («data», «temps», «estat»,
   «regla», «sessió», «memòria»). La cerca guiada no la pren per nom d'eina,
   encara que un fragment li pose majúscula («**Memòria per defecte.**», «la
   Regla 7 del BIOS»). «Salut» o «Gestoria», que la Wiki escriu sobretot com
   a nom, i «Xat», en minúscula només en dos documents, en continuen sent. Es
   compta una sola vegada per índex i paraula, quan la cerca guiada ho
   necessita (el fil de la IAIA no ho paga mai), i només als blocs que porten
   la seua arrel (els fragments i els blocs van en el mateix ordre). */
const DOCUMENTS_EN_MINUSCULA = 3;
const EN_MAJUSCULA = /(?<![\p{L}\p{N}\p{M}·])\p{Lu}[\p{L}\p{N}\p{M}·]*/gu;
function comptaParaulaComuna(index, forma) {
  const terme = arrel(forma);
  let documents = 0;
  let minuscula = 0;
  let nom = 0;
  for (const document of index.documents) {
    if (!document.freq.has(terme)) continue;
    const abans = minuscula;
    for (const [i, { bloc, text }] of blocsDe(document.contingut).entries()) {
      if (!document.fragments[i]?.termes.has(terme)) continue;
      minuscula += tokenitza(prosaDelBloc(bloc).replace(EN_MAJUSCULA, ' ')).filter((paraula) => paraula === forma).length;
      nom += nomsEscritsA(text).filter((paraula) => paraula === forma).length;
    }
    if (minuscula > abans) documents += 1;
  }
  return documents > DOCUMENTS_EN_MINUSCULA && minuscula > nom;
}
const comunesDelsIndexos = new WeakMap();
function esParaulaComuna(index, forma) {
  if (!comunesDelsIndexos.has(index)) comunesDelsIndexos.set(index, new Map());
  const comunes = comunesDelsIndexos.get(index);
  if (!comunes.has(forma)) comunes.set(forma, comptaParaulaComuna(index, forma));
  return comunes.get(forma);
}

/* El fragment que es mostra i les arrels de prosa que hi queden visibles.
   `termes` són les arrels de la pregunta i `exactes`, les seues paraules.
   `limit` és el màxim del document (MAXIM_FRAGMENT_DE_L_ATLES a l'Atles).
   Gauntlet 261029 (cicle 1, iaia-resposta-buida-per-etiqueta) · `curat`
   (l'Atles i els pobles): si cap bloc no porta cap paraula de la pregunta
   (la paraula és només al títol o a les claus: «Què és el Mas?»), el primer
   bloc, que és l'entrada sencera. Abans, la resposta era només l'enllaç. El
   llindar no canvia: `vist` no hi suma cap paraula de la pregunta.
   Ordre del Mestre (30-10-2026; f4 D.2) · `noms`: les paraules que el
   fragment mostrat escriu com a nom (nomsDe), i la de l'etiqueta del bloc:
   quan és la de la pregunta, és la primera aparició, i retallaFragment no la
   talla mai. */
function fragmentRellevant(fragments, termes, exactes, limit = MAXIM_FRAGMENT, curat = false) {
  let millor = null;
  let puntuacio = 0;
  for (const fragment of fragments || []) {
    const coincidencies = termes.filter((terme) => fragment.termes.has(terme)).length;
    if (coincidencies > puntuacio) { millor = fragment; puntuacio = coincidencies; }
  }
  if (!millor && curat) millor = fragments?.[0] ?? null;
  if (!millor) return { text: '', vist: [], noms: new Set() };
  const text = retallaFragment(millor.text, termes, exactes, limit);
  const noms = nomsDe(text);
  for (const forma of millor.etiqueta || []) noms.add(forma);
  return { text, vist: arrels(prosa(text)).filter((terme) => millor.termes.has(terme)), noms };
}

function retallaFragment(millor, termes, exactes, limit = MAXIM_FRAGMENT) {
  if (millor.length <= limit) return millor;
  /* La paraula que justifica la resposta ha de quedar visible, encara que
     aparega al final d'un paràgraf llarg. Preferix un límit de frase, i la
     paraula tal com s'ha escrit a una que només en comparteix l'arrel. */
  const paraules = [...millor.matchAll(/[\p{L}\p{N}\p{M}·]+/gu)].map((paraula) => ({ index: paraula.index, plegada: plega(paraula[0]) }));
  const exacta = paraules.find((paraula) => exactes.includes(paraula.plegada));
  const perArrel = paraules.find((paraula) => termes.includes(arrel(paraula.plegada)));
  const primera = (exacta || perArrel)?.index ?? 0;
  let inici = primera < limit / 2 ? 0 : Math.max(0, primera - 100);
  if (inici > 0) {
    const frase = millor.lastIndexOf('. ', primera);
    inici = frase >= inici ? frase + 2 : millor.indexOf(' ', inici) + 1;
  }
  const maxim = inici + limit;
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

/* IDEA-56 (Bloc F.2) · Les rutes internes que la IAIA cita fora de la Wiki:
   la mateixa llista tancada que la bombolla converteix en enllaç
   (sections/xat/enllacos.js · PATRO_RUTA_WIKI; enllacos.test.js les compara
   ruta a ruta). Duplicada a posta: si enllacos.js importara este mòdul,
   l'Atles aniria a cada tros que pinta una bombolla. */
export const RUTA_INTERNA = /^\/(?:pobles\/[a-z0-9-]+|page\/[a-z0-9_-]+|projecte|constitucio|anima|roadmap|versions|fedivers|xat|mur|mercat|vehicle|treball|habitatge|pobles|notes|multimedia|calendari|traduccions|el-meu-perfil|cerca|javillinares|rentonar)$/;

/* IDEA-56 (Bloc F.2) · El sanejament d'un ítem: un carregador injectat (un
   pont, una prova) no pot colar cap ruta externa ni «javascript:». Una font
   desconeguda és la Wiki; una ruta fora de la llista, cap (la línia porta la
   de la Wiki); el màxim del fragment, només entre 1 i el de l'Atles. */
const FONTS_DE_SOC_DE_POBLE = new Set(['atles', 'poble', 'pagina']);
/* Les fonts curades: el fragment buit hi és el primer bloc (fragmentRellevant). */
const FONTS_CURADES = new Set(['atles', 'poble']);
const fontDe = (font) => (FONTS_DE_SOC_DE_POBLE.has(font) ? font : 'wiki');
const rutaDe = (ruta) => (typeof ruta === 'string' && RUTA_INTERNA.test(ruta) ? ruta : null);
const maximDe = (maxim) => (Number.isInteger(maxim) && maxim >= 1 && maxim <= MAXIM_FRAGMENT_DE_L_ATLES ? maxim : MAXIM_FRAGMENT);

/**
 * L'índex de cerca d'una llista de documents del manifest ({ id, title,
 * subtitle, tags, attributes, content }). Funció pura.
 * IDEA-56 (Bloc F.2) · Cada ítem pot portar `font` ('atles', 'poble' o
 * 'pagina'; per defecte, la Wiki), `ruta` (interna) i `maximFragment`.
 * `curat` marca la capa local: cap document hi entra sense ancoratge.
 */
export function construeixIndex(items = [], { curat = false } = {}) {
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
    const font = fontDe(item.font);
    documents.push({
      id: String(item.id), titol, ruta: font === 'wiki' ? null : rutaDe(item.ruta), font, maximFragment: maximDe(item.maximFragment),
      arrelsDelTitol: new Set(arrels(titol)), arrelsDeLesEtiquetes: new Set(arrels(etiquetes.join(' '))), freq, llargaria,
      /* El text del document (el mateix del manifest, sense copiar-lo): comptaParaulaComuna hi compta les paraules comunes. */
      fragments: fragmentsDe(item.content), contingut: item.content
    });
    for (const paraula of freq.keys()) docsAmb.set(paraula, (docsAmb.get(paraula) || 0) + 1);
  }
  const mitjana = documents.length ? documents.reduce((suma, d) => suma + d.llargaria, 0) / documents.length : 0;
  /* Les arrels que algun document porta al títol o a les etiquetes. */
  const ambTitolOEtiqueta = new Set();
  for (const document of documents) {
    for (const terme of document.arrelsDelTitol) ambTitolOEtiqueta.add(terme);
    for (const terme of document.arrelsDeLesEtiquetes) ambTitolOEtiqueta.add(terme);
  }
  return { documents, docsAmb, mitjana, ambTitolOEtiqueta, curat: curat === true };
}

/** Les paraules d'una pregunta que busquen, sense repetir; buit si només saluda o nomena la IAIA. */
export function termesDeLaPregunta(pregunta) {
  const nomenaSalut = salutEsNom(pregunta);
  return [...new Set(tokenitza(pregunta))].filter((terme) => !NOMS_DE_LA_IAIA.has(terme) && (terme !== SALUTACIO_QUE_ES_NOM || nomenaSalut));
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
      const { text, vist, noms } = fragmentRellevant(document.fragments, termes, exactes, document.maximFragment, FONTS_CURADES.has(document.font));
      const visibles = new Set([...document.arrelsDelTitol, ...vist]);
      resultats.push({ id: document.id, titol: document.titol, ruta: document.ruta ?? null, font: document.font || 'wiki', puntuacio, fragment: text,
        vistos: termes.filter((terme) => visibles.has(terme)).length,
        comANom: exactes.filter((forma) => noms.has(forma)),
        alTitol: termes.some((terme) => document.arrelsDelTitol.has(terme)),
        alsTags: termes.some((terme) => document.arrelsDeLesEtiquetes?.has(terme)) });
    }
  }
  return resultats.sort((a, b) => b.puntuacio - a.puntuacio || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/* Un resultat de la Wiki porta exactament les claus de sempre; un de l'Atles,
   d'un poble o d'una pàgina hi afig la seua ruta i la seua font. */
const sensePuntsInterns = ({ id, titol, ruta, font, puntuacio, fragment }) => (font === 'wiki'
  ? { id, titol, puntuacio, fragment }
  : { id, titol, puntuacio, fragment, ruta, font });

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
   cap altra que confirme el tema: el document l'ha de portar al títol.
   IDEA-56 (Bloc F.2) · El llindar suavitzat:
     · capa curada (l'Atles i els pobles): cal la paraula al títol o a les
       claus, també amb dues paraules visibles (el cos de l'Atles robava
       preguntes que la Wiki sap pel títol: «Què és el Trellat?»);
     · una paraula a les etiquetes compta com al títol;
     · una paraula que només és al cos, només d'una pàgina de Sóc de Poble
       (prosa per a persones, mai el cos d'un document tècnic de la Wiki), si
       cap títol ni etiqueta no la porta i si és específica (DF_MAXIM_DEL_COS):
       «Què és un node?» troba Nodes i Fedivers.
   Ordre del Mestre (30-10-2026; f4 D.2, P1-49) · La cerca guiada del diàleg
   «Pregunta a la IAIA» (consultaTecnicaIAIA, només la Wiki) és un cercador:
   el nom d'una eina que cap títol ni etiqueta no porta troba el document de
   la Wiki que el diu al fragment mostrat com a nom (comANom: «al Mercat»,
   «la Consola», «**Xat E2EE…**»). Una paraula comuna («Quant costa?», «Com
   faig una nota?») continua demanant el títol. El fil de la IAIA no canvia.
   Gauntlet f4a (corrector iaia-consulta) · Ni una paraula que la Wiki escriu
   sobretot en minúscula (esParaulaComuna): «Data», «Temps» o «Regla» no són
   noms d'eina encara que un fragment els pose majúscula. */
const vistosMinims = (termes) => Math.min(termes.length, 2);
function passaElLlindar(resultat, termes, index, cercaGuiada = false) {
  const ancorat = resultat.alTitol || resultat.alsTags;
  if (index?.curat) return ancorat && (termes.length === 1 || resultat.vistos >= vistosMinims(termes));
  if (termes.length > 1) return resultat.vistos >= vistosMinims(termes);
  if (ancorat) return true;
  const [terme] = termes;
  if (index?.ambTitolOEtiqueta?.has(terme)) return false;
  if (cercaGuiada && resultat.font === 'wiki') return resultat.comANom.some((forma) => !esParaulaComuna(index, forma));
  return resultat.font === 'pagina' && resultat.vistos >= 1 && (index?.docsAmb?.get(terme) || 0) <= DF_MAXIM_DEL_COS;
}

/**
 * Com `cerca`, però només amb els documents que passen el llindar de
 * rellevància, triats d'entre tots: si cap no hi passa, cap. Funció pura.
 * `cercaGuiada` (la consulta del diàleg): el nom d'una eina al cos d'un
 * document de la Wiki també hi passa (passaElLlindar).
 */
export function cercaRellevant(index, pregunta, limit = DOCUMENTS_PER_RESPOSTA, { cercaGuiada = false } = {}) {
  const termes = arrelsDeLaPregunta(pregunta);
  return puntua(index, termes, termesDeLaPregunta(pregunta))
    .filter((resultat) => passaElLlindar(resultat, termes, index, cercaGuiada === true))
    .slice(0, Math.max(0, limit)).map(sensePuntsInterns);
}

/**
 * La resposta de la IAIA amb els documents trobats, o null si no n'hi ha cap.
 * Funció pura. IDEA-56 (Bloc F.2) · La capçalera de la Wiki si tots els
 * documents en són (o no diuen la font); si no, la de Sóc de Poble. Cada
 * línia porta la ruta interna del document o, si no en té, la de la Wiki.
 */
export function componResposta(resultats) {
  if (!Array.isArray(resultats) || !resultats.length) return null;
  const nomesWiki = resultats.every((resultat) => !resultat.font || resultat.font === 'wiki');
  return [
    nomesWiki ? ENCAPCALAMENT_DE_LA_WIKI : ENCAPCALAMENT_DE_SOC_DE_POBLE,
    ...resultats.map((resultat) => `${resultat.fragment ? `${resultat.fragment}\n` : ''}· ${resultat.titol} — ${rutaDe(resultat.ruta) || rutaDeDocumentWiki(resultat.id)}`)
  ].join('\n');
}

/* IDEA-56 (Bloc F.2) · L'ATLES OPERATIU DEL SISTEMA. Cada entrada diu el que
   és cert hui de cada racó de Sóc de Poble, en valencià i sense marcatge, i
   cap no passa de MAXIM_FRAGMENT_DE_L_ATLES caràcters. El primer paràgraf
   porta el títol. Cap correu, telèfon, NIF ni adreça, i cap paraula de les
   fixtures de les proves (iaiaLocal.atles.test.js ho vigila). Fonts de cada
   fet, entre claudàtors darrere de cada entrada. Les frases del Xat i de Javi
   casen amb el Bloc F.1 (P1-70): la IAIA hi és si no s'ha apagat amb el
   nivell d'IA, i la fila de Javi no promet cap directe en remot mentre el
   seu compte no estiga connectat al xat del poble. */
const llistaDeNoms = (noms) => (noms.length > 1 ? `${noms.slice(0, -1).join(', ')} i ${noms[noms.length - 1]}` : noms.join(''));
export const ATLES_OPERATIU = Object.freeze([
  {
    id: 'atles:socdepoble', titol: 'Sóc de Poble', ruta: '/projecte', claus: ['socdepoble', 'projecte', 'plataforma', 'xarxa social', 'mas'],
    paragrafs: [
      "Sóc de Poble és una xarxa social cívica pensada per a connectar els pobles i les persones que hi viuen, sense dependre dels grans monopolis de dades ni d'intermediaris. Volem una eina clara i pròxima: que una persona gran toque la pantalla i sàpia què fer.",
      "Ve de més de trenta anys d'activisme rural de l'Associació ecologista El Rentonar. Hi tens el Xat, el Mur, el Mercat, els Pobles, el Bloc de Notes i Multimèdia."
    ]
    /* [PAGE_COPY.projecte (pageContent.js, «Una eina per al poble»); legalContent.js:24; sections.js:41-50] */
  },
  {
    id: 'atles:xat', titol: 'El Xat', ruta: '/xat', claus: ['xat', 'missatges', 'converses', 'missatgeria'],
    paragrafs: [
      "El Xat funciona com les aplicacions de missatgeria que ja coneixes: la llista de converses, una bombolla per a cada missatge i el camp per a escriure baix de tot. Sóc de Poble no ven ni cedix les teues converses.",
      "A la llista hi ha quatre converses fixes: la comunitat de Sóc de Poble, la gent del teu poble (per exemple, Gent de la Torre), Javi Llinares i la IAIA MarIA, si no l'has apagada amb el nivell d'IA.",
      "Amb sessió, a les converses amb la gent, el botó + («Adjunta») envia fotos i vídeos. Sense registrar-te, el xat és una mostra: per a guardar les converses, has de registrar-te."
    ]
    /* [PAGE_COPY.xat (pageContent.js); actorsDelXat.js (P1-70, Bloc F.1); ca.js section.xat.iaia.apagada;
       XatSection.jsx onSendMedia (remot amb sessió, fora del fil de la IAIA) i ControlsAdjunt.jsx (section.xat.adjunts.menu);
       section.xat.fake.reply] */
  },
  {
    /* Gauntlet 261029 (cicle 1, atles-xat-sense-negreta) · La novetat del Xat
       d'esta onada (IDEA-53), en una entrada pròpia: atles:xat ja és a prop
       del màxim. Sense «xat» al títol ni a les claus: «Què és el Xat?»
       continua sent només atles:xat. «posar» i «paraula» a la prosa: «Com
       poso negreta?» i «Com destaque una paraula al xat?» hi veuen dues
       paraules (passaElLlindar). */
    id: 'atles:negreta', titol: 'La negreta', ruta: '/xat', claus: ['negreta', 'destacar'],
    paragrafs: [
      'Al Xat pots posar en negreta una paraula o una frase per a destacar-la. Selecciona el text i prem el botó N, a la dreta del camp on escrius (o ⌘B / Ctrl+B): el text queda entre asteriscs i, en enviar-lo, la bombolla el mostra en negreta.',
      'Si el tornes a prémer amb el mateix text seleccionat, la lleva. Sense res seleccionat, posa dos asteriscs amb el cursor al mig: escriu-hi la paraula.'
    ]
    /* [decisions.md Bloc B (comportament literal); negreta.js commutaNegreta i esDreceraDeNegreta; Compositor.jsx (botó [N] dins
       del camp, a la dreta); ca.js section.xat.negreta.titol i section.xat.negreta.lletra; Bombolla.jsx (segmentaNegreta)] */
  },
  {
    id: 'atles:mur', titol: 'El Mur', ruta: '/mur', claus: ['mur', 'publicar', 'publicacions', 'plaça', 'noticies'],
    paragrafs: [
      "El Mur és la plaça del poble en digital: ací pots contar com ha anat la collita, compartir una fotografia o anunciar una novetat del teu carrer.",
      "En prémer «Publicar al Mur» entres al teu estudi d'escriptura. El sistema desa l'esborrany tot sol, i la publicació només ix a la plaça quan ho confirmes. Darrere de cada pantalla hi ha un veí: parla amb respecte."
    ]
    /* [PAGE_COPY.publicar_mur (pageContent.js)] */
  },
  {
    id: 'atles:mercat', titol: 'El Mercat', ruta: '/mercat', claus: ['mercat', 'anuncis', 'vendre', 'comprar', 'regalar', 'canviar', 'segona mà'],
    paragrafs: [
      "El Mercat és un tauler d'anuncis de proximitat per a donar una segona vida a les coses: eines del camp, roba, l'excedent de l'horta o mobles. La plataforma no cobra comissions ni intervé en els pagaments: l'acord el feu entre persones.",
      "Per a publicar al Mercat, fes una foto clara, posa-li un títol senzill i explica si ho vens, ho canvies o ho regales. Qui hi estiga interessat t'escriurà pel Xat."
    ]
    /* [PAGE_COPY.publicar_mercat (pageContent.js), lead i html] */
  },
  /* IDEA-61 (T0, prompt 261102_1532) · Les tres verticals del Flux Universal
     de Publicació. La ruta de cadascuna és la seua llista viva (/vehicle,
     /treball i /habitatge, sections.js), registrada a RUTA_INTERNA i a la
     bombolla del Xat (enllacos.js). Sense «mercat» ni «mur» a les claus:
     «Què és el Mercat?» continua sent només atles:mercat. */
  {
    id: 'atles:vehicle', titol: 'Compartir cotxe', ruta: '/vehicle',
    claus: ['cotxe', 'vehicle', 'viatge', 'viatges', 'trajecte', 'places', 'transport'],
    paragrafs: [
      "Compartir cotxe és el tauler de viatges del poble: qui té places lliures al cotxe oferix el trajecte, i qui busca lloc el demana, per a anar i tornar del poble, al metge o a fer encàrrecs.",
      "Per a publicar un viatge, obri la secció Compartir cotxe i prem «Publicar un viatge»: dius d'on ixes, on vas, el dia i les places. Les despeses s'acorden entre persones pel Xat; la plataforma no hi cobra res."
    ]
    /* [sections.js (vehicle a /vehicle); verticals/SeccioVertical.jsx (section.vehicle.publicar); publicacioUniversal.js (CAMPS.vehicle);
       PAGE_COPY.vehicle_compartit (pageContent.js)] */
  },
  {
    id: 'atles:treball', titol: 'Treball', ruta: '/treball',
    claus: ['treball', 'feina', 'faena', 'ofici', 'oficis', 'jornal', 'oferta', 'ofertes'],
    paragrafs: [
      "Treball és el tauler de feina del poble: ofertes de feina, oficis que s'oferixen, jornals agrícoles i relleu generacional d'un negoci o d'una explotació.",
      "Per a publicar una oferta, obri la secció Treball i prem «Publicar una oferta»: dius la modalitat, l'ofici o sector, el municipi i com contactar. L'acord laboral es tanca entre persones, fora de la plataforma."
    ]
    /* [sections.js (treball a /treball); verticals/SeccioVertical.jsx (section.treball.publicar); publicacioUniversal.js (MODALITATS.treball);
       PAGE_COPY.treball (pageContent.js)] */
  },
  {
    id: 'atles:habitatge', titol: 'Habitatge', ruta: '/habitatge',
    claus: ['habitatge', 'habitatges', 'casa', 'cases', 'pisos', 'lloguer', 'llogar', 'masoveria'],
    paragrafs: [
      "Habitatge és el tauler de cases i pisos del poble: lloguer, venda, cases per a compartir i masoveria urbana, per a obrir portes tancades i atraure gent nova.",
      "Per a publicar un habitatge, obri la secció Habitatge i prem «Publicar un habitatge»: dius la modalitat, el preu i, si vols, la superfície, les habitacions i l'estat de l'immoble. El tracte es fa entre persones, sense comissions."
    ]
    /* [sections.js (habitatge a /habitatge); verticals/SeccioVertical.jsx (section.habitatge.publicar); publicacioUniversal.js (CAMPS.habitatge);
       PAGE_COPY.habitatge (pageContent.js)] */
  },
  {
    id: 'atles:pobles', titol: 'Pobles', ruta: '/pobles', claus: ['pobles', 'territori', 'comarca', 'municipis'],
    paragrafs: [
      "A Pobles («Nodes i territori») explores els pobles i el seu context territorial. Cada poble té la seua fitxa i, al Xat, una comunitat que es diu com la seua gent: «Gent de la Torre» és la de La Torre de les Maçanes.",
      `Hi trobaràs pobles com ${llistaDeNoms(MOCK_TOWNS.map((poble) => poble.title))}.`
    ]
    /* [ca.js (Pobles, «Nodes i territori»); pobleAmfitrio.js (POBLE_PER_DEFECTE, nomDelPoble); townsSeed.js] Sense «nodes» a les
       claus: «Què és un node?» és de PAGE_COPY.fedivers. */
  },
  {
    id: 'atles:notes', titol: 'Bloc de Notes', ruta: '/notes', claus: ['notes', 'bloc', 'nota', 'escriure', 'apunts'],
    paragrafs: [
      "El Bloc de Notes és el teu estudi d'escriptura privat: hi pots escriure, esborrar i organitzar-te com vulgues sense que ningú ho veja.",
      "Quan una nota està llesta, «Proposa Card» et prepara la targeta (títol, subtítol i entradilla) a partir del que ja has escrit."
    ]
    /* [PAGE_COPY.notes, lead; proposaCard.js:1-12] */
  },
  {
    id: 'atles:proposa_card', titol: 'Proposa Card', ruta: '/notes', claus: ['proposa', 'card', 'targeta'],
    paragrafs: [
      "«Proposa Card» és un botó del Bloc de Notes que puja als camps de la targeta el que ja tens escrit a l'inici de la nota: la primera línia o el primer títol, al títol; la línia curta següent, al subtítol; i el primer paràgraf, a l'entradilla.",
      "Proposa Card només omple els camps buits i no fa servir cap intel·ligència artificial. Si no t'agrada, «Desfés la proposta» o Cmd/Ctrl+Z ho torna arrere."
    ]
    /* [proposaCard.js:1-30; ca.js section.notes.proposaCard, section.notes.proposaCardDesfer] */
  },
  {
    id: 'atles:multimedia', titol: "Multimèdia i Gestor d'Arxius", ruta: '/multimedia', claus: ['multimedia', 'arxius', 'fotos', 'fototeca', 'galeria', 'carpeta', 'gestor'],
    paragrafs: [
      "Multimèdia és l'arxiu visual de Sóc de Poble i el gestor d'arxius. Hi veus la galeria publicada i, amb «Vincular carpeta local», pots treballar des del navegador amb una carpeta del teu ordinador: les fotos, els documents i els textos.",
      "Les carpetes vinculades només es recorden en este navegador. En un ordinador compartit, oblida-les en acabar."
    ]
    /* [Blocs A i E (IDEA-54/55); ca.js section.multimedia.local.vincula i section.multimedia.local.privadesa (literals)] */
  },
  {
    id: 'atles:javi', titol: 'Javi Llinares', ruta: '/javillinares', claus: ['javi', 'llinares', 'creador', 'coordinador', 'servei tecnic'],
    paragrafs: [
      "Javi Llinares és el creador i coordinador de Sóc de Poble dins de l'Associació ecologista El Rentonar. És dissenyador gràfic i el seu poble és La Torre de les Maçanes.",
      "Al Xat, la seua fila és la de l'atenció personal i el servei tècnic de Sóc de Poble. Si el seu compte encara no està connectat al xat del teu poble, la mateixa conversa et diu on demanar ajuda mentrestant."
    ]
    /* [agentsSeed.js (JAVI: role, lema); navigation.js RUTES_CANONIQUES (/javillinares); P1-70 (Bloc F.1): section.xat.javi.subtitol
       i section.xat.javi.senseCompte (cap directe en remot sense l'UUID declarat)] */
  },
  {
    id: 'atles:rentonar', titol: 'El Rentonar', ruta: '/rentonar', claus: ['rentonar', 'associacio', 'ecologista'],
    paragrafs: [
      "El Rentonar és l'Associació ecologista d'on ve Sóc de Poble: més de trenta anys d'activisme rural i de lluita pel nostre entorn natural i patrimonial, sense ànim de lucre.",
      "El llegat digital del Rentonar va nàixer a rentonar.blogspot.com (anys 2000) i va créixer a socdepoble.net (anys 2010). A Sóc de Poble té el grup de treball «Rentonar», amb el lema «Natura i Patrimoni»."
    ]
    /* [legalContent.js:24; wikiManifest 00_visio_i_pilars (§ Llinatge històric); identitatsSeed.js (grup Rentonar)] */
  },
  {
    /* Ordre del Mestre (30-10-2026; candidatura NLnet NGI Fediversity) · La
       pàgina de la candidatura, indexada a l'Atles. La ruta és la de la seua
       entrada de SYSTEM_PAGES, /page/fediversity: /fediversity n'és l'adreça
       curta (una redirecció) i no és a RUTA_INTERNA, que ha de casar ruta a
       ruta amb la bombolla (sections/xat/enllacos.js). Diu el mateix que la
       pàgina, sense cap diner rebut: la candidatura està en avaluació. */
    id: 'atles:fediversity', titol: 'Candidatura NLnet · NGI Fediversity', ruta: '/page/fediversity',
    claus: ['fediversity', 'nlnet', 'ngi', 'candidatura', 'subvenció', 'convocatòria'],
    paragrafs: [
      "NGI Fediversity és una convocatòria de la fundació NLnet, dins del programa Next Generation Internet de la Comissió Europea i amb fons d'Horizon Europe. La candidatura de Sóc de Poble demana una subvenció de 50.000 € per a 1.000 hores de treball. Està en avaluació: encara no s'ha concedit cap diner.",
      'La seua pàgina diu, partida per partida, què es pot comprovar hui i què queda pendent.'
    ]
    /* [PAGE_COPY.fediversity (pageContent.js: lead i taula); nlnet.nl/fediversity, consultat el 30-10-2026] */
  },
  {
    /* Ordre del Mestre (30-10-2026, ~00:50 CET) · Els nodes actius i la visió
       «Gent de…», els mateixos de /page/fediversity i de PAGE_COPY.fedivers.
       Sense «node» al títol ni a les claus: «Què és un node?» (i «Quins nodes
       hi ha?», que la tokenització no en distingix) és de la segona capa, la
       pàgina Nodes i Fedivers, que ara nomena els dos nodes al seu primer
       paràgraf. Sense «Maçanes» ni «pobles» a l'entrada: «On és la Torre de
       les Maçanes?» és de la fitxa del poble, i «Quins pobles hi ha?», de
       Pobles. La ruta és la de la candidatura, on hi ha els enllaços. */
    id: 'atles:gentdelatorre', titol: 'Gent de la Torre', ruta: '/page/fediversity',
    claus: ['gentdelatorre', 'gent de la torre', 'obrir', 'germà'],
    paragrafs: [
      "Gent de la Torre és el node viu de Sóc de Poble a gentdelatorre.net: una web de WordPress que porta la mateixa App amb el connector de Sóc de Poble. L'altre node actiu és socdepoble.org, el portal matriu. Tots dos són portes al mateix servei, amb les mateixes dades.",
      "La intenció és que la gent d'altres pobles puga obrir el node del seu poble, un node germà «Gent de…», com Gent de Xixona o Gent de Relleu. Hui encara no n'hi ha cap més. El connector ja és públic al directori de connectors de WordPress.org, amb el nom socdepoble."
    ]
    /* [PAGE_COPY.fediversity i PAGE_COPY.fedivers (pageContent.js); gentdelatorre.net i socdepoble.org responen 200 (30-10-2026);
       el connector socdepoble 1.1.10 és públic a wordpress.org/plugins/socdepoble (fitxa i api.wordpress.org, 200, 01-11-2026);
       canalsDeBotiga.js (canal wordpress-org obert)] */
  },
  {
    id: 'atles:oliva_oli', titol: "Collita de l'oliva i l'oli", ruta: '/pobles',
    claus: ['oliva', 'olives', 'oli', 'olivera', 'oliveres', 'almassera', 'collita'],
    paragrafs: [
      "La collita de l'oliva i l'elaboració d'oli d'oliva verge extra a les almàsseres i cooperatives és un dels pilars agrícoles de les nostres comarques de muntanya, des de la tardor fins a l'hivern.",
      "A Sóc de Poble pots compartir l'estat de la campanya al Mur i anunciar oli o eines agrícoles de proximitat al Mercat."
    ]
    /* [PAGE_COPY.publicar_mur i publicar_mercat (pageContent.js); sections.js (Mur i Mercat)] */
  },
  {
    id: 'atles:hort_tomaques', titol: "L'horta, les tomaques i el reg", ruta: '/pobles',
    claus: ['hort', 'horta', 'tomaca', 'tomaques', 'sembrar', 'reg', 'bancal', 'bancals', 'llavors', 'cultiu'],
    paragrafs: [
      "L'horta tradicional, el cultiu de tomaques de penjar i d'estiu, el manteniment dels bancals i l'aprofitament de l'aigua de reg i de les séquies formen part viva de la memòria rural dels nostres pobles.",
      "Al Mur pots compartir consells de sembra i varietats locals, i al Mercat, intercanviar planter, llavors tradicionals i excedents de collita amb el veïnat."
    ]
    /* [PAGE_COPY.publicar_mur i publicar_mercat (pageContent.js); sections.js (Mur i Mercat)] */
  },
  {
    id: 'atles:festes_agenda', titol: 'Calendari, festes i agenda', ruta: '/calendari',
    claus: ['calendari', 'agenda', 'festa', 'festes', 'acte', 'actes', 'esdeveniments', 'aplec', 'fira'],
    paragrafs: [
      "El Calendari comunitari aplega les festes majors, els mercats setmanals, les assemblees d'associacions, els aplecs i les activitats culturals o esportives del poble perquè ningú es perda res.",
      "Qualsevol veí o entitat registrada pot consultar els pròxims actes a la vista del Calendari i anunciar convocatòries obertes a tota la comunitat des del Mur."
    ]
    /* [sections.js (Calendari a /calendari, el mateix calendari del Mur); App.jsx (ruta /calendari)] */
  },
  {
    id: 'atles:patrimoni_fonts', titol: 'Fonts, sendes i patrimoni rural', ruta: '/pobles',
    claus: ['font', 'fonts', 'senda', 'sendes', 'ruta', 'rutes', 'caminada', 'muntanya', 'patrimoni', 'barranc'],
    paragrafs: [
      "Les fonts naturals, els llavadors, les sendes de muntanya, els marges tradicionals i els masos formen el patrimoni viu del nostre terme municipal.",
      "Al Mur pots compartir fotos i notes de les fonts, les sendes i els racons del terme; hui Sóc de Poble encara no té cap col·lecció de toponímia ni de memòria oral."
    ]
    /* [PAGE_COPY.publicar_mur (pageContent.js); exportaMunicipiOpenData.js (recullDadesPubliquesDelMunicipi: el Mas no té cap mòdul de memòria cultural)] */
  },
  {
    id: 'atles:entitat_associacio', titol: 'Associacions, cooperatives i comerços', ruta: '/projecte',
    claus: ['entitat', 'entitats', 'cooperativa', 'cooperatives', 'comerc', 'botiga', 'empresa', 'grup', 'col·lectiu'],
    paragrafs: [
      "Les associacions culturals, comissions de festes, cooperatives agrícoles i comerços locals poden tindre la seua pròpia fitxa pública a Sóc de Poble i publicar avisos en nom de l'entitat.",
      "Des del teu perfil pots crear una organització o un grup, afegir altres membres de la junta amb rol d'administració i commutar amb un toc entre la teua veu personal i la del col·lectiu."
    ]
    /* [PerfilContext.jsx i contracte.js (alta directa de membres, sense invitació)] */
  },
  {
    id: 'atles:privacitat_baixa', titol: 'Exportació de dades i privacitat', ruta: '/el-meu-perfil',
    claus: ['privacitat', 'dades', 'exportar', 'rgpd', 'drets', 'visibilitat'],
    paragrafs: [
      "A Sóc de Poble les teues dades són teues: no hi ha publicitat ni rastrejadors comercials, i tu decideixes si la teua fitxa veïnal és pública o privada.",
      "A l'apartat de Privacitat del teu perfil pots descarregar una còpia de les dades que Sóc de Poble guarda del teu compte, en un fitxer JSON, i demanar la baixa del compte."
    ]
    /* [DetallPrivacitat.jsx (còpia en JSON i baixa) i PerfilShell.jsx (vista Privacitat de /el-meu-perfil); legalContent.js (galetes: cap analítica comercial)] */
  },
  {
    id: 'atles:idiomes_traductor', titol: 'Idiomes i traducció lliure', ruta: '/traduccions',
    claus: ['llengua', 'llengues', 'traduir', 'traduccio', 'traductor', 'apertium', 'valencia', 'castella', 'angles', 'basc', 'gallec'],
    paragrafs: [
      "La interfície de Sóc de Poble està disponible en cinc llengües: valencià, castellà, anglés, basc i gallec, i pots canviar-la en qualsevol moment des de l'apartat d'Idioma.",
      "A més, a socdepoble.org, el botó Traduir de la barra blava demana una traducció automàtica del text de la pàgina: amb Apertium, un traductor de programari lliure, al castellà, l'anglés, el francés i el gallec, i amb el servei MyMemory al basc i a l'alemany. És traducció automàtica, sense revisió de cap persona."
    ]
    /* [SUPPORTED_LANGUAGES (i18n.js); App.jsx (Idioma a /traduccions); PAGE_COPY.fediversity (Apertium i MyMemory)] */
  },
  {
    id: 'atles:cerca_global', titol: 'Cercador i filtres', ruta: '/cerca',
    claus: ['cercador', 'filtre', 'filtrar', 'lupa'],
    paragrafs: [
      "El cercador superior et permet trobar i localitzar a l'instant qualsevol publicació del Mur, anunci del Mercat, fitxa de poble, veí, entitat o pàgina escrivint una sola paraula clau.",
      "Pots obrir la cerca des de la barra superior en qualsevol pantalla i filtrar els resultats per tipus."
    ]
    /* [indexCerca.js (TIPUS_CERCA, sense documents de la Wiki); App.jsx (el botó de la barra superior obri /cerca)] */
  },
  {
    id: 'atles:bandol_mur', titol: 'Bàndols i comunicats municipals', ruta: '/mur',
    claus: ['bàndol', 'bàndols', 'comunicat', 'redactar bàndol'],
    paragrafs: [
      "Per a redactar un bàndol o comunicat municipal al Mur, comença amb un títol clar que diga què passa, el dia, l'hora i el lloc.",
      "Pots preparar l'esborrany al Bloc de Notes amb Proposa Card i publicar-lo en nom del teu perfil o de la teua entitat."
    ]
    /* [PAGE_COPY.publicar_mur (pageContent.js); proposaCard.js; PerfilContext.jsx] */
  }
].map((entrada) => Object.freeze({ ...entrada, claus: Object.freeze([...entrada.claus]), paragrafs: Object.freeze([...entrada.paragrafs]) })));

/** El document de l'índex d'una entrada de l'Atles: es diu sencera. */
const documentDeLAtles = (entrada) => ({
  id: entrada.id, title: entrada.titol, tags: entrada.claus, ruta: entrada.ruta, font: 'atles',
  maximFragment: MAXIM_FRAGMENT_DE_L_ATLES, content: `# ${entrada.titol}\n\n${entrada.paragrafs.join(' ')}`
});

/**
 * IDEA-56 (Bloc F.2) · La fitxa d'un poble de la llavor per a la IAIA: el
 * nom, la comarca com a etiqueta, el text i com es diu la seua comunitat al
 * Xat. Sense la població (la de la llavor no quadra amb el text). Funció pura.
 */
export function documentDelPoble(poble) {
  if (!poble || typeof poble.id !== 'string' || typeof poble.title !== 'string') return null;
  const text = typeof poble.content === 'string' ? poble.content : '';
  const comunitat = typeof poble.author === 'string' && poble.author ? ` Al Xat, la seua comunitat es diu «${poble.author}».` : '';
  return {
    id: `poble:${poble.id}`, title: poble.title, tags: typeof poble.comarca === 'string' ? [poble.comarca] : [],
    ruta: `/pobles/${poble.id}`, font: 'poble', content: `# ${poble.title}\n\n${text}${comunitat}`
  };
}

/* La capa local es construïx una sola vegada per pestanya (uns 5 ms en fred). */
let indexLocal = null;

/**
 * IDEA-56 (Bloc F.2) · L'índex curat de la capa local: l'Atles i els pobles
 * de la llavor. Síncron, sense xarxa, memoritzat al mòdul.
 */
export function indexDeLaCapaLocal() {
  if (!indexLocal) {
    indexLocal = construeixIndex([...ATLES_OPERATIU.map(documentDeLAtles), ...MOCK_TOWNS.map(documentDelPoble).filter(Boolean)], { curat: true });
  }
  return indexLocal;
}

/* P1-24 · L'índex curat del rebost rural, a part del de l'Atles: BM25 hi
   compta les freqüències i la llargària mitjana de cada índex, i barrejar-los
   canviaria el rànquing de l'Atles. Es construïx a la primera pregunta que
   l'Atles no sap, una sola vegada per pestanya, amb les claus plegades de
   cada càpsula. */
let rebostRural = null;
function rebostConstruit() {
  if (!rebostRural) {
    rebostRural = {
      index: construeixIndex(CAPSULES_RURALS.map(documentDeLAtles), { curat: true }),
      perId: new Map(CAPSULES_RURALS.map((capsula) => [capsula.id, {
        minim: capsula.minimTermes ?? 1, claus: new Set(tokenitza(capsula.claus.join(' '))), exclou: new Set(arrels((capsula.exclou || []).join(' ')))
      }]))
    };
  }
  return rebostRural;
}

/** P1-24 · L'índex curat del rebost rural (iaiaRebostRural.js). */
export function indexDelRebostRural() {
  return rebostConstruit().index;
}

/**
 * P1-24 · Les càpsules del rebost rural que responen la pregunta, de més a
 * menys puntuació: les que passen el llindar de la capa curada i, a més,
 *   · amb una sola arrel, una de les paraules és tal qual una de les seues
 *     claus («trobe» fa l'arrel de «trobada»; «eines» o «partides» diuen
 *     massa; «trobe trobes» continua sent una sola paraula);
 *   · en tenen com a mínim `minimTermes` arrels distintes («pedra» sola, o
 *     «pedra pedres», no és la pedra seca);
 *   · cap no és d'`exclou` («el mètode Pedra Seca» és de la Wiki);
 *   · amb tres o més, la càpsula en mostra més de la meitat: el títol d'un
 *     document de la Wiki («Lleis de pas: integració de Pedra Seca…») no
 *     cau en una càpsula per dues paraules.
 * Funció pura sobre l'índex memoritzat.
 */
export function cercaAlRebostRural(pregunta, limit = DOCUMENTS_PER_RESPOSTA) {
  const { index, perId } = rebostConstruit();
  const formes = termesDeLaPregunta(pregunta);
  const termes = arrelsDeLaPregunta(pregunta);
  return puntua(index, termes, formes).filter((resultat) => {
    const capsula = perId.get(resultat.id);
    if (!capsula || !passaElLlindar(resultat, termes, index) || termes.length < capsula.minim) return false;
    if (termes.length === 1 && !formes.some((forma) => capsula.claus.has(forma))) return false;
    if (termes.some((terme) => capsula.exclou.has(terme))) return false;
    return termes.length < 3 || resultat.vistos * 2 > termes.length;
  }).slice(0, Math.max(0, limit)).map(sensePuntsInterns);
}

/* IDEA-56 (Bloc F.2) · Les pàgines de PAGE_COPY que la IAIA pot citar. Fora:
   `legal` (porta el NIF i el domicili del titular), `consola`, `cervell` i
   `disseny` (maquinària de l'equip, el criteri de CARPETES_DE_L_EQUIP),
   `notes` i `notes_shared` (sense text o amb text vell; l'Atles ja respon). */
export const PAGINES_PER_A_LA_IAIA = Object.freeze(['projecte', 'constitucio', 'anima', 'roadmap', 'versions', 'descarregues', 'xat',
  'wikidepoble', 'fedivers', 'drets-autor', 'publicar_mur', 'publicar_mercat', 'publicar_calendari', 'publicar_mapa',
  'vehicle_compartit', 'animalets', 'treball', 'habitatge']);
/* Les pàgines amb secció pròpia (SECTIONS · pageKey). Ací en literal, com
   RUTA_DE_LA_WIKI: el registre de seccions porta icones de la interfície.
   iaiaLocal.atles.test.js vigila que coincidisquen. La resta, /page/<clau>. */
export const RUTES_DE_PAGINA = Object.freeze({
  projecte: '/projecte', constitucio: '/constitucio', anima: '/anima', roadmap: '/roadmap', versions: '/versions', fedivers: '/fedivers'
});

/** La ruta interna d'una pàgina de PAGE_COPY. */
export const rutaDePagina = (clau) => (Object.hasOwn(RUTES_DE_PAGINA, clau) ? RUTES_DE_PAGINA[clau] : `/page/${clau}`);

/* Les entitats que porta PAGE_COPY. «<» i «>» passen a «‹ ›»: cap etiqueta
   no es torna a formar. */
const ENTITATS = Object.freeze({ '&nbsp;': ' ', '&amp;': '&', '&lt;': '‹', '&gt;': '›', '&quot;': '"', '&#39;': "'", '&apos;': "'" });

/* Gauntlet intern (F.2) · Els comentaris HTML no es pinten a la pàgina
   (PAGE_COPY.roadmap n'amaga un tros sencer): la IAIA tampoc no els cita.
   Amb indexOf, en una sola passada: una expressió amb «[\s\S]*?» seria
   quadràtica amb molts «<!--» sense tancar. Un comentari sense tancar
   s'emporta la resta, com al navegador. */
function senseComentarisHtml(html) {
  let text = '';
  let i = 0;
  while (i < html.length) {
    const obri = html.indexOf('<!--', i);
    if (obri < 0) return text + html.slice(i);
    text += html.slice(i, obri);
    const tanca = html.indexOf('-->', obri + 4);
    if (tanca < 0) return text;
    i = tanca + 3;
  }
  return text;
}

/**
 * IDEA-56 (Bloc F.2) · L'HTML d'una pàgina de PAGE_COPY com a text: un bloc
 * per paràgraf (separats per una línia en blanc) i els títols com a línia
 * «### …», que fragmentsDe no cita. Sense DOMParser i sense escriure cap
 * HTML. Gauntlet intern (F.2) · Expressions lineals: una etiqueta no pot
 * contindre «<» (amb «[^>]*», 16.384 «<a» sense tancar costaven 0,7 s), i un
 * «<» o «>» solt que queda passa a «‹ ›»: cap etiqueta no es torna a formar.
 * Funció pura.
 */
export function textDeHtml(html) {
  return senseComentarisHtml(String(html ?? ''))
    .replace(/<h[1-6][^<>]*>/gi, '\n\n### ')
    .replace(/<\/h[1-6]\s*>|<\/(?:p|div|li|ul|ol|blockquote|section|article|table|tr)\s*>|<br\s*\/?>|<li\b[^<>]*>/gi, '\n\n')
    .replace(/<[^<>]*>/g, '')
    .replace(/</g, '‹')
    .replace(/>/g, '›')
    .replace(/&(?:nbsp|amp|lt|gt|quot|#39|apos);/g, (entitat) => ENTITATS[entitat])
    .replace(/[ \t]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * IDEA-56 (Bloc F.2) · Les pàgines triades de PAGE_COPY com a documents de
 * la segona capa. Una clau absent o sense títol de text es bota. Funció pura.
 */
export function documentsDePageCopy(pageCopy) {
  const documents = [];
  for (const clau of PAGINES_PER_A_LA_IAIA) {
    const pagina = pageCopy && typeof pageCopy === 'object' && Object.hasOwn(pageCopy, clau) ? pageCopy[clau] : null;
    if (!pagina || typeof pagina !== 'object' || typeof pagina.title !== 'string' || !pagina.title.trim()) continue;
    const etiquetes = (Array.isArray(pagina.labels) ? pagina.labels : [])
      .map((etiqueta) => (typeof etiqueta === 'string' ? etiqueta : etiqueta?.text))
      .filter((text) => typeof text === 'string');
    const entradeta = typeof pagina.lead === 'string' ? pagina.lead : '';
    documents.push({
      id: `pagina:${clau}`, title: pagina.title, subtitle: typeof pagina.subtitle === 'string' ? pagina.subtitle : '', tags: etiquetes,
      ruta: rutaDePagina(clau), font: 'pagina', content: `# ${pagina.title}\n\n${entradeta}\n\n${textDeHtml(pagina.html)}`
    });
  }
  return documents;
}

/* La Wiki del paquet, a demanda (la consulta del diàleg). */
const carregaWikiDelPaquet = () => import('./wikiManifest.js').then((modul) => modul.wikiManifest);
/* IDEA-56 (Bloc F.2) · La segona capa del fil: la Wiki i les pàgines
   triades, totes dues a demanda (import() sense espai: XatSection.pes.test.js
   no el compta com a estàtic). La Wiki es baixa ací; PAGE_COPY ja és en
   memòria des de l'arrencada (l'adaptador la porta per la llavor), i el seu
   import() no afig cap byte ni cap viatge. */
const carregaPaquetDeLaIAIA = () => Promise.all([import('./wikiManifest.js'), import('../sections/text/pageContent.js')])
  .then(([wiki, pagines]) => ({ items: [...(Array.isArray(wiki.wikiManifest?.items) ? wiki.wikiManifest.items : []), ...documentsDePageCopy(pagines.PAGE_COPY)] }));

/* Cada índex del paquet es construïx una sola vegada per pestanya. Si la
   càrrega falla, es descarta i la pregunta següent ho torna a provar. Un
   carregador injectat (les proves) no es guarda. */
const CARREGADORS_DEL_PAQUET = new Set([carregaWikiDelPaquet, carregaPaquetDeLaIAIA]);
const indexosDelPaquet = new Map();

function indexDe(carrega) {
  const construeix = () => Promise.resolve().then(carrega).then((manifest) => construeixIndex(manifest?.items));
  if (!CARREGADORS_DEL_PAQUET.has(carrega)) return construeix();
  if (!indexosDelPaquet.has(carrega)) {
    const promesa = construeix();
    indexosDelPaquet.set(carrega, promesa);
    promesa.catch(() => { if (indexosDelPaquet.get(carrega) === promesa) indexosDelPaquet.delete(carrega); });
  }
  return indexosDelPaquet.get(carrega);
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
 * IDEA-56 (Bloc F.2) · Primer la capa local (l'Atles i els pobles), sense
 * cap càrrega ni xarxa: si hi troba res, respon ja. Si no, la segona capa
 * (per defecte, la Wiki i les pàgines triades de PAGE_COPY). `capaLocal:
 * false` (proves) la bota.
 * @returns {Promise<string|null>}
 */
export async function respostaDeLaIAIA(pregunta, { carrega = carregaPaquetDeLaIAIA, tempsMaxim = TEMPS_MAXIM_DE_LA_WIKI, capaLocal = true } = {}) {
  if (typeof pregunta !== 'string' || pregunta.length > MAXIM_PREGUNTA_IAIA) return null;
  if (!termesDeLaPregunta(pregunta).length) return pregunta.trim() ? SALUTACIO_TECNICA_IAIA : null;
  if (capaLocal) {
    const ajuda = ajudaDePublicacioIAIA(pregunta);
    if (ajuda) return ajuda;
    try {
      const locals = cercaRellevant(indexDeLaCapaLocal(), pregunta);
      if (locals.length) return componResposta(locals);
      /* P1-24 · El que l'Atles no sap, el rebost rural, abans de baixar la Wiki. */
      const rurals = cercaAlRebostRural(pregunta);
      if (rurals.length) return componResposta(rurals);
    } catch {
      /* La capa local no pot fer callar la IAIA: es prova la segona. */
    }
  }
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
 * el que passa el llindar de rellevància (si no, 'sense_resultats').
 * Ordre del Mestre (30-10-2026; f4 D.2, P1-49) · És el cercador guiat de la
 * Wiki: el nom d'una eina troba el document que el diu (cercaGuiada). */
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
    const fonts = cercaRellevant(index, pregunta, DOCUMENTS_PER_RESPOSTA, { cercaGuiada: true })
      .map(({ id, titol, fragment }) => ({ id, titol, fragment, ruta: rutaDeDocumentWiki(id) }));
    return fonts.length ? { estat: 'resposta', fonts, text: componResposta(fonts) } : { estat: 'sense_resultats', fonts: [] };
  } catch {
    return { estat: 'no_disponible', fonts: [] };
  } finally {
    signal?.removeEventListener('abort', atura);
  }
}

/** Per a les proves: oblida els índexs del paquet (la Wiki sola i la Wiki
    amb les pàgines), el de la capa local i el del rebost rural. */
export function oblidaIndexDeLaWiki() {
  indexosDelPaquet.clear();
  indexLocal = null;
  rebostRural = null;
}

/**
 * Suggeriments ràpids clicables d'ajuda rural per a la IAIA MarIA al Xat
 * (P1-24, P1-70, IDEA-28, IDEA-56).
 */
export const SUGGERIMENTS_RAPIDS_IAIA = Object.freeze([
  Object.freeze({
    id: 'mercat-cotxe',
    clau: 'section.xat.iaia.suggeriments.mercatCotxe',
    etiqueta: 'Com publique un producte al Mercat o un viatge per Compartir Cotxe?',
    pregunta: 'Com publique un producte al Mercat o un viatge per Compartir Cotxe?',
    ruta: '/page/vehicle_compartit'
  }),
  Object.freeze({
    id: 'bandol-mur',
    clau: 'section.xat.iaia.suggeriments.bandolMur',
    etiqueta: "Ajuda'm a redactar un bàndol o avís per al Mur",
    pregunta: "Ajuda'm a redactar un bàndol o avís per al Mur",
    ruta: '/mur'
  }),
  Object.freeze({
    id: 'bloc-notes',
    clau: 'section.xat.iaia.suggeriments.blocNotes',
    etiqueta: 'Com funciona el Bloc de Notes?',
    pregunta: 'Com funciona el Bloc de Notes?',
    ruta: '/notes'
  })
]);

const LINIA_ACCIO_IAIA = /^·\s+(.+?)\s+—\s+(\/\S+)\s*$/;
const RUTA_INTERNA_EN_TEXT = /\/(?:page\/[\w-]+|wikidepoble\?item=[\w.~%-]+|[\w-]+)\b/g;
const RUTES_EQUIVALENTS_ATLES = new Map([
  ['/page/vehicle_compartit', '/vehicle'],
  ['/page/treball', '/treball'],
  ['/page/habitatge', '/habitatge']
]);

/**
 * Extreu de la resposta de la IAIA les accions directes (títol i ruta interna
 * o de la Wiki) sense duplicats. Funció pura.
 */
export function extreuAccionsDeRespostaIAIA(resposta) {
  if (typeof resposta !== 'string' || !resposta.trim()) return [];
  const vistes = new Set();
  const accions = [];
  for (const linia of resposta.split('\n')) {
    const coincidencia = LINIA_ACCIO_IAIA.exec(linia.trim());
    if (!coincidencia) continue;
    const titol = coincidencia[1].trim();
    const ruta = coincidencia[2].trim();
    const valida = RUTA_INTERNA.test(ruta) || /^\/wikidepoble\?item=[\w.~%-]+$/.test(ruta);
    if (!titol || !valida || vistes.has(ruta)) continue;
    vistes.add(ruta);
    accions.push(Object.freeze({ titol, ruta }));
  }
  if (!accions.length) {
    for (const coincidencia of resposta.matchAll(RUTA_INTERNA_EN_TEXT)) {
      const ruta = coincidencia[0];
      if (vistes.has(ruta) || !RUTA_INTERNA.test(ruta)) continue;
      const rutaAtles = RUTES_EQUIVALENTS_ATLES.get(ruta) || ruta;
      const entrada = ATLES_OPERATIU.find((item) => item.ruta === rutaAtles);
      if (!entrada?.titol) continue;
      vistes.add(ruta);
      accions.push(Object.freeze({ titol: entrada.titol, ruta }));
    }
  }
  return Object.freeze(accions);
}

/**
 * Construeix un missatge d'esborrany de la IAIA estructurat per al Bloc de
 * Notes i «Proposa Card» (IDEA-28 / IDEA-41): títol, subtítol, entradilla i
 * cos net sense marques d'encapçalament tècnic. Funció pura.
 */
export function esborranyDeRespostaIAIA(pregunta, resposta) {
  const consulta = String(pregunta ?? '').replace(/\s+/g, ' ').trim();
  const linies = String(resposta ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const accions = extreuAccionsDeRespostaIAIA(resposta);
  const cosLinies = linies.filter(
    (l) => l !== ENCAPCALAMENT_DE_SOC_DE_POBLE && l !== ENCAPCALAMENT_DE_LA_WIKI && !LINIA_ACCIO_IAIA.test(l)
  );
  const titolFont = accions[0]?.titol || (consulta ? consulta.replace(/[?¿!¡.]+$/g, '').trim() : 'Esborrany de la IAIA MarIA');
  const titol = titolFont.slice(0, 120);
  const subtitol = (consulta && consulta !== titol
    ? consulta.replace(/\.+$/g, '').trim()
    : `Esborrany preparat amb la IAIA MarIA${accions[0]?.ruta ? ` (${accions[0].ruta})` : ''}`).slice(0, 160);
  const entradilla = (cosLinies[0] || String(resposta ?? '').trim()).slice(0, 500);
  const resta = cosLinies.slice(1);
  const referencies = accions.map((a) => `${a.titol} (${a.ruta})`);
  const text = [titol, subtitol, entradilla, ...resta, ...(referencies.length ? [`Referències: ${referencies.join(' · ')}`] : [])]
    .filter(Boolean)
    .join('\n\n');
  return Object.freeze({
    id: 'iaia-esborrany',
    sender: 'other',
    author: 'IAIA MarIA',
    is_ai: true,
    esEsborranyIAIA: true,
    titolEsborrany: titol,
    subtitolEsborrany: subtitol,
    entradillaEsborrany: entradilla,
    cosEsborrany: Object.freeze(resta),
    referenciesEsborrany: Object.freeze(referencies),
    text,
    creatAl: new Date().toISOString()
  });
}
