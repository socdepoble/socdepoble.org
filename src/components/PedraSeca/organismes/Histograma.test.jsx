import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { Histograma, nivellHistograma } from './Histograma.jsx';

afterEach(cleanup);

const HORES = Array.from({ length: 24 }, (_, h) => {
  const hh = String(h).padStart(2, '0');
  return { id: hh, etiqueta: `${hh} h`, marca: h % 3 === 0 ? hh : '', valor: [0, 0, 1, 0, 0, 0, 2, 4, 3, 1, 0, 0, 0, 1, 5, 2, 1, 0, 0, 3, 2, 1, 0, 0][h] };
});

const nivellDe = (columna) => {
  const barra = columna.querySelector('.sdp-histograma__barra');
  const classe = [...barra.classList].find((c) => c.startsWith('sdp-histograma__barra--n'));
  return Number(classe.slice('sdp-histograma__barra--n'.length));
};

describe('nivellHistograma', () => {
  test('de 0 a 10; un valor positiu sempre es veu; zero o dades dolentes, 0', () => {
    expect(nivellHistograma(5, 5)).toBe(10);
    expect(nivellHistograma(1, 5)).toBe(2);
    expect(nivellHistograma(1, 100)).toBe(1);
    expect(nivellHistograma(50, 10)).toBe(10);
    expect(nivellHistograma(0, 5)).toBe(0);
    expect(nivellHistograma(-1, 5)).toBe(0);
    expect(nivellHistograma(Number.NaN, 5)).toBe(0);
    expect(nivellHistograma(3, 0)).toBe(0);
  });
});

describe('Histograma', () => {
  test('una figura amb peu; 24 barres amb el text sencer per al lector i el dibuix amagat', () => {
    const { container } = render(<Histograma titol="Episodis per hora" barres={HORES} unitat="episodis" destacada="14" />);
    const figura = screen.getByRole('figure', { name: 'Episodis per hora' });
    const columnes = within(figura).getAllByRole('listitem');
    expect(columnes).toHaveLength(24);
    expect(columnes[14].querySelector('.sdp-nomes-lector').textContent).toBe('14 h: 5 episodis');
    expect(columnes[14].classList.contains('sdp-histograma__columna--destacada')).toBe(true);
    expect(container.querySelectorAll('.sdp-histograma__columna--destacada')).toHaveLength(1);
    for (const amagat of container.querySelectorAll('.sdp-histograma__pista, .sdp-histograma__valor, .sdp-histograma__marca')) {
      expect(amagat.getAttribute('aria-hidden')).toBe('true');
    }
    expect(container.querySelector('[style]')).toBeNull();
  });

  test('l’alçada és una classe de nivell sobre el màxim de les dades', () => {
    render(<Histograma titol="H" barres={HORES} />);
    const columnes = screen.getAllByRole('listitem');
    expect(nivellDe(columnes[14])).toBe(10);
    expect(nivellDe(columnes[7])).toBe(8);
    expect(nivellDe(columnes[0])).toBe(0);
  });

  test('un màxim propi fixa l’escala', () => {
    render(<Histograma titol="H" barres={HORES} maxim={10} />);
    expect(nivellDe(screen.getAllByRole('listitem')[14])).toBe(5);
  });

  test('marques: només les que es passen; valors: amagats amb zero o si es demana', () => {
    const { container, rerender } = render(<Histograma titol="H" barres={HORES} />);
    const marques = [...container.querySelectorAll('.sdp-histograma__marca')].map((m) => m.textContent).filter(Boolean);
    expect(marques).toEqual(['00', '03', '06', '09', '12', '15', '18', '21']);
    const valors = [...container.querySelectorAll('.sdp-histograma__valor')].map((v) => v.textContent);
    expect(valors[0]).toBe('');
    expect(valors[14]).toBe('5');
    rerender(<Histograma titol="H" barres={HORES} valors={false} />);
    expect([...container.querySelectorAll('.sdp-histograma__valor')].every((v) => v.textContent === '')).toBe(true);
  });

  test('formatValor i l’etiqueta com a marca per defecte', () => {
    const setmana = [
      { etiqueta: 'dilluns', marca: 'dl', valor: 1500 },
      { etiqueta: 'dimarts', valor: 1250 }
    ];
    const { container } = render(<Histograma titol="Begut" barres={setmana} unitat="ml" formatValor={(v) => v.toLocaleString('ca-ES')} />);
    const lector = [...container.querySelectorAll('.sdp-nomes-lector')].map((s) => s.textContent);
    expect(lector[0]).toMatch(/^dilluns: 1.?500 ml$/);
    expect([...container.querySelectorAll('.sdp-histograma__marca')].map((m) => m.textContent)).toEqual(['dl', 'dimarts']);
  });

  test('sense barres, l’estat buit de Pedra Seca', () => {
    const { container } = render(<Histograma titol="H" barres={[]} />);
    expect(container.querySelector('.sdp-buit')).not.toBeNull();
    expect(screen.getByText('Encara no hi ha dades.')).toBeTruthy();
  });
});
