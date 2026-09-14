# PETORRETA FINAL (CLAUDE) — El 12% Restant

**Objectiu:** Rematar l'arquitectura de Sóc de Poble per aconseguir l'Enxufabilitat Total (10/10) amb el backend de Sollutia.

**Context de l'Eixam (El que ja hem fet hui):**
1. Hem segellat els WebSockets de Supabase (neteja a `logout()` i reautenticació a `_renova()`).
2. Hem extirpat completament `Dexie` de `useGestoriaData.js` i ho hem connectat a `backendPort.js` (amb la barrera `teCapacitat('gestoria')`).
3. Hem corregit l'error SQL de la migració de perfils.
4. Hem activat `tractor-importacions.mjs` que bloqueja qualsevol importació òrfena.
5. Hem fet neteja de CSS residual i estils en línia assenyalats per l'Eixam.
L'aplicació **compila perfectament** i la infraestructura és sòlida. Grok ens ha donat un 9/10 amb aquests canvis.

**El 12% que et demanem (Acció Requerida):**
Volem que dissenyes l'estratègia definitiva i el codi necessari per a:
1. **Guards de Ruta (Router):** Implementar un `<RequireAuth>` robust al router per a `/gestoria/*` i `/admin/*`, integrat amb el nostre `SessionContext`, per evitar carregar vistes si no hi ha sessió.
2. **Expiració del JWT:** El `SessionContext` actual és passiu. Com hem de gestionar de forma resilient la caducitat del JWT de Sollutia al client perquè force el logout o la renovació sense trencar l'experiència?
3. **Injecció de Sessió Externa:** Si Sollutia passa una sessió JWT des del host a través del web component (`<soc-de-poble config='...'>`), com fem que `identitat.js` ho accepte de forma segura en lloc de caure en mode convidat?
4. **Residus de React i CSP (El Bisturí de Deepseek):**
   - L'`UniversalPage` a les 8 vistes de Gestoria rep `category` i `tags` en lloc de l'API correcta de `labels` i per això no es pinten.
   - `UniversalCard` a `GestoriaHome` rep un `children` en lloc de `body` (i queda buida).
   - `ControlSection` enruta tot el menú cap a `/notes` com a fallback.
   - `NotesToolbar` té el botó 'Publicar' mort perquè no se li passa `activeNote` des del seu pare.
   - L'`index.html` té una CSP (`img-src https:`) que anul·la el sanititzador.
   - `callback.html` d'OAuth no té CSP.

No volem filosofies, dóna'm el codi exacte per aplicar-ho i assolir el 10/10 d'enxufabilitat.
