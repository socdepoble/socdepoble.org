---
type: skill
status: actiu
name: core-tecniques-investigacio
description: Tractor que defineix com les IAs investiguen els problemes amb la Quàdruple Tècnica (Mètode MIT, Google EGM, REA i craft-anything), verificant el codi real dels tractors i no només la teoria de les regles.
tags:
  - core
  - auditoria
  - tractors
triggers_on:
  - autòpsia
  - tècniques d'investigació
  - investigar el codi
  - cacera de bugs
contracte.llig:
  - src/sections/detail/PageDetailSection.test.jsx
  - src/utils/publicacioUniversal.test.js
  - AGENTS.md
  - _wiki_de_poble/00_index.md
contracte.escriu:
  - _wiki_de_poble/04_escriptori
---

# Tècniques d'Investigació, Autòpsia i Quàdruple Tècnica (`MIT + EGM + REA + Craft`)

Aquesta habilitat defineix l'estàndard d'auditoria, estudi profund i cacera de bugs per a totes les IAs del Mas (Claude, Codex, Gemini, MarIA i el Node 0).

## La Quàdruple Tècnica d'Estudi i Investigació Obligatòria (`P0-61 / IDEA-192`)

Totes les IAs de Sóc de Poble estan obligades a pensar amb aquestes **4 tècniques complementàries** en cada cas d'ús, dedicant els tokens d'estudi necessaris abans i durant l'execució:

1. **Mètode MIT d'Acumulació de Context i Memòria Semàntica en Xarxa (`P0-61`):**
   - **Fase 0 (Acumulació multidireccional):** No investigues mai un fitxer sol; reuneix la regla escrita, el codi real dels mòduls connectats, les suites de test i les captures reals per descobrir patrons i relacions invisibles.
   - **Fase 1 (Els 5 nuclis i el graf de connexions):** Identifica les 5 peces nuclears del sistema afectat, com es connecten (`nodreix`, `depén_de`, `es_diferencia_de`) i quin error típic de superfície s'hi produeix.
   - **Fase 2 (Filtre Feynman sense llibre obert):** Destil·la el model atòmic essencial sense argot fosc i desmunta assumpcions falses abans d'escriure codi.
   - **Fase 3 (Test socràtic de lògica subjacent):** Formula casos límit que posen a prova si la solució resol l'arrel per a tot el sistema o només tapa un símptoma local.
   - **Fase 4 (Correcció dura però útil i consolidació d'1 pàgina):** Audita indicant explícitament: *(a)* quina part és 100% vàlida, *(b)* on s'ha quedat en la superfície, *(c)* quina connexió de la xarxa falta i a quin fitxer tornar, i *(d)* síntesi neta d'1 pàgina.
2. **Google EGM (`Elefant + 8 Peixos Daurats`):** L'Elefant examina el sistema sencer i els 8 Peixos Daurats auditen cada peça sense memòria prèvia ni biaix de confirmació, preguntant-se el *perquè* de cada lògica.
3. **REA (`reverse-engineer-anything`):** Verificació empírica sobre artefactes, DOM, rutes i dades reals; zero suposicions sense evidència.
4. **Bucle Tancat `storytold/craft-anything` (`Study → Build → Check → Ready`):** Comprovació de paritat funcional i geomètrica a les tres amplàries canòniques (mòbil, tauleta i escriptori).

## La Llei del Codi i la Teoria
Quan hi ha un error o una discrepància (com ara un tractor que falla constantment o una neteja que no s'executa com toca), cal contrastar tant la regla escrita com el codi que la pretén executar. No pressuposes quina de les dues fonts conté el defecte. 

**Procediment d'Investigació Obligatori:**

1. **Llegir la Teoria:** Revisa l'`AGENTS.md`, la `taxonomia_documental.md` o la Skill corresponent per entendre el flux funcional previst. Entén què s'hauria de fer en teoria.
2. **Llegir la Pràctica (El Codi Real):** Això és innegociable. No et pots aturar al pas 1. Has d'obrir el tractor de codi (l'script `.mjs`, `.js`, el hook, etc.) encarregat d'executar i fer complir eixa teoria en el repositori.
3. **Validació d'Engranatges:** Analitza el codi buscant excepcions ocultes, restriccions d'extensions (ex: l'eina només accepta `.md`), bloquejos per defecte, regles RegExp esbiaixades o dependències asimètriques. Verifica que cada tractor fa efectivament el que la teoria diu i no introdueix exclusions indesitjades.
4. **Sentència i Solució:** Identifica el bloqueig exacte a nivell de codi, demostra-ho citant els números de línia, i proposa la solució tècnica estructural que calca la realitat a la teoria (o redissenya la teoria si aquesta és mecànicament inviable).

Aquesta tècnica és l'antídot contra l'estancament: evita que el sistema caiga en la frustració d'intentar complir una regla humana (teòrica) que està bloquejada per una regla de màquina (codi).

## Evidència, reproducció i fronteres de les proves

1. Fixa el tall: ruta, hash, entrada i resultat esperat. Reprodueix el defecte en còpia o fixture abans del corrector, i torna a provar exactament eixa entrada després. La revisió independent intenta refutar la hipòtesi amb evidència pròpia.
2. Separa comprovació mecànica de criteri editorial o humà. F1–F5 de `fronteres-skills.mjs` validen una part del contracte; no proven que una skill siga útil, que un text siga didàctic ni que l'usuari haja aprovat un canvi. Registra el criteri manual i el seu resultat sense fabricar un tractor.
3. Usa un cas contrastat com a patró, no com a excusa per copiar una ruta: Legal té una prova real de targetes internes (`TextSection.targetes.test.jsx`); `src/utils/publicacioUniversal.test.js` fixa els cinc àmbits i la coacció d'entrada; `UniversalEditorShell.edicioAvancada.test.jsx` prova la closca. La unificació d’Onada 4 s’ha contrastat també amb les suites de Notes, la closca i els calaixos del carril integrador: 140 proves verdes de DOM/comportament local, sense acreditar viewport real ni servei remot.
4. Comprova cada enllaç en dos plans amb `node tooling/gates/certifica-enllacos.mjs --url /page/legal --remot --json`: existència semàntica al router/arbre i resposta HTTP amb contingut admissible. Per auditar un fitxer, usa `--fitxer CAMI --arrel ARREL`. Declara separadament el resultat local i remot; el 200 d'una SPA no prova cap pantalla.
5. Un destí que el prompt nomena però no existeix no es convertix en exemple reeixit. En el tall d'entrada d'Onada 4, el slug de privadesa no resol, mentre Legal sí. El corrector d’àlies reutilitza `/legal` i té reproductor a `PageDetailSection.test.jsx`; torna a certificar la ruta després d’integrar-lo i no la presentes com una política nova.

El retorn del certificador és evidència del seu abast; no certifica render React, autorització Supabase, contingut visible després d'identificar-se ni efectes de cap botó. Les proves amb WebCrypto, IndexedDB simulat o SQL local també declaren el límit entre codi provat i servei desplegat.

## Contrast d’un patró compartit: calaixos

Per comprovar «Índex de continguts» ↔ «Amb qui actues?», seguix el recorregut de `PageFrame` i `CalaixIdentitats` fins a `Dialeg`, `tokens.css` i les regles `.toc-overlay`/`.sdp-dialeg--calaix`. En la SPA, el mateix `--sdp-calaix-dalt` i `--sdp-calaix-alt` ha d’arribar als dos consumidors i al vel, sense una regla posterior que tape la barra negra. En l’encastat mana la capa modal de `layout.css` (calaix al 100% de la caixa), amb prova pròpia: no hi imposes la geometria de la finestra de la SPA. Les proves dels consumidors detecten regressions de classes i CSS; la comprovació visual de la capçalera i les zones segures requerix navegador. Contrasta cada capa abans d’atribuir la fallada al component o a la teoria.

## Vincles
- [[00_INDEX_SKILLS]]

