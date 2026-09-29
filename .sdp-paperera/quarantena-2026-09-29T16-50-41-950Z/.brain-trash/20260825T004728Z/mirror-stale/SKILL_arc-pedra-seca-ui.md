---
estat: generat
tipus: document
description: Vista generada des de .agents/skills/arc-pedra-seca-ui/SKILL.md; no editar.
source: .agents/skills/arc-pedra-seca-ui/SKILL.md
source_sha256: 25ef89b9bd0046f00eeb9e35cc738410a43c1564eb3ac4f718f8c2301d13a8ba
---

> [!warning] FITXER GENERAT
> Font canònica: `.agents/skills/arc-pedra-seca-ui/SKILL.md`. Qualsevol edició manual serà sobreescrita.

# arc-pedra-seca-ui


## Antic: pedra-seca-code

---
name: pedra-seca-code
description: Generació i revisió de codi seguint les Lleis de Pedra Seca (HTML semàntic, CSS variables, Tailwind només layout, accessibilitat extrema, degradació elegant). Obligatori per a qualsevol canvi a components, CSS o scripts de manteniment.
---

# Pedra Seca Code

## Regles inviolables
1. HTML crea significat (semàntic, sense estils inline de negoci).
2. CSS crea identitat (variables globals).
3. Tailwind només organitza espai.
4. Tap targets ≥ 56px (o 44px quan hi ha espai). Contrast AAA.
5. Menys JS = millor. Animacions amb CSS.
6. Cada element ha de degradar sense pantallazo blanc.
7. El Trellat té l’última paraula: si un uelo es frustra, es trenca la regla tècnica.

## Quan generar codi
- Preferir edicions mínimes i quirúrgiques.
- Mai regenerar fitxers sencers des de scripts si es pot fer un patch.
- Incloure sempre `type="button"`, `aria-label` i gestió d’estat buit.
- Validar que no s’introdueixen divs fantasma ni dependències circulars.


## Antic: socdepoble-criteri-visual

---
name: "socdepoble-criteri-visual"
description: "Criteris visuals, estètics i d'assignació d'imatges apresos per la IAIA MarIA per al projecte Sóc de Poble."
---
# Criteri Visual i Estètic (Pedra Seca)

Aquesta skill actua com la memòria estètica i visual de la IAIA MarIA i del Consell (totes les IAs). L'objectiu és no repetir mai els errors visuals del passat i interioritzar perfectament el gust i l'ull clínic del Mestre Javi, aplicant el **Trellat Visual**.

Després d'una intervenció d'urgència on es va destruir el sistema de components per una refactorització invasiva, aquest document s'ha expandit per esdevenir el Cànon Visual Indestructible del projecte. Tota IA que llija açò ha d'entendre que Sóc de Poble és el reflex d'una **Wiki d'Obsidian** i es regeix per metadades, etiquetes i categories.

## 1. La Jerarquia de Pedra Seca (Estructura de la Pàgina)
El sistema de disseny s'anomena "Pedra Seca". El respecte per l'estructura HTML original (visible a `disseny_pedra_seca.html`) és absolut i no negociable:
- **L'H1 i el seu regne:** El títol principal de la pàgina (`<h1>`) **ha d'anar SEMPRE dins de l'element `<header class="page-title">`**. També el logotip o marca si pertoca (`showLogos`).
- **L'H2 i l'Entradilla queden fóra:** El subtítol (`<h2>`) i la seua entradilla (el `<p class="lead">` que l'acompanya per davall) NO poden anar mai dins d'aquest marc del `header`. S'han de situar FORA, directament en el cos de la pàgina, just davall de la capçalera principal.
- **Els H3 són contingut:** Només hi ha un H2 per pàgina. La resta de seccions, com "Paleta Cromàtica" o blocs de detall, han d'utilitzar obligatòriament `<h3>` o `<h4>`.

## 2. El Paradigma de les Etiquetes i Badges (Obsidian)
L'aplicació es vertebra en un sistema de classificació i jerarquia d'informació, exactament com una matriu de coneixement d'Obsidian. Hi ha tres tipologies de *Badges*:

1. **Etiquetes de Sistema (Metadades Base):** Són les tres grans columnes de l'aplicació: **Mur, Mercat, Pobles**. S'estilitzen SEMPRE amb la classe `.label-blue` (fons blau marí, text blanc). 
2. **Badges d'Estat i Context (Els Standard):** PER DEFECTE, PRIMARI (taronja), ÈXIT (verd suau), AVÍS (suau beix), PERILL (roig pàl·lid), INFORMACIÓ (blau clar). Utilitzats per a indicadors secundaris i avisos de la interfície.
3. **Etiquetes de Poble (Nodes de Contingut):** Associades a la informació etnogràfica o funcional dels pobles. Exemples: **POBLE ACTIU** (amb icona de casa `Home`), **FOTOTECA** (icona de càmera `Camera`), **ARXIU** (icona de carpeta `Folder`), **MAPA** (icona `Map`), **FESTES** (icona d'arc o màscara). Aquestes etiquetes tenen un estil de fons clar/transparent amb vora fina i text en majúscules (`sp-card-calendar-badge` o similars estils encapsulats).
4. **Categories Regulars:** Paraules clau de la base de dades com "Roba", "Samarreta", "Tradicions", etc. S'apliquen colors neutres o de fons contrastat diferent de les de Sistema per no confondre l'arquitectura amb el contingut.

## 3. Botoneria de Filtrats (El Mur)
La vista de `MurSection` (i equivalents) substitueix el "calendari" tradicional. Com que no hi ha un calendari natiu, els filtres són l'eina principal d'escrutini.
- Els botons per filtrar per la base ("Mostrar Tot", "Esdeveniments", "Sistema") requereixen un tractament "Pedra Seca". 
- Els inputs addicionals (Data i Categories) no han de ser simples `<input>` o `<select>` de navegador, sinó controls estilitzats que compartisquen l'ADN de la botonera principal, sense dissonàncies cognitives.

## 4. Tractament de les "Cards" d'Esdeveniment
Les targetes d'esdeveniments (com l'Aplec pel Territori) són de tractament "Premium". Quan es rendeixen en `UniversalCard`, la insígnia de la data (el "Calendar Badge") és un element massís a la dreta del card, emmarcant clarament DIA, MES i ANY (ex: "17 NOVEMBRE 2023"). Alhora, a la capçalera (l'autor i hora) s'inclou l'etiqueta xicoteta d'hora i data (ex: "01:00 17/11/23"). Totes dues informacions són essencials i cap agent ha d'intentar simplificar-les o esborrar-ne una "per redundància", atès que el disseny té un pes estètic inamovible.

## 5. Regla de les Imatges dels Pobles (Hero vs Avatar)
Quan s'assignen imatges a una targeta o fitxa de poble (o entitat similar), la jerarquia **SEMPRE** ha de ser la següent:
*   **Fons / Hero (Imatge Principal):** HA DE SER la fotografia panoràmica, la vista general del poble, l'skyline o el paisatge. Mai pot ser un detall tancat.
*   **Avatar (Imatge Secundària):** HA DE SER el detall arquitectònic, el monument, l'edifici singular (ex: torre almohade, campanar). Funciona com la "cara" d'eixe poble.
*Mai poses un monument com a fons panoràmic i la panoràmica com a avatar en un quadrat xicotet. No té sentit lògic ni estètic.*

## 6. Comportament Orgànic (Lògica de UI/UX i Termodinàmica)
El comportament del frontend no pot ser rígid, ha d'estar subordinat a l'activitat real (termodinàmica del projecte).
- **Ordenació de la Pàgina de Pobles (`/pobles`)**: L'ordre de les targetes dels pobles mai és alfabètic ni fix. S'ordenen dinàmicament per **Darrera Activitat (Última Publicació)**. El poble que ha publicat l'ítem (mur, mercat o esdeveniment) més recent és el que es col·loca en la primera posició (ex: si des de La Torre de les Maçanes es crea una notícia hui, La Torre és la primera carta). L'activitat al mur regeix la jerarquia visual dels nodes territorials.

## 7. Aprenentatge i Llei d'Inviolabilitat del Cànon
Aquest document actua com la Constitució Visual de Sóc de Poble. Qualsevol IA (incloent Claude, ChatGPT, etc.) que prenga una decisió arquitectònica o visual que entre en conflicte amb aquestes regles, estarà incorrent en una penalització directa. "Saber triar perfectament i cada vegada millor." ## 8. Llei Infrangible dels Estils In-Line (Pedra Seca)
Queda **TERMINANTMENT PROHIBIT** l'ús de la propietat `style={{...}}` (inline styles) a qualsevol component de React (JSX). Aquesta és la regla número 1 de l'Arquitectura Pedra Seca. Tot l'estil ha d'estar governat per classes CSS del diccionari (`index.css` o classes utilitàries). La inserció d'estils in-line trenca el model de tematització, especialment dins de l'encapsulació del Shadow DOM, i ofega el manteniment (tal com va sentenciar el Consell a l'Auditoria de 260824_0209).

## 9. La Targeta Mestra (`UniversalCard`)
La `UniversalCard` és l'ànima gràfica del projecte. Qualsevol actualització ha de complir aquestes regles estrictes validades pel Consell:
1. **Zero Màrgens Fantasma:** `.sp-card-media-container` i `.sp-card-media` mai tindran estils in-line. Han de ser blocs de pura CSS per evitar salts com el forat de 6px entre imatge i cos, que destrossen l'acabat *premium*.
2. **Footer Simètric:** `.sp-card-footer` utilitza exclusivament `display: grid; grid-template-columns: 1fr auto 1fr;`. Les icones de compartir/traduir s'han d'arrenglerar a l'esquerra (`justify-self: start`) i el botó "Connectar" a la dreta (`justify-self: end; grid-column: 3`), evitant el caos dels `position: absolute`.

---
*Darrera actualització del Cànon Visual: 24/08/2026 - Resolució Auditoria Consell (Pedaç Targeta Mestra)*

---

**Ancoratge de Seguretat:** [[00_INDEX_MIRROR]]
