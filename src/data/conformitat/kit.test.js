import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { CAPACITATS, CONTRACTE_NUCLI } from '../contracte.js';
import { CASOS, contextDeConformitat, executaCas, metodesSenseCas } from './kit.js';

/* El kit mateix: pur, lligat al contracte i capaç de vore una falla. Cap
   adaptador real: els dobles d'ací són mínims a posta. */
const cas = (metode, titol) => CASOS.find((c) => c.metode === metode && (!titol || c.titol.includes(titol)));

/* Tots els especificadors estàtics d'un font: els que porten from i els nus
   (import 'x';), que acoblarien el kit a un mòdul sense importar-ne cap nom. */
const importsDe = (font) => [
  ...[...font.matchAll(/^\s*(?:import|export)\s[^;]*?from\s+['"]([^'"]+)['"]/gm)].map((m) => m[1]),
  ...[...font.matchAll(/^\s*import\s*['"]([^'"]+)['"]/gm)].map((m) => m[1])
];

describe('el kit és pur i parla del contracte', () => {
  test('només importa ../contracte.js', () => {
    const font = readFileSync(resolve(process.cwd(), 'src/data/conformitat/kit.js'), 'utf8');
    expect(importsDe(font)).toEqual(['../contracte.js']);
    expect(font).not.toMatch(/import\s*\(/);
  });

  test('la prova de puresa també veu els imports nus', () => {
    expect(importsDe("import './efecte-de-mentida.js';\nimport { CAPACITATS } from '../contracte.js';\n"))
      .toEqual(['../contracte.js', './efecte-de-mentida.js']);
  });

  test('cada cas és d’un mètode del contracte, al seu lloc, i té un títol únic', () => {
    for (const c of CASOS) {
      const lloc = c.capacitat ? CAPACITATS[c.capacitat] : CONTRACTE_NUCLI;
      expect(lloc, `${c.metode} (${c.capacitat ?? 'nucli'})`).toContain(c.metode);
    }
    expect(new Set(CASOS.map((c) => c.titol)).size).toBe(CASOS.length);
    expect(Object.isFrozen(CASOS)).toBe(true);
  });

  test('el deute del kit és a la vista i no inclou cap mètode provat', () => {
    const sense = metodesSenseCas();
    for (const c of CASOS) expect(sense).not.toContain(c.metode);
    expect(sense).toContain('loginWithPassword');
  });
});

describe('el kit veu una falla', () => {
  const ctx = () => contextDeConformitat({ config: { dataMode: 'seed' }, escriptures: true });

  test('una forma incorrecta és una falla amb el seu motiu', async () => {
    const r = await executaCas(cas('getRuntimeDataMode'), { getRuntimeDataMode: () => 'prova' }, ctx());
    expect(r).toMatchObject({ estat: 'falla', falles: ['mode desconegut: "prova"'] });
  });

  test('missatges fora d’ordre o d’un altre fil', async () => {
    const c = { ...ctx(), filId: 'f1' };
    const loadMissatges = async () => [
      { id: 'a', filId: 'f1', seq: 2, text: 'x', tipus: 'text' },
      { id: 'b', filId: 'f2', seq: 1, text: null, tipus: 'sistema' }
    ];
    const r = await executaCas(cas('loadMissatges'), { loadMissatges }, c);
    expect(r.estat).toBe('falla');
    expect(r.falles).toEqual(['el missatge b és del fil f2, no del f1', 'seq no ascendent: 2,1']);
  });

  test('una llista de missatges amb un null és una falla, no un rebuig', async () => {
    const c = { ...ctx(), filId: 'f1' };
    const loadMissatges = async () => [{ id: 'a', filId: 'f1', seq: 1, text: 'x', tipus: 'text' }, null];
    expect(await executaCas(cas('loadMissatges'), { loadMissatges }, c))
      .toMatchObject({ estat: 'falla', falles: ['un missatge sense id'] });
  });

  test('una forma que fa petar la comprovació, o un rebuig estrany, és una falla i executaCas no llança', async () => {
    const c = { ...ctx(), ownerUserId: 'u', notaId: 'n1' };
    const loadNotes = async () => ({ notes: 'no és una llista', noteResolution: { status: 'found' } });
    const r = await executaCas(cas('loadNotes', 'nota sencera'), { loadNotes }, c);
    expect(r.estat).toBe('falla');
    expect(r.falles).toEqual([expect.stringMatching(/^la forma tornada no es pot comprovar: /)]);
    const sensePrototip = async () => { throw Object.create(null); };
    expect(await executaCas(cas('getProfile'), { getProfile: sensePrototip }, ctx()))
      .toMatchObject({ estat: 'falla', falles: ['ha rebutjat: una excepció de tipus object'] });
  });

  test('l’id de missatge és un UUID nou a cada passada', () => {
    const { idMissatge } = ctx();
    expect(idMissatge).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(ctx().idMissatge).not.toBe(idMissatge);
  });

  test('una revisió vella que no rebutja és una falla; un 409 és conforme', async () => {
    const c = { ...ctx(), notaId: 'n1' };
    const vella = cas('updateNote', 'revisió vella');
    expect(await executaCas(vella, { updateNote: async () => ({ id: 'n1', revision: 2 }) }, c))
      .toMatchObject({ estat: 'falla', falles: ['ha resolt i havia de rebutjar'] });
    const conflicte = Object.assign(new Error('Conflicte'), { status: 409 });
    expect(await executaCas(vella, { updateNote: async () => { throw conflicte; } }, c))
      .toMatchObject({ estat: 'ok', falles: [] });
  });

  test('un mètode del nucli absent falla; una capacitat absent s’omet', async () => {
    expect(await executaCas(cas('loadMur'), {}, { ...ctx(), ownerUserId: 'u' }))
      .toMatchObject({ estat: 'falla', falles: ['falta loadMur del nucli'] });
    expect(await executaCas(cas('comprovaServidor'), {}, ctx()))
      .toMatchObject({ estat: 'omés', motiu: 'capacitat salut absent' });
  });

  test('sense escriptures demanades, els casos que escriuen no criden res', async () => {
    let cridat = false;
    const r = await executaCas(cas('createNote'), { createNote: async () => { cridat = true; } },
      contextDeConformitat({ config: {} }));
    expect(r).toMatchObject({ estat: 'omés', motiu: 'escriptura no demanada' });
    expect(cridat).toBe(false);
  });

  test('un cas que no és del contracte falla abans de cridar', async () => {
    const inventat = { ...cas('getProfile'), metode: 'getProfileInventat' };
    expect((await executaCas(inventat, { getProfileInventat: async () => null }, ctx())).estat).toBe('falla');
  });

  test('el temps real sense canal és vàlid i el desat passa al cas següent', async () => {
    const c = { ...ctx(), filId: 'f1' };
    const noop = { subscribeToXat: async () => ({ subscription: null, error: null }), unsubscribeFromXat: async () => {} };
    expect((await executaCas(cas('subscribeToXat'), noop, c)).estat).toBe('ok');
    expect(c.subscrit).toBe(true);
    expect((await executaCas(cas('unsubscribeFromXat'), noop, c)).estat).toBe('ok');
  });

  test('un error del canal avisat pel callback després de subscriure és una falla en tancar-lo', async () => {
    const c = { ...ctx(), filId: 'f1' };
    let avisa = null;
    const canal = {
      subscribeToXat: async (_filId, callback) => { avisa = callback; return { subscription: 'canal', error: null }; },
      unsubscribeFromXat: async () => {}
    };
    expect((await executaCas(cas('subscribeToXat'), canal, c)).estat).toBe('ok');
    avisa(null, { tipus: 'nous', filId: 'f1', seq: 3 });
    avisa(new Error('CHANNEL_ERROR'), null);
    expect(await executaCas(cas('unsubscribeFromXat'), canal, c))
      .toMatchObject({ estat: 'falla', falles: ["el canal ha avisat d'un error: CHANNEL_ERROR"] });
  });
});
