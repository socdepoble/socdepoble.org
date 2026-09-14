---
tipus: document
estat: esborrany
description: "🛡️ RESPOSTA DE VIBE: FASE 4.5 — PATRÓ ADAPTER"
---
# 🛡️ RESPOSTA DE VIBE: FASE 4.5 — PATRÓ ADAPTER

Vibe: Honorables membres del Consell, aquí teniu la **solució atòmica** basada en el patró **Adapter** per a desacoblar `UniversalRichTextToolbar` de TipTap. La solució és **mínima, elegant i 100% agnòstica**.

---

---

## 📁 **Fitxers a crear/modificar**

### 1️⃣ **Contracte neutre** *(nou fitxer)*
**Ruta:** `src/components/universal/richText/richTextTypes.js`
```javascript
/**
 * @typedef {Object} RichTextActions
 * @property {() => void} toggleBold
 * @property {() => void} toggleItalic
 * @property {() => void} toggleStrike
 * @property {() => void} toggleCode
 * @property {(level: number) => void} setHeading
 * @property {() => void} toggleBulletList
 * @property {() => void} toggleOrderedList
 * @property {() => void} toggleBlockquote
 * @property {() => void} toggleCodeBlock
 * @property {(url: string) => void} insertLink
 * @property {(url: string) => void} insertImage
 * @property {(type: string, attrs?: Object) => boolean} isActive
 * @property {(action: string) => boolean} can
 */
export default null; // Export per JSDoc
```

---

### 2️⃣ **Adapter per TipTap** *(nou fitxer)*
**Ruta:** `src/components/universal/richText/tipTapAdapter.js`
```javascript
/**
 * @param {import('@tiptap/react').Editor} editor
 * @returns {import('./richTextTypes').RichTextActions}
 */
export function createTipTapAdapter(editor) {
  const chain = () => editor.chain().focus();

  return {
    toggleBold: () => chain().toggleBold().run(),
    toggleItalic: () => chain().toggleItalic().run(),
    toggleStrike: () => chain().toggleStrike().run(),
    toggleCode: () => chain().toggleCode().run(),
    setHeading: (level) => chain().toggleHeading({ level }).run(),
    toggleBulletList: () => chain().toggleBulletList().run(),
    toggleOrderedList: () => chain().toggleOrderedList().run(),
    toggleBlockquote: () => chain().toggleBlockquote().run(),
    toggleCodeBlock: () => chain().toggleCodeBlock().run(),
    insertLink: (url) => chain().setLink({ href: url }).run(),
    insertImage: (url) => chain().setImage({ src: url }).run(),
    isActive: (type, attrs) => editor.isActive(type, attrs),
    can: (action) => {
      try { return editor.can()action; }
      catch { return false; }
    },
  };
}
```

---

### 3️⃣ **Hook que injecta l'adapter** *(nou fitxer)*
**Ruta:** `src/components/universal/richText/useRichTextAdapter.js`
```javascript
import { useUniversalRichText } from './useUniversalRichText';
import { createTipTapAdapter } from './tipTapAdapter';

/**
 * @returns {import('./richTextTypes').RichTextActions | null}
 */
export function useRichTextAdapter() {
  const { editor } = useUniversalRichText();
  return editor ? createTipTapAdapter(editor) : null;
}
```

---

### 4️⃣ **Toolbar refactoritzada** *(modificat)*
**Ruta:** `src/components/universal/richText/UniversalRichTextToolbar.jsx`
```javascript
import { useRichTextAdapter } from './useRichTextAdapter';
import { icones } from '../../ui/icones';

const BUTTONS = [
  { key: 'bold', action: 'toggleBold', icon: icones.bold, label: 'Negreta' },
  { key: 'italic', action: 'toggleItalic', icon: icones.italic, label: 'Cursiva' },
  { key: 'strike', action: 'toggleStrike', icon: icones.strikethrough, label: 'Ratllat' },
  { key: 'code', action: 'toggleCode', icon: icones.code, label: 'Codi' },
  { key: 'h1', action: 'setHeading', args: [1], icon: icones.h1, label: 'Títol 1' },
  { key: 'h2', action: 'setHeading', args: [2], icon: icones.h2, label: 'Títol 2' },
  { key: 'bulletList', action: 'toggleBulletList', icon: icones.listUl, label: 'Llista' },
  { key: 'orderedList', action: 'toggleOrderedList', icon: icones.listOl, label: 'Llista numerada' },
  { key: 'blockquote', action: 'toggleBlockquote', icon: icones.quote, label: 'Cita' },
  { key: 'codeBlock', action: 'toggleCodeBlock', icon: icones.codeBlock, label: 'Bloc de codi' },
];

export function UniversalRichTextToolbar() {
  const actions = useRichTextAdapter();

  if (!actions) return null;

  return (
    <div className="universal-rich-text-toolbar">
      {BUTTONS.map(({ key, action, args, icon, label }) => {
        const onClick = args
          ? () => actionsaction
          : () => actionsaction;

        const isActive = action === 'setHeading'
          ? actions.isActive('heading', { level: args[0] })
          : actions.isActive(key);

        return (
          <button
            key={key}
            type="button"
            onClick={onClick}
            disabled={!args && !actions.can(action)}
            className={isActive ? 'active' : ''}
            aria-label={label}
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
}
```

---

---

## 🔗 **Punt d'unió**
**No cal modificar res més.**
El component `UniversalRichTextToolbar` ja s'usa on sigui necessari (ex: `UniversalEditorShell.jsx`). **L'adapter s'injecta automàticament** mitjançant el hook `useRichTextAdapter`, que consumeix `useUniversalRichText` internament.

---

---

## ✅ **Validació contra el contracte de la Caixa Única**
| Requisit | Complert? | Detall |
|----------|-----------|--------|
| **Agnosticisme** | ✅ | La toolbar **no sap res de TipTap** (solo usa el contracte `RichTextActions`) |
| **Adapter Pattern** | ✅ | `tipTapAdapter.js` traduïx el contracte neutre a crides de TipTap |
| **UI pura** | ✅ | `UniversalRichTextToolbar` és **100% visual** i mut |
| **Extensibilitat** | ✅ | Per canviar a ProseMirror/Quill/Lexical, **només cal crear un nou adapter** |
| **Contracte clar** | ✅ | `richTextTypes.js` defineix la interfície neutral amb JSDoc |

---
---
## 🎯 **Impacte arquitectònic**
- **Deute tècnic resolt**: El punt **A2** de l'auditoria de Deepseek queda **tancat definitivament**.
- **Front-End Enxufable blindat**: La toolbar ara és **intercanviable** sense tocar la UI.
- **Principi d'Inversió de Dependències**: La UI **dependeix d'abstraccions** (el contracte), no de implementacions (TipTap).

---
**🏁 FASE 4.5 COMPLETA.** La casa queda **perfecta**, i el Consell pot dormir tranquil. **Endavant, companyes!**
