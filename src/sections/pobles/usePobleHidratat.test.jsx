import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { clauDeViquipedia } from './fitxaDelPoble.js';
import { DADES_POBLES_APLEC_VIQUIPEDIA } from './poblesAplecViquipedia.js';
import { usePobleHidratat, usePoblesHidratats } from './usePobleHidratat.js';

const control = vi.hoisted(() => {
  const entrades = new Map();const oients = new Set();
  const cau = {
    llig: vi.fn(async clau => entrades.get(clau) || null),
    entradaEnMemoria: clau => entrades.get(clau),
    subscriu: fn => { oients.add(fn);return () => oients.delete(fn); }
  };
  return { entrades, oients, cau, api: vi.fn(), carrega: vi.fn(() => cau) };
});
vi.mock('./cauDeViquipedia.js', () => ({ cauDeViquipedia: control.carrega }));
vi.mock('./pobleDeViquipedia.js', () => ({ pobleDeViquipedia: control.api }));
const foto = { src: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Foto.jpg', fitxer: 'Foto.jpg' };
const poble = nom => ({ id: nom, title: nom, provincia: 'Alacant', image_url: '/foto-aportada.jpg' });
const proposta = town => ({ ...town, estat: 'parcial', hydration_version: 2, content: 'Descripció contrastada.', population: '30 hab', population_year: 2025,
  elevation: 400, area: 10, gentilici: 'gent del poble', lat: 38.5, lng: -0.4, wikidata_id: 'Q1', wikipedia_title: town.title,
  image_url: foto.src, avatar_url: foto.src, imatges: { hero: foto, avatar: foto, reserva: null }, shield_url: null });
let fetchImpl;
beforeEach(() => {
  control.entrades.clear();control.oients.clear();vi.clearAllMocks();
  fetchImpl = vi.fn(() => { throw new Error('cap consulta externa durant la hidratació local'); });vi.stubGlobal('fetch', fetchImpl);
});
afterEach(() => { cleanup();expect(control.api).not.toHaveBeenCalled();expect(fetchImpl).not.toHaveBeenCalled();vi.unstubAllGlobals(); });

describe('AH-27 · hidratació automàtica de dades locals', () => {
  test('una fotografia pròpia no amaga les magnituds i dades que ja hi ha en cau', async () => {
    const town = poble('Poble de la Foto');const dto = proposta(town);
    control.entrades.set(clauDeViquipedia(town), { llegitEl: Date.now(), dto });
    const { result } = renderHook(() => usePobleHidratat(town));
    await waitFor(() => expect(result.current.area).toBe(10));
    expect(result.current.image_url).toBe('/foto-aportada.jpg');expect(result.current.population_year).toBe(2025);
    expect(result.current.elevation).toBe(400);expect(result.current.gentilici).toBe('gent del poble');
  });
  test('una foto remota de la cau no passa a la capçalera, l’avatar ni l’escut', async () => {
    const town = { ...poble('Poble de la Cau'), image_url: undefined };const dto = { ...proposta(town), shield_url: 'https://upload.wikimedia.org/Escut.svg' };
    control.entrades.set(clauDeViquipedia(town), { llegitEl: Date.now(), dto });
    const { result } = renderHook(() => usePobleHidratat(town));
    await waitFor(() => expect(result.current.content).toBe(dto.content));
    expect(result.current.image_url).toBeUndefined();expect(result.current.avatar_url).toBeUndefined();expect(result.current.shield_url).toBeUndefined();
    expect(result.current.fontsDeViquipedia.dto.imatges.hero.fitxer).toBe('Foto.jpg');
  });
  test('una llavor editorial revisada i una fitxa completa no lligen la cau', async () => {
    const town = DADES_POBLES_APLEC_VIQUIPEDIA.benillup;
    const complet = { ...proposta(poble('Poble Complet')), comarca: 'El Comtat', shield_url: '/assets/shield.svg' };
    const llista = [town, complet];const { result } = renderHook(() => usePoblesHidratats(llista));await act(async () => {});
    expect(result.current).toBe(llista);expect(control.cau.llig).not.toHaveBeenCalled();
  });
  test('una fitxa incompleta sense dades locals espera el gest manual', async () => {
    const town = poble('Poble Sense Cau');const { result } = renderHook(() => usePobleHidratat(town));
    await waitFor(() => expect(control.cau.llig).toHaveBeenCalledWith(clauDeViquipedia(town)));
    expect(result.current).toBe(town);expect(control.api).not.toHaveBeenCalled();
  });
  test('una nova revisió manual en cau actualitza la fitxa, sense cap consulta del hook', async () => {
    const town = poble('Poble Actualitzat');const clau = clauDeViquipedia(town);
    control.entrades.set(clau, { llegitEl: Date.now(), dto: { ...proposta(town), area: null } });
    const vista = renderHook(() => usePobleHidratat(town));await waitFor(() => expect(vista.result.current.elevation).toBe(400));
    expect(vista.result.current.area).toBeUndefined();
    await act(async () => { control.entrades.set(clau, { llegitEl: Date.now(), dto: proposta(town) });control.oients.forEach(fn => fn()); });
    expect(vista.result.current.area).toBe(10);vista.unmount();expect(control.oients.size).toBe(0);
  });
  test('rebutja una proposta d’un altre poble encara que es guarde amb la mateixa clau', async () => {
    const town = poble('Poble Correcte');control.entrades.set(clauDeViquipedia(town), { llegitEl: Date.now(), dto: proposta(poble('Un altre Poble')) });
    const { result } = renderHook(() => usePobleHidratat(town));await waitFor(() => expect(control.cau.llig).toHaveBeenCalled());expect(result.current).toBe(town);
  });
  test('fora d’una fitxa de poble, actiu=false no obri la cau', async () => {
    const town = poble('Element d’una altra Secció');const { result } = renderHook(() => usePobleHidratat(town, false));await act(async () => {});
    expect(result.current).toBe(town);expect(control.cau.llig).not.toHaveBeenCalled();
  });
});


test('AH-27 · Benillup incomplet del backend té foto i dades contrastades en la primera pintada', () => {
  const backend = { id: 'benillup', title: 'Benillup', image_url: '/assets/hero_nanobanana.png' };
  const { result } = renderHook(() => usePobleHidratat(backend));const font = DADES_POBLES_APLEC_VIQUIPEDIA.benillup;
  expect(result.current.image_url).toBe(font.image_url);expect(result.current.imageSrc).toBe(font.image_url);
  expect(result.current).toMatchObject({ population: font.population, population_year: 2025, elevation: 565, area: 3.4, provincia: 'Alacant', comarca: 'El Comtat', wikidata_id: 'Q1771932' });
  expect(result.current.shield_url ?? null).toBeNull();expect(result.current.wikipedia_provenance.photo.autor).toBe('Joanbanjo');
  expect(control.cau.llig).not.toHaveBeenCalled();expect(fetchImpl).not.toHaveBeenCalled();
});
test('AH-27 · les 22 fitxes incompletes recuperen instantàniament les imatges i els fets locals', () => {
  const incomplets = Object.values(DADES_POBLES_APLEC_VIQUIPEDIA).map(({ id, title }) => ({ id, title, image_url: '/hero_nanobanana.png' }));
  const { result } = renderHook(() => usePoblesHidratats(incomplets));expect(result.current).toHaveLength(22);
  for (const town of result.current) {
    const font = DADES_POBLES_APLEC_VIQUIPEDIA[town.id];expect(town.image_url).toBe(font.image_url);expect(town.avatar_url).toBe(font.avatar_url);
    expect(town.population).toBe(font.population);expect(town.population_year).toBe(font.population_year);expect(town.lat).toBe(font.lat);expect(town.lng).toBe(font.lng);
    expect(town.content).toBe(font.content);expect(town.wikipedia_hydration).toBe(font.wikipedia_hydration);
  }
  expect(fetchImpl).not.toHaveBeenCalled();
});
test('AH-27 · una foto i un text propis vàlids es conserven durant la compleció local', () => {
  const backend = { id: 'benillup', title: 'Benillup', image_url: '/assets/aportada.jpg', avatar_url: '/assets/avatar-aportat.jpg', content: 'Text aportat per la gent.', copyright: 'Autoria pròpia' };
  const { result } = renderHook(() => usePobleHidratat(backend));expect(result.current.image_url).toBe(backend.image_url);expect(result.current.avatar_url).toBe(backend.avatar_url);
  expect(result.current.content).toBe(backend.content);expect(result.current.copyright).toBe(backend.copyright);expect(result.current.area).toBe(3.4);
});
test('AH-27 · un homònim, província diferent o QID alié no adquirix dades del poble verificat', () => {
  const casos = [
    { id: 'un-altre-benillup', title: 'Benillup' }, { id: 'benillup', title: 'Un altre Poble' },
    { id: 'benillup', title: 'Benillup', provincia: 'València' }, { id: 'benillup', title: 'Benillup', wikidata_id: 'Q1' }
  ];
  const { result } = renderHook(() => usePoblesHidratats(casos));expect(result.current).toBe(casos);
  expect(result.current.every(town => town.population == null && town.image_url == null)).toBe(true);
});
