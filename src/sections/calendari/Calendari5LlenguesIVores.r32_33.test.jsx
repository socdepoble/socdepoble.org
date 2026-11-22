import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext';
import { CalendariDelPoble } from './CalendariDelPoble.jsx';
import { entradesDelCalendari } from './calendariGlobal.js';
import { localeCalendariDe } from './desplegableEsdevenimentsCalendariModel.js';
import { estatDeLaUrl } from './estatCalendari.js';
import { CODIS_IDIOMA_CALENDARI, textosCalendariPoble } from './i18nCalendariDelPoble.js';

vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa }),
  useUIState: () => ({ externalConfig: {} }),
  useUIStateOpcional: () => ({ language: 'ca', externalConfig: {} }),
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));

const AVUI = new Date(2026, 9, 1);
const FIRA = { id: 'fira', type: 'event', title: 'Fira de tardor', date: '2026-10-17' };
const ENTRADES = entradesDelCalendari([FIRA]);

afterEach(cleanup);

describe('Onada R32.33 · Calendari · barra de navegacio, 5 vistes, regions ARIA i buits en 5 llengues', () => {
  test('localeCalendariDe normalitza codis amb regio o desconeguts sense llancar RangeError', () => {
    expect(localeCalendariDe('ca-ES')).toBe('ca-ES');
    expect(localeCalendariDe('es-ES')).toBe('es-ES');
    expect(localeCalendariDe('en-US')).toBe('en-GB');
    expect(localeCalendariDe('eu_ES')).toBe('eu-ES');
    expect(localeCalendariDe('gl-ES')).toBe('gl-ES');
    expect(localeCalendariDe('')).toBe('ca-ES');
    expect(localeCalendariDe('fr-FR')).toBe('ca-ES');
  });

  test.each(CODIS_IDIOMA_CALENDARI)(
    'CalendariDelPoble en %s tradueix fletxes, selector de vistes, recompte i avisos conservant ca identic',
    (lang) => {
      const tx = textosCalendariPoble(lang);
      const estat = estatDeLaUrl({ vista: 'mes', mes: '2026-10' }, { avui: AVUI });
      render(
        <MemoryRouter rutaInicial="/calendari?vista=mes&mes=2026-10">
          <CalendariDelPoble
            estat={estat}
            navega={() => {}}
            canviaVista={() => {}}
            triaDia={() => {}}
            obriDia={() => {}}
            entrades={ENTRADES}
            avui={AVUI}
            senseData={1}
            idioma={lang}
          />
        </MemoryRouter>
      );

      expect(screen.getByRole('button', { name: tx.etiquetesPeriode.mes.hui })).toBeTruthy();
      expect(screen.getByRole('button', { name: tx.etiquetesPeriode.mes.anterior })).toBeTruthy();
      expect(screen.getByRole('button', { name: tx.etiquetesPeriode.mes.seguent })).toBeTruthy();

      const grupVistes = screen.getByRole('group', { name: tx.etiquetaVistes });
      expect(within(grupVistes).getAllByRole('button').map((b) => b.textContent)).toEqual(
        tx.vistes.map((v) => v.text)
      );

      expect(document.querySelector('h4[role="status"]').textContent).toBe(tx.recompte(1));
      expect(screen.getByText(tx.senseData(1))).toBeTruthy();
    }
  );

  test.each(CODIS_IDIOMA_CALENDARI)(
    'CalendariDelPoble buit amb diaTriat i en vista agenda mostra el buit traduït en %s',
    (lang) => {
      const tx = textosCalendariPoble(lang);
      const estatDia = estatDeLaUrl({ vista: 'setmana', date: '2026-10-02' }, { avui: AVUI });
      const { unmount } = render(
        <MemoryRouter rutaInicial="/calendari?vista=setmana&date=2026-10-02">
          <CalendariDelPoble
            estat={estatDia}
            navega={() => {}}
            canviaVista={() => {}}
            triaDia={() => {}}
            obriDia={() => {}}
            entrades={[]}
            avui={AVUI}
            idioma={lang}
          />
        </MemoryRouter>
      );
      expect(document.querySelector('h4[role="status"]').textContent).toBe(tx.buitDia);
      unmount();

      const estatAgenda = estatDeLaUrl({ vista: 'agenda', mes: '2026-10' }, { avui: AVUI });
      render(
        <MemoryRouter rutaInicial="/calendari?vista=agenda&mes=2026-10">
          <CalendariDelPoble
            estat={estatAgenda}
            navega={() => {}}
            canviaVista={() => {}}
            triaDia={() => {}}
            obriDia={() => {}}
            entrades={[]}
            avui={AVUI}
            idioma={lang}
          />
        </MemoryRouter>
      );
      expect(screen.getAllByText(tx.buitAgenda).length).toBeGreaterThanOrEqual(1);
    }
  );
});
