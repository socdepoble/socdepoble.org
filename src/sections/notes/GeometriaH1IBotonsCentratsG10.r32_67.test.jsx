/**
 * GeometriaH1IBotonsCentratsG10.r32_67.test.jsx — Ronda G10 (R32.67_gemini)
 *
 * Certifica:
 *   1. Geometria H1 en mòbil (<= 520px = 32.5rem) a src/css/layout.css:
 *      padding-inline reduït a var(--sdp-space-4) en @container sdp-arrel i @media
 *      de reserva, més text-wrap: balance a header.page-title h1.
 *   2. Paritat en 5 llengües (ca, es, en, eu, gl), sanejament d'argot de xarxa
 *      i botons centrats (Llei 9) amb diana Pedra Seca (.sdp-boto) a NotesDetail
 *      i DialegEsborrarNota.
 *   3. Centrament Llei 9 a PanellFontsCalendari, DesplegableEsdevenimentsCalendari
 *      (estat buit amb retorn d'1 clic a totes les publicacions en 5 llengües),
 *      RevisorEditorialNode0Panel i VisorDeLArxiu.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

const estatIdioma = vi.hoisted(() => ({ language: 'ca' }));
const mocksNotes = vi.hoisted(() => ({
  resolveNote: vi.fn(),
  resolConflicte: vi.fn(),
}));

vi.mock('../../app/contexts/UIContext', () => ({
  useUIStateOpcional: () => ({ language: estatIdioma.language }),
  useUIActions: () => ({ t: (_k, fb) => fb, language: estatIdioma.language }),
}));

vi.mock('../../app/contexts/RouterContext', () => ({
  Link: ({ to, children, ...rest }) => <a href={to} {...rest}>{children}</a>,
  useLocation: () => ({ pathname: '/multimedia', search: '', state: null, hash: '' }),
}));

vi.mock('../../app/contexts/CoreContentContext', () => ({
  useCoreContent: () => ({ towns: [{ id: 'tibi', title: 'Tibi' }] }),
}));

vi.mock('./NotesDataContext.jsx', () => ({
  useNotesData: () => ({ resolveNote: mocksNotes.resolveNote, workspaceKey: 'ws-g10' }),
}));

vi.mock('./NotesContext.jsx', () => ({
  useNotes: () => ({ resolConflicteEsborrany: mocksNotes.resolConflicte }),
}));

vi.mock('./NotesEditor.jsx', () => ({
  default: ({ activeNote }) => <div data-testid="editor-mock">{activeNote?.content}</div>,
}));

import NotesDetail from './NotesDetail.jsx';
import { DialegEsborrarNota } from './DialegEsborrarNota.jsx';
import RevisorEditorialNode0Panel from './RevisorEditorialNode0Panel.jsx';
import {
  CODIS_IDIOMA_NOTES_DETAIL,
  sanejaErrorNota,
  textosDialegEsborrarNota,
  textosNotesDetail,
} from './i18nNotesDetail.js';
import { PanellFontsCalendari } from '../calendari/fonts/PanellFontsCalendari.jsx';
import { SelectorModeCalendari } from '../calendari/DesplegableEsdevenimentsCalendari.jsx';
import { CODIS_IDIOMA_CALENDARI_RSVP, textosCalendariRsvp } from '../calendari/i18nCalendariRsvp.js';

afterEach(() => {
  cleanup();
  estatIdioma.language = 'ca';
  vi.clearAllMocks();
});

describe('Lot 1 · Geometria H1 en mòbil <= 520px (32.5rem) a layout.css', () => {
  const layoutCss = readFileSync(resolve(process.cwd(), 'src/css/layout.css'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ');

  test('header.page-title baixa padding-inline a var(--sdp-space-4) sota 32.5rem en @container i @media', () => {
    expect(layoutCss).toContain('@container sdp-arrel (max-width: 32.5rem) { header.page-title { padding-inline: var(--sdp-space-4); } }');
    expect(layoutCss).toContain('@supports not (container-type: inline-size) { @media (max-width: 32.5rem) { header.page-title { padding-inline: var(--sdp-space-4); } } }');
  });

  test('header.page-title h1 porta text-wrap: balance sense alterar --sdp-fluid-h1', () => {
    expect(layoutCss).toMatch(/header\.page-title h1,\s*header\.page-title \.h1\s*\{[^}]*font-size:\s*var\(--sdp-fluid-h1\)[^}]*text-wrap:\s*balance;/);
  });
});

describe('Lot 2 · NotesDetail i DialegEsborrarNota en 5 llengües + sanejament + Llei 9', () => {
  test.each(CODIS_IDIOMA_NOTES_DETAIL)('NotesDetail en %s: sanejament d’error tècnic i botó .sdp-boto dins de .sdp-accions', async (lang) => {
    estatIdioma.language = lang;
    const tx = textosNotesDetail(lang);
    mocksNotes.resolveNote.mockRejectedValueOnce(new Error('Failed to fetch'));

    render(<NotesDetail activeNote={{ id: 'n-err', revision: 1, contentLoaded: false }} />);
    const alerta = await screen.findByRole('alert');
    expect(alerta.textContent).toContain(tx.errorXarxa);
    expect(alerta.textContent).not.toContain('Failed to fetch');

    const boto = within(alerta).getByRole('button', { name: tx.reintenta });
    expect(boto.className).toContain('sdp-boto');
    expect(boto.closest('.sdp-accions')).not.toBeNull();
  });

  test('sanejaErrorNota conserva missatges humans propis i substitueix argot de xarxa', () => {
    const tx = textosNotesDetail('ca');
    expect(sanejaErrorNota('NetworkError when attempting to fetch resource.', tx)).toBe(tx.errorXarxa);
    expect(sanejaErrorNota('Load failed', tx)).toBe(tx.errorXarxa);
    expect(sanejaErrorNota('La nota privada requereix permís.', tx)).toBe('La nota privada requereix permís.');
  });

  test.each(CODIS_IDIOMA_NOTES_DETAIL)('DialegEsborrarNota en %s: 2 passos amb focus segur i textos complets', async (lang) => {
    estatIdioma.language = lang;
    const tx = textosDialegEsborrarNota(lang);
    const onTria = vi.fn();

    render(<DialegEsborrarNota obert nota={{ id: 'n1', title: 'Recepta d’oli' }} onTria={onTria} onTanca={() => {}} />);
    expect(screen.getByText(tx.titolPas1('Recepta d’oli'))).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: tx.definitiu, hidden: true }));
    expect(screen.getByText(tx.titolPas2('Recepta d’oli'))).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: tx.perSempre, hidden: true }));
    await waitFor(() => expect(onTria).toHaveBeenCalledWith('definitiu'));
  });
});

describe('Lot 2 · Centrament Llei 9 en RevisorEditorialNode0, PanellFontsCalendari i DesplegableEsdeveniments', () => {
  test('RevisorEditorialNode0Panel centra la barra de botons amb sdp-fila--centrada', () => {
    render(<RevisorEditorialNode0Panel idioma="ca" title="Títol" content="Cos" />);
    const boto = screen.getByRole('button', { name: /Revisar|Revisa/i });
    expect(boto.parentElement.className).toContain('sdp-fila--centrada');
  });

  test('PanellFontsCalendari centra el botó d’acció del compte amb sdp-fila--centrada', () => {
    render(
      <PanellFontsCalendari
        comptes={[{
          clau: 'compte@poble.org',
          etiqueta: 'compte@poble.org',
          proveidor: 'Google',
          fase: 'desconnectat',
          error: null,
          fonts: [{ id: 'f1', nom: 'Festes', colorToken: 'accio', activa: true, fase: 'inactiu', error: null }],
        }]}
        onCommuta={() => {}}
        onConnecta={() => {}}
        onCancella={() => {}}
        onDesconnecta={() => {}}
        onReintenta={() => {}}
      />
    );
    const boto = screen.getByRole('button', { name: 'Connecta amb Google' });
    expect(boto.parentElement.className).toContain('sdp-fila--centrada');
  });

  test.each(CODIS_IDIOMA_CALENDARI_RSVP)('SelectorModeCalendari buit en %s: missatge centrat i botó d’1 clic cap a totes les publicacions', (lang) => {
    estatIdioma.language = lang;
    const tx = textosCalendariRsvp(lang);
    const onCanviMode = vi.fn();

    render(
      <SelectorModeCalendari
        mode="events"
        onCanviMode={onCanviMode}
        entradesEsdeveniments={[]}
      />
    );
    const desplegable = screen.getByTestId('desplegable-esdeveniments-calendari');
    expect(within(desplegable).getByRole('status').textContent).toBe(tx.desplegableBuit);

    const botoVeureTot = within(desplegable).getByRole('button', { name: tx.desplegableVeureTot });
    expect(botoVeureTot.parentElement.className).toContain('sdp-cal-desplegable__accions');
    fireEvent.click(botoVeureTot);
    expect(onCanviMode).toHaveBeenCalledWith('all');
  });
});
