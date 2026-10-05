/** Escriptura de draft i àncora: revalida en executar, mai confia en el hook.
 * L'índex es llig per descriptor O_NOFOLLOW i es reemplaça amb rename; mai
 * escrivim al seu inode original, que un altre procés podria haver reenllaçat.
 */
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { CAMINS } from '../lib/arrel.mjs';
import { checkTaula } from '../gates/porta-olivera.mjs';

const same = (a, b) => a.dev === b.dev && a.ino === b.ino;
const regular = stat => stat.isFile() && stat.nlink === 1;
const failure = () => new Error('Destí documental substituït, enllaçat o fora de l’arrel.');

function parents(root, file, create = false) {
  const rel = path.relative(root, file);
  if (!rel || rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) throw failure();
  let current = root;
  for (const part of rel.split(path.sep).slice(0, -1)) {
    current = path.join(current, part);
    let stat;
    try { stat = fs.lstatSync(current); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      if (!create) return;
      fs.mkdirSync(current); stat = fs.lstatSync(current);
    }
    if (!stat.isDirectory() || stat.isSymbolicLink() || fs.realpathSync(current) !== current) throw failure();
  }
}
function openIndex(root) {
  const file = path.join(root, CAMINS.indexEscriptori);
  parents(root, file);
  const fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try {
    const stat = fs.fstatSync(fd);
    if (!regular(stat)) throw failure();
    parents(root, file);
    const named = fs.lstatSync(file);
    if (!regular(named) || named.isSymbolicLink() || !same(stat, named)) throw failure();
    return { file, fd, stat, content: fs.readFileSync(fd, 'utf8') };
  } catch (error) { fs.closeSync(fd); throw error; }
}
function assertOwned(root, file, stat, fd) {
  parents(root, file);
  const named = fs.lstatSync(file), opened = fs.fstatSync(fd);
  if (!regular(named) || !regular(opened) || named.isSymbolicLink() || !same(named, stat) || !same(opened, stat)) throw failure();
}
function removeOwned(root, file, stat) {
  // Rollback mai elimina un fitxer que una altra operació ha posat al mateix nom.
  try {
    parents(root, file);
    const named = fs.lstatSync(file);
    if (!named.isSymbolicLink() && same(named, stat)) fs.unlinkSync(file);
  } catch (error) { if (error.code !== 'ENOENT') return; }
}
export function checkDraftDestinations(root, file) {
  root = fs.realpathSync(root);
  parents(root, file);
  try {
    fs.lstatSync(file);
    const error = new Error('EEXIST: el draft ja existix.'); error.code = 'EEXIST'; throw error;
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const index = openIndex(root);
  fs.closeSync(index.fd);
}
function indexProse(index) {
  // Conserva offsets per inserir sense alterar comentaris ni exemples de codi.
  const mask = text => text.replace(/[^\r\n]/g, ' ');
  let fence = null;
  return index.replace(/<!--[\s\S]*?-->/g, mask).split(/(?<=\n)/).map(line => {
    const mark = /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (mark) {
      if (!fence) fence = mark[1];
      else if (mark[1][0] === fence[0] && mark[1].length >= fence.length) fence = null;
      return mask(line);
    }
    return fence ? mask(line) : line;
  }).join('').replace(/`[^`]*`/g, mask);
}
function anchorDraft(index, anchor, firstLevel) {
  if (!firstLevel) return indexProse(index).includes(anchor) ? index : `${index}\n- ${anchor}\n`;
  const prose = indexProse(index);
  const active = /^##[ \t]+Activitat en curs[^\n]*(?:\r?\n|$)/m.exec(prose);
  if (!active) return `${index}\n## Activitat en curs\n\n- ${anchor}\n`;
  const start = active.index + active[0].length;
  const next = /^##[ \t]/m.exec(prose.slice(start));
  const end = next ? start + next.index : index.length;
  if (prose.slice(start, end).includes(anchor)) return index;
  return `${index.slice(0, start)}\n- ${anchor}\n${index.slice(start)}`;
}
export function writeIndexedDraft(root, file, content, { requireCleanTable = false } = {}) {
  root = fs.realpathSync(root);
  checkDraftDestinations(root, file);
  const lock = path.join(root, CAMINS.agents, 'runtime', 'document-create.lock');
  parents(root, lock);
  const lockFd = fs.openSync(lock, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW, 0o600);
  const lockStat = fs.fstatSync(lockFd);
  let index, created, temporary, committed = false;
  try {
    assertOwned(root, lock, lockStat, lockFd);
    index = openIndex(root);
    // Revalida dins del lock: context pot haver emés el rebut abans que un
    // altre actor deixe un document nou sense classificar. No es mou res.
    if (requireCleanTable) {
      const taula = checkTaula(root);
      if (!taula.valid) throw new Error(`Convocatòria amb Escriptori brut:\n${taula.errors.join('\n')}`);
    }
    parents(root, file, true);
    const fd = fs.openSync(file, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW, 0o600);
    created = { fd, stat: fs.fstatSync(fd) };
    assertOwned(root, file, created.stat, fd);
    fs.writeFileSync(fd, content, 'utf8'); fs.fsyncSync(fd);
    const relative = path.relative(path.dirname(index.file), file).split(path.sep).join('/').replace(/\.md$/, '');
    const anchor = `[[${relative}]]`;
    const anchored = anchorDraft(index.content, anchor, path.dirname(file) === path.join(root, CAMINS.escriptori));
    if (anchored !== index.content) {
      const tempFile = `${index.file}.${randomUUID()}.tmp`;
      parents(root, tempFile);
      const tempFd = fs.openSync(tempFile, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW, index.stat.mode & 0o777);
      temporary = { file: tempFile, fd: tempFd, stat: fs.fstatSync(tempFd) };
      assertOwned(root, tempFile, temporary.stat, tempFd);
      fs.writeFileSync(tempFd, anchored, 'utf8'); fs.fsyncSync(tempFd);
    }
    // CAS de bytes i inode: preserva també les edicions concurrents legítimes.
    const latest = openIndex(root);
    try { if (!same(index.stat, latest.stat) || index.content !== latest.content) throw failure(); }
    finally { fs.closeSync(latest.fd); }
    assertOwned(root, index.file, index.stat, index.fd);
    assertOwned(root, file, created.stat, created.fd);
    if (temporary) {
      assertOwned(root, temporary.file, temporary.stat, temporary.fd);
      fs.renameSync(temporary.file, index.file);
    }
    committed = true;
  } finally {
    if (index) fs.closeSync(index.fd);
    if (created) {
      fs.closeSync(created.fd);
      if (!committed) removeOwned(root, file, created.stat);
    }
    if (temporary) { fs.closeSync(temporary.fd); removeOwned(root, temporary.file, temporary.stat); }
    fs.closeSync(lockFd); removeOwned(root, lock, lockStat);
  }
}
