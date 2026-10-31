/* Pla 261028_1526 (P1-66) · La barra única del compositor: [+] [camp amb la
   carona dins] [botó redó]. Sense `adjunts`, el Compositor de sempre (ni + ni
   micròfon); amb, el + obri un menú amb només el que funciona i la quota al
   peu, i el botó redó és un sol node que grava, atura, envia el fitxer o
   envia el text. El menú i el calaix d'emoticones no conviuen; Escape, clicar
   fora (també a l'arrel d'ombra) i bloquejar els adjunts tanquen el menú.
   A nivell de Conversa, cap adjunt per a qui no en pot enviar. I la geometria
   dels fulls: dianes de 48px, la carona dins del camp i la safata que
   col·lapsa a 0 (jsdom no fa maquetació: es comproven les regles). */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ImagePlus, Mic, Send, Square } from 'lucide-react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import { AppGridContext } from '../../../components/layout/AppGridShell.jsx';
import Compositor, { ID_MENU_ADJUNTS } from './Compositor.jsx';
import ControlsAdjunt from './ControlsAdjunt.jsx';
import Conversa from './Conversa.jsx';

const m = vi.hoisted(() => ({ quotaXat: vi.fn(), preparaAdjunt: vi.fn(), gravaVeu: vi.fn() }));
/* El catàleg de veres pesa 292 kB: ací, una família sintètica. */
vi.mock('../../notes/canalEmojis.js', () => ({
  carregaCatalegEmojis: async () => ({ GRUPS_EMOJIS: [{ id: 'cares-emocions', nom: 'Cares', emojis: [['1F600', '😀', 'grinning face']] }] })
}));
vi.mock('../adjuntLocal.js', async (importOriginal) => ({ ...(await importOriginal()), preparaAdjunt: m.preparaAdjunt, gravaVeu: m.gravaVeu, mimeDeGravacio: () => 'audio/mp4' }));
vi.mock('../../../data/backendPort.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, quotaXat: m.quotaXat, teCapacitat: (capacitat) => capacitat === 'xatMultimedia' || real.teCapacitat(capacitat) };
});

const t = (_, alternativa) => alternativa;
const TACTIL = '(hover: none) and (pointer: coarse)';
const tactil = (es) => {
  window.matchMedia = (consulta) => ({ matches: es && consulta === TACTIL, media: consulta, addEventListener() {}, removeEventListener() {} });
};

beforeEach(() => {
  vi.clearAllMocks();
  tactil(false);
  HTMLElement.prototype.scrollTo = function scrollTo() {};
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete window.matchMedia;
  delete HTMLElement.prototype.scrollTo;
});

/* L'objecte que dona ControlsAdjunt, sintètic: el contracte del Compositor. */
const fesAdjunts = (extra = {}) => ({
  etiqueta: 'Adjunta',
  etiquetaMenu: 'Adjunts del xat',
  refBoto: { current: null },
  refPrimari: { current: null },
  bloquejat: false,
  opcions: [{ id: 'fotos', etiqueta: 'Fotos i vídeos', icona: ImagePlus, onTria: vi.fn() }],
  peuMenu: ['0,0 de 20 MB del xat'],
  primari: { clau: 'grava', etiqueta: 'Grava àudio', icona: Mic, onClick: vi.fn(), nomesBuit: true },
  ...extra
});

function Prova({ inicial = '', onEnvia = () => {}, ...props }) {
  const [valor, setValor] = useState(inicial);
  return (
    <AppGridContext.Provider value={{ mida: 'ample', setPanellObert: vi.fn() }}>
      <Compositor valor={valor} onCanvia={setValor} onEnvia={() => { onEnvia(valor); setValor(''); }} t={t} {...props} />
      <button type="button">Fora</button>
    </AppGridContext.Provider>
  );
}

const camp = () => screen.getByRole('textbox', { name: 'Escriu un missatge' });
const mes = () => screen.getByRole('button', { name: 'Adjunta' });
const redo = () => document.querySelector('.sdp-xat-compositor__envia');
const noms = (botons) => botons.map((b) => b.getAttribute('aria-label') || b.textContent);
/* El rellotge del doble toc (Date.now), a mà: `passa(ms)` l'avança. */
const rellotge = () => {
  let ara = 1_000_000;
  vi.spyOn(Date, 'now').mockImplementation(() => ara);
  return { passa: (ms) => { ara += ms; } };
};

describe('sense adjunts, el compositor de sempre', () => {
  test('(a) ni + ni micròfon: la carona i Envia (submit, desactivat amb el camp buit)', () => {
    render(<Prova />);
    expect(screen.queryByRole('button', { name: 'Adjunta' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Grava àudio' })).toBeNull();
    expect(noms(within(camp().closest('form')).getAllByRole('button'))).toEqual(['Emoticones', 'Negreta', 'Envia']);
    expect(redo().type).toBe('submit');
    expect(redo().disabled).toBe(true);
    expect(redo().hasAttribute('data-accio')).toBe(false);
    // La carona viu dins del camp, abans del textarea.
    expect(screen.getByRole('button', { name: 'Emoticones' }).parentElement).toBe(camp().parentElement);
    expect(camp().parentElement.className).toBe('sdp-xat-compositor__camp sdp-xat-compositor__camp--carona sdp-xat-compositor__camp--negreta');
    // IDEA-53 · [N] també viu dins del camp, darrere del textarea.
    expect(screen.getByRole('button', { name: 'Negreta' }).parentElement).toBe(camp().parentElement);
  });
});

describe('el botó redó: un sol node que canvia de nom', () => {
  test('(b) camp buit → «Grava àudio»; en escriure, el mateix node és «Envia»; en buidar, torna', () => {
    const adjunts = fesAdjunts();
    render(<Prova adjunts={adjunts} />);
    const boto = redo();
    expect(boto).toBe(screen.getByRole('button', { name: 'Grava àudio' }));
    expect(boto.type).toBe('button');
    expect(boto.disabled).toBe(false);
    expect(boto.dataset.accio).toBe('grava');
    expect(adjunts.refPrimari.current).toBe(boto);
    expect(adjunts.refBoto.current).toBe(mes());
    // XU-01 · El ratolí i el dit no li donen el focus.
    expect(fireEvent.mouseDown(boto)).toBe(false);
    fireEvent.click(boto);
    expect(adjunts.primari.onClick).toHaveBeenCalledOnce();
    fireEvent.change(camp(), { target: { value: 'hola' } });
    expect(screen.getByRole('button', { name: 'Envia' })).toBe(boto);
    expect(boto.type).toBe('submit');
    expect(boto.hasAttribute('data-accio')).toBe(false);
    fireEvent.change(camp(), { target: { value: '   ' } });
    expect(screen.getByRole('button', { name: 'Grava àudio' })).toBe(boto);
  });

  test('(c) amb un fitxer preparat, «Envia el fitxer» encara que hi haja text; Retorn continua enviant el text', () => {
    const onEnvia = vi.fn();
    const primari = { clau: 'envia', etiqueta: 'Envia el fitxer', icona: Send, onClick: vi.fn(), descritPer: 'avis-ubicacio' };
    render(<Prova inicial="Mireu" onEnvia={onEnvia} adjunts={fesAdjunts({ primari, bloquejat: true })} />);
    const boto = screen.getByRole('button', { name: 'Envia el fitxer' });
    expect(boto.getAttribute('aria-describedby')).toBe('avis-ubicacio');
    fireEvent.click(boto);
    expect(primari.onClick).toHaveBeenCalledOnce();
    expect(onEnvia).not.toHaveBeenCalled();
    expect(camp().value).toBe('Mireu');
    fireEvent.keyDown(camp(), { key: 'Enter' });
    expect(onEnvia).toHaveBeenCalledWith('Mireu');
  });

  test('(d) mentre grava, «Atura la gravació»; mentre puja, «Enviant…» enfocable i sense efecte', () => {
    const { passa } = rellotge();
    const atura = { clau: 'atura', etiqueta: 'Atura la gravació', icona: Square, onClick: vi.fn() };
    const { rerender } = render(<Prova adjunts={fesAdjunts({ primari: atura, bloquejat: true })} />);
    const boto = screen.getByRole('button', { name: 'Atura la gravació' });
    fireEvent.click(boto);
    expect(atura.onClick).toHaveBeenCalledOnce();
    // Lluny del doble toc: ací només compta aria-disabled.
    passa(5000);
    const enviant = { clau: 'envia', etiqueta: 'Enviant…', icona: Send, onClick: vi.fn(), ariaDisabled: true, ocupat: true };
    rerender(<Prova adjunts={fesAdjunts({ primari: enviant, bloquejat: true })} />);
    expect(screen.getByRole('button', { name: 'Enviant…' })).toBe(boto);
    expect(boto.getAttribute('aria-disabled')).toBe('true');
    expect(boto.getAttribute('aria-busy')).toBe('true');
    expect(boto.disabled).toBe(false);
    fireEvent.click(boto);
    expect(enviant.onClick).not.toHaveBeenCalled();
  });
});

/* Revisió P1-66 (F1) · El node canvia d'acció davall del dit: el segon toc
   d'un doble toc (o d'un doble clic) que hi troba una altra acció no la fa. */
describe('el doble toc al botó redó', () => {
  test('enviar el text i tocar tot seguit «Grava àudio» no obri el micròfon; passat el marge, sí', () => {
    const { passa } = rellotge();
    const onEnvia = vi.fn();
    const adjunts = fesAdjunts();
    render(<Prova inicial="Bon dia" onEnvia={onEnvia} adjunts={adjunts} />);
    fireEvent.click(redo(), { detail: 1 });
    expect(onEnvia).toHaveBeenCalledWith('Bon dia');
    expect(redo().dataset.accio).toBe('grava');
    passa(200);
    expect(fireEvent.click(redo(), { detail: 1 })).toBe(false);
    expect(adjunts.primari.onClick).not.toHaveBeenCalled();
    // Un doble clic encara és el segon toc, encara que el rellotge haja passat el marge.
    passa(1000);
    fireEvent.click(redo(), { detail: 2 });
    expect(adjunts.primari.onClick).not.toHaveBeenCalled();
    fireEvent.click(redo(), { detail: 1 });
    expect(adjunts.primari.onClick).toHaveBeenCalledOnce();
  });

  test('Retorn també compta com a enviar el text', () => {
    const { passa } = rellotge();
    const adjunts = fesAdjunts();
    render(<Prova inicial="Bon dia" adjunts={adjunts} />);
    fireEvent.keyDown(camp(), { key: 'Enter' });
    passa(100);
    fireEvent.click(redo(), { detail: 1 });
    expect(adjunts.primari.onClick).not.toHaveBeenCalled();
  });

  test('Atura i tot seguit «Envia el fitxer» no envia la nota sense escoltar-la; reintentar la mateixa acció, sí', () => {
    const { passa } = rellotge();
    const atura = { clau: 'atura', etiqueta: 'Atura la gravació', icona: Square, onClick: vi.fn() };
    const envia = { clau: 'envia', etiqueta: 'Envia el fitxer', icona: Send, onClick: vi.fn() };
    const { rerender } = render(<Prova adjunts={fesAdjunts({ primari: atura, bloquejat: true })} />);
    fireEvent.click(redo(), { detail: 1 });
    expect(atura.onClick).toHaveBeenCalledOnce();
    rerender(<Prova adjunts={fesAdjunts({ primari: envia, bloquejat: true })} />);
    passa(150);
    fireEvent.click(redo(), { detail: 1 });
    expect(envia.onClick).not.toHaveBeenCalled();
    passa(1000);
    fireEvent.click(redo(), { detail: 1 });
    passa(100);
    fireEvent.click(redo(), { detail: 2 });
    expect(envia.onClick).toHaveBeenCalledTimes(2);
  });

  test('enviar el fitxer amb text al camp i tocar tot seguit «Envia» no tramet el formulari', () => {
    const { passa } = rellotge();
    const onEnvia = vi.fn();
    const envia = { clau: 'envia', etiqueta: 'Envia el fitxer', icona: Send, onClick: vi.fn() };
    const { rerender } = render(<Prova inicial="Mireu" onEnvia={onEnvia} adjunts={fesAdjunts({ primari: envia, bloquejat: true })} />);
    fireEvent.click(redo(), { detail: 1 });
    expect(envia.onClick).toHaveBeenCalledOnce();
    // Enviat de pressa: el mateix node, amb el text al camp, ja és «Envia».
    rerender(<Prova inicial="Mireu" onEnvia={onEnvia} adjunts={fesAdjunts()} />);
    expect(redo().type).toBe('submit');
    passa(100);
    expect(fireEvent.click(redo(), { detail: 1 })).toBe(false);
    expect(onEnvia).not.toHaveBeenCalled();
    expect(camp().value).toBe('Mireu');
    passa(1000);
    fireEvent.click(redo(), { detail: 1 });
    expect(onEnvia).toHaveBeenCalledWith('Mireu');
  });

  test('enviar de pressa el fitxer, amb el camp buit, i tocar tot seguit «Grava àudio» no obri el micròfon', () => {
    const { passa } = rellotge();
    const envia = { clau: 'envia', etiqueta: 'Envia el fitxer', icona: Send, onClick: vi.fn() };
    const adjunts = fesAdjunts();
    const { rerender } = render(<Prova adjunts={fesAdjunts({ primari: envia, bloquejat: true })} />);
    fireEvent.click(redo(), { detail: 1 });
    expect(envia.onClick).toHaveBeenCalledOnce();
    rerender(<Prova adjunts={adjunts} />);
    passa(300);
    fireEvent.click(redo(), { detail: 1 });
    expect(adjunts.primari.onClick).not.toHaveBeenCalled();
    passa(1000);
    fireEvent.click(redo(), { detail: 1 });
    expect(adjunts.primari.onClick).toHaveBeenCalledOnce();
  });

  test('un doble toc a «Grava àudio» (el permís ja donat) no atura tot seguit la gravació', () => {
    const { passa } = rellotge();
    const adjunts = fesAdjunts();
    const atura = { clau: 'atura', etiqueta: 'Atura la gravació', icona: Square, onClick: vi.fn() };
    const { rerender } = render(<Prova adjunts={adjunts} />);
    fireEvent.click(redo(), { detail: 1 });
    expect(adjunts.primari.onClick).toHaveBeenCalledOnce();
    rerender(<Prova adjunts={fesAdjunts({ primari: atura, bloquejat: true })} />);
    passa(100);
    fireEvent.click(redo(), { detail: 1 });
    expect(atura.onClick).not.toHaveBeenCalled();
    passa(1000);
    fireEvent.click(redo(), { detail: 1 });
    expect(atura.onClick).toHaveBeenCalledOnce();
  });

  test('una acció que no és conseqüència de l’anterior no espera (Grava àudio i, de seguida, Envia el fitxer)', () => {
    rellotge();
    const adjunts = fesAdjunts();
    const envia = { clau: 'envia', etiqueta: 'Envia el fitxer', icona: Send, onClick: vi.fn() };
    const { rerender } = render(<Prova adjunts={adjunts} />);
    fireEvent.click(redo(), { detail: 1 });
    rerender(<Prova adjunts={fesAdjunts({ primari: envia, bloquejat: true })} />);
    fireEvent.click(redo(), { detail: 1 });
    expect(envia.onClick).toHaveBeenCalledOnce();
  });
});

describe('el + i el seu menú', () => {
  test('(e) menu button: aria-haspopup, aria-expanded i aria-controls; el focus a la primera opció; només «Fotos i vídeos» i la quota al peu', () => {
    render(<Prova adjunts={fesAdjunts()} />);
    expect(mes().getAttribute('aria-haspopup')).toBe('menu');
    expect(mes().getAttribute('aria-expanded')).toBe('false');
    expect(mes().hasAttribute('aria-controls')).toBe(false);
    expect(mes().compareDocumentPosition(camp()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(mes());
    const menu = screen.getByRole('menu', { name: 'Adjunts del xat' });
    expect(mes().getAttribute('aria-expanded')).toBe('true');
    expect(mes().getAttribute('aria-controls')).toBe(ID_MENU_ADJUNTS);
    expect(menu.id).toBe(ID_MENU_ADJUNTS);
    const opcions = within(menu).getAllByRole('menuitem');
    expect(noms(opcions)).toEqual(['Fotos i vídeos']);
    expect(document.activeElement).toBe(opcions[0]);
    expect(document.getElementById(menu.getAttribute('aria-describedby')).textContent).toBe('0,0 de 20 MB del xat');
    // Cap botó mort (decisió del Mestre, 261028).
    expect(document.body.textContent).not.toMatch(/Document|Arxiu|Contacte|Esdeveniment|Enquesta/);
    // Amb el menú obert, el compositor puja damunt de «Baixa al final».
    expect(camp().closest('form').classList.contains('sdp-xat-compositor--adjunts')).toBe(true);
  });

  test('les fletxes, Inici i Fi recorren les opcions; Tab tanca i deixa el focus al +', () => {
    const opcions = [
      { id: 'fotos', etiqueta: 'Fotos i vídeos', icona: ImagePlus, onTria: vi.fn() },
      { id: 'camera', etiqueta: 'Càmera', icona: ImagePlus, onTria: vi.fn() }
    ];
    render(<Prova adjunts={fesAdjunts({ opcions })} />);
    fireEvent.click(mes());
    const [fotos, camera] = screen.getAllByRole('menuitem');
    fireEvent.keyDown(fotos, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(camera);
    fireEvent.keyDown(camera, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(fotos);
    fireEvent.keyDown(fotos, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(camera);
    fireEvent.keyDown(camera, { key: 'Home' });
    expect(document.activeElement).toBe(fotos);
    fireEvent.keyDown(fotos, { key: 'End' });
    expect(document.activeElement).toBe(camera);
    fireEvent.keyDown(camera, { key: 'Tab' });
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(mes());
  });

  /* Revisió del verificador 261028 · Safari no enfoca un botó en clicar-lo
     (fireEvent.click tampoc mou el focus): tancar el menú amb el mateix +
     torna el focus al +, no el deixa a <body> quan l'opció enfocada se'n va. */
  test('tornar a clicar el + tanca el menú i el focus torna al +, no a <body>', () => {
    render(<Prova adjunts={fesAdjunts()} />);
    fireEvent.click(mes());
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Fotos i vídeos' }));
    fireEvent.click(mes());
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(mes());
    // I el tercer clic el torna a obrir, amb el focus a la primera opció.
    fireEvent.click(mes());
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Fotos i vídeos' }));
  });

  test('(f) Escape tanca primer el menú (el focus torna al +) i després la resposta', () => {
    const onEscapa = vi.fn();
    render(<Prova adjunts={fesAdjunts()} onEscapa={onEscapa} />);
    fireEvent.click(mes());
    const opcio = screen.getByRole('menuitem', { name: 'Fotos i vídeos' });
    expect(fireEvent.keyDown(opcio, { key: 'Escape' })).toBe(false);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(mes());
    expect(onEscapa).not.toHaveBeenCalled();
    // Des del + mateix, amb el menú obert, també el tanca abans de res, i el focus hi torna.
    fireEvent.click(mes());
    fireEvent.keyDown(mes(), { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(mes());
    expect(onEscapa).not.toHaveBeenCalled();
    fireEvent.keyDown(camp(), { key: 'Escape' });
    expect(onEscapa).toHaveBeenCalledOnce();
  });

  test('(g) el menú i el calaix d’emoticones no s’obrin mai alhora', async () => {
    render(<Prova adjunts={fesAdjunts()} />);
    fireEvent.click(mes());
    expect(screen.getByRole('menu')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Emoticones' }), { detail: 1 });
    expect(screen.queryByRole('menu')).toBeNull();
    expect(mes().getAttribute('aria-expanded')).toBe('false');
    await waitFor(() => expect(screen.getByRole('dialog', { name: 'Emoticones' })).toBeTruthy());
    fireEvent.click(mes());
    expect(screen.queryByRole('dialog', { name: 'Emoticones' })).toBeNull();
    expect(screen.getByRole('menu')).toBeTruthy();
  });

  test('(h) clicar fora el tanca sense moure el focus; clicar el + el torna a tancar', () => {
    render(<Prova adjunts={fesAdjunts()} />);
    fireEvent.click(mes());
    fireEvent.pointerDown(screen.getByRole('menuitem'));
    expect(screen.getByRole('menu')).toBeTruthy();
    fireEvent.pointerDown(camp());
    expect(screen.queryByRole('menu')).toBeNull();
    fireEvent.click(mes());
    fireEvent.pointerDown(mes());
    fireEvent.click(mes());
    expect(screen.queryByRole('menu')).toBeNull();
    fireEvent.click(mes());
    const fora = screen.getByRole('button', { name: 'Fora' });
    fora.focus();
    fireEvent.pointerDown(fora);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(fora);
  });

  test('(h) amb el focus al menú, clicar el botó redó (que no pren el focus) l’envia i el focus queda al +, no a <body>', async () => {
    const onEnvia = vi.fn();
    render(<Prova inicial="Bon dia" onEnvia={onEnvia} adjunts={fesAdjunts()} />);
    fireEvent.click(mes());
    expect(document.activeElement).toBe(screen.getByRole('menuitem'));
    await act(async () => { fireEvent.pointerDown(redo()); });
    expect(screen.queryByRole('menu')).toBeNull();
    expect(fireEvent.mouseDown(redo())).toBe(false);
    fireEvent.click(redo(), { detail: 1 });
    expect(onEnvia).toHaveBeenCalledWith('Bon dia');
    expect(document.activeElement).toBe(mes());
  });

  test('tornar al camp (sense clicar, p. ex. «Respon») tanca el menú', () => {
    render(<Prova adjunts={fesAdjunts()} />);
    fireEvent.click(mes());
    expect(screen.getByRole('menu')).toBeTruthy();
    act(() => { camp().focus(); });
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(camp());
  });

  test('(h) a l’encastat (arrel d’ombra): fora del menú dins del giny, i al web amfitrió, el tanquen', () => {
    const amfitrio = document.createElement('button');
    const host = document.createElement('div');
    document.body.append(amfitrio, host);
    const shadow = host.attachShadow({ mode: 'open' });
    const arrel = document.createElement('div');
    shadow.append(arrel);
    render(<Prova adjunts={fesAdjunts()} />, { container: arrel });
    const dins = within(arrel);
    fireEvent.click(dins.getByRole('button', { name: 'Adjunta' }));
    expect(shadow.activeElement).toBe(dins.getByRole('menuitem'));
    fireEvent.pointerDown(dins.getByRole('textbox'));
    expect(dins.queryByRole('menu')).toBeNull();
    fireEvent.click(dins.getByRole('button', { name: 'Adjunta' }));
    fireEvent.pointerDown(amfitrio);
    expect(dins.queryByRole('menu')).toBeNull();
    amfitrio.remove();
    host.remove();
  });

  test('(i) amb els adjunts bloquejats, el menú es tanca i el + porta aria-disabled (no disabled) i no l’obri', () => {
    const { rerender } = render(<Prova adjunts={fesAdjunts()} />);
    fireEvent.click(mes());
    expect(screen.getByRole('menu')).toBeTruthy();
    rerender(<Prova adjunts={fesAdjunts({ bloquejat: true })} />);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(mes().getAttribute('aria-disabled')).toBe('true');
    expect(mes().disabled).toBe(false);
    fireEvent.click(mes());
    expect(screen.queryByRole('menu')).toBeNull();
    // Desbloquejat, el menú no torna tot sol.
    rerender(<Prova adjunts={fesAdjunts()} />);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(mes().hasAttribute('aria-disabled')).toBe(false);
  });

  test('(i) el + aria-disabled no fa res: amb el calaix d’emoticones obert, clicar-lo no el tanca', async () => {
    render(<Prova adjunts={fesAdjunts({ bloquejat: true })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Emoticones' }), { detail: 1 });
    await waitFor(() => expect(screen.getByRole('dialog', { name: 'Emoticones' })).toBeTruthy());
    fireEvent.pointerDown(mes());
    fireEvent.click(mes());
    expect(screen.getByRole('dialog', { name: 'Emoticones' })).toBeTruthy();
    expect(screen.queryByRole('menu')).toBeNull();
  });

  test('en una columna baixa, el menú no passa de l’espai fins a dalt de la conversa (amb l’alçada de maquetació)', () => {
    render(
      <AppGridContext.Provider value={{ mida: 'ample', setPanellObert: vi.fn() }}>
        <div className="sdp-xat-conversa">
          <ol className="sdp-xat-missatges" />
          <Prova adjunts={fesAdjunts()} />
        </div>
      </AppGridContext.Provider>
    );
    const conversa = document.querySelector('.sdp-xat-conversa');
    conversa.getBoundingClientRect = () => ({ top: 300, bottom: 480, left: 0, right: 400, width: 400, height: 180 });
    const proto = HTMLElement.prototype.getBoundingClientRect;
    const alcada = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
    // L'entrada l'escala a 0,96: el rectangle fa 162 i la maquetació, 169.
    HTMLElement.prototype.getBoundingClientRect = function caixa() {
      if (this.classList.contains('sdp-xat-menu--adjunts')) return { top: 303, bottom: 465, left: 8, right: 232, width: 224, height: 162 };
      return proto.call(this);
    };
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get() { return this.classList.contains('sdp-xat-menu--adjunts') ? 169 : 0; }
    });
    const menu = () => document.querySelector('.sdp-xat-menu--adjunts');
    try {
      fireEvent.click(screen.getAllByRole('button', { name: 'Adjunta' })[0]);
      expect(menu().style.maxBlockSize).toBe('165px');
      // Amb poc espai, mai per davall d'una opció i el coixí.
      conversa.getBoundingClientRect = () => ({ top: 450, bottom: 480, left: 0, right: 400, width: 400, height: 30 });
      act(() => { window.dispatchEvent(new Event('resize')); });
      expect(menu().style.maxBlockSize).toBe('64px');
      // Amb espai de sobra, mana el CSS.
      conversa.getBoundingClientRect = () => ({ top: 0, bottom: 480, left: 0, right: 400, width: 400, height: 480 });
      act(() => { window.dispatchEvent(new Event('resize')); });
      expect(menu().style.maxBlockSize).toBe('');
    } finally {
      HTMLElement.prototype.getBoundingClientRect = proto;
      if (alcada) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', alcada);
      else delete HTMLElement.prototype.offsetHeight;
    }
  });

  test('sense llista de missatges (l’espècimen de Disseny), el menú no porta sostre en línia: mana el CSS', () => {
    render(
      <AppGridContext.Provider value={{ mida: 'ample', setPanellObert: vi.fn() }}>
        <div className="sdp-xat-conversa">
          <Prova adjunts={fesAdjunts()} />
        </div>
      </AppGridContext.Provider>
    );
    // La conversa comença al formulari i el menú obri 4px per damunt: abans, 64px fixos.
    document.querySelector('.sdp-xat-conversa').getBoundingClientRect = () => ({ top: 415, bottom: 480, left: 0, right: 400, width: 400, height: 65 });
    const proto = HTMLElement.prototype.getBoundingClientRect;
    const alcada = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
    HTMLElement.prototype.getBoundingClientRect = function caixa() {
      if (this.classList.contains('sdp-xat-menu--adjunts')) return { top: 298, bottom: 411, left: 8, right: 232, width: 224, height: 113 };
      return proto.call(this);
    };
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get() { return this.classList.contains('sdp-xat-menu--adjunts') ? 113 : 0; }
    });
    const menu = () => document.querySelector('.sdp-xat-menu--adjunts');
    try {
      fireEvent.click(mes());
      expect(menu().style.maxBlockSize).toBe('');
      act(() => { window.dispatchEvent(new Event('resize')); });
      expect(menu().style.maxBlockSize).toBe('');
    } finally {
      HTMLElement.prototype.getBoundingClientRect = proto;
      if (alcada) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', alcada);
      else delete HTMLElement.prototype.offsetHeight;
    }
  });

  test('(j) triar una opció la crida dins del mateix gest, tanca el menú i torna el focus al +', () => {
    const adjunts = fesAdjunts();
    render(<Prova adjunts={adjunts} />);
    fireEvent.click(mes());
    fireEvent.click(screen.getByRole('menuitem', { name: 'Fotos i vídeos' }));
    // Cap await: el selector de fitxers d'iOS només s'obri des del gest.
    expect(adjunts.opcions[0].onTria).toHaveBeenCalledOnce();
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(mes());
  });
});

/* Els controls de veres amb el Compositor: el menú que munta ControlsAdjunt. */
const deferred = () => { let resolve; const promise = new Promise((r) => { resolve = r; }); return { promise, resolve }; };
function Barra(props) {
  const [valor, setValor] = useState('');
  return (
    <AppGridContext.Provider value={{ mida: 'ample', setPanellObert: vi.fn() }}>
      <ControlsAdjunt usuariId={props.usuariId} fil={{ id: 'fil-A' }} servei={props.servei} onEnvia={vi.fn()} t={t}>
        {(adjunts) => <Compositor valor={valor} onCanvia={setValor} onEnvia={() => setValor('')} t={t} adjunts={adjunts} />}
      </ControlsAdjunt>
    </AppGridContext.Provider>
  );
}
const serveiAmbQuota = () => ({ teCapacitat: () => true, quotaXat: vi.fn().mockResolvedValue({ usats: 0, limit: 20_000_000 }) });

describe('el menú de ControlsAdjunt', () => {
  test('a l’escriptori, només «Fotos i vídeos»; sense micròfon, l’avís viu al peu del menú i enlloc més', async () => {
    const clics = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    render(<Barra usuariId="menu-escriptori" servei={serveiAmbQuota()} />);
    await screen.findByRole('button', { name: 'Adjunta' });
    expect(screen.queryByText('Este navegador no permet gravar àudio.')).toBeNull();
    fireEvent.click(mes());
    expect(noms(screen.getAllByRole('menuitem'))).toEqual(['Fotos i vídeos']);
    expect([...document.getElementById('xat-message-adjunts-peu').children].map((p) => p.textContent))
      .toEqual(['0,0 de 20 MB del xat', 'Este navegador no permet gravar àudio.']);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Fotos i vídeos' }));
    expect(clics).toHaveBeenCalledOnce();
    expect(clics.mock.contexts[0]).toBe(screen.getByLabelText('Tria una foto o un vídeo de fins a 10 segons'));
    expect(screen.queryByLabelText('Fes una foto amb la càmera')).toBeNull();
  });

  test('en tàctil, «Càmera» obri la càmera del darrere (image/*, capture) pel mateix camí de preparació', async () => {
    tactil(true);
    const clics = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    m.preparaAdjunt.mockResolvedValue({ id: 'foto', tipus: 'imatge', fitxer: new Blob(['f'], { type: 'image/webp' }) });
    vi.stubGlobal('URL', { createObjectURL: vi.fn().mockReturnValue('blob:camera'), revokeObjectURL: vi.fn() });
    render(<Barra usuariId="menu-tactil" servei={serveiAmbQuota()} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Adjunta' }));
    expect(noms(screen.getAllByRole('menuitem'))).toEqual(['Fotos i vídeos', 'Càmera']);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Càmera' }));
    const camera = screen.getByLabelText('Fes una foto amb la càmera');
    expect(clics.mock.contexts).toEqual([camera]);
    expect(camera.getAttribute('accept')).toBe('image/*');
    expect(camera.getAttribute('capture')).toBe('environment');
    expect(camera.tabIndex).toBe(-1);
    const fitxer = new Blob(['jpeg'], { type: 'image/jpeg' });
    fireEvent.change(camera, { target: { files: [fitxer] } });
    expect(await screen.findByAltText('Foto adjunta')).toBeTruthy();
    expect(m.preparaAdjunt.mock.calls[0][0]).toBe(fitxer);
    expect(screen.getByRole('button', { name: 'Envia el fitxer' })).toBe(redo());
  });

  test('la safata buida no ocupa lloc ni és cap grup; amb feina, és el grup «Adjunts del xat» amb Cancel·la', async () => {
    const preparant = deferred();
    m.preparaAdjunt.mockReturnValueOnce(preparant.promise);
    vi.stubGlobal('URL', { createObjectURL: vi.fn().mockReturnValue('blob:foto'), revokeObjectURL: vi.fn() });
    const vista = render(<Barra usuariId="safata" servei={serveiAmbQuota()} />);
    await screen.findByRole('button', { name: 'Adjunta' });
    const safata = vista.container.querySelector('.sdp-xat-adjunts');
    expect(safata.className).toBe('sdp-xat-adjunts');
    expect(safata.hasAttribute('role')).toBe(false);
    expect(screen.queryByRole('group', { name: 'Adjunts del xat' })).toBeNull();
    // Cap línia fixa de quota ni píndoles: la regió viva buida i els selectors amagats.
    expect(safata.querySelector('.sdp-xat-pindola')).toBeNull();
    expect([...safata.children].map((n) => n.tagName)).toEqual(['P', 'INPUT']);
    expect(screen.getByRole('status').textContent).toBe('');
    fireEvent.change(screen.getByLabelText('Tria una foto o un vídeo de fins a 10 segons'), { target: { files: [new Blob(['f'], { type: 'image/jpeg' })] } });
    expect(await screen.findByRole('group', { name: 'Adjunts del xat' })).toBe(safata);
    expect(safata.classList.contains('sdp-xat-adjunts--activa')).toBe(true);
    expect(mes().getAttribute('aria-disabled')).toBe('true');
    await act(async () => { preparant.resolve({ id: 'foto', tipus: 'imatge', fitxer: new Blob(['f'], { type: 'image/webp' }) }); });
    await screen.findByAltText('Foto adjunta');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel·la' }));
    await waitFor(() => expect(safata.className).toBe('sdp-xat-adjunts'));
    expect(mes().hasAttribute('aria-disabled')).toBe(false);
  });

  test('un error de preparació, sense res més a fer, encara activa la safata: el grup amb l’alerta', async () => {
    m.preparaAdjunt.mockRejectedValueOnce(new Error('No hem pogut preparar el fitxer.'));
    const vista = render(<Barra usuariId="safata-error" servei={serveiAmbQuota()} />);
    await screen.findByRole('button', { name: 'Adjunta' });
    fireEvent.change(screen.getByLabelText('Tria una foto o un vídeo de fins a 10 segons'), { target: { files: [new Blob(['f'], { type: 'image/jpeg' })] } });
    expect(await screen.findByRole('alert')).toBeTruthy();
    const safata = vista.container.querySelector('.sdp-xat-adjunts');
    expect(safata.classList.contains('sdp-xat-adjunts--activa')).toBe(true);
    expect(screen.getByRole('group', { name: 'Adjunts del xat' })).toBe(safata);
    expect(screen.queryByRole('button', { name: 'Cancel·la' })).toBeNull();
  });

  test('mentre es prepara una foto, el botó redó no és «Grava àudio»', async () => {
    vi.stubGlobal('navigator', { ...globalThis.navigator, mediaDevices: { getUserMedia: vi.fn() } });
    const preparant = deferred();
    m.preparaAdjunt.mockReturnValueOnce(preparant.promise);
    vi.stubGlobal('URL', { createObjectURL: vi.fn().mockReturnValue('blob:foto'), revokeObjectURL: vi.fn() });
    render(<Barra usuariId="preparant-micro" servei={serveiAmbQuota()} />);
    expect(await screen.findByRole('button', { name: 'Grava àudio' })).toBe(redo());
    fireEvent.change(screen.getByLabelText('Tria una foto o un vídeo de fins a 10 segons'), { target: { files: [new Blob(['f'], { type: 'image/jpeg' })] } });
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Preparant el fitxer…'));
    expect(screen.queryByRole('button', { name: 'Grava àudio' })).toBeNull();
    expect(redo().disabled).toBe(true);
    await act(async () => { preparant.resolve({ id: 'foto', tipus: 'imatge', fitxer: new Blob(['f'], { type: 'image/webp' }) }); });
    expect(await screen.findByRole('button', { name: 'Envia el fitxer' })).toBe(redo());
  });

  test('(F1) doble toc a «Envia»: s’envia el text i el segon toc no obri el micròfon', async () => {
    vi.stubGlobal('navigator', { ...globalThis.navigator, mediaDevices: { getUserMedia: vi.fn() } });
    m.gravaVeu.mockResolvedValue({ atura: vi.fn(), cancella: vi.fn(), resultat: new Promise(() => {}) });
    render(<Barra usuariId="doble-toc" servei={serveiAmbQuota()} />);
    await screen.findByRole('button', { name: 'Grava àudio' });
    fireEvent.change(camp(), { target: { value: 'Bon dia' } });
    fireEvent.click(redo(), { detail: 1 });
    await act(async () => {});
    expect(camp().value).toBe('');
    fireEvent.click(redo(), { detail: 1 });
    await act(async () => {});
    expect(m.gravaVeu).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Grava àudio' })).toBe(redo());
    expect(screen.getByRole('status').textContent).toBe('');
  });
});

/* (k) A nivell de Conversa: el + i el micròfon només per a qui pot enviar
   fitxers en esta conversa (onSendMedia el dona XatSection només en remot,
   amb sessió i fora de la IAIA). */
const FIL = { id: 'f-barra', tipus: 'grup', name: 'Comissió', potEscriure: true, llegitFinsSeq: 0 };
const moderacio = (bloquejada) => ({
  disponible: true,
  potBloquejar: true,
  objectiuDeMissatge: () => null,
  objectiuDeContrapart: () => ({ tipus: 'persona', id: 'pep', autor: { nom: 'Pep' } }),
  esPersonaBloquejada: () => bloquejada,
  demanaDenuncia: vi.fn(),
  demanaBloqueig: vi.fn(),
  desbloqueja: vi.fn().mockResolvedValue(undefined)
});
const pintaConversa = (extra = {}) => render(
  <MemoryRouter>
    <AppGridContext.Provider value={{ mida: 'ample' }}>
      <Conversa
        fil={FIL} messages={[]} onSendMessage={vi.fn()} onSendMedia={vi.fn()} usuariAdjunts={`conversa-${Object.keys(extra).join('-')}`}
        onBack={vi.fn()} onEnviaAlBloc={vi.fn()} onCopia={vi.fn()} hiHaMes={false} carregantMes={false}
        onCarregaMes={vi.fn()} onReintenta={vi.fn()} onDescarta={vi.fn()} onMarcaVist={vi.fn()} locale="ca-ES" t={t}
        {...extra}
      />
    </AppGridContext.Provider>
  </MemoryRouter>
);

describe('(k) Conversa: cap adjunt per a qui no en pot enviar', () => {
  beforeEach(() => { m.quotaXat.mockResolvedValue({ usats: 0, limit: 20_000_000, pendents: [] }); });

  test('amb onSendMedia i la quota, el + hi és', async () => {
    pintaConversa();
    expect(await screen.findByRole('button', { name: 'Adjunta' })).toBeTruthy();
  });

  test.each([
    ['sense onSendMedia (convidat, llavor, IAIA)', { onSendMedia: null }],
    ['fora de la conversa (participant false)', { fil: { ...FIL, participant: false } }],
    ['amb la contrapart bloquejada', { fil: { ...FIL, id: 'd-pep', tipus: 'directe', name: 'Pep' }, moderacio: moderacio(true) }]
  ])('%s: ni +, ni micròfon, ni safata, i la quota no es llig', async (_cas, extra) => {
    vi.stubGlobal('navigator', { ...globalThis.navigator, mediaDevices: { getUserMedia: vi.fn() } });
    const vista = pintaConversa(extra);
    const campDeLaConversa = screen.getByRole('textbox', { name: 'Escriu un missatge' });
    await act(async () => {});
    expect(m.quotaXat).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Adjunta' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Grava àudio' })).toBeNull();
    expect(vista.container.querySelector('.sdp-xat-adjunts')).toBeNull();
    expect(screen.getByRole('textbox', { name: 'Escriu un missatge' })).toBe(campDeLaConversa);
  });

  test('un fil de només lectura: l’avís en lloc del compositor, i cap adjunt', async () => {
    const vista = pintaConversa({ fil: { ...FIL, potEscriure: false, avisNomesLectura: 'Només lectura.' } });
    await act(async () => {});
    expect(m.quotaXat).not.toHaveBeenCalled();
    expect(screen.queryByRole('textbox', { name: 'Escriu un missatge' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Adjunta' })).toBeNull();
    expect(vista.container.querySelector('.sdp-xat-adjunts')).toBeNull();
  });
});

/* ── La geometria als fulls (jsdom no resol la cascada) ── */
const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const modules = llig('src/css/modules.css').replace(/\/\*[\s\S]*?\*\//g, '');
const net = (text) => text.replace(/\s+/g, ' ').trim();
/** El valor d'una propietat a les regles d'un selector exacte (l'última guanya). */
function valor(selector, propietat) {
  let trobat = null;
  for (const regla of modules.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = net(regla[1].split(';').pop()).split(',').map(net);
    if (!selectors.includes(selector)) continue;
    for (const declaracio of regla[2].split(';')) {
      const [prop, ...resta] = declaracio.split(':');
      if (net(prop || '') === propietat) trobat = net(resta.join(':'));
    }
  }
  return trobat;
}

describe('la geometria de la barra única', () => {
  test('el +, la carona, [N] i el botó redó són dianes de 48px (--sdp-touch) amb el radi de botó', () => {
    for (const selector of ['.sdp-xat-compositor__adjunta', '.sdp-xat-compositor__emojis', '.sdp-xat-compositor__negreta', '.sdp-xat-compositor__envia']) {
      expect(valor(selector, 'width'), selector).toBe('var(--sdp-touch)');
      expect(valor(selector, 'height'), selector).toBe('var(--sdp-touch)');
      expect(valor(selector, 'border-radius'), selector).toBe('var(--sdp-radi-boto)');
    }
    expect(valor('.sdp-xat-menu__item', 'min-height')).toBe('var(--sdp-touch)');
  });

  test('la carona entra al camp només amb el modificador: el camp de ConsultaIAIA no canvia', () => {
    expect(valor('.sdp-xat-compositor__camp--carona', 'grid-template-columns')).toBe('auto minmax(0, 1fr)');
    expect(valor('.sdp-xat-compositor__camp--carona > .sdp-xat-compositor__emojis', 'grid-area')).toBe('1 / 1 / 2 / 2');
    expect(valor('.sdp-xat-compositor__camp--carona > .sdp-xat-compositor__textarea', 'grid-area')).toBe('1 / 2 / 2 / 3');
    expect(valor('.sdp-xat-compositor__camp', 'grid-template-columns')).toBeNull();
    expect(valor('.sdp-xat-compositor__camp', 'display')).toBe('grid');
    /* El coixí curt, a l'esquerra en físic (la carona hi és sempre): amb
       dir="auto" i text en àrab o en hebreu, l'inici lògic seria la dreta. El
       mirall porta el mateix: l'alçada continua bé. */
    for (const selector of ['.sdp-xat-compositor__camp--carona::after', '.sdp-xat-compositor__camp--carona > .sdp-xat-compositor__textarea']) {
      expect(valor(selector, 'padding-left'), selector).toBe('var(--sdp-space-1)');
      expect(valor(selector, 'padding-inline-start'), selector).toBeNull();
    }
    const consulta = llig('src/sections/xat/components/ConsultaIAIA.jsx');
    expect(consulta).toMatch(/className="sdp-xat-compositor__camp"/);
    expect(consulta).not.toMatch(/sdp-xat-compositor__camp--carona/);
  });

  test('IDEA-53 · [N] a la tercera columna, només amb els dos modificadors; el mirall i el textarea, amb el mateix coixí', () => {
    expect(valor('.sdp-xat-compositor__camp--carona.sdp-xat-compositor__camp--negreta', 'grid-template-columns')).toBe('auto minmax(0, 1fr) auto');
    expect(valor('.sdp-xat-compositor__camp--negreta > .sdp-xat-compositor__negreta', 'grid-area')).toBe('1 / 3 / 2 / 4');
    for (const selector of ['.sdp-xat-compositor__camp--negreta::after', '.sdp-xat-compositor__camp--negreta > .sdp-xat-compositor__textarea']) {
      expect(valor(selector, 'padding-right'), selector).toBe('var(--sdp-space-1)');
    }
    /* L'àrea tàctil mai per davall del mínim de la casa. */
    expect(valor('.sdp-xat-compositor__negreta', 'min-width')).toBe('var(--sdp-touch-min)');
    expect(valor('.sdp-xat-compositor__negreta', 'min-height')).toBe('var(--sdp-touch-min)');
    /* La negreta de la bombolla: l'extra de la casa, no el «bolder» del navegador. */
    expect(valor('.sdp-xat-bombolla__text strong', 'font-weight')).toBe('var(--sdp-pes-extra)');
    const consulta = llig('src/sections/xat/components/ConsultaIAIA.jsx');
    expect(consulta).not.toMatch(/sdp-xat-compositor__camp--negreta/);
  });

  test('la safata sense feina col·lapsa a 0: cap coixí ni filet (abans, 151px fixos en repòs)', () => {
    expect(valor('.sdp-xat-adjunts:not(.sdp-xat-adjunts--activa)', 'padding-block')).toBe('0');
    expect(valor('.sdp-xat-adjunts:not(.sdp-xat-adjunts--activa)', 'border-top')).toBe('0');
    const controls = llig('src/sections/xat/components/ControlsAdjunt.jsx');
    expect(controls).not.toMatch(/sdp-xat-adjunts__quota|sdp-xat-adjunts__accions/);
    /* La regió viva dels passos sempre hi és: buida, sense marge (és un ítem
       flex i el marge no col·lapsa cap a fora; sense la regla, 4px fixos). */
    /* tractor-vocabulari (261030) · El full dels adjunts és el bloc AdjuntXat de modules.css. */
    const moduls = llig('src/css/modules.css');
    const inici = moduls.indexOf('/* ═══ BLOC AdjuntXat · ');
    const fi = moduls.indexOf('/* ═══ FI DEL BLOC AdjuntXat ═══ */');
    expect(inici).toBeGreaterThan(-1);
    expect(fi).toBeGreaterThan(inici);
    const adjuntXat = net(moduls.slice(inici, fi).replace(/\/\*[\s\S]*?\*\//g, ''));
    expect(adjuntXat).toContain('.sdp-xat-adjunts .sdp-xat-adjunts__estat:empty { margin: 0; }');
  });

  test('el menú obri cap amunt des de la vora de dalt del compositor, i les regles noves són de la graella de 4px', () => {
    expect(valor('.sdp-xat-menu--adjunts', 'top')).toBe('auto');
    expect(valor('.sdp-xat-menu--adjunts', 'bottom')).toBe('calc(100% + var(--sdp-space-1))');
    expect(valor('.sdp-xat-compositor--adjunts', 'z-index')).toBe('3');
    expect(valor('.sdp-xat-compositor__envia[aria-disabled="true"]', 'opacity')).toBe('0.5');
    // En una columna baixa no es retalla: té sostre i es desplaça (vh primer, dvh després).
    expect(valor('.sdp-xat-menu--adjunts', 'max-block-size')).toBe('min(20rem, 50dvh)');
    expect(modules).toMatch(/\.sdp-xat-menu--adjunts \{[^}]*max-block-size: min\(20rem, 50vh\);\s*max-block-size: min\(20rem, 50dvh\);/);
    expect(valor('.sdp-xat-menu--adjunts', 'overflow-y')).toBe('auto');
    expect(valor('.sdp-xat-menu--adjunts', 'overscroll-behavior')).toBe('contain');
    /* Aria-disabled («Enviant…») no s'enfosquix davall del ratolí: torna al
       blau de repòs, i va darrere de la regla de :hover (mateixa especificitat). */
    expect(valor('.sdp-xat-compositor__envia[aria-disabled="true"]:hover', 'background')).toBe(valor('.sdp-xat-compositor__envia', 'background'));
    expect(modules.indexOf('.sdp-xat-compositor__envia[aria-disabled="true"]:hover'))
      .toBeGreaterThan(modules.indexOf('.sdp-xat-compositor__envia:hover:not(:disabled)'));
    for (const selector of ['.sdp-xat-compositor__adjunta', '.sdp-xat-menu--adjunts', '.sdp-xat-menu__peu', '.sdp-xat-adjunts__fila']) {
      for (const regla of modules.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        if (!net(regla[1].split(';').pop()).split(',').map(net).includes(selector)) continue;
        expect(regla[2].replace(/\b[12]px solid\b/g, ''), selector).not.toMatch(/\d+px|#[0-9a-f]{3,8}\b/i);
      }
    }
  });

  test('les línies del peu del menú (<p>) fan el meta suau del peu, no la prosa de la regla p de base.css', () => {
    expect(valor('.sdp-xat-menu__peu', 'font-size')).toBe('var(--sdp-text-meta)');
    expect(valor('.sdp-xat-menu__peu', 'color')).toBe('var(--sdp-text-suau)');
    expect(valor('.sdp-xat-menu__peu p', 'margin')).toBe('0');
    for (const propietat of ['font-size', 'line-height', 'color']) {
      expect(valor('.sdp-xat-menu__peu p', propietat), propietat).toBe('inherit');
    }
    // A components, damunt de legacy (on viu la regla p): la cascada la deixa guanyar.
    const davant = modules.slice(0, modules.indexOf('.sdp-xat-menu__peu p {')).match(/@layer \w+/g);
    expect(davant.at(-1)).toBe('@layer components');
  });
});
