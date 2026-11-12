import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { Link, MemoryRouter, useLocation } from '../../../app/contexts/RouterContext.jsx';
import { BarraTaronja } from './BarraTaronja.jsx';
import { validaRespostaCopublicacio } from '../../../data/copublicacio.js';
import {
  PUBLICADOR_PER_DEFECTE,
  projectaLecturaCopublicacio,
  resolPublicadorsRegistrats
} from './publicadorsBarraTaronja.js';
import { usePublicadorsBarraRecurs } from '../../../hooks/usePublicadorsBarraRecurs.js';

const mockBackendState = {
  capacitat: false,
  port: null
};

vi.mock('../../../config/assetResolver', () => ({ resolveAsset: (uri) => uri }));
vi.mock('../../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: () => mockBackendState.capacitat,
  getBackendImplementation: () => mockBackendState.port,
  lligPublicadorsRegistrats: (...args) => mockBackendState.port.lligPublicadorsRegistrats(...args),
  resolveAsset: vi.fn()
}));

afterEach(() => {
  mockBackendState.capacitat = false;
  mockBackendState.port = null;
  cleanup();
});

const UUID_1 = '11111111-1111-4111-8111-111111111111';
const UUID_2 = '22222222-2222-4222-8222-222222222222';
const UUID_3 = '33333333-3333-4333-8333-333333333333';
const UUID_4 = '44444444-4444-4444-8444-444444444444';
const UUID_5 = '55555555-5555-4555-8555-555555555555';

describe('Onada R19 · BarraTaronja amb co-publicació multi-entitat registrada i avatar compost quadrangular', () => {
  test('sense publicadorsRegistrats conserva el DOM clàssic byte-a-byte sense data-copublicacio', () => {
    const { container } = render(
      <BarraTaronja
        authorName="Sóc de Poble"
        authorHref="/socdepoble"
        authorAvatar="/assets/brand/logo_socdepoble_green_square.png"
        authorLocation="La Torre de les Maçanes"
        date="11/11/26"
        time="18:00"
      />
    );
    const section = container.querySelector('section.bar-orange');
    expect(section).not.toBeNull();
    expect(section.hasAttribute('data-copublicacio')).toBe(false);
    expect(section.querySelector('.sdp-avatar-compost')).toBeNull();
    expect(section.querySelector('.sp-card-author-name')?.textContent).toBe('Sóc de Poble');
  });

  test('2 co-publicadors acreditats del servidor renderitzen mosaic --2, data-copublicacio="composta" i enllaços individuals', () => {
    const lectura = {
      recursTipus: 'llibre_cataleg',
      recursId: 'que-dinem',
      versio: 2,
      publicadorsRegistrats: [
        {
          actor_id: UUID_1,
          slug_ruta: `/perfil/${UUID_1}?registre=organitzacio`,
          nom: 'Associació Cultural de Muro',
          avatar_url: '',
          poble_nom: 'Muro',
          rol_publicacio: 'principal'
        },
        {
          actor_id: 'a240e870-4aef-4d92-b138-e8b4e2f2123a',
          slug_ruta: '/perfil/a240e870-4aef-4d92-b138-e8b4e2f2123a?registre=organitzacio',
          nom: 'Sóc de Poble',
          avatar_url: '/assets/brand/logo_socdepoble_green_square.png',
          poble_nom: 'La Torre de les Maçanes',
          rol_publicacio: 'copublicador'
        }
      ]
    };
    const publicadors = projectaLecturaCopublicacio(validaRespostaCopublicacio(lectura, {
      recursTipus: 'llibre_cataleg', recursId: 'que-dinem'
    }));
    expect(publicadors).toHaveLength(2);

    const { container } = render(
      <BarraTaronja
        publicadorsRegistrats={publicadors}
        date="11/11/26"
        time="18:00"
      />
    );
    const section = container.querySelector('section.bar-orange');
    expect(section.getAttribute('data-copublicacio')).toBe('composta');
    expect(container.querySelector('.sdp-avatar-compost--2')).not.toBeNull();
    const linkMuro = screen.getByRole('link', { name: 'Associació Cultural de Muro' });
    expect(linkMuro.getAttribute('href')).toBe(`/perfil/${UUID_1}?registre=organitzacio`);
    expect(container.querySelector('.sdp-avatar-compost-link')?.getAttribute('href')).toBe(linkMuro.getAttribute('href'));
    expect(screen.getByRole('link', { name: 'Sóc de Poble' }).getAttribute('href'))
      .toBe('/perfil/a240e870-4aef-4d92-b138-e8b4e2f2123a?registre=organitzacio');
  });

  test('3 i 5 co-publicadors acreditats renderitzen --3 i --4 amb comptador +N', () => {
    const cinc = [
      { actor_id: UUID_1, slug_ruta: `/perfil/${UUID_1}`, nom: 'Entitat 1', poble_nom: 'La Torre', rol_publicacio: 'principal' },
      { actor_id: UUID_2, slug_ruta: `/perfil/${UUID_2}`, nom: 'Entitat 2', poble_nom: 'La Torre', rol_publicacio: 'copublicador' },
      { actor_id: UUID_3, slug_ruta: `/perfil/${UUID_3}`, nom: 'Entitat 3', poble_nom: 'Muro', rol_publicacio: 'copublicador' },
      { actor_id: UUID_4, slug_ruta: `/perfil/${UUID_4}`, nom: 'Entitat 4', poble_nom: 'Muro', rol_publicacio: 'copublicador' },
      { actor_id: UUID_5, slug_ruta: `/perfil/${UUID_5}`, nom: 'Entitat 5', poble_nom: 'Xixona', rol_publicacio: 'copublicador' }
    ];
    const { container, rerender } = render(
      <BarraTaronja publicadorsRegistrats={cinc.slice(0, 3)} />
    );
    expect(container.querySelector('.sdp-avatar-compost--3')).not.toBeNull();

    rerender(
      <BarraTaronja publicadorsRegistrats={cinc} />
    );
    expect(container.querySelector('.sdp-avatar-compost--4')).not.toBeNull();
    expect(container.querySelector('.sdp-avatar-compost__mes')?.textContent).toBe('+2');
  });

  test('guarda inviolable: rebutja strings solts i DTOs arbitraris amb ruta aparentment interna però no acreditats', () => {
    const resolts = resolPublicadorsRegistrats([
      'Pedro Ferrer Rodriguez',
      { id: '', nom: 'Actor extern sense compte', ruta: 'https://example.org' },
      { actor_id: 'inventat-1', nom: 'Associació Inventada Sense Compte', slug_ruta: '/empresa/associacio-inventada', rol_publicacio: 'principal' },
      { actor_id: 'socdepoble', nom: 'Suplantació de Nom Oficial', slug_ruta: '/socdepoble', rol_publicacio: 'principal' },
      { actor_id: UUID_1, nom: 'Ruta discrepant amb UUID', slug_ruta: '/perfil/un-altre-slug', rol_publicacio: 'principal' }
    ]);
    expect(resolts).toHaveLength(1);
    expect(resolts[0]).toEqual(PUBLICADOR_PER_DEFECTE);

    const { container } = render(
      <BarraTaronja
        authorName="Nom no registrat"
        authorHref="/disseny"
        publicadorsRegistrats={[{ actor_id: 'fake', nom: 'Sense compte', slug_ruta: '/empresa/inventada' }]}
      />
    );
    expect(container.querySelector('section.bar-orange')?.hasAttribute('data-copublicacio')).toBe(false);
    const linkAutor = container.querySelector('a.sp-card-author-link');
    expect(linkAutor?.getAttribute('href')).toBe('/socdepoble');
    expect(container.querySelector('.sp-card-author-name')?.textContent).toBe('Sóc de Poble');
  });

  test('usePublicadorsBarraRecurs descarta respostes tardanes d’un recurs o node anterior i no muta la Barra', async () => {
    let resolNodeVell;
    const portVell = {
      lligPublicadorsRegistrats: vi.fn(() => new Promise((resolve) => {
        resolNodeVell = resolve;
      }))
    };
    const portNou = {
      lligPublicadorsRegistrats: vi.fn(async () => ({
        recursTipus: 'pagina',
        recursId: 'herbari',
        versio: 1,
        publicadorsRegistrats: [
          {
            actor_id: 'b2c87505-53b1-4108-902f-2313e77b9968',
            slug_ruta: '/perfil/b2c87505-53b1-4108-902f-2313e77b9968?registre=organitzacio',
            nom: 'Rentonar',
            avatar_url: '',
            poble_nom: 'La Torre de les Maçanes',
            rol_publicacio: 'principal'
          }
        ]
      }))
    };

    mockBackendState.capacitat = true;
    mockBackendState.port = portVell;

    function SondaBarra({ recursId }) {
      const { publicadorsRegistrats } = usePublicadorsBarraRecurs({
        recursTipus: 'pagina',
        recursId
      });
      return (
        <BarraTaronja
          authorName="Sóc de Poble"
          authorHref="/socdepoble"
          publicadorsRegistrats={publicadorsRegistrats}
        />
      );
    }

    const { container, rerender } = render(<SondaBarra recursId="receptes" />);
    await waitFor(() => expect(typeof resolNodeVell).toBe('function'));

    mockBackendState.port = portNou;
    rerender(<SondaBarra recursId="herbari" />);

    await waitFor(() => {
      expect(container.querySelector('.sp-card-author-name')?.textContent).toBe('Rentonar');
    });

    await act(async () => {
      resolNodeVell({
        recursTipus: 'pagina',
        recursId: 'receptes',
        versio: 4,
        publicadorsRegistrats: [
          {
            actor_id: UUID_1,
            slug_ruta: `/perfil/${UUID_1}?registre=organitzacio`,
            nom: 'Resposta Vella Intrusiva',
            avatar_url: '',
            poble_nom: 'Muro',
            rol_publicacio: 'principal'
          }
        ]
      });
    });

    expect(container.querySelector('.sp-card-author-name')?.textContent).toBe('Rentonar');
    expect(screen.queryByText('Resposta Vella Intrusiva')).toBeNull();
  });

  test('P0-CONTRACTE-06: acceptació exclusiva de la ruta exacta amb ?registre=persona|organitzacio i navegació real en actor únic i mode compost', () => {
    const actors = [
      {
        actor_id: UUID_1,
        registre: 'organitzacio',
        slug_ruta: `/perfil/${UUID_1}?registre=organitzacio`,
        nom: 'Associació Agrària La Torre',
        poble_nom: 'La Torre de les Maçanes',
        rol_publicacio: 'principal'
      },
      {
        actor_id: UUID_2,
        registre: 'persona',
        slug_ruta: `/perfil/${UUID_2}?registre=persona`,
        nom: 'Maria Valor Jordà',
        poble_nom: 'Muro d’Alcoi',
        rol_publicacio: 'copublicador'
      },
      {
        actor_id: UUID_3,
        slug_ruta: `/perfil/${UUID_3}?registre=inventat`,
        nom: 'Query No Acreditada',
        poble_nom: 'Alcoi',
        rol_publicacio: 'copublicador'
      },
      {
        actor_id: UUID_4,
        registre: 'persona',
        slug_ruta: `/perfil/${UUID_4}`,
        nom: 'Sense Marcador Quan Registre Explicit',
        poble_nom: 'Alcoi',
        rol_publicacio: 'copublicador'
      },
      {
        actor_id: UUID_5,
        registre: 'persona',
        slug_ruta: `/perfil/${UUID_5}?registre=organitzacio`,
        nom: 'Marcador Contradictori',
        poble_nom: 'Alcoi',
        rol_publicacio: 'copublicador'
      }
    ];
    const { container } = render(<BarraTaronja publicadorsRegistrats={actors} />);
    const linkAvatar = container.querySelector('.sdp-avatar-compost-link');
    expect(linkAvatar?.getAttribute('href')).toBe(`/perfil/${UUID_1}?registre=organitzacio`);
    const linksNoms = Array.from(container.querySelectorAll('.sdp-copublicador-link')).map((a) => a.getAttribute('href'));
    expect(linksNoms).toEqual([
      `/perfil/${UUID_1}?registre=organitzacio`,
      `/perfil/${UUID_2}?registre=persona`
    ]);

    cleanup();

    function SondaUbicacio() {
      const { pathname, search } = useLocation();
      const qs = search instanceof URLSearchParams ? search.toString() : String(search || '');
      return <output data-testid="ubicacio-barra">{`${pathname}${qs ? `?${qs.replace(/^\?/, '')}` : ''}`}</output>;
    }

    render(
      <MemoryRouter rutaInicial="/page/receptes">
        <BarraTaronja
          LinkComponent={Link}
          publicadorsRegistrats={[
            {
              actor_id: UUID_2,
              registre: 'persona',
              slug_ruta: `/perfil/${UUID_2}?registre=persona`,
              nom: 'Maria Valor Jordà',
              poble_nom: 'Muro d’Alcoi',
              rol_publicacio: 'principal'
            }
          ]}
        />
        <SondaUbicacio />
      </MemoryRouter>
    );

    const enllacUnic = screen.getByRole('link', { name: /Maria Valor Jordà/i });
    expect(enllacUnic.getAttribute('href')).toBe(`/perfil/${UUID_2}?registre=persona`);
    fireEvent.click(enllacUnic);
    expect(screen.getByTestId('ubicacio-barra').textContent).toBe(`/perfil/${UUID_2}?registre=persona`);
  });
});

const RECURS_ACREDITAT = { recursTipus: 'pagina', recursId: 'receptes' };
const DTO_PERSONA = {
  actor_id: UUID_1,
  slug_ruta: `/perfil/${UUID_1}?registre=persona`,
  nom: 'Publicadora de prova',
  avatar_url: null,
  poble_nom: 'Muro',
  rol_publicacio: 'principal'
};

test('un actor únic conserva el marcador acreditat en el clic del router', () => {
  const lectura = validaRespostaCopublicacio({
    ...RECURS_ACREDITAT, versio: 1, publicadorsRegistrats: [DTO_PERSONA]
  }, RECURS_ACREDITAT);

  function RutaActual() {
    const { pathname, search } = useLocation();
    return <output aria-label="Ruta de prova">{search ? `${pathname}?${search}` : pathname}</output>;
  }

  render(<MemoryRouter rutaInicial="/page/receptes">
    <BarraTaronja LinkComponent={Link} publicadorsRegistrats={lectura.publicadorsRegistrats} />
    <RutaActual />
  </MemoryRouter>);
  const enllac = screen.getByRole('link', { name: /^Publicadora de prova/ });
  expect(enllac.getAttribute('href')).toBe(DTO_PERSONA.slug_ruta);
  fireEvent.click(enllac);
  expect(screen.getByLabelText('Ruta de prova').textContent).toBe(DTO_PERSONA.slug_ruta);
});

test.each([
  '/perfil/11111111-1111-4111-8111-111111111111?registre=persona&next=/empresa/prova',
  '/perfil/11111111-1111-4111-8111-111111111111?registre=persona&registre=organitzacio',
  '/perfil/11111111-1111-4111-8111-111111111111?registre=persona#canvi',
  '/perfil/11111111-1111-4111-8111-111111111111/?registre=persona',
  '/perfil/11111111-1111-4111-8111-111111111111?',
  '/perfil/11111111-1111-4111-8111-111111111111?registre=%70ersona',
  '/perfil/11111111-1111-4111-8111-111111111111?registre=entitat',
  '/perfil/11111111-1111-4111-8111-111111111111?registre=PERSONA',
  '/perfil/11111111-1111-4111-8111-111111111111#canvi',
  '/perfil/22222222-2222-4222-8222-222222222222?registre=persona',
  'https://example.invalid/perfil/11111111-1111-4111-8111-111111111111?registre=persona'
])('la consulta no canònica %s no produïx cap enllaç de registre', slug_ruta => {
  const actor = { ...DTO_PERSONA, slug_ruta };
  expect(projectaLecturaCopublicacio({ ...RECURS_ACREDITAT, versio: 1, publicadorsRegistrats: [actor] })).toBeNull();
  expect(resolPublicadorsRegistrats([actor])).toEqual([PUBLICADOR_PER_DEFECTE]);
});

test('el marcador acreditat sobreviu a una còpia de presentació i el DTO exigix un rol explícit', () => {
  const [persona] = projectaLecturaCopublicacio({
    ...RECURS_ACREDITAT, versio: 1, publicadorsRegistrats: [DTO_PERSONA]
  });
  const copia = { ...persona };
  expect(resolPublicadorsRegistrats([copia])[0]?.href).toBe(DTO_PERSONA.slug_ruta);
  expect(projectaLecturaCopublicacio({ ...RECURS_ACREDITAT, versio: 1, publicadorsRegistrats: [{
    ...DTO_PERSONA, rol_publicacio: undefined
  }] })).toBeNull();
});


test('els camps de presentació no fabriquen el marcador acreditat a partir d’una ruta plana', () => {
  const rutaPlana = `/perfil/${UUID_1}`;
  const actor = { ...DTO_PERSONA, slug_ruta: rutaPlana, registre: 'persona', tipus_actor: 'persona' };
  expect(resolPublicadorsRegistrats([actor])).toEqual([PUBLICADOR_PER_DEFECTE]);
  expect(projectaLecturaCopublicacio({ ...RECURS_ACREDITAT, versio: 1, publicadorsRegistrats: [actor] })).toBeNull();
});
