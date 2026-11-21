/* Salut · Onada R32.24 · T3 (Triatge i reparació Node 0 R769–R985):
   · R922: Alertes («Per què veig açò?») enllaça aria-expanded + aria-controls cap al bloc explicatiu.
   · R917: DialegExportacio informa l'error quan navigator.share falla per causa distinta d'AbortError.
   · R915 / R976: ValoracioSetmanal formata el títol de la setmana en l'idioma actiu i blinda desa contra cursa doble. */
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ENTORN_OBERT, muntaPlataforma } from '../../plataforma/__fixtures__/munta.jsx';
import { _reiniciaPreferencies } from '../../plataforma/preferenciesApps.js';
import { creaRegistre } from '../../plataforma/registreApps.js';
import AppSalut from '../AppSalut.jsx';
import { etiquetaDataSalut, textosSalut } from '../i18nSalut.js';
import { creaMagatzemSalut, desaMeta } from '../magatzem.js';
import manifestSalut from '../manifest.js';

const ENTORN = Object.freeze({ ...ENTORN_OBERT, produccio: false });
const ARA = new Date(2026, 9, 5, 9, 30);
let magatzem;
let comptadorId;

function muntaSalut(url, { language = 'ca' } = {}) {
  const App = () => (
    <AppSalut
      magatzem={magatzem}
      rellotge={() => ARA}
      ofsetDe={() => 120}
      nouId={() => {
        comptadorId += 1;
        return `00000000-0000-4000-8000-${String(comptadorId).padStart(12, '0')}`;
      }}
    />
  );
  const registre = creaRegistre({
    internes: [{ ...manifestSalut, carrega: () => Promise.resolve({ default: App }) }],
  });
  muntaPlataforma(url, {
    registre,
    entorn: ENTORN,
    externalConfig: { language },
  });
}

beforeEach(async () => {
  comptadorId = 0;
  window.localStorage.clear();
  _reiniciaPreferencies();
  magatzem = creaMagatzemSalut({ idb: null, navegador: null, Canal: null });
  await desaMeta(magatzem, 'avis', { acceptatA: '2026-10-01T08:00:00.000Z', versio: 1 });
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
});

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Onada R32.24 · T3 · Salut (R915, R917, R922, R976)', () => {
  test('Resum enllaça aria-controls al detall desplegable de «Per què veig açò?»', async () => {
    await magatzem.desa('apunts', {
      id: '00000000-0000-4000-8000-000000000999',
      tipus: 'observacio',
      que: 'temperatura',
      temperaturaDecimes: 385,
      jornada: '2026-10-05',
      moment: '2026-10-05T08:00',
      ofsetMin: 120,
    });

    muntaSalut('/app/salut/resum?des=2026-10-03&dies=3');

    const botoPerQue = (await screen.findAllByRole('button', { name: 'Per què veig açò?' }))[0];
    expect(botoPerQue.getAttribute('aria-expanded')).toBe('false');
    expect(botoPerQue.getAttribute('aria-controls')).toBeNull();

    fireEvent.click(botoPerQue);
    expect(botoPerQue.getAttribute('aria-expanded')).toBe('true');
    const idDetall = botoPerQue.getAttribute('aria-controls');
    expect(idDetall).toBeTruthy();
    expect(document.getElementById(idDetall)).not.toBeNull();
  });

  test('DialegExportacio informa l’usuari quan navigator.share falla amb error real i calla en AbortError', async () => {
    const abortErr = Object.assign(new Error('Cancel·lat'), { name: 'AbortError' });
    const shareMock = vi
      .fn()
      .mockRejectedValueOnce(abortErr)
      .mockRejectedValueOnce(new Error('Share system error'));
    Object.defineProperty(window.navigator, 'canShare', {
      value: () => true,
      configurable: true,
    });
    Object.defineProperty(window.navigator, 'share', {
      value: shareMock,
      configurable: true,
    });

    muntaSalut('/app/salut/full?des=2026-10-03&dies=3');

    fireEvent.click(await screen.findByRole('button', { name: 'Exporta' }));
    const dialeg = await screen.findByRole('dialog', { name: 'Exportar el full per al metge' });
    const botoCompartix = within(dialeg).getByRole('button', { name: 'Compartix' });

    await act(async () => {
      fireEvent.click(botoCompartix);
    });
    expect(shareMock).toHaveBeenCalledTimes(1);
    expect(within(dialeg).queryByText(textosSalut('ca').sistemaNoCompartix)).toBeNull();

    await act(async () => {
      fireEvent.click(botoCompartix);
    });
    expect(shareMock).toHaveBeenCalledTimes(2);
    expect(await within(dialeg).findByText(textosSalut('ca').sistemaNoCompartix)).toBeTruthy();
  });

  test('ValoracioSetmanal formata la capçalera en l’idioma actiu (en) i evita doble desament simultani', async () => {
    let resolDesa;
    const desaOriginal = magatzem.desa.bind(magatzem);
    const espiaValoracions = vi.fn();
    vi.spyOn(magatzem, 'desa').mockImplementation((taula, registre) => {
      if (taula === 'valoracions') {
        espiaValoracions();
        return new Promise((resolve) => {
          resolDesa = () => resolve(desaOriginal(taula, registre));
        });
      }
      return desaOriginal(taula, registre);
    });

    muntaSalut('/app/salut/agitacio/setmanal/2026-10-05', { language: 'en' });

    const titolEsperat = textosSalut('en').setmanaDel(etiquetaDataSalut('2026-10-05', 'en'));
    expect(await screen.findByText(titolEsperat)).toBeTruthy();
    const detall = within(document.getElementById('app-grid-main'));

    const botoDesa = detall.getByRole('button', { name: textosSalut('en').desa });
    fireEvent.click(botoDesa);
    fireEvent.click(botoDesa);

    await waitFor(() => expect(espiaValoracions).toHaveBeenCalledTimes(1));
    expect(botoDesa.disabled).toBe(true);

    await act(async () => {
      resolDesa();
    });
    await waitFor(() => expect(botoDesa.disabled).toBe(false));
  });
});
