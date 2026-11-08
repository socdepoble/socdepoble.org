/* R51 (P0-46 / IDEA-177; forats G1 i G1b de l'auditoria R11) · Un ACTE
   (type 'event') del Mur passa pel pla del contracte com una publicació.
   Abans EventCard posava Traduir sempre (showTranslate={true}) i l'article no
   portava translate="no": amb 'none', la revisada o un mode invàlid, el
   Traduir de la targeta i el de la pàgina enviaven el text de l'acte al
   motor. Ara: sense mode o amb l'automàtica, el Traduir de sempre; amb un
   mode protegit, cap Traduir, translate="no" a l'article (el de la pàgina no
   n'envia cap text) i, amb un error, l'avís a la targeta. Els arnesos de
   TargetaDelMur.traduccioR51.test.jsx (targeta) i
   TargetaDelMur.traduccioPagina.test.jsx (pàgina). */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext';

const mocks = vi.hoisted(() => ({ toast: vi.fn(), externalConfig: {} }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa, language: 'ca' }),
  useUIState: () => ({ externalConfig: mocks.externalConfig })
}));
vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: () => false,
  loadPerfilPublic: async () => null
}));
import { UniversalPage } from '../../components/universal/UniversalPage.jsx';
import { buidaCauTraduccions } from '../../components/PedraSeca/hooks/useTraduccioPagina.js';
import { NOM_MENU_TRADUIR } from '../../components/universal/traduccio/MenuTraduir.jsx';
import { fixaCarregadorLliure, fixaTraductorLliure } from '../../data/traductorDelLloc.js';
import { TargetaDelMur } from './TargetaDelMur.jsx';

const AVIS = 'Esta publicació no té la traducció ben configurada: es mostra en la llengua original, sense traducció automàtica.';
const revisades = Object.fromEntries(['ca', 'es', 'en', 'eu', 'gl']
  .map((codi) => [codi, { title: `Fira revisada ${codi}`, content: `<p>Cos revisat ${codi}</p>`, reviewed: true }]));
const acte = (id, title, extra = {}) => ({ id, type: 'event', title, description: `Entradeta de ${title}`, date: '2026-10-17', ...extra });
const DE_SEMPRE = acte('a-sempre', 'Fira de sempre');
const AUTOMATICA = acte('a-auto', 'Fira automàtica', { translation_mode: 'on_the_fly', source_language: 'ca' });
const SENSE = acte('a-cap', 'Fira sense traducció', { translation_mode: 'none', source_language: 'ca' });
const REVISADA = acte('a-rev', 'Feria original', { translation_mode: 'curated_5_langs', source_language: 'es', translations: revisades });
const INVALIDA = acte('a-err', 'Fira mal configurada', { translation_mode: 'auto', source_language: 'ca' });

let motor;
beforeEach(() => {
  mocks.toast.mockReset();
  mocks.externalConfig = {};
  buidaCauTraduccions();
  motor = {
    disponible: true,
    comprovaPagina: vi.fn(),
    tradueix: vi.fn(async (textos, desti) => ({ traduccions: textos.map((text) => `[${desti}] ${text}`), desti, cache: false }))
  };
  fixaTraductorLliure('apertium');
  fixaCarregadorLliure(async () => ({ creaTraductorApertium: () => motor }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  fixaTraductorLliure(null);
  fixaCarregadorLliure(null);
});

const pinta = (item) => render(<MemoryRouter rutaInicial="/mur"><TargetaDelMur item={item} /></MemoryRouter>).container;
const accions = (arrel) => [...arrel.querySelectorAll('.sp-card-footer button')].map((boto) => boto.getAttribute('aria-label'));

describe('G1 · la targeta d’un acte al Mur', () => {
  test.each([
    ['none', SENSE],
    ['la revisada', REVISADA],
    ['un mode que no existix', INVALIDA]
  ])('amb %s: cap Traduir a la targeta de l’acte, la resta del peu igual, i cap crida al motor', (_, item) => {
    const arrel = pinta(item);
    const titol = arrel.querySelector('.sp-card-title').textContent;
    expect(accions(arrel)).toEqual([`Comentar ${titol}`, `Compartir ${titol}`, `Connectar amb ${titol}`]);
    expect(motor.tradueix).toHaveBeenCalledTimes(0);
  });

  test('la revisada: el títol revisat de la llengua de la interfície; un mode invàlid: l’original i l’avís, sense regió viva', () => {
    expect(pinta(REVISADA).querySelector('.sp-card-title').textContent).toBe('Fira revisada ca');
    cleanup();
    const arrel = pinta(INVALIDA);
    expect(arrel.querySelector('.sp-card-title').textContent).toBe('Fira mal configurada');
    expect(arrel.textContent).toContain(AVIS);
    expect(arrel.textContent).toContain('Entradeta de Fira mal configurada');
    expect(arrel.querySelector('[role="status"], [role="alert"]')).toBeNull();
  });

  test.each([
    ['sense mode (el de sempre)', DE_SEMPRE],
    ['amb l’automàtica', AUTOMATICA]
  ])('%s: Traduir hi és i traduïx l’acte', async (_, item) => {
    const arrel = pinta(item);
    expect(accions(arrel)[0]).toBe(`Traduir ${item.title}`);
    expect(arrel.textContent).not.toContain(AVIS);
    act(() => { arrel.querySelector(`[aria-label="Traduir ${item.title}"]`).click(); });
    const castella = [...arrel.querySelectorAll('[role="menuitemradio"]')].find((opcio) => opcio.textContent.includes('Castellà'));
    await act(async () => { castella.click(); });
    await waitFor(() => expect(arrel.querySelector('.sp-card-title').textContent).toBe(`[ES] ${item.title}`));
    expect(motor.tradueix).toHaveBeenCalled();
  });
});

describe('G1b · l’atribut translate de l’acte i el Traduir de la pàgina', () => {
  test.each([
    ['sense mode', DE_SEMPRE, null],
    ['l’automàtica', AUTOMATICA, null],
    ['«none»', SENSE, 'no'],
    ['la revisada', REVISADA, 'no'],
    ['un mode que no existix', INVALIDA, 'no']
  ])('%s: translate de l’article de l’acte', (_, item, esperat) => {
    expect(pinta(item).querySelector('article').getAttribute('translate')).toBe(esperat);
  });

  test('el Traduir de la pàgina només envia els actes sense mode o amb l’automàtica', async () => {
    mocks.externalConfig = { traductorUrl: '/wp-json/socdepoble/v1/traduir' };
    const fetch = vi.fn(async (_, { body }) => {
      const { textos, desti } = JSON.parse(body);
      return { ok: true, status: 200, json: async () => ({ traduccions: textos.map((text) => `[ES] ${text}`), origen: 'CA', desti, cache: false }) };
    });
    vi.stubGlobal('fetch', fetch);
    const { container } = render(
      <MemoryRouter rutaInicial="/mur">
        <UniversalPage chrome="context" title="Mur del poble">
          <div className="sdp-card-grid">
            {[DE_SEMPRE, AUTOMATICA, SENSE, REVISADA, INVALIDA].map((item) => <TargetaDelMur key={item.id} item={item} />)}
          </div>
        </UniversalPage>
      </MemoryRouter>
    );
    fireEvent.click(container.querySelector('header.bar-blue button[aria-label="Traduir"]'));
    await act(async () => {
      fireEvent.click(within(screen.getByRole('menu', { name: NOM_MENU_TRADUIR })).getByRole('menuitemradio', { name: 'Castellà' }));
    });
    expect(fetch).toHaveBeenCalled();
    const textos = fetch.mock.calls.flatMap(([, { body }]) => JSON.parse(body).textos);
    const enviat = textos.join('\n');
    expect(textos).toContain('Fira de sempre');
    expect(textos).toContain('Fira automàtica');
    for (const fora of [
      'Fira sense traducció', 'Entradeta de Fira sense traducció',
      'Fira revisada ca', 'Feria original', 'Entradeta de Feria original',
      'Fira mal configurada', 'Entradeta de Fira mal configurada', 'no té la traducció ben configurada'
    ]) expect(enviat, fora).not.toContain(fora);
  });
});
