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
---
# Tractor de Llegibilitat i Flux de Text (Pedra Seca)

Aquest tractor vigila que tot text inserit al sistema complisca les regles innegociables d'accessibilitat, jerarquia i flux natural per a la gent del poble.

## 1. Flux Lliure del Text (Zero "Capar")
No es pot limitar artificialment l'amplada del text (evitar contenidors que tallen el text a poc més de mitja pàgina). El text ha de **fluir de forma natural ocupant l'espai disponible**, adaptant-se fins al final, respectant únicament els marges generals del sistema de Pedra Seca. Zero caixes estretes innecessàries.

## 2. Jerarquia Semàntica Rigorosa (H1 - H6)
Tot document o pàgina ha de tindre una jerarquia clara:
- **H1:** Només pot haver-hi un `<h1>` principal per pàgina, i el logotip de Sóc de Poble ha de precedir-lo (activant `showLogos={true}` on calga).
- **H2 - H6:** S'han d'utilitzar `<h2>`, `<h3>`, `<h4>`, `<h5>` i `<h6>` per a estructurar els apartats, sense saltar-se nivells. Aquesta és la clau per a un bon mapa de lectura.

## 3. Escanejabilitat Visual (Llegir d'un colp d'ull)
Sóc de Poble està pensat per a lectors que busquen anar al gra.
- S'han d'utilitzar **negretes** (`<strong>` en HTML o `**` en Markdown) per a ressaltar les accions i els conceptes clau.
- **La norma d'or:** Si el lector només llig les paraules en negreta (saltant sobre elles), ha de poder entendre el missatge principal "d'un colp d'ull" sense haver de llegir la morralla sintàctica.

## 4. Deure d'Avís i Auto-Correcció
Si, mentre inspecciones una pàgina, detectes un text pla (sense ressaltar), una falta d'encapçalaments (falten H2, H3...) o un text capat que no fluïx, **has d'avisar immediatament o aplicar tu mateix la correcció** sota el paraigua d'aquest tractor.
