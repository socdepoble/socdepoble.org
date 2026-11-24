/**
 * tool-dialect.mjs — Adaptador únic de dialectes d'eines d'escriptura (R32.87).
 *
 * Unifica el dialecte Antigravity 1.x (`write_to_file`, `replace_file_content`,
 * `multi_replace_file_content` amb `TargetFile`/`CodeContent`/`TargetContent`/
 * `ReplacementContent`/`ReplacementChunks`), el dialecte Antigravity 2.x
 * (`write_file`, `edit_file` amb `Path`/`Content`/`Target`/`Replacement`/`Append`)
 * i el dialecte Claude (`Write`, `Edit`, `NotebookEdit` amb `file_path`/
 * `notebook_path`/`content`/`old_string`/`new_string`/`replace_all`).
 *
 * Zero dependències externes: consumit pels hooks de governança.
 */

export const EINES_ESCRIPTURA_ANTIGRAVITY = Object.freeze([
  'write_to_file',
  'replace_file_content',
  'multi_replace_file_content',
  'write_file',
  'edit_file',
]);

export const EINES_ESCRIPTURA_TOTES = Object.freeze([
  'apply_patch',
  'Write',
  'Edit',
  'NotebookEdit',
  ...EINES_ESCRIPTURA_ANTIGRAVITY,
]);

export const CLAUS_CONTINGUT_ESCRIPTURA = Object.freeze([
  'CodeContent',
  'ReplacementChunks',
  'ReplacementContent',
  'TargetContent',
  'Content',
  'Target',
  'Replacement',
  'content',
  'old_string',
  'new_string',
]);

/** Torna el camí de fitxer declarat en qualsevol dialecte conegut, o null. */
export function camiDeArgs(args) {
  if (!args || typeof args !== 'object' || Array.isArray(args)) return null;
  for (const clau of ['file_path', 'notebook_path', 'TargetFile', 'Path', 'AbsolutePath']) {
    if (typeof args[clau] === 'string' && args[clau].trim()) return args[clau];
  }
  return null;
}

/** Torna el text complet escrit si l'eina aporta el document sencer (no append), o null. */
export function contingutCompletDeArgs(args) {
  if (!args || typeof args !== 'object' || Array.isArray(args)) return null;
  if (typeof args.content === 'string') return args.content;
  if (typeof args.CodeContent === 'string') return args.CodeContent;
  if (typeof args.Content === 'string' && args.Append !== true) return args.Content;
  return null;
}

/** Torna true si el nom d'eina o els seus arguments corresponen a una escriptura de fitxer. */
export function esEinaDEscriptura(nom, args = {}) {
  if (typeof nom === 'string' && EINES_ESCRIPTURA_ANTIGRAVITY.includes(nom)) return true;
  if (!args || typeof args !== 'object' || Array.isArray(args)) return false;
  return CLAUS_CONTINGUT_ESCRIPTURA.some((k) => Object.hasOwn(args, k));
}

/** Torna tots els fragments textuals inserits per validar invariants (ex. !important en CSS). */
export function fragmentsDEscriptura(args) {
  if (!args || typeof args !== 'object' || Array.isArray(args)) return [];
  const out = [];
  for (const k of ['CodeContent', 'ReplacementContent', 'Content', 'Replacement', 'content', 'new_string']) {
    if (typeof args[k] === 'string') out.push(args[k]);
  }
  if (Array.isArray(args.ReplacementChunks)) {
    for (const chunk of args.ReplacementChunks) {
      if (typeof chunk?.ReplacementContent === 'string') out.push(chunk.ReplacementContent);
    }
  }
  return out;
}
