/**
 * markdownEnganxat.js — P0-58 (IDEA-189) · El text pla enganxat que porta
 * Markdown (el botó de copiar de ChatGPT, una llista de WhatsApp, un correu
 * amb «- » i «1. ») entra al cos amb el nostre format, i no amb les marques
 * literals.
 *
 * Pur: sense DOM, sense React, sense dependències noves. ESCAPA → CONSTRUÏX →
 * SANEJA (el patró de xat/retall.js): TOT el text s'escapa abans de construir
 * cap etiqueta, i qui el pinta encara el passa per l'esquema de ProseMirror i
 * per sanitizeHtml. Ix un conjunt TANCAT d'etiquetes: p, h2–h6, strong, em, s,
 * code, pre, a[href], ul, ol, li, blockquote i hr. Mai un títol de nivell 1
 * (és el títol de la pàgina) i mai una <img>: «![a](u)» es queda com a text i
 * no hi ha cap porta lateral per a l'EXIF.
 *
 * Els enllaços només entren amb una adreça segura (hrefDeImatge, el validador
 * de les imatges enllaçades: hrefSegur, sense credencials, espais ni
 * controls). Un enllaç que no ho és es queda com a text literal.
 *
 * Baseline Safari 16 / Chrome 100 / Firefox 100: cap lookbehind, cap flag «v».
 * Cap expressió amb retrocés quadràtic: les classes excloses tallen cada
 * intent en la marca següent (ReDoS provat amb 50.000 caràcters).
 */
import { hrefDeImatge } from './extensions/enllacImatge.js';

const ESCAPADES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapa = (valor) => String(valor).replace(/[&<>"']/g, (c) => ESCAPADES[c]);

/* Salts de línia de totes les plataformes i cap control C0 (ni el NUL, que és
   el marcador intern de les peces apartades). El tabulador i el salt queden. */
const SALTS = /\r\n?|[\u2028\u2029]/g;
const CONTROLS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const normalitza = (text) => String(text ?? '').replace(SALTS, '\n').replace(CONTROLS, '');

const FORMA_URL_WEB = /^https?:\/\/\S+$/i;

/**
 * L'adreça web (http o https) si `valor`, sense els espais de les vores, és
 * UNA sola URL segura; si no, null. És la porta de les URL que es tornen
 * enllaç: la de dins d'un codi, d'un bloc de codi o del text.
 */
export function urlWebSegura(valor) {
  if (typeof valor !== 'string') return null;
  const adreca = valor.trim();
  if (!FORMA_URL_WEB.test(adreca)) return null;
  return hrefDeImatge(adreca);
}

const enllac = (href, text = href) => `<a href="${escapa(href)}">${escapa(text)}</a>`;

/* ── Línies de bloc ─────────────────────────────────────────────────────── */

const TANCA = /^([ \t]*)```/;
const TITOL = /^ {0,3}(#{1,6})[ \t]+(\S.*)$/;
const SEPARADOR = /^ {0,3}(?:-{3,}|\*{3,}|_{3,})[ \t]*$/;
const CITA = /^ {0,3}>[ \t]?(.*)$/;
const ELEMENT = /^([ \t]*)([-*+]|\d{1,9}[.)])[ \t]+(\S.*)$/;
const SAGNAT = /^[ \t]*/;

/* Una línia que només pot ser Markdown per si sola: un títol («# »), una
   cita, una tanca de codi o un separador. «#etiqueta» (sense espai) no ho és.
   Un element de llista sol, no (teTiraDeLlista). */
const BLOC_MARKDOWN = /^ {0,3}(?:#{1,6}[ \t]+\S|>(?:[ \t]|$)|```|(?:-{3,}|\*{3,}|_{3,})[ \t]*$)/;
const ENLLAC_MARKDOWN = /\[[^[\]\n]+\]\([^()\s]+\)/;
const CODI_AMB_URL = /`[ \t]*https?:\/\/[^`\s]+[ \t]*`/i;

/* L'amplada del sagnat: un tabulador compta com a quatre espais. */
const amplada = (sagnat) => Array.from(sagnat).reduce((total, c) => total + (c === '\t' ? 4 : 1), 0);

/* C-02 · Un element de llista tot sol («2024. Un any per recordar», «3)
   Pressupost municipal», «- Avís important -») és text de la persona, no
   una llista: a HEAD entrava tal qual, i fer-ne Markdown se'n menjava el
   número. Cal una tira de dos elements o més. Les línies buides i les
   sagnades (la continuació d'un element o una subllista) no la tallen; una
   línia sense sagnar i sense marca, sí (com a markdownAHtml). */
function teTiraDeLlista(linies) {
  let elements = 0;
  for (const linia of linies) {
    if (ELEMENT.test(linia)) {
      elements += 1;
      if (elements >= 2) return true;
    } else if (linia.trim() && amplada(SAGNAT.exec(linia)[0]) < 2) {
      elements = 0;
    }
  }
  return false;
}

/**
 * Cert si el text pla té forma de Markdown: alguna línia de bloc (títol,
 * cita, tanca o separador), una tira de dos elements de llista o més, un
 * enllaç «[t](u)» o una URL entre accents greus. Una URL sola NO ho és
 * (l'enganxat d'una URL sobre una selecció continua fent l'enllaç de
 * TipTap), ni un element de llista sol (C-02), ni un missatge de WhatsApp
 * amb només *negreta* o _cursiva_ (el camí de sempre de TipTap ja les llig).
 */
export function semblaMarkdown(text) {
  if (typeof text !== 'string' || !text.trim()) return false;
  const net = normalitza(text);
  const linies = net.split('\n');
  return linies.some((linia) => BLOC_MARKDOWN.test(linia))
    || teTiraDeLlista(linies)
    || ENLLAC_MARKDOWN.test(net)
    || CODI_AMB_URL.test(net);
}

/* El text d'un títol sense la tanca opcional de coixinets («## Títol ##»):
   només si van darrere d'un espai. A mà, per a no dependre de cap retrocés. */
function senseTancaDeTitol(text) {
  const net = text.trimEnd();
  let fi = net.length;
  while (fi > 0 && net[fi - 1] === '#') fi -= 1;
  if (fi === net.length) return net;
  if (fi === 0) return '';
  return net[fi - 1] === ' ' || net[fi - 1] === '\t' ? net.slice(0, fi).trimEnd() : net;
}

/* ── En línia ───────────────────────────────────────────────────────────── */

const CODI = /`([^`\n]+)`/g;
const ENLLAC = /(!?)\[([^[\]\n]*)\]\(([^()\s]*)\)/g;
const ENLLAC_ANGULAR = /<(https?:\/\/[^\s<>]+)>/gi;
const URL_SOLTA = /https?:\/\/[^\s<>"'`\u0000]+/gi;
const MARCADOR = /\u0000(\d+)\u0000/g;

/* Puntuació que tanca una frase o una marca i no és de l'adreça. Un «)» només
   se'n va si no en tanca cap «(» de dins (les adreces de la Viquipèdia). */
const PUNTUACIO_FINAL = '.,;:!?)]}*_~';
function separaPuntuacio(cru) {
  let obertes = 0;
  let tancades = 0;
  for (const c of cru) {
    if (c === '(') obertes += 1;
    else if (c === ')') tancades += 1;
  }
  let fi = cru.length;
  while (fi > 0 && PUNTUACIO_FINAL.includes(cru[fi - 1])) {
    if (cru[fi - 1] === ')') {
      if (tancades <= obertes) break;
      tancades -= 1;
    }
    fi -= 1;
  }
  return { url: cru.slice(0, fi), cua: cru.slice(fi) };
}

/* L'èmfasi, sobre el text ja escapat (cap entitat porta *, _ ni ~). Cada marca
   obri davant d'un caràcter que no és espai i tanca darrere d'un altre; el
   contingut no travessa cap marca igual, i així cada intent s'acaba en la
   marca següent (lineal). Els guions baixos no fan èmfasi dins d'una paraula
   (noms_de_variable). Ordre: cursiva, negreta i cursiva altra volta, perquè
   «**a *b* c**», «*a **b** c*» i «***x***» isquen niats. */
const EM_ESTRELA = /(^|[^*])\*([^*\s](?:[^*\n]*[^*\s])?)\*(?!\*)/g;
const STRONG_ESTRELA = /()\*\*([^*\s](?:[^*\n]*[^*\s])?)\*\*/g;
const STRONG_BAIX = /(^|[^\p{L}\p{N}_])__([^_\s](?:[^_\n]*[^_\s])?)__(?![\p{L}\p{N}_])/gu;
const EM_BAIX = /(^|[^\p{L}\p{N}_])_([^_\s](?:[^_\n]*[^_\s])?)_(?![\p{L}\p{N}_])/gu;
const RATLLAT = /()~~([^~\s](?:[^~\n]*[^~\s])?)~~/g;
const EMFASI = [
  [EM_ESTRELA, 'em'], [STRONG_ESTRELA, 'strong'], [EM_ESTRELA, 'em'],
  [STRONG_BAIX, 'strong'], [EM_BAIX, 'em'], [RATLLAT, 's'],
];

/**
 * Una línia de Markdown en línia. `html`: cert per a l'HTML del cos (escapat,
 * amb etiquetes); fals per al text pla dels camps (les mateixes regles, sense
 * marques). Els codis, els enllaços i les URL s'aparten primer amb un
 * marcador (NUL + índex + NUL), de manera que ni l'escapament ni l'èmfasi no
 * hi entren.
 */
function enLinia(linia, html) {
  const peces = [];
  const crus = [];
  const aparta = (peca, cru) => {
    crus.push(cru);
    return `\u0000${peces.push(peca) - 1}\u0000`;
  };
  const resolCrus = (text) => text.replace(MARCADOR, (_m, i) => crus[Number(i)]);
  /* El text tal qual, ja resolt: escapat (amb les peces de dins) o pla. */
  const literal = (tot) => aparta(html ? escapa(tot).replace(MARCADOR, (_m, i) => peces[Number(i)]) : resolCrus(tot), resolCrus(tot));

  let s = linia.replace(CODI, (_tot, codi) => {
    const url = urlWebSegura(codi);
    if (!html) return aparta(url || codi, codi);
    return aparta(url ? enllac(url) : `<code>${escapa(codi)}</code>`, codi);
  });

  s = s.replace(ENLLAC, (tot, imatge, etiqueta, desti) => {
    if (imatge) return literal(tot);
    const href = hrefDeImatge(desti);
    if (!href) return literal(tot);
    const text = resolCrus(etiqueta).trim() || href;
    return aparta(html ? enllac(href, text) : text, text);
  });

  s = s.replace(ENLLAC_ANGULAR, (tot, adreca) => {
    const url = urlWebSegura(adreca);
    return url ? aparta(html ? enllac(url) : url, url) : tot;
  });

  s = s.replace(URL_SOLTA, (tot) => {
    const { url, cua } = separaPuntuacio(tot);
    const segura = urlWebSegura(url);
    return segura ? aparta(html ? enllac(segura) : segura, segura) + cua : tot;
  });

  if (html) s = escapa(s);
  for (const [patro, etiqueta] of EMFASI) {
    s = s.replace(patro, (_tot, abans, dins) => (html ? `${abans}<${etiqueta}>${dins}</${etiqueta}>` : `${abans}${dins}`));
  }
  return s.replace(MARCADOR, (_m, i) => peces[Number(i)]);
}

/* ── Blocs ──────────────────────────────────────────────────────────────── */

const paragraf = (text) => `<p>${enLinia(text, true)}</p>`;

function htmlDeTitol(coixinets, text) {
  const net = senseTancaDeTitol(text);
  if (!net) return '';
  const nivell = Math.max(2, coixinets);
  return `<h${nivell}>${enLinia(net, true)}</h${nivell}>`;
}

/* Un bloc de codi que només porta una URL és un enllaç (el que fa el xat
   quan l'envia sola en una tanca); la resta, el codi tal qual, escapat. */
function htmlDeCodi(linies) {
  const cru = linies.join('\n');
  if (!cru.trim()) return '';
  const url = urlWebSegura(cru);
  return url ? `<p>${enllac(url)}</p>` : `<pre><code>${escapa(cru)}</code></pre>`;
}

const htmlDeSubllista = ({ tipus, elements }) => `<${tipus}>${elements.map((e) => `<li>${e}</li>`).join('')}</${tipus}>`;
const htmlDeLlista = ({ tipus, elements }) => `<${tipus}>${elements
  .map((e) => `<li>${e.parts.map((part) => (typeof part === 'string' ? part : htmlDeSubllista(part))).join('')}</li>`)
  .join('')}</${tipus}>`;

/* Les línies d'un bloc de codi sense el sagnat de la seua tanca (la d'un
   bloc dins d'un element de llista). */
function senseSagnat(linia, sagnat) {
  let i = 0;
  while (i < linia.length && i < sagnat && (linia[i] === ' ' || linia[i] === '\t')) i += 1;
  return linia.slice(i);
}

/**
 * L'HTML del cos per a un text pla amb Markdown. Línia a línia:
 *  · una tanca ``` obri i tanca un bloc de codi (sense tancar, fins al final);
 *    sagnada dins d'una llista, el bloc és de l'element (els passos
 *    numerats de ChatGPT no tornen a començar per 1);
 *  · «#» i «##» són h2, i «###»…«######» h3…h6;
 *  · les línies de «- », «* », «+ », «1. » i «1) » fan una llista (una
 *    numerada que s'obriria amb un altre número es queda com a text, C-02:
 *    el desat de Notes en lleva el start); un element
 *    sagnat (dos espais o més) penja de l'anterior en una subllista (un sol
 *    nivell: els més fondos s'hi apleguen) i una línia sagnada sense marca és
 *    un paràgraf més del mateix element. Una línia buida no talla la llista;
 *    una línia sense sagnar i sense marca, sí;
 *  · les línies «> » consecutives fan una cita (una línia buida en comença una altra);
 *  · «---», «***» o «___» és un separador;
 *  · la resta, cada línia un <p>: el que fa ProseMirror amb el text pla.
 */
export function markdownAHtml(text) {
  const blocs = [];
  let llista = null;
  let cita = null;
  let codi = null;
  let buit = false;

  const tancaLlista = () => {
    if (llista) blocs.push(htmlDeLlista(llista));
    llista = null;
  };
  const tancaCita = () => {
    if (cita?.length) blocs.push(`<blockquote>${cita.join('')}</blockquote>`);
    cita = null;
  };
  const tancaCodi = () => {
    const html = htmlDeCodi(codi.linies);
    if (html && codi.element) {
      codi.element.parts.push(html);
      codi.element.sub = null;
    } else if (html) {
      blocs.push(html);
    }
    codi = null;
  };
  /* L'últim element de la llista oberta si `sagnat` hi penja; si no, null. */
  const elementPare = (sagnat) => (llista && sagnat >= llista.sagnat + 2 ? llista.elements[llista.elements.length - 1] : null);

  for (const linia of normalitza(text).split('\n')) {
    const tanca = TANCA.exec(linia);
    if (codi) {
      if (tanca) tancaCodi();
      else codi.linies.push(senseSagnat(linia, codi.sagnat));
      continue;
    }
    if (tanca) {
      const sagnat = amplada(tanca[1]);
      const element = elementPare(sagnat);
      if (!element) tancaLlista();
      tancaCita();
      codi = { linies: [], sagnat, element };
      buit = false;
      continue;
    }
    if (!linia.trim()) {
      buit = true;
      continue;
    }
    const despresDeBuit = buit;
    buit = false;

    const titol = TITOL.exec(linia);
    if (titol || SEPARADOR.test(linia)) {
      tancaLlista();
      tancaCita();
      blocs.push(titol ? htmlDeTitol(titol[1].length, titol[2]) : '<hr>');
      continue;
    }

    const linCita = CITA.exec(linia);
    if (linCita) {
      tancaLlista();
      if (despresDeBuit) tancaCita();
      cita = cita || [];
      if (linCita[1].trim()) cita.push(paragraf(linCita[1].trim()));
      continue;
    }
    tancaCita();

    const element = ELEMENT.exec(linia);
    const sagnatElement = element ? amplada(element[1]) : 0;
    const tipus = element && /\d/.test(element[2]) ? 'ol' : 'ul';
    const pare = element ? elementPare(sagnatElement) : null;
    const obri = pare ? !pare.sub || pare.sub.tipus !== tipus : !llista || llista.tipus !== tipus;
    /* C-02 · Fora de la Wiki, sanitizeHtml lleva el start de les <ol>
       (WC-06): una llista que comença per 3 (o per 2024) es tornaria 1, 2…
       en silenci. Si s'hi obriria amb un número que no és 1, la línia es
       queda com el text que era, amb el número (un paràgraf, o un paràgraf
       més de l'element pare). Dins d'una llista oberta només mana el primer
       número (CommonMark). */
    if (element && !(obri && tipus === 'ol' && Number.parseInt(element[2], 10) !== 1)) {
      const contingut = paragraf(element[3].trim());
      if (pare) {
        if (obri) {
          pare.sub = { tipus, elements: [] };
          pare.parts.push(pare.sub);
        }
        pare.sub.elements.push(contingut);
      } else if (!obri) {
        llista.elements.push({ parts: [contingut], sub: null });
      } else {
        tancaLlista();
        llista = { tipus, sagnat: sagnatElement, elements: [{ parts: [contingut], sub: null }] };
      }
      continue;
    }

    const delElement = elementPare(amplada(SAGNAT.exec(linia)[0]));
    if (delElement) {
      delElement.parts.push(paragraf(linia.trim()));
      delElement.sub = null;
      continue;
    }
    tancaLlista();
    blocs.push(paragraf(linia.trim()));
  }

  if (codi) tancaCodi();
  tancaLlista();
  tancaCita();
  return blocs.join('');
}

/**
 * El text pla d'un Markdown, per als camps d'una línia (títol, subtítol i
 * entradilla): sense marques de bloc ni d'èmfasi, l'etiqueta de cada enllaç
 * segur, el contingut dels codis i dels blocs de codi tal qual. Les línies
 * (i les buides, que separen els paràgrafs) es conserven. La vinyeta d'una
 * llista se'n va, però el número d'una numerada és text i es queda (C-02:
 * «1714. La caiguda de Barcelona» no perd l'any).
 */
export function textPlaDeMarkdown(text) {
  const eixida = [];
  let dinsDeCodi = false;
  for (const linia of normalitza(text).split('\n')) {
    if (TANCA.test(linia)) {
      dinsDeCodi = !dinsDeCodi;
      continue;
    }
    if (dinsDeCodi) {
      eixida.push(linia.trim());
      continue;
    }
    if (SEPARADOR.test(linia)) continue;
    const titol = TITOL.exec(linia);
    const cita = titol ? null : CITA.exec(linia);
    const element = titol || cita ? null : ELEMENT.exec(linia);
    const delElement = element && /\d/.test(element[2]) ? `${element[2]} ${element[3]}` : element?.[3];
    const contingut = titol ? senseTancaDeTitol(titol[2]) : cita ? cita[1] : element ? delElement : linia;
    eixida.push(enLinia(contingut.trim(), false));
  }
  return eixida.join('\n');
}

/**
 * L'HTML del cos per a un text pla SENSE forma de Markdown: cada línia que no
 * és buida, un <p> (el que fa ProseMirror), amb les mateixes regles en línia
 * que les regles d'enganxat de TipTap ja apliquen al text pla (URL, codi,
 * negreta, cursiva i ratllat). Per a qui inserix sense passar per l'enganxat
 * (setContent no executa cap regla d'enganxat).
 */
export function paragrafsDeText(text) {
  return normalitza(text).split('\n')
    .map((linia) => linia.trim())
    .filter(Boolean)
    .map(paragraf)
    .join('');
}
