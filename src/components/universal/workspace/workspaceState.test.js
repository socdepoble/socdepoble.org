import { describe, expect, it } from 'vitest';
import {
  ALL_CATEGORY_ID, ORDENACIONS, createWorkspaceState, ordenaElements, primerElementTriable, workspaceReducer
} from './workspaceState.js';

describe('workspaceReducer', () => {
  it('conserva la identitat de l’estat quan selection/sync no canvia res', () => {
    const state = createWorkspaceState({ categoryId: 'formularis', itemId: 'camp' });

    const next = workspaceReducer(state, {
      type: 'selection/sync',
      categoryId: 'formularis',
      itemId: 'camp'
    });

    expect(next).toBe(state);
  });

  it('crea un estat nou quan selection/sync canvia la selecció', () => {
    const state = createWorkspaceState({ categoryId: 'formularis', itemId: 'camp' });

    const next = workspaceReducer(state, {
      type: 'selection/sync',
      categoryId: 'navegacio',
      itemId: 'molla'
    });

    expect(next).not.toBe(state);
    expect(next.activeCategoryId).toBe('navegacio');
    expect(next.activeItemId).toBe('molla');
  });
});


it('category/select només espera una autotria quan l’acció ho declara explícitament',()=>{
 const state=createWorkspaceState({categoryId:'a',itemId:'nota'});
 const normal=workspaceReducer(state,{type:'category/select',categoryId:'b',itemId:null});
 const ajornat=workspaceReducer(state,{type:'category/select',categoryId:'b',itemId:null,needsInitialSelection:true});
 expect(normal.needsInitialSelection).toBe(false);
 expect(ajornat.needsInitialSelection).toBe(true);
 expect(ajornat.activeCategoryId).toBe('b');expect(ajornat.activeItemId).toBeNull();
});

/* T11-03 (marató 261101_2143) · El primer element de la tria automàtica: a
   «Tot», el primer amb `fixatATot: true` (el booleà); si no, el primer. */
describe('primerElementTriable', () => {
  const A = Object.freeze({ id: 'a' });
  const FIXAT = Object.freeze({ id: 'fixat', fixatATot: true });
  const ALTRE_FIXAT = Object.freeze({ id: 'altre', fixatATot: true });

  it('sense elements (llista buida, null o una no-llista), null', () => {
    expect(primerElementTriable([], ALL_CATEGORY_ID)).toBeNull();
    expect(primerElementTriable(null, ALL_CATEGORY_ID)).toBeNull();
    expect(primerElementTriable(undefined, 'carpeta')).toBeNull();
    expect(primerElementTriable({ 0: FIXAT, length: 1 }, ALL_CATEGORY_ID)).toBeNull();
  });

  it('a «Tot», el fixat encara que no siga el primer de l’entrada', () => {
    expect(primerElementTriable([A, FIXAT], ALL_CATEGORY_ID)).toBe(FIXAT);
  });

  it('a «Tot» sense cap fixat, el primer de l’entrada', () => {
    expect(primerElementTriable([A, { id: 'b' }], ALL_CATEGORY_ID)).toBe(A);
  });

  /* ARB-T11C-01 · Sense el tercer argument (l'ordre de la llista), amb dos
     fixats mana l'entrada: és la compatibilitat de T11-03. Amb l'ordre
     (P1-73, el describe de més avall) guanya el primer per data o per nom. */
  it('sense l’ordre de la llista, amb dos fixats, el primer de l’entrada', () => {
    expect(primerElementTriable([A, ALTRE_FIXAT, FIXAT], ALL_CATEGORY_ID)).toBe(ALTRE_FIXAT);
  });

  it('fora de «Tot», el fixat no passa davant', () => {
    expect(primerElementTriable([A, FIXAT], 'carpeta')).toBe(A);
  });

  it('només el booleà fixa: una cadena \'true\' o un 1, no', () => {
    expect(primerElementTriable([A, { id: 'cadena', fixatATot: 'true' }, { id: 'u', fixatATot: 1 }], ALL_CATEGORY_ID)).toBe(A);
  });

  it('un forat a la llista no peta en buscar el fixat', () => {
    expect(primerElementTriable([null, FIXAT], ALL_CATEGORY_ID)).toBe(FIXAT);
  });
});

/* P1-73 / O2-T5 · Mateix ordre de la llista en qualsevol carpeta. Les
   reserves pròpies es filtren en canAutoSelect abans d'entrar ací. */
describe('P1-73 · primerElementTriable amb l’ordre de la llista', () => {
  const VELL = Object.freeze({ id: 'vell', title: 'Zona del pou vell', updatedAt: '2026-01-01T09:00:00Z', fixatATot: true });
  const AVIS = Object.freeze({ id: 'avis', title: 'Avís fixat', updatedAt: '2025-12-01T09:00:00Z', fixatATot: true });
  const NOVA = Object.freeze({ id: 'nova', title: 'Bancal del pou', updatedAt: '2026-10-31T09:00:00Z' });
  const PREPARADA = Object.freeze({ id: 'preparada', title: 'Nota sense títol', updatedAt: '2026-11-02T17:00:00Z' });
  const ENTRADA = Object.freeze([AVIS, NOVA, VELL]);
  const ids = (llista) => llista.map((element) => element.id);

  it('a «Tot» amb dos fixats i sortBy name, el de títol alfabèticament primer', () => {
    expect(primerElementTriable([NOVA, VELL, AVIS], ALL_CATEGORY_ID, { sortable: true, sortBy: 'name' })).toBe(AVIS);
  });

  it('a «Tot» amb dos fixats i sortBy date, el d’updatedAt més nou', () => {
    expect(primerElementTriable(ENTRADA, ALL_CATEGORY_ID, { sortable: true, sortBy: 'date' })).toBe(VELL);
  });

  it('sense sortable, el primer fixat de l’entrada (compatibilitat), diga el que diga sortBy', () => {
    expect(primerElementTriable(ENTRADA, ALL_CATEGORY_ID)).toBe(AVIS);
    expect(primerElementTriable(ENTRADA, ALL_CATEGORY_ID, { sortBy: 'date' })).toBe(AVIS);
    expect(primerElementTriable(ENTRADA, ALL_CATEGORY_ID, { sortable: false, sortBy: 'name' })).toBe(AVIS);
  });

  it('el motor genèric ordena totes les candidates; la política de reserva correspon a la secció', () => {
    expect(primerElementTriable([NOVA, PREPARADA], 'carpeta', { sortable: true, sortBy: 'date' })).toBe(PREPARADA);
    expect(primerElementTriable([NOVA, PREPARADA], ALL_CATEGORY_ID, { sortable: true, sortBy: 'date' })).toBe(PREPARADA);
    expect(primerElementTriable([PREPARADA], 'carpeta', { sortable: true, sortBy: 'date' })).toBe(PREPARADA);
  });

  it.each(['name', 'date'])('ARB-T3-01 tancat: amb %s tria la primera fila pintada, fora de Tot i a Tot sense fixats', sortBy => {
    const ordre = { sortable: true, sortBy };
    const entrada = [VELL, NOVA, AVIS];
    expect(primerElementTriable(entrada, 'carpeta', ordre)).toBe(ordenaElements(entrada, { ...ordre, categoryId: 'carpeta' })[0]);
    const altra = Object.freeze({ id: 'altra', title: 'Almàssera', updatedAt: '2026-10-20T09:00:00Z' });
    const senseFixats = [altra, NOVA];
    expect(primerElementTriable(senseFixats, ALL_CATEGORY_ID, ordre)).toBe(ordenaElements(senseFixats, { ...ordre, categoryId: ALL_CATEGORY_ID })[0]);
  });

  it('primerElementTriable amb sortable no muta l’entrada', () => {
    const entrada = [NOVA, VELL, AVIS];
    const abans = [...entrada];
    expect(primerElementTriable(entrada, ALL_CATEGORY_ID, { sortable: true, sortBy: 'name' })).toBe(AVIS);
    expect(entrada).toEqual(abans);
  });

  it('ordenaElements no muta l’entrada i torna sempre una còpia', () => {
    const entrada = [VELL, NOVA, AVIS];
    const abans = [...entrada];
    expect(ids(ordenaElements(entrada, { sortable: true, sortBy: 'name', categoryId: 'carpeta' }))).toEqual(['avis', 'nova', 'vell']);
    expect(entrada).toEqual(abans);
    const copia = ordenaElements(entrada);
    expect(copia).not.toBe(entrada);
    expect(ids(copia)).toEqual(['vell', 'nova', 'avis']);
    expect(ordenaElements(null)).toEqual([]);
  });

  it('ordenaElements a «Tot»: els fixats davant en l’ordre de l’ordenació; sense sortable, el de l’entrada', () => {
    expect(ids(ordenaElements([NOVA, VELL, AVIS], { sortable: true, sortBy: 'date', categoryId: ALL_CATEGORY_ID }))).toEqual(['vell', 'avis', 'nova']);
    expect(ids(ordenaElements([NOVA, VELL, AVIS], { sortable: true, sortBy: 'name', categoryId: ALL_CATEGORY_ID }))).toEqual(['avis', 'vell', 'nova']);
    expect(ids(ordenaElements([NOVA, VELL, AVIS], { categoryId: ALL_CATEGORY_ID }))).toEqual(['vell', 'avis', 'nova']);
    expect(ids(ordenaElements([NOVA, VELL, AVIS], { sortable: true, sortBy: 'name', categoryId: 'carpeta' }))).toEqual(['avis', 'nova', 'vell']);
  });

  it('ORDENACIONS: data (la de muntar) i nom; l’estat naix per data i sense ordenar, o amb l’ordre de muntar', () => {
    expect(ORDENACIONS).toEqual(['date', 'name']);
    expect(Object.isFrozen(ORDENACIONS)).toBe(true);
    expect(createWorkspaceState()).toMatchObject({ sortBy: 'date', sortable: false });
    expect(createWorkspaceState({}, {}, { sortable: true, sortBy: 'name' })).toMatchObject({ sortBy: 'name', sortable: true });
    expect(createWorkspaceState({}, {}, { sortable: true, sortBy: 'preu' })).toMatchObject({ sortBy: 'date', sortable: true });
  });

  it('el reducer sort/set conserva la identitat si no canvia res i actualitza si canvia', () => {
    const estat = createWorkspaceState();
    expect(workspaceReducer(estat, { type: 'sort/set', sortBy: 'date', sortable: false })).toBe(estat);
    expect(workspaceReducer(estat, { type: 'sort/set' })).toBe(estat);
    expect(workspaceReducer(estat, { type: 'sort/set', sortBy: 'preu' })).toBe(estat);
    const perNom = workspaceReducer(estat, { type: 'sort/set', sortBy: 'name' });
    expect(perNom).not.toBe(estat);
    expect(perNom).toMatchObject({ sortBy: 'name', sortable: false });
    const ordenable = workspaceReducer(perNom, { type: 'sort/set', sortable: true });
    expect(ordenable).not.toBe(perNom);
    expect(ordenable).toMatchObject({ sortBy: 'name', sortable: true });
    expect(workspaceReducer(ordenable, { type: 'sort/set', sortBy: 'name', sortable: true })).toBe(ordenable);
    expect(ordenable.activeCategoryId).toBe(estat.activeCategoryId);
  });
});

/* B6-B2 (IDEA-46, marató 261101_2143) · `ambConsulta: false` deixa passar la
   consulta (la secció ja dona els elements de la seua cerca) i manté la
   carpeta, l'àmbit i les etiquetes. Només el booleà false: la resta, com
   sempre. (Import propi: este bloc és l'únic tros del fitxer compartit que
   toca B6-B2; les importacions s'eleven igualment.) */
import { filterWorkspaceItems as filtraElements } from './workspaceState.js';

describe('filterWorkspaceItems · ambConsulta', () => {
  const ELEMENTS = Object.freeze([
    Object.freeze({ id: 't', title: 'Tomaques', categoryIds: ['hort'], tags: ['estiu'] }),
    Object.freeze({ id: 'c', title: 'Carxofes', categoryIds: ['hort'], tags: ['hivern'] }),
    Object.freeze({ id: 'p', title: 'Pebreres', categoryIds: ['planter'], tags: ['estiu'] }),
    Object.freeze({ id: 'g', title: 'Gallines', categoryIds: ['corral'], searchText: 'ous' })
  ]);
  const estat = (canvis = {}) => ({ activeCategoryId: ALL_CATEGORY_ID, activeTagIds: [], query: 'tomaq', ...canvis });
  const ids = (llista) => llista.map((element) => element.id);

  it('sense opcions, o amb ambConsulta:true, la consulta filtra com sempre', () => {
    expect(ids(filtraElements(ELEMENTS, estat()))).toEqual(['t']);
    expect(ids(filtraElements(ELEMENTS, estat(), { ambConsulta: true }))).toEqual(['t']);
  });

  it('amb ambConsulta:false, cap element no cau per la consulta', () => {
    expect(ids(filtraElements(ELEMENTS, estat(), { ambConsulta: false }))).toEqual(['t', 'c', 'p', 'g']);
    expect(ids(filtraElements(ELEMENTS, estat({ query: 'ous' }), { ambConsulta: false }))).toEqual(['t', 'c', 'p', 'g']);
  });

  it('amb ambConsulta:false, la categoria, l’àmbit i les etiquetes continuen filtrant', () => {
    expect(ids(filtraElements(ELEMENTS, estat({ activeCategoryId: 'hort' }), { ambConsulta: false }))).toEqual(['t', 'c']);
    expect(ids(filtraElements(ELEMENTS, estat({ activeCategoryId: 'hort' }), { ambit: new Set(['hort', 'planter']), ambConsulta: false })))
      .toEqual(['t', 'c', 'p']);
    expect(ids(filtraElements(ELEMENTS, estat({ activeTagIds: ['estiu'] }), { ambConsulta: false }))).toEqual(['t', 'p']);
    expect(ids(filtraElements(ELEMENTS, estat({ activeCategoryId: 'hort', activeTagIds: ['hivern'] }), { ambConsulta: false }))).toEqual(['c']);
  });

  it('només el booleà false la desactiva: null, 0, \'\' o \'false\' filtren com sempre', () => {
    for (const valor of [null, 0, '', 'false', undefined]) {
      expect(ids(filtraElements(ELEMENTS, estat(), { ambConsulta: valor }))).toEqual(['t']);
    }
  });

  it('la consulta buida o d’espais no filtra, amb ambConsulta o sense', () => {
    expect(ids(filtraElements(ELEMENTS, estat({ query: '   ' })))).toEqual(['t', 'c', 'p', 'g']);
    expect(ids(filtraElements(ELEMENTS, estat({ query: '' }), { ambConsulta: false }))).toEqual(['t', 'c', 'p', 'g']);
  });
});
