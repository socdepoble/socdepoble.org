/* IDEA-116 + IDEA-119 (Onada R9, carril C2) · El reproductor explicatiu del
   Pou de Neu del Rentonar.
   Es prova: (1) que les xifres són les d'anatomiaRural.js (MESURES_POU = les
   cotes, una a una) i que els passos només nomenen peces i cotes que hi són;
   (2) el format 9:16/16:9 de partida i el commutador; (3) els tres estils;
   (4) reproduir, pausa, anterior, següent i les tecles; (5) les cotes amb la
   discrepància i el càlcul de comprovació etiquetat; (6) l'accessibilitat
   (cap control dins de l'SVG, regió viva, cap estil en línia); (7) la veu,
   amb el servei de veres; (8) una altra llengua: rètols traduïts, contingut en
   valencià i xifres amb la puntuació de la llengua; (9) el CSS: classes amb
   regla, només tokens, transicions només amb permís de moviment. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../../tests/helpers/diccionaris.js';
import { createTranslator } from '../../config/i18n.js';

const mocks = vi.hoisted(() => ({ ui: null }));
vi.mock('../../app/contexts/UIContext.jsx', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIActionsOpcional: () => mocks.ui,
  useUIStateOpcional: () => (mocks.ui ? { language: mocks.ui.language } : null)
}));

import ReproductorExplicatiuPouNeu3D, {
  CONSULTA_MOBIL, DURADA_PAS_MS, ESTILS, PASSOS, POU, cotesDelPas, formatDePartida, nomDeLaVeu, textDelPas, volumCilindre
} from './ReproductorExplicatiuPouNeu3D.jsx';
import { MESURES_POU, FONT_POU } from '../../data/patrimoni/anatomiaRural.js';
import { reiniciaVeuPerProves } from '../../services/veuIaiaService.js';

const ARREL = path.resolve(import.meta.dirname, '../../..');
const llig = (rel) => readFileSync(path.join(ARREL, rel), 'utf8');
const cota = (etiqueta) => POU.cotes.find((dada) => dada.etiqueta === etiqueta);
const pantalla = (container) => container.querySelector('.reproductor-pou__pantalla');
const viva = (container) => container.querySelector('[aria-live="polite"]');

let parlat;
beforeEach(() => {
  mocks.ui = null;
  parlat = [];
  reiniciaVeuPerProves();
  window.speechSynthesis = {
    getVoices: () => [{ lang: 'ca-ES', name: 'Montserrat' }],
    cancel: vi.fn(),
    speak: vi.fn((enunciat) => { parlat.push(enunciat.text); })
  };
  window.SpeechSynthesisUtterance = function Enunciat(text) { this.text = text; };
  delete window.matchMedia;
});
afterEach(() => { cleanup(); vi.useRealTimers(); reiniciaVeuPerProves(); delete window.speechSynthesis; delete window.SpeechSynthesisUtterance; });

describe('les dades: les d’anatomiaRural.js, sense cap xifra pròpia', () => {
  test('cada mesura numèrica és la de la cota amb font (en valencià, tal com la diu la cota)', () => {
    const a = (clau) => `${new Intl.NumberFormat('ca', { minimumFractionDigits: MESURES_POU[clau].decimals, maximumFractionDigits: MESURES_POU[clau].decimals }).format(MESURES_POU[clau].valor)} ${MESURES_POU[clau].unitat}`;
    expect(cota('Alçada total').valor).toBe(`${a('alcadaTotal')}: ${a('alcadaPou')} de pou i ${a('alcadaCupula')} de falsa volta`);
    expect(cota('Fondària des de les finestres superiors').valor).toBe(a('fondariaFinestres'));
    expect(cota('Diàmetre interior').valor).toBe(`${a('diametrePla')} al plànol; ${a('diametreArticle')} a l’article`);
    expect(cota('Diàmetre interior')).toMatchObject({ estat: 'discrepant', nota: `La llegenda del mateix plànol diu ${a('diametreLlegenda')} d’amplària.` });
    expect(cota('Capacitat estimada').valor).toBe(`${a('capacitatArticle')} a l’article; el corpus diu més de ${a('capacitatCorpus')}`);
    expect(cota('Capacitat estimada').estat).toBe('discrepant');
    expect(cota('Túnel d’accés sud').valor).toBe(`${a('tunel')} de longitud`);
    const galeria = cota('Galeria d’escorredor, a l’est').valor;
    for (const clau of ['galeria', 'galeriaTram1', 'galeriaTram2', 'entradaGaleria']) expect([clau, galeria.includes(a(clau))]).toEqual([clau, true]);
    expect(cota('Cota del pou').valor.startsWith(`${a('cota')} s/n/m`)).toBe(true);
    // 18 = 15 + 3 i 29 = 24 + 5: les parts sumen el total.
    expect(MESURES_POU.alcadaPou.valor + MESURES_POU.alcadaCupula.valor).toBe(MESURES_POU.alcadaTotal.valor);
    expect(MESURES_POU.galeriaTram1.valor + MESURES_POU.galeriaTram2.valor).toBe(MESURES_POU.galeria.valor);
    for (const [clau, mesura] of Object.entries(MESURES_POU)) expect([clau, typeof mesura.font, mesura.font.length > 5]).toEqual([clau, 'string', true]);
  });

  test('els passos només nomenen peces i cotes que hi ha a l’estructura POU', () => {
    const peces = new Set(POU.peces.map((peca) => peca.id));
    expect(PASSOS.map((pas) => pas.id)).toEqual(['sencer', 'cupula', 'finestres', 'estreps', 'pou', 'tunel', 'galeria', 'muntat']);
    for (const pas of PASSOS) {
      for (const id of pas.peces) expect([pas.id, id, peces.has(id)]).toEqual([pas.id, id, true]);
      expect([pas.id, cotesDelPas(pas).length]).toEqual([pas.id, pas.cotes.length]);
    }
    expect(textDelPas(PASSOS[0])).toBe(POU.resum);
    expect(textDelPas(PASSOS[1])).toContain(POU.peces.find((peca) => peca.id === 'cupula').definicio);
    // La procedència viatja amb la peça: allò que només diu el corpus, es diu.
    const pou = textDelPas(PASSOS.find((pas) => pas.id === 'pou'));
    for (const id of ['neu-piconada', 'palla']) expect(pou).toContain(`(${POU.peces.find((peca) => peca.id === id).nota})`);
    expect(pou).toContain('Només el corpus ho conta');
  });

  test('el càlcul de comprovació: 1.037 m³ amb l’alçada de l’article i 1.120 m³ amb la del plànol', () => {
    expect(Math.round(volumCilindre(MESURES_POU.diametreArticle.valor, MESURES_POU.fondariaFinestres.valor))).toBe(1037);
    expect(Math.round(volumCilindre(MESURES_POU.diametrePla.valor, MESURES_POU.alcadaPou.valor))).toBe(1120);
  });
});

describe('format i estil', () => {
  test('sense matchMedia, horitzontal 16:9; en pantalla estreta, vertical 9:16', () => {
    expect(formatDePartida(undefined)).toBe('horitzontal');
    expect(formatDePartida({ matchMedia: (consulta) => ({ matches: consulta === CONSULTA_MOBIL }) })).toBe('vertical');
    expect(formatDePartida({ matchMedia: () => ({ matches: false }) })).toBe('horitzontal');
    expect(formatDePartida({ matchMedia: () => { throw new Error('cap'); } })).toBe('horitzontal');
    window.matchMedia = (consulta) => ({ matches: consulta === CONSULTA_MOBIL, addEventListener: vi.fn(), removeEventListener: vi.fn() });
    const { container } = render(<ReproductorExplicatiuPouNeu3D />);
    const seccio = container.querySelector('section.reproductor-pou');
    expect(seccio.dataset.format).toBe('vertical');
    expect(seccio.classList.contains('reproductor-pou--vertical')).toBe(true);
  });

  test('el commutador «📱 Vertical 9:16 / 🖥️ Horitzontal 16:9» canvia el format', () => {
    const { container } = render(<ReproductorExplicatiuPouNeu3D />);
    const seccio = container.querySelector('section.reproductor-pou');
    expect(seccio.dataset.format).toBe('horitzontal');
    const grup = screen.getByRole('group', { name: 'Format de la pantalla' });
    const vertical = within(grup).getByRole('button', { name: /Vertical 9:16/ });
    expect(vertical.textContent).toBe('📱Vertical 9:16');
    expect(within(grup).getByRole('button', { name: /Horitzontal 16:9/ }).textContent).toBe('🖥️Horitzontal 16:9');
    fireEvent.click(vertical);
    expect(seccio.dataset.format).toBe('vertical');
    expect(vertical.getAttribute('aria-pressed')).toBe('true');
  });

  test('tres propostes d’estil, A de partida; triar-ne una canvia la classe', () => {
    const { container } = render(<ReproductorExplicatiuPouNeu3D />);
    const seccio = container.querySelector('section.reproductor-pou');
    const grup = screen.getByRole('group', { name: 'Proposta d’estil' });
    expect(within(grup).getAllByRole('button').map((boto) => boto.textContent)).toEqual(ESTILS.map(([, icona, text]) => `${icona}${text}`));
    expect(seccio.dataset.estil).toBe('a');
    fireEvent.click(within(grup).getByRole('button', { name: /C · Plànol blau/ }));
    expect(seccio.dataset.estil).toBe('c');
    expect(seccio.classList.contains('reproductor-pou--estil-c')).toBe(true);
    expect(seccio.classList.contains('reproductor-pou--estil-a')).toBe(false);
  });
});

describe('reproduir i navegar', () => {
  test('anterior i següent, amb el comptador i la regió viva', () => {
    const { container } = render(<ReproductorExplicatiuPouNeu3D />);
    expect(screen.getByRole('button', { name: 'Anterior' }).disabled).toBe(true);
    expect(viva(container).textContent).toContain('Pas 1 de 8');
    expect(viva(container).textContent).toContain('El pou sencer');
    fireEvent.click(screen.getByRole('button', { name: 'Següent' }));
    expect(viva(container).textContent).toContain('Pas 2 de 8');
    expect(viva(container).textContent).toContain('La cúpula: 3 m de falsa volta');
    expect(viva(container).querySelector('[lang="ca"]').textContent).toContain('Falsa volta');
    expect(container.querySelector('section').dataset.pas).toBe('cupula');
    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));
    expect(container.querySelector('section').dataset.pas).toBe('sencer');
  });

  test('les fletxes, Inici i Fi a la pantalla; la llista de passos marca el pas actual', () => {
    const { container } = render(<ReproductorExplicatiuPouNeu3D />);
    const pant = pantalla(container);
    expect(pant.getAttribute('tabindex')).toBe('0');
    fireEvent.keyDown(pant, { key: 'ArrowRight' });
    expect(container.querySelector('section').dataset.pas).toBe('cupula');
    fireEvent.keyDown(pant, { key: 'End' });
    expect(container.querySelector('section').dataset.pas).toBe('muntat');
    expect(screen.getByRole('button', { name: 'Següent' }).disabled).toBe(true);
    fireEvent.keyDown(pant, { key: 'ArrowRight' });
    expect(container.querySelector('section').dataset.pas).toBe('muntat');
    fireEvent.keyDown(pant, { key: 'Home' });
    expect(container.querySelector('section').dataset.pas).toBe('sencer');
    // R9V-C2-09 · Dins del text del pas, les fletxes el desplacen: no canvien de pas.
    fireEvent.keyDown(viva(container), { key: 'ArrowRight' });
    expect(container.querySelector('section').dataset.pas).toBe('sencer');
    const passos = within(screen.getByRole('list', { name: 'Tots els passos' })).getAllByRole('button');
    expect(passos).toHaveLength(8);
    fireEvent.click(passos[6]);
    expect(passos[6].getAttribute('aria-current')).toBe('step');
    expect(passos.filter((boto) => boto.hasAttribute('aria-current'))).toHaveLength(1);
    expect(container.querySelector('section').dataset.pas).toBe('galeria');
  });

  test('reproduir avança un pas cada DURADA_PAS_MS i s’atura sol a l’últim; pausa l’atura', () => {
    vi.useFakeTimers();
    const { container } = render(<ReproductorExplicatiuPouNeu3D />);
    const seccio = container.querySelector('section');
    fireEvent.click(screen.getByRole('button', { name: 'Reproduir' }));
    expect(screen.getByRole('button', { name: 'Pausa' })).toBeTruthy();
    act(() => { vi.advanceTimersByTime(DURADA_PAS_MS); });
    expect(seccio.dataset.pas).toBe('cupula');
    fireEvent.click(screen.getByRole('button', { name: 'Pausa' }));
    act(() => { vi.advanceTimersByTime(DURADA_PAS_MS * 3); });
    expect(seccio.dataset.pas).toBe('cupula');
    fireEvent.click(screen.getByRole('button', { name: 'Reproduir' }));
    for (let i = 0; i < PASSOS.length; i += 1) act(() => { vi.advanceTimersByTime(DURADA_PAS_MS); });
    expect(seccio.dataset.pas).toBe('muntat');
    expect(screen.getByRole('button', { name: 'Reproduir' })).toBeTruthy();
    // Des de l'últim, reproduir torna a començar.
    fireEvent.click(screen.getByRole('button', { name: 'Reproduir' }));
    expect(seccio.dataset.pas).toBe('sencer');
  });
});

describe('cotes, discrepàncies i dibuix', () => {
  test('el pas del pou: cotes amb font, la discrepància marcada i el càlcul etiquetat com a càlcul', () => {
    const { container } = render(<ReproductorExplicatiuPouNeu3D />);
    fireEvent.click(within(screen.getByRole('list', { name: 'Tots els passos' })).getAllByRole('button')[4]);
    const cotes = [...container.querySelectorAll('.reproductor-pou__cota')];
    expect(cotes.map((fila) => fila.querySelector('dt').textContent)).toEqual(PASSOS[4].cotes);
    const diametre = cotes.find((fila) => fila.textContent.includes('Diàmetre interior'));
    expect(diametre.dataset.estat).toBe('discrepant');
    expect(diametre.textContent).toContain('9,75 m al plànol; 9,80 m a l’article');
    expect(diametre.textContent).toContain('Les fonts no coincidixen');
    expect(diametre.textContent).toContain('La llegenda del mateix plànol diu 10 m d’amplària.');
    const calcul = container.querySelector('.reproductor-pou__calcul').textContent;
    expect(calcul).toContain('no és cap font');
    expect(calcul).toContain('≈ 1.037 m³');
    expect(calcul).toContain('≈ 1.120 m³');
    expect(calcul).toContain('1.030 m³');
    expect(calcul).toContain('més de 1.100 m³');
    // R9V-C2-05 · El càlcul no n'afirma la causa: el corpus no diu d'on trau «més de 1.100 m³».
    expect(calcul).toContain('Una explicació possible és l’alçada que es pren.');
    expect(calcul).not.toContain('La diferència ve de');
    expect(container.querySelector('[data-cota-pas="pou"]').textContent).toBe('15 m · Ø 9,75 m – 9,80 m');
  });

  test('muntat: 18 m a l’esquerra, 15 m i 3 m a la dreta, el diàmetre davall; la galeria, 29 m (24 + 5) i 43 cm', () => {
    const { container } = render(<ReproductorExplicatiuPouNeu3D />);
    const textos = () => [...container.querySelectorAll('svg text')].map((node) => node.textContent);
    expect(textos()).toEqual(['18 m', '15 m', '3 m', 'Ø 9,75 m – 9,80 m']);
    fireEvent.click(within(screen.getByRole('list', { name: 'Tots els passos' })).getAllByRole('button')[6]);
    expect(textos()).toEqual(['29 m (24 + 5) · 43 cm']);
    // Desmuntat: la galeria (lateral) s'ha separat i les peces del pas s'il·luminen.
    expect(container.querySelector('[data-peca="galeria"]').getAttribute('transform')).not.toBe('translate(0 0)');
    expect(container.querySelector('[data-peca="galeria"]').classList.contains('is-activa')).toBe(true);
    expect(container.querySelector('[data-peca="cupula"]').classList.contains('is-apagada')).toBe(true);
  });
});

describe('accessibilitat i Pedra Seca', () => {
  test('l’SVG és una imatge amb nom i sense cap control; cap estil en línia', () => {
    const { container } = render(<ReproductorExplicatiuPouNeu3D />);
    const svg = screen.getByRole('img', { name: /Esquema isomètric del Pou de Neu del Rentonar\. Pas 1 de 8: El pou sencer/ });
    expect(svg.querySelector('button, a, [tabindex], [role="button"]')).toBeNull();
    expect([...svg.querySelectorAll('*')].some((node) => [...node.attributes].some((attr) => attr.name.startsWith('on')))).toBe(false);
    expect(container.querySelector('[style]')).toBeNull();
    expect(container.querySelectorAll('[aria-live]')).toHaveLength(1);
    // R9V-C2-09 · El text del pas (que en 16:9 es pot desplaçar) és una regió amb nom que s'enfoca amb el teclat.
    expect(viva(container)).toBe(screen.getByRole('region', { name: 'Text del pas' }));
    expect(viva(container).getAttribute('tabindex')).toBe('0');
    expect(screen.getByRole('group', { name: 'Reproductor: les fletxes canvien de pas' })).toBe(pantalla(container));
    expect(container.querySelector('.reproductor-pou__font').textContent).toContain(FONT_POU);
  });

  test('la veu de la IAIA diu el pas en valencià, amb el servei de veres', async () => {
    render(<ReproductorExplicatiuPouNeu3D />);
    fireEvent.click(screen.getByRole('button', { name: 'Següent' }));
    const boto = await screen.findByRole('button', { name: 'Escolta la IAIA: este pas' });
    await waitFor(() => expect(boto.disabled).toBe(false));
    fireEvent.click(boto);
    await waitFor(() => expect(parlat.join(' ')).toContain('La cúpula: 3 m de falsa volta'));
    expect(parlat.join(' ')).toContain('Falsa volta');
  });

  test('en anglés: rètols traduïts, contingut etnogràfic en valencià amb l’avís, i xifres amb punt decimal', () => {
    mocks.ui = { t: createTranslator('en'), language: 'en' };
    const { container } = render(<ReproductorExplicatiuPouNeu3D />);
    expect(screen.getByRole('heading', { name: 'The Rentonar Snow Well, step by step' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Play' })).toBeTruthy();
    expect(screen.getByRole('note').textContent).toBe(createTranslator('en')('patrimoni.anatomia.avisLlengua'));
    expect(viva(container).querySelector('[lang="ca"]').textContent).toBe(POU.resum);
    expect([...container.querySelectorAll('svg text')].map((node) => node.textContent)).toContain('Ø 9.75 m – 9.80 m');
  });

  test('les 29 claus noves són als cinc diccionaris, totes diferents de la clau', () => {
    const claus = [...llig('src/components/patrimoni/ReproductorExplicatiuPouNeu3D.jsx').matchAll(/'(patrimoni\.reproductorPou\.[\w.]+)'/g)].map((m) => m[1]);
    const dinamiques = [...PASSOS.map((pas) => `patrimoni.reproductorPou.pas.${pas.id}`), ...ESTILS.map(([valor]) => `patrimoni.reproductorPou.estil.${valor}`)];
    const totes = [...new Set([...claus, ...dinamiques])];
    // 26 de la primera ronda i 3 de la d'arreglos (textPas, R9V-C2-09; veuPublicacio i veuPas, R9V-C2-10).
    expect(totes).toHaveLength(29);
    for (const llengua of ['ca', 'es', 'en', 'eu', 'gl']) {
      const t = createTranslator(llengua);
      const font = llig(`src/config/idiomes/${llengua}.js`);
      for (const clau of totes) expect([llengua, clau, font.includes(`'${clau}':`)]).toEqual([llengua, clau, true]);
      expect(t('patrimoni.reproductorPou.calcul')).toMatch(/\{d1\}.*\{h1\}.*\{v1\}.*\{c1\}.*\{d2\}.*\{h2\}.*\{v2\}.*\{c2\}/);
      // R9V-C2-10 · El nom de cada veu comença pel rètol visible del botó en la seua llengua (WCAG 2.5.3) i són diferents.
      const visible = t('common.veuIaiaEscolta').replace(/^\p{Extended_Pictographic}\uFE0F?\s*/u, '');
      expect(nomDeLaVeu(t, 'pas').startsWith(`${visible}: `)).toBe(true);
      expect(nomDeLaVeu(t, 'publicacio').startsWith(`${visible}: `)).toBe(true);
      expect(nomDeLaVeu(t, 'pas')).not.toBe(nomDeLaVeu(t, 'publicacio'));
    }
  });
});

describe('el CSS (components.css)', () => {
  const tot = llig('src/css/components.css');
  const inici = tot.indexOf('Reproductor explicatiu del Pou de Neu');
  const fi = tot.indexOf("Visor d'Anatomia Rural (IDEA-109");
  const bloc = tot.slice(inici, fi).replace(/\/\*[\s\S]*?\*\//g, '');

  test('el bloc va dins de @layer components i davant del visor (que ha de ser l’últim)', () => {
    expect(inici).toBeGreaterThan(0);
    expect(fi).toBeGreaterThan(inici);
    expect(bloc).toContain('@layer components {');
  });

  test('cada classe del component té regla; cap color literal; cap rem fora dels múltiples de 0,25', () => {
    const jsx = llig('src/components/patrimoni/ReproductorExplicatiuPouNeu3D.jsx') + llig('src/sections/mur/articles/NovesTecnologiesCulturaRuralArticle.jsx');
    const classes = new Set([...jsx.matchAll(/\b((?:reproductor-pou|noves-tecnologies-rural)(?:__[\w-]+|--[\w-]+)?)\b/g)].map((m) => m[1]));
    for (const classe of classes) expect([classe, bloc.includes(`.${classe}`)]).toEqual([classe, true]);
    expect(bloc).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i);
    for (const [, valor] of bloc.matchAll(/(\d+(?:\.\d+)?)rem/g)) expect([valor, (Number(valor) * 4) % 1]).toEqual([valor, 0]);
  });

  test('la proposta C pinta el blanc sobre --sdp-accio-control, no sobre --sdp-accio (R9V-C2-07)', () => {
    const regla = (selector) => bloc.slice(bloc.indexOf(`${selector} {`)).split('}')[0];
    expect(regla('.reproductor-pou--estil-c .reproductor-pou__pantalla')).toContain('background: var(--sdp-accio-control);');
    expect(regla('.reproductor-pou--estil-c .reproductor-pou__cota-text')).toContain('stroke: var(--sdp-accio-control);');
    expect(bloc).not.toMatch(/var\(--sdp-accio\)/);
  });

  test('cap transició fora de prefers-reduced-motion: no-preference, i amb moviment reduït, none', () => {
    const [abans, despres] = bloc.split('@media (prefers-reduced-motion: no-preference)');
    expect(abans).not.toMatch(/transition:/);
    const [permes, reduit] = despres.split('@media (prefers-reduced-motion: reduce)');
    expect(permes).toMatch(/transition:\s*stroke/);
    expect(reduit).toMatch(/transition:\s*none/);
    expect(reduit).not.toMatch(/transition:\s*(?!none)\S/);
  });
});
