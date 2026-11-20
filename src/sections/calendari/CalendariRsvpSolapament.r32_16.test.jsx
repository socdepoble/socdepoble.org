import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext';
import { entradaDeLaTargeta } from './calendariGlobal.js';
import { SelectorModeCalendari } from './DesplegableEsdevenimentsCalendari.jsx';
import {
  CODIS_IDIOMA_CALENDARI_RSVP,
  textosCalendariRsvp
} from './i18nCalendariRsvp.js';
import {
  _reiniciaRsvpEsdeveniments,
  desaRsvpEsdeveniment,
  detectaSolapamentsRsvp,
  intervalRsvpDe,
  llegeixRsvpEsdeveniment,
  participantRsvpActual
} from './rsvpEsdeveniments.js';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

const mocks = vi.hoisted(() => ({
  language: 'ca',
  sessio: null,
  identitat: null
}));

vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({
    language: mocks.language,
    t: (_, alternativa) => alternativa
  })
}));

vi.mock('../../app/contexts/SessionContext', () => ({
  useSessioOpcional: () => mocks.sessio
}));

vi.mock('../../app/contexts/IdentitatContext', () => ({
  useIdentitatOpcional: () => mocks.identitat
}));

const ACTE_MATI = {
  id: 'mercat-llavors-2026',
  type: 'event',
  title: 'Mercat d’intercanvi de llavors',
  date: '2026-10-17',
  time: '10:00',
  endTime: '11:30',
  location: 'Plaça Major'
};

const ACTE_SOLAPAT = {
  id: 'taller-forn-2026',
  type: 'event',
  title: 'Taller de pa al forn comunal',
  date: '2026-10-17',
  time: '11:00',
  endTime: '12:30',
  location: 'Forn Vell'
};

const ACTE_ADJACENT = {
  id: 'dinar-popular-2026',
  type: 'event',
  title: 'Dinar de germanor',
  date: '2026-10-17',
  time: '12:30',
  endTime: '14:30',
  location: 'Llar Jove'
};

beforeEach(() => {
  localStorage.clear();
  _reiniciaRsvpEsdeveniments();
  mocks.language = 'ca';
  mocks.sessio = null;
  mocks.identitat = null;
});

afterEach(() => {
  cleanup();
});

describe('Onada R32.16 · T1 (IDEA-284) · Selector RSVP real + solapament horari en 5 llengües', () => {
  test('i18nCalendariRsvp cobrix ca, es, en, eu, gl sense claus buides ni termes prohibits per Llei 32 o psicopatia', () => {
    expect(CODIS_IDIOMA_CALENDARI_RSVP).toEqual(['ca', 'es', 'en', 'eu', 'gl']);
    for (const llengua of CODIS_IDIOMA_CALENDARI_RSVP) {
      const tx = textosCalendariRsvp(llengua);
      expect(tx.assistire.length).toBeGreaterThan(1);
      expect(tx.potser.length).toBeGreaterThan(1);
      expect(tx.noAssistire.length).toBeGreaterThan(1);
      expect(tx.solapamentTitol.length).toBeGreaterThan(5);
      const mostraHorari = tx.solapamentHorari('Acte A');
      const mostraDia = tx.solapamentMateixDia('Acte B');
      expect(mostraHorari).toContain('Acte A');
      expect(mostraDia).toContain('Acte B');
      const textComplet = JSON.stringify(tx) + mostraHorari + mostraDia;
      expect(textComplet).not.toMatch(/sobir[àa]|soberan|sovereign|subiran/i);
      expect(textComplet).not.toMatch(/Offline[- ]First|Local[- ]First/i);
    }
  });

  test('intervalRsvpDe i detectaSolapamentsRsvp tracten intervals semioberts [inici, fi): adjacents no xoquen i solapats sí', () => {
    const intMati = intervalRsvpDe(ACTE_MATI);
    const intSolapat = intervalRsvpDe(ACTE_SOLAPAT);
    const intAdjacent = intervalRsvpDe(ACTE_ADJACENT);
    expect(intMati.fiMs).toBeGreaterThan(intSolapat.iniciMs);
    expect(intSolapat.fiMs).toBe(intAdjacent.iniciMs);

    desaRsvpEsdeveniment(ACTE_SOLAPAT, { idParticipant: 'u:joan', intencio: 'si' });
    desaRsvpEsdeveniment(ACTE_ADJACENT, { idParticipant: 'u:joan', intencio: 'si' });
    expect(detectaSolapamentsRsvp([ACTE_SOLAPAT, ACTE_ADJACENT], { idParticipant: 'u:joan' }).parelles).toEqual([]);

    desaRsvpEsdeveniment(ACTE_MATI, { idParticipant: 'u:joan', intencio: 'si' });
    const ambXoc = detectaSolapamentsRsvp([ACTE_MATI, ACTE_SOLAPAT, ACTE_ADJACENT], { idParticipant: 'u:joan' });
    expect(ambXoc.parelles).toEqual([
      { primerId: 'mercat-llavors-2026', segonId: 'taller-forn-2026', tipus: 'horari' }
    ]);
    expect(ambXoc.perActe['mercat-llavors-2026'][0].titol).toBe('Taller de pa al forn comunal');
    expect(ambXoc.perActe['taller-forn-2026'][0].titol).toBe('Mercat d’intercanvi de llavors');
    expect(ambXoc.perActe['dinar-popular-2026']).toBeUndefined();
  });

  test('separa la persistència RSVP entre persona i entitat activa dins de storage.js', () => {
    const usuari = { id: 'usuari-42' };
    const entitat = { actorType: 'entitat', actorId: 'associacio-forn' };
    const pidPersona = participantRsvpActual(usuari, { actorType: 'persona', actorId: 'usuari-42' });
    const pidEntitat = participantRsvpActual(usuari, entitat);
    expect(pidPersona).toBe('u:usuari-42');
    expect(pidEntitat).toBe('e:associacio-forn');

    desaRsvpEsdeveniment(ACTE_MATI, { idParticipant: pidPersona, intencio: 'si' });
    desaRsvpEsdeveniment(ACTE_MATI, { idParticipant: pidEntitat, intencio: 'potser' });

    expect(llegeixRsvpEsdeveniment(ACTE_MATI, pidPersona)).toMatchObject({ intencio: 'si', confirmats: 1, potser: 1 });
    expect(llegeixRsvpEsdeveniment(ACTE_MATI, pidEntitat)).toMatchObject({ intencio: 'potser', confirmats: 1, potser: 1 });
  });

  test('SelectorModeCalendari renderitza les 3 opcions RSVP i l’avís no bloquejant de solapament en les 5 llengües', () => {
    const entrades = [ACTE_MATI, ACTE_SOLAPAT, ACTE_ADJACENT].map(entradaDeLaTargeta);

    for (const llengua of CODIS_IDIOMA_CALENDARI_RSVP) {
      cleanup();
      localStorage.clear();
      _reiniciaRsvpEsdeveniments();
      mocks.language = llengua;
      const tx = textosCalendariRsvp(llengua);

      render(
        <MemoryRouter rutaInicial="/calendari">
          <SelectorModeCalendari mode="events" onCanviMode={() => {}} entradesEsdeveniments={entrades} />
        </MemoryRouter>
      );

      const desplegable = screen.getByTestId('desplegable-esdeveniments-calendari');
      const filaMati = within(desplegable).getByText(ACTE_MATI.title).closest('li');
      const filaSolapat = within(desplegable).getByText(ACTE_SOLAPAT.title).closest('li');

      const grupMati = within(filaMati).getByRole('group', { name: tx.grupAria(ACTE_MATI.title) });
      expect(within(grupMati).getByRole('button', { name: tx.assistire, pressed: false })).toBeTruthy();
      expect(within(grupMati).getByRole('button', { name: tx.potser, pressed: false })).toBeTruthy();
      expect(within(grupMati).getByRole('button', { name: tx.noAssistire, pressed: false })).toBeTruthy();

      act(() => {
        fireEvent.click(within(filaMati).getByRole('button', { name: tx.assistire }));
        fireEvent.click(within(filaSolapat).getByRole('button', { name: tx.assistire }));
      });

      expect(within(filaMati).getByRole('button', { name: tx.assistire, pressed: true })).toBeTruthy();
      expect(within(filaSolapat).getByRole('button', { name: tx.assistire, pressed: true })).toBeTruthy();

      const avisMati = screen.getByTestId(`avis-solapament-${ACTE_MATI.id}`);
      expect(avisMati.textContent).toContain(tx.solapamentTitol);
      expect(avisMati.textContent).toContain(ACTE_SOLAPAT.title);

      // Canviar un dels dos a «Potser» resol el solapament sense esborrar la resposta de l'altre.
      act(() => {
        fireEvent.click(within(filaSolapat).getByRole('button', { name: tx.potser }));
      });
      expect(within(filaSolapat).getByRole('button', { name: tx.potser, pressed: true })).toBeTruthy();
      expect(screen.queryByTestId(`avis-solapament-${ACTE_MATI.id}`)).toBeNull();
    }
  });

  test('diferit-esdeveniments.css garantix dianes >= 48 px (3rem), >= 56 px (3.5rem) en Mode Sènior i 0 selectors :has()', () => {
    const css = fs.readFileSync(path.join(ARREL, 'src/css/diferit-esdeveniments.css'), 'utf8');
    expect(css).not.toContain(':has(');
    expect(css).toContain('min-block-size: 3rem;');
    expect(css).toContain('min-inline-size: 3rem;');
    expect(css).toContain('min-block-size: 3.5rem;');
    expect(css).toContain('min-inline-size: 3.5rem;');
    expect(css).toContain('data-sdp-senior="true"');
  });
});
