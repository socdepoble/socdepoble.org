/* Esquelet de catàleg i col·lecció (T4/T8) · DetallArticle: variants,
   quantitat amb el TeclatNumeric (la primera tecla substituïx), nota, i un
   esborrany que torna a començar a cada obertura. En jsdom no hi ha
   showModal: el Dialeg posa l'atribut open. */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { Coffee } from 'lucide-react';
import { DetallArticle } from './DetallArticle.jsx';

afterEach(cleanup);

const CAFE = { id: 'cafe-llet', nom: 'Cafè amb llet', categoriaId: 'cafes', secundari: 'Amb llet de la casa', valor: '1,50 €' };
const VARIANTS = [
  { valor: 'tassa', etiqueta: 'Tassa', ajuda: '1,50 €' },
  { valor: 'got', etiqueta: 'Got', ajuda: '1,60 €' }
];
const CAFES = { id: 'cafes', nom: 'Cafès', icona: Coffee, visible: true, ordre: 0 };

const tecla = (nom) => fireEvent.click(within(screen.getByRole('group', { name: 'Quantitat' })).getByRole('button', { name: nom }));

describe('DetallArticle', () => {
  test('tancat o sense article no pinta el cos; obert, el títol és el nom i la descripció l’especificació', () => {
    const { rerender, container } = render(<DetallArticle obert={false} article={CAFE} />);
    expect(container.querySelector('dialog').hasAttribute('open')).toBe(false);
    expect(container.querySelector('.sdp-detall-article')).toBeNull();
    rerender(<DetallArticle obert article={null} />);
    expect(container.querySelector('dialog').hasAttribute('open')).toBe(false);
    rerender(<DetallArticle obert article={CAFE} categoria={CAFES} />);
    const dialeg = screen.getByRole('dialog', { name: 'Cafè amb llet' });
    expect(dialeg.getAttribute('aria-describedby')).toBeTruthy();
    expect(document.getElementById(dialeg.getAttribute('aria-describedby')).textContent).toBe('Amb llet de la casa');
    expect(dialeg.querySelector('.sdp-detall-article__quadrat svg')).not.toBeNull();
    expect(dialeg.querySelector('.sdp-detall-article__valor').textContent).toBe('1,50 €');
    expect(container.querySelector('[style]')).toBeNull();
  });

  test('variant, quantitat i nota tornen amb onAccepta; la primera tecla substituïx l’1', () => {
    const onAccepta = vi.fn();
    render(<DetallArticle obert article={CAFE} variants={VARIANTS} onAccepta={onAccepta} />);
    expect(screen.getByRole('radio', { name: /^Tassa/ }).checked).toBe(true);
    fireEvent.click(screen.getByRole('radio', { name: /^Got/ }));
    tecla('3');
    tecla('2');
    fireEvent.change(screen.getByRole('textbox', { name: 'Nota' }), { target: { value: '  sense sucre ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Afig' }));
    expect(onAccepta).toHaveBeenCalledWith({ variant: 'got', quantitat: 32, nota: 'sense sucre' }, CAFE);
  });

  test('amb quantitat 0 no es pot acceptar', () => {
    const onAccepta = vi.fn();
    render(<DetallArticle obert article={CAFE} onAccepta={onAccepta} />);
    tecla('C, posa a zero');
    expect(screen.getByRole('button', { name: 'Afig' }).disabled).toBe(true);
    tecla('4');
    fireEvent.click(screen.getByRole('button', { name: 'Afig' }));
    expect(onAccepta).toHaveBeenCalledWith({ variant: null, quantitat: 4, nota: '' }, CAFE);
  });

  test('l’esborrany torna a començar en tornar a obrir; inicial en dona els valors', () => {
    const onAccepta = vi.fn();
    const { rerender } = render(<DetallArticle obert article={CAFE} variants={VARIANTS} onAccepta={onAccepta} />);
    tecla('5');
    rerender(<DetallArticle obert={false} article={CAFE} variants={VARIANTS} onAccepta={onAccepta} />);
    rerender(<DetallArticle obert article={CAFE} variants={VARIANTS} onAccepta={onAccepta}
      inicial={{ variant: 'got', quantitat: 2, nota: 'calent' }} textAccepta="Desa" />);
    expect(screen.getByRole('radio', { name: /^Got/ }).checked).toBe(true);
    expect(screen.getByRole('textbox', { name: 'Nota' }).value).toBe('calent');
    tecla('3');
    fireEvent.click(screen.getByRole('button', { name: 'Desa' }));
    expect(onAccepta).toHaveBeenCalledWith({ variant: 'got', quantitat: 3, nota: 'calent' }, CAFE);
  });

  /* ESQ-R7 · Disseny del Bar §A.6, flux 1: amb un grup obligatori, «un
     Dialeg menut on un toc tria i tanca». */
  test('tria directa: cada opció és un botó, un toc accepta i no hi ha ràdios, quantitat, nota ni «Afig»', () => {
    const onAccepta = vi.fn();
    const onTanca = vi.fn();
    render(<DetallArticle obert triaDirecta article={CAFE} variants={VARIANTS} etiquetaVariants="Recipient"
      onAccepta={onAccepta} onTanca={onTanca} />);
    const dialeg = screen.getByRole('dialog', { name: 'Cafè amb llet' });
    expect(within(dialeg).queryByRole('radio')).toBeNull();
    expect(within(dialeg).queryByRole('group', { name: 'Quantitat' })).toBeNull();
    expect(within(dialeg).queryByRole('textbox')).toBeNull();
    expect(within(dialeg).queryByRole('button', { name: 'Afig' })).toBeNull();
    const grup = within(dialeg).getByRole('group', { name: 'Recipient' });
    expect(within(grup).getAllByRole('button').map((b) => b.textContent)).toEqual(['Tassa · 1,50 €', 'Got · 1,60 €']);
    fireEvent.click(within(grup).getByRole('button', { name: 'Got · 1,60 €' }));
    expect(onAccepta).toHaveBeenCalledTimes(1);
    expect(onAccepta).toHaveBeenCalledWith({ variant: 'got', quantitat: 1, nota: '' }, CAFE);
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Cancel·la' }));
    expect(onTanca).toHaveBeenCalledWith('boto');
  });

  test('tria directa sense opcions: el detall de sempre, amb «Afig»', () => {
    const onAccepta = vi.fn();
    render(<DetallArticle obert triaDirecta article={CAFE} variants={[]} onAccepta={onAccepta} />);
    fireEvent.click(screen.getByRole('button', { name: 'Afig' }));
    expect(onAccepta).toHaveBeenCalledWith({ variant: null, quantitat: 1, nota: '' }, CAFE);
  });

  test('sense quantitat ni nota (La Compra amb especificació a part); Cancel·la tanca', () => {
    const onTanca = vi.fn();
    const onAccepta = vi.fn();
    render(<DetallArticle obert article={CAFE} ambQuantitat={false} ambNota={false} onTanca={onTanca} onAccepta={onAccepta}
      accions={<button type="button">Lleva de la llista</button>}>
      <p>Cada dilluns</p>
    </DetallArticle>);
    expect(screen.queryByRole('group', { name: 'Quantitat' })).toBeNull();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.getByText('Cada dilluns')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Lleva de la llista' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Afig' }));
    expect(onAccepta).toHaveBeenCalledWith({ variant: null, quantitat: null, nota: '' }, CAFE);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel·la' }));
    expect(onTanca).toHaveBeenCalledWith('boto');
  });
});
