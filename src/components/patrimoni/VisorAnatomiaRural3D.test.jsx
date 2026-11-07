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
import { ESTRUCTURES, CANAL_MONESMA, CANAL_SANGONERETA, DEFINICIO_PLANOL, FONT_MOLI_ELECTRIC, FONT_OLI, FONT_PENDENT, FONT_POU } from '../../data/patrimoni/anatomiaRural.js';
import { esIdVideoEditorial } from '../universal/VideoEditorial.jsx';
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

describe('dades · les fonts del Mestre', () => {
  const termes = (id) => ESTRUCTURES.find((e) => e.id === id).peces.map((p) => p.terme);
  const cotes = (id) => ESTRUCTURES.find((e) => e.id === id).cotes;

  test('nou estructures amb ids únics', () => {
    expect(ESTRUCTURES.map((e) => e.id)).toEqual(['pou-de-neu', 'almassera', 'moli-hidraulic', 'moli-electric', 'forn-de-calc', 'carbonera', 'cup-i-premsa', 'senia-de-sang', 'carro-valencia']);
    expect(termes('pou-de-neu')).toEqual(expect.arrayContaining(['cúpula de pedra en sec', 'boca d’entrada', 'capes de neu piconada amb maces', 'palla', 'pouet de drenatge', 'sàrries', 'transport nocturn amb matxos', 'galeria d’escorredor', 'túnel d’accés sud']));
    expect(termes('forn-de-calc')).toEqual(expect.arrayContaining(['cop', 'tapafocs', 'matxaca', 'volta', 'armadores', 'banc', 'baluarts', 'porta', 'corredora', 'caldera', 'argilagues', 'càrrega i cocció a uns 1.000 °C']));
    expect(termes('carbonera')).toHaveLength(9);
    expect(termes('moli-electric').filter((t) => t.startsWith('fase '))).toHaveLength(5);
  });

  test('IDEA-109 · l’almàssera té els 19 elements numerats del plànol, cadascun una vegada', () => {
    const nums = ESTRUCTURES.find((e) => e.id === 'almassera').peces.map((p) => p.num).filter(Boolean).sort((a, b) => a - b);
    expect(nums).toEqual(Array.from({ length: 19 }, (_, k) => k + 1));
  });

  test('els termes del Mestre que cap font confirma van com a noms pendents, no com a termes', () => {
    const peces = Object.fromEntries(ESTRUCTURES.flatMap((e) => e.peces).map((p) => [p.id, p]));
    expect(peces.gronsa.aliesPendents).toEqual(['tramuja']);
    expect(peces.premses.aliesPendents).toEqual(['premsa de biga i quintar']);
    expect(peces.argue.aliesPendents).toEqual(['àrguens']);
    expect(peces.bassetes.aliesPendents).toEqual(['bassons de decantació']);
    expect(peces.molo.aliesPendents).toEqual(['rull troncocònic de pedra']);
    expect(peces.banc.aliesPendents).toEqual(['bancada o seti']);
    for (const id of ['bassa', 'escalda', 'boquera', 'olla', 'pouet-drenatge']) expect(peces[id].pendent, id).toBe(true);
  });

  test('ids únics, definició no buida, forma coneguda; la definició pendent sempre porta la fórmula prudent', () => {
    for (const estructura of ESTRUCTURES) {
      const ids = estructura.peces.map((p) => p.id);
      expect(new Set(ids).size, estructura.id).toBe(ids.length);
      for (const peca of estructura.peces) {
        expect(peca.definicio.length, peca.id).toBeGreaterThan(10);
        expect(construeixPeca(peca.forma).ancora, peca.id).toHaveLength(2);
        if (peca.pendent) expect(peca.definicio, peca.id).toMatch(/pendent de contrastar|Terme indicat pel Mestre/);
      }
    }
    for (const id of ['palla', 'sarries']) {
      const peca = ESTRUCTURES[0].peces.find((p) => p.id === id);
      expect(peca.pendent).toBe(false);
    }
    expect(DEFINICIO_PLANOL).toMatch(/pendent de contrastar/);
  });

  test('cada estructura porta una font real; només queda «font pendent» si cap no n’hi ha', () => {
    const fonts = Object.fromEntries(ESTRUCTURES.map((e) => [e.id, e.font]));
    expect(fonts['pou-de-neu']).toBe(FONT_POU);
    expect(fonts.almassera).toBe(FONT_OLI);
    expect(FONT_OLI).toMatch(/lèxic de l’olivera, l’oliva i l’oli al Comtat/);
    expect(fonts['moli-electric']).toBe(FONT_MOLI_ELECTRIC);
    expect(Object.values(fonts).every((f) => f && f !== FONT_PENDENT)).toBe(true);
    expect(FONT_PENDENT).toBe('font pendent');
  });

  test('F1 · pou de neu: cada xifra contrastada amb la font, i les discrepàncies marcades', () => {
    const per = Object.fromEntries(cotes('pou-de-neu').map((c) => [c.etiqueta, c]));
    expect(per['Cota del pou']).toMatchObject({ estat: 'ok' });
    expect(per['Cota del pou'].valor).toMatch(/1\.160 m/);
    expect(per['Cim dels Plans']).toMatchObject({ estat: 'unica' });
    expect(per['Cim dels Plans'].valor).toMatch(/1\.330 m/);
    expect(per['Alçada total']).toMatchObject({ estat: 'unica' });
    expect(per['Alçada total'].valor).toMatch(/18 m.*15 m.*3 m/);
    expect(per['Fondària des de les finestres superiors']).toMatchObject({ estat: 'ok', valor: '13,75 m' });
    expect(per['Diàmetre interior']).toMatchObject({ estat: 'discrepant' });
    expect(per['Diàmetre interior'].valor).toMatch(/9,75.*9,80/);
    expect(per['Capacitat estimada']).toMatchObject({ estat: 'discrepant' });
    expect(per['Capacitat estimada'].valor).toMatch(/1\.030 m³/);
    expect(per['Capacitat històrica'].valor).toMatch(/20\.000 arroves/);
    expect(per['Túnel d’accés sud'].valor).toMatch(/9,10 m/);
    expect(per['Galeria d’escorredor, a l’est']).toMatchObject({ estat: 'discrepant' });
    expect(per['Galeria d’escorredor, a l’est'].valor).toMatch(/29 m.*24 m.*5 m.*43 cm/);
    expect(per['Estreps d’arcs'].valor).toMatch(/4,.*2 arcs creuats/);
    expect(per['Època'].valor).toMatch(/segles XVII i XVIII/);
  });

  test('F1 · cada cota té font i un estat conegut; allò no confirmat no s’amaga', () => {
    for (const estructura of ESTRUCTURES) {
      for (const dada of estructura.cotes) {
        expect(['ok', 'unica', 'discrepant', 'pendent'], `${estructura.id} ${dada.etiqueta}`).toContain(dada.estat);
        expect(dada.font.length, dada.etiqueta).toBeGreaterThan(3);
        if (dada.estat !== 'ok') expect(dada.nota || dada.font, dada.etiqueta).toBeTruthy();
      }
    }
    const moli = cotes('moli-hidraulic');
    expect(moli[0]).toMatchObject({ valor: '1925–2022', estat: 'pendent' });
    expect(cotes('moli-electric').find((c) => c.etiqueta === 'Any d’instal·lació')).toMatchObject({ valor: '1932', estat: 'ok' });
  });

  test('F1 · la mesura de l’almàssera surt del lèxic de Cascant', () => {
    const per = Object.fromEntries(cotes('almassera').map((c) => [c.etiqueta, c.valor]));
    expect(per.Barcella).toMatch(/12,5 kg.*3,125 kg/);
    expect(per['Cànter o arrova']).toMatch(/12,5 litres/);
    expect(per['Gerra de test']).toBe('20 arroves, 250 litres');
  });

  test('F1 · res d’allò que Gemini va inventar al kit r61 no s’ha colat a les dades', () => {
    const text = JSON.stringify(ESTRUCTURES);
    for (const invencio of ['0,916', 'rpm', '1.200–1.800', '75–85', 'citaLexic', '«Omplíem', 'Pínter', 'Ph. Lafon · Ingénieur']) expect(text, invencio).not.toContain(invencio);
    expect(llig('src/data/patrimoni/anatomiaRural.js')).not.toMatch(/[\w.]+@[\w-]+\.[a-z]{2,}|\b[6-9]\d{8}\b|\+34/i);
  });

  test('F1 · videoIds reals amb l’autoria que consigna YouTube; Monesma només al pou', () => {
    const doc = Object.fromEntries(ESTRUCTURES.map((e) => [e.id, e.documental]));
    expect(doc['pou-de-neu']).toMatchObject({ videoId: '3RQv3xjVr-M', autor: 'Eugenio Monesma', canal: CANAL_MONESMA, llengua: 'es' });
    expect(doc['pou-de-neu'].titol).toBe('Los EMPOZADORES y las NEVERAS naturales de HIELO. Conservación ancestral de la NIEVE para el verano');
    expect(doc.almassera).toMatchObject({ videoId: '_knm0PiGE9A', autor: 'Sangonereta Gastronomia', canal: CANAL_SANGONERETA });
    expect(doc['moli-hidraulic']).toMatchObject({ videoId: 'VBzEBQq_4LA', autor: 'Sangonereta Gastronomia' });
    expect(doc['moli-electric'].videoId).toBe('VBzEBQq_4LA');
    expect(doc['cup-i-premsa']).toMatchObject({ videoId: 'vpTVDipdXi4', autor: 'Sangonereta Gastronomia' });
    for (const id of ['forn-de-calc', 'carbonera', 'senia-de-sang', 'carro-valencia']) expect(doc[id], id).toMatchObject({ videoId: null, canal: CANAL_MONESMA });
    for (const d of Object.values(doc)) if (d.videoId) expect(esIdVideoEditorial(d.videoId), d.videoId).toBe(true);
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
    const mig = separacions(peces, 60);
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
    expect(llista('moló, rutló, mola o trompellot')).toBeTruthy();
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
    expect(viu.textContent).toMatch(/filades de pedra/);
    expect(within(viu).queryByRole('button')).toBeNull();
    expect(document.querySelectorAll('[aria-live]')).toHaveLength(1);
    expect(detall.textContent).not.toMatch(/Pendent de contrastar/);
  });

  test('A-03/F1 · les peces pendents citen la font de l’estructura; els noms del Mestre sense font, apartats', () => {
    render(<VisorAnatomiaRural3D />);
    const detall = screen.getByRole('region', { name: 'Detall de la peça' });
    fireEvent.click(llista('pouet de drenatge'));
    expect(detall.textContent).toMatch(/Pendent de contrastar amb\s*El pou de la neu del Rentonar/);
    expect(document.querySelector('.anatomia__font').textContent).toMatch(/Font:\s*El pou de la neu del Rentonar/);
    fireEvent.click(screen.getByRole('button', { name: /Almàssera o tafona/ }));
    fireEvent.click(llista('clau'));
    expect(detall.textContent).toMatch(/Pendent de contrastar amb\s*El lèxic de l’olivera, l’oliva i l’oli al Comtat/);
    expect(detall.textContent).toMatch(/Peça 12 del plànol/);
    fireEvent.click(llista('gronsa o tremuja'));
    expect(detall.textContent).toMatch(/També: tremuja, tolva/);
    expect(detall.textContent).toMatch(/Nom indicat pel Mestre, pendent de contrastar: tramuja/);
    expect(detall.textContent).toMatch(/Peça 2 del plànol/);
    fireEvent.click(screen.getByRole('button', { name: /Forn de calç/ }));
    expect(document.querySelector('.anatomia__font').textContent).toMatch(/Font:\s*Gràfics de Poble/);
  });

  test('F1 · les cotes són un desplegable amb la font i la marca de les que no estan confirmades', () => {
    render(<VisorAnatomiaRural3D />);
    const desplegable = document.querySelector('details.anatomia__cotes');
    expect(desplegable).toBeTruthy();
    expect(desplegable.open).toBe(false);
    const cotes = [...desplegable.querySelectorAll('.anatomia__cota')];
    expect(cotes).toHaveLength(ESTRUCTURES[0].cotes.length);
    const diametre = cotes.find((c) => /Diàmetre interior/.test(c.textContent));
    expect(diametre.getAttribute('data-estat')).toBe('discrepant');
    expect(diametre.textContent).toMatch(/9,75 m al plànol; 9,80 m a l’article/);
    expect(diametre.textContent).toMatch(/Les fonts no coincidixen/);
    const fondaria = cotes.find((c) => /Fondària/.test(c.textContent));
    expect(fondaria.querySelector('.anatomia__estat')).toBeNull();
    expect(fondaria.textContent).toMatch(/13,75 m.*WP 3656/);
    const plans = cotes.find((c) => /Cim dels Plans/.test(c.textContent));
    expect(plans.textContent).toMatch(/Una sola font/);
    fireEvent.click(screen.getByRole('button', { name: /Molí fariner hidràulic/ }));
    expect(document.querySelector('.anatomia__cota').textContent).toMatch(/1925–2022.*Pendent de contrastar/);
  });

  test('F1 · cada estructura es pinta sense trencar-se i amb totes les peces dins de l’esquema, muntada i desmuntada', () => {
    for (const estructura of ESTRUCTURES) {
      for (const valor of [0, 100]) {
        const moviments = separacions(estructura.peces, valor);
        estructura.peces.forEach((peca, k) => {
          const [x, y] = construeixPeca(peca.forma).ancora;
          const sx = x + moviments[k].dx;
          const sy = y + moviments[k].dy - moviments[k].dz;
          expect(sx, `${estructura.id}/${peca.id}@${valor} x`).toBeGreaterThan(20);
          expect(sx, `${estructura.id}/${peca.id}@${valor} x`).toBeLessThan(580);
          expect(sy, `${estructura.id}/${peca.id}@${valor} y`).toBeGreaterThan(20);
          expect(sy, `${estructura.id}/${peca.id}@${valor} y`).toBeLessThan(500);
        });
      }
      const { unmount } = render(<VisorAnatomiaRural3D estructuraInicial={estructura.id} />);
      expect(document.querySelectorAll('.anatomia__peca')).toHaveLength(estructura.peces.length);
      expect(document.querySelectorAll('.anatomia__peca-boto')).toHaveLength(estructura.peces.length);
      unmount();
    }
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
  test('pou de neu: el vídeo de Monesma, amb autoria, títol i només l’origen de YouTube sense galetes', () => {
    const { container } = render(<VisorAnatomiaRural3D />);
    /* Gauntlet R9 · G2-04 · Façana de clic: abans del gest, cap iframe; el botó obri el del vídeo. */
    expect(container.querySelector('iframe')).toBeNull();
    fireEvent.click(within(container).getByRole('button', { name: /^Veure el vídeo \(YouTube\) / }));
    const marc = container.querySelector('iframe');
    expect(marc.getAttribute('src')).toBe('https://www.youtube-nocookie.com/embed/3RQv3xjVr-M');
    expect(marc.getAttribute('title')).toMatch(/^Los EMPOZADORES y las NEVERAS naturales de HIELO/);
    expect(container.textContent).toMatch(/Autoria:\s*Eugenio Monesma/);
    expect(container.querySelector('.anatomia__video-titol cite').getAttribute('lang')).toBe('es');
    expect(screen.queryByRole('link', { name: /Eugenio Monesma a YouTube/ })).toBeNull();
  });

  /* FBV-05 (verificadora de la ronda R9) · El <cite> ja diu el títol: la façana no el repetix. Abans del
     clic, el títol hi és una sola vegada; després, el <cite> continua i l'iframe porta el mateix títol. */
  test('FBV-05 · el títol del documental no es repetix a la façana', () => {
    const { container } = render(<VisorAnatomiaRural3D />);
    const cite = container.querySelector('.anatomia__video-titol cite');
    const titol = cite.textContent;
    expect(titol).toMatch(/^Los EMPOZADORES y las NEVERAS naturales de HIELO/);
    const documental = container.querySelector('.anatomia__documental');
    expect(documental.textContent.split(titol)).toHaveLength(2);
    expect(documental.querySelector('.video-editorial__facana > .sdp-buit__titol').textContent).toBe('En prémer, YouTube rebrà la teua adreça IP.');
    fireEvent.click(within(container).getByRole('button', { name: /^Veure el vídeo \(YouTube\) / }));
    expect(container.querySelector('.anatomia__video-titol cite').textContent).toBe(titol);
    expect(container.querySelector('iframe').getAttribute('title')).toBe(titol);
  });

  test('els altres vídeos reals porten l’autoria que consigna YouTube, no la de Monesma', () => {
    const esperats = { almassera: '_knm0PiGE9A', 'moli-hidraulic': 'VBzEBQq_4LA', 'moli-electric': 'VBzEBQq_4LA', 'cup-i-premsa': 'vpTVDipdXi4' };
    for (const [id, videoId] of Object.entries(esperats)) {
      const { container, unmount } = render(<VisorAnatomiaRural3D estructuraInicial={id} />);
      expect(container.querySelector('iframe'), id).toBeNull();
      fireEvent.click(within(container).getByRole('button', { name: /^Veure el vídeo \(YouTube\) / }));
      expect(container.querySelector('iframe').getAttribute('src'), id).toBe(`https://www.youtube-nocookie.com/embed/${videoId}`);
      expect(container.textContent, id).toMatch(/Autoria:\s*Sangonereta Gastronomia/);
      expect(container.textContent, id).not.toMatch(/Eugenio Monesma/);
      unmount();
    }
  });

  test('sense videoId: enllaç segur al canal d’Eugenio Monesma, amb autoria i cap iframe', () => {
    const { container } = render(<VisorAnatomiaRural3D estructuraInicial="forn-de-calc" />);
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
