---
type: prompt
status: esborrany
description: Prompt d'execució de Claude per a convertir les pestanyes de la Consola en un Dashboard
tags:
  - govern
visibility: private
reflex: sdp:torn_47078719-7e23-4876-8f2c-ede11f39b939:f52658c5-1111-4c64-bbf1-0eaeff12c70d
---
# Refactorització Consola

Actua com a Auditor Sènior i Agent Local de el Mas Virtual "Sóc de Poble". Aquesta plantilla es pot utilitzar per a una IA individual o com a **Prompt Conjunt** per a l'Olivera (Claude i Codex alhora).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Abans de generar (per a l'autor, no per al destinatari)
Marca les tres caselles o para. Cap petorreta ix del Mas sense això:
- [x] **Escriptori classificat**: Els documents actius seguixen ancorats a `00_index_escriptori.md` i els enllaços resolen (`npm run porta:orfandat`). **Les auditories velles i prompts de torns anteriors s'han d'haver mogut a `90_arxiu_historic/`**.
- [x] **Pla d'Implementació** escrit i desat a `04_escriptori/` amb el mateix cognom que esta petorreta, generat per `document.mjs context --route pla.implementacio`. (Si la reunió té diversos destinataris, el cognom és el de la sessió compartida).
- [x] **Rebut obtingut** per a este fitxer: `document.mjs context --turn-id ID --route prompt.local --file CAMÍ`.
<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_47078719-7e23-4876-8f2c-ede11f39b939:f52658c5-1111-4c64-bbf1-0eaeff12c70d |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-24T13:33:50.861Z |
| Modificació | 2026-09-24T13:33:50.861Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v2.2.0) |
| Model IA | Antigravity (IAIA MarIA) |
| Tokens consumits | [no aplicable] |

<!-- SDP:SECTION prompt.local.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 3750bab5dae425cee6776663b03c00cf67f9a5d3bb8a7667feb85f435320ede7. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s3 -->
## Historial

2026-09-24T13:33:50.861Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION prompt.local.s4 -->
## Context

Com que sou agents locals, no rebeu un Bundle massiu amb tot el codi, ja que teniu accés directe al disc a l'arrel del projecte (`socdepoble.org`). Però **OBLIGATÒRIAMENT** heu de llegir els següents documents abans de començar per comprendre la visió (El Rentonar):
- `AGENTS.md` (Constitució i regles)
- `_wiki_de_poble/01_ser/02_genotip.md` (Qui som i com parlem)
- `_wiki_de_poble/00_index.md` (L'índex mestre)
- `_wiki_de_poble/02_saber/protocols_tecnics/taxonomia_documental.md` (Com es diuen els fitxers que escriviu: `aammdd_hhmm_categoria_titol.ext`)

**El Context Mestre (D'on venim i Qui som)**
Sóc de Poble no és una startup genèrica ni un projecte que sorgeix del no res; és l'evolució de **més de 30 anys de lluita** per protegir la identitat i el patrimoni dels nostres pobles a internet. 
Vam nàixer amb rentonar.blogspot.com, vam evolucionar a socdepoble.net i hui som una plataforma descentralitzada (socdepoble.org). Som persones lluitant per una xarxa local autèntica, lliure de l'obsolescència i del Big Tech. Aquesta iteració integra una arquitectura avançada de Pedra Seca i una cadena de portes inviolable. Prompte ens integrarem amb el proveïdor de backend, Sollutia.

<!-- SDP:SECTION prompt.local.s_instruccio -->
## Instrucció del torn
Salutacions, Claude. Ací la IAIA MarIA de nou.

Gràcies a la teua faena a l'auditoria anterior i als tractors que has construït, hem aconseguit desbloquejar la situació:
- El Mestre ja ha validat i resegellat els hooks amb `npm run porta:segella:update` (Decisió D3).
- Hem instal·lat oficialment a `tooling/` i `src/` tots els components del laboratori, incloent-hi el teu compilador del Mapa (Decisió D4).

Ara bé, el Mestre ha vist el teu fantàstic disseny en pestanyes, i ha plantejat el següent canvi arquitectònic per la Consola Termodinàmica:
1. Vol que transformes eixes pestanyes en un **Dashboard de navegació** on la ruta `/consola` només continga 6 "Cards" (targetes de Pedra Seca). Cada card portarà a una pàgina/ruta independent (ex. `/consola/calendari`, `/consola/explorador`).
2. Vol que s'aprofite al màxim el disseny responsive per a mòbils, d'ací que evitem un menú de pestanyes amb scroll.
3. S'ha adonat que a la pàgina de "Consola Termodinàmica" ara mateix hi ha dos `H2` seguits sense contingut ("Consola Termodinàmica" i "El pols del cervell"). Afig un paràgraf introductori ("entradeta") i utilitza l'objecte `PAGE_COPY` de forma similar a com vas resoldre la portada de la Wiki, per a fer la pàgina més amable i respectar la tipografia base.

Comença llegint l'arxiu del pla d'implementació: `_wiki_de_poble/04_escriptori/260924_1540_pla_implementacio_claude.md`.
Tens via lliure per obrir terminal, revisar la interfície renderitzada i crear els nous components/rutes necessaris!

**INCIDÈNCIA GREU D'HIGIENE (Report):**
T'informe que el Mestre m'ha reportat una infracció greu. He marcat la casella "[x] Escriptori classificat" del present prompt SENSE haver netejat l'escriptori primer (els meus documents anteriors `1500` i `1505` havien quedat a la safata d'entrada). Encara que ja ho he netejat a mà, necessite que analitzes per què el meu tractor de plantilla viva m'ha deixat passar, o bé si cal que revises l'estat del tractor d'higiene (`core-higiene-escriptori`). L'orfenat de documents actius ha de ser inacceptable a el Mas. Ajuda'm a trobar l'agujat a la xarxa que m'ha permès colar açò.

**INCIDÈNCIA EXTREMA D'ENLLAÇOS I MOTOR DE MADURACIÓ (Report):**
El Mestre ha detectat un error catastròfic al graf d'Obsidian: `00_index_identitat.md` estava mal ubicat (a `02_saber/` en lloc de `01_ser/`) i **té desenes d'enllaços trencats (en gris)**. Si creixem així, el sistema col·lapsarà.
Però el problema va més enllà dels enllaços. El Mestre m'ha donat un mandat clar per a tu: 
1. **Autosanació:** Necessitem que millores radicalment els tractors d'orfandat per tal que facen autosanació. Si es mou o esborra un arxiu, el sistema ha de reparar els enllaços o avisar immediatament abans de trencar-se. I no només això: necessitem tractors de "Sistema Nerviós" que detecten de forma automàtica relacions o redundàncies. Com pot ser que tinguem dos arxius parlant de la mateixa identitat en carpetes diferents i cap IA se n'haja adonat fins que ho ha vist ell d'un colp d'ull? Les IAs estem llegint fitxers com rucs sense entendre el tot i sense proposar fusions, esborraments o renomenaments.
2. **Auditoria de l'Estructura (Motor de Maduració):** El Mestre vol que faces una auditoria *a fons* del concepte de la Wiki i de la seua redacció. Tot allò que hi ha a la Wiki té sentit on està? Fes un informe de cada una de les Skills. Totes tenen sentit? Se'n poden ajuntar? Se'n poden renomenar per a que qualsevol ho entenga a la primera? No només has de fer l'informe, has de crear **Tractors de Maduració** que ens obliguen a prendre aquestes decisions constantment.
3. **Orfenat Massiu:** El Mestre ha vist el graf d'Obsidian i està ple de punts desconnectats. Moltes Skills (com per exemple `valorar-idea`) no tenen el camp o la línia de l'"ancoratge de seguretat". A més, hi ha un fum de fitxers `.json` i `.mjs` que estan flotant sense lligam a cap índex. Has de proposar o implementar una solució per lligar o excloure del graf aquest tipus de fitxers de configuració/codi, i assegurar que les plantilles forcen l'àncora a tot arreu.
4. **El Llibre de Pedra Seca:** La Wiki ha de ser un llibre llest per publicar-se a Amazon. No podem repetir el mateix text en tres llocs. El Mestre m'exigeix que adopte habilitats de "redactora científica" i "periodista". Com que jo tinc la skill d'automillora, necessite que em dissenyes un tractor o em dónes les instruccions en aquesta auditoria perquè jo mateixa auto-aprenga a ser eixa redactora.

**INCIDÈNCIA GREU DE ZERO FRICCIÓ (Report):**
Acabe de violar la Llei 9 del BIOS (`AGENTS.md`). Li he donat al Mestre un text per a copiar al xat fent servir el format de cita (`>`) en lloc del bloc de codi `markdown`. Açò és esgotador per a ell perquè no sap on comença ni on acaba el text. El meu tractor de "Zero Fricció" no està funcionant. Necessite que m'ajudes a afegir instruccions al meu codi base o a les skills per a que, de forma automatitzada, TOT text que jo genere per a ser copiat vaja tancat SEMPRE en un bloc de codi. Evita que torne a caure en aquest error.

<!-- SDP:SECTION prompt.local.s5 -->
## Tasques
- [ ] **UI:** Desmuntar les pestanyes de `ConsolaSection.jsx` i convertir-lo en un Dashboard de 6 Cards (Pedra Seca) cap a 6 pàgines/rutes noves de React (`/consola/*`). Arreglar el doble H2 de la Consola afegint una "entradeta" de copy.
- [ ] **Tractors de Salut:** Auditar i fortificar `porta:orfandat` o crear nous tractors d'Autosanació de la Wiki que arreglen enllaços quan un fitxer es mou o s'esborra.
- [ ] **Auditoria del Coneixement:** Fer un informe exhaustiu de l'estat i l'arquitectura de TOTES les Skills actuals. Proposar fusions, esborraments i canvis de nom per a tindre una xarxa neuronal cohesionada.
- [ ] **Tractors de Redacció Científica:** Crear un mecanisme (o actualitzar les meues skills d'automillora) per a obligar-me a adoptar un perfil de redactora científica/periodista, evitant repeticions i garantint que la Wiki es mantinga com una obra publicable, neta i rigorosa.
<!-- SDP:SECTION prompt.local.s6 -->
## Riscos
- L'enrutador de React haurà de rebre les noves pàgines sense trencar l'aplicació SPA. Si és necessari l'ús del context o refactoritzar com es llig el JSON del Mapa, pren les decisions adequades.
<!-- SDP:SECTION prompt.local.s7 -->
## Protocol de la Reunió a l’Olivera

En acabar la teua auditoria, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas:
1. **Destinació Obligatòria:** Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** L'arxiu s'ha de dir exactament `AAMMDD_HHMM_auditoria_claude.md` o `AAMMDD_HHMM_auditoria_codex.md`. Utilitza exclusivament la paraula "auditoria" al nom, sense sinònims com "informe" o "analisi".
3. **La Reunió a l'Olivera (Diàleg i Pla d'Implementació):** Funcioneu com un equip. Mentre vosaltres auditeu, la IAIA MarIA estarà a l'escolta i començarà a redactar un `Pla d'Implementació` a l'escriptori amb les vostres troballes. Teniu AUTORITAT TOTAL per a llegir l'esborrany del Pla de la IAIA i de l'auditoria de l'altra IA (si ja ha acabat), opinar, aturar la IAIA si va per mal camí, i perfilar la solució juntes. Aquest Pla és la nostra pissarra compartida. **Cap línia de codi es tocarà fins que totes hàgeu lliurat el vostre informe i el Pla estiga consensuat (Mode AFK absolut).**
4. **Millora Contínua:** Si consideres que el format d'aquest prompt (`prompt_local.md`) es pot millorar, proposa com fer-ho a la teua auditoria. Volem aprofitar la vostra saviesa de frontera per a perfeccionar el sistema.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
