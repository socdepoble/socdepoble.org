import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from '../../app/contexts/RouterContext';
import { UIActionsContext, UIContext } from '../../app/contexts/objectesDeContext.js';
import { compartitPendent, descartaCompartit } from '../../config/compartirNatiu.js';
import { delVal } from '../../config/storage.js';
import JocCadaCosaAlSeuLlocPage from './JocCadaCosaAlSeuLlocPage.jsx';
import {
  CLAU_STORAGE_JOC_BASE,
  pujaMiniaturaBloggerAS640,
  importaContingutUniversal,
  creaEstatInicialJoc,
  LLAVOR_RAPIDA_JOC,
} from './jocCadaCosaModel.js';
import { CORPUS_JOC_600, METADADES_CORPUS_JOC_600 } from '../../data/taxonomia/corpusJoc600.js';

const UI_ACTIONS_FIXTURE = { resolveAsset: (x) => x };

function renderitzaJoc(language = 'ca') {
  return render(
    <MemoryRouter initialEntries={['/cada-cosa-al-seu-lloc']}>
      <UIActionsContext.Provider value={UI_ACTIONS_FIXTURE}>
        <UIContext.Provider value={{ language, themeMode: 'light', externalConfig: {} }}>
          <JocCadaCosaAlSeuLlocPage />
        </UIContext.Provider>
      </UIActionsContext.Provider>
    </MemoryRouter>
  );
}

describe('JocCadaCosaAlSeuLlocPage · IDEA-348 (UniversalPage, 4 Modes Pedra Seca, Prosa H3 i Corpus 600)', () => {
  beforeEach(() => {
    delVal(CLAU_STORAGE_JOC_BASE);
    descartaCompartit();
  });

  afterEach(() => {
    cleanup();
    delVal(CLAU_STORAGE_JOC_BASE);
    descartaCompartit();
    vi.restoreAllMocks();
  });

  test('el corpus empíric deduplicat conté exactament 600 obres úniques amb fotos Hero reals d’El Rentonar', () => {
    expect(CORPUS_JOC_600).toHaveLength(600);
    expect(METADADES_CORPUS_JOC_600.totalPublicacionsUniques).toBe(600);
    expect(METADADES_CORPUS_JOC_600.ambFotoReal).toBeGreaterThan(400);
    expect(
      pujaMiniaturaBloggerAS640('https://blogger.googleusercontent.com/img/b/abc/s72-c/foto.jpg')
    ).toBe('https://blogger.googleusercontent.com/img/b/abc/w640-h360-p-k-no-nu/foto.jpg');
  });

  test('UniversalPage canònica amb logotip de Sóc de Poble + Joc primer + Prosa .cms-preview començant directament en H3', () => {
    const { container } = renderitzaJoc('ca');

    // Capçalera UniversalPage amb logotip de Sóc de Poble, H1, H2 i entradilla
    expect(container.querySelector('header.page-title img.page-title-logo')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1, name: 'Cada cosa al seu lloc' })).toBeTruthy();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /Joc viu per ordenar 600 publicacions i carpetes personals/i,
      })
    ).toBeTruthy();
    expect(screen.getByText(/Les cistelles grans són Categories/i)).toBeTruthy();

    // Ordre documental: el taulell del joc va ABANS que la prosa explicativa
    const taulell = screen.getByTestId('taulell-joc-viu');
    const historia = screen.getByTestId('historia-humana-sota-joc');
    expect(historia.classList.contains('cms-preview')).toBe(true);

    const posicio = taulell.compareDocumentPosition(historia);
    expect(Boolean(posicio & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);

    // Zero H2 dins del cos explicatiu i inici directe en H3 + Llei 0 d'honestedat radical
    expect(within(historia).queryAllByRole('heading', { level: 2 })).toHaveLength(0);
    const h3s = within(historia).getAllByRole('heading', { level: 3 });
    expect(h3s.length).toBeGreaterThanOrEqual(4);
    expect(h3s[0].textContent).toMatch(/Per què hem creat «Cada cosa al seu lloc»\?/i);
    expect(within(historia).getAllByText(/estem aprenent i investigant/i).length).toBeGreaterThan(0);
    expect(within(historia).getAllByText(/no tenim cap algorisme màgic/i).length).toBeGreaterThan(0);
  });

  test('commuta entre els 4 modes (Carta, Pissarra 2D, Canals RSS i Equilibri) conservant les dades', () => {
    renderitzaJoc('ca');

    const botoDefensa = screen.getByRole('button', {
      name: /1\.\s*⚖️ Defensa del Territori i Ecologia/i,
    });
    fireEvent.click(botoDefensa);

    fireEvent.click(screen.getByRole('tab', { name: /2\.\s*📌 Pissarra 2D/i }));
    expect(screen.getByTestId('pissarra-suro-2d')).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: /3\.\s*📡 Canals RSS/i }));
    expect(screen.getByRole('heading', { level: 4, name: /📥 Safata «Revisar»/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: /4\.\s*🌳 Equilibri i Targetes/i }));
    expect(screen.getByText(/Opció A · Amb el Gran Tronc visible/i)).toBeTruthy();
    expect(screen.getByText(/Opció B · Només Categoria \+ Etiquetes/i)).toBeTruthy();
  });

  test('muta en calent Etiqueta <-> Categoria a la Pissarra 2D i permet moure amb teclat i desfer', () => {
    renderitzaJoc('ca');

    fireEvent.click(screen.getByRole('tab', { name: /2\.\s*📌 Pissarra 2D/i }));
    const pissarra = screen.getByTestId('pissarra-suro-2d');

    const nodeMosaic = pissarra.querySelector('[data-concepte-id="tag-mosaic-mediterrani"]');
    expect(nodeMosaic?.getAttribute('data-concepte-rol')).toBe('etiqueta');

    const botoFesCategoria = within(nodeMosaic).getByRole('button', { name: /↑ Fes Categoria/i });
    fireEvent.click(botoFesCategoria);

    const nodePromogut = pissarra.querySelector('[data-concepte-id="tag-mosaic-mediterrani"]');
    expect(nodePromogut?.getAttribute('data-concepte-rol')).toBe('categoria');

    const leftInicial = nodePromogut.style.left;
    fireEvent.keyDown(nodePromogut, { key: 'ArrowRight' });
    expect(nodePromogut.style.left).not.toBe(leftInicial);

    fireEvent.click(screen.getByRole('button', { name: /↩ Desfés/i }));
  });

  test('Pantalla completa entra i ix amb el botó i amb la tecla Escape', async () => {
    renderitzaJoc('ca');

    fireEvent.click(screen.getByRole('button', { name: /⛶ Pantalla completa/i }));
    const botoEixir = await screen.findByRole('button', { name: /↙ Pantalla normal/i });
    expect(botoEixir.getAttribute('aria-pressed')).toBe('true');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(await screen.findByRole('button', { name: /⛶ Pantalla completa/i })).toBeTruthy();
  });

  test('permet netejar l’exemple de Sóc de Poble, importar carpeta/WP/RSS amb imatge SEO i enviar proposta al /xat', () => {
    const base = creaEstatInicialJoc(LLAVOR_RAPIDA_JOC);
    const wpJson = JSON.stringify([
      {
        title: { rendered: 'Festa de la Tomaca de Penjar' },
        excerpt: { rendered: '<p>Mercat agrari i llavors tradicionals</p>' },
        link: 'https://exemple.org/tomaca',
        yoast_head_json: { og_image: [{ url: 'https://exemple.org/seo-tomaca.jpg' }] },
      },
    ]);
    const resWp = importaContingutUniversal(base, wpJson, { autoClassifica: true });
    expect(resWp.importats).toBe(1);
    expect(resWp.estat.items[0].image).toBe('https://exemple.org/seo-tomaca.jpg');
    expect(resWp.estat.items[0].categoryId).toBe('terra-recursos');

    renderitzaJoc('ca');
    fireEvent.click(screen.getByRole('button', { name: /📥 Enxufa la meua web/i }));
    fireEvent.click(screen.getByRole('button', { name: /🧹 Neteja l’exemple de Sóc de Poble/i }));
    expect(screen.getByText(/Taulell net!/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /📋 Enganxa exemple de carpeta/i }));
    fireEvent.click(screen.getByRole('button', { name: /📥 Incorpora al taulell/i }));
    expect(screen.getByText(/S’han incorporat 5 peces noves/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /🤝 Envia la teua proposta/i }));
    fireEvent.click(screen.getByRole('button', { name: /💬 Comparteix la proposta al \/xat/i }));

    const pendentXat = compartitPendent();
    expect(pendentXat?.text).toContain('CC BY-SA 4.0');
  });

  test.each([
    ['es', 'Cada cosa en su sitio'],
    ['en', 'Everything in Its Place'],
    ['eu', 'Gauza bakoitza bere lekuan'],
    ['gl', 'Cada cousa no seu sitio'],
  ])('es tradueix completament a l’idioma %s (%s)', (lang, titolEsperat) => {
    renderitzaJoc(lang);
    expect(screen.getByRole('heading', { level: 1, name: titolEsperat })).toBeTruthy();
  });
});
