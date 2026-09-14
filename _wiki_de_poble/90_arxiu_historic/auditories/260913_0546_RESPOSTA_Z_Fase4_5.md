---
tipus: document
estat: esborrany
description: "🛡️ RESPOSTA DE Z: FASE 4.5 — PATRÓ ADAPTER"
---
# 🛡️ RESPOSTA DE Z: FASE 4.5 — PATRÓ ADAPTER

Z: Honorables membres del Consell — la Fase 4.5 és el colp de gràcia exacte. Una precisió logística abans de res: **el bundle no m'ha arribat adjunt amb el missatge**, i per tant he treballat sobre l'arquitectura tal com la descriviu (`useUniversalRichText` → `editor`, botons que criden `.chain()` directament). Les costures queden marcades al codi perquè l'encaix amb els vostres fitxers reals siga qüestió d'una línia.

## L'arquitectura d'una ullada

```
UniversalRichTextEditor · LA COSTURA (únic lloc que coneix totes dues parts)
   │
   ├─► useUniversalRichText() ──► editor (TipTap)              [motor]
   │
   ├─► useTiptapToolbarAdapter(editor) ──► { state, exec }     [adapter]
   │        └─ tradueix el contracte ⇄ .chain() / .isActive()
   │
   └─► <UniversalRichTextToolbar state={state} exec={exec} />  [UI muda]
            └─ zero imports d'editor · només toolbarContract.js
```

Regla de dependències: totes les fletxes apunten cap al contracte. La UI importa l'schema; l'adapter no importa la UI; la costura importa tots dos. Cap fletxa creua la frontera en sentit contrari.

Decisió de disseny respecte a la vostra suggestió: en lloc de mètodes nominats (`toggleBold()`, `isActive('bold')`), el contracte usa **IDs de comanda + objecte pla d'estat**. El port es redueix a una sola funció (`exec`) i una instantània de dades — serialitzable, traçable, mockejable — i afegir comandaments futures no toca mai la signatura del contracte.

---

## 1 · El contracte — `toolbarContract.js` (nou)

```js
// ════════════════════════════════════════════════════════════════
// EL CONTRACTE · port neutre de la Caixa Única (Fase 4.5)
// ════════════════════════════════════════════════════════════════
// Únic vocabulari compartit entre la UI de la barra i qualsevol
// motor d'edició. No importa res: és dades i JSDoc, cap editor.
//
//  · La UI consumeix TOOLBAR_SCHEMA + les props { state, exec }.
//  · state  : objecte pla { [id | clauMeta]: boolean } | null.
//  · exec(id, payload?) : l'adapter tradueix al motor real.
//  · Afegir un botó = 1 línia ací + 1 entrada a l'adapter.
//
// @typedef {Record<string, boolean>} ToolbarState
// @typedef {(id: string, payload?: any) => void} ToolbarExec
// @typedef {{ state: ToolbarState | null, exec: ToolbarExec }} ToolbarController
// ════════════════════════════════════════════════════════════════

export const TOOLBAR_SCHEMA = [
  // ── Historial ─────────────────────────────────────────────
  { id: 'undo', glyph: '↺', label: 'Desfer', group: 'historial', requires: 'canUndo' },
  { id: 'redo', glyph: '↻', label: 'Refer',  group: 'historial', requires: 'canRedo' },

  // ── Marques en línia ──────────────────────────────────────
  { id: 'bold',   glyph: 'B',   label: 'Negreta',       group: 'marques', toggle: true },
  { id: 'italic', glyph: 'I',   label: 'Cursiva',       group: 'marques', toggle: true },
  { id: 'strike', glyph: 'S',   label: 'Text ratllat',  group: 'marques', toggle: true },
  { id: 'code',   glyph: '</>', label: 'Codi en línia', group: 'marques', toggle: true },

  // ── Tipus de bloc ─────────────────────────────────────────
  { id: 'paragraph', glyph: '¶',  label: 'Paràgraf',                 group: 'blocs', toggle: true },
  { id: 'heading-1', glyph: 'H1', label: 'Encapçalament de nivell 1', group: 'blocs', toggle: true },
  { id: 'heading-2', glyph: 'H2', label: 'Encapçalament de nivell 2', group: 'blocs', toggle: true },
  { id: 'heading-3', glyph: 'H3', label: 'Encapçalament de nivell 3', group: 'blocs', toggle: true },

  // ── Estructures de bloc ───────────────────────────────────
  { id: 'bullet-list',  glyph: '•',   label: 'Llista amb vinyetes', group: 'estructures', toggle: true },
  { id: 'ordered-list', glyph: '1.',  label: 'Llista numerada',     group: 'estructures', toggle: true },
  { id: 'blockquote',   glyph: '❝',  label: 'Cita',                 group: 'estructures', toggle: true },
  { id: 'code-block',   glyph: '{ }', label: 'Bloc de codi',        group: 'estructures', toggle: true },
];

// Els glifs són strings neutres: substituïbles per components
// d'icones sense tocar ni una línia de lògica.
```

> *Ajust amb el vostre codi real:* l'SCHEMA ha de reflectir **el vostre joc exacte de botons** — afegir o llevar entrades és una línia cadascuna.

---

## 2 · La UI muda — `UniversalRichTextToolbar.jsx` (refactoritzat)

```jsx
// ════════════════════════════════════════════════════════════════
// UNIVERSAL RICH TEXT TOOLBAR · UI PURA
// ════════════════════════════════════════════════════════════════
// Component mut: zero imports d'editor, zero estat intern, zero
// efectes. Només pinta el que li diu el contracte { state, exec }.
// Si demà el motor és Quill o Lexical, este fitxer NO es toca.
// ════════════════════════════════════════════════════════════════
import { memo } from 'react';
import { TOOLBAR_SCHEMA } from './toolbarContract.js';

// Agrupació estàtica, calculada una sola vegada a l'arrencada.
// Els separadors visuals entre grups es resolen amb CSS
// (.universal-toolbar__group + .universal-toolbar__group).
const GROUPS = TOOLBAR_SCHEMA.reduce((grups, btn) => {
  (grups[btn.group] ??= []).push(btn);
  return grups;
}, {});

// memo(): el pare re-renderitza sovint (transaccions, onChange);
// amb `state` i `exec` referencialment estables, la barra s'ho salta.
export const UniversalRichTextToolbar = memo(
  function UniversalRichTextToolbar({ state, exec, disabled = false }) {
    return (
      <div className="universal-toolbar" role="toolbar" aria-label="Format del text">
        {Object.values(GROUPS).map((botons) => (
          <div key={botons[0].group} className="universal-toolbar__group">
            {botons.map((btn) => {
              const actiu = btn.toggle && state?.[btn.id];
              return (
                <button
                  key={btn.id}
                  type="button"
                  className={`universal-toolbar__btn${actiu ? ' universal-toolbar__btn--active' : ''}`}
                  aria-label={btn.label}
                  title={btn.label}
                  aria-pressed={actiu === true || undefined}
                  disabled={disabled || !state || (btn.requires ? !state[btn.requires] : false)}
                  // No li robem el focus a l'editor: la selecció es conserva.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => exec?.(btn.id)}
                >
                  {btn.glyph}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  }
);
```

> *Ajust:* mapegeu els noms de classe neutres als vostres CSS actuals — és l'únic toc cosmètic.

---

## 3 · L'adapter — `tiptapToolbarAdapter.js` (nou)

L'adapter pren forma de *hook* perquè la traducció necessita cicle de vida (subscripció a transaccions), però el seu cor és una **taula de traducció pura**. És l'únic fitxer del front on viu `.chain()`.

```js
// ════════════════════════════════════════════════════════════════
// L'ADAPTER TIPTAP · l'únic lloc del sistema amb sintaxi TipTap
// ════════════════════════════════════════════════════════════════
// Implementa el contracte { state, exec } sobre l'editor que ja
// proporciona useUniversalRichText. Canviar de motor = reescriure
// només este fitxer.
// ════════════════════════════════════════════════════════════════
import { useCallback, useEffect, useState } from 'react';

// Taula de traducció: una entrada per comanda del contracte.
// `run` l'executa; `active` diu si està activa (per a l'estat).
const COMMANDS = {
  undo: { run: (ed) => ed.chain().focus().undo().run() },
  redo: { run: (ed) => ed.chain().focus().redo().run() },

  bold:   { run: (ed) => ed.chain().focus().toggleBold().run(),   active: (ed) => ed.isActive('bold') },
  italic: { run: (ed) => ed.chain().focus().toggleItalic().run(), active: (ed) => ed.isActive('italic') },
  strike: { run: (ed) => ed.chain().focus().toggleStrike().run(), active: (ed) => ed.isActive('strike') },
  code:   { run: (ed) => ed.chain().focus().toggleCode().run(),   active: (ed) => ed.isActive('code') },

  paragraph:   { run: (ed) => ed.chain().focus().setParagraph().run(),           active: (ed) => ed.isActive('paragraph') },
  'heading-1': { run: (ed) => ed.chain().focus().toggleHeading({ level: 1 }).run(), active: (ed) => ed.isActive('heading', { level: 1 }) },
  'heading-2': { run: (ed) => ed.chain().focus().toggleHeading({ level: 2 }).run(), active: (ed) => ed.isActive('heading', { level: 2 }) },
  'heading-3': { run: (ed) => ed.chain().focus().toggleHeading({ level: 3 }).run(), active: (ed) => ed.isActive('heading', { level: 3 }) },

  'bullet-list':  { run: (ed) => ed.chain().focus().toggleBulletList().run(),  active: (ed) => ed.isActive('bulletList') },
  'ordered-list': { run: (ed) => ed.chain().focus().toggleOrderedList().run(), active: (ed) => ed.isActive('orderedList') },
  blockquote:     { run: (ed) => ed.chain().focus().toggleBlockquote().run(),  active: (ed) => ed.isActive('blockquote') },
  'code-block':   { run: (ed) => ed.chain().focus().toggleCodeBlock().run(),   active: (ed) => ed.isActive('codeBlock') },
};

// Instantània del contracte: activacions + metadades.
function snapshot(editor) {
  if (!editor) return null;
  const state = {};
  for (const [id, cmd] of Object.entries(COMMANDS)) {
    state[id] = cmd.active ? cmd.active(editor) : false;
  }
  state.canUndo = editor.can().undo();
  state.canRedo = editor.can().redo();
  return state;
}

// Comparació superficial: si res no ha canviat, mantenim la mateixa
// referència i la UI memoïtzada no es re-renderitza en va.
const shallowEqual = (a, b) =>
  a === b ||
  (a != null && b != null &&
    Object.keys(a).length === Object.keys(b).length &&
    Object.keys(a).every((k) => a[k] === b[k]));

export function useTiptapToolbarAdapter(editor) {
  const [state, setState] = useState(() => snapshot(editor));

  // Reactivitat propietat del contracte: la barra es repinta quan
  // canvien marques o selecció sense dependre dels re-renders del
  // pare — i ens immunitza si useEditor canvia de comportament.
  useEffect(() => {
    if (!editor) { setState(null); return; }
    const refresh = () => setState((prev) => {
      const next = snapshot(editor);
      return shallowEqual(prev, next) ? prev : next;
    });
    refresh();
    editor.on('transaction', refresh);
    return () => { editor.off('transaction', refresh); };
  }, [editor]);

  const exec = useCallback((id, payload) => {
    if (editor && COMMANDS[id]) COMMANDS[id].run(editor, payload);
  }, [editor]);

  return { state, exec };
}
```

---

## 4 · El punt d'unió — `UniversalRichTextEditor.jsx` (la costura)

```jsx
// ════════════════════════════════════════════════════════════════
// LA COSTURA · fragment a refactoritzar al component contenidor
// ════════════════════════════════════════════════════════════════
import { EditorContent } from '@tiptap/react';
import { useUniversalRichText } from '../../hooks/useUniversalRichText';   // existent
import { useTiptapToolbarAdapter } from './tiptapToolbarAdapter';         // nou
import { UniversalRichTextToolbar } from './UniversalRichTextToolbar';    // ara muda

export function UniversalRichTextEditor(props) {
  const { editor } = useUniversalRichText(props);   // existent, intacte

  // L'ÚNICA línia on la UI i el motor es toquen:
  const { state, exec } = useTiptapToolbarAdapter(editor);

  return (
    <div className="universal-richtext">
      {/* Abans: <UniversalRichTextToolbar editor={editor} /> */}
      <UniversalRichTextToolbar state={state} exec={exec} />
      <EditorContent editor={editor} className="universal-richtext__content" />
    </div>
  );
}
```
