import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import { AppGridContext } from '../../../components/layout/AppGridShell.jsx';
import { objectiuDeContrapart, objectiuDeMissatge } from '../../../config/moderacio.js';
import ca from '../../../config/idiomes/ca.js';
import es from '../../../config/idiomes/es.js';
import en from '../../../config/idiomes/en.js';
import eu from '../../../config/idiomes/eu.js';
import gl from '../../../config/idiomes/gl.js';
import Bombolla from './Bombolla.jsx';
import Conversa from './Conversa.jsx';
import DialegCompartir from './DialegCompartir.jsx';
import { buidaEsborranys } from '../esborranys.js';

const t = (clau, alternativa) => (typeof ca[clau] === 'string' ? ca[clau] : alternativa);

const migdia = new Date('2026-11-17T12:00:00.000Z');
const hui = (minuts) => new Date(migdia.getTime() + minuts * 60_000).toISOString();

const GRUP = Object.freeze({
  id: 'f-grup-poble',
  tipus: 'grup',
  name: 'Comissió de Festes',
  potEscriure: true,
  llegitFinsSeq: 100
});

const ALTRE_FIL = Object.freeze({
  id: 'f-quadrilla',
  tipus: 'grup',
  name: 'Quadrilla de l’Olivera',
  potEscriure: true
});

function moderacioActiva() {
  return {
    disponible: true,
    potBloquejar: true,
    objectiuDeMissatge,
    objectiuDeContrapart,
    esPersonaBloquejada: () => false,
    demanaDenuncia: vi.fn(),
    demanaBloqueig: vi.fn(),
    desbloqueja: vi.fn().mockResolvedValue(undefined)
  };
}

const geo = { scrollHeight: 1000, clientHeight: 400 };
const esLlista = (el) => el.classList?.contains('sdp-xat-missatges');

beforeEach(() => {
  buidaEsborranys();
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
    configurable: true,
    get() { return esLlista(this) ? geo.scrollHeight : 0; }
  });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get() { return esLlista(this) ? geo.clientHeight : 0; }
  });
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
    const caixa = esLlista(this) ? { top: 100, height: geo.clientHeight } : { top: 0, height: 0 };
    return {
      x: 0, y: caixa.top, left: 0, width: 0, right: 0,
      top: caixa.top, height: caixa.height, bottom: caixa.top + caixa.height,
      toJSON() {}
    };
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  delete HTMLElement.prototype.scrollHeight;
  delete HTMLElement.prototype.clientHeight;
});

describe('R32.7 · Espill d’avatars 44×44 px, botons visibles, reaccions i menú de les 11 opcions de WhatsApp', () => {
  test('espill simètric: avatar aliè a l’esquerra i avatar propi clicable a la dreta amb espaiador en bombolles seguides', () => {
    render(
      <MemoryRouter>
        <ol className="sdp-xat-missatges">
          <Bombolla
            missatge={{
              id: 'm-altre-1',
              seq: 1,
              sender: 'other',
              author: 'Anna Climent',
              usuariId: 'anna-climent',
              text: 'https://socdepoble.org/mur/la-veu-de-soc-de-poble',
              mostraPrevia: true,
              creatAl: hui(1),
              estatEnviament: 'enviat'
            }}
            esGrup={false}
            primerDelGrup
            locale="ca-ES"
            t={t}
          />
          <Bombolla
            missatge={{
              id: 'm-meu-1',
              seq: 2,
              sender: 'me',
              author: 'Javi Llinares',
              usuariId: 'javi-llinares',
              text: 'Primer missatge meu.',
              creatAl: hui(2),
              estatEnviament: 'llegit'
            }}
            nomPropi="Javi Llinares"
            rutaPropia="/gent/javi-llinares"
            esGrup={false}
            primerDelGrup
            locale="ca-ES"
            t={t}
          />
          <Bombolla
            missatge={{
              id: 'm-meu-2',
              seq: 3,
              sender: 'me',
              author: 'Javi Llinares',
              usuariId: 'javi-llinares',
              text: 'Segon missatge seguit meu.',
              creatAl: hui(3),
              estatEnviament: 'llegit'
            }}
            nomPropi="Javi Llinares"
            rutaPropia="/gent/javi-llinares"
            esGrup={false}
            primerDelGrup={false}
            locale="ca-ES"
            t={t}
          />
        </ol>
      </MemoryRouter>
    );

    const itemAltre = document.querySelector('[data-missatge="m-altre-1"]');
    const itemMeu1 = document.querySelector('[data-missatge="m-meu-1"]');
    const itemMeu2 = document.querySelector('[data-missatge="m-meu-2"]');

    const enllacAltre = within(itemAltre).getByRole('link', { name: 'Obri el perfil de Anna Climent' });
    expect(enllacAltre.getAttribute('href')).toBe('/gent/anna-climent');
    expect(itemAltre.querySelector('.sdp-xat-previa-interna__img')).not.toBeNull();

    const enllacMeu = within(itemMeu1).getByRole('link', { name: 'Obri el meu perfil' });
    expect(enllacMeu.getAttribute('href')).toBe('/gent/javi-llinares');
    expect(itemMeu1.classList.contains('sdp-xat-item--meu')).toBe(true);

    expect(itemMeu2.querySelector('.sdp-xat-bombolla__espai-cara')).not.toBeNull();
    expect(within(itemMeu2).queryByRole('link', { name: 'Obri el meu perfil' })).toBeNull();
  });

  test('botons visibles (pestanya ⌄, Reacciona 😀 i Reenvia ↪), barra ràpida d’emoticones i píndola flotant «😂 2»', () => {
    const onReacciona = vi.fn();
    const onReenvia = vi.fn();

    render(
      <MemoryRouter>
        <ol className="sdp-xat-missatges">
          <Bombolla
            missatge={{
              id: 'm-reaccio-1',
              seq: 10,
              sender: 'other',
              author: 'Sofía Bornay',
              usuariId: 'sofia-bornay',
              text: 'A vore si ens juntem hui a la vesprada!',
              creatAl: hui(10),
              estatEnviament: 'enviat',
              reaccions: { '😂': ['sofia-bornay', 'javi-llinares'] }
            }}
            usuariAdjunts="javi-llinares"
            onReacciona={onReacciona}
            onReenvia={onReenvia}
            esGrup
            primerDelGrup
            locale="ca-ES"
            t={t}
          />
        </ol>
      </MemoryRouter>
    );

    const item = document.querySelector('[data-missatge="m-reaccio-1"]');
    const botoPestanya = within(item).getByRole('button', { name: 'Opcions del missatge' });
    const botoReacciona = within(item).getByRole('button', { name: 'Reacciona' });
    const botoReenvia = within(item).getByRole('button', { name: 'Reenvia' });

    expect(botoPestanya).toBeTruthy();
    expect(botoReacciona).toBeTruthy();
    expect(botoReenvia).toBeTruthy();

    const pindola = within(item).getByRole('button', { name: 'Reacció 😂, 2' });
    expect(pindola.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(pindola);
    expect(onReacciona).toHaveBeenCalledWith(expect.objectContaining({ id: 'm-reaccio-1' }), '😂');

    fireEvent.click(botoReacciona);
    const barra = within(item).getByRole('toolbar', { name: 'Reaccions ràpides' });
    const botoCor = within(barra).getByRole('button', { name: 'Reacciona: ❤️' });
    fireEvent.click(botoCor);
    expect(onReacciona).toHaveBeenCalledWith(expect.objectContaining({ id: 'm-reaccio-1' }), '❤️');

    fireEvent.click(botoReenvia);
    expect(onReenvia).toHaveBeenCalledWith(expect.objectContaining({ id: 'm-reaccio-1' }), botoReenvia);
  });

  test('menú complet de les 11 opcions de WhatsApp en un grup amb els 3 blocs i 2 divisors <hr>, més accions vives a Conversa', () => {
    const mod = moderacioActiva();
    const onSendMessage = vi.fn().mockResolvedValue(undefined);
    const onObriDirecteAmb = vi.fn();
    const onNouGrupReenvia = vi.fn();
    // v1.2.8 · «Elimina per a tothom» només apareix amb un motor que ho faça al servidor.
    const onEliminaPerATothom = vi.fn();

    render(
      <MemoryRouter>
        <AppGridContext.Provider value={{ mida: 'ample' }}>
          <Conversa
            fil={GRUP}
            onEliminaPerATothom={onEliminaPerATothom}
            filsPerReenviar={[GRUP, ALTRE_FIL]}
            messages={[
              {
                id: 'm-anna',
                seq: 1,
                sender: 'other',
                author: 'Anna Climent',
                usuariId: 'anna-climent',
                text: 'https://socdepoble.org/mur/la-veu-de-soc-de-poble',
                creatAl: hui(1),
                estatEnviament: 'enviat'
              },
              {
                id: 'm-meu',
                seq: 2,
                sender: 'me',
                author: 'Javi Llinares',
                usuariId: 'javi-llinares',
                text: 'Missatge propi que es pot eliminar per a tothom.',
                creatAl: hui(2),
                estatEnviament: 'llegit'
              }
            ]}
            actorLlista={{ id: 'javi-llinares', nom: 'Javi Llinares' }}
            moderacio={mod}
            onSendMessage={onSendMessage}
            onObriDirecteAmb={onObriDirecteAmb}
            onNouGrupReenvia={onNouGrupReenvia}
            onBack={vi.fn()}
            onEnviaAlBloc={vi.fn()}
            onCopia={vi.fn()}
            hiHaMes={false}
            carregantMes={false}
            onCarregaMes={vi.fn()}
            onReintenta={vi.fn()}
            onDescarta={vi.fn()}
            onMarcaVist={vi.fn()}
            locale="ca-ES"
            t={t}
          />
        </AppGridContext.Provider>
      </MemoryRouter>
    );

    const itemAnna = document.querySelector('[data-missatge="m-anna"]');
    const botoMenuAnna = within(itemAnna).getByRole('button', { name: 'Opcions del missatge' });
    act(() => { fireEvent.click(botoMenuAnna); });

    const menu = within(itemAnna).getByRole('menu');
    const opcions = within(menu).getAllByRole('menuitem').map((el) => el.textContent);
    expect(opcions).toEqual([
      'Respon',
      'Respon en privat',
      'Reacciona',
      'Destaca',
      'Fixa',
      'Reenvia',
      'Copia el text',
      'Envia un missatge a Anna Climent',
      'Denuncia el missatge',
      'Bloqueja Anna Climent',
      'Elimina',
      'Selecciona missatges'
    ]);
    expect(menu.querySelectorAll('hr.sdp-xat-menu__divisor')).toHaveLength(2);

    /* Fixa el missatge i comprova el bàner superior de missatge fixat */
    act(() => { fireEvent.click(within(menu).getByRole('menuitem', { name: 'Fixa' })); });
    expect(document.querySelector('.sdp-xat-fixat-baner')).not.toBeNull();

    /* Destaca el missatge */
    act(() => { fireEvent.click(botoMenuAnna); });
    act(() => { fireEvent.click(within(itemAnna).getByRole('menuitem', { name: 'Destaca' })); });
    expect(within(itemAnna).getByText('Missatge destacat')).toBeTruthy();

    /* Envia un missatge a Anna Climent */
    act(() => { fireEvent.click(botoMenuAnna); });
    act(() => { fireEvent.click(within(itemAnna).getByRole('menuitem', { name: 'Envia un missatge a Anna Climent' })); });
    expect(onObriDirecteAmb).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'm-anna', usuariId: 'anna-climent', author: 'Anna Climent' }),
      expect.objectContaining({ cita: false })
    );

    /* Reenvia obri DialegCompartir amb botó directe «Nou grup» */
    act(() => { fireEvent.click(botoMenuAnna); });
    act(() => { fireEvent.click(within(itemAnna).getByRole('menuitem', { name: 'Reenvia' })); });
    const dialegReenvia = screen.getByRole('dialog', { name: 'Reenvia a…' });
    const botoNouGrup = within(dialegReenvia).getByRole('button', { name: 'Nou grup' });
    act(() => { fireEvent.click(botoNouGrup); });
    expect(onNouGrupReenvia).toHaveBeenCalledTimes(1);

    /* IDEA-342 · Elimina per a tothom fa desaparéixer la bombolla del tot sense deixar brossa ni làpida solta */
    const itemMeu = document.querySelector('[data-missatge="m-meu"]');
    const botoMenuMeu = within(itemMeu).getByRole('button', { name: 'Opcions del missatge' });
    act(() => { fireEvent.click(botoMenuMeu); });
    act(() => { fireEvent.click(within(itemMeu).getByRole('menuitem', { name: 'Elimina' })); });
    const dialegElimina = screen.getByRole('dialog', { name: 'Vols eliminar el missatge?' });
    expect(within(dialegElimina).getByRole('button', { name: 'Elimina per a mi' })).toBeTruthy();
    const botoTothom = within(dialegElimina).getByRole('button', { name: 'Elimina per a tothom' });
    act(() => { fireEvent.click(botoTothom); });
    expect(document.querySelector('[data-missatge="m-meu"]')).toBeNull();
    expect(document.body.textContent).not.toContain("S'ha esborrat este missatge");
    expect(onEliminaPerATothom).toHaveBeenCalledTimes(1);

    /* v1.2.8 · Sense motor de servidor, el diàleg no oferix «Elimina per a tothom» (Llei 0). */
    /* Selecciona missatges activa caselles triables i la barra col·lectiva */
    act(() => { fireEvent.click(botoMenuAnna); });
    act(() => { fireEvent.click(within(itemAnna).getByRole('menuitem', { name: 'Selecciona missatges' })); });
    expect(itemAnna.getAttribute('role')).toBe('checkbox');
    expect(itemAnna.getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('toolbar', { name: 'Selecciona missatges' })).toBeTruthy();
  });

  test('DialegCompartir neteja el límit obsolet de «20 MB» i manté paritat completa en les 5 llengües (ca, es, en, eu, gl)', () => {
    const { container } = render(
      <DialegCompartir
        lot={{ titol: '', text: 'Hola', url: '', fitxers: [], rebutjats: 2 }}
        fils={[GRUP]}
        enviant={false}
        error={null}
        onTria={vi.fn()}
        onNouGrup={vi.fn()}
        onTanca={vi.fn()}
        t={t}
      />
    );

    const dialeg = container.querySelector('dialog');
    expect(dialeg).not.toBeNull();
    expect(dialeg.textContent).not.toContain('20 MB');
    expect(dialeg.textContent).toContain("s'admeten imatges del dispositiu");

    const diccionaris = [ca, es, en, eu, gl];
    const clausNovetats = [
      'section.xat.missatge.responPrivat',
      'section.xat.missatge.reacciona',
      'section.xat.missatge.destaca',
      'section.xat.missatge.fixa',
      'section.xat.missatge.reenvia',
      'section.xat.missatge.enviaPrivat',
      'section.xat.missatge.eliminaPerAMi',
      'section.xat.missatge.eliminaPerATothom',
      'section.xat.missatge.selecciona',
      'section.xat.compartir.nouGrup',
      'section.xat.perfil.obriMeu'
    ];

    for (const dict of diccionaris) {
      expect(dict['section.xat.compartir.rebutjat']).not.toContain('20 MB');
      expect(dict['section.xat.compartir.rebutjats']).not.toContain('20 MB');
      for (const clau of clausNovetats) {
        expect(typeof dict[clau]).toBe('string');
        expect(dict[clau].trim().length).toBeGreaterThan(0);
      }
    }
  });
});
