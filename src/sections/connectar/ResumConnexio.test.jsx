/**
 * T43 (ordre del Mestre, 260928) · El resum per destinatari: un rol d'estat
 * (no interromp), l'estat de cada fila en text i la icona decorativa.
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { ResumConnexio, veredicteDelResum } from './ResumConnexio.jsx';

afterEach(cleanup);

/* D1 (ordre del Mestre, 260930) · el verb és connectar: «Connexió guardada»
   passa a «Connectat», i la safata es diu «Safata d’Entrada». */
const MAS = { clau: 'mas', nom: 'El teu MAS', estat: 'fet', detall: 'Connectada a «Safata d’Entrada».' };

test('tot fet: to d’èxit i cada fila diu el seu estat en text', () => {
  const { container } = render(<ResumConnexio resultats={[MAS, { clau: 'p', nom: 'Pepa', estat: 'fet', detall: 'Enviat per xat.' }]} />);
  const avis = screen.getByRole('status');
  expect(avis.className).toContain('sdp-alerta--exit');
  expect(screen.getByText('Connectat', { selector: '.sdp-alerta__titol' })).toBeTruthy();
  expect(avis.textContent).not.toMatch(/[Gg]uard/);
  const files = [...container.querySelectorAll('.sdp-connexio-resum__fila')];
  expect(files.map((f) => f.querySelector('.sdp-connexio-resum__estat').textContent)).toEqual(['Fet', 'Fet']);
  for (const icona of container.querySelectorAll('.sdp-connexio-resum__icona')) expect(icona.getAttribute('aria-hidden')).toBe('true');
});

test('una fallada: to d’avís, sense interrompre (status), i el detall de la fila', () => {
  render(<ResumConnexio resultats={[MAS, { clau: 'g', nom: 'Colla', estat: 'error', detall: 'No s’ha enviat.' }]} />);
  const avis = screen.getByRole('status');
  expect(avis.className).toContain('sdp-alerta--avis');
  expect(avis.textContent).toContain('no tot s’ha enviat');
  expect(avis.textContent).toContain('No enviat');
  expect(avis.textContent).toContain('No s’ha enviat.');
});

test('C12 · la classe de cada fila és la de l’estat, i un estat del prototip cau a pendent', () => {
  const { container } = render(<ResumConnexio resultats={[
    MAS,
    { clau: 'e', nom: 'Colla', estat: 'error' },
    { clau: 't', nom: 'Trampa', estat: 'toString' },
    { clau: 'c', nom: 'Trampa 2', estat: 'constructor' }
  ]} />);
  const files = [...container.querySelectorAll('.sdp-connexio-resum__fila')];
  expect(files.map((f) => f.className)).toEqual([
    'sdp-connexio-resum__fila sdp-connexio-resum__fila--fet',
    'sdp-connexio-resum__fila sdp-connexio-resum__fila--error',
    'sdp-connexio-resum__fila sdp-connexio-resum__fila--pendent',
    'sdp-connexio-resum__fila sdp-connexio-resum__fila--pendent'
  ]);
  expect(files[2].querySelector('.sdp-connexio-resum__estat').textContent).toBe('Pendent');
});

test('un pas pendent (compartir al Mur) i les accions de l’Alerta', () => {
  render(<ResumConnexio resultats={[MAS, { clau: 'mur', nom: 'El teu mur', estat: 'pendent' }]} accions={<button type="button">Obrir</button>} />);
  expect(screen.getByRole('status').className).toContain('sdp-alerta--info');
  expect(screen.getByRole('button', { name: 'Obrir' })).toBeTruthy();
  expect(veredicteDelResum([{ estat: 'raro' }]).to).toBe('exit');
});

test('D1 · els tres títols diuen «Connectat», mai «guardada»', () => {
  expect(veredicteDelResum([{ estat: 'fet' }]).titol).toBe('Connectat');
  expect(veredicteDelResum([{ estat: 'pendent' }]).titol).toBe('Connectat: et falta un pas');
  expect(veredicteDelResum([{ estat: 'error' }]).titol).toBe('Connectat, però no tot s’ha enviat');
});
