/**
 * T3 (ordre del Mestre, 261001) · La boina d'un producte porta el nom i
 * l'avatar de qui el signa, presos de la SEUA identitat (marketContent.js ·
 * identitatsSeed.autoriaSeed): el Mac Mini de la persona pilot pintava el
 * logo de Sóc de Poble. Es fixa amb les dades reals de la llavor al Mercat,
 * a la targeta del Mur i a la barra taronja del detall, amb sessió i sense
 * (cap d'estes peces llig la sessió: l'autoria és de l'element).
 */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), mur: null }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa }),
  useUIState: () => ({ externalConfig: {} })
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../mur/MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ status: 'ready', towns: [] }) }));
vi.mock('../multimedia/MultimediaContext', () => ({ useMultimedia: () => ({ status: 'ready', mediaItems: [] }) }));

import MercatSection from './MercatSection.jsx';
import { MARKET_ITEMS } from './marketContent.js';
import { MOCK_MARKET_ITEMS } from './marketSeed.js';
import { TargetaDelMur } from '../mur/TargetaDelMur.jsx';
import { paginaDElement } from '../detail/elementDeSeccio.js';
import { buildMercatDetailSectionMeta } from '../detail/detailSectionMeta.jsx';
import { BarraTaronja } from '../../components/universal/barres/BarraTaronja.jsx';
import { PERSONA_PILOT, autoriaSeed } from '../../data/identitatsSeed.js';
import { desaSessio, esborraSessio, usuariDeSessio } from '../../data/identitat.js';
import { createLocalPerfilsAdapter } from '../../data/localPerfils.js';
import { autorDe, rutaDePerfil } from '../../config/navigation.js';
import { FORASTER } from '../../components/universal/UniversalUtils.js';

const LOGO = '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg';
const MAC = MARKET_ITEMS.find((item) => item.id === 'mac-mini-m4');
const SAMARRETA = MARKET_ITEMS.find((item) => item.id === 'samarreta-socdepoble');
const t = (_, alternativa) => alternativa;

const targetaDe = (arrel, titol) => [...arrel.querySelectorAll('article')]
  .find((article) => article.querySelector('.sp-card-title')?.textContent === titol);
const boinaDe = (targeta) => ({
  nom: targeta.querySelector('.sp-card-header .sp-card-author-name')?.textContent ?? null,
  avatar: targeta.querySelector('.sp-card-header img.sp-card-avatar')?.getAttribute('src') ?? null
});
const boinesDelMercat = () => {
  const arrel = render(<MercatSection />).container;
  return { mac: boinaDe(targetaDe(arrel, MAC.title)), samarreta: boinaDe(targetaDe(arrel, SAMARRETA.title)) };
};

afterEach(() => {
  cleanup();
  esborraSessio({ abast: 'tot' });
});
beforeEach(() => {
  vi.clearAllMocks();
  mocks.mur = { status: 'ready', sortedMarketItems: MARKET_ITEMS };
});

test('la llavor: el producte de la persona pilot porta el seu nom i la seua foto; el de l’entitat, el logo', () => {
  expect(MAC).toMatchObject({ author_name: PERSONA_PILOT.nom, author_avatar: PERSONA_PILOT.avatar });
  expect(SAMARRETA).toMatchObject({ author_name: 'Sóc de Poble', author_avatar: LOGO });
  // L'avatar de l'autor no s'escola a la imatge del producte (Multimèdia, detall).
  for (const item of MARKET_ITEMS) expect(item.imageSrc).not.toBe(PERSONA_PILOT.avatar);
});

test('Mercat: la boina del Mac Mini diu «Javi» amb la foto del perfil, mai el logo de l’entitat', () => {
  const { mac, samarreta } = boinesDelMercat();
  expect(mac).toEqual({ nom: 'Javi', avatar: PERSONA_PILOT.avatar });
  expect(samarreta).toEqual({ nom: 'Sóc de Poble', avatar: LOGO });
});

test('Mercat: cap producte signat per la persona pilot pinta el logo com a avatar', () => {
  const arrel = render(<MercatSection />).container;
  const delPilot = MARKET_ITEMS.filter((item) => autoriaSeed(item)?.tipus === 'persona');
  expect(delPilot.length).toBeGreaterThan(0);
  for (const item of delPilot) expect(boinaDe(targetaDe(arrel, item.title)).avatar).not.toBe(LOGO);
});

test('Mur: la targeta del Mac Mini porta la mateixa boina que al Mercat', () => {
  const targeta = render(<TargetaDelMur item={MAC} />).container.querySelector('article');
  expect(boinaDe(targeta)).toEqual({ nom: 'Javi', avatar: PERSONA_PILOT.avatar });
});

test('Detall: la barra taronja del Mac Mini signa amb «Javi» i la seua foto', () => {
  const pagina = paginaDElement(buildMercatDetailSectionMeta({ marketItems: MARKET_ITEMS, t }), MAC);
  expect(pagina).toMatchObject({ authorName: 'Javi', authorAvatar: PERSONA_PILOT.avatar, authorHref: '/gent/javillinares' });
  const barra = render(<BarraTaronja authorName={pagina.authorName} authorAvatar={pagina.authorAvatar} authorLocation="" />).container;
  expect(barra.querySelector('.sp-card-author-name').textContent).toBe('Javi');
  expect(barra.querySelector('img.sp-card-avatar').getAttribute('src')).toBe(PERSONA_PILOT.avatar);
});

test('Detall: l’enllaç de la boina porta a un perfil de veres, amb sessió i sense, amb la mateixa foto', () => {
  const pagina = paginaDElement(buildMercatDetailSectionMeta({ marketItems: MARKET_ITEMS, t }), MAC);
  const clau = pagina.authorHref.replace(/^\/gent\//, '');
  const perfils = createLocalPerfilsAdapter();
  const senseSessio = perfils.loadPerfilPublic(clau, null);
  const ambSessio = perfils.loadPerfilPublic(clau, { id: '11111111-2222-4333-8444-555555555555', user_metadata: {} });
  // Abans, sense sessió, null: «Perfil no trobat».
  expect(senseSessio).toMatchObject({ tipus: 'persona', nom: 'Javi', avatar: PERSONA_PILOT.avatar, propietari: false });
  expect(ambSessio).toMatchObject({ tipus: 'persona', nom: 'Javi', avatar: PERSONA_PILOT.avatar, propietari: true });
  expect(senseSessio.avatar).toBe(MAC.author_avatar);
});

test('Mercat: qui signa sense foto porta la silueta de reserva, mai el logo; sense nom, el Foraster, mai l’entitat', () => {
  mocks.mur = {
    status: 'ready',
    sortedMarketItems: [
      { id: 'cistella', type: 'product', title: 'Cistella de vímet', seller: 'Pepa', author_id: 'pepa', created_at: '2026-09-01T10:00:00.000Z' },
      { id: 'banc', type: 'product', title: 'Banc de fusta', created_at: '2026-09-02T10:00:00.000Z' }
    ]
  };
  const arrel = render(<MercatSection />).container;
  for (const titol of ['Cistella de vímet', 'Banc de fusta']) {
    const targeta = targetaDe(arrel, titol);
    expect(targeta.querySelector('.sp-card-header img.sp-card-avatar')).toBeNull();
    expect(targeta.querySelector('.sp-card-header .sp-card-avatar--fallback')).not.toBeNull();
  }
  expect(boinaDe(targetaDe(arrel, 'Cistella de vímet')).nom).toBe('Pepa');
  expect(boinaDe(targetaDe(arrel, 'Banc de fusta')).nom).toBe(FORASTER.name);
  for (const article of arrel.querySelectorAll('article')) expect(article.innerHTML).not.toContain(LOGO);
});

test('amb sessió de llavor i sense, la boina del Mercat és la mateixa: Javi i la seua foto', () => {
  expect(usuariDeSessio()).toBeNull();
  const senseSessio = boinesDelMercat();
  cleanup();
  // La persona que entra en mode seed és la persona pilot (identitatsSeed, capçalera); sense metadades.
  expect(desaSessio({ access_token: 'capcalera.carrega.signatura', user: { id: '11111111-2222-4333-8444-555555555555', user_metadata: {} } })).toBe(true);
  expect(usuariDeSessio()?.id).toBe('11111111-2222-4333-8444-555555555555');
  expect(boinesDelMercat()).toEqual(senseSessio);
  expect(senseSessio.mac).toEqual({ nom: 'Javi', avatar: PERSONA_PILOT.avatar });
});

test('les imatges pròpies de la llavor del Mercat existixen a public/ (cap 404: la 08 de la samarreta)', async () => {
  const { existsSync } = await import('node:fs');
  const { join } = await import('node:path');
  const propies = MOCK_MARKET_ITEMS.flatMap((item) => [item.avatar_url, ...(item.images || []), ...(item.variations || []).map((v) => v.image)])
    .filter((ruta) => typeof ruta === 'string' && ruta.startsWith('/assets/'));
  expect(propies.length).toBeGreaterThan(0);
  /* Des de l'arrel del repositori (on corre vitest). Només public/:
     wordpress-plugin/dist no es versiona i en un clon net o a la CI no hi és;
     el paquet copia public/ sencer (vite.standalone.config.js · PROPIS_DEL_LLOC). */
  expect(propies.filter((ruta) => !existsSync(join(process.cwd(), 'public', ruta)))).toEqual([]);
});

/* El pla de la marató corregix la navegació editorial antiga del Mercat:
   la persona i l'empresa han de tindre una fitxa pública real. */
test('Mercat i detall: cada boina obri el perfil públic del venedor pel seu identificador', () => {
  const arrel = render(<MercatSection />).container;
  const perfils = createLocalPerfilsAdapter();
  const seccio = buildMercatDetailSectionMeta({ marketItems: MARKET_ITEMS, t });
  for (const item of [MAC, SAMARRETA]) {
    const autor = autorDe(item);
    const ruta = rutaDePerfil(autor.tipus, autor.id);
    const targeta = targetaDe(arrel, item.title);
    expect(targeta.querySelector('.sp-card-header a')?.getAttribute('href')).toBe(ruta);
    expect(paginaDElement(seccio, item).authorHref).toBe(ruta);
    const clau = decodeURIComponent(ruta.split('/').at(-1));
    expect(perfils.loadPerfilPublic(clau, null)).not.toBeNull();
    expect(ruta).not.toBe('/projecte');
  }
});

test('Mercat: els ids remots diferents del mateix nom conserven el seu perfil, sense autoria no inventa ruta', () => {
  mocks.mur.sortedMarketItems = [
    { id: 'remot', title: 'Producte remot', author_name: 'Sóc de Poble', author_org_id: 'entitat-remota', created_at: '2026-10-04T20:00:00Z' },
    { id: 'sense', title: 'Sense identitat', author_name: 'Sóc de Poble', created_at: '2026-10-04T20:00:00Z' }
  ];
  const arrel = render(<MercatSection />).container;
  expect(targetaDe(arrel, 'Producte remot').querySelector('.sp-card-header a')?.getAttribute('href')).toBe('/empresa/entitat-remota');
  expect(targetaDe(arrel, 'Sense identitat').querySelector('.sp-card-header a')).toBeNull();
});
