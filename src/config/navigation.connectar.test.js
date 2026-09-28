/**
 * T43 (ordre del Mestre, 260928) · Un sol model d'objecte connectable. Totes
 * les rutes de Connectar porten els paràmetres de sempre més `objecte` i
 * `ruta`; sense id ni ruta segura no s'inventa res.
 */
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
