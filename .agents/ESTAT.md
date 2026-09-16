---
tipus: document
estat: esborrany
description: "Acta Marmota: Visió Universal i Tancament de Sessió"
---
# Acta Marmota: Visió Universal i Tancament de Sessió

## 260916 · Tancament de Fase 2, 3 i 4 (Estructura de Pedra Seca i Petorreta)
1. **Sistema de Disseny (Estructura)**:
   - Migrada tota la lògica visual de `src/components/ui/` cap a `src/components/PedraSeca/`.
   - L'estructura interna ara segueix el patró atòmic: `atoms/`, `molecules/`, `organismes/` i `composicio/`.
   - S'han establert els nous macro-contenidors a `composicio/` (i les seues respectives regles CSS a `components.css`): `Pila`, `Fila`, `Graella`, `Costat`, `Centre` i `Superficie`. Açò evita l'ús ad-hoc de `display: flex` al llarg del codi.
2. **Estils i CSS (Pedra Seca)**:
   - Netejat el `tokens.css` deixant exclusivament els 3 radis oficials (`s`, `m`, `g` + `pastilla`) i les 3 elevacions principals (`ombra-1`, `ombra-2`, `ombra-3`). S'ha eliminat `radi-xl` i `ombra-4`.
   - Refactoritzats tots els imports relatius i absoluts al llarg de la base de codi per desfer-se de l'antiga carpeta `ui/` i apuntar recte a `PedraSeca/`. S'han corregit errors a les proves (Vitest) derivats de la resolució d'aquests imports (`components-canonics.test.jsx`).
3. **Auditoria i Tancament**:
   - Compilació completa del projecte via `npm run build` confirmada i en verd (els tests unitaris afectats pel canvi d'estructura passen).
   - Generat l'abocament de context i el prompt per al Consell de la Petorreta (`260916_2333_BUNDLE_sollutia_fase4.md` i `260916_2333_PROMPT_sollutia_fase4.md`).

## 📌 Quin és el següent pas (Proper Prompt)
- **Fase 5 (Agenda Sollutia)**: Iniciar la gestió de l'Agenda (SSO, SSR, CSP), implementant la lògica de subscripció de calendari extern si escau i garantint les polítiques de seguretat del frontend de cara al Consell.
- Revisar l'informe destructiu retornat pel Consell i resoldre qualsevol forat detectat abans d'iniciar la Fase 5.

---

## 260916 · Tancament de l'Auditoria Extrema
1. **Frontera Sollutia (OAuth)**: S'han unificat els dominis permesos (`.cat` i `.com` de Sollutia, i `.org`) a `public/auth/callback.html`, permetent un `postMessage` segur i fallada tancada d'entrada des d'aquests amfitrions.
2. **Pedra Seca - Seguretat Local i Imatges**:
   - `useHeroImageHandler` verifica la longitud màxima de Data URLs (150KB) quan es desin en local per fallada de l'emmagatzematge, i retorna un error en comptes d'embossar el `localStorage`. Afegit un avís natiu real abans de l'esborrat.
   - S'han utilitzat rutes globals segures en `DetallAjust.jsx` usant `carpetaMitjans` dinàmica per avatars (en lloc de forçar `'avatars'` a tot arreu) i s'ha sanejat la pujada cap al host.
   - A `UniversalPage.jsx` s'ha evitat l'error en usar l'API del `clipboard` amb un `.catch()` i comprovat que les dates arriben sempre en mode *string* per evitar errors silenciosos del parser.
3. **Editor i Classes Ui**: Esmenats els atributs i classes antigues a `UniversalEditorShell.jsx` (cap al canon visual `sdp-editor`, `sdp-canvas`, `sdp-avatar__imatge`), i resolta la "Bomba" (el render repetit del menú d'extensions), al deixar-lo pur ja estava protegit per ser mòdul superior.
4. **Dependències Obsolescents**: Elimat totalment `tractor-frontissa.mjs` de la matriu de verificacions (`run-portes.mjs`), permetent que passe a centrar-se en els restants (29 fallades prèvies de deute tècnic pendent).
5. **Context d'Editor i Sanitització**: Ara `NotesContext.jsx` sanititza l'estat d'esborrany previ a guardar localment el camp per no exposar-nos a cross-site temporal. Substituït el hardcoded de "La Torre" a paràmetres procedents d' `externalConfig` per deixar pas a l'Enxufabilitat.
