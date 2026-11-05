/** Carpetes privades: el nom es guarda abans d’assignar cap nota a l’id. */
export function nomDeCarpetaValid(input) {
  const nom = typeof input?.nom === 'string' ? input.nom.normalize('NFC').trim() : '';
  if (!nom || nom.length > 120 || /[\p{Cc}\p{Cf}]/u.test(nom)) throw new TypeError('Nom de carpeta invàlid.');
  return nom;
}
export function carpetaDeFila(fila) {
  if (!fila || typeof fila.id !== 'string' || !/^f-[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(fila.id) || typeof fila.nom !== 'string') throw new TypeError('Resposta de carpeta invàlida.');
  return { id: fila.id, nom: nomDeCarpetaValid(fila), parentId: null };
}
