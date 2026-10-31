import Image, { inputRegex as regexImatgeMarkdown } from '@tiptap/extension-image';
import { nodeInputRule } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { compressImage } from '../../../../utils/imageUtils.js';
import { fitxerDeDataUrl, tipusReal } from '../../../../utils/pujadaImatge.js';
import { validaFitxerImatge } from '../../../../hooks/useHeroImageHandler.js';
import {
  ajustaPrecisioGps, errorExifNoConservable, esNoConservable, exifCapEnFormat, exifPublicable, teUbicacioOData,
} from '../../enquadrament/exifIncrustat.js';
import { PRECISIONS, PRECISIO_PER_DEFECTE_PUBLICACIO, geolocalitzacio } from '../../enquadrament/geolocalitzacio.js';
import { FORMAT_JPEG, FORMAT_WEBP, netejaFontImatge } from '../../enquadrament/netejaMetadades.js';
import { fotoDelBucketPublic } from '../../../../utils/mitjaOpac.js';
import { netejaHtmlEnganxat } from './imatgesEnganxades.js';
import SlashMenu from './slash.js';
import SdpImageNodeView from './SdpImageNodeView.jsx';
import { TargetesIncrustades } from './targetes/targetesIncrustades.js';
import { PlaceholderCos } from './placeholderCos.js';

/* RICH-EXIF (Onada 4, ADR multimèdia D4) · allowBase64 es queda (les notes
   sense servidor hi desen el data URL de compressImage), però cap data URL
   d'imatge entra amb metadades: ni enganxat, ni arrossegat, ni escrit com
   a «![alt](src)». La neteja és síncrona i no torna a codificar cap píxel.
   P1-64 (pla 261028_1526 §3.1.1) · Una foto del cos triada amb l'ordre «/»
   Imatge, si la persona conserva la ubicació i la data (demanaExif), porta el
   seu registre en quatre atributs data-* de l'<img>: data-lat, data-lng
   (ja arrodonits a la precisió), data-precisio ('exacta' | '100m' | 'poble')
   i data-captura (ISO). Només es pinten quan hi són: el que es veu és el
   mateix (Llei del Píxel). En llegir, un valor que no té la forma esperada
   no entra al node (null). Les fotos enganxades o arrossegades de fora
   continuen sempre netes i sense cap d'estos atributs (transformPastedHTML és
   síncron); vegeu senseRegistreDeFoto per a l'enganxat intern. */
const FORMA_COORDENADA = /^-?\d{1,3}(?:\.\d{1,7})?$/;
const FORMA_CAPTURA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:[+-]\d{2}:\d{2})?$/;
const VALORS_PRECISIO = new Set(PRECISIONS.map((p) => p.valor));
const atributDeFoto = (clau, nom, valid) => ({
  default: null,
  parseHTML: (element) => {
    const valor = element.getAttribute(nom);
    return valor !== null && valid(valor) ? valor : null;
  },
  renderHTML: (atributs) => (atributs[clau] == null ? {} : { [nom]: String(atributs[clau]) }),
});
/* P1-64 · Enganxar o deixar anar HTML de fora no porta cap registre: el que
   declara una ubicació és només l'ordre «/» Imatge, amb la casella.
   Revisió adversarial 261028 · El registre es lleva de l'HTML ja LLEGIT
   (DOMParser, inert), no amb una expressió: per al navegador, «src="…"data-lat=…»
   i «src=… /data-lat=…» també són atributs. Un nom d'atribut no porta mai
   entitats: sense «data-lat|lng|precisio|captura» al text, cap element no en
   pot tindre i l'HTML torna IDÈNTIC. Només es conserva en un enganxat INTERN
   (ProseMirror marca el seu portapapers amb data-pm-slice) i en una <img>
   pujada (sdp-media:// d'un dels dos buckets, el camí net de les pujades):
   copiar o moure una foto pròpia dins del text no la lleva del Mapa, i el seu
   fitxer continua portant el que la persona va triar. Si no es pot llegir amb
   seguretat, no s'enganxa res (la regla de netejaHtmlEnganxat). */
const NOMS_DEL_REGISTRE = Object.freeze(['data-lat', 'data-lng', 'data-precisio', 'data-captura']);
const POT_TINDRE_REGISTRE = /data-(?:lat|lng|precisio|captura)/i;
const SELECTOR_DEL_REGISTRE = NOMS_DEL_REGISTRE.map((nom) => `[${nom}]`).join(',');
const esPujadaPropia = (src) => typeof src === 'string'
  && fotoDelBucketPublic(src.replace(/^\s*sdp-media:\/\/mitjans_privats\//i, 'sdp-media://mitjans/')) !== null;

function senseRegistreDeFoto(html) {
  if (typeof html !== 'string' || !POT_TINDRE_REGISTRE.test(html)) return html;
  if (typeof DOMParser === 'undefined') return '';
  const doc = new DOMParser().parseFromString(`<template>${html}</template>`, 'text/html');
  const plantilla = doc.head.firstElementChild;
  if (!plantilla || plantilla.tagName !== 'TEMPLATE' || doc.head.childElementCount !== 1 || doc.body.hasChildNodes()) return '';
  const intern = plantilla.content.querySelector('[data-pm-slice]') !== null;
  let canviat = false;
  for (const element of plantilla.content.querySelectorAll(SELECTOR_DEL_REGISTRE)) {
    if (intern && element.tagName === 'IMG' && esPujadaPropia(element.getAttribute('src'))) continue;
    NOMS_DEL_REGISTRE.forEach((nom) => element.removeAttribute(nom));
    canviat = true;
  }
  return canviat ? plantilla.innerHTML : html;
}

const SdpImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      lat: atributDeFoto('lat', 'data-lat', (v) => FORMA_COORDENADA.test(v)),
      lng: atributDeFoto('lng', 'data-lng', (v) => FORMA_COORDENADA.test(v)),
      precisio: atributDeFoto('precisio', 'data-precisio', (v) => VALORS_PRECISIO.has(v)),
      captura: atributDeFoto('captura', 'data-captura', (v) => FORMA_CAPTURA.test(v)),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(SdpImageNodeView);
  },

  /* Enganxar i deixar anar HTML: ProseMirror crida esta mateixa funció.
     P1-64 · I sense els data-* del registre d'una foto (sempre netes). */
  transformPastedHTML(html) {
    return senseRegistreDeFoto(netejaHtmlEnganxat(html));
  },

  /* La regla de Markdown de TipTap, amb la font neta. Una imatge que no es
     pot netejar no es crea: el text escrit es queda com a text. */
  addInputRules() {
    return [
      nodeInputRule({
        find: (text) => {
          const m = regexImatgeMarkdown.exec(text);
          if (!m) return null;
          const [tot, imatge, alt, src, title] = m;
          const net = netejaFontImatge(src);
          if (net === null) return null;
          return { index: m.index, text: tot, replaceWith: imatge, data: { src: net, alt, title } };
        },
        type: this.type,
        getAttributes: (match) => match.data
      })
    ];
  }
});

/** Obri el selector de fitxers i resol amb el File, o null si s'anul·la. */
function triaFitxer(accept = 'image/*') {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') return resolve(null);

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    document.body.appendChild(input);

    let resolt = false;
    const acaba = (fitxer) => {
      if (resolt) return;
      resolt = true;
      input.remove();
      resolve(fitxer);
    };

    input.addEventListener('change', () => acaba(input.files?.[0] || null), { once: true });
    /* Si l'usuari cancel·la, no hi ha esdeveniment 'change'. El focus que
       torna a la finestra és l'únic senyal fiable per a no deixar l'input
       penjat al DOM per sempre. */
    window.addEventListener('focus', () => setTimeout(() => acaba(null), 400), { once: true });

    input.click();
  });
}

/* P1-64 · La resposta de demanaExif quan la persona tanca la pregunta. */
const CANCELLADA = Symbol('cancel·lada');

/* P1-64 (pla 261028_1526 §3.1.1) · El que s'ha triat per a una foto del cos:
   null (cap pregunta: sense demanaExif, sense res a conservar o desmarcada),
   CANCELLADA, { avis } (marcada però no es pot conservar: es diu i no
   s'inserix res, mai neta en silenci) o { exif, original, precisio, atributs }
   (la compressió hi posarà l'EXIF; el node, els data-*). */
async function triaDeLexif(original, demanaExif) {
  if (typeof demanaExif !== 'function') return null;
  const exif = await exifPublicable(original);
  if (!teUbicacioOData(exif)) return null;
  const resposta = await demanaExif(original, exif);
  if (resposta === null || resposta === undefined) return CANCELLADA;
  if (resposta.conserva !== true) return null;
  const precisio = VALORS_PRECISIO.has(resposta.precisio) ? resposta.precisio : PRECISIO_PER_DEFECTE_PUBLICACIO;
  if (esNoConservable(exif) || !exif?.tiff || !ajustaPrecisioGps(exif.tiff, precisio)) return { avis: errorExifNoConservable(exif) };
  const geo = exif.gps ? geolocalitzacio({ lat: exif.gps.lat, lng: exif.gps.lng, precisio, origen: 'exif' }) : null;
  const atributs = {
    ...(geo ? { lat: String(geo.lat), lng: String(geo.lng), precisio: geo.precisio } : null),
    ...(exif.dataCaptura && FORMA_CAPTURA.test(exif.dataCaptura) ? { captura: exif.dataCaptura } : null),
  };
  return { exif, original, precisio, atributs };
}

/* La compressió de sempre del cos; amb l'EXIF triat, el WebP (o, si el canvas
   no en sap, el JPEG) que el pot portar. Si no hi cap, l'avís: mai neta en
   silenci. */
async function comprimixDelCos(original, tria) {
  const base = { maxSize: 1200, format: FORMAT_WEBP, quality: 0.8 };
  if (!tria) return compressImage(original, base);
  const ambExif = { ...base, conservaExif: true, original, precisio: tria.precisio };
  let dataUrl = await compressImage(original, ambExif);
  if (tipusReal(dataUrl) !== FORMAT_WEBP) dataUrl = await compressImage(original, { ...ambExif, format: FORMAT_JPEG });
  if (!exifCapEnFormat(tria.exif, tipusReal(dataUrl))) throw new Error(errorExifNoConservable(tria.exif));
  return dataUrl;
}

/**
 * Ordres del menú Slash.
 * @param {Object} opcions
 * @param {(fitxer: File) => Promise<string|null>} [opcions.onImageUpload]
 *        La MATEIXA capacitat que fa servir el hero. Una sola porta de
 *        pujada per a tota l'aplicació: si n'hi ha dues, només una tindrà
 *        polítiques.
 * @param {boolean} [opcions.ambTargetes] T7 (ordre del Mestre, 261004) · Afig
 *        l'ordre «Targeta», que obri el selector del consumidor. Només amb
 *        l'extensió de targetes (extensionsRiques amb ambTargetes).
 * @param {(missatge: string, tipus: string) => void} [opcions.onToast] Ordre
 *        del Mestre (261007, ordre E) · El canal d'avisos de la capçalera
 *        (DocumentEditor el passa estable). L'ordre «Imatge» hi diu per què no
 *        ha inserit res: el fitxer no és una imatge o la pujada s'ha
 *        rebutjat. Sense, com sempre: cap avís per a un fitxer que no és una
 *        imatge i un console.warn per a la pujada.
 * @param {boolean} [opcions.ambEmojis] Bloc 3.8 del Gauntlet (261016) · Afig
 *        l'ordre «Emoji», que obri la graella d'emojis del consumidor
 *        (`obreEmojis`) després de llevar la «/»: l'emoji triat s'inserix al
 *        cursor. Va davant de «Targeta», que continua sent l'última. Sense,
 *        les ordres de sempre.
 * @param {() => void} [opcions.obreEmojis] Qui obri la graella (estable: les
 *        ordres es fixen en crear l'editor). Sense funció, l'ordre no hi és.
 * @param {(original: File, exif: Object) => Promise<{ conserva: boolean, precisio: string }|null>} [opcions.demanaExif]
 *        P1-64 (pla 261028_1526 §3.1.1) · Estable, com obreEmojis. Si la foto
 *        triada porta la ubicació o la data (exifPublicable), l'ordre
 *        «Imatge» ho pregunta abans de comprimir (el diàleg de DocumentEditor:
 *        la casella «Conserva la ubicació i la data de la foto», marcada de
 *        sèrie, i les píndoles de la precisió). null cancel·la: no s'inserix
 *        res. Conservada, la foto porta l'EXIF (amb la ubicació ja arrodonida)
 *        i el node, els data-* de SdpImage. Sense la funció, o una foto sense
 *        res a conservar, el camí de sempre: cap pregunta i la foto neta.
 */
export function creaOrdres({
  onImageUpload = null, ambTargetes = false, onToast = null, ambEmojis = false, obreEmojis = null, demanaExif = null,
} = {}) {
  const avisa = typeof onToast === 'function' ? (missatge) => onToast(missatge, 'error') : null;
  const ambOrdreEmoji = ambEmojis && typeof obreEmojis === 'function';
  const ordreEmoji = {
    id: 'emoji',
    titol: 'Emoji',
    ajuda: 'Tria un emoji del catàleg i s’escriu ací',
    paraules: ['emoji', 'emoticona', 'emoticones', 'icona', 'smiley'],
    executa: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      obreEmojis();
    }
  };
  const ordreTargeta = {
    id: 'targeta',
    titol: 'Targeta',
    ajuda: 'Incrusta una targeta del Mur, el Mercat, l’Agenda o un poble',
    paraules: ['targeta', 'card', 'incrustar', 'fitxa'],
    executa: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      editor.commands.obreSelectorDeTargeta();
    }
  };
  return [
    {
      id: 'titol',
      titol: 'Títol de secció',
      ajuda: 'Encapçalament gran',
      paraules: ['titol', 'títol', 'h2', 'encapçalament'],
      executa: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleHeading({ level: 2 }).run()
    },
    {
      id: 'subtitol',
      titol: 'Subtítol',
      ajuda: 'Encapçalament menut',
      paraules: ['subtitol', 'subtítol', 'h3'],
      executa: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleHeading({ level: 3 }).run()
    },
    {
      id: 'h4',
      titol: 'Subapartat',
      ajuda: 'Encapçalament de nivell 4',
      paraules: ['h4', 'subapartat'],
      executa: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleHeading({ level: 4 }).run()
    },
    {
      id: 'h5',
      titol: 'Detall del subapartat',
      ajuda: 'Encapçalament de nivell 5',
      paraules: ['h5', 'detall'],
      executa: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleHeading({ level: 5 }).run()
    },
    {
      id: 'h6',
      titol: 'Detall específic',
      ajuda: 'Encapçalament de nivell 6',
      paraules: ['h6', 'específic'],
      executa: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleHeading({ level: 6 }).run()
    },
    {
      id: 'llista',
      titol: 'Llista',
      ajuda: 'Punts, un per línia',
      paraules: ['llista', 'punts', 'ul'],
      executa: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleBulletList().run()
    },
    {
      id: 'citacio',
      titol: 'Citació',
      ajuda: 'Bloc destacat',
      paraules: ['citacio', 'citació', 'cita', 'quote'],
      executa: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleBlockquote().run()
    },
    {
      /* HorizontalRule ja ve dins de l'StarterKit. No cal cap paquet nou. */
      id: 'divisor',
      titol: 'Divisor',
      ajuda: 'Una ratlla que separa',
      paraules: ['divisor', 'ratlla', 'hr', 'separador'],
      executa: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setHorizontalRule().run()
    },
    {
      id: 'imatge',
      titol: 'Imatge',
      ajuda: 'Puja una foto del dispositiu',
      paraules: ['imatge', 'foto', 'image', 'img'],
      executa: async ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();

        const original = await triaFitxer();
        if (!original) return;
        /* El mateix avís que la capçalera per a un fitxer que no és una imatge
           (validaFitxerImatge). Sense límit de pes: el cos no en tenia cap i
           la compressió el deixa en 1.200 px, com sempre. */
        const noEsImatge = validaFitxerImatge(original, Infinity);
        if (noEsImatge) {
          avisa?.(noEsImatge);
          return;
        }

        try {
          /* P1-64 · La pregunta, només si la foto porta res a conservar. */
          const tria = await triaDeLexif(original, demanaExif);
          if (tria === CANCELLADA) return;
          if (tria?.avis) {
            avisa?.(tria.avis);
            return;
          }
          const dataUrl = await comprimixDelCos(original, tria);

          let src = dataUrl;
          if (typeof onImageUpload === 'function') {
            /* Gauntlet 261016 (Bloc 1) · El fitxer porta el tipus i l'extensió
               reals (fitxerDeDataUrl): PNG si el canvas no ha sabut fer WebP. */
            const fitxer = await fitxerDeDataUrl(dataUrl, String(Date.now()));
            const url = await onImageUpload(fitxer);
            if (url) src = url;
          }

          editor.chain().focus().setImage({
            src,
            alt: original.name || 'Imatge',
            ...(tria?.atributs || null)
          }).run();
        } catch (err) {
          /* La pujada (o la compressió) rebutjada ja no falla en silenci: el
             missatge del port o, sense, el de la capçalera (useHeroImageHandler). */
          if (avisa) avisa(err?.message || "No s'ha pogut processar la imatge.");
          else console.warn('[slash] No s\'ha pogut inserir la imatge:', err?.message);
        }
      }
    },
    ...(ambOrdreEmoji ? [ordreEmoji] : []),
    ...(ambTargetes ? [ordreTargeta] : [])
  ];
}

/**
 * Extensions riques. El host les memoritza (useMemo) abans de passar-les:
 * si l'array canvia d'identitat a cada render, useEditor reconstruïx
 * l'editor i el cursor salta.
 *
 * T7 (ordre del Mestre, 261004) · `ambTargetes` afig les targetes
 * incrustades (targetes/targetesIncrustades.js) i la seua ordre «/». Ha de
 * ser CONSTANT durant la vida de l'editor: l'esquema es fixa en crear-lo.
 * Sense, les mateixes extensions de sempre.
 * Ordre del Mestre (261007, ordre E) · `onToast` arriba a l'ordre «Imatge»
 * (creaOrdres). També ha de ser estable: forma part del que es memoritza.
 * Bloc 3.8 del Gauntlet (261016) · `obreEmojis` (opcional i estable) afig
 * l'ordre «/» Emoji (creaOrdres · ambEmojis). Cap extensió ni node nou:
 * l'esquema és el de sempre.
 * P1-64 (pla 261028_1526 §3.1.1) · `demanaExif` (opcional i estable) arriba a
 * l'ordre «/» Imatge (creaOrdres). Sense, la crida de sempre.
 * P1-59 (a) (guàrdia nocturna 261030) · `placeholderCos` (un text no buit,
 * estable) afig el text fantasma del cos buit (placeholderCos.js): una
 * decoració, cap node. Sense, les extensions de sempre.
 */
export function extensionsRiques({
  onImageUpload = null, ambTargetes = false, onToast = null, obreEmojis = null, demanaExif = null, placeholderCos = null,
} = {}) {
  const ambEmojis = typeof obreEmojis === 'function';
  const ambExif = typeof demanaExif === 'function';
  const ambPlaceholder = typeof placeholderCos === 'string' && placeholderCos.trim() !== '';
  return [
    SdpImage.configure({
      inline: false,
      allowBase64: true,
      HTMLAttributes: { class: 'sdp-imatge-cos', loading: 'lazy', decoding: 'async' }
    }),
    SlashMenu.configure({
      ordres: creaOrdres({
        onImageUpload, ambTargetes, onToast, ...(ambEmojis ? { ambEmojis, obreEmojis } : {}), ...(ambExif ? { demanaExif } : {}),
      })
    }),
    ...(ambTargetes ? [TargetesIncrustades] : []),
    ...(ambPlaceholder ? [PlaceholderCos.configure({ text: placeholderCos })] : [])
  ];
}

export { SlashMenu };
