/**
 * WikiDePobleV1226.test.jsx — G26-3 · IDEA-364 + D4 Opció B (v1.2.26).
 *
 * Verifica:
 *  1. Paritat completa en les 5 llengües (ca/es/en/eu/gl) i prefixos exclusius
 *     `wikidepobleEsborrany*` i `wikidepobleSkills*`.
 *  2. Document `esborrany: true` → bàner accessible 5L «Esborrany en revisió» +
 *     `<meta name="robots" content="noindex, nofollow">` via `seoWiki.js` + `useSEO`.
 *  3. Contracte `C26-4` (`/md/skills/index.json` + `/md/skills/<name>.md`) carregat
 *     en diferit per `useSkillsPubliques` i `LectorSkillWiki`, amb degradació neta.
 */
import React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import {
  CLAUS_I18N_WIKI_V26,
  DICCIONARIS_I18N_WIKI_V26,
  textosWikiV26
} from './i18nWikiV26.js';
import { esDocumentEsborrany, metadadesDeDocumentPublic, metadadesDeDocumentWiki } from './seoWiki.js';
import {
  CARPETA_SKILLS_ID,
  esUrlSkillSegura,
  itemsICategoriesDeSkills,
  normalitzaIndexSkills,
  resetSkillsPubliquesCachePerTests
} from './useSkillsPubliques.js';
import LectorSkillWiki, { retiraFrontmatterLineal } from './LectorSkillWiki.jsx';

const estat = vi.hoisted(() => ({ id: 'doc_esborrany', search: '?item=doc_esborrany', language: 'ca' }));
vi.mock('../../data/wikiManifest.js', () => ({
  wikiManifest: {
    categories: [{ id: 'folder:01_ser', label: '01 Ser' }],
    items: [
      {
        id: 'doc_esborrany',
        title: 'Protocol en revisió',
        subtitle: 'Esborrany públic',
        categoryId: 'folder:01_ser',
        tags: ['revisio'],
        esborrany: true,
        noindex: true,
        attributes: { status: 'esborrany', description: 'Document de prova en revisió' },
        content: '# Protocol en revisió\n\nText de prova.'
      },
      {
        id: 'doc_canonic',
        title: 'Document canònic',
        categoryId: 'folder:01_ser',
        tags: ['canonic'],
        labels: [{ text: 'Sistema', className: 'sdp-badge-system' }, { text: 'Mur', className: 'sdp-badge-category' }],
        attributes: { status: 'canonic' },
        content: '# Document canònic\n\nText aprovat.'
      }
    ]
  }
}));
vi.mock('../../components/universal/workspace/UniversalWorkspace.jsx', () => ({
  UniversalWorkspace: ({ model, renderDetail }) => {
    const triat = model.items.find((it) => it.id === estat.id) || model.items[0];
    return (
      <div>
        <ul data-testid="wiki-cats">{model.categories.map((c) => <li key={c.id}>{c.id}:{c.label}</li>)}</ul>
        {renderDetail({ item: triat })}
      </div>
    );
  }
}));
vi.mock('../../components/universal/UniversalPage.jsx', () => ({
  UniversalPage: ({ title, labels = [], children }) => (
    <article>
      <header className="page-title"><h1>{title}</h1></header>
      <ul data-testid="page-labels">{labels.map((l, i) => <li key={i}>{typeof l === 'string' ? l : l.text}</li>)}</ul>
      {children}
    </article>
  )
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/wikidepoble', search: estat.search }),
  useRouter: () => ({ basename: '' }),
  Link: ({ to, children, ...rest }) => <a href={to} {...rest}>{children}</a>
}));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ pageCopy: {} }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_k, v) => v, language: estat.language, resolveAsset: (u) => u }),
  useUIActionsOpcional: () => ({ t: (_k, v) => v, language: estat.language, resolveAsset: (u) => u }),
  useUIState: () => ({ externalConfig: { manageDocumentHead: true } })
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../hooks/useSuperadminEstable.js', () => ({ useSuperadminEstable: () => ({ esSuperadmin: false, rolPendent: false }) }));

import WikiDePobleSection from './WikiDePobleSection.jsx';

afterEach(() => {
  cleanup();
  resetSkillsPubliquesCachePerTests();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.head.replaceChildren();
  estat.id = 'doc_esborrany';
  estat.search = '?item=doc_esborrany';
  estat.language = 'ca';
});

describe('G26-3 · i18nWikiV26 (5 llengües i prefix exclusiu)', () => {
  test('les 5 llengües tenen exactament les mateixes claus amb prefix wikidepobleEsborrany* o wikidepobleSkills*', () => {
    const idiomes = ['ca', 'es', 'en', 'eu', 'gl'];
    for (const clau of CLAUS_I18N_WIKI_V26) {
      expect(clau).toMatch(/^wikidepoble(Esborrany|Skills)/);
    }
    for (const idioma of idiomes) {
      expect(Object.keys(DICCIONARIS_I18N_WIKI_V26[idioma]).sort()).toEqual([...CLAUS_I18N_WIKI_V26].sort());
      for (const valor of Object.values(DICCIONARIS_I18N_WIKI_V26[idioma])) {
        expect(typeof valor).toBe('string');
        expect(valor.trim().length).toBeGreaterThan(0);
      }
    }
    expect(textosWikiV26('en').wikidepobleEsborranyTitol).toBe('Draft under review');
    expect(textosWikiV26('eu').wikidepobleEsborranyTitol).toBe('Zirriborroa berrikuspenean');
  });
});

describe('G26-3 · IDEA-364 Esborrany en revisió + noindex', () => {
  test('esDocumentEsborrany i seoWiki marquen index: false només quan el document és esborrany', () => {
    const esb = { id: 'a', esborrany: true, attributes: { status: 'esborrany' }, content: '# Prova' };
    const can = { id: 'b', attributes: { status: 'canonic' }, content: '# Canònic' };
    expect(esDocumentEsborrany(esb)).toBe(true);
    expect(esDocumentEsborrany(can)).toBe(false);
    expect(metadadesDeDocumentPublic(esb).index).toBe(false);
    expect(metadadesDeDocumentPublic(can).index).toBe(true);
    expect(metadadesDeDocumentWiki(esb, '?item=a', [esb, can]).index).toBe(false);
    expect(metadadesDeDocumentWiki(can, '?item=b', [esb, can]).index).toBe(true);
  });

  test('WikiDePobleSection mostra el bàner 5L d’esborrany i injecta meta robots noindex', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 })));
    estat.language = 'es';
    render(<WikiDePobleSection />);
    expect(screen.getByText('Borrador en revisión')).toBeTruthy();
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex, nofollow');
  });

  test('WikiDePobleSection respecta item.labels (costura wikiAlMur)', () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 })));
    estat.id = 'doc_canonic';
    estat.search = '?item=doc_canonic';
    render(<WikiDePobleSection />);
    const labels = [...screen.getByTestId('page-labels').querySelectorAll('li')].map((li) => li.textContent);
    expect(labels).toEqual(['Sistema', 'Mur']);
  });
});

describe('G26-3 · D4 Opció B Lector diferit de skills públiques (contracte C26-4)', () => {
  test('validació de seguretat URL, normalització i agrupació de skills', () => {
    expect(esUrlSkillSegura('/md/skills/core-identitat.md')).toBe(true);
    expect(esUrlSkillSegura('/md/skills/../secret.md')).toBe(false);
    expect(esUrlSkillSegura('https://evil.test/x.md')).toBe(false);
    expect(retiraFrontmatterLineal('---\nname: a\n---\n# Títol\nCos')).toBe('# Títol\nCos');

    const index = normalitzaIndexSkills({
      generatedAt: '1970-01-01T00:00:00Z',
      total: 2,
      skills: [
        { name: 'core-identitat', title: 'Identitat', description: 'Nucli', tags: ['core'], core: true, url: '/md/skills/core-identitat.md', bytes: 2048 },
        { name: 'sdp-pedra-seca', title: 'Pedra Seca', description: 'Disseny', tags: ['ui'], core: false, url: '/md/skills/sdp-pedra-seca.md', bytes: 4096 }
      ]
    });
    const { categories, items } = itemsICategoriesDeSkills(index.skills, textosWikiV26('ca'));
    expect(categories.map((c) => c.id)).toEqual([CARPETA_SKILLS_ID, 'folder:skills/core', 'folder:skills/sdp']);
    expect(items.map((i) => i.id)).toEqual(['skill:core-identitat', 'skill:sdp-pedra-seca']);
  });

  test('carrega /md/skills/index.json i obri el lector diferit /md/skills/<name>.md', async () => {
    const fetchMock = vi.fn(async (url) => {
      if (String(url).endsWith('/md/skills/index.json')) {
        return {
          ok: true,
          json: async () => ({
            generatedAt: '1970-01-01T00:00:00Z',
            total: 1,
            skills: [{
              name: 'core-identitat',
              title: 'Identitat de la IAIA',
              description: 'Bootstrap operatiu',
              tags: ['core', 'identitat'],
              core: true,
              url: '/md/skills/core-identitat.md',
              bytes: 1536
            }]
          })
        };
      }
      if (String(url).endsWith('/md/skills/core-identitat.md')) {
        return {
          ok: true,
          text: async () => '---\nname: core-identitat\n---\n# Identitat de la IAIA\n\nCos real verificat del tractor.'
        };
      }
      return { ok: false, status: 404 };
    });
    vi.stubGlobal('fetch', fetchMock);
    estat.id = 'skill:core-identitat';
    estat.search = '?item=skill%3Acore-identitat';

    render(<WikiDePobleSection />);
    await waitFor(() => expect(screen.getByText('Cos real verificat del tractor.')).toBeTruthy());
    expect(screen.getByRole('link', { name: /Baixar Markdown/i }).getAttribute('href')).toBe('/md/skills/core-identitat.md');
    expect(screen.getByRole('link', { name: /Vore al graf de la Consola/i }).getAttribute('href')).toBe('/consola/explorador?peca=skill%3Acore-identitat');
    // v1.2.26 · G26-3 · Obligacions de TELLADO-R3214-40: sense galetes, sense redirecció i sense cap capçalera d'autenticació.
    const crida = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/md/skills/core-identitat.md'));
    expect(crida?.[1]).toMatchObject({ credentials: 'omit', redirect: 'error' });
    expect(Object.keys(crida?.[1]?.headers || {})).toEqual(['Accept']);
  });

  test('una URL de skill fora de /md/skills/ no fa cap petició i mostra l’avís d’error (TELLADO-R3214-40)', () => {
    const fetchMock = vi.fn(async () => ({ ok: true, text: async () => '# Intrús' }));
    vi.stubGlobal('fetch', fetchMock);
    for (const url of ['https://evil.test/x.md', '/md/skills/../secret.md', '//evil.test/md/skills/x.md']) {
      render(<LectorSkillWiki item={{ id: 'skill:x', skill: { name: 'x', url } }} />);
      expect(screen.getByText(textosWikiV26('ca').wikidepobleSkillsErrorFitxa)).toBeTruthy();
      expect(screen.queryByRole('link', { name: /Baixar Markdown/i })).toBeNull();
      cleanup();
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
