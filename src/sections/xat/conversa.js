/**
 * conversa.js — Funcions pures de la conversa oberta (torn 260930, T1: la
 * conversa amb el patró estàndard de missatgeria, ordre del Mestre).
 *
 * Sense React ni DOM. Ací viu el que es pot raonar i provar sense muntar
 * res: les files de la llista (separadors de dia, el de no llegits i les
 * bombolles agrupades per autor), el recompte de no llegits en obrir, si la
 * llista ja és al dia per a fixar-lo (estatObertura), la classificació d'un
 * canvi de la llista (primera càrrega, antics per dalt, nous per baix), la
 * geometria del scroll, els textos de la cita i l'anunci dels nous.
 * `components/Conversa.jsx` només orquestra.
 */
import { clauDia } from './temps.js';

/**
 * Distància al fons, en px, per davall de la qual ja «eres a baix»: 2rem
 * amb l'arrel de 16px. Una constant i no una mesura: el marge només ha
 * d'absorbir mitja línia de desquadre, no seguir la mida de la lletra.
 */
export const LLINDAR_FONS_PX = 32;

/** Temps que el missatge citat queda ressaltat en arribar-hi (ha de casar amb l'animació de modules.css). */
export const MS_RESSALT = 1600;

/** Clau estable de cada missatge dins de la llista (també per a la tria). */
export function clauDe(msg, i) {
  return String(msg?.id ?? `pos-${i}`);
}

/* ─────────────────────────── Grups per autor ─────────────────────────── */

/**
 * Qui signa una bombolla, per a agrupar-les: «jo» per a les pròpies; per a
 * les dels altres, la persona (usuariId o, si no n'hi ha, el nom), si parla
 * en nom d'una entitat i si és la IAIA. Un missatge de sistema no té autor:
 * trenca el grup.
 */
export function clauAutor(msg) {
  if (!msg || msg.tipus === 'sistema') return null;
  if (msg.sender === 'me') return 'jo';
  const qui = msg.usuariId ?? msg.author ?? msg.author_name ?? '';
  return `${msg.comEntitat ? 'entitat' : 'persona'}:${msg.is_ai ? 'ia:' : ''}${qui}`;
}

/**
 * Marca cada fila de missatge amb `primerDelGrup`. Un grup és una tirada de
 * missatges seguits del mateix autor; qualsevol fila que no siga un
 * missatge (el separador de dia o el de no llegits) i qualsevol missatge de
 * sistema el tallen. Com que el separador de dia talla, el grup mai passa
 * d'un dia a l'altre.
 */
export function anotaGrups(files) {
  let autorPrevi = null;
  return (files || []).map((fila) => {
    if (fila.tipus !== 'missatge') {
      autorPrevi = null;
      return fila;
    }
    const autor = clauAutor(fila.msg);
    const primerDelGrup = autor == null || autor !== autorPrevi;
    autorPrevi = autor;
    return { ...fila, primerDelGrup };
  });
}

/* ─────────────────────────── No llegits en obrir ─────────────────────────── */

/** La marca de lectura com a número, o null si no n'hi ha cap de coneguda. */
function marcaDe(llegitFinsSeq) {
  if (llegitFinsSeq == null || llegitFinsSeq === '') return null;
  const marca = Number(llegitFinsSeq);
  return Number.isFinite(marca) ? marca : null;
}

/**
 * El `seq` més baix i el més alt dels missatges que ja té el servidor. Els
 * pendents (encara sense `seq`) no compten: null si no n'hi ha cap.
 */
export function extremsSeq(messages) {
  let minim = null;
  let maxim = null;
  for (const m of messages || []) {
    if (!m || m.seq == null) continue;
    const seq = Number(m.seq);
    if (!Number.isFinite(seq)) continue;
    if (minim == null || seq < minim) minim = seq;
    if (maxim == null || seq > maxim) maxim = seq;
  }
  return { minim, maxim };
}

/**
 * Els no llegits del moment d'obrir la conversa: els missatges dels altres
 * amb `seq` per damunt de la marca de lectura. Torna la clau del primer i
 * quants n'hi ha, o null si no n'hi ha cap o si la marca no és un número
 * (sense marca coneguda no s'inventa cap separador).
 *
 * Revisió adversarial 260930, #4: si el primer no llegit no s'ha carregat
 * (`hiHaMes` i el missatge de després de la marca no és a la llista), la
 * pàgina es queda curta i el separador no pot dir-ne menys dels que són:
 * val `total`, els no llegits que el fil tenia en obrir-lo.
 */
export function noLlegitsEnObrir(messages, llegitFinsSeq, { hiHaMes = false, total = null } = {}) {
  const marca = marcaDe(llegitFinsSeq);
  if (marca == null) return null;
  let clau = null;
  let quants = 0;
  (messages || []).forEach((m, i) => {
    if (!m || m.sender === 'me' || m.seq == null) return;
    const seq = Number(m.seq);
    if (!Number.isFinite(seq) || seq <= marca) return;
    quants += 1;
    if (clau == null) clau = clauDe(m, i);
  });
  if (!quants) return null;
  const { minim } = extremsSeq(messages);
  const retallat = Boolean(hiHaMes) && minim != null && minim > marca + 1;
  const delFil = Number(total);
  return { clau, quants: retallat && Number.isFinite(delFil) && delFil > quants ? delFil : quants };
}

/* ─────────────────────────────── Obertura ─────────────────────────────── */

/**
 * Temps màxim que la conversa espera a estar al dia abans de fixar el
 * separador i fer el salt inicial. Passat este temps es fixa amb el que hi
 * ha: és el comportament d'abans, i la marca de lectura no queda mai
 * penjada per una càrrega que no arriba.
 */
export const MS_ESPERA_OBERTURA = 5000;

/** Pàgines d'historial que es demanen, com a molt, per a arribar al primer no llegit. */
export const MAX_PAGINES_NO_LLEGITS = 4;

/**
 * Si la conversa ja pot fixar el separador de no llegits i fer el salt
 * inicial (revisió adversarial 260930, #1 i #4):
 *   · 'buida': encara no hi ha cap missatge;
 *   · 'rancia': la llista és la memòria cau d'abans d'obrir. El `seq` més
 *     alt del servidor no arriba a l'`ultimSeq` que tenia el fil en obrir-lo:
 *     la càrrega incremental encara no ha arribat;
 *   · 'antics': hi ha no llegits per damunt de la pàgina carregada (falta el
 *     missatge de després de la marca i el servidor en té més): cal
 *     carregar historial cap arrere;
 *   · 'llesta'.
 * Els pendents (sense `seq`) no compten: un missatge teu enviat abans que
 * arribe la càrrega no fa la llista «al dia».
 */
export function estatObertura(messages, { ultimSeq = null, llegitFinsSeq = null, hiHaMes = false } = {}) {
  if (!messages || messages.length === 0) return 'buida';
  const { minim, maxim } = extremsSeq(messages);
  const ultim = ultimSeq == null || ultimSeq === '' ? NaN : Number(ultimSeq);
  if (Number.isFinite(ultim) && ultim > 0 && (maxim == null || maxim < ultim)) return 'rancia';
  const marca = marcaDe(llegitFinsSeq);
  if (marca != null && hiHaMes && minim != null && minim > marca + 1) return 'antics';
  return 'llesta';
}

/* ─────────────────────────────── Files ─────────────────────────────── */

/**
 * Les files de la llista: un separador davant de cada canvi de dia, el de
 * «N missatges no llegits» davant del primer no llegit i cada missatge amb
 * `primerDelGrup` (anotaGrups).
 */
export function construeixFiles(messages, { noLlegits = null } = {}) {
  const files = [];
  let diaPrevi = null;
  (messages || []).forEach((msg, i) => {
    const clau = clauDe(msg, i);
    const dia = clauDia(msg?.creatAl);
    if (dia && dia !== diaPrevi) {
      files.push({ tipus: 'dia', clau: `dia-${dia}`, iso: msg.creatAl });
      diaPrevi = dia;
    }
    if (noLlegits && noLlegits.clau === clau) {
      files.push({ tipus: 'no-llegits', clau: 'no-llegits', quants: noLlegits.quants });
    }
    files.push({ tipus: 'missatge', clau, msg });
  });
  return anotaGrups(files);
}

/* ─────────────────────────── Canvis de la llista ─────────────────────────── */

/**
 * Què ha canviat entre dos renders de la llista, a partir de les claus
 * d'abans: la primera càrrega (`inicial`), quants antics han entrat per
 * dalt (davant del primer d'abans) i quins nous han entrat per baix (claus
 * que abans no hi eren, darrere del primer d'abans). Un pendent que el
 * servidor confirma conserva l'id: no compta com a nou.
 */
export function classificaCanvi(clausPrevies, messages) {
  const previes = Array.isArray(clausPrevies) ? clausPrevies : [];
  const llista = messages || [];
  if (previes.length === 0) return { inicial: llista.length > 0, antics: 0, nous: [] };
  const conegudes = new Set(previes);
  const claus = llista.map(clauDe);
  const posPrimer = claus.indexOf(previes[0]);
  let antics = 0;
  const nous = [];
  claus.forEach((clau, i) => {
    if (conegudes.has(clau)) return;
    if (posPrimer >= 0 && i < posPrimer) antics += 1;
    else nous.push(llista[i]);
  });
  return { inicial: false, antics, nous };
}

/* ─────────────────────────── Geometria del scroll ─────────────────────────── */

/** Cert si la llista és a baix de tot o a menys de `llindar` px. */
export function estaAlFons({ scrollHeight = 0, scrollTop = 0, clientHeight = 0 } = {}, llindar = LLINDAR_FONS_PX) {
  return scrollHeight - scrollTop - clientHeight <= llindar;
}

/** El scrollTop que deixa `rectElement` a dalt de la vista, amb `marge` px de respir. */
export function scrollPerDeixarDalt(scrollTop, rectContenidor, rectElement, marge = 0) {
  return Math.max(0, scrollTop + (rectElement.top - rectContenidor.top) - marge);
}

/** El scrollTop que centra `rectElement` dins de la vista (o el deixa a dalt si no hi cap). */
export function scrollPerCentrar(scrollTop, rectContenidor, rectElement) {
  const respir = Math.max(0, (rectContenidor.height - rectElement.height) / 2);
  return Math.max(0, scrollTop + (rectElement.top - rectContenidor.top) - respir);
}

/**
 * 'auto' (salt sec) si la persona ha demanat menys moviment o si no es pot
 * saber; 'smooth' si no. `matchMedia` s'injecta a les proves.
 */
export function comportamentDesplacament(matchMedia = typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia.bind(window) : null) {
  if (typeof matchMedia !== 'function') return 'auto';
  try {
    return matchMedia('(prefers-reduced-motion: reduce)')?.matches ? 'auto' : 'smooth';
  } catch {
    return 'auto';
  }
}

/* ─────────────────────────────── Cites ─────────────────────────────── */

/** Qui va escriure el missatge citat: «Tu» si és teu; si no, el seu nom. */
export function autorDeCita(msg, t) {
  if (msg?.sender === 'me') return t('section.xat.resposta.tu', 'Tu');
  return msg?.author || msg?.author_name || t('section.xat.vei', 'Veí');
}

/**
 * El text del missatge citat: «Missatge amagat» si és d'algú que has
 * bloquejat (Fase D, 261020, tasca 2: XatContext l'anota sense text), la
 * làpida si s'ha esborrat, i el text tal qual si no.
 */
export function textDeCita(msg, t) {
  if (msg?.bloquejat) return t('section.moderacio.bloquejat.previa', 'Missatge amagat');
  if (msg?.esborrat || msg?.esborratAl) return t('section.xat.missatge.esborrat', "S'ha esborrat este missatge");
  return String(msg?.text ?? msg?.content ?? '') || textDAdjunt(msg?.tipus, t);
}

/* Gauntlet 261022_0225 (crítica Claude, ADV-MEDIA-1) · Un adjunt sense peu es
   desa amb text NULL (no es guarda cap «Foto» en valencià al servidor): la
   previa de la llista, la cita i l'anunci el diuen pel tipus, traduït. */
const TEXT_D_ADJUNT = Object.freeze({
  imatge: ['section.xat.adjunts.foto', 'Foto adjunta'],
  video: ['section.xat.adjunts.video', 'Vídeo adjunt'],
  veu: ['section.xat.adjunts.veu', 'Missatge de veu']
});

/** El text d'un adjunt sense peu pel seu tipus ('imatge', 'video', 'veu'), o ''. */
export function textDAdjunt(tipus, t) {
  const text = Object.hasOwn(TEXT_D_ADJUNT, tipus ?? '') ? TEXT_D_ADJUNT[tipus] : null;
  return text ? t(text[0], text[1]) : '';
}

/* ─────────────────────────────── Anunci ─────────────────────────────── */

/**
 * Dels nous, els que s'anuncien: els dels altres que no són de sistema ni
 * d'algú que has bloquejat (Fase D, 261020, tasca 2).
 */
export function nousAnunciables(nous) {
  return (nous || []).filter((m) => m && m.sender !== 'me' && m.tipus !== 'sistema' && !m.bloquejat);
}

/**
 * El que diu la regió en viu de la conversa quan arriben missatges d'altres
 * pel final (revisió adversarial 260930, #11: la llista sencera ja no és una
 * regió en viu). Un de sol, «autor: text»; més d'un, «N missatges nous»
 * (la mateixa clau que la descripció de «Baixa al final»). Els propis i els
 * de sistema no s'anuncien: '' si no queda res.
 */
export function anunciDeNous(nous, t) {
  const aliens = nousAnunciables(nous);
  if (aliens.length === 0) return '';
  if (aliens.length === 1) return `${autorDeCita(aliens[0], t)}: ${textDeCita(aliens[0], t)}`;
  return t('section.xat.baixa.nous', '{n} missatges nous').replace('{n}', String(aliens.length));
}
