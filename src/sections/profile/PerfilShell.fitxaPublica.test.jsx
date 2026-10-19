import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

/* Fase C (punt 9; ordre del Mestre, 19-10-2026: «Botó d'accés al perfil públic
   des de l'editor (/el-meu-perfil) […] que permeta a l'usuari anar directament
   a la seua fitxa pública sense haver d'escriure la URL a mà a la barra del
   navegador») · «Veure fitxa pública» (AccesFitxaPublica, PerfilShell.jsx):
   on porta (accesAFitxaPublica, pura), què fa quan la fitxa és privada i on es
   pinta dins de l'espai de treball DE VERITAT. El router també és el de veres
   (MemoryRouter): el clic porta a la ruta. Els detalls pesats van simulats,
   com a PerfilShell.espai.test.jsx. El gris i la fila partida en estret, que
   jsdom no veu, els fixa PerfilShell.fitxaPublica.capes.test.js. */
const m = vi.hoisted(() => ({ perfil: null, ui: null, toast: vi.fn(), caps: new Set() }));
vi.mock('../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} }),
}));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorId: null, refresh: vi.fn() }) }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ agents: [] }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({
  useSession: () => ({ currentUser: null, estat: 'fora' }),
  useSessioOpcional: () => null,
}));
vi.mock('../../app/contexts/UIContext', () => ({ useUI: () => m.ui }));
vi.mock('../../components/universal/ContentProvider', () => ({ useContent: () => null }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.toast }) }));
vi.mock('../../data/backendPort.js', () => ({ teCapacitat: (cap) => m.caps.has(cap) }));
vi.mock('./PerfilContext.jsx', () => ({ PerfilProvider: ({ children }) => children, usePerfil: () => m.perfil }));
vi.mock('./PerfilEditor.jsx', () => ({ PerfilEditor: ({ identitat }) => <p>{`fitxa de ${identitat.nom}`}</p> }));
vi.mock('./DetallCompte.jsx', () => ({ DetallCompte: ({ identitat }) => <p>{`compte de ${identitat.nom}`}</p> }));
vi.mock('./DetallPrivacitat.jsx', () => ({ DetallPrivacitat: ({ identitat }) => <p>{`privacitat de ${identitat.nom}`}</p> }));
vi.mock('./DetallVistes.jsx', () => ({ DetallVistes: ({ identitat }) => <p>{`vistes de ${identitat.nom}`}</p> }));
vi.mock('./DetallMultimedia.jsx', () => ({ DetallMultimedia: ({ identitat }) => <p>{`multimèdia de ${identitat.nom}`}</p> }));
vi.mock('./DialegNovaOrganitzacio.jsx', () => ({ DialegNovaOrganitzacio: () => null }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ title, children }) => <main><header className="page-title"><h1>{title}</h1></header>{children}</main>,
}));
import { MemoryRouter } from '../../app/contexts/RouterContext';
import { RUTA_PERFIL_PROJECTE } from '../../config/navigation.js';
import { ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG, IAIA_ID, PERSONA_PILOT } from '../../data/identitatsSeed.js';
import PerfilShell, { AccesFitxaPublica, ETIQUETA_FITXA_PUBLICA, accesAFitxaPublica } from './PerfilShell.jsx';

const UUID = '0b3f4e2a-9c1d-4e5f-8a7b-6c5d4e3f2a1b';
const javi = { id: 'jo', mena: 'persona', nom: 'Javi Llinares', dades: { id: PERSONA_PILOT.id, is_public: true } };
const forn = { id: 'O', mena: 'empresa', nom: 'Forn', dades: { role: 'owner', visibility: 'members' } };
const rober = { id: 'A', mena: 'agent', nom: 'Rober', dades: {} };

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  }
  // jsdom no fa layout: sense amplada, AppGridShell cauria a «estret» i amagaria la columna esquerra.
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1400 });
});
beforeEach(() => {
  m.perfil = {
    identitats: [javi, forn], carregant: false, error: null,
    guardarAjust: vi.fn(), pujaMitja: vi.fn(), recarrega: vi.fn(), creaOrganitzacio: vi.fn(),
  };
  m.ui = { externalConfig: {} };
  m.caps = new Set();
  m.toast.mockClear();
});
afterEach(cleanup);

/** L'explicació que el lector de pantalla llig amb el control (aria-describedby). */
const descripcioDe = (control) => {
  const id = control.getAttribute('aria-describedby');
  return id ? document.getElementById(id)?.textContent ?? '' : '';
};

describe('accesAFitxaPublica · on porta i si s’hi pot anar', () => {
  test('la persona del Mestre, a la seua ruta canònica neta: /javillinares', () => {
    expect(accesAFitxaPublica(javi)).toEqual({ ruta: '/javillinares', oberta: true, avis: null });
  });

  test('una altra persona, per l’id de la seua fila (mai «jo»); sense fila, cap botó', () => {
    const pep = { id: 'jo', mena: 'persona', nom: 'Pep', dades: { id: UUID, is_public: true } };
    expect(accesAFitxaPublica(pep)).toEqual({ ruta: `/gent/${UUID}`, oberta: true, avis: null });
    expect(accesAFitxaPublica({ id: 'jo', mena: 'persona', nom: 'Pep', dades: {} })).toBeNull();
    expect(accesAFitxaPublica(null)).toBeNull();
  });

  test('una persona amb la fitxa privada la pot obrir igualment (la seua fila la llig ella), i ho diu', () => {
    const privada = accesAFitxaPublica({ ...javi, dades: { ...javi.dades, is_public: false } });
    expect(privada.ruta).toBe('/javillinares');
    expect(privada.oberta).toBe(true);
    expect(privada.avis.etiqueta).toBe('Fitxa privada');
    expect(privada.avis.explicacio).toMatch(/ningú més veu la teua fitxa/);
    expect(privada.avis.explicacio).toMatch(/vore com quedarà/);
    // Sense valor desat (D1), pública, com la pinta l'editor (fitxaPublicada).
    expect(accesAFitxaPublica({ ...javi, dades: { id: PERSONA_PILOT.id } }).avis).toBeNull();
  });

  test('les organitzacions: el pilot a /socdepoble (o pel slug, a RUTA_PERFIL_PROJECTE), la resta a /empresa/:id o /grup/:id', () => {
    const publica = { role: 'owner', visibility: 'public' };
    expect(accesAFitxaPublica({ id: ENTITAT_PILOT_ID, mena: 'empresa', nom: 'Sóc de Poble', dades: publica }).ruta).toBe('/socdepoble');
    expect(accesAFitxaPublica({ id: UUID, mena: 'empresa', nom: 'Sóc de Poble', dades: { ...publica, slug: ENTITAT_PILOT_SLUG } }).ruta)
      .toBe(RUTA_PERFIL_PROJECTE);
    expect(accesAFitxaPublica({ id: 'O', mena: 'empresa', nom: 'Forn', dades: publica })).toEqual({ ruta: '/empresa/O', oberta: true, avis: null });
    expect(accesAFitxaPublica({ id: 'G', mena: 'grup', nom: 'Colla', dades: publica }).ruta).toBe('/grup/G');
  });

  test('una organització privada no s’obri: el directori del servidor només porta les públiques', () => {
    const acces = accesAFitxaPublica(forn);
    expect(acces.ruta).toBe('/empresa/O');
    expect(acces.oberta).toBe(false);
    expect(acces.avis.etiqueta).toBe('Fitxa privada');
    expect(acces.avis.explicacio).toMatch(/només la veuen les persones membres/);
    expect(acces.avis.explicacio).toMatch(/s’obrirà quan la fitxa siga pública/);
  });

  test('un agent IA, sempre públic: la IAIA a /iaia, la resta a /perfil/:id', () => {
    expect(accesAFitxaPublica({ id: IAIA_ID, mena: 'agent', nom: 'IAIA MarIA', dades: {} })).toEqual({ ruta: '/iaia', oberta: true, avis: null });
    expect(accesAFitxaPublica({ id: 'A', mena: 'agent', nom: 'Rober', dades: {} }).ruta).toBe('/perfil/A');
  });
});

describe('AccesFitxaPublica · el botó', () => {
  test('un enllaç de veres amb la pell del botó: el clic porta a la fitxa pública', () => {
    const rutes = [];
    render(
      <MemoryRouter rutaInicial="/el-meu-perfil" onCanvi={(ruta) => rutes.push(ruta)}>
        <AccesFitxaPublica identitat={javi} />
      </MemoryRouter>,
    );
    const enllac = screen.getByRole('link', { name: ETIQUETA_FITXA_PUBLICA });
    expect(enllac.getAttribute('href')).toBe('/javillinares');
    expect(enllac.classList.contains('sdp-boto')).toBe(true);
    expect(enllac.hasAttribute('aria-describedby')).toBe(false);
    fireEvent.click(enllac);
    expect(rutes.at(-1)).toBe('/javillinares');
  });

  test('privada: la persona l’obri igual, amb el candau i l’explicació lligada a l’enllaç', () => {
    const { container } = render(
      <MemoryRouter rutaInicial="/el-meu-perfil">
        <AccesFitxaPublica identitat={{ ...javi, dades: { ...javi.dades, is_public: false } }} />
      </MemoryRouter>,
    );
    const enllac = screen.getByRole('link', { name: ETIQUETA_FITXA_PUBLICA });
    expect(container.querySelector('.perfil-fitxa-publica__estat').textContent).toBe('Fitxa privada');
    expect(descripcioDe(enllac)).toMatch(/^Fitxa privada: Amb el candau tancat ningú més veu la teua fitxa/);
  });

  /* La porta inerta de la casa (PortesTargeta): aria-disabled i no `disabled`,
     perquè el teclat hi arribe i el lector en llija el motiu; en prémer-la, el
     toast diu per què (a una pantalla tàctil no hi ha `title`). No navega. */
  test('privada d’una organització: la porta inerta, enfocable, amb el motiu a la vista i en el toast', () => {
    const rutes = [];
    const { container } = render(
      <MemoryRouter rutaInicial="/el-meu-perfil" onCanvi={(ruta) => rutes.push(ruta)}>
        <AccesFitxaPublica identitat={forn} />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('link')).toBeNull();
    const boto = screen.getByRole('button', { name: ETIQUETA_FITXA_PUBLICA });
    expect(boto.disabled).toBe(false);
    expect(boto.getAttribute('aria-disabled')).toBe('true');
    boto.focus();
    expect(document.activeElement).toBe(boto);
    expect(container.querySelector('.perfil-fitxa-publica__estat').textContent).toBe('Fitxa privada');
    expect(descripcioDe(boto)).toMatch(/^Fitxa privada: .*s’obrirà quan la fitxa siga pública\.$/);
    fireEvent.click(boto);
    expect(m.toast).toHaveBeenCalledTimes(1);
    expect(m.toast).toHaveBeenCalledWith(accesAFitxaPublica(forn).avis.explicacio);
    expect(rutes).not.toContain('/empresa/O');
  });

  test('sense ruta no pinta res; el nom ve de l’i18n quan n’hi ha', () => {
    const { container } = render(
      <MemoryRouter rutaInicial="/el-meu-perfil">
        <AccesFitxaPublica identitat={{ id: 'jo', mena: 'persona', nom: 'Pep', dades: {} }} />
        <AccesFitxaPublica identitat={javi} etiqueta="Ver ficha pública" />
      </MemoryRouter>,
    );
    expect(container.querySelectorAll('.perfil-fitxa-publica')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Ver ficha pública' }).getAttribute('href')).toBe('/javillinares');
  });
});

describe('dins de l’espai de treball del Perfil', () => {
  const detall = (container) => container.querySelector('.sdp-workspace-detail');
  const navegacio = () => screen.getByRole('navigation', { name: 'PERFIL' });

  test('damunt de cada apartat d’una identitat, fora de l’editor; mai en una utilitat', () => {
    const rutes = [];
    const { container } = render(
      <MemoryRouter rutaInicial="/el-meu-perfil" onCanvi={(ruta) => rutes.push(ruta)}>
        <PerfilShell />
      </MemoryRouter>,
    );
    // En entrar, la fitxa de la persona: la fila del botó primer, l'editor després.
    const fila = detall(container).querySelector('.perfil-fitxa-publica');
    expect(fila).not.toBeNull();
    expect(fila.nextElementSibling.textContent).toBe('fitxa de Javi Llinares');
    const enllac = within(fila).getByRole('link', { name: ETIQUETA_FITXA_PUBLICA });
    expect(enllac.getAttribute('href')).toBe('/javillinares');

    // També a «El compte»: sempre a la vista dins de l'espai d'una identitat.
    fireEvent.click(within(container).getByRole('button', { name: /El compte/ }));
    expect(within(detall(container)).getByText('compte de Javi Llinares')).toBeTruthy();
    expect(within(detall(container)).getByRole('link', { name: ETIQUETA_FITXA_PUBLICA }).getAttribute('href')).toBe('/javillinares');

    // Una organització privada: el botó hi és, inert (aria-disabled).
    fireEvent.click(within(navegacio()).getByRole('button', { name: 'Forn' }));
    expect(within(detall(container)).getByText('fitxa de Forn')).toBeTruthy();
    expect(within(detall(container)).getByRole('button', { name: ETIQUETA_FITXA_PUBLICA }).getAttribute('aria-disabled')).toBe('true');

    // Una utilitat no és cap identitat: cap fila.
    fireEvent.click(within(navegacio()).getByRole('button', { name: 'Gestoria de Poble' }));
    expect(detall(container).querySelector('.perfil-fitxa-publica')).toBeNull();

    // Tornar a la persona i clicar: el router porta a la fitxa pública.
    fireEvent.click(within(navegacio()).getByRole('button', { name: 'Javi Llinares' }));
    fireEvent.click(within(detall(container)).getByRole('link', { name: ETIQUETA_FITXA_PUBLICA }));
    expect(rutes.at(-1)).toBe('/javillinares');
  });

  /* Tots els apartats de cada mena d'identitat (perfilModel.js · itemsDePerfil):
     la fila és el primer fill del detall i l'apartat ve just darrere. «Privacitat
     i dades» només ix amb la capacitat de compte; «Els nodes» és el de veres
     (DetallEspai.jsx), dins de la UniversalPage simulada. */
  test.each([
    ['Javi Llinares', 'La fitxa', 'fitxa de Javi Llinares', '/javillinares'],
    ['Javi Llinares', 'Les vistes', 'vistes de Javi Llinares', '/javillinares'],
    ['Javi Llinares', 'El compte', 'compte de Javi Llinares', '/javillinares'],
    ['Javi Llinares', 'Privacitat i dades', 'privacitat de Javi Llinares', '/javillinares'],
    ['Javi Llinares', 'Els nodes', 'Els nodes', '/javillinares'],
    ['Javi Llinares', 'Multimèdia', 'multimèdia de Javi Llinares', '/javillinares'],
    ['Forn', 'La fitxa', 'fitxa de Forn', null],
    ['Forn', 'Les vistes', 'vistes de Forn', null],
    ['Forn', 'El compte', 'compte de Forn', null],
    ['Forn', 'Multimèdia', 'multimèdia de Forn', null],
    ['Rober', 'La fitxa', 'fitxa de Rober', '/perfil/A'],
    ['Rober', 'Les vistes', 'vistes de Rober', '/perfil/A'],
    ['Rober', 'Multimèdia', 'multimèdia de Rober', '/perfil/A'],
  ])('%s · «%s»: la fila, primer fill del detall, damunt de l’apartat', (nom, apartat, textApartat, ruta) => {
    m.caps = new Set(['compte']);
    m.perfil = { ...m.perfil, identitats: [javi, forn, rober] };
    const { container } = render(
      <MemoryRouter rutaInicial="/el-meu-perfil">
        <PerfilShell />
      </MemoryRouter>,
    );
    fireEvent.click(within(navegacio()).getByRole('button', { name: nom }));
    fireEvent.click(within(container).getByRole('button', { name: new RegExp(apartat) }));
    const fila = detall(container).firstElementChild;
    expect(fila.classList.contains('perfil-fitxa-publica')).toBe(true);
    expect(fila.nextElementSibling.textContent).toContain(textApartat);
    if (ruta) {
      expect(within(fila).getByRole('link', { name: ETIQUETA_FITXA_PUBLICA }).getAttribute('href')).toBe(ruta);
    } else {
      expect(within(fila).getByRole('button', { name: ETIQUETA_FITXA_PUBLICA }).getAttribute('aria-disabled')).toBe('true');
    }
  });

  test('sense cap organització, «Grups i empreses» no és cap identitat: cap fila', () => {
    m.perfil = { ...m.perfil, identitats: [javi] };
    const { container } = render(
      <MemoryRouter rutaInicial="/el-meu-perfil">
        <PerfilShell />
      </MemoryRouter>,
    );
    fireEvent.click(within(navegacio()).getByRole('button', { name: 'Encara no en tens cap' }));
    expect(within(detall(container)).getByRole('heading', { name: 'Grups i empreses' })).toBeTruthy();
    expect(detall(container).querySelector('.perfil-fitxa-publica')).toBeNull();
  });

  test('el nom del botó passa per l’i18n de la secció (section.perfil.fitxaPublica)', () => {
    const t = vi.fn((clau, reserva) => (clau === 'section.perfil.fitxaPublica' ? 'Ver ficha pública' : (reserva ?? clau)));
    m.ui = { externalConfig: {}, t };
    const { container } = render(
      <MemoryRouter rutaInicial="/el-meu-perfil">
        <PerfilShell />
      </MemoryRouter>,
    );
    expect(t).toHaveBeenCalledWith('section.perfil.fitxaPublica', ETIQUETA_FITXA_PUBLICA);
    expect(within(detall(container)).getByRole('link', { name: 'Ver ficha pública' }).getAttribute('href')).toBe('/javillinares');
    expect(within(detall(container)).queryByRole('link', { name: ETIQUETA_FITXA_PUBLICA })).toBeNull();
  });
});
