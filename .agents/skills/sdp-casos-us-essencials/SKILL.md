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
---
\n# 💡 Casos d'Ús Essencials i Funcionalitats Clau

Aquesta "skill" actua com un repositori de memòria activa d'aquelles funcionalitats vitals, de gran impacte social al poble, que el Mestre ha ideat. Qualsevol IA o humà que desenvolupe l'esquema de base de dades, els menús de navegació o les "Cards" del Mur ha de tindre en compte aquests escenaris.

## 1. 🍲 Menjar a Casa (Aprofitament Alimentari Solidari)

**El Problema:** La gent que viu sola al poble sovint es ressent de cuinar. D'altra banda, els bars i restaurants tenen menjar sobrant (o de menú del dia) que s'acaba tirant, o particulars cuinen peres grans (com llentilles) i en sobra molt.

**El Cas d'Ús:** Crear una etiqueta o categoria específica (`menjar-a-casa` o `menjar-solidari`) per als Menús dels bars o publicacions de particulars.
- **Funcionament:** Els bars poden agafar eixe menjar, congelar-lo en *tapers* a preu molt reduït (ex: a preu de cost) i publicar-ho al mur de Sóc de Poble a última hora del dia.
- **Acció a la Xarxa:** L'usuari que viu sol pot triar qualsevol dia veure què hi ha publicat sota l'etiqueta "Menjar a Casa" i anar al bar a arreplegar els tapers de menjar cassolà per a passar la setmana.
- **Impacte:** Reducció del malbaratament alimentari (food waste) i suport social per a persones grans o que viuen soles.

## 2. 👵 Cuidado de Mayores (Cuidadores i Suport Vital)

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
- **Funcionament:** L'usuari ha de poder prémer un missatge dins de qualsevol grup o xat i tindre l'opció directa d'"Enviar a Notes" o "Guardar". Aquest missatge desapareix del fluix sorollós i es desa com una nota tranquil·la a la seua safata, on l'usuari se la pot organitzar. 
- **Impacte:** Aquest flux de treball busca deliberadament **reduir el soroll mòbil**. Quan construïm l'App nadiua (per a Apple Store i Google Play), l'enfocament serà minimitzar les notificacions absurdes i permetre a l'usuari extraure la informació valuosa dels grups caòtics directament a la seua llibreta personal.

***

## 🛠️ Requisits per a la Implementació (Notes per al Desenvolupament)

Quan arribe el moment d'implementar açò:
- Tindre en compte les **"Cards" Específiques:** Aquests casos d'ús requeriran variacions de la `UniversalCard` (o plantilles pròpies) per mostrar camps com `preu per taper`, `disponibilitat horària`, etc.
- **Connectors i Plantilles Internes:** Quan implementem aquestes opcions al Menú de l'aplicació, el "plugin" de *Restaurants* o d'*Ocupació* haurà de venir amb la seua pròpia plantilla de dades (igual que fa la Gestoria amb els documents base) per instanciar aquestes categories ràpidament.

***
**Ancoratge de la Wiki**
- Penja de: [[00_INDEX_SKILLS]]
- Connectat amb: [[sdp-pedra-seca/SKILL]], [[core-identitat/SKILL]]


## Vincles
- [[00_INDEX_SKILLS]]
