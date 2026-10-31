/* Pla 261016_1530, Onada 0.5 · Les dues vies d'entrada de la matriu: (a)
   govern.json del servidor de desenvolupament (un 404 o l'HTML d'un servidor
   sense el connector és absència, mai un error ni una matriu inventada; un
   error del connector es pinta amb el seu text), i (b) un fitxer que el
   Mestre obri, llegit en este navegador. I les quatre pàgines del grup.
   Gauntlet f4b (govern) · Derogat: «que hui no existix» (B2 la servix). */
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  FONT_GOVERN, MIDA_MAXIMA_FITXER, carregaGovern, llegixFitxerDeGovern, normalitzaGovern, normalitzaTrasllat, tipusDeFitxer
} from './governContent.js';
import {
  ETIQUETA_NAV_GOVERN, IDS_GOVERN, RUTA_GOVERN_UI, TITOL_GOVERN, paginaGovern, paginesGovern, rutaGovern, segmentGovern
} from './governConsola.js';
import { IDS_PAGINES, segmentPagina } from '../consolaPagines.js';
import { segmentPols } from '../polsConsola.js';

const MCR = { at: '2026-10-16T15:02:56.740108+00:00', baseline_head: '7a1828ca', requirements: [{ id: 'F04', status: '[FET I SEGELLAT]' }] };
const resposta = (status, cos, tipus = 'application/json; charset=utf-8') => ({
  status, ok: status >= 200 && status < 300, statusText: String(status),
  headers: { get: (nom) => (nom.toLowerCase() === 'content-type' ? tipus : null) },
  json: async () => cos
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('normalitzaTrasllat i tipusDeFitxer', () => {
  test('els ids del trasllat de Codex, sense repetits ni buits (que es diuen)', () => {
    expect(normalitzaTrasllat({ at: '2026-10-16T15:02:56.740108+00:00', source: 'mcr.json', ids: ['F01', 'F01', ' ', 7, 'I09'] })).toEqual({
      at: '2026-10-16T15:02:56.740Z', font: 'mcr.json', ids: ['F01', 'I09'], duplicats: ['F01'], descartats: 2, declaraIgual: null
    });
    // comprovacio-trasllat.json declara el seu resultat: es diu, no es creu.
    expect(normalitzaTrasllat({ ids: [], equal: true }).declaraIgual).toBe(true);
    expect(() => normalitzaTrasllat({ requirements: [] })).toThrow(/li falta la llista «ids»/);
  });
  test('un fitxer és un trasllat si porta ids, una matriu si porta requirements', () => {
    expect(tipusDeFitxer({ ids: [], requirements: [] })).toBe('trasllat');
    expect(tipusDeFitxer(MCR)).toBe('matriu');
    expect(tipusDeFitxer({ altres: 1 })).toBeNull();
    expect(tipusDeFitxer([])).toBeNull();
  });
});

describe('normalitzaGovern: la forma que el middleware ha de servir', () => {
  /* Revisió adversarial del carril F1 (correcció del camp «pla») · El pla de
     la matriu és el que diu la matriu (o «mcr@» i la seua data), el mateix que
     si el Mestre l'obri d'un fitxer: un `pla` de la resposta no el canvia, i cap
     decisió apuntada en una via deixa de casar en l'altra. Derogat: el `pla` de
     govern.json com a pla de la matriu. */
  test('matriu, trasllat i commit d’ara; el pla és el de la matriu, el mateix que oberta d’un fitxer', async () => {
    const g = normalitzaGovern({ schema: 'sdp.govern.v1', generat: '2026-10-16T15:10:00Z', head: '7A1828CA779E', pla: 'pla_261016_1530', mcr: MCR, trasllat: { ids: ['F01'] }, font: 'x' });
    expect(g.head).toBe('7a1828ca779e');
    expect(g.matriu.files.map((f) => f.id)).toEqual(['F04']);
    expect(g.matriu.pla).toBe('mcr@2026-10-16T15:02:56.740Z');
    expect(g.trasllat.ids).toEqual(['F01']);
    expect(g.font).toBe('x');
    const deFitxer = await llegixFitxerDeGovern(new File([JSON.stringify(MCR)], 'mcr.json', { type: 'application/json' }));
    expect(deFitxer.valor.pla).toBe(g.matriu.pla);
    // Una matriu que diu de quin pla és porta el seu, també pel servidor.
    expect(normalitzaGovern({ pla: 'un-altre', mcr: { ...MCR, pla: '261016_1530' } }).matriu.pla).toBe('261016_1530');
  });
  test('sense matriu (o mentre s’escriu, el servidor torna null): null, mai una d’inventada', () => {
    expect(normalitzaGovern({ mcr: null, trasllat: null, head: 'no' })).toMatchObject({ matriu: null, trasllat: null, head: null });
  });
  test('una matriu mal formada és un error; un trasllat mal format, cap trasllat', () => {
    expect(() => normalitzaGovern({ mcr: { at: 'x' } })).toThrow(/no és una matriu/);
    expect(normalitzaGovern({ mcr: MCR, trasllat: { ids: 'no' } }).trasllat).toBeNull();
  });
});

describe('carregaGovern', () => {
  test('fora de DEV no demana res', async () => {
    vi.stubEnv('DEV', false);
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    expect(await carregaGovern()).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
  test('sense el connector: un 404 o l’HTML de l’aplicació és absència', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => resposta(404, null)));
    expect(await carregaGovern()).toBeNull();
    vi.stubGlobal('fetch', vi.fn(async () => resposta(200, null, 'text/html')));
    expect(await carregaGovern()).toBeNull();
  });
  test('amb la ruta, llig govern.json sense memòria cau i el normalitza', async () => {
    const fetch = vi.fn(async () => resposta(200, { mcr: MCR, head: '7a1828ca' }));
    vi.stubGlobal('fetch', fetch);
    const g = await carregaGovern('senyal');
    expect(fetch).toHaveBeenCalledWith(FONT_GOVERN, { signal: 'senyal', cache: 'no-store' });
    expect(FONT_GOVERN).toBe('/__iaia/govern.json');
    expect(g.matriu.files).toHaveLength(1);
  });
  /* Gauntlet f4b (govern, «error-json-ignorat») · Expectativa actualitzada a
     propòsit: l'error és el text fix que el connector envia en JSON (el que
     diu què cal arreglar al Llibre), amb el seu codi; si no n'envia cap, un
     text fix en valencià amb el codi HTTP. Abans: «Govern 500 <text HTTP>». */
  test('un error del servidor és un error, no un buit, i diu el text del compilador', async () => {
    const TEXT = 'La taula de la «Matriu P1» del Llibre Mestre no té les columnes «ID» i «Estat».';
    vi.stubGlobal('fetch', vi.fn(async () => resposta(500, { schema: 'sdp.govern.v1', codi: 'taula-mal-formada', error: TEXT })));
    const error = await carregaGovern().catch((e) => e);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe(TEXT);
    expect(error.codi).toBe('taula-mal-formada');
    expect(error.status).toBe(500);
    // Sense el JSON del connector (un altre esquema, un text massa llarg, HTML o JSON trencat): el text fix.
    const FIX = 'El servidor de desenvolupament no ha pogut servir la matriu (codi 500).';
    for (const r of [
      resposta(500, { error: 'x' }), resposta(500, { schema: 'sdp.govern.v1', error: 'x'.repeat(401) }),
      resposta(500, null, 'text/html'), { ...resposta(500, null), json: async () => { throw new SyntaxError('JSON'); } }
    ]) {
      vi.stubGlobal('fetch', vi.fn(async () => r));
      const e = await carregaGovern().catch((x) => x);
      expect(e.message).toBe(FIX);
      expect(e.codi).toBeNull();
    }
    vi.stubGlobal('fetch', vi.fn(async () => resposta(403, null, 'text/plain')));
    await expect(carregaGovern()).rejects.toThrow('El servidor de desenvolupament no ha pogut servir la matriu (codi 403).');
  });
});

describe('llegixFitxerDeGovern: el fitxer es llig en este navegador', () => {
  const fitxer = (contingut, nom = 'mcr.json') => new File([contingut], nom, { type: 'application/json' });
  test('una matriu i un trasllat, ja normalitzats', async () => {
    const m = await llegixFitxerDeGovern(fitxer(JSON.stringify(MCR)));
    expect(m).toMatchObject({ tipus: 'matriu', nom: 'mcr.json' });
    expect(m.valor.at).toBe('2026-10-16T15:02:56.740Z');
    const t = await llegixFitxerDeGovern(fitxer(JSON.stringify({ ids: ['F01'] }), 'trasllat.json'));
    expect(t).toMatchObject({ tipus: 'trasllat', nom: 'trasllat.json', valor: { ids: ['F01'] } });
  });
  test('el que no és JSON, ni matriu ni trasllat, o és massa gran, es diu amb paraules planes', async () => {
    await expect(llegixFitxerDeGovern(fitxer('no és json'))).rejects.toThrow(/Este fitxer no és JSON/);
    await expect(llegixFitxerDeGovern(fitxer('{"a":1}'))).rejects.toThrow(/ni una matriu \(mcr\.json\) ni un trasllat/);
    await expect(llegixFitxerDeGovern({ size: MIDA_MAXIMA_FITXER + 1, name: 'gran.json' })).rejects.toThrow(/massa gran/);
    await expect(llegixFitxerDeGovern(null)).rejects.toThrow(/cap fitxer/);
  });
});

describe('les quatre pàgines del govern, a part de les nou de la maquinària', () => {
  test('els ids, les rutes i el copy provisional («Per a…» al subtítol)', () => {
    expect(IDS_GOVERN).toEqual(['requeriments', 'balanc', 'certificacio', 'comunicacio']);
    expect(RUTA_GOVERN_UI).toBe('/consola/govern');
    expect(paginesGovern().map((p) => p.ruta)).toEqual(IDS_GOVERN.map(rutaGovern));
    for (const p of paginesGovern()) {
      expect(p.subtitle, p.id).toMatch(/^Per a /);
      expect(p.subtitle, p.id).not.toMatch(/\.$/);
      expect(p.lead.length, p.id).toBeGreaterThan(60);
    }
    expect(paginaGovern('pols')).toBeNull();
    expect(TITOL_GOVERN).toBe('Govern del Mestre');
    expect(ETIQUETA_NAV_GOVERN).not.toBe(TITOL_GOVERN);
  });
  test('cap pàgina del govern entra a les nou de la maquinària (Índex i Diagnòstic idèntics)', () => {
    expect(IDS_PAGINES).toHaveLength(9);
    for (const id of IDS_GOVERN) expect(IDS_PAGINES).not.toContain(id);
  });
  test.each([
    ['govern/balanc', 'balanc'], ['/govern/requeriments/', 'requeriments'], ['govern/no-hi-es', 'no-hi-es'],
    ['govern', null], ['', null], ['pols/rebuts', null], ['govern/a/b', null]
  ])('segmentGovern(%j) → %j', (comodi, id) => {
    expect(segmentGovern(comodi)).toBe(id);
  });
  test('les rutes del govern no xoquen amb les de la maquinària ni amb les del pols', () => {
    expect(segmentPagina('govern/balanc')).toBeNull();
    expect(segmentPols('govern/balanc')).toBeNull();
  });
});
