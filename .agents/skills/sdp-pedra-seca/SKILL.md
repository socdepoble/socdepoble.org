---
type: skill
status: canonic
description: Reglament matemàtic visual Pedra Seca (Alta Definició)
tags:
  - disseny
name: sdp-pedra-seca
triggers_on:
  - disseny
  - estils css
  - interfície
  - pedra
  - seca
  - estil
  - colors
  - components
core: true
contracte.llig:
  - src/css/index.css
  - src/components/layout/AppGridShell.jsx
contracte.escriu:
  - src/css/index.css
  - src/components/layout/AppGridShell.jsx
---
# 🪨 Pedra Seca 2.0: El Reglament Matemàtic

> [!WARNING]
> **ORDRE RESTRICITVA (HIG per a IA):** 
> Aquest document NO és una guia d'estil filosòfica. És un **contracte matemàtic de validació**. Teniu prohibit dissenyar amb adjectius ("prèmium", "modern") o improvisar marges i colors. Cada propietat CSS ha de passar per aquest filtre de principis inquebrantables. Qualsevol al·lucinació estètica serà rebutjada. No busqueu "Pedra Seca" a internet.

## 1. Topologia Infranquejable (La Roca i el Visor)
1. **Llei de Scroll:** L'element arrel (`.sdp-root` i el `body`) MAI fan scroll (`overflow: hidden`). Només la columna activa (el visor) té permís de desbordament. Prohibit manipular el body per a resoldre desbordaments.
2. **Columnes de Base:** 
   - *Sidebar (La Roca):* Fons inmutablement fosc (`--sdp-pedra-900`) amb text (`--sdp-pedra-50`). MAI s'inverteix amb el mode fosc.
   - *Visor (Main App):* Superfície dinàmica.

## 2. Principi de Color (Tokens Semàntics i Prohibicions)
**Prohibició Absoluta:** Mai, sota cap concepte, es pot assignar un codi HEX (`#FFF`), RGB o un token primitiu (`--sdp-pedra-400`) directament a un component.
- **Fons admissibles:**
  - `--sdp-fons-app`: Superfície base del visor.
  - `--sdp-fons-targeta`: Superfície elevada (cards, diàlegs).
  - `--sdp-fons-invers`: Elements de contrast extrem.
- **Textos admissibles:**
  - `--sdp-text-titol`: Només per a `h1`, `h2`, o text de màxima autoritat.
  - `--sdp-text-cos`: LECTURA NORMAL. Tota la UI funcional.
  - `--sdp-text-suau`: Metadata, dates, descripcions complementàries.
- **Accents (La Nova Jerarquia):**
  - `--sdp-accio` (Blau - PRIMARI): És el botó i color d'interacció principal. S'usa per a tot element **interactiu que desencadena accions** (botons principals, píndoles seleccionades/actives, enllaços funcionals). És instintiu per a l'usuari.
  - `--sdp-accent` (Taronja - SECUNDARI): S'utilitza exclusivament per a identitat de marca (caputxes de targetes, logotips) o botons d'interacció secundària/opcional. Mai ha de competir amb l'acció principal.

## 3. L'Escala Matemàtica de l'Espai (Mòduls Reixeta)
L'espai no s'improvisa. Qualsevol regla de `margin`, `padding` o `gap` ha de ser múltiple de `0.25rem` o utilitzar els tokens establits.
- **Micro-espaiat (components interns):** `0.5rem` (8px).
- **Espaiat normal (paddings de targetes, llistes):** `1rem` (16px).
- **Macro-espaiat (separació de seccions):** `2rem` (32px) o `3rem` (48px).
- *Violació Crítica:* Usar valors com `13px`, `0.7rem`, `15px` està estrictament prohibit.

## 4. Estricta Jerarquia Tipogràfica i Lectura (Regles Impeccable)

- **Llei de Capçaleres i Escala Fluida:**
  - Els `h1` pertanyen **exclusivament** a `<header className="page-title">`.
  - Els `h2` van a `div.sdp-text-center` o directament al flux documental (NO dins del títol principal). Mai poden sobrepassar jeràrquicament a l'H1 en mida visual en pantalles mòbils.
  - Per evitar dissenys genèrics i anomalies, utilitzeu funcions `clamp()` per a les capçaleres, assegurant una escala fluida (p. ex., `font-size: clamp(1.2rem, 3vw, 1.8rem);` per a H2) que mantingue proporcions harmòniques en mòbil i web.
  - Els `h1` i `h2` tenen **prohibició estricta** d'acabar amb punt final (`.`).
- **Alçades de Línia (Line Height):** Títols usen `1.2` (compactes). Text de cos usa `1.6` (lectura llarga).

## 5. La Frugalitat Rústica i el Moviment (Regles Kowalski)
Nosaltres som de poble, som Pedra Seca. El *Glassmorphism*, els degradats complexes i les ombres difuminades estaran penalitzats severament. Tot ha de tenir un comportament previsible i d'alta qualitat ("Taste").
- **Micro-interaccions fluides:** Qualsevol element interactiu (botó, targeta clicable) ha de tenir feedback visual ràpid i precís (estats `:hover` i `:active`). Les transicions no han de superar els `200ms-300ms` i usaran funcions d'easing àgils (tipus `ease-out` o `cubic-bezier` precises) per evitar sensació de lentitud.
- **0 Ombres Decoratives:** L'ús de `box-shadow` està prohibit per a finalitats estètiques generals. Només es permet a través dels tokens (`--sdp-ombra-*`) de forma molt continguda i funcional (p. ex. per elevar un menú flotant contextual sobre una llista). Les targetes normals, per defecte, se separen amb vores o color de fons, no amb ombra permanent.
- **Radis de Vora Espectrals:** Només s'admet l'escala de `--sdp-radi-s` fins `--sdp-radi-xl`. Cap component portarà `border-radius: 5px;`.

## 6. Accessibilitat i Motor Tàctil
Sóc de Poble és Mobile/Tablet First tàctil.
- **Àrea d'interacció:** el sòl tàctil vigent és `--sdp-touch` (48px), coherent amb `--sdp-touch-min`; l'alçada d'acció és `--sdp-alt-accio` (58px), a `src/css/tokens.css`. Els botons d'àmbit de «On es publica?» exigixen 58px segons el contracte O4. Reutilitza el token corresponent: el mínim genèric de 48px no rebaixa un contracte específic de 58px.

## 7. Model d'Enxufabilitat Universal (Sense Deute Tècnic)
- Tot component s'ha de dissenyar com un *plugin* que hereta els seus colors de les 3 capes esmentades dalt.
- Si construeixes una `<Card>`, no dependrà mai d'on està ubicada per pintar el seu fons, ni tindrà estils *inline* tipus `style={{ marginTop: 20 }}`.

## 8. L'Enquadrament Simètric (Imatges 1:1)
Sempre que la IA reculla, mostri o demani la generació d'una imatge, la proporció assecurada serà d'aspecte quadrat (`1:1`), llevat que existisca una excepció lògica o d'arquitectura validada. L'àrea visual de Pedra Seca és estrictament proporcional.

## 9. Prototipatge Obligatori abans de Programar (Storybook de Pedra Seca)
L'equivalent a l'Spec-driven per al disseny:
- **Res existeix fins que no està al manual:** Abans d'afegir un component nou a producció, t'has de preguntar: Existix el component a `src/sections/disseny/DesignSection.jsx`?
- **NO POTS PROGRAMAR LA FUNCIÓ:** Si no existix el referent visual allà, tens prohibit programar la funció lògica. Primer dissenyes el component de UI i ho afermes a `DesignSection`. Només quan l'esquelet matemàtic aprova l'auditoria, pots connectar les funcions (APIs).

## 10. La Barra Taronja i el Selector d'Emojis `PaginaEmojis` (regles del Mestre)
- La pastilla de data és sempre present i plena. Lectura: data de creació o de l'última versió si és posterior. Edició: la data triada al calendari o, si no n'hi ha, la d'ara. Mai la data de l'última edició, mai guionets. Una font de només dia es pinta sense hora.
- L'espai central és l'emoticona del document: en edició, sempre un botó (ploma blanca si no n'hi ha cap); en lectura o targeta, buit si no s'ha triat.
- La ploma només vol dir «tria una emoticona». L'autodesament fa servir el núvol (`CloudUpload`).
- **Selector d'Emojis (`PaginaEmojis` — Prohibit `<Dialeg>` Flotant):** En prémer el botó de l'emoticona o la ploma a la Barra Taronja, s'obri sempre la subvista integrada a columna completa **`PaginaEmojis`** (`src/components/universal/classificacio/PaginaEmojis.jsx` i `GraellaEmojis.jsx`) amb un botó prominent **«Tornar»** (com a mínim `--sdp-touch` de diana tàctil) i graella categoritzada Unicode 18. Està terminantment prohibit obrir un `<Dialeg>` flotant per a triar emoticones.
- Totes les icones de la barra són blanques dins del cercle de vel fosc.
- El component pare és `src/components/universal/barres/BarraTaronja.jsx`; PageFrame i els espècimens el munten.

## 11. Identitat Visual (Avatars vs Logotips)
- **Persones i IA (Avatars):** Els usuaris, persones físiques i la IAIA utilitzen OBLIGATÒRIAMENT un avatar redó i gran (300-360 px), mai un logotip corporatiu ni figures abstractes per defecte a les seues fitxes personals.
- **Entitat Oficial:** El logotip complet de "Sóc de Poble" es reserva de forma estricta i exclusiva per a la pàgina corporativa de l'entitat, la capçalera oficial i els actes organitzats per aquesta. Mai s'ha d'utilitzar com a "avatar" o imatge de recurs quan falta la foto d'una persona.

## 12. Tornada arrere lliure de tensió (Pla 261004_2045)

- En mòbil, els menús emergents i calaixos de navegació s'adapten al contingut i tenen un màxim de 300px d'amplària. Han de deixar visible espai tàctil de la vista anterior perquè es puga tancar el menú tocant fora.
- Les etiquetes llargues usen `text-overflow: ellipsis`; el nom complet continua disponible com a nom accessible de l'acció. El truncament visual no elimina la identificació per a lectors de pantalla.
- Este límit s'aplica a menús i calaixos. Una pantalla completa de treball, com l'editor, el visor o `PaginaEmojis`, és legítima quan conserva una eixida o tornada arrere («Tornar» amb diana com a mínim `--sdp-touch`) visible i accessible; no és una prohibició general d'ocupar el 100% de la columna.

## 13. Llei de la Barra Negra Immutable i Safe-Area Natiu (Mobile First)

- **Supremacia i Immutabilitat:** La Barra Negra (`header.bar-black`) és la capçalera suprema de la plataforma i conté la identitat de Sóc de Poble, l'accés d'usuari, la IAIA MarIA i les eines universals. **Està absolutament prohibit ocultar-la** (`display: none` prohibit) o fer que s'esvaïsca en fer scroll. És permanentment sticky/fixa a la part superior de la pantalla.
- **Topologia Natiu i Dynamic Island:** Ha de respectar estrictament el `safe-area-inset-top` d'iOS i Android mitjançant `padding-top: env(safe-area-inset-top, 0px)` i alçada calculada `calc(var(--sdp-alt-negra) + env(safe-area-inset-top, 0px))` amb `box-sizing: border-box`. Els controls (logo, icones) mai xoquen ni queden ocults darrere de la Dynamic Island o la barra d'estat nativa.
- **Jerarquia Vertical:** Totes les subcapçaleres de secció (com la barra de `Converses`, taulers o filtres) se situen necessàriament per davall de la Barra Negra de Sóc de Poble, mai per damunt ni al seu mateix nivell visual.

## Cobertura mecànica i visual

`node tooling/gates/design_guard.mjs` i `node tooling/gates/tractor-tokens.mjs` comproven patrons i tokens segons el seu abast. Les suites de capes i de components contrasten contractes concrets; no certifiquen per si soles la mida renderitzada, el contrast, el focus ni la safe-area en cada mòbil. Revisa també el flux afectat amb teclat i vista mòbil. Els literals d'exemple d'esta skill no autoritzen afegir valors fixos als components.

## Lliçons del Mestre

- **261031** | **Les llistes, sempre més juntes que els paràgrafs**: els ítems (`<li>`) d'una llista `<ul>` o `<ol>` van més junts entre si que els paràgrafs (`<p>`). El ritme el fixa `--sdp-li-gap` (4px, a `src/css/tokens.css`) davant dels 20px de `--sdp-mb-p`, i cap llista de text (amb pics o números) hi suma un `gap` de graella o de flex damunt del marge dels `<li>` (`src/css/base.css`; ho vigila `src/css/llistes.llei.capes.test.js`). Les llistes de components sense marcadors que encara sumen `gap` les ha de decidir el Mestre.
- **261031** | **Un sol motlle per als taulers de xifres**: un tauler de mètriques (Telemetria, Consola, Gestoria, TPV o Botiga) es construïx amb l'organisme `QuadreDeComandament` de `src/components/PedraSeca/organismes/QuadreDeComandament.jsx` i els estils de `src/css/taulers.css`. Porta capçalera d'estat, targetes KPI baixes amb etiqueta i xifra, l'explicació fora de les caixes amb el cos de paràgraf normal, la gràfica amb el detall per ratolí, tacte i teclat, i el rànquing compacte. Totes les dades li arriben per props.
- **261103** | **Barres de píndoles i grups de botons apilats, sempre centrats**: quan els botons o píndoles d'una barra o d'un panell (`PillToggle`, `.sdp-pindola`, `.sdp-arxiu-local__pindola`, `.sdp-arxiu-local__fila`, «Accés ràpid») van en grup o s'apilen l'un damunt de l'altre segons l'amplada de la pantalla, s'alineen sempre des del centre (`justify-content: center`) perquè mai no pareguen desalineats en cap dispositiu. En columnes estretes (com el peu de la Columna 1, «Volums i carpetes locals»), el botó mostra un verb d'acció concís d'una sola línia («Vincular») i conserva la descripció completa a `aria-label`.
- **261106** | **Botons, pestanyes i barres d'insígnies sota text, SEMPRE alineats al centre (`justify-content: center`) i Barra Taronja INMUTABLE**: Tota fila de botons d'acció, pestanyes de faceta (`.sdp-admin-taxonomia__tabs`), barres d'insígnies (`.sdp-admin-taxonomia__badges`), barres d'eines d'acció i paginació sota qualsevol text o dins d'una targeta ha d'anar **sempre centrada (`justify-content: center`)**; deixar botons arrambats a l'esquerra pareix un error visual. A més, si no hi ha ordre humana explícita en contra, la **Barra Taronja (`bar-orange`)** d'una pàgina o panell de sistema (`DetallEspai.jsx` / `UniversalPage`) és **inmutable**: a l'esquerra porta sempre l'avatar quadrat verd oficial de **Sóc de Poble** (`/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png`), el nom **«Sóc de Poble»** i el poble **«La Torre de les Maçanes»** (`DEFAULT_AUTHOR`), i a la dreta porta obligatòriament la **pastilla estandarditzada de rellotge (hora i data)** (`dataHoraDeBarra`). Prohibit substituir l'avatar per una icona genèrica d'usuari, canviar el poble per textos com «Utilitat d'este node» o ometre el rellotge i la data.
- **261107** | **Llei 1:1 `UniversalPage ↔ UniversalCard` (Títol, Subtítol Taronja i Entradilla idèntics sempre) i Prohibició Absoluta del «M'agrada» (Ací la paraula clau és «CONNECTAR»)**: **(1)** Tota `UniversalCard` (`TargetaDelMur.jsx`, `SincronitzacioTargetes.jsx`, `CosAmbTargetes.jsx`) ha de pintar **sempre i sense excepció** exactament el mateix **Títol (`title`)**, **Subtítol taronja (`subtitle || post_subtitle`)** i **Entradilla (`entradilla || lead`)** que la seua `UniversalPage` principal. Està prohibit inventar frases diferents a `description` que amaguen el subtítol o l'entradilla a la Card. **(2)** A Sóc de Poble **MAI existeix el «m'agrada» (`likes` / `0 m'agrada`)**: la paraula clau del sistema és **«Connectar»**, que ja porten tant la `UniversalPage` com la `UniversalCard`. Queda prohibit injectar píndoles inventades (`.badge-row` amb autor, poble, comentaris `0` o `0 m'agrada`) dins de `detailSectionMeta.jsx` o del cos dels articles; només hi va el botó funcional **`🔊 Escolta la IAIA` (`BotoVeuIaia`)**.
- **261107** | **Pàgines Complexes, Diapositives a Pantalla Completa i Zero Text Perdut entre Scrolls (`P0-37 / IDEA-156`)**: **(1) Prohibició de *Scroll-in-Scroll* i de Text Tallat dins d'`aspect-ratio`:** Està terminantment prohibit tancar text explicatiu dins d'una subcaixa amb alçada fixa (`aspect-ratio: 16/9` o `9/16` combinada amb `overflow: hidden` / `overflow-y: auto`, com passava a `.reproductor-pou__subtitol`) que talle els paràgrafs a mitja frase i convertisca la lectura en mòbil en un martiri de doble scroll. **(2) Diapositives a Amplada Completa / Pantalla Completa + Text Editorial Lliure:** En pàgines complexes amb diapositives o visors 3D (`ReproductorExplicatiuPouNeu3D`, `PouDeLaNeuAnatomiaCard`, `VisorAnatomiaRural3D`), la diapositiva visual ocupa el **100% d'amplària d'escenari** (sense caixes estretes de `22.5rem` o `48rem` que deixen marges buits, i amb opció de **Pantalla Completa**), mentre que **com més text maquetat correctament (`<h3>`, `<p>`, `<ul>`, `<dl>`, negretes d'escaneig), millor**: el text viu sempre amb alçada lliure (`height: auto; overflow: visible;`) fora de qualsevol retall, usant tres patrons CSS simples sense complicar el full d'estils: **Patró 1 (Escenari Complet dalt + Prosa Lliure sota)**, **Patró 2 (Scrollytelling `position: sticky` a l'esquerra en escriptori + columna de text sencera a la dreta que passa a 1 columna en mòbil)** i **Patró 3 (Graella `auto-fit` de Cotes i Fitxes Tècniques)**.

## Vincles
- [[00_INDEX_SKILLS]]
