/**
 * XatR22.gauntlet5.test.jsx — Gauntlet R22 sobre el COMMIT 5 (carril xat).
 *
 * Una prova per correcció, i cada una falla sense la seua:
 *   · xat-01 · el visor de fotos es pinta a la capa de dalt (portal) i per
 *     damunt de les barres (--z-calaix), fora de .sdp-xat-conversa;
 *   · xat-02 · sense adjunts, el + no promet adjuntar; la cara del grup no
 *     repetix el nom al lector;
 *   · xat-03 · el focus va a «Tanca» només en obrir;
 *   · xat-04 · una llista nova no torna el visor a la foto d'obertura;
 *   · xat-05 · «Descarrega» porta sempre una signatura fresca, es renova
 *     mentre es mostra, en tancar s'obliden les URL i una foto que no carrega
 *     es torna a signar;
 *   · xat-06 · la capçalera diu quan escrius amb la veu d'una entitat;
 *   · xat-07 · el color i la cara d'un missatge d'entitat no deriven de qui
 *     l'opera;
 *   · xat-09 · la cara pren la foto del padró del fil (src de CaraXat);
 *   · workspace-07 · la cara del grup és decorativa (cap enllaç de 28 px).
 * Persones, entitats i URL de mostra.
 */
import '../../../tests/helpers/diccionaris.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext.jsx';
import { AppGridContext } from '../../components/layout/AppGridShell.jsx';
import { toDeLlavor } from '../../components/PedraSeca/atoms/Avatar.jsx';
import { createTranslator } from '../../config/i18n.js';
import { _reiniciaPilaEnrere } from '../../config/pilaEnrere.js';
import Bombolla from './components/Bombolla.jsx';
import CapcaleraConversa from './components/CapcaleraConversa.jsx';
import Compositor from './components/Compositor.jsx';
import Conversa from './components/Conversa.jsx';
import VisorGaleriaXat, { RENOVA_DESCARREGA_MS } from './components/VisorGaleriaXat.jsx';
import { caraDAutor, caresDelFil, imatgesDeLaGaleria, llavorDAutor } from './conversa.js';

const mocks = vi.hoisted(() => ({ urlAdjuntXat: vi.fn(), quotaXat: vi.fn() }));

vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: () => true,
  quotaXat: mocks.quotaXat,
  urlAdjuntXat: mocks.urlAdjuntXat,
  descartaAdjuntXat: vi.fn()
}));

class SempreALaVista {
  constructor(callback) { this.callback = callback; }
  observe(node) { queueMicrotask(() => this.callback([{ isIntersecting: true, target: node }], this)); }
  unobserve() {}
  disconnect() {}
}

const t = createTranslator('ca');
const CONFIG = Object.freeze({ dataMode: 'remote' });
const URL_VELLA = 'https://adjunts.socdepoble.test/adj-1.webp?signatura=vella';
const IMATGES = Object.freeze([
  { id: '101', adjuntId: 'adj-1', autor: 'Pepa', avatar: null, llavor: 'u-pepa', creatAl: '2026-11-12T09:15:00Z', text: 'Collita del matí' },
  { id: '102', adjuntId: 'adj-2', autor: 'Vicent', avatar: null, llavor: 'u-vicent', creatAl: '2026-11-12T10:30:00Z', text: 'Almàssera en marxa' },
  { id: '103', adjuntId: 'adj-3', autor: 'Rosa', avatar: null, llavor: 'u-rosa', creatAl: '2026-11-12T11:00:00Z', text: 'Bancals' }
]);

let signatures = 0;

beforeEach(() => {
  vi.clearAllMocks();
  signatures = 0;
  mocks.quotaXat.mockResolvedValue({ usats: 0, limit: 20_000_000 });
  /* Cada signatura és nova: l'URL porta un comptador i, si és forçada, «renova=1». */
  mocks.urlAdjuntXat.mockImplementation(async (id, _config, opcions = {}) => {
    signatures += 1;
    return `https://adjunts.socdepoble.test/${id}.webp?signatura=${signatures}${opcions?.renova ? '&renova=1' : ''}`;
  });
  vi.stubGlobal('IntersectionObserver', SempreALaVista);
  HTMLElement.prototype.scrollTo = function scrollTo() {};
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  delete HTMLElement.prototype.scrollTo;
  _reiniciaPilaEnrere();
});

function Visor(props) {
  return (
    <VisorGaleriaXat
      obert
      imatges={IMATGES}
      missatgeInicialId="101"
      urlInicial={URL_VELLA}
      externalConfig={CONFIG}
      onTanca={() => {}}
      t={t}
      {...props}
    />
  );
}

const nomDelVisor = () => document.querySelector('.sdp-xat-visor__nom')?.textContent;
const srcDelVisor = () => document.querySelector('.sdp-xat-visor__imatge')?.getAttribute('src') ?? null;
const enllacDescarrega = () => screen.queryByRole('link', { name: 'Descarrega la foto' });
const toDe = (node) => [...(node?.classList ?? [])].find((c) => /--to-\d$/.test(c)) ?? null;
/* Unes quantes voltes de microtasques: les promeses del port simulat es resolen. */
const buidaPromeses = () => act(async () => { for (let i = 0; i < 6; i += 1) await Promise.resolve(); });

describe('xat-01 · el visor es pinta a la capa de dalt de l’App', () => {
  test('a la SPA, va al <body>, fora de .sdp-xat-conversa', () => {
    const conversa = document.createElement('div');
    conversa.className = 'sdp-xat-conversa';
    const obridor = document.createElement('button');
    const lloc = document.createElement('div');
    conversa.append(obridor, lloc);
    document.body.appendChild(conversa);

    render(<Visor obridor={obridor} />, { container: lloc });

    const dialeg = screen.getByRole('dialog', { name: 'Visor de fotos de la conversa' });
    expect(dialeg.parentNode).toBe(document.body);
    expect(dialeg.closest('.sdp-xat-conversa')).toBeNull();
    conversa.remove();
  });

  test('encastat, va a la .sdp-root de l’arrel ombra de <soc-de-poble>', () => {
    const amfitrio = document.createElement('soc-de-poble');
    document.body.appendChild(amfitrio);
    const ombra = amfitrio.attachShadow({ mode: 'open' });
    const arrel = document.createElement('div');
    arrel.className = 'sdp-root';
    const conversa = document.createElement('div');
    conversa.className = 'sdp-xat-conversa';
    const obridor = document.createElement('button');
    const lloc = document.createElement('div');
    conversa.append(obridor, lloc);
    arrel.appendChild(conversa);
    ombra.appendChild(arrel);

    render(<Visor obridor={obridor} />, { container: lloc });

    const dialeg = arrel.querySelector('.sdp-xat-visor');
    expect(dialeg).not.toBeNull();
    expect(dialeg.parentNode).toBe(arrel);
    expect(dialeg.closest('.sdp-xat-conversa')).toBeNull();
    expect(document.body.querySelector(':scope > .sdp-xat-visor')).toBeNull();
    amfitrio.remove();
  });

  test('la seua capa passa per damunt de la barra negra, el lateral i la barra mòbil', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/css/modules.css'), 'utf8');
    const tokens = readFileSync(resolve(process.cwd(), 'src/css/tokens.css'), 'utf8');
    const regla = css.match(/\.sdp-xat-visor \{([^}]*)\}/)?.[1] ?? '';
    const capa = regla.match(/z-index:\s*var\(--([\w-]+)\)/)?.[1];
    expect(capa, 'z-index del visor amb un token de l’escala').toBeTruthy();
    const valor = (nom) => Number(tokens.match(new RegExp(`--${nom}:\\s*(\\d+)`))?.[1]);
    for (const barra of ['z-barra-negra', 'z-sidebar', 'z-nav-mobil']) {
      expect(valor(capa), `${capa} > ${barra}`).toBeGreaterThan(valor(barra));
    }
  });
});

describe('xat-03 · el focus va a «Tanca» només en obrir', () => {
  test('navegar amb «Foto següent» i un onTanca nou del pare no mouen el focus', async () => {
    const { rerender } = render(<Visor />);
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Tancar');

    const seguent = screen.getByRole('button', { name: 'Foto següent' });
    seguent.focus();
    fireEvent.click(seguent);
    await waitFor(() => expect(nomDelVisor()).toBe('Vicent'));
    expect(document.activeElement).toBe(seguent);

    const miniatura = screen.getByRole('button', { name: /Foto adjunta 3 \/ 3/ });
    miniatura.focus();
    rerender(<Visor onTanca={() => {}} />);
    expect(document.activeElement).toBe(miniatura);
  });
});

describe('xat-04 · una llista nova no torna el visor a la foto d’obertura', () => {
  test('conserva la foto i el zoom amb una llista nova i amb una foto més; en reobrir, torna a començar', async () => {
    const { rerender } = render(<Visor />);
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    await waitFor(() => expect(srcDelVisor()).toMatch(/adj-2\.webp/));
    fireEvent.click(screen.getByRole('button', { name: 'Amplia el zoom (2×)' }));
    expect(document.querySelector('.sdp-xat-visor__imatge--zoom')).not.toBeNull();

    // El mateix contingut en objectes nous (galeriaImatges es recalcula amb cada missatge).
    rerender(<Visor imatges={IMATGES.map((img) => ({ ...img }))} />);
    expect(nomDelVisor()).toBe('Vicent');
    expect(document.querySelector('.sdp-xat-visor__imatge--zoom')).not.toBeNull();

    // Arriba una foto nova d'un altre veí.
    const nova = { id: '104', adjuntId: 'adj-4', autor: 'Toni', avatar: null, llavor: 'u-toni', creatAl: '2026-11-12T12:00:00Z', text: '' };
    rerender(<Visor imatges={[...IMATGES, nova]} />);
    expect(nomDelVisor()).toBe('Vicent');
    expect(document.querySelector('.sdp-xat-visor__imatge--zoom')).not.toBeNull();

    rerender(<Visor obert={false} />);
    expect(screen.queryByRole('dialog')).toBeNull();
    rerender(<Visor />);
    expect(nomDelVisor()).toBe('Pepa');
    expect(document.querySelector('.sdp-xat-visor__imatge--zoom')).toBeNull();
  });
});

describe('xat-05 · «Descarrega» porta sempre una signatura fresca', () => {
  test('en obrir, l’enllaç és una signatura nova i no la de la bombolla; la imatge no es torna a baixar', async () => {
    render(<Visor />);
    const enllac = await screen.findByRole('link', { name: 'Descarrega la foto' });
    expect(enllac.getAttribute('href')).toMatch(/adj-1\.webp\?signatura=\d+&renova=1$/);
    expect(enllac.getAttribute('href')).not.toBe(URL_VELLA);
    expect(mocks.urlAdjuntXat).toHaveBeenCalledWith('adj-1', expect.any(Object), expect.objectContaining({ renova: true }));
    expect(srcDelVisor()).toBe(URL_VELLA);
  });

  test('mentre la foto es mostra, l’enllaç es torna a signar cada RENOVA_DESCARREGA_MS', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    render(<Visor />);
    await buidaPromeses();
    const primera = enllacDescarrega()?.getAttribute('href');
    expect(primera).toMatch(/renova=1$/);

    await act(async () => { await vi.advanceTimersByTimeAsync(RENOVA_DESCARREGA_MS); });
    await buidaPromeses();
    const segona = enllacDescarrega()?.getAttribute('href');
    expect(segona).toMatch(/renova=1$/);
    expect(segona).not.toBe(primera);
    expect(RENOVA_DESCARREGA_MS).toBeLessThan(60_000 - 15_000);
  });

  test('en tancar s’obliden les URL: en reobrir, cada foto es torna a demanar', async () => {
    const { rerender } = render(<Visor />);
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    await waitFor(() => expect(srcDelVisor()).toMatch(/adj-2\.webp/));
    const primera = srcDelVisor();

    rerender(<Visor obert={false} />);
    rerender(<Visor />);
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    await waitFor(() => expect(srcDelVisor()).toMatch(/adj-2\.webp/));
    expect(srcDelVisor()).not.toBe(primera);
  });

  test('una foto que no carrega es torna a signar (renova) una sola vegada', async () => {
    render(<Visor />);
    await buidaPromeses();
    expect(srcDelVisor()).toBe(URL_VELLA);

    fireEvent.error(document.querySelector('.sdp-xat-visor__imatge'));
    await waitFor(() => expect(srcDelVisor()).toMatch(/adj-1\.webp\?signatura=\d+&renova=1$/));
    const renovada = srcDelVisor();
    const crides = mocks.urlAdjuntXat.mock.calls.length;

    fireEvent.error(document.querySelector('.sdp-xat-visor__imatge'));
    await buidaPromeses();
    expect(srcDelVisor()).toBe(renovada);
    expect(mocks.urlAdjuntXat.mock.calls.length).toBe(crides);
  });
});

describe('xat-02 · sense adjunts, el + no promet adjuntar', () => {
  test('el + es diu «Més opcions» i el seu menú només oferix la negreta', () => {
    render(
      <AppGridContext.Provider value={{ mida: 'ample', setPanellObert: () => {} }}>
        <Compositor valor="" onCanvia={vi.fn()} onEnvia={vi.fn()} t={t} />
      </AppGridContext.Provider>
    );
    expect(screen.queryByRole('button', { name: 'Adjunta' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Més opcions' }));
    const menu = screen.getByRole('menu', { name: 'Opcions d’escriptura' });
    expect(within(menu).getAllByRole('menuitem').map((b) => b.textContent)).toEqual(['Escriure en negreta']);
  });
});

function pintaBombolles(missatges, props = {}) {
  return render(
    <MemoryRouter>
      <ol>
        {missatges.map((missatge) => (
          <Bombolla key={missatge.id} missatge={missatge} esGrup primerDelGrup t={t} {...props} />
        ))}
      </ol>
    </MemoryRouter>
  );
}

describe('xat-02, xat-09 i workspace-07 · la cara del grup', () => {
  const PEPA = Object.freeze({ id: 'm-pepa', sender: 'other', author: 'Pepa', usuariId: 'u-pepa', text: 'Bon dia', creatAl: '2026-11-12T08:00:00Z' });

  test('és decorativa: no repetix el nom al lector i no és cap enllaç; el nom continua portant al perfil', () => {
    const { container } = pintaBombolles([PEPA]);
    const item = container.querySelector('li.sdp-xat-item');
    const cara = item.querySelector('.sdp-xat-bombolla__cara');
    expect(cara.tagName).toBe('SPAN');
    expect(cara.closest('a')).toBeNull();
    expect(cara.querySelector('a')).toBeNull();
    expect(cara.querySelector('.sdp-nomes-lector')).toBeNull();
    expect(within(item).getAllByText('Pepa')).toHaveLength(1);
    expect(within(item).getByRole('link', { name: /Pepa/ })).toBeTruthy();
  });

  test('pinta la foto que li dona la conversa (caraAutor → src de CaraXat), sense text alternatiu', () => {
    const { container } = pintaBombolles([PEPA], { caraAutor: '/assets/pepa.webp' });
    const img = container.querySelector('.sdp-xat-bombolla__cara img');
    expect(img).not.toBeNull();
    expect(img.getAttribute('src')).toContain('/assets/pepa.webp');
    expect(img.getAttribute('alt')).toBe('');
  });
});

describe('xat-07 · el color i la cara d’un missatge d’entitat no deriven de qui l’opera', () => {
  const ENTITAT = 'Bar La Torre';
  const delBar = (id, usuariId, extra = {}) => ({
    id, sender: 'other', author: ENTITAT, usuariId, comEntitat: true, text: 'Obrim a les huit', creatAl: '2026-11-12T08:00:00Z', ...extra
  });

  test('llavorDAutor: una entitat, pel seu nom; una persona, pel seu id', () => {
    expect(llavorDAutor({ usuariId: 'u-pere', comEntitat: true }, ENTITAT)).toBe(`entitat:${ENTITAT}`);
    expect(llavorDAutor({ usuariId: 'u-pere' }, 'Pere')).toBe('u-pere');
    expect(llavorDAutor({}, 'Pere')).toBe('Pere');
  });

  test('dos operadors de «Bar La Torre» pinten el mateix to al nom i a la cara del grup', () => {
    // Precondició: amb la llavor de la persona, els dos tons serien distints.
    expect(toDeLlavor('u-pere')).not.toBe(toDeLlavor('u-anna'));
    const { container } = pintaBombolles([delBar('m-1', 'u-pere'), delBar('m-2', 'u-anna')]);
    const [a, b] = container.querySelectorAll('li.sdp-xat-item');
    /* Bombolla tria la classe del nom amb CLASSES_COLOR_AUTOR[toDeLlavor(llavor) % 6]. */
    const classeNom = (llavor) => `sdp-xat-bombolla__autor--to-${(toDeLlavor(llavor) % 6) + 1}`;
    expect(classeNom('u-pere')).not.toBe(classeNom('u-anna'));
    const toNom = toDe(a.querySelector('.sdp-xat-bombolla__autor'));
    expect(toNom).toBe(classeNom(`entitat:${ENTITAT}`));
    expect(toDe(b.querySelector('.sdp-xat-bombolla__autor'))).toBe(toNom);
    const toCara = toDe(a.querySelector('.sdp-xat-bombolla__avatar-grup'));
    expect(toCara).toBe(`sdp-avatar--to-${toDeLlavor(`entitat:${ENTITAT}`)}`);
    expect(toDe(b.querySelector('.sdp-xat-bombolla__avatar-grup'))).toBe(toCara);
  });

  test('la galeria del visor no porta l’usuariId i la cara de l’entitat té el mateix to amb tots dos operadors', async () => {
    const foto = (id, usuariId, adjunt) => delBar(id, usuariId, { tipus: 'imatge', metadades: { adjunt: { id: adjunt } } });
    const imatges = imatgesDeLaGaleria([foto('201', 'u-pere', 'adj-p'), foto('202', 'u-anna', 'adj-a')], { t });
    expect(imatges.map((img) => Object.hasOwn(img, 'usuariId'))).toEqual([false, false]);
    expect(imatges.map((img) => img.llavor)).toEqual([`entitat:${ENTITAT}`, `entitat:${ENTITAT}`]);

    render(<Visor imatges={imatges} missatgeInicialId="201" urlInicial={null} />);
    const caraVisor = () => toDe(document.querySelector('.sdp-xat-visor__autor .sdp-avatar'));
    const esperat = `sdp-avatar--to-${toDeLlavor(`entitat:${ENTITAT}`)}`;
    expect(caraVisor()).toBe(esperat);
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    await waitFor(() => expect(document.querySelector('.sdp-xat-visor__nom')?.textContent).toBe(ENTITAT));
    expect(caraVisor()).toBe(esperat);
  });
});

describe('xat-09 · la cara pren la foto del padró del fil', () => {
  test('caresDelFil i caraDAutor: una persona, la seua foto; un missatge d’entitat, la de l’entitat, mai la de qui l’opera', () => {
    const fil = {
      entitatId: 'org-bar',
      altres: [
        { id: 'u-pepa', tipus: 'persona', avatarUrl: '/assets/pepa.webp' },
        { id: 'org-bar', tipus: 'entitat', avatarUrl: '/assets/bar.webp' },
        { id: 'u-sense', tipus: 'persona', avatarUrl: null }
      ]
    };
    const cares = caresDelFil(fil);
    expect(caraDAutor({ usuariId: 'u-pepa' }, fil, cares)).toBe('/assets/pepa.webp');
    expect(caraDAutor({ usuariId: 'u-pepa', comEntitat: true }, fil, cares)).toBe('/assets/bar.webp');
    expect(caraDAutor({ usuariId: 'u-sense' }, fil, cares)).toBeNull();
    expect(caraDAutor({ usuariId: 'u-pepa', comEntitat: true }, { ...fil, entitatId: null }, cares)).toBeNull();
  });

  test('a la Conversa, la cara del grup i la del visor ixen de fil.altres, i el visor s’obri fora de la conversa (xat-01)', async () => {
    const fil = {
      id: 'f-grup', tipus: 'grup', name: 'Comissió de festes', potEscriure: true, participant: true, llegitFinsSeq: 0,
      altres: [{ id: 'u-pepa', tipus: 'persona', nom: 'Pepa', avatarUrl: '/assets/pepa.webp' }]
    };
    const missatges = [{
      id: 'm-foto', seq: 1, sender: 'other', author: 'Pepa', usuariId: 'u-pepa', tipus: 'imatge', text: '',
      metadades: { adjunt: { id: 'adj-foto' } }, creatAl: '2026-11-12T09:00:00Z', estatEnviament: 'enviat'
    }];
    render(
      <MemoryRouter>
        <AppGridContext.Provider value={{ mida: 'ample', setPanellObert: () => {} }}>
          <Conversa
            fil={fil} messages={missatges} usuariAdjunts="u-javi" configAdjunts={CONFIG} onSendMessage={vi.fn()} onSendMedia={vi.fn()}
            onMarcaVist={vi.fn()} t={t}
          />
        </AppGridContext.Provider>
      </MemoryRouter>
    );
    const cara = document.querySelector('.sdp-xat-bombolla__cara img');
    expect(cara?.getAttribute('src')).toContain('/assets/pepa.webp');

    fireEvent.click(await screen.findByRole('button', { name: 'Foto adjunta' }));
    const dialeg = await screen.findByRole('dialog', { name: 'Visor de fotos de la conversa' });
    expect(dialeg.closest('.sdp-xat-conversa')).toBeNull();
    expect(dialeg.querySelector('.sdp-xat-visor__autor img')?.getAttribute('src')).toContain('/assets/pepa.webp');
  });
});

describe('xat-06 · la capçalera diu quan el que escrius ix amb la veu d’una entitat', () => {
  const AVISOS = Object.freeze({
    id: 'f-avisos', tipus: 'canal', name: 'Avisos', participants: 3, entitatId: 'org-bar', entitatNom: 'Bar La Torre',
    subjecte: { tipus: 'entitat', id: 'org-bar', titol: 'Bar La Torre', ruta: '/empresa/bar-la-torre' }
  });
  const pinta = (fil) => render(
    <MemoryRouter>
      <CapcaleraConversa fil={fil} t={t} onTorna={vi.fn()} onSeleccionar={vi.fn()} />
    </MemoryRouter>
  );

  test('als Avisos, qui hi escriu en nom de l’entitat (comEntitat del servidor) ho veu a la capçalera', () => {
    pinta({ ...AVISOS, comEntitat: true, potEscriure: true });
    expect(screen.getByText('Escrius com a Bar La Torre.')).toBeTruthy();
    // Primer de la línia: en una pantalla estreta, el que es retalla és la resta.
    const linia = document.querySelector('.sdp-xat-capcalera__sub');
    expect(linia.firstElementChild.textContent).toBe('Escrius com a Bar La Torre.');
    expect(linia.textContent).toContain('Sobre: Bar La Torre');
  });

  test('també sense comEntitat (la llavor): qui pot escriure als Avisos d’una entitat signa com ella', () => {
    pinta({ ...AVISOS, potEscriure: true });
    expect(screen.getByText('Escrius com a Bar La Torre.')).toBeTruthy();
  });

  test('qui només els llig no hi veu cap marca', () => {
    pinta({ ...AVISOS, potEscriure: false });
    expect(screen.queryByText(/Escrius com a/)).toBeNull();
  });

  test('el canal 1:1 d’una entitat continua dient «Canal de …», sense repetir-ho', () => {
    pinta({ id: 'f-1', tipus: 'directe', name: 'Pere', altresNoms: ['Pere'], comEntitat: true, entitatNom: 'Bar La Torre' });
    expect(screen.getByText('Canal de Bar La Torre')).toBeTruthy();
    expect(screen.queryByText(/Escrius com a/)).toBeNull();
  });
});
