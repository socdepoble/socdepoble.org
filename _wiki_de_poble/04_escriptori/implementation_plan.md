# Correcció de Defectes i Neteja de l'Auditoria B

L'auditoria de Claude (SDP-PROMPT-260920-B) ha revelat una sèrie de defectes d'estabilitat i codi mort que s'han de solucionar per assegurar la robustesa del sistema, especialment per a la incrustació amb Sollutia.

## Proposed Changes

A continuació es detalla el pla per a resoldre els problemes detectats:

### 1. Avisador Efímer (Neteja)
Eliminar el codi mort del sistema de notificacions antic que ha quedat obsolet per l'ús del `NotificationContext`.

#### [MODIFY] `src/components/universal/AvisadorEfimer.jsx`
- Eliminar la gestió del singleton: `sharedRoot`, `sharedContainer`, `userProvidedTarget`, `setToastTarget`, `showToast` i `destroyToastSystem`.
- Només s'ha d'exportar el component React pur `AvisadorEfimer`.

#### [MODIFY] `src/PedraSecaEmbed.jsx`
- Eliminar les crides a `setToastTarget` (línia 327) i `destroyToastSystem` (línia 608).

### 2. Estabilitat de l'Arrencada (host.js)
Resoldre els problemes de promeses i el comportament de la injecció de sessió.

#### [MODIFY] `src/host.js`
- **Defecte A (Promesa Irrecuperable):** `promesaLlest` està dissenyada per no resoldre mai si un intent d'`arrenca()` falla. Mourem la instanciació de `promesaLlest` de manera que si falla, una crida futura pugui tornar a instanciar o resoldre correctament, i s'implementarà un wrapper net.
- **Defecte B (Doc injectaSessio):** La doc indica que es pot cridar en qualsevol fase, però falla si es fa abans de `configura()`. S'actualitzarà la documentació d'`injectaSessio` indicant que és "fail-closed" abans de `configura()`.
- **Codi Mort:** Eliminar la comprovació inaccessible d'`opcions.emissorEsperat` (línies 345-349).
- **Consistència DOM:** Millorar l'ancoratge per a rutes standalone, on `main.jsx` no defineix `targetNode` per a `App.jsx`.

### 3. Rigor dels Tractors
Ajustar l'anàlisi estàtica de dependències per evitar falsos positius o forats de seguretat.

#### [MODIFY] `tooling/gates/tractor-enxufe.mjs`
- **Forat E1 (Àlies `@/`):** Ampliar el generador d'imports per a resoldre correctament imports que comencen per `@/`.
- **Inèrcia E3:** Modificar la recerca de `freezeImplementation()` en host.js per a que use `senseComentaris(hostText)` i evite enganyar-se amb els comentaris del mateix fitxer.
- **Formes E4:** Millorar la detecció d'assignacions globals incloent `Object.defineProperty(window, ...)` i `window['...']`.

### 4. Capa Visual i Neteja a App.jsx
Netejar codi no utilitzat i regles CSS que no encerten mai.

#### [MODIFY] `src/css/layout.css`
- Eliminar els selectors inútils `:host(.sidebar-closed)` (línies 576-592).
- Eliminar la regla fantasma `:host(.has-sidebar-open)::after` (línia 363).

#### [MODIFY] `src/app/App.jsx`
- Eliminar les crides inútils a `useIdentitat()` que només prenen variables que no s'usen (línies 168 i 634).
- Consolidar/eliminar les múltiples definicions de `buildPath` si ja no s'usen per a res més que retornar la mateixa ruta.

## Verification Plan

### Manual Verification
- Cridar un `arrenca()` forçant que falle (p. ex., amb una URL de Supabase errònia) i després tornar-ho a intentar, verificant que la nova promesa resolgui a `quanLlest()`.
- Verificar els scripts dels tractors: `node tooling/gates/run-portes.mjs` hauria de passar net (els tractors modificats).
