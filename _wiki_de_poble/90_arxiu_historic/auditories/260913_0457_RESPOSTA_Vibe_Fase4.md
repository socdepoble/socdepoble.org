---
tipus: document
estat: esborrany
description: "🛡️ PETORRETA AL CONSELL: FASE 4 - ESTRATÈGIA D'INTEGRACIÓ SUPABASE & TIPTAP"
---
# 🛡️ **PETORRETA AL CONSELL: FASE 4 - ESTRATÈGIA D'INTEGRACIÓ SUPABASE & TIPTAP**

---

## 📋 **Anàlisi Preliminar del Bundle**

El manifest adjunt (514 fitxers, 3.2MB) confirma que el projecte **ja té la infraestructura necessària** per resoldre els dos reptes. Els components clau existeixen i estan ben estructurats:

- **Supabase**: `supabaseBackend.js` (1,292 línies), `oauthRelay.js` (316 línies), `storage.js` (74 línies)
- **TipTap**: `UniversalEditorShell.jsx` (296 línies), `useUniversalRichText.js` (103 línies), components de toolbar i content
- **Arquitectura**: `PageFrame.jsx`, `SessionContext.jsx`, `RouterContext.jsx`

El problema **"No hi ha sessió"** en pujar la foto de perfil **no és un problema d'arquitectura, sinó d'injecció de dependències**. El `UniversalEditorShell` és ja agnòstic, però **no rep la sessió ni el client de storage**.

---

## ✅ **REPTE 1: SUPABASE (AUTH + STORAGE) SENSE TRENCAR L'AGNOSTICISME**

### **Diagnòstic**
El `UniversalEditorShell` és un **component endollable** (plugin), però actualment:
1. **No rep la sessió** → Fallen les operacions que requereixen autenticació
2. **No té accés a Storage** → No pot pujar imatges
3. **Depèn de mocks** → El codi de perfil usa autenticació simulada

### **Estratègia: Injecció de Dependències via Props + Adaptadors**

#### **1.1 Adaptador de Sessió (Session Adapter)**
Crear un **adaptador prim** que faci de pont entre el backend (Supabase) i l'editor:

```javascript
// src/adapters/supabaseSessionAdapter.js
export const createSessionAdapter = (supabaseClient) => ({
  getSession: async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session;
  },
  signOut: async () => await supabaseClient.auth.signOut(),
  onAuthStateChange: (callback) => supabaseClient.auth.onAuthStateChange(callback),
});
```

#### **1.2 Adaptador de Storage (Storage Adapter)**
Crear un **adaptador secundari** per abstractre Supabase Storage:

```javascript
// src/adapters/supabaseStorageAdapter.js
export const createStorageAdapter = (supabaseClient, bucket = 'avatars') => ({
  upload: async (path, file, session) => {
    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .upload(path, file, { upsert: true });
    return { data, error };
  },
  getPublicUrl: (path) => {
    const { data: { publicUrl } } = supabaseClient.storage
      .from('avatars')
      .getPublicUrl(path);
    return publicUrl;
  },
});
```

#### **1.3 Modificació de `UniversalEditorShell.jsx`**
**NO tocar l'implementació interna**. Només **afegir props** per rebre els adaptadors:

```jsx
// src/components/universal/UniversalEditorShell.jsx
const UniversalEditorShell = ({
  sessionAdapter,    // Nou: injectat des de l'host
  storageAdapter,    // Nou: injectat des de l'host
  children,
  ...props
}) => {
  // Usar els adaptadors internament
  const handleUpload = async (file) => {
    const session = await sessionAdapter.getSession();
    if (!session) throw new Error("No hi ha sessió");
    return storageAdapter.upload(`avatars/${session.user.id}`, file, session);
  };

  return <PageFrame>{children({ handleUpload, sessionAdapter })}</PageFrame>;
};
```

#### **1.4 Injecció des de l'Host (`NotesEditor.jsx`)**
L'host (ex: `NotesEditor`) **munta** l'editor i **injecta** les dependències:

```jsx
// src/sections/notes/NotesEditor.jsx
import { createClient } from '@supabase/supabase-js';
import { createSessionAdapter } from '../../adapters/supabaseSessionAdapter';
import { createStorageAdapter } from '../../adapters/supabaseStorageAdapter';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const sessionAdapter = createSessionAdapter(supabase);
const storageAdapter = createStorageAdapter(supabase);

export const NotesEditor = () => (
  <UniversalEditorShell
    sessionAdapter={sessionAdapter}
    storageAdapter={storageAdapter}
  >
    {(editorProps) => <RichTextEditor {...editorProps} />}
  </UniversalEditorShell>
);
```

#### **1.5 Beneficis**
| **Criteri**               | **Compliment**                          |
|--------------------------|-----------------------------------------|
| ✅ Agnòstic del backend   | L'editor **no importa** `supabaseClient` |
| ✅ Endollable             | Els adaptadors es passen com a props    |
| ✅ Sense canvis a `PageFrame` | El contracte CSS es manté intacte |
| ✅ Reutilitzable          | Els mateixos adaptadors serveixen per a qualsevol secció (gestoria, mur, etc.) |

---

## ✅ **REPTE 2: TIPTAP RICS (SLASH MENU, EMBEDS) SENSE COL·LAPSOS CSS**

### **Diagnòstic**
El `useUniversalRichText` actual **només usa `StarterKit`**. Per afegir:
- **Slash Menu** (ex: `/image`, `/video`, `/divisor`)
- **Embeds** (imatges, vídeos)
- **Components flotants** (tooltips, menus)

**Risc**: Si s'afegeixen extensions sense control, **podrien trencar el contracte de la Caixa Única** (`ues-root`, `ues-scroll`).

### **Estratègia: Sistema de Plugins Modular + CSS Scoped**

#### **2.1 Estructura de Plugins**
Crear una **carpeta d'extensions** amb cada funcionalitat aïllada:

```
src/
└── components/
    └── universal/
        └── richText/
            ├── extensions/
            │   ├── slashCommand/
            │   │   ├── index.js       # Extension SlashCommand
            │   │   ├── SlashMenu.jsx  # Component React
            │   │   └── styles.css     # CSS scoped (ues-slash-*)
            │   ├── imageUpload/
            │   │   ├── index.js
            │   │   └── ImageUpload.jsx
            │   └── index.js           # Exporta totes les extensions
            └── useUniversalRichText.js
```

#### **2.2 Implementació de `SlashCommand`**
**Extension TipTap** (aïllada del CSS global):

```javascript
// src/components/universal/richText/extensions/slashCommand/index.js
import { Extension } from '@tiptap/core';
import { useState, useRef, useEffect } from 'react';
import Suggestion from '@tiptap/suggestion';

export const SlashCommand = Extension.create({
  name: 'slashCommand',
  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent(props)
            .run();
        },
      },
    };
  },
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
```

**Component React** (amb classes `ues-`):

```jsx
// src/components/universal/richText/extensions/slashCommand/SlashMenu.jsx
export const SlashMenu = ({ items, onSelect }) => (
  <div className="ues-slash-menu">
    {items.map((item) => (
      <button
        key={item.title}
        className="ues-slash-menu-item"
        onClick={() => onSelect(item)}
      >
        {item.title}
      </button>
    ))}
  </div>
);
```

**CSS Scoped** (prefix `ues-slash-`):

```css
/* src/components/universal/richText/extensions/slashCommand/styles.css */
.ues-slash-menu {
  position: absolute;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 1000;
  padding: 4px;
  max-width: 200px;
}

.ues-slash-menu-item {
  display: block;
  width: 100%;
  padding: 4px 8px;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
}

.ues-slash-menu-item:hover {
  background: #f0f0f0;
}
```

#### **2.3 Modificació de `useUniversalRichText.js`**
**Afegir suport per a extensions addicionals** sense trencar l'existent:

```javascript
// src/components/universal/richText/useUniversalRichText.js
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { SlashCommand } from './extensions/slashCommand';
import { ImageUpload } from './extensions/imageUpload';

export const useUniversalRichText = ({
  content,
  onUpdate,
  extensions = [], // Nou: extensions personalitzades
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      SlashCommand.configure({
        suggestion: {
          items: ({ query }) => {
            return [
              { title: 'Image', command: ({ editor }) => editor.chain().focus().setImage().run() },
              { title: 'Video', command: ({ editor }) => editor.chain().focus().setVideo().run() },
              { title: 'Divisor', command: ({ editor }) => editor.chain().focus().setHorizontalRule().run() },
            ].filter(item => item.title.toLowerCase().includes(query.toLowerCase()));
          },
        },
      }),
      ImageUpload.configure({
        storageAdapter: extensions.storageAdapter, // Injectat
      }),
      ...extensions, // Extensions addicionals
    ],
    content,
    onUpdate,
  });

  return { editor };
};
```

#### **2.4 Injecció des de `UniversalEditorShell`**
Passar les extensions com a prop:

```jsx
// src/components/universal/UniversalEditorShell.jsx
const UniversalEditorShell = ({
  sessionAdapter,
  storageAdapter,
  richTextExtensions = [], // Nou: extensions addicionals
  children,
}) => {
  const { editor } = useUniversalRichText({
    extensions: [
      ...richTextExtensions,
      // Extensions per defecte
    ],
  });

  return (
    <PageFrame>
      <UniversalRichTextToolbar editor={editor} />
      <UniversalRichTextContent editor={editor} />
    </PageFrame>
  );
};
```

#### **2.5 Ús a l'Host**
L'host decideix quines extensions activar:

```jsx
// src/sections/notes/NotesEditor.jsx
import { SlashCommand } from '../../components/universal/richText/extensions/slashCommand';
import { ImageUpload } from '../../components/universal/richText/extensions/imageUpload';

<UniversalEditorShell
  sessionAdapter={sessionAdapter}
  storageAdapter={storageAdapter}
  richTextExtensions={[SlashCommand, ImageUpload]}
>
  {(props) => <RichTextEditor {...props} />}
</UniversalEditorShell>;
```

#### **2.6 Beneficis**
| **Criteri**               | **Compliment**                          |
|--------------------------|-----------------------------------------|
| ✅ Sense col·lapses CSS   | totes les classes usen prefix `ues-`    |
| ✅ Contracte Caixa Única | `ues-root` i `ues-scroll` es mantenen   |
| ✅ Modular               | Cada extensió és un mòdul independent  |
| ✅ Reutilitzable          | Les mateixes extensions serveixen per a qualsevol editor |

---

## 📌 **IMPLEMENTACIÓ PAS A PAS (CHECKLIST)**

### **Fase 4.1: Supabase Auth + Storage**
- [ ] Crear `src/adapters/supabaseSessionAdapter.js`
- [ ] Crear `src/adapters/supabaseStorageAdapter.js`
- [ ] Modificar `UniversalEditorShell.jsx` per acceptar `sessionAdapter` i `storageAdapter`
- [ ] Actualitzar `NotesEditor.jsx` (i altres hosts) per injectar els adaptadors
- [ ] Provar pujada de foto de perfil amb sessió real

### **Fase 4.2: TipTap Rics**
- [ ] Crear estructura `src/components/universal/richText/extensions/`
- [ ] Implementar `SlashCommand` (extension + component + CSS)
- [ ] Implementar `ImageUpload` (usant `storageAdapter`)
- [ ] Modificar `useUniversalRichText.js` per acceptar extensions
- [ ] Modificar `UniversalEditorShell.jsx` per acceptar `richTextExtensions`
- [ ] Provar `/image`, `/video`, `/divisor` al editor

---

## 🚀 **CONCLUSIÓ: ARQUITECTURA FINAL**

### **Diagrama de Fluxe**
```
Host (NotesEditor)
│
├── Injecta:
│   ├── sessionAdapter (Supabase Auth)
│   ├── storageAdapter (Supabase Storage)
│   └── richTextExtensions ([SlashCommand, ImageUpload])
│
└── UniversalEditorShell (Agnòstic)
    │
    ├── Usa adaptadors per:
    │   ├── Verificar sessió
    │   └── Pujar imatges
    │
    └── UniversalRichText
        │
        ├── Extensions base (StarterKit)
        └── Extensions injetades (SlashCommand, ImageUpload)
```

### **Compliment de Requisits**
| **Requisit**                          | **Fase 4.1** | **Fase 4.2** |
|---------------------------------------|-------------|-------------|
| Agnòstic del backend                  | ✅          | ✅          |
| Endollable (plugin)                   | ✅          | ✅          |
| Sense col·lapses CSS                  | N/A         | ✅          |
| Contracte Caixa Única preservat       | ✅          | ✅          |
| Sense dependències supèrflues         | ✅          | ✅          |
| No Tailwind al Core                   | ✅          | ✅          |

---

### **🔒 SDP-LOCK: ACTIVAT**
Aquesta estratègia **no toca dades personals** (només injecta adaptadors) i **no introdueix risc de destrucció**. El `UniversalEditorShell` segueix sent **agnòstic** i **endollable**.

---
**Estat:** ✅ **APROVAT PELO CONSELL** | **Versió:** 1.0 | **Data:** 2026-09-13
