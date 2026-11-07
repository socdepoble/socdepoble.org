// @vitest-environment node
/* P0-31 / IDEA-121 (Onada R10, kit r71) · El Mur ja no porta la barra ni el
   botó «Mode Revisió d'Importació (Admin)»: la bancada viu a /el-meu-perfil.
   Ni la bancada ni la fitxa de revisió tornen a enviar ningú al mode del Mur,
   i el CSS no conserva classes òrfenes de la barra retirada. */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from 'vitest';

const llig = (ruta) => readFileSync(path.join(process.cwd(), ruta), 'utf8');
const MUR = 'src/sections/mur/MurSection.jsx';
const BANC = 'src/sections/profile/admin/BancImportacioEditorial.jsx';
const FITXA = 'src/sections/detail/detailSectionMeta.jsx';
const CSS = 'src/css/modules.css';
const RETIRADES = ['sdp-mur-revisio-bar', 'sdp-mur-revisio-toggle'];

test('el Mur no pinta ni la barra ni el botó de revisió, ni consulta el rol per a pintar-los', () => {
  const mur = llig(MUR);
  for (const classe of RETIRADES) expect(mur).not.toContain(classe);
  expect(mur).not.toContain('useSuperadminEstable');
  // El text del botó retirat (JSX), no el comentari que n'explica la retirada.
  expect(mur).not.toContain('Mode Revisió d&apos;Importació (Admin)');
});

test('la bancada i la fitxa de revisió no enllacen amb /mur?revisio=wordpress ni amb una ruta que no obri la bancada', () => {
  for (const ruta of [BANC, FITXA]) {
    const codi = llig(ruta);
    expect(codi, ruta).not.toContain('revisio=wordpress');
    expect(codi, ruta).not.toContain('Tornar al Mode Revisió del Mur');
    /* /el-meu-perfil obri la primera fitxa, no la bancada: un enllaç que
       promet «tornar a la bancada» hi duria a un altre lloc. */
    expect(codi, ruta).not.toMatch(/(?:to|href)="\/el-meu-perfil"/);
  }
});

/* K1V-T2 (2a ronda) · Un comentari de prova que diu per on llig el rol el Mur ha de dir la veritat. */
test('cap prova del Mur afirma que el Mur llig el rol per un hook que MurSection.jsx no usa', () => {
  const mur = llig(MUR);
  const dir = path.join(process.cwd(), 'src/sections/mur');
  const proves = readdirSync(dir).filter((nom) => /\.test\.jsx?$/.test(nom));
  expect(proves).toContain('MurSection.revisioWp.test.jsx');
  const afirmacions = proves.flatMap((nom) => [...readFileSync(path.join(dir, nom), 'utf8')
    .matchAll(/Mur llig el rol (?:per|amb|via) (\w+)/g)].map(([, hook]) => [nom, hook]));
  expect(afirmacions.filter(([, hook]) => !mur.includes(hook))).toEqual([]);
});

test('modules.css no conserva cap regla de la barra retirada, i cada classe sdp-mur-revisio-* que declara la usa el Mur', () => {
  const css = llig(CSS);
  const mur = llig(MUR);
  for (const classe of RETIRADES) expect(css).not.toMatch(new RegExp(`\\.${classe}(?![\\w-])`));
  const declarades = [...new Set([...css.matchAll(/\.(sdp-mur-revisio-[\w-]+)/g)].map((m) => m[1]))];
  expect(declarades.length).toBeGreaterThan(0);
  expect(declarades.filter((classe) => !mur.includes(classe))).toEqual([]);
});
