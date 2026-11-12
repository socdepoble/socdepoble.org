/* P0-24b (Onada R21) · La pila LIFO de l'Escape amb capes niades de veritat.
   Verificació de l'Escola 6/8 del dossier del Node 0: «hi ha un cas on un
   Escape amb dues capes superposades les tanca totes dues». La causa que hi
   donava (un `tancaRef` amb més d'una funció) no existix: cada capa s'apunta a
   la pila amb UNA funció. El defecte, en canvi, sí: les capes que escolten
   l'Escape a tot el document o a la finestra (useMenuEmergent, PaginaEmojis,
   les opcions compactes de la barra, el «⋯» de la capçalera del xat) no
   preguntaven la pila ni miraven si ja era consumit, i el Dropdown no el
   consumia. Cada prova d'ací fallava abans de la correcció (dues capes
   tancades, o la de sota tancada amb la de dalt oberta).

   Com el navegador a la SPA: el Dialeg s'obri amb showModal() i es tanca amb
   una «close request» (HTML): primer el keydown i, NOMÉS si ningú no l'ha
   consumit (preventDefault), el `cancel` del <dialog> de dalt. jsdom no ho
   fa: premEscape ho reproduïx. Obrir amb fireEvent.click no dispara cap
   pointerdown: és el camí del teclat (Intro damunt d'un botó), que no plega
   els menús que ja hi havia oberts.

   Verificació adversària (R21) · Al final, l'encastat: el Dialeg local
   (modalLocal) també pregunta la pila, i dues instàncies <soc-de-poble> són
   dos àmbits (AmbitCapesEnrere) que no es tapen l'Escape. */
import { useRef, useState } from 'react';
import { act, cleanup, fireEvent, render, renderHook, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { AmbitCapesEnrere, useCapaEnrere } from './useCapaEnrere.js';
import { useMenuEmergent } from './useMenuEmergent.js';
import { Dropdown, DropdownItem } from '../molecules/Dropdown.jsx';
import { Dialeg } from '../organismes/Dialeg.jsx';
import { PaginaEmojis } from '../../universal/classificacio/PaginaEmojis.jsx';
import UniversalToolbar from '../../universal/UniversalToolbar.jsx';
import CapcaleraConversa from '../../../sections/xat/components/CapcaleraConversa.jsx';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import { _reiniciaPilaEnrere, capesEnrereObertes, tancaCapaSuperior } from '../../../config/pilaEnrere.js';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); _reiniciaPilaEnrere(); });

const res = () => {};
const t = (_, alternativa) => alternativa;
/* Un catàleg buit que arriba de seguida: la pàgina d'Emojis no en necessita cap. */
const senseCataleg = () => Promise.resolve({ GRUPS_EMOJIS: [] });

/* Cada Arrere, un segon més tard: fora de la finestra d'absorció. */
let rellotge = 10_000;
const arrere = () => { let r; act(() => { rellotge += 1000; r = tancaCapaSuperior(rellotge); }); return r; };

/* Una tecla Escape de veritat on hi ha el focus: el keydown i, si ningú no
   l'ha consumit, el `cancel` cancel·lable del <dialog> obert de dalt (en estes
   proves, l'últim obert és també l'últim del document). */
function premEscape(desti = document.activeElement ?? document.body) {
  const lliure = fireEvent.keyDown(desti, { key: 'Escape' });
  if (!lliure) return;
  const dalt = [...document.querySelectorAll('dialog[open]')].at(-1);
  if (dalt) act(() => { dalt.dispatchEvent(new Event('cancel', { cancelable: true })); });
}

/* Un menú emergent mínim amb el hook real (el patró de useMenuEmergent.test.jsx):
   el botó l'obri i la llista es munta només oberta. */
function LlistaMenu({ nom, boto, onTanca }) {
  const { ref, mouFocus } = useMenuEmergent({ files: '[role="menuitem"]', onTria: res, onTanca, botoRef: boto });
  return (
    <div ref={ref} role="menu" aria-label={nom} onKeyDown={mouFocus}>
      <button type="button" role="menuitem">{`${nom}: opció`}</button>
    </div>
  );
}
function Menu({ nom, ordre }) {
  const [obert, setObert] = useState(false);
  const boto = useRef(null);
  return (
    <>
      <button type="button" ref={boto} onClick={() => setObert(true)}>{nom}</button>
      {obert ? <LlistaMenu nom={nom} boto={boto} onTanca={() => { ordre.push(nom); setObert(false); }} /> : null}
    </>
  );
}

/* La pàgina d'Emojis del Bloc de Notes, muntada només oberta. */
function Emojis({ ordre, onTanca }) {
  return <PaginaEmojis onTornar={() => { ordre.push('emojis'); onTanca(); }} onTria={res} carregaCataleg={senseCataleg} />;
}

const dialegObert = () => document.querySelector('dialog')?.hasAttribute('open') ?? false;

describe('dues capes: un sol Escape les tancava totes dues; ara només la de dalt', () => {
  function EmojisIDesplegable({ ordre }) {
    const [emojis, setEmojis] = useState(true);
    return (
      <>
        {emojis ? <Emojis ordre={ordre} onTanca={() => setEmojis(false)} /> : null}
        <Dropdown trigger="Opcions"><DropdownItem onClick={res}>Fila</DropdownItem></Dropdown>
      </>
    );
  }

  test('un desplegable damunt de la pàgina d’Emojis', async () => {
    const ordre = [];
    render(<EmojisIDesplegable ordre={ordre} />);
    await screen.findByRole('searchbox');
    const disparador = screen.getByRole('button', { name: 'Opcions' });
    fireEvent.click(disparador);
    expect(screen.getByRole('button', { name: 'Fila' })).toBeTruthy();
    expect(capesEnrereObertes()).toBe(2);
    premEscape(disparador);
    expect(screen.queryByRole('button', { name: 'Fila' })).toBeNull();
    expect(ordre).toEqual([]);
    expect(screen.getByRole('searchbox')).toBeTruthy();
    expect(capesEnrereObertes()).toBe(1);
    premEscape(disparador);
    expect(ordre).toEqual(['emojis']);
    expect(capesEnrereObertes()).toBe(0);
  });

  function DesplegableDinsDelDialeg({ ordre }) {
    const [dialeg, setDialeg] = useState(true);
    return (
      <Dialeg obert={dialeg} onTanca={(motiu) => { ordre.push(`dialeg:${motiu}`); setDialeg(false); }} titol="Opcions de la nota">
        <Dropdown trigger="Opcions"><DropdownItem onClick={res}>Fila</DropdownItem></Dropdown>
      </Dialeg>
    );
  }

  test('un desplegable dins d’un diàleg: el keydown que el tanca queda consumit i el diàleg no rep cap «cancel»', () => {
    const ordre = [];
    render(<DesplegableDinsDelDialeg ordre={ordre} />);
    const disparador = screen.getByRole('button', { name: 'Opcions' });
    fireEvent.click(disparador);
    expect(capesEnrereObertes()).toBe(2);
    premEscape(disparador);
    expect(screen.queryByRole('button', { name: 'Fila' })).toBeNull();
    expect(ordre).toEqual([]);
    expect(dialegObert()).toBe(true);
    expect(capesEnrereObertes()).toBe(1);
    premEscape(disparador);
    expect(ordre).toEqual(['dialeg:esc']);
    expect(dialegObert()).toBe(false);
    expect(capesEnrereObertes()).toBe(0);
  });

  test('dos menús emergents (el segon obert amb el teclat): les dues escoltes són al document i el stopPropagation no les separa', () => {
    const ordre = [];
    render(<><Menu nom="Comentar" ordre={ordre} /><Menu nom="Traduir" ordre={ordre} /></>);
    fireEvent.click(screen.getByRole('button', { name: 'Comentar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Traduir' }));
    expect(screen.getAllByRole('menu')).toHaveLength(2);
    expect(capesEnrereObertes()).toBe(2);
    premEscape(screen.getByRole('menuitem', { name: 'Traduir: opció' }));
    expect(ordre).toEqual(['Traduir']);
    expect(screen.getAllByRole('menu')).toHaveLength(1);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Traduir' }));
    premEscape();
    expect(ordre).toEqual(['Traduir', 'Comentar']);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Comentar' }));
  });

  /* L'amplada mesurada de la barra: 320 px és compacta (UniversalToolbar.enrere.test.jsx). */
  const compacta = () => vi.stubGlobal('ResizeObserver', class {
    constructor(callback) { this.callback = callback; }
    observe() { this.callback([{ contentRect: { width: 320 } }]); }
    disconnect() {}
  });
  const ACCIONS = {
    toggleSubheading: res, toggleH4: res, toggleH5: res, toggleH6: res, toggleHeading: res, toggleBold: res,
    toggleItalic: res, toggleStrike: res, toggleList: res, toggleOrderedList: res, toggleCitacio: res, insertDivisor: res
  };
  function BarraIEmojis({ ordre }) {
    const [emojis, setEmojis] = useState(false);
    return (
      <>
        <UniversalToolbar formatActions={ACCIONS} onPublish={res} />
        <button type="button" onClick={() => setEmojis(true)}>Emojis</button>
        {emojis ? <Emojis ordre={ordre} onTanca={() => setEmojis(false)} /> : null}
      </>
    );
  }

  test('les opcions compactes de la barra i la pàgina d’Emojis damunt: dues escoltes a la finestra', async () => {
    compacta();
    const ordre = [];
    render(<BarraIEmojis ordre={ordre} />);
    const format = within(screen.getByRole('group', { name: 'Eines de l\'editor' })).getByRole('button', { name: 'Format del text' });
    fireEvent.click(format);
    const opcions = document.getElementById(format.getAttribute('aria-controls'));
    expect(opcions.hidden).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Emojis' }));
    await screen.findByRole('searchbox');
    expect(capesEnrereObertes()).toBe(2);
    // El cercador buit deixa passar l'Escape (GraellaEmojis): és de la pàgina.
    premEscape(screen.getByRole('searchbox'));
    expect(ordre).toEqual(['emojis']);
    expect(opcions.hidden).toBe(false);
    expect(capesEnrereObertes()).toBe(1);
    premEscape();
    expect(opcions.hidden).toBe(true);
    expect(document.activeElement).toBe(format);
    expect(capesEnrereObertes()).toBe(0);
  });

  const FIL_DIRECTE = { id: 'd-pepa', tipus: 'directe', name: 'Pepa', altres: [{ id: 'P', tipus: 'persona', nom: 'Pepa' }], altresNoms: ['Pepa'] };
  function CapcaleraIMenu({ ordre }) {
    return (
      <MemoryRouter>
        <CapcaleraConversa fil={FIL_DIRECTE} onTorna={res} onSeleccionar={res} t={t} />
        <Menu nom="Traduir" ordre={ordre} />
      </MemoryRouter>
    );
  }

  test('el «⋯» de la capçalera del xat i un menú emergent damunt', () => {
    const ordre = [];
    render(<CapcaleraIMenu ordre={ordre} />);
    const mesOpcions = screen.getByRole('button', { name: 'Opcions de la conversa' });
    fireEvent.click(mesOpcions);
    fireEvent.click(screen.getByRole('button', { name: 'Traduir' }));
    expect(screen.getAllByRole('menu')).toHaveLength(2);
    expect(capesEnrereObertes()).toBe(2);
    premEscape(screen.getByRole('menuitem', { name: 'Traduir: opció' }));
    expect(ordre).toEqual(['Traduir']);
    expect(mesOpcions.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getAllByRole('menu')).toHaveLength(1);
    premEscape();
    expect(mesOpcions.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(capesEnrereObertes()).toBe(0);
  });
});

describe('un diàleg damunt: el primer Escape és seu i la capa de sota es queda', () => {
  function SotaIDialeg({ ordre, sota }) {
    const [emojis, setEmojis] = useState(true);
    const [dialeg, setDialeg] = useState(false);
    return (
      <>
        {sota === 'emojis' && emojis ? <Emojis ordre={ordre} onTanca={() => setEmojis(false)} /> : null}
        {sota === 'menu' ? <Menu nom="Comentar" ordre={ordre} /> : null}
        <button type="button" onClick={() => setDialeg(true)}>Obri el diàleg</button>
        <Dialeg obert={dialeg} onTanca={(motiu) => { ordre.push(`dialeg:${motiu}`); setDialeg(false); }} titol="Visibilitat">
          <button type="button">Dins del diàleg</button>
        </Dialeg>
      </>
    );
  }

  test('damunt de la pàgina d’Emojis (abans es tancava la pàgina i el diàleg es quedava obert)', async () => {
    const ordre = [];
    render(<SotaIDialeg ordre={ordre} sota="emojis" />);
    await screen.findByRole('searchbox');
    fireEvent.click(screen.getByRole('button', { name: 'Obri el diàleg' }));
    expect(capesEnrereObertes()).toBe(2);
    premEscape(screen.getByRole('button', { name: 'Dins del diàleg' }));
    expect(ordre).toEqual(['dialeg:esc']);
    expect(dialegObert()).toBe(false);
    expect(screen.getByRole('searchbox')).toBeTruthy();
    premEscape();
    expect(ordre).toEqual(['dialeg:esc', 'emojis']);
    expect(capesEnrereObertes()).toBe(0);
  });

  test('damunt d’un menú emergent (abans es tancava el menú i el diàleg es quedava obert)', () => {
    const ordre = [];
    render(<SotaIDialeg ordre={ordre} sota="menu" />);
    fireEvent.click(screen.getByRole('button', { name: 'Comentar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Obri el diàleg' }));
    expect(capesEnrereObertes()).toBe(2);
    premEscape(screen.getByRole('button', { name: 'Dins del diàleg' }));
    expect(ordre).toEqual(['dialeg:esc']);
    expect(screen.getByRole('menu', { name: 'Comentar' })).toBeTruthy();
    premEscape();
    expect(ordre).toEqual(['dialeg:esc', 'Comentar']);
    expect(capesEnrereObertes()).toBe(0);
  });
});

/* Al navegador, entre una escolta i la següent corren les microtasques: React
   pot haver desmuntat la capa de dalt (i llevat de la pila) abans que l'escolta
   de sota veja l'Escape. Llavors la de sota ja és la de dalt, i l'única senyal
   és que l'Escape ve consumit. Ací, una escolta en captura del document fa de
   capa de dalt que ja l'ha atés i ja no és a la pila. */
describe('un Escape ja consumit no és de ningú més', () => {
  const consumix = (e) => { if (e.key === 'Escape') e.preventDefault(); };
  afterEach(() => document.removeEventListener('keydown', consumix, true));

  test('la pàgina d’Emojis i un menú emergent el deixen passar', async () => {
    const ordre = [];
    function Sola() {
      const [emojis, setEmojis] = useState(true);
      return (
        <>
          {emojis ? <Emojis ordre={ordre} onTanca={() => setEmojis(false)} /> : null}
          <Menu nom="Comentar" ordre={ordre} />
        </>
      );
    }
    render(<Sola />);
    await screen.findByRole('searchbox');
    fireEvent.click(screen.getByRole('button', { name: 'Comentar' }));
    document.addEventListener('keydown', consumix, true);
    premEscape(screen.getByRole('menuitem', { name: 'Comentar: opció' }));
    expect(ordre).toEqual([]);
    expect(capesEnrereObertes()).toBe(2);
    document.removeEventListener('keydown', consumix, true);
    premEscape(screen.getByRole('menuitem', { name: 'Comentar: opció' }));
    expect(ordre).toEqual(['Comentar']);
  });
});

/* Tres capes niades: la pàgina d'Emojis (finestra), un menú emergent
   (document) i un diàleg (<dialog> natiu). Tres Escape i tres Arrere fan el
   MATEIX camí: la mateixa capa, el mateix motiu i el focus al mateix lloc. */
function TresCapes({ ordre }) {
  const [emojis, setEmojis] = useState(true);
  const [dialeg, setDialeg] = useState(false);
  return (
    <>
      {emojis ? <Emojis ordre={ordre} onTanca={() => setEmojis(false)} /> : null}
      <Menu nom="Traduir" ordre={ordre} />
      <button type="button" onClick={() => setDialeg(true)}>Obri el diàleg</button>
      <Dialeg obert={dialeg} onTanca={(motiu) => { ordre.push(`dialeg:${motiu}`); setDialeg(false); }} titol="Visibilitat">
        <button type="button">Dins del diàleg</button>
      </Dialeg>
    </>
  );
}

async function obriTresCapes(ordre) {
  render(<TresCapes ordre={ordre} />);
  await screen.findByRole('searchbox');
  fireEvent.click(screen.getByRole('button', { name: 'Traduir' }));
  const obridor = screen.getByRole('button', { name: 'Obri el diàleg' });
  // Un clic de veritat deixa el focus al botó; fireEvent.click no el mou.
  obridor.focus();
  fireEvent.click(obridor);
  expect(capesEnrereObertes()).toBe(3);
  expect(dialegObert()).toBe(true);
}

/* Després de cada tancament: què s'ha tancat, quantes capes queden, qui té el
   focus i quines capes es veuen encara. */
const foto = (ordre) => ({
  ordre: [...ordre],
  capes: capesEnrereObertes(),
  focus: document.activeElement?.textContent ?? null,
  dialeg: dialegObert(),
  menu: screen.queryByRole('menu') !== null,
  emojis: screen.queryByRole('searchbox') !== null
});

test('tres capes niades: LIFO amb l’Escape, i l’Arrere fa exactament el mateix camí', async () => {
  const ordreEscape = [];
  await obriTresCapes(ordreEscape);
  const ambEscape = [];
  premEscape(screen.getByRole('button', { name: 'Dins del diàleg' }));
  ambEscape.push(foto(ordreEscape));
  premEscape();
  ambEscape.push(foto(ordreEscape));
  premEscape();
  ambEscape.push(foto(ordreEscape));

  expect(ambEscape).toEqual([
    { ordre: ['dialeg:esc'], capes: 2, focus: 'Obri el diàleg', dialeg: false, menu: true, emojis: true },
    { ordre: ['dialeg:esc', 'Traduir'], capes: 1, focus: 'Traduir', dialeg: false, menu: false, emojis: true },
    { ordre: ['dialeg:esc', 'Traduir', 'emojis'], capes: 0, focus: 'Traduir', dialeg: false, menu: false, emojis: false }
  ]);

  cleanup();
  _reiniciaPilaEnrere();

  const ordreArrere = [];
  await obriTresCapes(ordreArrere);
  const ambArrere = [];
  for (let i = 0; i < 3; i += 1) {
    expect(arrere()).toBe(true);
    ambArrere.push(foto(ordreArrere));
  }
  expect(arrere()).toBe(false);
  expect(ambArrere).toEqual(ambEscape);
});

test('useCapaEnrere torna teCapaDamunt, estable: cert només amb una capa apuntada damunt', () => {
  const sota = renderHook(({ actiu }) => useCapaEnrere(actiu, res), { initialProps: { actiu: true } });
  const primera = sota.result.current;
  expect(primera()).toBe(false);
  const dalt = renderHook(({ actiu }) => useCapaEnrere(actiu, res), { initialProps: { actiu: true } });
  expect(sota.result.current()).toBe(true);
  expect(dalt.result.current()).toBe(false);
  dalt.rerender({ actiu: false });
  expect(sota.result.current()).toBe(false);
  // Inactiva, la capa no és a la pila i no té res damunt: el seu Escape, com sempre.
  dalt.rerender({ actiu: true });
  sota.rerender({ actiu: false });
  expect(sota.result.current()).toBe(false);
  expect(sota.result.current).toBe(primera);
});

/* ── L'encastat (<soc-de-poble>) · verificació adversària R21 ─────────────
   El muntatge de Dialeg.test.jsx: una arrel ombra amb .sdp-root, on el Dialeg
   és local (show() i modalLocal). L'escolta de modalLocal és a .sdp-root, més
   a prop del focus que la del menú (a l'arrel ombra): sense preguntar la pila,
   el primer Escape tancava el diàleg de sota i el menú de dalt es quedava obert
   dins de la capa amagada, a la pila, i tornava a aparéixer en reobrir. */
function muntaLocal(element) {
  const host = document.createElement('soc-de-poble'); document.body.append(host);
  const shadow = host.attachShadow({ mode: 'closed' });
  const root = document.createElement('div'); root.className = 'sdp-root'; shadow.append(root);
  const muntatge = document.createElement('div'); root.append(muntatge);
  return { host, shadow, root, ...render(element, { container: muntatge, baseElement: root }) };
}

describe('l’encastat: el Dialeg local també seguix la pila', () => {
  beforeEach(() => {
    Object.defineProperties(HTMLDialogElement.prototype, {
      show: { configurable: true, value() { this.setAttribute('open', ''); } },
      showModal: { configurable: true, value() { this.setAttribute('open', ''); } }
    });
  });
  afterEach(() => {
    document.querySelectorAll('soc-de-poble').forEach((el) => el.remove());
    delete HTMLDialogElement.prototype.show;
    delete HTMLDialogElement.prototype.showModal;
  });

  function MenuDinsDelDialeg({ ordre }) {
    const [dialeg, setDialeg] = useState(false);
    return (
      <>
        <button type="button" onClick={() => setDialeg(true)}>Obri el diàleg</button>
        <Dialeg obert={dialeg} onTanca={(motiu) => { ordre.push(`dialeg:${motiu}`); setDialeg(false); }} titol="Opcions de la nota">
          <Menu nom="Traduir" ordre={ordre} />
        </Dialeg>
      </>
    );
  }

  /* Els botons es busquen pel text: dins d'una arrel ombra, jsdom no refà
     l'estil calculat del <dialog> en obrir-lo i getByRole el veu amagat. */
  const boto = (root, text) => [...root.querySelectorAll('button')].find((b) => b.textContent === text);

  /* El diàleg obert des del seu botó i, dins, el menú obert amb el teclat. */
  function obriLocal(ordre) {
    const muntat = muntaLocal(<MenuDinsDelDialeg ordre={ordre} />);
    const obridor = boto(muntat.root, 'Obri el diàleg');
    obridor.focus();
    fireEvent.click(obridor);
    fireEvent.click(boto(muntat.root, 'Traduir'));
    expect(capesEnrereObertes()).toBe(2);
    expect(muntat.shadow.activeElement?.getAttribute('role')).toBe('menuitem');
    return { ...muntat, obridor };
  }

  const fotoLocal = ({ shadow, root }, ordre) => ({
    ordre: [...ordre],
    capes: capesEnrereObertes(),
    focus: shadow.activeElement?.textContent ?? null,
    dialeg: !root.querySelector('.sdp-capa-modal').hidden,
    menu: root.querySelector('[role="menu"]') !== null
  });

  test('menú dins d’un Dialeg local: el primer Escape tanca només el menú, i en reobrir no hi ha cap menú fantasma', () => {
    const ordre = [];
    const muntat = obriLocal(ordre);
    const fotos = [];
    fireEvent.keyDown(muntat.shadow.activeElement, { key: 'Escape' });
    fotos.push(fotoLocal(muntat, ordre));
    fireEvent.keyDown(muntat.shadow.activeElement, { key: 'Escape' });
    fotos.push(fotoLocal(muntat, ordre));
    fireEvent.click(muntat.obridor);
    fotos.push({ ...fotoLocal(muntat, ordre), focus: null });

    expect(fotos).toEqual([
      { ordre: ['Traduir'], capes: 1, focus: 'Traduir', dialeg: true, menu: false },
      { ordre: ['Traduir', 'dialeg:esc'], capes: 0, focus: 'Obri el diàleg', dialeg: false, menu: false },
      { ordre: ['Traduir', 'dialeg:esc'], capes: 1, focus: null, dialeg: true, menu: false }
    ]);
  });

  test('la mateixa configuració: l’Escape i l’Arrere fan exactament el mateix camí', () => {
    const ordreEscape = [];
    const ambEscape = [];
    const perEscape = obriLocal(ordreEscape);
    for (let i = 0; i < 2; i += 1) {
      fireEvent.keyDown(perEscape.shadow.activeElement, { key: 'Escape' });
      ambEscape.push(fotoLocal(perEscape, ordreEscape));
    }

    cleanup();
    document.querySelectorAll('soc-de-poble').forEach((el) => el.remove());
    _reiniciaPilaEnrere();

    const ordreArrere = [];
    const ambArrere = [];
    const perArrere = obriLocal(ordreArrere);
    for (let i = 0; i < 2; i += 1) {
      expect(arrere()).toBe(true);
      ambArrere.push(fotoLocal(perArrere, ordreArrere));
    }
    expect(arrere()).toBe(false);
    expect(ambArrere).toEqual(ambEscape);
    expect(ambEscape.map((f) => f.ordre.at(-1))).toEqual(['Traduir', 'dialeg:esc']);
  });
});

/* Dues instàncies vives en una pàgina (PedraSecaEmbed: «Dues instàncies vives
   conviuen») comparteixen la pila del mòdul, però l'Escape d'una arrel ombra
   no arriba mai a l'altra. Cada instància és el seu àmbit (AmbitCapesEnrere,
   com el dona PedraSecaEmbed amb la seua arrel ombra): abans de l'àmbit, el
   menú obert en la segona deixava mort l'Escape de la primera. */
describe('dues instàncies <soc-de-poble>: una pila, dos àmbits', () => {
  afterEach(() => { document.querySelectorAll('soc-de-poble').forEach((el) => el.remove()); });

  function instancia(nom, ordre) {
    const host = document.createElement('soc-de-poble'); document.body.append(host);
    const ombra = host.attachShadow({ mode: 'closed' });
    const container = document.createElement('div'); ombra.append(container);
    render(<AmbitCapesEnrere.Provider value={ombra}><Menu nom={nom} ordre={ordre} /></AmbitCapesEnrere.Provider>, { container });
    return ombra;
  }
  const obert = (ombra) => ombra.querySelector('[role="menu"]') !== null;

  test('un menú obert a cadascuna: l’Escape de la primera tanca el seu, encara que el de l’altra siga més amunt a la pila', () => {
    const ordre = [];
    const a = instancia('A', ordre);
    const b = instancia('B', ordre);
    fireEvent.click(a.querySelector('button'));
    fireEvent.click(b.querySelector('button'));
    expect([obert(a), obert(b), capesEnrereObertes()]).toEqual([true, true, 2]);

    fireEvent.keyDown(a.querySelector('[role="menuitem"]'), { key: 'Escape' });
    expect(ordre).toEqual(['A']);
    expect([obert(a), obert(b), capesEnrereObertes()]).toEqual([false, true, 1]);
    expect(a.activeElement?.textContent).toBe('A');

    fireEvent.keyDown(b.querySelector('[role="menuitem"]'), { key: 'Escape' });
    expect(ordre).toEqual(['A', 'B']);
    expect([obert(a), obert(b), capesEnrereObertes()]).toEqual([false, false, 0]);
  });

  test('dins d’una mateixa instància, el LIFO continua: dos menús, el primer Escape és del de dalt', () => {
    const ordre = [];
    const host = document.createElement('soc-de-poble'); document.body.append(host);
    const ombra = host.attachShadow({ mode: 'closed' });
    const container = document.createElement('div'); ombra.append(container);
    render(
      <AmbitCapesEnrere.Provider value={ombra}><Menu nom="Comentar" ordre={ordre} /><Menu nom="Traduir" ordre={ordre} /></AmbitCapesEnrere.Provider>,
      { container }
    );
    const [comentar, traduir] = ombra.querySelectorAll('button');
    fireEvent.click(comentar);
    fireEvent.click(traduir);
    expect(capesEnrereObertes()).toBe(2);
    fireEvent.keyDown(ombra.querySelector('[aria-label="Traduir"] [role="menuitem"]'), { key: 'Escape' });
    expect(ordre).toEqual(['Traduir']);
    expect(ombra.querySelectorAll('[role="menu"]')).toHaveLength(1);
  });
});
