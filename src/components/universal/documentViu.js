/**
 * documentViu.js — magatzem mínim del document que s'està escrivint, per id.
 *
 * T50 (decisió del Mestre, 260928) · La fitxa activa del Perfil a la columna
 * central és targeta viva, però el text que s'escriu viu dins de l'editor
 * (PerfilEditor, estat `local`), en una altra columna del Workspace. El Bloc
 * de Notes no en necessita: les seues tecles ja arriben a la llista per
 * NotesContext (setLocalNoteField).
 *
 * Qui escriu publica { document, autor, etiquetes } amb una clau (l'id de la
 * identitat) i la fitxa de la llista s'hi subscriu (useDocumentViu, a
 * TargetaViva.jsx). Sense entrada, la llista pinta la fitxa compacta de
 * sempre. Pur: sense React ni backend; la mateixa forma que useSyncExternalStore.
 */
const entrades = new Map();
const oients = new Map();

const clauDe = (clau) => (clau == null || clau === '' ? null : String(clau));

function avisa(clau) {
  for (const oient of [...(oients.get(clau) || [])]) oient();
}

/**
 * Publica (o substituïx) l'entrada d'una clau. Torna la funció que la retira,
 * només si encara és la mateixa: una publicació posterior no s'esborra.
 */
export function publicaDocumentViu(clau, entrada) {
  const k = clauDe(clau);
  if (!k) return () => {};
  entrades.set(k, entrada);
  avisa(k);
  return () => {
    if (entrades.get(k) !== entrada) return;
    entrades.delete(k);
    avisa(k);
  };
}

/** L'entrada d'una clau, o null. Sempre el mateix objecte mentre no canvia. */
export function llegixDocumentViu(clau) {
  const k = clauDe(clau);
  return k ? (entrades.get(k) ?? null) : null;
}

/** Escolta els canvis d'una clau. Torna la baixa. */
export function subscriuDocumentViu(clau, oient) {
  const k = clauDe(clau);
  if (!k || typeof oient !== 'function') return () => {};
  if (!oients.has(k)) oients.set(k, new Set());
  oients.get(k).add(oient);
  return () => {
    const llista = oients.get(k);
    if (!llista) return;
    llista.delete(oient);
    if (!llista.size) oients.delete(k);
  };
}
