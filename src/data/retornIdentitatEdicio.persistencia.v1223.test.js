/**
 * v1.2.23 · costura Porta Persistència (ordre del Mestre 261123) ·
 * retornIdentitatEdicio.js guarda l'actor previ en la capa efímera de
 * src/config/storage.js (sessionStorage amb el prefix `sdp_embed_`) i no toca
 * directament la capa de sessió (tractor-persistencia.mjs, L2). Es comprova
 * que el retorn sobrevisca a una recàrrega de mòdul dins de la mateixa
 * pestanya i que la neteja l'esborre de veres.
 *
 * v1.2.23 · L5-04 (Gauntlet R1) · I que no sobrevisca a l'eixida de sessió ni
 * passe a una altra persona: el servei de sessió és simulat (getSessionState i
 * subscribeSession, l'únic que el mòdul en llig).
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { STORAGE_PREFIX } from '../config/storage.js';

const CLAU_REAL = `${STORAGE_PREFIX}edicio:retorn_identitat:v1`;

const sessio = vi.hoisted(() => ({ estat: { usuari: null, estat: 'comprovant' }, oients: new Set() }));
vi.mock('./sessionService.js', () => ({
  getSessionState: () => sessio.estat,
  subscribeSession: (oient) => {
    sessio.oients.add(oient);
    oient(sessio.estat);
    return () => sessio.oients.delete(oient);
  }
}));
const canviaSessio = (estat) => {
  sessio.estat = estat;
  sessio.oients.forEach((oient) => oient(estat));
};
const DINS_JAVI = Object.freeze({ estat: 'dins', usuari: Object.freeze({ id: 'u-1' }) });
const JAVI = { tipus: 'persona', id: 'u-1', nom: 'Javi Llinares' };
const ENTITAT = { tipus: 'entitat', id: 'e-1', nom: 'El Rentonar' };

async function moduleNou() {
  vi.resetModules();
  return import('./retornIdentitatEdicio.js');
}

describe('v1.2.23 · retornIdentitatEdicio a través de la capa efímera', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    sessio.oients.clear();
    sessio.estat = { usuari: null, estat: 'comprovant' };
  });
  afterEach(() => { window.sessionStorage.clear(); });

  test('el codi no accedix directament a localStorage ni a sessionStorage', () => {
    const font = readFileSync(resolve(process.cwd(), 'src/data/retornIdentitatEdicio.js'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    expect(font).not.toMatch(/\b(?:localStorage|sessionStorage)\b/);
  });

  test('el retorn es desa amb el prefix de storage.js i sobrevisca a una recàrrega', async () => {
    const primer = await moduleNou();
    expect(primer.registraCanviIdentitatEdicio({ anterior: JAVI, desti: ENTITAT, retorn: '/notes/1', notaId: 'n-1' })).toBe(true);
    expect(JSON.parse(window.sessionStorage.getItem(CLAU_REAL))).toMatchObject({ anterior: JAVI, desti: ENTITAT, retorn: '/notes/1', notaId: 'n-1' });

    const recarregat = await moduleNou();
    expect(recarregat.llegixCanviIdentitatEdicio({ retorn: '/notes/1' })).toMatchObject({ anterior: JAVI, desti: ENTITAT });
    expect(recarregat.llegixCanviIdentitatEdicio({ retorn: '/una-altra' })).toBeNull();

    recarregat.netejaCanviIdentitatEdicio();
    expect(window.sessionStorage.getItem(CLAU_REAL)).toBeNull();
    const despres = await moduleNou();
    expect(despres.llegixCanviIdentitatEdicio()).toBeNull();
  });

  test('un valor malformat a la capa de sessió no torna cap actor', async () => {
    window.sessionStorage.setItem(CLAU_REAL, '{"anterior":');
    const modul = await moduleNou();
    expect(modul.llegixCanviIdentitatEdicio()).toBeNull();
    window.sessionStorage.setItem(CLAU_REAL, JSON.stringify({ anterior: JAVI }));
    expect((await moduleNou()).llegixCanviIdentitatEdicio()).toBeNull();
  });

  test('canviar a la mateixa identitat no registra res', async () => {
    const modul = await moduleNou();
    expect(modul.registraCanviIdentitatEdicio({ anterior: JAVI, desti: { ...JAVI } })).toBe(false);
    expect(window.sessionStorage.getItem(CLAU_REAL)).toBeNull();
  });
});

describe('v1.2.23 · L5-04 (Gauntlet R1) · el retorn no sobreviu a l’eixida de sessió', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    sessio.oients.clear();
    sessio.estat = DINS_JAVI;
  });
  afterEach(() => { window.sessionStorage.clear(); });

  test('es desa amb la persona de la sessió; comprovar-la o renovar-la no l’oblida, eixir sí (memòria i capa efímera)', async () => {
    const modul = await moduleNou();
    expect(modul.registraCanviIdentitatEdicio({ anterior: JAVI, desti: ENTITAT, retorn: '/notes/1' })).toBe(true);
    expect(JSON.parse(window.sessionStorage.getItem(CLAU_REAL))).toMatchObject({ persona: 'u-1' });

    canviaSessio({ estat: 'comprovant', usuari: null });
    canviaSessio(DINS_JAVI);
    expect(modul.llegixCanviIdentitatEdicio({ retorn: '/notes/1' })).toMatchObject({ anterior: JAVI });

    canviaSessio({ estat: 'fora', usuari: null });
    expect(modul.llegixCanviIdentitatEdicio({ retorn: '/notes/1' })).toBeNull();
    expect(window.sessionStorage.getItem(CLAU_REAL)).toBeNull();
  });

  test('una altra persona que entra en la mateixa pestanya no hereta «Vols tornar a ser Javi Llinares?»', async () => {
    const modul = await moduleNou();
    modul.registraCanviIdentitatEdicio({ anterior: JAVI, desti: ENTITAT, retorn: '/notes/1' });
    canviaSessio({ estat: 'dins', usuari: { id: 'u-2' } });
    expect(modul.llegixCanviIdentitatEdicio()).toBeNull();
    expect(window.sessionStorage.getItem(CLAU_REAL)).toBeNull();
  });

  test('després d’una recàrrega: mentre es comprova la sessió es conserva; si ja és fora, s’oblida en carregar el mòdul', async () => {
    (await moduleNou()).registraCanviIdentitatEdicio({ anterior: JAVI, desti: ENTITAT, retorn: '/notes/1' });

    sessio.oients.clear();
    sessio.estat = { estat: 'comprovant', usuari: null };
    const recarregat = await moduleNou();
    canviaSessio(DINS_JAVI);
    expect(recarregat.llegixCanviIdentitatEdicio({ retorn: '/notes/1' })).toMatchObject({ anterior: JAVI });

    sessio.oients.clear();
    sessio.estat = { estat: 'fora', usuari: null };
    const fora = await moduleNou();
    expect(fora.llegixCanviIdentitatEdicio()).toBeNull();
    expect(window.sessionStorage.getItem(CLAU_REAL)).toBeNull();
  });
});
