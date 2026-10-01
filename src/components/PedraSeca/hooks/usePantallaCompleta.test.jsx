/* Ordre del Mestre, 261001 · L'estat de la pantalla completa és efímer i el
   focus torna, per id, al botó d'entrar tornat a muntar: al document a la SPA
   i dins del ShadowRoot d'un <soc-de-poble>. */
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { usePantallaCompleta } from './usePantallaCompleta.js';

afterEach(() => {
  cleanup();
  document.querySelectorAll('soc-de-poble').forEach((el) => el.remove());
});

function Prova({ ambObridor = true }) {
  const { oberta, obri, tanca, idObridor } = usePantallaCompleta();
  return (
    <>
      <p data-testid="estat">{oberta ? 'oberta' : 'tancada'}</p>
      {ambObridor && !oberta ? <button type="button" id={idObridor} onClick={obri}>Entrar</button> : null}
      {ambObridor ? null : <button type="button" onClick={obri}>Entrar sense id</button>}
      <button type="button" onClick={() => obri()}>Entrar sense event</button>
      <button type="button" onClick={tanca}>Tancar</button>
    </>
  );
}

test('obri(e) i tanca() canvien `oberta`; en tancar, el focus torna a l’element amb idObridor', () => {
  render(<Prova />);
  expect(screen.getByTestId('estat').textContent).toBe('tancada');
  act(() => screen.getByRole('button', { name: 'Entrar' }).click());
  expect(screen.getByTestId('estat').textContent).toBe('oberta');
  expect(screen.queryByRole('button', { name: 'Entrar' })).toBeNull();
  const tancar = screen.getByRole('button', { name: 'Tancar' });
  tancar.focus();
  act(() => tancar.click());
  expect(screen.getByTestId('estat').textContent).toBe('tancada');
  const entrar = screen.getByRole('button', { name: 'Entrar' });
  expect(document.activeElement).toBe(entrar);
  expect(entrar.id).toMatch(/\S/);
});

test('dins d’un ShadowRoot el focus també torna al botó (getElementById de l’arrel del clic)', () => {
  const host = document.createElement('soc-de-poble'); document.body.append(host);
  const shadow = host.attachShadow({ mode: 'open' });
  const root = document.createElement('div'); root.className = 'sdp-root'; shadow.append(root);
  const muntatge = document.createElement('div'); root.append(muntatge);
  render(<Prova />, { container: muntatge, baseElement: root });
  act(() => shadow.querySelector('button').click());
  expect(shadow.querySelector('[data-testid="estat"]').textContent).toBe('oberta');
  const tancar = [...shadow.querySelectorAll('button')].find((b) => b.textContent === 'Tancar');
  tancar.focus();
  act(() => tancar.click());
  const entrar = [...shadow.querySelectorAll('button')].find((b) => b.textContent === 'Entrar');
  expect(shadow.activeElement).toBe(entrar);
  // El document no el veu per id: el focus no ha passat per document.getElementById.
  expect(document.getElementById(entrar.id)).toBeNull();
});

/* El patró de CalendariSection mentre el Mur carrega: el carregant no porta
   el botó d'entrar, i «Eixir» desapareix en tancar. */
function ProvaCarrega({ carregant }) {
  const { oberta, obri, tanca, idObridor } = usePantallaCompleta();
  return (
    <>
      {!oberta && !carregant ? <button type="button" id={idObridor} onClick={obri}>Entrar</button> : null}
      {oberta ? <button type="button" onClick={tanca}>Eixir</button> : null}
      <button type="button">Un altre</button>
    </>
  );
}

test('si s’ix quan el botó encara no hi és, el focus hi torna quan es munta', () => {
  const { rerender } = render(<ProvaCarrega carregant={false} />);
  act(() => screen.getByRole('button', { name: 'Entrar' }).click());
  rerender(<ProvaCarrega carregant />);
  const eixir = screen.getByRole('button', { name: 'Eixir' });
  eixir.focus();
  act(() => eixir.click());
  expect(screen.queryByRole('button', { name: 'Entrar' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Eixir' })).toBeNull();
  rerender(<ProvaCarrega carregant={false} />);
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Entrar' }));
});

test('si mentrestant algú porta el focus a una altra banda, el botó que arriba després no li’l pren', () => {
  const { rerender } = render(<ProvaCarrega carregant={false} />);
  act(() => screen.getByRole('button', { name: 'Entrar' }).click());
  rerender(<ProvaCarrega carregant />);
  const eixir = screen.getByRole('button', { name: 'Eixir' });
  eixir.focus();
  act(() => eixir.click());
  const altre = screen.getByRole('button', { name: 'Un altre' });
  altre.focus();
  rerender(<ProvaCarrega carregant={false} />);
  expect(document.activeElement).toBe(altre);
  // El retorn pendent s'ha cancel·lat: un commit posterior tampoc no el mou.
  altre.blur();
  rerender(<ProvaCarrega carregant={false} />);
  expect(document.activeElement).toBe(document.body);
});

test('sense element amb idObridor, o sense event, tancar no peta i el focus no es mou', () => {
  render(<Prova ambObridor={false} />);
  act(() => screen.getByRole('button', { name: 'Entrar sense id' }).click());
  const tancar = screen.getByRole('button', { name: 'Tancar' });
  tancar.focus();
  expect(() => act(() => tancar.click())).not.toThrow();
  expect(screen.getByTestId('estat').textContent).toBe('tancada');
  expect(document.activeElement).toBe(tancar);

  act(() => screen.getByRole('button', { name: 'Entrar sense event' }).click());
  expect(screen.getByTestId('estat').textContent).toBe('oberta');
  expect(() => act(() => tancar.click())).not.toThrow();
  expect(document.activeElement).toBe(tancar);
});
