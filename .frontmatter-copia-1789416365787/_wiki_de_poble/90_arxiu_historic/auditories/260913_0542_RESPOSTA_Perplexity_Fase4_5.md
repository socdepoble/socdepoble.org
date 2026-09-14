# 🛡️ RESPOSTA DE PERPLEXITY: FASE 4.5 — PATRÓ ADAPTER

Perplexity: La solució més neta és separar tres capes: contracte neutre, adapter TipTap i toolbar visual. L’adapter és l’únic lloc que coneix editor.chain(), mentre que UniversalRichTextToolbar només rep accions i estat.
La proposta següent encaixa amb els tres fitxers reals del bundle i manté intacte useUniversalRichText.

## 1. Contracte i adapter
`src/components/universal/richText/richTextAdapter.js`

```javascript
export const RICH_TEXT_MARKS = { 
  bold: 'bold', 
  italic: 'italic', 
  strike: 'strike', 
  heading: 'heading', 
  bulletList: 'bulletList', 
} 

/** 
 * Contracte neutre consumit per qualsevol toolbar. 
 * 
 * @typedef {Object} RichTextCommands 
 * @property {() => void} toggleBold 
 * @property {() => void} toggleItalic 
 * @property {() => void} toggleStrike 
 * @property {(level?: number) => void} toggleHeading 
 * @property {() => void} toggleBulletList 
 * @property {(name: string, attributes?: object) => boolean} isActive 
 */ 

/** 
 * Adapter de TipTap al contracte universal de rich text. 
 * 
 * @param {import('@tiptap/core').Editor | null} editor 
 * @returns {RichTextCommands} 
 */ 
export function createTipTapRichTextAdapter(editor) { 
  const run = (command) => { 
    if (!editor || editor.isDestroyed) return false 
    return editor.chain().focus()[command.name](...command.args).run() 
  } 

  return { 
    toggleBold: () => run({ name: 'toggleBold', args: [] }), 
    toggleItalic: () => run({ name: 'toggleItalic', args: [] }), 
    toggleStrike: () => run({ name: 'toggleStrike', args: [] }), 
    toggleHeading: (level = 2) => run({ name: 'toggleHeading', args: [{ level }], }), 
    toggleBulletList: () => run({ name: 'toggleBulletList', args: [], }), 
    isActive: (name, attributes) => { 
      if (!editor || editor.isDestroyed) return false 
      return editor.isActive(name, attributes) 
    }, 
  } 
}
```

La interfície queda definida pel mateix objecte retornat per createTipTapRichTextAdapter. Si més avant el projecte migra a TypeScript, aquest contracte pot convertir-se directament en una interface RichTextCommands.

## 2. Toolbar pura
`src/components/universal/richText/UniversalRichTextToolbar.jsx`

```jsx
import UniversalToolbar from '../UniversalToolbar' 

export function UniversalRichTextToolbar({ 
  commands, 
  onPublish, 
  publishDisabled, 
  isPublished, 
  t, 
}) { 
  const formatState = { 
    isHeading: commands.isActive('heading', { level: 2 }), 
    isList: commands.isActive('bulletList'), 
    isBold: commands.isActive('bold'), 
    isItalic: commands.isActive('italic'), 
    isStrike: commands.isActive('strike'), 
  } 

  const formatActions = { 
    toggleHeading: () => commands.toggleHeading(2), 
    toggleList: commands.toggleBulletList, 
    toggleBold: commands.toggleBold, 
    toggleItalic: commands.toggleItalic, 
    toggleStrike: commands.toggleStrike, 
  } 

  return ( 
    <UniversalToolbar 
      onPublish={onPublish} 
      publishDisabled={publishDisabled} 
      isPublished={isPublished} 
      formatState={formatState} 
      formatActions={formatActions} 
      t={t} 
    /> 
  ) 
}
```

Aquest component ja no rep editor, no importa cap API de TipTap i no executa cap cadena específica del motor. La seua única responsabilitat és transformar el contracte neutre en les props visuals que espera UniversalToolbar.

## 3. Punt d’unió
`src/sections/notes/NotesEditor.jsx`

Afig l’import de l’adapter:
```javascript
import { createTipTapRichTextAdapter } from '../../../components/universal/richText/richTextAdapter'
```

Després de crear l’editor:
```javascript
const editor = useUniversalRichText({ 
  content: activeNote?.content, 
  id: activeNote?.id, 
  extensions, 
  onChange: (html, noteId) => { 
    if (noteId) { setLocalNoteField(noteId, 'content', html) } 
  }, 
  onSave: (html, noteId) => { 
    if (noteId) { saveNoteField(noteId, 'content', html) } 
  }, 
  debounceMs: 800, 
}) 

const richTextCommands = createTipTapRichTextAdapter(editor)
```

I substituïx el topBar actual per:
```jsx
const topBar = ( 
  <UniversalRichTextToolbar 
    commands={richTextCommands} 
    onPublish={publishNote} 
    publishDisabled={!activeNote} 
    isPublished={activeNote?.isPublished} 
    t={t} 
  /> 
)
```

### Resultat arquitectònic
```
NotesEditor 
│ 
├── useUniversalRichText() 
│   └── editor TipTap 
│ 
├── createTipTapRichTextAdapter(editor) 
│   └── RichTextCommands 
│ 
└── UniversalRichTextToolbar 
    └── UniversalToolbar
```

La dependència queda dirigida en una sola direcció:
TipTap → adapter → contracte neutre → toolbar visual

Per a un futur motor, només caldria afegir, per exemple:
`createLexicalRichTextAdapter(editor)`
amb el mateix contracte:
`{ toggleBold, toggleItalic, toggleStrike, toggleHeading, toggleBulletList, isActive, }`

La UI de la toolbar i el punt d’injecció no haurien de canviar.
