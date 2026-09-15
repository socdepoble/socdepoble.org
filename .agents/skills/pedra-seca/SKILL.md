---
tipus: skill
estat: canonic
description: Llei de disseny visual Pedra Seca
tags:
  - disseny
name: pedra-seca
triggers_on:
  - disseny
  - css
  - ui
  - pedra
  - seca
  - estil
  - colors
  - components
core: true
---
# 🪨 Llei de Pedra Seca (Design System per a IA)

> [!WARNING]
> **ATENCIÓ A TOTES LES IAs (Qwen, Claude, etc.):** 
> "Pedra Seca" és una denominació exclusivament NOSTRA, interna i propietària. NO és un framework públic (com Bootstrap o Tailwind) ni un concepte de desenvolupament web que trobareu a Internet. **Teniu absolutament prohibit fer recerques a la web (Web Search) sobre "Pedra Seca" o "Llei de Pedra Seca" per intentar esbrinar què és, ja que només vos farà perdre tokens llegint sobre tècniques agràries de construcció de marges.** Tot el que necessiteu saber sobre el nostre Sistema de Disseny (Pedra Seca) està ací mateix i al fitxer de tokens.

Benvingut a "Pedra Seca", l'arquitectura de disseny de la plataforma **Sóc de Poble**. 
Aquest document NO és un llistat de fitxers, sinó un **Contracte de Regles d'Aplicació Estricta**. Qualsevol IA que opere sobre el Frontend o propose dissenys ha d'emmarcar la seua producció lògica DINS de les normes ací exposades, com fan les guies *Polaris (Shopify)* o *Carbon (IBM)*. 

> **L'objectiu final:** Aconseguir consistència visual total de tipus "Aplicació Web (PWA Online-First)" on cada pantalla siga predictible i evitem introduir estils arbitraris que enverinen el sistema.


***

## 1. Topologia Infranquejable (Estructura Física)

L'esquelet de Sóc de Poble és de columnes flexibles tipus Desktop-first / Obsidian. 

*   **Regla Suprema del Scroll:** El `body` o el contenidor root (`.sdp-root`) MAI fan scroll. Tenen `overflow: hidden; overscroll-behavior: none;`.  El scroll es delega ÚNICAMENT a la columna activa (ex: el visor). Amb açò s'elimina el *rubber-band* d'iOS. No intentes modificar el `body` per "solucionar" problemes de desbordament.
*   **3 Columnes Màximes:** 
    1.  **La Roca (Sidebar):** Fons fosc inamovible (blau profund/negre). Identitat visual de l'App.
    2.  **Llista Contextual (opcional):** Llista de selecció (ex. els elements d'un Xat).
    3.  **Visor (Main App):** L'espai on la màgia té lloc, que conté els continguts principals amb un ampli fons clar (tema clar) o fosc absolut.

***

## 2. Llei de les Dues Capes de Tokens

El nostre codi CSS conté desenes de variables. **NO POTS USAR QUALSEVOL**. Existeix un mur de tallafocs entre la capa 1 i 2.

### Capa 1: Els Primitius (PROHIBITS EN COMPONENTS)
Son els materials naturals (to i croma fix). Noms com `--sdp-pedra-900`, `--sdp-primary-500`, `--sdp-secondary-700`.
*   **NORMA:** Un component React o una classe CSS nova **MAI** pot portar escrit `var(--sdp-pedra-...)` o `var(--sdp-primary-...)`. Fer-ho condemna eixe component a no suportar mai el canvi "Dark Mode", trencant l'enxufabilitat.

### Capa 2: Els Semàntics (ÚS OBLIGATORI)
Són la definició intel·lectual i de propòsit d'eixos colors. Estan preparats i mesurats al detall per garantir un *Contrast WCAG (AAA / AA)* tant en clar com fosc. Aquesta és la capa a usar exclusivament:

**Superfícies:**
*   `var(--sdp-fons-app)`: Fons general del visor.
*   `var(--sdp-fons-targeta)`: Per a elements elevats i de lectura (Cards).
*   `var(--sdp-fons-invers)`: Per a espais que mantenen foscor en els dos temes (Sidebar).

**Textos (El ritme):**
*   `var(--sdp-text-titol)`: El text més dominant.
*   `var(--sdp-text-cos)`: El paràgraf narratiu.
*   `var(--sdp-text-suau)`: Dades meta, explicacions passives, lletra petita.

**L'Ànima (La Marca):**
*   **L'ACCENT (Taronja):** Representa "Identitat, Autoritat i Caliu" (ex: `--sdp-accent`, `--sdp-accent-titol`).
*   **L'ACCIÓ (Blau):** Representa "Activitat Humana, Funcionalitat" (ex: `--sdp-accio`, `--sdp-accio-text`). Els botons que l'usuari pot prémer solen anar amb acció.

***

## 3. Ritme Editorial i Regla de Capçaleres

Som una plataforma de lectura de textos extensos de pobles i tradicions, la lectura ha de ser exquisida.

*   **Mesura Màxima (`68ch`):** El text narratiu (p, li, blockquote) del `content-wrapper` o text general d'article MAI passa dels 68 caràcters d'amplada visual (siga quina siga l'amplària del visor) per no cansar els ulls en moure'ls a ordinador.
*   **La Llei de l'Harmonia (H1/H2):** 
    *   L'`<h1>` descansa **exclusivament** dins del marc decoratiu principal del component `<header className="page-title">`. Aquest cap d'H1 pot dur logo o etiqueta.
    *   L'`<h2>` i el seu acompanyant (text `p.lead`) **no van dins del component decoratiu**, sinó al seu propi `div.sdp-text-center` fora de la capçalera (generalment tot just baix), preparant ja la narració del cos. 
    *   **Prohibició de punt i final:** Els Títols (H1) i els Subtítols (H2) **MAI** porten punt i final. Un títol amb punt deixa de ser un títol.

***

## 4. Components Tàctils (La Llei de Vida)

Sóc de Poble naix sent utilitzat per gent de totes les edats al mòbil. Tot ha de ser un goig preme'l.

*   **Àrea d'Interacció Mínima (`var(--sdp-touch)`):** Cap element clicable (botons, enllaços funcionals, icones interactives, checkbox) pot tenir menys d'una dimensió d'àrea d'interacció de `44px` (i recomanada de `48px` via `--sdp-touch-comode`). Aquesta norma de disseny està present a la CSS global i mai pots sobrescriure un component amb p. ex. `height: 24px` per a un botó.

***

## Aplicació de la Norma (Zero Fricció)

**Si has entés aquest manual:** quan hages de construir una targeta, en compte d'aplicar un `background: #fff; color: #333; height: 30px;` aplicaras en la CSS del component JSX:
```css
.card {
   background: var(--sdp-fons-targeta);
   color: var(--sdp-text-cos);
   min-height: var(--sdp-touch); 
}
```
Mai escriuràs pedaços propis sense sentit. D'aquesta manera s'evita la creació de deute tècnic i qualsevol component (Targeta, Botó, Menú) es pot encapsular fàcilment com a *Plugin* (a l'estil d'Obsidian) i inserir en l'esquema global sense trencar-se en l'univers *Sóc de Poble*.

***

## 5. El Model d'Enxufabilitat (Theming & Plugin Architecture)

**Sóc de Poble aspira a la modularitat del Design System d'Obsidian, però de forma molt més neta i amb una corba d'aprenentatge molt baixa.**
L'arquitectura ha estat dissenyada amb tokens dinàmics perquè siga extensible mitjançant la mateixa lògica dels "Temes" de Desktop. 

Qualsevol IA que desenvolupe un "mòdul" o secció de Sóc de Poble aplicarà els següents principis obligatoris (Regles d'Extensibilitat):
1.  **L'Estètica Ve de Fora:** Els mòduls mai decideixen quin aspecte tenen els seus elements bàsics (mai forcen `#222` a un fons o `24px` a una tipografia). Han de *subscriure's* als tokens disponibles (`--sdp-fons-*`, `--sdp-text-*`). Així, el nostre motor pot canviar massivament el tema o els contrastos d'accessibilitat sense alterar cap component en sí.
2.  **L'Espai No Existeix Sense Mesura:** Mai facis "marges solts" com `margin-top: 25px`. Si hi ha ritme, o segueix l'escala de `var(--sdp-space-...)` (0 a 20) o els components editorials de la Capçalera (Llei 3).
3.  **Capsa Autònoma:** Tot nou component es projecta pensant en què podria moure's i ser renderitzat a un altre costat de la pàgina. No dependrà mai que el seu pare específic li de l'amplària o les ombres si no s'ha especificat en l'Ontologia (Llei 1).

***

## 6. Llei de Preservació del Sistema de Disseny (`src/sections/disseny/DesignSection.jsx`)

El fitxer `src/sections/disseny/DesignSection.jsx` actua com el "Storybook" o manual vivent del sistema. La seua integritat és absolutament crítica.

*   **Prohibició de Destrucció:** MAI sobreescriuràs o esborraràs variacions d'un component per substituir-lo per un altre a menys que siga una ordre explícita. Si s'afegeix un nou component o exemple, S'AFEGEIX, no es reemplaça l'anterior.
*   **Targeta Mestra Canònica:** La targeta `20.4 Targeta Mestra: Pàgina de Mur (Disseny)` (amb la imatge de construcció de Pedra Seca) és la base i la referència canònica absoluta per entendre com s'estructura una `UniversalCard`. 
*   **ComponentDoc:** S'usa exclusivament per a emmarcar els blocs mestres d'aprenentatge. En cas de la Targeta Mestra, `20.4` és l'única que ha d'estar dins del `<ComponentDoc>`, mentre que les variacions (20.1, 20.2, etc.) viuen al voltant com a exemples secundaris.
*   **Modificacions Quirúrgiques:** Abans de fer canvis ací, fes un `git show la versió base` (o equivalent) si dubtes, o empra expressions regulars/substitucions de blocs concrets (`multi_replace_file_content`) per no danyar la resta del manual.

***

## 7. Anatomia de la Barra Taronja (Meta i Estats)

La "Barra Taronja" és l'espai de context (autor, ubicació) i meta-dades de les pàgines completes.
* **Botó Data/Hora:** Indica exclusivament la **data de publicació** d'eixe contingut.
* **Icona adjacent (Multiusos):** És un botó versàtil que, per defecte, allotja la icona del **Pin** (per indicar que una pàgina està ancorada a la part superior del Mur), però pot usar-se en futures iteracions per a altres funcions o icones d'alerta (p. ex., en altres tipus de targetes). Si la pàgina és una publicació normal (no ancorada), aquest botó simplement s'ha d'amagar.

***

## 8. Llei de la Veritat Única de les Targetes (Targeta Mestra)

Com a lliçó extreta de l'historial (Tancament Seient 5): S'ha d'evitar absolutament l'ús de components morts, redundants o desfassats com `SectionChrome`. 
*   **La UniversalCard i UniversalPage són la ÚNICA veritat:** Qualsevol nova targeta o vista (ja siga del Mercat, del Mur o de Disseny) ha d'usar aquests components. No es poden crear targetes a mida que es desconnecten de la sincronització de colors, etiquetes i enllaços.
*   **Sincronització Estricta:** Les etiquetes (ex: el blau per a *Mercat*, el taronja per a *Variants*) s'han de parametritzar mitjançant aquests components universals, evitant brossa visual i garantint que l'ecosistema es comporte com un rellotge suís.

***

## 9. Ombres i Radis (Profunditat i Amabilitat)
Tot i que el disseny busca una rigidesa rústica, s'admet la profunditat per donar jerarquia i amabilitat a la interfície.
* **Radis:** Ús exclusiu dels tokens de radi (`--sdp-radi-s`, `--sdp-radi-m`, `--sdp-radi-g`, `--sdp-radi-xl`, `--sdp-radi-pill`). Prohibit usar valors en píxels de forma ad-hoc.
* **Ombres:** S'accepten les ombres per crear jerarquia (barres, targetes). Ús exclusiu dels tokens `--sdp-ombra-1` a `--sdp-ombra-3`. Prohibit l'ús de `box-shadow` ad-hoc o classes tipus Tailwind. Tot ha de dependre del token per adaptar-se al Mode Fosc.

***

## 10. Llei de l'Enquadrament Fotogràfic (Imatges)
Tota imatge sol·licitada, generada o inserida en el codi ha de tindre una proporció estrictament **quadrada (1:1)**, a menys que l'usuari especifique explícitament el contrari. L'arquitectura de Sóc de Poble (targetes, capçaleres, avatars) confia de base en aquest enquadrament 1:1 per garantir l'alineació i simetria visual de l'ecosistema. A efectes pràctics: qualsevol crida a eines com `generate_image` ha d'aplicar per defecte `AspectRatio: '1:1'`.

***

## 11. Llei de Prototipatge Obligatori (Design System First)
Abans de crear o implementar qualsevol nova funcionalitat, component o element visual a l'aplicació, has de fer-te una pregunta vital: **"Existix aquest component al Sistema de Disseny (`src/sections/disseny/DesignSection.jsx`)?"**
- Si **SÍ** existix, l'has d'utilitzar aplicant les classes i estructures canòniques.
- Si **NO** existix, **NO POTS IMPLEMENTAR-LO A CEGUES**. Primer has d'anar al Sistema de Disseny, dissenyar-lo, conceptualitzar-lo amb els *tokens* de Pedra Seca, validar-lo visualment i, només quan estiga afiançat al "Storybook" de la plataforma, el podràs portar i connectar a la secció corresponent de l'aplicació. Queda terminantment prohibit inventar codi CSS o JSX funcional sobre la marxa sense que el seu patró existisca prèviament al catàleg de disseny.

### Lògica de la Sidebar Inmutable
1. **Fons Negre Inmutable**: La Sidebar (`nav.app-sidebar`) i la Topbar (`header.bar-black`) són **sempre de fons negre inmutable**. Els seus colors no s'inverteixen en mode clar/fosc. Han d'utilitzar sempre les variables directes (`--sdp-pedra-900` per fons, `--sdp-pedra-50` per text), evitant usar tokens invertibles com `--sdp-fons-invers`.
2. **Pàgines de Sistema al Menú**: Qualsevol pàgina o component que siga marcat amb la categoria "sistema" s'inclourà automàticament dins de la sidebar com un element més del menú. Això permet que el menú cresca de forma dinàmica basant-se en metadades de la pàgina en lloc de rutes *hardcoded*.


## Ancoratge de la Wiki
- Aquesta skill penja de: [[00_INDEX_SKILLS]]
