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

## 2. Jerarquia Editorial Canònica (H1 → H2 → Entradeta → H3 → Paràgraf)
Tot document, pantalla o eina de Sóc de Poble segueix un patró editorial estricte sense excepcions ni estils inventats:
- **H1:** Títol principal a la decoració blanca de capçalera (`PageFrame` / `UniversalPage`), acompanyat del logotip de l'entitat damunt si cal, etiquetes, data i categories.
- **H2:** Títol de secció o de bloc funcional (ex: *«Què fa cada tractor, la seua empremta i la teua signatura»*).
- **Entradeta (Lead explicativa):** Text destacat just davall de l'H2 que sintetitza el propòsit essencial del bloc. Mai s'encasta un H3 directament davall d'un H2 sense entradeta ni s'inventen estils estranys.
- **H3:** Subapartat temàtic, porta o mecanisme concret (ex: *«Porta d'aprovació de tractors»*).
- **Paràgraf normal:** Explicació didàctica desenvolupada (ex: *«Els components comuns de l'app no hi entren...»*).
- **Regla Didàctica d'Or:** *«Un paràgraf més mai està de més quan és didàctic.»* Si calen dos o tres paràgrafs per fer-ho entendre clarament a la gent del poble, s'escriuen amb naturalitat.

## 3. Escanejabilitat Visual (Llegir d'un colp d'ull)
Sóc de Poble està pensat per a lectors que busquen anar al gra.
- S'han d'utilitzar **negretes** (`<strong>` en HTML o `**` en Markdown) per a ressaltar les accions i els conceptes clau.
- **La norma d'or:** Si el lector només llig les paraules en negreta (saltant sobre elles), ha de poder entendre el missatge principal "d'un colp d'ull" sense haver de llegir la morralla sintàctica.

## 4. Deure d'Avís i Auto-Correcció
Si, mentre inspecciones una pàgina, detectes un text pla (sense ressaltar), una falta d'encapçalaments (falten H2, H3...) o un text capat que no fluïx, **has d'avisar immediatament o aplicar tu mateix la correcció** sota el paraigua d'aquest tractor.
