/* Correcció T7C-R3 · Una sola composició per al contingut de fora: la regla
   D1 (contingutExtern.reglaDEntrada), els textos de cada porta i la paritat
   amb la còpia que encara viu a /connectar (ConnectarContingutExtern). Si
   les dues divergixen, esta prova ho diu: la sinergia pendent és que
   /connectar munte PrevisualitzacioExtern. Dades sintètiques. */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext';
import { contingutExternDeParams, reglaDEntrada } from '../connectar/contingutExtern.js';
import { NOM_CARPETA_CONNECTATS } from './carpetes.js';

const dades = vi.hoisted(() => ({
  usuari: { id: 'usuari-sintetic' },
  config: { dataMode: 'seed' },
  canCreate: true,
  noop: () => {},
  t: (_clau, perDefecte) => perDefecte
}));

vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: dades.noop }) }));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => ({ currentUser: dades.usuari }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: dades.t }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actor: null, memberships: [] }) }));
vi.mock('./NotesDataContext', () => ({
  useNotesData: () => ({
    creaNota: dades.noop, canCreate: dades.canCreate, config: dades.config, status: 'ready', error: null, refresh: dades.noop
  })
}));
vi.mock('../xat/XatContext.jsx', () => ({ useXat: () => ({}) }));
vi.mock('../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} })
}));

import ConnectarSection from '../connectar/ConnectarSection.jsx';
import { PrevisualitzacioExtern } from './PrevisualitzacioExtern.jsx';

const URL_PROVA = 'https://exemple.org/article';
const CONSULTA = `url=${encodeURIComponent(URL_PROVA)}&titol=Un+article&entradilla=Un+resum`;
const contingutDe = (consulta) => contingutExternDeParams(new URLSearchParams(consulta));

beforeEach(() => {
  dades.usuari = { id: 'usuari-sintetic' };
  dades.config = { dataMode: 'seed' };
  dades.canCreate = true;
});
afterEach(() => cleanup());

describe('reglaDEntrada (D1)', () => {
  test('sense sessió, en llavor i en local es desa al dispositiu; amb el Bloc sense obrir, s’espera', () => {
    for (const dataMode of ['seed', 'local']) {
      expect(reglaDEntrada({ teSessio: false, config: { dataMode }, canCreate: true })).toEqual({ modeDades: dataMode, calEntrar: false, potCrear: true });
      expect(reglaDEntrada({ teSessio: false, config: { dataMode }, canCreate: false }).potCrear).toBe(false);
    }
  });

  test('en remot, sense sessió cal entrar i no es pot crear; amb sessió, sí', () => {
    expect(reglaDEntrada({ teSessio: false, config: { dataMode: 'remote' }, canCreate: true })).toEqual({ modeDades: 'remote', calEntrar: true, potCrear: false });
    expect(reglaDEntrada({ teSessio: true, config: { dataMode: 'remote' }, canCreate: true })).toEqual({ modeDades: 'remote', calEntrar: false, potCrear: true });
  });

  test('sense configuració, el mode resolt és el remot: cal entrar', () => {
    expect(reglaDEntrada({ teSessio: false })).toEqual({ modeDades: 'remote', calEntrar: true, potCrear: false });
  });
});

const pinta = (props) => render(
  <MemoryRouter rutaInicial="/notes">
    <PrevisualitzacioExtern verb="desar" participi="desat" nota="Nota de prova." {...props} />
  </MemoryRouter>
);

describe('PrevisualitzacioExtern', () => {
  test('sense cap adreça: ho diu, i no hi ha tria, ni peu, ni botó', () => {
    const { container } = pinta({ contingut: null, teSessio: true, children: <p>Tria</p> });
    expect(screen.getByText('No ha arribat cap enllaç per a desar.')).toBeTruthy();
    expect(screen.queryByText('Tria')).toBeNull();
    expect(container.querySelector('.sdp-connectar__peu')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  test('una adreça que no val: el motiu amb el verb de la porta, sense tria ni botó', () => {
    pinta({ contingut: contingutDe('url=javascript%3Aalert(1)'), teSessio: true, children: <p>Tria</p> });
    expect(screen.getByText('Este enllaç no es pot desar.')).toBeTruthy();
    /* El títol de l'Alerta dels motius, sense punt. */
    expect(screen.getByText('Este enllaç no es pot desar')).toBeTruthy();
    expect(screen.getByText(/http o https/)).toBeTruthy();
    expect(screen.queryByText('Tria')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  test('una adreça vàlida: la targeta, la tria entre els motius i el peu, el botó i la nota', () => {
    const onClick = vi.fn();
    const { container } = pinta({
      contingut: contingutDe(CONSULTA), teSessio: true, children: <p className="tria-de-prova">Tria</p>,
      boto: { etiqueta: 'Desar ací', onClick }
    });
    expect(container.querySelector('.sdp-connectar__previsualitzacio .sp-card').textContent).toContain('Un article');
    expect(screen.getByText('De exemple.org')).toBeTruthy();
    expect(screen.getByText(URL_PROVA)).toBeTruthy();
    /* L'ordre: objecte, tria i peu. */
    const fills = [...container.querySelector('.sdp-connectar').children].map((el) => el.className);
    expect(fills).toEqual(['sdp-connectar__objecte', 'tria-de-prova', 'sdp-connectar__peu']);
    const boto = screen.getByRole('button', { name: 'Desar ací' });
    expect([boto.classList.contains('sdp-boto--gran'), boto.classList.contains('sdp-boto--ple')]).toEqual([false, false]);
    boto.click();
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Nota de prova.')).toBeTruthy();
  });

  test('el botó de bancal (`gran`) és el de /connectar: mida gran i ple', () => {
    pinta({ contingut: contingutDe(CONSULTA), teSessio: true, boto: { etiqueta: 'Connectar', gran: true } });
    const boto = screen.getByRole('button', { name: 'Connectar' });
    expect([boto.classList.contains('sdp-boto--gran'), boto.classList.contains('sdp-boto--ple')]).toEqual([true, true]);
  });

  test('sense sessió: on es queda l’enllaç, o que cal entrar (amb l’avís propi de la porta si en porta)', () => {
    pinta({ contingut: contingutDe(CONSULTA), teSessio: false, calEntrar: false });
    expect(screen.getByText('Sense sessió, l’enllaç es queda només en este dispositiu.')).toBeTruthy();
    cleanup();
    pinta({ contingut: contingutDe(CONSULTA), teSessio: false, calEntrar: true });
    expect(screen.getByText('Per a desar cal entrar al teu compte.')).toBeTruthy();
    cleanup();
    pinta({ contingut: contingutDe(CONSULTA), teSessio: false, calEntrar: true, avisEntrar: 'Avís propi.' });
    expect(screen.getByText('Avís propi.')).toBeTruthy();
  });

  test('l’error de desar va al peu, amb el participi de la porta', () => {
    pinta({ contingut: contingutDe(CONSULTA), teSessio: true, error: 'Motiu de prova.', boto: { etiqueta: 'Desar' } });
    expect(screen.getByText('L’enllaç no s’ha desat')).toBeTruthy();
    expect(screen.getByText('Motiu de prova.')).toBeTruthy();
  });
});

/* Els id de useId canvien d'un arbre a l'altre: es comparen amb un marcador. */
const senseIds = (html) => html.replace(/\s(id|aria-labelledby|aria-describedby|aria-controls|for)="[^"]*"/g, ' $1="ID"');

describe('paritat amb /connectar?url= (la còpia que queda a ConnectarContingutExtern)', () => {
  const connectar = () => {
    const { container } = render(
      <MemoryRouter rutaInicial={`/connectar?${CONSULTA}`}>
        <ConnectarSection />
      </MemoryRouter>
    );
    const html = senseIds(container.querySelector('.sdp-connectar').outerHTML);
    cleanup();
    return html;
  };
  const compartida = (teSessio) => {
    const { container } = render(
      <MemoryRouter rutaInicial="/connectar">
        <PrevisualitzacioExtern
          contingut={contingutDe(CONSULTA)}
          teSessio={teSessio}
          calEntrar={false}
          verb="connectar"
          participi="connectat"
          boto={{ etiqueta: `Connectar a «${NOM_CARPETA_CONNECTATS}»`, gran: true, onClick: dades.noop }}
          nota={`Arriba com una nota nova a «${NOM_CARPETA_CONNECTATS}», que podràs editar. La imatge de l’altra web no es copia.`}
        />
      </MemoryRouter>
    );
    const html = senseIds(container.querySelector('.sdp-connectar').outerHTML);
    cleanup();
    return html;
  };

  test('amb sessió, el mateix DOM', () => {
    const html = connectar();
    /* Sonda: és la vista del contingut de fora, amb targeta, peu i botó de bancal. */
    for (const tros of ['sdp-connectar__previsualitzacio', 'Un article', 'Un resum', 'De exemple.org', 'sdp-boto--gran', 'sdp-connectar__nota']) {
      expect(html).toContain(tros);
    }
    expect(html).not.toContain('Mode Foraster actiu');
    expect(compartida(true)).toBe(html);
  });

  test('sense sessió en llavor, el mateix DOM (amb l’avís del Mode Foraster)', () => {
    dades.usuari = null;
    const html = connectar();
    expect(html).toContain('Mode Foraster actiu');
    expect(compartida(false)).toBe(html);
  });
});
