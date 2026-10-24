import { describe, expect, test } from 'vitest';
import { ESTATS_FORMAR_PART, LIMIT_AFEGIT, estatDeFormarPart, pertinencaDe, textDeLaSollicitud } from './estatFormarPart.js';

/* IDEA-14 (Directiva del Mestre, 261024; G-04) · «Formar part de l'entitat»:
   l'estat es calcula del que se sap de veres, i la sol·licitud és un text. */
const CONTACTE = { nom: 'El Rentonar', tipus: 'entitat', id: 'org-1', interlocutor: { tipus: 'entitat', id: 'org-1', nom: 'El Rentonar' } };

describe('estatDeFormarPart', () => {
  test('la prioritat: sense sessió > administres > membre > comprovant > sense xat > pot demanar', () => {
    expect(estatDeFormarPart()).toBe('sense-sessio');
    expect(estatDeFormarPart({ teSessio: false, membership: { role: 'owner' }, contacte: CONTACTE })).toBe('sense-sessio');
    expect(estatDeFormarPart({ teSessio: true, membership: { role: 'owner' }, carregant: true })).toBe('administres');
    expect(estatDeFormarPart({ teSessio: true, membership: { role: 'admin' }, contacte: CONTACTE })).toBe('administres');
    expect(estatDeFormarPart({ teSessio: true, membership: { role: 'member' }, carregant: true })).toBe('membre');
    expect(estatDeFormarPart({ teSessio: true, carregant: true, contacte: CONTACTE })).toBe('comprovant');
    expect(estatDeFormarPart({ teSessio: true })).toBe('sense-xat');
    expect(estatDeFormarPart({ teSessio: true, contacte: CONTACTE })).toBe('pot-demanar');
  });

  test('tots els estats que torna són de la llista', () => {
    const vistos = new Set();
    for (const teSessio of [false, true]) {
      for (const membership of [null, { role: 'member' }, { role: 'admin' }]) {
        for (const carregant of [false, true]) {
          for (const contacte of [null, CONTACTE]) vistos.add(estatDeFormarPart({ teSessio, membership, carregant, contacte }));
        }
      }
    }
    expect([...vistos].sort()).toEqual([...ESTATS_FORMAR_PART].sort());
  });
});

test('pertinencaDe troba la pertinença per id o per slug, i res sense id', () => {
  const memberships = [{ id: 'org-1', slug: 'el-rentonar', name: 'El Rentonar', role: 'member' }];
  expect(pertinencaDe(memberships, 'org-1')).toBe(memberships[0]);
  expect(pertinencaDe(memberships, ' el-rentonar ')).toBe(memberships[0]);
  expect(pertinencaDe(memberships, 'altra')).toBeNull();
  expect(pertinencaDe(memberships, '')).toBeNull();
  expect(pertinencaDe(undefined, 'org-1')).toBeNull();
});

test('textDeLaSollicitud: la línia fixa i, separat per una línia en blanc, el que s’hi afig (net i amb límit)', () => {
  expect(textDeLaSollicitud('Sol·licitud per a formar part de El Rentonar.')).toBe('Sol·licitud per a formar part de El Rentonar.');
  expect(textDeLaSollicitud('Sol·licitud per a formar part de El Rentonar.', '   ')).toBe('Sol·licitud per a formar part de El Rentonar.');
  expect(textDeLaSollicitud(' Sol·licitud. ', '  Toque la dolçaina.  ')).toBe('Sol·licitud.\n\nToque la dolçaina.');
  const llarg = textDeLaSollicitud('Sol·licitud.', 'x'.repeat(LIMIT_AFEGIT + 50));
  expect(llarg).toBe(`Sol·licitud.\n\n${'x'.repeat(LIMIT_AFEGIT)}`);
});
