import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import Aprendre from './Aprendre.jsx';
import { creaMagatzemProgres } from './magatzemProgres.js';
import { CAIXES_PER_DEFECTE, venciment } from './leitner.js';

afterEach(cleanup);

const targeta = (id, nom) => ({
  id, versio: '1', titol: `Targeta ${nom}`, concepte: `Concepte ${nom}.`, mnemotecnia: `Imatge ${nom}.`,
  pregunta: `Pregunta ${nom}?`, resposta: `Resposta ${nom}.`, explicacio: `Explicació ${nom}.`
});
const BARALLA = {
  id: 'prova-aprendre', versio: '1.0.0', titol: 'Baralla de prova',
  avis: 'Avís de prova; confirma-ho amb la gestoria.',
  targetes: [targeta('prova-u', 'u'), targeta('prova-dos', 'dos')]
};
const UNA = { ...BARALLA, targetes: [BARALLA.targetes[0]] };
const ARA = Date.UTC(2026, 9, 5, 8); // dilluns 5 d'octubre de 2026, 10:00 a Madrid
const DIA = 24 * 3600 * 1000;
const ara = () => new Date(ARA);
const desat = (cardId, camps) => ({
  barallaId: 'prova-aprendre', cardId, contentVersion: '1', caixa: 1, dueAt: ARA - 1000,
  lastReviewedAt: ARA - DIA, repetitions: 1, lapses: 0, ...camps
});

async function munta({ estats = [], baralla = BARALLA } = {}) {
  const magatzem = creaMagatzemProgres({ idb: null });
  for (const estat of estats) await magatzem.desa(estat);
  const desa = vi.spyOn(magatzem, 'desa');
  const esborra = vi.spyOn(magatzem, 'esborra');
  const vista = render(<Aprendre baralla={baralla} magatzem={magatzem} ara={ara} />);
  await screen.findByText('Pendents hui:');
  return { magatzem, desa, esborra, ...vista };
}

const fase = nom => screen.getByRole('heading', { level: 3, name: nom });
const boto = nom => screen.getByRole('button', { name: nom });
const clica = nom => fireEvent.click(boto(nom));
const pendentsHui = () => screen.getByText('Pendents hui:').textContent;

describe('cascada de cinc fases', () => {
  test('una targeta nova recorre les cinc fases i el focus va al títol de cada fase', async () => {
    const { desa } = await munta();
    // En muntar, la targeta no roba el focus (jsdom sí que enfoca l'autoFocus del diàleg tancat).
    expect(screen.getByRole('article').contains(document.activeElement)).toBe(false);
    expect(fase('Concepte')).toBeTruthy();
    expect(screen.getByText('Fase 1 de 5')).toBeTruthy();
    expect(screen.getByText('Concepte u.')).toBeTruthy();
    expect(screen.getByText('Caixa 0 de 5 · nova')).toBeTruthy();
    expect(pendentsHui()).toBe('Pendents hui: 2');

    clica('Mostra la imatge');
    expect(document.activeElement).toBe(fase('Imatge per recordar'));
    expect(screen.getByText('Imatge u.')).toBeTruthy();

    clica('Següent');
    expect(document.activeElement).toBe(fase('Record sense pista'));
    expect(screen.getByText('Pregunta u?')).toBeTruthy();
    // Sense pista: ni concepte, ni imatge, ni resposta.
    expect(screen.queryByText('Concepte u.')).toBeNull();
    expect(screen.queryByText('Imatge u.')).toBeNull();
    expect(screen.queryByText('Resposta u.')).toBeNull();

    clica('Ho recorde');
    expect(document.activeElement).toBe(fase('Explicació de la resposta'));
    expect(screen.getByText('Resposta u.')).toBeTruthy();
    expect(screen.getByText('Explicació u.')).toBeTruthy();
    expect(screen.getByText('Has dit que ho recordaves')).toBeTruthy();
    expect(desa).not.toHaveBeenCalled();

    clica('Següent');
    expect(document.activeElement).toBe(fase('Repàs programat'));
    expect(screen.getByText('Puja a la caixa 1')).toBeTruthy();
    expect(screen.getByText(/^Tornarà a eixir el .*6 d.octubre\.$/)).toBeTruthy();
    expect(desa).toHaveBeenCalledWith(expect.objectContaining({
      barallaId: 'prova-aprendre', cardId: 'prova-u', caixa: 1, dueAt: venciment(ARA, 1), repetitions: 1, lapses: 0
    }));

    clica('Següent targeta');
    expect(document.activeElement).toBe(fase('Concepte'));
    expect(screen.getByText('Concepte dos.')).toBeTruthy();
    expect(pendentsHui()).toBe('Pendents hui: 1');
  });

  test('mostra l’avís de la baralla, els intervals i la caixa de cada targeta', async () => {
    await munta({ estats: [desat('prova-dos', { caixa: 3, dueAt: ARA + 2 * DIA })] });
    expect(screen.getByText('Avís de prova; confirma-ho amb la gestoria.')).toBeTruthy();
    expect(screen.getByText(/Intervals: caixa 0: hui mateix · caixa 1: 1 dia · caixa 2: 3 dies/)).toBeTruthy();
    const llista = within(screen.getByText('Caixa de cada targeta').closest('details'));
    expect(llista.getByText('Targeta u: Caixa 0 de 5 · nova')).toBeTruthy();
    expect(llista.getByText(/^Targeta dos: Caixa 3 de 5 · torna el .*7 d.octubre$/)).toBeTruthy();
    expect(pendentsHui()).toBe('Pendents hui: 1');
  });
});

describe('teclat i focus', () => {
  test('tot són botons natius, l’acció seguix el títol enfocat i cap pas deixa el focus perdut', async () => {
    const { container } = await munta({ baralla: UNA });
    const comprova = titol => {
      const capcalera = fase(titol);
      expect(document.activeElement).toBe(capcalera);
      for (const element of within(container).getAllByRole('button')) {
        expect(element.tagName).toBe('BUTTON');
        expect(element.getAttribute('type')).toBe('button');
      }
      expect(container.querySelector('[tabindex]:not([tabindex="-1"]):not([tabindex="0"])')).toBeNull();
      const primera = within(capcalera.closest('article')).getAllByRole('button')[0];
      expect(capcalera.compareDocumentPosition(primera) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      return primera;
    };
    // Activar un botó natiu amb Intro o Espai és un clic: es prova el clic sobre el botó enfocat.
    const activa = element => { element.focus(); fireEvent.click(element); };

    fase('Concepte').focus();
    activa(boto('Mostra la imatge'));
    activa(comprova('Imatge per recordar'));
    activa(comprova('Record sense pista'));
    comprova('Explicació de la resposta');

    // Corregir el veredicte no mou el focus: és el mateix botó amb un altre text.
    const corregix = boto('Corregix: no ho recordava');
    activa(corregix);
    expect(document.activeElement).toBe(corregix);
    expect(corregix.textContent).toBe('Corregix: sí que ho recordava');
    expect(screen.getByText('Has dit que no ho recordaves')).toBeTruthy();
    activa(corregix);
    expect(screen.getByText('Has dit que ho recordaves')).toBeTruthy();
    activa(corregix);

    activa(boto('Següent'));
    comprova('Repàs programat');
    expect(screen.getByText('Torna a la caixa 0')).toBeTruthy();
    activa(boto('Següent targeta'));
    comprova('Concepte');
  });
});

describe('les respostes mouen les caixes', () => {
  test('error: torna a la caixa 0, compta el lapse i la targeta torna al final del repàs amb la cascada sencera', async () => {
    const { desa } = await munta({ baralla: UNA, estats: [desat('prova-u', { caixa: 2, repetitions: 2 })] });
    // En repàs comença pel record sense pista.
    expect(fase('Record sense pista')).toBeTruthy();
    expect(screen.getByText('Fase 3 de 5')).toBeTruthy();
    expect(screen.getByText('Caixa 2 de 5')).toBeTruthy();
    clica('No ho recorde');
    expect(screen.getByText('Has dit que no ho recordaves')).toBeTruthy();
    clica('Següent');
    expect(screen.getByText('Torna a la caixa 0')).toBeTruthy();
    expect(screen.getByText('Torna a eixir en este mateix repàs, al final de la cua.')).toBeTruthy();
    expect(desa).toHaveBeenLastCalledWith(expect.objectContaining({ cardId: 'prova-u', caixa: 0, repetitions: 3, lapses: 1 }));
    clica('Següent targeta');
    expect(document.activeElement).toBe(fase('Concepte'));
    expect(screen.getByText('Caixa 0 de 5')).toBeTruthy();
    expect(pendentsHui()).toBe('Pendents hui: 1');
  });

  test('encert: puja una caixa, es programa segons l’interval i acaba el repàs', async () => {
    const { desa } = await munta({ baralla: UNA, estats: [desat('prova-u', { caixa: 1 })] });
    clica('Ho recorde');
    clica('Següent');
    expect(screen.getByText('Puja a la caixa 2')).toBeTruthy();
    expect(screen.getByText(/^Tornarà a eixir el .*8 d.octubre\.$/)).toBeTruthy();
    expect(desa).toHaveBeenLastCalledWith(expect.objectContaining({ caixa: 2, dueAt: venciment(ARA, CAIXES_PER_DEFECTE[2]) }));
    clica('Acaba el repàs');
    expect(document.activeElement).toBe(fase('Repàs fet per hui'));
    expect(screen.getByText(/^Pròxim repàs: .*8 d.octubre\.$/)).toBeTruthy();
    expect(pendentsHui()).toBe('Pendents hui: 0');
  });

  test('a l’última caixa es queda on és amb l’interval més llarg', async () => {
    const { desa } = await munta({ baralla: UNA, estats: [desat('prova-u', { caixa: 5 })] });
    clica('Ho recorde');
    clica('Següent');
    expect(screen.getByText('Es queda a la caixa 5, la més alta')).toBeTruthy();
    expect(desa).toHaveBeenLastCalledWith(expect.objectContaining({ caixa: 5, dueAt: venciment(ARA, 35) }));
  });

  test('una targeta amb una versió nova torna a ser nova i es desa reiniciada', async () => {
    const { desa } = await munta({ estats: [desat('prova-u', { contentVersion: '0', caixa: 4, dueAt: ARA + 5 * DIA })] });
    expect(desa).toHaveBeenCalledWith(expect.objectContaining({ cardId: 'prova-u', contentVersion: '1', caixa: 0, dueAt: null }));
    expect(pendentsHui()).toBe('Pendents hui: 2');
    expect(fase('Concepte')).toBeTruthy();
  });
});

describe('progrés opcional i local', () => {
  test('oblida el meu progrés: demana confirmació, esborra la baralla i torna a començar', async () => {
    const { magatzem, esborra } = await munta({
      estats: [desat('prova-u', { caixa: 3, dueAt: ARA + 2 * DIA }), desat('prova-dos', { caixa: 1 })]
    });
    expect(pendentsHui()).toBe('Pendents hui: 1');

    clica('Oblida el meu progrés');
    let dialeg = screen.getByRole('dialog', { name: 'Vols oblidar el teu progrés?' });
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Cancel·lar' }));
    expect(esborra).not.toHaveBeenCalled();
    expect(dialeg.hasAttribute('open')).toBe(false);

    clica('Oblida el meu progrés');
    dialeg = screen.getByRole('dialog', { name: 'Vols oblidar el teu progrés?' });
    await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Sí, oblida’l' })); });
    expect(esborra).toHaveBeenCalledWith('prova-aprendre');
    expect(await magatzem.carrega('prova-aprendre')).toEqual([]);
    expect(screen.getByText('Progrés oblidat: totes les targetes tornen a ser noves.')).toBeTruthy();
    expect(pendentsHui()).toBe('Pendents hui: 2');
    expect(fase('Concepte')).toBeTruthy();
    expect(dialeg.hasAttribute('open')).toBe(false);
  });

  test('magatzem={null}: el progrés només dura la sessió i la baralla per defecte funciona', async () => {
    render(<Aprendre magatzem={null} ara={ara} />);
    await screen.findByText('Pendents hui:');
    expect(screen.getByRole('heading', { level: 2, name: 'Aprendre la gestoria' })).toBeTruthy();
    expect(screen.getByText('Contingut formatiu general; confirma-ho sempre amb la teua gestoria.')).toBeTruthy();
    expect(screen.getByText('El progrés només dura esta sessió: no es guarda enlloc.')).toBeTruthy();
    expect(fase('Concepte')).toBeTruthy();
  });

  test('si el progrés no es pot llegir ni desar, ho diu i el repàs continua', async () => {
    const fallit = {
      persistent: true,
      carrega: vi.fn().mockRejectedValue(new Error('lectura')),
      desa: vi.fn().mockRejectedValue(new Error('escriptura')),
      esborra: vi.fn()
    };
    render(<Aprendre baralla={UNA} magatzem={fallit} ara={ara} />);
    expect(await screen.findByText('No s’ha pogut llegir el progrés desat. Comences de zero.')).toBeTruthy();
    expect(screen.getByText('El progrés es guarda només en este dispositiu, sense dades personals.')).toBeTruthy();
    clica('Mostra la imatge');
    clica('Següent');
    clica('Ho recorde');
    await act(async () => { clica('Següent'); });
    expect(screen.getByText('Puja a la caixa 1')).toBeTruthy();
    expect(screen.getByText(/No s’ha pogut desar el progrés en este dispositiu/)).toBeTruthy();
  });
});
