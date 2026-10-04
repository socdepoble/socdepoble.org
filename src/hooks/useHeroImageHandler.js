import { useState, useRef } from 'react';

import { compressImage } from '../utils/imageUtils.js';

/** Un data URL comprimit tornat a fitxer, per a pujar-lo. */
async function aFitxer(dataUrl, nom, tipus) {
  const resposta = await fetch(dataUrl);
  const blob = await resposta.blob();
  return new File([blob], nom, { type: tipus });
}

/** Pes màxim de la foto que es tria (després es comprimix). */
export const MIDA_MAXIMA_IMATGE = 5 * 1024 * 1024;
/** Llargària màxima d'un data URL que es desa directament, sense servidor. */
const LIMIT_DATA_URL = 150000;

/* T46 (ordre del Mestre, 260928) · Esglaons de compressió. El PRIMER és
   exactament el d'abans; els altres només s'usen quan el resultat s'hauria de
   desar com a data URL (sense pujada al servidor) i passa de LIMIT_DATA_URL,
   que és el cas que abans acabava sempre en error. Un quadrat 1:1 de 1200 px
   té 1,78 vegades els píxels d'un 16:9: sense esglaons fallaria més sovint.
   Limitació coneguda: si el navegador no codifica WebP en canvas (Safari 16),
   compressImage torna PNG i els esglaons poden no bastar. */
const ESGLAONS = Object.freeze([
  Object.freeze({ escala: 1, qualitat: 0.8 }),
  Object.freeze({ escala: 0.8, qualitat: 0.75 }),
  Object.freeze({ escala: 0.64, qualitat: 0.7 }),
  Object.freeze({ escala: 0.5, qualitat: 0.7 }),
]);

const massaGranPerDesar = (valor) => typeof valor === 'string' && valor.startsWith('data:') && valor.length > LIMIT_DATA_URL;

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
     el retallador amb el seu límit d'entrada. Sense opcions, el de sempre. */
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
      const esMenut = fieldName.toLowerCase().includes('logo') || fieldName.toLowerCase().includes('avatar');
      const maxSize = esMenut ? 600 : 1200;

      let valor = '';
      for (const { escala, qualitat } of ESGLAONS) {
        const dataUrl = await compressImage(file, { maxSize: Math.round(maxSize * escala), format: 'image/webp', quality: qualitat });
        valor = dataUrl;
        if (typeof onImageUpload === 'function') {
          const fitxer = await aFitxer(dataUrl, `${fieldName}.webp`, 'image/webp');
          const url = await onImageUpload(fitxer);
          if (url) valor = url;
        }
        if (!massaGranPerDesar(valor)) break;
      }

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
