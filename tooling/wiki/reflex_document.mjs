import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parseFrontmatter } from './lib/frontmatter.mjs';

function sha256(content) {
  return createHash('sha256').update(content).digest('hex');
}

export async function prepararDocument(tipus, documentId) {
  throw new Error('Prepare bloquejat: manca mediació autoritzada d’escriptura.');
}

export async function validarDocument(esborranyPath) {
  const content = await fs.readFile(esborranyPath, 'utf8');
  
  // Parsejar frontmatter amb l'esquema vigent
  const parsed = parseFrontmatter(content);
  
  if (!parsed.data.type || !parsed.data.status) {
    throw new Error('Frontmatter invàlid: falten camps obligatoris (type, status)');
  }

  // Validar estructura del markdown
  if (!content.includes('# ')) {
    throw new Error('Estructura Markdown invàlida: falta un títol (H1)');
  }
  
  return { valid: true, sha256: sha256(content), parsed };
}

export async function promoureDocument(esborranyPath, destinacioRelativa, preimatgeSha256) {
  throw new Error('Promote bloquejat: manca autorització vinculada a destí i contingut.');
}
