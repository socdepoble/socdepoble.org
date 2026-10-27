import { resolveAsset } from '../../config/assetResolver';
import { esRutaInterna } from '../../config/objecteConnectable.js';
import { resolRuta } from '../../app/contexts/politicaRouter.js';
import { MARQUES, MARQUES_SVG_ANTIGUES } from '../../config/imatgeSocial.js';

/* Fase C (Capacitor 8; ordre del Mestre, 261019) · L'esquema de l'app nativa
   d'iOS (iosScheme de capacitor.config.json). Android servix l'app des de
   https://localhost i no el necessita. */
const ESQUEMA_NATIU = 'capacitor:';

/**
 * Fase C (Capacitor 8; ordre del Mestre, 261019) · Cert si `u` és un fitxer o
 * una ruta de la mateixa app nativa. A iOS la pàgina viu a
 * capacitor://localhost i tot camí propi ('/assets/x.webp', '/gent/1') es
 * resol a l'esquema 'capacitor:': isSafeUrl el rebutjava i la imatge o
 * l'enllaç propis es perdien. L'esquema natiu només val si la pàgina mateixa
 * hi corre i l'adreça és del seu host, sense credencials: a la web (i a
 * Android) un capacitor:// continua fora, i un altre host també. Es compara
 * protocol i host, no l'origen: el parser d'URL dona 'null' com a origen
 * d'un esquema que no és especial.
 */
const esDeLAppNativa = (u) => {
  const pagina = window.location;
  return u.protocol === ESQUEMA_NATIU && pagina.protocol === ESQUEMA_NATIU
    && Boolean(pagina.host) && u.host === pagina.host && !u.username && !u.password;
};

/* Fase C (Capacitor 8; ordre del Mestre, 261019) · La base d'un camí relatiu:
   l'origen de la finestra, com sempre. A l'app nativa d'iOS, l'adreça sencera
   de la pàgina: si el WebView donara 'null' com a origen de l'esquema natiu
   (és el que diu el parser d'URL), tot camí propi tornaria a caure. El
   protocol i el host que es miren són els mateixos. */
const baseDeLaFinestra = () => (window.location.protocol === ESQUEMA_NATIU ? window.location.href : window.location.origin);

export function isSafeUrl(url) {
  if (typeof url !== 'string' || !url) return false;
  const cleanUrl = url.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
  if (cleanUrl.startsWith('//')) return false;
  try {
    const u = new URL(cleanUrl, baseDeLaFinestra());
    return (u.protocol === 'http:' || u.protocol === 'https:' || esDeLAppNativa(u)) && !cleanUrl.toLowerCase().startsWith('javascript:');
  } catch {
    return false;
  }
}

export function isSafeAsset(url) {
  if (typeof url !== 'string' || !url) return false;
  if (url.startsWith('data:image/')) return true;
  return isSafeUrl(url);
}

/**
 * W4-07 · La ruta de l'autor d'una boina taronja (targeta o pàgina), o null.
 * Un camí de l'app ('/…') passa per la frontera de les portes (esRutaDeLaPorta
 * de PortesTargeta.jsx: esRutaInterna + resolRuta), que no mira el protocol de
 * la finestra: a l'app nativa (capacitor://localhost) isSafeUrl el deixava
 * sense enllaç. Una adreça absoluta continua passant per isSafeUrl.
 * T6 (ordre del Mestre, 261004) · Una sola regla per a UniversalCard i
 * BarraTaronja: abans només la targeta la tenia.
 */
export function rutaDAutorSegura(href) {
  if (typeof href !== 'string' || !href) return null;
  /* Onada 8 (261009) · La boina de Sóc de Poble porta al seu perfil públic,
     mai a la pàgina del projecte: una ruta vella desada ('/projecte', en un
     HTML o en unes dades d'abans) es llig com la nova. */
  const ruta = esRutaDelProjecte(href) ? DEFAULT_AUTHOR.href : href;
  if (ruta.startsWith('/')) return esRutaInterna(ruta) && resolRuta(ruta) !== null ? ruta : null;
  return isSafeUrl(ruta) ? ruta : null;
}

/* Auditoria 261007 (B) · S'ha retirat isValidDate(dd, mm, yy): cap
   consumidor, ni a les proves. Les dates de la barra taronja les llig el lector
   únic (barres/pastillaCalendari.js → editorial.js). */

/* Onada 8 (261009) · Els logotips de Sóc de Poble (MARQUES: els PNG de 256 px
   d'alt) i els d'abans en SVG (MARQUES_SVG_ANTIGUES), amb la mateixa clau.
   Pla 261027_1154 (P1-61) · Viuen a config/imatgeSocial.js, la fulla sense
   imports del selector de la imatge social, que també els ha de reconéixer
   com a reserves. Mateixos valors i mateixos objectes congelats: este mòdul
   els llig d'allí i continua exportant MARQUES_SVG_ANTIGUES amb el mateix
   nom; MARQUES continua sent interna ací. */
export { MARQUES_SVG_ANTIGUES };

/* L'avatar es resol en llegir-lo, no en importar el mòdul: així hi val la
   base de recursos que l'amfitrió fixe després (config/assetResolver.js).
   T6 (ordre del Mestre, 261004) · `href`: la boina de «Sóc de Poble» porta a
   la pàgina de l'entitat. És una ruta de config/navigation.js escrita ací en
   literal: importar-la arrossegaria la llavor (identitatsSeed.js) a cada
   mòdul que llig estes utilitats i obriria la porta a un cicle d'importació.
   Una prova en fixa la igualtat.
   Onada 8 (261009) · Derogat el /projecte: la boina porta al perfil públic de
   l'entitat, RUTA_PERFIL_PROJECTE ('/empresa/socdepoble'). /projecte continua
   sent la pàgina editorial del projecte, però ja no és cap boina. */
export const DEFAULT_AUTHOR = {
  name: 'Sóc de Poble',
  location: 'La Torre de les Maçanes',
  href: '/empresa/socdepoble',
  get avatarUrl() { return resolveAsset(MARQUES.avatar); },
  /* Norma del Mestre, 261004 (prompt 261004_1108, logotips) · El logotip de
     pàgina de l'entitat: el rectangular, negre per al tema clar i blanc per
     al fosc (el quadrat verd és l'avatar de la boina). Es resol en llegir-lo,
     com l'avatar. PageFrame el pinta dalt de l'H1 de tota pàgina que signa
     Sóc de Poble; la fitxa pública de l'entitat el passa com a logoEntitat. */
  get logo() {
    return {
      clar: resolveAsset(MARQUES.clar),
      fosc: resolveAsset(MARQUES.fosc),
      alt: 'Logotip Sóc de Poble'
    };
  }
};

/* Onada 8 (261009) · La ruta de la pàgina de l'entitat d'abans: la pàgina
   editorial del projecte (RUTA_PROJECTE de config/navigation.js), escrita en
   literal pel mateix motiu que DEFAULT_AUTHOR.href. Hi ha HTML desat amb
   data-autor-ruta="/projecte" (targetes incrustades) i cap pàgina no ha de
   perdre el logotip per això. */
const RUTA_DEL_PROJECTE_ANTIGA = '/projecte';

/** Cert si la ruta d'una boina és la de Sóc de Poble: la del seu perfil
 *  (DEFAULT_AUTHOR.href) o la d'abans ('/projecte'). Fa d'identitat: el
 *  logotip de la capçalera i la signatura de les targetes incrustades. */
export const esRutaDelProjecte = (ruta) => ruta === DEFAULT_AUTHOR.href || ruta === RUTA_DEL_PROJECTE_ANTIGA;

/* Relleu 261007 («Límits» §5) · Les guardes de l'avatar i de la marca de la
   capçalera, una sola còpia. Abans vivien repetides a PageFrame.jsx (que no
   les exportava), a detail/elementDeSeccio.js (esMarcaDeSocDePoble) i a
   mercat/imatgesDeProducte.js (camiDeRecurs): ara les tres en lligen
   d'ací, amb el mateix cos literal (DOM idèntic). Pures: cap React ni xarxa. */

/** El descriptor d'una imatge de capçalera es pot pintar si el src és segur
 *  (isSafeAsset, el filtre de l'avatar de la boina) abans i després de
 *  resoldre'l: resolveAsset convertiria un «javascript:» o un «//altre.domini»
 *  en un camí propi trencat. Un sdp-media:// no hi passa: el resol el port. */
export const esAvatarSegur = (src) => isSafeAsset(src) && isSafeAsset(resolveAsset(src));

/** El camí d'una URL o d'un camí, sense origen ni consulta (la base és
 *  inventada: només val per a comparar camins). Si no s'analitza, el text. */
export const camiDe = (url) => {
  try {
    return new URL(url, 'http://sdp.invalid').pathname;
  } catch {
    return String(url);
  }
};

/**
 * Correcció dels verificadors (ordre del Mestre, 261004; skill sdp-pedra-seca
 * §11) · La marca de Sóc de Poble (l'avatar quadrat de la boina i el logotip
 * rectangular, clar i fosc) no és mai l'avatar d'una persona ni de la IA: és
 * el que porta l'avatar_url d'un producte o d'un agent de la llavor quan
 * falta la foto. Es compara el camí resolt amb la base d'ara (SPA, WordPress
 * amb base-camí o amb URL absoluta), sense origen ni consulta: també un src
 * ja resolt (DEFAULT_AUTHOR.avatarUrl) o una URL absoluta del mateix fitxer.
 * Onada 8 (261009) · També l'SVG d'abans de cada marca (MARQUES_SVG_ANTIGUES).
 */
export function esMarcaDeLEntitat(url) {
  const cami = camiDeLaMarca(url);
  const { clar, fosc } = DEFAULT_AUTHOR.logo;
  return [DEFAULT_AUTHOR.avatarUrl, clar, fosc].some((marca) => camiDe(marca) === cami);
}

/**
 * Onada 8 (261009) · El camí d'un recurs resolt amb la base d'ara (com
 * camiDe(resolveAsset(url))), però l'SVG d'abans d'una marca dona el camí
 * del seu PNG: l'SVG i el PNG del mateix logotip són el mateix recurs. Només
 * per a comparar (esMarcaDeLEntitat i la deduplicació de les fotos d'un
 * producte, imatgesDeProducte.js), mai per a pintar.
 */
export function camiDeLaMarca(url) {
  const cami = camiDe(resolveAsset(url));
  const clau = Object.keys(MARQUES_SVG_ANTIGUES).find((nom) => camiDe(resolveAsset(MARQUES_SVG_ANTIGUES[nom])) === cami);
  return clau ? camiDe(resolveAsset(MARQUES[clau])) : cami;
}

/* T22 (Mestre, 260927) · La persona sense sessió és el Foraster, i el seu
   poble és sempre este. Nom i poble van junts: qualsevol barra taronja,
   targeta o capçalera que pinte el convidat llig d'ací, mai d'un literal
   propi. Amb sessió, nom i poble reals.
   Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010) ·
   «Foraster» guanya un segon sentit, NOMÉS als dos errors del xat: amb
   sessió, però sense constar en este poble. SDP-XAT-003 diu «Estàs en Mode
   Foraster…» (tu no hi constes) i SDP-XAT-004, «Esta persona és forastera en
   este poble.» (l'altra persona no n'és). Eixos textos viuen a i18n.js
   (section.xat.error.noMembre i .noDelPoble) i a data/supabase/xat.js, no
   ací: esta constant continua sent només la del convidat sense sessió, i
   autorDeSessio, davall, no canvia. */
export const FORASTER = Object.freeze({
  name: 'Foraster',
  location: 'Poble de la persona forastera'
});

/* Nom i poble que es pinten per a qui mira, a partir de la sessió (forma
   de `currentUser` que ja usa IdentitatContext) i sense tocar cap backend.
   Sense sessió, el Foraster sencer. Amb sessió, el nom de la persona i el
   poble que viatja a `user_metadata.town_name` (o buit si no en té: una
   persona registrada sense poble no es pinta com a Foraster; que el xat li
   diga «Mode Foraster» si no consta al poble és cosa dels seus errors,
   vegeu la nota de l'Onada 10 de dalt). */
export function autorDeSessio(currentUser) {
  if (!currentUser) return { name: FORASTER.name, location: FORASTER.location };
  const meta = currentUser.user_metadata || {};
  return {
    name: meta.name || currentUser.full_name || FORASTER.name,
    location: meta.town_name || ''
  };
}

export const PAGE_CHROME_MODES = new Set(['none', 'page', 'context', 'full', 'system']);
