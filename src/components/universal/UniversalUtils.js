import { resolveAsset } from '../../config/assetResolver';
import { esRutaInterna } from '../../config/objecteConnectable.js';
import { resolRuta } from '../../app/contexts/politicaRouter.js';

export function isSafeUrl(url) {
  if (typeof url !== 'string' || !url) return false;
  const cleanUrl = url.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
  if (cleanUrl.startsWith('//')) return false;
  try {
    const u = new URL(cleanUrl, window.location.origin);
    return (u.protocol === 'http:' || u.protocol === 'https:') && !cleanUrl.toLowerCase().startsWith('javascript:');
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
  if (href.startsWith('/')) return esRutaInterna(href) && resolRuta(href) !== null ? href : null;
  return isSafeUrl(href) ? href : null;
}

/* Auditoria 261007 (B) · S'ha retirat isValidDate(dd, mm, yy): cap
   consumidor, ni a les proves. Les dates de la barra taronja les llig el lector
   únic (barres/pastillaCalendari.js → editorial.js). */

/* L'avatar es resol en llegir-lo, no en importar el mòdul: així hi val la
   base de recursos que l'amfitrió fixe després (config/assetResolver.js).
   T6 (ordre del Mestre, 261004) · `href`: la boina de «Sóc de Poble» porta a
   la pàgina del projecte. És RUTA_PROJECTE de config/navigation.js escrita
   ací en literal: importar-la arrossegaria la llavor de totes les seccions
   (sectionContent.js) a cada mòdul que llig estes utilitats i obriria la
   porta a un cicle d'importació. Una prova en fixa la igualtat. */
export const DEFAULT_AUTHOR = {
  name: 'Sóc de Poble',
  location: 'La Torre de les Maçanes',
  href: '/projecte',
  get avatarUrl() { return resolveAsset('/assets/system/ui/logo-socdepoble-cuadrat-verd.svg'); },
  /* Norma del Mestre, 261004 (prompt 261004_1108, logotips) · El logotip de
     pàgina de l'entitat: el rectangular, negre per al tema clar i blanc per
     al fosc (el quadrat verd és l'avatar de la boina). Es resol en llegir-lo,
     com l'avatar. PageFrame el pinta dalt de l'H1 de tota pàgina que signa
     Sóc de Poble; la fitxa pública de l'entitat el passa com a logoEntitat. */
  get logo() {
    return {
      clar: resolveAsset('/assets/system/ui/logo-socdepoble-rect-negre.svg'),
      fosc: resolveAsset('/assets/system/ui/logo-socdepoble-rect-blanc.svg'),
      alt: 'Logotip Sóc de Poble'
    };
  }
};

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
 */
export function esMarcaDeLEntitat(url) {
  const cami = camiDe(resolveAsset(url));
  const { clar, fosc } = DEFAULT_AUTHOR.logo;
  return [DEFAULT_AUTHOR.avatarUrl, clar, fosc].some((marca) => camiDe(marca) === cami);
}

/* T22 (Mestre, 260927) · La persona sense sessió és el Foraster, i el seu
   poble és sempre este. Nom i poble van junts: qualsevol barra taronja,
   targeta o capçalera que pinte el convidat llig d'ací, mai d'un literal
   propi. Amb sessió, nom i poble reals. */
export const FORASTER = Object.freeze({
  name: 'Foraster',
  location: 'Poble de la persona forastera'
});

/* Nom i poble que es pinten per a qui mira, a partir de la sessió (forma
   de `currentUser` que ja usa IdentitatContext) i sense tocar cap backend.
   Sense sessió, el Foraster sencer. Amb sessió, el nom de la persona i el
   poble que viatja a `user_metadata.town_name` (o buit si no en té: una
   persona registrada sense poble no és forastera). */
export function autorDeSessio(currentUser) {
  if (!currentUser) return { name: FORASTER.name, location: FORASTER.location };
  const meta = currentUser.user_metadata || {};
  return {
    name: meta.name || currentUser.full_name || FORASTER.name,
    location: meta.town_name || ''
  };
}

export const PAGE_CHROME_MODES = new Set(['none', 'page', 'context', 'full', 'system']);
