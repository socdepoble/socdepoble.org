import { useState, useRef } from 'react';

import { compressImage } from '../utils/imageUtils.js';

/** Un data URL comprimit tornat a fitxer, per a pujar-lo. */
async function aFitxer(dataUrl, nom, tipus) {
  const resposta = await fetch(dataUrl);
  const blob = await resposta.blob();
  return new File([blob], nom, { type: tipus });
}

export default function useHeroImageHandler({ 
  onSaveField, 
  fieldName = 'heroImage', 
  maxSizeBytes = 5 * 1024 * 1024, // Accept up to 5MB, then compress
  onError = (msg) => console.error(msg),
  onConfirmDelete = () => window.confirm('Segur que vols esborrar aquesta imatge?'),
  /* FASE 4. Capacitat opcional. Si no ve, comportament idèntic al d'abans:
     data URL. Cap host existent es trenca per no passar-la. */
  onImageUpload = null
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onError('Només imatges, de moment.');
      return;
    }
    if (file.size > maxSizeBytes) {
      onError(`La imatge passa de ${Math.round(maxSizeBytes / (1024 * 1024))} MB. És massa pesada per processar-la.`);
      return;
    }

    setIsUploading(true);
    try {
      const esMenut = fieldName.toLowerCase().includes('logo') || fieldName.toLowerCase().includes('avatar');
      const maxSize = esMenut ? 600 : 1200;
      const dataUrl = await compressImage(file, { maxSize, format: 'image/webp', quality: 0.8 });

      let valor = dataUrl;
      if (typeof onImageUpload === 'function') {
        const fitxer = await aFitxer(dataUrl, `${fieldName}.webp`, 'image/webp');
        const url = await onImageUpload(fitxer);
        if (url) valor = url;
      }

      if (valor.startsWith('data:') && valor.length > 150000) {
        throw new Error("La imatge no s'ha pogut pujar al servidor i és massa gran (més de 150KB) per desar-la directament.");
      }

      onSaveField?.(fieldName, valor);
      setIsEditing(false);
    } catch (err) {
      onError(err?.message || "No s'ha pogut processar la imatge.");
    } finally {
      setIsUploading(false);
    }
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
    handleDelete
  };
}
