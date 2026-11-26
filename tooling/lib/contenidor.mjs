/** El contenidor «Som de Poble» és la carpeta pare del repositori principal (v1.2.26, Lots C1-1 i C1-2).
 *  Des d'un worktree enllaçat (p. ex. _builds_de_poble/sandboxes_r26/…), la carpeta pare del worktree no és
 *  el contenidor: es resol a partir del directori Git comú. Si Git no respon o el directori comú no és un `.git`
 *  normal (submòdul, separate-git-dir), es torna la carpeta pare del repositori i qui crida ho ha de saber. Només llig. */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export function contenidorDe(repositori) {
  const real = fs.realpathSync(repositori);
  try {
    // Sense GIT_DIR, GIT_COMMON_DIR ni GIT_WORK_TREE heretats (un hook o un altre repositori no desvien el contenidor).
    const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^GIT_(DIR|COMMON_DIR|WORK_TREE|INDEX_FILE)$/.test(k)));
    const comu = execFileSync('git', ['-C', real, 'rev-parse', '--path-format=absolute', '--git-common-dir'], { encoding: 'utf8', env, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (path.basename(comu) === '.git') return path.dirname(path.dirname(fs.realpathSync(comu)));
  } catch { /* sense Git: la carpeta pare */ }
  return path.dirname(real);
}
