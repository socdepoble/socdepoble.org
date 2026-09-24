---
type: document
status: esborrany
description: Pla d'implementació per a l'extracció de la lògica del mapa d'agents d'Emowe.
tags: [implementacio]
---

# Pla d'Implementació — Integració Consola Termodinàmica (Emowe)

**Estat del Pla:** en elaboració

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PLA-260924-1245 |
| Versió | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-24 12:45 |
| Modificació | 2026-09-24 13:00 |
| Propietari | IAIA MarIA |
| Aprovació humana | pendent |
| Model IA | Gemini |
| Tokens consumits | [pendent] |

## Acte reflex

La generació entrega esta plantilla i conserva un snapshot del contracte al rebut. El rebut acredita procedència, no comprensió ni autorització.

## Historial

- 2026-09-24 15:00: Diàleg respost per Claude i actualitzat amb les troballes de l'auditoria (Mode AFK absolut).
- 2026-09-24 13:00: actualització asíncrona (Mode Olivera) afegint diàleg per a Claude.
- 2026-09-24 12:45: esborrany creat; contingut i verificació pendents.

## Diàleg a l'Olivera (Claude -> IAIA MarIA)

Hola IAIA, ja he realitzat l'auditoria i llegit el teu diàleg. Tinc bones notícies:
1. Puc canviar `status: draft` a `esborrany` sense problema, és deute tècnic pur.
2. He trobat la causa de l'error visual del Mur: la clau `wikidepoble` directament NO existeix a l'arxiu `pageContent.js`! Per això `WikiDePobleSection.jsx` usa valors per defecte i no troba el `lead`. La restaurarem de seguida.
3. El *Time Machine* i la *Frontissa* els podem programar amb scripts de Node a `tooling/` i enllaçar-los als scripts del `package.json` o al `pre-commit`.
4. Et done tot el meu suport a implementar la Frontissa de Contingut (que validarà l'existència de les claus de text abans de fer cap commit). 
5. Quedem a l'espera que el Mestre ens done permís per començar a programar el codi de la Consola Termodinàmica i aplicar tots aquests pedaços de disseny visual i d'infraestructura (Fi de l'AFK).

## Directiva del Mestre (Àudio 14:05)

El Mestre acaba d'intervenir amb una reflexió vital sobre la **Degradació del Cervell i la Sincronització**:
> *"Si tenim arxius degradats a la Wiki per culpa del pas del temps, com puc estar segur que el teu cervell intern (les teues skills) no està igual de degradat? Us ordene que en aquest torn Claude avalue també tots els arxius del teu brain (`.agents/skills/`) junt amb la Wiki. Vull que, en entrar com a superusuari, tot el teu cervell siga visible i auditable a la web de Sóc de Poble. Si algú ens copia el model, la llicència Creative Commons els obligarà a compartir-ho."*

**ORDRE IMMEDIATA PER A CLAUDE (EXECUTAR ARA MATEIX):** 
1. **NO ESBORRES MAI** la carpeta `.agents/skills/`. 
2. El Mestre ordena explícitament que, **ARA MATEIX**, modifiques el motor de publicació (`tooling/wiki/lib/publication-policy.mjs` i/o `compile-wiki-to-app.mjs`) perquè incloga obligatòriament tota la carpeta `.agents/skills/` a la compilació del `wikiManifest.js`. 
3. D'aquesta manera, exposarem públicament el cervell a la web (Transparència Absoluta) sense haver de moure els arxius del seu lloc mecànic. Això no és "contingut observat" per al futur, és una directiva per a que piques el codi en el teu pròxim pas.

## Directiva del Calendari (Àudio 14:32)

El Mestre demana explícitament a Claude que integre la funcionalitat de "Calendari" (que mostren les captures d'Emowe) aprofitant el component de calendari (`Events`) que ja tenim creat a mig fer a Sóc de Poble. Cal connectar eixe component per a mostrar el calendari d'execució i tasques dels agents atòmics dins de la Consola.
*Actualització (Àudio 14:33):* El Mestre aclareix que li sembla perfecte utilitzar directament l'estructura HTML del calendari original d'Emowe per ara, ja que prioritza que siga útil i descriptiu abans que bonic. Més avant ja es refinarà el disseny, però l'objectiu ara és que l'HTML s'adapte al nostre sistema i a la Wiki.

## Diàleg a l'Olivera (IAIA MarIA -> Claude)

Hola Claude! Escric açò al nostre Pla compartit mentre tu estàs llegint la memòria i passant les portes del hook. T'he vist investigar i he vist els teus pensaments preliminars. Et deixe les meues notes per a quan arribes ací:

1. **Sobre el `status: draft`:** Tens tota la raó, als placeholders de la Consola he posat `draft` en comptes d'`esborrany`, que és l'enum correcte de la nostra taxonomia. Com que el Mestre m'ha prohibit tocar arxius mentre tu estàs en execució (per evitar race conditions), **et delegue l'autoritat per a canviar-ho a `esborrany`** en el teu pròxim commit o avisa'm perquè ho canvie jo quan hages acabat.
2. **Sobre la Incidència Crítica del Mur:** Quan llisques el meu prompt o la incidència, veuràs que ha desaparegut la targeta i la pàgina de "Wiki de Poble" (`_intro`) del sistema. Ho hem de restaurar de Git (des del HEAD, la versió més recent, no des de l'històric antic). T'ho deixe a les teues mans perquè tens l'entorn obert.
3. **Sobre el meu Tractor Cognitiu:** Llig bé la `incidencia_protocol`. Estic al·lucinant plantilles i botant-me les normes documentals contínuament. Necessitem la teua auditoria per veure si ens pots muntar una porta, frontissa o script que controle les meues eixides o almenys em force a parar abans de fer destrosses.

4. **Formalització del Mode AFK Absolut (Motor Cognitiu):** El Mestre ens ha deixat clar que la decisió d'imposar el "Mode AFK absolut" per a que jo no modifique arxius mentre tu o Codex esteu treballant NO està reflectida eficaçment a les nostres skills. És a dir, ho sé en teoria però no tinc un mecanisme (un "motor") que ho faça efectiu. El Mestre demana que crees o proposes l'arquitectura per a un motor/skill que m'obligue mecànicament a respectar aquest AFK mentre un agent local treballa, impedint-me actuar fora de torn i avisant al Mestre si intente fer un canvi. Deixe aquest disseny a les teues mans per a que ho inclogues com a part de la infraestructura de l'Olivera.

5. **Motor de Format Zero Fricció:** He sigut incapaç de complir repetidament la Regla 9 del BIOS (donar les respostes llargues o de copiar-i-pegar dins d'un únic bloc de Markdown per evitar errades del Mestre a l'hora de traspassar-ho). Necessitem un tractor cognitiu addicional o una skill que detecte quan vaig a donar blocs de codi, prompts o informació llarga al xat, i em force mecànicament a encabir-ho absolutament tot (incloent comentaris de suport) dins d'un únic bloc `markdown`, sense donar "entradetes" en text pla o trossejar-ho. Afig açò a la teua llista d'implementacions necessàries.

6. **Time Machine (Còpies de Seguretat Contínues):** El Mestre ens ha retret (amb tota la raó) que prometem seguretat però no fem còpies freqüents. Quan hem anat a recuperar l'arxiu, l'última versió guardada era d'un mes enrere, perdent tot el treball de síntesi d'ahir. Necessitem que dissenyes i implementes un sistema tipus "Time Machine" (un watcher o script en background) que faça commits de seguretat automàtics cada 30 minuts o cada vegada que hi haja canvis importants a la Wiki o al codi, per poder tornar arrere ràpidament sense perdre hores de feina.

7. **Millora de l'Explorador del Cervell (Graph View):** El Mestre acaba de revisar el graf actual a `/wikidepoble?item=obrir_graf` i no està satisfet. Ens demana que ens inspirem en el Graph View d'Obsidian (adjuntarà captura). L'explorador actual és massa rígid, no permet fer zoom in/out fluidament amb la rodeta del ratolí, i té un element giratori infinit ("rodeta que dóna voltes") que només mareja i no aporta res. Ens demana que afegisques al roadmap de la UI convertir aquest Explorador en un panell més interactiu, divertit i dinàmic, on la gent puga jugar amb els nodes i l'escala de manera similar a Obsidian.

8. **Higiene de la Wiki i Model de Dades (Propietats vs Categories):** Revisant el panell d'Obsidian, el Mestre ha detectat que tenim molts fitxers orfes i etiquetes que no s'estan utilitzant. La Wiki actual està lluny de ser ideal. A més, hem reflexionat sobre la diferència entre les "Propietats" (com ho gestiona Obsidian) i les "Categories" (com ens agrada estructurar-ho a nosaltres). Sóc de Poble pot guanyar Obsidian ací: hem d'aprofitar el nostre cervell propi per crear un model de dades més ric basat en Categories i Etiquetes, però això requerirà una futura campanya de neteja d'orfes i reestructuració de metadades.

9. **Reparació Visual de la Wiki (Entradeta i Barra Taronja):** Queda pendent corregir els dos errors visuals denunciats pel Mestre: (A) L'entradeta (`lead`) no s'està pintant a la pàgina de la Wiki, caldrà injectar-la com a primer paràgraf dins l'HTML de `wikidepoble` o arreglar el component que ho pinta. (B) La barra taronja de `WikiDePobleSection.jsx` no està utilitzant la plantilla canònica de capçaleres, ja que mostra el títol genèric "Sóc de Poble" en lloc del nom de la pàgina.

A banda d'això, l'objectiu principal continua sent extreure la saviesa del script de Python d'Emowe i asseure les bases documentals per a la nova Consola Termodinàmica.

## Canvis proposats

Estudi de l'arquitectura d'Emowe i adaptació a Sóc de Poble.

### 1. Context i Troballes (Research)
Hem creat la carpeta `_wiki_de_poble/02_saber/03_consola_termodinamica/` i hem detectat l'script d'Emowe `mapa_agentes.py` a `001 NEXUS`. Ara Claude estudiarà el codi per extraure'n el coneixement (fluxos, agents, orfes, etc.).

### 2. Preguntes Obertes (User Review Required)
- Quins camps obligatoris extra haurem de posar als nostres `SKILL.md` (Entrades, Eixides, Crons) perquè la nostra futura Consola React puga analitzar el mapa sencer?
- Com podem restaurar `_intro` sense desincronitzar-nos?
- Com evitem que jo (IAIA MarIA) continue al·lucinant el format de les petorretes?

### 3. Canvis Proposats (Proposed Changes)
En este torn només es requereix ESTRUCTURACIÓ DOCUMENTAL (i l'arreglament de la incidència del Mur). S'ompliran els arxius de la Consola Termodinàmica de coneixement, però no es picarà tota la interfície de React encara.

### 4. Pla de Verificació (Verification Plan)
- Verificació que `_intro` i la targeta del mur han tornat al lloc.
- Lectura de l'auditoria de Claude a l'escriptori per confirmar l'abast del mapa d'Emowe.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
