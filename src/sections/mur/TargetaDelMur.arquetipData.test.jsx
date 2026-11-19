/**
 * P0-77 / IDEA-208 (R16-P; ordre del Mestre, 261109 20:57) · La data de cada
 * targeta del Mur segons l'arquetip (arquetipDeData.js):
 *  · un avís efímer (busco gos, una alerta municipal): un <time> informatiu,
 *    sense clic, i Comentar (el xat) i Compartir al peu;
 *  · una publicació de sempre: la pastilla cap al MES del Calendari, com
 *    abans (TargetaDelMur.ambit.test.jsx en guarda el HTML lletra a lletra);
 *  · un acte: la pastilla porta al DIA de l'acte i no obri la targeta
 *    (stopPropagation); dins del Calendari, reemplaça l'historial.
 * Patró de TargetaDelMur.ambit.test.jsx (router, avisos i i18n substituïts).
 */
import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa }),
  useUIState: () => ({ externalConfig: {} })
}));

import { TargetaDelMur } from './TargetaDelMur.jsx';
import { acteAEsdeveniment } from './agendaMur.js';
import { DinsDelCalendari } from '../../components/universal/barres/pastillaCalendari.js';

const CREAT = '2026-11-02T10:00:00.000Z';
const BUSCO = { id: 'b1', type: 'post', title: 'Busco gos', labels: ['Busco'], description: 'Un gos negre', created_at: CREAT, author_name: 'Maria' };
const POST = { id: 'p1', type: 'feed', title: 'La fira', subtitle: 'Diumenge', description: 'Entradeta', labels: ['feed'], created_at: CREAT, author_name: 'Maria' };
const GOS_PERDUT = { id: 'g1', type: 'animalets', ambit: 'animalets', estat: 'actiu', title: 'Gos negre perdut', dades: { modalitat: 'perdut', especie: 'gos' }, created_at: CREAT, author_name: 'Maria' };
const ACTE = { id: 'concert', type: 'event', title: 'Concert', date: '2026-10-01', time: '19:00', entradilla: 'Entradilla', author_name: 'Sóc de Poble', author_location: 'La Torre de les Maçanes' };

const pinta = (element) => render(element).container.querySelector('article');
const pastilla = (article) => article.querySelector('.sp-card-meta .btn-date-time');

afterEach(cleanup);
beforeEach(() => { mocks.navigate.mockClear(); });

describe('un avís efímer: la data informa, no navega', () => {
  test('«Busco gos»: un <time datetime>, cap botó, i Comentar i Compartir al peu', () => {
    const article = pinta(<TargetaDelMur item={BUSCO} />);
    const data = pastilla(article);
    expect(data.tagName).toBe('TIME');
    expect(data.getAttribute('datetime')).toBeTruthy();
    expect(article.querySelector('.sp-card-meta button.btn-date-time')).toBeNull();
    expect(article.querySelector('button[aria-label="Comentar Busco gos"]')).not.toBeNull();
    expect(article.querySelector('button[aria-label="Compartir Busco gos"]')).not.toBeNull();
    fireEvent.click(data);
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  test('una fitxa d’Animalets d’animal perdut (dades.modalitat): un <time>, cap botó', () => {
    const article = pinta(<TargetaDelMur item={GOS_PERDUT} />);
    const data = pastilla(article);
    expect(data.tagName).toBe('TIME');
    expect(article.querySelector('.sp-card-meta button.btn-date-time')).toBeNull();
    expect(article.querySelector('button[aria-label="Comentar Gos negre perdut"]')).not.toBeNull();
    expect(article.querySelector('button[aria-label="Compartir Gos negre perdut"]')).not.toBeNull();
    fireEvent.click(data);
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  test('una publicació sense etiqueta d’avís, si és alerta municipal, tampoc porta botó', () => {
    const article = pinta(<TargetaDelMur item={POST} alertaMunicipal="alerta" />);
    expect(pastilla(article).tagName).toBe('TIME');
    expect(article.querySelector('.sp-card-meta button.btn-date-time')).toBeNull();
  });
});

describe('una publicació de sempre: la pastilla al mes, com abans', () => {
  test('botó «… · Obri el calendari d’eixe mes» cap a /calendari?mes=AAAA-MM', () => {
    const article = pinta(<TargetaDelMur item={POST} />);
    const boto = pastilla(article);
    expect(boto.tagName).toBe('BUTTON');
    expect(boto.getAttribute('aria-label')).toBe('11:00 02/11/26 · Obri el calendari d’eixe mes');
    fireEvent.click(boto);
    expect(mocks.navigate).toHaveBeenCalledWith('/calendari?mes=2026-11');
  });
});

describe('un acte: la pastilla porta al seu dia', () => {
  test('clic → /calendari?vista=mes&date=AAAA-MM-DD, sense obrir la targeta', () => {
    const pare = vi.fn();
    const article = pinta(
      <div onClick={pare}>
        <TargetaDelMur item={ACTE} esdeveniment={acteAEsdeveniment(ACTE)} />
      </div>
    );
    const boto = pastilla(article);
    expect(boto.tagName).toBe('BUTTON');
    expect(boto.getAttribute('aria-label')).toBe('19:00 01/10/26 · Obri el calendari d’eixe dia');
    fireEvent.click(boto);
    expect(mocks.navigate).toHaveBeenCalledTimes(1);
    expect(mocks.navigate).toHaveBeenCalledWith('/calendari?vista=mes&date=2026-10-01');
    expect(pare).not.toHaveBeenCalled();
  });

  test('dins del Calendari, el clic reemplaça l’entrada de l’historial', () => {
    const article = pinta(
      <DinsDelCalendari.Provider value>
        <TargetaDelMur item={ACTE} esdeveniment={acteAEsdeveniment(ACTE)} />
      </DinsDelCalendari.Provider>
    );
    fireEvent.click(pastilla(article));
    expect(mocks.navigate).toHaveBeenCalledWith('/calendari?vista=mes&date=2026-10-01', { replace: true });
  });

  test('sense model d’acte, o amb la data de publicació a la boina, la pastilla de sempre (al mes)', () => {
    const sensModel = pinta(<TargetaDelMur item={ACTE} />);
    expect(pastilla(sensModel).getAttribute('aria-label')).toMatch(/ · Obri el calendari d’eixe mes$/);
    cleanup();
    const ambPublicacio = { ...ACTE, boinaDataPublicacio: true, created_at: CREAT };
    const article = pinta(<TargetaDelMur item={ambPublicacio} esdeveniment={acteAEsdeveniment(ambPublicacio)} />);
    const boto = pastilla(article);
    expect(boto.getAttribute('aria-label')).toBe('11:00 02/11/26 · Obri el calendari d’eixe mes');
    fireEvent.click(boto);
    expect(mocks.navigate).toHaveBeenCalledWith('/calendari?mes=2026-11');
  });
});
