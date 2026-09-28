/**
 * T43 (ordre del Mestre, 260928) · normalitzaOrigen és la llista blanca
 * comuna dels dos adaptadors (localNotes.clean i supabase/notes.js): el que
 * no hi passa no es guarda enlloc. Fins ara cap prova no la cobria.
 */
import { expect, test } from 'vitest';
import { MAXIM_DESTINS, TIPUS_OBJECTE, esConnexio, normalitzaAbast, normalitzaOrigen, origenPublic } from './origenNota.js';

const BASE = { tipus: 'connexio', itemId: 'sella', titol: 'Sella', sectionId: 'pobles', ruta: '/pobles/sella' };

test('un origen antic, sense camps nous, continua exactament igual', () => {
  const antic = { ...BASE, autorId: 'u1', autorNom: 'Pepa', autorTipus: 'persona' };
  expect(normalitzaOrigen(antic)).toEqual(antic);
});

test('l’objecte només entra si és de la llista tancada', () => {
  expect(normalitzaOrigen({ ...BASE, objecte: 'poble' }).objecte).toBe('poble');
  expect(normalitzaOrigen({ ...BASE, objecte: 'script' })).not.toHaveProperty('objecte');
  expect(normalitzaOrigen({ ...BASE, objecte: { tipus: 'poble' } })).not.toHaveProperty('objecte');
  expect(TIPUS_OBJECTE).toContain('pagina');
  expect(Object.isFrozen(TIPUS_OBJECTE)).toBe(true);
});

test('un camp desconegut es descarta; sense itemId no hi ha origen', () => {
  const net = normalitzaOrigen({ ...BASE, permis: 'tothom', html: '<b>x</b>' });
  expect(net).not.toHaveProperty('permis');
  expect(net).not.toHaveProperty('html');
  expect(normalitzaOrigen({ tipus: 'connexio', titol: 'Sense id' })).toBeNull();
  expect(normalitzaOrigen({ ...BASE, tipus: 'altra' })).toBeNull();
});

test('abast: un mode desconegut cau a «privada» i les llistes d’altres modes no es guarden', () => {
  expect(normalitzaAbast({ mode: 'internet', persones: [{ id: 'a' }] })).toEqual({ mode: 'privada', persones: [], grups: [] });
  expect(normalitzaAbast({ mode: 'grups', persones: [{ id: 'a' }], grups: [{ id: 'g', nom: 'Comissió' }] }))
    .toEqual({ mode: 'grups', persones: [], grups: [{ id: 'g', nom: 'Comissió' }] });
  expect(normalitzaAbast(null)).toBeNull();
  expect(normalitzaAbast([])).toBeNull();
});

test('abast: destinataris nets, sense repetits ni entrades invàlides, i 50 com a màxim', () => {
  const moltes = Array.from({ length: 80 }, (_, i) => ({ id: `u${i}`, nom: `Persona ${i}` }));
  const net = normalitzaAbast({ mode: 'persones', persones: [null, 'u0', { nom: 'sense id' }, { id: 'u0', nom: 'Repetida' }, ...moltes] });
  expect(net.persones).toHaveLength(MAXIM_DESTINS);
  expect(net.persones[0]).toEqual({ id: 'u0', nom: 'Repetida' });
  expect(net.persones.filter((p) => p.id === 'u0')).toHaveLength(1);
  const brut = normalitzaAbast({ mode: 'persones', persones: [{ id: ' u\u0000x ', nom: `\u0007${'n'.repeat(300)}` }] });
  expect(brut.persones[0].id).toBe('ux');
  expect(brut.persones[0].nom).toHaveLength(120);
});

test('abast.aplicat: només ids, un booleà de veres per al Mur i una data vàlida', () => {
  const net = normalitzaAbast({
    mode: 'persones', persones: [{ id: 'u1', nom: 'Pepa' }],
    aplicat: { persones: ['u1', 7, { id: 'x' }, 'u1'], grups: 'g1', mur: 'sí', al: '2026-09-28T02:00:00.000Z', extra: true }
  });
  expect(net.aplicat).toEqual({ persones: ['u1', '7'], grups: [], mur: false, al: '2026-09-28T02:00:00.000Z' });
  expect(normalitzaAbast({ mode: 'poble', aplicat: { mur: true, al: 'ahir' } }).aplicat).toEqual({ persones: [], grups: [], mur: true });
});

test('l’abast viatja dins de l’origen i esConnexio no canvia', () => {
  const net = normalitzaOrigen({ ...BASE, objecte: 'poble', abast: { mode: 'persones', persones: [{ id: 'u1', nom: 'Pepa' }] } });
  expect(net.abast).toEqual({ mode: 'persones', persones: [{ id: 'u1', nom: 'Pepa' }], grups: [] });
  expect(normalitzaOrigen({ ...BASE, abast: 'tothom' })).not.toHaveProperty('abast');
  expect(esConnexio({ origen: net })).toBe(true);
});

/* T43 · correcció: l'abast diu a qui s'ha enviat la connexió i no pot eixir
   de la nota. Compartir al Mur copia l'origen a section_submissions.payload,
   que llig tot el poble per REST. */
test('origenPublic: el mateix origen net, però sense abast', () => {
  const privat = {
    ...BASE, objecte: 'poble', autorNom: 'Pepa',
    abast: { mode: 'persones', persones: [{ id: 'u1', nom: 'Toni' }], aplicat: { persones: ['u1'], grups: [], mur: false } }
  };
  const public_ = origenPublic(privat);
  expect(public_).not.toHaveProperty('abast');
  expect(public_).toEqual({ ...BASE, objecte: 'poble', autorNom: 'Pepa' });
  expect(JSON.stringify(public_)).not.toContain('Toni');
  expect(privat.abast.persones).toHaveLength(1);
  expect(origenPublic({ ...BASE, tipus: 'altra' })).toBeNull();
  expect(origenPublic(null)).toBeNull();
});
