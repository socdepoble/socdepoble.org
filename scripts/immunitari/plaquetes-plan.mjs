/** Pure preparation for Plaquetes. The only application engine is the Reflex executor. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
export const digest = value => createHash('sha256').update(value).digest('hex');
export function confined(root, relative, {wiki = false, missing = false} = {}) {
  root = fs.realpathSync(root);
  if (typeof relative !== 'string' || !relative || path.isAbsolute(relative) || relative.includes('\\') || relative.split('/').some(x => !x || x === '.' || x === '..')) throw new Error('Ruta no relativa/canònica');
  if (wiki && (!relative.startsWith('_wiki_de_poble/') || /\/(?:90_arxiu_historic|01_produccio)(?:\/|$)/.test(relative))) throw new Error('Target fora de Wiki viva autoritzable');
  if (/^(?:\.git|\.sdp-reflex|scripts)(?:\/|$)/.test(relative)) throw new Error('Target protegit');
  let current = root;
  for (const part of relative.split('/')) {
    current = path.join(current, part);
    try {
      const stat = fs.lstatSync(current);
      if (stat.isSymbolicLink() || (stat.isFile() && stat.nlink !== 1)) throw new Error('Symlink/hardlink no autoritzat');
    } catch (e) { if (e.code !== 'ENOENT' || !missing) throw e; }
  }
  return current;
}
export function prepareRecipe(root, id, {session = null} = {}) {
  if (!/^[a-zA-Z0-9_-]+$/.test(id || '')) throw new Error('ID de recepta invàlid');
  const read = relative => fs.readFileSync(confined(root, relative), 'utf8');
  const recipeText = read(`.immunitari/receptes/${id}.json`);
  const approval = JSON.parse(read(`.immunitari/aprovacions/${id}.aprovat.json`));
  if (approval.recepta !== id || approval.hash !== digest(recipeText)) throw new Error('Aprovació divergent del hash exacte de la recepta');
  const recipe = JSON.parse(recipeText), config = JSON.parse(read('.immunitari/config.json'));
  if (config.vault !== '_wiki_de_poble' || !Array.isArray(recipe.operacions) || !recipe.operacions.length) throw new Error('Recepta/configuració invàlida');
  const files = new Map(), sources = new Set(), operationIds = new Set();
  const stage = relative => {
    if (!files.has(relative)) {
      const target = confined(root, relative, {wiki: true, missing: true});
      if (fs.existsSync(target) && !fs.statSync(target).isFile()) throw new Error('Target no regular');
      const content = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
      files.set(relative, {path: relative, before: fs.existsSync(target) ? digest(content) : null, content});
    }
    return files.get(relative);
  };
  // Validate every operation before preparing any effect, including formerly destructive ones.
  for (const op of recipe.operacions) {
    if (!op.id || operationIds.has(op.id)) throw new Error('ID d’operació absent/repetit');
    operationIds.add(op.id);
    const file = confined(root, op.fitxer, {wiki: true});
    if (!fs.statSync(file).isFile() || !/^[a-f0-9]{64}$/.test(op.hashFont || '') || digest(fs.readFileSync(file)) !== op.hashFont) throw new Error(`Hash font divergent/absent: ${op.fitxer}`);
    if (!['LAPIDA', 'ADOPTA'].includes(op.tipus)) throw new Error('Operació readOnly no suportada per aplica: zero efectes. Per a quarantena de buits, revisa node tooling/wiki/sdp-cli.mjs --help; per a contingut no buit cal pla humà de custòdia.');
    if (sources.has(op.fitxer)) throw new Error('Font repetida');
    sources.add(op.fitxer);
    if (op.tipus === 'LAPIDA' && (!Array.isArray(op.objectius) || !op.objectius.length || op.objectius.some(o => typeof o !== 'string' || /[\r\n[\]]/.test(o)))) throw new Error('Objectius invàlids');
  }
  for (const op of recipe.operacions) {
    if (op.tipus === 'LAPIDA') {
      const target = stage(op.fitxer);
      for (const objectiu of op.objectius) {
        if (op.fitxer.includes('INDEX')) {
          const escaped = objectiu.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const link = new RegExp(`\\[\\[${escaped}(?:\\|[^\\]]+)?\\]\\]`);
          target.content = target.content.split('\n').filter(line => !link.test(line) && !line.includes(`[[${config.memorialLapides}#${objectiu}|`)).join('\n');
        } else target.content = target.content.split(`[[${objectiu}]]`).join(`[[${config.memorialLapides}#${objectiu}|${objectiu} †]]`);
      }
      const memorial = stage(`${config.vault}/${config.memorialLapides}.md`);
      if (!memorial.content) memorial.content = '# Memorial de Llàpides\n\n';
      for (const objectiu of op.objectius) memorial.content += `- [${recipe.data}] Enllaç tancat a ${op.fitxer} (apuntava a: ${objectiu})\n`;
    } else {
      const index = stage(`${config.vault}/${config.indexAdopcio}.md`);
      if (!index.content) index.content = `# ${config.indexAdopcio}\n\n`;
      if (!index.content.includes('## Adopcions de Les Plaquetes')) index.content += '\n## Adopcions de Les Plaquetes\n';
      const link = `- [[${path.basename(op.fitxer, '.md')}]]`;
      if (!index.content.split('\n').includes(link)) index.content += `${link}\n`;
      // A no-op CAS entry keeps the adopted source inside the lease snapshot.
      stage(op.fitxer);
    }
  }
  for (const op of recipe.operacions) {
    if (files.get(op.fitxer)?.before !== op.hashFont) throw new Error(`CAS concurrent: ${op.fitxer}`);
  }
  return {schema: 'sdp.mutation.v1', session, operationId: `plaquetes-${id}-${digest(recipeText).slice(0, 12)}`, files: [...files.values()]};
}
