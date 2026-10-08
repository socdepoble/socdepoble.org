/**
 * T43 (ordre del Mestre, 260928) · Un sol model d'objecte connectable. Totes
 * les rutes de Connectar porten els paràmetres de sempre més `objecte` i
 * `ruta`; sense id ni ruta segura no s'inventa res.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import {
  esRutaInterna, objecteDe, objecteDePagina, objecteDePerfil, rutaConnectar, rutaConnectarObjecte, rutaConnectarPerfil
} from './navigation.js';

const params = (ruta) => Object.fromEntries(new URL(ruta, 'http://localhost').searchParams);

test('poble: rutaConnectar conserva els paràmetres de sempre i afig objecte i ruta', () => {
  const ruta = rutaConnectar({ id: 'sella', title: 'Sella' }, 'pobles');
  expect(ruta.startsWith('/connectar?')).toBe(true);
  expect(params(ruta)).toEqual({ item_id: 'sella', title: 'Sella', sectionId: 'pobles', objecte: 'poble', ruta: '/pobles/sella' });
});

test('publicació d’una entitat: autor amb id, tipus i nom', () => {
  const item = { id: 'p1', title: 'Fira', author_org_id: 'socdepoble', author_name: 'Sóc de Poble' };
  expect(params(rutaConnectar(item, 'mur'))).toEqual({
    item_id: 'p1', title: 'Fira', sectionId: 'mur', targetUserId: 'socdepoble', autorTipus: 'entitat',
    author: 'Sóc de Poble', objecte: 'publicacio', ruta: '/mur/p1'
  });
});

test('esdeveniment de l’agenda i producte del Mercat', () => {
  expect(objecteDe({ id: 'aplec', title: 'Aplec' }, 'events')).toMatchObject({ tipus: 'esdeveniment', ruta: '/events/aplec' });
  expect(objecteDe({ id: 's', name: 'Samarreta', seller: 'Pepa' }, 'mercat'))
    .toEqual({ tipus: 'producte', id: 's', titol: 'Samarreta', seccio: 'mercat', ruta: '/mercat/s', autor: { tipus: '', id: '', nom: 'Pepa' } });
});

test('persona, entitat, grup i IA: ruta del perfil públic, sense autor inventat', () => {
  expect(objecteDePerfil({ tipus: 'persona', id: 'u1', nom: 'Pepa' }))
    .toEqual({ tipus: 'persona', id: 'u1', titol: 'Pepa', seccio: 'perfil', ruta: '/gent/u1', autor: null });
  expect(objecteDePerfil({ tipus: 'entitat', id: 'socdepoble', nom: 'Sóc de Poble' }).ruta).toBe('/empresa/socdepoble');
  expect(objecteDePerfil({ tipus: 'grup', id: 'g1', nom: 'Colla' }).ruta).toBe('/grup/g1');
  expect(objecteDePerfil({ tipus: 'ia', id: 'iaia', nom: 'IAIA' }).ruta).toBe('/perfil/iaia');
  expect(objecteDePerfil({ tipus: 'desconegut', id: 'x', name: 'X' }).tipus).toBe('persona');
  expect(objecteDePerfil({ tipus: 'persona', nom: 'Sense id' })).toBeNull();
  const ruta = rutaConnectarObjecte(objecteDePerfil({ tipus: 'entitat', id: 'socdepoble', nom: 'Sóc de Poble' }), { organitzacio: 'socdepoble' });
  expect(params(ruta)).toEqual({ item_id: 'socdepoble', title: 'Sóc de Poble', sectionId: 'perfil', objecte: 'entitat', ruta: '/empresa/socdepoble', organitzacio: 'socdepoble' });
});

/* Poliment T43 · la fitxa pública i el directori fan el mateix camí: una
   entitat o un grup porten organitzacio=ID; una persona o una IA, no. */
test('rutaConnectarPerfil: organitzacio=ID només per a una entitat o un grup; sense id, null', () => {
  expect(params(rutaConnectarPerfil({ tipus: 'entitat', id: 'forn', nom: 'Forn' }))).toMatchObject({ objecte: 'entitat', organitzacio: 'forn' });
  expect(params(rutaConnectarPerfil({ tipus: 'grup', id: 'g1', nom: 'Colla' }))).toMatchObject({ objecte: 'grup', organitzacio: 'g1' });
  expect(params(rutaConnectarPerfil({ tipus: 'persona', id: 'u1', nom: 'Pepa' }))).not.toHaveProperty('organitzacio');
  expect(params(rutaConnectarPerfil({ tipus: 'ia', id: 'iaia', nom: 'IAIA' }))).not.toHaveProperty('organitzacio');
  expect(rutaConnectarPerfil({ tipus: 'entitat', nom: 'Sense id' })).toBeNull();
});

test('pàgina: la clau és la ruta; sense ruta, el títol; cap secció', () => {
  expect(params(rutaConnectarObjecte(objecteDePagina({ titol: 'Wiki de Poble', ruta: '/wikidepoble?item=genoma' }))))
    .toEqual({ item_id: '/wikidepoble?item=genoma', title: 'Wiki de Poble', objecte: 'pagina', ruta: '/wikidepoble?item=genoma' });
  expect(objecteDePagina({ titol: 'Fira' })).toEqual({ tipus: 'pagina', id: 'Fira', titol: 'Fira', seccio: '', ruta: '', autor: null });
  expect(objecteDePagina()).toMatchObject({ tipus: 'pagina', id: '', ruta: '' });
});

test('una ruta que no és interna i segura no viatja mai', () => {
  for (const dolenta of ['https://mal.example', '//mal.example/x', 'javascript:alert(1)', '/\\mal.example', '/a b', '/x\u0000', `/${'a'.repeat(400)}`, 7, null]) {
    expect(esRutaInterna(dolenta), String(dolenta)).toBe(false);
    expect(params(rutaConnectarObjecte({ tipus: 'pagina', id: 'x', titol: 'X', ruta: dolenta }))).not.toHaveProperty('ruta');
  }
  expect(esRutaInterna('/mur?date=2026-09-28')).toBe(true);
  /* Una secció amb barra davant faria «//…»: la ruta derivada també es filtra. */
  expect(objecteDe({ id: 'x' }, '/mal.example').ruta).toBe('');
});

test('un tipus fora de la llista no s’escriu; els extra buits tampoc', () => {
  const ruta = rutaConnectarObjecte({ tipus: 'script', id: 'x', titol: 'X' }, { organitzacio: '', buit: null });
  expect(params(ruta)).toEqual({ item_id: 'x', title: 'X' });
  expect(rutaConnectarObjecte(null)).toBe('/connectar?');
});

/* Auditoria 261007 (B) · Codi mort retirat en un sol canvi: navigation.js ja
   no carrega la llavor per a getSectionItems i findSectionItem (cap crida), i
   sectionContent.js ja no calcula la cerca global ni reexporta el catàleg de
   notes vell (notesContent.js). La llavor viva l'importa appSeed.js.
   Relleu 261007 (revisor de dades-netes, onada 3b) · La prova s'ancora a les
   línies d'import de navigation.js, no al text de la capçalera (que nomena
   sectionContent.js per a explicar la retirada), i de sectionContent.js
   només comprova que les claus retirades no hi tornen: la llista sencera
   d'exports és de la llavor, no d'esta prova. */
test('navigation.js sense els cercadors de la llavor; sectionContent.js, només la llavor viva', async () => {
  const navigation = await import('./navigation.js');
  for (const mort of ['getSectionItems', 'findSectionItem']) expect(mort in navigation, mort).toBe(false);
  const font = readFileSync(resolve(process.cwd(), 'src/config/navigation.js'), 'utf8');
  /* Revisió adversarial (Relleu 261007) · També les importacions de només
     efecte (`import '…';`, sense `from`): una d'estes tornaria a carregar la
     llavor sense importar-ne cap nom, i l'expressió de les estàtiques no la
     veia. */
  const especificadors = (codi) => [
    ...[...codi.matchAll(/^[ \t]*(?:import|export)\b[^;]*?\bfrom\s*['"]([^'"]+)['"]/gm)].map((m) => m[1]),
    ...[...codi.matchAll(/^[ \t]*import\s*['"]([^'"]+)['"]/gm)].map((m) => m[1]),
    ...[...codi.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g)].map((m) => m[1])
  ];
  /* Sonda: les expressions veuen les tres formes (la de diverses línies, la de
     només efecte i la dinàmica) i les importacions vives de navigation.js. */
  expect(especificadors("import {\n  a,\n  b\n} from './multi.js';\nimport './efecte.js';\nconst m = () => import('./dinamica.js');\n"))
    .toEqual(['./multi.js', './efecte.js', './dinamica.js']);
  const importats = especificadors(font);
  expect(importats).toEqual(expect.arrayContaining(['../data/identitatsSeed.js', './objecteConnectable.js']));
  expect(importats.filter((especificador) => /sectionContent/.test(especificador))).toEqual([]);
  const contingut = await import('../data/sectionContent.js');
  expect(Object.keys(contingut).length).toBeGreaterThan(0);
  for (const retirada of ['GLOBAL_SEARCH_ITEMS', 'PAGE_DETAIL_LOOKUP', 'NOTES', 'NOTE_FOLDERS']) {
    expect(retirada in contingut, retirada).toBe(false);
  }
});
