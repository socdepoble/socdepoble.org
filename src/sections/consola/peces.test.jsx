import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Puzzle } from 'lucide-react';

const navega = vi.hoisted(() => vi.fn());
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => navega,
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
import {
  Desplegable, Mono, Privat, PrivacitatConsola, TargetaConsola, TargetaResum, Xifra, momentInstantania,
  tornaAlCim, useTargetesQueObrin
} from './peces.jsx';

afterEach(cleanup);

/* La recepta del Panell de Control (src/sections/control/ControlSection.jsx):
   UniversalCard «action», icona lucide de 40 px amb traç 1,5, títol h3 i la
   descripció com a subtítol. Cap variant: només `sdp-consola__quieta` quan
   la targeta no obri res, perquè no pretenga ser clicable. */
function esTargetaDeControl(article, { quieta = false } = {}) {
  expect(article.className).toBe(quieta ? 'sp-card sp-card--action sdp-consola__quieta' : 'sp-card sp-card--action');
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
  esTargetaDeControl(screen.getByRole('article'), { quieta: true });
  expect(document.querySelector('.sp-card-label.sdp-badge-tag').textContent).toBe('FALTA');
});

test('una etiqueta amb `to` porta les classes d’Insignia', () => {
  render(<TargetaResum icona={Puzzle} titol="Avisos" descripcio="2 avisos" a="/consola/salut"
    etiquetes={[{ text: 'Cal reparar', to: 'error' }, { text: 'Canvis nous', to: 'info' }]} />);
  const etiquetes = [...document.querySelectorAll('.sp-card-label')];
  expect(etiquetes.map((l) => [l.textContent, l.className])).toEqual([
    ['Cal reparar', 'sp-card-label sdp-insignia sdp-insignia--error'],
    ['Canvis nous', 'sp-card-label sdp-insignia sdp-insignia--info']
  ]);
});

test('amb onObri la targeta és un botó que porta el títol', () => {
  const onObri = vi.fn();
  render(<TargetaResum icona={Puzzle} titol="Consums" descripcio="3 registres" onObri={onObri} />);
  esTargetaDeControl(screen.getByRole('article'));
  screen.getByRole('button', { name: 'Consums' }).click();
  expect(onObri).toHaveBeenCalledTimes(1);
});

test('Xifra és una targeta de Control amb la xifra de títol i l’etiqueta de subtítol', () => {
  render(<Xifra icona={Puzzle} valor={22} etiqueta="skills al cens" />);
  const article = screen.getByRole('article');
  esTargetaDeControl(article, { quieta: true });
  expect(article.querySelector('h3').textContent).toBe('22');
  expect(article.querySelector('h4').textContent).toBe('skills al cens');
  expect(document.querySelector('.sdp-consola__xifra')).toBeNull();
});

/* La targeta explicativa és la UniversalCard sencera del Mur: boina taronja
   (autoria, font i hora), icona a la insígnia lateral en lloc de foto,
   títol, subtítol, entradilla, dada viva, etiquetes i peu blau. */
test('TargetaConsola amb destí: anatomia completa de la targeta mestra i peu amb Compartir i Obrir', () => {
  render(<TargetaConsola icona={Puzzle} titol="Inventari de skills" subtitol="Per a saber quines skills cal cuidar"
    entradilla="Semàfor de cada skill segons els avisos que en fa el Mapa del Mas." dada="22 skills al Mapa"
    font="Font: el Mapa del Mas" generat="2026-09-25T13:12:23.715Z" a="/consola/inventari"
    etiquetes={[{ text: 'Important', to: 'avis' }]} />);
  const article = screen.getByRole('article');
  expect(article.className).toBe('sp-card sdp-consola__targeta');
  const ordre = [...article.children].map((el) => el.className.split(' ')[0]);
  expect(ordre).toEqual(['sp-card-header', 'sp-card-link-overlay', 'sp-card-body', 'sp-card-footer']);
  expect(article.querySelector('.sp-card-author-name').textContent).toBe('Sóc de Poble');
  expect(article.querySelector('.sp-card-author-location').textContent).toBe('La Torre de les Maçanes');
  expect(article.querySelector('time.btn-date-time').getAttribute('datetime')).toBe('2026-09-25T13:12:23.715Z');
  expect(article.querySelector('.sp-card-media-container')).toBeNull();
  const icona = article.querySelector('.sp-card-body.has-aside .sp-card-calendar-badge svg');
  expect([icona.getAttribute('width'), icona.getAttribute('stroke-width'), icona.getAttribute('aria-hidden')]).toEqual(['48', '1.5', 'true']);
  expect(article.querySelector('h3.sp-card-title').textContent).toBe('Inventari de skills');
  expect(article.querySelector('h4.sp-card-subtitle').textContent).toBe('Per a saber quines skills cal cuidar');
  expect([...article.querySelectorAll('.sp-card-text > p')].map((p) => [p.className, p.textContent])).toEqual([
    ['', 'Semàfor de cada skill segons els avisos que en fa el Mapa del Mas.'],
    ['sdp-consola__dada', '22 skills al Mapa']
  ]);
  const etiquetes = [...article.querySelectorAll('.sp-card-label')];
  expect(etiquetes[0].className).toBe('sp-card-label sdp-insignia sdp-insignia--avis');
  expect(etiquetes[1].textContent).toBe('Font: Font: el Mapa del Mas');
  expect(screen.getByRole('link', { name: 'Inventari de skills' }).getAttribute('href')).toBe('/consola/inventari');
  const peu = article.querySelector('.sp-card-footer');
  expect([...peu.querySelectorAll('button')].map((b) => b.getAttribute('aria-label')))
    .toEqual(['Traduir Inventari de skills', 'Comentar Inventari de skills', 'Compartir Inventari de skills', 'Connectar amb Inventari de skills']);
  // «Obrir» porta de veritat a la pàgina.
  navega.mockClear();
  screen.getByRole('button', { name: 'Connectar amb Inventari de skills' }).click();
  expect(navega).toHaveBeenCalledWith('/consola/inventari');
});

test('TargetaConsola amb onObri: sense Compartir, el peu diu «Veure detall» i obri el mateix', () => {
  const onObri = vi.fn();
  render(<TargetaConsola icona={Puzzle} titol="Consums" subtitol="Per a saber qui gasta tòkens i quants"
    entradilla="Tòkens d’entrada i d’eixida que cada agent anota al diari de sessió." dada="3 registres"
    font="Font: consola.json" onObri={onObri} />);
  expect(screen.queryByRole('link')).toBeNull();
  expect(screen.getByRole('button', { name: /^Compartir/ })).not.toBeNull();
  // Sense instantània no hi ha hora a la boina.
  expect(document.querySelector('.btn-date-time')).toBeNull();
  screen.getByRole('button', { name: 'Consums' }).click();
  screen.getByRole('button', { name: 'Connectar amb Consums' }).click();
  expect(onObri).toHaveBeenCalledTimes(2);
});

test('TargetaConsola sense acció: explicació quieta, sense peu buit', () => {
  render(<TargetaConsola icona={Puzzle} titol="Càrrega documental" subtitol="Per a saber quan s’embossa el context"
    entradilla="Compta els artefactes actius del cervell." dada="Recompte encara no disponible" font="Font: consola.json" />);
  const article = screen.getByRole('article');
  expect(article.className).toBe('sp-card sdp-consola__targeta sdp-consola__quieta');
  expect(article.querySelector('.sp-card-footer')).not.toBeNull();
});

test('momentInstantania: hora i data locals, i res si no hi ha instantània vàlida', () => {
  const iso = '2026-09-25T13:12:23.715Z';
  const d = new Date(iso);
  const dos = (n) => String(n).padStart(2, '0');
  expect(momentInstantania(iso)).toEqual({
    time: `${dos(d.getHours())}:${dos(d.getMinutes())}`,
    date: `${dos(d.getDate())}/${dos(d.getMonth() + 1)}/26`,
    dateTime: iso
  });
  expect(momentInstantania(null)).toEqual({});
  expect(momentInstantania('no és una data')).toEqual({});
});

test('la targeta explicativa que obri un desplegable ho diu també des del peu', () => {
  function Graella({ obert }) {
    const graella = React.useRef(null);
    useTargetesQueObrin(graella, [{ controla: 'pols-rebuts', obert }]);
    return (
      <div className="sdp-card-grid" ref={graella}>
        <TargetaConsola icona={Puzzle} titol="Rebuts" subtitol="Per a comprovar què ha llegit l’eixam"
          entradilla="Cada lectura sencera deixa un rebut." dada="2 rebuts" font="Font: consola.json" onObri={() => {}} />
      </div>
    );
  }
  const { rerender } = render(<Graella obert={false} />);
  for (const nom of ['Rebuts', 'Connectar amb Rebuts']) {
    const boto = screen.getByRole('button', { name: nom });
    expect([boto.getAttribute('aria-controls'), boto.getAttribute('aria-expanded')]).toEqual(['pols-rebuts', 'false']);
  }
  rerender(<Graella obert />);
  expect(screen.getByRole('button', { name: 'Connectar amb Rebuts' }).getAttribute('aria-expanded')).toBe('true');
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

test('Desplegable: <details> natiu, amb summary de fila i xebró decoratiu', () => {
  render(<Desplegable id="pols-rebuts" titol="Veure detall de rebuts"><p>taula</p></Desplegable>);
  const detall = document.getElementById('pols-rebuts');
  expect(detall.tagName).toBe('DETAILS');
  expect(detall.className).toBe('sdp-consola__detall');
  const cap = detall.querySelector('summary');
  expect(cap.className).toBe('sdp-consola__detall-cap');
  expect(cap.textContent).toBe('Veure detall de rebuts');
  expect(cap.querySelector('svg').getAttribute('aria-hidden')).toBe('true');
  expect(detall.querySelector('.sdp-consola__detall-cos').textContent).toBe('taula');
});

function GraellaAmbDesplegable({ obert }) {
  const graella = React.useRef(null);
  useTargetesQueObrin(graella, [{ controla: 'pols-consums', obert }, null]);
  return (
    <div className="sdp-card-grid" ref={graella}>
      <TargetaResum icona={Puzzle} titol="Consums" descripcio="3" onObri={() => {}} />
      <TargetaResum icona={Puzzle} titol="Rebuts" descripcio="0" onObri={() => {}} />
    </div>
  );
}

test('la targeta que obri un desplegable diu quin i si està obert', () => {
  const { rerender } = render(<GraellaAmbDesplegable obert={false} />);
  const consums = screen.getByRole('button', { name: 'Consums' });
  expect(consums.getAttribute('aria-controls')).toBe('pols-consums');
  expect(consums.getAttribute('aria-expanded')).toBe('false');
  // La que no obri cap desplegable no en diu res.
  expect(screen.getByRole('button', { name: 'Rebuts' }).hasAttribute('aria-expanded')).toBe(false);
  rerender(<GraellaAmbDesplegable obert />);
  expect(consums.getAttribute('aria-expanded')).toBe('true');
});

test('tornaAlCim torna a dalt el primer contenidor desplaçat i res més', () => {
  const app = { scrollTop: 40, parentElement: null };
  const contingut = { scrollTop: 620, parentElement: app };
  const pagina = { scrollTop: 0, parentElement: contingut };
  expect(tornaAlCim({ parentElement: pagina })).toBe(contingut);
  expect(contingut.scrollTop).toBe(0);
  expect(app.scrollTop).toBe(40);                  // un sol contenidor per crida
  expect(tornaAlCim({ parentElement: pagina })).toBe(app);
  expect(app.scrollTop).toBe(0);
  expect(tornaAlCim({ parentElement: pagina })).toBeNull();
  expect(tornaAlCim(null)).toBeNull();
});
