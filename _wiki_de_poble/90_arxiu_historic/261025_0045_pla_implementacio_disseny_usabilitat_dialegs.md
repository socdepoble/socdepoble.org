---
type: document
status: esborrany
description: Pla per a erradicar el doble scroll en Dialeg, fer finestres adaptatives, selector compacte de retall i resoldre G-P11-01.
tags:
  - implementacio
visibility: private
reflex: sdp:torn_bfb7558b-37b2-4828-b258-fc5b181dc76f:ca548853-1021-4342-90cb-3e0132a897c7
---
# Disseny aplicat a la usabilitat: erradicació del doble scroll i diàlegs adaptatius

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_bfb7558b-37b2-4828-b258-fc5b181dc76f:ca548853-1021-4342-90cb-3e0132a897c7 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-24T22:42:08.522Z |
| Modificació | 2026-10-24T22:45:00.000Z |
| Propietari | IAIA MarIA |
| Aprovació humana | Mestre Javi Llinares (àudios 00:33, 00:35, 00:36) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | IAIA MarIA (Antigravity) |
| Tokens consumits | ~18.000 |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-24T22:42:08.522Z: esborrany creat des de la plantilla canònica.
2026-10-24T22:45:00.000Z: pla redactat i aprovat d'acord amb les directrius del Mestre sobre disseny, usabilitat i doble scroll, integrant la troballa P2 de Codex (G-P11-01).

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context i Troballes (Research)

1. **La màxima del Mestre:** «El disseny és com el soroll per a allò usable». Un component pot ser funcional i complir els tests, però si conté defectes visuals (dobles barres d'scroll paral·leles, finestres encotillades a mitja pantalla quan hi ha espai de sobres, o selectors quilomètrics que amaguen el contingut essencial), esdevé confús, genera soroll cognitiu i transmet la sensació d'estar «mig trencat».
2. **Causa arrel del doble scroll en `<Dialeg>`:**
   - L'element natiu `<dialog>` té per defecte al full d'estil de l'agent d'usuari dels navegadors (User Agent Stylesheet) `overflow: auto;`.
   - A `src/css/components.css`, la classe `.sdp-dialeg` té `max-height: min(88dvh, 48rem);` però **mancava de `overflow: hidden;`**.
   - A dins, `.sdp-dialeg__cos` té `overflow-y: auto;`.
   - Quan el contingut o el marc interior sobrepassa l'alçària del `<dialog>`, tant el pare `<dialog>` com el fill `.sdp-dialeg__cos` activen sengles barres de desplaçament vertical simultànies, creant el desagradable efecte de dos scrolls paral·lels enganxats.
   - A més, en flexbox `.sdp-dialeg__cos` necessita `min-height: 0; flex: 1 1 auto;` per encongir-se correctament dins de `.sdp-dialeg__marc` sense desbordar el contenidor arrel.
3. **Encotillament de diàlegs quan hi ha espai de sobres (ex: `SelectorVisibilitat`):**
   - A `SelectorVisibilitat.jsx`, s'especifica `lloc="barra"`. La classe associada `.sdp-dialeg.sdp-dialeg--barra` a `src/css/modules.css` imposa `margin: var(--sdp-alt-barres) var(--sdp-space-4) auto auto;` i `max-height: min(calc(100vh - var(--sdp-alt-barres) - var(--sdp-space-8)), 48rem);`. Açò resta d'entrada 212px d'alçària a la pantalla, fins i tot quan el selector s'invoca des de la vista de perfil o fora de la barra d'eines.
   - Amb `mida="m"` (36rem / 576px d'ample), les dues targetes de selecció i els avisos inferiors queden comprimits en un espai estret que força salt de línies vertical, superant el màxim d'alçària disponible i disparant un scroll innecessari a mitja pantalla.
4. **Retall de capçalera (`DialegEnquadrament.jsx`):**
   - El selector senzill actual renderitza un `<GrupOpcions>` de 9 elements de ràdio en llista vertical, cadascun amb la seua explicació de text d'ajuda.
   - Això desplaça el visor de la imatge fora de la pantalla en fer scroll cap avall, de manera que l'usuari no pot veure l'efecte del format triat sobre la imatge mentre el selecciona.
   - Cal un selector compacte de pastilles o botons d'icona/proporció situat immediatament a la vora del visor, acompanyat d'una sola línia explicativa dinàmica que mostre la didàctica del format actiu.
5. **Troballa P2 de Codex (`G-P11-01`):**
   - A `src/data/supabase/organizations.js`, `columnesDirectoriAbsents` és un Set global compartit que guarda l'absència de `town_name`. Si una petició a un servidor antic falla amb `42703`, aquest Set bloqueja les consultes posteriors a servidors moderns vàlids sense consultar-los. Cal acotar aquest registre per backend/URL o netejar-lo en canvi de context.
6. **Reforma de la Pàgina de Connectar (`IDEA-22`, Directiva del Mestre, àudios 00:53, 00:54, 00:55):**
   - **Multirepresentació d'Actors:** Erradicar la fal·làcia «Actues com a Sóc de Poble, però les connexions són personals». Una empresa es connecta amb una altra empresa (B2B rural). Cal permetre triar de forma simple amb quina identitat et connectes (Persona, Empresa o Grup) des de la mateixa pantalla de connexió.
   - **Accés directe al Xat de l'Entitat:** Eliminar el bloqueig «Des d'ací encara no es pot arribar al xat d'esta entitat: parla directament amb qui l'administra». Ha d'haver accés net al xat privat amb qui l'administra o al xat públic de l'empresa per a comentar o preguntar directament.
   - **Purga de «Administrar l'organització»:** Treure `BlocAdministrarOrganitzacio` de `/connectar`. Administrar entitats, donar rols i afegir treballadors pertany exclusivament al Workspace / panell intern de gestió (`DetallCompte` / `GestioMembres`).

### 2. Preguntes Obertes (User Review Required)

- Cap pregunta oberta bloquejant: el Mestre ha especificat clarament l'objectiu estètic i funcional als àudios.

### 3. Canvis Proposats (Proposed Changes)

#### [MODIFY] `src/css/components.css`
- Afegir `overflow: hidden;` a `.sdp-dialeg` per evitar que el `<dialog>` natiu mostre mai barra de scroll exterior.
- Assegurar a `.sdp-dialeg__marc`:
  ```css
  .sdp-dialeg__marc { display: flex; flex-direction: column; height: 100%; max-height: inherit; min-height: 0; }
  ```
- Assegurar a `.sdp-dialeg__cap`, `.sdp-dialeg__descripcio`, `.sdp-dialeg__peu`:
  ```css
  flex-shrink: 0;
  ```
- Assegurar a `.sdp-dialeg__cos`:
  ```css
  .sdp-dialeg__cos { flex: 1 1 auto; min-height: 0; padding: var(--sdp-space-4) var(--sdp-space-6); overflow-y: auto; overscroll-behavior: contain; }
  ```

#### [MODIFY] `src/css/modules.css`
- Ajustar `.sdp-dialeg--barra` perquè no col·lapse l'alçària màxima innecessàriament i permeta que els diàlegs de barra respiren amb alçària fluida adaptable si el viewport ho permet.
- Donar suport a un selector compacte de pastilles de ràtio per a l'enquadrament (`.sdp-enquadrament__formats-compactes`).

#### [MODIFY] `src/components/universal/enquadrament/DialegEnquadrament.jsx`
- En el mode senzill, substituir la llista vertical desmesurada de ràdios de `GrupOpcions` per una barra compacta de pastilles/botons de format directament visibles sota o al costat del visor de retall.
- Mostrar una sola didàctica dinàmica en temps real: una línia neta que explica la proporció triada (ex: *«Panoràmic (16:9): a la fitxa es veu sencera; a les targetes es retalla en quadrat 1:1»*).
- Canviar la mida a `mida="m"` (o adaptativa) per a una visualització còmoda sense pèrdua de la imatge.

#### [MODIFY] `src/components/universal/SelectorVisibilitat.jsx`
- Garantir que el diàleg respire amb alçària natural segons el contingut: si cap a la pantalla, zero scroll. Si sobrepassa, scroll únic i net a `.sdp-dialeg__cos`.

#### [MODIFY] `src/sections/connectar/ConnectarSection.jsx`
- Eliminar la restricció i frase «les connexions són personals».
- Integrar la multirepresentació de l'actor que connecta (selector d'identitats de l'usuari: Javi Llinares, Sóc de Poble, El Rentonar) perquè les connexions siguen B2B o d'entitat.
- Purgar el muntatge de `<BlocAdministrarOrganitzacio>` de la vista `/connectar`.

#### [MODIFY] `src/sections/connectar/organitzacio/BlocFormarPart.jsx`
- Eliminar el bloqueig `sense-xat` («Des d'ací encara no es pot arribar al xat...»); enllaçar directament amb el xat privat de l'entitat o xat de conversa.

#### [MODIFY] `src/data/supabase/organizations.js`
- Resoldre la troballa P2 `G-P11-01`: acotar el Set d'absències `columnesDirectoriAbsents` per clau de servidor/URL (ex: Map de Sets per URL) o permetre la seua invalidació/reconnexió neta, evitant que una fallada en un host antic contamine altres amfitrions compatibles.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. **Verificació de Doble Scroll:**
   - Obrir `SelectorVisibilitat` i `DialegEnquadrament` al navegador i comprovar que MAI apareixen dues barres de scroll paral·leles.
   - Comprovar que el diàleg s'adapta a l'alçària del contingut quan hi ha espai vertical a la finestra.
2. **Verificació de Retall Compacte:**
   - Comprovar que les 9 proporcions es poden seleccionar amb un sol clic sense perdre de vista el visor de retall ni requerir scroll vertical.
   - Comprovar que la didàctica dinàmica s'actualitza instantàniament en canviar de proporció.
3. **Bateria de Tests Automàtics:**
   - `npm test` sobre `Dialeg.test.jsx`, `SelectorVisibilitat.test.jsx`, `DialegEnquadrament.test.jsx`, `organizations.test.js`.
   - `npm run test:precommit` complert en < 30 segons.
   - `node tooling/gates/porta-olivera.mjs` amb codi 0.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Risc de regressió visual en altres diàlegs:** El canvi a `.sdp-dialeg` és a nivell d'organisme transversal de Pedra Seca. Cal comprovar que els calaixos (`sdp-dialeg--calaix`) i pantalla completa (`sdp-dialeg--completa`) mantenen intacte el seu comportament.
- **Risc de CLS en retall:** El visor de retall ha de mantenir la seua alçària de reserva per a evitar salts de maquetació.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261025_0031_auditoria_codex]]

