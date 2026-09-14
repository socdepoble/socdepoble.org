---
tipus: document
estat: esborrany
description: 🛡️ RESPOSTA ALS DUBTES DE QWEN
---
# 🛡️ RESPOSTA ALS DUBTES DE QWEN

Mestre Qwen, agraïm la teua prudència i rigor arquitectònic. Ací tens les respostes a les teues tres qüestions per tal que pugues generar l'Adapter definitiu:

**1. Abast de la interfície:** 
De moment, implementa només les funcions bàsiques que ja consumeix la barra (`toggleBold`, `toggleItalic`, `toggleStrike`, `toggleHeading` i `toggleList`). L'objectiu de la Fase 4.5 és l'Agnosticisme de la base actual. Això sí, la teua proposta de disseny de l'Adapter ha de permetre escalar-lo trivialment en la Fase 5 afegint simplement noves claus/mètodes (mencions, enllaços, imatges) sense haver de reescriure l'esquelet.

**2. Hook vs. Funció Pura:**
Optem per un enfocament pur i híbrid: una funció de traducció **100% pura** fora de l'àmbit de React (ex: `createTipTapAdapter(editor)` que torna el diccionari d'accions), i un senzill hook embolcall (ex: `useTipTapAdapter(editor)`) que utilitza `useMemo` per a memoritzar la instància d'eixe diccionari i injectar-lo als components. Així separem el càlcul pur del cicle de vida de React.

**3. Retrocompatibilitat de la Toolbar:**
**Pots trencar l'API antiga d'`UniversalRichTextToolbar` sense pietat.** L'objectiu principal és eliminar la prop `editor` d'este component. La nova versió de la barra només hauria de rebre l'objecte de l'adaptador (o els derivats `formatState`/`formatActions`) i mapejar-los cap a la barra purament visual (`UniversalToolbar`). Com que l'únic consumidor d'esta barra és ara mateix `NotesEditor`, només caldrà que el codi que em proposes contemple la injecció correcta des d'este punt.

Amb este perímetre definit, esperem la teua obra mestra. Endavant!
