/* V2-01 (verificació de R51) · El Traduir de la PÀGINA (PageFrame ·
   useTraduccioPagina · blocsTraduibles) enviava al motor el text de les
   targetes que no s'han de traduir: amb translation_mode 'none', amb la
   revisada (curated_5_langs) o amb una configuració invàlida. Ara la targeta
   del Mur porta translate="no" a l'article i cap text seu no ix: només el
   títol de la pàgina i les targetes sense mode o amb l'automàtica. La
   targeta del Mercat, igual. Router de veres (MemoryRouter) i el servei de
   traducció de l'amfitrió, amb un fetch de prova. */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext';

const mocks = vi.hoisted(() => ({ toast: vi.fn() }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa, language: 'ca' }),
  useUIState: () => ({ externalConfig: { traductorUrl: '/wp-json/socdepoble/v1/traduir' } })
}));
vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: () => false,
  loadPerfilPublic: async () => null
}));
import { UniversalPage } from '../../components/universal/UniversalPage.jsx';
import { buidaCauTraduccions } from '../../components/PedraSeca/hooks/useTraduccioPagina.js';
import { NOM_MENU_TRADUIR } from '../../components/universal/traduccio/MenuTraduir.jsx';
import { TargetaDelMur } from './TargetaDelMur.jsx';
import { TargetaDelMercat } from '../mercat/TargetaDelMercat.jsx';

const CREAT = '2026-10-20T10:00:00.000Z';
const revisades = Object.fromEntries(['ca', 'es', 'en', 'eu', 'gl']
  .map((codi) => [codi, { title: `Crònica revisada ${codi}`, content: `<p>Cos revisat ${codi}</p>`, reviewed: true }]));
const DE_SEMPRE = { id: 'p-sempre', type: 'feed', title: 'Festa de sempre', description: 'Entradeta de sempre', created_at: CREAT };
const AUTOMATICA = { id: 'p-auto', type: 'feed', title: 'Festa automàtica', description: 'Entradeta automàtica', created_at: CREAT, translation_mode: 'on_the_fly', source_language: 'ca' };
const SENSE = { id: 'p-cap', type: 'feed', title: 'Crònica sense traducció', description: 'Entradeta que no es traduïx', created_at: CREAT, translation_mode: 'none', source_language: 'ca' };
const REVISADA = { id: 'p-rev', type: 'feed', title: 'Crónica original', description: 'Entradilla original', created_at: CREAT, translation_mode: 'curated_5_langs', source_language: 'es', translations: revisades };
const INVALIDA = { id: 'p-err', type: 'feed', title: 'Crònica mal configurada', description: 'Entradeta amb error', created_at: CREAT, translation_mode: 'auto', source_language: 'ca' };
const PRODUCTE_SENSE = { id: 'm-cap', type: 'market', title: 'Mel sense traducció', description: 'Mel que no es traduïx', created_at: CREAT, translation_mode: 'none', source_language: 'ca' };
const PRODUCTE = { id: 'm-sempre', type: 'market', title: 'Mel de sempre', description: 'Mel de romer', created_at: CREAT };

const respostaJson = (cos) => ({ ok: true, status: 200, json: async () => cos });

beforeEach(() => {
  mocks.toast.mockReset();
  buidaCauTraduccions();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function textosEnviats(fills) {
  const fetch = vi.fn(async (_, { body }) => {
    const { textos, desti } = JSON.parse(body);
    return respostaJson({ traduccions: textos.map((text) => `[ES] ${text}`), origen: 'CA', desti, cache: false });
  });
  vi.stubGlobal('fetch', fetch);
  const { container } = render(
    <MemoryRouter rutaInicial="/mur">
      <UniversalPage chrome="context" title="Mur del poble">
        <div className="sdp-card-grid">{fills}</div>
      </UniversalPage>
    </MemoryRouter>
  );
  fireEvent.click(container.querySelector('header.bar-blue button[aria-label="Traduir"]'));
  await act(async () => {
    fireEvent.click(within(screen.getByRole('menu', { name: NOM_MENU_TRADUIR })).getByRole('menuitemradio', { name: 'Castellà' }));
  });
  expect(fetch).toHaveBeenCalled();
  return { container, textos: fetch.mock.calls.flatMap(([, { body }]) => JSON.parse(body).textos) };
}

test('V2-01 · el Traduir de la pàgina només envia les targetes sense mode o amb l’automàtica', async () => {
  const { container, textos } = await textosEnviats([DE_SEMPRE, AUTOMATICA, SENSE, REVISADA, INVALIDA]
    .map((item) => <TargetaDelMur key={item.id} item={item} />));
  const enviat = textos.join('\n');
  expect(textos).toContain('Mur del poble');
  expect(textos).toContain('Festa de sempre');
  expect(textos).toContain('Festa automàtica');
  for (const fora of [
    'Crònica sense traducció', 'Entradeta que no es traduïx',
    'Crònica revisada ca', 'Crónica original', 'Entradilla original',
    'Crònica mal configurada', 'Entradeta amb error', 'no té la traducció ben configurada'
  ]) expect(enviat, fora).not.toContain(fora);
  // Les tres targetes que no es traduïxen porten l'atribut estàndard; les altres dues, no.
  const perTitol = (titol) => [...container.querySelectorAll('article.content-wrapper:not(.sdp-traduccio-cos) .sdp-card-grid > article')]
    .find((article) => article.querySelector('.sp-card-title')?.textContent === titol);
  expect(perTitol('Festa de sempre').hasAttribute('translate')).toBe(false);
  expect(perTitol('Festa automàtica').hasAttribute('translate')).toBe(false);
  for (const titol of ['Crònica sense traducció', 'Crònica revisada ca', 'Crònica mal configurada']) {
    expect(perTitol(titol).getAttribute('translate'), titol).toBe('no');
  }
});

test('V2-01 · la targeta del Mercat: amb «none», ni Traduir a la targeta ni cap text cap al motor; sense mode, igual que sempre', async () => {
  const { container, textos } = await textosEnviats([PRODUCTE, PRODUCTE_SENSE].map((item) => <TargetaDelMercat key={item.id} item={item} />));
  const enviat = textos.join('\n');
  expect(textos).toContain('Mel de sempre');
  expect(enviat).not.toContain('Mel sense traducció');
  expect(enviat).not.toContain('Mel que no es traduïx');
  const articles = [...container.querySelectorAll('article.content-wrapper:not(.sdp-traduccio-cos) .sdp-card-grid > article')];
  const [deSempre, sense] = articles;
  expect(deSempre.hasAttribute('translate')).toBe(false);
  expect(sense.getAttribute('translate')).toBe('no');
  const accions = (article) => [...article.querySelectorAll('.sp-card-footer button')].map((boto) => boto.getAttribute('aria-label'));
  expect(accions(deSempre).some((nom) => nom.startsWith('Traduir'))).toBe(true);
  expect(accions(sense).some((nom) => nom.startsWith('Traduir'))).toBe(false);
});
