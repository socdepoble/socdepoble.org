import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

/* T43 (ordre del Mestre, 260928) · el calaix «Amb qui actues?». */
vi.mock('../../../hooks/useResolvedAsset.js', () => ({ useResolvedAsset: () => '' }));
import { CalaixIdentitats } from './CalaixIdentitats.jsx';

afterEach(cleanup);

const IDENTITATS = [
  { tipus: 'persona', id: 'u-1', nom: 'Pepa Soler', avatar: null, rol: 'persona', activa: false },
  { tipus: 'entitat', id: 'o-1', nom: 'Forn de la Torre', avatar: null, rol: 'owner', activa: true },
  { tipus: 'entitat', id: 'o-2', nom: 'Colla', avatar: null, rol: 'admin', activa: false }
];

function pinta(props = {}) {
  const accions = { onTanca: vi.fn(), onTria: vi.fn(), onConnectar: vi.fn(), onFitxa: vi.fn() };
  const vista = render(<CalaixIdentitats obert identitats={IDENTITATS} {...accions} {...props} />);
  return { ...vista, ...accions };
}

test('títol i descripció, llista amb l’activa marcada (aria-current i «Activa») i els rols', () => {
  const { container } = pinta();
  const dialeg = screen.getByRole('dialog', { name: 'Amb qui actues?' });
  expect(dialeg.textContent).toContain('Tria amb quina identitat vols publicar i editar. Pots canviar quan vullgues.');
  const llista = within(dialeg).getByRole('list', { name: 'Identitats' });
  const botons = within(llista).getAllByRole('button');
  expect(botons.map((b) => b.getAttribute('aria-current'))).toEqual([null, 'true', null]);
  expect(botons[1].textContent).toContain('Activa');
  expect(botons[0].textContent).toContain('Persona');
  expect(botons[1].textContent).toContain('Propietari');
  expect(botons[2].textContent).toContain('Administra');
  expect(container.ownerDocument.querySelectorAll('dialog [style]')).toHaveLength(0);
});

test('triar una identitat la passa al pare; les accions del peu naveguen', () => {
  const { onTria, onConnectar, onFitxa } = pinta();
  fireEvent.click(screen.getByRole('button', { name: /Colla/ }));
  expect(onTria).toHaveBeenCalledWith('entitat', 'o-2');
  fireEvent.click(screen.getByRole('button', { name: 'Connectar-me a una organització' }));
  fireEvent.click(screen.getByRole('button', { name: 'La meua fitxa i ajustos' }));
  expect(onConnectar).toHaveBeenCalledTimes(1);
  expect(onFitxa).toHaveBeenCalledTimes(1);
});

test('tancat, no es mostra; el botó de tancar avisa el pare', () => {
  const { onTanca, unmount } = pinta();
  fireEvent.click(screen.getByRole('button', { name: 'Tancar' }));
  expect(onTanca).toHaveBeenCalledWith('boto');
  unmount();
  pinta({ obert: false });
  expect(screen.queryByRole('dialog')).toBeNull();
});

/* O4-CLAUDE-1b (IDEA-63, ordre del Mestre, captura 261102_2149) · En mòbil,
   «Amb qui actues?» xafava la capçalera i tapava la barra negra (inset 0 i
   100dvh). Ara és un calaix de la dreta del Dialeg i naix davall de la
   barra, amb el mateix càlcul que l'Índex de continguts: el token
   --sdp-calaix-dalt, que val l'alçada de header.bar-black. jsdom no
   maqueta: es comproven les classes que pinta i el text dels fulls. */
const BARRA_NEGRA = 'calc(var(--sdp-alt-negra) + env(safe-area-inset-top, 0px))';
const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
/** Les declaracions [propietat, valor] de totes les regles amb el selector exacte `selector`. */
function declaracions(css, selector) {
  const escapat = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [...css.matchAll(new RegExp(`(?:^|[}\\s])${escapat}\\s*\\{([^{}]*)\\}`, 'g'))]
    .flatMap((m) => m[1].split(';').map((d) => d.trim()).filter((d) => d.includes(':'))
      .map((d) => [d.slice(0, d.indexOf(':')).trim(), d.slice(d.indexOf(':') + 1).trim().replace(/\s+/g, ' ')]));
}
const valor = (css, selector, propietat) => declaracions(css, selector).filter(([p]) => p === propietat).map(([, v]) => v);
/** La declaració d'un token tal com s'escriu a tokens.css (el nom a banda: tractor-tokens, T3). */
const declaracioDeToken = (nom, valorDelToken) => `${nom}: ${valorDelToken};`;

test('O4-CLAUDE-1b · «Amb qui actues?» és un calaix de la dreta: classes compartides, fora de la barra negra, cos amb scroll i peu', () => {
  pinta();
  const dialeg = screen.getByRole('dialog', { name: 'Amb qui actues?' });
  expect([...dialeg.classList]).toEqual(expect.arrayContaining(['sdp-dialeg', 'sdp-dialeg--calaix', 'sdp-dialeg--dreta']));
  // Mai dins del header: heretaria el crom fosc (i la prova del dalt seria la del header, no la del calaix).
  expect(dialeg.closest('header')).toBeNull();
  expect(dialeg.closest('.sdp-capa-modal')).toBeNull();
  expect(dialeg.getAttribute('style')).toBeNull();
  const cos = dialeg.querySelector(':scope > .sdp-dialeg__marc > .sdp-dialeg__cos');
  expect(within(cos).getByRole('list', { name: 'Identitats' })).toBeTruthy();
  const peu = dialeg.querySelector(':scope > .sdp-dialeg__marc > footer.sdp-dialeg__peu');
  expect(within(peu).getAllByRole('button').map((b) => b.textContent)).toEqual(['Connectar-me a una organització', 'La meua fitxa i ajustos']);
});

test('O4-CLAUDE-1b · el calaix i el seu vel naixen just on acaba la barra negra, amb el token compartit amb l’Índex', () => {
  const tokens = llig('src/css/tokens.css');
  const components = llig('src/css/components.css');
  // El token val l'alçada de la barra negra (layout.css)…
  expect(tokens).toContain(declaracioDeToken('--sdp-calaix-dalt', BARRA_NEGRA));
  expect(llig('src/css/layout.css').replace(/\s+/g, ' ')).toContain(`header.bar-black { box-sizing: border-box; height: ${BARRA_NEGRA}; min-height: ${BARRA_NEGRA};`);
  // …i el calaix, el seu vel i l'Índex de continguts comencen en ell. El vel
  // (B1b-02) ocupa tota la pantalla però és transparent fins al token: no
  // enfosquix la barra, i un toc damunt d'ella tanca el calaix.
  expect(valor(components, '.sdp-dialeg--calaix', 'top')).toEqual(['var(--sdp-calaix-dalt)']);
  expect(valor(components, '.sdp-dialeg--calaix::backdrop', 'background')).toEqual([
    'linear-gradient(to bottom, transparent var(--sdp-calaix-dalt), var(--sdp-fons-vel) var(--sdp-calaix-dalt))'
  ]);
  expect(valor(components, '.sdp-dialeg--calaix::backdrop', 'top')).toEqual([]);
  expect(valor(llig('src/css/modules.css'), '.toc-overlay', 'top')).toEqual(['var(--sdp-calaix-dalt)']);
  // L'alçada, la resta de la pantalla: mai 100dvh sencer.
  expect(valor(components, '.sdp-dialeg--calaix', 'height')).toEqual(['var(--sdp-calaix-alt)']);
  expect(valor(components, '.sdp-dialeg--calaix', 'max-height')).toEqual(['var(--sdp-calaix-alt)']);
  expect(tokens).toContain(declaracioDeToken('--sdp-calaix-alt', 'calc(100vh - var(--sdp-calaix-dalt))'));
  expect(tokens).toContain(declaracioDeToken('--sdp-calaix-alt', 'calc(100dvh - var(--sdp-calaix-dalt))'));
  // A la dreta, sense tornar el dalt a 0 (cap inset sencer).
  expect(valor(components, '.sdp-dialeg--dreta', 'right')).toEqual(['0']);
  expect(valor(components, '.sdp-dialeg--dreta', 'inset')).toEqual([]);
  // Els botons del peu, damunt de la zona segura de baix (la barra d'inici).
  expect(valor(components, '.sdp-dialeg--calaix .sdp-dialeg__peu', 'padding-bottom'))
    .toEqual(['calc(var(--sdp-space-4) + env(safe-area-inset-bottom, 0px))']);
});

/* O4-CLAUDE-1b · B1b-02 (àrbitre) · Amb el calaix obert el document és inert:
   tocar la barra (l'avatar que l'ha obert, el gest natural per a tancar) cau
   al vel, que arriba al <dialog> mateix, i el calaix es tanca amb 'vel'. */
test('O4-CLAUDE-1b · B1b-02 · un toc al vel (també damunt de la barra negra) tanca «Amb qui actues?» amb el motiu vel', () => {
  const { onTanca } = pinta();
  fireEvent.click(screen.getByRole('dialog', { name: 'Amb qui actues?' }));
  expect(onTanca).toHaveBeenCalledTimes(1);
  expect(onTanca).toHaveBeenCalledWith('vel');
});
