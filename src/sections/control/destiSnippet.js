/**
 * destiSnippet.js · CU (Onada 3, 261003) · On porta cada cosa de la fitxa del
 * Snippet a Control › Utilitats.
 *
 *   · La targeta de la llista porta a la fitxa amb una consulta sobre la
 *     mateixa ruta, sense cap ruta nova: /control?fitxa=snippet, i a l'àlies,
 *     /utilitats?fitxa=snippet. Les rutes de Control són exactes (App.jsx), i
 *     és el mateix patró que el Snippet Curador (/notes?mode=desa).
 *   · El botó principal porta on diga la configuració, mai a un lloc fixat ací
 *     (Model B): la clau `snippetChromeUrl` de la capa del paquet, la que
 *     segella Sóc de Poble i cap amfitrió no pot trepitjar (capaDelPaquet.js).
 *     Si un amfitrió poguera posar-la, podria fer instal·lar una extensió que
 *     no és nostra. Avui la capa encara no porta eixa clau: sense destí, la
 *     fitxa pinta el botó desactivat i ho explica.
 *   · Per a activar-lo no n'hi ha prou amb la capa de compilació: les dos
 *     entrades (main.jsx i embed.jsx) FIXEN la capa amb fixaCapaDelPaquet() i
 *     capaDelPaquet() torna la fixada abans que la de compilació. La recepta
 *     sencera és a la nota CU.txt (§5) i FitxaSnippet.capa.test.jsx la vigila.
 *   · La via per a la gent del poble és la fitxa de la Chrome Web Store. Un
 *     .zip es descarrega i la fitxa explica com carregar-lo desempaquetat (mode
 *     de desenvolupador). Un .crx no es pot instal·lar fora de la botiga en el
 *     Chrome estable de Windows i de macOS: no s'accepta.
 *   · Onada 10 (261010) · I la data del Snippet (DATA_DEL_SNIPPET), que
 *     lligen la targeta i la fitxa.
 *
 * Pur: sense React ni xarxa.
 */
import { capaDelPaquet } from '../../config/capaDelPaquet.js';
import { validaUrlExterna } from '../../data/origenNota.js';

/** La clau de la consulta que obri una fitxa d'Utilitats. */
export const CLAU_FITXA = 'fitxa';
/** El valor que obri la fitxa del Snippet. */
export const FITXA_SNIPPET = 'snippet';
/** La clau de la capa del paquet amb l'enllaç d'instal·lació o de descàrrega. */
export const CLAU_URL_SNIPPET = 'snippetChromeUrl';

/* Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010, M4:
   «totes les targetes de plugin del Panell passen a targeta canònica») · LA
   DATA del Snippet, per a la boina de la seua targeta (ControlSection.jsx) i
   per a la barra taronja de la seua fitxa (FitxaSnippet.jsx): una sola font,
   targeta i pàgina diuen el mateix. Cap data inventada (regla T51 del Mestre,
   editorial.js).
   Criteri: el dia en què van nàixer la targeta i la fitxa, «CU (Onada 3,
   261003)».
   Evidència: la capçalera d'este fitxer, la de FitxaSnippet.jsx i la de
   ControlSection.jsx, i les de les seues proves, totes amb eixe mateix
   segell; i .agents/ESTAT.md, relleu «2026-10-03 · Claude · Onada 3
   completa», que llista la «fitxa del Snippet» entre el que s'hi va fer.
   Només el DIA: cap d'eixes fonts en diu l'hora, i l'hora no s'inventa. La
   pastilla pinta «03/10/26» sense hora (dataHoraDeBarra, font de només dia).
   Les altres targetes de plugin porten l'hora del document de la seua ordre
   (registrePlugins.js); ací no hi ha cap document amb hora que es puga citar.
   Pendent del Mestre: confirmar el dia i, si la vol, dictar-ne l'hora. */
export const DATA_DEL_SNIPPET = '2026-10-03';

/* Onada 11 (261010; prompt 261010_1730, tasca 6, D5) · LES ETIQUETES del
   Snippet, al costat de la data i per la mateixa raó: targeta i fitxa diuen
   el mateix. Abans vivien a la constant SNIPPET de ControlSection.jsx i la
   fitxa no les pintava. Una Categoria i una Etiqueta, en l'ordre de la skill
   sdp-universal-page (§4), sense enllaç (D3 de l'Onada 10), amb les classes
   de les etiquetes de les targetes de plugin (registrePlugins.js). Són
   l'esborrany per al Mestre de l'Onada 10: la Categoria, la mateixa de les
   eines del registre; l'Etiqueta diu què és. */
export const ETIQUETES_DEL_SNIPPET = Object.freeze([
  Object.freeze({ text: 'Eina', className: 'sdp-badge-category' }),
  Object.freeze({ text: 'Extensió', className: 'sdp-badge-tag' })
]);

const RUTA_CONTROL = '/control';
const RUTA_UTILITATS = '/utilitats';
/* Un paquet d'extensió de Chrome per a carregar desempaquetat: es descarrega. */
const PAQUET = /\.zip$/i;
/* Un paquet signat de fora de la botiga: Chrome no el deixa instal·lar. */
const CRX = /\.crx$/i;

/**
 * La ruta de la fitxa: a l'àlies si la persona hi és (/utilitats) i, des de
 * qualsevol altre lloc, al Panell de Control. Mai una ruta que no munta
 * ControlSection.
 */
export function rutaDeLaFitxa(pathname) {
  const base = pathname === RUTA_UTILITATS ? RUTA_UTILITATS : RUTA_CONTROL;
  return `${base}?${CLAU_FITXA}=${FITXA_SNIPPET}`;
}

/** L'enllaç configurat a la capa del paquet, o '' si no n'hi ha cap. */
export function urlDelSnippet(capa = capaDelPaquet()) {
  const valor = capa?.[CLAU_URL_SNIPPET];
  return typeof valor === 'string' ? valor.trim() : '';
}

/**
 * On porta el botó: null si `valor` no és una adreça vàlida, o
 * { href, descarrega, extern }. Es valida com un contingut de fora
 * (validaUrlExterna: sense credencials, 2048 caràcters com a màxim) i, a més,
 * només https: un paquet d'extensió no viatja en clar. Un .crx no val (no
 * s'instal·la fora de la botiga). `descarrega`: el camí acaba en .zip.
 * `extern`: l'origen no és el de l'app (`origenApp`); entre orígens, el
 * navegador no fa cas de l'atribut download i l'enllaç s'obri a part.
 */
export function destiDelSnippet(valor, origenApp = '') {
  const { url } = validaUrlExterna(valor);
  if (!url) return null;
  const adreca = new URL(url);
  if (adreca.protocol !== 'https:') return null;
  if (CRX.test(adreca.pathname)) return null;
  return {
    href: adreca.href,
    descarrega: PAQUET.test(adreca.pathname),
    extern: adreca.origin !== origenApp
  };
}
