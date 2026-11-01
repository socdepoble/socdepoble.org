/**
 * importaMunicipiOpenData.js — El restaurador del paquet Open Data d'un
 * municipi (T2 · D04/D10; assalt 261101, pla 261101_1246, D-3). L'altra
 * meitat de «traure-ho tot fora» (AGENTS §8): el paquet que descarrega la
 * fitxa del poble (exportaMunicipiOpenData.js) es torna a carregar en un
 * altre servidor de dades, a través del port neutral (capacitat
 * 'restauracioDadesObertes', contracte.js). Hui la servix l'adaptador local
 * (src/data/local/); Supabase no restaura (especificació T2 de l'assalt; D-3
 * només n'autoritza la lectura pública).
 *
 *   llegeixPaquetOpenData(zip, opcions)      llig i valida, sense escriure res
 *   importaMunicipiOpenData(zip, port, opcions)  i, si tot quadra, restaura
 *
 * Abans d'escriure res, falla tancat (TypeError) si:
 *   1. el SHA-256 del ZIP no és el que s'esperava (sha256Esperat);
 *   2. la bossa BagIt no quadra (verificaPaquetOpenData): cada fitxer de data/
 *      amb el seu SHA-256 de manifest-sha256.txt i del Data Package, cap
 *      fitxer alterat, absent o de més, Payload-Oxum, tagmanifest i noms en
 *      llista blanca (cap «..», cap camí absolut ni barra invertida: cap path
 *      traversal);
 *   3. el format, la versió (1.0.0, 1.1.0 o 1.2.0), l'arrel, el municipi o
 *      els fitxers no són els d'eixa versió;
 *   4. cap JSON no és canònic (el de l'exportador), o porta __proto__,
 *      constructor o prototype, o massa nivells;
 *   5. cap node JSON-LD porta una propietat fora de la llista blanca del seu
 *      tipus, un identificador repetit o un enllaç que no és del paquet;
 *   6. una fitxa OKF no es llig byte a byte amb el seu serialitzador;
 *   7. REGENERACIÓ CANÒNICA: el generador, amb el lot que s'ha llegit, ha de
 *      tornar els MATEIXOS bytes de cada .jsonld, llicencies.md,
 *      activitystreams.json, okf/** i (de la versió actual) agenda.ics. Així el
 *      lot és exactament el que es va publicar: cap camp colat, cap valor
 *      reinterpretat. Un paquet 1.0.0 es compara amb els bytes del generador
 *      1.0.0 (bytesDeLaVersio: el nom de l'actor i la fi exclusiva), mai
 *      sense comparar.
 * La memòria (memoria.md) i les omissions del Data Package són informatives.
 * La configuració (taxonomia i estil) es valida però NO es restaura: és de tot
 * el node, no d'un poble. L'outbox federat tampoc (el publica el build).
 * Els mitjans no viatgen dins del paquet (les referències sdp-media:// queden
 * penjades en un altre servidor).
 *
 * Pèrdues conegudes i documentades: una entitat de tipus 'group' s'exporta
 * com a Organization i es restaura com a 'entity'; el nom d'una entitat
 * d'un altre poble que signa un element no es restaura (no és d'este poble).
 * Després de la primera anada i tornada, el paquet és un punt fix.
 *
 * Integritat no és autenticitat: qui manipula un paquet pot refer tots els
 * SHA-256. La regeneració canònica i sha256Esperat ho fiten, però el paquet no
 * porta cap signatura: l'informe ho diu (autenticitat 'no-verificada').
 */
import { CONTEXT_AS, PUBLIC, dataIso, normalitzaOrigen, urlsDeMunicipi } from './activitypub.js';
import {
  FORMAT_DADES_OBERTES, MAXIM_PAQUET, NOMS_DE_PENDENT, VERSIO_FORMAT, endDateDeLaVersio100, jsonCanonic, preparaDadesObertesMunicipi,
  verificaPaquetOpenData
} from './exportaMunicipiOpenData.js';
import { COLECCIONS_DEL_LOT, FORMAT_LOT, validaLotDadesObertes } from './dadesObertesLot.js';
import { validaTaxonomia } from './personalitzacio.js';
import { markdownOkf } from '../sections/notes/memoriaOral.js';
import { validaEstil } from '../config/estil.js';
import { llegeixZip } from '../utils/fulls/zip.js';

/* Les versions del format que este restaurador llig. */
export const VERSIONS_LLEGIBLES = Object.freeze(['1.0.0', '1.1.0', '1.2.0']);

const CLAUS_PERILLOSES = Object.freeze(['__proto__', 'constructor', 'prototype']);
const PROFUNDITAT_MAXIMA = 32;
const SCHEMA = 'https://schema.org';
const ID = /^[^\s\u0000-\u001f\u007f<>]{1,128}$/;
const DIA = /^(\d{4})-(\d{2})-(\d{2})$/;
const SHA256 = /^[0-9a-fA-F]{64}$/;
const WIKIDATA = /^https:\/\/www\.wikidata\.org\/entity\/(Q[1-9]\d{0,11})$/;
const CAMI_OKF = /^memoria-oral\/([a-z0-9]+(?:-[a-z0-9]+)*)\/([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/;
/* Els fitxers de data/ que porta tota versió. */
const OBLIGATORIS = Object.freeze(['agenda.jsonld', 'configuracio.json', 'datapackage.json', 'directori.jsonld', 'llicencies.md',
  'memoria-cultural.jsonld', 'memoria.md', 'municipi.jsonld', 'noticies.jsonld']);
const COMPTES = Object.freeze(['noticies', 'agenda', 'directori', 'memoria', 'memoriaOral']);
/* Una línia del frontmatter OKF: «clau: valor» o «clau:» (un bloc a sota). */
const LINIA_YAML = /^([a-z_]{1,32}):(?: (.*))?$/;
const LINIA_FONT = /^(id|resource|title|author): (.*)$/;
const ESCALAR_PLA = /^[a-z][a-z0-9-]{0,63}$/;
const INSTANT_YAML = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;
const STATUS_OKF = Object.freeze(['draft', 'stable', 'deprecated']);

const esObjecte = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);
const referencia = (fitxer, id) => `${fitxer}#${encodeURIComponent(id)}`;
const hex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
const invalid = (missatge) => new TypeError(`Paquet Open Data no restaurable: ${missatge}`);

/* ── JSON estricte ─────────────────────────────────────────────────────── */

function revisaArbre(valor, on, profunditat = 0) {
  if (profunditat > PROFUNDITAT_MAXIMA) throw invalid(`${on} té massa nivells.`);
  if (Array.isArray(valor)) { for (const fill of valor) revisaArbre(fill, on, profunditat + 1); return; }
  if (!esObjecte(valor)) return;
  for (const clau of Object.keys(valor)) {
    if (CLAUS_PERILLOSES.includes(clau)) throw invalid(`${on} porta la clau prohibida ${clau}.`);
    revisaArbre(valor[clau], on, profunditat + 1);
  }
}

/* JSON de l'exportador: cap clau perillosa, profunditat fitada i exactament
   la seua forma canònica (claus ordenades, sense buits, dos espais). */
function jsonEstricte(text, on) {
  let valor;
  try { valor = JSON.parse(text); } catch { throw invalid(`${on} no és JSON.`); }
  revisaArbre(valor, on);
  if (jsonCanonic(valor) !== text) throw invalid(`${on} no és el JSON canònic del paquet.`);
  return valor;
}

/* Un node amb propietats només de la llista blanca. */
function exigixClaus(node, permeses, on) {
  if (!esObjecte(node)) throw invalid(`${on} no és un objecte.`);
  const fora = Object.keys(node).find((clau) => !permeses.includes(clau));
  if (fora !== undefined) throw invalid(`${on} porta una propietat no admesa: ${fora.slice(0, 60)}.`);
}

/* Un valor de text, o undefined si no hi és. */
function textOpcional(valor, on) {
  if (valor === undefined) return undefined;
  if (typeof valor !== 'string') throw invalid(`${on} ha de ser text.`);
  return valor;
}

/* Els camps definits d'una fila (la mateixa forma que tornaria el generador: cap clau buida). */
const fila = (camps) => Object.fromEntries(Object.entries(camps).filter(([, valor]) => valor !== undefined));

/* La fitxa (subjectOf) d'un Event o una Organization: un CreativeWork amb les claus donades. */
function fitxaDe(valor, permeses, on) {
  if (valor === undefined) return {};
  exigixClaus(valor, ['@type', ...permeses], on);
  if (valor['@type'] !== 'CreativeWork') throw invalid(`${on} ha de ser un CreativeWork.`);
  return Object.fromEntries(permeses.map((clau) => [clau, textOpcional(valor[clau], `${on}.${clau}`)]));
}

/* El dia següent d'un 'AAAA-MM-DD' (la fi exclusiva d'un acte de dies sencers). */
function diaSeguent(dia) {
  const [any, mes, d] = dia.split('-').map(Number);
  const seguent = new Date(Date.UTC(any, mes - 1, d + 1));
  return `${String(seguent.getUTCFullYear()).padStart(4, '0')}-${String(seguent.getUTCMonth() + 1).padStart(2, '0')}-${String(seguent.getUTCDate()).padStart(2, '0')}`;
}

/* ── El frontmatter OKF (la forma que escriu memoriaOral.js) ──────────── */

function cadenaYaml(valor, on, { escalar = false } = {}) {
  if (typeof valor === 'string' && valor.startsWith('"')) {
    let text;
    try { text = JSON.parse(valor); } catch { text = null; }
    if (typeof text === 'string') return text;
  } else if (escalar && typeof valor === 'string' && ESCALAR_PLA.test(valor)) return valor;
  throw invalid(`${on}: valor YAML no admés.`);
}

function instantYaml(valor, on) {
  if (typeof valor !== 'string' || !INSTANT_YAML.test(valor)) throw invalid(`${on}: data no admesa.`);
  return valor;
}

/* Una llista en flux, «[a, "b c"]»: escalars plans o cadenes JSON, separats per «, ». Lineal. */
function fluxYaml(valor, on) {
  if (typeof valor !== 'string' || !valor.startsWith('[') || !valor.endsWith(']')) throw invalid(`${on}: llista no admesa.`);
  const dins = valor.slice(1, -1);
  const elements = [];
  let i = 0;
  while (i < dins.length) {
    let fi = i;
    if (dins[i] === '"') {
      fi = i + 1;
      while (fi < dins.length && dins[fi] !== '"') fi += dins[fi] === '\\' ? 2 : 1;
      fi += 1;
    } else {
      while (fi < dins.length && dins[fi] !== ',') fi += 1;
    }
    elements.push(cadenaYaml(dins.slice(i, fi), on, { escalar: true }));
    if (fi === dins.length) break;
    if (dins.slice(fi, fi + 2) !== ', ') throw invalid(`${on}: llista no admesa.`);
    i = fi + 2;
    if (i === dins.length) throw invalid(`${on}: llista no admesa.`);
  }
  return elements;
}

/**
 * El frontmatter i el cos d'una fitxa OKF del paquet. Només les claus que
 * escriu el serialitzador del Mas, cada una una vegada; i al final el mateix
 * serialitzador ha de tornar EXACTAMENT els bytes del fitxer.
 */
function llegeixFitxaOkf(text, on) {
  if (!text.startsWith('---\n')) throw invalid(`${on} no comença amb el frontmatter.`);
  const fi = text.indexOf('\n---\n\n', 3);
  if (fi < 0) throw invalid(`${on} no tanca el frontmatter.`);
  const linies = text.slice(4, fi).split('\n');
  const cos = text.slice(fi + 6);
  const fm = {};
  let i = 0;
  while (i < linies.length) {
    const m = LINIA_YAML.exec(linies[i]);
    i += 1;
    if (!m) throw invalid(`${on}: línia del frontmatter no admesa.`);
    const [, clau, valor] = m;
    if (Object.hasOwn(fm, clau)) throw invalid(`${on}: clau repetida ${clau}.`);
    const lloc = `${on} (${clau})`;
    switch (clau) {
      case 'type': case 'title': case 'description': case 'resource':
        fm[clau] = cadenaYaml(valor, lloc); break;
      case 'municipi':
        fm.municipi = cadenaYaml(valor, lloc, { escalar: true }); break;
      case 'tags':
        fm.tags = fluxYaml(valor, lloc); break;
      case 'status':
        if (!STATUS_OKF.includes(valor)) throw invalid(`${lloc}: estat no admés.`);
        fm.status = valor; break;
      case 'stale_after':
        fm.stale_after = instantYaml(valor, lloc); break;
      case 'generated': {
        if (valor !== undefined) throw invalid(`${lloc}: bloc no admés.`);
        const by = /^ {2}by: (.*)$/.exec(linies[i] ?? '');
        if (!by) throw invalid(`${lloc}: falta by.`);
        i += 1;
        fm.generated = { by: cadenaYaml(by[1], lloc) };
        const at = /^ {2}at: (.*)$/.exec(linies[i] ?? '');
        if (at) { fm.generated.at = instantYaml(at[1], lloc); i += 1; }
        break;
      }
      case 'verified': {
        if (valor !== undefined) throw invalid(`${lloc}: bloc no admés.`);
        fm.verified = [];
        while (i < linies.length && linies[i].startsWith('  - by: ')) {
          const at = /^ {4}at: (.*)$/.exec(linies[i + 1] ?? '');
          if (!at) throw invalid(`${lloc}: falta at.`);
          fm.verified.push({ by: cadenaYaml(linies[i].slice('  - by: '.length), lloc), at: instantYaml(at[1], lloc) });
          i += 2;
        }
        break;
      }
      case 'sources': {
        if (valor === '[]') { fm.sources = []; break; }
        if (valor !== undefined) throw invalid(`${lloc}: bloc no admés.`);
        fm.sources = [];
        while (i < linies.length && linies[i].startsWith('  - ')) {
          const font = {};
          let primera = true;
          while (i < linies.length && (primera ? linies[i].startsWith('  - ') : linies[i].startsWith('    '))) {
            const camp = LINIA_FONT.exec(linies[i].slice(4));
            i += 1;
            if (!camp || Object.hasOwn(font, camp[1])) throw invalid(`${lloc}: camp de font no admés.`);
            font[camp[1]] = cadenaYaml(camp[2], lloc, { escalar: camp[1] === 'id' });
            primera = false;
          }
          fm.sources.push(font);
        }
        break;
      }
      default:
        throw invalid(`${on}: clau del frontmatter no admesa (${clau}).`);
    }
  }
  let refet = null;
  try { refet = markdownOkf(fm, cos); } catch { refet = null; }
  if (refet !== text) throw invalid(`${on} no és el Markdown OKF que escriu el Mas.`);
  return { frontmatter: fm, cos };
}

/* ── Les versions anteriors ────────────────────────────────────────────── */

/* El nom de l'actor federat que escrivia la 1.0.0 (f66de7865 i abans): «de La
   Torre…», sense la regla de l'article de deNomDelPoble (G2-06, 1.1.0). */
const nomDeLActor100 = (nom) => `Actor ActivityPub de ${nom} a Sóc de Poble (fase 1, només lectura)`;

/**
 * T2-G01/G02 · Els bytes que el generador de la versió del paquet escrivia
 * per al mateix lot, a partir dels del generador d'ara. La 1.1.0 i la 1.2.0
 * escriuen els mateixos .jsonld; la 1.0.0 només hi diferia en dos valors:
 *   · municipi.jsonld: el nom de l'actor (subjectOf.name, nomDeLActor100);
 *   · agenda.jsonld: l'endDate d'un acte era la fi exclusiva del model tal
 *     qual (endDateDeLaVersio100), i no l'últim dia (fiInclusiva).
 * La resta de cada node ix del generador d'ara: cap fitxer es deixa sense
 * comparar, i un paquet que es declara 1.0.0 no salta la regeneració.
 */
function bytesDeLaVersio(nomFitxer, generat, versio, { nom, agenda }) {
  if (versio !== '1.0.0') return generat;
  if (nomFitxer === 'municipi.jsonld') {
    const node = JSON.parse(generat);
    if (!esObjecte(node.subjectOf)) return generat;
    node.subjectOf.name = nomDeLActor100(nom);
    return jsonCanonic(node);
  }
  if (nomFitxer === 'agenda.jsonld') {
    const graf = JSON.parse(generat);
    const fins = new Map(agenda.map((acte) => [acte.id, acte.fi]));
    /* Com la 1.0.0: endDate = momentSchema(fi); un null no s'escriu (jsonCanonic). */
    for (const acte of graf['@graph']) acte.endDate = endDateDeLaVersio100(fins.get(acte.identifier));
    return jsonCanonic(graf);
  }
  return generat;
}

/* ── Lectura del paquet ────────────────────────────────────────────────── */

/**
 * Llig, verifica i inverteix un paquet sense escriure res ni fer cap
 * petició. Qualsevol diferència és un TypeError (falla tancat); un paquet
 * massa gran, un RangeError.
 * @param {Uint8Array} zip
 * @param {{ subtle?, maxEixida?: number, sha256Esperat?: string }} [opcions]
 * @returns {Promise<{ slug, arrel, versio, sha256, ara, origen, municipi, actorsPublicats, lot, personalitzacio,
 *   activityStreams, comptes, calendari, omissions, pendents }>}
 */
export async function llegeixPaquetOpenData(zip, { subtle = globalThis.crypto?.subtle, maxEixida = MAXIM_PAQUET, sha256Esperat } = {}) {
  if (!(zip instanceof Uint8Array)) throw new TypeError('El paquet ha de ser els bytes d’un ZIP (Uint8Array).');
  if (typeof subtle?.digest !== 'function') throw new Error('Cal crypto.subtle (un context segur) per a comprovar els SHA-256 del paquet.');
  /* Una còpia de veres (T2-G05: el slice d'un Buffer de Node és una vista):
     ningú no pot canviar els bytes entre la verificació i la lectura. */
  const bytes = new Uint8Array(zip);
  const sha256 = hex(new Uint8Array(await subtle.digest('SHA-256', bytes)));
  if (sha256Esperat !== undefined && sha256Esperat !== null) {
    if (typeof sha256Esperat !== 'string' || !SHA256.test(sha256Esperat)) throw new TypeError('sha256Esperat ha de ser un SHA-256 en hexadecimal (64 xifres).');
    if (sha256Esperat.toLowerCase() !== sha256) throw invalid('el SHA-256 del ZIP no és l’esperat.');
  }
  const { slug, arrel } = await verificaPaquetOpenData(bytes, { subtle, maxEixida });
  const fitxers = new Map(llegeixZip(bytes, { maxEixida }).map(({ nom, dades }) => [nom.slice(arrel.length + 1), dades]));
  const descodificador = new TextDecoder('utf-8', { fatal: true });
  const text = (cami) => {
    try { return descodificador.decode(fitxers.get(cami)); } catch { throw invalid(`${cami} no és UTF-8.`); }
  };

  /* El Data Package: format, versió, arrel, municipi i instant. */
  const datapackage = jsonEstricte(text('data/datapackage.json'), 'datapackage.json');
  const sdp = datapackage.socdepoble;
  if (!esObjecte(sdp) || sdp.format !== FORMAT_DADES_OBERTES) throw invalid(`no és un paquet ${FORMAT_DADES_OBERTES}.`);
  const versio = sdp.schemaVersion ?? sdp.versio;
  if (!VERSIONS_LLEGIBLES.includes(versio)) throw invalid(`versió del format no admesa: ${String(versio).slice(0, 20)}.`);
  if (sdp.versio !== versio || (versio === '1.0.0' ? sdp.schemaVersion !== undefined : sdp.schemaVersion !== versio)) {
    throw invalid('schemaVersion i versio no quadren amb la versió del format.');
  }
  if (sdp.municipi !== slug || datapackage.name !== arrel) throw invalid('el municipi del Data Package no és el de l’arrel.');
  const ara = typeof datapackage.created === 'string' && dataIso(datapackage.created) === datapackage.created ? datapackage.created : null;
  if (!ara) throw invalid('datapackage.json no porta l’instant de l’exportació.');
  const font = Array.isArray(datapackage.sources) ? datapackage.sources[0] : null;
  let origen = null;
  if (font?.path !== undefined) {
    try { origen = normalitzaOrigen(font.path); } catch { origen = null; }
    if (origen !== font.path) throw invalid('l’origen del Data Package no és cap origen https.');
  }
  const bagInfo = text('bag-info.txt').split('\n');
  if (!bagInfo.includes(`External-Identifier: ${arrel}`) || !bagInfo.includes(`Bagging-Date: ${ara.slice(0, 10)}`)) {
    throw invalid('bag-info.txt no és el d’este paquet.');
  }

  /* Els fitxers de data/ que admet cada versió. */
  const dades = [...fitxers.keys()].filter((cami) => cami.startsWith('data/')).map((cami) => cami.slice('data/'.length));
  for (const nom of OBLIGATORIS) if (!dades.includes(nom)) throw invalid(`falta data/${nom}.`);
  for (const nom of dades) {
    const admes = OBLIGATORIS.includes(nom) || nom === 'activitystreams.json' || (nom === 'agenda.ics' && versio !== '1.0.0')
      || ((nom === 'memoria-oral.jsonld' || nom.startsWith('okf/')) && versio === '1.2.0');
    if (!admes) throw invalid(`data/${nom} no és de la versió ${versio} del format.`);
  }

  /* El municipi. */
  const node = jsonEstricte(text('data/municipi.jsonld'), 'municipi.jsonld');
  exigixClaus(node, ['@context', '@type', '@id', 'identifier', 'name', 'description', 'url', 'sameAs', 'subjectOf', 'geo'], 'municipi.jsonld');
  if (node['@context'] !== SCHEMA || node['@type'] !== 'AdministrativeArea' || node.identifier !== slug || node['@id'] !== referencia('municipi.jsonld', slug)) {
    throw invalid('municipi.jsonld no és el municipi de l’arrel.');
  }
  const nom = textOpcional(node.name, 'municipi.jsonld name');
  if (!nom) throw invalid('municipi.jsonld no porta el nom del municipi.');
  const municipi = { slug, nom };
  const descripcio = textOpcional(node.description, 'municipi.jsonld description');
  if (descripcio !== undefined) municipi.descripcio = descripcio;
  if (node.sameAs !== undefined) {
    const wikidata = Array.isArray(node.sameAs) && node.sameAs.length === 1 && typeof node.sameAs[0] === 'string' ? WIKIDATA.exec(node.sameAs[0]) : null;
    if (!wikidata) throw invalid('municipi.jsonld sameAs només pot ser l’entitat de Wikidata.');
    municipi.wikidata = wikidata[1];
  }
  if (node.geo !== undefined) {
    exigixClaus(node.geo, ['@type', 'latitude', 'longitude'], 'municipi.jsonld geo');
    if (node.geo['@type'] !== 'GeoCoordinates' || !Number.isFinite(node.geo.latitude) || !Number.isFinite(node.geo.longitude)) throw invalid('municipi.jsonld geo invàlid.');
    Object.assign(municipi, { lat: node.geo.latitude, lng: node.geo.longitude });
  }
  /* L'actor federat: el comprova la regeneració (url i subjectOf de urlsDeMunicipi). */
  const actorsPublicats = node.url !== undefined || node.subjectOf !== undefined ? [slug] : [];

  const grafDe = (cami) => {
    const graf = jsonEstricte(text(cami), cami.slice('data/'.length));
    if (!esObjecte(graf) || Object.keys(graf).length !== 2 || graf['@context'] !== SCHEMA || !Array.isArray(graf['@graph'])) {
      throw invalid(`${cami} no és un graf de schema.org.`);
    }
    return graf['@graph'];
  };
  /* L'identificador d'un node, únic dins del seu fitxer, amb el seu @id. */
  const identificadors = (fitxer) => {
    const vistos = new Set();
    return (node, on) => {
      const id = node.identifier;
      if (typeof id !== 'string' || !ID.test(id) || node['@id'] !== referencia(fitxer, id)) throw invalid(`${on}: identificador o @id invàlid.`);
      if (vistos.has(id)) throw invalid(`${on}: identificador repetit.`);
      vistos.add(id);
      return id;
    };
  };

  /* El directori. */
  const directori = grafDe('data/directori.jsonld');
  const idDelDirectori = identificadors('directori.jsonld');
  const ubicacio = referencia('municipi.jsonld', slug);
  const entitats = [];
  const perRef = new Map();
  for (const [n, node] of directori.entries()) {
    const on = `directori.jsonld[${n}]`;
    exigixClaus(node, ['@type', '@id', 'identifier', 'alternateName', 'name', 'slogan', 'description', 'logo', 'image', 'location',
      'parentOrganization', 'subjectOf'], on);
    if (node['@type'] !== 'Organization' && node['@type'] !== 'LocalBusiness') throw invalid(`${on}: tipus no admés.`);
    const id = idDelDirectori(node, on);
    exigixClaus(node.location, ['@id'], `${on} location`);
    if (node.location['@id'] !== ubicacio) throw invalid(`${on}: no és d’este municipi.`);
    const fitxa = fitxaDe(node.subjectOf, ['license', 'copyrightNotice'], `${on} subjectOf`);
    perRef.set(node['@id'], id);
    entitats.push({ node, fila: fila({
      id, slug: textOpcional(node.alternateName, `${on} alternateName`), name: textOpcional(node.name, `${on} name`),
      kind: node['@type'] === 'LocalBusiness' ? 'company' : 'entity', lema: textOpcional(node.slogan, `${on} slogan`),
      description: textOpcional(node.description, `${on} description`), logo_url: textOpcional(node.logo, `${on} logo`),
      hero_url: textOpcional(node.image, `${on} image`), copyright: fitxa.copyrightNotice, town_name: nom, visibility: 'public'
    }) });
  }
  for (const [n, { node, fila: entitat }] of entitats.entries()) {
    if (node.parentOrganization === undefined) continue;
    exigixClaus(node.parentOrganization, ['@id'], `directori.jsonld[${n}] parentOrganization`);
    const pare = perRef.get(node.parentOrganization['@id']);
    if (pare === undefined || pare === entitat.id) throw invalid(`directori.jsonld[${n}]: l’entitat mare no és al directori.`);
    entitat.parent_organization_id = pare;
  }
  const entitatsPerId = new Map(entitats.map(({ node, fila: entitat }) => [entitat.id, { nom: entitat.name, tipus: node['@type'] }]));

  /* Qui signa: una entitat del directori (amb @id) o, d'un altre poble, un signant amb nom i sense @id. */
  const signants = new Map();
  const autorDe = (autor, on) => {
    exigixClaus(autor, ['@type', '@id', 'identifier', 'name'], on);
    const id = autor.identifier;
    if ((autor['@type'] !== 'Organization' && autor['@type'] !== 'LocalBusiness') || typeof id !== 'string' || !ID.test(id)) throw invalid(`${on}: autoria invàlida.`);
    const delDirectori = entitatsPerId.get(id);
    if (autor['@id'] !== undefined || delDirectori) {
      if (!delDirectori || autor['@id'] !== referencia('directori.jsonld', id) || autor.name !== delDirectori.nom || autor['@type'] !== delDirectori.tipus) {
        throw invalid(`${on}: l’autoria no és la de l’entitat del directori.`);
      }
      return id;
    }
    if (autor.name !== undefined) {
      const signant = { id, name: textOpcional(autor.name, `${on} name`), kind: autor['@type'] === 'LocalBusiness' ? 'company' : 'entity' };
      const previ = signants.get(id);
      if (previ && (previ.name !== signant.name || previ.kind !== signant.kind)) throw invalid(`${on}: la mateixa entitat signa amb dos noms.`);
      signants.set(id, signant);
    }
    return id;
  };

  /* Notícies. */
  const idNoticia = identificadors('noticies.jsonld');
  const noticies = grafDe('data/noticies.jsonld').map((node, n) => {
    const on = `noticies.jsonld[${n}]`;
    exigixClaus(node, ['@type', '@id', 'identifier', 'headline', 'alternativeHeadline', 'abstract', 'articleBody', 'datePublished',
      'dateModified', 'image', 'author', 'license', 'copyrightNotice'], on);
    if (node['@type'] !== 'NewsArticle') throw invalid(`${on}: tipus no admés.`);
    return fila({
      id: idNoticia(node, on), title: textOpcional(node.headline, `${on} headline`), subtitle: textOpcional(node.alternativeHeadline, `${on} alternativeHeadline`),
      entradilla: textOpcional(node.abstract, `${on} abstract`), body: textOpcional(node.articleBody, `${on} articleBody`),
      created_at: textOpcional(node.datePublished, `${on} datePublished`), updated_at: textOpcional(node.dateModified, `${on} dateModified`),
      image_url: textOpcional(node.image, `${on} image`), author_org_id: autorDe(node.author, `${on} author`), poble_id: slug,
      copyright: textOpcional(node.copyrightNotice, `${on} copyrightNotice`), visibility: 'public'
    });
  });

  /* Agenda. L'endDate d'un dia és l'últim dia inclòs (1.1.0 i 1.2.0) o la fi exclusiva (1.0.0). */
  const idActe = identificadors('agenda.jsonld');
  const agenda = grafDe('data/agenda.jsonld').map((node, n) => {
    const on = `agenda.jsonld[${n}]`;
    exigixClaus(node, ['@type', '@id', 'identifier', 'name', 'disambiguatingDescription', 'description', 'startDate', 'endDate', 'location',
      'image', 'organizer', 'subjectOf'], on);
    if (node['@type'] !== 'Event') throw invalid(`${on}: tipus no admés.`);
    let lloc;
    if (node.location !== undefined) {
      exigixClaus(node.location, ['@type', 'name'], `${on} location`);
      if (node.location['@type'] !== 'Place') throw invalid(`${on}: el lloc ha de ser un Place.`);
      lloc = textOpcional(node.location.name, `${on} location.name`);
    }
    const fi = textOpcional(node.endDate, `${on} endDate`);
    const fitxa = fitxaDe(node.subjectOf, ['datePublished', 'dateModified', 'license', 'copyrightNotice'], `${on} subjectOf`);
    return fila({
      id: idActe(node, on), title: textOpcional(node.name, `${on} name`), subtitle: textOpcional(node.disambiguatingDescription, `${on} disambiguatingDescription`),
      entradilla: textOpcional(node.description, `${on} description`), inici: textOpcional(node.startDate, `${on} startDate`),
      fi: fi !== undefined && DIA.test(fi) && versio !== '1.0.0' ? diaSeguent(fi) : fi, location: lloc,
      image_url: textOpcional(node.image, `${on} image`), author_org_id: autorDe(node.organizer, `${on} organizer`), poble_id: slug,
      copyright: fitxa.copyrightNotice, created_at: fitxa.datePublished, updated_at: fitxa.dateModified, visibility: 'public'
    });
  });

  /* Memòria cultural. */
  const idMemoria = identificadors('memoria-cultural.jsonld');
  const memoria = grafDe('data/memoria-cultural.jsonld').map((node, n) => {
    const on = `memoria-cultural.jsonld[${n}]`;
    exigixClaus(node, ['@type', '@id', 'identifier', 'name', 'abstract', 'text', 'datePublished', 'dateModified', 'image', 'author', 'license',
      'copyrightNotice'], on);
    if (node['@type'] !== 'CreativeWork') throw invalid(`${on}: tipus no admés.`);
    return fila({
      id: idMemoria(node, on), title: textOpcional(node.name, `${on} name`), entradilla: textOpcional(node.abstract, `${on} abstract`),
      text: textOpcional(node.text, `${on} text`), created_at: textOpcional(node.datePublished, `${on} datePublished`),
      updated_at: textOpcional(node.dateModified, `${on} dateModified`), image_url: textOpcional(node.image, `${on} image`),
      author_org_id: autorDe(node.author, `${on} author`), poble_id: slug, copyright: textOpcional(node.copyrightNotice, `${on} copyrightNotice`),
      visibility: 'public'
    });
  });

  /* Memòria oral (1.2.0): el node i la seua fitxa OKF, tots o cap. */
  const memoriaOral = [];
  const okfDelPaquet = dades.filter((nomFitxer) => nomFitxer.startsWith('okf/')).sort();
  if (dades.includes('memoria-oral.jsonld')) {
    const idOral = identificadors('memoria-oral.jsonld');
    const graf = grafDe('data/memoria-oral.jsonld');
    if (!graf.length) throw invalid('memoria-oral.jsonld sense cap fitxa.');
    const esperats = ['okf/index.md', 'okf/log.md'];
    for (const [n, node] of graf.entries()) {
      const on = `memoria-oral.jsonld[${n}]`;
      exigixClaus(node, ['@type', '@id', 'identifier', 'name', 'abstract', 'genre', 'keywords', 'creativeWorkStatus', 'contentLocation', 'url',
        'encodingFormat', 'datePublished', 'dateModified', 'author', 'license', 'copyrightNotice'], on);
      if (node['@type'] !== 'CreativeWork' || typeof node.url !== 'string' || !node.url.startsWith('okf/')) throw invalid(`${on}: tipus o url no admesos.`);
      const cami = node.url.slice('okf/'.length);
      if (!CAMI_OKF.test(cami) || !dades.includes(node.url)) throw invalid(`${on}: la fitxa OKF no és al paquet.`);
      esperats.push(node.url);
      const okf = llegeixFitxaOkf(text(`data/${node.url}`), node.url);
      memoriaOral.push(fila({
        id: idOral(node, on), okf: { cami, frontmatter: okf.frontmatter, cos: okf.cos }, author_org_id: autorDe(node.author, `${on} author`),
        copyright: textOpcional(node.copyrightNotice, `${on} copyrightNotice`), created_at: textOpcional(node.datePublished, `${on} datePublished`),
        updated_at: textOpcional(node.dateModified, `${on} dateModified`), visibility: 'public'
      }));
    }
    if (esperats.sort().join('\n') !== okfDelPaquet.join('\n')) throw invalid('els fitxers d’okf/ no són exactament els de les fitxes, l’índex i el registre.');
  } else if (okfDelPaquet.length) {
    throw invalid('fitxers d’okf/ sense memoria-oral.jsonld.');
  }

  /* Els recomptes del Data Package, els de cada graf. */
  const grafs = { noticies, agenda, directori: entitats, memoria, memoriaOral };
  if (!esObjecte(sdp.comptes)) throw invalid('datapackage.json sense comptes.');
  for (const [coleccio, compte] of Object.entries(sdp.comptes)) {
    if (!COMPTES.includes(coleccio) || compte !== grafs[coleccio].length) throw invalid(`comptes.${coleccio.slice(0, 40)} no quadra amb el graf.`);
  }
  for (const coleccio of ['noticies', 'agenda', 'directori', 'memoria']) {
    if (!Object.hasOwn(sdp.comptes, coleccio)) throw invalid(`falta comptes.${coleccio}.`);
  }

  /* La configuració: es valida, no es restaura. */
  const configuracio = jsonEstricte(text('data/configuracio.json'), 'configuracio.json');
  exigixClaus(configuracio, ['format', 'municipi', 'personalitzacio'], 'configuracio.json');
  exigixClaus(configuracio.municipi, ['slug', 'nom'], 'configuracio.json municipi');
  if (configuracio.format !== FORMAT_DADES_OBERTES || configuracio.municipi.slug !== slug || configuracio.municipi.nom !== nom) {
    throw invalid('configuracio.json no és d’este municipi.');
  }
  const personalitzacio = configuracio.personalitzacio;
  exigixClaus(personalitzacio, ['taxonomia', 'estil'], 'configuracio.json personalitzacio');
  for (const [clau, valida] of [['taxonomia', validaTaxonomia], ['estil', validaEstil]]) {
    if (personalitzacio[clau] === undefined) continue;
    exigixClaus(personalitzacio[clau], ['payload', 'versio'], `configuracio.json ${clau}`);
    const { payload, versio: versioDesada } = personalitzacio[clau];
    if (!esObjecte(payload) || valida(payload).length || (versioDesada !== undefined && !(Number.isSafeInteger(versioDesada) && versioDesada >= 0))) {
      throw invalid(`configuracio.json: ${clau} no és vàlida.`);
    }
  }

  /* L'outbox federat: es valida (la regeneració el compara), no es restaura. */
  let activityStreams = null;
  if (dades.includes('activitystreams.json')) {
    const outbox = jsonEstricte(text('data/activitystreams.json'), 'activitystreams.json');
    const urls = origen && actorsPublicats.length ? urlsDeMunicipi(slug, { origen }) : null;
    if (!urls || outbox['@context'] !== CONTEXT_AS || outbox.id !== urls.outbox || outbox.type !== 'OrderedCollection'
      || !Array.isArray(outbox.orderedItems) || outbox.totalItems !== outbox.orderedItems.length
      || outbox.orderedItems.some((a) => a?.type !== 'Create' || a.actor !== urls.actor || !a.to?.includes?.(PUBLIC)
        || a.object?.attributedTo !== urls.actor || !a.object?.to?.includes?.(PUBLIC))) {
      throw invalid('activitystreams.json no és l’outbox públic del municipi.');
    }
    activityStreams = outbox;
  }

  const lot = {
    format: FORMAT_LOT,
    versio,
    municipi,
    entitats: entitats.map(({ fila: entitat }) => entitat),
    noticies,
    agenda,
    memoria,
    memoriaOral
  };
  const falles = validaLotDadesObertes(lot);
  if (falles.length) throw invalid(`el lot no és restaurable: ${falles.slice(0, 5).join('; ')}.`);

  /* La regeneració canònica: el generador, amb este lot, ha de tornar els mateixos bytes. */
  const regenerat = preparaDadesObertesMunicipi({
    municipi, ara, ...(origen ? { origen } : {}), actorsPublicats,
    entitats: [...lot.entitats, ...signants.values()],
    noticies, agenda, memoria,
    ...(memoriaOral.length ? { memoriaOral } : {}),
    ...(activityStreams ? { activityStreams } : {})
  });
  const comparable = (nomFitxer) => nomFitxer.endsWith('.jsonld') || nomFitxer === 'llicencies.md' || nomFitxer === 'activitystreams.json'
    || nomFitxer.startsWith('okf/') || (nomFitxer === 'agenda.ics' && versio === VERSIO_FORMAT);
  const generats = new Map(regenerat.fitxers.filter((f) => comparable(f.nom)).map((f) => [f.nom, f.text]));
  const delPaquet = dades.filter(comparable);
  if (generats.size !== delPaquet.length || delPaquet.some((nomFitxer) => !generats.has(nomFitxer))) {
    throw invalid('els fitxers de dades no són els que el generador escriu per a este lot.');
  }
  for (const nomFitxer of delPaquet) {
    const esperat = bytesDeLaVersio(nomFitxer, generats.get(nomFitxer), versio, { nom, agenda });
    if (esperat !== text(`data/${nomFitxer}`)) throw invalid(`data/${nomFitxer} no és canònic (el generador no escriu eixos bytes).`);
  }

  return {
    slug, arrel, versio, sha256, ara, origen, municipi, actorsPublicats, lot,
    personalitzacio, activityStreams,
    comptes: { ...sdp.comptes }, calendari: calendariDelPaquet(sdp.calendari), omissions: omissionsDelPaquet(sdp.omissions),
    pendents: fontsPendents(text('data/memoria.md'))
  };
}

/* Gauntlet SEG-06 · Les dues claus informatives del Data Package, amb la forma
   que escriu l'exportador (exportaMunicipiOpenData.js · datapackage.socdepoble),
   mai com a JSON arbitrari: comptadors enters ≥ 0 i cap clau fora de lloc. */
const esComptador = (valor) => Number.isSafeInteger(valor) && valor >= 0;
const CLAUS_CALENDARI = Object.freeze(['actes', 'senseInici', 'foraDAbast']);
const CLAUS_OMISSIONS = Object.freeze([...COMPTES, 'configuracio']);

/* null (sense cap acte, o la 1.0.0) o { actes, senseInici, foraDAbast }. */
function calendariDelPaquet(calendari) {
  if (calendari === undefined || calendari === null) return null;
  if (!esObjecte(calendari) || Object.keys(calendari).length !== CLAUS_CALENDARI.length
    || CLAUS_CALENDARI.some((clau) => !Object.hasOwn(calendari, clau) || !esComptador(calendari[clau]))) {
    throw invalid('datapackage.json calendari invàlid.');
  }
  return Object.fromEntries(CLAUS_CALENDARI.map((clau) => [clau, calendari[clau]]));
}

/* { col·lecció: { motiu: n } }, amb les col·leccions dels comptes i la configuració. */
function omissionsDelPaquet(omissions) {
  if (omissions === undefined || omissions === null) return {};
  const bona = esObjecte(omissions) && Object.entries(omissions).every(([clau, motius]) => CLAUS_OMISSIONS.includes(clau)
    && esObjecte(motius) && Object.values(motius).every(esComptador));
  if (!bona) throw invalid('datapackage.json omissions invàlides.');
  return structuredClone(omissions);
}

/* Les fonts pendents de memoria.md, informatives i tolerants: [{ coleccio, motiu }]. */
function fontsPendents(memoria) {
  const seccio = memoria.split('\n## Fonts pendents\n')[1]?.split('\n## ')[0] ?? '';
  const noms = Object.entries(NOMS_DE_PENDENT);
  return seccio.split('\n').flatMap((linia) => {
    const trobat = noms.find(([, nomDeFont]) => linia.startsWith(`- ${nomDeFont}: `));
    return trobat ? [{ coleccio: trobat[0], motiu: linia.slice(`- ${trobat[1]}: `.length).replace(/\.$/, '') }] : [];
  });
}

/* ── Restauració ───────────────────────────────────────────────────────── */

const cancelacio = () => new DOMException('Operació cancel·lada.', 'AbortError');
const NO_RESTAURAT = Object.freeze([
  Object.freeze({ coleccio: 'configuracio', motiu: "la personalització és de tot el node, no d'un poble: es valida però no es restaura" }),
  Object.freeze({ coleccio: 'activitystreams', motiu: "l'outbox federat el publica el build del lloc web, no el servidor de dades" }),
  Object.freeze({ coleccio: 'mitjans', motiu: 'les imatges no viatgen dins del paquet: les referències queden com a enllaços' })
]);

function exigixInforme(informe) {
  const bo = esObjecte(informe) && ['creats', 'actualitzats', 'iguals'].every((clau) => esObjecte(informe[clau])
    && COLECCIONS_DEL_LOT.every((coleccio) => Number.isSafeInteger(informe[clau][coleccio]) && informe[clau][coleccio] >= 0));
  if (!bo) throw new TypeError('restauraDadesObertes no ha tornat { creats, actualitzats, iguals }.');
  return informe;
}

/**
 * Restaura un paquet Open Data en el servidor de dades del port: el llig i el
 * verifica sencer (llegeixPaquetOpenData) i només després crida una vegada
 * port.restauraDadesObertes(lot), que és atòmica i idempotent. Un servidor
 * sense la capacitat 'restauracioDadesObertes' rebutja amb `code`
 * 'sense-capacitat' sense llegir res; un senyal avortat, amb AbortError.
 * @returns {Promise<{ slug, versio, sha256, integritat, autenticitat, comptes, restauracio, noRestaurat }>}
 */
export async function importaMunicipiOpenData(zip, port, { subtle = globalThis.crypto?.subtle, maxEixida = MAXIM_PAQUET, sha256Esperat, config = {}, signal } = {}) {
  if (!port || typeof port.teCapacitat !== 'function') throw new TypeError('Cal el port de dades (backendPort).');
  if (!port.teCapacitat('restauracioDadesObertes') || typeof port.restauraDadesObertes !== 'function') {
    throw Object.assign(new Error('Este servidor de dades no pot restaurar paquets de dades obertes.'), { code: 'sense-capacitat' });
  }
  if (signal?.aborted) throw cancelacio();
  const llegit = await llegeixPaquetOpenData(zip, { subtle, maxEixida, sha256Esperat });
  if (signal?.aborted) throw cancelacio();
  const restauracio = exigixInforme(await port.restauraDadesObertes(llegit.lot, { ...config, signal }));
  return {
    slug: llegit.slug,
    versio: llegit.versio,
    sha256: llegit.sha256,
    integritat: 'sha256-verificada',
    /* El SHA-256 prova que els bytes no han canviat, no qui els ha fet. */
    autenticitat: sha256Esperat ? 'sha256-esperat-coincidix' : 'no-verificada',
    comptes: llegit.comptes,
    restauracio,
    noRestaurat: NO_RESTAURAT.map((element) => ({ ...element }))
  };
}
