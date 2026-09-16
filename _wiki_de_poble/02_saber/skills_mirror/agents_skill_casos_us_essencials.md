---
estat: "canonic"
tipus: "skill"
description: "Registre d'idees de producte i casos d'ús vitals per a la xarxa social i el mur de Sóc de Poble. Aquestes idees s'han de consultar a l'hora de desenvolupar la xarxa per assegurar-se que els models de dades i les \"cards\" les puguen suportar."
tags:
  - "identitat"
  - "skills"
---
\n<!-- Aquest fitxer és un ESPILL (mirror) automàtic de .agents/skills/skill-casos-us-essencials/SKILL.md -->

# 💡 Casos d'Ús Essencials i Funcionalitats Clau

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

***

## 🛠️ Requisits per a la Implementació (Notes per al Desenvolupament)

Quan arribe el moment d'implementar açò:
- Tindre en compte les **"Cards" Específiques:** Aquests casos d'ús requeriran variacions de la `UniversalCard` (o plantilles pròpies) per mostrar camps com `preu per taper`, `disponibilitat horària`, etc.
- **Connectors i Plantilles Internes:** Quan implementem aquestes opcions al Menú de l'aplicació, el "plugin" de *Restaurants* o d'*Ocupació* haurà de venir amb la seua pròpia plantilla de dades (igual que fa la Gestoria amb els documents base) per instanciar aquestes categories ràpidament.

***
**Ancoratge de la Wiki**
- Penja de: [[00_INDEX_SKILLS]]
- Connectat amb: [[pedra-seca]], [[skill-iaia-identitat]]
