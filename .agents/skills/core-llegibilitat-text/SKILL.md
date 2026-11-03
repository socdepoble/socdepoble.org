---
type: skill
status: actiu
description: Tractor documental per garantir el format llegible (jerarquia H1-H6) i l'escaneig ràpid amb negretes en tots els textos del sistema.
name: core-llegibilitat-text
tags:
  - disseny
  - tractors
triggers_on:
  - redactar text
  - formatar contingut
  - revisar pàgina
  - copy
contracte.llig:
  - .agents/skills/sdp-pedra-seca/SKILL.md
  - _wiki_de_poble/00_index.md
contracte.escriu:
  - _wiki_de_poble/00_index.md
---
# Tractor de Llegibilitat i Flux de Text (Pedra Seca)

Aquest tractor governa la llegibilitat de components, HTML i pàgines pintades. El fitxer Markdown font correspon a [[core-maquetacio-markdown/SKILL|core-maquetacio-markdown]] i l'encaminament documental a [[core-taxonomia-estricta/SKILL|core-taxonomia-estricta]].

## 1. Flux Lliure del Text (Zero "Capar")
No es pot limitar artificialment l'amplada del text (evitar contenidors que tallen el text a poc més de mitja pàgina). El text ha de **fluir de forma natural ocupant l'espai disponible**, adaptant-se fins al final, respectant únicament els marges generals del sistema de Pedra Seca. Zero caixes estretes innecessàries.

## 2. La Xarxa Didàctica a Tots els Nivells
La característica fundacional de Sóc de Poble és que ha de ser **DIDÀCTICA a tots els nivells**: per al veí jove, per a la gent gran, per a l'enginyer i per a la IA.
- Si un document és inaccessible, cridaner o difícil d'escanejar, ha fracassat com a eina rural.
- **La Regla Didàctica d'Or:** *«Un paràgraf més mai està de més quan és didàctic.»* Si calen dos o tres paràgrafs per fer-ho entendre clarament a la gent del poble, s'escriuen amb naturalitat.

## 3. Jerarquia Editorial Canònica (H1 → H2 → Entradeta → H3 → Paràgraf)
El contingut editorial de pàgines i publicacions seguix este patró. Un control, una etiqueta, un diàleg curt o un estat buit reutilitzen el seu component; no cal inventar un H1/H2/entradeta en cada peça. Les plantilles documentals i el Markdown tenen el seu contracte específic:
- **H1:** Títol principal noble, **sense majúscules cridaneres**. Les majúscules només es reserven per a sigles i acrònims estrictes.
- **H2:** Títol de secció o de bloc funcional. **MAI un paràgraf dens ni un totxo de cinc línies**. L'H2 es queda exclusivament amb la primera frase contundent i breu.
- **Entradeta (Lead explicativa):** Text destacat just davall de l'H2 que sintetitza el propòsit essencial del bloc i absorbeix la càrrega contextual densa. Mai s'encasta un H3 directament davall d'un H2 sense entradeta.
- **H3 / H4:** reserva els encapçalaments per a seccions que tenen contingut propi i han d'entrar a la Taula de Continguts. Els passos seqüencials continuen sent una llista numerada accessible; no els convertisques en encapçalaments només perquè porten un número.
- **Paràgraf normal:** Explicació didàctica desenvolupada.

## 4. Escanejabilitat Visual a Salts de Vista (6 a 8 Paraules en Negreta per Paràgraf)
Sóc de Poble està pensat per a lectors que busquen anar al gra mitjançant **lectura a salts de vista (en diagonal)**.
- Dins de cada paràgraf de 4 o 5 línies, és **obligatori marcar entre 6 i 8 paraules clau en negreta** (o una petita frase sintètica en negreta).
- **La norma d'or ergonòmica:** Si el lector només llig les paraules en negreta, saltant d'un paràgraf al següent, ha de poder entendre el missatge complet de tota la pàgina d'un colp d'ull, sense necessitat de consumir la morralla conjuntiva.

## 5. Deure d'Avís i Auto-Correcció
Si detectes text poc llegible, títols cridaners en majúscules o llistes llargues que haurien de ser H3, cita la superfície i el defecte. Corregix-lo quan entre en l'encàrrec autoritzat; fora d'abast, registra'l. Els canvis visuals respecten el pla aprovat i la Llei del Píxel de [[sdp-workflow/SKILL|sdp-workflow]].

## Què acompanya cada comprovació

`design_guard.mjs`, els components compartits i les seues suites comproven estructura i regressions concretes; no certifiquen llegibilitat didàctica o escaneig humà. La jerarquia del DOM, el focus i el text visible es contrasten amb la prova de la superfície; la lectura i el retall real necessiten inspecció visual. Declara estos resultats separadament.

## Vincles
- [[00_INDEX_SKILLS]]
