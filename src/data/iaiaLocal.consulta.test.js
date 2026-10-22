import { afterEach, expect, test, vi } from 'vitest';
import {
  consultaTecnicaIAIA, construeixIndex, cerca, MAXIM_PREGUNTA_IAIA, respostaDeLaIAIA, SALUTACIO_TECNICA_IAIA,
  TEMPS_MAXIM_DE_LA_CONSULTA, TEMPS_MAXIM_DE_LA_WIKI
} from './iaiaLocal.js';
import { publicMetadata } from '../../tooling/wiki/lib/publication-policy.mjs';
import CA from '../config/idiomes/ca.js';

/* Revisió de la crítica · Una pregunta d'una sola paraula («Com funciona
   Sollutia?») demana la paraula al títol del document. */
const publicDoc = { id: 'model', title: 'Arquitectura amb Sollutia', content: '# Arquitectura amb Sollutia\n\nEl client passa pel port neutral. Sollutia només oferix lectura GET.\n\nEl taulell mostra les vendes del dia.' };
const carrega = async () => ({ items: [publicDoc] });
afterEach(() => vi.useRealTimers());

test('la resposta conté una afirmació de la font i un destí navegable, sense inventar una síntesi', async () => {
  const r = await consultaTecnicaIAIA('Com funciona Sollutia?', { carrega });
  expect(r.estat).toBe('resposta');
  expect(r.fonts).toEqual([{ id: 'model', titol: 'Arquitectura amb Sollutia', fragment: 'El client passa pel port neutral. Sollutia només oferix lectura GET.', ruta: '/wikidepoble?item=model' }]);
  expect(r.text).toContain(r.fonts[0].fragment);
  expect(r.text).not.toContain('vendes');
});

test('un document explícitament privat mai entra a la cerca encara que el carregador el torne', () => {
  const index = construeixIndex([{ ...publicDoc, visibility: 'private' }, { ...publicDoc, id: 'secret', attributes: { visibility: 'private' } }]);
  expect(cerca(index, 'Sollutia')).toEqual([]);
});

/* Gauntlet 261022_0225 (crítica Claude) · IAIA-6. La guarda del client és
   la mateixa frontera que la política de publicació que diu recolzar: cap
   visibilitat explícita que no siga 'public', ni arxivat ni quarantena. */
test('la guarda de visibilitat del client coincidix amb publicMetadata del compilador', () => {
  const casos = [
    {}, { visibility: 'public' }, { visibility: 'private' }, { visibility: 'interna' }, { visibility: 'restricted' },
    { visibility: 'equip' }, { visibility: '' }, { visibility: undefined }, { status: 'arxivat' }, { status: 'quarantena' },
    { status: 'canonic' }, { status: 'esborrany', visibility: 'public' }, { status: 'arxivat', visibility: 'public' }
  ];
  for (const attributes of casos) {
    const servit = cerca(construeixIndex([{ ...publicDoc, attributes }]), 'Sollutia').length > 0;
    expect([attributes, servit]).toEqual([attributes, publicMetadata(attributes)]);
  }
  for (const visibility of ['interna', 'restricted', 'equip']) {
    expect(cerca(construeixIndex([{ ...publicDoc, visibility }]), 'Sollutia')).toEqual([]);
  }
  expect(cerca(construeixIndex([{ ...publicDoc, attributes: ['public'] }]), 'Sollutia')).toEqual([]);
});

test('les plantilles i els prompts publicats no es presenten com a instruccions d’ajuda', () => {
  const index = construeixIndex(['plantilla', 'prompt', 'bundle', 'skill', 'protocol'].map((type) => ({
    ...publicDoc, id: type, attributes: { type }
  })));
  expect(cerca(index, 'Sollutia')).toEqual([]);
});

/* IAIA-2 · Documents públics que parlen a la IA («Eres L'Ens Híbrid…»,
   «tin en compte el cens del Consell…»): no són ajuda per al poble. */
test('els documents d’instruccions per a la IA no són coneixement d’ajuda', () => {
  const ids = ['personalitat_iaia', 'perfil_psiquiatric', 'agents_equip_ia', 'sgq_prompts', '03_llibre_d_or_memoria_episodica',
    '04_taula_potencia_models', '03_equip_ia'];
  const carpetes = ['folder:02_saber/obsidian_plugins', 'folder:02_saber/03_consola_termodinamica'];
  const index = construeixIndex([...ids.map((id) => ({ ...publicDoc, id })), ...carpetes.map((categoryId, i) => ({ ...publicDoc, id: `equip${i}`, categoryId })),
    { ...publicDoc, id: 'model' }]);
  expect(cerca(index, 'Sollutia').map((r) => r.id)).toEqual(['model']);
});

test('una consulta funcional no premia «funciona» i conserva el tema al final d’un paràgraf llarg', async () => {
  const r = await consultaTecnicaIAIA('Com funciona el Rebost, IAIA?', { carrega: async () => ({ items: [
    { id: 'personalitat', title: 'IAIA', content: '# IAIA\n\nLa IAIA parla amb una personalitat amable i directa.' },
    { id: 'soroll', title: 'Com funciona', content: '# Com funciona\n\nEsta funció funciona per a totes les persones del poble.' },
    { id: 'rebost', title: 'El Rebost', content: `# El Rebost\n\nRebostar és una paraula diferent. ${'Una col·laboració il·lustrada. '.repeat(350)}El Rebost guarda la llista dels productes que necessites comprar.` }
  ] }) });
  expect(r.fonts).toHaveLength(1);
  expect(r.fonts[0].fragment).toContain('El Rebost guarda');
  expect(r.fonts[0].fragment.length).toBeLessThanOrEqual(362);
});

test('una consulta ja cancel·lada no comença a carregar la Wiki', async () => {
  const control = new AbortController();
  control.abort();
  const loader = vi.fn(carrega);
  expect((await consultaTecnicaIAIA('Sollutia', { signal: control.signal, carrega: loader })).estat).toBe('cancel·lada');
  expect(loader).not.toHaveBeenCalled();
});

test('el fragment no interpreta HTML, comentaris ni blocs de codi com una resposta', async () => {
  const r = await consultaTecnicaIAIA('quota', { carrega: async () => ({ items: [{ id: 'quota', title: 'Quota', content: '# Quota\n\n<!-- quota secret -->\n\n```js\nquota executable\n```\n\nLa quota limita la mida dels fitxers que es poden pujar.' }] }) });
  expect(r.fonts[0].fragment).toBe('La quota limita la mida dels fitxers que es poden pujar.');
  expect(r.text).not.toMatch(/secret|executable/);
});

test('buit, massa llarg, salutació i cap coincidència tenen estats diferents', async () => {
  const loader = vi.fn(carrega);
  expect((await consultaTecnicaIAIA('', { carrega: loader })).estat).toBe('pregunta_invalida');
  expect((await consultaTecnicaIAIA('x'.repeat(MAXIM_PREGUNTA_IAIA + 1), { carrega: loader })).estat).toBe('pregunta_invalida');
  expect(await consultaTecnicaIAIA('Bon dia, IAIA', { carrega: loader })).toMatchObject({ estat: 'salutacio', text: SALUTACIO_TECNICA_IAIA });
  expect(loader).not.toHaveBeenCalled();
  expect((await consultaTecnicaIAIA('zzqxx', { carrega: loader })).estat).toBe('sense_resultats');
});

test('xarxa que no acaba: termini limitat i cap temporitzador viu', async () => {
  vi.useFakeTimers();
  const consulta = consultaTecnicaIAIA('Sollutia', { carrega: () => new Promise(() => {}), tempsMaxim: 3000 });
  await vi.advanceTimersByTimeAsync(3000);
  expect((await consulta).estat).toBe('no_disponible');
  expect(vi.getTimerCount()).toBe(0);
});

test('cancel·lar allibera el temporitzador i ignora una resposta tardana', async () => {
  vi.useFakeTimers();
  const control = new AbortController();
  let resol;
  const consulta = consultaTecnicaIAIA('Sollutia', { signal: control.signal, carrega: () => new Promise((r) => { resol = r; }) });
  await Promise.resolve();
  control.abort();
  expect((await consulta).estat).toBe('cancel·lada');
  expect(vi.getTimerCount()).toBe(0);
  resol({ items: [publicDoc] });
  await Promise.resolve();
});

test('rebuig de càrrega és indisponibilitat, mai una llista buida presentada com a coneixement', async () => {
  const r = await consultaTecnicaIAIA('Sollutia', { carrega: () => Promise.reject(new Error('xarxa')) });
  expect(r).toEqual({ estat: 'no_disponible', fonts: [] });
});

/* IAIA-8 · La salutació literal del Mestre (prompt 261022_0225, Tasca 4). */
test('la salutació és, lletra per lletra, la del Mestre, i el diccionari valencià la porta igual', () => {
  const literal = 'Ara no estic pa tonteries, però sí que puc contestar-te preguntes tècniques i explicar-te com funciona qualsevol racó del poble.';
  expect(SALUTACIO_TECNICA_IAIA).toBe(literal);
  expect(CA['section.xat.iaia.salutacio']).toBe(literal);
});

/* IAIA-7 · Una connexió lenta del poble: la consulta espera més que la
   resposta del fil, perquè qui pregunta veu «Consultant la Wiki…». */
test('la consulta espera la primera càrrega més que el fil de la IAIA', async () => {
  vi.useFakeTimers();
  expect(TEMPS_MAXIM_DE_LA_CONSULTA).toBeGreaterThan(TEMPS_MAXIM_DE_LA_WIKI);
  const lenta = () => new Promise((r) => { setTimeout(() => r({ items: [publicDoc] }), TEMPS_MAXIM_DE_LA_WIKI + 2000); });
  const consulta = consultaTecnicaIAIA('Sollutia', { carrega: lenta });
  const fil = respostaDeLaIAIA('Sollutia', { carrega: lenta });
  await vi.advanceTimersByTimeAsync(TEMPS_MAXIM_DE_LA_WIKI + 2000);
  expect((await consulta).estat).toBe('resposta');
  await expect(fil).resolves.toBeNull();
  expect(vi.getTimerCount()).toBe(0);
});

/* Revisió de la crítica · Escalfar només baixa: l'índex (uns 50-80 ms al
   fil principal) es construïx a la primera pregunta, no mentre s'escriu. */
test('preparaWikiDeLaIAIA comença la càrrega del paquet abans de cap pregunta, no construïx l’índex i mai no rebutja', async () => {
  vi.resetModules();
  let carregues = 0;
  let lectures = 0;
  vi.doMock('./wikiManifest.js', () => {
    carregues += 1;
    return { wikiManifest: { get items() { lectures += 1; return [publicDoc]; } } };
  });
  try {
    const modul = await import('./iaiaLocal.js');
    expect(modul.preparaWikiDeLaIAIA()).toBeUndefined();
    await vi.waitFor(() => expect(carregues).toBe(1));
    await new Promise((resol) => { setTimeout(resol, 0); });
    expect(lectures).toBe(0);
    expect((await modul.consultaTecnicaIAIA('Sollutia')).estat).toBe('resposta');
    expect(carregues).toBe(1);
    expect(lectures).toBeGreaterThan(0);
  } finally {
    vi.doUnmock('./wikiManifest.js');
    vi.resetModules();
  }
});
