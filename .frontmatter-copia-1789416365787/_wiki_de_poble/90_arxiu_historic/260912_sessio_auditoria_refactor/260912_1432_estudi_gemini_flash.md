Gemini Flash: L'arquitectura del paquet auditat presenta una base sòlida en la separació de dominis i en el contracte hexagonal de la Frontissa, però manté divergències entre la doctrina declarada i el codi executable.

| Àmbit auditat | Estat observable | Risc tècnic |
| --- | --- | --- |
| **Arquitectura Online-First** | Restes actives de Dexie a Gestoria | Incoherència amb `ADR-2026-08` i sobrecàrrega de bundle |
| **Frontissa Sollutia** | Client implementat; `RECURSOS` buit | Bloqueig fail-closed en consumir endpoints |
| **Pedra Seca & Targetes** | Targetes unificades; estils inline residuals | Fricció en inspectors AST i `design_guard`<br> |
| **A11y & SEO** | `useSEO` condicionat; touch targets reduïts | Títols estàtics en SPA i fallades a Baseline 2022 |

---

### 1. Arquitectura i Integració amb Sollutia (Online-First & Frontissa)

* **Persistència residual d'IndexedDB/Dexie:** `package.json` declara `dexie` i `dexie-react-hooks` com a dependències de producció. A més, `src/sections/gestoria/lib/db.js` i `csv_ingestor.js` continuen inicialitzant taules locals en Dexie (`events`, `tax_rules`, `factures`, `contactes`). Això entra en conflicte directe amb `ADR-2026-08-ONLINE-FIRST.md`, que ordena retirar Dexie i assumir Supabase com a font única de veritat.

* **Contracte de la Frontissa (`sollutia/client.js`):** El patró hexagonal està blindat contra escriptures mitjançant `ESCRIPTURES_PERMESES = []`. No obstant això, `src/data/frontissa/sollutia/recursos.js` manté el diccionari `RECURSOS = {}` completament buit. Qualsevol invocació a `llig()` llança un `ErrorFrontera` perquè no hi ha cap endpoint associat a traductor.

* **Contenció d'errors (Fail-Closed):** A `src/data/supabaseBackend.js`, les consultes RPC capturen errors 404 i codis `PGRST202/205` mostrant una alerta diagnòstica clara sobre migracions pendents. Paral·lelament, `src/sections/xat/XatContext.jsx` aïlla els errors a la propietat `avis`, impedint que una fallada a les taules de xat bloquege `AppDataLoader` a nivell global.

---

### 2. Sistema de Disseny Pedra Seca & Estandardització de Targetes

* **Estandardització `UniversalCard`:** Les targetes d'acció del Panell de Control (`ControlSection.jsx`) i les d'alta (`OnboardingSteps.jsx`) ja comparteixen les classes `.sp-card--action` i `.sp-card--onboarding` definides a `src/css/index.css`, incorporant el rivet superior taronja (`border-top: 6px solid var(--sdp-accent)`).

* **Alineació de títols:** Existeix asimetria: `.sp-card-heading-with-icon` alinea el títol a l'esquerra en targetes generals, però la regla `.sp-card--action .sp-card-heading-with-icon` el força centrat i en columna. Cal aplicar la regla descrita a `260911_0006_tasques_ui_standardization.md`: títol amb icona adjacent alinea sempre a l'esquerra; títol aïllat alinea al centre.

* **Deute de classes i estils en línia:**
* `src/sections/detail/detailSectionMeta.jsx` conté la classe òrfena `-col` i estils prohibits en línia (`style={{ opacity: 0.7, textTransform: 'uppercase' }}` i `style={{ marginTop: 18 }}`).

* `src/sections/profile/DetallAjust.jsx` manté estils en línia a `style={{ marginTop: '0.5rem' }}` i `style={{ paddingTop: '2rem' }}`.

* `src/sections/profile/PerfilShell.css` manté un full d'estils propi dins de `src/sections/`, violant la norma V3 de `tractor-vocabulari.mjs` i consumint 1 dels 3 límits de deute de `.agents/deute/.vocabulari-deute.json`.

---

### 3. Accessibilitat (A11y) i SEO

* **Injecció SEO apagada per defecte:** `src/hooks/useSEO.js` exigeix estrictament `externalConfig?.manageDocumentHead === true` per a actualitzar `document.title` i les metadades socials. Com que `src/main.jsx` munta el Web Component sense aquest paràmetre, el canvi de ruta en mode SPA mai modifica el títol del document ni les metadades Open Graph en producció.

* **Àrees tàctils per davall del llindar:** `src/components/layout/AppGridShell.css` i `src/css/index.css` mantenen declaracions de 20px, 24px i 32px en controls interactius, congelades a `.agents/deute/.design-guard-deute.json` com a deute crític.

---

### 4. Pla de Correccions Mínimes Verificables

* **Eliminar imports i dependència de Dexie:**
* Purgar `"dexie"` i `"dexie-react-hooks"` de `package.json`.
* Migrar `useGestoriaData.js` i `csv_ingestor.js` a memòria de sessió o taules Supabase amb RLS per complir `ADR-2026-08`.

* **Activar gestió de capçalera SEO:**
* Afegir `manageDocumentHead: true` a la configuració per defecte de `src/main.jsx`.

* **Purgar estils en línia de seccions:**
* Reemplaçar els atributs `style` de `detailSectionMeta.jsx` i `DetallAjust.jsx` per les classes utilitàries canòniques `--sdp-*`.
* Fusionar `src/sections/profile/PerfilShell.css` dins de `src/css/components.css` per liquidar el deute de `tractor-vocabulari`.

* **Unificar alineació d'`UniversalCard`:**
* Ajustar a `src/css/index.css` la variant `.sp-card--action` perquè respecte l'alineació a l'esquerra quan s'injecta la prop `icon`.
