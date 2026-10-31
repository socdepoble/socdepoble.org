/* Ordre d'usabilitat transversal del Mestre (30-10-2026 ~13:20) · AppGridColumn.
     1. Amb `icona` i `onReplega`, la icona de l'esquerra de la capçalera
        oberta és un botó germà del [|<] (PanelLeftClose) que fa el mateix
        (onReplega), amb nom propi («Plegar la columna …», nav.plegaColumna a
        les cinc llengües). Plegada, el botó de dalt del rail porta la mateixa
        icona al mateix lloc.
     2. L'acordió vertical (`plegable`) només porta la paraula i el chevron
        (^ obert, v plegat), junts; sense acordió, el títol és text fix.
   La icona fa de botó on el [|<] es veu: en «estret» la navegació no en porta
   (d-desktop-only) i la icona hi queda de dibuix, i amb `esquerra` o
   `startActions` davant ja no és la de l'esquerra. `replegaTotaCapcalera`
   (tota la fila és el botó) queda per al Xat, que no canvia. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRef } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { FileText, Folder, Settings } from 'lucide-react';
import AppGridColumn, { TextosDeLaColumna } from './AppGridColumn.jsx';
import { AppGridContext } from './AppGridShell.jsx';

/* La CSS de la closca, llegida de veres (com AppGridShell.contrast.capes.test.js). */
const CSS = readFileSync(resolve(process.cwd(), 'src/components/layout/AppGridShell.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '');
const FONT = readFileSync(resolve(process.cwd(), 'src/components/layout/AppGridColumn.jsx'), 'utf8');

afterEach(() => cleanup());

const glif = (el) => [...(el?.querySelector('svg')?.classList ?? [])].find((c) => c.startsWith('lucide-')) ?? null;
const enGraella = (mida, ui) => <AppGridContext.Provider value={{ mida }}>{ui}</AppGridContext.Provider>;
const botoDIcona = (container) => container.querySelector('.app-grid-col-header__icona');
/* El cos d'una regla de la CSS de la closca, pel selector exacte. */
const regla = (selector) => {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`(?:^|\\n)${esc}\\s*\\{([^}]*)\\}`).exec(CSS);
  return m ? m[1].replace(/\s+/g, ' ').trim() : null;
};

describe('1 · la icona de l’esquerra fa el mateix que el [|<]', () => {
  test('títol fix: la icona és un botó germà del [|<], a l’esquerra de tot, que crida onReplega; el títol no plega res', () => {
    const onReplega = vi.fn();
    const { container } = render(<AppGridColumn titol="NOTES" icona={FileText} onReplega={onReplega} />);
    const icona = screen.getByRole('button', { name: 'Plegar la columna NOTES' });
    const replega = screen.getByRole('button', { name: 'Replegar NOTES' });
    expect(icona).not.toBe(replega);
    expect(icona.className).toBe('app-grid-col-header__icona');
    expect(icona.getAttribute('title')).toBe('Plegar la columna NOTES');
    expect(glif(icona)).toBe('lucide-file-text');
    expect(glif(replega)).toBe('lucide-panel-left-close');
    const plec = container.querySelector('.app-grid-col-header__plec');
    expect(container.querySelector('.app-grid-col-header').firstElementChild).toBe(plec);
    expect(plec.firstElementChild).toBe(icona);
    const titol = within(plec).getByText('NOTES');
    expect(titol.className).toBe('app-grid-col-header__titol');
    expect(titol.closest('button')).toBeNull();
    fireEvent.click(titol);
    expect(onReplega).not.toHaveBeenCalled();
    fireEvent.click(icona);
    fireEvent.click(replega);
    expect(onReplega).toHaveBeenCalledTimes(2);
  });

  test('sense onReplega o sense icona: cap botó d’icona; la icona és el dibuix de sempre', () => {
    const sense = render(<AppGridColumn titol="NOTES" icona={FileText} />);
    expect(botoDIcona(sense.container)).toBeNull();
    expect(sense.container.querySelector('.app-grid-col-header__plec > svg.lucide-file-text')).not.toBeNull();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    sense.unmount();
    const senseIcona = render(<AppGridColumn titol="NOTES" onReplega={() => {}} />);
    expect(botoDIcona(senseIcona.container)).toBeNull();
    expect(screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['Replegar NOTES']);
  });

  test('collapseBtnRef (el focus en desplegar) va a la icona quan és botó; sense icona, al [|<]; sense onReplega, a l’acordió', () => {
    const ambIcona = createRef();
    render(<AppGridColumn titol="CARPETES" icona={Folder} plegable onPlega={() => {}} onReplega={() => {}} collapseBtnRef={ambIcona} />);
    expect(ambIcona.current).toBe(screen.getByRole('button', { name: 'Plegar la columna CARPETES' }));
    cleanup();
    const senseIcona = createRef();
    render(<AppGridColumn titol="CARPETES" plegable onPlega={() => {}} onReplega={() => {}} collapseBtnRef={senseIcona} />);
    expect(senseIcona.current).toBe(screen.getByRole('button', { name: 'Replegar CARPETES' }));
    cleanup();
    const senseReplega = createRef();
    const { container } = render(<AppGridColumn titol="CARPETES" icona={Folder} plegable onPlega={() => {}} collapseBtnRef={senseReplega} />);
    expect(senseReplega.current).toBe(container.querySelector('.app-grid-col-header__plegable'));
  });

  test('amb `controls`, tots dos botons declaren la columna (aria-expanded i aria-controls); sense, cap dels dos', () => {
    render(<AppGridColumn titol="DISSENY" icona={Folder} onReplega={() => {}} controls="app-grid-sidebar" />);
    for (const nom of ['Plegar la columna DISSENY', 'Replegar DISSENY']) {
      const boto = screen.getByRole('button', { name: nom });
      expect([nom, boto.getAttribute('aria-expanded'), boto.getAttribute('aria-controls')]).toEqual([nom, 'true', 'app-grid-sidebar']);
    }
    cleanup();
    render(<AppGridColumn titol="NOTES" icona={Folder} onReplega={() => {}} />);
    for (const nom of ['Plegar la columna NOTES', 'Replegar NOTES']) {
      const boto = screen.getByRole('button', { name: nom });
      expect([nom, boto.hasAttribute('aria-expanded'), boto.hasAttribute('aria-controls')]).toEqual([nom, false, false]);
    }
  });

  test('replegaCompacte sense controls continua declarant aria-expanded al [|<], com abans', () => {
    render(<AppGridColumn titol="NOTES" icona={FileText} onReplega={() => {}} replegaCompacte />);
    const replega = screen.getByRole('button', { name: 'Replegar NOTES' });
    expect([replega.getAttribute('aria-expanded'), replega.hasAttribute('aria-controls'), replega.classList.contains('d-desktop-only')]).toEqual(['true', false, false]);
  });

  test('el nom de la icona el dona qui munta les columnes (TextosDeLaColumna, amb {nom}); sense proveïdor, el valencià', () => {
    render(
      <TextosDeLaColumna.Provider value={{ plegaColumna: 'Collapse the {nom} column' }}>
        <AppGridColumn titol="NOTES" icona={FileText} onReplega={() => {}} />
      </TextosDeLaColumna.Provider>
    );
    expect(screen.getByRole('button', { name: 'Collapse the NOTES column' })).toBeTruthy();
    cleanup();
    render(<AppGridColumn titol="NOTES" icona={FileText} onReplega={() => {}} />);
    expect(screen.getByRole('button', { name: 'Plegar la columna NOTES' })).toBeTruthy();
  });

  /* Corrector del Gauntlet (30-10-2026) · Abans només la icona es traduïa: el
     [|<], l'Expandir del rail i el títol de l'acordió eren valencià fix. */
  test('el mateix context tradueix el [|<], l’Expandir del rail, el títol de l’acordió i la fila sencera; sense proveïdor, els de sempre', () => {
    const TEXTOS = {
      plegaColumna: 'Collapse the {nom} column',
      replegaColumna: 'Collapse {nom}',
      expandeixColumna: 'Expand {nom}',
      acordioColumna: 'Collapse or expand {nom}'
    };
    const amb = (ui) => <TextosDeLaColumna.Provider value={TEXTOS}>{ui}</TextosDeLaColumna.Provider>;
    const oberta = render(amb(<AppGridColumn titol="CARPETES" icona={Folder} plegable obert onPlega={() => {}} onReplega={() => {}} />));
    const replega = screen.getByRole('button', { name: 'Collapse CARPETES' });
    expect([replega.getAttribute('title'), glif(replega)]).toEqual(['Collapse CARPETES', 'lucide-panel-left-close']);
    expect(oberta.container.querySelector('.app-grid-col-header__plegable').getAttribute('title')).toBe('Collapse or expand CARPETES');
    expect(screen.queryAllByRole('button', { name: /Replegar|Plegar/ })).toEqual([]);
    oberta.unmount();
    render(amb(<AppGridColumn variant="collapsed" titol="CARPETES" icona={Folder} onReplega={() => {}} />));
    const expandir = screen.getByRole('button', { name: 'Expand CARPETES' });
    expect(expandir.getAttribute('title')).toBe('Expand CARPETES');
    cleanup();
    render(amb(<AppGridColumn titol="Menú" icona={Settings} replegaTotaCapcalera onReplega={() => {}} />));
    expect(screen.getByRole('button', { name: 'Collapse Menú' }).classList.contains('app-grid-col-header--replegable')).toBe(true);
    cleanup();
    /* Sense proveïdor (el Xat, les apps): el valencià d'abans, lletra a lletra. */
    const sense = render(<AppGridColumn titol="CARPETES" icona={Folder} plegable obert onPlega={() => {}} onReplega={() => {}} />);
    expect(screen.getByRole('button', { name: 'Replegar CARPETES' }).getAttribute('title')).toBe('Replegar CARPETES');
    expect(sense.container.querySelector('.app-grid-col-header__plegable').getAttribute('title')).toBe('Plegar o desplegar CARPETES');
    sense.unmount();
    render(<AppGridColumn variant="collapsed" titol="CARPETES" icona={Folder} onReplega={() => {}} />);
    expect(screen.getByRole('button', { name: 'Expandir CARPETES' })).toBeTruthy();
  });

  test('un «$» del títol no es llig com a patró de substitució', () => {
    render(<AppGridColumn titol="A$&B" icona={FileText} onReplega={() => {}} />);
    expect(screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['Plegar la columna A$&B', 'Replegar A$&B']);
  });

  test('AppGridColumn no importa ni el traductor (UIContext) ni la closca: les apps compilades com a mòdul el porten dins del cos', () => {
    const importacions = [...FONT.matchAll(/^import[^;]*from\s+'([^']+)'/gm)].map((m) => m[1]);
    expect(importacions).toEqual(['react', 'lucide-react', './contextDeLaGraella.js']);
  });
});

describe('1 · la icona és botó on el [|<] es veu, i només si és la de l’esquerra', () => {
  test('en «estret», la navegació (sense replegaCompacte): el [|<] és d-desktop-only i la icona, dibuix', () => {
    const { container } = render(enGraella('estret', <AppGridColumn titol="CARPETES" icona={Folder} onReplega={() => {}} />));
    expect(botoDIcona(container)).toBeNull();
    expect(container.querySelector('.app-grid-col-header__plec > svg.lucide-folder')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Replegar CARPETES' }).classList.contains('d-desktop-only')).toBe(true);
  });

  test('en «estret» amb replegaCompacte (el [|<] visible): la icona és botó', () => {
    const { container } = render(enGraella('estret', <AppGridColumn titol="NOTES" icona={FileText} onReplega={() => {}} replegaCompacte />));
    expect(botoDIcona(container)).toBe(screen.getByRole('button', { name: 'Plegar la columna NOTES' }));
  });

  test.each(['ample', 'mitja'])('en «%s»: la icona és botó', (mida) => {
    const { container } = render(enGraella(mida, <AppGridColumn titol="NOTES" icona={FileText} onReplega={() => {}} />));
    expect(botoDIcona(container)).not.toBeNull();
  });

  test('amb `esquerra` o `startActions` davant, la icona ja no és la de l’esquerra: dibuix', () => {
    const davant = <button type="button" aria-label="Tornar">←</button>;
    const ambEsquerra = render(<AppGridColumn titol="NOTES" icona={FileText} onReplega={() => {}} esquerra={davant} />);
    expect(botoDIcona(ambEsquerra.container)).toBeNull();
    ambEsquerra.unmount();
    const accio = { id: 'x', etiqueta: 'Acció', icona: Settings, onAcciona: () => {} };
    const ambAccions = render(<AppGridColumn titol="NOTES" icona={FileText} onReplega={() => {}} startActions={[accio]} />);
    expect(botoDIcona(ambAccions.container)).toBeNull();
  });
});

describe('2 · l’acordió només porta la paraula i el chevron, apegat', () => {
  test('la icona és fora de l’acordió i plega la columna; l’acordió plega la llista', () => {
    const onReplega = vi.fn();
    const onPlega = vi.fn();
    const { container } = render(<AppGridColumn titol="CARPETES" icona={Folder} plegable obert onPlega={onPlega} onReplega={onReplega} />);
    const acordio = container.querySelector('.app-grid-col-header__plegable');
    expect(acordio.getAttribute('aria-expanded')).toBe('true');
    const grup = acordio.querySelector(':scope > .app-grid-col-header__acordio');
    expect([...acordio.children]).toEqual([grup]);
    expect([...grup.children].map((el) => el.className)).toEqual([
      'sdp-workspace-nav-item__label',
      'app-grid-col-header__chevron app-grid-col-header__chevron--obert'
    ]);
    expect(acordio.querySelectorAll('svg')).toHaveLength(1);
    expect(acordio.querySelector('.lucide-folder, .sdp-workspace-nav-item__icon')).toBeNull();
    const icona = screen.getByRole('button', { name: 'Plegar la columna CARPETES' });
    expect(acordio.contains(icona)).toBe(false);
    expect(icona.nextElementSibling).toBe(acordio);
    fireEvent.click(icona);
    expect([onReplega.mock.calls.length, onPlega.mock.calls.length]).toEqual([1, 0]);
    fireEvent.click(acordio);
    expect([onReplega.mock.calls.length, onPlega.mock.calls.length]).toEqual([1, 1]);
  });

  test('chevron ^ obert i v plegat: el mateix ChevronDown, girat només obert (cap >)', () => {
    const { container, rerender } = render(<AppGridColumn titol="CARPETES" icona={Folder} plegable obert onPlega={() => {}} onReplega={() => {}} />);
    const chevron = () => container.querySelector('.app-grid-col-header__chevron');
    expect([glif(chevron()), chevron().classList.contains('app-grid-col-header__chevron--obert')]).toEqual(['lucide-chevron-down', true]);
    rerender(<AppGridColumn titol="CARPETES" icona={Folder} plegable obert={false} onPlega={() => {}} onReplega={() => {}} />);
    expect([glif(chevron()), chevron().classList.contains('app-grid-col-header__chevron--obert')]).toEqual(['lucide-chevron-down', false]);
    expect(container.querySelector('.lucide-chevron-right')).toBeNull();
    expect(container.querySelector('.app-grid-col-header__plegable').getAttribute('aria-expanded')).toBe('false');
  });
});

describe('replegaTotaCapcalera (el Xat) no canvia', () => {
  test('tota la fila continua sent un sol botó, amb la icona i el títol a dins', () => {
    const { container } = render(<AppGridColumn titol="Menú" icona={Settings} replegaTotaCapcalera onReplega={() => {}} controls="app-grid-sidebar" />);
    const fila = screen.getByRole('button', { name: 'Replegar Menú' });
    expect(fila.classList.contains('app-grid-col-header--replegable')).toBe(true);
    expect(within(fila).getByText('Menú')).toBeTruthy();
    expect(botoDIcona(container)).toBeNull();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
});

describe('CSS de la closca (AppGridShell.css)', () => {
  test('la icona-botó: cel·la tàctil centrada sobre el glif de 24, al lloc del glif, transparent i taronja', () => {
    const cos = regla('.app-grid-col-header__icona');
    expect(cos).not.toBeNull();
    for (const decl of [
      'width: var(--sdp-touch-min);', 'height: var(--sdp-touch-min);',
      'margin-inline: calc((24px - var(--sdp-touch-min)) / 2);',
      'background: transparent;', 'color: var(--sdp-crom-actiu-fons);', 'flex: none;', 'cursor: pointer;'
    ]) expect([decl, cos.includes(decl)]).toEqual([decl, true]);
    expect(regla('.app-grid-col-header__icona:focus-visible')).toBe('outline: 2px solid var(--sdp-crom-focus); outline-offset: -2px;');
  });

  test('l’acordió: la paraula i el chevron junts amb var(--sdp-space-1), sense el margin-left: auto', () => {
    expect(regla('.app-grid-col-header__acordio')).toContain('gap: var(--sdp-space-1);');
    expect(regla('.app-grid-col-header__plegable .sdp-workspace-nav-item__label')).toBe('flex: 0 1 auto;');
    expect(regla('.app-grid-col-header__plegable .app-grid-col-header__chevron')).toContain('margin-inline-start: 0;');
  });

  /* Corrector del Gauntlet (30-10-2026) · Dues troballes del verificador, a
     /notes 1440 i /app/lector 900: el botó ocupava la franja buida fins al
     [|<] (un clic a 8 px del [|<] plegava la llista) i, amb padding 0,
     l'anell de focus (2px per dins) tapava la «C». */
  const ACORDIO = '.app-grid-col-header > .app-grid-col-header__plec > .sdp-workspace-nav-item.app-grid-col-header__plegable';
  test('l’acordió només ocupa la paraula i el chevron, i l’anell de focus no toca la lletra', () => {
    const cos = regla(ACORDIO);
    expect(cos).not.toBeNull();
    for (const decl of [
      'flex: 0 1 auto;', 'width: auto;', 'min-width: 0;',
      'padding-inline-start: var(--sdp-space-1);', 'margin-inline-start: calc(-1 * var(--sdp-space-1));'
    ]) expect([decl, cos.includes(decl)]).toEqual([decl, true]);
  });

  test('i guanya, sense dependre de l’ordre dels @import, les regles de modules.css que li posen flex, amplada o padding', () => {
    /* Totes dues són a @layer components (index.css): mana l'especificitat.
       La de l'espai (.sdp-workspace .app-grid-col-header …__plegable) hi
       posa padding: 0 amb tres classes; una regla amb tres no bastava. */
    const MODULS = readFileSync(resolve(process.cwd(), 'src/css/modules.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const classes = (sel) => (sel.match(/[.:][\w-]+/g) ?? []).filter((t) => t !== ':not' && t !== ':is' && t !== ':where').length;
    const rivals = [];
    for (const [, selectors, cos] of MODULS.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (!/(^|[\s;])(flex|width|padding(-inline(-start)?)?|margin(-inline(-start)?)?)\s*:/.test(cos)) continue;
      for (const sel of selectors.split(',').map((s) => s.trim())) {
        if (/(\.app-grid-col-header__plegable|\.sdp-workspace-nav-item)$/.test(sel)) rivals.push([sel, classes(sel)]);
      }
    }
    expect(rivals.length).toBeGreaterThan(1);
    expect(classes(ACORDIO)).toBe(4);
    expect(rivals.filter(([, n]) => n >= classes(ACORDIO))).toEqual([]);
  });
});

/* Ordre del Mestre (30-10-2026 ~15:00, restes de l'ordre d'usabilitat) · La
   icona ja no és dins de l'acordió (la prova de dalt): cap full de src/ no
   conserva regles per a una icona dins de l'acordió, que no casarien mai. */
describe('cap regla morta per a la icona de dins de l’acordió', () => {
  test('cap selector de la CSS nomena .app-grid-col-header__plegable .sdp-workspace-nav-item__icon', () => {
    const fulls = ['src/css/modules.css', 'src/css/components.css', 'src/css/layout.css', 'src/components/layout/AppGridShell.css'];
    const morts = [];
    for (const full of fulls) {
      const css = readFileSync(resolve(process.cwd(), full), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      for (const [, selectors] of css.matchAll(/([^{}]+)\{[^{}]*\}/g)) {
        for (const sel of selectors.split(',').map((s) => s.trim())) {
          if (/\.app-grid-col-header__plegable\s+\.sdp-workspace-nav-item__icon/.test(sel)) morts.push(`${full}: ${sel}`);
        }
      }
    }
    expect(morts).toEqual([]);
    const { container } = render(<AppGridColumn titol="CARPETES" icona={Folder} plegable obert onPlega={() => {}} onReplega={() => {}} />);
    expect(container.querySelector('.app-grid-col-header__plegable .sdp-workspace-nav-item__icon')).toBeNull();
  });
});

/* Ordre del Mestre (30-10-2026 ~15:00, restes de l'ordre d'usabilitat) · El
   catàleg de Disseny diu el que fa la capçalera: la fila sencera com a botó
   només és al Xat, i a l'espai pleguen la icona de l'esquerra i el [|<]. */
describe('el catàleg de Disseny descriu la capçalera d’ara', () => {
  const llig = (fitxer) => readFileSync(resolve(process.cwd(), 'src/sections/disseny/cataleg/detalls', fitxer), 'utf8');
  test('EspecimenColumnes i EspecimenUniversalWorkspace: cap «fila sencera» del Disseny i la icona i el [|<] pleguen', () => {
    const columnes = llig('EspecimenColumnes.jsx');
    expect(columnes).not.toContain('tota la fila és el botó (Disseny, en ample)');
    expect(columnes).not.toContain('\'Tota la fila replega la columna.\'');
    expect(columnes).toMatch(/\['replegaTotaCapcalera', 'boolean', 'false', '[^']*Només l’usa el Xat: als espais de treball pleguen la icona de l’esquerra i el \[\|<\], el títol és fix i l’acordió porta la paraula i el chevron apegat/);
    const espai = llig('EspecimenUniversalWorkspace.jsx');
    expect(espai).not.toContain('replegaTotaCapcalera / sortable');
    expect(espai).not.toContain('capçalera que replega sencera');
    expect(espai).toMatch(/\['tagFilter \/ collapsibleNavigation \/ sortable', 'boolean', 'true \/ true \/ false', '[^']*la pleguen la icona de l’esquerra de la capçalera i el \[\|<\]/);
  });

  /* Corrector del Gauntlet f4 (30-10-2026) · obridorALaLlista ja no existix
     (decisió 4 del Mestre): la seua fila descrivia el rail fix de la
     navegació en «mitja» (railEsquerra), retirat. El contracte no la nomena,
     ni cap altra fila parla del rail fix. */
  test('EspecimenUniversalWorkspace: cap fila d’obridorALaLlista ni del rail fix de la navegació en «mitja»', () => {
    const espai = llig('EspecimenUniversalWorkspace.jsx');
    expect(espai).not.toContain('obridorALaLlista');
    expect(espai).not.toContain('rail fix de la navegació');
  });
});
