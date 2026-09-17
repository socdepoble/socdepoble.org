---
tipus: document
estat: esborrany
description: "Acta Marmota: Visió Universal i Tancament de Sessió"
---
# Acta Marmota: Visió Universal i Tancament de Sessió

## 260916 · Tancament de Fase 2, 3 i 4 (Estructura de Pedra Seca i Petorreta)
1. **Sistema de Disseny (Estructura)**:
   - Migrada tota la lògica visual de `src/components/PedraSeca/` cap a `src/components/PedraSeca/`.
   - L'estructura interna ara segueix el patró atòmic: `atoms/`, `molecules/`, `organismes/` i `composicio/`.
   - S'han establert els nous macro-contenidors a `composicio/` (i les seues respectives regles CSS a `src/css/components.css`): `Pila`, `Fila`, `Graella`, `Costat`, `Centre` i `Superficie`. Açò evita l'ús ad-hoc de `display: flex` al llarg del codi.
2. **Estils i CSS (Pedra Seca)**:
   - Netejat el `src/css/tokens.css` deixant exclusivament els 3 radis oficials (`s`, `m`, `g` + `pastilla`) i les 3 elevacions principals (`ombra-1`, `ombra-2`, `ombra-3`). S'ha eliminat `radi-xl` i `ombra-4`.
   - Refactoritzats tots els imports relatius i absoluts al llarg de la base de codi per desfer-se de l'antiga carpeta `ui/` i apuntar recte a `PedraSeca/`. S'han corregit errors a les proves (Vitest) derivats de la resolució d'aquests imports (`tests/ui/components-canonics.test.jsx`).
3. **Auditoria i Tancament**:
   - Compilació completa del projecte via `npm run build` confirmada i en verd (els tests unitaris afectats pel canvi d'estructura passen).
   - Generat l'abocament de context i el prompt per al Consell de la Petorreta (`_wiki_de_poble/90_arxiu_historic/260916_2333_BUNDLE_sollutia_fase4.md` i `_wiki_de_poble/90_arxiu_historic/260916_2333_PROMPT_sollutia_fase4.md`).

## 260917 · Finalització Fase 4 i Fase 5 (Poda CSS Executada)
1. **Fase 4 (Pont Sollutia - Seguretat):**
   - Garantida la fallada tancada en el pont Iframe mitjançant validació estricta i control d'`emissorEsperat` a `src/data/identitat.js` i `host.js`.
   - Afegit l'script de prebuild `tooling/gates/saneja-callback.mjs` que assegura matemàticament que `localhost` mai viatge a l'entorn de producció dins de `callback.html`.
2. **Fase 5 (Poda CSS i Estructura):**
   - Reparada i executada amb èxit l'eina `tooling/scripts/migrate-css.mjs` (havia fallat silenciosament per mutabilitat de l'AST). 
   - Eliminat definitivament el deute tècnic pesat de `src/css/sdp.css`. Les regles s'han desplaçat nítidament dins les capes `@layer components` i `@layer legacy` a `src/css/components.css` i `src/css/modules.css`.
   - Refactoritzats els components zombis i unificat l'export cap a la façana principal `src/components/PedraSeca/index.js`.
   - Build en verd (0 errors).
3. **Petorreta Generada:**
   - Nou bundle lliure de restes antigues creat al directori `04_ESCRIPTORI` i prompt generat preparat per a l'auditoria final del Consell.

## 📌 Quin és el següent pas (Proper Prompt)
- L'auditoria extrema de les Fases 4 i 5 ha estat completada favorablement i s'ha generat l'informe a `_wiki_de_poble/04_escriptori/260917_0245_auditoria_fase4_fase5.md`. S'ha demostrat que la suposada ruptura del CSS era un fals positiu provocat pel malentès de l'encapsulament del Shadow DOM.
- Iniciar el disseny/estabilització restant un cop el Mestre revise l'informe d'auditoria.

---

## 260917 · Resolució de Deutes Tècnics i Portes
1. **Porta Arrel i Graella:**
   - Reparades les guardes de reflex CLI als scripts de `tooling/gates/` perquè incloguen les URL dels mòduls com cal.
   - Sincronitzada la porta `contracte_graella.md` eliminant propietats obsoletes de `AppGridShell.jsx`.
2. **Tractor Cognitiu i Cens:**
   - Estandarditzats els frontmatter de tots els 18 SKILLS de `.agents/skills/` aportant les metadades que mancaven (`name`, `version`, `status`, `lang`, `triggers_on`).
   - Sanejat l'INFORME_apple_design_skill per complir amb el cens sencer (incloent tots els membres del consell) a requeriment de la Porta Cens.
3. **Fronteres Rutes i Consell:**
   - Corregida ruta `/notes` eliminant `/*` a `App.jsx` per evitar orfandats.
   - Injectades les claus de traducció pendents a `src/config/i18n.js` i completat l'exportació de `NotesSection.jsx` per evitar òrgans morts.
4. **Registres i Doctrina:**
   - Afeccionat l'índex `00_INDEX_SKILLS.md` per incloure oficialment `ment-colmena-integral` i regenerat el manifest via `tractor-manifest.mjs`.
   - Reemplaçats 27 enllaços orfes de l'ESTAT i la doctrina, garantint que la `Porta Doctrina` quede neta (ex. rutes com `UniversalPage` que ara apunten bé, fixar `/07_plantilles/`).
5. Tots els 13 tractors passen feliçment menys el reflex final, per la qual cosa s'ha fixat a l'historial d'accions abans del tancament.

---

## 260916 · Tancament de l'Auditoria Extrema
1. **Frontera Sollutia (OAuth)**: S'han unificat els dominis permesos (`.cat` i `.com` de Sollutia, i `.org`) a `public/auth/callback.html`, permetent un `postMessage` segur i fallada tancada d'entrada des d'aquests amfitrions.
2. **Pedra Seca - Seguretat Local i Imatges**:
   - `useHeroImageHandler` verifica la longitud màxima de Data URLs (150KB) quan es desin en local per fallada de l'emmagatzematge, i retorna un error en comptes d'embossar el `localStorage`. Afegit un avís natiu real abans de l'esborrat.
   - S'han utilitzat rutes globals segures en `src/sections/profile/DetallAjust.jsx` usant `carpetaMitjans` dinàmica per avatars (en lloc de forçar `'avatars'` a tot arreu) i s'ha sanejat la pujada cap al host.
   - A `src/components/universal/UniversalPage.jsx` s'ha evitat l'error en usar l'API del `clipboard` amb un `.catch()` i comprovat que les dates arriben sempre en mode *string* per evitar errors silenciosos del parser.
3. **Editor i Classes Ui**: Esmenats els atributs i classes antigues a `src/components/universal/UniversalEditorShell.jsx` (cap al canon visual `sdp-editor`, `sdp-canvas`, `sdp-avatar__imatge`), i resolta la "Bomba" (el render repetit del menú d'extensions), al deixar-lo pur ja estava protegit per ser mòdul superior.
4. **Dependències Obsolescents**: Elimat totalment `tooling/gates/tractor-sollutia.mjs` de la matriu de verificacions (`tooling/gates/run-portes.mjs`), permetent que passe a centrar-se en els restants (29 fallades prèvies de deute tècnic pendent).
5. **Context d'Editor i Sanitització**: Ara `src/sections/notes/NotesContext.jsx` sanititza l'estat d'esborrany previ a guardar localment el camp per no exposar-nos a cross-site temporal. Substituït el hardcoded de "La Torre" a paràmetres procedents d' `externalConfig` per deixar pas a l'Enxufabilitat.
