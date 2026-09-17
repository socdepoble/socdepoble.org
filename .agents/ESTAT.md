---
tipus: document
estat: esborrany
description: "Acta Marmota: Visió Universal i Tancament de Sessió"
actualitzat: 2026-09-18 00:57
---
# Acta Marmota: Visió Universal i Tancament de Sessió

## 260918 · Sticky complet de la UniversalPage
1. **Barres i hero:**
   - La barra blava usa el token canònic `--z-barra-blava`; la hero queda confinada al nivell `0`; la barra taronja queda a `top: var(--sdp-alt-accio)`.
   - La variant `sdp-universal-page-container--page` ja no s'encongeix dins del visor flex, de manera que el contenidor sticky abraça tot el document.
2. **Verificació:**
   - `npm test -- --run`: 44 proves superades.
   - `npm run build:web`: compilació superada.
   - Verificació visual al navegador: hero desplaçable i barres blava/taronja fixes fins al final del document.

## 260918 · Recuperació de l'Ànima (Icones) i Petorreta Sticky
1. **Recuperació d'Icones a la TopBar (App.jsx)**:
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
   - Corregit l'error sintàctic greu a `PerfilShell.jsx`.
   - Aïllat de forma segura l'estat d'error de renderitzat a `App.jsx`, retirant dependències de UI no autoritzades (Tailwind/inline).
2. **Integració Sollutia (Deute Tècnic)**:
   - S'ha rectificat `sollutiaBackend.js` substituint mètodes vells pels corresponents a la nova signatura del contracte.
3. **Catàleg i Contractes**:
   - `registre.js` i `manifest.js` apuntats a les rutes de component correctes.
   - Formalitzada i inclosa l'Agenda en quarantena a `sections.js`.
   - `contracte_graella.md` ara inclou legalment `startActions` i `endActions`.
4. **Veritats Canòniques i Neteja**:
   - Purgat `ARCHITECTURE.md` de vells cicles de muntatge i `window`.
   - `00_arquitectura_tecnica_unificada.md` netejada de Dexie, Supabase obsolet i PWA.
   - `estandard_ui_universal.md` sanejada respecte a l'arquitectura de Pedra Seca.
5. **Portes, Seguretat i CI**:
   - `tractor-build-previ.mjs` ara genera els artefactes automàticament executant `npm run build` abans de fer error rígid.
   - `.githooks/pre-commit` i `.husky/pre-commit` sincronitzats per avaluar les 3 barreres: `npm run gate`, `npm run lint` i `npm run test`.
   - Token mort `--sdp-touch-min` retirat del CSS.
   - `eslint-plugin-react-hooks` instal·lat amb `legacy-peer-deps` (per xoc amb TipTap) i resolt el seu deute linting.
6. **Sistema de Qualitat i Preparació del Consell**:
   - Creada l'acta/norma `00_SGQ_PLANTILLES.md` per descriure la rigorositat de l'etiqueta ISO.
   - Creat i ancorat correctament al `00_INDEX_ESCRIPTORI` el document `260917_2205_PROMPT_claude_migracio.md` preparat per llançar la fase 4 a l'agent local (Claude/Cowork).

---

## 260917 · Tancament de la Fase 2 (Auditoria de Millora) i Preparació per la Fase 3
1. **Domini i Persistència (Notes):** 
   - S'ha assegurat l'ús de `categoryIds` per les categories a `NotesContext.jsx`.
   - S'ha implementat la coalescència de desats (debounce de 800ms) i l'ús de `useUIState` per al locale i l'identitat.
2. **Rutes:**
   - Habilitat un sistema intel·ligent a `RouterContext.jsx` que tria si cal fer `replaceState` (perfils o rutes intermèdies buides) o `pushState` (selecció de fitxes), d'acord a `meta.reason`.
3. **UniversalWorkspace i Maquetació:**
   - La `NotesSection` i l'`UniversalWorkspace` han sigut adaptats perquè accepten l'estructuració visual de l'arbre (`navigationGroups`), permetent jerarquitzar Carpetes, Categories i Etiquetes, abandonant la llista plana obsoleta.
   - Reemplaçats els propòsits de `accions` cap als oficials `startActions` i `endActions`.
4. **CSS i Deute Tècnic:**
   - Eliminades definitivament les classes orfes `.sdp-gestor-buit`, `.sdp-workspace-empty` i `.sdp-workspace-search-empty`.
   - Solucionat l'error de scroll de `AppGridShell` retirant l'`overflow-y: auto` innecessari i deixant que `UniversalWorkspace` manege el flex d'alçada com indica la seua arquitectura.
5. **UniversalManager i Consumidors:**
   - `AdminSection` i `PerfilShell` s'han migrat totalment al contracte actual amb l'estructura requerida de `model`.
   - L'`adaptLegacyContract` ha segut completament esborrat, tancant la vella porta del darrere. 
   - Tancament de tractors en verd, incloent `tractor-fitxa-gestor.mjs`.
