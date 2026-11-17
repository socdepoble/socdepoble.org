import '../../../../tests/helpers/diccionaris.js';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../../app/contexts/RouterContext.jsx';
import { AppGridContext } from '../../../components/layout/AppGridShell.jsx';
import { createTranslator } from '../../../config/i18n.js';
import { IAIA_ID } from '../../../data/identitatsSeed.js';
import Bombolla from './Bombolla.jsx';
import { resolRutaPerfilCapcalera } from './CapcaleraConversa.jsx';
import Conversa from './Conversa.jsx';

vi.mock('../../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: () => true,
  quotaXat: vi.fn().mockResolvedValue({ usats: 0, limit: 20_000_000 }),
  urlAdjuntXat: vi.fn().mockResolvedValue('https://node.test/audio.m4a')
}));

beforeEach(() => {
  HTMLElement.prototype.scrollTo = function scrollTo() {};
});

afterEach(() => {
  cleanup();
  delete HTMLElement.prototype.scrollTo;
});

const UUID_SOFIA = 'f4899ef6-7aaf-4d4d-ac43-cebe53092586';

function UbicacioActual() {
  const loc = useLocation();
  return <output data-testid="ruta-actual">{loc.pathname}</output>;
}

describe('R32.6 · Lot 02 (P0-120) · Avatars sempre visibles i clicables en Bombolla i CapcaleraConversa', () => {
  test('en conversa directa 1:1 (Sofía Bornay), pinta CaraXat clicable a la primera bombolla rebuda, espaiador a la consecutiva i navega a /gent/<id>', () => {
    const t = createTranslator('ca');
    const { container } = render(
      <MemoryRouter initialEntries={['/xat/f-sofia']}>
        <UbicacioActual />
        <ol>
          <Bombolla
            missatge={{
              id: 'm-1',
              sender: 'other',
              author: 'Sofía Bornay',
              usuariId: UUID_SOFIA,
              text: 'Hola! T’acabe d’enviar el primer àudio.',
              creatAl: '2026-11-17T13:53:00Z'
            }}
            esGrup={false}
            primerDelGrup
            t={t}
            locale="ca-ES"
          />
          <Bombolla
            missatge={{
              id: 'm-2',
              sender: 'other',
              author: 'Sofía Bornay',
              usuariId: UUID_SOFIA,
              text: 'Segona bombolla de la mateixa tirada.',
              creatAl: '2026-11-17T13:53:20Z'
            }}
            esGrup={false}
            primerDelGrup={false}
            t={t}
            locale="ca-ES"
          />
          <Bombolla
            missatge={{
              id: 'm-3',
              sender: 'me',
              author: 'Javi',
              usuariId: 'u-javi',
              text: 'Rebut perfecte!',
              creatAl: '2026-11-17T13:54:00Z'
            }}
            esGrup={false}
            primerDelGrup
            t={t}
            locale="ca-ES"
          />
        </ol>
      </MemoryRouter>
    );

    const items = container.querySelectorAll('li.sdp-xat-item');
    const enllacCara = items[0].querySelector('a.sdp-xat-bombolla__cara--enllac');
    expect(enllacCara).not.toBeNull();
    expect(enllacCara.getAttribute('href')).toBe(`/gent/${UUID_SOFIA}`);
    expect(enllacCara.getAttribute('aria-label')).toBe('Obri el perfil de Sofía Bornay');
    expect(enllacCara.textContent).toContain('SB');
    expect(items[0].querySelector('.sdp-xat-bombolla__autor')).toBeNull();

    // La segona de la tirada manté l'espaiador d'alineació i no repeteix la cara
    expect(items[1].querySelector('.sdp-xat-bombolla__espai-cara')).not.toBeNull();
    expect(items[1].querySelector('.sdp-xat-bombolla__cara')).toBeNull();

    // La bombolla pròpia no porta cara aliena ni espaiador
    expect(items[2].querySelector('.sdp-xat-bombolla__cara')).toBeNull();
    expect(items[2].querySelector('.sdp-xat-bombolla__espai-cara')).toBeNull();

    fireEvent.click(enllacCara);
    expect(screen.getByTestId('ruta-actual').textContent).toBe(`/gent/${UUID_SOFIA}`);
  });

  test('en grups, IAIA i entitats amb entitatId del fil, tant l’avatar com el nom porten al perfil sense duplicar l’anunci al lector de pantalla', () => {
    const t = createTranslator('ca');
    const { container } = render(
      <MemoryRouter initialEntries={['/xat/grup-1']}>
        <UbicacioActual />
        <ol>
          <Bombolla
            missatge={{ id: 'm-iaia', sender: 'other', author: 'IAIA MarIA', usuariId: IAIA_ID, is_ai: true, text: 'Salutacions!', creatAl: '2026-11-17T09:00:00Z' }}
            esGrup={false}
            primerDelGrup
            t={t}
          />
          <Bombolla
            missatge={{ id: 'm-ent', sender: 'other', author: 'Sóc de Poble', usuariId: 'operador-ocult', comEntitat: true, text: 'Canal oficial', creatAl: '2026-11-17T09:01:00Z' }}
            esGrup={false}
            primerDelGrup
            entitatId="socdepoble"
            t={t}
          />
        </ol>
      </MemoryRouter>
    );

    // Un sol enllaç anunciat per lector de pantalla per missatge, però l'avatar també és un <a> clicable
    expect(screen.getAllByRole('link', { name: 'Obri el perfil de IAIA MarIA' })).toHaveLength(1);
    expect(screen.getAllByRole('link', { name: 'Obri el perfil de Sóc de Poble' })).toHaveLength(1);

    const items = container.querySelectorAll('li.sdp-xat-item');
    const caraIaia = items[0].querySelector('a.sdp-xat-bombolla__cara--enllac');
    expect(caraIaia?.getAttribute('href')).toBe('/iaia');
    expect(caraIaia?.getAttribute('aria-hidden')).toBe('true');

    const caraEntitat = items[1].querySelector('a.sdp-xat-bombolla__cara--enllac');
    // Mai filtra l'usuariId de l'operador: usa l'entitat del fil (/empresa/socdepoble)
    expect(caraEntitat?.getAttribute('href')).toBe('/empresa/socdepoble');
    expect(caraEntitat?.getAttribute('href')).not.toContain('operador-ocult');

    fireEvent.click(caraIaia);
    expect(screen.getByTestId('ruta-actual').textContent).toBe('/iaia');
  });

  test('CapcaleraConversa i Conversa resolen el perfil de Sofía Bornay (canals plegats o reserva de missatges) i tradueixen en 5 llengües', () => {
    // 1. Fil amb altres buit però canal germà poblat (selector Personal · Sóc de Poble)
    const filPersonalSenseAltres = { id: 'fil-p', tipus: 'directe', name: 'Sofía Bornay', altres: [] };
    const canalEntitat = {
      id: 'fil-e',
      tipus: 'directe',
      name: 'Sofía Bornay',
      comEntitat: true,
      entitatId: 'socdepoble',
      entitatNom: 'Sóc de Poble',
      altres: [{ id: UUID_SOFIA, tipus: 'persona', nom: 'Sofía Bornay' }]
    };
    expect(resolRutaPerfilCapcalera(filPersonalSenseAltres, { canals: [filPersonalSenseAltres, canalEntitat] }))
      .toBe(`/gent/${UUID_SOFIA}`);

    // 2. Fil d'entitat vist pel veí amb entitatId i altres buit
    expect(resolRutaPerfilCapcalera({ id: 'fil-forn', tipus: 'directe', name: 'Forn del Poble', entitatId: 'org-forn', comEntitat: false, altres: [] }))
      .toBe('/empresa/org-forn');
    expect(resolRutaPerfilCapcalera({ id: 'fil-sdp', tipus: 'directe', name: 'Sóc de Poble', entitatId: 'socdepoble', comEntitat: false, altres: [] }))
      .toBe('/socdepoble');

    // 3. Integració en Conversa quan fil.altres és [] però el missatge rebut porta l'usuariId de Sofía Bornay
    for (const lang of ['ca', 'es', 'en', 'eu', 'gl']) {
      const t = createTranslator(lang);
      const { container } = render(
        <MemoryRouter initialEntries={['/xat/fil-p']}>
          <UbicacioActual />
          <AppGridContext.Provider value={{ mida: 'ample', setPanellObert: () => {} }}>
            <Conversa
              fil={filPersonalSenseAltres}
              messages={[{
                id: 'm-veu-1',
                seq: 1,
                sender: 'other',
                author: 'Sofía Bornay',
                usuariId: UUID_SOFIA,
                tipus: 'veu',
                text: '',
                metadades: { adjunt: { id: 'adj-veu-1', duradaMs: 38_000 } },
                creatAl: '2026-11-17T13:53:00Z',
                estatEnviament: 'enviat'
              }]}
              usuariAdjunts="u-javi"
              configAdjunts={{ dataMode: 'remote' }}
              onSendMessage={vi.fn()}
              onSendMedia={vi.fn()}
              onMarcaVist={vi.fn()}
              t={t}
              locale="ca-ES"
            />
          </AppGridContext.Provider>
        </MemoryRouter>
      );

      const enllacCapcalera = container.querySelector('a.sdp-xat-capcalera__enllac');
      expect(enllacCapcalera).not.toBeNull();
      expect(enllacCapcalera.getAttribute('href')).toBe(`/gent/${UUID_SOFIA}`);
      expect(enllacCapcalera.getAttribute('aria-label')).toContain('Sofía Bornay');

      const enllacBombolla = container.querySelector('a.sdp-xat-bombolla__cara--enllac');
      expect(enllacBombolla).not.toBeNull();
      expect(enllacBombolla.getAttribute('href')).toBe(`/gent/${UUID_SOFIA}`);

      if (lang === 'ca') {
        fireEvent.click(enllacCapcalera);
        expect(screen.getByTestId('ruta-actual').textContent).toBe(`/gent/${UUID_SOFIA}`);
      }
      cleanup();
    }
  });
});
