/* IDEA-109 (onada R7) · El visor d'Anatomia Rural: el control lliscant mou les
   capes, els punts calents i el panell s'usen amb el teclat (botons natius),
   l'enllaç del documental ix quan no hi ha videoId, el moviment reduït es
   respecta, la veu crida el servei i la ruta /page/anatomia-rural es pinta amb
   un chunk lazy. Cap videoId real: el de la prova és inventat a posta i viu
   només ací. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../../tests/helpers/diccionaris.js';

/* A-12 · El visor es prova amb el servei de veu REAL (veuIaiaService.js):
   només es falsegen les APIs del navegador (speechSynthesis). */
import VisorAnatomiaRural3D from './VisorAnatomiaRural3D.jsx';
import { reiniciaVeuPerProves } from '../../services/veuIaiaService.js';
import { ESTRUCTURES, CANAL_MONESMA, FONT_PENDENT } from '../../data/patrimoni/anatomiaRural.js';
import { construeixPeca, separacions } from './anatomiaRuralGeometria.js';

let sintesi;
function instalaSintesi({ alParlar } = {}) {
  const parlat = [];
  sintesi = {
    getVoices: () => [{ lang: 'ca-ES', name: 'Montserrat' }],
    cancel: vi.fn(),
    speak: vi.fn((enunciat) => {
      parlat.push(enunciat);
      if (alParlar) alParlar(enunciat);
    }),
    parlat,
  };
  window.speechSynthesis = sintesi;
  window.SpeechSynthesisUtterance = function Enunciat(text) { this.text = text; };
}

beforeEach(() => { reiniciaVeuPerProves(); instalaSintesi(); });
afterEach(() => {
  cleanup();
  reiniciaVeuPerProves();
  delete window.speechSynthesis;
  delete window.SpeechSynthesisUtterance;
});

const ARREL = process.cwd();
const llig = (rel) => readFileSync(path.join(ARREL, rel), 'utf8');
const grup = (terme) => document.querySelector(`.anatomia__peca[data-peca="${terme}"]`);
const dyDe = (id) => Number(/translate\(\S+ (\S+)\)/.exec(grup(id).getAttribute('transform'))[1]);
const llista = (terme) => screen.getAllByRole('button', { name: terme }).find((b) => b.classList.contains('anatomia__peca-boto'));
const control = () => screen.getByLabelText('🔧 Muntar ↔ Desmuntar peça a peça');

describe('dades · els termes del Mestre', () => {
  const termes = (id) => ESTRUCTURES.find((e) => e.id === id).peces.map((p) => p.terme);

  test('tres estructures amb els termes exactes', () => {
    expect(ESTRUCTURES.map((e) => e.id)).toEqual(['pou-de-neu', 'almassera', 'forn-de-calc']);
    expect(termes('pou-de-neu')).toEqual(expect.arrayContaining(['cúpula de pedra en sec', 'boca d’entrada', 'capes de neu piconada amb maces', 'palla', 'pouet de drenatge', 'sàrries', 'transport nocturn amb matxos']));
    expect(termes('almassera')).toEqual(expect.arrayContaining(['tramuja', 'rull troncocònic de pedra', 'bassa', 'premsa de biga i quintar', 'esportins d’espart', 'escaldà', 'bassons de decantació', 'àrguens']));
    expect(termes('forn-de-calc')).toEqual(expect.arrayContaining(['olla', 'bancada o seti', 'boquera', 'volta de pedra viva calcària', 'càrrega i cocció a uns 1.000 °C', 'argilagues']));
  });

  test('ids únics, definició no buida i forma coneguda; els dubtes, marcats pendents', () => {
    for (const estructura of ESTRUCTURES) {
      const ids = estructura.peces.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const peca of estructura.peces) {
        expect(peca.definicio.length, peca.id).toBeGreaterThan(10);
        expect(construeixPeca(peca.forma).ancora, peca.id).toHaveLength(2);
      }
    }
    const pendents = ESTRUCTURES.flatMap((e) => e.peces).filter((p) => p.pendent).map((p) => p.terme);
    expect(pendents).toEqual(expect.arrayContaining(['palla', 'sàrries', 'tramuja', 'escaldà', 'àrguens']));
  });

  test('A-02/A-03 · cada estructura porta font: el lèxic de l’oli només a l’almàssera', () => {
    const fonts = Object.fromEntries(ESTRUCTURES.map((e) => [e.id, e.font]));
    expect(fonts).toEqual({ 'pou-de-neu': FONT_PENDENT, almassera: 'El lèxic de l’oli al Comtat', 'forn-de-calc': FONT_PENDENT });
    expect(FONT_PENDENT).toBe('font pendent');
  });

  test('A-02 · les definicions dubtoses diuen la fórmula prudent; les funcions òbvies es queden', () => {
    const peces = Object.fromEntries(ESTRUCTURES.flatMap((e) => e.peces).map((p) => [p.id, p]));
    for (const id of ['palla', 'sarries', 'bassa', 'tramuja', 'esportins', 'premsa', 'escalda', 'arguens', 'boquera', 'bancada', 'olla', 'argilagues']) {
      expect(peces[id].definicio, id).toBe('Terme indicat pel Mestre. Funció pendent de contrastar amb la font.');
      expect(peces[id].pendent, id).toBe(true);
    }
    expect(peces.cupula.definicio).toMatch(/Coberta de la cava/);
    expect(peces.boca.definicio).toMatch(/entrada/);
    expect(peces['pouet-drenatge'].definicio).toMatch(/drenatge/);
  });

  test('documental: canal i autoria d’Eugenio Monesma, cap videoId inventat', () => {
    for (const estructura of ESTRUCTURES) {
      expect(estructura.documental).toEqual({ canal: CANAL_MONESMA, autor: 'Eugenio Monesma', videoId: null });
    }
    expect(CANAL_MONESMA).toBe('https://www.youtube.com/@eugeniomonesma-documentales');
  });

  test('cap «masia» enlloc del visor ni de les dades', () => {
    const fonts = ['src/data/patrimoni/anatomiaRural.js', 'src/components/patrimoni/VisorAnatomiaRural3D.jsx', 'src/components/patrimoni/anatomiaRuralGeometria.js', 'src/css/components.css'];
    for (const font of fonts) expect(llig(font), font).not.toMatch(/mas[ií]a/i);
  });
});

describe('geometria · la separació peça a peça', () => {
  const peces = ESTRUCTURES[0].peces;

  test('muntat no separa res; desmuntat, cada peça vertical puja més que la de baix', () => {
    expect(separacions(peces, 0).every((m) => m.dz === 0 && m.dx === 0 && m.dy === 0)).toBe(true);
    const vertical = separacions(peces, 100).filter((m, i) => !peces[i].lateral).map((m) => m.dz);
    expect(vertical[0]).toBe(0);
    expect(vertical).toEqual([...vertical].sort((a, b) => a - b));
    expect(new Set(vertical).size).toBe(vertical.length);
  });

  test('la peça de dalt es desprén primer', () => {
    const mig = separacions(peces, 35);
    const dalt = mig.filter((m, i) => !peces[i].lateral).at(-1);
    const baix = mig[1];
    expect(dalt.t).toBeGreaterThan(baix.t);
  });

  test('un valor fora de rang o no numèric no trenca res', () => {
    expect(separacions(peces, -50).every((m) => m.dz === 0)).toBe(true);
    expect(separacions(peces, 900)).toEqual(separacions(peces, 100));
    expect(separacions(peces, 'x').every((m) => m.dz === 0)).toBe(true);
  });
});

describe('visor · control lliscant', () => {
  test('és un input range amb etiqueta i mou les capes', () => {
    render(<VisorAnatomiaRural3D />);
    const lliscant = control();
    expect(lliscant.tagName).toBe('INPUT');
    expect(lliscant.getAttribute('type')).toBe('range');
    fireEvent.change(lliscant, { target: { value: '0' } });
    expect(dyDe('cupula')).toBe(0);
    expect(grup('cupula').getAttribute('data-separacio')).toBe('no');
    fireEvent.change(lliscant, { target: { value: '100' } });
    expect(dyDe('cupula')).toBeLessThan(0);
    expect(grup('cupula').getAttribute('data-separacio')).toBe('si');
    expect(dyDe('boca')).toBeLessThan(dyDe('cupula'));
    fireEvent.change(lliscant, { target: { value: '0' } });
    expect(dyDe('boca')).toBe(0);
  });

  test('els punts calents acompanyen la peça', () => {
    render(<VisorAnatomiaRural3D />);
    fireEvent.change(control(), { target: { value: '0' } });
    const abans = document.querySelectorAll('.anatomia__peca')[3];
    const dyAbans = dyDe(abans.getAttribute('data-peca'));
    expect(abans.querySelector('.anatomia__punt')).toBeTruthy();
    fireEvent.change(control(), { target: { value: '100' } });
    const dyDespres = dyDe(document.querySelectorAll('.anatomia__peca')[3].getAttribute('data-peca'));
    expect(dyDespres).toBeLessThan(dyAbans);
  });

  test('el selector canvia d’estructura i torna a netejar el panell', () => {
    render(<VisorAnatomiaRural3D />);
    fireEvent.click(llista('palla'));
    expect(screen.getByRole('heading', { level: 4, name: 'palla' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Almàssera o tafona/ }));
    expect(document.querySelector('.anatomia').getAttribute('data-estructura')).toBe('almassera');
    expect(screen.queryByRole('heading', { level: 4, name: 'palla' })).toBeNull();
    expect(llista('rull troncocònic de pedra')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Forn de calç/ }).getAttribute('aria-pressed')).toBe('false');
  });
});

describe('visor · teclat i panell de detall', () => {
  test('A-04 · els punts calents són decoratius per a ratolí i tacte: cercles SVG aria-hidden, sense botons', () => {
    render(<VisorAnatomiaRural3D />);
    const punts = document.querySelectorAll('.anatomia__punt');
    expect(punts).toHaveLength(ESTRUCTURES[0].peces.length);
    for (const punt of punts) {
      expect(punt.tagName.toLowerCase()).toBe('circle');
      expect(punt.getAttribute('aria-hidden')).toBe('true');
    }
    expect(screen.queryAllByRole('button', { name: /^Peça: / })).toHaveLength(0);
  });

  test('A-04 · la llista de peces és la via del teclat: botons enfocables amb nom i etiqueta d’ordre de l’esquema', () => {
    render(<VisorAnatomiaRural3D />);
    const grupPeces = screen.getByRole('group', { name: /ordre de l’esquema \(no és l’ordre constructiu\)/ });
    const botons = within(grupPeces).getAllByRole('button');
    expect(botons).toHaveLength(ESTRUCTURES[0].peces.length);
    for (const boto of botons) {
      expect(boto.getAttribute('tabindex')).toBeNull();
      boto.focus();
      expect(document.activeElement).toBe(boto);
    }
  });

  test('A-04 · aria-live és només a la regió del terme i la definició, no als botons', () => {
    render(<VisorAnatomiaRural3D />);
    const detall = screen.getByRole('region', { name: 'Detall de la peça' });
    expect(detall.getAttribute('aria-live')).toBeNull();
    const viu = detall.querySelector('[aria-live="polite"]');
    expect(viu).toBeTruthy();
    expect(viu.textContent).toMatch(/Tria una peça/);
    fireEvent.click(llista('cúpula de pedra en sec'));
    expect(within(viu).getByRole('heading', { level: 4 }).textContent).toBe('cúpula de pedra en sec');
    expect(viu.textContent).toMatch(/sense morter/);
    expect(within(viu).queryByRole('button')).toBeNull();
    expect(document.querySelectorAll('[aria-live]')).toHaveLength(1);
    expect(detall.textContent).not.toMatch(/Pendent de contrastar/);
  });

  test('A-03 · les peces pendents citen la font només a l’almàssera; la resta, «font pendent»', () => {
    render(<VisorAnatomiaRural3D />);
    const detall = screen.getByRole('region', { name: 'Detall de la peça' });
    fireEvent.click(llista('palla'));
    expect(detall.textContent).toMatch(/Terme indicat pel Mestre\. Funció pendent de contrastar amb la font\./);
    expect(detall.textContent).toMatch(/Pendent de contrastar: encara no hi ha cap font/);
    expect(detall.textContent).not.toMatch(/lèxic de l’oli/);
    fireEvent.click(screen.getByRole('button', { name: /Almàssera o tafona/ }));
    fireEvent.click(llista('tramuja'));
    expect(detall.textContent).toMatch(/Pendent de contrastar amb\s*El lèxic de l’oli al Comtat/);
    expect(document.querySelector('.anatomia__font').textContent).toMatch(/Font:\s*El lèxic de l’oli al Comtat/);
    fireEvent.click(screen.getByRole('button', { name: /Forn de calç/ }));
    expect(document.querySelector('.anatomia__font').textContent).toMatch(/Font:\s*font pendent/);
  });

  test('A-10 · el nom de l’estructura va en una sola clau amb {nom}', () => {
    render(<VisorAnatomiaRural3D />);
    expect(screen.getByRole('img', { name: 'Esquema isomètric de Pou de neu o cava' })).toBeTruthy();
  });

  test('A-01/A-12 · «Escolta la IAIA» és el botó compartit amb el servei real: parla el terme i la definició, i es para amb un segon clic', async () => {
    render(<VisorAnatomiaRural3D />);
    expect(screen.queryByRole('button', { name: /Escolta/ })).toBeNull();
    fireEvent.click(llista('boca d’entrada'));
    const boto = screen.getByRole('button', { name: 'Escolta la IAIA' });
    await waitFor(() => expect(boto.disabled).toBe(false));
    expect(screen.queryByRole('button', { name: /Atura/ })).toBeNull();
    fireEvent.click(boto);
    await waitFor(() => expect(sintesi.speak).toHaveBeenCalledTimes(1));
    expect(sintesi.parlat[0].text).toMatch(/^boca d’entrada\. Boca d’entrada de la cava\./);
    await waitFor(() => expect(boto.getAttribute('aria-pressed')).toBe('true'));
    sintesi.cancel.mockClear();
    fireEvent.click(boto);
    expect(sintesi.cancel).toHaveBeenCalled();
    await waitFor(() => expect(boto.getAttribute('aria-pressed')).toBe('false'));
  });

  test('canviar de peça mentre parla atura la veu', async () => {
    render(<VisorAnatomiaRural3D />);
    fireEvent.click(llista('boca d’entrada'));
    const boto = screen.getByRole('button', { name: 'Escolta la IAIA' });
    await waitFor(() => expect(boto.disabled).toBe(false));
    fireEvent.click(boto);
    await waitFor(() => expect(boto.getAttribute('aria-pressed')).toBe('true'));
    sintesi.cancel.mockClear();
    fireEvent.click(llista('palla'));
    expect(sintesi.cancel).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Escolta la IAIA' }).getAttribute('aria-pressed')).toBe('false');
  });

  test('en desmuntar el visor mentre parla, la veu calla', async () => {
    const { unmount } = render(<VisorAnatomiaRural3D />);
    fireEvent.click(llista('boca d’entrada'));
    const boto = screen.getByRole('button', { name: 'Escolta la IAIA' });
    await waitFor(() => expect(boto.disabled).toBe(false));
    fireEvent.click(boto);
    await waitFor(() => expect(sintesi.speak).toHaveBeenCalled());
    sintesi.cancel.mockClear();
    unmount();
    expect(sintesi.cancel).toHaveBeenCalled();
  });

  test('si la síntesi falla, el visor continua viu i el botó ho explica', async () => {
    sintesi.speak.mockImplementation(() => { throw new Error('sense veu'); });
    render(<VisorAnatomiaRural3D />);
    fireEvent.click(llista('palla'));
    const boto = screen.getByRole('button', { name: 'Escolta la IAIA' });
    await waitFor(() => expect(boto.disabled).toBe(false));
    fireEvent.click(boto);
    await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/pot llegir en veu alta/));
    expect(screen.getByRole('heading', { level: 4, name: 'palla' })).toBeTruthy();
  });

  test('sense síntesi al navegador, el botó queda desactivat amb explicació', async () => {
    delete window.speechSynthesis;
    render(<VisorAnatomiaRural3D />);
    fireEvent.click(llista('palla'));
    const boto = screen.getByRole('button', { name: 'Escolta la IAIA' });
    expect((await screen.findByText(/Este navegador no pot llegir en veu alta/)).id).toBeTruthy();
    expect(boto.disabled).toBe(true);
  });
});

describe('visor · documental', () => {
  test('sense videoId: enllaç segur al canal d’Eugenio Monesma, amb autoria i cap iframe', () => {
    const { container } = render(<VisorAnatomiaRural3D />);
    const enllac = screen.getByRole('link', { name: /Eugenio Monesma a YouTube/ });
    expect(enllac.getAttribute('href')).toBe(CANAL_MONESMA);
    expect(enllac.getAttribute('rel')).toMatch(/noopener/);
    expect(enllac.getAttribute('target')).toBe('_blank');
    expect(container.textContent).toMatch(/Autoria:\s*Eugenio Monesma/);
    expect(container.querySelector('iframe')).toBeNull();
  });
});

describe('moviment reduït', () => {
  /* El CSS del visor és l'últim bloc de components.css (V3: cap .css propi de component). */
  const tot = llig('src/css/components.css');
  const css = tot.slice(tot.indexOf('.anatomia {') - 40).replace(/\/\*[\s\S]*?\*\//g, '');

  test('cap transició fora de prefers-reduced-motion: no-preference', () => {
    const fora = css.replace(/@media \(prefers-reduced-motion: no-preference\) \{[\s\S]*?\n {2}\}\n/, '');
    expect(css).toMatch(/@media \(prefers-reduced-motion: no-preference\)/);
    expect(fora).not.toMatch(/transition:\s*(?!none)\S/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{[\s\S]*transition: none/);
  });

  test('cap animació, ni color literal ni ombra decorativa', () => {
    expect(css).not.toMatch(/@keyframes|animation:/);
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/);
    expect(css).not.toMatch(/box-shadow/);
  });
});

describe('la ruta /page/anatomia-rural', () => {
  test('el chunk del visor és lazy i cap altre fitxer no l’importa estàticament', () => {
    const detall = llig('src/sections/detail/PageDetailSection.jsx');
    expect(detall).toMatch(/lazy\(\(\) => import\('\.\.\/\.\.\/components\/patrimoni\/VisorAnatomiaRural3D\.jsx'\)\)/);
    expect(detall).not.toMatch(/^import .*VisorAnatomiaRural3D/m);
  });
});
