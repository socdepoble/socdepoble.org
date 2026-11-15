import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { escaneja } from '../../../tooling/gates/tractor-vocabulari.mjs';
import { RouterContext } from '../../app/contexts/objectesDeContext.js';
import {
  PREGUNTES_ISOGLOSSES,
  calculaAfinitatComarcal,
  construeixOpcionsVivesPregunta,
  desaPerfilTerritoriJoc,
  rutaDebatXatParaula,
} from './isoglossesComarcals.js';
import { JocDonParlesCard } from './JocDonParlesCard.jsx';

const backendMock = {
  lligConsensIsoglossesPoble: vi.fn(),
  votaVariantIsoglossaPoble: vi.fn(),
  desaAportacioVeuPoble: vi.fn(),
};

const parlaMock = vi.fn(() => Promise.resolve({ ok: true }));
const aturaMock = vi.fn();

vi.mock('../../data/backendPort.js', () => ({
  getBackendImplementation: () => backendMock,
}));

vi.mock('../../services/veuIaiaService.js', () => ({
  parla: (...args) => parlaMock(...args),
  atura: (...args) => aturaMock(...args),
}));

describe('JocDonParlesCard · Fase 2 (IDEA-252 + IDEA-257)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
    backendMock.lligConsensIsoglossesPoble.mockResolvedValue([]);
    backendMock.votaVariantIsoglossaPoble.mockResolvedValue({ ok: true });
    backendMock.desaAportacioVeuPoble.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    cleanup();
  });

  it('mostra Querilla i Queraïlla de La Torre de les Maçanes (L’Alacantí), avança en votar i manté enllaç SPA al Xat en tots els passos', async () => {
    const navigate = vi.fn();
    render(
      <RouterContext.Provider value={{ navigate, basename: '', currentPath: '/mur/la-veu-de-soc-de-poble' }}>
        <JocDonParlesCard />
      </RouterContext.Provider>
    );

    expect(screen.getByText('Paraula 1 de 12')).toBeTruthy();
    const botoQuerilla = screen.getByRole('button', { name: /Querilla/i });
    expect(botoQuerilla.textContent).toContain('La Torre de les Maçanes (L’Alacantí)');
    expect(botoQuerilla.textContent).not.toContain('El Comtat');

    const enllacPas1 = screen.getByRole('link', { name: /Debatre este pas al Xat de Poble/i });
    expect(enllacPas1.getAttribute('href')).toBe(rutaDebatXatParaula(PREGUNTES_ISOGLOSSES[0]));
    fireEvent.click(enllacPas1);
    expect(navigate).toHaveBeenCalledWith(rutaDebatXatParaula(PREGUNTES_ISOGLOSSES[0]));

    fireEvent.click(botoQuerilla);
    await waitFor(() => {
      expect(backendMock.votaVariantIsoglossaPoble).toHaveBeenCalledWith(
        expect.objectContaining({
          preguntaId: 'q01_creilla',
          variantClau: 'querilla',
          paraulaEtiqueta: 'Querilla',
        })
      );
    });

    expect(screen.getByText('Paraula 2 de 12')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Aspencat/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /^Espencat/i }));
    expect(screen.getByText('Paraula 3 de 12')).toBeTruthy();
    const enllacPas3 = screen.getByRole('link', { name: /Debatre este pas al Xat de Poble/i });
    expect(enllacPas3.getAttribute('href')).toContain('sobre=publicacio%3Ala-veu-de-soc-de-poble');
  });

  /* Onada R24.2 (revisió adversarial) · El vot remot no pren el poble, la
     comarca ni l'abast del cubell de la variant (el de «Querilla» és La Torre
     de les Maçanes, L'Alacantí, 'nomes_poble'): porta només el que ha
     declarat qui vota, i votar no tria cap abast. */
  it('R24.2 · sense poble ni comarca al perfil del joc, el vot remot porta poble i comarca null i l’abast «no ho sé», mai els del cubell', async () => {
    render(<JocDonParlesCard />);
    fireEvent.click(screen.getByRole('button', { name: /Querilla/i }));
    await waitFor(() => expect(backendMock.votaVariantIsoglossaPoble).toHaveBeenCalledTimes(1));
    expect(backendMock.votaVariantIsoglossaPoble.mock.calls[0]).toEqual([{
      preguntaId: 'q01_creilla',
      variantClau: 'querilla',
      paraulaEtiqueta: 'Querilla',
      poble: null,
      comarcaId: null,
      abastComarcal: 'no_ho_se',
    }]);
  });

  it('R24.2 · amb el poble i la comarca del perfil del joc, el vot porta eixos, no els del cubell', async () => {
    desaPerfilTerritoriJoc({ poble: 'Xixona', comarcaId: 'alcoia' });
    render(<JocDonParlesCard />);
    fireEvent.click(screen.getByRole('button', { name: /Querilla/i }));
    await waitFor(() => expect(backendMock.votaVariantIsoglossaPoble).toHaveBeenCalledTimes(1));
    expect(backendMock.votaVariantIsoglossaPoble.mock.calls[0]).toEqual([{
      preguntaId: 'q01_creilla',
      variantClau: 'querilla',
      paraulaEtiqueta: 'Querilla',
      poble: 'Xixona',
      comarcaId: 'alcoia',
      abastComarcal: 'no_ho_se',
    }]);
  });

  it('permet aportar una paraula pròpia amb Poble + Comarca + Abast separats, sincronitza pel port neutral i avança al pas següent', async () => {
    render(<JocDonParlesCard />);

    fireEvent.click(screen.getByRole('button', { name: /Al meu poble ho diem d’una altra manera/i }));

    fireEvent.change(screen.getByLabelText(/Paraula o expressió del teu poble/i), {
      target: { value: 'Creïlla de secà' },
    });
    fireEvent.change(screen.getByLabelText(/^Poble$/i), {
      target: { value: 'La Torre de les Maçanes' },
    });
    fireEvent.change(screen.getByLabelText(/^Comarca \(opcional\)$/i), {
      target: { value: 'alacanti' },
    });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Desar paraula i passar a la següent/i }));

    await waitFor(() => {
      expect(backendMock.desaAportacioVeuPoble).toHaveBeenCalledWith(
        expect.objectContaining({
          tipus: 'variant_isoglossa',
          paraula: 'Creïlla de secà',
          poble: 'La Torre de les Maçanes',
          comarcaId: 'alacanti',
          abastComarcal: 'nomes_poble',
          consentimentArxiuObert: true,
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Paraula 2 de 12')).toBeTruthy();
    });
    expect(screen.getAllByText(/Creïlla de secà/).length).toBeGreaterThanOrEqual(2);
  });

  it('completa les 12 isoglosses, calcula l’afinitat alacantina, pronuncia la veu recomanada i oferix debat al Xat', async () => {
    render(<JocDonParlesCard />);

    const seleccions = [
      /^Creïlla/i,
      /^Espencat/i,
      /^Bresquilla/i,
      /^Granera/i,
      /^Pual/i,
      /^Tomaca/i,
      /^Pimentó/i,
      /^Rabosa/i,
      /^Bajoques/i,
      /^Espill/i,
      /^Avui i eixir/i,
      /^Comboi/i,
    ];

    for (const patro of seleccions) {
      fireEvent.click(screen.getByRole('button', { name: patro }));
    }

    expect(screen.getByRole('heading', { name: /L’Alacantí i les Valls del Vinalopó/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Debatre al Xat de Poble/i }).getAttribute('href')).toContain(
      'sobre=publicacio%3Ala-veu-de-soc-de-poble'
    );

    const botoActivaVeu = screen.getByRole('button', { name: /Activa esta veu com a preferida/i });
    fireEvent.click(botoActivaVeu);

    await waitFor(() => {
      expect(parlaMock).toHaveBeenCalledWith(
        expect.stringContaining('Veu activada'),
        expect.objectContaining({ veu: 'gina_valencia' })
      );
    });

    /* R23-U04: permet revisar les respostes sense esborrar-les (torna a la paraula 12 amb l'opció activa) */
    fireEvent.click(screen.getByRole('button', { name: /Revisar respostes/i }));
    expect(screen.getByText('Paraula 12 de 12')).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Comboi/i }).getAttribute('aria-pressed')).toBe('true');
  });

  it('R23-U02: quan localStorage llança QuotaExceededError conserva el text escrit i mostra avís honest sense dir «guardada»', async () => {
    render(<JocDonParlesCard />);

    fireEvent.click(screen.getByRole('button', { name: /Al meu poble ho diem d’una altra manera/i }));
    const campParaula = screen.getByLabelText(/Paraula o expressió del teu poble/i);
    fireEvent.change(campParaula, { target: { value: 'Querilla vella' } });
    fireEvent.change(screen.getByLabelText(/^Poble$/i), { target: { value: 'Xixona' } });
    fireEvent.click(screen.getByRole('checkbox'));

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    try {
      fireEvent.click(screen.getByRole('button', { name: /Desar paraula i passar a la següent/i }));
      expect(screen.getByText(/memòria local del navegador està plena o blocada/i)).toBeTruthy();
      expect(campParaula.value).toBe('Querilla vella');
      expect(screen.getByText('Paraula 1 de 12')).toBeTruthy();
      expect(screen.queryByText(/guardada en este dispositiu/i)).toBeNull();
    } finally {
      setItemSpy.mockRestore();
    }
  });

  it('R23-U03: el vot local en una opció viva és idempotent per pregunta i mai infla el comptador en anar enrere i tornar a clicar', () => {
    render(<JocDonParlesCard />);

    const botoInicial = screen.getByRole('button', { name: /Querilla/i });
    expect(botoInicial.textContent).toContain('1 ·');

    /* Vot 1: puja de 1 (llavor) a 2 (llavor + selecció local) */
    fireEvent.click(botoInicial);
    expect(screen.getByText('Paraula 2 de 12')).toBeTruthy();

    /* Tornem enrere al pas 1: continua sent 2, i en tornar a clicar NO puja a 3 */
    fireEvent.click(screen.getByRole('button', { name: /Anterior/i }));
    expect(screen.getByRole('button', { name: /Querilla/i }).textContent).toContain('2 ·');
    fireEvent.click(screen.getByRole('button', { name: /Querilla/i }));
    fireEvent.click(screen.getByRole('button', { name: /Anterior/i }));
    expect(screen.getByRole('button', { name: /Querilla/i }).textContent).toContain('2 ·');

    /* Si ara canvia a «Creïlla» (opció base), el vot local es retira de «Querilla» i torna a 1 */
    fireEvent.click(screen.getByRole('button', { name: /^Creïlla/i }));
    fireEvent.click(screen.getByRole('button', { name: /Anterior/i }));
    expect(screen.getByRole('button', { name: /Querilla/i }).textContent).toContain('1 ·');
  });

  it('R23-U05: manté coherents els cubells (poble + comarca) sense barrejar Alcoi amb L’Alacantí i pondera afinitat', () => {
    const resumRemot = [
      {
        pregunta_id: 'q02_espencat',
        variant_clau: 'mullador_torrat',
        paraula_etiqueta: 'Mullador torrat',
        poble_exemple: 'Alcoi',
        comarca_id: 'alcoia',
        total_vots: 8,
      },
      {
        pregunta_id: 'q02_espencat',
        variant_clau: 'mullador_torrat',
        paraula_etiqueta: 'Mullador torrat',
        poble_exemple: 'Xixona',
        comarca_id: 'alacanti',
        total_vots: 2,
      },
    ];

    const vives = construeixOpcionsVivesPregunta('q02_espencat', [], resumRemot);
    const mullador = vives.find((v) => v.clauMot === 'mullador_torrat');
    expect(mullador).toBeTruthy();
    expect(mullador.vots).toBe(10);
    expect(mullador.poble).toBe('Alcoi');
    expect(mullador.comarcaId).toBe('alcoia');
    expect(mullador.detall).toContain('Alcoi (L’Alcoià)');
    expect(mullador.detall).not.toContain('Alcoi (L’Alacantí)');

    const afin = calculaAfinitatComarcal(
      { q02_espencat: 'viva:q02_espencat:mullador_torrat' },
      [],
      resumRemot
    );
    const puntsAlcoia = afin.ranquing.find((r) => r.area.id === 'comtat_alcoia_marina')?.punts || 0;
    const puntsAlacanti = afin.ranquing.find((r) => r.area.id === 'alacanti_vinalopo')?.punts || 0;
    expect(puntsAlcoia).toBeCloseTo(4.8, 3);
    expect(puntsAlacanti).toBeCloseTo(1.2, 3);
  });
});

/* Onada R29 · R29-CV-03 · El joc calla la seua locució en desmuntar-se i en canviar de pregunta,
   i no toca la veu d'una altra peça. */
describe('Onada R29 · veu del joc «D’on parles?»', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
    backendMock.lligConsensIsoglossesPoble.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
  });

  const avortada = () => Object.assign(new Error('Locució aturada.'), { codi: 'VEU_AVORTADA' });

  it('R29-CV-03 · desmuntar el joc mentre llig la pregunta atura la veu', async () => {
    parlaMock.mockImplementationOnce(() => new Promise(() => {}));
    const { unmount } = render(<JocDonParlesCard />);
    fireEvent.click(screen.getByRole('button', { name: /Escoltar paraules/i }));
    await waitFor(() => expect(parlaMock).toHaveBeenCalledTimes(1));
    expect(aturaMock).not.toHaveBeenCalled();
    unmount();
    expect(aturaMock).toHaveBeenCalledTimes(1);
  });

  it('R29-CV-03 · avançar de pregunta mentre llig atura la veu i el botó torna a «Escoltar paraules»', async () => {
    parlaMock.mockImplementationOnce(() => new Promise(() => {}));
    render(<JocDonParlesCard />);
    fireEvent.click(screen.getByRole('button', { name: /Escoltar paraules/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /^Atura$/i }).getAttribute('aria-pressed')).toBe('true'));

    fireEvent.click(screen.getByRole('button', { name: /Querilla/i }));
    expect(screen.getByText('Paraula 2 de 12')).toBeTruthy();
    expect(aturaMock).toHaveBeenCalledTimes(1);
    const boto = screen.getByRole('button', { name: /Escoltar paraules/i });
    expect(boto.getAttribute('aria-pressed')).toBe('false');
  });

  it('R29-CV-03 · sense locució pròpia, desmuntar o avançar no calla la veu d’una altra peça', async () => {
    const { unmount } = render(<JocDonParlesCard />);
    fireEvent.click(screen.getByRole('button', { name: /Querilla/i }));
    expect(screen.getByText('Paraula 2 de 12')).toBeTruthy();
    unmount();
    expect(aturaMock).not.toHaveBeenCalled();
  });

  it('R29-CV-03 · una locució del joc que talla una altra peça torna el botó a «Escoltar paraules»', async () => {
    let rebutja;
    parlaMock.mockImplementationOnce(() => new Promise((_, no) => { rebutja = no; }));
    const { unmount } = render(<JocDonParlesCard />);
    fireEvent.click(screen.getByRole('button', { name: /Escoltar paraules/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /^Atura$/i })).toBeTruthy());
    await act(async () => { rebutja(avortada()); });
    expect(screen.getByRole('button', { name: /Escoltar paraules/i }).getAttribute('aria-pressed')).toBe('false');
    unmount();
    expect(aturaMock).not.toHaveBeenCalled();
  });
});

/* Onada R29 · R29-02-2 · La regla del modificador de variant viva era morta (la base, darrere a
   la mateixa capa, la trepitjava): fora del full i fora del JSX alhora, o la porta del vocabulari para. */
describe('Onada R29 · R29-02-2 · opcions vives sense modificador mort', () => {
  afterEach(() => {
    cleanup();
  });

  it('el full diferit ja no declara el modificador i les opcions vives pinten la classe base', () => {
    const full = readFileSync(path.join(process.cwd(), 'src/css/diferit-joc-parla.css'), 'utf8');
    expect(full).not.toMatch(/opcio--viva/);
    render(<JocDonParlesCard />);
    const querilla = screen.getByRole('button', { name: /Querilla/i });
    expect(querilla.className).toBe('sdp-joc-parla__opcio');
  });

  it('porta del vocabulari: JocDonParlesCard.jsx no té cap classe forastera', () => {
    const { infraccions, vocab } = escaneja();
    expect(vocab.has('sdp-joc-parla__opcio')).toBe(true);
    const propies = infraccions.filter((i) => i.fitxer.split(path.sep).join('/') === 'src/components/patrimoni/JocDonParlesCard.jsx');
    expect(propies.map((i) => `${i.linia} [${i.regla}] ${i.token}`)).toEqual([]);
  }, 120000);
});
