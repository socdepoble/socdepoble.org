import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

const mocks = vi.hoisted(() => ({
  capacitatCopublicacio: true,
  port: {},
  language: 'ca',
  searchParams: '',
  nivell: 'aal2'
}));

vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: (cap) => (cap === 'copublicacio' ? mocks.capacitatCopublicacio : false),
  getBackendImplementation: () => mocks.port,
  lligPublicadorsRegistrats: (...args) => mocks.port.lligPublicadorsRegistrats(...args),
  listPublicOrganizations: (...args) => mocks.port.listPublicOrganizations?.(...args),
  traspassaPublicacio: (...args) => mocks.port.traspassaPublicacio(...args),
  reverteixTraspasPublicacio: (...args) => mocks.port.reverteixTraspasPublicacio(...args)
}));

vi.mock('../../app/contexts/SessionContext.jsx', () => ({
  useSessioOpcional: () => ({ esSuperadmin: true, currentUser: { id: 'admin-1' }, generacio: 1, nivell: mocks.nivell })
}));

vi.mock('../../app/contexts/RouterContext', () => ({
  useSearchParams: () => [new URLSearchParams(mocks.searchParams), vi.fn()],
  useNavigate: () => vi.fn(),
  useRouter: () => ({ currentPath: '/page/receptes', navigate: vi.fn() }),
  Link: ({ to, href, children, ...rest }) => <a href={to || href} {...rest}>{children}</a>
}));

vi.mock('../../app/contexts/CoreContentContext', () => ({
  useCoreContent: () => ({
    pageCopy: {},
    openShareModal: vi.fn(),
    openCommentsDrawer: vi.fn(),
    navigateTo: vi.fn()
  })
}));

vi.mock('../../app/contexts/UIContext', async original => ({
  ...(await original()),
  useUIActions: () => ({
    t: (_k, fb) => fb || _k,
    language: mocks.language
  }),
  useUIActionsOpcional: () => ({ language: mocks.language })
}));

vi.mock('../../hooks/useSEO', () => ({
  useSEO: vi.fn()
}));

import { UIContext } from '../../app/contexts/objectesDeContext.js';
import { PanellTraspasPublicacioInline } from './PanellTraspasPublicacioInline.jsx';
import DesignSection from '../disseny/DesignSection.jsx';
import TextSection from '../text/TextSection.jsx';
import { PAGE_COPY } from '../text/pageContent.js';

const UUID_SANGONERETA = '99999999-9999-4999-8999-999999999999';
const UUID_SDP = 'a240e870-4aef-4d92-b138-e8b4e2f2123a';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

test('R21.6 · el directori fallat s’avisa i reintenta; no habilita un traspàs amb una llista desconeguda', async () => {
  const directory = vi.fn().mockRejectedValueOnce(new Error('private directory diagnostic'))
    .mockResolvedValueOnce([{ id: UUID_SANGONERETA, name: 'Associació real', town_name: 'Muro' }]);
  mocks.port = {
    lligPublicadorsRegistrats: vi.fn(async () => ({ recursTipus: 'pagina', recursId: 'receptes', versio: 2,
      publicadorsRegistrats: [{ actor_id: UUID_SDP, slug_ruta: `/perfil/${UUID_SDP}?registre=organitzacio`, nom: 'Sóc de Poble', avatar_url: '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png', poble_nom: 'La Torre de les Maçanes', rol_publicacio: 'principal' }] })),
    listPublicOrganizations: directory, traspassaPublicacio: vi.fn()
  };
  const { container } = render(<PanellTraspasPublicacioInline />);
  const title = await screen.findByText('No s’ha pogut carregar el directori de comptes registrats');
  const alert = title.closest('[role="status"]');
  expect(alert.textContent).not.toContain('private directory diagnostic');
  expect(container.querySelector('.sdp-traspas-inline__accions button').disabled).toBe(true);
  expect(screen.queryByText('Publicació actualitzada')).toBeNull();
  fireEvent.click(within(alert).getByRole('button', { name: 'Torna-ho a provar' }));
  await screen.findByRole('option', { name: /^Associació real/ });
  await waitFor(() => expect(container.querySelector('.sdp-traspas-inline__accions button').disabled).toBe(false));
  expect(screen.queryByText('No s’ha pogut carregar el directori de comptes registrats')).toBeNull();
  expect(directory).toHaveBeenCalledTimes(2);
  expect(mocks.port.lligPublicadorsRegistrats).toHaveBeenCalledTimes(1);
  expect(mocks.port.traspassaPublicacio).not.toHaveBeenCalled();
  const header = container.querySelector('.sdp-traspas-inline__previsualitzacio');
  expect(header.querySelector('.btn-date-time').textContent).toBe('Data no indicada');
  expect(header.querySelector('button.btn-date-time, time[datetime]')).toBeNull();
});

test('R21.6 · recuperar el directori no amaga la fallada autoritativa del recurs ni desbloqueja el traspàs', async () => {
  mocks.port = {
    lligPublicadorsRegistrats: vi.fn().mockRejectedValue(new Error('primary read failed')),
    listPublicOrganizations: vi.fn().mockRejectedValueOnce(new Error('directory failed')).mockResolvedValueOnce([]),
    traspassaPublicacio: vi.fn()
  };
  const { container } = render(<PanellTraspasPublicacioInline />);
  await screen.findByText('Error en llegir els publicadors del recurs');
  const directoryAlert = (await screen.findByText('No s’ha pogut carregar el directori de comptes registrats')).closest('[role="status"]');
  fireEvent.click(within(directoryAlert).getByRole('button', { name: 'Torna-ho a provar' }));
  await waitFor(() => expect(screen.queryByText('No s’ha pogut carregar el directori de comptes registrats')).toBeNull());
  expect(screen.getByText('Error en llegir els publicadors del recurs')).toBeTruthy();
  expect(container.querySelector('.sdp-traspas-inline__accions button').disabled).toBe(true);
  expect(mocks.port.traspassaPublicacio).not.toHaveBeenCalled();
});

afterEach(() => {
  cleanup();
  mocks.language = 'ca';
  mocks.searchParams = '';
  mocks.nivell = 'aal2';
  mocks.capacitatCopublicacio = true;
  mocks.port = {};
});

describe('Onada R19 · PanellTraspasPublicacioInline, integració amb copublicacio i DesignSection en 5 llengües', () => {
  test('renderitza inline sense modal, exclou socdepoble de copublicadorsRegistratsIds i conserva operacioId tant en reintents de traspàs com de reversió (reverteixTraspasPublicacio)', async () => {
    const operacionsTraspas = [];
    const operacionsReversio = [];
    let fallarPrimerTraspas = true;
    let fallarPrimeraReversio = true;

    mocks.capacitatCopublicacio = true;
    mocks.port = {
      lligPublicadorsRegistrats: vi.fn(async () => ({
        recursTipus: 'llibre_cataleg',
        recursId: 'que-dinem',
        versio: 3,
        publicadorsRegistrats: [
          {
            actor_id: UUID_SDP,
            slug_ruta: `/perfil/${UUID_SDP}?registre=organitzacio`,
            nom: 'Sóc de Poble',
            avatar_url: '/assets/brand/logo_socdepoble_green_square.png',
            poble_nom: 'La Torre de les Maçanes',
            rol_publicacio: 'principal'
          }
        ]
      })),
      listPublicOrganizations: vi.fn(async () => [
        {
          id: UUID_SANGONERETA,
          slug: 'fins-rebentar-com-sangonereta',
          name: 'Associació Gastronòmica «Fins rebentar com Sangonereta»',
          avatar_url: '',
          town_name: 'Muro'
        }
      ]),
      traspassaPublicacio: vi.fn(async (payload) => {
        expect(UUID_RE.test(payload.operacioId)).toBe(true);
        expect(UUID_RE.test(payload.nouActorRegistratId)).toBe(true);
        // Quan mantindreCopublicadorSdp és true, Sóc de Poble NO va dins de copublicadorsRegistratsIds
        expect(payload.mantindreCopublicadorSdp).toBe(true);
        expect(payload.copublicadorsRegistratsIds).toEqual([]);
        operacionsTraspas.push(payload.operacioId);
        if (fallarPrimerTraspas) {
          fallarPrimerTraspas = false;
          throw Object.assign(new Error('Cal confirmar el segon factor'), { code: 'cal-segon-factor' });
        }
        return {
          recursTipus: 'llibre_cataleg',
          recursId: 'que-dinem',
          versio: 4,
          operacioId: payload.operacioId,
          repetida: false,
          versioOperacio: 4,
          publicadorsRegistrats: [
            {
              actor_id: UUID_SANGONERETA,
              slug_ruta: `/perfil/${UUID_SANGONERETA}?registre=organitzacio`,
              nom: 'Associació Gastronòmica «Fins rebentar com Sangonereta»',
              avatar_url: '',
              poble_nom: 'Muro',
              rol_publicacio: 'principal'
            },
            {
              actor_id: UUID_SDP,
              slug_ruta: `/perfil/${UUID_SDP}?registre=organitzacio`,
              nom: 'Sóc de Poble',
              avatar_url: '/assets/brand/logo_socdepoble_green_square.png',
              poble_nom: 'La Torre de les Maçanes',
              rol_publicacio: 'copublicador'
            }
          ]
        };
      }),
      reverteixTraspasPublicacio: vi.fn(async (payload) => {
        expect(UUID_RE.test(payload.traspasId)).toBe(true);
        expect(UUID_RE.test(payload.operacioId)).toBe(true);
        expect(payload.operacioId).not.toBe(payload.traspasId);
        operacionsReversio.push(payload.operacioId);
        if (fallarPrimeraReversio) {
          fallarPrimeraReversio = false;
          throw new Error('Error temporal en revertir');
        }
        return {
          recursTipus: 'llibre_cataleg',
          recursId: 'que-dinem',
          versio: 5,
          operacioId: payload.operacioId,
          repetida: false,
          versioOperacio: 5,
          publicadorsRegistrats: [
            {
              actor_id: UUID_SDP,
              slug_ruta: `/perfil/${UUID_SDP}?registre=organitzacio`,
              nom: 'Sóc de Poble',
              avatar_url: '/assets/brand/logo_socdepoble_green_square.png',
              poble_nom: 'La Torre de les Maçanes',
              rol_publicacio: 'principal'
            }
          ]
        };
      })
    };

    const { container } = render(
      <PanellTraspasPublicacioInline
        recursTipusInicial="llibre_cataleg"
        recursIdInicial="que-dinem"
      />
    );

    expect(container.querySelector('dialog, [role="dialog"]')).toBeNull();
    expect(container.querySelector('dl')).toBeNull();

    await waitFor(() => {
      expect(mocks.port.lligPublicadorsRegistrats).toHaveBeenCalledTimes(1);
      expect(mocks.port.listPublicOrganizations).toHaveBeenCalledTimes(1);
    });

    const selects = container.querySelectorAll('select');
    expect(selects.length).toBeGreaterThanOrEqual(2);
    await screen.findByRole('option', { name: /Associació (Gastronòmica|Cultural)/ });
    fireEvent.change(selects[1], { target: { value: UUID_SANGONERETA } });

    const botoAplicar = screen.getByRole('button', { name: /co-publicació en 1 clic|traspàs de publicació en 1 clic/i });
    fireEvent.click(botoAplicar);

    await waitFor(() => {
      expect(container.textContent).toContain('AAL2');
    });

    // Reintent de traspàs: conserva exactament el mateix operacioId!
    fireEvent.click(botoAplicar);

    await waitFor(() => {
      expect(mocks.port.traspassaPublicacio).toHaveBeenCalledTimes(2);
    });
    expect(operacionsTraspas).toHaveLength(2);
    expect(operacionsTraspas[0]).toBe(operacionsTraspas[1]);

    const botoRevertir = await screen.findByRole('button', { name: 'Desfer l’últim traspàs' });
    fireEvent.click(botoRevertir);
    await waitFor(() => {
      expect(container.textContent).toContain('Error temporal en revertir');
    });

    // Reintent de reversió: conserva exactament el mateix operacioId de reversió!
    fireEvent.click(botoRevertir);
    await waitFor(() => {
      expect(mocks.port.reverteixTraspasPublicacio).toHaveBeenCalledTimes(2);
    });
    expect(operacionsReversio).toHaveLength(2);
    expect(operacionsReversio[0]).toBe(operacionsReversio[1]);
    expect(operacionsReversio[0]).not.toBe(operacionsTraspas[0]);
  });

  test('integració producció: TextSection manté la reserva editorial sense capacitat o en versio 0, i projecta la co-publicació quan lligPublicadorsRegistrats retorna 2 actors registrats', async () => {
    mocks.capacitatCopublicacio = false;
    const { container, rerender } = render(
      <TextSection page={PAGE_COPY.receptes} pageKey="receptes" />
    );
    expect(container.querySelector('section.bar-orange')?.hasAttribute('data-copublicacio')).toBe(false);

    mocks.capacitatCopublicacio = true;
    mocks.port = {
      lligPublicadorsRegistrats: vi.fn(async () => ({
        recursTipus: 'pagina',
        recursId: 'receptes',
        versio: 2,
        publicadorsRegistrats: [
          {
            actor_id: UUID_SANGONERETA,
            slug_ruta: `/perfil/${UUID_SANGONERETA}?registre=organitzacio`,
            nom: 'Associació Cultural de Muro',
            avatar_url: '',
            poble_nom: 'Muro',
            rol_publicacio: 'principal'
          },
          {
            actor_id: UUID_SDP,
            slug_ruta: `/perfil/${UUID_SDP}?registre=organitzacio`,
            nom: 'Sóc de Poble',
            avatar_url: '/assets/brand/logo_socdepoble_green_square.png',
            poble_nom: 'La Torre de les Maçanes',
            rol_publicacio: 'copublicador'
          }
        ]
      }))
    };

    rerender(<TextSection page={PAGE_COPY.receptes} pageKey="receptes" />);
    await waitFor(() => {
      expect(container.querySelector('section.bar-orange')?.getAttribute('data-copublicacio')).toBe('composta');
    });
    expect(container.querySelector('.sdp-avatar-compost--2')).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Associació Cultural de Muro' }).getAttribute('href')).toBe(`/perfil/${UUID_SANGONERETA}?registre=organitzacio`);
  });

  test('DesignSection passa per localitzaPagina i renderitza el títol i el cos en la llengua de la UI', () => {
    mocks.language = 'eu';
    mocks.searchParams = 'categoria=fonaments&item=__intro';
    const { container } = render(<DesignSection />);
    expect(container.textContent).toContain('Pedra Seca Diseinua');
    expect(container.textContent).toContain('Barra laranja, erakundeen arteko ko-argitalpena eta lerroko eskualdatzea');
  });

  test('P1-CARBON-03 · bloqueja el traspàs mentre carrega una nova fitxa, reinicia la selecció anterior i descarta respostes tardanes d’un recurs tancat', async () => {
    let resolSegonaLectura;
    let resolLectura;
    let cridaLectura = 0;

    mocks.capacitatCopublicacio = true;
    mocks.port = {
      listPublicOrganizations: vi.fn(async () => [
        {
          id: UUID_SANGONERETA,
          name: 'Associació Cultural de Muro',
          avatar_url: '',
          town_name: 'Muro'
        }
      ]),
      lligPublicadorsRegistrats: vi.fn(({ recursId }) => {
        cridaLectura += 1;
        if (recursId === 'que-dinem' && cridaLectura === 1) {
          return Promise.resolve({
            recursTipus: 'llibre_cataleg',
            recursId: 'que-dinem',
            versio: 0,
            publicadorsRegistrats: [
              {
                actor_id: UUID_SDP,
                slug_ruta: `/perfil/${UUID_SDP}?registre=organitzacio`,
                nom: 'Sóc de Poble',
                avatar_url: '/assets/brand/logo_socdepoble_green_square.png',
                poble_nom: 'La Torre de les Maçanes',
                rol_publicacio: 'principal'
              }
            ]
          });
        }
        if (recursId === 'la-torre-de-les-macanes') {
          return new Promise((resolve) => {
            resolSegonaLectura = resolve;
          });
        }
        return new Promise((resolve) => {
          resolLectura = resolve;
          void resolLectura;
        });
      }),
      traspassaPublicacio: vi.fn(async (payload) => ({
        recursTipus: payload.recursTipus,
        recursId: payload.recursId,
        versio: 1,
        operacioId: payload.operacioId,
        publicadorsRegistrats: []
      }))
    };

    const { container } = render(
      <PanellTraspasPublicacioInline
        recursTipusInicial="llibre_cataleg"
        recursIdInicial="que-dinem"
      />
    );

    const botoPrimari = await screen.findByRole('button', { name: /en 1 clic/i });
    await waitFor(() => expect(botoPrimari.disabled).toBe(false));

    const selects = container.querySelectorAll('select');
    // Seleccionem Sangonereta en que-dinem (v0)
    await screen.findByRole('option', { name: /Associació (Gastronòmica|Cultural)/ });
    fireEvent.change(selects[1], { target: { value: UUID_SANGONERETA } });
    expect(selects[1].value).toBe(UUID_SANGONERETA);

    // Canviem al segon recurs (la-torre-de-les-macanes), la lectura del qual queda en vol
    fireEvent.change(selects[0], { target: { value: 'llibre_cataleg:la-torre-de-les-macanes' } });

    // Mentre la lectura de la-torre-de-les-macanes està pendent:
    // 1. S'ha reiniciat l'actor anterior (ja no conserva Sangonereta de que-dinem)
    expect(selects[1].value).not.toBe(UUID_SANGONERETA);
    // 2. El botó d'aplicar està bloquejat i un clic no dispara traspassaPublicacio
    const botoLlegint = screen.getByRole('button', { name: /Llegint fitxa seleccionada/i });
    expect(botoLlegint.disabled).toBe(true);
    fireEvent.click(botoLlegint);
    expect(mocks.port.traspassaPublicacio).not.toHaveBeenCalled();

    // Quan arriba la lectura exacta de la-torre-de-les-macanes (també v0), es desbloqueja
    await waitFor(() => expect(typeof resolSegonaLectura).toBe('function'));
    resolSegonaLectura({
      recursTipus: 'llibre_cataleg',
      recursId: 'la-torre-de-les-macanes',
      versio: 0,
      publicadorsRegistrats: [
        {
          actor_id: UUID_SDP,
          slug_ruta: `/perfil/${UUID_SDP}?registre=organitzacio`,
          nom: 'Sóc de Poble',
          avatar_url: '/assets/brand/logo_socdepoble_green_square.png',
          poble_nom: 'La Torre de les Maçanes',
          rol_publicacio: 'principal'
        }
      ]
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /en 1 clic/i }).disabled).toBe(false);
      expect(selects[1].value).toBe(UUID_SDP);
    });
  });
  test('P1-CARBON-03 · modeEspecimen queda 100% aïllat en memòria i mai invoca el node remot encara que copublicacio estiga activa', () => {
    mocks.capacitatCopublicacio = true;
    mocks.port = {
      listPublicOrganizations: vi.fn(),
      lligPublicadorsRegistrats: vi.fn(),
      traspassaPublicacio: vi.fn(),
      reverteixTraspasPublicacio: vi.fn()
    };

    render(<PanellTraspasPublicacioInline modeEspecimen />);
    const boto = screen.getByRole('button', { name: /co-publicació en 1 clic/i });
    fireEvent.click(boto);

    const botoDesfer = screen.getByRole('button', { name: 'Desfer l’últim traspàs' });
    fireEvent.click(botoDesfer);

    expect(mocks.port.listPublicOrganizations).not.toHaveBeenCalled();
    expect(mocks.port.lligPublicadorsRegistrats).not.toHaveBeenCalled();
    expect(mocks.port.traspassaPublicacio).not.toHaveBeenCalled();
    expect(mocks.port.reverteixTraspasPublicacio).not.toHaveBeenCalled();
  });
});

const ASSET_SDP = '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png';
const DTO = { actor_id: UUID_SDP, slug_ruta: `/perfil/${UUID_SDP}?registre=organitzacio`, nom: 'Sóc de Poble', avatar_url: ASSET_SDP,
  poble_nom: 'La Torre de les Maçanes', rol_publicacio: 'principal' };
const CONFIG_TENANT = { tenantId: 'd0000000-0000-4000-8000-000000000009', backendUrl: 'https://poble.invalid' };
const APLICA = /co-publicació en 1 clic|traspàs de publicació en 1 clic/i;
const publicacioAmbConfig = props => <UIContext.Provider value={{ externalConfig: CONFIG_TENANT }}>
  <PanellTraspasPublicacioInline {...props} />
</UIContext.Provider>;

test('AAL1 presenta el segon factor i no invoca el node', () => {
  mocks.nivell = 'aal1';
  mocks.port = { lligPublicadorsRegistrats: vi.fn(), listPublicOrganizations: vi.fn(), traspassaPublicacio: vi.fn(),
    reverteixTraspasPublicacio: vi.fn() };
  render(publicacioAmbConfig());
  expect(screen.getByText(/cal confirmar el segon factor/i)).toBeTruthy();
  expect(screen.queryByRole('combobox')).toBeNull();
  for (const crida of Object.values(mocks.port)) expect(crida).not.toHaveBeenCalled();
});

test('el resultat d’una operació pendent queda descartat si es tanca la sessió AAL2', async () => {
  let acaba;
  mocks.port = {
    lligPublicadorsRegistrats: vi.fn(async recurs => ({ ...recurs, versio: 2, publicadorsRegistrats: [DTO] })),
    listPublicOrganizations: vi.fn(async () => []),
    traspassaPublicacio: vi.fn(entrada => new Promise(resolve => {
      acaba = () => resolve({ ...entrada, versio: 3, versioOperacio: 3, repetida: false, publicadorsRegistrats: [DTO] });
    }))
  };
  const aplicaResposta = vi.fn();
  const { rerender } = render(publicacioAmbConfig({ onRespostaAutoritativa: aplicaResposta }));
  await waitFor(() => expect(screen.getByRole('button', { name: APLICA }).disabled).toBe(false));
  fireEvent.click(screen.getByRole('button', { name: APLICA }));
  await waitFor(() => expect(acaba).toBeTypeOf('function'));
  mocks.nivell = 'aal1';
  rerender(publicacioAmbConfig({ onRespostaAutoritativa: aplicaResposta }));
  await act(async () => acaba());
  expect(aplicaResposta).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: 'Desfer l’últim traspàs' })).toBeNull();
});

test('un reintent ja superat per una altra versió no oferix reversió de la versió antiga', async () => {
  mocks.port = {
    lligPublicadorsRegistrats: vi.fn(async recurs => ({ ...recurs, versio: 2, publicadorsRegistrats: [DTO] })),
    listPublicOrganizations: vi.fn(async () => []),
    traspassaPublicacio: vi.fn(async entrada => ({
      ...entrada, versio: 7, versioOperacio: 3, repetida: true, publicadorsRegistrats: [DTO]
    }))
  };
  render(publicacioAmbConfig());
  await waitFor(() => expect(screen.getByRole('button', { name: APLICA }).disabled).toBe(false));
  fireEvent.click(screen.getByRole('button', { name: APLICA }));
  await screen.findByText('Publicació actualitzada per una operació posterior');
  expect(screen.queryByRole('button', { name: 'Desfer l’últim traspàs' })).toBeNull();
});

test('la lectura i el traspàs mantenen el backend i el poble de l’amfitrió', async () => {
  mocks.port = {
    lligPublicadorsRegistrats: vi.fn(async recurs => ({ ...recurs, versio: 2, publicadorsRegistrats: [DTO] })),
    listPublicOrganizations: vi.fn(async () => []),
    traspassaPublicacio: vi.fn(async entrada => ({
      ...entrada, versio: 3, versioOperacio: 3, repetida: false, publicadorsRegistrats: [DTO]
    }))
  };
  render(publicacioAmbConfig());
  await waitFor(() => expect(screen.getByRole('button', { name: APLICA }).disabled).toBe(false));
  const recurs = { recursTipus: 'pagina', recursId: 'receptes' };
  expect(mocks.port.lligPublicadorsRegistrats).toHaveBeenCalledWith(recurs, { ...CONFIG_TENANT, signal: expect.any(AbortSignal) });
  fireEvent.click(screen.getByRole('button', { name: APLICA }));
  await screen.findByText('Publicació actualitzada');
  expect(mocks.port.traspassaPublicacio).toHaveBeenCalledWith(expect.objectContaining(recurs), CONFIG_TENANT);
});
