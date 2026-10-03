/* Esquelet de catàleg i col·lecció (T4/T8) · GraellaArticles: rajoles 1:1
   per seccions de categoria, estats amb text, insígnies i l'acció secundària
   per tres camins (pulsació llarga, menú contextual i teclat). */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { Coffee } from 'lucide-react';
import { GraellaArticles } from './GraellaArticles.jsx';
import { DURADA_PULSACIO } from './pulsacioLlarga.js';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

/* El temporitzador de la pulsació i el rellotge (Date.now, per als duplicats). */
const rellotgeFals = () => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });

const CATEGORIES = [
  { id: 'cafes', nom: 'Cafès', icona: Coffee, ordre: 0, visible: true },
  { id: 'begudes', nom: 'Begudes', ordre: 1, visible: true },
  { id: 'licors', nom: 'Licors', ordre: 2, visible: false }
];
const ARTICLES = [
  { id: 'tallat', nom: 'Tallat', categoriaId: 'cafes', valor: '1,30 €' },
  { id: 'cafe-llet', nom: 'Cafè amb llet', categoriaId: 'cafes', secundari: 'Tassa', valor: '1,50 €', estat: 'en-colleccio', insignia: '2' },
  { id: 'aigua', nom: 'Aigua', categoriaId: 'begudes', valor: '2 variants' },
  { id: 'gasosa', nom: 'Gasosa', categoriaId: 'begudes', estat: 'desactivat', secundari: 'Esgotat' },
  { id: 'cassalla', nom: 'Cassalla', categoriaId: 'licors' }
];

describe('sense categories', () => {
  test('una sola llista de rajoles (botons natius) amb el nom i la línia secundària', () => {
    const onTria = vi.fn();
    const { container } = render(<GraellaArticles articles={ARTICLES.slice(0, 3)} etiqueta="Productes" onTria={onTria} />);
    const llista = screen.getByRole('list', { name: 'Productes' });
    expect(within(llista).getAllByRole('listitem')).toHaveLength(3);
    fireEvent.click(screen.getByRole('button', { name: 'Tallat 1,30 €' }));
    expect(onTria).toHaveBeenCalledWith(ARTICLES[0]);
    expect(screen.getByRole('button', { name: 'Cafè amb llet Tassa · 1,50 €' })).toBeTruthy();
    /* Cap rajola és un interruptor en mode acció (el TPV). */
    expect(container.querySelector('[aria-pressed]')).toBeNull();
    expect(container.querySelector('[style]')).toBeNull();
  });

  test('sense articles pinta el buit', () => {
    render(<GraellaArticles articles={[]} buit={<p>Res a mostrar</p>} />);
    expect(screen.getByText('Res a mostrar')).toBeTruthy();
    expect(screen.queryByRole('list')).toBeNull();
  });
});

describe('amb categories', () => {
  test('una secció per categoria visible, en ordre, amb la seua graella; les amagades no hi són', () => {
    render(<GraellaArticles articles={ARTICLES} categories={CATEGORIES} />);
    const seccions = screen.getAllByRole('region');
    expect(seccions.map((s) => within(s).getByRole('heading').textContent)).toEqual(['Cafès 2 articles', 'Begudes 2 articles']);
    expect(seccions.map((s) => document.getElementById(s.getAttribute('aria-labelledby')).tagName)).toEqual(['H3', 'H3']);
    expect(within(screen.getByRole('list', { name: 'Cafès' })).getAllByRole('listitem')).toHaveLength(2);
    expect(screen.queryByRole('button', { name: /Cassalla/ })).toBeNull();
  });

  test('el marcador porta les inicials i la icona de la categoria, sense color propi', () => {
    const { container } = render(<GraellaArticles articles={ARTICLES} categories={CATEGORIES} />);
    const tallat = container.querySelector('[data-article="tallat"]');
    expect(tallat.querySelector('.sdp-marca-article__inicials').textContent).toBe('T');
    expect(tallat.querySelector('.sdp-rajola__media svg')).not.toBeNull();
    const aigua = container.querySelector('[data-article="aigua"]');
    expect(aigua.querySelector('.sdp-rajola__media svg')).toBeNull();
  });

  test('plegar: el botó de capçalera diu aria-expanded i crida onPlega; plegada, el cos s’amaga', () => {
    const onPlega = vi.fn();
    const { rerender } = render(<GraellaArticles articles={ARTICLES} categories={CATEGORIES} plegades={[]} onPlega={onPlega} />);
    const cafes = screen.getByRole('button', { name: 'Cafès 2 articles' });
    expect(cafes.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(cafes);
    expect(onPlega).toHaveBeenCalledWith('cafes', true);
    rerender(<GraellaArticles articles={ARTICLES} categories={CATEGORIES} plegades={['cafes']} onPlega={onPlega} />);
    expect(screen.getByRole('button', { name: 'Cafès 2 articles' }).getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('list', { name: 'Cafès' })).toBeNull();
    expect(screen.getByRole('list', { name: 'Begudes' })).toBeTruthy();
  });
});

describe('estats i insígnies, mai només color', () => {
  test('en-colleccio i desactivat porten text per al lector; la insígnia és part de la descripció', () => {
    const { container } = render(<GraellaArticles articles={ARTICLES} etiqueta="Productes"
      textos={{ 'en-colleccio': 'A la comanda' }} />);
    const ambLlet = screen.getByRole('button', { name: /^Cafè amb llet/ });
    const descripcio = ambLlet.getAttribute('aria-describedby').split(' ').map((id) => document.getElementById(id).textContent);
    expect(descripcio).toEqual(['A la comanda', '2']);
    expect(container.querySelector('[data-article="cafe-llet"]').closest('li').className)
      .toBe('sdp-graella-articles__element sdp-graella-articles__element--en-colleccio');
    const gasosa = screen.getByRole('button', { name: 'Gasosa Esgotat' });
    expect(gasosa.disabled).toBe(true);
    expect(document.getElementById(gasosa.getAttribute('aria-describedby')).textContent).toBe('No disponible');
  });

  test('commutable: la rajola és un interruptor (aria-pressed) per a posar i llevar', () => {
    render(<GraellaArticles articles={ARTICLES.slice(0, 3)} commutable />);
    expect(screen.getByRole('button', { name: /^Cafè amb llet/ }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: /^Tallat/ }).getAttribute('aria-pressed')).toBe('false');
  });

  test('renderMedia posa un quadrat propi', () => {
    const { container } = render(<GraellaArticles articles={ARTICLES.slice(0, 1)}
      renderMedia={(article) => <span className="sdp-nomes-lector">{`foto de ${article.nom}`}</span>} />);
    expect(container.querySelector('.sdp-rajola__media').textContent).toBe('foto de Tallat');
  });
});

describe('acció secundària', () => {
  const munta = () => {
    const onTria = vi.fn();
    const onAccioSecundaria = vi.fn();
    render(<GraellaArticles articles={ARTICLES.slice(0, 3)} etiqueta="Productes" onTria={onTria} onAccioSecundaria={onAccioSecundaria} />);
    return { onTria, onAccioSecundaria, aigua: screen.getByRole('button', { name: 'Aigua 2 variants' }) };
  };

  test('anuncia la drecera (aria-keyshortcuts) i la pista per al lector', () => {
    const { aigua } = munta();
    expect(aigua.getAttribute('aria-keyshortcuts')).toBe('Shift+F10');
    const pista = aigua.getAttribute('aria-describedby').split(' ').map((id) => document.getElementById(id).textContent);
    expect(pista).toEqual(['Mantín premut, fes clic amb el botó dret o prem Maj+F10 per a més opcions.']);
  });

  test('pulsació llarga: obri el detall i el clic que ve després no afig', () => {
    rellotgeFals();
    const { onTria, onAccioSecundaria, aigua } = munta();
    fireEvent.pointerDown(aigua, { button: 0, clientX: 10, clientY: 10 });
    act(() => { vi.advanceTimersByTime(DURADA_PULSACIO); });
    expect(onAccioSecundaria).toHaveBeenCalledWith(ARTICLES[2], aigua);
    fireEvent.pointerUp(aigua);
    fireEvent.click(aigua);
    expect(onTria).not.toHaveBeenCalled();
    /* El toc següent ja és un toc normal. */
    fireEvent.pointerDown(aigua, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.pointerUp(aigua);
    fireEvent.click(aigua);
    expect(onTria).toHaveBeenCalledTimes(1);
  });

  test('moure el dit o alçar-lo abans d’hora no és pulsació llarga', () => {
    rellotgeFals();
    const { onAccioSecundaria, aigua } = munta();
    fireEvent.pointerDown(aigua, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(aigua, { clientX: 40, clientY: 10 });
    act(() => { vi.advanceTimersByTime(DURADA_PULSACIO * 2); });
    fireEvent.pointerDown(aigua, { button: 0, clientX: 10, clientY: 10 });
    act(() => { vi.advanceTimersByTime(DURADA_PULSACIO - 100); });
    fireEvent.pointerUp(aigua);
    act(() => { vi.advanceTimersByTime(DURADA_PULSACIO); });
    expect(onAccioSecundaria).not.toHaveBeenCalled();
  });

  test('botó dret i teclat (Maj+F10, tecla de menú); dos camins junts compten una vegada', () => {
    rellotgeFals();
    const { onTria, onAccioSecundaria, aigua } = munta();
    expect(fireEvent.contextMenu(aigua)).toBe(false);
    expect(onAccioSecundaria).toHaveBeenCalledTimes(1);
    /* El navegador dispara el menú contextual darrere de Maj+F10: només un. */
    act(() => { vi.advanceTimersByTime(1000); });
    fireEvent.keyDown(aigua, { key: 'F10', shiftKey: true });
    fireEvent.contextMenu(aigua);
    expect(onAccioSecundaria).toHaveBeenCalledTimes(2);
    act(() => { vi.advanceTimersByTime(1000); });
    fireEvent.keyDown(aigua, { key: 'ContextMenu' });
    expect(onAccioSecundaria).toHaveBeenCalledTimes(3);
    /* Un clic amb el teclat o el ratolí, després del botó dret, sí que tria. */
    fireEvent.keyDown(aigua, { key: 'Enter' });
    fireEvent.click(aigua);
    expect(onTria).toHaveBeenCalledTimes(1);
  });

  test('sense onAccioSecundaria no hi ha drecera ni pista, i el botó dret és el del navegador', () => {
    render(<GraellaArticles articles={ARTICLES.slice(0, 1)} onTria={() => {}} />);
    const tallat = screen.getByRole('button', { name: 'Tallat 1,30 €' });
    expect(tallat.hasAttribute('aria-keyshortcuts')).toBe(false);
    expect(tallat.hasAttribute('aria-describedby')).toBe(false);
    expect(fireEvent.contextMenu(tallat)).toBe(true);
  });
});
