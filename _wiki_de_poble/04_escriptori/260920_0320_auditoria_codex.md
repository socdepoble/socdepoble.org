---
type: informe
status: esborrany
description: Auditoria local dels tests RTL i de la Consola Termodinàmica amb correccions proposades i verificació en memòria
tags:
  - escriptori
  - disseny
---

# Auditoria Codex — Frontend RTL i Consola Termodinàmica

**Resultat:** he reproduït 10 errors en tres fitxers de tests. Amb les substitucions proposades, carregades només en memòria, passen les 44 proves dels 11 fitxers del frontend. El codi de producció i els tests del repositori no s’han modificat.

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-AUDITORIA-260920-0320-CODEX |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Data de revisió | 26-09-20 |
| Agent redactor | ChatGPT Codex |
| Propietari | Consell de la Petorreta |
| Aprovació humana | pendent |
| Revisió pendent | sí |
| Base Git consultada | 10e33db377083599b1c3085d70bd024c176f14e7, amb els canvis locals presents |
| Abast d’escriptura | Exclusivament este informe; els blocs són propostes per a IAIA MarIA |

## Vincles i entrades

- [[00_INDEX_ESCRIPTORI]]
- [[260920_0320_PROMPT_Frontend_Tests_UI]]
- [Sistema de Disseny Pedra Seca](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/pedra-seca/SKILL.md:1>)
- [UniversalPage](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/universal-page/SKILL.md:1>)
- [Referència canònica de Disseny](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/disseny/DesignSection.jsx:16>)
- Lectura nativa del checkout. Sense bundle, cerca web, navegador ni consulta externa.
- Este document és la versió de Codex. La revisió interna paral·lela no representa una auditoria de Claude.

## Evidència dels tests

Versions instal·lades llegides dels manifests locals: React i React DOM 18.3.1, RTL 16.3.3 i Vitest 4.1.10. Fonts: [React](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/node_modules/react/package.json:1>), [React DOM](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/node_modules/react-dom/package.json:1>), [RTL](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/node_modules/@testing-library/react/package.json:1>), [Vitest](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/node_modules/vitest/package.json:1>).

| Bateria executada sobre el codi actual | Resultat |
| --- | --- |
| components-canonics | 8 fallides, 2 correctes |
| NotesDataContext | 1 fallida |
| UniversalCard | 1 fallida, 5 correctes |
| PillToggle | 7 correctes |
| Altres 7 fitxers del frontend | 20 correctes |
| Total | 10 fallides, 34 correctes; 11 fitxers |

**T1 — P1: signatura de render incompatible.** El helper passa el contenidor com a segon argument directe, i fa el mateix en rerender i neteja. RTL espera un objecte d’opcions; per això pinta fora d’`arrel` i els selectors retornen null. Fonts: [helper actual, línies 15–22](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tests/ui/components-canonics.test.jsx:15>) i [implementació instal·lada de RTL, línies 242–268](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/node_modules/@testing-library/react/dist/pure.js:242>). El bloc B1 usa render/rerender natius, screen, within, fireEvent i cleanup; conserva les deu proves i reforça teclat, Escape i botó ocupat.

**T2 — P1: el fixture de notes està incomplet.** La fallada reproduïda és `useSession ha de ser usat dins de SessionProvider`. Afegir només el mock de sessió no basta: la càrrega llig `getCurrentUser()?.id` de manera síncrona, espera `quanLlest()` i consulta esborranys. Fonts: [test original, línies 5–19](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesDataContext.test.jsx:5>), [dependències de càrrega, línies 24–60](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesDataContext.jsx:24>) i [guard de sessió, línies 41–44](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/app/contexts/SessionContext.jsx:41>). B2 simula estes fronteres externes i manté real la lògica del provider. No relaxa SessionProvider ni introdueix un usuari fictici en producció.

**T3 — P2: mock de notificació dirigit a un mòdul antic.** UniversalCard obté `showToast` de `useToast()`, però el test simula AvisadorEfimer. Fonts: [import viu](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/PedraSeca/organismes/UniversalCard.jsx:25>), [mock antic](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/PedraSeca/organismes/UniversalCard.test.jsx:19>) i [contracte useToast](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/NotificationContext.jsx:47>). B3 canvia el mock i força, amb restauració posterior, l’absència de share i clipboard.

**T4 — P2: desmuntatge de React absent.** Posar `innerHTML = ''` no equival a desmuntar l’arrel. La configuració no activa globals de Vitest, i RTL només registra autocleanup si troba un afterEach global. Fonts: [PillToggle, línies 9–11](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/PedraSeca/molecules/PillToggle.test.jsx:9>), [UniversalCard, línies 23–30](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/PedraSeca/organismes/UniversalCard.test.jsx:23>), [configuració](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/vite.config.js:39>), [autocleanup instal·lat](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/node_modules/@testing-library/react/dist/index.js:23>) i [cleanup real](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/node_modules/@testing-library/react/dist/pure.js:310>). B1–B5 declaren cleanup explícitament; no cal activar globals ni afegir dependències.

**T5 — P1: smoke test falsament verd.** App.test passa encara que falte ResizeObserver i ErrorBoundary mostre una pantalla d’error: només exigeix que existisca el contenidor. També simula getCurrentUser amb una Promise, mentre el consumidor llig un objecte síncron. Fonts: [test, línies 24–39](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/app/App.test.jsx:24>), [ResizeObserver](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/app/App.jsx:132>), [fallback d’error](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/ErrorBoundary.jsx:15>) i [lectura síncrona](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesDataContext.jsx:51>). B5 manté App, els providers i la ruta reals; simula APIs de l’entorn i backend, espera el botó de la ruta Xat i detecta errors atrapats.

**T6 — P3: avís de React 18 per fetchPriority.** La prova inicial emet l’avís des de [BrandMark](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/BrandMark.jsx:7>). B10 conserva l’atribut del DOM com a `fetchpriority="high"`. La bateria final ja passa sense este avís; B5 exigeix que console.error no reba cap crida, sense filtres ni silenciaments globals.

**Boto.test.jsx no existeix en este checkout.** La cerca local del nom no ha donat resultats. La prova real de Boto és [components-canonics, línies 109–116](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tests/ui/components-canonics.test.jsx:109>); la implementació del botó ocupat ja desactiva i marca aria-busy a [Boto, línies 20–25](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/PedraSeca/atoms/Boto.jsx:20>). B1 la corregeix sense inventar un fitxer independent.

## Auditoria de la Consola

**Integració correcta de base.** La secció delega títol, subtítol i entradilla a UniversalPage amb `chrome="system"`. Este mode existeix i mostra la barra blava sense exigir barra d’autoria taronja. Fonts: [Consola, línies 175–180](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/consola/ConsolaSection.jsx:175>) i [modes reals, línies 154–159](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/PageFrame.jsx:154>). No cal convertir una consola del sistema en una publicació amb autoria inventada.

La Consola reutilitza components de Pedra Seca; les pestanyes implementen selecció, relació tab/panel i navegació per fletxes, Home i End. El diàleg usa el control natiu i restitueix focus. Fonts: [imports de Consola](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/consola/ConsolaSection.jsx:4>), [Pestanyes, línies 23–54](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/PedraSeca/organismes/Pestanyes.jsx:23>), [Dialeg, línies 31–52](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/PedraSeca/organismes/Dialeg.jsx:31>). La ruta té un guard de superadministrador a [App](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/app/App.jsx:569>); això no és una auditoria d’autorització del middleware.

| Troballa | Evidència original | Proposta |
| --- | --- | --- |
| P2: l’índex inclou el títol del diàleg tancat | [diàleg dins de la pàgina](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/consola/ConsolaSection.jsx:209>); [recollida de tots els headings](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/PageFrame.jsx:20>) | B7 deixa el diàleg sempre muntat com a germà de UniversalPage, conservant el retorn de focus. |
| P2 condicionat a payload incorrecte: errors durant render | [normalització superficial](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/consola/consolaContent.js:14>); [credits.map](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/consola/ConsolaSection.jsx:72>); [protocols.map](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/consola/ConsolaSection.jsx:94>) | B8 valida el contracte abans de ready. No converteix dades incorrectes en mètriques zero. |
| P3: el refresc manual no es cancel·la en desmuntar | [càrrega inicial](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/consola/ConsolaSection.jsx:154>); [botó sense signal](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/consola/ConsolaSection.jsx:186>) | B7 usa un AbortController per a totes les càrregues i descarta respostes obsoletes. No s’ha reproduït una carrera concurrent del botó. |
| P3: les dades velles queden visibles sense explicació explícita | [error i panells independents](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/consola/ConsolaSection.jsx:200>) | B7 anuncia l’error i diu que conserva l’última instantània; aria-busy marca el refresc. |
| P3: nom de taula aplicat només a la regió exterior | [Taula](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/PedraSeca/organismes/taula.jsx:9>); [capçalera d’accions buida](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/consola/ConsolaSection.jsx:87>) | B7 afegeix captions locals, scope i noms diferents als botons Veure fonts. |
| P3: recompte etiquetat Sessions sense deduplicació | [etiqueta](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/consola/ConsolaSection.jsx:40>); [increment per registre](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/consola/consolaContent.js:46>) | B7 diu Registres; conserva la clau interna sessions per compatibilitat. |
| P3: empremtes truncades també en el detall | [curt al detall](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/consola/ConsolaSection.jsx:222>) | B7 mostra petició i SHA-256 complets en el diàleg, amb ajust de línia. |
| Recomanació de CSS: capçalera flexible i textos llargs | [bloc actual](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/components.css:350>) | B9 permet wrap, evita mínims de graella superiors al contenidor i limita paràgrafs a 68ch. |
| Desajust amb l’accent d’interacció del sistema | [pestanya seleccionada taronja](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/components.css:237>) | B9 usa els tokens d’acció blaus, només dins de Consola. |

El bloc actual de Consola ja usa colors semàntics, espais i radis amb tokens i no introdueix ombres decoratives: [components.css, línies 349–367](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/components.css:349>). B9 conserva este criteri. Els tokens utilitzats existixen: [touch i font mono](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/tokens.css:171>), [escala d’espais](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/tokens.css:209>) i [acció](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/tokens.css:127>).

L’embolcall interior `div.content-wrapper` és redundant, però no afirme que cause doble padding: la regla llegida aplica a `article.content-wrapper`, [base.css](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/base.css:237>). B7 usa una classe local. Els panells continuen muntats: no introduïsc un canvi de persistència del seu estat ni headings en panells ocults.

B7 deixa de presentar els rebuts com a prova de «lectura sencera»: mostra «Fonts registrades en el rebut». El middleware projecta entrades del diari a la resposta, [consola-iaia.mjs, línies 41–48](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/vite/consola-iaia.mjs:41>); este procés no demostra per si mateix què ha llegit realment un agent.

## Aplicació dels blocs

Blocs independents, delimitats per INICI_BLOC/FI_BLOC. Les rutes són absolutes. B1–B7 i B10 substituïxen fitxers complets. B8 substituïx únicament la funció indicada. B9 substituïx únicament el bloc CSS indicat. No s’ha aplicat cap bloc.

B7, B8 i B9 formen la proposta de Consola i s’han d’aplicar conjuntament. B5 i B10 també s’han d’aplicar conjuntament, perquè la prova d’App exigeix absència d’errors de consola. Els noms auxiliars declarats en els blocs són codi nou proposat, no afirmacions sobre símbols preexistents.

## B1

Fitxer: `/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tests/ui/components-canonics.test.jsx`

Operació proposada: substituir el fitxer complet.

<!-- INICI_BLOC B1 -->
```jsx
/**
 * Components canònics de Pedra Seca sobre React 18 i RTL.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, within, fireEvent, cleanup } from '@testing-library/react';
import { Camp, CampText, Interruptor, GrupOpcions } from '../../src/components/PedraSeca/organismes/formulari.jsx';
import { Alerta } from '../../src/components/PedraSeca/molecules/Alerta.jsx';
import { Pestanyes } from '../../src/components/PedraSeca/organismes/Pestanyes.jsx';
import { finestraPagines } from '../../src/components/PedraSeca/organismes/navegacio.jsx';
import { Dialeg } from '../../src/components/PedraSeca/organismes/Dialeg.jsx';
import { Boto } from '../../src/components/PedraSeca/atoms/Boto.jsx';
import { Insignia } from '../../src/components/PedraSeca/atoms/Insignia.jsx';

afterEach(cleanup);

describe('Camp', () => {
  it('connecta etiqueta, ajuda i error amb el control', () => {
    render(<Camp etiqueta="Telèfon" ajuda="9 dígits" error="Falta un dígit" obligatori><CampText /></Camp>);
    const input = screen.getByRole('textbox', { name: /Telèfon/ });
    expect(screen.getByLabelText(/Telèfon/)).toBe(input);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.required).toBe(true);
    const desc = input.getAttribute('aria-describedby').split(' ')
      .map(id => document.getElementById(id).textContent);
    expect(desc).toEqual(['9 dígits', 'Falta un dígit']);
  });

  it('un control fora de <Camp> falla tancat', () => {
    const errorEsperat = /<CampText> ha d'anar dins de <Camp>/;
    const evitaInformeDuplicat = event => {
      if (errorEsperat.test(event.message)) event.preventDefault();
    };
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    window.addEventListener('error', evitaInformeDuplicat);
    try {
      expect(() => render(<CampText />)).toThrow(errorEsperat);
    } finally {
      window.removeEventListener('error', evitaInformeDuplicat);
      err.mockRestore();
    }
  });
});

describe('Interruptor i GrupOpcions', () => {
  it('l’interruptor és un switch amb estat en text', () => {
    const onCanvi = vi.fn();
    render(<Interruptor etiqueta="Avisos" actiu={false} onCanvi={onCanvi} />);
    const sw = screen.getByRole('switch', { name: 'Avisos' });
    expect(sw.getAttribute('aria-checked')).toBe('false');
    expect(sw.textContent).toContain('No');
    fireEvent.click(sw);
    expect(onCanvi).toHaveBeenCalledWith(true);
  });

  it('els ràdios viuen dins d’un fieldset amb llegenda', () => {
    render(<GrupOpcions llegenda="Mida" valor="a" opcions={[
      { valor: 'a', etiqueta: 'A' }, { valor: 'b', etiqueta: 'B' }
    ]} />);
    const grup = screen.getByRole('group', { name: 'Mida' });
    expect(grup.tagName).toBe('FIELDSET');
    expect(within(grup).getByRole('radio', { name: 'A' }).checked).toBe(true);
    expect(within(grup).getByRole('radio', { name: 'B' }).checked).toBe(false);
  });
});

describe('Alerta', () => {
  it('només l’error interromp (role=alert); la resta és status', () => {
    const { rerender } = render(<Alerta to="info">x</Alerta>);
    expect(screen.getByRole('status')).toBeTruthy();
    rerender(<Alerta to="error">x</Alerta>);
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByRole('alert').className).toContain('sdp-alerta--error');
  });
});

describe('Pestanyes', () => {
  it('fletxes, Inici i Fi mouen focus i selecció; només l’activa és tabulable', () => {
    render(<Pestanyes etiqueta="Fitxa" pestanyes={[
      { id: 'a', etiqueta: 'A', contingut: 'pa' },
      { id: 'b', etiqueta: 'B', contingut: 'pb' },
      { id: 'c', etiqueta: 'C', contingut: 'pc' }
    ]} />);
    const [a, b, c] = screen.getAllByRole('tab');
    expect([a.tabIndex, b.tabIndex, c.tabIndex]).toEqual([0, -1, -1]);
    fireEvent.keyDown(a, { key: 'ArrowLeft' });
    expect(c.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(c);
    expect(screen.getByRole('tabpanel').textContent).toBe('pc');
    expect([a.tabIndex, b.tabIndex, c.tabIndex]).toEqual([-1, -1, 0]);
    fireEvent.keyDown(c, { key: 'Home' });
    expect(a.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(a);
    fireEvent.keyDown(a, { key: 'End' });
    expect(document.activeElement).toBe(c);
    fireEvent.keyDown(c, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(a);
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
  it('té nom accessible i avisa el pare amb Escape sense tancar-se sol', () => {
    const onTanca = vi.fn();
    const { rerender } = render(<Dialeg obert titol="Canviar nom" onTanca={onTanca}>cos</Dialeg>);
    const d = screen.getByRole('dialog', { name: 'Canviar nom' });
    expect(d.open).toBe(true);
    const ev = new Event('cancel', { cancelable: true });
    fireEvent(d, ev);
    expect(ev.defaultPrevented).toBe(true);
    expect(onTanca).toHaveBeenCalledWith('esc');
    expect(d.open).toBe(true);
    rerender(<Dialeg obert={false} titol="Canviar nom" onTanca={onTanca}>cos</Dialeg>);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('Boto i Insignia', () => {
  it('carregant desactiva i anuncia', () => {
    const onClick = vi.fn();
    const { rerender } = render(<Boto carregant onClick={onClick}>Desar</Boto>);
    const b = screen.getByRole('button', { name: 'Treballant…' });
    expect(b.disabled).toBe(true);
    expect(b.getAttribute('aria-busy')).toBe('true');
    fireEvent.click(b);
    expect(onClick).not.toHaveBeenCalled();
    rerender(<Boto onClick={onClick}>Desar</Boto>);
    fireEvent.click(screen.getByRole('button', { name: 'Desar' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('insígnia de taxonomia reusa les classes vives', () => {
    render(<><Insignia tipus="sistema">Mur</Insignia><Insignia to="exit">Ok</Insignia></>);
    expect(screen.getByText('Mur').className).toBe('sdp-badge-system');
    expect(screen.getByText('Ok').className).toBe('sdp-insignia sdp-insignia--exit');
  });
});
```
<!-- FI_BLOC B1 -->

## B2

Fitxer: `/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesDataContext.test.jsx`

Operació proposada: substituir el fitxer complet.

<!-- INICI_BLOC B2 -->
```jsx
import React from 'react';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { NotesDataProvider, useNotesData } from './NotesDataContext';

const mocks = vi.hoisted(() => ({
  loadNotes: vi.fn(),
  createNote: vi.fn(),
  updateNote: vi.fn(),
  getCurrentUser: vi.fn(),
  quanLlest: vi.fn(),
  getDraftsForScope: vi.fn(),
  generacio: 1
}));

vi.mock('../../data/backendPort.js', () => ({
  loadNotes: mocks.loadNotes,
  createNote: mocks.createNote,
  updateNote: mocks.updateNote,
  getCurrentUser: mocks.getCurrentUser
}));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({
  useIdentitat: () => ({ actorId: 'user', actorKey: 'user' })
}));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({
  useSession: () => ({ generacio: mocks.generacio })
}));
vi.mock('../../host.js', () => ({ quanLlest: mocks.quanLlest }));
vi.mock('./GlobalSaveManager.js', () => ({
  getDraftsForScope: mocks.getDraftsForScope
}));

afterEach(cleanup);
beforeEach(() => {
  vi.resetAllMocks();
  mocks.generacio = 1;
  mocks.getCurrentUser.mockReturnValue({ id: 'user' });
  mocks.quanLlest.mockResolvedValue(undefined);
  mocks.getDraftsForScope.mockResolvedValue({});
  mocks.loadNotes.mockResolvedValue({
    notes: [{ id: 'old', revision: 1 }],
    noteFolders: []
  });
  mocks.createNote.mockResolvedValue({ id: 'new', title: 'Guardada', revision: 1 });
});

test('crea amb la configuració del provider i incorpora la resposta confirmada', async () => {
  const config = { tenantId: 'tenant' };
  const wrapper = ({ children }) => <NotesDataProvider config={config}>{children}</NotesDataProvider>;
  const { result, unmount } = renderHook(useNotesData, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  expect(mocks.loadNotes).toHaveBeenCalledWith('user', {
    ...config,
    signal: expect.any(AbortSignal)
  });
  expect(mocks.getDraftsForScope).toHaveBeenCalledWith('supabase_user_tenant');

  await act(async () => {
    const creada = await result.current.creaNota({ title: 'Nova' });
    expect(creada).toEqual({ id: 'new', title: 'Guardada', revision: 1 });
  });
  expect(mocks.createNote).toHaveBeenCalledWith({ title: 'Nova' }, config);
  expect(result.current.notes.map(n => n.id)).toEqual(['new', 'old']);

  mocks.createNote.mockRejectedValueOnce(new Error('sense connexió'));
  await act(async () => {
    await expect(result.current.creaNota({ title: 'Error' })).rejects.toThrow('sense connexió');
  });
  expect(result.current.notes.map(n => n.id)).toEqual(['new', 'old']);

  const signal = mocks.loadNotes.mock.calls[0][1].signal;
  unmount();
  expect(signal.aborted).toBe(true);
});
```
<!-- FI_BLOC B2 -->

## B3

Fitxer: `/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/PedraSeca/organismes/UniversalCard.test.jsx`

Operació proposada: substituir el fitxer complet; respectar altres canvis que IAIA haja fet després de l’auditoria.

<!-- INICI_BLOC B3 -->
```jsx
/**
 * Proves de UniversalCard amb @testing-library/react sobre react-dom 18.
 * (El dictamen 260910 sobre Preact queda superat per la migració a React
 * del 260920.)
 */
import { render, act, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), toast: vi.fn() }));

vi.mock('../../../app/contexts/RouterContext', async () => {
  const { createElement: h } = await import('react');
  return {
    useNavigate: () => mocks.navigate,
    Link: ({ to, children, ...resta }) => h('a', { href: to, ...resta }, children)
  };
});
vi.mock('../../universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: mocks.toast })
}));

import { UniversalCard } from './UniversalCard.jsx';

let arrel;
beforeEach(() => {
  arrel = document.createElement('div'); // arrel separada: no penja del document
  vi.clearAllMocks();
});
afterEach(cleanup);
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
  const shareOriginal = Object.getOwnPropertyDescriptor(navigator, 'share');
  const clipboardOriginal = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  Object.defineProperties(navigator, {
    share: { configurable: true, value: undefined },
    clipboard: { configurable: true, value: undefined }
  });
  try {
    pinta({ title: 'X', hasFooter: true });
    await act(async () => { troba('[aria-label="Compartir X"]').click(); });
    expect(mocks.toast).toHaveBeenCalledWith(
      expect.stringContaining("No s'ha pogut copiar"), 6000
    );
  } finally {
    if (shareOriginal) Object.defineProperty(navigator, 'share', shareOriginal);
    else delete navigator.share;
    if (clipboardOriginal) Object.defineProperty(navigator, 'clipboard', clipboardOriginal);
    else delete navigator.clipboard;
  }
});
```
<!-- FI_BLOC B3 -->

## B4

Fitxer: `/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/PedraSeca/molecules/PillToggle.test.jsx`

Operació proposada: substituir el fitxer complet; canvien la documentació del motor i la neteja, es conserven les set proves.

<!-- INICI_BLOC B4 -->
```jsx
/** Proves de PillToggle sobre React 18 i RTL. */
import { render, act, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { PillToggle } from './PillToggle.jsx';

let arrel;
beforeEach(() => { arrel = document.createElement('div'); });
afterEach(cleanup);

const OPCIONS = [
  { valor: 'cards', text: 'Universal Cards' },
  { valor: 'compacta', text: 'Vista Comprimida' },
];
const pinta = (props) => act(() => { render(<PillToggle etiqueta="Vista" opcions={OPCIONS} {...props} />, { container: arrel }); });
const botons = () => [...arrel.querySelectorAll('button')];

test('grup etiquetat amb un botó natiu per opció', () => {
  pinta({ valor: 'cards' });
  const grup = arrel.querySelector('.sdp-pindola');
  expect(grup.getAttribute('role')).toBe('group');
  expect(grup.getAttribute('aria-label')).toBe('Vista');
  expect(botons().map((b) => b.textContent)).toEqual(['Universal Cards', 'Vista Comprimida']);
  expect(botons().every((b) => b.getAttribute('type') === 'button')).toBe(true);
});

test('una sola opció premuda i aria-pressed sempre explícit ("true"/"false")', () => {
  pinta({ valor: 'compacta' });
  expect(botons().map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'true']);
});

test('l\'estat no depén de cap classe --active', () => {
  pinta({ valor: 'cards' });
  expect(arrel.innerHTML).not.toMatch(/--active/);
  expect(arrel.innerHTML).not.toMatch(/\bpill\b/);
});

test('onCanvi rep el valor, també si ja és l\'actiu (el consumidor decidix)', () => {
  const onCanvi = vi.fn();
  pinta({ valor: 'cards', onCanvi });
  act(() => { botons()[1].click(); });
  act(() => { botons()[0].click(); });
  expect(onCanvi.mock.calls).toEqual([['compacta'], ['cards']]);
});

test('sense onCanvi no peta', () => {
  pinta({ valor: 'cards' });
  expect(() => act(() => { botons()[1].click(); })).not.toThrow();
});

test('className s\'afegix sense perdre la classe base', () => {
  pinta({ valor: 'cards', className: 'sdp-pindola--centrada onboarding-form__pindola' });
  expect(arrel.firstElementChild.className).toBe('sdp-pindola sdp-pindola--centrada onboarding-form__pindola');
});

test('la icona és decorativa', () => {
  act(() => {
    render(<PillToggle opcions={[{ valor: 'a', text: 'A', icona: <svg /> }]} valor="a" />, { container: arrel });
  });
  expect(arrel.querySelector('.sdp-pindola__icona').getAttribute('aria-hidden')).toBe('true');
});
```
<!-- FI_BLOC B4 -->

## B5

Fitxer: `/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/app/App.test.jsx`

Operació proposada: substituir el fitxer complet.

<!-- INICI_BLOC B5 -->
```jsx
import { afterEach, expect, test, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import PedraSecaEmbed from '../PedraSecaEmbed';
import { CONTRACTE_NUCLI } from '../data/contracte.js';
import { getBackendImplementation, setBackendImplementation } from '../data/backendPort.js';

vi.mock('../host.js', () => ({ quanLlest: async () => undefined }));
vi.mock('../sections/notes/GlobalSaveManager.js', async importOriginal => ({
  ...await importOriginal(),
  getDraftsForScope: async () => ({})
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test('arranca el shell real i carrega els providers sense activar ErrorBoundary', async () => {
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  vi.stubGlobal('matchMedia', vi.fn(query => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })));
  const peticioExterna = vi.fn(() => { throw new Error('Xarxa inesperada al smoke test'); });
  vi.stubGlobal('fetch', peticioExterna);
  const inesperat = vi.fn(name => { throw new Error('Mètode inesperat: ' + name); });
  const errors = vi.spyOn(console, 'error');
  const anterior = { ...getBackendImplementation() };
  const backend = {
    ...Object.fromEntries(CONTRACTE_NUCLI.map(name => [name, (...args) => inesperat(name, ...args)])),
    getCurrentUser: () => ({ id: '123' }),
    getRuntimeDataMode: () => 'local',
    getBackendConfigurat: () => true,
    getDefaultUserId: () => '123',
    recullTornadaOAuth: async () => null,
    loadCoreContent: vi.fn(async () => ({ towns: [], pages: [], agents: [] })),
    loadMur: vi.fn(async () => ({ feedPosts: [], events: [], marketItems: [] })),
    loadNotes: vi.fn(async () => ({ notes: [], noteFolders: [] })),
    loadMultimedia: vi.fn(async () => ({ mediaItems: [], mediaTimelineGroups: [] })),
    loadFils: vi.fn(async () => [])
  };
  setBackendImplementation(backend);
  try {
    render(<PedraSecaEmbed config={{ routerType: 'memory' }} />);
    await waitFor(() => {
      expect(backend.loadCoreContent).toHaveBeenCalled();
      expect(backend.loadNotes).toHaveBeenCalled();
      expect(backend.loadMur).toHaveBeenCalled();
      expect(backend.loadMultimedia).toHaveBeenCalled();
      expect(backend.loadFils).toHaveBeenCalled();
      expect(screen.getByRole('main')).toBeTruthy();
    });
    await screen.findByRole('button', { name: 'Nova conversa' });
    expect(screen.queryByText("No s'ha pogut carregar Sóc de Poble")).toBeNull();
    expect(screen.queryByText('Hi ha hagut un problema')).toBeNull();
    expect(inesperat).not.toHaveBeenCalled();
    expect(peticioExterna).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
  } finally {
    cleanup();
    // Si hi havia backend, el restaurem; el cas inicial buit queda aïllat per Vitest.
    if (Object.keys(anterior).length) setBackendImplementation(anterior);
  }
});
```
<!-- FI_BLOC B5 -->

## B6

Fitxer: `/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/xat/XatSection.test.jsx`

Operació proposada: substituir el fitxer complet; només s’actualitza el mock de notificació de la línia original 34.

<!-- INICI_BLOC B6 -->
```jsx
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import XatSection from './XatSection';
import { construeixRetall } from './retall';

const mocks = vi.hoisted(() => ({ creaNota: vi.fn(), navigate: vi.fn(), threadId: 'a' }));

vi.mock('../../app/contexts/RouterContext', () => ({ 
  useNavigate: () => mocks.navigate,
  useParams: () => ({ threadId: mocks.threadId }),
  useRouter: () => ({ navigate: mocks.navigate, currentPath: '/xat' })
}));

vi.mock('../../pages/NotFoundPage', () => ({ default: () => null }));
vi.mock('../../components/universal/ContentProvider', () => ({ ContentProvider: ({children}) => children }));
vi.mock('../text/TextSection', () => ({ default: () => null }));
vi.mock('../../app/contexts/UIContext', () => ({ 
  useUIActions: () => ({t: (_, fallback) => fallback, resolveAsset: (v) => v}),
  useUIState: () => ({ language: 'ca', externalConfig: {} }) 
}));
vi.mock('../../app/contexts/IdentitatContext', () => ({
  useIdentitat: () => ({ actorType: 'persona', actorId: 'usuari123' })
}));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({pageCopy: {}}) }));
vi.mock('../notes/NotesDataContext', () => ({ useNotesData: () => ({creaNota: mocks.creaNota}) }));
vi.mock('./XatContext', () => ({ 
  useXat: () => ({
    chatThreads: [{id: 'a', title: 'Conversa'}, {id: 'b', title: 'Altra'}], 
    getThreadMessages: () => [{id: '1', text: 'Primer', sender: 'me'}, {id: '2', text: 'Segon', sender: 'other', author: 'Veí'}], 
    sendChatMessage: vi.fn()
  }) 
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: vi.fn() })
}));

afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); mocks.threadId = 'a'; });

test('selecció en ordre i navegació després de confirmar', async () => {
  let resolve;
  mocks.creaNota.mockReturnValue(new Promise(r => {resolve = r;}));
  render(<XatSection />); 
  
  // Obrir menú
  const menuButtons = document.querySelectorAll('.xat-header-btn');
  fireEvent.click(menuButtons[2]); // MoreHorizontal
  
  // Seleccionar "Seleccionar missatges"
  fireEvent.click(screen.getByText('Seleccionar missatges'));
  
  const send = screen.getByRole('button', {name: /Enviar al Bloc de Notes/});
  expect(send.disabled).toBe(true);
  
  // Triar missatges
  const bubbles = document.querySelectorAll('.sdp-chat-bubble--triable');
  fireEvent.click(bubbles[1]); // Segon missatge
  fireEvent.click(bubbles[0]); // Primer missatge
  
  fireEvent.click(send); 
  
  expect(mocks.creaNota).toHaveBeenCalledTimes(1);
  const retall = mocks.creaNota.mock.calls[0][0];
  // Ha d'estar en ordre cronològic (el DOMPurify i l'html escapat s'ha provat a banda, ací provem que es passen bé)
  expect(retall.content).toContain('Primer');
  expect(retall.content).toContain('Segon');
  
  expect(mocks.navigate).not.toHaveBeenCalled();
  
  resolve({id: 'new-note'});
  await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/notes?nota=new-note'));
});

test('retall.js saneja i escapa correctament', () => {
  const fil = { title: '<img>' };
  const missatges = [{author: '<b>', text: '<script>alert(1)</script>\n&'}];
  const retall = construeixRetall({ fil, missatges, locale: 'ca-ES' });
  
  expect(retall.title).toBe('Retall de «&lt;img&gt;»');
  expect(retall.content).toContain('&lt;script&gt;alert(1)&lt;/script&gt;<br>&amp;');
  expect(retall.content).not.toContain('<script>');
});
```
<!-- FI_BLOC B6 -->

## B7

Fitxer: `/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/consola/ConsolaSection.jsx`

Operació proposada: substituir el fitxer complet.

<!-- INICI_BLOC B7 -->
```jsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, Coins, Receipt, Puzzle, RefreshCw } from 'lucide-react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import {
  Boto, Dialeg, Taula, Pestanyes, Insignia, EstatBuit, Carregant, Progres
} from '../../components/PedraSeca';
import { useSEO } from '../../hooks/useSEO';
import { useUIActions } from '../../app/contexts/UIContext';
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

function PanellConsums({ consums }) {
  if (consums.length === 0) {
    return (
      <EstatBuit icona={Activity} titol="Cap consum registrat">
        El diari <code className="sdp-consola__mono">.agents/.diari_sessio.jsonl</code> no conté cap
        entrada <code className="sdp-consola__mono">consum.tokens</code>. Quan un agent en registre,
        apareixerà ací sense tocar codi.
      </EstatBuit>
    );
  }
  const { total, perAgent } = resumConsums(consums);
  return (
    <>
      <div className="sdp-consola__resum">
        <Xifra etiqueta="Tòkens d'entrada" valor={total.entrada.toLocaleString('ca-ES')} />
        <Xifra etiqueta="Tòkens d'eixida" valor={total.eixida.toLocaleString('ca-ES')} />
        <Xifra etiqueta="Registres" valor={consums.length} />
      </div>
      <Taula titol="Consum de tòkens per agent" densa>
        <caption className="sr-only">Consum de tòkens per agent</caption>
        <thead>
          <tr><th scope="col">Agent</th><th scope="col">Registres</th><th scope="col">Entrada</th><th scope="col">Eixida</th></tr>
        </thead>
        <tbody>
          {perAgent.map((a) => (
            <tr key={a.agent}>
              <td>{a.agent}</td>
              <td>{a.sessions}</td>
              <td>{a.entrada.toLocaleString('ca-ES')}</td>
              <td>{a.eixida.toLocaleString('ca-ES')}</td>
            </tr>
          ))}
        </tbody>
      </Taula>
    </>
  );
}

function PanellCredits({ credits }) {
  if (!credits || credits.length === 0) {
    return (
      <EstatBuit icona={Coins} titol={credits === null ? "Sense font de crèdits" : "Cap proveïdor registrat"}>
        No hi ha dades de crèdits disponibles en esta instantània.
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

function PanellRebuts({ rebuts, onVeure }) {
  if (rebuts.length === 0) {
    return <EstatBuit icona={Receipt} titol="Cap rebut Matrix">El diari de sessió no té entrades <code className="sdp-consola__mono">matrix.rebut</code>.</EstatBuit>;
  }
  return (
    <Taula titol="Rebuts de lectura Matrix" densa>
      <caption className="sr-only">Rebuts de lectura Matrix</caption>
      <thead>
        <tr><th scope="col">Data</th><th scope="col">Petició</th><th scope="col">Protocol</th><th scope="col">Fonts</th><th scope="col">Accions</th></tr>
      </thead>
      <tbody>
        {rebuts.map((r, index) => (
          <tr key={`${r.t}-${r.peticio}-${index}`}>
            <td>{dataLocal(r.t)}</td>
            <td className="sdp-consola__mono">{curt(r.peticio)}</td>
            <td>{r.protocols.map((p) => p.split('/').pop()).join(', ') || '—'}</td>
            <td>{r.fonts.length}</td>
            <td><Boto varietat="fantasma" aria-label={`Veure fonts del rebut ${index + 1}, ${dataLocal(r.t)}`} onClick={() => onVeure(r)}>Veure fonts</Boto></td>
          </tr>
        ))}
      </tbody>
    </Taula>
  );
}

function PanellSkills({ skills, segell }) {
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
        <p>
          Segell <code className="sdp-consola__mono">{curt(segell.hash)}</code> · {segell.filesCount} fitxers ·
          {' '}{dataLocal(segell.timestamp)}
        </p>
      ) : null}
      <Taula titol="Inventari de skills" densa>
        <caption className="sr-only">Inventari de skills</caption>
        <thead>
          <tr><th scope="col">Skill</th><th scope="col">Estat</th><th scope="col">Manifest</th><th scope="col">Disc</th><th scope="col">Descripció</th></tr>
        </thead>
        <tbody>
          {skills.map((s) => (
            <tr key={s.nom}>
              <td>{s.core ? <strong>{s.nom}</strong> : s.nom}</td>
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
  const [estat, setEstat] = useState('loading');
  const [dades, setDades] = useState(null);
  const [error, setError] = useState('');
  const [rebutObert, setRebutObert] = useState(null);
  const peticioRef = useRef(null);

  useSEO({
    title: t('section.consola.title', 'Consola Termodinàmica'),
    description: t('section.consola.lead', "Consums, crèdits, rebuts Matrix i inventari de skills de l'eixam."),
    index: false
  });

  const carrega = useCallback(async () => {
    peticioRef.current?.abort();
    const controlador = new AbortController();
    peticioRef.current = controlador;
    setEstat('loading');
    setError('');
    try {
      const nova = await carregaConsola(controlador.signal);
      if (controlador.signal.aborted || peticioRef.current !== controlador) return;
      setDades(nova);
      setEstat(nova ? 'ready' : 'absent');
      if (!nova) setRebutObert(null);
    } catch (causa) {
      if (controlador.signal.aborted || peticioRef.current !== controlador) return;
      setError(causa instanceof Error ? causa.message : String(causa));
      setEstat('error');
    } finally {
      if (peticioRef.current === controlador) peticioRef.current = null;
    }
  }, []);

  useEffect(() => {
    void carrega();
    return () => {
      peticioRef.current?.abort();
      peticioRef.current = null;
    };
  }, [carrega]);

  const pestanyes = dades ? [
    { id: 'consums', etiqueta: 'Consums', icona: Activity, contingut: <PanellConsums consums={dades.consums} /> },
    { id: 'credits', etiqueta: 'Crèdits', icona: Coins, contingut: <PanellCredits credits={dades.credits} /> },
    { id: 'rebuts', etiqueta: `Rebuts (${dades.rebuts.length})`, icona: Receipt,
      contingut: <PanellRebuts rebuts={dades.rebuts} onVeure={setRebutObert} /> },
    { id: 'skills', etiqueta: `Skills (${dades.skills.length})`, icona: Puzzle,
      contingut: <PanellSkills skills={dades.skills} segell={dades.segell} /> }
  ] : [];

  const anunci = estat === 'ready' ? 'Instantània de la consola actualitzada.'
    : estat === 'absent' ? 'La consola no està disponible en este entorn.'
      : estat === 'loading' && dades ? 'Actualitzant la instantània…' : '';

  return (
    <>
      <UniversalPage
        title={t('section.consola.title', 'Consola Termodinàmica')}
        subtitle={t('section.consola.subtitle', 'Manteniment de la IAIA')}
        lead={t('section.consola.lead', "Consums, crèdits, rebuts Matrix i inventari de skills de l'eixam.")}
        chrome="system"
      >
        <div className="sdp-consola__contingut">
          <p className="sr-only" role="status" aria-atomic="true">{anunci}</p>
          <div className="sdp-consola__capcal">
            <p>
              {dades
                ? <>Instantània: {dataLocal(dades.generat)} · {dades.immunitari.operacions} operacions immunitàries</>
                : 'Estat de la consola'}
            </p>
            <Boto varietat="secundari" icona={RefreshCw}
              carregant={estat === 'loading'} onClick={() => { void carrega(); }}>
              Refrescar
            </Boto>
          </div>

          {estat === 'loading' && !dades
            ? <Carregant etiqueta="Llegint l'estat de l'eixam…" /> : null}

          {estat === 'absent' ? (
            <EstatBuit titol="Consola no disponible en este entorn">
              Esta consola necessita el servidor de desenvolupament del projecte.
            </EstatBuit>
          ) : null}

          {estat === 'error' ? (
            <div role="alert">
              <EstatBuit titol="No s'ha pogut llegir la consola">
                <p>{dades
                  ? 'Es conserva l’última instantània. Les dades no s’han actualitzat.'
                  : 'No s’ha carregat cap instantània. Torna-ho a provar amb Refrescar.'}</p>
                <p className="sdp-consola__mono">{error}</p>
              </EstatBuit>
            </div>
          ) : null}

          {dades ? (
            <div aria-busy={estat === 'loading'}>
              <Pestanyes etiqueta="Panells de la consola" pestanyes={pestanyes} />
            </div>
          ) : null}
        </div>
      </UniversalPage>

      <Dialeg
        obert={rebutObert !== null}
        onTanca={() => setRebutObert(null)}
        titol="Fonts registrades en el rebut"
        descripcio={rebutObert ? `Rebut del ${dataLocal(rebutObert.t)}` : undefined}
        mida="g"
        accions={<Boto varietat="primari" onClick={() => setRebutObert(null)}>Tancar</Boto>}
      >
        {rebutObert ? (
          <>
            <p>Petició: <code className="sdp-consola__mono">{rebutObert.peticio || '—'}</code></p>
            <Taula titol="Fonts del rebut" densa>
              <caption className="sr-only">Fonts del rebut</caption>
              <thead><tr><th scope="col">Ruta</th><th scope="col">SHA-256</th></tr></thead>
              <tbody>
                {rebutObert.fonts.map((font, index) => (
                  <tr key={`${font.ruta}-${font.sha256}-${index}`}>
                    <th scope="row" className="sdp-consola__mono">{font.ruta}</th>
                    <td className="sdp-consola__mono">{font.sha256}</td>
                  </tr>
                ))}
              </tbody>
            </Taula>
            {rebutObert.fonts.length === 0 ? <p>El rebut no conté fonts.</p> : null}
          </>
        ) : null}
      </Dialeg>
    </>
  );
}
```
<!-- FI_BLOC B7 -->

## B8

Fitxer: `/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/consola/consolaContent.js`

Operació proposada: substituir normalitza, línies originals 14–24. Conservar FONT_CONSOLA, carregaConsola, resumSkills, resumConsums, curt i dataLocal.

<!-- INICI_BLOC B8 -->
```js
export function normalitza(brut) {
  const falla = camp => { throw new Error(`Resposta de consola invàlida: ${camp}.`); };
  const objecte = (v, camp) => {
    if (!v || typeof v !== 'object' || Array.isArray(v)) falla(camp);
    return v;
  };
  const llista = (v, camp) => {
    if (!Array.isArray(v)) falla(camp);
    return v;
  };
  const text = (v, camp, nul = false, buit = false) => {
    if (nul && v === null) return v;
    if (typeof v !== 'string' || (!buit && !v.trim())) falla(camp);
    return v;
  };
  const boolea = (v, camp) => {
    if (typeof v !== 'boolean') falla(camp);
    return v;
  };
  const numero = (v, camp, enter = false, positiu = false) => {
    if (typeof v !== 'number' && !(typeof v === 'string' && v.trim())) falla(camp);
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0 || (positiu && n === 0)
      || (enter && !Number.isSafeInteger(n))) falla(camp);
    return n;
  };

  const b = objecte(brut, 'resposta');
  const rebuts = llista(b.rebuts, 'rebuts').map((v, i) => {
    const r = objecte(v, `rebuts[${i}]`);
    return {
      ...r,
      t: text(r.t, `rebuts[${i}].t`, true),
      peticio: text(r.peticio, `rebuts[${i}].peticio`, true),
      protocols: llista(r.protocols, `rebuts[${i}].protocols`).map((p, j) =>
        text(p, `rebuts[${i}].protocols[${j}]`)),
      fonts: llista(r.fonts, `rebuts[${i}].fonts`).map((vFont, j) => {
        const f = objecte(vFont, `rebuts[${i}].fonts[${j}]`);
        return { ...f,
          ruta: text(f.ruta, `rebuts[${i}].fonts[${j}].ruta`),
          sha256: text(f.sha256, `rebuts[${i}].fonts[${j}].sha256`) };
      })
    };
  });
  const consums = llista(b.consums, 'consums').map((v, i) => {
    const c = objecte(v, `consums[${i}]`);
    return { ...c,
      agent: text(c.agent, `consums[${i}].agent`),
      entrada: numero(c.entrada, `consums[${i}].entrada`, true),
      eixida: numero(c.eixida, `consums[${i}].eixida`, true) };
  });
  const credits = b.credits === null ? null : llista(b.credits, 'credits').map((v, i) => {
    const c = objecte(v, `credits[${i}]`);
    return { ...c,
      proveidor: text(c.proveidor, `credits[${i}].proveidor`),
      consumit: numero(c.consumit, `credits[${i}].consumit`),
      limit: numero(c.limit, `credits[${i}].limit`, false, true) };
  });
  const noms = new Set();
  const skills = llista(b.skills, 'skills').map((v, i) => {
    const s = objecte(v, `skills[${i}]`);
    const nom = text(s.nom, `skills[${i}].nom`);
    if (noms.has(nom)) falla(`skills[${i}].nom duplicat`);
    noms.add(nom);
    return { ...s, nom,
      estat: text(s.estat, `skills[${i}].estat`, true, true),
      descripcio: text(s.descripcio, `skills[${i}].descripcio`, false, true),
      core: boolea(s.core, `skills[${i}].core`),
      alDisc: boolea(s.alDisc, `skills[${i}].alDisc`),
      alManifest: boolea(s.alManifest, `skills[${i}].alManifest`) };
  });
  let segell = null;
  if (b.segell !== null) {
    const s = objecte(b.segell, 'segell');
    segell = { ...s,
      hash: text(s.hash, 'segell.hash'),
      timestamp: text(s.timestamp, 'segell.timestamp'),
      filesCount: numero(s.filesCount, 'segell.filesCount', true) };
  }
  const immunitari = objecte(b.immunitari, 'immunitari');
  return {
    generat: text(b.generat, 'generat', true),
    rebuts, consums, credits, skills, segell,
    immunitari: { ...immunitari, operacions: numero(immunitari.operacions, 'immunitari.operacions', true) }
  };
}
```
<!-- FI_BLOC B8 -->

## B9

Fitxer: `/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/components.css`

Operació proposada: substituir el bloc CONSOLA TERMODINÀMICA, línies originals 349–367, dins de @layer components. Conservar la resta del full.

<!-- INICI_BLOC B9 -->
```css
/* ── CONSOLA TERMODINÀMICA ────────────────────────────────────────── */
  .sdp-consola__contingut {
    min-width: 0;
    color: var(--sdp-text-cos);
    line-height: 1.6;
  }
  .sdp-consola__contingut p { max-width: 68ch; }
  .sdp-consola__capcal {
    display: flex; flex-wrap: wrap; align-items: center;
    justify-content: space-between; gap: var(--sdp-space-4);
    margin-bottom: var(--sdp-space-6); padding-bottom: var(--sdp-space-4);
    border-bottom: 2px solid var(--sdp-vora);
    color: var(--sdp-text-suau); font-weight: 700;
  }
  .sdp-consola__capcal > p {
    flex: 1 1 20rem; min-width: 0; margin: 0; overflow-wrap: anywhere;
  }
  .sdp-consola__capcal > button { flex: 0 0 auto; }
  .sdp-consola__resum {
    display: grid; gap: var(--sdp-space-4);
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
    margin-bottom: var(--sdp-space-8);
  }
  .sdp-consola__xifra {
    display: flex; flex-direction: column; gap: var(--sdp-space-1);
    min-width: 0; padding: var(--sdp-space-4);
    border: 1px solid var(--sdp-vora); border-radius: var(--sdp-radi-m);
    background: var(--sdp-fons-targeta); text-align: center;
    overflow-wrap: anywhere;
  }
  .sdp-consola__xifra-valor {
    font-size: 2rem; font-weight: 800; color: var(--sdp-text-titol);
    line-height: 1.2; font-variant-numeric: tabular-nums;
  }
  .sdp-consola__xifra-etiqueta {
    font-size: var(--sdp-text-meta); font-weight: 700;
    color: var(--sdp-text-suau); line-height: 1.6;
  }
  .sdp-consola__mono {
    font-family: var(--sdp-font-mono); font-size: 0.9em;
    white-space: normal; overflow-wrap: anywhere;
  }
  .sdp-consola__llista {
    display: flex; flex-direction: column; gap: var(--sdp-space-4);
  }
  .sdp-consola__contingut .sdp-pestanyes__pestanya[aria-selected="true"] {
    color: var(--sdp-accio-text);
    border-bottom-color: var(--sdp-accio);
  }
```
<!-- FI_BLOC B9 -->

## B10

Fitxer: `/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/BrandMark.jsx`

Operació proposada: substituir el fitxer complet. L’únic canvi funcional és la grafia de l’atribut fetchpriority, per a React 18.

<!-- INICI_BLOC B10 -->
```jsx
import logoDark from '../assets/ui/logo-socdepoble-rect-negre.svg';
import logoLight from '../assets/ui/logo-socdepoble-rect-blanc.svg';

export default function BrandMark({ variant = 'light', className = '' }) {
  const src = variant === 'dark' ? logoDark : logoLight;

  return <img className={className} src={src} alt="Sóc de Poble" fetchpriority="high" />;
}
```
<!-- FI_BLOC B10 -->

## Verificació efectuada

1. Execució de les onze suites del frontend sense alterar-ne els fitxers: 10 fallides i 34 correctes.
2. Execució final dels blocs JS/JSX de la proposta, inclosos B7, B8 i B10, mitjançant un plugin Vite que retorna els textos proposats des de memòria: **44/44, 11/11 fitxers, sense avisos ni errors de consola en esta execució**. Configuració local, `--configLoader runner`, cache desactivada. B9 s’ha comprovat sintàcticament; no s’ha renderitzat CSS.
3. Quatre proves addicionals efímeres de la proposta B7+B8 amb jsdom i components reals UniversalPage/PageFrame/Dialeg: **4/4**. Verifiquen càrrega, diàleg fora del contenidor de pàgina i retorn de focus, error amb dades conservades, cancel·lació del refresc manual, 404 i payload invàlid. UIContext, router, SEO i fetch estaven simulats; això no acredita la navegació real ni l’aspecte visual.
4. B8 accepta la resposta local de `recullConsola()`. En eixa lectura hi havia 38 rebuts, 16 skills, zero registres de consum i crèdits null. Són dades de la instantània llegida, no valors a codificar.
5. B8 rebutja cinc entrades controlades: credits com a objecte, rebut incomplet, skill null, consum Infinity i consum negatiu.
6. Sintaxi dels blocs JS/JSX i CSS comprovada amb els parsers locals.
7. Frontmatter passat pel codi del tractor estricte en una vista de lectura d’un sol document: **F1–F8 = 0, exit 0**. No és una aprovació del corpus complet de la Wiki. El tractor calcula l’abast per directoris i inclou una comprovació d’entropia del corpus: [abast del tractor](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/tractor-frontmatter.mjs:166>), [entropia](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/tractor-frontmatter.mjs:372>).

Comanda per a IAIA després d’aplicar els blocs:

```bash
cd '/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org'
./node_modules/.bin/vitest run src tests/ui --configLoader runner --no-cache
```

## Incògnites i límits

- **No hi ha comprovació visual amb navegador.** Queden per contrastar en renderitzat real el contrast computat, zoom, mida tàctil, distribució a 320 px, tema fosc i desplaçament. No es declara conformitat WCAG completa.
- Les proves de jsdom no acrediten la capa superior, el backdrop o la trampa de focus nativa de tots els navegadors.
- B8 endureix explícitament el contracte: els camps declarats han d’existir i els comptadors han de ser vàlids. Ha acceptat la instantània llegida; si una futura font publica un esquema diferent, s’ha d’adaptar abans de connectar-la.
- En el codi original, sumar tòkens usa Number(x) || 0. B8 valida els registres rebuts abans del render, però no converteix resumConsums en una API genèrica segura per a qualsevol crida externa ni verifica sumes superiors a Number.MAX_SAFE_INTEGER.
- La càrrega considera absent només HTTP 404; un servidor de producció amb fallback SPA que responga HTML 200 generarà un error de JSON, [carregaConsola](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/consola/consolaContent.js:7>). No s’ha comprovat eixe entorn.
- No s’ha executat el conjunt de tests de backend, build, migracions ni portes que puguen escriure artefactes. L’abast validat és el frontend indicat.
- B10 resol l’avís de React 18 en la prova; no s’ha mesurat la prioritat de xarxa de les imatges en un navegador real.
- Hi havia canvis locals previs i activitat documental concurrent. Les cites corresponen al codi llegit. IAIA ha de comparar els blocs amb el destí abans d’aplicar substitucions completes.
- No s’han actualitzat ESTAT, índexs, ledger, mirrors ni fitxers de govern: l’organització i l’aplicació de codi continuen en mans d’IAIA MarIA.

## Bateria de veritat

- [x] Codi real llegit amb accés natiu.
- [x] Diagnòstics amb rutes i línies del codi original.
- [x] Cap Boto.test.jsx fictici ni funció existent inventada.
- [x] Correccions dels tests executades en memòria sense aplicar-les al repositori.
- [x] Proposta funcional de Consola comprovada en jsdom.
- [x] Frontmatter validat en mode estricte sobre el document aïllat.
- [x] Sense web ni navegador.
- [x] Cap fitxer de codi o de tests modificat.
- [ ] Verificació visual real: pendent per la prohibició expressa de navegador.
- [ ] Aplicació de codi: pendent d’IAIA MarIA.
