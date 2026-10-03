/* Esquelet de catàleg i col·lecció (T4/T8) · TargetesColleccions: les
   llistes de La Compra i els tiquets oberts del TPV com a targetes. */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { TargetesColleccions } from './TargetesColleccions.jsx';

afterEach(cleanup);

const LLISTES = [
  { id: 'casa', nom: 'Casa', comptador: 12 },
  { id: 'mercat', nom: 'Mercat del dijous', comptador: 1, secundari: 'Compartida' }
];
const articles = (n) => `${n} ${n === 1 ? 'article' : 'articles'}`;

describe('TargetesColleccions', () => {
  test('targetes amb nom i comptador; l’oberta diu aria-current; el botó de crear davall', () => {
    const onTria = vi.fn();
    const onCrea = vi.fn();
    const { container } = render(<TargetesColleccions colleccions={LLISTES} etiqueta="Les meues llistes" actiu="mercat"
      onTria={onTria} onCrea={onCrea} textCrea="Crea una llista" textComptador={articles} />);
    const llista = screen.getByRole('list', { name: 'Les meues llistes' });
    const targetes = within(llista).getAllByRole('button');
    expect(targetes.map((t) => t.textContent)).toEqual(['Casa 12 articles', 'Mercat del dijous 1 article Compartida']);
    expect(targetes[1].getAttribute('aria-current')).toBe('true');
    expect(targetes[0].hasAttribute('aria-current')).toBe(false);
    fireEvent.click(targetes[0]);
    expect(onTria).toHaveBeenCalledWith(LLISTES[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Crea una llista' }));
    expect(onCrea).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[style]')).toBeNull();
  });

  test('amb hrefDe són enllaços de veres; sense col·leccions, el buit', () => {
    const onTria = vi.fn();
    const { rerender } = render(<TargetesColleccions colleccions={LLISTES} hrefDe={(c) => `/app/compra/llistes/${c.id}`} onTria={onTria} />);
    const casa = screen.getByRole('link', { name: /^Casa/ });
    expect(casa.getAttribute('href')).toBe('/app/compra/llistes/casa');
    expect(fireEvent.click(casa)).toBe(false);
    expect(onTria).toHaveBeenCalledWith(LLISTES[0]);
    /* Cmd+clic: el navegador obri una pestanya nova; l'app no l'atura. */
    let aturat = null;
    const espia = (event) => {
      aturat = event.defaultPrevented;
      event.preventDefault();
    };
    window.addEventListener('click', espia);
    fireEvent.click(casa, { metaKey: true });
    window.removeEventListener('click', espia);
    expect(aturat).toBe(false);
    expect(onTria).toHaveBeenCalledTimes(1);
    rerender(<TargetesColleccions colleccions={[]} buit={<p>Cap llista</p>} />);
    expect(screen.getByText('Cap llista')).toBeTruthy();
  });

  test('una imatge 1:1 segura, i mai una font insegura', () => {
    const { container } = render(<TargetesColleccions colleccions={[
      { id: 'a', nom: 'Amb logo', comptador: 0, imatge: '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg' },
      { id: 'b', nom: 'Insegura', comptador: 0, imatge: 'javascript:alert(1)' }
    ]} />);
    const imatges = container.querySelectorAll('img.sdp-targeta-colleccio__imatge');
    expect(imatges).toHaveLength(1);
    expect(imatges[0].getAttribute('alt')).toBe('');
  });
});
