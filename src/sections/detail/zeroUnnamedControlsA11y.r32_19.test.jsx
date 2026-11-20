import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('leaflet/dist/leaflet.css?inline', async () => {
  const { readFileSync } = await import('node:fs');
  const { createRequire } = await import('node:module');
  return { default: readFileSync(createRequire(import.meta.url).resolve('leaflet/dist/leaflet.css'), 'utf8') };
});
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({
  useCoreContent: () => ({ status: 'ready', towns: [{ title: 'La Torre de les Maçanes' }] })
}));

import { MemoryRouter } from '../../app/contexts/RouterContext';
import { UIProvider } from '../../app/contexts/UIContext';
import { createTranslator } from '../../config/i18n.js';
import { UniversalCard } from '../../components/PedraSeca/organismes/UniversalCard.jsx';
import {
  TEXTOS_ENLLACOS_TARGETA_5_LLENGUES,
  etiquetaAutorTargeta,
  etiquetaCategoriaTargeta,
  etiquetaDretsTargeta
} from '../../components/PedraSeca/organismes/textosEnllacosTargeta.js';
import { InstalaLaPwa, TEXTOS_BOTIGUES_5_LLENGUES } from './InstalaLaPwa.jsx';
import { PublicarMapaExempleShowcase, PublicarMapaMapaShowcase } from './PublicarMapaShowcase.jsx';
import { RegistrationStep } from '../onboarding/OnboardingSteps.jsx';
import '../../../tests/helpers/diccionaris.js';

const IDIOMES = ['ca', 'es', 'en', 'eu', 'gl'];

function comptaControlsSenseNom(arrel, { simulaForaDePlec = false } = {}) {
  const selector = 'button,a[href],input,select,textarea,[role="button"],[role="tab"]';
  const senseNom = [];
  for (const ctrl of arrel.querySelectorAll(selector)) {
    const textIntern = simulaForaDePlec ? '' : (ctrl.textContent || '');
    const label = (
      ctrl.getAttribute('aria-label') ||
      ctrl.getAttribute('title') ||
      ctrl.getAttribute('placeholder') ||
      textIntern ||
      ''
    ).trim();
    if (!label && !ctrl.getAttribute('aria-labelledby')) {
      senseNom.push(ctrl.outerHTML.slice(0, 140));
    }
  }
  return senseNom;
}

beforeEach(() => {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }));
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('R32.19 Lot 2 · Zero unnamed_controls en les 5 llengües (ca, es, en, eu, gl)', () => {
  test.each(IDIOMES)('UniversalCard conserva noms accessibles en tots els enllaços sota content-visibility:auto (%s)', (idioma) => {
    const { container } = render(
      <UIProvider externalConfig={{ language: idioma }}>
        <MemoryRouter rutaInicial="/mercat">
          <UniversalCard
            author="Oli de La Torre"
            location="La Torre de les Maçanes"
            authorHref="/empresa/oli-de-la-torre"
            title="Oli Verge Extra"
            subtitle="Collita pròpia"
            body="Premsat en fred."
            mainHref="/mercat/oli"
            copyright="CC BY-NC-SA 4.0 · Sóc de Poble"
            labels={[
              { text: 'Alimentació', href: '/mercat?cat=alimentacio' },
              { text: 'Viquipèdia', href: 'https://ca.wikipedia.org/wiki/La_Torre_de_les_Ma%C3%A7anes' }
            ]}
            hasFooter={true}
          />
        </MemoryRouter>
      </UIProvider>
    );

    expect(comptaControlsSenseNom(container, { simulaForaDePlec: true })).toEqual([]);
    const enllacAutor = container.querySelector('a.sp-card-author-link');
    expect(enllacAutor.getAttribute('aria-label')).toBe(
      `Oli de La Torre, La Torre de les Maçanes · ${TEXTOS_ENLLACOS_TARGETA_5_LLENGUES[idioma].perfilPublic}`
    );
    expect(etiquetaAutorTargeta({ author: 'Pepa', idioma })).toBe(
      `Pepa · ${TEXTOS_ENLLACOS_TARGETA_5_LLENGUES[idioma].perfilPublic}`
    );
    expect(etiquetaCategoriaTargeta('', idioma)).toBe(TEXTOS_ENLLACOS_TARGETA_5_LLENGUES[idioma].categoria);
    expect(etiquetaDretsTargeta('', idioma)).toBe(TEXTOS_ENLLACOS_TARGETA_5_LLENGUES[idioma].dretsAutor);
  });

  test.each(IDIOMES)('InstalaLaPwa agrupa semànticament els canals de botiga i garantix 0 controls sense nom (%s)', (idioma) => {
    const instalacio = {
      mode: 'ios',
      instala: async () => 'dismissed',
      canals: [
        { id: 'app-store', nom: 'App Store', url: 'https://apps.apple.com/es/app/soc-de-poble/id6740000000' },
        { id: 'wordpress-org', nom: 'WordPress.org', url: 'https://wordpress.org/plugins/soc-de-poble/' },
        { id: 'canal-buit', nom: '', url: 'https://socdepoble.org/descarrega' }
      ]
    };
    const { container } = render(
      <UIProvider externalConfig={{ language: idioma }}>
        <InstalaLaPwa instalacio={instalacio} lloc="dalt" />
      </UIProvider>
    );

    const grup = screen.getByRole('group', { name: TEXTOS_BOTIGUES_5_LLENGUES[idioma].grup });
    expect(grup).toBeTruthy();
    const enllacos = [...grup.querySelectorAll('a')];
    expect(enllacos[0].hasAttribute('aria-label')).toBe(false);
    expect(enllacos[1].hasAttribute('aria-label')).toBe(false);
    expect(enllacos[2].getAttribute('aria-label')).toBe(TEXTOS_BOTIGUES_5_LLENGUES[idioma].canalReserva);
    expect(comptaControlsSenseNom(container)).toEqual([]);
  });

  test.each(IDIOMES)('PublicarMapaShowcase + MapaFotografic tenen 0 controls sense nom fins i tot fora de plec (%s)', (idioma) => {
    const { container } = render(
      <UIProvider externalConfig={{ language: idioma }}>
        <MemoryRouter rutaInicial="/page/publicar_mapa">
          <PublicarMapaMapaShowcase />
          <PublicarMapaExempleShowcase />
        </MemoryRouter>
      </UIProvider>
    );

    const lliscador = container.querySelector('input.sdp-mapa__lliscador[type="range"]');
    expect(lliscador).not.toBeNull();
    expect(Boolean(lliscador.getAttribute('aria-labelledby'))).toBe(true);
    expect(Boolean(lliscador.getAttribute('aria-label'))).toBe(true);
    expect(comptaControlsSenseNom(container)).toEqual([]);
    const targetaExemple = container.querySelector('[data-testid="publicar-mapa-universal-card-arbre"]');
    expect(comptaControlsSenseNom(targetaExemple, { simulaForaDePlec: true })).toEqual([]);
  });

  test.each(IDIOMES)('RegistrationStep (modes entrar i crear) té tots els camps vinculats amb aria-labelledby (%s)', (idioma) => {
    const t = createTranslator(idioma);
    const verificaCampsVinculats = (arrel) => {
      expect(comptaControlsSenseNom(arrel)).toEqual([]);
      for (const camp of arrel.querySelectorAll('input, select')) {
        const idEtiqueta = camp.getAttribute('aria-labelledby');
        expect(Boolean(idEtiqueta)).toBe(true);
        const etiqueta = arrel.querySelector(`#${idEtiqueta}`);
        expect(etiqueta?.textContent?.trim().length).toBeGreaterThan(0);
      }
    };

    const { container: loginDom } = render(
      <MemoryRouter rutaInicial="/el-meu-perfil">
        <RegistrationStep modeInicial="entrar" t={t} onLogin={() => {}} onRegister={() => {}} />
      </MemoryRouter>
    );
    verificaCampsVinculats(loginDom);
    cleanup();

    const { container: regDom } = render(
      <MemoryRouter rutaInicial="/registre">
        <RegistrationStep modeInicial="crear" t={t} onLogin={() => {}} onRegister={() => {}} />
      </MemoryRouter>
    );
    verificaCampsVinculats(regDom);
  });
});
