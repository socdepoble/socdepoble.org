/**
 * pujadaImatge.js — Gauntlet nocturn 261016, Bloc 1 (ordre del Mestre, «Llei
 * del Quadrat») · Les mides de les imatges que es pugen i el fitxer que ix de
 * la compressió, en UNA sola font. La consumixen la pujada de la closca
 * (useHeroImageHandler), la finestra de retall de la fitxa
 * (useEnquadramentImatge), l'ajust d'imatge del compte (DetallAjust) i l'ordre
 * «/» Imatge del text enriquit. Pla 261022_1645 · I la guarda WebP de l'última
 * porta abans de Storage (garantixWebp).
 *
 * No viu a imageUtils.js: moltes proves substituïxen eixe mòdul sencer amb
 * només compressImage, i qualsevol exportació nova hi faltaria. Per això la
 * compressió dins del pressupost (fotoDinsDelPressupost) viu ací i importa
 * compressImage, que eixes proves sí que donen.
 *
 * L'OG (1.200 × 630) no és d'ací: ja està en servei i no es toca.
 */
import { compressImage } from './imageUtils.js';
import {
  FORMAT_JPEG, FORMAT_PNG, FORMAT_WEBP, formatImatge,
} from '../components/universal/enquadrament/netejaMetadades.js';
import {
  ERROR_EXIF_NO_CONSERVABLE, ERROR_EXIF_NO_CONSERVABLE_CAMERA, ETIQUETA_CONSERVA_CAMERA, ETIQUETA_CONSERVA_EXIF,
  ajustaPrecisioGps, errorExifNoConservable, esNoConservable, exifCapEnFormat, exifPublicable, teUbicacioOData,
} from '../components/universal/enquadrament/exifIncrustat.js';

/* Gauntlet 261016 (Codex, 02:26) · Els avisos de quan l'EXIF no es pot
   conservar viuen amb la casella (exifIncrustat.js): ací es tornen a donar,
   amb els del pressupost, per a qui puja. */
export { ERROR_EXIF_NO_CONSERVABLE, ERROR_EXIF_NO_CONSERVABLE_CAMERA };

/** El costat de l'avatar: un quadrat de 400 × 400 px, en WebP. */
export const MIDA_AVATAR = 400;
/** El costat del logotip: 600 × 600 px (sense ordre de canvi). */
export const MIDA_LOGOTIP = 600;
/** El costat de la capçalera i de la targeta (la vinyeta), que són la mateixa imatge: 1.200 × 1.200 px. */
export const MIDA_CAPCALERA = 1200;
/**
 * El pes màxim d'una foto (capçalera, targeta o avatar): «<80 KB» en
 * decimal, és a dir, MENYS de 80.000 bytes (la comparació és estricta: una de
 * 80.000 exactes no hi cap). El logotip en queda fora: és un PNG amb
 * transparència (si el navegador no fa WebP) i la seua mida no té ordre.
 */
export const PRESSUPOST_PUJADA = 80000;
/*
 * Gauntlet 261016 (P1 de l'auditoria adversarial) · La qualitat es BUSCA, no
 * baixa per una escala fixa. La Llei fixa la mida (1.200 × 1.200, l'avatar
 * 400 × 400) i el pressupost: l'única variable és la qualitat. L'escala
 * d'abans (0,8 → 0,4) no hi arribava amb els codificadors de veres. Mesures
 * de Claude (Gauntlet 261016) amb el codificador de Chromium
 * (canvas.toDataURL) sobre fotos del repo retallades al centre a
 * 1.200 × 1.200, en bytes:
 *   DSC00320.JPG  jpg 0,8=168.753 0,6=100.203 0,4=68.808 0,3=54.468 0,2=39.150 0,15=30.786
 *                 webp 0,8=95.145 0,6=56.196 0,4=39.237 0,3=31.920 0,2=26.256 0,15=23.052
 *   DSC00410.JPG  jpg 0,8=231.942 0,6=146.376 0,4=106.995 0,3=87.270 0,2=63.159 0,15=49.887
 *                 webp 0,8=186.027 0,6=123.663 0,4=90.315 0,3=71.073 0,2=54.345 0,15=45.672
 *   DSC01197.JPG  jpg 0,4=122.097 0,3=103.536 0,2=80.649 0,15=67.233
 *                 webp 0,4=77.457 0,3=67.314 0,2=56.688 0,15=51.588
 *   P_20161028_150735.jpg  jpg 0,4=112.419 0,3=91.848 0,2=67.743 0,15=54.624
 *                          webp 0,4=91.236 0,3=75.357 0,2=60.951 0,15=52.959
 * Amb l'escala d'abans, dues de quatre no hi cabien ni en WebP, i en JPEG
 * (tot Apple: WebKit no codifica WebP al canvas) només una. A 0,15 totes
 * quatre hi caben en els dos formats; la més pesada, DSC01197 en JPEG, a
 * 67.233 B. Les corbes viuen a pujadaImatge.test.js (CORBES_MESURADES).
 *
 * La reixa són els múltiples de 0,04 de 0,04 a 0,8: conté totes les
 * qualitats de l'escala d'abans (com que el pes creix amb la qualitat, cap
 * foto que abans hi cabia ix pitjor) i baixa fins a 0,04 per a les fotos més
 * denses que les mesurades. La cerca no torna mai un intent que no hi cap,
 * encara que un codificador no fóra monòton. El sostre,
 * 0,8, és el primer intent de sempre (T46): una foto que ja hi cabia no canvia
 * ni un byte i costa una sola codificació. Per damunt no es puja: seria una
 * altra foto per a les que ja hi cabien (Llei del Píxel).
 */
/** La qualitat del primer intent, la de sempre: el sostre de la cerca. */
export const QUALITAT_MAXIMA = 0.8;
const PAS_QUALITAT = 0.04;
/** Les qualitats on es busca, de la més baixa a la més alta (20: 0,04, 0,08… 0,8). */
export const QUALITATS_DE_LA_CERCA = Object.freeze(Array.from(
  { length: Math.round(QUALITAT_MAXIMA / PAS_QUALITAT) },
  (_, i) => Math.round((i + 1) * PAS_QUALITAT * 100) / 100,
));
/** La qualitat més baixa que es prova: si ni esta hi cap, l'error honest. */
export const QUALITAT_MINIMA = QUALITATS_DE_LA_CERCA[0];
/**
 * Les codificacions que pot gastar una foto, com a molt: el sostre, la cerca
 * binària entre les 19 de davall (⌈log₂ 20⌉ = 5) i la reserva JPEG, que
 * passa una sola vegada (1 + 5 + 1). En un navegador amb WebP, 6.
 */
export const MAX_CODIFICACIONS = 7;
/** El que es diu quan ni la qualitat més baixa hi cap: no es puja res. */
export const ERROR_PRESSUPOST = 'La imatge pesa massa fins i tot comprimida; prova amb una altra foto.';
/**
 * Gauntlet 261016 (Bloc 1.2) · El mateix, quan el que no hi cap és l'EXIF que
 * la persona ha triat conservar: la foto sola sí que hi cabria. Mana la foto i
 * el pressupost (mai una foto més gran ni pitjor per a fer-hi lloc): no es
 * puja res i es diu com eixir-ne.
 */
export const ERROR_PRESSUPOST_EXIF = `La foto pesa massa amb la ubicació i la data; desmarca «${ETIQUETA_CONSERVA_EXIF}» o prova amb una altra foto.`;
/** Gauntlet 261016 (Codex, 02:26) · El mateix, d'una foto que només porta la càmera (la casella diu una altra cosa). */
export const ERROR_PRESSUPOST_EXIF_CAMERA = `La foto pesa massa amb les dades de la càmera; desmarca «${ETIQUETA_CONSERVA_CAMERA}» o prova amb una altra foto.`;
/**
 * Els avisos de la foto que qui puja ha de mostrar tal qual (no són errors de
 * connexió): el pressupost i l'EXIF que no hi cap o que no es pot conservar.
 */
export const AVISOS_DE_LA_FOTO = Object.freeze([
  ERROR_PRESSUPOST, ERROR_PRESSUPOST_EXIF, ERROR_PRESSUPOST_EXIF_CAMERA, ERROR_EXIF_NO_CONSERVABLE, ERROR_EXIF_NO_CONSERVABLE_CAMERA,
]);
/** El missatge és un dels AVISOS_DE_LA_FOTO? */
export const esAvisDeLaFoto = (missatge) => AVISOS_DE_LA_FOTO.includes(missatge);
const errorPressupostExif = (dades) => (teUbicacioOData(dades) ? ERROR_PRESSUPOST_EXIF : ERROR_PRESSUPOST_EXIF_CAMERA);

const EXTENSIONS = Object.freeze({ [FORMAT_JPEG]: 'jpg', [FORMAT_PNG]: 'png', [FORMAT_WEBP]: 'webp' });

/* Els 12 primers bytes d'un data URL en base64 (16 caràcters), els que
   necessita formatImatge. Res més es descodifica. */
function primersBytes(dataUrl) {
  const coma = dataUrl.indexOf(',');
  if (coma < 0 || !/;base64$/i.test(dataUrl.slice(0, coma))) return null;
  try {
    return Uint8Array.from(atob(dataUrl.slice(coma + 1, coma + 17)), (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

/**
 * El tipus real d'una imatge comprimida: el dels bytes (formatImatge) i, si
 * no s'hi reconeix, el del blob. Un navegador sense codificador WebP en canvas
 * (Safari 16) torna PNG encara que se li demane WebP, i el fitxer ho ha de
 * dir. Si ni els bytes ni el blob diuen res conegut, el de sempre: WebP.
 */
export function tipusReal(dataUrl, blob) {
  const pelsBytes = typeof dataUrl === 'string' ? formatImatge(primersBytes(dataUrl)) : null;
  if (pelsBytes) return pelsBytes;
  const delBlob = String(blob?.type || '').toLowerCase();
  return Object.hasOwn(EXTENSIONS, delBlob) ? delBlob : FORMAT_WEBP;
}

/**
 * Un data URL comprimit tornat a File per a pujar-lo: `nomBase` amb
 * l'extensió del tipus real, i eixe tipus (tipusReal). Els bytes són els del
 * data URL, sense tocar.
 */
export async function fitxerDeDataUrl(dataUrl, nomBase) {
  const resposta = await fetch(dataUrl);
  const blob = await resposta.blob();
  const tipus = tipusReal(dataUrl, blob);
  return new File([blob], `${nomBase}.${EXTENSIONS[tipus]}`, { type: tipus });
}

/**
 * Els bytes que porta un data URL en base64, sense descodificar-lo. Un valor
 * que no es pot mesurar (cap data URL, o sense base64, que el canvas no fa
 * mai) torna Infinity: no cap a cap pressupost.
 */
export function bytesDeDataUrl(dataUrl) {
  const coma = typeof dataUrl === 'string' ? dataUrl.indexOf(',') : -1;
  if (coma < 0 || !/;base64$/i.test(dataUrl.slice(0, coma))) return Number.POSITIVE_INFINITY;
  const dades = dataUrl.slice(coma + 1);
  const farciment = dades.endsWith('==') ? 2 : (dades.endsWith('=') ? 1 : 0);
  return Math.floor((dades.length * 3) / 4) - farciment;
}

/**
 * Gauntlet 261016 (Bloc 1, Llei del Quadrat) · Una foto (capçalera, targeta o
 * avatar) comprimida a `mida` px pel costat llarg i dins del pressupost, amb
 * cada intent a la MATEIXA mida. Si cap no hi cap, llança
 * Error(ERROR_PRESSUPOST) i no es puja res. El logotip no passa per ací (fora
 * del pressupost).
 *
 * Gauntlet 261016 (P1 de l'auditoria adversarial) · Primer, el sostre
 * (QUALITAT_MAXIMA): si hi cap, és la foto de sempre. Si no, la cerca binària
 * de QUALITATS_DE_LA_CERCA torna la qualitat MÉS ALTA que fa menys de
 * PRESSUPOST_PUJADA bytes, i es guarda el millor intent que hi cap: no es
 * torna a codificar. L'error, només si ni QUALITAT_MINIMA hi cap. Mai més de
 * MAX_CODIFICACIONS.
 *
 * El format és WebP. Si el navegador no el sap codificar en canvas (WebKit:
 * Safari 16 del Baseline i els següents, i tots els navegadors d'iOS, torna
 * PNG), la foto es torna a codificar en JPEG, i des d'eixe intent tots van en
 * JPEG: un PNG de 1.200 × 1.200 no cabria mai al pressupost. En WebKit, doncs,
 * el fitxer és un JPEG, i ho diu (tipusReal).
 *
 * `ambFitxer` (per a pujar al servidor) mesura el File que pujaria; sense, el
 * data URL que es desaria, sense cap fetch. Torna { dataUrl, fitxer } (fitxer
 * null sense `ambFitxer`).
 *
 * Gauntlet 261016 (Bloc 1.2, mandat del Mestre, pla §0.1.3) · `conservaExif`
 * i `original` (la tria de la casella del DialegEnquadrament) passen a cada
 * intent de compressImage: l'EXIF publicable de l'original va dins de la foto
 * i COMPTA dins del pressupost. Si ni la qualitat més baixa hi cap però la
 * foto sense l'EXIF sí que hi cabria, l'error és ERROR_PRESSUPOST_EXIF. Sense
 * `conservaExif`, tot com abans (cap clau nova a compressImage).
 *
 * Gauntlet 261016 (Codex, relleu 02:26) · Qui ha triat conservar l'EXIF no
 * rep mai una foto neta en silenci: si l'original en porta però no es pot
 * conservar (exifPublicable, ESTAT_EXIF.NO_CONSERVABLE), l'avís
 * ERROR_EXIF_NO_CONSERVABLE abans de comprimir res; si el que no hi cap és el
 * format que ha eixit (un APP1 de JPEG en fa 65.527 B; el WebP, el
 * pressupost: sostreTiff), el mateix avís en eixe intent. Els avisos que
 * parlen de la casella porten l'etiqueta que es veu (la de la càmera, si no hi
 * ha ubicació ni data).
 *
 * P1-64 (pla 261028_1526 §3.1.1) · `precisio` ('exacta', '100m' o 'poble'),
 * la de les píndoles del diàleg, passa a cada intent amb `conservaExif`: el
 * fitxer porta la ubicació arrodonida (ajustaPrecisioGps), la mateixa que el
 * camp. Si no es pot arrodonir, ERROR_EXIF_NO_CONSERVABLE abans de comprimir
 * res: mai el punt exacte quan la persona n'ha triat un de vague. Sense
 * `precisio`, cap clau nova a compressImage.
 */
export async function fotoDinsDelPressupost(file, {
  mida, nom = 'imatge', ambFitxer = true, conservaExif = false, original = null, precisio,
} = {}) {
  const exif = conservaExif
    ? { conservaExif: true, original: original || file, ...(precisio ? { precisio } : null) }
    : null;
  const llegit = exif ? await exifPublicable(exif.original) : null;
  if (esNoConservable(llegit)) throw new Error(errorExifNoConservable(llegit));
  if (llegit?.tiff && !ajustaPrecisioGps(llegit.tiff, precisio)) throw new Error(errorExifNoConservable(llegit));
  let format = FORMAT_WEBP;
  // El pes més lleuger que s'ha vist (el de la qualitat més baixa): diu si l'EXIF és el que no hi cap.
  let menor = Number.POSITIVE_INFINITY;
  /* Un intent a `qualitat`, a la MATEIXA mida: { dataUrl, fitxer } si hi cap; null si no. */
  const prova = async (qualitat) => {
    let dataUrl = await compressImage(file, { maxSize: mida, format, quality: qualitat, ...exif });
    if (format === FORMAT_WEBP && tipusReal(dataUrl) !== FORMAT_WEBP) {
      format = FORMAT_JPEG;
      dataUrl = await compressImage(file, { maxSize: mida, format, quality: qualitat, ...exif });
    }
    if (llegit?.tiff && !exifCapEnFormat(llegit, tipusReal(dataUrl))) throw new Error(errorExifNoConservable(llegit));
    const fitxer = ambFitxer ? await fitxerDeDataUrl(dataUrl, nom) : null;
    const pes = fitxer ? fitxer.size : bytesDeDataUrl(dataUrl);
    menor = Math.min(menor, pes);
    return pes < PRESSUPOST_PUJADA ? { dataUrl, fitxer } : null;
  };
  const sostre = await prova(QUALITAT_MAXIMA);
  if (sostre) return sostre;
  // La cerca, per davall del sostre: si hi cap, amunt; si no, avall.
  let millor = null;
  let baix = 0;
  let alt = QUALITATS_DE_LA_CERCA.length - 2;
  while (baix <= alt) {
    const mig = Math.floor((baix + alt) / 2);
    const intent = await prova(QUALITATS_DE_LA_CERCA[mig]);
    if (intent) {
      millor = intent;
      baix = mig + 1;
    } else {
      alt = mig - 1;
    }
  }
  if (millor) return millor;
  throw new Error(llegit?.tiff && menor - llegit.tiff.length < PRESSUPOST_PUJADA ? errorPressupostExif(llegit) : ERROR_PRESSUPOST);
}

/*
 * Pla 261022_1645 (tasca 2; ordre del Mestre, àudio 261022_1637: «qualsevol
 * imatge que entre al sistema desaparega com a jpeg i es convertisca en
 * webp») · La guarda de l'última porta abans de Storage. La criden els dos
 * camins que pugen al servidor (PerfilContext · pujaMitja i NotesEditor ·
 * pujarImatgeDeNota), just abans d'uploadToStorage. Els camins d'abans ja
 * comprimixen a WebP (fotoDinsDelPressupost, l'enquadrament, el text
 * enriquit; el xat, a adjuntLocal · preparaAdjunt): ací arriba el que se'ls
 * escapa.
 *   · Un JPEG o un PNG es torna a codificar en WebP amb compressImage (la
 *     foto ix dreta segons l'EXIF, que un toBlob directe no faria) a 1.600 px
 *     pel costat llarg com a molt, sense ampliar-la mai, i a qualitat 0,82.
 *     El nom passa a .webp i el tipus, a image/webp. Com tota recodificació
 *     sense `conservaExif`, el resultat no porta l'EXIF ni el GPS.
 *   · Un WebP, un AVIF, un PDF (el Bloc) o qualsevol altra cosa passen tal
 *     qual: un WebP que ja ve de fotoDinsDelPressupost porta la qualitat del
 *     pressupost i l'EXIF que la persona ha triat, i no es toca.
 *   · WebKit (Safari 16 del Baseline i tots els navegadors d'iOS) no sap
 *     codificar WebP en canvas i torna PNG: la guarda no ho pot fer i el
 *     fitxer es puja com venia (el JPEG de la reserva). «Zero JPEG» en
 *     WebKit demana un codificador WebP en WASM (dependència nova: aprovació
 *     del Mestre) o convertir-lo al servidor.
 */
/** El costat llarg màxim d'una imatge que la guarda torna a codificar. */
export const MAX_COSTAT_WEBP = 1600;
/** La qualitat WebP de la guarda (la del pla 261022_1645). */
export const QUALITAT_WEBP = 0.82;
const A_CONVERTIR = Object.freeze([FORMAT_JPEG, FORMAT_PNG]);

/**
 * El fitxer que es pot pujar a Storage: un JPEG o un PNG, en WebP; la resta,
 * tal qual. Si el navegador no sap fer WebP (WebKit), el mateix fitxer.
 * `comprimeix` és injectable per a les proves.
 */
export async function garantixWebp(fitxer, { comprimeix = compressImage } = {}) {
  if (!(fitxer instanceof Blob) || !A_CONVERTIR.includes(fitxer.type)) return fitxer;
  const dataUrl = await comprimeix(fitxer, { maxSize: MAX_COSTAT_WEBP, format: FORMAT_WEBP, quality: QUALITAT_WEBP });
  if (tipusReal(dataUrl) !== FORMAT_WEBP) return fitxer;
  const nomBase = String(fitxer.name || 'imatge').replace(/\.[^./]*$/, '') || 'imatge';
  return fitxerDeDataUrl(dataUrl, nomBase);
}
