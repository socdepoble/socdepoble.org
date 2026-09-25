import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Puzzle } from 'lucide-react';

vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
import { Mono, Privat, PrivacitatConsola, TargetaResum, Xifra } from './peces.jsx';

afterEach(cleanup);

/* La recepta del Panell de Control (src/sections/control/ControlSection.jsx):
   UniversalCard «action», icona lucide de 40 px amb traç 1,5, títol h3 i la
   descripció com a subtítol. Ni classes pròpies ni variants. */
function esTargetaDeControl(article) {
  expect(article.className).toBe('sp-card sp-card--action');
  const icona = article.querySelector('.sp-card-heading-with-icon .sp-card-title-icon svg');
  expect(icona.getAttribute('width')).toBe('40');
  expect(icona.getAttribute('stroke-width')).toBe('1.5');
  expect(article.querySelector('h3.sp-card-title')).not.toBeNull();
  expect(article.querySelector('h4.sp-card-subtitle')).not.toBeNull();
  expect(article.querySelector('.sp-card-footer')).toBeNull();
}

test('TargetaResum pinta exactament la targeta del Panell de Control', () => {
  render(<TargetaResum icona={Puzzle} titol="Inventari de skills" descripcio="22 skills al Mapa" a="/consola/inventari" />);
  const article = screen.getByRole('article');
  esTargetaDeControl(article);
  expect(article.querySelector('h3').textContent).toBe('Inventari de skills');
  expect(article.querySelector('h4').textContent).toBe('22 skills al Mapa');
  expect(screen.getByRole('link', { name: 'Inventari de skills' }).getAttribute('href')).toBe('/consola/inventari');
});

test('sense destí no hi ha cap enllaç, i les etiquetes són les del Control', () => {
  render(<TargetaResum icona={Puzzle} titol="Tauler" descripcio="—" etiquetes={[{ text: 'FALTA', className: 'sdp-badge-tag' }]} />);
  expect(screen.queryByRole('link')).toBeNull();
  expect(screen.queryByRole('button')).toBeNull();
  expect(document.querySelector('.sp-card-label.sdp-badge-tag').textContent).toBe('FALTA');
});

test('amb onObri la targeta és un botó que porta el títol', () => {
  const onObri = vi.fn();
  render(<TargetaResum icona={Puzzle} titol="Consums" descripcio="3 registres" onObri={onObri} />);
  screen.getByRole('button', { name: 'Consums' }).click();
  expect(onObri).toHaveBeenCalledTimes(1);
});

test('Xifra és una targeta de Control amb la xifra de títol i l’etiqueta de subtítol', () => {
  render(<Xifra icona={Puzzle} valor={22} etiqueta="skills al cens" />);
  const article = screen.getByRole('article');
  esTargetaDeControl(article);
  expect(article.querySelector('h3').textContent).toBe('22');
  expect(article.querySelector('h4').textContent).toBe('skills al cens');
  expect(document.querySelector('.sdp-consola__xifra')).toBeNull();
});

test('el mode privacitat amaga les rutes, dins i fora del codi', () => {
  render(
    <PrivacitatConsola.Provider value>
      <Mono>tooling/gates/hooks-local.mjs</Mono>
      <p><Privat>04_escriptori</Privat></p>
    </PrivacitatConsola.Provider>
  );
  expect(document.body.textContent).not.toContain('hooks-local');
  expect(document.body.textContent).not.toContain('04_escriptori');
  expect(screen.getAllByText('dada amagada pel mode privacitat')).toHaveLength(2);
});

test('sense privacitat, Privat deixa el text tal qual', () => {
  render(<p><Privat>04_escriptori</Privat></p>);
  expect(document.querySelector('p').innerHTML).toBe('04_escriptori');
});
