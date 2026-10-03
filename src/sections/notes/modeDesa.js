/**
 * modeDesa.js · T7C (P1) · El Snippet Curador a la URL del Bloc de Notes.
 *
 * El Snippet Curador és el mateix espai de treball del Bloc en mode compacte
 * (UniversalWorkspace `compacte`), obert amb una consulta i sense cap ruta
 * nova:
 *
 *   /notes?mode=desa&url=…&titol=…[&subtitol=…][&entradilla=…][&text=…]
 *
 * Tot el seu estat és a la URL (Clàusula dels Slugs): un enllaç copiat obri
 * el mateix snippet amb la mateixa tria.
 *
 *   · mode=desa             obri el snippet en lloc del Bloc.
 *   · url, titol (o title), subtitol, entradilla, text
 *                           el contingut de fora, amb les regles de
 *                           /connectar (contingutExtern.js). Carregar la ruta
 *                           no crea res: només el botó «Desar».
 *   · carpeta               on arriba (seleccioUrl.js). Sense, o si no és una
 *                           carpeta del Bloc, la Safata d’Entrada.
 *   · categoria, etiqueta   repetibles: una clau per valor.
 *   · emoticona             un sol emoji (utils/emoji.emojiSol).
 *
 * Desar crea la nota (notaDeContingutExtern amb la carpeta triada, i les
 * categories, les etiquetes i l'emoticona) i porta a /notes?carpeta=…&nota=…
 * amb replace: Arrere no torna a un snippet ja desat.
 *
 * Disparador. El botó visible a la Pàgina Universal és decisió del Mestre:
 * ací no se n'afig cap. Mentrestant, este és el bookmarklet que obri el
 * snippet des de qualsevol web, amb l'origen de producció (canvieu-lo si
 * l'app viu en una altra adreça). Porta el títol de la pàgina (300 caràcters
 * com a màxim, MAXIM_CAMP_ORIGEN) i, si hi ha text seleccionat, l'entradeta
 * (256, MAXIM_LEMA). La prova modeDesa.test.js llig la línia de davall i
 * l'executa: si la URL que construïx deixa de ser un snippet vàlid, falla.
 *
 * Privacitat (correcció T7C-R5). La finestra s'obri amb una petició GET: la
 * consulta (l'adreça, el títol i el text seleccionat) arriba al servidor que
 * servix l'app abans de cap clic a «Desar», i pot quedar als seus registres.
 * Per això l'adreça viatja SENSE el fragment (#…): ací van els testimonis
 * d'una tornada OAuth (#access_token=…). Una pàgina que només es distingix
 * pel fragment (rutes amb #/…) es desa amb l'adreça de davant del #. La
 * consulta de la pàgina (?…) sí que viatja, perquè sovint és l'adreça
 * mateixa; si porta un testimoni, també arriba. Passar-ho tot fora de la
 * consulta xoca amb la Clàusula dels Slugs: ho ha de decidir el Mestre.
 *
 * BOOKMARKLET: javascript:(()=>{const u=new URL('/notes','https://socdepoble.org');const p=u.searchParams;p.set('mode','desa');p.set('url',location.href.split('#')[0]);p.set('titol',document.title.slice(0,300));const s=String(getSelection()||'').trim().slice(0,256);if(s)p.set('entradilla',s);open(u.href,'sdp-desa','width=480,height=720');})();
 *
 * Pur: sense React ni xarxa.
 */
import { CARPETA_CONNECTATS } from './carpetes.js';
import { contingutExternDeParams, notaDeContingutExtern } from '../connectar/contingutExtern.js';
import { emojiSol } from '../../utils/emoji.js';
import { escriuSeleccio, llegixSeleccio } from '../../components/universal/workspace/seleccioUrl.js';

/** El valor de `mode` que obri el snippet. */
export const MODE_DESA = 'desa';

/** Les claus pròpies del snippet a la consulta. */
export const CLAUS_DESA = Object.freeze({
  mode: 'mode',
  categoria: 'categoria',
  etiqueta: 'etiqueta',
  emoticona: 'emoticona'
});

/** T7 (P9) · A la URL del Bloc l'element es diu «nota» (?carpeta=&nota=&seccio=). */
export const CLAUS_BLOC = Object.freeze({ item: 'nota' });

const CAP = Object.freeze([]);

function comParams(params) {
  if (params instanceof URLSearchParams) return params;
  if (typeof params === 'string') return new URLSearchParams(params);
  return new URLSearchParams();
}

/* Valors de text nets i sense repetir, en l'ordre que arriben. */
const unics = (valors) => [...new Set((valors || CAP).map((v) => String(v ?? '').trim()).filter(Boolean))];

/** Si la consulta obri el snippet. */
export const esModeDesa = (params) => comParams(params).get(CLAUS_DESA.mode) === MODE_DESA;

/**
 * La carpeta on arribarà l'enllaç: la de la URL si és una de `carpetes`
 * ({ id }), i si no la Safata d’Entrada (on arriba tot el que es connecta).
 */
export function carpetaDeDesa(params, carpetes = CAP) {
  const { carpeta } = llegixSeleccio(params, CLAUS_BLOC);
  return carpeta !== null && carpetes.some((c) => String(c?.id) === carpeta) ? carpeta : CARPETA_CONNECTATS;
}

/**
 * La tria del snippet que porta la URL:
 * { contingut, categories, etiquetes, emoticona }. `contingut` és el de
 * contingutExternDeParams: null sense cap adreça, { ok: false, errors } si
 * no val i { ok: true, valor } si es pot desar.
 */
export function llegixDesa(params) {
  const p = comParams(params);
  return {
    contingut: contingutExternDeParams(p),
    categories: unics(p.getAll(CLAUS_DESA.categoria)),
    etiquetes: unics(p.getAll(CLAUS_DESA.etiqueta)),
    emoticona: emojiSol(p.get(CLAUS_DESA.emoticona)) || ''
  };
}

/**
 * Una còpia dels paràmetres amb la tria escrita. Per a cada camp, `undefined`
 * no el toca. `carpeta` com a seleccioUrl (null l'esborra); les llistes
 * substituïxen tots els seus valors (una llista buida els esborra); una
 * emoticona que no és un sol emoji, o buida, s'esborra.
 */
export function escriuDesa(params, { carpeta, categories, etiquetes, emoticona } = {}) {
  const next = escriuSeleccio(params, carpeta === undefined ? {} : { carpeta }, CLAUS_BLOC);
  const posaLlista = (clau, valors) => {
    if (valors === undefined) return;
    next.delete(clau);
    for (const valor of unics(valors)) next.append(clau, valor);
  };
  posaLlista(CLAUS_DESA.categoria, categories);
  posaLlista(CLAUS_DESA.etiqueta, etiquetes);
  if (emoticona !== undefined) {
    const net = emojiSol(emoticona);
    if (net) next.set(CLAUS_DESA.emoticona, net);
    else next.delete(CLAUS_DESA.emoticona);
  }
  return next;
}

/**
 * La consulta del Bloc amb una nota oberta: ?carpeta=…&nota=…, sense res del
 * snippet. Sense nota, només la carpeta.
 */
export function paramsDeLaNota({ carpeta = null, nota = null } = {}) {
  return escriuSeleccio(new URLSearchParams(), { carpeta, item: nota }, CLAUS_BLOC);
}

/**
 * L'entrada de creaNota per al contingut validat (`valor` de llegixDesa) a la
 * carpeta triada, amb les categories, les etiquetes i l'emoticona; null si
 * el contingut no val (notaDeContingutExtern).
 */
export function entradaDeDesa(valor, { carpeta = CARPETA_CONNECTATS, categories = CAP, etiquetes = CAP, emoticona = '' } = {}) {
  const entrada = notaDeContingutExtern(valor, { carpeta });
  if (!entrada) return null;
  const cats = unics(categories);
  const tags = unics(etiquetes);
  const icon = emojiSol(emoticona);
  return {
    ...entrada,
    ...(cats.length ? { categories: cats } : {}),
    ...(tags.length ? { tags } : {}),
    ...(icon ? { icon } : {})
  };
}
