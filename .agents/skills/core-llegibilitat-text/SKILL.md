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
Tot document, pantalla o eina de Sóc de Poble segueix un patró editorial estricte sense excepcions ni estils inventats:
- **H1:** Títol principal noble, **sense majúscules cridaneres**. Les majúscules només es reserven per a sigles i acrònims estrictes.
- **H2:** Títol de secció o de bloc funcional. **MAI un paràgraf dens ni un totxo de cinc línies**. L'H2 es queda exclusivament amb la primera frase contundent i breu.
- **Entradeta (Lead explicativa):** Text destacat just davall de l'H2 que sintetitza el propòsit essencial del bloc i absorbeix la càrrega contextual densa. Mai s'encasta un H3 directament davall d'un H2 sense entradeta.
- **H3 / H4 (Estructura de Secció vs Llistes Planes):** Quan es tracta d'errors, lliçons, passos o elements de contingut rellevants (com *«Els 18 errors...»*), **mai es deixen com a llista numerada plana de paràgrafs tous**. S'han de maquetar com a **encapçalaments H3** (i H4 si cal), garantint que s'integren al calaix de Taula de Continguts (`TOC`) i que aprofiten els estils visuals H1-H6 del sistema.
- **Paràgraf normal:** Explicació didàctica desenvolupada.

## 4. Escanejabilitat Visual a Salts de Vista (6 a 8 Paraules en Negreta per Paràgraf)
Sóc de Poble està pensat per a lectors que busquen anar al gra mitjançant **lectura a salts de vista (en diagonal)**.
- Dins de cada paràgraf de 4 o 5 línies, és **obligatori marcar entre 6 i 8 paraules clau en negreta** (o una petita frase sintètica en negreta).
- **La norma d'or ergonòmica:** Si el lector només llig les paraules en negreta, saltant d'un paràgraf al següent, ha de poder entendre el missatge complet de tota la pàgina d'un colp d'ull, sense necessitat de consumir la morralla conjuntiva.

## 5. Deure d'Avís i Auto-Correcció
Si detectes text poc llegible, títols cridaners en majúscules o llistes llargues que haurien de ser H3, cita la superfície i el defecte. Corregix-lo quan entre en l'encàrrec autoritzat; fora d'abast, registra'l. Els canvis visuals respecten el pla aprovat i la Llei del Píxel de [[sdp-workflow/SKILL|sdp-workflow]].

## Vincles
- [[00_INDEX_SKILLS]]
