/**
 * DialegEnquadrament — T46 (ordre del Mestre, 260928). Re-enquadrar la foto de
 * capçalera abans de desar-la. La miniatura del llistat (ItemMedia) i la
 * targeta del Mur pinten la mateixa heroImage: l'enquadrament val per a totes
 * (la del Mur és la còpia publicada: canvia quan la nota es torna a publicar).
 *
 * PRINCIPI: l'enquadrament es «cou» dins de l'arxiu. onDesa rep un File ja
 * retallat; al servidor no hi ha paràmetres de retall (sense migració, D2).
 * Per això re-enquadrar una imatge ja retallada només pot tancar més el pla,
 * i el diàleg ho diu abans de desar.
 *
 * CONTRACTE
 *   obert (true) · font (File | URL ja resolta) · formatInicial ('1:1') ·
 *   formats (FORMATS) · titol · descripcio · onTanca(motiu) ·
 *   onDesa(fitxer, { format, rect, sencera }) → Promise<boolean>: el pare el
 *   tanca; si llança, el missatge es mostra ací i el diàleg continua obert ·
 *   carregador / exportador / dibuixant: injectables per a les proves.
 *   «Original» sense zoom amb un File torna el MATEIX File (el camí d'abans);
 *   amb una URL no hi ha res a desar i es tanca.
 *
 * El visor és un <canvas> WYSIWYG (mida en atributs, sense style=): es mou
 * amb el dit o el ratolí (pointer events amb captura) i s'amplia amb dos dits.
 * El teclat i el lector de pantalla van pels lliscadors natius (al costat en
 * escriptori, davall en mòbil: correcció C19).
 *
 * ONADA 4, T3a (RETALLADOR i ADR multimèdia) · Ampliacions opcionals; sense
 * elles, el contracte T46 és exactament el d'abans.
 *   sortida ({ ampladaMaxima, format: 'image/webp' (reserva JPEG), qualitat })
 *     · el diàleg lliura el fitxer final i SEMPRE el torna a codificar: cap
 *     camí torna el fitxer original, que podria portar EXIF (D4).
 *   permetGeolocalitzacio (false) · ensenya «Vull geolocalitzar aquesta
 *     imatge», apagada. Encesa: llig el GPS i la data del fitxer ORIGINAL,
 *     deixa corregir-los o escriure'ls i triar la precisió. També força la
 *     recodificació.
 *   onDesa rep un tercer argument, sempre: metadades = { geolocalitzacio:
 *     { lat, lng, precisio_m, origen: 'exif'|'manual' } | null, dataCaptura }.
 *     Les coordenades viatgen com a camps, mai dins del fitxer (D6). Amb
 *     l'opció apagada, tot és null i no s'ha llegit cap GPS.
 *   lectorMetadades: injectable per a les proves.
 *   Límits (limits.js): 25 MB, 16.384 px per costat, 50 MP i HEIC, amb un
 *   avís en línia. Teclat sobre el visor: fletxes, + i −, Retorn desa.
 *
 * ONADA 4 (retallador senzill, ordre del Mestre 261008) · Calcat de la
 * finestra «Retallar foto» de Claude, per a les imatges del Perfil. Sense
 * estes dues props, el DOM i el comportament T46 són exactament els d'abans
 * (Llei del Píxel: el retallador de les Notes no canvia).
 *   senzill (false) · Títol curt i la línia d'ajuda davall (descripcio); el
 *     visor sol, centrat; una fila de zoom (−, lliscador «Ampliació», +) i la
 *     roda del ratolí; sense lliscadors de posició, sense «Forma» (si només
 *     n'hi ha una: vegeu la Directiva 261024, davall) i sense
 *     geolocalització. Peu: «Restablir» a l'esquerra; «Cancel·lar» i
 *     «Guardar» a la dreta. Sense la X: Escape continua tancant.
 *   mascara (null | 'cercle') · Amb 'cercle', el vel enfosquix el que queda
 *     fora del cercle (l'avatar es pinta redó). El fitxer continua quadrat.
 *   Directiva del Mestre (261024, àudio 22:47) · «El quadrat únic és una
 *     limitació inacceptable»: si `formats` en porta més d'una (la capçalera,
 *     FORMES.capcalera), el mode senzill pinta davall de la fila de zoom, i
 *     abans de la casella de l'EXIF, la mateixa «Forma» del T46 (GrupOpcions).
 *     Amb una sola forma (l'avatar, el logotip) el DOM és exactament el
 *     d'abans. El visor seguix la forma triada: el <canvas> pren la mida de
 *     midaVisor (atributs) i la caixa (.sdp-enquadrament__visor-caixa,
 *     fit-content) i el canvas (width i height auto amb els dos max, bloc T46
 *     de modules.css) en conserven la proporció; només el cercle de la
 *     màscara és redó. L'eixida és `sortida` (amb `costatLlarg`, 1.200 pel
 *     costat llarg) sobre el retall de la forma triada.
 *   Directiva del Mestre (261025, pla 261025_0045, T3: «el disseny és com el
 *     soroll per a allò usable») · DEROGADA la llista vertical de GrupOpcions
 *     en el mode senzill: nou ràdios amb la seua ajuda empenyien el visor fora
 *     de la vista. Ara, davall del zoom, una fila de píndoles d'un sol toc
 *     (ràdios natius en un fieldset role="radiogroup", com el selector de
 *     variants del Mercat: Tab entra per la triada i les fletxes canvien, cap
 *     JS de teclat) amb l'etiqueta curta («1:1», «16:9», «Original»…) i el nom
 *     sencer com a nom accessible («Panoràmic (16:9)»), i UNA línia de
 *     didàctica amb la forma triada i la seua ajuda. El diàleg passa a mida m
 *     i el visor es limita també per l'alçada de la pantalla
 *     (.sdp-enquadrament--formes, modules.css): la foto no ix mai de la vista
 *     mentre es tria. Amb una sola forma, el DOM de sempre (mida s).
 *
 * GAUNTLET 261016 (Bloc 1.2, mandat del Mestre, pla §0.1.3) · L'EXIF de la
 * foto es conserva de sèrie, amb la tria de la persona. Sense esta prop, el
 * diàleg és exactament el d'abans.
 *   ofereixConservarExif (false) · Si la foto triada (un File) porta EXIF
 *     (exifPublicable, exifIncrustat.js), ensenya la casella, MARCADA de
 *     sèrie, en els dos modes, davall dels controls. El text s'adapta al que
 *     porta (Codex, relleu 02:26): «Conserva la ubicació i la data de la
 *     foto» si en porta la ubicació o la data (l'avís diu la ubicació o, si
 *     no n'hi ha, la data), i «Conserva les dades de la càmera de la foto» si
 *     només porta la càmera (marca, model, MakerNote…). onDesa rep llavors, a
 *     metadades.exif, les opcions de la pujada: { conservaExif: true,
 *     original } (marcada; la compressió hi torna a posar l'EXIF publicable de
 *     l'original) o { conservaExif: false } (desmarcada: la foto ix neta, com
 *     abans). Sense casella, metadades no porta `exif`. El fitxer que lliura
 *     el diàleg no canvia: és la compressió de qui puja (compressImage) la que
 *     hi posa l'EXIF.
 *     Un EXIF que hi és però no es pot conservar (ESTAT_EXIF.NO_CONSERVABLE)
 *     també té casella, i el seu avís ho diu (errorExifNoConservable). Desar-la
 *     marcada no desa: el mateix avís dalt del diàleg, que continua obert;
 *     desmarcada, la foto ix neta. Mai una foto neta en silenci.
 *     Gauntlet 261016 (Bloc B) · Tres precisions:
 *       · Una adreça ja desada (re-enquadrar la capçalera) també: es llig
 *         l'EXIF del blob que ha obert el carregador (carregaImatge el torna),
 *         amb la mateixa casella, i `original` és eixe blob. Desmarcada, es
 *         desa neta encara que el retall siga la foto sencera. Un blob:
 *         directe no té bytes per llegir: cap casella, com abans.
 *       · L'etiqueta i l'avís diuen el que porta el bloc que es publicarà
 *         (contingut, exifIncrustat.js), i l'avís nomena les dades que
 *         identifiquen la càmera (marca, model, número de sèrie, un nom de
 *         persona) quan n'hi ha. La tria de sèrie no canvia (pla §0.1.3).
 *       · Qui desa abans d'haver vist la casella (la lectura no havia acabat)
 *         no publica res a cegues: si la lectura porta un EXIF per a la
 *         casella, no es desa; la casella apareix, marcada, amb AVIS_REVISA_EXIF,
 *         i és el segon clic el que desa. Si no porta res, es desa com abans.
 *   lectorExif: injectable per a les proves.
 *
 * ORDRE DEL MESTRE (18-10-2026, relleu del Pla 2000, punt 2) · «Agrupa
 * "Canviar foto", "Llevar avatar" i "Guardar enquadre" dins del propi
 * diàleg». Props opcionals noves, només per al mode senzill; sense elles, el
 * DOM i el comportament són exactament els d'abans (Llei del Píxel):
 *   onCanviaFoto (null) · (fitxer) → missatge | null. Amb ella, davall del
 *     visor, el botó «Canviar foto» (etiquetaCanviaFoto) i un selector de
 *     fitxers DINS del diàleg (acceptFoto): fora, el modal el deixaria inert.
 *     El pare valida el fitxer i, si l'accepta, canvia `font`: la foto nova
 *     s'obri en el mateix diàleg, centrada i sense zoom. Si torna un missatge,
 *     l'avís ix dins (el modal tapa qualsevol toast) i la foto d'abans es
 *     queda. Tancar el selector sense triar no tanca el diàleg.
 *   ajudaFoto (null) · el text dels formats admesos, davall d'eixos botons,
 *     lligat a «Canviar foto» (aria-describedby).
 *   onLleva (null) · amb ella, el botó etiquetaLleva al costat: el pare fa el
 *     que ja feia (la seua confirmació); mentre desa, desactivat.
 *   etiquetaDesa (null) · el nom del botó principal (per defecte, «Guardar»
 *     en el mode senzill i «Desar l’enquadrament» en el T46).
 */
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Camera, Minus, Plus, Trash2 } from 'lucide-react';
import { Alerta, Boto, Camp, CampText, Carregant, Casella, Dialeg, GrupOpcions } from '../../PedraSeca/index.js';
import {
  FORMATS, FORMAT_PER_DEFECTE, ambLliscador, ambRoda, ambTecla, arrossega, esSencera, estatInicial, limita, lliscador,
  marges, midaVisor, opcionsSortida, pessic, proporcio, rectDeRetall, textAmpliacio, zoomMaxim,
} from './enquadrament.js';
import { llegixMetadadesImatge, senseDades } from './exif.js';
import {
  errorExifNoConservable, esNoConservable, etiquetaConservaExif, exifPublicable, teData, teExifPerConservar, teUbicacio,
} from './exifIncrustat.js';
import { ERROR_UBICACIO, PRECISIO_PER_DEFECTE, geolocalitzacio, llegixCoordenada } from './geolocalitzacio.js';
import { carregaImatge, dibuixaVisor, exportaRetall } from './imatgeCanvas.js';
import { ERROR_HEIC, ERROR_PIXELS, comprovaDimensions, comprovaPes, esHeic, missatgeLimit } from './limits.js';
import { UbicacioImatge } from './UbicacioImatge.jsx';

/* T3 (pla 261025_0045) · L'etiqueta curta d'una forma a la seua píndola: la
   proporció («16:9») o «Original». El nom accessible és l'etiqueta sencera. */
/* «Orig.» (prompt 261025_0045, T3): les nou píndoles caben en una fila a la mida m; el nom sencer el diu
   l'aria-label del ràdio i la didàctica. */
export const etiquetaCurtaDeForma = (forma) => (forma?.valor === 'original' ? 'Orig.' : String(forma?.valor ?? ''));
/** T3 · La línia de didàctica de la forma triada: «Panoràmic (16:9) · <ajuda>», o només el nom. */
export const didacticaDeForma = (forma) => (forma ? [forma.etiqueta, forma.ajuda].filter(Boolean).join(' · ') : '');

export const ERROR_CARREGA_FITXER = 'No s’ha pogut obrir esta foto. Prova amb una imatge JPEG, PNG o WebP.';
export const ERROR_CARREGA_URL = 'No s’ha pogut obrir esta imatge per a enquadrar-la. Torna-la a pujar des del dispositiu.';
export const ERROR_EXPORTA = 'No s’ha pogut preparar la imatge enquadrada. Torna-ho a provar.';
/* Gauntlet 261016 (Bloc 1.2) · L'avís de la casella: què es publica si es deixa marcada. */
export const AJUDA_CONSERVA_UBICACIO = 'Si la deixes marcada, la ubicació es publicarà amb la foto.';
export const AJUDA_CONSERVA_DATA = 'Si la deixes marcada, la data es publicarà amb la foto.';
/* Gauntlet 261016 (Codex, 02:26) · Una foto que només porta la càmera. */
export const AJUDA_CONSERVA_CAMERA = 'Si la deixes marcada, les dades de la càmera es publicaran amb la foto.';
/* Gauntlet 261016 (Bloc B, P3) · Qui ha desat abans de veure la casella: no es desa encara. */
export const AVIS_REVISA_EXIF = 'Esta foto porta dades que es publicarien amb ella. Revisa la casella i torna a desar.';

/* Gauntlet 261016 (Bloc B, P2) · Les dades que identifiquen la càmera o una
   persona que es publicarien (contingut, exifIncrustat.js), en l'ordre que es
   diuen: «la marca, el model i el número de sèrie», o '' si no n'hi ha cap. */
const PARTS_CAMERA = Object.freeze([['marca', 'la marca'], ['model', 'el model'], ['serie', 'el número de sèrie'], ['nom', 'un nom de persona']]);
function dadesDeLaCamera(dades) {
  const parts = PARTS_CAMERA.filter(([clau]) => dades.contingut?.[clau]).map(([, text]) => text);
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} i ${parts.at(-1)}` : (parts[0] || '');
}

/* L'avís de la casella per al que porta la foto; si no es pot conservar, com
   eixir-ne. Bloc B · Decidit pel bloc que es publica (teUbicacio, teData), i
   amb les dades que identifiquen la càmera quan n'hi ha. */
function ajudaConservaExif(dades) {
  if (esNoConservable(dades)) return errorExifNoConservable(dades);
  const camera = dadesDeLaCamera(dades);
  if (teUbicacio(dades) || teData(dades)) {
    const base = teUbicacio(dades) ? AJUDA_CONSERVA_UBICACIO : AJUDA_CONSERVA_DATA;
    return camera ? `${base} També es publicaran les dades de la càmera: ${camera}.` : base;
  }
  return camera ? `Si la deixes marcada, les dades de la càmera es publicaran amb la foto: ${camera}.` : AJUDA_CONSERVA_CAMERA;
}

/* Onada 4 (retallador senzill) · Un zoom «al límit» amb marge de coma flotant. */
const EPSILON_ZOOM = 1e-6;

const esFitxer = (font) => typeof Blob !== 'undefined' && font instanceof Blob;
const distancia = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/* Ordre del Mestre (18-10-2026, Pla 2000, punt 2) · Els noms de sèrie dels
   botons nous: la persona els llig tal com els va escriure el Mestre. */
export const ETIQUETA_CANVIA_FOTO = 'Canviar foto';
export const ETIQUETA_LLEVA_FOTO = 'Llevar la foto';
/* Tancar el selector de fitxers sense triar dispara `cancel` a l'input, i
   puja: el <dialog> el prendria per un Escape i es tancaria. Es para a l'input. */
const paraCancel = (e) => e.stopPropagation();

/* Onada 4, T3a · Un límit o un HEIC tenen el seu avís; la resta, el de sempre. */
const missatgeCarrega = (err, font) => missatgeLimit(err?.codi)
  || (esHeic(font) ? ERROR_HEIC : (esFitxer(font) ? ERROR_CARREGA_FITXER : ERROR_CARREGA_URL));

/* Onada 4, T3a · L'estat de «Vull geolocalitzar aquesta imatge». lat i lng
   són el text dels camps (la persona pot escriure «38,59»). */
const GEO_INICIAL = Object.freeze({
  actiu: false, llegint: false, trobada: false, lat: '', lng: '', origen: 'manual',
  precisio: PRECISIO_PER_DEFECTE, dataCaptura: null,
});

export function DialegEnquadrament({
  obert = true,
  font,
  formatInicial = FORMAT_PER_DEFECTE,
  formats = FORMATS,
  titol = 'Enquadrar la imatge',
  descripcio = 'Tria la forma i mou la foto fins que el que importa quede dins del marc. Només es guarda el que hi ha dins.',
  onTanca,
  onDesa,
  sortida = null,
  permetGeolocalitzacio = false,
  senzill = false,
  mascara = null,
  ofereixConservarExif = false,
  onCanviaFoto = null,
  etiquetaCanviaFoto = ETIQUETA_CANVIA_FOTO,
  acceptFoto = 'image/*',
  ajudaFoto = null,
  onLleva = null,
  etiquetaLleva = ETIQUETA_LLEVA_FOTO,
  etiquetaDesa = null,
  carregador = carregaImatge,
  exportador = exportaRetall,
  dibuixant = dibuixaVisor,
  lectorMetadades = llegixMetadadesImatge,
  lectorExif = exifPublicable,
}) {
  const id = useId();
  const arrelRef = useRef(null);
  const canvasRef = useRef(null);
  const retornRef = useRef(null);
  const muntatRef = useRef(false);
  const formatsRef = useRef(formats);
  formatsRef.current = formats;
  const [imatge, setImatge] = useState(null);
  const [errorCarrega, setErrorCarrega] = useState(null);
  /* { text, intent }: cada intent fallit és un valor nou, encara que el text
     es repetisca i React ajunte el «null» de l'intent amb l'error. */
  const [errorDesat, setErrorDesat] = useState(null);
  const intentsFallits = useRef(0);
  const [desant, setDesant] = useState(false);
  const [estat, setEstat] = useState(() => estatInicial(formatInicial));
  /* L'estat viu per als pointer events: dos moviments seguits abans d'un
     render parteixen del darrer valor, no del pintat. */
  const estatRef = useRef(estat);
  const punters = useRef(new Map());
  const pessicInici = useRef(null);
  const [geo, setGeo] = useState(GEO_INICIAL);
  /* La font de la darrera lectura d'EXIF: es llig una vegada per foto, i una
     lectura d'una foto anterior que arriba tard no trepitja la nova. */
  const lecturaGeo = useRef(null);
  const fontRef = useRef(font);
  fontRef.current = font;
  /* Onada 4, T3a · El que fa el teclat sobre el visor s'anuncia (els
     lliscadors ja s'anuncien sols). */
  const [anunci, setAnunci] = useState('');
  /* Gauntlet 261016 (Bloc 1.2) · El que s'ha llegit de l'EXIF de la foto si
     n'hi ha per a la casella (teExifPerConservar: publicable o que no es pot
     conservar), o null; i la tria, marcada de sèrie. La lectura és del
     fitxer ORIGINAL, una per foto. */
  const [exifOriginal, setExifOriginal] = useState(null);
  const [conservaExif, setConservaExif] = useState(true);
  const lecturaExif = useRef(null);
  /* Gauntlet 261016 (Bloc B, P2) · El blob que el carregador ha obert per a
     una adreça ({ font, blob }): d'ell es llig l'EXIF quan la font no és un
     File. D'on es llig: el File mateix, o el blob d'esta adreça (mai el d'una
     adreça anterior). */
  const [blobCarregat, setBlobCarregat] = useState(null);
  const origenExif = esFitxer(font) ? font : (blobCarregat?.font === font && esFitxer(blobCarregat.blob) ? blobCarregat.blob : null);
  /* Pla 2000 (punt 2) · «Canviar foto»: el selector de dins del diàleg, la
     foto que s'hi havia obert (una de nova torna a començar centrada i sense
     zoom) i el pare viu en un ref (no reengega cap càrrega). */
  const entradaFotoRef = useRef(null);
  const fontObertaRef = useRef(font);
  const canviaFotoRef = useRef(onCanviaFoto);
  canviaFotoRef.current = onCanviaFoto;
  const ambCanviaFoto = senzill && typeof onCanviaFoto === 'function';
  const ambLleva = senzill && typeof onLleva === 'function';

  const actualitza = useCallback((nou) => {
    estatRef.current = nou;
    setEstat(nou);
  }, []);

  /* El focus torna a qui l'ha obert. Es captura en layout (abans que Dialeg
     faça showModal) i es torna en la neteja passiva, quan el <dialog> ja no
     és al DOM: amb el modal obert, la resta del document és inert. Si qui
     l'ha obert ja no hi és (s'ha desat i la capçalera ha canviat), el pare
     decidix on va el focus. StrictMode (App.jsx) repetix els efectes en
     desenvolupament: es captura UNA vegada (la segona, el focus ja és dins del
     diàleg) i només es torna en el desmuntatge real, amb el node fora del DOM. */
  useLayoutEffect(() => {
    muntatRef.current = true;
    if (!retornRef.current) {
      const arrel = arrelRef.current?.getRootNode?.();
      retornRef.current = arrel?.activeElement || document.activeElement;
    }
    return () => { muntatRef.current = false; };
  }, []);
  useEffect(() => {
    const node = arrelRef.current;
    return () => {
      if (node?.isConnected) return;
      const element = retornRef.current;
      if (element?.isConnected && typeof element.focus === 'function') element.focus();
    };
  }, []);

  useEffect(() => {
    if (!obert || !font) return undefined;
    const controlador = new AbortController();
    let viu = true;
    let carregada = null;
    setImatge(null);
    setBlobCarregat(null);
    setErrorCarrega(null);
    setErrorDesat(null);
    setGeo(GEO_INICIAL);
    lecturaGeo.current = null;
    /* Pla 2000 (punt 2) · Amb «Canviar foto», una foto nova en el mateix
       diàleg comença centrada i sense zoom: l'enquadrament d'abans era d'una
       altra foto. Sense la prop, com sempre (el zoom d'abans, dins dels
       límits nous). */
    if (canviaFotoRef.current && fontObertaRef.current !== font) actualitza(estatInicial(estatRef.current.format));
    fontObertaRef.current = font;
    // Onada 4, T3a · Una foto massa pesada no es descodifica: l'avís arriba abans.
    if (esFitxer(font) && comprovaPes(font)) {
      setErrorCarrega(missatgeLimit(comprovaPes(font)));
      return () => { viu = false; };
    }
    (async () => {
      try {
        const img = await carregador(font, { signal: controlador.signal });
        if (!viu) { img?.allibera?.(); return; }
        // Siga quin siga el carregador, una foto de massa píxels no s'enquadra.
        if (comprovaDimensions(img.amplada, img.alcada)) {
          img.allibera?.();
          setErrorCarrega(ERROR_PIXELS);
          return;
        }
        carregada = img;
        actualitza(limita(estatRef.current, img.amplada, img.alcada, formatsRef.current));
        // Bloc B · En el mateix render que la imatge: la lectura de l'EXIF (en layout) ja hi és quan «Desar» s'activa.
        setBlobCarregat(esFitxer(font) ? null : { font, blob: img.blob ?? null });
        setImatge(img);
      } catch (err) {
        if (viu && err?.name !== 'AbortError') setErrorCarrega(missatgeCarrega(err, font));
      }
    })();
    return () => {
      viu = false;
      controlador.abort();
      carregada?.allibera?.();
    };
  }, [obert, font, carregador, actualitza]);

  /* Gauntlet 261016 (Bloc 1.2) · Cada foto nova torna a la tria de sèrie
     (conservar). Una lectura que arriba tard d'una foto anterior no pinta
     cap casella a la nova.
     Bloc B, P2 · Es llig d'origenExif: el File, o el blob que el carregador ha
     obert per a una adreça (arriba amb la imatge). En layout, i no després
     del pintat: la lectura queda registrada abans que «Desar» es puga clicar. */
  useLayoutEffect(() => {
    setExifOriginal(null);
    setConservaExif(true);
    lecturaExif.current = null;
    if (!obert || !ofereixConservarExif || !origenExif) return undefined;
    let viu = true;
    const promesa = Promise.resolve().then(() => lectorExif(origenExif)).catch(() => null);
    lecturaExif.current = { font, origen: origenExif, promesa };
    promesa.then((dades) => {
      if (viu && teExifPerConservar(dades)) setExifOriginal(dades);
    });
    return () => { viu = false; };
  }, [obert, font, origenExif, ofereixConservarExif, lectorExif]);

  /* En layout: el canvas es buida quan canvien els atributs de mida (canvi de
     forma) i així no hi ha cap fotograma en blanc. */
  useLayoutEffect(() => {
    if (!imatge) return;
    const rect = rectDeRetall(estat, imatge.amplada, imatge.alcada, formatsRef.current);
    dibuixant(canvasRef.current, imatge.element, rect);
  }, [imatge, estat, dibuixant]);

  /* T46 (ordre del Mestre, 260928). «Desar» és al peu fix i el cos del diàleg
     fa scroll: qui ha baixat fins als lliscadors no veuria l'avís de dalt.
     Cada intent fallit porta l'avís a la vista ('nearest': si ja es veu, no
     es mou res). La key el torna a inserir i role="alert" el torna a anunciar. */
  useEffect(() => {
    if (!errorDesat) return;
    arrelRef.current?.querySelector(':scope > [role="alert"]')?.scrollIntoView?.({ block: 'nearest' });
  }, [errorDesat]);

  /* Onada 4 (retallador senzill) · La roda del ratolí sobre el visor amplia.
     React escolta 'wheel' com a passiu (no deixa fer preventDefault): s'escolta
     ací, amb passive:false, perquè la roda no desplace el diàleg. El cos de
     l'escoltador és rodaRef, que es renova a cada render (estat i mides vius). */
  const rodaRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!senzill || !imatge || !canvas) return undefined;
    const escolta = (ev) => rodaRef.current?.(ev);
    canvas.addEventListener('wheel', escolta, { passive: false });
    return () => canvas.removeEventListener('wheel', escolta);
  }, [senzill, imatge]);

  const fallaDesat = (text) => {
    if (!muntatRef.current) return;
    intentsFallits.current += 1;
    setErrorDesat({ text, intent: intentsFallits.current });
  };

  const W = imatge?.amplada || 1;
  const H = imatge?.alcada || 1;
  const r = imatge ? proporcio(estat.format, W, H, formats) : (formats.find((f) => f.valor === estat.format)?.ratio ?? 1);
  const visor = midaVisor(r);
  const zMax = imatge ? zoomMaxim(W, H, r) : 1;
  const hiHaMarge = imatge ? marges(estat, W, H, formats) : { x: false, y: false };
  const posX = imatge ? lliscador(estat, 'x', W, H, formats) : 50;
  const posY = imatge ? lliscador(estat, 'y', W, H, formats) : 50;
  const quiet = !imatge || desant;

  /* Esc s'accepta sempre: el navegador pot tancar el <dialog> pel seu compte.
     La X, mentre desa, no: el desat continua i el pare el tanca en acabar. */
  const tanca = (motiu) => {
    if (!desant || motiu === 'esc') onTanca?.(motiu);
  };

  const canviaForma = (format) => {
    const nou = { ...estatRef.current, format };
    actualitza(imatge ? limita(nou, W, H, formats) : nou);
  };

  const centra = () => {
    const nou = estatInicial(estatRef.current.format);
    actualitza(imatge ? limita(nou, W, H, formats) : nou);
  };

  /* Poliment T46 (ordre del Mestre, 260928) · Només el botó principal
     arrossega (el dret és el menú contextual). Un moviment sense cap botó
     premut vol dir que el pointerup s'ha perdut (fora de la finestra): el
     punter s'allibera, com quan es perd la captura. */
  const onPointerDown = (e) => {
    if (quiet || e.button > 0) return;
    // Sense açò, un arrossegament amb el ratolí que ix del visor selecciona el text del diàleg.
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    punters.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (punters.current.size === 2) {
      const [a, b] = [...punters.current.values()];
      pessicInici.current = { d: distancia(a, b), zoom: estatRef.current.zoom };
    }
  };

  const onPointerMove = (e) => {
    const previ = punters.current.get(e.pointerId);
    if (!previ || quiet) return;
    if (e.buttons === 0) {
      deixaPunter(e);
      return;
    }
    const actual = { x: e.clientX, y: e.clientY };
    punters.current.set(e.pointerId, actual);
    if (punters.current.size >= 2 && pessicInici.current) {
      const [a, b] = [...punters.current.values()];
      actualitza(pessic(estatRef.current, pessicInici.current.zoom, pessicInici.current.d, distancia(a, b), W, H, formats));
      return;
    }
    const ample = e.currentTarget.getBoundingClientRect().width;
    actualitza(arrossega(estatRef.current, actual.x - previ.x, actual.y - previ.y, ample, W, H, formats));
  };

  const deixaPunter = (e) => {
    punters.current.delete(e.pointerId);
    if (punters.current.size < 2) pessicInici.current = null;
  };

  /* Onada 4, T3a (RETALLADOR §1) · Teclat sobre el visor: les fletxes mouen,
     + i − amplien, Retorn desa. Escape el gestiona el <dialog> (tanca). */
  const onTeclaVisor = (ev) => {
    if (quiet || ev.altKey || ev.ctrlKey || ev.metaKey) return;
    if (ev.key === 'Enter') {
      ev.preventDefault();
      desa();
      return;
    }
    const nou = ambTecla(estatRef.current, ev.key, W, H, formats, { gran: ev.shiftKey });
    if (!nou) return;
    ev.preventDefault();
    actualitza(nou);
    setAnunci(/^Arrow/.test(ev.key)
      ? `Posició ${lliscador(nou, 'x', W, H, formats)} % des de l’esquerra i ${lliscador(nou, 'y', W, H, formats)} % des de dalt`
      : `Ampliació ${textAmpliacio(nou.zoom)}`);
  };

  /* Onada 4 (retallador senzill) · La roda i els botons − i + fan el pas de
     l'ajudant pur (ambRoda, ambTecla): els límits són els del lliscador. */
  rodaRef.current = (ev) => {
    ev.preventDefault();
    if (quiet) return;
    const nou = ambRoda(estatRef.current, ev.deltaY, W, H, formats, { mode: ev.deltaMode });
    if (nou) actualitza(nou);
  };
  const pasZoom = (tecla) => {
    if (quiet) return;
    const nou = ambTecla(estatRef.current, tecla, W, H, formats);
    if (nou) actualitza(nou);
  };
  const potAllunyar = !quiet && estat.zoom > 1 + EPSILON_ZOOM;
  const potApropar = !quiet && estat.zoom < zMax - EPSILON_ZOOM;

  /* Pla 2000 (punt 2) · La foto triada amb «Canviar foto». La decidix el
     pare: si la rebutja (no és PNG, JPEG o WebP, massa pesada, una pujada en
     curs), l'avís ix ací dins i la foto d'abans es queda; si l'accepta, canvia
     `font` i l'efecte de càrrega l'obri (i esborra els avisos). Un ref de
     funció: l'escoltador de `cancel` va amb el node. */
  const refEntradaFoto = useCallback((node) => {
    entradaFotoRef.current?.removeEventListener('cancel', paraCancel);
    entradaFotoRef.current = node;
    node?.addEventListener('cancel', paraCancel);
  }, []);
  const triaFoto = (ev) => {
    const fitxer = ev.target.files?.[0];
    ev.target.value = '';
    if (!fitxer || desant) return;
    const avis = canviaFotoRef.current?.(fitxer);
    if (typeof avis === 'string' && avis) fallaDesat(avis);
  };
  const idAjudaFoto = `${id}-foto`;
  /* Els botons de la foto i els formats, també sense imatge (una adreça que
     no s'ha pogut obrir): «Canviar foto» n'és l'eixida. */
  const accionsFoto = ambCanviaFoto || ambLleva ? (
    <div className="sdp-enquadrament__foto">
      {ambCanviaFoto ? (
        <input ref={refEntradaFoto} type="file" accept={acceptFoto} onChange={triaFoto} className="sdp-nomes-lector"
          tabIndex={-1} aria-hidden="true" data-enquadrament-foto="" />
      ) : null}
      <div className="sdp-enquadrament__foto-accions">
        {ambCanviaFoto ? (
          <Boto varietat="secundari" icona={Camera} onClick={() => entradaFotoRef.current?.click()} disabled={desant}
            aria-describedby={ajudaFoto ? idAjudaFoto : undefined}>{etiquetaCanviaFoto}</Boto>
        ) : null}
        {ambLleva ? <Boto varietat="secundari" icona={Trash2} onClick={onLleva} disabled={desant}>{etiquetaLleva}</Boto> : null}
      </div>
      {ajudaFoto ? <p id={idAjudaFoto} className="sdp-camp__ajuda">{ajudaFoto}</p> : null}
    </div>
  ) : null;

  /* Gauntlet 261016 (Bloc 1.2) · La casella de Pedra Seca (la mateixa de
     «Vull geolocalitzar aquesta imatge»), només si hi ha EXIF; l'etiqueta i
     l'avís diuen el que porta (Codex, 02:26). */
  const casellaExif = exifOriginal && imatge ? (
    <Casella etiqueta={etiquetaConservaExif(exifOriginal)} ajuda={ajudaConservaExif(exifOriginal)}
      checked={conservaExif} disabled={desant} onChange={(ev) => setConservaExif(ev.target.checked)} />
  ) : null;

  /* Onada 4, T3a · La ubicació que es desaria ara mateix (ja arrodonida), o null. */
  const ubicacio = geo.actiu
    ? geolocalitzacio({ lat: llegixCoordenada(geo.lat), lng: llegixCoordenada(geo.lng), precisio: geo.precisio, origen: geo.origen })
    : null;
  /* Amb `sortida` o amb la geolocalització, el diàleg lliura el fitxer final:
     sempre un canvas nou, mai l'original amb el seu EXIF (ADR D4). */
  const recodifica = Boolean(sortida) || permetGeolocalitzacio;

  /* L'EXIF es llig del fitxer ORIGINAL (no del retall, que ja no en porta),
     una sola vegada per foto i només quan la persona ho demana. */
  const activaGeo = async (actiu) => {
    setGeo((g) => ({ ...g, actiu }));
    if (!actiu || lecturaGeo.current === font) return;
    const llegida = font;
    lecturaGeo.current = llegida;
    if (!esFitxer(llegida)) return;
    setGeo((g) => ({ ...g, llegint: true }));
    let dades;
    try {
      dades = await lectorMetadades(llegida);
    } catch {
      dades = senseDades();
    }
    if (!muntatRef.current || fontRef.current !== llegida) return;
    const gps = dades?.gps || null;
    setGeo((g) => ({
      ...g,
      llegint: false,
      trobada: Boolean(gps),
      dataCaptura: dades?.dataCaptura || null,
      // Si la persona ja havia escrit res mentre es llegia, no se li esborra.
      ...(gps && g.lat === '' && g.lng === '' ? { lat: String(gps.lat), lng: String(gps.lng), origen: 'exif' } : {}),
    }));
  };

  /* Corregir un camp converteix el punt en «manual»: ja no és el de l'EXIF. */
  const canviaGeo = (camp, valor) => {
    setGeo((g) => (camp === 'precisio' ? { ...g, precisio: valor } : { ...g, [camp]: valor, origen: 'manual' }));
  };

  const desa = async () => {
    if (!imatge || desant || (geo.actiu && geo.llegint)) return;
    const e = estatRef.current;
    const rect = rectDeRetall(e, W, H, formats);
    const sencera = esSencera(e, W, H, formats);
    /* Gauntlet 261016 (Bloc B) · El que la persona tenia davant en clicar: la
       casella (si s'havia pintat) i la seua tria. Una adreça sencera no té res
       a desar, llevat que haja desmarcat la casella: llavors es desa neta. */
    const casellaVista = Boolean(exifOriginal);
    const treuExif = casellaVista && !conservaExif;
    if (sencera && !esFitxer(font) && !geo.actiu && !treuExif) {
      onTanca?.('boto');
      return;
    }
    if (geo.actiu && !ubicacio) {
      fallaDesat(ERROR_UBICACIO);
      return;
    }
    const metadades = { geolocalitzacio: ubicacio, dataCaptura: geo.actiu ? geo.dataCaptura : null };
    setErrorDesat(null);
    setDesant(true);
    try {
      /* Gauntlet 261016 (Bloc 1.2) · La tria de l'EXIF. Si la lectura de
         l'original encara no ha acabat, s'espera: la tria de sèrie no depén
         de qui clica més de pressa. La casella marca la tria que hi havia en
         clicar (desmarcada, la foto ix neta). Codex, 02:26 · Marcada amb un
         EXIF que no es pot conservar, no es desa: l'avís, i el diàleg obert.
         Bloc B, P3 · Si la casella no s'havia vist i la lectura porta un EXIF
         per a ella, tampoc: ix la casella (marcada de sèrie) i l'avís, i desa
         el segon clic. L'original és d'on s'ha llegit (el File o el blob). */
      const lectura = lecturaExif.current;
      const llegit = lectura?.font === font ? await lectura.promesa : null;
      if (teExifPerConservar(llegit)) {
        if (!casellaVista) {
          if (muntatRef.current && fontRef.current === font) setExifOriginal(llegit);
          fallaDesat(AVIS_REVISA_EXIF);
          return;
        }
        if (conservaExif && esNoConservable(llegit)) {
          fallaDesat(errorExifNoConservable(llegit));
          return;
        }
        metadades.exif = conservaExif ? { conservaExif: true, original: lectura.origen } : { conservaExif: false };
      }
      let fitxer = font;
      // Bloc B · Una adreça no és cap fitxer per a lliurar: sempre el retall.
      if (!sencera || recodifica || !esFitxer(font)) {
        try {
          fitxer = await exportador(imatge.element, rect, opcionsSortida(rect, imatge.tipus, sortida));
        } catch {
          fallaDesat(ERROR_EXPORTA);
          return;
        }
      }
      await onDesa?.(fitxer, { format: e.format, rect, sencera }, metadades);
    } catch (err) {
      fallaDesat(err?.message || ERROR_EXPORTA);
    } finally {
      if (muntatRef.current) setDesant(false);
    }
  };

  /* Onada 4 (retallador senzill, ordre del Mestre 261008) · La finestra de
     Claude: títol, ajuda, el visor, la fila de zoom i tres botons. La resta
     del cos (avisos, càrrega, teclat, arrossegament i desat) és la de T46. */
  if (senzill) {
    const caixa = ['sdp-enquadrament__visor-caixa', mascara === 'cercle' && 'sdp-enquadrament__visor-caixa--cercle']
      .filter(Boolean).join(' ');
    /* T3 (pla 261025_0045) · Amb més d'una forma (la capçalera): les píndoles i la didàctica. */
    const ambFormes = formats.length > 1;
    const triada = formats.find((f) => f.valor === estat.format) || null;
    const idDidactica = `${id}-didactica`;
    return (
      <Dialeg
        obert={obert}
        onTanca={tanca}
        titol={titol}
        descripcio={descripcio}
        mida={ambFormes ? 'm' : 's'}
        className="sdp-enquadrament__dialeg sdp-enquadrament__dialeg--senzill"
        tancaEnVel={false}
        ambTanca={false}
        accions={(
          <>
            {/* Fantasma (botó de text) amb la seua pell al peu: bloc T46 de modules.css. */}
            <Boto varietat="fantasma" className="sdp-enquadrament__restablir" onClick={centra} disabled={quiet}>Restablir</Boto>
            <Boto varietat="secundari" onClick={() => tanca('boto')} disabled={desant}>Cancel·lar</Boto>
            <Boto varietat="primari" onClick={desa} carregant={desant} disabled={!imatge}>{etiquetaDesa || 'Guardar'}</Boto>
          </>
        )}
      >
        <div ref={arrelRef} className={ambFormes ? 'sdp-enquadrament sdp-enquadrament--senzill sdp-enquadrament--formes' : 'sdp-enquadrament sdp-enquadrament--senzill'}>
          {errorCarrega ? <Alerta to="error">{errorCarrega}</Alerta> : null}
          {errorDesat ? <Alerta key={errorDesat.intent} to="error">{errorDesat.text}</Alerta> : null}
          {!errorCarrega && !imatge ? <Carregant etiqueta="Obrint la imatge…" /> : null}
          {imatge ? (
            <>
              <div className={caixa}>
                <canvas
                  ref={canvasRef}
                  className="sdp-enquadrament__visor"
                  width={visor.amplada}
                  height={visor.alcada}
                  role="img"
                  aria-label="Previsualització del retall"
                  tabIndex={0}
                  aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Plus - Enter"
                  onKeyDown={onTeclaVisor}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={deixaPunter}
                  onPointerCancel={deixaPunter}
                  onLostPointerCapture={deixaPunter}
                />
              </div>
              <p className="sdp-nomes-lector" aria-live="polite">{anunci}</p>
              <div className="sdp-enquadrament__zoom">
                <button type="button" className="sdp-enquadrament__pas" aria-label="Allunyar" title="Allunyar"
                  disabled={!potAllunyar} onClick={() => pasZoom('-')}>
                  <Minus size={20} aria-hidden="true" focusable="false" />
                </button>
                <input type="range" className="sdp-control sdp-enquadrament__lliscador" aria-label="Ampliació"
                  min={1} max={zMax} step={0.01} value={estat.zoom} aria-valuetext={textAmpliacio(estat.zoom)}
                  disabled={quiet || zMax <= 1}
                  onChange={(ev) => actualitza(limita({ ...estatRef.current, zoom: Number(ev.target.value) }, W, H, formats))} />
                <button type="button" className="sdp-enquadrament__pas" aria-label="Apropar" title="Apropar"
                  disabled={!potApropar} onClick={() => pasZoom('+')}>
                  <Plus size={20} aria-hidden="true" focusable="false" />
                </button>
              </div>
              {/* Directiva del Mestre (261024, àudio 22:47; 261025, T3) · La forma, només si n'hi ha
                  més d'una (la capçalera): píndoles d'un sol toc i una línia de didàctica. */}
              {ambFormes ? (
                <fieldset className="sdp-enquadrament__formats" role="radiogroup" aria-labelledby={`${id}-forma-llegenda`}
                  aria-describedby={idDidactica} disabled={desant}>
                  <legend id={`${id}-forma-llegenda`} className="sdp-nomes-lector">Forma</legend>
                  <div className="sdp-enquadrament__formats-pindoles">
                    {formats.map((f) => {
                      const idForma = `${id}-forma-${f.valor}`;
                      return (
                        <div key={f.valor} className="sdp-enquadrament__format">
                          <input type="radio" id={idForma} name={`${id}-forma`} value={f.valor}
                            className="sdp-enquadrament__format-control sdp-nomes-lector" aria-label={f.etiqueta}
                            checked={estat.format === f.valor} onChange={() => canviaForma(f.valor)} />
                          <label htmlFor={idForma} className="sdp-enquadrament__format-pindola">{etiquetaCurtaDeForma(f)}</label>
                        </div>
                      );
                    })}
                  </div>
                </fieldset>
              ) : null}
              {ambFormes ? (
                <p id={idDidactica} className="sdp-enquadrament__didactica" aria-live="polite">{didacticaDeForma(triada)}</p>
              ) : null}
              {casellaExif}
            </>
          ) : null}
          {accionsFoto}
        </div>
      </Dialeg>
    );
  }

  return (
    <Dialeg
      obert={obert}
      onTanca={tanca}
      titol={titol}
      descripcio={descripcio}
      mida="g"
      className="sdp-enquadrament__dialeg"
      tancaEnVel={false}
      accions={(
        <>
          <Boto varietat="secundari" onClick={() => tanca('boto')} disabled={desant}>Cancel·lar</Boto>
          {/* Secundari i no fantasma: al peu del diàleg només es restituïxen
              secundari i perill (components.css, trampa de PerfilShell.css). */}
          <Boto varietat="secundari" onClick={centra} disabled={quiet}>Centrar</Boto>
          <Boto varietat="primari" onClick={desa} carregant={desant} disabled={!imatge || (geo.actiu && geo.llegint)}>{etiquetaDesa || 'Desar l’enquadrament'}</Boto>
        </>
      )}
    >
      <div ref={arrelRef} className="sdp-enquadrament">
        {errorCarrega ? <Alerta to="error">{errorCarrega}</Alerta> : null}
        {/* Dalt de tot i no al final: el cos fa scroll i «Desar» és al peu fix. */}
        {errorDesat ? <Alerta key={errorDesat.intent} to="error">{errorDesat.text}</Alerta> : null}
        {!errorCarrega && !imatge ? <Carregant etiqueta="Obrint la imatge…" /> : null}
        {/* Correcció C19 (260928) · La foto i els lliscadors han de cabre alhora:
            a ≥721px, la vista a una banda i els controls a l'altra (bloc T46 de
            modules.css); en mòbil, en columna. Els lliscadors van abans que la
            forma (també en el DOM: l'ordre del focus és el que es veu). */}
        {imatge ? (
          <div className="sdp-enquadrament__obra">
            <div className="sdp-enquadrament__vista">
              <div className="sdp-enquadrament__visor-marc">
                <canvas
                  ref={canvasRef}
                  className="sdp-enquadrament__visor"
                  width={visor.amplada}
                  height={visor.alcada}
                  role="img"
                  aria-label="Previsualització de l’enquadrament"
                  aria-describedby={`${id}-ajuda`}
                  tabIndex={0}
                  /* WAI-ARIA 1.2: el «+» separa modificadors; la tecla més és «Plus». */
                  aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Plus - Enter"
                  onKeyDown={onTeclaVisor}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={deixaPunter}
                  onPointerCancel={deixaPunter}
                  onLostPointerCapture={deixaPunter}
                />
              </div>
              <p id={`${id}-ajuda`} className="sdp-camp__ajuda">
                Arrossega la foto amb el dit o el ratolí per a moure-la; amb dos dits, l’amplies. També la pots moure i ampliar amb els lliscadors o, amb la foto seleccionada, amb les fletxes i les tecles + i −. Retorn la desa.
              </p>
              <p className="sdp-nomes-lector" aria-live="polite">{anunci}</p>
            </div>
            <div className="sdp-enquadrament__controls">
              <div className="sdp-enquadrament__lliscadors">
                <Camp etiqueta="Ampliació" ajuda={zMax <= 1 ? 'Esta foto és massa xicoteta per a ampliar-la més.' : undefined}>
                  <CampText tipus="range" className="sdp-enquadrament__lliscador" min={1} max={zMax} step={0.01}
                    value={estat.zoom} aria-valuetext={textAmpliacio(estat.zoom)} disabled={quiet || zMax <= 1}
                    onChange={(ev) => actualitza(limita({ ...estatRef.current, zoom: Number(ev.target.value) }, W, H, formats))} />
                </Camp>
                <Camp etiqueta="Posició horitzontal" ajuda={hiHaMarge.x ? undefined : 'En esta direcció la foto ja omple tot el marc.'}>
                  <CampText tipus="range" className="sdp-enquadrament__lliscador" min={0} max={100} step={1}
                    value={posX} aria-valuetext={`${posX} % des de l’esquerra`} disabled={quiet || !hiHaMarge.x}
                    onChange={(ev) => actualitza(ambLliscador(estatRef.current, 'x', ev.target.value, W, H, formats))} />
                </Camp>
                <Camp etiqueta="Posició vertical" ajuda={hiHaMarge.y ? undefined : 'En esta direcció la foto ja omple tot el marc.'}>
                  <CampText tipus="range" className="sdp-enquadrament__lliscador" min={0} max={100} step={1}
                    value={posY} aria-valuetext={`${posY} % des de dalt`} disabled={quiet || !hiHaMarge.y}
                    onChange={(ev) => actualitza(ambLliscador(estatRef.current, 'y', ev.target.value, W, H, formats))} />
                </Camp>
              </div>
              <GrupOpcions llegenda="Forma" opcions={formats} valor={estat.format} onCanvi={canviaForma} disabled={desant} />
              {casellaExif}
              {permetGeolocalitzacio ? (
                <UbicacioImatge geo={geo} resultat={ubicacio} desactivat={desant} onActiva={activaGeo} onCanvi={canviaGeo} />
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </Dialeg>
  );
}

export default DialegEnquadrament;
