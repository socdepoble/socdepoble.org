---
type: skill
status: canonic
description: Workflow principal de treball i Spec-Driven Development
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
  - AGENTS.md
contracte.escriu:
  - _wiki_de_poble/04_escriptori
---
# ⚙️ Workflow de Sóc de Poble (Alta Definició)

Aquest és el workflow mestre per a l'execució de tasques. Regeix la manera en què la IA pensa, planifica i executa canvis al sistema per assegurar que mai es treballa a cegues (Spec-Driven Development).

## 0. Llei del Caçador i l'Estudi Previ
Abans de proposar una solució a un problema tècnic complex que no està explícitament cobert als nostres manuals:
- **Teniu l'obligació de consultar la `wiki-busca-skills`**: Has d'investigar com ho resol l'avantguarda de la IA o GitHub (p. ex: usant repositoris MCP, *Vertical Slices*, sistemes de disseny globals) i si hi ha referències a `_wiki_de_poble/90_arxiu_historic/260918_Sessio_Tancada/02_investigacio_ia/00_TARGET_SKILLS.md`. No reinventes la roda. Adapta les solucions globals al nostre *Trellat*.

## 1. Spec-Driven Development (Prototipatge Lògic)
- **MAI Piquem Codi a Cegues:** Tens terminantment prohibit escriure codi de noves funcionalitats o redissenys sense haver generat prèviament un esborrany o PRD (Product Requirements Document) a la carpeta d'artefactes (com els documents de *Planificació* o `_wiki_de_poble/04_escriptori/00_index_escriptori.md` d'Antigravity).
- L’usuari ha d’aprovar aquest esborrany abans d’executar un redisseny. Una aprovació explícita ja donada a la sessió continua vigent i no es torna a demanar. Vincula el pla amb `document.mjs plan --turn-id ID --file CAMI`; el registre acredita el fitxer, no substitueix l’aprovació humana.

## 2. Desenvolupament Modular (Vertical Slices)
Quan l'usuari aprova el pla i comences a codificar:
- L'arquitectura s'ha de mantenir aïllada i modular per funcions (*Slices*), en lloc de per "capes" genèriques abstractes. Si crees un mòdul "Consola", tota la lògica ha d'estar encapsulada.
- Has d'aplicar estrictament els principis de disseny matemàtics descrits a `.agents/skills/sdp-workflow/SKILL.md`. L'arquitectura base no es pot trontollar.

## 3. Verificació Contínua de Portes
- Abans de finalitzar la feina, és imperatiu executar els tests (com `npm run porta` si hi ha scripts configurats) o revisar l'estat del TypeScript/ESLint.

## 4. Segellat i Tancament de Sessió
- En cas d'haver afegit regles al cervell (la Wiki o `.agents`), s'ha d'executar qualsevol segellat pertinent i actualitzar els índexs com `00_INDEX_SKILLS`.
- Finalment, es redacten els commits escaients usant Semantic Versioning.

Aquesta pauta ens assegura que construïm "sobre ciments immobibles", per a poder escalar qualsevol quantitat de projectes sense col·lapse.

## Lliçons del Mestre

- **261004 · Context complet.** Abans de decidir l'abast d'una ordre, rellig el prompt sencer del disc i copia les seues línies a l'encàrrec dels agents.
- **260923 · La Llei del Píxel.** El criteri d'èxit de tota tasca de neteja, purga, linter o deute tècnic és **visualment idèntic**: acabada la faena, la pantalla s'ha de veure exactament igual que abans. Un canvi que altera un píxel és un redisseny, i un redisseny necessita ordre del Mestre i pla aprovat (§1). Si la tasca no es pot completar mantenint l'aparença, això és una troballa que es documenta i es consulta, i eixa consulta ja és l'entrega completa del torn.
- **260923 · Prohibició sense substitut = Fusible.** Quan una regla diu quina forma no es pot fer servir i no designa quina s'ha d'usar en el seu lloc, l'acció correcta és aturar-se i preguntar (AGENTS §10). El substitut es demana, no es dedueix: la forma que un agent considera «la natural» ve del corpus del món, no de la doctrina de Sóc de Poble, i el Mestre ha de poder triar-la.
- **260923 · L'abast es definix per superfície, no per patró.** Abans d'una escombrada (buscar i corregir totes les ocurrències d'un patró), declara sobre quins fitxers i quines superfícies s'aplica. Tot allò que casa amb el patró fora d'eixa llista es documenta com a pendent i es deixa intacte fins a tindre ordre.
- **261007 · L'ordre explícita s'aplica sencera.** Quan el Mestre fixa el comportament d'un element («l'enllaç del copyright a totes les targetes»), s'aplica literal a tots els casos. Un risc s'exposa com a pregunta abans de picar codi. Abans de crear una pàgina o un component, es busca la maquinària que ja existix i s'hi integra (per a les pàgines, vegeu sdp-universal-page, lliçó 261007).
- **261028 · Chrome headless aïllat.** Tota prova amb Chrome o Chromium headless arrenca amb un directori absolut creat amb `mkdtemp` dins de la carpeta temporal de la sessió, que és el `--user-data-dir`, el `--disk-cache-dir` i, quan cal un `HOME` temporal, també el `HOME`, sempre ja expandit; i porta sempre `--use-mock-keychain --password-store=basic`, perquè macOS no obri cap diàleg de clauer. Els encàrrecs als subagents copien esta regla, i abans de tancar l'arrel del repositori no té cap directori nou de proves.

## Vincles
- [[00_INDEX_SKILLS]]
