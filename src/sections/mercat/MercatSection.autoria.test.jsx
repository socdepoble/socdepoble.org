/**
 * T3 (ordre del Mestre, 261001) · La boina d'un producte porta el nom i
 * l'avatar de qui el signa, presos de la SEUA identitat (marketContent.js ·
 * identitatsSeed.autoriaSeed): el Mac Mini de la persona pilot pintava el
 * logo de Sóc de Poble. Es fixa amb les dades reals de la llavor al Mercat,
 * a la targeta del Mur i a la barra taronja del detall, amb sessió i sense
 * (cap d'estes peces llig la sessió: l'autoria és de l'element).
 */
import React from 'react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
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
import { propsDeTargetaDeProducte } from './targetaDeProducte.js';
import { TargetaDelMur } from '../mur/TargetaDelMur.jsx';
import { paginaDElement } from '../detail/elementDeSeccio.js';
import { avatarAutorDElement, buildMercatDetailSectionMeta } from '../detail/detailSectionMeta.jsx';
import { BarraTaronja } from '../../components/universal/barres/BarraTaronja.jsx';
import { EventCard } from '../../components/universal/EventCard.jsx';
import { propsDeTargetaDeLaPagina } from '../../components/universal/targetaDeLaPagina.js';
import { EVENTS } from '../mur/eventsContent.js';
import { PERSONA_PILOT, autoriaSeed } from '../../data/identitatsSeed.js';
import { desaSessio, esborraSessio, usuariDeSessio } from '../../data/identitat.js';
import { createLocalPerfilsAdapter } from '../../data/localPerfils.js';
import { autorDe, rutaDePerfil } from '../../config/navigation.js';
import { DEFAULT_AUTHOR, FORASTER } from '../../components/universal/UniversalUtils.js';

/* Onada 8 (261009) · El logo de l'entitat a la llavor és el PNG (abans, l'SVG). */
const LOGO = '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png';
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
  expect(MAC.imageSrc).toBe('/assets/uploads/brain/mac_mini_m4_1787721966622.jpg');
  // L'avatar de l'autor no s'escola a la imatge del producte (Multimèdia, detall).
  for (const item of MARKET_ITEMS) expect(item.imageSrc).not.toBe(PERSONA_PILOT.avatar);
});

test('Mercat: la boina del Mac Mini diu «Javi Llinares» amb la foto del perfil, mai el logo de l’entitat', () => {
  const { mac, samarreta } = boinesDelMercat();
  expect(mac).toEqual({ nom: 'Javi Llinares', avatar: PERSONA_PILOT.avatar });
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
  expect(boinaDe(targeta)).toEqual({ nom: 'Javi Llinares', avatar: PERSONA_PILOT.avatar });
});

test('Detall: la barra taronja del Mac Mini signa amb «Javi Llinares» i la seua foto', () => {
  const pagina = paginaDElement(buildMercatDetailSectionMeta({ marketItems: MARKET_ITEMS, t }), MAC);
  expect(pagina).toMatchObject({ authorName: 'Javi Llinares', authorAvatar: PERSONA_PILOT.avatar, authorHref: '/gent/javillinares' });
  const barra = render(<BarraTaronja authorName={pagina.authorName} authorAvatar={pagina.authorAvatar} authorLocation="" />).container;
  expect(barra.querySelector('.sp-card-author-name').textContent).toBe('Javi Llinares');
  expect(barra.querySelector('img.sp-card-avatar').getAttribute('src')).toBe(PERSONA_PILOT.avatar);
});

test('Detall: l’enllaç de la boina porta a un perfil de veres, amb sessió i sense, amb la mateixa foto', () => {
  const pagina = paginaDElement(buildMercatDetailSectionMeta({ marketItems: MARKET_ITEMS, t }), MAC);
  const clau = pagina.authorHref.replace(/^\/gent\//, '');
  const perfils = createLocalPerfilsAdapter();
  const senseSessio = perfils.loadPerfilPublic(clau, null);
  const ambSessio = perfils.loadPerfilPublic(clau, { id: '11111111-2222-4333-8444-555555555555', user_metadata: {} });
  // Abans, sense sessió, null: «Perfil no trobat».
  expect(senseSessio).toMatchObject({ tipus: 'persona', nom: 'Javi Llinares', avatar: PERSONA_PILOT.avatar, propietari: false });
  expect(ambSessio).toMatchObject({ tipus: 'persona', nom: 'Javi Llinares', avatar: PERSONA_PILOT.avatar, propietari: true });
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

test('amb sessió de llavor i sense, la boina del Mercat és la mateixa: Javi Llinares i la seua foto', () => {
  expect(usuariDeSessio()).toBeNull();
  const senseSessio = boinesDelMercat();
  cleanup();
  // La persona que entra en mode seed és la persona pilot (identitatsSeed, capçalera); sense metadades.
  expect(desaSessio({ access_token: 'capcalera.carrega.signatura', user: { id: '11111111-2222-4333-8444-555555555555', user_metadata: {} } })).toBe(true);
  expect(usuariDeSessio()?.id).toBe('11111111-2222-4333-8444-555555555555');
  expect(boinesDelMercat()).toEqual(senseSessio);
  expect(senseSessio.mac).toEqual({ nom: 'Javi Llinares', avatar: PERSONA_PILOT.avatar });
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

/* Gauntlet 261016 · Un nom compartit no identifica la persona pilot: cada
   autor conserva el seu nom, la seua foto (o la silueta) i el seu perfil. */
test.each(['Javi', 'Javi Llinares'])('Mercat: l’homònim %s amb un altre ID no hereta la identitat del pilot', (nom) => {
  // El Mercat admet imatges pròpies: la prova d'identitat no usa un servidor alié.
  const foto = '/assets/proves/homonim.webp';
  mocks.mur.sortedMarketItems = [
    { id: 'amb-foto', title: 'Producte homònim amb foto', author_name: nom, author_id: 'persona-homonima', author_avatar: foto },
    { id: 'sense-foto', title: 'Producte homònim sense foto', seller: nom, author_id: 'persona-homonima-sense-foto' }
  ];
  const arrel = render(<MercatSection />).container;
  const ambFoto = targetaDe(arrel, 'Producte homònim amb foto');
  const senseFoto = targetaDe(arrel, 'Producte homònim sense foto');
  expect(boinaDe(ambFoto)).toEqual({ nom, avatar: foto });
  expect(boinaDe(senseFoto)).toEqual({ nom, avatar: null });
  expect(senseFoto.querySelector('.sp-card-header .sp-card-avatar--fallback')).not.toBeNull();
  expect(ambFoto.querySelector('.sp-card-header a')?.getAttribute('href')).toBe('/gent/persona-homonima');
  expect(senseFoto.querySelector('.sp-card-header a')?.getAttribute('href')).toBe('/gent/persona-homonima-sense-foto');
});

test('Mercat: l’entitat signant té prioritat encara que la persona autora siga la pilot', () => {
  mocks.mur.sortedMarketItems = [
    { id: 'entitat', title: 'Producte de la cooperativa', author_name: 'Cooperativa', author_id: 'javillinares', author_org_id: 'entitat-remota', avatar_url: LOGO }
  ];
  const targeta = targetaDe(render(<MercatSection />).container, 'Producte de la cooperativa');
  expect(boinaDe(targeta)).toEqual({ nom: 'Cooperativa', avatar: LOGO });
  expect(targeta.querySelector('.sp-card-header a')?.getAttribute('href')).toBe('/empresa/entitat-remota');
});

/* Gauntlet 261016 · diürn 1530 (Bloc -1; ordre del Mestre: l'avatar de la
   persona pilot «Sempre és la seua foto personal de perfil») · Derogades les
   tres proves nocturnes que fixaven l'ordre vella: un avatar no textual de la
   pilot pintava la silueta, i un avatar opac o una altra foto seua es
   conservaven. L'ordre diu «sempre»: ara totes pinten la foto del perfil, amb
   el seu nom i el seu perfil (el resolutor únic, signaturaDeQuiSigna). Una
   entitat signant continua tenint prioritat (la prova de dalt) i un homònim
   amb un altre id conserva la seua foto (Mercat: l’homònim…). */
test.each([23, { url: '/assets/proves/avatar.webp' }])('Gauntlet 261016 · avatar no textual %j de la pilot no llança i la targeta pinta la seua foto', (avatar) => {
  const item = { id: 'avatar-invalid', title: 'Producte amb avatar invàlid', author_id: 'javillinares', author_avatar: avatar };
  expect(() => propsDeTargetaDeProducte(item)).not.toThrow();
  expect(propsDeTargetaDeProducte(item).avatarUrl).toBe(PERSONA_PILOT.avatar);
  mocks.mur.sortedMarketItems = [item];
  const targeta = targetaDe(render(<MercatSection />).container, item.title);
  expect(boinaDe(targeta)).toEqual({ nom: 'Javi Llinares', avatar: PERSONA_PILOT.avatar });
  expect(targeta.querySelector('.sp-card-header .sp-card-avatar--fallback')).toBeNull();
  expect(targeta.querySelector('.sp-card-header a')?.getAttribute('href')).toBe('/gent/javillinares');
});

test('Gauntlet 261016 · un avatar opac de la pilot (sdp-media://) dona pas a la seua foto del perfil', () => {
  const avatar = 'sdp-media://mitjans/T/U/avatars/logo-socdepoble-carnaval.webp';
  const props = propsDeTargetaDeProducte({ id: 'avatar-opac', title: 'Foto pròpia', author_id: 'javillinares', author_avatar: avatar });
  expect(props).toMatchObject({ author: 'Javi Llinares', authorHref: '/gent/javillinares', avatarUrl: PERSONA_PILOT.avatar });
});

test.each([LOGO, '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg'])('Gauntlet 261016 · avatar amb la marca real %s es substituïx per la foto pilot', (avatar) => {
  expect(propsDeTargetaDeProducte({ id: 'avatar-marca', title: 'Foto de la pilot', author_id: 'javillinares', author_avatar: avatar }))
    .toMatchObject({ author: 'Javi Llinares', authorHref: '/gent/javillinares', avatarUrl: PERSONA_PILOT.avatar });
});

test('Gauntlet 261016 · una altra foto declarada per a la pilot també dona pas a la del perfil', () => {
  const avatar = '/assets/fotos/logo-socdepoble-carnaval.webp';
  const item = { id: 'avatar-personal', title: 'Foto de carnestoltes', author_id: 'javillinares', author_avatar: avatar };
  expect(propsDeTargetaDeProducte(item).avatarUrl).toBe(PERSONA_PILOT.avatar);
  mocks.mur.sortedMarketItems = [item];
  const targeta = targetaDe(render(<MercatSection />).container, item.title);
  expect(boinaDe(targeta)).toEqual({ nom: 'Javi Llinares', avatar: PERSONA_PILOT.avatar });
});

/* Revisió adversarial del carril D (261016, problema 3) · La robustesa que
   fixaven les proves nocturnes derogades de dalt, ara amb un autor que no és
   la pilot (el camí `declarat` del resolutor → resolRecursPropi →
   UniversalCard): un avatar no textual no fa petar res, es conserva tal qual
   i la targeta pinta la silueta; un avatar opac (sdp-media://) es conserva tal
   qual i la targeta mai no pinta la referència crua. */
test.each([23, { url: '/assets/proves/avatar.webp' }])('Mercat: un avatar no textual %j d’un veí no llança, es conserva i la targeta pinta la silueta', (avatar) => {
  const item = { id: 'avatar-invalid-vei', title: 'Producte del veí amb avatar invàlid', author_name: 'Pepa', author_id: 'pepa', author_avatar: avatar };
  expect(() => propsDeTargetaDeProducte(item)).not.toThrow();
  expect(propsDeTargetaDeProducte(item)).toMatchObject({ author: 'Pepa', authorHref: '/gent/pepa' });
  expect(propsDeTargetaDeProducte(item).avatarUrl).toBe(avatar);
  mocks.mur.sortedMarketItems = [item];
  const targeta = targetaDe(render(<MercatSection />).container, item.title);
  expect(boinaDe(targeta)).toEqual({ nom: 'Pepa', avatar: null });
  expect(targeta.querySelector('.sp-card-header .sp-card-avatar--fallback')).not.toBeNull();
  expect(targeta.querySelector('.sp-card-header a')?.getAttribute('href')).toBe('/gent/pepa');
  expect(targeta.innerHTML).not.toContain(PERSONA_PILOT.avatar);
});

test('Mercat: un avatar opac (sdp-media://) d’un veí, amb un nom de fitxer que sembla el logotip, es conserva tal qual', () => {
  const avatar = 'sdp-media://mitjans/T/U/avatars/logo-socdepoble-carnaval.webp';
  const item = { id: 'avatar-opac-vei', title: 'Foto pròpia del veí', author_name: 'Pepa', author_id: 'pepa', author_avatar: avatar };
  expect(() => propsDeTargetaDeProducte(item)).not.toThrow();
  expect(propsDeTargetaDeProducte(item)).toMatchObject({ author: 'Pepa', authorHref: '/gent/pepa', avatarUrl: avatar });
  mocks.mur.sortedMarketItems = [item];
  const targeta = targetaDe(render(<MercatSection />).container, item.title);
  expect(boinaDe(targeta).nom).toBe('Pepa');
  // Mai la referència crua ni la foto de la pilot a la boina.
  expect(boinaDe(targeta).avatar).not.toBe(avatar);
  expect(targeta.innerHTML).not.toContain('sdp-media://');
  expect(targeta.innerHTML).not.toContain(PERSONA_PILOT.avatar);
});

test('Gauntlet 261016 · un nom curt de la pilot («Javi») es pinta amb el seu nom sencer', () => {
  const props = propsDeTargetaDeProducte({ id: 'nom-curt', title: 'Taula', author_name: 'Javi', author_id: 'javi' });
  expect(props).toMatchObject({ author: 'Javi Llinares', avatarUrl: PERSONA_PILOT.avatar });
});

/* Gauntlet 261016 · diürn 1530 (Bloc -1) · La fila CRUA del Mac Mini de
   supabase/seed.sql, tal com la servix app_content en remot i al node local
   (runtime.js no la passa per marketContent): sense author_avatar, amb la foto
   a avatar_url. I la variant que el Mestre prohibix, amb el quadrat verd a
   avatar_url. Les dues pinten «Javi Llinares» amb la foto del perfil al
   Mercat, al Mur, a la barra taronja, a l'avatar redó del detall i a la
   targeta incrustada (targetaDeLaPagina, que hereta paginaDElement). */
const QUADRAT_VERD_SVG = '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg';
const FILA = /\('[^']*', '([A-Za-z]+)', '((?:[^']|'')*)'::jsonb/g;
const macDelSeedSql = () => {
  const sql = readFileSync(path.join(process.cwd(), 'supabase/seed.sql'), 'utf8');
  for (const [, clau, json] of sql.matchAll(FILA)) {
    if (clau === 'marketItems') return JSON.parse(json.replace(/''/g, "'")).find((item) => item.id === 'mac-mini-m4');
  }
  return null;
};
const MAC_CRU = macDelSeedSql();
const variantsDelMacCru = () => [
  ['la fila crua del seed.sql', MAC_CRU],
  ['la fila crua amb el quadrat verd a avatar_url', { ...MAC_CRU, avatar_url: QUADRAT_VERD_SVG }],
  ['la fila crua amb el logotip PNG a avatar_url', { ...MAC_CRU, avatar_url: LOGO }],
  ['la fila crua sense cap avatar', { ...MAC_CRU, avatar_url: undefined }]
];

test('la fila crua del Mac Mini al seed.sql no porta author_avatar (és el cas que es protegix)', () => {
  expect(MAC_CRU).toMatchObject({ id: 'mac-mini-m4', author_name: 'Javi Llinares', author_id: 'javillinares' });
  expect(MAC_CRU).not.toHaveProperty('author_avatar');
});

test.each(variantsDelMacCru())('Mercat, Mur i detall: %s pinta «Javi Llinares» amb la foto, mai el logotip', (_, mac) => {
  // Mercat.
  expect(propsDeTargetaDeProducte(mac)).toMatchObject({ author: 'Javi Llinares', avatarUrl: PERSONA_PILOT.avatar });
  // Mur.
  const delMur = render(<TargetaDelMur item={mac} />).container.querySelector('article');
  expect(boinaDe(delMur)).toEqual({ nom: 'Javi Llinares', avatar: PERSONA_PILOT.avatar });
  cleanup();
  // Detall: la barra taronja (mai el DEFAULT_AUTHOR de PageFrame) i l'avatar redó de davant de l'H1.
  const seccio = buildMercatDetailSectionMeta({ marketItems: [mac], t });
  const pagina = paginaDElement(seccio, mac);
  expect(pagina).toMatchObject({ authorName: 'Javi Llinares', authorAvatar: PERSONA_PILOT.avatar });
  expect(avatarAutorDElement(mac, pagina.authorName, seccio)).toEqual({ src: PERSONA_PILOT.avatar, alt: 'Avatar de Javi Llinares' });
  // La targeta incrustada (SincronitzacioTargetes · propsDeLOriginal) hereta la barra.
  expect(propsDeTargetaDeLaPagina(pagina)).toMatchObject({ author: 'Javi Llinares', avatarUrl: PERSONA_PILOT.avatar });
  for (const marca of [LOGO, QUADRAT_VERD_SVG, DEFAULT_AUTHOR.avatarUrl]) {
    expect(JSON.stringify([propsDeTargetaDeProducte(mac).avatarUrl, pagina.authorAvatar, propsDeTargetaDeLaPagina(pagina).avatarUrl])).not.toContain(marca);
  }
});

test('Mur: un acte de la pilot sense avatar ni nom sencer pinta «Javi Llinares» amb la seua foto, mai el quadrat verd', () => {
  const acte = { id: 'ball', type: 'event', title: 'Ball', date: '2026-11-14', author_name: 'Javi', owner_user_id: 'javillinares' };
  const article = render(<TargetaDelMur item={acte} />).container.querySelector('article');
  expect(boinaDe(article)).toEqual({ nom: 'Javi Llinares', avatar: PERSONA_PILOT.avatar });
  expect(article.innerHTML).not.toContain(DEFAULT_AUTHOR.avatarUrl);
  cleanup();
  // Amb el logotip com a author_avatar, igual.
  const ambMarca = render(<TargetaDelMur item={{ ...acte, id: 'ball-2', author_avatar: LOGO }} />).container.querySelector('article');
  expect(boinaDe(ambMarca)).toEqual({ nom: 'Javi Llinares', avatar: PERSONA_PILOT.avatar });
});

/* Llei del Píxel · Per a qualsevol altre autor, TargetaDelMur no passa cap
   nom ni cap avatar a EventCard: la boina és la de l'EventCard sense les
   props noves, la de sempre. */
test.each([
  ['l’acte de l’entitat (la llavor)', () => EVENTS[0]],
  ['l’acte d’un veí', () => ({ id: 'fira', type: 'event', title: 'Fira', date: '2026-11-14', author_name: 'Pepa', owner_user_id: 'pepa' })],
  ['l’acte de l’entitat amb la pilot com a autora', () => ({ id: 'festa', type: 'event', title: 'Festa', date: '2026-11-14', author_name: 'Sóc de Poble', author_entity_id: 'socdepoble', owner_user_id: 'javillinares' })]
])('Mur: %s es pinta igual que l’EventCard de sempre', (_, acte) => {
  const item = acte();
  const delMur = boinaDe(render(<TargetaDelMur item={item} />).container.querySelector('article'));
  cleanup();
  const deSempre = boinaDe(render(<EventCard item={item} />).container.querySelector('article'));
  expect(delMur).toEqual(deSempre);
  expect(delMur.nom).not.toBe('Javi Llinares');
});
