import { readFileSync } from 'node:fs';
import path from 'node:path';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext.jsx';
import { UIProvider } from '../../app/contexts/UIContext.jsx';
import {
  ATRIBUCIO_RENTONAR,
  CRONOLOGIA_HISTORICA_RENTONAR,
  ESTATUTS_VIGENTS_RENTONAR,
  FITXA_REGISTRAL_RENTONAR,
  PLANTILLA_ACTA_ASSEMBLEA_RENTONAR
} from '../../data/patrimoni/actaRentonar.js';

const identitatMock = vi.hoisted(() => ({ memberships: [], actor: null, setActor: vi.fn() }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({
  useIdentitat: () => identitatMock,
  useIdentitatOpcional: () => identitatMock
}));

import DocumentacioHistoricaRentonar from './DocumentacioHistoricaRentonar.jsx';
import { ATRIBUCIO_PERFIL_RENTONAR, FitxaPublica, perfilFundacionalDelPaquet } from './PerfilPublicSection.jsx';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const preparaMatchMedia = () => vi.stubGlobal('matchMedia', vi.fn((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn()
})));

const muntaFitxa = (perfil) => render(
  <UIProvider>
    <MemoryRouter initialEntries={['/rentonar']}>
      <FitxaPublica perfil={perfil} />
    </MemoryRouter>
  </UIProvider>
);

describe('AH-R17-10 · Documentació històrica, estatutària i model d’acta d’El Rentonar', () => {
  test('zero dades personals ni identificadors sense font al mòdul públic actaRentonar.js', () => {
    const font = readFileSync(path.resolve(process.cwd(), 'src/data/patrimoni/actaRentonar.js'), 'utf8');
    expect(font).not.toMatch(/\b\d{8}[A-HJ-NP-TV-Z]\b/);
    /* Arbitratge R18 (P1) · Ni NIE ni els noms de les persones particulars que signaren l'adaptació de 2004. */
    expect(font).not.toMatch(/\b[XYZ]\d{7}[A-Z]\b/);
    expect(font).not.toMatch(/Giner|Gisbert/);
    expect(FITXA_REGISTRAL_RENTONAR).not.toHaveProperty('signatarisAdaptacio2004');
    expect(FITXA_REGISTRAL_RENTONAR).not.toHaveProperty('duns');
    expect(FITXA_REGISTRAL_RENTONAR).not.toHaveProperty('correuInstitucional');
    expect(FITXA_REGISTRAL_RENTONAR.numeroRegistre).toBe('4444 · Secció Primera');
    expect(FITXA_REGISTRAL_RENTONAR.cifEntitat).toBe('G-03967668');
    expect(ATRIBUCIO_RENTONAR).toBe('CC BY-NC-SA 4.0 Pedro Ferrer Rodriguez · El Rentonar. Natura i Patrimoni.');
    /* La còpia de la fitxa (PerfilPublicSection.jsx, fora del tros diferit) és idèntica a la font. */
    expect(ATRIBUCIO_PERFIL_RENTONAR).toBe(ATRIBUCIO_RENTONAR);
    expect(CRONOLOGIA_HISTORICA_RENTONAR).toHaveLength(6);
    expect(ESTATUTS_VIGENTS_RENTONAR.finsArticle4.length).toBeGreaterThanOrEqual(4);
    expect(PLANTILLA_ACTA_ASSEMBLEA_RENTONAR.ordreDelDia).toHaveLength(5);
  });

  test('navega per les 3 pestanyes accessibles (Història 1994–2026, Estatuts LO 1/2002 i Model d’Acta imprimible)', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(
      <MemoryRouter>
        <DocumentacioHistoricaRentonar />
      </MemoryRouter>
    );

    const seccio = screen.getByTestId('documentacio-historica-rentonar');
    expect(within(seccio).getByText(/Registre GVA 4444 · Secció Primera/)).toBeTruthy();
    expect(within(seccio).getByText(/Poc a poc s’encén el foc/)).toBeTruthy();
    expect(within(seccio).getByText(ATRIBUCIO_RENTONAR)).toBeTruthy();
    /* Arbitratge R18 · La fitxa registral pública: el CIF de l'entitat, cap signatari ni identificador sense font. */
    expect([...seccio.querySelectorAll('dt')].map((dt) => dt.textContent)).toEqual([
      'Denominació estatutària', 'Denominació fundacional (1994)', 'Inscripció autonòmica',
      'Resolució i diligència', 'CIF', 'Seu social estatutària', 'Règim de governança'
    ]);
    /* Arbitratge R18 (P1, Pedra Seca) · Cap classe d'administració a una fitxa pública. */
    expect(seccio.querySelector('[class*="sdp-admin-"]')).toBeNull();
    expect(seccio.querySelectorAll('.sdp-subtargeta').length).toBeGreaterThan(1);

    fireEvent.click(within(seccio).getByRole('tab', { name: /Estatuts Vigents/i }));
    expect(within(seccio).getByRole('heading', { name: /Article 4 · Fins estatutaris/i })).toBeTruthy();
    expect(within(seccio).getByText(/Defensar el medi ambient i el patrimoni històric-cultural/i)).toBeTruthy();

    fireEvent.click(within(seccio).getByRole('tab', { name: /Model d’Acta Assembleària/i }));
    expect(within(seccio).getByRole('heading', { name: /Model Institucional d’Acta/i })).toBeTruthy();
    /* Arbitratge R18 (P1) · El model diu que és un model i no porta l'atribució de Pedro Ferrer. */
    expect(within(seccio).getByText('Model redactat per Sóc de Poble; no és cap acta aprovada.')).toBeTruthy();
    expect(within(seccio).queryByText(ATRIBUCIO_RENTONAR)).toBeNull();
    /* Només la pestanya activa nomena el seu panell, i el panell hi és. */
    expect(within(seccio).getAllByRole('tab').map((tab) => tab.getAttribute('aria-controls')))
      .toEqual([null, null, 'panel-rentonar-acta']);
    expect(seccio.querySelector('#panel-rentonar-acta[role="tabpanel"]')).not.toBeNull();
    fireEvent.click(within(seccio).getByRole('button', { name: /Imprimir model d’acta/i }));
    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  test('FitxaPublica de Rentonar carrega el dossier històric lazy i mostra l’atribució CC BY-NC-SA 4.0', async () => {
    preparaMatchMedia();
    const perfilRentonar = perfilFundacionalDelPaquet('rentonar');
    expect(perfilRentonar).not.toBeNull();

    const { container } = muntaFitxa(perfilRentonar);

    const bloc = await screen.findByTestId('documentacio-historica-rentonar');
    expect(bloc).toBeTruthy();
    expect(screen.getAllByText(ATRIBUCIO_RENTONAR).length).toBeGreaterThanOrEqual(1);
    expect(container.querySelector('.page-title-copyright').textContent).toBe(ATRIBUCIO_RENTONAR);
  });

  /* Arbitratge R18 (P2) · Rentonar es reconeix com les altres identitats del Mestre
     (clauFundacional), mai pel slug que torna el servidor: un grup homònim d'un
     altre poble no rep ni el dossier ni l'atribució. */
  test('un grup «rentonar» d’un altre poble no rep el dossier ni l’atribució', async () => {
    preparaMatchMedia();
    const homonim = {
      ...perfilFundacionalDelPaquet('rentonar'),
      id: '7f1c2b3a-0000-4000-8000-000000000001',
      slug: 'rentonar',
      poble: 'Un altre poble'
    };

    const { container } = muntaFitxa(homonim);

    await screen.findByRole('heading', { level: 1 });
    expect(container.querySelector('.page-title-copyright').textContent).toBe('© Rentonar');
    expect(screen.queryByTestId('documentacio-historica-rentonar')).toBeNull();
    expect(screen.queryByText(ATRIBUCIO_RENTONAR)).toBeNull();
  });
});
