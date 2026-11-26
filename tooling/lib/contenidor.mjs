/** El contenidor «Som de Poble» és la carpeta pare del repositori principal (v1.2.26, Lots C1-1 i C1-2).
 *  Des d'un worktree enllaçat (p. ex. _builds_de_poble/sandboxes_r26/…), la carpeta pare del worktree no és
 *  el contenidor: es resol a partir del directori Git comú. Sense Git, la carpeta pare del repositori. Només llig. */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export function contenidorDe(repositori) {
  const real = fs.realpathSync(repositori);
  try {
    const comu = execFileSync('git', ['-C', real, 'rev-parse', '--path-format=absolute', '--git-common-dir'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (path.basename(comu) === '.git') return path.dirname(path.dirname(fs.realpathSync(comu)));
  } catch { /* sense Git: la carpeta pare */ }
  return path.dirname(real);
}
