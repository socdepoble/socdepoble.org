---
type: skill
status: canonic
description: Workflow principal de treball, Spec-Driven Development i Mètode MIT d'Estudi en Xarxa Semàntica
tags:
  - govern
name: sdp-workflow
triggers_on:
  - workflow
  - procediment
  - planificacio
  - arquitectura
core: true
contracte.llig:
  - .agents/skills/wiki-busca-skills/SKILL.md
  - .agents/skills/sdp-universal-page/SKILL.md
  - .agents/skills/sdp-pedra-seca/SKILL.md
  - AGENTS.md
  - src/utils/publicacioUniversal.js
  - tooling/gates/kit-carril.mjs
  - tooling/gates/certifica-enllacos.mjs
  - tooling/brain/fronteres-skills.mjs
contracte.escriu:
  - _wiki_de_poble/04_escriptori
---
# ⚙️ Workflow de Sóc de Poble (Alta Definició)

Aquest és el workflow mestre per a l'execució de tasques. Regeix la manera en què la IA pensa, estudia, planifica i executa canvis al sistema per assegurar que mai es treballa a cegues (Spec-Driven Development + Mètode MIT).

## 0. Llei del Caçador, l'Estudi Previ i la Quàdruple Tècnica (`MIT + EGM + REA + Craft`)
Abans de proposar una solució a un problema tècnic complex que no està explícitament cobert als nostres manuals:
- **Teniu l'obligació de consultar la `wiki-busca-skills`**: Has d'investigar com ho resol l'avantguarda de la IA o GitHub (p. ex: usant repositoris MCP, *Vertical Slices*, sistemes de disseny globals) a partir del catàleg viu `.agents/skills/00_INDEX_SKILLS.md`. L’arxiu històric queda fora de la descoberta automàtica (AGENTS §5). No reinventes la roda. Adapta les solucions globals al nostre *Trellat*.
- **Aplicació obligatòria del Mètode MIT d'Acumulació de Context i Memòria Semàntica en Xarxa (`P0-61 / IDEA-192`) per a totes les IAs:** En cada cas d'ús, totes les IAs (Claude, Codex, Gemini, MarIA i el Node 0) han de dedicar tokens d'estudi per recórrer les 5 fases del Mètode MIT abans i durant la tasca:
  1. **Fase 0 (Acumulació multidireccional de context):** Reunir i creuar la doctrina, el codi dels components connectats, les proves i les captures reals en lloc de mirar un sol fitxer aïllat.
  2. **Fase 1 (Els 5 nuclis centrals i la Xarxa Semàntica):** Identificar els 5 conceptes nuclears del cas d'ús, com es connecten entre si (`nodreix`, `depén_de`, `es_diferencia_de`), quin error superficial típic eviten i quin impacte tenen per al veí.
  3. **Fase 2 (Filtre Feynman sense llibre obert):** Explicar l'arquitectura de forma atòmica i senzilla, separant el tronc essencial de l'accessori i convertint qualsevol excepció de codi en una funcionalitat universal del sistema.
  4. **Fase 3 (Test socràtic de lògica subjacent):** Formular-se preguntes de casos límit per verificar si la solució és estructural o només un pedaç superficial.
  5. **Fase 4 (Correcció dura però útil i consolidació d'1 pàgina):** Auditar el propi resultat indicant quina part és vàlida, on s'ha quedat en la superfície, quina connexió de la xarxa falta i sintetitzar el repàs executiu.

## 1. Spec-Driven Development (Prototipatge Lògic)
- **MAI Piquem Codi a Cegues:** Tens terminantment prohibit escriure codi de noves funcionalitats o redissenys sense haver generat prèviament un esborrany o PRD (Product Requirements Document) a l'Escriptori físic `_wiki_de_poble/04_escriptori/`, pel circuit documental vigent; l'índex només l'ancora i no substituïx el pla.
- L’usuari ha d’aprovar aquest esborrany abans d’executar un redisseny. Una aprovació explícita ja donada a la sessió continua vigent i no es torna a demanar. Vincula el pla amb `document.mjs plan --turn-id ID --file CAMI`; el registre acredita el fitxer, no substitueix l’aprovació humana.

## 2. Desenvolupament Modular (Vertical Slices)
Quan l'usuari aprova el pla i comences a codificar:
- L'arquitectura s'ha de mantenir aïllada i modular per funcions (*Slices*), en lloc de per "capes" genèriques abstractes. Si crees un mòdul "Consola", tota la lògica ha d'estar encapsulada.
- Has d'aplicar estrictament els principis de disseny matemàtics descrits a `.agents/skills/sdp-pedra-seca/SKILL.md`. L'arquitectura base no es pot trontollar.

## 3. Verificació Contínua de Portes
- Abans de finalitzar la feina, és imperatiu executar els tests (com `npm run porta` si hi ha scripts configurats) o revisar l'estat del TypeScript/ESLint.

## 4. Segellat i Tancament de Sessió
- En cas d'haver afegit regles al cervell (la Wiki o `.agents`), s'ha d'executar qualsevol segellat pertinent i actualitzar els índexs com `00_INDEX_SKILLS`.
- El lliurament respecta el carril autoritzat. Si és un kit, genera preimatges i hashes amb `node tooling/gates/kit-carril.mjs`, prova'l en una altra còpia i deixa la integració a qui tinga la propietat d'escriptura. Un commit, una publicació o un canvi de versió s'executen només quan formen part de l'encàrrec; no són efectes automàtics de la skill.

Aquesta pauta ens assegura que construïm "sobre ciments immobibles", per a poder escalar qualsevol quantitat de projectes sense col·lapse.

## Lliçons del Mestre

- **261004 · Context complet.** Abans de decidir l'abast d'una ordre, rellig el prompt sencer del disc i copia les seues línies a l'encàrrec dels agents.
- **260923 · La Llei del Píxel.** El criteri d'èxit de tota tasca de neteja, purga, linter o deute tècnic és **visualment idèntic**: acabada la faena, la pantalla s'ha de veure exactament igual que abans. Un canvi que altera un píxel és un redisseny, i un redisseny necessita ordre del Mestre i pla aprovat (§1). Si la tasca no es pot completar mantenint l'aparença, això és una troballa que es documenta i es consulta, i eixa consulta ja és l'entrega completa del torn.
- **260923 · Prohibició sense substitut = Fusible.** Quan una regla diu quina forma no es pot fer servir i no designa quina s'ha d'usar en el seu lloc, l'acció correcta és aturar-se i preguntar (AGENTS §10). El substitut es demana, no es dedueix: la forma que un agent considera «la natural» ve del corpus del món, no de la doctrina de Sóc de Poble, i el Mestre ha de poder triar-la.
- **260923 · L'abast es definix per superfície, no per patró.** Abans d'una escombrada (buscar i corregir totes les ocurrències d'un patró), declara sobre quins fitxers i quines superfícies s'aplica. Tot allò que casa amb el patró fora d'eixa llista es documenta com a pendent i es deixa intacte fins a tindre ordre.
- **261007 · L'ordre explícita s'aplica sencera.** Quan el Mestre fixa el comportament d'un element («l'enllaç del copyright a totes les targetes»), s'aplica literal a tots els casos. Un risc s'exposa com a pregunta abans de picar codi. Abans de crear una pàgina o un component, es busca la maquinària que ja existix i s'hi integra (per a les pàgines, vegeu sdp-universal-page, lliçó 261007).
- **261028 · Chrome headless aïllat.** Tota prova amb Chrome o Chromium headless arrenca amb un directori absolut creat amb `mkdtemp` dins de la carpeta temporal de la sessió, que és el `--user-data-dir`, el `--disk-cache-dir` i, quan cal un `HOME` temporal, també el `HOME`, sempre ja expandit; i porta sempre `--use-mock-keychain --password-store=basic`, perquè macOS no obri cap diàleg de clauer. Els encàrrecs als subagents copien esta regla, i abans de tancar l'arrel del repositori no té cap directori nou de proves.

## Reutilitzar un patró i acreditar-lo

Per a una pàgina de lectura amb targetes internes, contrasta `TextSection.jsx` i `TextSection.targetes.test.jsx`, segons [[sdp-universal-page/SKILL|sdp-universal-page]]. Per a Notes, reutilitza la closca d'[[sdp-universal-editor/SKILL|sdp-universal-editor]] i el contracte de cinc àmbits de `src/utils/publicacioUniversal.js`; no dupliques publicacions ni adaptadors.

Un cas exemplar passa a «verificat» quan té font, prova executada i límit observat. L'ordre Hero → Avatar/Logotip → «On es publica?» → classificació és l'encàrrec d'Onada 4; el desplegable antic no prova eixa integració. Les suites d’edició avançada i dels calaixos del carril integrador s’han repetit en una instantània complementària (140 proves verdes); conserva el tall i el límit de cada resultat. Aplica [[core-tecniques-investigacio/SKILL|core-tecniques-investigacio]] per a no confondre contracte amb resultat.

Abans de donar per bo un enllaç, executa `node tooling/gates/certifica-enllacos.mjs --url /page/legal --remot --json` amb la ruta que estàs documentant. L'arbre/router i HTTP són comprovacions diferents; ni el 200 de la closca SPA ni un segell local acrediten contingut privat, permisos o una acció completada.

`node tooling/brain/fronteres-skills.mjs` comprova F1–F5 (contractes, ordres, escriptura recursiva i tokens), no la comprensió ni tota la semàntica de la skill. Per a cada regla, declara la porta o prova que l'acompanya i, si requerix revisió humana, el criteri observable que s'ha revisat. No presentes un cens de fitxers com cobertura funcional completa.

## Patró de calaix abans de crear una finestra nova

Per a una eina de capçalera, contrasta primer l’Índex de `PageFrame` i `CalaixIdentitats`: [[sdp-universal-page/SKILL|sdp-universal-page]] documenta els tokens compartits sota la barra negra de la SPA i l’excepció de la capa modal encastada. Reutilitza el mecanisme i executa les proves dels dos consumidors; comprova també l’encastat i el mòbil. Una suite de DOM o de text CSS no substituïx la inspecció de la geometria del navegador.

## Vincles
- [[00_INDEX_SKILLS]]

