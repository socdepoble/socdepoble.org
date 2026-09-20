---
type: informe
status: esborrany
description: Solució verificada dels 4 fitxers de test RTL caiguts i auditoria de la Consola Termodinàmica amb codi llest per aplicar.
tags:
  - escriptori
  - disseny
---

# Auditoria — Frontend Tests (RTL) i UI de la Consola Termodinàmica

| Camp | Valor |
| --- | --- |
| Identificador | SDP-AUDITORIA-260920-0320-CLAUDE |
| Respon a | SDP-PROMPT-260920-0320 |
| Tall verificat | HEAD `10e33db3` · branca `backup-notes-publish` · arbre brut (26 fitxers modificats, 6 sense seguiment) · 20-09-2026 03:26 |
| Agent | Claude Code (Fable 5.1) |
| Aprovació humana | pendent |
| Codi aplicat al repositori | **cap** (contracte, punt 5). Tot el codi s'ha verificat des d'una carpeta temporal fora del repositori |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[universal_maquetation]]
- [[skill-pedra-seca]]

## 0. Resum executiu

- **Quatre fitxers de test en roig, no «uns 4 tests»**: `tests/ui/components-canonics.test.jsx` (8 de 10 casos), `src/sections/notes/NotesDataContext.test.jsx` (1), `src/components/PedraSeca/organismes/UniversalCard.test.jsx` (1) i `tests/backend_consolidacio.test.mjs` (suite sencera). Total: 10 casos caiguts de 56.
- **`src/components/PedraSeca/atoms/Boto.test.jsx` no existix** (`vitest` respon «No test files found» amb eixe filtre). El cas de `Boto` que cau viu dins de `components-canonics.test.jsx:110-116`.
- **Causa arrel del 80 % de les fallades**: una sola línia. `components-canonics.test.jsx:18` crida `pinta(vnode, arrel)` amb la signatura de Preact (`render(vnode, pare)`), però `@testing-library/react` interpreta el segon argument com a *opcions*. React pinta en un contenidor nou i `arrel` queda buida: cada `$()` torna `null`.
- **Les altres tres fallades són d'entorn, no de components**: `useSession` sense proveïdor, un `vi.mock` que apunta a un mòdul que el component ja no importa, i un fitxer `node:test` que `vitest` arreplega pel glob `**/*.test.mjs`.
- **Consola Termodinàmica**: la integració amb `UniversalPage` i Pedra Seca és correcta en l'essencial (cap estil en línia, `<dialog>` natiu, taules amb nom accessible, pestanyes WAI-ARIA). He trobat **9 smells** (2 d'accessibilitat, 3 de robustesa, 4 de coherència) i done el fitxer sencer refet, verificat en jsdom amb el JSON viu del servidor de desenvolupament (38 rebuts, 16 skills).
- **Verificació**: les 3 suites proposades + 1 prova de la Consola refeta = **14 casos en verd** executats amb una configuració `vitest` temporal que reutilitza `vite.config.js` sense tocar-lo. La vista en navegador de `/consola` queda **bloquejada per `RequireAuth rol="superadmin"`** (`src/app/App.jsx:569`): no puc iniciar sessió, així que la revisió visual és estructural (DOM + CSS), no de píxel.

## 1. Diagnòstic dels tests

| Fitxer | Símptoma | Causa arrel (cita) |
| --- | --- | --- |
| `tests/ui/components-canonics.test.jsx` | 8 × `Cannot read properties of null` | Línia 18: `pinta(vnode, arrel)` → RTL llig `arrel` com a `options`; el `container` real és un `div` nou penjat de `body`. Línia 17: `pinta(null, arrel)` per a desmuntar tampoc és API de RTL |
| `src/sections/notes/NotesDataContext.test.jsx` | `useSession ha de ser usat dins de SessionProvider` | `NotesDataContext.jsx:7` i `:26` importen i criden `useSession`; el test (línies 6-7) només simula `backendPort.js` i `IdentitatContext.jsx`. A més, `api.getCurrentUser` és `vi.fn()` sense valor → `NotesDataContext.jsx:53-55` llança «Usuari no identificat» i l'estat mai arriba a `ready` |
| `src/components/PedraSeca/organismes/UniversalCard.test.jsx` | `toast` cridat 0 vegades | Línia 19 simula `../../universal/AvisadorEfimer`, però `UniversalCard.jsx:25` importa `useToast` de `@/components/universal/NotificationContext.jsx` i el crida a la línia 244. El component usa el `showToast` per defecte del context (`NotificationContext.jsx:6-8`), que només fa `console.warn` |
| `tests/backend_consolidacio.test.mjs` | `No test suite found in file` | Escrit amb `node:test` (línia 1). `vite.config.js:48` exclou `tooling/**` però no `tests/**/*.mjs`, i el glob per defecte de vitest inclou `*.test.mjs` |

Nota sobre el segon cas: el mateix error apareix en viu a la consola del navegador en obrir `http://localhost:3340/` sense sessió («Usuari no identificat al sistema de backend»). No és una regressió del test: és el comportament de `NotesDataContext.jsx:53-55` quan no hi ha usuari. [SUPÒSIT] Que eixe `console.error` en producció siga acceptable no és objecte d'este informe.

## 2. Codi de les solucions (tests)

### 2.1 `tests/ui/components-canonics.test.jsx` (fitxer sencer)

Canvis respecte a l'actual: línies 1-4 (capçalera veraç), 6 (`cleanup`), 17-18 (`render(vnode, { container })` i `cleanup()`); la resta de casos queden idèntics. `arrel` continua penjada de `document.body` perquè `document.getElementById` (línia 31, 46, 101) i `document.activeElement` (línia 78) ho necessiten.

```jsx
/**
 * Components canònics de Pedra Seca amb @testing-library/react sobre react-dom 18.
 * `render(vnode, { container })` pinta dins d'una arrel penjada del document:
 * cal que ho estiga per a `document.getElementById` i `document.activeElement`.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render as pinta, cleanup, act } from '@testing-library/react';
import { Camp, CampText, Interruptor, GrupOpcions } from '../../src/components/PedraSeca/organismes/formulari.jsx';
import { Alerta } from '../../src/components/PedraSeca/molecules/Alerta.jsx';
import { Pestanyes } from '../../src/components/PedraSeca/organismes/Pestanyes.jsx';
import { finestraPagines } from '../../src/components/PedraSeca/organismes/navegacio.jsx';
import { Dialeg } from '../../src/components/PedraSeca/organismes/Dialeg.jsx';
import { Boto } from '../../src/components/PedraSeca/atoms/Boto.jsx';
import { Insignia } from '../../src/components/PedraSeca/atoms/Insignia.jsx';

let arrel;
beforeEach(() => { arrel = document.createElement('div'); document.body.appendChild(arrel); });
afterEach(() => { cleanup(); arrel.remove(); });
const render = (vnode) => pinta(vnode, { container: arrel });
const $ = (sel) => arrel.querySelector(sel);
const $$ = (sel) => [...arrel.querySelectorAll(sel)];
const clica = (el) => act(() => { el.click(); });
const tecla = (el, key) => act(() => { el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })); });

describe('Camp', () => {
  it('connecta etiqueta, ajuda i error amb el control', () => {
    render(<Camp etiqueta="Telèfon" ajuda="9 dígits" error="Falta un dígit" obligatori><CampText /></Camp>);
    const input = $('input');
    expect($('label').htmlFor).toBe(input.id);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.required).toBe(true);
    const desc = input.getAttribute('aria-describedby').split(' ').map((id) => document.getElementById(id).textContent);
    expect(desc).toEqual(['9 dígits', 'Falta un dígit']);
  });
  it('un control fora de <Camp> falla tancat', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<CampText />)).toThrow(/dins de <Camp>/);
    err.mockRestore();
  });
});

describe('Interruptor i GrupOpcions', () => {
  it('l’interruptor és un switch amb estat en text', () => {
    const onCanvi = vi.fn();
    render(<Interruptor etiqueta="Avisos" actiu={false} onCanvi={onCanvi} />);
    const sw = $('[role="switch"]');
    expect(document.getElementById(sw.getAttribute('aria-labelledby')).textContent).toBe('Avisos');
    expect(sw.getAttribute('aria-checked')).toBe('false');
    expect(sw.textContent).toContain('No');
    clica(sw);
    expect(onCanvi).toHaveBeenCalledWith(true);
  });
  it('els ràdios viuen dins d’un fieldset amb llegenda', () => {
    render(<GrupOpcions llegenda="Mida" valor="a" opcions={[{ valor: 'a', etiqueta: 'A' }, { valor: 'b', etiqueta: 'B' }]} />);
    const grup = $('fieldset');
    expect(grup.querySelector('legend').textContent).toBe('Mida');
    expect($$('input[type="radio"]')[0].checked).toBe(true);
  });
});

describe('Alerta', () => {
  it('només l’error interromp (role=alert); la resta és status', () => {
    const { rerender } = render(<Alerta to="info">x</Alerta>);
    expect($('[role="status"]')).toBeTruthy();
    rerender(<Alerta to="error">x</Alerta>);
    expect($('[role="alert"]').className).toContain('sdp-alerta--error');
  });
});

describe('Pestanyes', () => {
  it('fletxes, Inici i Fi mouen focus i selecció; només l’activa és tabulable', () => {
    render(<Pestanyes etiqueta="Fitxa" pestanyes={[
      { id: 'a', etiqueta: 'A', contingut: 'pa' }, { id: 'b', etiqueta: 'B', contingut: 'pb' }, { id: 'c', etiqueta: 'C', contingut: 'pc' },
    ]} />);
    const [a, , c] = $$('[role="tab"]');
    expect(a.tabIndex).toBe(0);
    tecla(a, 'ArrowLeft');
    expect(c.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(c);
    expect($$('[role="tabpanel"]').filter((p) => !p.hidden).map((p) => p.textContent)).toEqual(['pc']);
    tecla(c, 'Home');
    expect(a.getAttribute('aria-selected')).toBe('true');
  });
});

describe('Paginacio', () => {
  it('mai més de 7 posicions i sempre primera i última', () => {
    expect(finestraPagines(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(finestraPagines(6, 12)).toEqual([1, '…', 5, 6, 7, '…', 12]);
    expect(finestraPagines(1, 12)).toEqual([1, 2, '…', 12]);
    expect(finestraPagines(12, 12)).toEqual([1, '…', 11, 12]);
    for (let p = 1; p <= 40; p++) expect(finestraPagines(p, 40).length).toBeLessThanOrEqual(7);
  });
});

describe('Dialeg', () => {
  it('té nom accessible i avisa el pare en lloc de tancar-se sol amb Escape', () => {
    const onTanca = vi.fn();
    render(<Dialeg obert titol="Canviar nom" onTanca={onTanca}>cos</Dialeg>);
    const d = $('dialog');
    expect(d.hasAttribute('open')).toBe(true);
    expect(document.getElementById(d.getAttribute('aria-labelledby')).textContent).toBe('Canviar nom');
    const ev = new Event('cancel', { cancelable: true });
    act(() => { d.dispatchEvent(ev); });
    expect(ev.defaultPrevented).toBe(true);
    expect(onTanca).toHaveBeenCalledWith('esc');
  });
});

describe('Boto i Insignia', () => {
  it('carregant desactiva i anuncia', () => {
    render(<Boto carregant>Desar</Boto>);
    const b = $('button');
    expect(b.disabled).toBe(true);
    expect(b.getAttribute('aria-busy')).toBe('true');
    expect(b.textContent).toContain('Treballant');
  });
  it('insígnia de taxonomia reusa les classes vives', () => {
    const { container } = render(<><Insignia tipus="sistema">Mur</Insignia><Insignia to="exit">Ok</Insignia></>);
    expect(container.children[0].className).toBe('sdp-badge-system');
    expect(container.children[1].className).toBe('sdp-insignia sdp-insignia--exit');
  });
});
```

Detall menor: el cas «falla tancat» deixa dos línies `Error: <CampText> ha d'anar dins de <Camp>` a stderr. No és el `console.error` (està silenciat), és jsdom reportant l'excepció que React 18 rellança com a esdeveniment `error` de `window`. No fa caure res; si molesta, s'afegix `window.addEventListener('error', (e) => e.preventDefault(), { once: true })` abans del `expect(...).toThrow`.

### 2.2 `src/sections/notes/NotesDataContext.test.jsx` (fitxer sencer)

Canvis: línies 8-9 (dos `vi.mock` nous: `SessionContext.jsx` per a `generacio`, i `host.js` perquè `NotesDataContext.jsx:59` fa `import('../../host.js').then(m => m.quanLlest())` i no volem arrancar el host real dins del test) i línia 12 (`getCurrentUser` torna un usuari, com exigix `NotesDataContext.jsx:53-56`). `getDraftsForScope` (`GlobalSaveManager.js:47`) ja degrada a `{}` quan jsdom no té IndexedDB (`GlobalSaveManager.js:78-80`); no cal simular-lo.

```jsx
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { NotesDataProvider, useNotesData } from './NotesDataContext';
const api = vi.hoisted(() => ({loadNotes: vi.fn(), createNote: vi.fn(), updateNote: vi.fn(), getCurrentUser: vi.fn()}));
vi.mock('../../data/backendPort.js', () => api);
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({useIdentitat: () => ({actorId: 'user', actorKey: 'user'})}));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({useSession: () => ({generacio: 0})}));
vi.mock('../../host.js', () => ({quanLlest: () => Promise.resolve()}));
test('crea amb la configuració del provider i incorpora la resposta confirmada', async () => {
  const config = {tenantId: 'tenant'};
  api.getCurrentUser.mockReturnValue({id: 'user'});
  api.loadNotes.mockResolvedValue({notes: [{id: 'old'}], noteFolders: []});
  api.createNote.mockResolvedValue({id: 'new', title: 'Guardada', revision: 1});
  const {result} = renderHook(useNotesData, {wrapper: ({children}) => <NotesDataProvider config={config}>{children}</NotesDataProvider>});
  await waitFor(() => expect(result.current.status).toBe('ready'));
  await act(async () => { await result.current.creaNota({title: 'Nova'}); });
  expect(api.createNote).toHaveBeenCalledWith({title: 'Nova'}, config);
  expect(result.current.notes.map(n => n.id)).toEqual(['new', 'old']);
  api.createNote.mockRejectedValueOnce(new Error('sense connexió'));
  await act(async () => { await expect(result.current.creaNota({title: 'Error'})).rejects.toThrow(); });
  expect(result.current.notes.map(n => n.id)).toEqual(['new', 'old']);
});
```

Per què simular `useSession` en lloc d'embolcallar amb `SessionProvider`: `SessionProvider` (`SessionContext.jsx:14-20`) crida `setSessionConfig` i `subscribeSession` del servei de sessió real, que arrossega `backendPort.js` sencer. El test només necessita `generacio` (`NotesDataContext.jsx:26` i `:118`). Un mock de tres paraules és més honest que arrancar mitja aplicació.

### 2.3 `src/components/PedraSeca/organismes/UniversalCard.test.jsx` (fitxer sencer)

Canvi únic: la línia 19 passa a simular `NotificationContext.jsx` (el mòdul que el component importa de veritat) i a exposar `useToast`. La resta és el fitxer actual de l'arbre de treball (està modificat i sense confirmar: `git status` el marca `M`).

```jsx
/**
 * Proves de UniversalCard amb @testing-library/react sobre react-dom 18.
 * (El dictamen 260910 sobre Preact queda superat per la migració a React
 * del 260920.)
 */
import { render } from '@testing-library/react';
import { act } from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), toast: vi.fn() }));

vi.mock('../../../app/contexts/RouterContext', async () => {
  const { createElement: h } = await import('react');
  return {
    useNavigate: () => mocks.navigate,
    Link: ({ to, children, ...resta }) => h('a', { href: to, ...resta }, children)
  };
});
/* El component llig showToast de useToast() (UniversalCard.jsx:25 i :244), no d'AvisadorEfimer. */
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));

import { UniversalCard } from './UniversalCard.jsx';

let arrel;
beforeEach(() => {
  arrel = document.createElement('div'); // arrel separada: no penja del document
  vi.clearAllMocks();
});
afterEach(() => {
  arrel.innerHTML = '';
});
const pinta = (props) => act(() => { render(<UniversalCard {...props} />, { container: arrel }); });
const troba = (selector) => arrel.querySelector(selector);

test('Connectar porta el títol en el nom accessible', () => {
  pinta({ title: 'Fira del Porrat', hasFooter: true });
  expect(troba('.sp-card-connect').getAttribute('aria-label')).toBe('Connectar amb Fira del Porrat');
  expect(troba('.sp-card-connect').textContent).toBe('Connectar');
});

test('showTranslate pinta el botó que abans es perdia, i cada acció porta el títol', () => {
  pinta({ title: 'Fira', hasFooter: true, showTranslate: true });
  const noms = [...arrel.querySelectorAll('.sp-card-action')].map((b) => b.getAttribute('aria-label'));
  expect(noms).toEqual(['Traduir Fira', 'Comentar Fira', 'Compartir Fira']);
});

test('cap contenidor buit: avatar insegur i onDateTime sense data', () => {
  pinta({ title: 'X', avatarUrl: 'javascript:alert(1)', onDateTime: () => {} });
  expect(troba('.sp-card-header')).toBeNull();
  expect(troba('.sp-card-meta')).toBeNull();
  expect(troba('.sp-card-footer')).toBeNull();
});

test('headingLevel fora de llista cau a h3, i labels nul no tomba la targeta', () => {
  pinta({ title: 'X', headingLevel: 'script', labels: null });
  expect(troba('h3.sp-card-title').textContent).toBe('X');
  expect(troba('script')).toBeNull();
  expect(troba('.sp-card-labels')).toBeNull();
});

test('una data «dd/mm/aa» filtra el Mur pel mateix dia', () => {
  pinta({ title: 'X', date: '10/09/26' });
  act(() => { troba('.btn-date-time').click(); });
  expect(mocks.navigate).toHaveBeenCalledWith('/mur?date=2026-09-10');
});

test('compartir sense porta-retalls avisa amb l\'enllaç en lloc de petar', async () => {
  pinta({ title: 'X', hasFooter: true });
  await act(async () => { troba('[aria-label="Compartir X"]').click(); });
  expect(mocks.toast).toHaveBeenCalledWith(expect.stringContaining("No s'ha pogut copiar"), 6000);
});
```

[SUPÒSIT] L'àlies `@` dins de `vi.mock` es resol perquè `vite.config.js:34-37` el declara a `resolve.alias` i el component ja l'usa amb èxit en els 5 casos que passen. En la meua verificació he usat la ruta absoluta (equivalent); si en aplicar-ho l'àlies no es resolguera dins del mock, la forma relativa és `'../../universal/NotificationContext.jsx'`.

### 2.4 `vite.config.js` — excloure la suite `node:test` (una línia)

`tests/backend_consolidacio.test.mjs` s'executa amb `node --test` (com fa `test:porta:psicopatia` a `package.json:13`). Vitest l'ha d'ignorar. Substituir la línia 48:

```js
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', '_wiki_de_poble/**', 'tooling/**', 'tests/**/*.test.mjs']
```

I, perquè no quede orfe, afegir a `package.json` (bloc `scripts`, al costat de `"test": "vitest"` de la línia 77):

```json
    "test:node": "node --test tests/backend_consolidacio.test.mjs",
```

Verificat: `node --test tests/backend_consolidacio.test.mjs` passa els 7 casos (eixida capturada el 20-09-2026 03:27).

## 3. Auditoria de la UI de la Consola Termodinàmica

Fitxers: `src/sections/consola/ConsolaSection.jsx` (230 línies), `src/sections/consola/consolaContent.js` (58), `src/css/components.css:349-367`. Els tres estan confirmats a `10e33db3` (sense diff a l'arbre de treball).

### 3.1 Què està bé (i no cal tocar)

- **Integració amb `UniversalPage`**: `chrome="system"` (`ConsolaSection.jsx:179`) és el mateix mode que `RealitatSection.jsx:68`, `XatControlSection.jsx:14`, `PoblesSection.jsx:46` i `SearchSection.jsx:58`. `PAGE_CHROME_MODES` l'accepta (`UniversalUtils.js:32`). `subtitle` i `lead` es pinten al `.page-intro` de `PageFrame.jsx:303-307`.
- **Pedra Seca sense fuites**: zero `style=` en el DOM renderitzat (comprovat: 0 elements amb atribut `style`); totes les classes pròpies porten prefix `sdp-consola__`; `Taula`, `Pestanyes`, `Dialeg`, `Boto`, `Insignia`, `EstatBuit`, `Carregant`, `Progres` vénen de la façana `components/PedraSeca/index.js`.
- **Accessibilitat estructural**: 3 regions amb nom (`Rebuts de lectura Matrix`, `Inventari de skills`, `Fonts del rebut`); pestanyes amb focus itinerant (`Pestanyes.jsx:24-32`); diàleg sobre `<dialog>` natiu amb `aria-labelledby` (`Dialeg.jsx:63`); ordre de títols H1 → H2 (subtítol) → H2 (diàleg) sense salts.
- **Honestedat de dades**: `PanellCredits` no inventa saldo quan `credits` és `null` (`ConsolaSection.jsx:61-69`), i `normalitza` (`consolaContent.js:14-24`) blinda cada camp.
- **Cicle de vida**: `AbortController` a l'efecte de muntatge (`ConsolaSection.jsx:161-165`).

### 3.2 Troballes (ordenades per gravetat)

| # | Gravetat | On | Què passa |
| --- | --- | --- | --- |
| C1 | A11y | `ConsolaSection.jsx:87` | `<th></th>` buit a la columna d'accions de Rebuts. Confirmat en el render: 1 capçalera buida. Un lector de pantalla anuncia «columna 5, en blanc» a cada fila |
| C2 | A11y | `ConsolaSection.jsx:96` | 38 botons amb el mateix nom accessible «Veure fonts». Sense context de fila, el llistat de controls del lector és inservible |
| C3 | Robustesa | `ConsolaSection.jsx:186` + `:154-159` | «Refrescar» crida `carrega()` **sense senyal**: no cancel·la la petició anterior ni la cancel·la el desmuntatge. Dos clics ràpids són dos `fetch` en carrera i l'últim a arribar guanya, no l'últim demanat. Comprovat: la segona crida a `fetch` porta `{ cache: 'no-store' }` sense `signal` |
| C4 | Robustesa | `ConsolaSection.jsx:158` i `:200-204` | Un refresc fallit amb `dades` ja carregades pinta un `EstatBuit` d'error **damunt** de les pestanyes bones (les dos branques són independents). I un refresc bo posterior no neteja `error`, només `estat` |
| C5 | HTML net | `ConsolaSection.jsx:183-185` | `<p>` sempre present; buit mentre no hi ha `generat`. Contradiu la llei de la casa «cap contenidor buit» que el mateix repositori prova a `UniversalCard.test.jsx:46-51` |
| C6 | Coherència | `ConsolaSection.jsx:181` | `<div className="content-wrapper">` dins de l'`<article className="content-wrapper">` que ja posa `PageFrame.jsx:302`. `base.css:237` només estila `article.content-wrapper`, així que la classe interior és morta. (RealitatSection fa el mateix a la línia 71: és un costum heretat, no una llei) |
| C7 | Coherència | `ConsolaSection.jsx:38-39, 51-52` i `consolaContent.js:57` | Locale `'ca-ES'` cablejat quatre vegades. `UIContext.jsx:45` ja exposa `locale` (`useUIState`). Un usuari en castellà veurà «20/9/2026 3:32:42» en format català |
| C8 | Coherència | `ConsolaSection.jsx:150-151, 176-178` | `t('section.consola.*')` amb valors per defecte, però cap de les 5 llengües de `src/config/i18n.js` (`ca:39`, `es:373`, `en:706`, `eu:1039`, `gl:1376`) declara les claus. Funciona pel `fallback` de `createTranslator` (`i18n.js:1730`), però és l'única secció «system» sense entrada al diccionari |
| C9 | Tokens | `components.css:364` i `:366` | `font-size: 2rem` i una pila monoespaiada literal quan `tokens.css:187-190` ja té `--sdp-font-mono` i `--sdp-text-h2: 2rem`. La porta `tractor-tokens.mjs` no ho ha caçat perquè la pila de fonts no és un color ni un espai |

Dos observacions més, fora del codi de la secció:

- **Exposició del JSON al LAN** [SUPÒSIT de risc, no de bug]: `vite.config.js:24` (`host: true`) i el middleware `tooling/vite/consola-iaia.mjs` servixen `/__iaia/consola.json` **sense cap comprovació** a qualsevol màquina de la xarxa local, mentre que la ruta `/consola` sí que demana superadmin. El JSON conté rutes internes i sha256 de cada fitxer llegit. Si el portàtil obri el dev server en una xarxa compartida, la porta d'entrada és el JSON, no la pàgina. Mitigació d'una línia al middleware: respondre 403 quan `req.socket.remoteAddress` no siga loopback.
- **`EstatBuit` reusa `sdp-buit` tres vegades** (`estats.jsx:12, 13, 16`: contenidor, icona i embolcall d'acció). No és de la Consola, però la Consola en pinta 4 i cada un du la icona amb la classe del contenidor. Ho deixe anotat per a la fitxa de l'àtom.

## 4. Codi de la Consola (llest per aplicar)

### 4.1 `src/sections/consola/ConsolaSection.jsx` (fitxer sencer)

Resol C1-C8. Diferències clau: `useRef` per a un únic `AbortController` viu; `Alerta` inline per a errors de refresc quan ja hi ha dades; `<p>` condicional; capçaleres amb `scope`; `aria-label` per fila; `locale` del context; `Mono` com a micro-helper local per no repetir `className`.

```jsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, Coins, Receipt, Puzzle, RefreshCw } from 'lucide-react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import {
  Alerta, Boto, Dialeg, Taula, Pestanyes, Insignia, EstatBuit, Carregant, Progres
} from '../../components/PedraSeca';
import { useSEO } from '../../hooks/useSEO';
import { useUIActions, useUIState } from '../../app/contexts/UIContext';
import {
  carregaConsola, resumSkills, resumConsums, curt, dataLocal
} from './consolaContent.js';

/* ── Peces internes (sense classes noves fora de sdp-consola__*) ─────────── */

function Xifra({ etiqueta, valor }) {
  return (
    <div className="sdp-consola__xifra">
      <span className="sdp-consola__xifra-valor">{valor}</span>
      <span className="sdp-consola__xifra-etiqueta">{etiqueta}</span>
    </div>
  );
}

const Mono = ({ children }) => <code className="sdp-consola__mono">{children}</code>;

function PanellConsums({ consums, locale }) {
  if (consums.length === 0) {
    return (
      <EstatBuit icona={Activity} titol="Cap consum registrat">
        El diari <Mono>.agents/.diari_sessio.jsonl</Mono> no conté cap entrada <Mono>consum.tokens</Mono>.
        Quan un agent en registre, apareixerà ací sense tocar codi.
      </EstatBuit>
    );
  }
  const { total, perAgent } = resumConsums(consums);
  const n = (x) => x.toLocaleString(locale);
  return (
    <>
      <div className="sdp-consola__resum">
        <Xifra etiqueta="Tòkens d'entrada" valor={n(total.entrada)} />
        <Xifra etiqueta="Tòkens d'eixida" valor={n(total.eixida)} />
        <Xifra etiqueta="Sessions" valor={n(consums.length)} />
      </div>
      <Taula titol="Consum de tòkens per agent" densa>
        <thead>
          <tr><th scope="col">Agent</th><th scope="col">Sessions</th><th scope="col">Entrada</th><th scope="col">Eixida</th></tr>
        </thead>
        <tbody>
          {perAgent.map((a) => (
            <tr key={a.agent}>
              <th scope="row">{a.agent}</th>
              <td>{n(a.sessions)}</td>
              <td>{n(a.entrada)}</td>
              <td>{n(a.eixida)}</td>
            </tr>
          ))}
        </tbody>
      </Taula>
    </>
  );
}

function PanellCredits({ credits }) {
  if (!credits) {
    return (
      <EstatBuit icona={Coins} titol="Sense font de crèdits">
        Cap fitxer del repositori registra el saldo de crèdits de l'eixam. La consola no l'inventa:
        quan hi haja font (§3.6 de l'auditoria 260920_0300), es connecta ací.
      </EstatBuit>
    );
  }
  return (
    <div className="sdp-consola__llista">
      {credits.map((c) => (
        <Progres key={c.proveidor} etiqueta={`${c.proveidor} · ${c.consumit} / ${c.limit}`}
          valor={c.consumit} max={c.limit} />
      ))}
    </div>
  );
}

function PanellRebuts({ rebuts, locale, onVeure }) {
  if (rebuts.length === 0) {
    return (
      <EstatBuit icona={Receipt} titol="Cap rebut Matrix">
        El diari de sessió no té entrades <Mono>matrix.rebut</Mono>.
      </EstatBuit>
    );
  }
  return (
    <Taula titol="Rebuts de lectura Matrix" densa className="sdp-taula--llarga">
      <thead>
        <tr>
          <th scope="col">Data</th>
          <th scope="col">Petició</th>
          <th scope="col">Protocol</th>
          <th scope="col">Fonts</th>
          <th scope="col"><span className="sdp-nomes-lector">Accions</span></th>
        </tr>
      </thead>
      <tbody>
        {rebuts.map((r, i) => {
          const quan = dataLocal(r.t, locale);
          return (
            <tr key={`${r.t}-${r.peticio}-${i}`}>
              <td>{quan}</td>
              <td><Mono>{curt(r.peticio)}</Mono></td>
              <td>{r.protocols.map((p) => p.split('/').pop()).join(', ') || '—'}</td>
              <td>{r.fonts.length}</td>
              <td>
                <Boto varietat="fantasma" onClick={() => onVeure(r)} aria-label={`Veure les ${r.fonts.length} fonts del rebut de ${quan}`}>
                  Veure fonts
                </Boto>
              </td>
            </tr>
          );
        })}
      </tbody>
    </Taula>
  );
}

function PanellSkills({ skills, segell, locale }) {
  const { total, orfes, fantasmes, nucli } = resumSkills(skills);
  return (
    <>
      <div className="sdp-consola__resum">
        <Xifra etiqueta="Skills" valor={total} />
        <Xifra etiqueta="Nucli (core)" valor={nucli.length} />
        <Xifra etiqueta="Orfes (disc sense manifest)" valor={orfes.length} />
        <Xifra etiqueta="Fantasmes (manifest sense disc)" valor={fantasmes.length} />
      </div>
      {segell ? (
        <p className="sdp-consola__segell">
          Segell <Mono>{curt(segell.hash)}</Mono> · {segell.filesCount} fitxers · {dataLocal(segell.timestamp, locale)}
        </p>
      ) : null}
      <Taula titol="Inventari de skills" densa className="sdp-taula--llarga">
        <thead>
          <tr><th scope="col">Skill</th><th scope="col">Estat</th><th scope="col">Manifest</th><th scope="col">Disc</th><th scope="col">Descripció</th></tr>
        </thead>
        <tbody>
          {skills.map((s) => (
            <tr key={s.nom}>
              <th scope="row">{s.core ? <strong>{s.nom}</strong> : s.nom}</th>
              <td>{s.estat ? <Insignia to={s.estat === 'canonic' ? 'exit' : 'info'}>{s.estat}</Insignia> : <Insignia to="neutre">sense estat</Insignia>}</td>
              <td>{s.alManifest ? <Insignia to="exit">sí</Insignia> : <Insignia to="error">no</Insignia>}</td>
              <td>{s.alDisc ? <Insignia to="exit">sí</Insignia> : <Insignia to="error">esborrat</Insignia>}</td>
              <td>{s.descripcio}</td>
            </tr>
          ))}
        </tbody>
      </Taula>
    </>
  );
}

/* ── Secció ─────────────────────────────────────────────────────────────── */

export default function ConsolaSection() {
  const { t } = useUIActions();
  const { locale } = useUIState();
  const [estat, setEstat] = useState('loading');   // loading | ready | absent | error
  const [dades, setDades] = useState(null);
  const [error, setError] = useState(null);
  const [rebutObert, setRebutObert] = useState(null);
  const enCurs = useRef(null);                      // AbortController de la càrrega viva

  const titol = t('section.consola.title', 'Consola Termodinàmica');
  const lead = t('section.consola.lead', "Consums, crèdits, rebuts Matrix i inventari de skills de l'eixam.");
  useSEO({ title: titol, description: lead });

  /* Una sola càrrega viva: refrescar cancel·la l'anterior i desmuntar cancel·la l'última. */
  const carrega = useCallback(() => {
    enCurs.current?.abort();
    const ac = new AbortController();
    enCurs.current = ac;
    setEstat('loading');
    carregaConsola(ac.signal)
      .then((d) => { if (ac.signal.aborted) return; setDades(d); setError(null); setEstat(d ? 'ready' : 'absent'); })
      .catch((e) => { if (ac.signal.aborted) return; setError(e); setEstat('error'); });
  }, []);

  useEffect(() => {
    carrega();
    return () => enCurs.current?.abort();
  }, [carrega]);

  const pestanyes = dades ? [
    { id: 'consums', etiqueta: 'Consums', icona: Activity, contingut: <PanellConsums consums={dades.consums} locale={locale} /> },
    { id: 'credits', etiqueta: 'Crèdits', icona: Coins, contingut: <PanellCredits credits={dades.credits} /> },
    { id: 'rebuts', etiqueta: `Rebuts (${dades.rebuts.length})`, icona: Receipt, contingut: <PanellRebuts rebuts={dades.rebuts} locale={locale} onVeure={setRebutObert} /> },
    { id: 'skills', etiqueta: `Skills (${dades.skills.length})`, icona: Puzzle, contingut: <PanellSkills skills={dades.skills} segell={dades.segell} locale={locale} /> }
  ] : [];

  const missatgeError = error?.message || String(error);

  return (
    <UniversalPage
      title={titol}
      subtitle={t('section.consola.subtitle', 'Manteniment de la IAIA')}
      lead={lead}
      chrome="system"
    >
      <div className="sdp-consola">
        <div className="sdp-consola__capcal">
          {dades?.generat ? (
            <p className="sdp-consola__instantania">
              Instantània: {dataLocal(dades.generat, locale)} · {dades.immunitari.operacions} operacions immunitàries
            </p>
          ) : null}
          <Boto varietat="secundari" icona={RefreshCw} carregant={estat === 'loading'} onClick={carrega}>
            Refrescar
          </Boto>
        </div>

        {estat === 'loading' && !dades ? <Carregant etiqueta="Llegint l'estat de l'eixam…" /> : null}

        {estat === 'absent' ? (
          <EstatBuit titol="Consola no disponible en este entorn">
            El servidor no exposa <Mono>/__iaia/consola.json</Mono>. La consola només existix al servidor
            de desenvolupament (plugin <Mono>sdp:consola-iaia</Mono>).
          </EstatBuit>
        ) : null}

        {estat === 'error' && !dades ? (
          <EstatBuit titol="No s'ha pogut llegir la consola">
            <pre className="sdp-consola__mono">{missatgeError}</pre>
          </EstatBuit>
        ) : null}

        {estat === 'error' && dades ? (
          <Alerta to="error" titol="No s'ha pogut refrescar">
            Es mostra l'última instantània bona. <Mono>{missatgeError}</Mono>
          </Alerta>
        ) : null}

        {dades ? <Pestanyes etiqueta="Panells de la consola" pestanyes={pestanyes} /> : null}
      </div>

      <Dialeg
        obert={rebutObert !== null}
        onTanca={() => setRebutObert(null)}
        titol="Fonts llegides senceres"
        descripcio={rebutObert ? `Petició ${curt(rebutObert.peticio)} · ${dataLocal(rebutObert.t, locale)}` : undefined}
        mida="g"
        accions={<Boto varietat="primari" onClick={() => setRebutObert(null)}>Tancar</Boto>}
      >
        {rebutObert ? (
          <Taula titol="Fonts del rebut" densa>
            <thead><tr><th scope="col">Ruta</th><th scope="col">sha256</th></tr></thead>
            <tbody>
              {rebutObert.fonts.map((f) => (
                <tr key={f.ruta}><td>{f.ruta}</td><td><Mono>{curt(f.sha256)}</Mono></td></tr>
              ))}
            </tbody>
          </Taula>
        ) : null}
      </Dialeg>
    </UniversalPage>
  );
}
```

Nota: `Alerta` ja s'exporta des de la façana (`components/PedraSeca/index.js:21`). `sdp-nomes-lector` existix a `components.css:12-15`. `sdp-taula--llarga` (`sdp.css:70-78`) dona capçalera enganxosa i alçada màxima: l'he afegit també a l'inventari de skills, que ja va per 16 files i creixerà.

### 4.2 `src/sections/consola/consolaContent.js` — dos retocs

Substituir les línies 22 i 54-58:

```js
    immunitari: {
      operacions: Number(brut.immunitari?.operacions) || 0,
      ultima: brut.immunitari?.ultima ?? null
    }
```

```js
export const dataLocal = (iso, locale = 'ca-ES') => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? String(iso) : d.toLocaleString(locale);
};
```

(El primer evita «undefined operacions immunitàries» si el middleware canvia de forma; el segon resol C7.)

### 4.3 `src/css/components.css:349-367` — bloc sencer de substitució

Resol C9 i afegix `flex-wrap` (a 360 px la capçalera actual apreta el botó contra el text) i les dos classes noves (`__instantania`, `__segell`). Es manté dins de `@layer components`, com la resta del fitxer.

```css
  /* ── CONSOLA TERMODINÀMICA ────────────────────────────────────────── */
  .sdp-consola__capcal {
    display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--sdp-space-4);
    margin-bottom: var(--sdp-space-6); padding-bottom: var(--sdp-space-4);
    border-bottom: 2px solid var(--sdp-vora);
  }
  .sdp-consola__instantania, .sdp-consola__segell { margin: 0; color: var(--sdp-text-suau); font-weight: 700; }
  .sdp-consola__segell { margin-bottom: var(--sdp-space-4); }
  .sdp-consola__resum {
    display: grid; gap: var(--sdp-space-4); grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
    margin-bottom: var(--sdp-space-8);
  }
  .sdp-consola__xifra {
    display: flex; flex-direction: column; gap: var(--sdp-space-1);
    padding: var(--sdp-space-4); border: 1px solid var(--sdp-vora); border-radius: var(--sdp-radi-m);
    background: var(--sdp-fons-targeta); text-align: center;
  }
  .sdp-consola__xifra-valor { font-size: var(--sdp-text-h2); font-weight: 800; color: var(--sdp-text-titol); line-height: 1; font-variant-numeric: tabular-nums; }
  .sdp-consola__xifra-etiqueta { font-size: var(--sdp-text-meta); font-weight: 700; color: var(--sdp-text-suau); text-transform: uppercase; }
  .sdp-consola__mono { font-family: var(--sdp-font-mono); font-size: 0.9em; overflow-wrap: anywhere; }
  .sdp-consola__llista { display: flex; flex-direction: column; gap: var(--sdp-space-4); }
```

### 4.4 `src/config/i18n.js` — claus de la secció (resol C8)

Afegir després de `'section.realitat.subtitle'` en cada bloc. Línies de referència: `ca` 54, `es` 390, `en` 723 (i, si es vol completesa, `eu` i `gl` amb el text català com a fallback, com fan altres claus).

```js
    'section.consola.title': 'Consola Termodinàmica',
    'section.consola.subtitle': 'Manteniment de la IAIA',
    'section.consola.lead': "Consums, crèdits, rebuts Matrix i inventari de skills de l'eixam.",
```

```js
    'section.consola.title': 'Consola Termodinámica',
    'section.consola.subtitle': 'Mantenimiento de la IAIA',
    'section.consola.lead': 'Consumos, créditos, recibos Matrix e inventario de skills del enjambre.',
```

```js
    'section.consola.title': 'Thermodynamic Console',
    'section.consola.subtitle': 'IAIA maintenance',
    'section.consola.lead': 'Token usage, credits, Matrix receipts and the swarm skill inventory.',
```

[SUPÒSIT] Els textos dels panells (etiquetes de pestanya, capçaleres de taula, estats buits) queden en valencià sense `t()`. La secció és de superadmin i el diccionari no té cap clau d'eixe nivell per a cap secció «system»; fer-ho a mitges seria pitjor que no fer-ho.

## 5. Verificació realitzada

- **Mètode**: configuració `vitest` temporal al scratchpad que importa `vite.config.js` del repositori amb `mergeConfig`, permet llegir la carpeta temporal (`server.fs.allow`) i enllaça `node_modules` amb un symlink. Els fitxers de test proposats es copien allí amb imports absoluts. Cap fitxer del repositori s'ha creat, modificat ni esborrat.
- **Resultat**: `Test Files 5 passed · Tests 14 passed` (20-09-2026 03:36). Desglossament: components-canonics 10/10, NotesDataContext 1/1, UniversalCard 1/1 (el cas que queia), Consola actual 1/1 (render amb el JSON viu), Consola proposta 1/1 (comprova: cap `content-wrapper` niat, 0 `th` buits, `aria-label` per fila, `<dialog open>`, refresc fallit → `role="alert"` amb les pestanyes intactes, refresc bo → alerta neteja, tota crida `fetch` amb `AbortSignal`).
- **JSON viu**: `GET http://localhost:3340/__iaia/consola.json` → 200; `rebuts: 38`, `consums: 0`, `skills: 16` (tots `canonic`, cap orfe ni fantasma), `credits: null`, `immunitari.operacions: 119`.
- **Navegador**: `/consola` redirigix a l'entrada (superadmin). No he iniciat sessió: la revisió és de DOM i CSS, no visual.

## 6. Incògnites

- Si `@` dins de `vi.mock` no resol en l'entorn de MarIA (vegeu 2.3), cal la ruta relativa.
- Contracte de `credits` (`proveidor`, `consumit`, `limit`) és el «proposat» de l'auditoria anterior; `PanellCredits` no s'ha pogut provar amb dades reals.
- Si `tests/backend_consolidacio.test.mjs` ha d'entrar a la cadena de portes o quedar-se com a `npm run test:node` manual, ho decidix el Consell.

## 7. Bateria de veritat

- [x] He llegit i explorat el codi real en compte de suposar la seua estructura.
- [x] He citat correctament la ruta i les línies del codi original.
- [x] Cap nom de fitxer, funció o variable inventat (`Boto.test.jsx` denunciat com a inexistent).
- [x] Tota conjectura marcada com a [SUPÒSIT] o moguda a Incògnites.
- [x] El frontmatter s'ha comprovat contra `tooling/wiki/schema.json` (claus `type`, `status`, `description`, `tags` dins dels enums; cap clau forastera). El tractor `--estricte` s'executa sobre les arrels de la wiki: passarà quan MarIA deposite el fitxer a `_wiki_de_poble/04_escriptori/`.
