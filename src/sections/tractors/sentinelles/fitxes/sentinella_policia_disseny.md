# Sentinella «Policia del Disseny»

**Identificador:** `sentinella.policia-disseny` · **Versió:** 1.0.0 · **Nivell:** L0 · **Dades personals:** no · **Xarxa:** cap

## Què fa, en una frase

Revisa el codi que li passes (JSX, JS, HTML i CSS) amb les lleis de Pedra Seca i de l'App Grid Shell i n'assenyala les infraccions abans del commit.

## Disparador

- **Al pre-commit:** la prova `policiaDisseny.porta.test.js` la fa córrer sobre `src/apps` i `src/utils`, al costat de `design_guard`. Una bandera roja para el commit.
- **A mà:** des del panell de Sentinelles, amb els fitxers que tries.

## Les regles

**Bandera roja** (fallen abans del commit):

- Estil en línia (`style=`): Pedra Seca només admet classes del sistema. Al JS i al JSX només compta l'atribut d'una etiqueta JSX: l'XML o l'HTML escrit en una cadena o en una plantilla i una variable que es diu `style` no ho són.
- `:has()`: és fora del Baseline 2022.
- Colors crus (hexadecimal, `rgb`, `hsl`) fora dels blocs on es definixen els tokens. Un bloc és de tokens quan el seu subjecte és `:root`, `:host` o `.sdp-root`; dins d'un `@media` de tema, una regla de component no n'és.
- Tokens primitius (`--sdp-pedra-*`, `--sdp-primary-*`…) dins d'un component.
- Un control (botó, enllaç, camp) per davall de `--sdp-touch`. Els seus pseudoelements (`::after`, `::before`) no són el control, i les longituds dins de `calc()`, `min()`, `max()` o `clamp()` no es comparen.

**Bandera groga:**

- Marges, farciments i separacions fora de l'escala de 0.25rem.
- Un títol h1 o h2 que acaba amb punt final.
- Ombres sense token `--sdp-ombra-*` i radis sense l'escala `--sdp-radi-*`.
- Més d'una closca `AppGridShell` en un mateix fitxer.

## Què llig

- Els fitxers de codi que tries, com a text.

## Què escriu

- Res. No corregix cap fitxer.

## Porta humana

Assenyala les infraccions. Corregir-les és un canvi de codi que revisa i aprova el Mestre: per la Llei del Píxel, el que ja existix s'ha de continuar veient igual.

## L'aprovació

No tracta dades personals: s'aprova amb la confirmació escrita de l'empremta curta (o amb la signatura). Caduca als 90 dies.
