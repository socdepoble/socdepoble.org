---
type: plantilla
status: canonic
description: "Plantilla v2.1.0 de Prompts per a Nano Banana i generadors visuals: Estil Còmic Bruguera / Ibáñez Valencianitzat, Traç Artesanal Imperfecte de Tebeo Clàssic, 1:1 Quadrat i 100% A Sang."
tags:
  - maquina
  - disseny
---

# Plantilla: Prompt Visual de Sóc de Poble (Nano Banana · v2.1.0 · ADN Ibáñez / TBO Valencià Artesanal)

Aquesta plantilla s'ha d'utilitzar SEMPRE que es demane una nova vinyeta o il·lustració per a una pàgina, eina o secció de **Sóc de Poble**. L'objectiu és mantindre una **coherència gràfica d'estil TBO / Francisco Ibáñez (*Mortadelo i Filemón*, *13 Rue del Percebe*, *Pepe Gotera i Otilio*) traslladat a un poble valencià**, fugint de la perfecció digital estèril per recuperar el **traç humà, espontani i lleugerament imperfecte del tebeo clàssic en paper**, amb format quadrat i estrictament **a sang (zero marcs blancs)**.

## 1. Anatomia de l'Estil Visual (ADN Ibáñez + Poble Valencià + Imperfecció de Tebeo)

1. **Fisonomia i Expressivitat Caricaturesca («Escola Bruguera / Ibáñez»):**
   - **Nares prominents i còmiques** (nas redó de creïlla o allargat d'embut), **ulls grans ovals blancs juntets** amb pupil·les negres molt expressives, i **celles negres gruixudes** (que fins i tot suren un poc per damunt del front quan hi ha sorpresa o esforç).
   - **Cares simpàtiques, vives i plenes de bon humor («gamberro però entranyable»)**: Fugir tant de la il·lustració infantil bleda com de cares sinistres o grotesques.
   - **Cinètica i Slapstick**: Personatges en moviment real (peus despegats de terra en córrer o botar, gotetes de suor volant, núvols de pols, molles i cargols botant pels aires, línies de moviment fetes a mà alçada).
2. **Traç Artesanal i Imperfecte («Anti-Perfecció Digital / Efecte Paper Bruguera»):**
   - Els dibuixos clàssics de *Mortadelo i Filemón* **no eren vectorials ni tenien una perfecció quirúrgica**. Eren dibuixos ràpids, vius i fets a mà sobre paper per a impremta rotativa.
   - Exigir sempre un **traç de plumilla solt, espontani, orgànic i lleugerament imperfecte** (*loose, sketchy, slightly imperfect hand-drawn dip-pen ink lines with organic human wobble and spontaneous brush-tip variations*), amb **lleugers rastres d'esbós a llapis blau/grafit davall de la tinta**, **gra de paper de tebeo antic (newsprint texture)** i una subtil **imperfecció d'impremta de l'Editorial Bruguera dels anys 70-80** (colors plans de gouache que de vegades es desvien mitja mil·límetre de la línia negra, sense degradats digitals ni brillantors perfectes d'IA).
3. **Gags Secundaris als Cantons («Efecte 13 Rue del Percebe Rural»):**
   - Tota escena ha d'incloure 2 o 3 micro-gags divertits de fons: un gat mirant amb lupa un engranatge, una gallina picotejant un teclat o un interruptor, un ratolí amb boina llegint un plànol, un caragol amb casc d'obra pujant per un mur de pedra seca, o un ruc traient el cap per una finestra amb cara de savi.
4. **Arquetips Recurrents de Sóc de Poble (Personatges 100% originals):**
   - **La IAIA MarIA:** Iaia valenciana amb mocador al cap, ulleres redones, davantal tradicional i un somriure ple de trellat, governant pantalles, palanques o tauletes connectades a cànters i murs de pedra seca.
   - **Els Apanyadors del Poble (estil *Pepe Gotera* valencià):** Veïns i llauradors amb boina, faixa roja o blava, camisa arromangada o granota d'obra, portant claus angleses gegants, pinzells, plànols o cabassos.
5. **100% A SANG (ZERO MARCS BLANCS) i Format Quadrat (`1:1`):**
   - **PROHIBIT usar al prompt les paraules `"comic panel"`, `"comic page"`, `"cover"`, `"frame"` o `"border"`** en positiu, perquè indueixen el model a pintar un marc blanc i una vora negra.
   - Exigir sempre que el cel, les parets de pedra seca i el terra arriben fins al mateix tall dels 4 costats del llenç (`100% full-bleed edge-to-edge, zero white margins, zero panel borders, zero corner signatures`).
6. **Valencià Castís i Curt en Rètols i Bafarades («Valencià Tá!»):**
   - Les bafarades i cartells han d'usar **paraules curtes, exactes i en MAJÚSCULES de còmic feta a mà** en valencià per evitar que el generador invente lletres: ex. `«XE, QUIN TRELLAT!»`, `«AÇÒ VA DE CATEGORIA!»`, `«NOVETATS»`, `«MILLORAT»`, `«CORREGIT»`, `«v1.1.10»`.
   - **PROHIBIT el signe d'exclamació/interrogació d'obertura castellà (`¡` / `¿`) i onomatopeies flotants en castellà (`¡AYYY!`, `¡CHOFF!`):** En valencià només s'escriu el signe de tancament (`!` / `?`), i es prohibeix afegir text o onomatopeies soltes per les parets que no s'hagen demanat explícitament al prompt.

## 2. Plantilla Mestra del Prompt (Copia i ompli per a Nano Banana)

```text
1:1 SQUARE ASPECT RATIO. 100% FULL-BLEED EDGE-TO-EDGE ILLUSTRATION (the sky, stone walls, and cobbled ground MUST touch all four raw edges of the canvas with ZERO white margins, ZERO white borders, ZERO black panel frames, and ZERO corner signatures).

ART STYLE & IMPERFECT HAND-DRAWN LINEWORK: Authentic 1970s-1980s Editorial Bruguera Spanish humorous tebeo art in the exact tradition of Francisco Ibáñez (Mortadelo y Filemón, 13 Rue del Percebe, Pepe Gotera y Otilio), featuring 100% original Valencian village characters. Crucially, AVOID sterile digital perfection or clean vector lines: use loose, spontaneous, slightly imperfect hand-drawn dip-pen black ink lines with natural human wobble, expressive quick ink strokes, subtle visible pencil sketch traces underneath, manual crosshatching on rustic dry-stone walls, and flat vintage gouache/watercolor washes on warm grainy newsprint paper with slight retro print color misregistration. Raw, lively, handmade comic strip charm—never over-polished AI, never glossy, never 3D.

CHARACTER ANATOMY: Classic Ibáñez caricature proportions—expressive big round or bulbous potato noses, large oval white eyes set close together with lively black pupils, thick floating black eyebrows, dynamic poses with hand-drawn motion lines, sweat drops, and friendly, hilarious expressions.

SCENE (CENTERED): [Descripció de l'escena central i el tema de la pàgina].

BACKGROUND & SIDE GAGS (13 RUE DEL PERCEBE VIBE): Set in a sunny Valencian mountain village with dry-stone walls (pedra seca), terracotta roofs, and orange trees. Include funny background visual gags: [2-3 micro-gags: ex. un gat amb ulleres dalt d'un cànter, una gallina picotejant un botó, un caragol amb casc d'obra].

HAND-LETTERED TEXT (STRICTLY IN VALENCIAN, ALL CAPS COMIC FONT):
- Signboard / Labels: "[RÈTOL CURT EN VALENCIÀ]"
- Speech bubbles: "[EXCLAMACIÓ CURTA EN VALENCIÀ SENSE SIGNE INICIAL, ex. XE, QUIN TRELLAT!]"
- NO floating sound effects or unrequested text on walls.

CRITICAL NEGATIVE CONSTRAINTS: NO over-polished digital perfection, NO clean vector art, NO glossy 3D shading, NO white borders, NO white margins, NO picture frame, NO comic book page border, NO artist signature in corners, NO Spanish inverted exclamation marks (¡ or ¿), NO floating Spanish sound effects (like ¡PUM! or ¡AYYY!), NO English or Spanish words, NO deformed or gibberish text.
```

## Vincles

- [[00_index_plantilles]]
- [[00_index_actuar]]
