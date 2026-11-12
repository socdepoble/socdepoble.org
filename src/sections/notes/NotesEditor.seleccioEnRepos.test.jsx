/* Onada R21 · AH-02 (pla 261112_1430: «títol/cos seleccionables en repòs +
   clic Editar») · Una nota de la persona que ja porta text s'obri en REPÒS:
   el títol, el subtítol, l'entradilla i el cos són text del document, que es
   llig, se selecciona i es copia amb naturalitat, i un clic, un doble clic o
   un toc no hi posen cap cursor ni obrin el teclat (cap contenteditable, cos
   de TipTap en lectura, eines de format apagades). L'edició arriba per una
   acció explícita: el botó «Editar», damunt de l'H1, que torna els camps i el
   cos editables i porta el focus al títol. Esta prova fixa que:
     · en repòs, el text és fora de qualsevol control, cap regla
       `user-select: none` dels fulls de l'App no el toca i no és editable;
     · clicar o tocar el text (i l'espai en blanc del full) no activa
       l'edició ni mou la selecció, i copiar no s'anul·la;
     · obrir la nota o prémer «Editar» no escriu res (ni capa local ni
       servidor);
     · després d'«Editar», escriure edita i desa, i en tornar la nota desada
       (revisió nova) el camp continua editable: cap readOnly enganxat;
     · entrar a un camp i eixir-ne sense escriure no el torna a desar (el
       desat fantasma que passava una nota publicada a «pendent»);
     · cada nota que s'obri torna a començar en repòs;
     · la doctrina de sempre es queda: la còpia de prova del Foraster (pla
       260924_1710 §3.4: «la primera tecla ja edita»), la «Nota sense títol»
       preparada (P4) i una nota sense text s'obrin en edició, i una nota que
       s'omple mentre s'hi escriu no torna mai al repòs.
   La fila de la llista (NotaFitxa, button.sdp-gestor-fitxa) no canvia: el
   text seleccionable és el del detall, no el del botó de la llista
   (NotaFitxa.test.jsx).
   Tot de veres (NotesEditor, DocumentEditor, la closca i el TipTap); només la
   barra rica és fora (se'n capturen les props) i el context de Notes és un
   doble amb espies. jsdom no aplica els fulls ni posa el cursor en clicar: la
   prova en navegador de veres va a part (notes del lliurament). */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { sanitizeHtml } from '../../utils/sanitize.js';
import { ESTAT_BUIT, EXEC_BUIT } from '../../components/universal/richText/toolbarContract.js';
import { NotaPreparadaContext } from './notaPreparada.js';

const m = vi.hoisted(() => ({
  editor: null, barra: null, estatBarra: null, execBarra: null, setLocal: null, desa: null,
  sessio: null
}));
vi.mock('./NotesContext', () => ({
  useNotes: () => ({
    noteFolders: [], t: (_clau, reserva) => reserva, config: { tenantId: '00000000-0000-4000-8000-0000000000a1' },
    workspaceKey: 'sessio-ah02', notes: [], notesComplete: true, scopeKey: 'ambit-ah02',
    setLocalNoteField: m.setLocal, saveNoteField: m.desa,
    mouNota: vi.fn(), esborraNota: vi.fn(), potEsborrar: false, publishNote: vi.fn(), compartirNota: vi.fn()
  }),
  etiquetesDeNota: () => []
}));
vi.mock('./useEstatDesamentNota.js', async (importOriginal) => ({
  ...(await importOriginal()),
  useEstatDesamentNota: () => ({ estat: 'net', problema: null, quarantena: [] })
}));
/* El motor TipTap és el de veres: només es captura la instància, l'estat que
   en llig la barra i les props que rep la barra (que no es pinta). */
vi.mock('../../components/universal/richText', async (importOriginal) => ({
  ...(await importOriginal()),
  useTipTapToolbarAdapter: (editor) => { m.editor = editor; return { state: m.estatBarra, exec: m.execBarra }; },
  UniversalRichTextToolbar: (props) => { m.barra = props; return null; }
}));
vi.mock('../../app/contexts/UIContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIState: () => ({ locale: 'ca', externalConfig: {} }),
  useUIActions: () => ({ normalizeSearchText: (s) => s, t: (_clau, text) => text }),
  useUIStateOpcional: () => null
}));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({
  useIdentitat: () => ({ actor: { tipus: 'persona', id: 'U', nom: 'Pepa' }, actorId: 'U', memberships: [] })
}));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ agents: [], towns: [], pages: [] }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => m.sessio, ESTAT: { DINS: 'dins' } }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(), Link: 'a', useSearchParams: () => [new URLSearchParams(''), vi.fn()]
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ status: 'ready', feedPosts: [], events: [], marketItems: [] }) }));
vi.mock('../../data/backendPort.js', () => ({ uploadToStorage: vi.fn(), promoteToPublic: vi.fn(), teCapacitat: () => false }));

import NotesEditor from './NotesEditor.jsx';

const TITOL = 'Festa de la tomaca';
const COS = 'La plaça s’omple de cistelles a punta de dia.';
const NOTA = Object.freeze({
  id: 'n-ah02', title: TITOL, subtitle: 'Al raval', lead: '', content: `<p>${COS}</p>`,
  folderId: 'f-notes', isPublished: false, revision: 3, contentLoaded: true
});
const ALTRA = Object.freeze({
  id: 'n-ah02-b', title: 'Sega del forment', subtitle: '', lead: '', content: '<p>Al juny.</p>',
  folderId: 'f-notes', isPublished: false, revision: 1, contentLoaded: true
});

beforeEach(() => {
  m.editor = null;
  m.barra = null;
  m.estatBarra = Object.freeze({ disponible: true, actiu: {}, pot: { negreta: true } });
  m.execBarra = vi.fn(() => true);
  m.setLocal = vi.fn();
  m.desa = vi.fn(async () => true);
  m.sessio = { currentUser: { id: 'U' }, estat: 'dins' };
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const camps = (container) => ({
  titol: container.querySelector('.editor-title-input'),
  subtitol: container.querySelector('.editor-subtitle-input'),
  entradilla: container.querySelector('.editor-lead-input'),
  cos: m.editor.view.dom
});
const munta = (nota = NOTA) => {
  const vista = render(<NotesEditor activeNote={nota} />);
  const { titol, subtitol, entradilla, cos } = camps(vista.container);
  const paragraf = cos.querySelector('p');
  return { vista, titol, subtitol, entradilla, cos, paragraf };
};
const botoEditar = () => screen.queryByRole('button', { name: 'Editar' });
/* Cap escriptura de cap camp: ni la capa local ni el servidor. */
const capEscriptura = () => {
  expect(m.setLocal).not.toHaveBeenCalled();
  expect(m.desa).not.toHaveBeenCalled();
};
/* Teclejar com ho fa el navegador en un contenteditable: el DOM canvia i ix `input`. */
const tecleja = (camp, html) => {
  camp.innerHTML = sanitizeHtml(html);
  fireEvent.input(camp);
};
/* En repòs: cap camp editable, el cos en lectura i les eines de format apagades.
   Gauntlet R21 (ui_fase2-02) · Un subtítol o una entradilla buits no es pinten
   en repòs: només es miren els camps que hi són. */
const esEnRepos = ({ titol, subtitol, entradilla, cos }) => {
  for (const camp of [titol, subtitol, entradilla].filter(Boolean)) {
    expect(camp.hasAttribute('contenteditable')).toBe(false);
    expect(camp.hasAttribute('data-placeholder')).toBe(false);
  }
  expect(cos.getAttribute('contenteditable')).toBe('false');
  // El lector de pantalla ho sap: el camp del cos és de només lectura.
  expect(cos.getAttribute('aria-readonly')).toBe('true');
  expect(m.editor.isEditable).toBe(false);
  expect(m.barra.state).toBe(ESTAT_BUIT);
  expect(m.barra.exec).toBe(EXEC_BUIT);
  expect(botoEditar()).not.toBeNull();
};
/* En edició: els camps i el cos editables, la barra viva i cap «Editar». */
const esEnEdicio = ({ titol, subtitol, entradilla, cos }) => {
  for (const camp of [titol, subtitol, entradilla]) {
    expect(camp.getAttribute('contenteditable')).toBe('true');
    expect(camp.hasAttribute('readonly')).toBe(false);
    expect(camp.getAttribute('aria-readonly')).not.toBe('true');
  }
  expect(cos.getAttribute('contenteditable')).toBe('true');
  expect(cos.hasAttribute('aria-readonly')).toBe(false);
  expect(m.editor.isEditable).toBe(true);
  expect(m.barra.state).toBe(m.estatBarra);
  expect(m.barra.exec).toBe(m.execBarra);
  expect(botoEditar()).toBeNull();
};

/* ── 1. En repòs: text del document, no d'un control ni d'un camp ──────── */
/* Els selectors de cada regla amb `user-select: none` (o la variant -webkit-)
   dels fulls de l'App, sense comentaris, @media ni @layer. jsdom no aplica
   els fulls: es comprova que cap regla no casa amb el text ni amb cap dels
   seus avantpassats. */
const FULLS = ['src/css/modules.css', 'src/css/components.css', 'src/css/utilities.css', 'src/sections/mur/MapaFotografic.css'];
function selectorsSenseSeleccio() {
  const selectors = [];
  for (const full of FULLS) {
    const css = readFileSync(resolve(process.cwd(), full), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const regla = /([^{};]+)\{([^{}]*)\}/g;
    let trobada;
    while ((trobada = regla.exec(css))) {
      if (/(?:^|[;\s])(?:-webkit-)?user-select\s*:\s*none/.test(trobada[2])) selectors.push(trobada[1].trim());
    }
  }
  return selectors;
}
const avantpassats = (node) => {
  const llista = [];
  for (let el = node.nodeType === 1 ? node : node.parentElement; el; el = el.parentElement) llista.push(el);
  return llista;
};
const CONTROLS = 'button, a[href], [role="button"], [role="link"], [role="option"], label, summary, select';

describe('AH-02 · una nota amb text s’obri en repòs', () => {
  test('el títol, el subtítol i el cos són text seleccionable: fora de cap control, sense user-select:none i sense cap camp editable', () => {
    const vista = munta();
    const { titol, subtitol, paragraf } = vista;
    expect(titol.textContent).toBe(TITOL);
    expect(subtitol.textContent).toBe('Al raval');
    // L'entradilla de NOTA és buida: en repòs no es pinta (ui_fase2-02).
    expect(vista.entradilla).toBeNull();
    expect(paragraf.textContent).toBe(COS);
    // El títol continua sent l'H1 de la nota.
    expect(titol.closest('h1')).not.toBeNull();
    esEnRepos(vista);

    const selectors = selectorsSenseSeleccio();
    // La guarda llig de veres els fulls: les regles conegudes hi són.
    expect(selectors).toContain('.sdp-guia-cos');
    for (const node of [titol.firstChild, subtitol.firstChild, paragraf.firstChild]) {
      for (const el of avantpassats(node)) {
        for (const selector of selectors) {
          expect({ selector, element: el.className || el.tagName, casa: el.matches(selector) })
            .toEqual({ selector, element: el.className || el.tagName, casa: false });
        }
        expect(el.style.userSelect || el.style.webkitUserSelect || '').toBe('');
      }
      // Ni dins d'un botó, d'un enllaç o d'un rètol: el clic és per al text.
      expect(node.parentElement.closest(CONTROLS)).toBeNull();
    }
    // El cos en lectura no pinta la guia del cos buit ni el text fantasma.
    expect(vista.cos.querySelector('.sdp-guia-cos, [data-placeholder]')).toBeNull();
    // Res enfocat i res escrit en obrir la nota.
    expect(document.activeElement).toBe(document.body);
    capEscriptura();
  });

  test('«Editar» és un botó clar, damunt de l’H1, a la ranura de davall de la barra taronja', () => {
    const { titol } = munta();
    const boto = botoEditar();
    expect(boto.tagName).toBe('BUTTON');
    expect(boto.getAttribute('type')).toBe('button');
    expect(boto.closest('.sdp-pagina-despres-autoria')).not.toBeNull();
    expect(boto.closest('.sdp-accions')).not.toBeNull();
    // Abans del títol en l'ordre del document (i del focus).
    expect(boto.compareDocumentPosition(titol) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // Un sol «Editar» (els d'«Edició avançada» porten el seu nom: capçalera, logotip).
    expect(screen.getAllByRole('button', { name: 'Editar' })).toHaveLength(1);
  });

  test('clicar, fer doble clic o tocar el text no activa l’edició: la selecció es queda i copiar no s’anul·la', () => {
    const vista = munta();
    const { titol, paragraf, vista: { container } } = vista;
    const nodeTitol = titol.firstChild;
    const nodeCos = paragraf.firstChild;
    const seleccio = document.getSelection();

    // El títol: una selecció de dues paraules, el gest del ratolí i del dit, i copiar.
    const rang = document.createRange();
    rang.setStart(nodeTitol, 0);
    rang.setEnd(nodeTitol, 'Festa de'.length);
    seleccio.removeAllRanges();
    seleccio.addRange(rang);
    fireEvent.pointerDown(titol);
    fireEvent.mouseDown(titol);
    fireEvent.touchStart(titol);
    fireEvent.touchEnd(titol);
    fireEvent.mouseUp(titol);
    fireEvent.click(titol);
    fireEvent.doubleClick(titol);
    expect(seleccio.toString()).toBe('Festa de');
    expect(fireEvent.copy(titol)).toBe(true);
    expect(titol.firstChild).toBe(nodeTitol);

    // El cos: un clic sobre el paràgraf o a l'espai en blanc del full no
    // enfoca el final del document (UniversalRichTextContent) ni toca la selecció.
    const enfocaAlFinal = vi.spyOn(m.editor.commands, 'focus');
    const rangCos = document.createRange();
    rangCos.setStart(nodeCos, 'La plaça '.length);
    rangCos.setEnd(nodeCos, 'La plaça s’omple'.length);
    seleccio.removeAllRanges();
    seleccio.addRange(rangCos);
    // Sense mousedown: el de ProseMirror demana elementFromPoint, que jsdom no té.
    fireEvent.mouseUp(paragraf);
    fireEvent.click(paragraf);
    fireEvent.click(container.querySelector('[data-testid="sdp-editor-full-canvas"]'));
    fireEvent.click(vista.cos);
    expect(enfocaAlFinal).not.toHaveBeenCalled();
    expect(seleccio.toString()).toBe('s’omple');
    expect(fireEvent.copy(paragraf)).toBe(true);
    expect(paragraf.firstChild).toBe(nodeCos);

    // Continua en repòs i sense cap escriptura.
    esEnRepos(camps(container));
    capEscriptura();
  });

  test('en repòs, les ordres de la barra de format no arriben al cos', () => {
    munta();
    expect(m.barra.exec('negreta')).toBe(false);
    expect(m.execBarra).not.toHaveBeenCalled();
    expect(m.editor.getHTML()).toBe(`<p>${COS}</p>`);
    capEscriptura();
  });
});

/* ── 2. «Editar» activa l'edició; escriure edita i desa ────────────────── */
describe('AH-02 · «Editar» és l’acció explícita d’edició', () => {
  test('«Editar» torna editables els camps i el cos, porta el focus al títol i no escriu res', () => {
    vi.useFakeTimers();
    const focus = vi.spyOn(HTMLElement.prototype, 'focus');
    const { vista } = munta();
    fireEvent.click(botoEditar());
    const ara = camps(vista.container);
    esEnEdicio(ara);
    // El focus va al títol, ja editable (l'efecte de la closca, després del pintat).
    expect(focus.mock.contexts).toContain(ara.titol);
    expect(ara.titol.textContent).toBe(TITOL);
    expect(m.editor.getText()).toBe(COS);
    act(() => { vi.advanceTimersByTime(2000); });
    capEscriptura();
  });

  test('després d’«Editar», escriure al títol edita (capa local i servidor) i la nota desada continua editable', () => {
    vi.useFakeTimers();
    const { vista } = munta();
    fireEvent.click(botoEditar());
    const { titol } = camps(vista.container);
    fireEvent.focus(titol);
    tecleja(titol, 'Festa de la tomaca valenciana');
    expect(m.setLocal).toHaveBeenLastCalledWith('n-ah02', 'title', 'Festa de la tomaca valenciana');
    fireEvent.blur(titol);
    expect(m.desa).toHaveBeenCalledWith('n-ah02', 'title', 'Festa de la tomaca valenciana');
    act(() => { vi.advanceTimersByTime(2000); });
    // Desat una sola vegada: el blur buida la pausa, no en fa una altra.
    expect(m.desa.mock.calls.filter(([, camp]) => camp === 'title')).toHaveLength(1);

    // La nota torna desada (revisió nova): cap readOnly enganxat ni tornada al repòs.
    vista.rerender(<NotesEditor activeNote={{ ...NOTA, title: 'Festa de la tomaca valenciana', revision: 4 }} />);
    const desats = camps(vista.container);
    expect(desats.titol.textContent).toBe('Festa de la tomaca valenciana');
    esEnEdicio(desats);

    // Es pot tornar a escriure de seguida, sense cap acció prèvia.
    fireEvent.focus(desats.titol);
    tecleja(desats.titol, 'Festa de la tomaca');
    expect(m.setLocal).toHaveBeenLastCalledWith('n-ah02', 'title', 'Festa de la tomaca');
  });

  test('després d’«Editar», escriure al cos edita i desa, i el cos continua editable en perdre el focus', () => {
    vi.useFakeTimers();
    const { vista } = munta();
    fireEvent.click(botoEditar());
    const { cos } = camps(vista.container);
    act(() => { fireEvent.focus(cos); });
    act(() => { m.editor.commands.insertContentAt(m.editor.state.doc.content.size - 1, ' Hui també.'); });
    act(() => { vi.advanceTimersByTime(2000); });
    expect(m.setLocal).toHaveBeenCalledWith('n-ah02', 'content', expect.stringContaining('Hui també.'));
    expect(m.desa).toHaveBeenCalledWith('n-ah02', 'content', expect.stringContaining('Hui també.'));
    act(() => { fireEvent.blur(cos); });
    esEnEdicio(camps(vista.container));
  });

  test('en edició, entrar al títol o al cos per a seleccionar i eixir-ne sense escriure no desa res', () => {
    vi.useFakeTimers();
    const { vista } = munta();
    fireEvent.click(botoEditar());
    const { titol, cos } = camps(vista.container);
    fireEvent.focus(titol);
    const seleccio = document.getSelection();
    seleccio.selectAllChildren(titol);
    expect(seleccio.toString()).toBe(TITOL);
    expect(fireEvent.copy(titol)).toBe(true);
    fireEvent.blur(titol);
    act(() => { fireEvent.focus(cos); });
    act(() => { fireEvent.blur(cos); });
    act(() => { vi.advanceTimersByTime(2000); });
    capEscriptura();
    expect(titol.textContent).toBe(TITOL);
    expect(m.editor.getText()).toBe(COS);
  });

  test('escriure i desfer fins al text d’abans també es desa en eixir: la persona ha editat', () => {
    vi.useFakeTimers();
    const { vista } = munta();
    fireEvent.click(botoEditar());
    const { titol } = camps(vista.container);
    fireEvent.focus(titol);
    tecleja(titol, `${TITOL}!`);
    tecleja(titol, TITOL);
    fireEvent.blur(titol);
    expect(m.desa).toHaveBeenCalledWith('n-ah02', 'title', TITOL);
  });

  test('cada nota que s’obri torna a començar en repòs', () => {
    const { vista } = munta();
    fireEvent.click(botoEditar());
    esEnEdicio(camps(vista.container));
    vista.rerender(<NotesEditor activeNote={ALTRA} />);
    const altra = camps(vista.container);
    expect(altra.titol.textContent).toBe('Sega del forment');
    esEnRepos(altra);
    vista.rerender(<NotesEditor activeNote={NOTA} />);
    esEnRepos(camps(vista.container));
    capEscriptura();
  });
});

/* ── 3. La doctrina de sempre: sense res a llegir, edició directa ──────── */
describe('AH-02 · el que s’obri en edició, com sempre', () => {
  test('una nota sense text s’obri en edició i, plena mentre s’hi escriu, no torna al repòs', () => {
    vi.useFakeTimers();
    const buida = { ...NOTA, id: 'n-ah02-buida', title: '', subtitle: '', content: '' };
    const vista = render(<NotesEditor activeNote={buida} />);
    const { titol } = camps(vista.container);
    esEnEdicio(camps(vista.container));
    fireEvent.focus(titol);
    tecleja(titol, 'Llista de la compra');
    vista.rerender(<NotesEditor activeNote={{ ...buida, title: 'Llista de la compra', revision: 4 }} />);
    esEnEdicio(camps(vista.container));
  });

  test('la plantilla vella del cos no és text: la nota s’obri en edició', async () => {
    const { LLAVOR_NOTA } = await import('./llavorNota.js');
    const vista = render(<NotesEditor activeNote={{ ...NOTA, id: 'n-ah02-llavor', title: '', subtitle: '', content: LLAVOR_NOTA }} />);
    esEnEdicio(camps(vista.container));
  });

  test('la còpia de prova del Foraster (pla 260924_1710 §3.4): la primera tecla ja edita', () => {
    m.sessio = { currentUser: null, estat: 'fora' };
    const vista = render(<NotesEditor />);
    const ara = camps(vista.container);
    expect(ara.titol.textContent).not.toBe('');
    esEnEdicio(ara);
  });

  test('la «Nota sense títol» preparada (P4) s’obri en edició, també amb el text que encara viatja, i no torna al repòs en crear-se', () => {
    const escriu = vi.fn();
    // La persona ja hi havia escrit (els camps de la preparada, notaPreparada.js): encara no és al servidor.
    const preparada = {
      id: '0f0e0d0c-0b0a-4000-8000-0000000000a2', folderId: 'f-notes', isPublished: false, preparada: true,
      title: 'Recepta', content: '<p>All i oli.</p>'
    };
    const ambContext = (nota) => (
      <NotaPreparadaContext.Provider value={{ escriu, desa: escriu }}>
        <NotesEditor activeNote={nota} />
      </NotaPreparadaContext.Provider>
    );
    const vista = render(ambContext(preparada));
    const { titol } = camps(vista.container);
    esEnEdicio(camps(vista.container));
    fireEvent.focus(titol);
    tecleja(titol, 'Recepta de l’allioli');
    expect(escriu).toHaveBeenCalledWith(preparada.id, 'title', 'Recepta de l’allioli');
    // Creada amb el MATEIX id i ja a la llista: continua en edició.
    vista.rerender(ambContext({ ...preparada, preparada: false, title: 'Recepta de l’allioli', revision: 1 }));
    esEnEdicio(camps(vista.container));
  });
});

/* ── 4. Gauntlet R21: cap botó fantasma ni cap encapçalament buit ──────── */
/* ui_fase2-01 · En repòs el cos és en lectura i «🎴 Proposa Card» no hi pot
   escriure (proposaOdesfes torna en silenci): el botó anava encés i el clic no
   feia res. La doctrina d'AH-02 (només «Editar» trau del repòs) mana l'opció
   conservadora: apagat, amb el motiu com a descripció accessible, i la barra
   descriu per què les eines de format són apagades. Després d'«Editar», el
   flux de sempre.
   ui_fase2-02 · En repòs es pinta la lectura: cap H1, H2 ni p.lead buits;
   la nota sense títol porta un H1 llegible («Nota sense títol», com a text),
   i el cos no es remunta en eixir del repòs. */
const MOTIU_PROPOSA = 'Prem «Editar» per a proposar la Card.';
const MOTIU_EINES = 'En lectura: prem «Editar» per a escriure i donar format al text.';
const NOTA_CARD = Object.freeze({
  id: 'n-ah02-card', title: '', subtitle: '', lead: '',
  content: '<p>Títol curt</p><p>Línia dos</p><p>Un paràgraf llarg que conta com es fa la festa del poble, amb la plaça plena i les cistelles a punta de dia.</p>',
  folderId: 'f-notes', isPublished: false, revision: 2, contentLoaded: true
});
const ampladaDeLaBarra = (px) => vi.stubGlobal('ResizeObserver', class {
  constructor(callback) { this.callback = callback; }
  observe() { this.callback([{ contentRect: { width: px } }]); }
  disconnect() {}
});
/* La barra de veres amb les props que ha rebut (el harnés no la pinta). */
const pintaBarra = async () => {
  const { UniversalRichTextToolbar: BarraDeVeres } = await vi.importActual('../../components/universal/richText');
  ampladaDeLaBarra(900);
  return render(<BarraDeVeres {...m.barra} />).container;
};
/* Cap encapçalament ni entradilla buits a la pàgina de la nota. */
const buits = (container) => [...container.querySelectorAll('h1, h2, h3, h4, h5, h6, p.lead')]
  .filter((el) => !el.closest('.ProseMirror') && !el.textContent.trim())
  .map((el) => el.outerHTML);

describe('AH-02 · Gauntlet R21: en repòs, cap botó fantasma', () => {
  test('ui_fase2-01 · «Proposa Card» és apagat amb el seu motiu, el clic no fa res, i després d’«Editar» proposa', async () => {
    vi.useFakeTimers();
    const { vista } = munta(NOTA_CARD);
    // La nota té text: s'obri en repòs, i abans el motor ja hi veia una proposta.
    expect(m.editor.isEditable).toBe(false);
    expect(botoEditar()).not.toBeNull();
    expect(m.barra.onProposaCard).toEqual(expect.any(Function));
    expect(m.barra.proposaCardDisabled).toBe(true);
    expect(m.barra.proposaCardDesfer).toBe(false);
    expect(m.barra.proposaCardMotiu).toBe(MOTIU_PROPOSA);
    expect(m.barra.motiuEnLectura).toBe(MOTIU_EINES);

    // La barra de veres: el botó apagat, amb el nom de sempre i el motiu com a
    // descripció; la barra (role=group) descriu el repòs per a les eines.
    const barra = await pintaBarra();
    const boto = within(barra).getByRole('button', { name: 'Proposa Card', description: MOTIU_PROPOSA });
    expect(boto.disabled).toBe(true);
    expect(within(barra).getByRole('group', { name: "Eines de l'editor", description: MOTIU_EINES })).toBeTruthy();
    expect(within(barra).getByRole('button', { name: 'Negreta' }).disabled).toBe(true);
    // El motiu és amagat: cap píxel nou a la barra.
    expect(barra.querySelector(`[id="${barra.querySelector('[role="group"]').getAttribute('aria-describedby')}"]`).hidden).toBe(true);
    fireEvent.click(boto);

    // Ni pel clic ni cridant el gest a mà (la sonda del Gauntlet): el cos, els
    // camps i la fitxa de memòria oral, intactes.
    act(() => { m.barra.onProposaCard(); });
    act(() => { vi.advanceTimersByTime(2000); });
    expect(m.editor.getHTML()).toBe(NOTA_CARD.content);
    expect(screen.queryByRole('dialog')).toBeNull();
    capEscriptura();

    // «Editar»: el botó torna al seu estat de sempre i el gest proposa.
    fireEvent.click(botoEditar());
    expect(m.editor.isEditable).toBe(true);
    expect(m.barra.proposaCardDisabled).toBe(false);
    expect(m.barra.proposaCardMotiu).toBeUndefined();
    expect(m.barra.motiuEnLectura).toBeUndefined();
    act(() => { m.barra.onProposaCard(); });
    expect(m.setLocal).toHaveBeenCalledWith(NOTA_CARD.id, 'title', expect.stringContaining('Títol curt'));
    expect(m.editor.getHTML()).not.toBe(NOTA_CARD.content);
    vista.unmount();
  });

  test('fora del repòs, la barra no porta cap motiu: el DOM de sempre', async () => {
    const buida = { ...NOTA_CARD, id: 'n-ah02-card-buida', content: '' };
    render(<NotesEditor activeNote={buida} />);
    expect(m.editor.isEditable).toBe(true);
    expect(m.barra.motiuEnLectura).toBeUndefined();
    expect(m.barra.proposaCardMotiu).toBeUndefined();
    const barra = await pintaBarra();
    expect(barra.querySelector('[role="group"]').hasAttribute('aria-describedby')).toBe(false);
    expect(barra.querySelector('[role="group"] > span[hidden]')).toBeNull();
  });
});

describe('AH-02 · Gauntlet R21: en repòs, cap encapçalament buit', () => {
  test('ui_fase2-02 · sense subtítol ni entradilla, cap <h2> ni <p class="lead"> buits; en editar tornen amb el placeholder i el cos no es remunta', () => {
    const nota = { ...NOTA, id: 'n-ah02-sense-intro', subtitle: '', lead: '<br>' };
    const vista = munta(nota);
    const { container } = vista.vista;
    expect(vista.titol.textContent).toBe(TITOL);
    expect(vista.subtitol).toBeNull();
    expect(vista.entradilla).toBeNull();
    expect(container.querySelector('.page-intro')).toBeNull();
    expect(buits(container)).toEqual([]);
    esEnRepos(camps(container));
    const cosAbans = m.editor.view.dom;

    fireEvent.click(botoEditar());
    const ara = camps(container);
    esEnEdicio(ara);
    expect(ara.subtitol.closest('h2')).not.toBeNull();
    expect(ara.entradilla.closest('p.lead')).not.toBeNull();
    expect(ara.subtitol.getAttribute('data-placeholder')).not.toBeNull();
    expect(ara.entradilla.getAttribute('data-placeholder')).not.toBeNull();
    // El mateix cos de TipTap, viu: cap remuntatge en eixir del repòs.
    expect(m.editor.view.dom).toBe(cosAbans);
    expect(cosAbans.isConnected).toBe(true);
    capEscriptura();
  });

  test('ui_fase2-02 · la nota sense títol porta un H1 llegible, «Nota sense títol», com a text; en editar, el camp torna buit amb el placeholder', () => {
    vi.useFakeTimers();
    const nota = { ...NOTA_CARD, id: 'n-ah02-sense-titol' };
    const { vista, titol } = munta(nota);
    const { container } = vista;
    const h1 = screen.getByRole('heading', { level: 1, name: 'Nota sense títol' });
    expect(titol.closest('h1')).toBe(h1);
    expect(titol.textContent).toBe('Nota sense títol');
    expect(titol.hasAttribute('contenteditable')).toBe(false);
    expect(titol.hasAttribute('data-placeholder')).toBe(false);
    expect(container.querySelector('.page-intro')).toBeNull();
    expect(buits(container)).toEqual([]);

    fireEvent.click(botoEditar());
    const ara = camps(container);
    expect(ara.titol).toBe(titol);
    expect(ara.titol.textContent).toBe('');
    expect(ara.titol.getAttribute('contenteditable')).toBe('true');
    expect(ara.titol.getAttribute('data-placeholder')).toBe('Nota sense títol');
    act(() => { vi.advanceTimersByTime(2000); });
    // El text de reserva no és cap valor: res no s'escriu.
    capEscriptura();
  });
});
