import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext.jsx';
const state = vi.hoisted(() => ({ pages: [], exif: null }));
vi.mock('../../components/universal/UniversalPage', () => ({ UniversalPage: props => { state.pages.push(props); return null; } }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_key, fallback) => fallback }), useUIStateOpcional: () => null }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ towns: [] }) }));
vi.mock('./useMetadadesFoto.js', () => ({ useMetadadesFoto: () => ({ estat: state.exif ? 'llest' : 'sense', exif: state.exif }) }));
import { FitxaWeb } from './PaginesEspaiMultimedia.jsx';
import { MEDIA_ITEMS } from './mediaContent.js';
import { dataHoraDeBarra } from '../../components/universal/editorial.js';
const espai = { t: (_key, fallback) => fallback, cens: null, obriVisor: () => {}, visorObert: false, refTitol: null };
const current = () => state.pages.at(-1);
const source = () => ({ id: 'declared-creator-fixture', title: 'Foto de prova sintètica', src: null, tag: 'Arxiu', created_at: '2026-07-01T10:00:00Z' });
const open = item => render(<MemoryRouter rutaInicial="/multimedia"><FitxaWeb item={item} espai={espai} /></MemoryRouter>);
const noInventedIdentity = props => {
  expect(props.topBarData.authorAvatar).toBe('');
  expect(props.topBarData.authorLocation).toBe('');
  expect(props.topBarData.authorHref).toBeNull();
};
beforeEach(() => { state.pages.length = 0; state.exif = null; });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

for (const [id, name] of [['town-balones', 'Joanbanjo'], ['town-fageca', 'Fidel León Darder']]) {
  test('actual Commons explicit creator survives FitxaWeb: ' + id, () => {
    const item = MEDIA_ITEMS.find(row => row.id === id);
    expect(item?.autor).toBe(name);
    expect(item.src).toMatch(/^\/assets\/towns\/.+\/commons-ah27\.webp$/);
    open(item);
    expect(current().topBarData.authorName).toBe(name);
    noInventedIdentity(current());
    // These real records have no publication time: no date is manufactured.
    expect(item.created_at).toBeUndefined();
    expect([current().time, current().date, current().dateTime]).toEqual(['', '', '']);
  });
}

test('an explicit creator and existing publication time pass without a new identity', () => {
  const item = { ...source(), autor: '  Pepa\n Garcia  ', source: 'Arxiu municipal' };
  open(item);
  expect(current().topBarData.authorName).toBe('Pepa Garcia');
  expect(current()).toMatchObject(dataHoraDeBarra({ creat: item.created_at }));
  noInventedIdentity(current());
});

for (const [label, fields] of [
  ['absent', {}], ['explicit null', { autor: null, source: 'Una font' }],
  ['provenance only', { source: 'Nano Banana', origen: 'ia' }],
  ['Poble name is not a photographer', { tag: 'Poble', source: 'Balones' }],
  ['number', { autor: 42 }], ['array', { autor: ['Pepa'] }], ['object', { autor: { name: 'Pepa' } }],
  ['markup', { autor: '<img src=x onerror=alert(1)>' }], ['direction override', { autor: 'Pepa\u202eGarcia' }],
  ['control', { autor: 'Pepa\u0000Garcia' }], ['oversized', { autor: 'x'.repeat(501) }]
]) {
  test('unknown author stays explicit, without project fallback: ' + label, () => {
    open({ ...source(), ...fields });
    expect(current().topBarData.authorName).toBe('Desconegut');
    noInventedIdentity(current());
  });
}

test('source cannot replace an explicit null even when it names a known identity', () => {
  open({ ...source(), autor: null, source: 'Javi Llinares' });
  expect(current().topBarData.authorName).toBe('Desconegut');
});

test('private contribution does not adopt public Commons metadata or enable translation', () => {
  const actual = MEDIA_ITEMS.find(row => row.id === 'town-balones');
  open({ ...actual, ownerUserId: 'private-fixture-owner', autor: null });
  expect(current().topBarData.authorName).toBe('Desconegut');
  expect(current().traduccio).toBe(false);
  noInventedIdentity(current());
});

for (const [label, marker] of [['null ownership marker', { ownerUserId: null }], ['members visibility', { visibility: 'members' }]]) {
  test('private boundary follows canonical visibility even with ' + label, () => {
    const actual = MEDIA_ITEMS.find(row => row.id === 'town-balones');
    open({ ...actual, ...marker, autor: null });
    expect(current().topBarData.authorName).toBe('Desconegut');
    expect(current().traduccio).toBe(false);
    noInventedIdentity(current());
  });
}

test('declared EXIF creator is used without linking that name to a profile', () => {
  state.exif = { autor: 'Autora EXIF de prova' };
  open({ ...source(), autor: 'Autor del registre' });
  expect(current().topBarData.authorName).toBe('Autora EXIF de prova');
  noInventedIdentity(current());
});

test('absence of a real publication date survives reading clock changes', () => {
  vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2040-01-01T00:00:00Z'));
  const view = open({ ...source(), created_at: null, autor: 'Pepa' });
  expect([current().time, current().date, current().dateTime]).toEqual(['', '', '']);
  Date.now.mockReturnValue(Date.parse('2050-01-01T00:00:00Z'));
  view.rerender(<MemoryRouter rutaInicial="/multimedia"><FitxaWeb item={{ ...source(), created_at: null, autor: 'Pepa' }} espai={espai} /></MemoryRouter>);
  expect([current().time, current().date, current().dateTime]).toEqual(['', '', '']);
});
