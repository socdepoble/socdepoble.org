/* Gestoria · Tauler · TargetaTauler: la UniversalCard del Tauler (ordre del
   Mestre, 261004, regla d'or 1; guardes de GESTORIA_REFERENCIA.txt). Boina
   personal enllaçada a la pàgina del titular, xifra amagada per defecte i
   fora del DOM fins a prémer l'ull, sense Compartir ni Comentar, tota la
   targeta clicable, Traduir que només avisa i cap style=. Dades sintètiques:
   un titular i una població inventats. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../../app/contexts/RouterContext';
import { AVIS_XIFRES_SENSE_TRADUCCIO, TargetaTauler, UllPrivacitat } from './TargetaTauler.jsx';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const TITULAR = Object.freeze({ nom: 'Taller de Prova', poble: 'Poble de Prova', avatar: null, href: '/el-meu-perfil' });
const PASTILLA = Object.freeze({ time: '08:00', date: '04/10/26', dateTime: '2026-10-04T08:00' });
const CAIXA = Object.freeze({
  id: 'caixa', bloc: 'realitat', icona: 'wallet', titol: 'Caixa real', subtitol: 'El saldo disponible als teus comptes',
  entradeta: 'La suma dels saldos en euros dels teus comptes l’últim dia dels extractes.',
  xifra: Object.freeze({ tipus: 'import', valor: 1234567, moneda: 'EUR' }), senseXifra: 'Sense dades.',
  etiquetes: [{ text: 'Banc', className: 'sdp-badge-system' }], detall: [], notes: [], font: 'Els extractes.'
});
const XIFRA = '12.345,67 €';

function Ubicacio() {
  const { pathname, search } = useLocation();
  return <output data-testid="ubicacio">{`${pathname}${search ? `?${search}` : ''}`}</output>;
}

function pinta(props = {}) {
  const onObri = vi.fn();
  const onAvis = vi.fn();
  const { container } = render(
    <MemoryRouter rutaInicial="/app/gestoria/tauler">
      <TargetaTauler targeta={CAIXA} titular={TITULAR} pastilla={PASTILLA} onObri={onObri} onAvis={onAvis} {...props} />
      <Ubicacio />
    </MemoryRouter>
  );
  return { targeta: container.querySelector('article.sp-card'), onObri, onAvis };
}

/* Tot el que porta el DOM de la targeta, atributs inclosos. */
const serialitzat = (node) => new XMLSerializer().serializeToString(node);

describe('la boina personal', () => {
  test('l’autor és el titular, enllaçat a la seua pàgina, amb la seua població i la data de la lectura', () => {
    const { targeta } = pinta();
    const autor = targeta.querySelector('header.sp-card-header a.sp-card-author-link');
    expect(autor.getAttribute('href')).toBe('/el-meu-perfil');
    expect(autor.querySelector('.sp-card-author-name').textContent).toBe('Taller de Prova');
    expect(autor.querySelector('.sp-card-author-location').textContent).toBe('Poble de Prova');
    const pastilla = targeta.querySelector('header .btn-date-time');
    expect(pastilla.tagName).toBe('TIME');
    expect(pastilla.getAttribute('datetime')).toBe('2026-10-04T08:00');
    expect(targeta.querySelector('header .sdp-gestoria-ull')).not.toBeNull();
  });
});

describe('la xifra', () => {
  test('amagada per defecte: «Import amagat» i cap xifra al DOM, ni als atributs, fins a prémer l’ull', () => {
    const { targeta } = pinta();
    const ull = screen.getByRole('button', { name: 'Mostra la xifra de Caixa real' });
    expect(ull.getAttribute('aria-pressed')).toBe('false');
    expect(targeta.querySelector('.sp-card-calendar-badge').textContent).toBe('Import amagat');
    expect(serialitzat(targeta)).not.toMatch(/12\.345|1234567|12345,67/);
    fireEvent.click(ull);
    expect(ull.getAttribute('aria-pressed')).toBe('true');
    const quadrat = targeta.querySelector('.sp-card-calendar-badge');
    expect(quadrat.textContent).toBe(XIFRA);
    expect(quadrat.getAttribute('aria-label')).toBe(`Caixa real: ${XIFRA}`);
    fireEvent.click(ull);
    expect(serialitzat(targeta)).not.toMatch(/12\.345/);
  });

  test('l’ull de la closca la pot portar ja mostrada (visibleInicial)', () => {
    const { targeta } = pinta({ visibleInicial: true });
    expect(screen.getByRole('button', { name: 'Mostra la xifra de Caixa real' }).getAttribute('aria-pressed')).toBe('true');
    expect(targeta.querySelector('.sp-card-calendar-badge').textContent).toBe(XIFRA);
  });

  test('els mesos de la cobertura porten la unitat al nom accessible; un recompte amagat és «Xifra amagada»', () => {
    const { targeta } = pinta({
      targeta: { ...CAIXA, id: 'cobertura', titol: 'Cobertura', xifra: { tipus: 'mesos', valor: 6.3 } }, visibleInicial: true
    });
    expect(targeta.querySelector('.sp-card-calendar-badge').getAttribute('aria-label')).toBe('Cobertura: 6,3 mesos');
    cleanup();
    const recompte = pinta({ targeta: { ...CAIXA, id: 'factures', titol: 'Factures i vendes', xifra: { tipus: 'recompte', valor: 7 } } });
    expect(recompte.targeta.querySelector('.sp-card-calendar-badge').textContent).toBe('Xifra amagada');
  });

  test('sense xifra: cap ull, la icona al quadrat i el perquè al cos', () => {
    const { targeta } = pinta({ targeta: { ...CAIXA, xifra: null, senseXifra: 'Sense dades: encara no has triat cap extracte del banc.' } });
    expect(targeta.querySelector('.sdp-gestoria-ull')).toBeNull();
    expect(targeta.querySelector('.sp-card-calendar-badge').getAttribute('aria-label')).toBe('Caixa real');
    expect(targeta.querySelector('.sp-card-text').textContent).toContain('Sense dades: encara no has triat cap extracte del banc.');
  });
});

describe('el cos i el peu', () => {
  test('títol, subtítol, entradeta i etiquetes; al peu només Traduir i Connectar (ni Compartir ni Comentar)', () => {
    const { targeta } = pinta();
    expect(targeta.querySelector('.sp-card-title').textContent).toBe('Caixa real');
    expect(targeta.querySelector('.sp-card-subtitle').textContent).toBe('El saldo disponible als teus comptes');
    expect(targeta.querySelector('.sp-card-text').textContent).toContain('La suma dels saldos en euros');
    expect([...targeta.querySelectorAll('.sp-card-label')].map((e) => e.textContent)).toEqual(['Banc']);
    expect([...targeta.querySelectorAll('footer.sp-card-footer button')].map((b) => b.getAttribute('aria-label')))
      .toEqual(['Traduir Caixa real', 'Connectar amb Caixa real']);
  });

  test('tota la targeta és clicable cap a la seua pàgina; Connectar porta al mateix lloc', () => {
    const { targeta, onObri } = pinta();
    const principal = targeta.querySelector('.sp-card-link-overlay');
    expect(principal.tagName).toBe('BUTTON');
    expect(principal.getAttribute('aria-label')).toBe('Caixa real');
    fireEvent.click(principal);
    fireEvent.click(screen.getByRole('button', { name: 'Connectar amb Caixa real' }));
    expect(onObri.mock.calls).toEqual([['caixa'], ['caixa']]);
    /* La targeta viu a la closca de l'app /app/gestoria (ordre del Mestre, 261004): obrir-la no toca la URL. */
    expect(screen.getByTestId('ubicacio').textContent).toBe('/app/gestoria/tauler');
  });

  test('Traduir avisa i no envia res: cap xifra cap al servei de traducció', () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const { onAvis } = pinta();
    fireEvent.click(screen.getByRole('button', { name: 'Traduir Caixa real' }));
    expect(onAvis).toHaveBeenCalledWith(AVIS_XIFRES_SENSE_TRADUCCIO);
    expect(fetch).not.toHaveBeenCalled();
    expect(screen.getByTestId('ubicacio').textContent).not.toMatch(/traduccions/);
    vi.unstubAllGlobals();
  });
});

describe('Pedra Seca', () => {
  test('cap style= ni al codi ni al DOM', () => {
    const codi = readFileSync(path.join(process.cwd(), 'src/sections/gestoria/tauler/TargetaTauler.jsx'), 'utf8');
    expect(codi).not.toMatch(/\sstyle=/);
    const { targeta } = pinta({ visibleInicial: true });
    expect(targeta.querySelectorAll('[style]')).toHaveLength(0);
  });

  test('l’ull: un botó amb aria-pressed, el nom que no canvia i una diana de la mida tàctil', () => {
    const onCommuta = vi.fn();
    const { rerender } = render(<UllPrivacitat visible={false} onCommuta={onCommuta} />);
    const ull = screen.getByRole('button', { name: 'Mostra les xifres' });
    expect(ull.getAttribute('aria-pressed')).toBe('false');
    expect(ull.className).toBe('sdp-gestoria-ull');
    fireEvent.click(ull);
    expect(onCommuta).toHaveBeenCalledTimes(1);
    rerender(<UllPrivacitat visible onCommuta={onCommuta} />);
    expect(screen.getByRole('button', { name: 'Mostra les xifres' }).getAttribute('aria-pressed')).toBe('true');
    const css = readFileSync(path.join(process.cwd(), 'src/css/modules.css'), 'utf8');
    expect(css).toMatch(/\.sdp-gestoria-ull \{[^}]*min-width: var\(--sdp-touch\);[^}]*min-height: var\(--sdp-touch\);/);
  });
});
