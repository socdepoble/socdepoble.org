---
type: document
status: esborrany
description: "Pla d'Implementació per al sanejament de la Consola Termodinàmica i millores visuals."
tags: [arquitectura, ux, manteniment]
---
# Pla d'Implementació: Sanejament i Millores de UX a la Consola

## Objectiu
Aquest pla recull el deute tècnic pendent (tasques d'higiene de skills) i introdueix diverses millores d'experiència d'usuari i disseny a la Consola Termodinàmica i l'Explorador del Cervell.

## Tasques (T1-T5)

### T1: Sanejament d'Orfes i Segell
Cal corregir els deutes de les skills que estan marcades en roig a l'Inventari de skills i completar la configuració que vas demanar al tancament anterior.
1. **Fluxos de treball declarats**: Afegeix el camp `contracte.llig` al frontmatter de les skills inferides per la prosa (`core-memoria-historica`, `sdp-calendari-agricola`, `sdp-casos-us-essencials`, `sdp-workflow`).
2. **Skills orfes**: Resol l'estat d'orfe i els avisos de `core-neteja-brossa` i `core-telemetria-huma` afegint-les a l'índex principal i assegurant que el seu frontmatter siga vàlid (comprova els camps `type` i `status`).
3. **Reconciliació de Segell**: Executa els scripts escaients (ex: `npm run porta:segella:update`) per aplicar la reconciliació al Segell de Seguretat i deixar la Consola totalment en verd. Assegura't de sol·licitar un `lease` si els hooks et bloquegen l'escriptura d'aquests segells o del tancament de sessió.
4. **Package.json**: Afegeix les bateries de tests noves al `test:node` que vas programar en la sessió anterior.

### T2: Dashboard Visual a la Taula de Continguts
Volem aprofitar l'índex lateral de navegació (`TableOfContents`) perquè mostre les mètriques principals de cada targeta de la Consola Termodinàmica.
1. A les targetes de la Consola (per exemple "El pols del cervell"), busca la línia on s'agrupen les mètriques (p. ex. `0 registres de consum · 38 rebuts · 24 skills (0 orfes)`).
2. Converteix aquesta línia de text pla en línies separades, centrades, i embolicades cadascuna en una etiqueta `<h5>` perquè el component de la Taula de Continguts les detecte automàticament. Ex:
   ```html
   <h5 className="text-center">0 registres de consum</h5>
   <h5 className="text-center">38 rebuts</h5>
   <h5 className="text-center">24 skills (0 orfes)</h5>
   ```
3. Modifica la configuració del component de la Taula de Continguts (el parser de React/Markdown de la Wiki) perquè rastrege i mostre els encapçalaments fins al nivell `<h6>` (actualment només arriba fins a `<h4>`).

### T3: Reorganització Layout Explorador del Cervell
Actualment, el graf interactiu de l'Explorador del Cervell apareix abans que les explicacions i llegendes, la qual cosa dificulta l'scroll vertical i l'experiència d'usuari.
1. Reorganitza la pàgina de l'Explorador perquè **tots els textos explicatius, filtres i controls queden a la part superior**.
2. Desplaça el contenidor del **graf interactiu a la part inferior (al final del tot)** de la pàgina.

### T4: Redisseny UI de l'Explorador (Pedra Seca)
El disseny de l'Explorador (especialment el panell lateral amb els detalls de la peça seleccionada) està a mig fer i no reflecteix el llenguatge de disseny oficial del sistema.
1. Aplica el sistema de disseny visual "Pedra Seca" a la interfície de l'Explorador del Cervell.
2. Millora substancialment el panell de detalls del node seleccionat (ex: quan se selecciona `build_skills_index.mjs`) perquè s'entenga millor què significa cada dada i estiga visualment integrat amb la identitat de Sóc de Poble.
3. Fes que siga intuïtiu i evident per a l'usuari **com fer clic en l'arxiu per a obrir-lo o veure'l** (actualment la interacció és confusa).

### T5: Incidència Gravíssima (Tractor d'Higiene Trencat)
Durant la preparació d'aquest torn hem detectat que l'Escriptori es trobava brut, amb documents històrics i de la sessió anterior. El tractor cognitiu que obliga a netejar l'Escriptori abans d'iniciar noves tasques o petorretes (`core-higiene-escriptori`) **no s'ha activat ni ha funcionat**.
1. Identifica per què el sistema no exigeix la neteja automàtica de l'Escriptori durant la creació d'aquest Prompt. (Hi ha potser una contradicció normativa entre AGENTS.md i la skill, o manca una trucada?).
2. Aplica la correcció pertinent per a reparar i blindar aquest mecanisme d'higiene.

### T6: Calendari al Mur (Integració d'Agenda)
El Mur ja disposa d'un component de pestanyes ("Mostrar tot", "Mercat", "Agenda", "Mapa"). 
1. Quan l'usuari seleccione la pestanya "Agenda" al Mur, aprofita i renderitza exactament el mateix component interactiu del Calendari que ja tens construït a la Consola. Reaprofita el component (posant el calendari i baix les targetes associades) de manera modular.
2. Comprova que el disseny s'integra correctament amb la resta d'elements del Mur.

### T7: Refinament Visual (Píndoles del Calendari i Línies Fines)
L'estètica actual del Calendari necessita polir-se perquè estiga a l'altura de Pedra Seca.
1. **Píndoles de tasques**: Assegura't que les píndoles d'estat (amb els noms de les tasques i el seu estat de vida) dins de cada dia del calendari tinguen una amplària uniforme i atractiva (no han de tindre mides irregulars o inconsistents com passa ara).
2. **Línies més fines**: Suavitza o refina les vores o línies negres "a l'engròs" (com les dels bordes de les taules o de la graella del calendari). Usa un traç (border) molt més subtil, fi i elegant d'acord amb el sistema visual.

### T8: Preparació Arquitectònica per a Google Calendar
El Mestre depèn 100% de Google Calendar en el seu flux de treball diari. És un requisit innegociable que en el futur aquest calendari puga sincronitzar-se bidireccionalment o consumir esdeveniments des de GCal.
1. Assegura't que l'estructura de dades o el disseny del component actual siguen compatibles o fàcilment adaptables a un estàndard que suporte importació/exportació (com events amb dates clares d'inici/fi, etc.). 
2. No cal que implementes la connexió a la API ara mateix, però deixa el codi preparat i net perquè la integració posterior no supose reescriure el component des de zero.

### T9: Usabilitat (Eliminar Scrolls Interns)
Un "scroll dins d'un scroll" (com el que ocorre a les taules de l'Inventari de Skills) resulta letal per a la usabilitat i frustra a l'usuari.
1. Elimina completament qualsevol contenidor amb `overflow` o barra de desplaçament vertical interna que limite l'alçada de les taules a tota la Consola.
2. Deixa que les taules s'expandeixquen amb tota la seua altura natural. Si són molt llargues, que ocupen l'espai que necessiten i que l'usuari puga fer servir únicament el scroll principal de la pàgina.

### T10: Inclusió de Codex (ChatGPT) als Agents Atòmics
A la pestanya "Agents atòmics", la secció "Els que conversen" només mostra Antigravity i Claude Code, deixant fora a ChatGPT (Codex). Ahir mateix es va fer una auditoria amb Codex, i en farem més.
1. Afegeix un botó/targeta a la Consola per a la IA Codex.
2. Com que el compilador actualment no llig `.agents/consell.json` ni la configuració de Codex (per això no apareix), soluciona aquest bloqueig o afegeix el suport perquè la Consola l'entenga com a agent actiu i mostri els seus documents carregats en arrencar.

### T11: Unificació d'Enllaços i Navegació
Alguns enllaços o rutes (com "Avisos i salut") semblen estar duplicats o s'hi accedeix des de múltiples llocs de manera potencialment confusa.
1. Revisa l'estructura de navegació i crea un únic camí d'accés lògic i clar per a cada secció de la Consola.
2. Elimina les duplicitats innecessàries per evitar desorientar l'usuari.

### T12: Millores i Noves Mètriques (Vigilància Constant)
El sistema requereix una automejora i vigilància contínua. El Mestre vol dotar el sistema de millors eines d'observabilitat.
1. Avalua si calen mètriques addicionals a la Consola que ens ajuden a mesurar la salut del sistema, l'eficiència dels agents o la integritat del codi.
2. Si trobes mètriques útils que falten, implementa-les o deixa l'estructura feta per recollir-les. Proposa mecanismes o solucions tècniques per posar els mitjans que garantisquen aquesta "vigilància constant".
