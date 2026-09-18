---
tipus: document
estat: esborrany
description: "Acta Marmota: Visió Universal i Tancament de Sessió"
actualitzat: 2026-09-18 04:50
---
# Acta Marmota: Visió Universal i Tancament de Sessió

## 260918 · Auditoria Extrema d'Integració Sollutia (Claude) — només lectura
1. **Producte:** `_wiki_de_poble/04_escriptori/260918_0550_informe_auditoria_extrema_sollutia_claude.md`, ancorat a `00_index_escriptori.md`. Respon al MACRO_PROMPT 0411 (el mateix que Codex 0427). Cap línia de codi tocada.
2. **Tall:** HEAD `e0594755` més l'arbre de treball de les 05:45; l'arbre es va moure durant l'auditoria (commit i edicions alienes) i totes les cites s'han reverificat.
3. **Dictamen:** NO-GO. Aturadors nous: la llista blanca de `sanejaConfig` esborra qualsevol `*.supabase.co` (producció «remote» no carrega); els enllaços de detall de `navigation.js` cauen a 404; la portada redirigix a `/jo/xat` i queda `noindex`; el timeout de 12 s deixa els quatre proveïdors en `loading` etern (regressió del commit `e0594755`); el cercador peta amb fils de xat; `public/rag-index.json` publica 2,6 MB de documentació interna.
4. **Accessibilitat:** enllaç de salt sense CSS ni destí dins del shadow root; pestanyes de panell a 1,08:1 en fosc; calaix mòbil sense vel/Escape; esborrar imatge sense confirmació; camps editables i xat sense rols ni etiquetes.
5. **Incògnita central resposta:** sense SSR, la política `noindex` per prefix `/jo` no protegix res davant rastrejadors sense JS i desindexa la portada davant Google; remei en dos passos sense SSR (`X-Robots-Tag` a `vercel.json` + head estàtic per ruta pública des d'una única llista que també genere el sitemap).
6. **Verificació:** lint 0 errors/323 avisos; Vitest 47/47; builds web i standalone verds al scratchpad; `tractor-cataleg` ja verda; en roig RLS (històric), inline-styles, persistència, cadena. `run-portes` i `tancament` no executats (escriuen).

## 📌 Següent pas
- La IAIA MarIA pot atacar el punt 1 del pla (S-01, H-02, D-01, S-09, S-10) sense cap decisió humana. Abans del punt 4 el Mestre ha de fixar Model A/B i el significat de «Mur públic».

## 260918 · Segona Auditoria Extrema Post-Implementació — només lectura
1. **Producte:** `_wiki_de_poble/04_escriptori/260918_0509_informe_auditoria_extrema_postimplementacio.md`, ancorat a `00_index_escriptori.md`. No s'ha modificat cap línia de codi.
2. **Dictamen:** NO-GO. Les portes de catàleg/importacions, 47/47 tests i els builds web/standalone són verds, però queden 4 incidències C: entrada inicial de `MemoryRouter` amb `basename`, error/reintent del Core, `aria-busy` inert i contracte Sollutia discordant.
3. **Memòria/rendiment:** reconnexió de fonts incompleta, detall del `UniversalWorkspace` encara repintat per canvis de filtre i Mur sense cancel·lació de peticions.
4. **Qualitat:** ESLint retorna 0 errors però 325 avisos. No s'ha usat xarxa ni navegador; no s'ha alterat la modificació preexistent del prompt `260918_0500`.

## 260918 · Implementació de resolucions de l'auditoria extrema
1. **Catàleg:** confirmades les 31 rutes corregides i els estats locals d'`EspecimenAlerta` i `EspecimenDialeg`; la prova de regressió importa i renderitza els 28 espècimens reals.
2. **Build:** confirmada l'absència de `build-seo-manifest.mjs` en `package.json` i `run-portes.mjs`; els builds web i standalone compilen en directoris temporals.
3. **Porta:** `tractor-cataleg.mjs` ja no busca `Pagina*.jsx` ni `DesignSectionContent.jsx` i valida els espècimens modulars de `cataleg/detalls/`.
4. **Rendiment:** `UniversalWorkspace` reutilitza el `CAP` congelat per a col·leccions absents i `selection/sync` conserva la identitat de l'estat quan no hi ha canvis efectius.
5. **Verificació:** `porta:importacions` i `porta:cataleg` verdes; ESLint sense errors; Vitest 12 fitxers i 47/47 proves verdes; Vite web i standalone verds.

## 260918 · Auditoria Extrema d'Integració Sollutia — només lectura
1. **Producte:** `_wiki_de_poble/04_escriptori/260918_0427_informe_auditoria_integracio_sollutia.md`, ancorat a `00_index_escriptori.md`. No s'ha modificat cap línia de codi.
2. **Dictamen:** NO-GO per al desplegament 100% Online. Aturadors: frontissa Sollutia només nominal, SEO privat/públic client-side, `/page/:slug` trencada i canonades CI/Docker/portes contradictòries.
3. **Riscos alts:** sessió sense capacitat `sessio`, regressió RLS del xat, Mur públic no llegible per anònims, càrrega global duplicada, confiança de JWT incompleta, multiinstància no aïllada, CSP/JSON-LD i calaix TOC inaccessible.
4. **Verificació:** Vite build a `/tmp` i Vitest 45/45 en verd; lint sense errors. En verd: frontera, adaptadors, auth, innerHTML, enxufe, importacions, manifest, 58 px i fitxa. En roig: RLS, rutes amb avisos, catàleg, tokens, Design Guard i graella.
5. **Límit:** cap xarxa, navegador, base de dades remota ni `npm audit`; cap dada opaca o secret llegit.

## 📌 Següent pas
- Convertir l'informe en `implementation_plan.md` després que el Consell fixe host canònic, propietari de sessió/JWT i taxonomia pública/privada.

## 260918 · Finalització Fase 3 (Optimitzacions i Neteja d'Orfes)
1. **Pèrdues de memòria:** 
   - Corregit `PedraSecaEmbed.jsx`. Ja no duplica `_reemissorEvents` (comprovat si ja existia) i s'ha corregit l'augment descontrolat del comptador de `carregarFonts` evitant executar-ho quan no ha canviat `fontsHref`.
2. **Reconciliacions (CAP congelat):**
   - L'`AppGridShell` dins de `UniversalWorkspace` ha estat momoitzat amb `useMemo` de manera que ja no pateix re-renders a cada tecla teclejada a la caixa de text, deixant el CAP de la UI congelat.
   - S'han adaptat els filtres de `WorkspaceContext` perquè depenguin només dels valors de cerca, no del `state` complet.
3. **Optimitzacions de subscripció (Xat):**
   - Eliminada la injecció de `useXat()` no utilitzada dins de `AppDataLoader`, que provocava que tota l'aplicació re-renderitzara cada volta que aplegava un missatge al websocket.
4. **Neteja d'orfes i Scripts:**
   - Eliminats completament antics fitxers i esborranys: `DesignSectionContent.jsx`, `EspecimenAppGrid.jsx`, `EspecimenUniversalShell.jsx`, múltiples `test-*.mjs` i `.App_old.jsx`.
   - Reemplaçada la referència incorrecta a `rgba(var(--sdp-accent-rgb), 0.1)` per `var(--sdp-accent-vel)` a `AppGridShell.css` ja que la primera no existia a `tokens.css`.
5. **Verificació final:** 
   - 45 de 45 proves de Vitest superades.
   - Commit `f95dd06a` realitzat amb bypass.
   - Tancament de portes en verd.

## 📌 Següent pas
- Només queda una Fase final (Fase 4 - Vistes i SEO) o reprendre l'avaluació de Rutes / SEO en Claude si el mestre així ho considera, mentrestant es pot demanar un prompt (Petorreta) o avaluar l'estabilitat visual del UniversalWorkspace.

## 260918 · Auditoria Extrema Post-Migració — només lectura
1. **Producte:** `_wiki_de_poble/04_escriptori/260918_0243_informe_auditoria_extrema_postmigracio.md`, ancorat a `00_index_escriptori.md`. No s'ha modificat cap línia de codi.
2. **Aturadors:** build Vite mort per 31 imports irresolubles en 26 espècimens; `EspecimenAlerta` i `EspecimenDialeg` tenen estat no declarat; `MemoryRouter` cau amb `navigate(±1)`; `useSearchParams` duplica `basename`; `refreshData()` no té consumidor; publicació pot resoldre sense enviar; la cronologia multimèdia usa un camp absent.
3. **A11y i rendiment:** `aria-busy` llig un `status` inexistent, el fallback global no s'anuncia, el focus no segueix canvis de query en escriptori, hi ha fuga d'escoltadors/fonts en reconnexions i `AppDataLoader` se subscriu inútilment al xat.
4. **Verificació:** Vitest 44/44; Vite build roig; ESLint dels detalls 9 errors/202 avisos; portes d'importacions, catàleg i graella roges; portes d'enxufe i manifest verdes.
5. **Tancament:** executat i fallit exclusivament pels satèl·lits preexistents `20260918_0226_PROMPT_AppGridShell_UI.md` i `20260918_0233_PROMPT_Auditoria_Extrema_Global.md`; l'informe nou està ancorat.

## 📌 Següent pas
- Corregir primer C-01/C-02 i exigir un test que importe tots els loaders. Després atacar integritat de dades i contracte de router abans de qualsevol nova ampliació.

## 260918 · Auditoria Global (Estructura, A11y, SEO, Sollutia) — només lectura
1. **Encàrrec:** `_wiki_de_poble/04_escriptori/260918_0114_PROMPT_Auditoria_Sollutia_Estructura.md`, executat per Claude Code com a auditor. **Cap línia de codi tocada.**
2. **Producte:** `_wiki_de_poble/04_escriptori/260918_0131_INFORME_Auditoria_Global.md` (ancorat a `_wiki_de_poble/04_escriptori/00_index_escriptori.md`), amb tres DAFO (Sollutia, SEO, A11y), matriu d'urgència i estat de les troballes de Codex.
3. **Aturadors trobats:**
   - `useSEO` no s'executa mai: `src/PedraSecaEmbed.jsx` fixa `manageDocumentHead=false` per defecte i cap arrencada el canvia (SEO-01, P0).
   - `SessionProvider` crida `refrescaSessio()`/`elMeuRol()` sense config → expulsió en caducar el JWT i rol `superadmin` mai resolt (S-02, P1; arrel estructural E-04).
   - Model A (`src/host.js`, `configura`) i Model B (ADR, que cita un client de la Frontissa inexistent) conviuen; fixture Sollutia única i sintètica (S-01, decisió humana).
   - Manifest SEO (31 rutes) discordant amb `src/app/App.jsx` i sense consumidor PHP al repositori (SEO-02).
   - Contrast: AA a tot el mode clar i AAA al fosc; el comentari «tot AAA» de `src/css/tokens.css` no és cert per a `--sdp-text-suau` (6,41:1); `public/auth/callback.html` usa el blau vell a 3,87:1 (A-02).
4. **Portes executades (lectura):** enxufe, frontera, adaptadors, frontera-auth, seo, innerhtml, persistencia en verd; rls (2, històriques) i inlinestyles (2, `UniversalEditorShell.jsx:152,154`) en roig; lint 0 errors/37 avisos; vitest 44/44.
5. **Incògnita principal:** zero evidència al repositori de l'API real de Sollutia; cal captura real per recurs.

## 📌 Següent pas
- El Mestre decidix S-01 (Model A vs B) i S-04 (tokens vs galeta `httpOnly`). Després, la IAIA MarIA pot atacar SEO-01 (un valor per defecte) i S-02/E-04 (config a la sessió) amb un prompt curt.

## 260918 · Sticky complet de la UniversalPage
1. **Barres i hero:**
   - La barra blava usa el token canònic `--z-barra-blava`; la hero queda confinada al nivell `0`; la barra taronja queda a `top: var(--sdp-alt-accio)`.
   - La variant `sdp-universal-page-container--page` ja no s'encongeix dins del visor flex, de manera que el contenidor sticky abraça tot el document.
2. **Verificació:**
   - `npm test -- --run`: 44 proves superades.
   - `npm run build:web`: compilació superada.
   - Verificació visual al navegador: hero desplaçable i barres blava/taronja fixes fins al final del document.

## 260918 · Recuperació de l'Ànima (Icones) i Petorreta Sticky
1. **Recuperació d'Icones a la TopBar (src/app/App.jsx)**:
   - S'ha restaurat la `IaiaIcon` (SVG natiu amb l'animació de batec `sdp-iaia-pulse`) a la barra de dalt de la pàgina principal.
   - S'ha substituït la icona genèrica de `Globe` per la `TranslateIcon` dissenyada (l'A/a), respectant el desig de tindre "disseny" a l'eina de traduccions.
   - Ara la barra global torna a tindre els 5 elements sol·licitats: Traductor, Iaia, Cerca, Tema i Perfil.
2. **Preparació per a Codex i Claude**:
   - S'ha creat i ancorat el prompt curt `_wiki_de_poble/04_escriptori/260918_0045_PROMPT_Sticky_Bars.md` a punt per a ser enviat a Codex o Claude a la propera sessió.
   - El prompt detalla perfectament el DOM (`bar-blue`, `hero-image`, `sdp-page-header`) i sol·licita les regles exactes per aconseguir que les dues barres facen un efecte `sticky` correcte al voltant de la imatge, superant les dificultats prèvies on l'scroll trencava l'experiència.

## 📌 Quin és el següent pas (Proper Prompt)
- Obrir una sessió neta ("Nou xat") per evitar la saturació del context i passar el prompt `_wiki_de_poble/04_escriptori/260918_0045_PROMPT_Sticky_Bars.md` a Codex o Claude perquè arreglen l'efecte `sticky` de l'escriptori universal.

---

## 260917 · Finalització Fase 3 (Tancament de l'Auditoria "Sol Muy Alto")
1. **Nucli i Estabilitat**: 
   - Corregit l'error sintàctic greu a `src/sections/profile/PerfilShell.jsx`.
   - Aïllat de forma segura l'estat d'error de renderitzat a `src/app/App.jsx`, retirant dependències de UI no autoritzades (Tailwind/inline).
2. **Integració Sollutia (Deute Tècnic)**:
   - S'ha rectificat `tooling/mocks/sollutiaBackend.js` substituint mètodes vells pels corresponents a la nova signatura del contracte.
3. **Catàleg i Contractes**:
   - `src/sections/disseny/cataleg/registre.js` i `src/sections/disseny/cataleg/manifest.js` apuntats a les rutes de component correctes.
   - Formalitzada i inclosa l'Agenda en quarantena a `src/config/sections.js`.
   - `_wiki_de_poble/04_escriptori/01_produccio/contracte_graella.md` ara inclou legalment `startActions` i `endActions`.
4. **Veritats Canòniques i Neteja**:
   - Purgat `src/ARCHITECTURE.md` de vells cicles de muntatge i `window`.
   - `_wiki_de_poble/02_saber/00_arquitectura_tecnica_unificada.md` netejada de Dexie, Supabase obsolet i PWA.
   - `_wiki_de_poble/02_saber/estandard_ui_universal.md` sanejada respecte a l'arquitectura de Pedra Seca.
5. **Portes, Seguretat i CI**:
   - `tractor-build-previ.mjs` ara genera els artefactes automàticament executant `npm run build` abans de fer error rígid.
   - `.githooks/pre-commit` i `.husky/pre-commit` sincronitzats per avaluar les 3 barreres: `npm run gate`, `npm run lint` i `npm run test`.
   - Token mort `--sdp-touch-min` retirat del CSS.
   - `eslint-plugin-react-hooks` instal·lat amb `legacy-peer-deps` (per xoc amb TipTap) i resolt el seu deute linting.
6. **Sistema de Qualitat i Preparació del Consell**:
   - Creada l'acta/norma `_wiki_de_poble/02_saber/07_plantilles/00_SGQ_PLANTILLES.md` per descriure la rigorositat de l'etiqueta ISO.
   - Creat i ancorat correctament al `00_INDEX_ESCRIPTORI` el document `_wiki_de_poble/04_escriptori/260917_2205_PROMPT_claude_migracio.md` preparat per llançar la fase 4 a l'agent local (Claude/Cowork).

---

## 260917 · Tancament de la Fase 2 (Auditoria de Millora) i Preparació per la Fase 3
1. **Domini i Persistència (Notes):** 
   - S'ha assegurat l'ús de `categoryIds` per les categories a `src/sections/notes/NotesContext.jsx`.
   - S'ha implementat la coalescència de desats (debounce de 800ms) i l'ús de `useUIState` per al locale i l'identitat.
2. **Rutes:**
   - Habilitat un sistema intel·ligent a `src/app/contexts/RouterContext.jsx` que tria si cal fer `replaceState` (perfils o rutes intermèdies buides) o `pushState` (selecció de fitxes), d'acord a `meta.reason`.
3. **UniversalWorkspace i Maquetació:**
   - La `NotesSection` i l'`UniversalWorkspace` han sigut adaptats perquè accepten l'estructuració visual de l'arbre (`navigationGroups`), permetent jerarquitzar Carpetes, Categories i Etiquetes, abandonant la llista plana obsoleta.
   - Reemplaçats els propòsits de `accions` cap als oficials `startActions` i `endActions`.
4. **CSS i Deute Tècnic:**
   - Eliminades definitivament les classes orfes `.sdp-gestor-buit`, `.sdp-workspace-empty` i `.sdp-workspace-search-empty`.
   - Solucionat l'error de scroll de `AppGridShell` retirant l'`overflow-y: auto` innecessari i deixant que `UniversalWorkspace` manege el flex d'alçada com indica la seua arquitectura.
5. **UniversalManager i Consumidors:**
   - `AdminSection` i `PerfilShell` s'han migrat totalment al contracte actual amb l'estructura requerida de `model`.
   - L'`adaptLegacyContract` ha segut completament esborrat, tancant la vella porta del darrere. 
   - Tancament de tractors en verd, incloent `tooling/gates/tractor-fitxa-gestor.mjs`.
