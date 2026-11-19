import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import '../../../tests/helpers/diccionaris.js';
import { MemoryRouter } from '../../app/contexts/RouterContext.jsx';
import { UIProvider } from '../../app/contexts/UIContext.jsx';
import { carregaDiccionari, createTranslator } from '../../config/i18n.js';
import { AGENTS, AGENTS_MAP } from '../../data/agentsSeed.js';
import DocumentacioHistoricaRentonar from './DocumentacioHistoricaRentonar.jsx';
import ProfileSection from './ProfileSection.jsx';
import {
  altAvatarPerfilPublic,
  altLogotipPerfilPublic,
  etiquetaTipusPerfilPublic
} from './textosPerfilPublic.js';
import { EntitatsDelPoble } from '../pobles/EntitatsDelPoble.jsx';

const m = vi.hoisted(() => ({
  caps: new Set(['directoriEntitats']),
  llista: vi.fn()
}));

vi.mock('../../data/backendPort.js', async (original) => ({
  ...(await original()),
  teCapacitat: (cap) => m.caps.has(cap),
  listPublicOrganizations: (...args) => m.llista(...args)
}));

vi.mock('@/components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: vi.fn() })
}));

vi.mock('../../components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: vi.fn() })
}));

const preparaMatchMedia = () =>
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  );

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Onada R32.10 · Lot 03 · Poliment d’usabilitat i 5 llengües en les 4 fitxes públiques d’entitat', () => {
  test('les píndoles de tipus (Entitat, Grup, IA) i els alts de logotip/avatar es localitzen en les 5 llengües', async () => {
    const esperats = {
      ca: { entitat: 'Entitat', grup: 'Grup', ia: 'Intel·ligència artificial', alt: 'Logotip de Oli de La Torre', av: 'Avatar de IAIA MarIA' },
      es: { entitat: 'Entidad', grup: 'Grupo', ia: 'Inteligencia artificial', alt: 'Logotipo de Oli de La Torre', av: 'Avatar de IAIA MarIA' },
      en: { entitat: 'Organisation', grup: 'Group', ia: 'Artificial intelligence', alt: 'Logo of Oli de La Torre', av: 'Avatar of IAIA MarIA' },
      eu: { entitat: 'Erakundea', grup: 'Taldea', ia: 'Adimen artifiziala', alt: 'Oli de La Torre-(r)en logotipoa', av: 'IAIA MarIA-(r)en abatarra' },
      gl: { entitat: 'Entidade', grup: 'Grupo', ia: 'Intelixencia artificial', alt: 'Logotipo de Oli de La Torre', av: 'Avatar de IAIA MarIA' }
    };

    for (const [codi, valors] of Object.entries(esperats)) {
      await carregaDiccionari(codi);
      const t = createTranslator(codi);
      expect(etiquetaTipusPerfilPublic('entitat', { t, language: codi }), codi).toBe(valors.entitat);
      expect(etiquetaTipusPerfilPublic('grup', { t, language: codi }), codi).toBe(valors.grup);
      expect(etiquetaTipusPerfilPublic('ia', { t, language: codi }), codi).toBe(valors.ia);
      expect(etiquetaTipusPerfilPublic('persona', { t, language: codi }), codi).toBeNull();
      expect(altLogotipPerfilPublic('Oli de La Torre', codi), codi).toBe(valors.alt);
      expect(altAvatarPerfilPublic('IAIA MarIA', codi), codi).toBe(valors.av);
    }
  });

  test('a /rentonar el crom i les pestanyes es traduïxen a les 5 llengües i el document estatutari declara lang="ca" fora del valencià (WCAG 3.1.2)', async () => {
    preparaMatchMedia();
    await carregaDiccionari('en');
    render(
      <UIProvider externalConfig={{ language: 'en' }}>
        <MemoryRouter initialEntries={['/rentonar']}>
          <DocumentacioHistoricaRentonar />
        </MemoryRouter>
      </UIProvider>
    );

    const seccio = screen.getByTestId('documentacio-historica-rentonar');
    expect(seccio.getAttribute('aria-label')).toBe('Historical, statutory and founding archive of El Rentonar');
    expect(within(seccio).getByRole('tab', { name: /History and Registry/i })).toBeTruthy();
    expect(within(seccio).getByRole('tab', { name: /Bylaws in Force/i })).toBeTruthy();
    expect(within(seccio).getByRole('tab', { name: /Assembly Minutes Template/i })).toBeTruthy();
    expect(within(seccio).getByRole('link', { name: /Open the Nature Workspace/i }).getAttribute('href')).toBe('/page/arbres-monumentals');
    expect(seccio.querySelector('header')?.getAttribute('lang')).toBe('ca');
    expect(seccio.querySelector('#panel-rentonar-historia > div[lang="ca"]')).not.toBeNull();
  });

  test('les targetes d’entitats vinculades al poble tenen noms accessibles únics per al xat (WCAG 2.4.4) i no dupliquen el poble al subtítol', async () => {
    preparaMatchMedia();
    m.llista.mockResolvedValueOnce([
      {
        id: '3073b933-69fc-4c3e-80dc-b0df9c6b8391',
        slug: 'olidelatorre',
        name: 'Oli de La Torre',
        kind: 'company',
        lema: 'La Torre de les Maçanes',
        description: '',
        logo_url: '/assets/uploads/brain/oli_de_la_torre_logo.webp',
        hero_url: '',
        town_name: 'La Torre de les Maçanes'
      },
      {
        id: 'rentonar',
        slug: 'rentonar',
        name: 'Rentonar',
        kind: 'group',
        lema: 'Natura i Patrimoni',
        description: 'Grup de treball de l’Associació ecologista El Rentonar.',
        logo_url: '',
        hero_url: '',
        town_name: 'La Torre de les Maçanes'
      }
    ]);

    const { container } = render(
      <UIProvider initialLanguage="ca">
        <MemoryRouter initialEntries={['/pobles/la-torre-de-les-macanes']}>
          <EntitatsDelPoble poble={{ id: 'la-torre-de-les-macanes', title: 'La Torre de les Maçanes' }} />
        </MemoryRouter>
      </UIProvider>
    );

    expect(await screen.findByRole('heading', { name: 'Oli de La Torre' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Anar al xat Oli de La Torre' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Anar al xat Rentonar' })).toBeTruthy();

    const targetes = [...container.querySelectorAll('article.sp-card')];
    const oli = targetes.find((c) => c.querySelector('.sp-card-title')?.textContent === 'Oli de La Torre');
    const rentonar = targetes.find((c) => c.querySelector('.sp-card-title')?.textContent === 'Rentonar');
    expect(oli.querySelector('.sp-card-subtitle')).toBeNull();
    expect(rentonar.querySelector('.sp-card-subtitle')?.textContent).toBe('Natura i Patrimoni');
  });

  test('al directori públic (/perfil), la targeta de Javi Llinares no duplica el poble com a subtítol i les entitats tenen porta de xat amb nom propi', () => {
    preparaMatchMedia();
    const { container } = render(
      <UIProvider initialLanguage="ca">
        <MemoryRouter initialEntries={['/perfil']}>
          <ProfileSection agents={AGENTS} />
        </MemoryRouter>
      </UIProvider>
    );

    const targetaJavi = [...container.querySelectorAll('article.sp-card')].find(
      (c) => c.querySelector('.sp-card-title')?.textContent === AGENTS_MAP.JAVI.name
    );
    expect(targetaJavi.querySelector('.sp-card-author-location')?.textContent).toBe('La Torre de les Maçanes');
    expect(targetaJavi.querySelector('.sp-card-subtitle')).toBeNull();
    expect(screen.getByRole('link', { name: `Anar al xat ${AGENTS_MAP.SOCDEPOBLE.name}` })).toBeTruthy();
  });
});
