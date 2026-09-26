---
type: document
status: canonic
description: "Defineix el Trellat com a prudència verificable: simplicitat, accessibilitat, honestedat de xarxa, reversibilitat i evidència abans d'afirmar."
tags:
  - saber
---
# El Trellat — patró de disseny rústic

Trellat és saviesa pràctica: buscar la solució útil sense complicar la vida de
les persones ni inventar garanties que el sistema encara no pot provar.

## Regles de ferro

1. **Complexitat justificada:** dins de la carcassa React/Vite actual, preferix
   la peça més simple que resolga el cas i evita capes o dependències gratuïtes.
2. **Accessibilitat de Pedra Seca:** text llegible, focus visible, semàntica i
   objectius tàctils adequats. Cap control fa menys de `--sdp-touch` (44 px;
   48 px amb `--sdp-touch-comode`) i el text de lectura no baixa de 16 px; són
   mínims que cal comprovar en la interfície real.
3. **Honestedat de xarxa:** l'arquitectura és online-first
   ([[ADR-2026-08-ONLINE-FIRST]]). Quan la xarxa falla, la interfície ho diu
   clar en lloc de prometre sincronitzacions que no existixen. CRDT, Y.js o
   WebRTC són recerca, no un fet.
4. **Esporgar amb reversibilitat:** cap neteja massiva sense pla, Reflex, backup,
   CAS, verificació i restauració.
5. **Evidència abans d'adjectius:** “perfecte”, “blindat”, “autònom” o “100%”
   exigixen scope, denominador, prova i data.

## Test abans de proposar

1. Quin problema humà resol i quina és la peça mínima?
2. Què passa amb dispositius modestos, poca memòria i inestabilitat de xarxa?
3. Quina evidència existix i què continua sent una hipòtesi?
4. Com es detecta una fallada i com es torna arrere?
5. Una altra persona o agent podrà localitzar l'autoritat sense carregar tota
   la Wiki?

Trellat no obliga a reescriure React en Vanilla per principi. Obliga a mesurar
el cost, conservar la frontera del projecte i evitar que la ferramenta es
convertisca en dogma.

## Vincles

- [[00_index]]
- [[00_visio_i_pilars]]
- [[02_genotip]]
- [[ADR-2026-08-ONLINE-FIRST]]
