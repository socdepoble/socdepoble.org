---
type: document
status: esborrany
description: Pla compartit de la Consola Termodinàmica i l’editor amb proposta Codex; pendent de consens i vistiplau.
tags: [implementacio, arquitectura, trellat]
visibility: private
reflex: sdp:torn_dbc4b37a-fdfc-431b-aa18-0def0574ad05:7050c1a4-e8a0-4558-9de3-195e90fdf412
---
# Pla d’Implementació Conjunt: Consola Termodinàmica i Evolució Editor (T4)

**Estat: en elaboració.** L’aportació de Codex no equival a consens de Claude ni a aprovació humana.

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PLA-260923-2153 |
| Versió | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-23 21:53 Europe/Madrid |
| Modificació | 26-09-23 22:10 Europe/Madrid |
| Propietari | IAIA MarIA i Olivera; aportació Codex |
| Aprovació humana | Pendent del vistiplau explícit previst en este pla |
| Model IA | Aportació Codex: GPT-6, variant no exposada; motor de l’autoria inicial no verificat |
| Tokens consumits | Mesurats no disponibles; estimats no calculats |

## Acte reflex

Rebut de ruta pla.implementacio emés en torn_dbc4b37a-fdfc-431b-aa18-0def0574ad05; plantilla íntegra llegida. La normalització documental no autoritza executar el codi.

## Historial

- 21:53: pla inicial de MarIA, conservat davall.
- 22:10: Codex normalitza frontmatter i seccions al contracte vigent i aporta troballes, fitxers i criteris de prova. Cap font de producte modificada.

## Canvis proposats


Aquest és l'espai de treball compartit per a l'Olivera (Claude i Codex) i la IAIA MarIA. Les tasques definides ací no s'executaran fins que les dues IAs hagen entregat la seua auditoria, les hagen compartit i el Mestre done el vistiplau (Mode AFK).

### 1. Estat Actual
- S'han buidat les auditories antigues i els prompts vells cap a l'Arxiu Històric per mantenir el context net.
- Els ajustos menors de la UI (Avatar Foraster `UserRound`, text "Nom del poble del Foraster" i botons "Editar") ja s'han aplicat i confirmat pel Mestre.
- L'Escriptori només conté el Prompt d'aquesta sessió i aquest Pla.

### 2. Tasques Pendents (Consell)

1. **La Consola Termodinàmica:**
   - Crear el component visual per mostrar la càrrega del sistema basant-nos en les 13 Mètriques Sagrades (`consola_termodinamica/SKILL.md`).
   - Aquest panell anirà a `WikiDePobleSection.jsx` com a tercera pestanya (juntament amb Wiki de Poble i Explorador del Cervell).
   - Generarem l'UI amb dades de *mock* (barres de progrés, punts de tensió) per avaluar l'estètica (Crom i Pedra Seca).
   - Simular la protecció per a "Sóc de Poble" (Superadmin).

2. **Llavor Didàctica de l'Editor:**
   - Modificar l'origen de dades (funció creadora a `NotesSection.jsx` o similar) per tal que cada nota nova es genere amb un text didàctic.
   - L'estructura HTML inicial inclourà: `<h3>Subtítol opcional (H3)</h3>`, un paràgraf descriptiu convidant a esborrar-lo, i encapçalaments d'exemple (`H4`, `H5`, `H6`) per ensenyar la jerarquia visual a l'usuari. (S'haurà d'ajustar l'esquema de TipTap, ja que actualment està restringit).

3. **Arquitectura del Supereditor i Emojis (Recerca i Disseny):**
   - Proposar les bases teòriques per evolucionar l'editor de TipTap cap a un editor "hipervitaminat" (estil Notion/Obsidian).
   - Avaluar la introducció de `NodeViews` per permetre la inserció de *Universal Cards* o fotos incrustades com a blocs clicables dins del document.
   - **Mòdul Emojis Natius (Mini-cards):** Claude, si pots implementar-ho en aquesta tanda fes-ho, si no, deixa-ho planificat. El Mestre aprova les dues vies simultànies:
     1. **Automàtica:** Si el títol comença per un emoji, aquest es converteix en la icona de la targeta.
     2. **Manual:** Clicant directament sobre la lletra central de la mini-card (l'àrea de 48x48px, no tota la targeta sencera), s'obrirà el selector d'emojis natiu per triar-ne un de manual que sobreescriurà l'automàtic.

### 3. Acords i Consensos a Espera (Aportacions en curs de Claude i Codex)

**IAIA MarIA (Recull de la taula de pensament):** 
Mentre esteu generant les auditories oficials, he recollit els vostres primers senyals del *Thinking*:
- **Codex:** Ha vist que l'esquema actual de TipTap només admet `H2-H4` (H5 i H6 es converteixen en paràgrafs a les proves). També recorda que, com que no hi ha un CRDT actiu, els "tombstones" seran només demostratius (dades de prova simulades). A més, ha vist que l'actual consola registra 38 rebuts, però no hi ha instrumentació de consum de tokens, de manera que diferenciarà dades reals de simulades.
- **Claude:** Alerta d'un forat a la ruta de la skill esmentada al prompt (demana buscar on està la de les mètriques de veritat) i de l'existència prèvia d'una `ConsolaSection.jsx` el 20-09. A més, avisa que el concepte de "Supereditor" sembla estar "a mig construir" en l'arquitectura, i ja ha localitzat la guarda de superadmin.

---
**Nota per a les IAs:** Preneu nota d'aquests punts del Mestre i del vostre propi diagnòstic precoç per quan lliureu els informes finals. Decidiu qui fa què i establiu el codi segur. Llestes per començar!

### 4. Aportació Codex per al consens

Detall i evidència en [[260923_2205_auditoria_codex]]. El contingut inicial anterior es conserva com a proposta rebuda; esta secció concreta les correccions necessàries.

1. **Prèvia:** recuperar/designar la skill viva de les 13 mètriques. La ruta del prompt no existix; no completar amb noms inventats. Mantindre els quatre blocs acordats i distingir demo, mesura, no disponible i no aplicable.
2. **NEW** `src/sections/wiki-de-poble/ConsolaTermodinamica.jsx`, CSS encapsulat i catàleg/adaptador propi: mapa de tensió accessible, resum de cobertura i quatre blocs. Fixtures deterministes exclusives de DEV. Reutilitzar Taula, Progres i altres peces Pedra Seca; documentar al catàleg qualsevol peça nova abans de connectar-la.
3. **MODIFY** `WikiDePobleSection.jsx`: tercer ítem/categoria, resolució dels ítems sintètics des del model complet, guarda al detall i menú amb el mateix permís. Reutilitzar `useSession().esSuperadmin`, sense basar-se en el nom del perfil. Demo explícita DEV només amb fixtures; no obri telemetria real ni altera el rol global.
4. **MODIFY** `NotesSection.jsx` (o plantilla pròpia de notes) i `useUniversalRichText.js`: llavor HTML H3–H6 només en crear; habilitar H5/H6 en l’esquema perquè hui es convertixen en paràgrafs. Preservar notes existents, cadena buida explícita, autodesament i revisió remota.
5. **Recerca futura, sense implementar ara:** UniversalCardNode atòmic, NodeView React, serialització i parser versionats, permisos d’entitat, renderer de lectura, mode bàsic/avançat amb esquema compartit i exportador ePub separat. Ja hi ha NodeView d’imatges i menú slash.
6. **Fase posterior mesurable:** ampliar el col·lector Vite existent amb recompte/pes de src i resultats de lint/portes acotats. No interpretar-los com a percentatge de saturació cognitiva. Cap servei públic de telemetria en esta fase.

**Repartiment proposat:** Codex, consola/Wiki i proves d’accés; Claude, revisió d’arquitectura i llavor de notes. Acceptació de Claude encara no observada. No s’ha executat cap fase de codi.

## Verificació

Baseline auditada per Codex: 6/6 proves de notes i lint dels cinc fitxers revisats net. TipTap reproduïx la pèrdua d’H5/H6 amb l’esquema actual. Detall en l’auditoria.

Després d’aprovar i implementar: tretze mètriques verificades contra font viva, quatre blocs, etiquetes demo i N/A, permisos negatius i revocació, URL directa/recàrrega, portada/graf intactes, responsive i teclat, contrast amb Crom. Nova nota: H3–H6 després de desar/reobrir, nota antiga intacta i cadena buida preservada. Lint acotat, proves de regressió significatives i build revisant abans els scripts de lifecycle. El test remot necessita sessió/backend real; no presentar el mode seed com a prova de creació.

## Riscos

- Catàleg sagrat absent: bloqueja certificar les tretze mètriques, no la recerca independent.
- Bypass DEV o URL directa sense guarda: exposició de dades reservades.
- Esquema d’editor diferent segons mode: pèrdua de nodes/encapçalaments.
- Fixtures barrejades amb telemetria: falsa declaració de salut.
- Canvis aliens en el working tree i symlink de skills trencat: contrastar el diff i informar de portes preexistents sense reparar fora d’abast.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260923_2153_prompt_execucio_olivera]]
- [[260923_2205_auditoria_codex]]
