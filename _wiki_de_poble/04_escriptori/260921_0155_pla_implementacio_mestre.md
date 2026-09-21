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

### 5. Auditoria Extrema Codex & Claude: Integritat, Dades i Eines

A partir del veredicte conjunt "NO-GO" de les dues auditories (Codex i Claude), s'han documentat múltiples forats crítics. A continuació les solucions estructurals unificades:

#### [MODIFY] `src/sections/notes/GlobalSaveManager.js`
- **Pèrdua de Draft per Confirmació Antiga (F01/A2):** Quan arriba l'ACK d'una escriptura antiga, no s'ha d'esborrar l'esborrany sencer si l'usuari ha continuat escrivint. Cal versionar la clau (ex. `${key}#${seq}`) o validar el timestamp abans d'esborrar.
- **La recuperació d'esborranys és inert (A1):** L'esborrany s'escriu però mai es recupera perquè la clau conté `::` (de l'`actorKey`) i `GlobalSaveManager` extreu el `noteId` fent `split(':')[1]`. S'ha d'usar `lastIndexOf(':')` o guardar l'objecte JSON estructurat.
- **Recuperació Passiva i sense Reintents (F03/A3):** Un cop recuperat, no hi ha cua de reintents ni *backoff* per a offline. S'ha de reencuar automàticament i mantenir l'estat.
- **El Conflicte destrueix el Draft (F02):** Un error 409 (Conflicte) no ha d'eliminar l'esborrany local. Cal retenir-lo marcat com a conflicte per a l'usuari.
- **Aïllament de Sessió i Privacitat (F04/A5):** Les tasques encuades s'han de cancel·lar en canviar de sessió. A més, els esborranys de notes privades queden en clar a IndexedDB per sempre. Cal afegir purga en el `logout` i TTL.
- **Errors no gestionats a IDB (F06/A4):** Tancar explícitament les connexions a IndexedDB (`db.close()`) en rebre `onversionchange` i capturar rebutjos per evitar memory leaks i bloquejos d'esquema.
- **Cua il·limitada (F07):** Reconciliar bé `knownRevisions` per no ofegar la versió remota. Limitar el tamany de la cua.

#### [MODIFY] `src/sections/notes/NotesContext.jsx`, `NotesDataContext.jsx` & `UniversalWorkspace.jsx`
- **Cada recàrrega buida el Bloc i desmunta l'Editor (B1):** Quan `NotesDataContext` rep un error (409 o timeout) i demana `refresh()`, l'estat passa a `loading` i buida la llista. Això desmunta l'editor, perdent el cursor i l'escriptura, causant bucles infinits de 409 falsos. Cal mantenir el `payload` visible (`revalidating`) sense esborrar-lo.
- **Publicació No Atòmica (F05):** L'acció de publicar fa dues escriptures separades. Cal encapsular-ho en una transacció atòmica.
- **Paginació Limitada (F09):** Limitat a 50 elements sense paginació per defecte.

#### [MODIFY] `src/data/supabase/runtime.js` & `src/sections/notes/NotesDataContext.jsx`
- **Classificació d'errors i Timeout invertida (F08/B2):** L'error "La petició ha trigat massa temps" i el `TypeError` silenciat es filtren buscant "fetch" o "timeout", però els errors traduïts no contenen eixes paraules (diuen "Error de xarxa"). S'han de discriminar per codi (ex. `error.name` / `error.status`), mai per text localitzat.

#### [MODIFY] `tooling/gates/verificador-scc.mjs` & `run-portes.mjs`
- **Passades Falses del Verificador SCC i CLI Trencada (F10/C1/C2):** 
  - Corregir `CAMINS.arrelSegura` inexistent a la CLI, que fa que SCC explote sense arguments (retornant codi 1, la qual cosa `run-portes` aturava, o potser passava en verd si estava capturat).
  - L'ancoratge compara `04_ESCRIPTORI` en majúscules amb la ruta real en minúscules, ignorant tots els fitxers silenciosament en Linux.
- **ESLint bloqueja la cadena de portes (E1):** Els 23 errors `eol-last` de l'ESLint detenen `run-portes.mjs` al pas 3. S'han de fer les comprovacions sense aturar la resta, o convertir `eol-last` en avís/fixar els fitxers.

#### [MODIFY] `tooling/lib/arrel.mjs`
- **Export trencat de l'Arrel (F11/D1):** `String(ARREL)` llança una excepció per tractar-se d'un Proxy no-iterable, trencant aplicacions CLI.

### 6. Auditoria Visual i Arquitectura del Workspace (W1-W4)

D'acord amb la revisió visual i arquitectònica sol·licitada i validada per Codex, s'implementaran les següents millores a l'`UniversalWorkspace`:

#### [MODIFY] `src/css/modules.css`, `src/components/layout/AppGridShell.css`
- **W1 (Unificació de Capçaleres):** S'eliminarà la divergència visual on certes files (com "Tot") aplicaven fons `var(--sdp-pedra-700)` ocultant la seua naturalesa de capçalera. Es separarà el rol estructural (`AppGridColumn`) del to visual unificant l'ús dels tokens semàntics de superfície. Les capçaleres de la columna esquerra ("CARPETES") i central ("NOTES") compartiran exactament la mateixa estètica.
- **W2 (Vores Rectangulars):** Es substituirà l'ús de `--sdp-radi-pastilla` (vores completament circulars) en els selectors d'accions principals (com "CREAR NOTA", el botó actiu "Tot" i accions de l'editor) per l'estàndard rectangular de vores arrodonides de Sóc de Poble (`--sdp-radi-m`), sense destruir el token global de pastilla.

#### [MODIFY] `src/components/universal/workspace/UniversalWorkspace.jsx`, `src/components/universal/workspace/ItemListColumn.jsx`
- **W3 (Arquitectura Agnòstica):** S'implementarà un *slot* genèric (`renderCreateCard`) a nivell de Workspace per rebre el component de creació des de l'exterior. Açò manté el Workspace 100% agnòstic, permetent que puga ser usat per una Gestoria o un Sistema de Disseny sense acoblaments de domini.

#### [MODIFY] `src/sections/notes/NotesSection.jsx`, `src/sections/notes/NotaFitxa.jsx`
- **W4 (Mancances UX de Notes):**
  - S'injectarà una `NotaCreateCard` a través del nou *slot* per poder crear notes explícitament (solucionant el problema de no tenir miniatura quan la llista està buida).
  - Es millorarà la derivació del títol ("Sense títol") extraient-lo de la primera línia útil, però sense sobreescriure el camp de persistència.
  - S'ajustarà la caiguda visual de les miniatures per prevenir espais "fantasmes" quan la targeta no té contingut rellevant.

## Verification Plan

### Manual Verification
- Cridar un `arrenca()` forçant fallades i comprovant la resolució neta.
- Executar `npm run porta:scc` i garantir que reporta errors per índexs trencats.
- Simular offline per testejar els *drafts* (comprovar la caiguda i recuperació gràcies al fix de l'`split("::")`).
- Verificar que el linter passa completament (`npm run lint`).
