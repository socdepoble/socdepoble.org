---
tipus: petorreta
destinatari: Claude
assumpte: Codi exacte Fase 4 (Storage, Avatar i TipTap)
---

# 🛡️ DICTAMEN DEL CONSELL I ORDRE D'EXECUCIÓ: FASE 4

Claude, este és el moment decisiu. Et queda aproximadament un **32% del teu context/tokens**, així que anem a maximitzar-ne l'ús. Deixarem per a més endavant l'auditoria CSS completa i ens centrarem exclusivament en **fortificar la gestió d'usuaris (avatar) i aïllar l'editor**.

He reunit al Consell (Deepseek, Z, Gemini, Grok, Vibe, Dola i Qwen) i hem analitzat la teua proposta inicial. Hi ha un consens absolut sobre l'estratègia. Aquestes són les decisions arquitectòniques irrevocables que has d'implementar en codi:

## 1. La Frontissa (Ports i Adaptadors) per a l'Storage
L'`UniversalEditorShell` ha de romandre 100% pur i agnòstic. **No pot haver-hi cap import de Supabase dins de l'editor ni dels seus hooks**.
- Amplia el contracte a `src/data/backendPort.js` afegint les capacitats `uploadToStorage` i `getPublicUrl`.
- Implementa-les a `src/data/supabaseBackend.js` utilitzant l'API fetch a `storage/v1/object` o el client oficial (injectant el token efímer).
- L'editor i el TipTap rebran una funció de callback (ex: `onImageUpload`) que injectarà el Host (com `NotesEditor` o `DetallAjust`).

## 2. Reparació de l'Avatar i la Sessió
Aquest és l'error més greu a nivell d'experiència d'usuari ara mateix. L'usuari no pot pujar el seu avatar.
- Elimina l'antipatró d'emmagatzemar la imatge en Base64 dins de `user_metadata.avatar_url`.
- Modifica la lògica de perfil (probablement a `DetallAjust.jsx` i `supabaseBackend.js`) per garantir que la sessió real s'ha resolt abans d'enviar el fitxer al nou bucket `avatars`.
- Utilitza el nou port `uploadToStorage` per pujar l'arxiu físic i guardar-ne només la URL pública al perfil.

## 3. Menú Slash i el parany del Shadow DOM
Volem implementar el Menú Slash (ex: `/imatge`, `/divisor`) utilitzant `@tiptap/suggestion`, però **Deepseek ha trobat un fantasma arquitectònic crític**:
L'editor viu dins d'un **Shadow DOM** (`PedraSecaEmbed`). Si configures TipTap per renderitzar el popup flotant al `document.body` (com fa per defecte), el menú caurà al cos del sistema amfitrió (host), perdrà tots els tokens `--sdp-*` i es trencarà la UI. Tampoc pots deixar-lo dins de `ues-canvas` perquè l'`overflow: hidden/auto` el retallarà.
- **Solució obligatòria:** Configura el mètode `render` de `@tiptap/suggestion` perquè cree el contenidor del popup **dins del mateix Shadow Root** (buscant `.sdp-root` o usant la referència del node arrel de l'app). Usa classes pròpies de la Caixa Única (`.sdp-slash-menu`).

## 4. Modularitat TipTap (Opcional, si hi ha espai)
L'ideal és que `useUniversalRichText.js` accepte un array d'`extensions` opcional que envie el Host, per a no inflar l'editor base si no cal.

---
### 🛠️ INSTRUCCIÓ ESTRICTA:
**No gastes tokens en resums o explicacions llargues.** Dóna'm directament el **codi font complet i llest per copiar i enganxar** dels fitxers afectats:
1. `backendPort.js` (nou contracte)
2. `supabaseBackend.js` (implementació de storage)
3. `DetallAjust.jsx` (o on estiga la càrrega de l'avatar)
4. `useUniversalRichText.js` / extensions de TipTap (incorporant el fix del Shadow DOM).

El futur del Mas depén d'esta execució. Confiem en tu.
