import { protegeixFormula } from '../../utils/fulls/csv.js';

export function textDeCelaDoctoral(valor) {
  if (typeof valor === 'number') return String(valor);
  const text = valor === null || valor === undefined ? '' : valor;
  if (typeof text !== 'string') throw new TypeError('Tipus de cel·la CSV doctoral invàlid.');
  return /^\s*[=+\-@]/u.test(text) ? "'" + text : protegeixFormula(text);
}

/** Perfil CSV amb coma, CRLF i escàner estricte RFC 4180. */
export function escriuCsvDoctoral(files) {
  return files.map(fila => fila.map(valor => {
    const text = textDeCelaDoctoral(valor);
    return '"' + text.replace(/"/g, '""') + '"';
  }).join(',')).join('\r\n') + '\r\n';
}

export function lligCsvDoctoral(text, maxFiles, maxColumnes) {
  const font = text.startsWith('\uFEFF') ? text.slice(1) : text;
  const files = [];
  let fila = [];
  let camp = '';
  let estat = 'inici';
  const afegeixCamp = () => {
    fila.push(camp);
    if (fila.length > maxColumnes) throw new TypeError('Massa columnes al CSV doctoral.');
    camp = '';
    estat = 'inici';
  };
  const afegeixFila = () => {
    afegeixCamp();
    files.push(fila);
    if (files.length > maxFiles) throw new TypeError('Massa registres al CSV doctoral.');
    fila = [];
  };
  for (let i = 0; i < font.length; i += 1) {
    const caracter = font[i];
    if (estat === 'cometes') {
      if (caracter !== '"') camp += caracter;
      else if (font[i + 1] === '"') {
        camp += '"';
        i += 1;
      } else estat = 'tancat';
    } else if (caracter === ',') {
      afegeixCamp();
    } else if (caracter === '\r' || caracter === '\n') {
      afegeixFila();
      if (caracter === '\r' && font[i + 1] === '\n') i += 1;
    } else if (caracter === '"' && estat === 'inici') {
      estat = 'cometes';
    } else {
      if (estat === 'tancat' || caracter === '"') throw new TypeError('Cometes invàlides al CSV doctoral.');
      camp += caracter;
      estat = 'text';
    }
  }
  if (estat === 'cometes') throw new TypeError('Camp CSV sense cometa de tancament.');
  if (estat !== 'inici' || fila.length) afegeixFila();
  return files;
}
