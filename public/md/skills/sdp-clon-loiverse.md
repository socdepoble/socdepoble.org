---
type: skill
status: actiu
name: sdp-clon-loiverse
description: Directriu arquitectònica i visual obligatòria per a desenvolupar el TPV (Mode Bar i Mode Rebost). Cal calcar la interfície de Loiverse al mil·límetre.
triggers_on:
  - loiverse
  - punt de venda
  - mode bar
  - mode rebost
  - llista de la compra
contracte.llig:
  - .agents/skills/sdp-pedra-seca/SKILL.md
  - src/data/backendPort.js
contracte.escriu:
  - src/data/backendPort.js
---

# Clonació Visual de Loiverse (El TPV Universal)

Esta skill fixa el referent visual del TPV i dels modes Bar/Rebost/Llista de la Compra quan formen part d'eixe encàrrec. No convertix qualsevol fitxa de producte o publicació del Mercat en un TPV ni sobreescriu el contracte d'`UniversalPage`.

## 1. Calcar al mil·límetre
La instrucció del Mestre és innegociable: **La interfície ha de ser un clon exacte de Loiverse.**
S'han d'estudiar les captures de pantalla proporcionades pel Mestre (disponibles a `01_produccio` o pujades al xat) i calcar la disposició:
- **Espai optimitzat:** Es veu més que es llig. L'optimització de l'espai en pantalla és fonamental.
- **Predomini de la imatge:** Cada producte ha de tindre la seua imatge ben visible en una graella clara i clicable.
- **Sidebar fosc i àrea de tiquets:** S'ha de respectar la barra lateral fosca de navegació i l'àrea blanca de "Tiquets oberts" / "Comanda" a l'esquerra de la graella de productes.

## 2. Reutilització Modular (Un sol component)
Tot i que els casos d'ús siguen diferents (un TPV de bar on es cobra, o una llista de la compra on s'afigen productes per a comprar), **la interfície gràfica serà la mateixa**.
S'utilitzarà el component "TPV Loiverse" com a patró de disseny base, canviant només la lògica dels botons segons el domini (ex: `Afegir a la cistella` vs `Cobrar`).

## 3. Filosofia de les Imatges i la Nano Banana
Per al sistema en producció pública, no es poden utilitzar les imatges "robades" d'internet (amb drets d'autor) que hi ha al Loiverse original de la Parròquia.
L'Estratègia és:
1. El prototip restringit necessita autenticació i permisos de servidor/RLS comprovats. Un botó ocult o una ruta de UI no demostren privacitat; no afirmes que ja és privat sense comprovar la font de dades i els actius servits.
2. Per a publicar imatges, usa recursos propis o amb una llicència adequada i conserva'n la procedència. La generació per IA no acredita per si sola que una recreació estiga lliure de drets; no copies automàticament logotips o fotografies de referència.
3. Conserva els noms necessaris per identificar els productes segons l'encàrrec, sense presentar esta skill com una autorització jurídica d'ús comercial. Si hi ha drets sense aclarir, registra el pendent abans de publicar el recurs.

## Cobertura i límits

La captura autoritzada és el referent del layout, no un component executable. Inspecciona els mòduls existents abans d'afirmar que hi ha un únic TPV reutilitzable. `design_guard.mjs` i `tractor-tokens.mjs` contrasten regles parcials del disseny, no igualtat visual amb Loiverse, cobraments ni llicències d'imatges. Valida el flux implementat amb dades de prova i revisió visual.

## Obligació de l'Agent
Qualsevol agent assignat a crear el mòdul de "Menjar i Beure", "Rebost" o "Llista de la Compra" ha de llegir obligatòriament aquesta skill i aplicar-la per a dissenyar el frontend en React. No inventes una UI nova; copia Loiverse.

## Vincles
- [[00_INDEX_SKILLS]]
