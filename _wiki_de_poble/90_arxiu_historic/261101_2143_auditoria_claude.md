---
type: informe
status: esborrany
description: 'Relleu i informe de Claude de la marató nocturna 261101_2059: blocs B0-B7 amb Gauntlet, proves, portes i commits locals.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_3d9af83b-3a4a-4735-a6ec-925b1d9c633e:27aa497d-6353-4fd5-a80c-1a75136c7450
---
# Informe de Claude — Marató nocturna d'extirpació total de deute (Blocs B0-B7)

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_3d9af83b-3a4a-4735-a6ec-925b1d9c633e:27aa497d-6353-4fd5-a80c-1a75136c7450 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-01T20:47:51.104Z |
| Modificació | 2026-11-01T20:47:51.104Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5) · Ultracode |
| Tokens consumits | en curs |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 f537f054c68a648cc755a61c2b3037b375ec37304d98ff1631e290212d2bcd6c. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- **2026-11-01 21:47 CET:** esborrany creat; torn `torn_3d9af83b` obert (`--scope code`), pla 2059 vinculat.
- **2026-11-01 21:48 CET · relleu 1:** documents d'entrada llegits (acta, pla, prompt, Llibre Mestre per IDs, v1.7.0 de Codex, Tall 11 de Gemini). Dotze agents d'especificació contrasten B0–B7 amb l'arbre real abans de picar codi. Línia base: `run-portes` s'atura a la Porta Doctrina (`.agents/ESTAT.md:14` cita `inicia-node-germa.test.mjs` sense `tests/`). Avís per a Codex i Gemini: al Llibre Mestre `P1-29` és el cens d'imatges i `P1-30` les fronteres de les skills, no les tarifes de la Consola. Carpeta de treball: `../_investigacio_ia_de_poble/261101_2143_marato_extirpacio_claude/`.
- **2026-11-01 22:46 CET · relleu 2:** 12/12 especificacions entregades a `../_investigacio_ia_de_poble/261101_2143_marato_extirpacio_claude/specs/`. Afirmacions del pla que no s'aguanten a l'arbre: `NavBar` a `tractor-rutes-web.mjs:46`, `Consola.jsx` i `audita-consola-coherencia.mjs` (no existixen), cadena de hash del LEDGER (és un sha256 del fitxer sencer), comarca «L'Horta» per a València, `FinestraUniversal.jsx`, `src/components/universal/Dialeg.jsx` (el real és `PedraSeca/organismes/Dialeg.jsx`), `ap_inbox_lliuraments` i `ap-inbox-verifica` (no existien; Gemini en deia «RFC 9421» i la biblioteca és draft-cavage-12), `src/sections/cerca` i `src/sections/lector`. Al disseny E2EE, F2a és l'alta silenciosa i F7 la recuperació social; la verificació creuada ja estava feta. Línia base de HEAD `b5878593a` en còpia: 28.335 proves Vitest passades, 0 fallades reals. Onada 1 en marxa: 18 carrils Gauntlet (B0 sencer, B1, botó Arrere, verificador de migracions, guarda i18n, vectors Shamir, benzina, facetes i notícies germanes); els kits de Codex i Gemini s'auditen com a dada dins de cada carril.
- **2026-11-01 23:57 CET · relleu 3:** el Mestre se'n va a dormir i delega fins a l'alba: en acabar B0–B7, continuar amb B8 (avisos reals del Xat), B9 (botigues en producció directa) i B10 (escombrada de P1 i P2). Correcció al tauler de MarIA de les 23:51: l'Onada 1 no té «18/18 completats». Els 18 constructors han acabat; L01 ja ha passat el corrector, i els altres 17 estan a l'àrbitre o al corrector. Sis agents d'especificació contrasten B8–B10 amb l'arbre real: servidor i client dels avisos, botigues, `/multimedia` i `/notes`, govern (P1-29, P1-30, P2-15) i escombrada. Fronteres que no canvien encara que la delegació siga plena: cap `npm install` (el connector natiu `PushNotifications` no hi és), cap operació remota (ni desplegar la funció `notifica-xat`, ni aplicar migracions, ni pujar a les botigues), cap secret al repositori i cap `git push`. Tot es deixa preparat i provat en local, amb la comanda exacta per al Mestre.
- **2026-11-02 00:40 CET · relleu 4:** Onada 1 acabada: 18 de 18 carrils «fets», 54 agents, 75 troballes dels àrbitres reproduïdes; 71 corregides, 6 rebutjades amb evidència i les obertes documentades als registres. Transacció de governança aplicada (Reflex `bf4dcc4c`, 18 fitxers, amb el pegat de L08 sobre la Frontmatter i el de L11 sobre el Consell fusionats), 11 proves atòmiques al seu lloc i 5 peticions entre carrils aplicades (frontera del Lector, fusió de la cerca, comentari del precommit, llista de proves de la targeta i prova de frontmatter de sessió). Còpia congelada en assaig (Vitest sencer, node, precommit, lint, design_guard i cens) abans del commit local. Onada 2 en marxa (24 carrils de B2 a B7).
- **2026-11-02 00:57 CET · relleu 5 · commit local `921c332ac`** (Onada 1, 101 fitxers, des de la còpia congelada amb `commit-tree` i CAS, sense hooks ni push). Assaig de la còpia: Vitest 28.701 passades; la roja real (la prova de la compartició nativa comptava les crides del connector nou de l'Arrere) està corregida i inclosa al commit. Les altres roges de la còpia (iOS `.gitignore`, ganxos de Codex, node germà de Xixona, diagnòstics de classes, Doctrina per `.env`, Reflex) són de còpia sense `.git` ni fitxers d'entorn, i les mateixes proves passen a l'arbre viu. `test:node` 1.905 passades. Lint i `design_guard` 0/0. Queden dues roges reals per a més avant: Llaurador (`ON_ESTIC.md:34` cita un informe arxivat; es regenera al tancament) i Pedra Seca LLEI_08 (`facetesCerca.js` encara no l'importa ningú; el cablegen els carrils M15 i M16).
- **2026-11-02 01:14 CET · relleu 6:** sis especificacions de B8–B10 entregades, cadascuna amb el seu àrbitre i la seua revisió (`specs/B8-SERVIDOR.md`, `B8-CLIENT.md`, `B9-BOTIGUES.md`, `B10-MULTIMEDIA-NOTES.md`, `B10-GOVERN.md`, `B10-ESCOMBRADA.md`). Decisions conservadores que s'apliquen sense preguntar: push sense cos (despertador cec) i deep-link sense que el servei de push conega el fil, natius preparats i inactius (el connector `PushNotifications` no s'instal·la), expulsió d'aparells només per APNs 410 i FCM 404, `--canal produccio` sempre en esborrany a Google Play, cap pujada real, i la rotació d'ESTAT preparada però no executada. Els kits `b8` i `b9` de Codex encara no hi eren a les 00:55. Per a guanyar temps, l'Onada 3a (11 carrils de B8, B9 i B10 que no toquen cap fitxer de l'Onada 2) ja corre en paral·lel amb l'Onada 2. L'Onada 3b (8 carrils sobre el port, el Xat, els diccionaris i `/legal`) espera el commit de B0–B7.
- **2026-11-02 03:33 CET · relleu 7:** Onada 3a acabada: 11 de 11 carrils «fets» (33 agents). Funció `notifica-xat` web i nativa (190 i 204 proves), registre i baixa dels avisos en eixir, adaptador natiu, `--canal produccio` amb preflight dels avisos, cens i unicitat d'imatges, porta de fronteres de les skills, eina de capítols d'ESTAT (la rotació no s'executa), detector de consum acreditat i purga d'«Enxufe» al connector. La seua governança està preparada i no aplicada: 15 fitxers i 8 proves que només funcionen amb ella aplicada. Hi entra el pegat C921-01 de Codex: és la troballa P2 sobre el meu commit, en què el filtre de «només lectura» del verificador de migracions acceptava funcions que escriuen al WAL. L'he auditat com a dada i provat en còpia: 25 de 25 proves, i el verificador i el pla de migracions donen la mateixa eixida sobre l'arbre real. La C-B10-01 de Codex ja era dins del dipòsit final de N09. L'Onada 2 té quatre carrils al corrector i M16 encara espera el carril M15. Mentrestant, un Gauntlet transversal de només lectura (6 cercadors i 2 refutadors per troballa) revisa el commit `921c332ac` i l'Onada 3a.
- **2026-11-02 04:15 CET · relleu 8:** Onada 2 acabada: 24 de 24 carrils (72 agents; 21 «fets» i 3 «parcials» amb les obertes documentades). Una troballa P1 de l'àrbitre corregida al motor E2EE (acceptar un canvi fort després d'un de suau perdia la història). Integració de l'orquestrador: 6 pegats i 12 peticions entre carrils, i el catàleg posat al dia amb la versió del dia. Transacció de governança aplicada (Reflex `a2b14eb0`): tractor Pedra Seca amb les excepcions de M10 i M03 i frontissa `fediversity` tornada a aprovar per la capacitat nova de B4, de manera que la frontissa queda 16/16 i `facetesCerca.js` ja no és orfe. La còpia congelada 2 està en assaig per al commit de B0–B7 (158 fitxers; la còpia porta també els fitxers de l'Onada 3a, però no entren al commit). L'Onada 3b (8 carrils) ja corre.
- **2026-11-02 04:15 CET · relleu 9 · Gauntlet transversal 1** (26 agents) sobre `921c332ac` i l'Onada 3a: 8 troballes confirmades per 2 refutadors de 2, una de dubtosa i una de refutada.
  - **P2:** a `notifica-xat`, una sola subscripció rebutjada (401/403 o BadDeviceToken) pausava el proveïdor i, per tant, els avisos de tothom en aquella passada. Qualsevol persona amb sessió podia provocar-ho.
  - **P3:**
    - a la porta Olivera, l'arxivat pot deixar roja la Frontmatter (un document que es queda sense nota viva) o la Doctrina (camins en codi inline a ESTAT);
    - el Team ID d'Apple encara eixia per pantalla a `xcodebuild`;
    - hi ha dues regex quadràtiques: `consum-acreditat` i la primera del pegat C921-01;
    - la memòria cau de credencials natives no va lligada a la clau;
    - `destiDelAvis.js` és orfe fins que l'Onada 3b el cablege.
  - Un Gauntlet de correcció de tres carrils (Olivera, `notifica-xat` i dipòsits d'I3) ja hi treballa.
- **2026-11-02 04:30 CET · relleu 10 · commit local `333af8c2c`: B0–B7 segellats** (Onada 2, 160 fitxers, des de la còpia congelada 2, sense hooks ni push).
  - **Assaig de la còpia:** Vitest 30.013 passades.
  - **Roges reals, corregides abans del commit:**
    - `pageContent.fediversity` llig el document del Model B, i s'ha aplicat el dipòsit de M11 a 35 capacitats i 115 mètodes;
    - dues proves noves feien roges les portes InnerHTML i Tokens.
  - **Roges de còpia:** les mateixes de l'Onada 1 (sense `.git` ni fitxers d'entorn).
  - **Roges reals que queden:** Pedra Seca per `destiDelAvis.js` (de l'Onada 3a, fora d'este commit; el cablejarà la 3b) i Llaurador per `ON_ESTIC.md:34` (al tancament).
  - Gauntlet transversal 2 en marxa sobre `333af8c2c`.
- **2026-11-02 05:12 CET · relleu 11:**
  - **Correccions del Gauntlet 1 tancades (F1–F3, 9 agents):**
    - `notifica-xat` ja no pausa el proveïdor per un rebuig d'un sol aparell. Els rebutjats es compten per aparell i el 429 `TooManyRequests` d'Apple només salta aquell aparell.
    - La memòria cau de credencials natives va lligada a la clau.
    - L'arxivat de la porta Olivera s'atura abans de deixar roges la Frontmatter o la Doctrina.
    - El Team ID ja no ix a cap pas de `puja-ios`.
    - Tres regex quadràtiques (més una quarta a la porta Olivera) passen a recorreguts lineals.
  - **Gauntlet transversal 2 (22 agents) sobre `333af8c2c`:** 6 troballes confirmades, totes a l'E2EE i darrere de la bandera apagada.
    - **P1:** després d'acceptar un canvi fort, la clau substituïda encara signava èpoques noves. En un grup, un servidor maliciós amb la clau vella hi podia colar un membre.
    - **P2:** el recompte de persones de confiança revelava al servidor quins contactes has verificat.
    - **P2/P3:** quatre defectes d'integració entre motor i interfície.
    - L'abast B (literals, cerca i Pedra Seca) no té cap troballa confirmada.
  - **En marxa:**
    - la correcció del motor E2EE (E1) i, després, la del recompte (E2), totes dues en Gauntlet;
    - la integració documental (D1);
    - l'Onada 3b.
- **2026-11-02 06:15 CET · relleu 12:**
  - **Integració documental D1 feta en Gauntlet:**
    - Llibre Mestre: 42 edicions, amb un bloc de relleu de la marató a §0.3.
    - Guia de publicació: 17 edicions.
    - Informe de Gemini: una nota.
    - L'àrbitre ha trobat 3 defectes reals, ja corregits: el tall de la guia, la P1-28 marcada FET sense dipòsit i una definició d'una altra mà reescrita.
    - Les portes documentals queden igual que abans.
  - **Governança de l'Onada 3a aplicada (Reflex `5aeb79f4`, 17 fitxers),** amb les correccions F1 i F3 i el pegat C921-01. Les seues 9 proves passen: 163 de node i 90 de Vitest.
  - **Roges del cens en viu:**
    - **Previstes:** Contracte documental (este informe), Reflex (arbre brut) i Llaurador (`ON_ESTIC.md:34`).
    - **Les tanca l'Onada 3b en curs:** Pedra Seca (`destiDelAvis.js`) i Vocabulari (una classe nova de `PaginaNotificacions.jsx`).
    - **No és meua:** Cens C4, perquè l'informe de Codex diu «3 IAs» a la línia 899 i el cens en té 12.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Resultat per bloc

| Bloc | Estat | Commit local | Notes |
| --- | --- | --- | --- |
| B0 · PC155-01..03 i T11-01..05 | Fet | `921c332ac` | Les tres sondes de Codex són ara proves negatives. La política 2.3 explica la ubicació EXIF i la migració `2611012257` NO està aplicada. |
| B1 · Olivera, hook i portes | Fet amb residus | `921c332ac` + `e1b7210b0` | L'arxivat reescriu els enllaços i els hashes dels torns. Hook per paquet i temps per pas. Doctrina, Frontmatter, Consell i rutes. El `run-portes` del cens encara no ix amb 0 natiu: vegeu Límits. |
| B2 · E2EE (P1-12, IDEA-48) | Fet darrere de la bandera | `333af8c2c` + `e1b7210b0` | Canvis de clau, alerta, F2a sense pantalla, vectors Shamir i higiene del paquet. `E2EE_ACTIU_PER_DEFECTE = false`. F7 sencer no es construïx, perquè és porta del disseny. |
| B3 · Arrere, literals i migracions | Fet al codi | `921c332ac` + `333af8c2c` | Connector natiu propi sense dependències. Sis mòduls a cinc llengües. Verificador estàtic i ordre de desplegament. La prova a l'aparell queda per al Mestre. |
| B4 · vCard i transferència (IDEA-24/25) | Fet al codi, RPC no aplicada | `333af8c2c` | La capacitat `transferenciaPropietat` és al port, als adaptadors i al kit. Frontissa `fediversity` tornada a aprovar. |
| B5 · Federació (P1-23, P2-07..09) | Fet al codi, migració no aplicada | `333af8c2c` | Inbox persistent i cua signada amb reintents. Migració `2611020106`. |
| B6 · El Comú (P1-01, IDEA-46, IDEA-30) | Fase 1 feta | `921c332ac` + `333af8c2c` | Benzina, facetes, EspaiCerca i notícies germanes. |
| B7 · Pedra Seca (P1-28, IDEA-42) | Fet amb residus per decidir | `333af8c2c` | PS-01..PS-11 i trinquet a 0. Cartell A4 i targeta 16:9 en fase 1. |
| B8 · Avisos del Xat | Fet al codi, tot apagat | `e1b7210b0` | Funció `notifica-xat` (web i natius), migració `2611020417` NO aplicada, port `avisosPush` i `silenciXat`, PWA, silenci, ajustos i baixa en eixir. |
| B9 · Botigues en producció | Preparat, cap pujada | `e1b7210b0` | `--canal produccio` sempre en esborrany, preflight dels avisos i `/page/descarregues` amb botons directes. |
| B10 · Escombrada P1/P2 | Fet al codi o veraç al Llibre | `e1b7210b0` | P1-09 (Enxufe), P1-24 (IAIA a /legal), P1-29 (cens), P1-30 (fronteres), P2-12 (consum), P2-15 (capítols sense rotació), P1-71 (paritat de /multimedia) i files del Llibre posades al dia. |

### Troballes que només ha vist el Gauntlet transversal

- **G1, sobre `921c332ac` i l'Onada 3a:** 8 confirmades, totes corregides als carrils F1–F3.
  - **P2:** a `notifica-xat`, un sol aparell rebutjat pausava els avisos de tothom en aquella passada.
  - **P3:**
    - l'arxivat Olivera podia deixar roges la Frontmatter i la Doctrina;
    - el Team ID eixia per pantalla;
    - hi havia quatre regex quadràtiques;
    - la credencial nativa no anava lligada a la clau.
- **G2, sobre `333af8c2c`:** 6 confirmades, totes a l'E2EE i darrere de la bandera.
  - **P1:** la clau substituïda per un canvi fort acceptat podia signar èpoques noves (en un grup, un membre colat pel servidor).
  - **P2:** el recompte de persones de confiança delatava al servidor els contactes verificats.
  - **Defectes d'integració:** quatre, entre el motor i la interfície.
  - Les correccions són E1–E3.
- **Codex:**
  - C921-01 (P2): el filtre de lectura de les migracions admetia funcions que escriuen. S'ha integrat després d'auditar-lo i provar-lo.
  - C-B10-01: ja era dins del dipòsit de N09.
  - C921-02: `facetesCerca.js` era orfe; el va tancar M16.

### Afirmacions de l'Escriptori que no s'aguanten

- El pla 2059 citava camins i IDs que no existixen: vegeu el relleu 2.
- El tauler de MarIA de les 23:51 donava l'Onada 1 com a «18/18 completats» quan només n'havien acabat els constructors.
- Gemini parlava de «RFC 9421», però la biblioteca és draft-cavage-12.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Cada commit s'ha fet des d'una còpia congelada i assajada sencera, amb `commit-tree` i CAS i sense hooks. Després de cada commit, l'arbre viu continua amb la feina d'altres mans.

| Assaig | Onada 1 (`921c332ac`) | Onada 2 (`333af8c2c`) | Onada 3 (`e1b7210b0`) |
| --- | --- | --- | --- |
| Vitest sencer | 28.701 passades | 30.013 passades | 30.610 passades |
| Node (`test:node`) | 1.905 passades | 1.906 passades | 2.015 passades |
| `test:precommit` | verd excepte la prova de còpia | verd excepte la prova de còpia | 7.208 passades, verd excepte la prova de còpia |
| ESLint (`npm run lint`) | 0 | 0 | 0 |
| `design_guard` | 0/0 | 0/0 | 0/0 |
| Frontissa | 16/16 (legal) | 16/16 (fediversity) | 16/16 (legal i fediversity) |

- **Roges de còpia, que passen a l'arbre viu:**
  - El `.gitignore` d'iOS i els deu casos de node: ganxos de Codex, node germà de Xixona, diagnòstics de classes i `.env.example`. Totes depenen de `.git` o de fitxers d'entorn que la còpia no porta.
  - La Doctrina, perquè la skill vigilant cita `.env`.
  - El Reflex, perquè la còpia no té `.git`.
- **Roges reals, una per una:** la prova de la compartició nativa (Onada 1), el document del Model B i dues proves que tornaven roges les portes InnerHTML i Tokens (Onada 2). Totes estan corregides abans del seu commit.
- **Gauntlet:** cada carril ha passat per constructor, àrbitre adversarial (sondes i almenys tres mutacions) i corrector.
  - Onada 1: 18 carrils i 54 agents.
  - Onada 2: 24 carrils i 72 agents.
  - Onada 3: 19 carrils i 57 agents.
  - Especificacions: 18 i 18 agents.
  - Gauntlets transversals: 26 i 22 agents.
  - Correccions: F1–F3 i E1–E3.
  - Integració documental: D1 i D2.
- **Governança:** cinc transaccions Reflex amb executor i CAS (`bf4dcc4c`, `a2b14eb0`, `5aeb79f4`, `9a7dd881` i la de tancament). Cap fitxer protegit s'ha escrit fora de l'executor.
- **Kits de Codex i Gemini:** s'han auditat com a dada a cada carril i no s'han aplicat en cru. Del pegat C921-01 de Codex, s'ha integrat la versió provada en còpia, amb el lookbehind que va trobar G1.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

### Fronteres que no s'han creuat (encara que la delegació siga plena)

- **Cap `git push`, cap operació remota ni cap secret al repositori.** Ni migracions aplicades, ni desplegament de funcions, ni pujada a les botigues, ni SVN.
- **Cap `npm install` ni dependència nova.** Per això el connector natiu `PushNotifications` (APNs/FCM al client) queda en «sense connector».
- **Migracions NO aplicades:** `2611012257` (política 2.3, regenerada per P1-24), `2611020106` (federació), `2611020417` (avisos del Xat) i les anteriors pendents. L'ordre és el de `supabase/ordre_desplegament.json`.
- **Sense prova en aparell ni en Deno:** el botó Arrere d'Android (l'AVD no té imatge), APNs/FCM reals, l'Edge Runtime de `notifica-xat` i un IPA de distribució real.
- **F7 sencer** (cerimònia de recuperació social) no s'ha construït, per la porta del disseny. Les skills no s'han tornat a segellar: els pegats són a `skills-per-segellar/`.

### Residus oberts

- **`run-portes` encara no ix amb 0 natiu:**
  - Contracte documental: es tanca amb este informe.
  - Cens C4: l'informe de Codex diu «3 IAs» i no és de Claude.
  - Reflex: arbre brut i lock del corpus.
  - Llaurador: `ON_ESTIC.md:34`, que es regenera al tancament.
- **E2EE (darrere de la bandera), decisions D-E1-2 i D-E1-4:**
  - ARB-2 i ARB-3, de nivell P2, només en grups o dins de la finestra del pendent.
  - El preu conservador de la regla del kid monòton: un grup no ancorat abans d'acceptar queda tancat en eixe aparell.
  - ARB-02 d'E2: un contacte verificat que canvia de clau deixa A bloquejat, i el servidor ho pot inferir.
- **B7, per decidir (P1-28):**
  - D-2 de PS-04 (residu per davall de 288 px);
  - el blau de `/pobles/:id`;
  - la fase 2 del cartell (D-4).
- **B8, durable:** l'empremta de la credencial nativa per proveïdor necessita SQL (A-03 de F2). Mentrestant, la mitigació és el procediment de rotació del README.
- **B9:** Google Play demana la prova tancada de 12 provadors durant 14 dies, o un compte d'organització (D-B9-2), abans de publicar a producció.
- **Llibre Mestre:** les files P2-01, P2-02, P2-03, P2-05 i P2-06 queden fora de nit, amb el motiu (backlogs grans).

### Passos del Mestre, en ordre

Les comandes exactes són al bloc `SDP:RELLEU_MARATO_261101_2143_CLAUDE` del Llibre Mestre (§0.3), a `supabase/README.md` (taula d'ordre i secció «Funció `notifica-xat`») i a la guia de publicació (§14).

1. Aplicar les migracions pendents, en l'ordre de `supabase/ordre_desplegament.json`, amb les consultes «Abans».
2. Tornar a construir i desplegar el web des d'un commit net (política 2.3, Onades 1–3).
3. Tornar a segellar les skills de `skills-per-segellar/`: `wiki-cicle-de-vida`, `core-higiene-escriptori`, `sdp-universal-page`, `core-consell-i-colmena` i `core-telemetria-huma`, amb `fronteres-skills.deute-buidat.diff`.
4. Avisos del Xat: el parell VAPID a la teua màquina, els secrets, desplegar `notifica-xat` apagada i, al final, la bandera del client. Els natius van després de D-WP-7.
5. Botigues: D-B9-2 a Play; el build 2 amb `--canal produccio` en sec i després en esborrany.
6. Provar l'Arrere en un aparell (P0-24b, 7 passos) i decidir D-1 de L08 (les esmenes manuals de MarIA als torns).

### Proposta d'automillora

- **Onades paral·leles per ownership:** l'Onada 3a va córrer alhora que la 2 sense compartir cap fitxer, i van eixir 11 carrils més abans de l'alba. El commit de cada onada es construïx per llista de propietat i no per prefix de camí.
- **Gauntlet transversal després de cada commit:** és barat (uns 25 agents) i ha trobat el que tres filtres aïllats no veien (un P1 E2EE i un P2 de disponibilitat). Hauria de ser un pas fix de la Transició d'onada.
- **Còpies d'assaig amb `.git` propi:** una còpia sense `.git` dona sempre les mateixes roges de còpia. Un `git init` temporal a la còpia (com fa Codex) estalviaria el triatge.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
