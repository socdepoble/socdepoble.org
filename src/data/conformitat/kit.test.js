import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { CAPACITATS, CONTRACTE_NUCLI } from '../contracte.js';
import { CASOS, contextDeConformitat, executaCas, metodesSenseCas } from './kit.js';
import { ambXatsPerDefecte } from '../xatsPerDefecte.js';

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

  /* Ordre del Mestre (261007) · Les files d'ajuda per defecte (Conversa.perDefecte)
     tenen la forma d'una Conversa, però no són cap fil: el kit no les llig
     ni hi escriu, i els casos que en dependrien s'ometen sense fallar. */
  test('amb només files per defecte, loadFils és conforme i no deixa cap fil per als casos següents', async () => {
    const c = ctx();
    const sintetiques = ambXatsPerDefecte([]);
    /* Gauntlet 261016 (Bloc 3.6) · Tres: Sóc de Poble, Javi Llinares i la IAIA.
       Gauntlet 261016_1530 (Bloc 3.6.1) · Dues: fora la directa sintètica de Sóc de Poble. */
    expect(sintetiques).toHaveLength(2);
    expect(await executaCas(cas('loadFils'), { loadFils: async () => sintetiques }, c)).toMatchObject({ estat: 'ok', falles: [] });
    expect([c.filId, c.filEscrivible]).toEqual([null, null]);
    let cridat = false;
    const adaptador = {
      loadMissatges: async () => { cridat = true; return []; },
      subscribeToXat: async () => { cridat = true; return { subscription: null, error: null }; },
      unsubscribeFromXat: async () => { cridat = true; },
      enviaMissatge: async () => { cridat = true; },
      marcaLlegit: async () => { cridat = true; }
    };
    for (const [metode, titol] of [['loadMissatges'], ['subscribeToXat'], ['unsubscribeFromXat'], ['enviaMissatge', 'el mateix id no duplica'], ['marcaLlegit']]) {
      expect((await executaCas(cas(metode, titol), adaptador, c)).estat, metode).toBe('omés');
    }
    expect(cridat).toBe(false);
  });

  test('amb una conversa real i les files per defecte, el fil del kit és el real', async () => {
    const c = ctx();
    const real = { id: 'f-real', tipus: 'grup', ultimSeq: 1, llegitFinsSeq: 1, rebutFinsSeq: 1, noLlegits: 0, altres: [] };
    const fils = [...ambXatsPerDefecte([]), real];
    expect((await executaCas(cas('loadFils'), { loadFils: async () => fils }, c)).estat).toBe('ok');
    expect([c.filId, c.filEscrivible]).toEqual(['f-real', 'f-real']);
  });

  /* ── Decisió 4 del Mestre (261007) · «Carregar-ne més» (capacitat
     'paginacioSeccions', ADR-2026-11-PAGINACIO-SECCIONS) ── */
  const murBuit = { feedPosts: [], events: [], marketItems: [] };
  test('Decisió 4 · loadMur sense paginacio, o amb un cursor per secció pendent, és conforme', async () => {
    const c = { ...ctx(), ownerUserId: 'u' };
    for (const valor of [murBuit, { ...murBuit, paginacio: { mur: 'c1', mercat: 'c2' } }, { ...murBuit, paginacio: {} }]) {
      expect(await executaCas(cas('loadMur'), { loadMur: async () => valor }, c), JSON.stringify(valor))
        .toMatchObject({ estat: 'ok', falles: [] });
    }
  });

  test('Decisió 4 · una paginacio mal formada a loadMur és una falla amb el seu motiu', async () => {
    const c = { ...ctx(), ownerUserId: 'u' };
    const amb = (paginacio) => executaCas(cas('loadMur'), { loadMur: async () => ({ ...murBuit, paginacio }) }, c);
    expect(await amb(['c1'])).toMatchObject({ estat: 'falla', falles: ['paginacio havia de ser un objecte i és array'] });
    expect(await amb({ notes: 'c1' })).toMatchObject({ estat: 'falla', falles: ['paginacio porta una secció que no es pagina: notes'] });
    expect(await amb({ mur: '' })).toMatchObject({ estat: 'falla', falles: ['el cursor de mur havia de ser text no buit i és string'] });
    expect(await amb({ events: null })).toMatchObject({ estat: 'falla', falles: ['el cursor de events havia de ser text no buit i és null'] });
  });

  test('Decisió 4 · loadSeccioPage conforme: la crida és la del contracte i complete va amb nextCursor', async () => {
    const crides = [];
    const loadSeccioPage = async (...args) => { crides.push(args); return { elements: [{ id: 'p51' }], complete: false, nextCursor: 'c2' }; };
    expect(await executaCas(cas('loadSeccioPage', "seccio: 'mur'"), { loadSeccioPage }, ctx())).toMatchObject({ estat: 'ok', falles: [] });
    expect(crides).toEqual([[{ seccio: 'mur', cursor: null, limit: 50 }, { dataMode: 'seed' }]]);
    const darrera = async () => ({ elements: [], complete: true, nextCursor: null });
    expect(await executaCas(cas('loadSeccioPage', "seccio: 'mur'"), { loadSeccioPage: darrera }, ctx())).toMatchObject({ estat: 'ok' });
  });

  test('Decisió 4 · una pàgina de secció mal formada és una falla', async () => {
    const amb = (pagina) => executaCas(cas('loadSeccioPage', "seccio: 'mur'"), { loadSeccioPage: async () => pagina }, ctx());
    expect(await amb({ elements: [{ id: 'p1' }], complete: true, nextCursor: 'c2' }))
      .toMatchObject({ estat: 'falla', falles: ['complete i nextCursor null han d’anar junts'] });
    expect(await amb({ elements: [{ titol: 'sense id' }], complete: true, nextCursor: null }))
      .toMatchObject({ estat: 'falla', falles: ['elements té elements sense id'] });
    expect(await amb({ elements: [], complete: false, nextCursor: '' }))
      .toMatchObject({ estat: 'falla', falles: ['nextCursor havia de ser null o text no buit'] });
    expect((await amb({ notes: [], complete: true, nextCursor: null })).estat).toBe('falla');
  });

  test('Decisió 4 · una secció que no es pagina ha de rebutjar; resoldre-la és una falla', async () => {
    const rebutja = cas('loadSeccioPage', 'no es pagina');
    expect(await executaCas(rebutja, { loadSeccioPage: async () => { throw new Error('Esta secció no es pagina.'); } }, ctx()))
      .toMatchObject({ estat: 'ok', falles: [] });
    expect(await executaCas(rebutja, { loadSeccioPage: async () => ({ elements: [], complete: true, nextCursor: null }) }, ctx()))
      .toMatchObject({ estat: 'falla', falles: ['ha resolt i havia de rebutjar'] });
  });

  test('Decisió 4 · sense la capacitat, els casos de paginació s’ometen i l’adaptador continua sent vàlid', async () => {
    for (const c of CASOS.filter((cs) => cs.capacitat === 'paginacioSeccions')) {
      expect(await executaCas(c, {}, ctx())).toMatchObject({ estat: 'omés', motiu: 'capacitat paginacioSeccions absent' });
    }
    expect(CASOS.filter((cs) => cs.capacitat === 'paginacioSeccions')).toHaveLength(2);
    expect(CAPACITATS.paginacioSeccions).toEqual(['loadSeccioPage']);
    expect(CONTRACTE_NUCLI).not.toContain('loadSeccioPage');
  });

  /* ── Ordre del Mestre (261008, grup C) · Els membres d'una organització
     (capacitat 'membresOrganitzacio') ── */
  test('grup C · llistaMembresOrganitzacio d’una organització que no existix: rebutjar amb code és conforme', async () => {
    const membres = cas('llistaMembresOrganitzacio');
    expect(membres).toMatchObject({ capacitat: 'membresOrganitzacio', espera: 'rebutja', escriu: false });
    const crides = [];
    const amb = (codi) => async (...args) => { crides.push(args); throw Object.assign(new Error('No l’administres.'), { code: codi }); };
    expect(await executaCas(membres, { llistaMembresOrganitzacio: amb('SDP-ORGMEM-002') }, ctx())).toMatchObject({ estat: 'ok', falles: [] });
    expect(crides).toEqual([['conformitat-sense-organitzacio', { dataMode: 'seed' }]]);
  });

  test('grup C · resoldre-la, o rebutjar sense code, és una falla; sense la capacitat s’omet', async () => {
    const membres = cas('llistaMembresOrganitzacio');
    expect(await executaCas(membres, { llistaMembresOrganitzacio: async () => [] }, ctx()))
      .toMatchObject({ estat: 'falla', falles: ['ha resolt i havia de rebutjar'] });
    const senseCodi = await executaCas(membres, { llistaMembresOrganitzacio: async () => { throw new Error('Sense codi'); } }, ctx());
    expect(senseCodi.estat).toBe('falla');
    expect(senseCodi.falles[0]).toMatch(/^havia de rebutjar amb un Error amb code/);
    expect(await executaCas(membres, {}, ctx())).toMatchObject({ estat: 'omés', motiu: 'capacitat membresOrganitzacio absent' });
    expect(CAPACITATS.membresOrganitzacio).toEqual(['llistaMembresOrganitzacio', 'desaMembreOrganitzacio', 'llevaMembreOrganitzacio']);
  });

  /* ── Onada 11 (261010; prompt 261010_1730, tasca 2) · El segon factor del
     superadmin ('segonFactor') i la personalització del poble ('personalitzacio') ── */
  test('Onada 11 · llistaFactors conforme amb una llista de factors ben formada; un factor sense tipus o estat és una falla', async () => {
    const llista = cas('llistaFactors');
    expect(llista).toMatchObject({ capacitat: 'segonFactor', espera: 'resol', escriu: false });
    const bons = [{ id: 'f1', nom: 'Mòbil', tipus: 'totp', estat: 'verificat' }, { id: 'f2', nom: '', tipus: 'totp', estat: 'pendent' }];
    expect(await executaCas(llista, { llistaFactors: async () => bons }, ctx())).toMatchObject({ estat: 'ok', falles: [] });
    expect(await executaCas(llista, { llistaFactors: async () => [] }, ctx())).toMatchObject({ estat: 'ok', falles: [] });
    expect(await executaCas(llista, { llistaFactors: async () => [{ id: 'f1', nom: 'Mòbil', tipus: 'sms', estat: 'actiu' }] }, ctx()))
      .toMatchObject({ estat: 'falla', falles: ['el factor f1 no és totp', 'el factor f1 té estat "actiu"'] });
    expect((await executaCas(llista, { llistaFactors: async () => null }, ctx())).estat).toBe('falla');
  });

  test('Onada 11 · inscriure, reptar, verificar o retirar han de rebutjar amb code; resoldre o rebutjar sense code és una falla', async () => {
    const crides = [];
    const rebutja = async (...args) => { crides.push(args); throw Object.assign(new Error('No disponible.'), { code: 'no-disponible' }); };
    for (const metode of ['inscriuFactor', 'reptaFactor', 'verificaFactor', 'retiraFactor']) {
      const c = cas(metode);
      expect(c, metode).toMatchObject({ capacitat: 'segonFactor', espera: 'rebutja', escriu: false });
      expect(await executaCas(c, { [metode]: rebutja }, ctx()), metode).toMatchObject({ estat: 'ok', falles: [] });
      expect(await executaCas(c, { [metode]: async () => ({ id: 'f1' }) }, ctx()), metode).toMatchObject({ estat: 'falla', falles: ['ha resolt i havia de rebutjar'] });
      const senseCodi = await executaCas(c, { [metode]: async () => { throw new Error('Sense codi'); } }, ctx());
      expect(senseCodi.falles[0], metode).toMatch(/^havia de rebutjar amb un Error amb code/);
      expect(await executaCas(c, {}, ctx()), metode).toMatchObject({ estat: 'omés', motiu: 'capacitat segonFactor absent' });
    }
    expect(crides).toEqual([
      ['Conformitat', { dataMode: 'seed' }],
      ['conformitat-sense-factor', { dataMode: 'seed' }],
      [{ factorId: 'conformitat-sense-factor', repteId: 'conformitat-sense-repte', codi: '000000' }, { dataMode: 'seed' }],
      ['conformitat-sense-factor', { dataMode: 'seed' }]
    ]);
    expect(CAPACITATS.segonFactor).toEqual(['llistaFactors', 'inscriuFactor', 'reptaFactor', 'verificaFactor', 'retiraFactor']);
  });

  test('Onada 11 · desar o llegir l’historial sense el segon factor és conforme amb cal-segon-factor o sense-sessio; un altre code és una falla', async () => {
    for (const [metode, args] of [['adminDesaPersonalitzacio', [{ clau: 'taxonomia', payload: { categories: [] }, versio: null }, { dataMode: 'seed' }]],
      ['adminHistorialPersonalitzacio', ['taxonomia', { dataMode: 'seed' }]]]) {
      const c = cas(metode);
      expect(c, metode).toMatchObject({ capacitat: 'personalitzacio', espera: 'rebutja', escriu: false });
      const crides = [];
      const amb = (code) => async (...rebuts) => { crides.push(rebuts); throw Object.assign(new Error('Cal confirmar el segon factor per a desar.'), { code }); };
      expect(await executaCas(c, { [metode]: amb('cal-segon-factor') }, ctx()), metode).toMatchObject({ estat: 'ok', falles: [] });
      expect(await executaCas(c, { [metode]: amb('sense-sessio') }, ctx()), metode).toMatchObject({ estat: 'ok', falles: [] });
      expect(crides).toEqual([args, args]);
      expect(await executaCas(c, { [metode]: amb('desconegut') }, ctx()), metode)
        .toMatchObject({ estat: 'falla', falles: ['el code havia de ser cal-segon-factor o sense-sessio i és "desconegut"'] });
      expect(await executaCas(c, { [metode]: async () => ({ clau: 'taxonomia', payload: {}, versio: 1 }) }, ctx()), metode)
        .toMatchObject({ estat: 'falla', falles: ['ha resolt i havia de rebutjar'] });
      expect(await executaCas(c, {}, ctx()), metode).toMatchObject({ estat: 'omés', motiu: 'capacitat personalitzacio absent' });
    }
    expect(CAPACITATS.personalitzacio).toEqual(['adminDesaPersonalitzacio', 'adminHistorialPersonalitzacio']);
  });

  test('Onada 11 · loadCoreContent conforme sense personalitzacio o amb null i { payload, versio } per clau; una forma trencada és una falla', async () => {
    const c = { ...ctx(), ownerUserId: 'u' };
    const base = { towns: [], agents: [], pages: [], pageCopy: {} };
    for (const personalitzacio of [undefined, { taxonomia: null, estil: null }, { taxonomia: { payload: { categories: [] }, versio: 2 }, estil: null }]) {
      expect(await executaCas(cas('loadCoreContent'), { loadCoreContent: async () => ({ ...base, personalitzacio }) }, c), JSON.stringify(personalitzacio))
        .toMatchObject({ estat: 'ok', falles: [] });
    }
    const amb = (personalitzacio) => executaCas(cas('loadCoreContent'), { loadCoreContent: async () => ({ ...base, personalitzacio }) }, c);
    expect(await amb([])).toMatchObject({ estat: 'falla', falles: ['personalitzacio havia de ser un objecte i és array'] });
    expect(await amb({ taxonomia: 'x', estil: null })).toMatchObject({ estat: 'falla', falles: ['personalitzacio.taxonomia havia de ser null o { payload, versio } i és string'] });
    expect(await amb({ taxonomia: null, estil: { payload: [], versio: 'v1' } })).toMatchObject({ estat: 'falla',
      falles: ['personalitzacio.estil.payload havia de ser un objecte', 'personalitzacio.estil.versio havia de ser un enter'] });
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

/* ── T6b (IDEA-14; decisió del Mestre, 261024) · Els seguiments (capacitat
   'seguiments'): cap cas no escriu, i el kit veu una forma mal feta. ── */
describe('T6b · els casos de seguiments', () => {
  const ctx = () => contextDeConformitat({ config: { dataMode: 'seed' } });

  test('cobrixen els cinc mètodes de la capacitat, sense escriure', () => {
    const casos = CASOS.filter((c) => c.capacitat === 'seguiments');
    expect([...new Set(casos.map((c) => c.metode))].sort()).toEqual([...CAPACITATS.seguiments].sort());
    expect(casos.every((c) => c.escriu === false)).toBe(true);
    for (const metode of CAPACITATS.seguiments) expect(metodesSenseCas()).not.toContain(metode);
  });

  test('estatSeguiment conforme amb { seguint: false, creatAl: null }; un seguiment inventat o una forma trencada és una falla', async () => {
    const estat = cas('estatSeguiment');
    const crides = [];
    expect(await executaCas(estat, { estatSeguiment: async (...args) => { crides.push(args); return { seguint: false, creatAl: null }; } }, ctx()))
      .toMatchObject({ estat: 'ok', falles: [] });
    expect(crides).toEqual([[{ tipus: 'persona', id: '00000000-0000-4000-8000-00000000c0f0' }, { dataMode: 'seed' }]]);
    expect(await executaCas(estat, { estatSeguiment: async () => ({ seguint: true, creatAl: '2026-10-24T12:00:00Z' }) }, ctx()))
      .toMatchObject({ estat: 'falla', falles: ['seguint havia de ser false i és true', 'creatAl havia de ser null i és "2026-10-24T12:00:00Z"'] });
    expect((await executaCas(estat, { estatSeguiment: async () => null }, ctx())).estat).toBe('falla');
  });

  test('les llistes: conformes buides o ben formades; un tipus, un id o un nom estranys són una falla', async () => {
    const bona = [{ tipus: 'entitat', id: 'e1', nom: 'Forn', creatAl: '2026-10-24T12:00:00Z' }, { tipus: 'persona', id: 'p1', nom: null, creatAl: null }];
    expect(await executaCas(cas('elsMeusSeguiments'), { elsMeusSeguiments: async () => bona }, ctx())).toMatchObject({ estat: 'ok' });
    expect(await executaCas(cas('elsMeusSeguiments'), { elsMeusSeguiments: async () => [{ tipus: 'ia', id: 'x', nom: 'IAIA', creatAl: null }] }, ctx()))
      .toMatchObject({ estat: 'falla', falles: ['un seguiment té tipus "ia"'] });
    const qui = cas('quiEmSegueix', 'quiEmSegueix({}, config)');
    expect(await executaCas(qui, { quiEmSegueix: async () => [] }, ctx())).toMatchObject({ estat: 'ok' });
    expect(await executaCas(qui, { quiEmSegueix: async () => [{ id: '', nom: 7, creatAl: 3 }] }, ctx()))
      .toMatchObject({ estat: 'falla', falles: ['un seguidor sense id de text', 'el seguidor  té un nom que no és text ni null', 'el seguidor  té un creatAl que no és text ni null'] });
  });

  test('els rebuigs: segueix i deixaDeSeguir amb SDP-SEG-001; una entitat que no existix, amb un code', async () => {
    const amb = (code) => async () => { throw Object.assign(new Error('No.'), { code }); };
    expect(await executaCas(cas('segueix'), { segueix: amb('SDP-SEG-001') }, ctx())).toMatchObject({ estat: 'ok' });
    expect(await executaCas(cas('segueix'), { segueix: amb('SDP-SEG-002') }, ctx()))
      .toMatchObject({ estat: 'falla', falles: ['el code havia de ser SDP-SEG-001 i és "SDP-SEG-002"'] });
    expect(await executaCas(cas('deixaDeSeguir'), { deixaDeSeguir: async () => ({ seguint: false }) }, ctx()))
      .toMatchObject({ estat: 'falla', falles: ['ha resolt i havia de rebutjar'] });
    const entitat = cas('quiEmSegueix', 'no existix');
    expect(await executaCas(entitat, { quiEmSegueix: amb('SDP-SEG-005') }, ctx())).toMatchObject({ estat: 'ok' });
    expect(await executaCas(entitat, { quiEmSegueix: async () => [] }, ctx())).toMatchObject({ estat: 'falla' });
    expect(await executaCas(cas('segueix'), {}, ctx())).toMatchObject({ estat: 'omés', motiu: 'capacitat seguiments absent' });
  });
});
