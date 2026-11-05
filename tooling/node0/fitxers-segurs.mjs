import fs from 'node:fs';
import path from 'node:path';
/** Normalize macOS' two system aliases; reject symlinks in application paths. */
export function camiSegur(file, { allowMissing = false } = {}) {
  let absolute = path.resolve(file);
  if (process.platform === 'darwin') {
    if (absolute === '/tmp' || absolute.startsWith('/tmp/')) absolute = '/private' + absolute;
    if (absolute === '/var' || absolute.startsWith('/var/')) absolute = '/private' + absolute;
  }
  let cursor = path.parse(absolute).root;
  for (const part of absolute.slice(cursor.length).split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor,part);
    let stat;
    try { stat = fs.lstatSync(cursor); } catch (error) { if (allowMissing && error.code === 'ENOENT') return absolute; throw error; }
    if (stat.isSymbolicLink()) throw new Error('node0_path_symlink');
  }
  return absolute;
}
export function fitxerRegular(file) {
  const absolute = camiSegur(file), stat = fs.lstatSync(absolute);
  if (!stat.isFile() || stat.nlink !== 1) throw new Error('node0_file_nonregular');
  return { absolute, stat };
}
