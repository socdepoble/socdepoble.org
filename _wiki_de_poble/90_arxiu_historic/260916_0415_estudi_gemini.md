---
estat: "esborrany"
tipus: "document"
description: "Estudi i valoració de la resposta de Gemini sobre el Tractor d'Auto-Categorització"
tags:
  - "acta"
  - "arquitectura"
  - "disseny"
---
\n# 📊 Estudi: El Trellat de Gemini (Estratègia Micro)

**Agent avaluat:** Gemini
**Context lliurat:** MICRO_BUNDLE (1.44MB) i MICRO_PROMPT
**Tasques sol·licitades:** Anàlisi de metadades i disseny del Tractor d'Auto-Categorització.

## 1. Valoració Tèrmica i del Comportament

Gemini ha adoptat la personalitat de la IAIA MarIA amb una naturalitat aclaparadora. L'ús de metàfores (les golfes, llevar la pols, fang en un marge de Pedra Seca) ha sigut excels. A més, ha demostrat una lectura exhaustiva del document `esquema_frontmatter.json` citant exactament l'entropia zero de l'etiqueta `sistema` (53 de 96 documents).

## 2. Avaluació de les Troballes Tècniques

1. **La Purga Sense Pietat:**
   - Gemini coincideix amb els altres models en la purga massiva de camps heretats de Git i dades mortes. 
   - Afegeix una novetat: proposa purgar `title` (redundant amb l'H1 del markdown) i `cssclasses`, netejant encara més la capçalera.
   - També aconsella unificar etiquetes com `skill` o `ui` sota els enums tancats.

2. **L'Arquitectura del Tractor (Divergència amb Qwen i Z):**
   - El script proposat per Gemini (`tractor-cervell-ia.mjs`) utilitza `parseFrontmatter` i camina els directoris, la qual cosa és correcta.
   - **Punt dèbil:** A diferència de Qwen, que va prohibir l'ús d'un LLM per ser lent, car i no determinista, Gemini proposa una funció `avaluaDocument()` que crida un LLM per a cada document de la Wiki. Açò trenca l'eficiència termodinàmica que busquem. 
   - **Punt fort (L'al·lucinació genial):** S'ha inventat una llibreria `reflex_petorreta.mjs` amb `claimReceiptForMutation`. Tot i que aquest arxiu no existeix al nostre codi, el *concepte* de bloquejar mutacions destructives darrere d'un "rebut" de seguretat és una pràctica d'enginyeria meravellosa.

## 3. Conclusió i Integració

Gemini tanca la ronda d'agents Micro aportant la llista definitiva de camps a purgar i reforçant la idea que només es pot usar el vocabulari tancat de l'esquema (16 tags, 13 tipus). 

Per a la implementació del Tractor, **rebutjarem la idea de Gemini de cridar a un LLM per a cada document** i ens quedarem amb la memòria cau SHA256 (Z) i el processament purament lèxic/determinista (Qwen/Dola).
