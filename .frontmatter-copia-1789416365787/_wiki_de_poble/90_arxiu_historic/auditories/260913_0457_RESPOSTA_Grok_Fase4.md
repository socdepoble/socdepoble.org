**Estratègia Fase 4 — Supabase + TipTap (Caixa Única intacta)**

Anàlisi basada exclusivament en el bundle `260913_0420_BUNDLE_auditoria.md`. Cap cerca externa.

---

### 1. Repte Supabase / Storage / Sessió (“No hi ha sessió”)

**Diagnòstic (codi present)**  
- `src/data/supabaseBackend.js` (≈45 kB) ja exposa el client Supabase i operacions de notes/perfil.  
- `src/data/oauthRelay.js` + `public/auth/callback.html` gestionen el flux OAuth (RELAY_PER_DEFECTE, ORIGENS_PERMESOS, postMessage).  
- `SessionContext` / `RequireAuth` ja existeixen; l’error “No hi ha sessió” en pujar avatar indica que el callback d’upload (probablement a `DetallAjust.jsx` o handler d’imatge de perfil) crida Storage **sense** passar pel context de sessió real o cau en un mock.  
- `UniversalEditorShell` és endollable: rep props (`value`, `onChange`, `onCommit`, `toolbar`, etc.) i no importa backend. El contracte CSS (`ues-root`, `ues-scroll`) i el protocol `visibilitychange` ja estan estabilitzats a la Fase 3.

**Proposta (agnòstica + mínima)**  
1. **Font única de sessió**  
   - Exposar des de `SessionContext` (o un thin wrapper a `supabaseBackend.js`) un hook `useSession()` que retorni `{ session, user, accessToken, isAuthenticated }`.  
   - Qualsevol pujada (avatar, imatge d’editor) **només** pot cridar Storage si `isAuthenticated === true`. Si no, mostrar `Alerta` canònica i abortar (fail-closed).

2. **Upload Storage sense contaminar l’editor**  
   - Crear un **port** (no nou mòdul gros) a `src/data/frontissa/` o dins `supabaseBackend.js`:  
     `uploadImage({ file, bucket = 'avatars' | 'editor', pathPrefix }) → { publicUrl | error }`.  
   - El path ha de ser determinista i RLS-friendly: `user.id / timestamp_hash.ext`.  
   - L’host (ex. `NotesEditor`, `DetallAjust`) injecta la funció via prop o context lleuger (`ContentProvider` / `ManagerContext` ja existeixen).  
   - `UniversalEditorShell` **no** importa Supabase. Només rep un callback opcional `onImageUpload?: (file) => Promise<url>`. Si no es passa, el botó d’imatge queda desactivat o mostra missatge.

3. **Correcció del “No hi ha sessió”**  
   - Verificar que el flux OAuth escriu la sessió al storage canònic (el mateix que llegeix `SessionContext`).  
   - A `DetallAjust.jsx` (i qualsevol handler d’avatar) substituir qualsevol crida directa o mock per:  
     `const { session } = useSession(); if (!session) return; await uploadImage(...)`.  
   - Mantenir el protocol de commit de la Fase 3: l’upload pot ser async, però el commit del document espera la URL resolta abans de `onCommit`.

4. **RLS / privacitat**  
   - Ja hi ha migracions de privacitat de perfils (`260912_1500_correccio_privacitat_perfils.sql`). No tocar dades personals sense base legal; l’upload ha de respectar el bucket privat + signed URL o public només quan el perfil ho permet.

Resultat: l’editor continua sent un plugin; el backend queda a la frontera (frontissa / host). Zero dependències noves.

---

### 2. Repte TipTap ric (Slash menu + embeds) sense trencar Caixa Única

**Diagnòstic**  
- `useUniversalRichText.js` + `UniversalRichTextContent.jsx` + `UniversalRichTextToolbar.jsx` són el nucli. Ara mateix només StarterKit.  
- `UniversalEditorShell` encapsula el scroll (`ues-scroll`) i el root (`ues-root`). Qualsevol popup ha de ser `position: absolute/fixed` **dins** d’aquestes capes o portal controlat, mai fora del contracte CSS.  
- No hi ha Tailwind al core; els estils van a `src/css/` (tokens, components, legat).

**Proposta modular (mínima, zero col·lapse)**  
1. **Extensions TipTap (només les necessàries)**  
   - Afegir via el mateix `useUniversalRichText`:  
     - `Placeholder` (si no hi és).  
     - Extension de slash command (custom o mínima, sense llibreria externa pesada si es pot evitar; si cal una, només la que ja estigui al `package.json` o zero noves).  
     - Node `Image` + `HorizontalRule` + node `Embed` (iframe o card simple per vídeo/URL).  
   - Configurar-les **dins** del hook; el hook retorna `{ editor, extensionsReady }`. L’editor ja es crea una sola vegada.

2. **Slash menu flotant**  
   - Component `SlashMenu` (nou, petit, a `src/components/universal/richText/`).  
   - Es munta **dins** de `UniversalRichTextContent` o com a fill de `ues-root`.  
   - Posició: calcular amb `editor.view.coordsAtPos` + `position: absolute` relativa al contenidor de scroll.  
   - Tancar amb Escape / click fora / selecció.  
   - Accions: inserir Image (crida el callback `onImageUpload` injectat), Divider, Embed (prompt URL → node).  
   - Estils: classes pròpies (`slash-menu`, `slash-item`) a `src/css/components.css` o mòdul dedicat. Respectar tokens existents. **Prohibició** de Tailwind.

3. **Integració amb la Caixa Única**  
   - `UniversalEditorShell` continua rebent `toolbar` i `children` (o slot per al contingut ric).  
   - El menú slash **no** ha de generar overflow ni canviar `height`/`overflow` de `ues-scroll`.  
   - Si cal portal, fer-lo a un contenidor fill de `ues-root` (no a `document.body` directament, per evitar z-index i pantalles blanques).  
   - Proves: el mateix contracte de Fase 3 (visibilitychange + commit) continua vàlid; la inserció d’imatge passa pel mateix `onImageUpload` del punt 1.

4. **Ordre d’implementació**  
   - Primer: port d’upload + correcció de sessió (desbloqueja avatar).  
   - Segon: extensions TipTap + SlashMenu mínim (Image + Divider).  
   - Tercer: Embed si cal.  
   - Cada pas passa les portes existents (design_guard, frontmatter, nomenclatura, etc.) i no afegeix dependències si es pot evitar.

---

### Resum executiu per al Consell

| Punt | Acció concreta | Risc | Mitigació |
|------|----------------|------|-----------|
| Sessió | `useSession()` + guard a tot upload | “No hi ha sessió” | Fail-closed + Alerta |
| Storage | Port `uploadImage` injectat per prop/context | Contaminació backend | Editor agnòstic |
| Slash | Component intern + coordsAtPos | Col·lapse CSS | Dins `ues-root` / tokens |
| Extensions | Image + HR + Embed via hook | Bundle | Només les necessàries |

Cap dependència superfluosa. Cap Tailwind al core. Cap toc a dades personals sense base. SDP-LOCK només si es detecta escriptura destructiva (no és el cas).

L’arquitectura Online-First (ADR-2026-08) es respecta: tot passa per Supabase Auth + Storage amb RLS.

**Sinapsis de referència al bundle**  
`UniversalEditorShell.jsx`, `useUniversalRichText.js`, `supabaseBackend.js`, `oauthRelay.js`, `SessionContext`, `DetallAjust.jsx`, migracions de privacitat, contracte CSS de la Caixa Única (Fase 3).
