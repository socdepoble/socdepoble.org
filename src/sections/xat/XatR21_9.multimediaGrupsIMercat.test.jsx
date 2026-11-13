/**
 * XatR21_9.multimediaGrupsIMercat.test.jsx — Verificació empírica i unitària
 * d'Onada R21.9 (T1 Multimèdia/Grups WhatsApp + T2 Mercat i Pastilles Apple).
 */
import '../../../tests/helpers/diccionaris.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { useRef, useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext.jsx';
import { AppGridContext } from '../../components/layout/AppGridShell.jsx';
import { createTranslator } from '../../config/i18n.js';
import { _reiniciaPilaEnrere, tancaCapaSuperior } from '../../config/pilaEnrere.js';
import ControlsAdjunt from './components/ControlsAdjunt.jsx';
import Compositor from './components/Compositor.jsx';
import Bombolla from './components/Bombolla.jsx';
import VisorGaleriaXat from './components/VisorGaleriaXat.jsx';
import Conversa from './components/Conversa.jsx';
import { formataEtiquetaHumana, senseHtmlCru } from '../mercat/etiquetesMercat.js';
import { propsDeTargetaDeProducte } from '../mercat/targetaDeProducte.js';
import { buildMercatDetailSectionMeta } from '../detail/detailSectionMeta.jsx';
import { paginaDElement } from '../detail/elementDeSeccio.js';

const mocks = vi.hoisted(() => ({
  preparaAdjunt: vi.fn(),
  urlAdjuntXat: vi.fn(),
  quotaXat: vi.fn()
}));

vi.mock('./adjuntLocal.js', async (importOriginal) => ({
  ...(await importOriginal()),
  preparaAdjunt: mocks.preparaAdjunt
}));

vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: () => true,
  quotaXat: mocks.quotaXat,
  urlAdjuntXat: mocks.urlAdjuntXat,
  descartaAdjuntXat: vi.fn()
}));

const NativeURL = globalThis.URL;

class SempreALaVista {
  constructor(callback) { this.callback = callback; }
  observe(node) { queueMicrotask(() => this.callback([{ isIntersecting: true, target: node }], this)); }
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.quotaXat.mockResolvedValue({ usats: 0, limit: 20_000_000 });
  mocks.preparaAdjunt.mockImplementation(async () => ({
    id: 'adj-r21-9',
    tipus: 'imatge',
    fitxer: new Blob(['webp-complet'], { type: 'image/webp' })
  }));
  mocks.urlAdjuntXat.mockImplementation(async (id) => `https://adjunts.socdepoble.test/${id}.webp`);
  vi.stubGlobal('IntersectionObserver', SempreALaVista);
  vi.stubGlobal('URL', Object.assign(class extends NativeURL {}, {
    createObjectURL: vi.fn().mockReturnValue('blob:r21-9-preview'),
    revokeObjectURL: vi.fn()
  }));
  for (const metode of ['pause', 'load']) vi.spyOn(HTMLMediaElement.prototype, metode).mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('T1.1 · Drag & Drop anti-parpelleig i Cmd+V (onPaste) cap al pipeline .webp', () => {
  const t = createTranslator('ca');

  test('onPaste al textarea amb captura image/png prepara adjunt .webp amb peu opcional i no afecta text pla', async () => {
    const enviaAdjunt = vi.fn().mockResolvedValue([{ id: 'm-1' }]);
    const servei = { teCapacitat: () => true, quotaXat: mocks.quotaXat };

    function BarraProva() {
      const [valor, setValor] = useState('');
      const campRef = useRef(null);
      return (
        <AppGridContext.Provider value={{ mida: 'ample', setPanellObert: () => {} }}>
          <ControlsAdjunt usuariId="u-javi" fil={{ id: 'fil-1' }} servei={servei} onEnvia={enviaAdjunt} t={t}>
            {(adjunts) => (
              <Compositor
                valor={valor}
                onCanvia={setValor}
                onEnvia={() => setValor('')}
                t={t}
                campRef={campRef}
                adjunts={adjunts}
              />
            )}
          </ControlsAdjunt>
        </AppGridContext.Provider>
      );
    }

    render(<BarraProva />);
    const btnAdjunta = await screen.findByRole('button', { name: 'Adjunta' });
    await waitFor(() => expect(btnAdjunta.hasAttribute('aria-disabled')).toBe(false));

    const camp = screen.getByRole('textbox', { name: 'Escriu un missatge' });

    // Aferrar text normal no intercepta ni crida preparaAdjunt
    const evtText = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(evtText, 'clipboardData', {
      value: { files: [], items: [{ kind: 'string', type: 'text/plain' }] }
    });
    fireEvent(camp, evtText);
    expect(evtText.defaultPrevented).toBe(false);
    expect(mocks.preparaAdjunt).not.toHaveBeenCalled();

    // Aferrar captura d'imatge des del porta-retalls activa el pipeline .webp i el peu opcional
    const captura = new File(['png-bytes'], 'captura.png', { type: 'image/png' });
    const evtImg = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(evtImg, 'clipboardData', {
      value: { files: [captura], items: [{ kind: 'file', type: 'image/png', getAsFile: () => captura }] }
    });
    fireEvent(camp, evtImg);
    expect(evtImg.defaultPrevented).toBe(true);
    await waitFor(() => expect(mocks.preparaAdjunt).toHaveBeenCalledWith(captura, expect.any(Object)));
    expect(await screen.findByAltText('Foto adjunta')).toBeTruthy();
    const campPeu = screen.getByRole('textbox', { name: 'Text del fitxer (opcional)' });
    fireEvent.change(campPeu, { target: { value: 'Oli de La Torre acabat de moldre' } });
    fireEvent.click(screen.getByRole('button', { name: 'Envia el fitxer' }));
    await waitFor(() => expect(enviaAdjunt).toHaveBeenCalledOnce());
    expect(enviaAdjunt.mock.calls[0][1]).toMatchObject({
      id: 'adj-r21-9',
      tipus: 'imatge',
      text: 'Oli de La Torre acabat de moldre'
    });
  });

  test('Drag & Drop sobre Conversa manté el vel sense parpelleig entre fills i prepara la foto en fer drop', async () => {
    const enviaMedia = vi.fn().mockResolvedValue([{ id: 'm-drop' }]);
    render(
      <MemoryRouter>
        <AppGridContext.Provider value={{ mida: 'ample', setPanellObert: () => {} }}>
          <Conversa
            fil={{ id: 'general-poble', name: 'General', type: 'grup', potEscriure: true, participant: true }}
            messages={[]}
            usuariAdjunts="u-javi"
            configAdjunts={{ dataMode: 'remote' }}
            onSendMessage={vi.fn()}
            onSendMedia={enviaMedia}
            t={t}
          />
        </AppGridContext.Provider>
      </MemoryRouter>
    );

    await waitFor(() => expect(mocks.quotaXat).toHaveBeenCalled());
    const zona = document.querySelector('.sdp-xat-conversa');
    const llista = document.querySelector('.sdp-xat-missatges');
    const dt = { types: ['Files'], files: [new File(['foto'], 'bancal.jpg', { type: 'image/jpeg' })], dropEffect: 'none' };

    fireEvent.dragEnter(zona, { dataTransfer: dt });
    expect(screen.getByText('Deixa anar la foto o el vídeo per a compartir-lo')).toBeTruthy();

    // Entrar a un fill incrementa profunditat i dragLeave del pare no apaga el vel prematurament
    fireEvent.dragEnter(llista, { dataTransfer: dt });
    fireEvent.dragLeave(zona, { dataTransfer: dt });
    expect(screen.getByText('Deixa anar la foto o el vídeo per a compartir-lo')).toBeTruthy();

    fireEvent.drop(zona, { dataTransfer: dt });
    expect(screen.queryByText('Deixa anar la foto o el vídeo per a compartir-lo')).toBeNull();
    await waitFor(() => expect(mocks.preparaAdjunt).toHaveBeenCalledOnce());
    expect(await screen.findByAltText('Foto adjunta')).toBeTruthy();
  });
});

describe('T1.2 · VisorGaleriaXat (Lightbox, carrusel, zoom i Escape LIFO)', () => {
  const t = createTranslator('ca');
  const imatges = [
    { id: '101', adjuntId: 'adj-1', autor: 'Pepa', avatar: null, usuariId: 'u-pepa', creatAl: '2026-11-12T09:15:00Z', text: 'Collita del matí' },
    { id: '102', adjuntId: 'adj-2', autor: 'Vicent', avatar: null, usuariId: 'u-vicent', creatAl: '2026-11-12T10:30:00Z', text: 'Almàssera en marxa' }
  ];

  test('navega amb fletxes/tecles, commuta zoom 1×/2×, ofereix descàrrega i tanca amb Escape/pila LIFO retornant el focus', async () => {
    const onTanca = vi.fn();
    const obridor = document.createElement('button');
    document.body.appendChild(obridor);
    const focusSpy = vi.spyOn(obridor, 'focus');

    render(
      <VisorGaleriaXat
        obert
        imatges={imatges}
        missatgeInicialId="101"
        urlInicial="https://adjunts.socdepoble.test/adj-1.webp"
        obridor={obridor}
        onTanca={onTanca}
        externalConfig={{ dataMode: 'remote' }}
        t={t}
      />
    );

    expect(screen.getByRole('dialog', { name: 'Visor de fotos de la conversa' })).toBeTruthy();
    expect(document.querySelector('.sdp-xat-visor__nom')?.textContent).toBe('Pepa');
    expect(screen.getByText('Collita del matí')).toBeTruthy();
    /* Gauntlet R22 (xat-05) · La descàrrega porta una signatura nova (renova: true), no la de la bombolla. */
    expect((await screen.findByRole('link', { name: 'Descarrega la foto' })).getAttribute('href')).toBe('https://adjunts.socdepoble.test/adj-1.webp');
    expect(mocks.urlAdjuntXat).toHaveBeenCalledWith('adj-1', expect.any(Object), expect.objectContaining({ renova: true }));

    const botoZoom = screen.getByRole('button', { name: 'Amplia el zoom (2×)' });
    fireEvent.click(botoZoom);
    expect(document.querySelector('.sdp-xat-visor__imatge--zoom')).not.toBeNull();

    fireEvent.keyDown(document, { key: 'ArrowRight' });
    await waitFor(() => expect(document.querySelector('.sdp-xat-visor__nom')?.textContent).toBe('Vicent'));
    expect(screen.getByText('Almàssera en marxa')).toBeTruthy();

    // La pila LIFO (Android Back / Escape) tanca primer el Lightbox
    expect(tancaCapaSuperior()).toBe(true);
    expect(onTanca).toHaveBeenCalledOnce();
    await waitFor(() => expect(focusSpy).toHaveBeenCalled());
    _reiniciaPilaEnrere();
    obridor.remove();
  });

  test('clicar una imatge en Bombolla obri el visor quan onObriImatge és present', async () => {
    const onObri = vi.fn();
    render(
      <MemoryRouter>
        <ol>
          <Bombolla
            missatge={{
              id: 'm-img',
              sender: 'other',
              author: 'Pepa',
              usuariId: 'u-pepa',
              tipus: 'imatge',
              text: 'Bancals',
              creatAl: '2026-11-12T09:00:00Z',
              metadades: { adjunt: { id: 'adj-bancal' } }
            }}
            esGrup
            t={t}
            configAdjunts={{ dataMode: 'remote' }}
            usuariAdjunts="u-javi"
            onObriImatge={onObri}
          />
        </ol>
      </MemoryRouter>
    );

    const botoFoto = await screen.findByRole('button', { name: 'Foto adjunta' });
    fireEvent.click(botoFoto);
    expect(onObri).toHaveBeenCalledOnce();
    expect(onObri.mock.calls[0][1]).toBe('https://adjunts.socdepoble.test/adj-bancal.webp');
  });
});

describe('T1.3 · Grups estil WhatsApp: CaraXat de 28px i paleta determinista WCAG AAA (>= 7:1)', () => {
  const t = createTranslator('ca');

  test('pinta CaraXat circular a la primera bombolla del grup, espaiador a la consecutiva i cap cara als missatges propis', () => {
    const { container } = render(
      <MemoryRouter>
        <ol>
          <Bombolla
            missatge={{ id: '1', sender: 'other', author: 'Pepa', usuariId: 'u-pepa', text: 'Primer', creatAl: '2026-11-12T08:00:00Z' }}
            esGrup
            primerDelGrup
            t={t}
          />
          <Bombolla
            missatge={{ id: '2', sender: 'other', author: 'Pepa', usuariId: 'u-pepa', text: 'Segon', creatAl: '2026-11-12T08:01:00Z' }}
            esGrup
            primerDelGrup={false}
            t={t}
          />
          <Bombolla
            missatge={{ id: '3', sender: 'me', author: 'Javi', usuariId: 'u-javi', text: 'Meu', creatAl: '2026-11-12T08:02:00Z' }}
            esGrup
            primerDelGrup
            t={t}
          />
        </ol>
      </MemoryRouter>
    );

    const items = container.querySelectorAll('li.sdp-xat-item');
    expect(items[0].querySelector('.sdp-xat-bombolla__cara .sdp-xat-bombolla__avatar-grup')).not.toBeNull();
    expect(items[0].querySelector('.sdp-xat-bombolla__autor').className).toMatch(/sdp-xat-bombolla__autor--to-[1-6]/);
    expect(items[1].querySelector('.sdp-xat-bombolla__espai-cara')).not.toBeNull();
    expect(items[1].querySelector('.sdp-xat-bombolla__autor')).toBeNull();
    expect(items[2].querySelector('.sdp-xat-bombolla__cara')).toBeNull();
    expect(items[2].querySelector('.sdp-xat-bombolla__espai-cara')).toBeNull();
  });

  test('els 6 tokens --sdp-xat-autor-1..6 compleixen WCAG AAA >= 7:1 sobre bombolla rebuda en clar i en fosc', () => {
    const tokensCss = readFileSync(resolve(process.cwd(), 'src/css/tokens.css'), 'utf8');
    const parseHex = (h) => ({
      r: Number.parseInt(h.slice(1, 3), 16),
      g: Number.parseInt(h.slice(3, 5), 16),
      b: Number.parseInt(h.slice(5, 7), 16)
    });
    const lin = (c) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
    const lum = ({ r, g, b }) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    const ratio = (a, b) => {
      const [hi, lo] = [lum(parseHex(a)), lum(parseHex(b))].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };

    const blocFosc = tokensCss.slice(tokensCss.indexOf(':root[data-theme="dark"]'));
    const blocClar = tokensCss.slice(0, tokensCss.indexOf(':root[data-theme="dark"]'));
    /* Gauntlet R22 (Design Guard, raw-color) · Els fons es lligen dels tokens,
       seguint cada var(--…): primer en el bloc del tema i, si no hi és, en el
       clar. Cap color escrit a mà: si el token canvia, la prova el seguix. */
    const declaracio = (nom, bloc) => bloc.match(new RegExp(`(?<![\\w-])--${nom}:\\s*([^;]+);`))?.[1]?.trim() ?? null;
    const token = (nom, bloc) => {
      const valor = declaracio(nom, bloc) ?? declaracio(nom, blocClar);
      const referencia = valor?.match(/^var\(--([\w-]+)\)$/);
      return referencia ? token(referencia[1], bloc) : valor;
    };
    const fonsClar = [token('sdp-accent-subtil', blocClar), token('sdp-fons-elevat', blocClar)];
    const fonsFosc = [token('sdp-accent-subtil', blocFosc), token('sdp-fons-elevat', blocFosc)];
    for (const fons of [...fonsClar, ...fonsFosc]) expect(fons).toMatch(/^#[0-9a-f]{6}$/i);
    // Els fons de veres són distints en cada tema (cap resolució ha caigut al mateix valor).
    expect(new Set([...fonsClar, ...fonsFosc]).size).toBe(4);

    for (let i = 1; i <= 6; i += 1) {
      const clarHex = blocClar.match(new RegExp(`--sdp-xat-autor-${i}:\\s*(#[0-9a-f]{6})`))?.[1];
      const foscHex = blocFosc.match(new RegExp(`--sdp-xat-autor-${i}:\\s*(#[0-9a-f]{6})`))?.[1];
      expect(clarHex, `clar ${i}`).toBeTruthy();
      expect(foscHex, `fosc ${i}`).toBeTruthy();
      // Clar sobre --sdp-accent-subtil (la bombolla rebuda) i --sdp-fons-elevat
      for (const fons of fonsClar) expect(ratio(clarHex, fons), `clar ${i} sobre ${fons}`).toBeGreaterThanOrEqual(7);
      // Fosc sobre --sdp-accent-subtil i --sdp-fons-elevat del tema fosc
      for (const fons of fonsFosc) expect(ratio(foscHex, fons), `fosc ${i} sobre ${fons}`).toBeGreaterThanOrEqual(7);
    }
  });
});

describe('T2 · Mercat sense HTML cru, sense slugs/ids i pastilles Apple de 28px × 16px', () => {
  const t = createTranslator('ca');

  test('senseHtmlCru neteja etiquetes i entitats en O(n) sense deixar cap <h3> o <table> literal', () => {
    const brut = '<h3>Informació nutricional</h3><table><tr><td>Energia</td><td>3700 kJ &amp; 900 kcal</td></tr></table>';
    expect(senseHtmlCru(brut)).toBe('Informació nutricional Energia 3700 kJ & 900 kcal');
  });

  test('formataEtiquetaHumana i propsDeTargetaDeProducte humanitzen categories sense mutar el filtre intern', () => {
    expect(formataEtiquetaHumana('alimentacio')).toBe('Alimentació');
    expect(formataEtiquetaHumana('marxandatge')).toBe('Marxandatge');
    expect(formataEtiquetaHumana('oli-verge-extra')).toBe('Oli Verge Extra');
    expect(formataEtiquetaHumana('edicio-fundacional')).toBe('Edició fundacional');
    expect(formataEtiquetaHumana('oli-sense-filtrar')).toBe('Oli sense filtrar');

    const item = Object.freeze({
      id: 'prod-oli',
      title: 'Oli de La Torre',
      description: '<h3>Collita pròpia</h3><p>1a extracció en fred.</p>',
      category_slug: 'alimentacio',
      tag: 'oli-verge-extra',
      variations: [{ id: '500ml', name: '500 ml' }, { id: '2l', name: '2 L' }]
    });
    const props = propsDeTargetaDeProducte(item, t);
    expect(props.body).toBe('Collita pròpia 1a extracció en fred.');
    expect(props.labels.map((l) => l.text)).toEqual(['Mercat', '2 variants', 'Alimentació', 'Oli Verge Extra']);
    expect(item.category_slug).toBe('alimentacio');
  });

  test('buildMercatDetailSectionMeta i paginaDElement pinten Mercat i mai injecten item.id com a pastilla', () => {
    const mercatMeta = buildMercatDetailSectionMeta({ marketItems: [], t });
    const detall = paginaDElement(mercatMeta, {
      id: 'prod-samarreta',
      title: 'Samarreta Sóc de Poble',
      description: '<h3>100% cotó</h3><p> Serigrafia artesanal. </p>'
    });
    expect(detall.labels).toEqual([{ text: 'Mercat', className: 'sdp-badge-system' }]);
    expect(detall.subtitle).toBe('100% cotó Serigrafia artesanal.');
  });
});
