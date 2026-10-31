// @vitest-environment node
/* Corrector del Gauntlet f4 (30-10-2026) · Decisió 4 del Mestre (30-10-2026
   ~15:00: «si ja no s'usa en cap secció, neteja el codi mort mantenint les
   proves al dia») i les restes de l'ordre d'usabilitat («si queda codi o
   prova a l'espai que la passe sense efecte, es neteja»).
     · props-mortes-als-consumidors-i-a-les-proves · L'UniversalWorkspace ja
       no llig replegaTotaCapcalera (l'ordre d'usabilitat deixa el títol fix) ni
       obridorALaLlista (retirada amb el rail fix de «mitja»). Disseny, la Wiki,
       Multimèdia i el Bloc encara les passaven sense cap efecte: cap secció que
       munta l'espai no les passa. AppGridColumn (el Xat) conserva la seua
       replegaTotaCapcalera: esta guarda només mira qui munta <UniversalWorkspace>.
     · workspace-llistaenrail-i-branca-mitja-mortes · Amb columnesFixes, la
       closca del Workspace només és «estret» o «ample» (midaDeGraella): cap
       branca del codi de l'espai pregunta per «mitja». El context de la closca
       ja no oferix llistaEnRail (AppGridShell.rail.test.jsx, SondaContext).
   Es llig el codi de la font sense els comentaris, que poden contar la
   història de les props retirades. */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const llig = (rel) => readFileSync(path.join(ARREL, rel), 'utf8');
/* Sense comentaris de bloc (també els {/* … *\/} del JSX) ni de línia sencera. */
const codiDe = (font) => font.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

function fitxers(dir, acc = []) {
  for (const entrada of readdirSync(path.join(ARREL, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entrada.name}`;
    if (entrada.isDirectory()) fitxers(rel, acc);
    else if (/\.jsx?$/.test(entrada.name) && !/\.test\.jsx?$/.test(entrada.name)) acc.push(rel);
  }
  return acc;
}

/* Qui munta l'espai: el codi (no un text d'exemple del catàleg) porta <UniversalWorkspace. */
const CONSUMIDORS = fitxers('src').filter((rel) => /<UniversalWorkspace\b/.test(codiDe(llig(rel)).replace(/`[^`]*`/g, '')));
const RETIRADES = ['replegaTotaCapcalera', 'obridorALaLlista', 'railMitja', 'railEsquerra'];

describe('les props retirades de l’UniversalWorkspace', () => {
  test('les seccions que munten l’espai hi són (Disseny, la Wiki, Multimèdia, el Bloc, el Perfil, Admin, el Lector)', () => {
    for (const rel of [
      'src/sections/disseny/DesignSection.jsx',
      'src/sections/wiki-de-poble/WikiDePobleSection.jsx',
      'src/sections/multimedia/MultimediaSection.jsx',
      'src/sections/notes/NotesSection.jsx',
      'src/sections/profile/PerfilShell.jsx',
      'src/sections/admin/AdminSection.jsx',
      'src/apps/lector/vistes/Noticies.jsx'
    ]) expect(CONSUMIDORS).toContain(rel);
  });

  test.each(RETIRADES)('cap secció que munta l’espai li passa %s', (prop) => {
    const ambProp = CONSUMIDORS.filter((rel) => new RegExp(`\\b${prop}\\b`).test(codiDe(llig(rel))));
    expect(ambProp).toEqual([]);
  });

  test('l’espai no les llig: cap d’elles és al codi d’UniversalWorkspace.jsx', () => {
    const codi = codiDe(llig('src/components/universal/workspace/UniversalWorkspace.jsx'));
    expect(RETIRADES.filter((prop) => new RegExp(`\\b${prop}\\b`).test(codi))).toEqual([]);
  });
});

describe('l’espai no passa mai per «mitja»', () => {
  test('cap branca del codi d’UniversalWorkspace.jsx pregunta per la mida «mitja»', () => {
    const codi = codiDe(llig('src/components/universal/workspace/UniversalWorkspace.jsx'));
    expect(codi.match(/[!=]==?\s*'mitja'|'mitja'\s*[!=]==?/g) ?? []).toEqual([]);
  });

  test('la closca no oferix llistaEnRail: cap codi el defineix ni el llig', () => {
    const ambLlistaEnRail = fitxers('src').filter((rel) => /\bllistaEnRail\b/.test(codiDe(llig(rel))));
    expect(ambLlistaEnRail).toEqual([]);
  });
});
