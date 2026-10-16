import { useState, useRef } from 'react';

import { compressImage } from '../utils/imageUtils.js';
import {
  MIDA_AVATAR, MIDA_CAPCALERA, MIDA_LOGOTIP, fitxerDeDataUrl, fotoDinsDelPressupost,
} from '../utils/pujadaImatge.js';

/** Pes màxim de la foto que es tria (després es comprimix). */
export const MIDA_MAXIMA_IMATGE = 5 * 1024 * 1024;
/** Llargària màxima d'un data URL que es desa directament, sense servidor. */
const LIMIT_DATA_URL = 150000;

/* T46 (ordre del Mestre, 260928) · Esglaons de compressió. El PRIMER és
   exactament el d'abans; els altres només s'usen quan el resultat s'hauria de
   desar com a data URL (sense pujada al servidor) i passa de LIMIT_DATA_URL,
   que és el cas que abans acabava sempre en error.
   Gauntlet 261016 (Bloc 1, Llei del Quadrat) · Ja només són del logotip. Les
   fotos (capçalera, targeta i avatar) tenen la mida fixa i el pressupost de
   fotoDinsDelPressupost, i un data URL de menys de 80.000 bytes no passa mai
   de LIMIT_DATA_URL. */
const ESGLAONS = Object.freeze([
  Object.freeze({ escala: 1, qualitat: 0.8 }),
  Object.freeze({ escala: 0.8, qualitat: 0.75 }),
  Object.freeze({ escala: 0.64, qualitat: 0.7 }),
  Object.freeze({ escala: 0.5, qualitat: 0.7 }),
]);

const massaGranPerDesar = (valor) => typeof valor === 'string' && valor.startsWith('data:') && valor.length > LIMIT_DATA_URL;

/* Gauntlet 261016 (Bloc 1, Llei del Quadrat) · La mena de la imatge decidix
   la mida i el camí: el logotip (600 px, fora del pressupost, amb la reserva
   PNG del canvas, que conserva la transparència), l'avatar (400 px) i la
   capçalera o la targeta (1.200 px). La `forma` de la finestra de retall mana
   (l'avatar d'una persona es desa al camp logoImage); sense, el nom del camp,
   com sempre. */
const MIDES = Object.freeze({ avatar: MIDA_AVATAR, logotip: MIDA_LOGOTIP, capcalera: MIDA_CAPCALERA });
function menaDeImatge(fieldName, forma) {
  if (typeof forma === 'string' && Object.hasOwn(MIDES, forma)) return forma;
  const nom = String(fieldName || '').toLowerCase();
  if (nom.includes('avatar')) return 'avatar';
  return nom.includes('logo') ? 'logotip' : 'capcalera';
}

/* T46 · El logotip, com sempre (WebP de sèrie): el valor que es desa. Amb
   servidor, puja cada esglaó que prova; sense URL, el data URL. */
async function valorDelLogotip(file, maxSize, nom, onImageUpload) {
  let valor = '';
  for (const { escala, qualitat } of ESGLAONS) {
    const dataUrl = await compressImage(file, { maxSize: Math.round(maxSize * escala), format: 'image/webp', quality: qualitat });
    valor = dataUrl;
    if (typeof onImageUpload === 'function') {
      const url = await onImageUpload(await fitxerDeDataUrl(dataUrl, nom));
      if (url) valor = url;
    }
    if (!massaGranPerDesar(valor)) break;
  }
  return valor;
}

/* Gauntlet 261016 (Bloc 1) · Una foto: dins del pressupost o un error
   honest, ERROR_PRESSUPOST, sense pujar res. Amb servidor puja UN fitxer, el
   primer que hi cap, i desa l'URL que torne; sense URL, el data URL.
   Bloc 1.2 · `exif` ({ conservaExif, original }, la casella del diàleg) va
   sencer a fotoDinsDelPressupost; null, la foto ix neta com sempre. */
async function valorDeLaFoto(file, maxSize, nom, onImageUpload, exif) {
  const ambServidor = typeof onImageUpload === 'function';
  const foto = await fotoDinsDelPressupost(file, { mida: maxSize, nom, ambFitxer: ambServidor, ...exif });
  if (!ambServidor) return foto.dataUrl;
  return (await onImageUpload(foto.fitxer)) || foto.dataUrl;
}

/**
 * T46 · La mateixa validació que ha fet sempre la closca, per a qui la
 * necessita abans de processar (el diàleg d'enquadrament). Torna el missatge
 * d'error o null si la foto es pot processar.
 */
export function validaFitxerImatge(file, maxSizeBytes = MIDA_MAXIMA_IMATGE) {
  if (!file) return 'No has triat cap imatge.';
  if (!String(file.type || '').startsWith('image/')) return 'Només imatges, de moment.';
  if (file.size > maxSizeBytes) {
    return `La imatge passa de ${Math.round(maxSizeBytes / (1024 * 1024))} MB. És massa pesada per processar-la.`;
  }
  return null;
}

export default function useHeroImageHandler({
  onSaveField,
  fieldName = 'heroImage',
  maxSizeBytes = MIDA_MAXIMA_IMATGE, // Accept up to 5MB, then compress
  onError = (msg) => console.error(msg),
  onConfirmDelete = () => window.confirm('Segur que vols esborrar aquesta imatge?'),
  /* FASE 4. Capacitat opcional. Si no ve, comportament idèntic al d'abans:
     data URL. Cap host existent es trenca per no passar-la. */
  onImageUpload = null
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  /* T46 (ordre del Mestre, 260928) · El cos d'handleFileChange, ara amb un
     File directe (el que torna el diàleg d'enquadrament). Mateixa validació,
     compressió, pujada, desat i missatges. Torna true si ha desat.
     Onada 4 · revisió (K2) · `opcions.pesMaxim` canvia el límit només per a
     esta crida: la foto ORIGINAL d'un flux amb retallador ja l'ha acceptada
     el retallador amb el seu límit d'entrada. Sense opcions, el de sempre.
     Onada 4 (retallador senzill, 261008) · `opcions.midaMaxima` és el costat
     llarg de la compressió per a esta crida: el retall que ja ix a la mida
     exacta (600 × 600, 1.200 × 1.200, 400 × 400) no es torna a reduir encara que la
     constant de la forma canvie. Sense, 600 el logotip i 1.200 la resta, com
     sempre.
     Gauntlet 261016 (Bloc 1, Llei del Quadrat) · `opcions.forma` ('avatar',
     'logotip' o 'capcalera', la de la finestra de retall) diu la mena quan el
     camp no la diu (menaDeImatge). Sense `midaMaxima`, l'avatar ix a
     MIDA_AVATAR (400 px). La capçalera, la targeta i l'avatar no canvien mai
     de mida: només baixa la qualitat fins a quedar per davall de 80.000
     bytes, també sense servidor, i si ni la més baixa hi cap, l'error
     ERROR_PRESSUPOST per onError i cap pujada (fotoDinsDelPressupost). En un
     navegador sense WebP en canvas (Safari 16), la foto puja en JPEG. El
     logotip, com sempre (valorDelLogotip): fora del pressupost i, en eixe
     navegador, en PNG. El fitxer porta sempre el tipus i l'extensió reals
     (fitxerDeDataUrl).
     Gauntlet 261016 (Bloc 1.2, mandat del Mestre, pla §0.1.3) ·
     `opcions.conservaExif` (true, la casella marcada del DialegEnquadrament:
     «Conserva la ubicació i la data de la foto» o, si només porta la càmera,
     «Conserva les dades de la càmera de la foto») i `opcions.original` (la
     foto triada, d'on es llig l'EXIF; sense, `file`) fan que la foto porte la
     ubicació, la data i la càmera de l'original, dins del pressupost. Si és
     l'EXIF el que no hi cap, ERROR_PRESSUPOST_EXIF (o
     ERROR_PRESSUPOST_EXIF_CAMERA); si no es pot conservar,
     ERROR_EXIF_NO_CONSERVABLE (o ERROR_EXIF_NO_CONSERVABLE_CAMERA): tots per
     onError, tal qual, i cap pujada. Sense, o amb false, neta com sempre. El
     logotip no en porta mai: no té casella i, en Safari 16, ix en PNG. */
  const processaFitxer = async (file, opcions) => {
    if (!file) return false;
    const pesMaxim = Number(opcions?.pesMaxim) > 0 ? Number(opcions.pesMaxim) : maxSizeBytes;
    const avis = validaFitxerImatge(file, pesMaxim);
    if (avis) {
      onError(avis);
      return false;
    }

    setIsUploading(true);
    try {
      const mena = menaDeImatge(fieldName, opcions?.forma);
      const maxSize = Number(opcions?.midaMaxima) > 0 ? Math.round(Number(opcions.midaMaxima)) : MIDES[mena];
      const exif = opcions?.conservaExif === true ? { conservaExif: true, original: opcions.original || null } : null;
      const valor = mena === 'logotip'
        ? await valorDelLogotip(file, maxSize, fieldName, onImageUpload)
        : await valorDeLaFoto(file, maxSize, fieldName, onImageUpload, exif);

      if (massaGranPerDesar(valor)) {
        throw new Error("La imatge no s'ha pogut pujar al servidor i és massa gran (més de 150KB) per desar-la directament.");
      }

      onSaveField?.(fieldName, valor);
      setIsEditing(false);
      return true;
    } catch (err) {
      onError(err?.message || "No s'ha pogut processar la imatge.");
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  /* `opcions` (opcional) passa a processaFitxer. Com a onChange d'un <input>,
     React només en dona l'esdeveniment: el comportament de sempre. */
  const handleFileChange = (e, opcions) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    return processaFitxer(file, opcions);
  };

  const handleDelete = async () => {
    const confirmed = await onConfirmDelete();
    if (!confirmed) return;
    onSaveField?.(fieldName, '');
    setIsEditing(false);
  };

  const cancelEdit = () => setIsEditing(false);
  const startEdit = () => setIsEditing(true);

  return {
    isEditing,
    isUploading,
    startEdit,
    cancelEdit,
    fileInputRef,
    handleFileChange,
    processaFitxer,
    handleDelete
  };
}
