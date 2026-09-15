---
tipus: document
estat: esborrany
description: "🛡️ AUDITORIA ESTRATÈGICA: FASE 4 — SUPABASE I TIPTAP EXTENSIONS"
---
# 🛡️ AUDITORIA ESTRATÈGICA: FASE 4 — SUPABASE I TIPTAP EXTENSIONS

> **Qui Som:** Som l'Associació ecologista El Rentonar i Sóc de Poble. L'hereu de més de 30 anys d'activisme rural. La nostra identitat digital va néixer a `rentonar.blogspot.com`, va evolucionar a `socdepoble.net`, i avui es construeix `socdepoble.org` (el Mas).  
> **Filosofia:** Online-First estricte (React SPA + Supabase BaaS). No Online-First. El backend és la única font de veritat.

---

## 1. EL REPTE DE SUPABASE I STORAGE

### Diagnòstic de l'error "No hi ha sessió"

L'error es produeix a `src/data/supabaseBackend.js:705` dins de `updateProfile()`:

```javascript
export async function updateProfile(updates, config = {}) {
  const user = getCurrentUser();   // ← torna null
  if (!user) throw new Error('No hi ha sessió.');
  ...
}
```

`getCurrentUser()` delega a `usuariDeSessio()` de `src/data/identitat.js`, que llegeix de la **capa efímera** (`sessionStorage`).

#### Arrel probable: El "Cisma de la Sessió" i el mode mock vs real

La Correcció P0 (260908) va moure tota la sessió a `sessionStorage` per seguretat. Però:

1. **En mode desenvolupament/mock**, si el backend injectat no és el Supabase real sinó un adaptador de demostració, `getCurrentUser()` pot tornar null quan l'usuari "sembla" autenticat per la UI però no hi ha JWT real.
2. **El flux de pujada d'avatar** a `DetallAjust.jsx` comprimix la imatge a base64 via `compressImage()` i l'envia directament a `updateProfile()`, que necessita una sessió vàlida.
3. **Actualment NO s'usa Supabase Storage**: les imatges van com a **dataURL base64 dins de `user_metadata.avatar_url`**. Això funciona però és ineficient i té límits de mida.

### Estratègia d'integració: Patró Adaptador + Contracte de Capacitats

Per mantenir `UniversalEditorShell` com a component **endollable i agnòstic**, no toquem el core. Introduïm la capacitat de Storage a través del `backendPort.js`, que ja és el nostre patró de injecció.

#### Proposta concreta: Tres passos

**PAS 1 — Arreglar l'error "No hi ha sessió" (correctiu immediat)**

- Afegir un control a `SessionContext` que, abans de permetre edicions, comprove que `teCapacitat('sessio')` és cert i que `getCurrentUser()` no és null.
- Millorar `DetallAjust.jsx` per capturar l'error i mostrar un missatge amigable ("La sessió ha caducat, torna a entrar") en lloc de rompre silenciosament.
- Verificar que el `host.js` injecta correctament l'implementació real de Supabase abans de cridar `freezeImplementation()`.

**PAS 2 — Afegir capacitat Storage al backendPort (adaptador)**

Afegir al contracte de `backendPort.js` dues noves funcions:

```javascript
// src/data/backendPort.js (noves capacitats)
export const uploadToStorage = asseguraMetode('uploadToStorage');
export const getPublicUrl = asseguraMetode('getPublicUrl');
```

Implementar-les a `supabaseBackend.js` utilitzant el client `@supabase/supabase-js` (ja instal·lat):

```javascript
// src/data/supabaseBackend.js (nova implementació)
export async function uploadToStorage(bucket, path, file, config = {}) {
  const user = getCurrentUser();
  if (!user) throw new Error('No hi ha sessió.');
  
  const { supabaseUrl, anonKey } = getResolvedConfig(config);
  const jwt = getEfimer(CLAU_JWT);
  
  // Utilitzem fetch directament a l'API de Storage per mantenir 
  // la consistència amb la resta del backend (sense crear un client nou)
  const formData = new FormData();
  formData.append('file', file);
  
  const resp = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${jwt}`,
    },
    body: formData
  });
  
  if (!resp.ok) throw new ErrorSupabase('Error pujant a Storage', resp.status);
  return getPublicUrl(bucket, path, config);
}

export function getPublicUrl(bucket, path, config = {}) {
  const { supabaseUrl } = getResolvedConfig(config);
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}
```

**PAS 3 — Integració amb l'Editor (sense tocar el core)**

L'`UniversalEditorShell` rep `onSaveField` com a prop. L'host (ex: `NotesEditor`, `DetallAjust`) és qui decideix com persistir. Per tant:

- **Per a foto de perfil:** Modificar `DetallAjust.jsx` perquè, en lloc de comprimir a base64, envii el `File` original a `uploadToStorage('avatars', `${user.id}/avatar.webp`, file)` i guardi la URL retornada com a `avatar_url`.
- **Per a imatges dins de l'editor TipTap:** Crear una funció `handleImageUpload(file)` a l'host que es passi al hook de TipTap com a opció. Aquesta funció crida `uploadToStorage('notes-images', `${noteId}/${uuid}.webp`, file)` i retorna la URL pública.
- **El core de l'Editor no sap res de Supabase:** només rep una funció de pujada i una URL.

#### Polítiques RLS necessàries per a Storage

Cal crear un bucket `avatars` i un `notes-images` a Supabase amb aquestes polítiques:

```sql
-- Bucket: avatars (públic llegible, només el propietari escriu)
create policy "Avatares llegibles per tothom" 
  on storage.objects for select using (bucket_id = 'avatars');

create policy "Usuari penja el seu avatar" 
  on storage.objects for insert to authenticated 
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Usuari actualitza el seu avatar" 
  on storage.objects for update to authenticated 
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Bucket: notes-images
create policy "Imatges de notes llegibles per tothom" 
  on storage.objects for select using (bucket_id = 'notes-images');

create policy "Usuari penja imatges a les seves notes" 
  on storage.objects for insert to authenticated 
  with check (bucket_id = 'notes-images' and (storage.foldername(name))[1] = auth.uid()::text);
```

---

## 2. EL REPTE DE TIPTAP RICS

### Diagnòstic de l'arquitectura actual

- `useUniversalRichText.js`: Només carrega `StarterKit`. Configuració senzilla, sense extensions addicionals.
- `UniversalRichTextContent.jsx`: Wrapper mínim d'`<EditorContent>`.
- `UniversalRichTextToolbar.jsx`: Barra bàsica amb 5 accions de format.
- **Contracte de la Caixa Única:** L'editor viu dins de `UniversalEditorShell` → `PageFrame`. Les classes `ues-root`, `ues-scroll`, `editor-content`, `page-content`, `sdp-text-cos`, `sdp-prose` defineixen l'espai de renderitzat.

### Estratègia: Extensions modulars sense col·lapse CSS

#### Principi clau: **El hook rep extensions com a paràmetre opcional**

No toquem la implementació base de `useUniversalRichText`. Fem que accepti un array d'extensions addicionals que es fusionen amb el `StarterKit`. Això manté la compatibilitat cap enrere.

#### PAS 1 — Modificar el hook per acceptar extensions

```javascript
// src/components/universal/richText/useUniversalRichText.js (modificat)
export function useUniversalRichText({
  content = '',
  onChange,
  onSave,
  id,
  debounceMs = 800,
  extensions = [],           // ← NOU: extensions addicionals
  editorProps = {},           // ← NOU: props addicionals
  onImageUpload = null        // ← NOU: funció de pujada
}) {
  ...
  
  const baseExtensions = [
    StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
    ...extensions  // ← fusionem les addicionals
  ];
  
  const editor = useEditor({
    extensions: baseExtensions,
    content: content,
    onUpdate: ({ editor }) => { ... },
    editorProps: {
      attributes: {
        class: 'editor-content page-content sdp-text-cos sdp-prose'
      },
      ...editorProps  // ← permetre sobreescriure si cal
    },
  });
  
  ...
}
```

#### PAS 2 — Crear les extensions TipTap necessàries

Instal·lem les extensions oficials (ja tenim `@tiptap/react`):

```bash
# Dependències a afegir a package.json
@tiptap/extension-image
@tiptap/extension-video
@tiptap/extension-horizontal-rule
@tiptap/extension-slash-command
@tiptap/suggestion
```

**Creem un mòdul d'extensions riches** a `src/components/universal/richText/extensions/`:

```javascript
// src/components/universal/richText/extensions/createRichExtensions.js
import Image from '@tiptap/extension-image';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import SlashCommand from '@tiptap/extension-slash-command';

export function createRichExtensions({ onImageUpload, t }) {
  return [
    // Imatge amb suport de pujada
    Image.configure({
      HTMLAttributes: {
        class: 'editor-image',  // ← classe CSS controlada per la Caixa Única
        loading: 'lazy'
      },
      upload: onImageUpload  // ← la funció ve de l'host
    }),
    
    // Divisor
    HorizontalRule.configure({
      HTMLAttributes: { class: 'editor-divisor' }
    }),
    
    // Slash Command (menú flotant)
    SlashCommand.configure({
      suggestion: {
        items: ({ query }) => {
          const items = [
            {
              title: t('editor.slash.image', 'Imatge'),
              description: t('editor.slash.image.desc', 'Insereix una imatge'),
              icon: 'image',
              command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).insertImage().run();
              }
            },
            {
              title: t('editor.slash.divider', 'Divisor'),
              description: t('editor.slash.divider.desc', 'Afegeix una línia divisòria'),
              icon: 'divider',
              command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setHorizontalRule().run();
              }
            },
            {
              title: t('editor.slash.video', 'Vídeo'),
              description: t('editor.slash.video.desc', 'Incrusta un vídeo'),
              icon: 'video',
              command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).insertVideo().run();
              }
            }
          ];
          return items.filter(item => 
            item.title.toLowerCase().includes(query.toLowerCase())
          );
        }
      }
    })
  ];
}
```

#### PAS 3 — Protegir el contracte CSS de la Caixa Única

Per evitar col·lapses CSS:

1. **Totes les classes dels elements nous van prefixades amb `editor-`** (`editor-image`, `editor-divisor`, `editor-slash-menu`) i es defineixen dins de l'espai `.editor-content` o `.ues-root`.
2. **El menú Slash flotant utilitza `position: absolute`** (no `fixed`) dins d'un contenidor posicionat relatiu que forma part de la Caixa Única. Així no surt fora de l'àrea de l'editor.
3. **Afegim regles CSS als mòduls existents** (`src/css/modules.css` o dins de l'àrea `editor-content`), NO com a estils globals ni com a Tailwind.

Exemple de CSS segur:

```css
/* Dins de l'espai de l'editor, per no escapassar-se */
.editor-content .editor-image {
  max-width: 100%;
  height: auto;
  border-radius: var(--sdp-radi-curt);
  margin: var(--sdp-espai-mig) 0;
}

.editor-content .editor-divisor {
  border: none;
  border-top: 1px solid var(--sdp-color-divisori);
  margin: var(--sdp-espai-doble) auto;
  width: 60%;
}

/* El menú slash viu dins de l'editor */
.ues-root .editor-slash-menu {
  position: absolute;
  z-index: var(--sdp-z-superposicio-baixa);
  background: var(--sdp-color-fons-paper);
  border: 1px solid var(--sdp-color-divisori);
  border-radius: var(--sdp-radi-curt);
  box-shadow: var(--sdp-ombra-suau);
  max-height: 300px;
  overflow-y: auto;
}
```

#### PAS 4 — Com l'host ho utilitza (exemple: NotesEditor)

```javascript
// src/sections/notes/NotesEditor.jsx (actualitzat)
import { createRichExtensions } from '../../components/universal/richText/extensions';

export default function NotesEditor() {
  const { saveNoteField, setLocalNoteField, publishNote, noteFolders, t, uploadNoteImage } = useNotes();
  const { activeItem: activeNote } = useManager();

  // Creem les extensions riques aquí, a l'host
  const richExtensions = createRichExtensions({
    onImageUpload: uploadNoteImage,  // ← funció de l'host que usa backendPort
    t
  });

  const editor = useUniversalRichText({
    content: activeNote?.content || '',
    id: activeNote?.id,
    onChange: (html, noteId) => {
      if (noteId) setLocalNoteField(noteId, 'content', html);
    },
    onSave: (html, noteId) => {
      if (noteId) saveNoteField(noteId, 'content', html);
    },
    extensions: richExtensions,  // ← les passem al hook
    debounceMs: 800
  });
  
  ...
}
```

### Resum de l'estratègia TipTap

| Aspecte | Solució |
|---------|---------|
| **Modularitat** | El hook accepta `extensions` com a paràmetre opcional. El core no canvia. |
| **Slash Menu** | Extensió oficial `@tiptap/extension-slash-command`, configurada des de l'host. |
| **Imatges** | Extensió `@tiptap/extension-image` amb funció `upload` proporcionada per l'host (usa `backendPort.uploadToStorage`). |
| **Divisors/Vídeos** | Extensions oficials `HorizontalRule` i (opcional) `Video`. |
| **Seguretat CSS** | Classes prefixades `editor-*`, regles dins de `.editor-content` / `.ues-root`, `position: absolute` en lloc de `fixed`. |
| **Agnosticisme** | L'Editor no sap res de Supabase. La funció de pujada ve de l'host. |

---

## RESUM EXECUTIU DE LA FASE 4

### Pregunta 1 — Supabase i Storage
> **Q:** Com integrar sessió Auth i pujada d'imatges a Supabase Storage mantenint `UniversalEditorShell` agnòstic?

**R:** A través del patró **Port i Adaptador** ja existent (`backendPort.js`):
1. Afegim `uploadToStorage` i `getPublicUrl` al contracte del port.
2. Implementem les funcions a `supabaseBackend.js` usant el JWT de sessió.
3. L'error "No hi ha sessió" s'arregla verificant que `SessionContext` sincronitzi correctament amb la capa efímera i que l'host injecti el backend real abans de congelar.
4. L'Editor no canvia: rep `onSaveField` i opcionalment una funció `onImageUpload` que l'host connecta al backendPort.

### Pregunta 2 — TipTap Rics
> **Q:** Com afegir Slash Menu i embeds sense col·lapses CSS ni trencar la Caixa Única?

**R:** Amb **extensibilitat parametritzada**:
1. Modifiquem `useUniversalRichText` per acceptar un array `extensions` opcional que es fusiona amb el StarterKit.
2. Creem un mòdul `createRichExtensions()` que construeix les extensions (Image, HorizontalRule, SlashCommand) amb els callbacks i traduccions que proveeix l'host.
3. Totes les classes CSS van prefixades amb `editor-*` i es defineixen dins de l'espai `.editor-content` / `.ues-root`. El menú Slash usa `position: absolute` per no sortir de la Caixa Única.
4. Cap dependència Supabase entra al core: la funció de pujada d'imatges la proveeix l'host.

---

**Tancament:** Aquesta estratègia respecta íntegrament el contracte de la 'Caixa Única', manté l'`UniversalEditorShell` com a component endollable pur, i no introdueix patrons Online-First que enfosquirien la realitat Online-First del Mas. No hi ha dependències supèrflues, no hi ha Tailwind al Core, i totes les operacions amb dades personals passen per Supabase Auth i RLS amb base legal.
