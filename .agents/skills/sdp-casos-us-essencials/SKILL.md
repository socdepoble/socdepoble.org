---
type: skill
status: canonic
description: Consulta els casos d’ús rurals del producte abans de desenvolupar models de dades, navegació o targetes que els hagen de suportar.
tags:
  - identitat
  - skills
name: sdp-casos-us-essencials
triggers_on:
  - casos d’ús rurals
  - menjar solidari
  - cures al poble
  - funcionalitats essencials del poble
contracte.llig:
  - .agents/skills/sdp-pedra-seca/SKILL.md
  - .agents/skills/core-identitat/SKILL.md
  - _wiki_de_poble/01_ser/02_genotip.md
contracte.escriu:
  - _wiki_de_poble/04_escriptori
---
# 💡 Casos d'Ús Essencials i Funcionalitats Clau

Esta skill ajuda a convertir els casos rurals aprovats en contractes i proves reutilitzables. Els casos 1–3 expressen necessitats de producte; no acrediten que una categoria, un servei SMS o la seua infraestructura estiguen desplegats. Abans d'implementar, localitza el consumidor real i registra què funciona, què es prova amb fixtures i què és proposta.

## 1. 🍲 Menjar a Casa (Aprofitament Alimentari Solidari)

**El Problema:** La gent que viu sola al poble sovint es ressent de cuinar. D'altra banda, els bars i restaurants tenen menjar sobrant (o de menú del dia) que s'acaba tirant, o particulars cuinen peres grans (com llentilles) i en sobra molt.

**El Cas d'Ús:** Crear una etiqueta o categoria específica (`menjar-a-casa` o `menjar-solidari`) per als Menús dels bars o publicacions de particulars.
- **Funcionament:** Els bars poden agafar eixe menjar, congelar-lo en *tapers* a preu molt reduït (ex: a preu de cost) i publicar-ho al mur de Sóc de Poble a última hora del dia.
- **Acció a la Xarxa:** L'usuari que viu sol pot triar qualsevol dia veure què hi ha publicat sota l'etiqueta "Menjar a Casa" i anar al bar a arreplegar els tapers de menjar cassolà per a passar la setmana.
- **Impacte:** Reducció del malbaratament alimentari (food waste) i suport social per a persones grans o que viuen soles.

## 2. 👵 Cures de majors i suport quotidià

**El Problema:** Molts pares i mares d'edat avançada es queden al poble mentre els fills viuen a la ciutat (o altres regions), i necessiten suport diari. Tradicionalment aquest rol que no existia s'està professionalitzant, arribant a haver-hi desenes de cuidadores al poble.

**El Cas d'Ús:** Una categoria molt prominent i especial dins de la secció d'"Ocupació" (Oferta i Demanda).
- **Funcionament:** Les cuidadores poden oferir els seus serveis creant targetes específiques ("cards") de cuidador/a amb disponibilitat, tasques (acompanyament, compres, atenció).
- **Visualització:** No pot ser una simple subcategoria perduda. Ha de tindre una icona dedicada (com una "abuelita" o unes mans protectores) i ser altament visible per a les famílies que busquen suport des de lluny.
- **Impacte:** Satisfer una necessitat crítica d'infraestructura de cures a l'entorn rural.

## 3. 🍅 Calendari Agrícola i Avisos per SMS (Proactivitat)

**El Problema:** Els agricultors del poble tenen temporades molt marcades per a plantar certs cultius (ex: tomaques, creïlles), però el coneixement a vegades està dispers o depèn de la tradició oral. Cal un sistema proactiu que els avise quan és el moment ideal.

**El Cas d'Ús:** Un calendari agrícola automatitzat on els llauradors es poden subscriure.
- **Funcionament:** El sistema envia un missatge al mòbil (SMS o integració) avisant: "És l'hora de plantar tomaques!".
- **Autonomia d'IA:** Aquest és el cas d'ús "or" per provar la capacitat "Plug & Play" del projecte. Qualsevol IA (Claude, Codex, Fable) hauria de poder aterrar al codi i programar tota aquesta funcionalitat de dalt a baix de manera autònoma, integrant la base de dades, l'enviament de missatges i la interfície sense trencar el sistema.

## 4. 🎭 Optimització del Soroll al Xat de Grup (Desar a Notes)

**El Problema:** Quan s'organitza un esdeveniment al poble (com la desfilada de disfresses on hi ha 70 persones, entre pares i xiquets, apuntades per disfressar-se de romans), el grup de xat es converteix en un infern de notificacions inútils i soroll (més de 600 missatges per a posar-se d'acord o fer avisos tontos). Això genera fatiga als usuaris, que s'acaben silenciant o eixint dels grups.

**El Cas d'Ús:** Tot el sistema ha d'estar dissenyat com un Gestor de Continguts silenciós. Qualsevol missatge clau dins d'un Xat (p. ex. les "mesures per a la tela de la disfressa" o l'"horari de l'assaig") pot ser extret fàcilment del xat.
- **Funcionament:** L'usuari ha de poder prémer un missatge dins de qualsevol grup o xat i tindre l'opció directa d'"Enviar a Notes" o "Guardar". Es copia a la llibreta perquè l'usuari se l'organitze; el missatge original continua al fil. Desar un retall no autoritza esborrar missatges ni altera la seua entrega. 
- **Impacte:** Aquest flux de treball busca deliberadament **reduir el soroll mòbil**. Quan construïm l'App nadiua (per a Apple Store i Google Play), l'enfocament serà minimitzar les notificacions absurdes i permetre a l'usuari extraure la informació valuosa dels grups caòtics directament a la seua llibreta personal.

***

## 🛠️ Requisits per a la Implementació (Notes per al Desenvolupament)

Quan arribe el moment d'implementar açò:
- Reutilitza `UniversalCard` i el contracte `PublicacioUniversal` quan la necessitat encaixe en un dels cinc àmbits. Els camps com preu o disponibilitat es modelen a la fitxa validada; una necessitat nova es proposa abans de crear una targeta, taula o port paral·lels.
- **Connectors i Plantilles Internes:** Quan implementem aquestes opcions al Menú de l'aplicació, el "plugin" de *Restaurants* o d'*Ocupació* haurà de venir amb la seua pròpia plantilla de dades (igual que fa la Gestoria amb els documents base) per instanciar aquestes categories ràpidament.

***
**Ancoratge de la Wiki**
- Penja de: [[00_INDEX_SKILLS]]
- Connectat amb: [[sdp-pedra-seca/SKILL]], [[core-identitat/SKILL]]


## Patrons contrastables abans de crear un cas nou

- **Una publicació, dues projeccions:** `src/utils/publicacioUniversal.js` fixa `mur`, `mercat`, `vehicle`, `treball` i `habitatge`, els estats i `SECTION_ID_PER_AMBIT`. `projeccioPayload` normalitza l'escriptura i `coaccionaAmbit(payload, sectionId)` valida la lectura. Vehicle, Treball i Habitatge s'emmagatzemen en la secció Mur; no es creen tres taules ni dues files per publicar. Les proves de contracte i `src/data/local/adaptadorLocal.publicacioUniversal.test.js` en fixen el comportament.
- **Informació tranquil·la fora del soroll:** `src/sections/xat/retall.js` i `src/sections/notes/proposaCard.js` connecten retall i Notes. La prova ha de conservar el missatge i atribució originals i comprovar la nova nota; no s'assumeix enviament ni desament remot per un indicador visual.
- **Targetes internes llegibles:** el cos de Legal es segmenta i pinta amb el mecanisme de targetes de `TextSection`; les proves de `TextSection.targetes.test.jsx` preserven també el text circumdant. Aplica [[sdp-universal-page/SKILL|sdp-universal-page]] per ampliar-lo. El slug `/page/privadesa` reutilitza `/legal` mitjançant l’àlies provat del router; no es crea una política duplicada. Cal certificar l’àlies en la versió que s’integra.
- **Edició avançada compartida:** l'ordre Hero → Avatar/Logotip → «On es publica?» → classificació és el contracte aprovat d'Onada 4. Les suites de Notes i de la closca del carril Claude s’han contrastat en la instantània complementària d’Onada 4 (DOM i comportament local); usa [[sdp-universal-editor/SKILL|sdp-universal-editor]] per a les ranures i la verificació.
- **Enllaç que arriba on diu:** primer `certifica-enllacos.mjs` contra arbre/router; després `--remot` per HTTP i tipus de contingut. El segell no prova permisos, resultat d'una acció ni render React: conserva eixos límits en el cas d'ús.

## Calaix reutilitzable per a la identitat

En la SPA, «Índex de continguts» i «Amb qui actues?» compartixen la geometria sota la barra negra descrita a [[sdp-universal-page/SKILL|sdp-universal-page]]. Reutilitza eixos tokens i `Dialeg` per a una necessitat semblant; conserva nom accessible, focus, retorn al botó i zona segura. Les proves de `Dialeg.test.jsx` i `CalaixIdentitats.test.jsx` acompanyen les regles CSS; la inspecció en mòbil acredita el resultat visual.

## 5. 📰 Importació i Transformació Editorial (WordPress, Blogger i Webs Municipals)

**El Problema:** El patrimoni històric de Sóc de Poble (`socdepoble.net`), d'El Rentonar (`elrentonar.blogspot.com`), d'Oli de La Torre, de la Coordinadora d'Estudis Eòlics del Comtat, del Blogger de Pep Cascant (*L'Èxit de l'Olivera*, *El Blat* i *El Raïm*) i les convocatòries d'ajuntaments veïns (com l'Ajuntament de Muro) viuen en formats dispars (WordPress, Blogger, PDFs solts, vídeos pesants) que no tenen l'estructura didàctica de Pedra Seca.

**El Cas d'Ús:** Recuperar cada article o convocatòria i transformar-lo en una peça més atractiva i didàctica que l'original, seguint el tractor [[sdp-importacio-editorial/SKILL|sdp-importacio-editorial]]:
- **Funcionament:** Es preserva el timestamp original de publicació (`created_at` / `publish_date`), s'assigna l'autoria temàtica (`El Rentonar` per a contingut social/territorial, `Sóc de Poble` per a contingut tecnològic), es converteixen els PDFs en cartells `.webp` registrats a `censImatges.js`, s'allotgen els vídeos pesants al servidor sobirà del Node 0 (`https://socdepoble.cat/media/`), s'adapta el quadrat negre (`calendar_badge`) si és un curs o esdeveniment multi-dia, i es cita sempre amb enllaç directe la font original i els drets.

## Vincles
- [[00_INDEX_SKILLS]]
- [[sdp-importacio-editorial/SKILL]]
