---
tipus: document
estat: esborrany
description: 1. El Repte de Supabase i Storage (Sessió i Pujada d'Imatges)
---
### 1. El Repte de Supabase i Storage (Sessió i Pujada d'Imatges)

L'error `"No hi ha sessió"` es produeix per una desconnexió estructural entre la ruta de perfil, la gestió de sessions efímeres i l'antipatró d'emmagatzemar imatges en Base64 dins de la base de dades.

```
┌───────────────────────────┐      ┌──────────────────────────┐      ┌──────────────────────────┐
│   UniversalEditorShell    │ ---> │  Host (DetallAjust.jsx)  │ ---> │     backendPort.js       │
│  (UI pura i agnòstica)    │      │  (Orquestra uploadMedia) │      │   (Contracte de xarxa)   │
└───────────────────────────┘      └──────────────────────────┘      └──────────────────────────┘
                                                                                  │
                                                                                  ▼
                                                                     ┌──────────────────────────┐
                                                                     │   supabaseBackend.js     │
                                                                     │  (Auth JWT + Storage S3) │
                                                                     └──────────────────────────┘

```

**Diagnòstic de la fallada actual:**

* **Ruta desprotegida a `App.jsx`:** A `App.jsx`, la ruta `el-meu-perfil` munta `PerfilShell` directament sense el tallafoc `RequireAuth`. Si l'usuari hi accedeix com a visitant (`idConvidat()`), `getCurrentUser()` retorna `null` perquè no hi ha cap JWT a `sessionStorage`.


* **Rebuig de mutació a `supabaseBackend.js`:** `updateProfile` fa la comprovació `const user = getCurrentUser(); if (!user) throw new Error('No hi ha sessió.')`.


* **Antipatró de dades Base64:** `useHeroImageHandler.js` genera una cadena Data URL en Base64 mitjançant canvas i la injecta directament a `onSaveField`. Pujar cadenes Base64 de centenars de kilobytes satura `auth.users.raw_user_meta_data`, bloqueja la taula `public.profiles` i engreixa innecessàriament els tokens JWT.



**Estratègia d'integració en tres capes:**

* **Protecció de la ruta (Client Guard):**
A `src/app/App.jsx`, protegir la ruta d'edició per assegurar que només usuaris amb sessió vàlida puguen carregar el formulari:


```jsx
<Route path="el-meu-perfil" element={<RequireAuth fallback="/registre"><PerfilShell /></RequireAuth>} />

```


* **Ampliador del contracte a `contracte.js` i `backendPort.js`:**
Definir la capacitat d'emmagatzematge al contracte canònic sense acoblar la interfície a Supabase:


```javascript
// src/data/contracte.js
export const CAPACITATS = Object.freeze({
  // ...
  storage: Object.freeze(['uploadMedia'])
});

```


Exposar la funció delegada `uploadMedia` a `src/data/backendPort.js`:


```javascript
export const uploadMedia = asseguraMetode('uploadMedia');

```


* **Implementació de Storage a `supabaseBackend.js`:**
Gestionar la càrrega binària al bucket de Supabase Storage (`avatars` o `media`) mitjançant el JWT actiu:


```javascript
export async function uploadMedia(file, { bucket = 'media', carpeta = 'uploads' } = {}, config = {}) {
  const user = getCurrentUser();
  if (!user) throw new Error('No hi ha sessió activa per a pujar fitxers.');

  const { supabaseUrl, supabaseAnonKey, hasSupabaseConfig } = getResolvedConfig(config);
  if (!hasSupabaseConfig) throw new Error('Falten credencials de Supabase.');

  const ext = file.name.split('.').pop();
  const filePath = `${carpeta}/${user.id}/${Date.now()}.${ext}`;

  const formData = new FormData();
  formData.append('', file);

  const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`, {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${getEfimer(CLAU_JWT)}`
    },
    body: formData
  });

  if (!response.ok) throw new ErrorSupabase(`Error pujant fitxer: ${response.statusText}`, response.status);

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`;
  return { url: publicUrl, path: filePath };
}

```


* **Agnosticisme a `UniversalEditorShell`:**
`UniversalEditorShell` no ha de conèixer l'existència de Supabase. Rep la propietat funcional `onUploadImage(file)` des de l'host (`DetallAjust` o `NotesEditor`). `useHeroImageHandler` executa la compressió WebP en memòria, crida `onUploadImage(blob)`, i només desa la URL CDN resultant a `onSaveField`.



---

### 2. El Repte de TipTap Rics (Slash Menu, Embeds i Caixa Única)

L'ampliació de TipTap ha de respectar el contracte rígid de la Caixa Única (`ues-root`, `ues-header`, `ues-scroll`, `ues-canvas`) definit a `src/css/modules.css` per impedir desbordaments i trencaments de l'arbre DOM.

| Element | Risc per a la Caixa Única | Solució d'Arquitectura Pedra Seca |
| --- | --- | --- |
| **Menú Slash flotant** | Desbordament o tall per `overflow-y: auto` de `ues-scroll`. Pèrdua d'estils si es munta a `document.body` fora del Shadow DOM.

 | Renderitzat mitjançant contenidor amb `position: absolute` ancorat al node `ues-canvas` o via Popover natiu dins de `.sdp-root`.

 |
| **Imatges (`Image`)** | Deformació d'amplada i salts de pàgina (Cumulative Layout Shift) en carregar.

 | Classes semàntiques obligatòries: `HTMLAttributes: { class: 'sp-card-media', loading: 'lazy' }`.

 |
| **Vídeos (`Youtube`/`Video`)** | Desbordament dels 46rem d'amplada de `ues-canvas`.

 | Contenidor semàntic natiu `.embed-container` amb aspect-ratio 16:9.

 |
| **Divisor (`HorizontalRule`)** | Ús d'etiquetes `<hr>` amb estils aliens o Tailwind.

 | Renderitzat amb la classe de disseny `.sdp-divisor`.

 |

**Implementació modular de les extensions:**

* **Configuració d'extensions a `useUniversalRichText.js`:**
Ampliar l'hook modular integrant el paquet StarterKit amb suports rics controlats:


```javascript
import Image from '@tiptap/extension-image';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Youtube from '@tiptap/extension-youtube';

export function useUniversalRichText({
  content = '',
  onChange,
  onSave,
  id,
  debounceMs = 800,
  extraExtensions = []
}) {
  // ...
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        horizontalRule: false // Se substitueix per la versió configurada
      }),
      HorizontalRule.configure({
        HTMLAttributes: { class: 'sdp-divisor' }
      }),
      Image.configure({
        inline: false,
        HTMLAttributes: { class: 'sp-card-media', loading: 'lazy', decoding: 'async' }
      }),
      Youtube.configure({
        HTMLAttributes: { class: 'embed-container' }
      }),
      ...extraExtensions
    ],
    // ...
  });
}

```


* **El patró del Menú Slash (`@tiptap/suggestion`):**
1. **Gallet d'activació:** Activar el selector quan es tecleja `/` a l'inici d'un bloc de text buit.
2. **Ancoratge i coordenades:** Obtenir les coordenades del cursor usant `editor.view.coordsAtPos(from)` de ProseMirror.


3. **Aïllament Shadow DOM:** No utilitzar llibreries externes com Popper o Tippy inserides a `document.body`. El desplegable es munta com un element fill absolut dins de `ues-canvas` o `ues-root` (que disposa de `isolation: isolate`):




```css
.sdp-slash-menu {
  position: absolute;
  z-index: var(--z-calaix);
  background: var(--sdp-fons-targeta);
  border: 1px solid var(--sdp-vora);
  border-radius: var(--sdp-radi-m);
  box-shadow: var(--sdp-ombra-3);
  width: 260px;
  max-height: 320px;
  overflow-y: auto;
}

```


4. **Accessibilitat de Pedra Seca (Baseline 2022):** Navegació amb fletxes (`ArrowUp`, `ArrowDown`), selecció amb `Enter` i tancament amb `Escape`. Botons interns amb àrea tàctil mínima de 44px (`--sdp-touch-min`).




* **Preservació del cicle de desat:**
La inserció d'imatges, divisors o salts estructurals des del menú Slash dispara automàticament l'esdeveniment `onUpdate` de TipTap. Com que `useUniversalRichText` utilitza `pendingSaveRef` sincronitzat amb el buffer de text abans del debounce, cap acció rica trenca el cicle de protecció de dades davant de `visibilitychange` o `pagehide`.
