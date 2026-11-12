/* GAUNTLET-CARBON-R18-05 (P1) · La pàgina de l'Avisador en les cinc llengües.
   · Amb el traductor real (createTranslator) en castellà i en basc, la pàgina
     mostra el títol, el paràgraf del 112 i el botó d'activar traduïts; el
     blockquote continua sent MISSATGE_AVISADOR literal, que és el que s'envia.
   · Llei del Píxel: sense traductor o en valencià, el DOM és idèntic, i és el
     text d'abans caràcter per caràcter.
   · Els cinc diccionaris porten totes les claus page.avisador.* de
     textosAvisador.js, cap buida, amb els mateixos marcadors; en valencià, la
     reserva exacta. */
import '../../tests/helpers/diccionaris.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from '../app/contexts/RouterContext.jsx';
import { MISSATGE_AVISADOR } from '../services/avisador.js';
import CA from '../config/idiomes/ca.js';
import ES from '../config/idiomes/es.js';
import EN from '../config/idiomes/en.js';
import EU from '../config/idiomes/eu.js';
import GL from '../config/idiomes/gl.js';
import { omple, TEXTOS_AVISADOR } from './textosAvisador.js';
import AvisadorPage from './AvisadorPage.jsx';

const m = vi.hoisted(() => ({ llengua: null }));
const { port, useXat } = vi.hoisted(() => ({ port: vi.fn(), useXat: vi.fn() }));
vi.mock('../data/backendPort.js', () => ({ enviaMissatge: port }));
vi.mock('../sections/xat/XatContext.jsx', () => ({ useXat }));
vi.mock('../components/universal/PageFrame.jsx', () => ({
  PageFrame: ({ title, subtitle, children }) => (
    <main><header className="page-title"><h1>{title}</h1><p>{subtitle}</p></header>{children}</main>
  )
}));
/* m.llengua null: fora de l'App (useUIActionsOpcional torna null), la reserva valenciana. */
vi.mock('../app/contexts/UIContext', async (importOriginal) => {
  const real = await importOriginal();
  const { createTranslator } = await import('../config/i18n.js');
  return { ...real, useUIActionsOpcional: () => (m.llengua ? { t: createTranslator(m.llengua) } : null) };
});

const DICCIONARIS = { ca: CA, es: ES, en: EN, eu: EU, gl: GL };
const PARELLS = Object.values(TEXTOS_AVISADOR);
const fil = (id, nom) => ({
  id: `fil-${id}`, tipus: 'directe', participants: 2, altres: [{ id, nom, tipus: 'persona' }]
});
const XAT = {
  avisadorClau: 'avisador:idiomes', scopeKey: 'sessio', joId: 'jo', status: 'ready', llistaFresca: true,
  chatThreads: [fil('anna', 'Anna')]
};
const munta = () => render(<AvisadorPage />, { wrapper: MemoryRouter });
const marcadors = (text) => [...new Set(String(text).match(/\{\w+\}/g) ?? [])].sort().join(' ');

beforeEach(() => {
  window.localStorage.clear();
  m.llengua = null;
  useXat.mockReturnValue(XAT);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('la pàgina, traduïda', () => {
  it('en castellà: títol, paràgraf del 112 i botó d’activar; el missatge que s’envia, literal', () => {
    m.llengua = 'es';
    munta();
    /* El nom propi del producte no es traduïx: «L’Avisador · Batec de Vida»
       en totes les llengües, com al Panell (registrePlugins.js) i a
       l'enllaç d'AparadorFediversity.jsx. */
    expect(screen.getByRole('heading', { name: 'L’Avisador' })).toBeTruthy();
    expect(screen.getByText('Batec de Vida')).toBeTruthy();
    expect(screen.getByText(/Si la app está cerrada o suspendida.*llama al 112\. L’Avisador no sustituye a la teleasistencia médica homologada\./))
      .toBeTruthy();
    expect(screen.getByText(/El contador se pausa durante el descanso nocturno\./)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Activa L’Avisador' })).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'He leído que L’Avisador no sustituye al 112 ni a la teleasistencia' })).toBeTruthy();
    expect(screen.getByText('Recibirán este mensaje:')).toBeTruthy();
    const cita = document.querySelector('blockquote');
    expect(cita.textContent).toBe(MISSATGE_AVISADOR);
    expect(screen.queryByText('Rebran este missatge:')).toBeNull();
  });

  it('en basc: títol, paràgraf del 112 i botó d’activar; el missatge que s’envia, literal', () => {
    m.llengua = 'eu';
    munta();
    expect(screen.getByRole('heading', { name: 'L’Avisador' })).toBeTruthy();
    expect(screen.getByText('Batec de Vida')).toBeTruthy();
    expect(screen.getByText(/Larrialdi batean, deitu 112ra\. L’Avisador-ek ez du ordezkatzen teleasistentzia mediko homologatua\./))
      .toBeTruthy();
    expect(screen.getByRole('button', { name: 'Aktibatu L’Avisador' })).toBeTruthy();
    expect(document.querySelector('blockquote').textContent).toBe(MISSATGE_AVISADOR);
  });

  it('sense compte, l’enllaç d’entrada i la resta de la frase van en la llengua triada', () => {
    m.llengua = 'es';
    useXat.mockReturnValue({ avisadorClau: null, senseSessio: true });
    munta();
    const enllac = screen.getByRole('link', { name: 'Entra con tu cuenta' });
    expect(enllac.closest('p').textContent).toBe('Entra con tu cuenta para configurarlo.');
  });
});

describe('Llei del Píxel en valencià', () => {
  it('sense traductor i amb el valencià, el DOM és idèntic i diu el text d’abans', () => {
    /* Només canvien els identificadors de useId entre muntatges. */
    const dom = (vista) => vista.container.innerHTML.replace(/:r\w+:/g, ':id:');
    const sense = dom(munta());
    cleanup();
    m.llengua = 'ca';
    const ambCa = dom(munta());
    expect(ambCa).toBe(sense);
    expect(screen.getByRole('heading', { name: 'L’Avisador' })).toBeTruthy();
    expect(screen.getByText('L’Avisador envia un missatge veïnal al Xat quan passen les hores que has triat sense activitat en esta app. El comptador es pausa durant el descans nocturn.'))
      .toBeTruthy();
    expect(screen.getByText('Funciona amb la sessió personal oberta, mentre l’app pot executar-se i té connexió al Xat. Els ajustos es guarden en este dispositiu. Si l’app està tancada o suspesa, el dispositiu està apagat o el Xat no està disponible, l’avís pot no arribar. En tornar a obrir l’app, l’Avisador espera uns minuts abans d’avisar. Per a una emergència, telefona al 112. L’Avisador no substituïx la teleassistència mèdica homologada.'))
      .toBeTruthy();
    expect(screen.getByRole('button', { name: 'Activa l’Avisador' })).toBeTruthy();
    expect(screen.getByRole('option', { name: '8 h' })).toBeTruthy();
  });

  it('sense compte, la frase de l’enllaç és la d’abans', () => {
    useXat.mockReturnValue({ avisadorClau: null, senseSessio: true });
    munta();
    const enllac = screen.getByRole('link', { name: 'Entra amb el teu compte' });
    expect(enllac.closest('p').textContent).toBe('Entra amb el teu compte per a configurar-lo.');
  });
});

describe('els cinc diccionaris', () => {
  it('textosAvisador.js porta parells page.avisador.* sense claus repetides', () => {
    expect(PARELLS.length).toBeGreaterThan(30);
    const claus = PARELLS.map(([clau]) => clau);
    expect(claus.every((clau) => clau.startsWith('page.avisador.'))).toBe(true);
    expect(new Set(claus).size).toBe(claus.length);
  });

  it.each(Object.keys(DICCIONARIS))('%s: totes les claus, cap buida i amb els mateixos marcadors', (codi) => {
    const dic = DICCIONARIS[codi];
    const falten = PARELLS.filter(([clau]) => typeof dic[clau] !== 'string' || dic[clau].trim() === '').map(([clau]) => clau);
    expect(falten).toEqual([]);
    expect(PARELLS.filter(([clau, reserva]) => marcadors(dic[clau]) !== marcadors(reserva)).map(([clau]) => clau)).toEqual([]);
  });

  it('en valencià, el valor del diccionari és la reserva exacta', () => {
    expect(PARELLS.filter(([clau, reserva]) => CA[clau] !== reserva).map(([clau]) => clau)).toEqual([]);
  });

  /* El nom propi del producte, «L’Avisador · Batec de Vida», s'escriu igual
     en totes les llengües, com al Panell (registrePlugins.js) i a
     AparadorFediversity.jsx. En anglés el subtítol porta la glossa entre
     parèntesis, perquè la guarda d'i18n.traduides.test.js no admet un text de
     dues paraules o més idèntic al valencià. */
  const NOM_PROPI = new Set(['page.avisador.titol', 'page.avisador.subtitol']);

  it('les altres quatre llengües no deixen el text valencià, fora del nom propi', () => {
    for (const codi of ['es', 'en', 'eu', 'gl']) {
      const iguals = PARELLS.filter(([clau, reserva]) => !NOM_PROPI.has(clau) && DICCIONARIS[codi][clau] === reserva)
        .map(([clau]) => clau);
      expect([codi, iguals]).toEqual([codi, []]);
    }
  });

  it('el nom del producte es conserva literal en les cinc llengües', () => {
    for (const codi of Object.keys(DICCIONARIS)) {
      const dic = DICCIONARIS[codi];
      expect([codi, dic['page.avisador.titol']]).toEqual([codi, 'L’Avisador']);
      expect([codi, dic['page.avisador.subtitol'].startsWith('Batec de Vida')]).toEqual([codi, true]);
      for (const clau of ['page.avisador.activa', 'page.avisador.desactiva', 'page.avisador.llegit', 'page.avisador.errorDesactiva']) {
        expect([codi, clau, dic[clau].includes('Avisador')]).toEqual([codi, clau, true]);
      }
    }
  });

  it('omple posa les xifres després de traduir, sense interpretar «$&»', () => {
    expect(omple(ES['page.avisador.confirmats'], { enviats: 2, total: 3 }))
      .toBe('El chat ha confirmado 2 de 3 envíos en este periodo.');
    expect(omple('{a} {b}', { a: '$&' })).toBe('$& {b}');
  });
});
