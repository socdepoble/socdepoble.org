/**
 * blocsTraduibles.js — Els blocs de text d'una pàgina, per al Traductor
 * Sobirà (ordre del Mestre, 260930 · via B).
 *
 * Es traduïx TEXT, mai HTML (contracte D1 amb Codex, format 'text'): el
 * servidor compta 5000 caràcters per petició, marcatge inclòs, i cada text
 * es guarda a la seua memòria cau per separat. Per això es recullen els
 * blocs de lectura de l'article (títols, paràgrafs, elements de llista,
 * cites, cel·les…) com a parelles { etiqueta, text }, i la pàgina traduïda
 * es torna a pintar amb elements de React: cap cadena del servidor entra a
 * l'arbre com a HTML.
 *  · Només el bloc més extern: un <li> amb un <p> dins és un sol bloc. C5
 *    (Codex 261030): els <li> d'una llista niuada dins d'un <li> són blocs
 *    propis (`llista.dins`, l'índex del bloc del <li> pare), i un <br> o la
 *    vora d'un bloc intern posen un espai entre els textos.
 *  · Gauntlet 261030 (cicle 4, c5-llistes-niuades-aplanades-consagrades) ·
 *    «Si un bloc no es pot reconstruir fidelment, es queda en l'original»
 *    (C5): un <li> amb text DESPRÉS de la seua llista niuada, o un bloc amb
 *    una llista que no penja directament d'un <li> (una cita, una cel·la),
 *    porta `arbre` (l'estructura de l'original, amb el seu ordre) i no
 *    s'envia al motor; CosTraduit el pinta tal qual, amb el lang de
 *    l'original. Abans el text de després pujava davant de la subllista i la
 *    llista de dins d'una cita s'aplanava («Cita u dos»).
 *  · Fora: controls (botons, camps), el que no es veu o només llig el lector
 *    (aria-hidden, hidden, sr-only, display:none, visibility:hidden) i tot el
 *    contingut editable (contenteditable buit, «true» o «plaintext-only»).
 *  · Un h1 del cos baixa a h2: l'h1 és del títol de la pàgina (Pedra Seca §4).
 *
 * Correcció final del torn 260930 (avís de Codex en plegar): el filtre
 * s'aplica també DINS de cada bloc. Abans el text es prenia amb
 * textContent, que arrossega tots els descendents, i un fill ocult, de
 * lector, un botó o un tros editable dins d'un paràgraf visible s'enviava a
 * traduir (i es gastava pressupost); l'ocultació per CSS no es mirava mai.
 * Ara un TreeWalker recorre els nodes de text del bloc i talla els
 * subarbres exclosos.
 *
 * L'arrel mateixa no compta: mentres es veu una traducció, l'article
 * original està amagat (hidden, o per CSS) i continua sent la font.
 *
 * C4 (Codex 261030) i decisió del Mestre (261030 §3) · La traducció conserva
 * l'estructura de l'original: cada <li> diu de quina llista és (`llista`:
 * ol o ul, i el seu `start`), i un bloc amb enllaços, negretes, cursives o
 * codi porta `peces`: trossos de text amb les seues marques, preses de
 * l'arbre ORIGINAL (un enllaç només amb un href intern o https). Per a
 * traduir-lo, preparaTraduccio fa un HTML LOCAL sense cap atribut de
 * l'original (només data-sdp, l'índex de la marca, i el codi buit, que no es
 * traduïx) o, per a un motor sense HTML (MyMemory), el partix pels enllaços.
 * En tornar, es llig la resposta com a text i marques conegudes: el href, la
 * finestra i el codi tornen de l'original; cap HTML del proveïdor entra mai
 * al DOM. Apertium trau una paraula de l'etiqueta quan traduïx una locució
 * («Bon <strong>dia</strong>» → «Buen día <strong></strong>», mesura del
 * 261030): la paraula queda fora, però no es perd.
 */
import { caractersDe } from '../../../data/traductor.js';

const SELECTOR_BLOCS = 'h1, h2, h3, h4, h5, h6, p, li, blockquote, dt, dd, figcaption, caption, th, td, summary, legend';
const FORA = [
  'button', 'select', 'textarea', 'input', 'script', 'style', 'template', 'svg',
  '[aria-hidden="true"]', '[hidden]', '.sr-only', '.sdp-sr-only', '.sdp-nomes-lector',
  /* Tot el que és editable: l'atribut sense valor també ho és, i una illa
     contenteditable="false" dins d'un editor continua sent part de l'editor
     (closest() la troba pel pare). */
  '[contenteditable]:not([contenteditable="false"])',
  /* T7 (ordre del Mestre, 261004) · Les targetes incrustades al cos són
     objectes d'altres pàgines, no text d'esta: es queden fora del Traductor
     (CosTraduit les tornaria a pintar com a paràgrafs solts). */
  '.sdp-targetes',
  /* Gauntlet 261030 (cicle 2, traduir-correu-a-registre) · L'atribut
     estàndard translate="no": el que el porta (un correu, un identificador)
     no ix mai cap al motor, com no el traduïx el traductor del navegador. */
  '[translate="no"]'
].join(', ');
const TITOLS = new Set(['h2', 'h3', 'h4', 'h5', 'h6']);
const INVISIBLE = new Set(['hidden', 'collapse']);

/* Un sostre de seguretat: una pàgina amb més blocs no és una pàgina de lectura. */
export const MAX_BLOCS = 400;

function etiquetaDe(element) {
  const etiqueta = element.tagName.toLowerCase();
  if (etiqueta === 'h1') return 'h2';
  if (TITOLS.has(etiqueta) || etiqueta === 'li' || etiqueta === 'blockquote') return etiqueta;
  return 'p';
}

/* L'estil calculat d'un element, o null fora d'un document amb finestra (cap
   estil que llegir: només manen els atributs i les classes de FORA). */
function estilDe(element) {
  const vista = element.ownerDocument?.defaultView;
  if (!vista?.getComputedStyle) return null;
  try { return vista.getComputedStyle(element); } catch { return null; }
}

/* display:none és de l'element mateix (no s'hereta): tot el seu subarbre
   desapareix. */
const senseDisplay = (element) => estilDe(element)?.display === 'none';

/* Fora per atribut, classe o display, sense comptar l'arrel. */
const exclos = (element, arrel) => element !== arrel && (element.matches(FORA) || senseDisplay(element));

/* Un avantpassat del bloc (entre el bloc i l'arrel, l'arrel no inclosa) el
   deixa fora. */
function dinsDeFora(element, arrel) {
  for (let node = element; node && node !== arrel; node = node.parentElement) {
    if (exclos(node, arrel)) return true;
  }
  return false;
}

/* La visibilitat s'hereta, però un fill `visibility: visible` dins d'un pare
   amagat es torna a vore. Es mira respecte de l'arrel: l'element que fixa el
   valor és el més proper (entre este i l'arrel) que canvia respecte del seu
   pare; si cap no canvia, el valor ve de l'arrel o de més amunt i no compta. */
function invisibleDinsDe(element, arrel) {
  for (let node = element; node && node !== arrel; node = node.parentElement) {
    const propi = estilDe(node)?.visibility;
    if (!propi) return false;
    const pare = node.parentElement;
    const delPare = pare && pare !== arrel ? estilDe(pare)?.visibility : null;
    if (pare === arrel || propi !== delPare) {
      /* Just davall de l'arrel, el valor només compta si el fixa este node
         (és diferent del de l'arrel). */
      if (pare === arrel && propi === estilDe(arrel)?.visibility) return false;
      return INVISIBLE.has(propi);
    }
  }
  return false;
}

/* C4 · Les marques en línia que es conserven. */
const EN_LINIA = new Set(['a', 'strong', 'b', 'em', 'i', 'code']);

/* C5 (Codex 261030) · Les etiquetes de bloc de dins d'un bloc: on comença o
   acaba una, el text de fora i el de dins no s'ajunten («<p>Primer</p><p>
   Segon</p>» dins d'un <li> és «Primer Segon», no «PrimerSegon»). */
const BLOC_INTERN = new Set([
  'address', 'article', 'aside', 'blockquote', 'caption', 'dd', 'details', 'div', 'dl', 'dt', 'fieldset', 'figcaption',
  'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'legend', 'li', 'main', 'nav', 'ol', 'p',
  'pre', 'section', 'summary', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'ul'
]);

/* C5 · Una llista (ol, ul) que penja directament d'un <li> (cap altre bloc
   entre tots dos) fa els seus <li> blocs propis: CosTraduit la torna a
   niuar dins del seu element. El text del <li> de fora no l'inclou. */
const esLlistaNiuada = (element, li) => (element.tagName === 'OL' || element.tagName === 'UL')
  && element.parentElement?.closest(SELECTOR_BLOCS) === li;

/* Cicle 4 (c5-llistes-niuades-aplanades-consagrades) · Un node de text dins
   d'una llista que és DINS del bloc (la llista del bloc mateix, la del <li>,
   és fora). */
function dinsDUnaLlistaDe(node, bloc) {
  const llista = node.parentElement?.closest('ol, ul');
  return Boolean(llista && llista !== bloc && bloc.contains(llista));
}

/* L'estructura d'un bloc que no es pot reconstruir (C5), per a pintar-lo
   tal qual a la vista traduïda: el text visible i, de cada element, només
   les etiquetes d'ARBRE (la resta de blocs interns, un <div>; la resta
   d'etiquetes en línia, només el seu contingut). Res del que no es veu ni
   dels subarbres exclosos; cap atribut de l'original llevat d'un href segur,
   la finestra nova i el `start` d'una <ol>. */
const ARBRE = new Set(['p', 'ul', 'ol', 'li', 'blockquote', 'strong', 'b', 'em', 'i', 'code', 'a', 'br']);
function arbreDe(element, arrel) {
  const fills = [];
  for (const fill of element.childNodes) {
    if (fill.nodeType === 3) {
      if (fill.nodeValue && !invisibleDinsDe(element, arrel)) fills.push(fill.nodeValue);
      continue;
    }
    if (fill.nodeType !== 1 || exclos(fill, arrel)) continue;
    const etiqueta = fill.tagName.toLowerCase();
    if (etiqueta === 'br') {
      if (!invisibleDinsDe(fill, arrel)) fills.push({ etiqueta });
      continue;
    }
    if (etiqueta === 'hr') continue;
    const interiors = arbreDe(fill, arrel);
    const href = etiqueta === 'a' ? hrefSegur(fill.getAttribute('href')) : null;
    if (etiqueta === 'a' && !href) {
      fills.push(...interiors);
    } else if (ARBRE.has(etiqueta)) {
      const node = { etiqueta, fills: interiors };
      if (href) {
        node.href = href;
        if (fill.getAttribute('target') === '_blank') node.novaFinestra = true;
      }
      const inici = etiqueta === 'ol' && fill.hasAttribute('start') ? Number(fill.getAttribute('start')) : NaN;
      if (Number.isInteger(inici)) node.inici = inici;
      fills.push(node);
    } else if (BLOC_INTERN.has(etiqueta)) {
      fills.push({ etiqueta: 'div', fills: interiors });
    } else {
      fills.push(...interiors);
    }
  }
  return fills;
}

/**
 * El href d'un enllaç de l'original si és segur de tornar a pintar: un camí
 * de l'app ('/…', mai '//host' ni '/\host'), una consulta ('?…'), un
 * fragment ('#…') o una URL https sense credencials. Res amb espais ni
 * caràcters de control (el navegador els lleva i '/\n/host' acabaria fora).
 */
export function hrefSegur(href) {
  if (typeof href !== 'string') return null;
  const adreca = href.trim();
  const controlOEspai = (car) => car.codePointAt(0) < 0x21 || car.codePointAt(0) === 0x7f || /\s/.test(car);
  if (!adreca || Array.from(adreca).some(controlOEspai)) return null;
  if (/^\/(?![/\\])/.test(adreca) || adreca.startsWith('#') || adreca.startsWith('?')) return adreca;
  try {
    const url = new URL(adreca);
    return url.protocol === 'https:' && !url.username && !url.password ? adreca : null;
  } catch {
    return null;
  }
}

/* El text visible d'un bloc com a peces: només els nodes de text que no
   cauen dins d'un subarbre exclòs ni són invisibles (mateixa concatenació
   que textContent), cada un amb les marques en línia que el porten, de fora
   cap a dins. Un mateix element és una mateixa marca (el mateix objecte).
   C5 (Codex 261030) · Un <br>, una vora d'un bloc intern (BLOC_INTERN) o
   una llista niuada que se'n va a part posen un espai entre els dos textos
   (amb les marques que tots dos comparteixen): «Bon<br>dia» és «Bon dia». */
function pecesVisibles(bloc, arrel, estat = {}) {
  const document_ = bloc.ownerDocument;
  const Filtre = document_.defaultView?.NodeFilter || globalThis.NodeFilter;
  if (!document_?.createTreeWalker || !Filtre) return [{ text: bloc.textContent || '', marques: [] }];
  const esLi = bloc.tagName === 'LI';
  let separa = false;
  /* Cicle 4 (c5-llistes-niuades-aplanades-consagrades) · Una llista niuada
     visible ja passada: el text visible de després no es pot tornar a posar
     al seu lloc (CosTraduit pinta el text i després la llista). */
  let llistaPassada = false;
  const caminant = document_.createTreeWalker(bloc, Filtre.SHOW_ELEMENT | Filtre.SHOW_TEXT, {
    acceptNode(node) {
      if (node.nodeType === 1) {
        const etiqueta = node.tagName.toLowerCase();
        if (etiqueta === 'br' || BLOC_INTERN.has(etiqueta)) separa = true;
        if (esLi && esLlistaNiuada(node, bloc)) {
          if (!exclos(node, arrel)) llistaPassada = true;
          return Filtre.FILTER_REJECT;
        }
        return exclos(node, arrel) ? Filtre.FILTER_REJECT : Filtre.FILTER_SKIP;
      }
      if (invisibleDinsDe(node.parentElement, arrel)) return Filtre.FILTER_REJECT;
      /* C5 · No es pot reconstruir: text després d'una llista niuada, o text
         d'una llista de dins del bloc que no se'n va a part (s'aplanaria). */
      if (/\S/.test(node.nodeValue || '') && (llistaPassada || dinsDUnaLlistaDe(node, bloc))) estat.noFidel = true;
      return Filtre.FILTER_ACCEPT;
    }
  });
  const marques = new Map();
  const marcaDe = (element) => {
    if (marques.has(element)) return marques.get(element);
    const etiqueta = element.tagName.toLowerCase();
    let marca = null;
    if (etiqueta !== 'a') marca = { id: marques.size, etiqueta };
    else {
      const href = hrefSegur(element.getAttribute('href'));
      if (href) marca = { id: marques.size, etiqueta, href, ...(element.getAttribute('target') === '_blank' ? { novaFinestra: true } : {}) };
    }
    marques.set(element, marca);
    return marca;
  };
  const peces = [];
  let anterior = null;
  for (let node = caminant.nextNode(); node; node = caminant.nextNode()) {
    const elements = [];
    let contenidor = bloc;
    for (let element = node.parentElement; element && element !== bloc; element = element.parentElement) {
      const etiqueta = element.tagName.toLowerCase();
      if (EN_LINIA.has(etiqueta)) elements.unshift(element);
      if (contenidor === bloc && BLOC_INTERN.has(etiqueta)) contenidor = element;
    }
    // De fora cap a dins: els índexs van en l'ordre del document.
    const marques = elements.map(marcaDe).filter(Boolean);
    if (anterior && (separa || anterior.contenidor !== contenidor)) {
      let comunes = 0;
      while (comunes < anterior.marques.length && comunes < marques.length && anterior.marques[comunes] === marques[comunes]) comunes += 1;
      peces.push({ text: ' ', marques: marques.slice(0, comunes) });
    }
    separa = false;
    peces.push({ text: node.nodeValue, marques });
    anterior = { contenidor, marques };
  }
  return peces;
}

const mateixesMarques = (a, b) => a.length === b.length && a.every((marca, i) => marca === b[i]);

/* Els espais com els deixava `.replace(/\s+/g, ' ').trim()` sobre el text
   sencer, però peça a peça: el text de les peces ajuntades és exactament el
   del bloc. Les peces buides fora; les veïnes amb les mateixes marques, una. */
function normalitzaPeces(peces) {
  const eixida = [];
  let espaiAbans = true;
  for (const { text, marques } of peces) {
    let net = String(text).replace(/\s+/g, ' ');
    if (espaiAbans && net.startsWith(' ')) net = net.slice(1);
    if (!net) continue;
    espaiAbans = net.endsWith(' ');
    const darrera = eixida[eixida.length - 1];
    if (darrera && mateixesMarques(darrera.marques, marques)) darrera.text += net;
    else eixida.push({ text: net, marques });
  }
  while (eixida.length) {
    const darrera = eixida[eixida.length - 1];
    darrera.text = darrera.text.replace(/ $/, '');
    if (darrera.text) break;
    eixida.pop();
  }
  return eixida;
}

const textDePeces = (peces) => peces.map(({ text }) => text).join('');

/* La llista d'un <li>: ol o ul, la mateixa per a tots els seus elements (un
   índex per llista) i el seu `start`. Sense llista, res. */
function llistaDe(element, llistes) {
  const llista = element.parentElement?.closest('ol, ul');
  if (!llista) return null;
  if (!llistes.has(llista)) llistes.set(llista, llistes.size);
  const tipus = llista.tagName.toLowerCase();
  const inici = tipus === 'ol' && llista.hasAttribute('start') ? Number(llista.getAttribute('start')) : NaN;
  return { tipus, id: llistes.get(llista), ...(Number.isInteger(inici) ? { inici } : {}) };
}

export function blocsTraduibles(arrel) {
  if (!arrel?.querySelectorAll) return [];
  const blocs = [];
  const llistes = new Map();
  /* C5 · Els <li> que són blocs (els de fora i els de les seues llistes
     niuades) i l'índex del bloc de cada un que s'ha emés. */
  const elementsLi = new Set();
  const indexDeLi = new Map();
  for (const element of arrel.querySelectorAll(SELECTOR_BLOCS)) {
    const pare = element.parentElement?.closest(SELECTOR_BLOCS);
    const niuat = Boolean(pare && arrel.contains(pare));
    /* C5 · Un <li> d'una llista que penja d'un <li> que és bloc també és un
       bloc; qualsevol altre bloc de dins d'un bloc, no. */
    if (niuat && !(element.tagName === 'LI' && elementsLi.has(pare))) continue;
    /* Només compta el que és DINS de l'arrel: mentres es veu una traducció,
       l'article original està amagat i continua sent la font. */
    if (dinsDeFora(element, arrel)) continue;
    const estat = {};
    const peces = normalitzaPeces(pecesVisibles(element, arrel, estat));
    const text = textDePeces(peces);
    /* Cicle 4 (c5-llistes-niuades-aplanades-consagrades) · Un bloc que no es
       pot reconstruir porta el seu arbre sencer: les seues llistes no fan
       blocs propis (anirien dues vegades). */
    const noFidel = Boolean(estat.noFidel);
    if (element.tagName === 'LI' && !noFidel) elementsLi.add(element);
    /* C5 · Un <li> sense text propi que porta una llista niuada es queda (buit,
       no s'envia): és on CosTraduit hi torna a posar la llista. */
    const ambLlista = element.tagName === 'LI' && [...element.querySelectorAll('ol, ul')].some((llista) => esLlistaNiuada(llista, element));
    if (!text && !ambLlista) continue;
    /* Una llista no pot anar dins d'un <p>: el bloc no fidel d'una cel·la,
       una definició… es pinta en un <div>. */
    const etiqueta = etiquetaDe(element);
    const bloc = { etiqueta: noFidel && etiqueta === 'p' ? 'div' : etiqueta, text };
    const llista = bloc.etiqueta === 'li' ? llistaDe(element, llistes) : null;
    if (llista && niuat && indexDeLi.has(pare)) llista.dins = indexDeLi.get(pare);
    if (llista) bloc.llista = llista;
    if (element.tagName === 'LI') indexDeLi.set(element, blocs.length);
    /* Gauntlet 261030 (Fase 3, TC3.3; vista-traduida-perd-entradilla) · El
       rol a la capçalera: dins de .page-intro (el subtítol i l'entradilla de
       PageFrame) i l'entradilla mateixa (p.lead). CosTraduit la torna a pintar
       amb la mateixa anatomia; mai cap classe de l'arbre fora d'estes dos. */
    const intro = element.closest('.page-intro');
    if (intro && arrel.contains(intro)) bloc.entrada = true;
    if (bloc.etiqueta === 'p' && element.matches('p.lead')) bloc.entradilla = true;
    if (noFidel) bloc.arbre = arbreDe(element, arrel);
    else if (peces.some(({ marques }) => marques.length)) bloc.peces = peces;
    blocs.push(bloc);
    if (blocs.length >= MAX_BLOCS) break;
  }
  return blocs;
}

/* ── Traducció amb estructura (C4 + decisió §3) ─────────────────────────── */

/* Un bloc HTML més llarg va com a text: no s'ha de partir mai. */
export const MAX_HTML = 4000;

const escapa = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Un bloc amb peces com a HTML LOCAL: les etiquetes de les marques sense cap
 * atribut de l'original, només data-sdp amb el seu índex. El codi va buit:
 * no es traduïx, i en tornar es posa el de l'original.
 */
export function htmlDePeces(peces) {
  let html = '';
  let obertes = [];
  for (const { text, marques } of peces) {
    let comu = 0;
    while (comu < obertes.length && comu < marques.length && obertes[comu] === marques[comu]) comu += 1;
    for (let i = obertes.length - 1; i >= comu; i -= 1) html += `</${obertes[i].etiqueta}>`;
    obertes = obertes.slice(0, comu);
    for (const marca of marques.slice(comu)) {
      html += `<${marca.etiqueta} data-sdp="${marca.id}">`;
      obertes.push(marca);
    }
    if (!obertes.some((marca) => marca.etiqueta === 'code')) html += escapa(text);
  }
  for (let i = obertes.length - 1; i >= 0; i -= 1) html += `</${obertes[i].etiqueta}>`;
  return html;
}

const ETIQUETA_HTML = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^<>]*)>/g;
const BUIDES = new Set(['br', 'hr', 'img', 'wbr', 'input', 'meta', 'link', 'source', 'area', 'col', 'embed', 'track']);
const ENTITATS = Object.freeze({ amp: '&', lt: '<', gt: '>', quot: '"', apos: '\'', nbsp: ' ' });
const desfesEntitats = (text) => text.replace(/&(?:#(\d{1,7})|#x([0-9a-f]{1,6})|([a-z]+));/gi, (entitat, decimal, hexa, nom) => {
  const punt = decimal ? Number(decimal) : hexa ? parseInt(hexa, 16) : null;
  if (punt !== null) return punt > 0 && punt <= 0x10ffff ? String.fromCodePoint(punt) : entitat;
  return ENTITATS[nom.toLowerCase()] ?? entitat;
});

/* C4 (Codex 261030) · L'índex d'una marca: data-sdp amb cometes dobles,
   simples o sense (un motor pot reescriure l'atribut). */
const RE_DATA_SDP = /\sdata-sdp\s*=\s*(?:"(\d+)"|'(\d+)'|(\d+)(?=[\s/]|$))/i;
function idDeMarca(atributs) {
  const trobada = RE_DATA_SDP.exec(` ${atributs}`);
  return trobada ? Number(trobada[1] ?? trobada[2] ?? trobada[3]) : undefined;
}

/**
 * La resposta HTML d'un motor llegida com a TEXT i marques conegudes: una
 * etiqueta només val si porta el data-sdp d'una marca de l'original amb el
 * mateix nom; la marca (href, finestra) és la de l'original. Les etiquetes
 * sense data-sdp no fan res (el seu text es queda). Cap cadena del proveïdor
 * és HTML: les entitats es desfan i el text es pinta com a text.
 * C4 i MITJÀ-03 (Codex i Gemini 261030) · Totes les marques de l'original
 * han de tornar, una vegada cada una i amb la seua etiqueta: una marca que
 * falta (un enllaç sense href), repetida, d'una altra etiqueta, amb un índex
 * que no s'ha enviat, o un codi sense tancar, i el resultat és null (qui
 * crida es queda amb l'original, sense perdre res). El codi de l'original hi
 * va una sola vegada; el que el motor torne dins de l'etiqueta no compta
 * (abans, «<code data-sdp="0">LICENSE</code>» feia «LICENSELICENSE»).
 * Gauntlet 261030 (cicle 4, traduccio-enllac-buit-es-perd-en-silenci) · Un
 * enllaç ha de tornar amb text: «Bon <a>dia</a>» → «Buen día <a></a>» (la
 * locució d'Apertium) perdia l'enllaç en silenci. Ara, null i l'original
 * amb el seu href. Una negreta o una cursiva buida, no: només es perd el
 * format, i la paraula hi és.
 */
export function pecesDeHtml(html, pecesOriginals) {
  if (typeof html !== 'string') return null;
  const perId = new Map();
  /* Cada codi, amb els seus trossos de l'original i les marques de dins
     (`interiors`, que tornen amb ell i no poden aparéixer fora). */
  const codi = new Map();
  const interiors = new Set();
  for (const { text, marques } of pecesOriginals) {
    for (const marca of marques) perId.set(marca.id, marca);
    const posicio = marques.findIndex((marca) => marca.etiqueta === 'code');
    if (posicio < 0) continue;
    const dins = marques.slice(posicio + 1);
    for (const marca of dins) interiors.add(marca);
    if (!codi.has(marques[posicio])) codi.set(marques[posicio], []);
    codi.get(marques[posicio]).push({ text, dins });
  }
  const peces = [];
  const pila = [];
  const vistos = new Set();
  const actives = () => pila.filter((entrada) => entrada.marca).map((entrada) => entrada.marca);
  const dinsDeCodi = () => pila.some((entrada) => entrada.marca?.etiqueta === 'code');
  const afig = (text) => { if (text && !dinsDeCodi()) peces.push({ text, marques: actives() }); };
  let posicio = 0;
  ETIQUETA_HTML.lastIndex = 0;
  for (let trobada = ETIQUETA_HTML.exec(html); trobada; trobada = ETIQUETA_HTML.exec(html)) {
    afig(desfesEntitats(html.slice(posicio, trobada.index)));
    posicio = ETIQUETA_HTML.lastIndex;
    const [, tanca, nom, atributs] = trobada;
    const etiqueta = nom.toLowerCase();
    if (tanca) {
      const index = pila.map((entrada) => entrada.etiqueta).lastIndexOf(etiqueta);
      if (index >= 0) pila.length = index;
      continue;
    }
    if (BUIDES.has(etiqueta) || /\/\s*$/.test(atributs)) {
      if (etiqueta === 'br') afig(' ');
      continue;
    }
    const id = dinsDeCodi() ? undefined : idDeMarca(atributs);
    if (id === undefined) {
      pila.push({ etiqueta, marca: null });
      continue;
    }
    const marca = perId.get(id);
    if (!marca || marca.etiqueta !== etiqueta || vistos.has(marca) || interiors.has(marca)) return null;
    vistos.add(marca);
    pila.push({ etiqueta, marca });
    for (const { text, dins } of codi.get(marca) || []) {
      for (const interior of dins) vistos.add(interior);
      peces.push({ text, marques: [...actives(), ...dins] });
    }
  }
  afig(desfesEntitats(html.slice(posicio)));
  // Un codi sense tancar s'hauria menjat la resta de la traducció.
  if (dinsDeCodi()) return null;
  for (const marca of perId.values()) if (!vistos.has(marca)) return null;
  const netes = normalitzaPeces(peces);
  const ambText = (marca) => netes.some(({ text, marques }) => /\S/.test(text) && marques.includes(marca));
  for (const marca of perId.values()) if (marca.etiqueta === 'a' && !ambText(marca)) return null;
  return netes.length ? netes : null;
}

/* Per a un motor sense HTML: el bloc partit pels enllaços (i el codi, que
   no s'envia). Les negretes i les cursives no hi parteixen el text, que es
   traduïx sencer (una locució partida es traduïx malament). */
function segmentsDe(peces) {
  const segments = [];
  for (const { text, marques } of peces) {
    const propies = marques.filter((marca) => marca.etiqueta === 'a' || marca.etiqueta === 'code');
    const darrer = segments[segments.length - 1];
    if (darrer && mateixesMarques(darrer.marques, propies)) darrer.text += text;
    else segments.push({ text, marques: propies });
  }
  return segments.map((segment) => {
    const fix = segment.marques.some((marca) => marca.etiqueta === 'code') || !segment.text.trim();
    return { ...segment, envia: fix ? null : segment.text.trim() };
  });
}

/* Gauntlet 261030 (cicle 2, traduccio-lang-index-i-blocs-de-reserva) · Un
   bloc que torna en l'original (el motor no l'ha traduït, n'ha perdut una
   marca o no s'ha pogut llegir) porta `original: true`: CosTraduit li posa
   el lang de l'original, i no s'anuncia valencià com a gallec o basc. */
const enOriginal = (bloc) => ({ ...bloc, original: true });

function muntaBloc(bloc, pla, traduccions, esOriginal) {
  if (pla.mode === 'buit') return bloc;
  // Cicle 4 · Un bloc que no es pot reconstruir (C5) torna en l'original.
  if (pla.mode === 'original') return enOriginal(bloc);
  if (pla.mode === 'text') {
    const traduit = traduccions[pla.inici];
    return !traduit || esOriginal(pla.inici) ? enOriginal(bloc) : { ...bloc, text: traduit };
  }
  if (pla.mode === 'html') {
    const peces = esOriginal(pla.inici) ? null : pecesDeHtml(traduccions[pla.inici], bloc.peces);
    return peces ? { ...bloc, text: textDePeces(peces), peces } : enOriginal(bloc);
  }
  let index = pla.inici;
  let traduits = 0;
  const peces = normalitzaPeces(pla.segments.map((segment) => {
    if (!segment.envia) return { text: segment.text, marques: segment.marques };
    if (traduccions[index] && !esOriginal(index)) traduits += 1;
    const traduit = String(traduccions[index] || segment.envia).trim();
    index += 1;
    const abans = /^\s/.test(segment.text) ? ' ' : '';
    const despres = /\s$/.test(segment.text) ? ' ' : '';
    return { text: `${abans}${traduit}${despres}`, marques: segment.marques };
  }));
  if (!peces.length || !traduits) return enOriginal(bloc);
  return { ...bloc, text: textDePeces(peces), peces };
}

/**
 * preparaTraduccio(blocs, { html }) → { textos, munta(traduccions) }.
 * `textos` va a tradueixTot (data/traductor.js): una cadena per bloc de text
 * pla; per a un bloc amb peces, `{ text, format: 'html' }` si el motor admet
 * HTML (`html`) o, si no, un text per segment. `munta` torna els blocs
 * traduïts, amb les marques de l'original; una traducció que falta o no es
 * pot llegir deixa el bloc (o el segment) en l'original.
 * `maxim`: els caràcters que la pàgina pot gastar (el servidor compta també
 * les etiquetes). Primer es compta tota la pàgina com a text (el pressupost
 * d'abans); després, en ordre, cada bloc passa a HTML local mentre les seues
 * etiquetes hi caben, i la resta va per segments (enllaços conservats,
 * negretes no). Mesura en viu del 261030: /page/fediversity, 8783
 * caràcters, passava dels 10000 amb totes les etiquetes.
 */
export function preparaTraduccio(blocs, { html = true, maxim = Infinity } = {}) {
  const cost = (textos) => textos.reduce((suma, text) => suma + caractersDe(text), 0);
  const opcions = blocs.map((bloc) => {
    if (!bloc.peces) return null;
    const segments = segmentsDe(bloc.peces);
    const enText = segments.filter(({ envia }) => envia).map(({ envia }) => envia);
    const local = html ? htmlDePeces(bloc.peces) : null;
    return { segments, enText, local: local !== null && caractersDe(local) <= MAX_HTML ? local : null };
  });
  const enviat = (bloc, i) => (bloc.arbre ? 0 : opcions[i] ? cost(opcions[i].enText) : caractersDe(bloc.text));
  let gastat = blocs.reduce((suma, bloc, i) => suma + enviat(bloc, i), 0);
  const textos = [];
  const plans = blocs.map((bloc, i) => {
    const inici = textos.length;
    const opcio = opcions[i];
    /* Cicle 4 (c5-llistes-niuades-aplanades-consagrades) · Un bloc que no es
       pot reconstruir no s'envia: es queda en l'original. */
    if (bloc.arbre) return { mode: 'original' };
    // C5 · Un <li> buit que només porta una llista niuada no s'envia.
    if (!bloc.text) return { mode: 'buit' };
    if (!opcio) {
      textos.push(bloc.text);
      return { mode: 'text', inici };
    }
    if (opcio.local !== null) {
      const etiquetes = caractersDe(opcio.local) - cost(opcio.enText);
      if (gastat + etiquetes <= maxim) {
        gastat += etiquetes;
        textos.push({ text: opcio.local, format: 'html' });
        return { mode: 'html', inici };
      }
    }
    for (const text of opcio.enText) textos.push(text);
    return { mode: 'segments', inici, segments: opcio.segments };
  });
  /* `originals`: els índexs de `textos` que han tornat en l'original
     (tradueixTot · enOriginal). */
  return {
    textos,
    munta: (traduccions, originals = null) => {
      const esOriginal = (index) => Boolean(originals?.has(index));
      return blocs.map((bloc, i) => muntaBloc(bloc, plans[i], traduccions, esOriginal));
    },
  };
}
